//! PyO3 bindings for the headless Haxball core.
//!
//! Two surfaces:
//!   1. `VecEnv` — a *batched* environment: N independent matches stepped in
//!      parallel with rayon (no GIL held during the sim). The Python<->Rust
//!      boundary is crossed ONCE per batch, not once per game step. This is how
//!      RocketSim/RLGym reach 100k+ SPS.
//!   2. Free functions mirroring `fn_base.py` so `tests/test_fidelity.py` can
//!      prove the Rust port matches the original numpy bit-for-bit.

use numpy::ndarray::{Array2, Array3};
use numpy::{
    IntoPyArray, PyArray1, PyArray2, PyArray3, PyReadonlyArray1, PyReadonlyArray2, PyReadonlyArray3,
};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use rayon::prelude::*;

mod physics;
mod stadium;
use physics::{flag, World};

#[pyclass]
struct VecEnv {
    worlds: Vec<World>,
    n_players: usize,
    obs_dim: usize,
    #[allow(dead_code)]
    // accepted for API parity; episode truncation lives in the Python env layer
    step_limit: u64,
    tick_skip: u64,
}

impl VecEnv {
    // physics_step / rollout_bench stack-allocate a fixed [[i64; 3]; 32] action buffer per env,
    // so the player count is bounded. (32 is far above any real Haxball match.)
    const MAX_PLAYERS: usize = 32;

    fn compute_obs_dim(n_players: usize) -> usize {
        // self_pos2, self_vel2, ball_rel2, ball_vel2, target_goal_rel2,
        // own_goal_rel2  (=12) + per other player (rel_pos2, vel2)
        12 + 4 * (n_players - 1)
    }

    fn check_dims(n_envs: usize, n_red: usize, n_blue: usize) -> PyResult<()> {
        if n_envs == 0 {
            // an empty batch leaves `worlds` empty, then every getter (teams/goals/walls/...)
            // indexes worlds[0] and panics across the FFI boundary — reject it up front.
            return Err(PyValueError::new_err("n_envs must be >= 1"));
        }
        let n = n_red + n_blue;
        if n == 0 {
            return Err(PyValueError::new_err("n_red + n_blue must be >= 1"));
        }
        if n > Self::MAX_PLAYERS {
            return Err(PyValueError::new_err(format!(
                "n_red + n_blue = {} exceeds the max of {} players",
                n,
                Self::MAX_PLAYERS
            )));
        }
        Ok(())
    }
}

#[pymethods]
impl VecEnv {
    #[new]
    #[pyo3(signature = (n_envs, n_red, n_blue, step_limit=2400, tick_skip=8))]
    fn new(
        n_envs: usize,
        n_red: usize,
        n_blue: usize,
        step_limit: u64,
        tick_skip: u64,
    ) -> PyResult<Self> {
        Self::check_dims(n_envs, n_red, n_blue)?;
        let worlds = (0..n_envs).map(|_| World::classic(n_red, n_blue)).collect();
        let n_players = n_red + n_blue;
        Ok(VecEnv {
            worlds,
            n_players,
            obs_dim: Self::compute_obs_dim(n_players),
            step_limit,
            tick_skip: tick_skip.max(1),
        })
    }

    /// Build a batch from a Haxball `.hbs` stadium (plain JSON text). Geometry,
    /// goals, spawns, and ball/player physics all come from the map — including
    /// curved wall segments (rounded corners, goal nets), so any map is faithful.
    #[staticmethod]
    #[pyo3(signature = (hbs, n_envs, n_red, n_blue, step_limit=2400, tick_skip=8))]
    fn from_hbs(
        hbs: &str,
        n_envs: usize,
        n_red: usize,
        n_blue: usize,
        step_limit: u64,
        tick_skip: u64,
    ) -> PyResult<Self> {
        Self::check_dims(n_envs, n_red, n_blue)?;
        let (world, _skipped) =
            stadium::world_from_hbs(hbs, n_red, n_blue).map_err(PyValueError::new_err)?;
        let n_players = n_red + n_blue;
        let worlds = (0..n_envs).map(|_| world.clone()).collect();
        Ok(VecEnv {
            worlds,
            n_players,
            obs_dim: Self::compute_obs_dim(n_players),
            step_limit,
            tick_skip: tick_skip.max(1),
        })
    }

    #[getter]
    fn n_envs(&self) -> usize {
        self.worlds.len()
    }
    #[getter]
    fn n_players(&self) -> usize {
        self.n_players
    }
    #[getter]
    fn obs_dim(&self) -> usize {
        self.obs_dim
    }

    // =======================================================================
    // RLGym-v2 engine surface: physics + batched state only. No obs/reward/done
    // (those live in the composable Python layer). See docs/design-docs/env-api.md.
    // =======================================================================

    /// Reset every env: positions, scores, step counter. A fresh game -> RED kicks off.
    fn reset_all(&mut self) {
        for w in self.worlds.iter_mut() {
            w.reset_positions();
            w.red_score = 0;
            w.blue_score = 0;
            w.steps = 0;
            w.kicking_team = flag::RED;
        }
    }

    /// Reset only the envs whose mask entry is true (gym-style auto-reset).
    fn reset_mask(&mut self, mask: PyReadonlyArray1<bool>) -> PyResult<()> {
        let m = mask.as_array();
        if m.len() != self.worlds.len() {
            return Err(PyValueError::new_err(format!(
                "reset_mask: mask length {} != n_envs {}",
                m.len(),
                self.worlds.len()
            )));
        }
        self.worlds.par_iter_mut().enumerate().for_each(|(i, w)| {
            if m[i] {
                w.reset_positions();
                w.red_score = 0;
                w.blue_score = 0;
                w.steps = 0;
                w.kicking_team = flag::RED;
            }
        });
        Ok(())
    }

    /// Advance all envs by `tick_skip` physics ticks using already-parsed engine
    /// actions `(N, P, 3)` = (dx, dy, kick). No reward, no obs, no auto-reset.
    /// Returns `scored` `(N,)` i8: -1 if no goal this step, else the conceding team.
    fn physics_step<'py>(
        &mut self,
        py: Python<'py>,
        actions: PyReadonlyArray3<i64>,
    ) -> PyResult<Bound<'py, PyArray1<i8>>> {
        let acts = actions.as_array();
        let n = self.worlds.len();
        let np = self.n_players;
        let s = acts.shape();
        if s != [n, np, 3] {
            return Err(PyValueError::new_err(format!(
                "physics_step: actions shape {:?} != expected (n_envs={}, n_players={}, 3)",
                s, n, np
            )));
        }
        let n_players = self.n_players;
        let tick_skip = self.tick_skip;
        let mut scored = vec![-1i8; self.worlds.len()];
        self.worlds
            .par_iter_mut()
            .zip(scored.par_iter_mut())
            .enumerate()
            .for_each(|(env_i, (w, sc))| {
                let mut a = [[0i64; 3]; 32];
                for k in 0..n_players {
                    a[k] = [
                        acts[[env_i, k, 0]],
                        acts[[env_i, k, 1]],
                        acts[[env_i, k, 2]],
                    ];
                }
                for _ in 0..tick_skip {
                    if let Some(team) = w.step(&a[..n_players]) {
                        *sc = team as i8;
                        break;
                    }
                }
            });
        Ok(PyArray1::from_vec_bound(py, scored))
    }

    /// Read the current batched state without stepping. Returns
    /// `(ball_pos (N,2), ball_vel (N,2), player_pos (N,P,2), player_vel (N,P,2), steps (N,))`.
    fn snapshot<'py>(
        &self,
        py: Python<'py>,
    ) -> (
        Bound<'py, PyArray2<f64>>,
        Bound<'py, PyArray2<f64>>,
        Bound<'py, PyArray3<f64>>,
        Bound<'py, PyArray3<f64>>,
        Bound<'py, PyArray1<i64>>,
    ) {
        let n = self.worlds.len();
        let np = self.n_players;
        let mut bpos = vec![0.0f64; n * 2];
        let mut bvel = vec![0.0f64; n * 2];
        let mut ppos = vec![0.0f64; n * np * 2];
        let mut pvel = vec![0.0f64; n * np * 2];
        let mut steps = vec![0i64; n];
        for (ei, w) in self.worlds.iter().enumerate() {
            let b = &w.discs[0];
            bpos[ei * 2] = b.pos[0];
            bpos[ei * 2 + 1] = b.pos[1];
            bvel[ei * 2] = b.vel[0];
            bvel[ei * 2 + 1] = b.vel[1];
            steps[ei] = w.steps as i64;
            for k in 0..np {
                let p = &w.discs[w.first_player + k];
                let o = (ei * np + k) * 2;
                ppos[o] = p.pos[0];
                ppos[o + 1] = p.pos[1];
                pvel[o] = p.vel[0];
                pvel[o + 1] = p.vel[1];
            }
        }
        (
            Array2::from_shape_vec((n, 2), bpos)
                .unwrap()
                .into_pyarray_bound(py),
            Array2::from_shape_vec((n, 2), bvel)
                .unwrap()
                .into_pyarray_bound(py),
            Array3::from_shape_vec((n, np, 2), ppos)
                .unwrap()
                .into_pyarray_bound(py),
            Array3::from_shape_vec((n, np, 2), pvel)
                .unwrap()
                .into_pyarray_bound(py),
            PyArray1::from_vec_bound(py, steps),
        )
    }

    /// Place an arbitrary state into every env: the exact inverse of `snapshot`.
    /// Writes ball + player positions/velocities from `(N,2)`/`(N,P,2)` arrays; the
    /// step counter is set from `steps` (or reset to 0). Scores are left untouched
    /// (they're not part of the observed state). This is the engine primitive behind
    /// arbitrary `StateMutator`s — random kickoffs, scenario drills, replay states —
    /// so episodes no longer have to begin from the fixed kickoff.
    #[pyo3(signature = (ball_pos, ball_vel, player_pos, player_vel, steps=None))]
    fn set_state(
        &mut self,
        ball_pos: PyReadonlyArray2<f64>,
        ball_vel: PyReadonlyArray2<f64>,
        player_pos: PyReadonlyArray3<f64>,
        player_vel: PyReadonlyArray3<f64>,
        steps: Option<PyReadonlyArray1<i64>>,
    ) -> PyResult<()> {
        let bpos = ball_pos.as_array();
        let bvel = ball_vel.as_array();
        let ppos = player_pos.as_array();
        let pvel = player_vel.as_array();
        let n = self.worlds.len();
        let np = self.n_players;
        if bpos.shape() != [n, 2] || bvel.shape() != [n, 2] {
            return Err(PyValueError::new_err(format!(
                "set_state: ball_pos {:?} / ball_vel {:?} must both be (n_envs={}, 2)",
                bpos.shape(),
                bvel.shape(),
                n
            )));
        }
        if ppos.shape() != [n, np, 2] || pvel.shape() != [n, np, 2] {
            return Err(PyValueError::new_err(format!(
                "set_state: player_pos {:?} / player_vel {:?} must both be (n_envs={}, n_players={}, 2)",
                ppos.shape(),
                pvel.shape(),
                n,
                np
            )));
        }
        if let Some(s) = &steps {
            if s.as_array().len() != n {
                return Err(PyValueError::new_err(format!(
                    "set_state: steps length {} != n_envs {}",
                    s.as_array().len(),
                    n
                )));
            }
        }
        let steps = steps.map(|s| s.as_array().to_owned());
        for (ei, w) in self.worlds.iter_mut().enumerate() {
            let b = &mut w.discs[0];
            b.pos = [bpos[[ei, 0]], bpos[[ei, 1]]];
            b.vel = [bvel[[ei, 0]], bvel[[ei, 1]]];
            for k in 0..np {
                let p = &mut w.discs[w.first_player + k];
                p.pos = [ppos[[ei, k, 0]], ppos[[ei, k, 1]]];
                p.vel = [pvel[[ei, k, 0]], pvel[[ei, k, 1]]];
                // a state-set (kickoff/reset) starts fresh — clear the kick state machine,
                // else residual flag/cooldown/burst from before the goal perturbs the kickoff.
                w.kick_flag[k] = false;
                w.kick_held_prev[k] = false;
                w.kick_cooldown[k] = 0;
                w.kick_burst[k] = 0;
            }
            w.steps = steps.as_ref().map_or(0, |s| s[ei] as u64);
            // An explicit state is an arbitrary mid-play position (random spawns, scenario
            // drills, a seeded replay frame) — NOT a kickoff, so no centre-circle lock.
            w.state = physics::STATE_PLAYING;
        }
        Ok(())
    }

    /// Set the kickRateLimit (min, rate-cost, burst-cap) for every env. Mirrors a
    /// Haxball room's `setKickRateLimit`; needed to re-simulate replays from rooms that
    /// changed it (e.g. the DNA ladder uses min=6). Default is min=2.
    fn set_kick_rate_limit(&mut self, min: i64, cost: i64, cap: i64) {
        for w in self.worlds.iter_mut() {
            w.kick_rate_min = min;
            w.kick_rate_cost = cost;
            w.kick_rate_cap = cap;
        }
    }

    /// Set every player disc's collision mask (cMask). Used to enable/disable the kickoff
    /// barrier: during a kickoff the non-kicking team is held behind the centre semicircle
    /// by collision flags (cMask `39 | <kicking team's KO group>`); after the ball is
    /// touched it reverts to the normal `39`. Re-sim only — training kicks off via the env.
    fn set_player_cmask(&mut self, mask: i64) {
        for w in self.worlds.iter_mut() {
            for k in 0..w.n_players {
                w.discs[w.first_player + k].cmask = mask;
            }
        }
    }

    /// Debug: per-player kick state `(flag, cooldown)` for env 0 — `(P,)` each.
    fn kick_state<'py>(
        &self,
        py: Python<'py>,
    ) -> (Bound<'py, PyArray1<i64>>, Bound<'py, PyArray1<i64>>) {
        let w = &self.worlds[0];
        let flag: Vec<i64> = w.kick_flag.iter().map(|&b| b as i64).collect();
        (
            PyArray1::from_vec_bound(py, flag),
            PyArray1::from_vec_bound(py, w.kick_cooldown.clone()),
        )
    }

    /// Static team flag per player slot, `(N, P)` i64 (RED/BLUE).
    fn teams<'py>(&self, py: Python<'py>) -> Bound<'py, PyArray2<i64>> {
        let n = self.worlds.len();
        let np = self.n_players;
        let mut t = vec![0i64; n * np];
        for (ei, w) in self.worlds.iter().enumerate() {
            for k in 0..np {
                t[ei * np + k] = w.discs[w.first_player + k].team;
            }
        }
        Array2::from_shape_vec((n, np), t)
            .unwrap()
            .into_pyarray_bound(py)
    }

    /// Player max speed used to normalize velocity rewards: accel*damping/(1-accel).
    #[getter]
    fn player_max_speed(&self) -> f64 {
        let p = &self.worlds[0].discs[self.worlds[0].first_player];
        p.accel * p.damping / (1.0 - p.accel)
    }

    /// The stadium's goal lines (same for every env). Returns
    /// `(p0 (G,2), p1 (G,2), team (G,))` where `team` is the side that DEFENDS /
    /// concedes at that goal. Geometry comes from the stadium, not hardcoded — so
    /// obs/reward target the real goal mouth on any map.
    fn goals<'py>(
        &self,
        py: Python<'py>,
    ) -> (
        Bound<'py, PyArray2<f64>>,
        Bound<'py, PyArray2<f64>>,
        Bound<'py, PyArray1<i64>>,
    ) {
        let goals = &self.worlds[0].goals;
        let g = goals.len();
        let mut p0 = vec![0.0f64; g * 2];
        let mut p1 = vec![0.0f64; g * 2];
        let mut team = vec![0i64; g];
        for (i, go) in goals.iter().enumerate() {
            p0[i * 2] = go.p0[0];
            p0[i * 2 + 1] = go.p0[1];
            p1[i * 2] = go.p1[0];
            p1[i * 2 + 1] = go.p1[1];
            team[i] = go.team;
        }
        (
            Array2::from_shape_vec((g, 2), p0)
                .unwrap()
                .into_pyarray_bound(py),
            Array2::from_shape_vec((g, 2), p1)
                .unwrap()
                .into_pyarray_bound(py),
            PyArray1::from_vec_bound(py, team),
        )
    }

    /// Ball-colliding WALLS as straight line segments `[x0,y0,x1,y1]`, shape (M, 4): each
    /// straight segment the ball hits, plus every ball-colliding boundary PLANE rendered as a
    /// long segment. Curved segments are omitted HERE only (this obs helper raycasts straight
    /// lines) — the physics DOES resolve them. Static per stadium; lets a map-agnostic obs
    /// raycast the REAL geometry on ANY map (so the bot can read rebounds / pin for rockets).
    fn wall_segments<'py>(&self, py: Python<'py>) -> Bound<'py, PyArray2<f64>> {
        let w = &self.worlds[0];
        let mut segs: Vec<f64> = Vec::new();
        let mut m = 0usize;
        for s in &w.segments {
            if s.curve == 0.0 && (s.cmask & flag::BALL) != 0 {
                segs.extend_from_slice(&[s.v0[0], s.v0[1], s.v1[0], s.v1[1]]);
                m += 1;
            }
        }
        for p in &w.planes {
            if (p.cmask & flag::BALL) != 0 {
                let c = [p.normal[0] * p.dist, p.normal[1] * p.dist]; // a point on the plane
                let t = [-p.normal[1], p.normal[0]]; // direction along the plane
                let l = 3000.0;
                segs.extend_from_slice(&[
                    c[0] - t[0] * l,
                    c[1] - t[1] * l,
                    c[0] + t[0] * l,
                    c[1] + t[1] * l,
                ]);
                m += 1;
            }
        }
        Array2::from_shape_vec((m, 4), segs)
            .unwrap()
            .into_pyarray_bound(py)
    }

    /// Static OBSTACLE discs as `[x, y, radius]`, shape (D, 3) — the goal POSTS (and any other
    /// fixed discs the ball collides with). The ball/players bounce off these, so an obs that
    /// can't see them lets the bot get blocked by a post while chasing. Static per stadium;
    /// the ball/players themselves are dynamic and already in the obs, so they're excluded.
    fn obstacle_discs<'py>(&self, py: Python<'py>) -> Bound<'py, PyArray2<f64>> {
        let w = &self.worlds[0];
        let mut out: Vec<f64> = Vec::new();
        let mut m = 0usize;
        // keep only discs that actually collide with the ball OR a player (a post that blocks
        // movement); skip cosmetic / non-colliding discs. (= collides with anything but pure WALL)
        let movers = flag::BALL | flag::RED | flag::BLUE | flag::REDKO | flag::BLUEKO;
        for d in &w.discs[1..w.first_player] {
            // discs[0]=ball, discs[1..first_player]=static posts (players come after)
            if (d.cmask & movers) != 0 {
                out.extend_from_slice(&[d.pos[0], d.pos[1], d.radius]);
                m += 1;
            }
        }
        Array2::from_shape_vec((m, 3), out)
            .unwrap()
            .into_pyarray_bound(py)
    }

    /// Deterministic ball-trajectory prediction (players ignored): future ball positions at
    /// the given ascending tick `offsets`, shape `(N, K, 2)`. Lets a map-agnostic obs feed the
    /// policy "where the ball will be" — lookahead a tiny memoryless net can't learn implicitly,
    /// and exactly what's needed to read wall/corner rebounds. Exact until a player touches it.
    fn predict_ball<'py>(&self, py: Python<'py>, offsets: Vec<u64>) -> Bound<'py, PyArray3<f64>> {
        let n = self.worlds.len();
        let k = offsets.len();
        let preds: Vec<Vec<[f64; 2]>> = self
            .worlds
            .par_iter()
            .map(|w| w.predict_ball(&offsets))
            .collect();
        let mut out = vec![0.0f64; n * k * 2];
        for (ei, p) in preds.iter().enumerate() {
            for (ki, pos) in p.iter().enumerate() {
                out[(ei * k + ki) * 2] = pos[0];
                out[(ei * k + ki) * 2 + 1] = pos[1];
            }
        }
        Array3::from_shape_vec((n, k, 2), out)
            .unwrap()
            .into_pyarray_bound(py)
    }

    /// Pure-Rust benchmark: run `n_steps` ticks, no Python in the loop.
    fn rollout_bench(&mut self, py: Python<'_>, n_steps: u64) -> u64 {
        let n_players = self.n_players;
        py.allow_threads(|| {
            self.worlds.par_iter_mut().for_each(|w| {
                let mut a = [[1i64, 1, 1]; 32];
                for _ in 0..n_steps {
                    let _ = w.step(&a[..n_players]);
                    a[0][2] ^= 1;
                }
            });
            (self.worlds.len() as u64) * n_steps
        })
    }
}

// ===========================================================================
// fn_base.py mirrors — used only by the fidelity test.
// ===========================================================================
type V = (f64, f64);

#[pyfunction]
#[allow(clippy::too_many_arguments)]
fn disc_disc(
    pa: V,
    pb: V,
    va: V,
    vb: V,
    ra: f64,
    rb: f64,
    ima: f64,
    imb: f64,
    ba: f64,
    bb: f64,
) -> (V, V, V, V) {
    let (pa, pb, va, vb) = physics::disc_disc(
        [pa.0, pa.1],
        [pb.0, pb.1],
        [va.0, va.1],
        [vb.0, vb.1],
        ra,
        rb,
        ima,
        imb,
        ba,
        bb,
    );
    (
        (pa[0], pa[1]),
        (pb[0], pb[1]),
        (va[0], va[1]),
        (vb[0], vb[1]),
    )
}

#[pyfunction]
fn disc_vertex(pd: V, pv: V, v: V, radius: f64, bd: f64, bv: f64) -> (V, V) {
    let (pd, v) = physics::disc_vertex([pd.0, pd.1], [pv.0, pv.1], [v.0, v.1], radius, bd, bv);
    ((pd[0], pd[1]), (v[0], v[1]))
}

#[pyfunction]
fn segment_no_curve(pd: V, v0: V, v1: V) -> Option<(f64, V)> {
    physics::segment_no_curve([pd.0, pd.1], [v0.0, v0.1], [v1.0, v1.1])
        .map(|(d, n)| (d, (n[0], n[1])))
}

#[pyfunction]
fn segment_curve(pd: V, c: V, cr: f64, t0: V, t1: V, curve: f64) -> Option<(f64, V)> {
    physics::segment_curve(
        [pd.0, pd.1],
        [c.0, c.1],
        cr,
        [t0.0, t0.1],
        [t1.0, t1.1],
        curve,
    )
    .map(|(d, n)| (d, (n[0], n[1])))
}

#[pyfunction]
fn disc_plane(pd: V, normal: V, v: V, dist: f64, radius: f64, bd: f64, bp: f64) -> (V, V) {
    let (pd, v) = physics::disc_plane(
        [pd.0, pd.1],
        [normal.0, normal.1],
        [v.0, v.1],
        dist,
        radius,
        bd,
        bp,
    );
    ((pd[0], pd[1]), (v[0], v[1]))
}

#[pymodule]
fn haxball_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<VecEnv>()?;
    m.add_function(wrap_pyfunction!(disc_disc, m)?)?;
    m.add_function(wrap_pyfunction!(disc_vertex, m)?)?;
    m.add_function(wrap_pyfunction!(segment_no_curve, m)?)?;
    m.add_function(wrap_pyfunction!(segment_curve, m)?)?;
    m.add_function(wrap_pyfunction!(disc_plane, m)?)?;
    m.add("FLAG_RED", flag::RED)?;
    m.add("FLAG_BLUE", flag::BLUE)?;
    Ok(())
}
