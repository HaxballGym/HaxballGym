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
use numpy::{IntoPyArray, PyArray1, PyArray2, PyArray3, PyReadonlyArray1, PyReadonlyArray3};
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
    fn compute_obs_dim(n_players: usize) -> usize {
        // self_pos2, self_vel2, ball_rel2, ball_vel2, target_goal_rel2,
        // own_goal_rel2  (=12) + per other player (rel_pos2, vel2)
        12 + 4 * (n_players - 1)
    }
}

#[pymethods]
impl VecEnv {
    #[new]
    #[pyo3(signature = (n_envs, n_red, n_blue, step_limit=2400, tick_skip=8))]
    fn new(n_envs: usize, n_red: usize, n_blue: usize, step_limit: u64, tick_skip: u64) -> Self {
        let worlds = (0..n_envs).map(|_| World::classic(n_red, n_blue)).collect();
        let n_players = n_red + n_blue;
        VecEnv {
            worlds,
            n_players,
            obs_dim: Self::compute_obs_dim(n_players),
            step_limit,
            tick_skip: tick_skip.max(1),
        }
    }

    /// Build a batch from a Haxball `.hbs` stadium (plain JSON text). Geometry,
    /// goals, spawns, and ball/player physics all come from the map. Curved
    /// segments are skipped for now (logged to stderr).
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

    /// Reset every env: positions, scores, step counter.
    fn reset_all(&mut self) {
        for w in self.worlds.iter_mut() {
            w.reset_positions();
            w.red_score = 0;
            w.blue_score = 0;
            w.steps = 0;
        }
    }

    /// Reset only the envs whose mask entry is true (gym-style auto-reset).
    fn reset_mask(&mut self, mask: PyReadonlyArray1<bool>) {
        let m = mask.as_array();
        self.worlds.par_iter_mut().enumerate().for_each(|(i, w)| {
            if m[i] {
                w.reset_positions();
                w.red_score = 0;
                w.blue_score = 0;
                w.steps = 0;
            }
        });
    }

    /// Advance all envs by `tick_skip` physics ticks using already-parsed engine
    /// actions `(N, P, 3)` = (dx, dy, kick). No reward, no obs, no auto-reset.
    /// Returns `scored` `(N,)` i8: -1 if no goal this step, else the conceding team.
    fn physics_step<'py>(
        &mut self,
        py: Python<'py>,
        actions: PyReadonlyArray3<i64>,
    ) -> Bound<'py, PyArray1<i8>> {
        let acts = actions.as_array();
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
        PyArray1::from_vec_bound(py, scored)
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
