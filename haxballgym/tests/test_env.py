"""Env loop + component contracts — the surface that freezes at 1.0 and had no coverage.

Covers: the step()/reset() loop and auto-reset, continuous-mode validation, the obs
side-symmetry guarantee (one net plays both sides — the regression guard for the GeoObs
bounce-ray fix), the team-reward cache + solo handling, and the engine's input validation.

Run: `uv run haxballgym/tests/test_env.py`.
"""

import dataclasses

import numpy as np
from haxballgym.env import Env
from haxballgym.reward import _SameTeamMask

from haxballgym import (
    BLUE,
    RED,
    CrowdingPenalty,
    DefaultObs,
    GeoObs,
    SharedObs,
    TeammateSpacingReward,
    TeamSpiritReward,
    TransitionEngine,
    VelocityPlayerToBall,
    make_default_env,
)


def _rollout_state(n_envs=1, n_red=2, n_blue=2, steps=7, seed=0):
    """A realistic, ASYMMETRIC state (walls/obstacles populated) for symmetry tests."""
    eng = TransitionEngine(n_envs, n_red, n_blue)
    eng.reset()
    rng = np.random.default_rng(seed)
    s = None
    for _ in range(steps):
        s = eng.step(rng.integers(0, 3, size=(n_envs, n_red + n_blue, 3)))
    return s


def _mirror(s):
    """Reflect the scene across the y-axis (x -> -x) and swap RED<->BLUE. The game is
    invariant under this, so a side-symmetric obs must be unchanged PER PLAYER INDEX."""
    fx2 = np.array([-1.0, 1.0])  # negate x of a (...,2) vector
    swap = lambda t: np.where(t == RED, BLUE, RED)  # noqa: E731
    return dataclasses.replace(
        s,
        ball_pos=s.ball_pos * fx2,
        ball_vel=s.ball_vel * fx2,
        player_pos=s.player_pos * fx2,
        player_vel=s.player_vel * fx2,
        team=swap(s.team),
        goal_p0=s.goal_p0 * fx2,
        goal_p1=s.goal_p1 * fx2,
        goal_team=swap(s.goal_team),
        walls=None if s.walls is None else s.walls * np.array([-1.0, 1.0, -1.0, 1.0]),
        obstacles=None if s.obstacles is None else s.obstacles * np.array([-1.0, 1.0, 1.0]),
        ball_pred=None if s.ball_pred is None else s.ball_pred * fx2,
    )


def test_env_loop():
    env = make_default_env(n_envs=16, n_red=2, n_blue=2, step_limit=20)
    obs = env.reset()
    assert obs.shape == (16, 4, env.obs_dim) and np.isfinite(obs).all()
    for _ in range(60):  # spans goals + timeouts -> exercises auto-reset
        obs, rew, term, trunc = env.step(np.random.randint(0, 3, size=(16, 4, 3)))
        assert obs.shape == (16, 4, env.obs_dim) and np.isfinite(obs).all()
        assert rew.shape == (16, 4) and rew.dtype == np.float32 and np.isfinite(rew).all()
        assert term.shape == (16,) and trunc.shape == (16,)
    print("env loop + auto-reset OK")


def test_continuous_validation_and_run():
    eng = TransitionEngine(8, 1, 1)
    kw = dict(
        obs_builder=DefaultObs(),
        action_parser=make_default_env(1).action_parser,
        reward_fn=VelocityPlayerToBall(),
        termination_cond=make_default_env(1).termination_cond,
        truncation_cond=make_default_env(1).truncation_cond,
        state_mutator=make_default_env(1).state_mutator,
    )
    try:
        Env(eng, continuous=True, **kw)  # no max_steps
        raise AssertionError("continuous=True without max_steps should raise")
    except ValueError:
        pass
    env = Env(eng, continuous=True, max_steps=5, **kw)
    env.reset()
    for _ in range(4):  # below max_steps -> no episode reset; _ep climbs
        env.step(np.zeros((8, 2, 3), dtype=np.int64))
    assert int(env._ep.max()) == 4
    print("continuous validation + clock OK")


def test_obs_side_symmetry():
    s = _rollout_state()
    for ob in (DefaultObs(), GeoObs(), SharedObs()):
        o, om = ob.build_obs(s), ob.build_obs(_mirror(s))
        assert np.allclose(o, om, atol=1e-9), f"{type(ob).__name__} breaks side-symmetry"
    print("obs side-symmetry (DefaultObs/GeoObs/SharedObs) OK")


def test_team_rewards():
    s = _rollout_state(n_envs=4, n_red=2, n_blue=2)
    # cache must match a naive same-team mask
    same, excl = _SameTeamMask().get(s.team)
    naive = s.team[:, :, None] == s.team[:, None, :]
    assert (same == naive).all() and (excl == (naive & ~np.eye(4, dtype=bool)[None])).all()
    for r in (TeammateSpacingReward(), CrowdingPenalty(), TeamSpiritReward(VelocityPlayerToBall())):
        out = r.get_rewards(s, s, np.zeros(4, bool), np.zeros(4, bool))
        assert out.shape == (4, 4) and out.dtype == np.float32 and np.isfinite(out).all()
    # solo (1v1) TeammateSpacing must be 0 (no teammate -> no signal), not a constant max
    s1 = _rollout_state(n_envs=4, n_red=1, n_blue=1)
    solo = TeammateSpacingReward().get_rewards(s1, s1, np.zeros(4, bool), np.zeros(4, bool))
    assert (solo == 0).all(), "solo TeammateSpacing must be 0"
    print("team rewards (cache + solo + dtype) OK")


def test_kickoff_barrier():
    # During a kickoff the non-kicking team must be held in its own half — including players
    # at |y|>75 (past the centre semicircle), which the straight barrier verticals cover. The
    # built-in (stadium=None) path must match from_hbs("classic"). Regression for World::classic
    # omitting the straight kickOffBarrier segments.
    def run(stadium):
        eng = TransitionEngine(1, 4, 4, stadium=stadium)
        eng.reset()  # RED kicks off -> BLUE held
        teams, ys = eng._teams[0], eng.snapshot().player_pos[0, :, 1]
        for _ in range(60):
            act = np.zeros((1, 8, 3), dtype=np.int64)
            act[0, :, 0] = -1  # everyone drives toward -x (into the red half)
            s = eng.step(act)
        xend = s.player_pos[0, :, 0]
        # the max -x reached by any non-kicking (BLUE) player that started past the semicircle
        return max((xend[k] for k in range(8) if teams[k] == BLUE and abs(ys[k]) > 75), default=999.0)

    builtin, hbs = run(None), run("classic")
    assert builtin > -5.0, (
        f"built-in classic lets a |y|>75 player cross the kickoff barrier (x={builtin:.1f})"
    )
    assert abs(builtin - hbs) < 5.0, (
        f"built-in ({builtin:.1f}) and from_hbs ({hbs:.1f}) kickoff barriers disagree"
    )
    print("kickoff barrier (built-in == from_hbs, |y|>75 held) OK")


def test_engine_validation():
    for bad in (lambda: TransitionEngine(0, 1, 1), lambda: TransitionEngine(4, 0, 0)):
        try:
            bad()
            raise AssertionError("expected ValueError")
        except (ValueError, Exception) as e:
            assert "must be >= 1" in str(e) or isinstance(e, ValueError)
    try:
        TransitionEngine(4, 1, 1, predict_offsets=[3, 1])  # non-ascending
        raise AssertionError("non-ascending predict_offsets should raise")
    except ValueError:
        pass
    print("engine validation (n_envs / players / offsets) OK")


def test_scored_survives_reset():
    # A goal triggers an auto-rekickoff inside env.step; `state.scored` must still report the
    # conceding team for that step. Regression: the reset snapshot used to overwrite it to -1,
    # so goals were invisible to anything reading `scored` (metrics/eval silently saw 0).
    env = make_default_env(n_envs=64, n_red=1, n_blue=1)
    obs = env.reset()
    goals = scored = 0
    for _ in range(600):  # both players chase the ball + kick -> real goals
        s = env.prev_state
        d = s.ball_pos[:, None, :] - s.player_pos  # (N, P, 2)
        dist = np.hypot(d[..., 0], d[..., 1])
        bx = np.where(d[..., 0] > 5, 2, np.where(d[..., 0] < -5, 0, 1))
        by = np.where(d[..., 1] > 5, 2, np.where(d[..., 1] < -5, 0, 1))
        acts = np.stack([bx, by, (dist < 34).astype(np.int64)], -1)
        obs, rew, term, trunc = env.step(acts)
        goals += int(term.sum())  # GoalCondition fired this step
        scored += int((env.prev_state.scored != -1).sum())  # goal visible via scored
    assert goals > 0, "no goals scored — test setup broken"
    assert scored == goals, f"scored ({scored}) != goals ({goals}): scored lost across auto-reset"
    print("scored survives auto-reset OK")


if __name__ == "__main__":
    test_env_loop()
    test_continuous_validation_and_run()
    test_obs_side_symmetry()
    test_team_rewards()
    test_kickoff_barrier()
    test_engine_validation()
    test_scored_survives_reset()
    print("\nENV TESTS OK")
