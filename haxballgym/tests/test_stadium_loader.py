"""The .hbs loader: geometry/physics come from the map, and loading the classic
stadium reproduces the engine's built-in classic bit-for-bit. Run:
`uv run haxballgym/tests/test_stadium_loader.py`.
"""

import haxball_core as hc
import numpy as np

from haxballgym import make_default_env, stadium_text


def pms(accel, damp):
    return accel * damp / (1 - accel)


def test_geometry_from_map():
    for name, gx, exp_pms in [
        ("classic", 370.0, pms(0.10, 0.96)),
        ("futsal-classic", 408.3, pms(0.11, 0.96)),
    ]:
        e = hc.VecEnv.from_hbs(stadium_text(name), 2, 1, 1)
        p0, _, _ = e.goals()
        gxs = sorted({abs(p0[i][0]) for i in range(p0.shape[0])})
        assert abs(gxs[0] - gx) < 1e-3, f"{name}: goal x {gxs} != {gx}"
        assert abs(e.player_max_speed - exp_pms) < 1e-4, f"{name}: player_max_speed"
        print(f"{name:15s} goal_x=±{gxs[0]:.1f}  player_max_speed={e.player_max_speed:.4f}  OK")


def test_classic_loaded_matches_builtin():
    N, SL, TS = 32, 10**9, 8
    rng = np.random.default_rng(1)
    a = hc.VecEnv(N, 1, 1, step_limit=SL, tick_skip=TS)
    a.reset_all()
    b = hc.VecEnv.from_hbs(stadium_text("classic"), N, 1, 1, step_limit=SL, tick_skip=TS)
    b.reset_all()
    md = 0.0
    for _ in range(20):
        eng = np.empty((N, 2, 3), np.int64)
        eng[..., 0] = rng.integers(-1, 2, (N, 2))
        eng[..., 1] = rng.integers(-1, 2, (N, 2))
        eng[..., 2] = rng.integers(0, 2, (N, 2))
        a.physics_step(eng)
        b.physics_step(eng)
        pa, _, ppa, _, _ = a.snapshot()
        pb, _, ppb, _, _ = b.snapshot()
        md = max(md, float(np.abs(pa - pb).max()), float(np.abs(ppa - ppb).max()))
    assert md < 1e-9, f"classic-loaded diverges from built-in: {md}"
    print(f"classic built-in vs loaded: max|pos diff| = {md:.2e}  OK")


def test_futsal_env_runs():
    env = make_default_env(64, 1, 1, stadium="futsal-classic")
    obs = env.reset()
    for _ in range(50):
        acts = np.stack(
            [
                np.random.randint(0, 3, (64, 2)),
                np.random.randint(0, 3, (64, 2)),
                np.random.randint(0, 2, (64, 2)),
            ],
            -1,
        )
        obs, rew, term, trunc = env.step(acts)
    assert np.isfinite(obs).all() and np.isfinite(rew).all(), "futsal env produced non-finite values"
    print(f"futsal env: obs{obs.shape} finite over 50 steps  OK")


if __name__ == "__main__":
    test_geometry_from_map()
    test_classic_loaded_matches_builtin()
    test_futsal_env_runs()
    print("\nSTADIUM LOADER OK")
