"""Parity contract: the composable Python env (DefaultObs + CombinedReward) must
reproduce the engine's old baked-in obs/reward exactly. Run: `uv run haxballgym/tests/test_parity.py`.

(While the legacy `VecEnv.step`/`reset` still exist this compares against them
directly; it is the migration safety net for moving obs/reward out of Rust.)
"""
import numpy as np
import haxball_core as hc

from haxballgym import (
    CombinedReward, DefaultObs, DiscreteAction, Env, GoalCondition, GoalReward,
    KickoffMutator, TimeoutCondition, TransitionEngine, VelocityBallToGoal,
    VelocityPlayerToBall,
)

N, SL, TS = 64, 10**9, 8  # huge step_limit -> only goals reset (deterministic, stays in sync)


def main():
    rng = np.random.default_rng(0)
    e_old = hc.VecEnv(N, 1, 1, step_limit=SL, tick_skip=TS)
    obs_old = e_old.reset()
    env = Env(
        TransitionEngine(N, 1, 1, SL, TS), DefaultObs(), DiscreteAction(),
        CombinedReward((VelocityPlayerToBall(), 1.0), (VelocityBallToGoal(), 1.0), (GoalReward(), 5.0)),
        GoalCondition(), TimeoutCondition(SL), KickoffMutator(),
    )
    obs_new = env.reset()
    assert np.abs(obs_old - obs_new).max() < 1e-4, "initial obs mismatch"

    max_obs = max_rew = 0.0
    for _ in range(40):
        eng = np.empty((N, 2, 3), dtype=np.int64)
        eng[..., 0] = rng.integers(-1, 2, (N, 2))
        eng[..., 1] = rng.integers(-1, 2, (N, 2))
        eng[..., 2] = rng.integers(0, 2, (N, 2))
        o_old, r_old, _ = e_old.step(eng)
        bins = eng.copy(); bins[..., 0] += 1; bins[..., 1] += 1   # DiscreteAction subtracts 1
        o_new, r_new, _, _ = env.step(bins)
        max_obs = max(max_obs, float(np.abs(o_old - o_new).max()))
        max_rew = max(max_rew, float(np.abs(r_old - r_new).max()))

    print(f"max|obs diff| = {max_obs:.2e}   max|reward diff| = {max_rew:.2e}")
    assert max_obs < 1e-4 and max_rew < 1e-4, "PARITY FAIL"
    print("PARITY OK — composable env matches the engine's baked-in obs/reward")


if __name__ == "__main__":
    main()
