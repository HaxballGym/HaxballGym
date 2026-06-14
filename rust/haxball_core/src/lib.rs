//! PyO3 bindings for the headless Haxball core.
//!
//! Two surfaces:
//!   1. `VecEnv` — a *batched* environment: N independent matches stepped in
//!      parallel with rayon (no GIL held during the sim). This is the whole
//!      point — the Python<->Rust boundary is crossed ONCE per batch, not once
//!      per game, which is how RocketSim/RLGym reach 100k+ SPS.
//!   2. Free functions mirroring `fn_base.py` so `tests/test_fidelity.py` can
//!      prove the Rust port matches the original numpy bit-for-bit.

use numpy::ndarray::Array3;
use numpy::{IntoPyArray, PyArray1, PyArray2, PyArray3, PyReadonlyArray3};
use pyo3::prelude::*;
use rayon::prelude::*;

mod physics;
use physics::{flag, World};

const OBS_DIM: usize = 10; // [self_pos2, self_vel2, ball_pos2, ball_vel2, ball_rel2]

#[pyclass]
struct VecEnv {
    worlds: Vec<World>,
    n_players: usize,
    n_red: usize,
    n_blue: usize,
    step_limit: u64,
}

#[pymethods]
impl VecEnv {
    #[new]
    #[pyo3(signature = (n_envs, n_red, n_blue, step_limit=3000))]
    fn new(n_envs: usize, n_red: usize, n_blue: usize, step_limit: u64) -> Self {
        let worlds = (0..n_envs).map(|_| World::classic(n_red, n_blue)).collect();
        VecEnv {
            worlds,
            n_players: n_red + n_blue,
            n_red,
            n_blue,
            step_limit,
        }
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
        OBS_DIM
    }

    /// Reset every match. Returns obs (n_envs, n_players, OBS_DIM) f32.
    fn reset<'py>(&mut self, py: Python<'py>) -> Bound<'py, PyArray3<f32>> {
        for w in self.worlds.iter_mut() {
            w.reset_positions();
            w.red_score = 0;
            w.blue_score = 0;
            w.steps = 0;
        }
        self.build_obs(py)
    }

    /// Step all matches. `actions`: (n_envs, n_players, 3) int64 = (dx, dy, kick).
    /// Returns (obs, rewards (n_envs, n_players) f32, dones (n_envs,) u8).
    fn step<'py>(
        &mut self,
        py: Python<'py>,
        actions: PyReadonlyArray3<i64>,
    ) -> PyResult<(
        Bound<'py, PyArray3<f32>>,
        Bound<'py, PyArray2<f32>>,
        Bound<'py, PyArray1<u8>>,
    )> {
        let acts = actions.as_array();
        let n_players = self.n_players;
        let step_limit = self.step_limit;

        // Per-env reward buffer, filled in parallel.
        let mut rewards = vec![0.0f32; self.worlds.len() * n_players];
        let mut dones = vec![0u8; self.worlds.len()];

        self.worlds
            .par_iter_mut()
            .zip(rewards.par_chunks_mut(n_players))
            .zip(dones.par_iter_mut())
            .enumerate()
            .for_each(|(env_i, ((w, rew), done))| {
                // gather this env's actions
                let mut a = [[0i64; 3]; 32]; // supports up to 32 players/env
                for k in 0..n_players {
                    a[k] = [acts[[env_i, k, 0]], acts[[env_i, k, 1]], acts[[env_i, k, 2]]];
                }
                let scored = w.step(&a[..n_players]);

                if let Some(team) = scored {
                    // +1 for the scoring team's players, -1 for the conceding team.
                    for k in 0..n_players {
                        let pteam = w.discs[w.first_player + k].team;
                        // `team` is the team that CONCEDED.
                        rew[k] = if pteam == team { -1.0 } else { 1.0 };
                    }
                    *done = 1;
                } else if w.steps >= step_limit {
                    *done = 1;
                }

                if *done == 1 {
                    w.reset_positions();
                    w.steps = 0;
                }
            });

        let obs = self.build_obs(py);
        let rew_arr = Array3::from_shape_vec((self.worlds.len(), n_players, 1), rewards)
            .unwrap()
            .into_shape((self.worlds.len(), n_players))
            .unwrap();
        let rew_py = rew_arr.into_pyarray_bound(py);
        let done_py = PyArray1::from_vec_bound(py, dones);
        Ok((obs, rew_py, done_py))
    }

    /// Pure-Rust benchmark: run `n_steps` ticks with the given constant action
    /// on every agent, no Python in the loop. Returns total agent-steps done.
    /// Use to measure raw SPS without marshalling overhead.
    fn rollout_bench(&mut self, py: Python<'_>, n_steps: u64) -> u64 {
        let n_players = self.n_players;
        py.allow_threads(|| {
            self.worlds.par_iter_mut().for_each(|w| {
                // simple deterministic "chase the ball + kick" so collisions fire
                let mut a = [[1i64, 1, 1]; 32];
                for _ in 0..n_steps {
                    let _ = w.step(&a[..n_players]);
                    a[0][2] ^= 1; // toggle kick to exercise both branches
                }
            });
            (self.worlds.len() as u64) * n_steps
        })
    }

    fn build_obs<'py>(&self, py: Python<'py>) -> Bound<'py, PyArray3<f32>> {
        let n = self.worlds.len();
        let np = self.n_players;
        let mut buf = vec![0.0f32; n * np * OBS_DIM];
        // normalization scales (field is ~±420 x ±200)
        const PX: f32 = 1.0 / 420.0;
        const PY: f32 = 1.0 / 200.0;
        const VS: f32 = 1.0 / 10.0;
        for (ei, w) in self.worlds.iter().enumerate() {
            let ball = &w.discs[0];
            for k in 0..np {
                let p = &w.discs[w.first_player + k];
                let o = (ei * np + k) * OBS_DIM;
                buf[o] = p.pos[0] as f32 * PX;
                buf[o + 1] = p.pos[1] as f32 * PY;
                buf[o + 2] = p.vel[0] as f32 * VS;
                buf[o + 3] = p.vel[1] as f32 * VS;
                buf[o + 4] = ball.pos[0] as f32 * PX;
                buf[o + 5] = ball.pos[1] as f32 * PY;
                buf[o + 6] = ball.vel[0] as f32 * VS;
                buf[o + 7] = ball.vel[1] as f32 * VS;
                buf[o + 8] = (ball.pos[0] - p.pos[0]) as f32 * PX;
                buf[o + 9] = (ball.pos[1] - p.pos[1]) as f32 * PY;
            }
        }
        Array3::from_shape_vec((n, np, OBS_DIM), buf)
            .unwrap()
            .into_pyarray_bound(py)
    }

    /// Inspect raw state of one env: returns (ball_pos, ball_vel, [player_pos...]).
    fn ball_state(&self, env_i: usize) -> (f64, f64, f64, f64) {
        let b = &self.worlds[env_i].discs[0];
        (b.pos[0], b.pos[1], b.vel[0], b.vel[1])
    }
    fn scores(&self, env_i: usize) -> (u32, u32) {
        (self.worlds[env_i].red_score, self.worlds[env_i].blue_score)
    }
}

// ===========================================================================
// fn_base.py mirrors — used only by the fidelity test.
// ===========================================================================

type V = (f64, f64);

#[pyfunction]
#[allow(clippy::too_many_arguments)]
fn disc_disc(pa: V, pb: V, va: V, vb: V, ra: f64, rb: f64, ima: f64, imb: f64, ba: f64, bb: f64) -> (V, V, V, V) {
    let (pa, pb, va, vb) = physics::disc_disc(
        [pa.0, pa.1], [pb.0, pb.1], [va.0, va.1], [vb.0, vb.1], ra, rb, ima, imb, ba, bb,
    );
    ((pa[0], pa[1]), (pb[0], pb[1]), (va[0], va[1]), (vb[0], vb[1]))
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
    physics::segment_curve([pd.0, pd.1], [c.0, c.1], cr, [t0.0, t0.1], [t1.0, t1.1], curve)
        .map(|(d, n)| (d, (n[0], n[1])))
}

#[pyfunction]
fn disc_plane(pd: V, normal: V, v: V, dist: f64, radius: f64, bd: f64, bp: f64) -> (V, V) {
    let (pd, v) = physics::disc_plane([pd.0, pd.1], [normal.0, normal.1], [v.0, v.1], dist, radius, bd, bp);
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
