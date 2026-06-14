"""Stadium-driven geometry: obs/reward must target the *actual* goals from the
stadium, not hardcoded numbers. We can't yet load a futsal match in the engine
(no .hbs loader), but the components are pure functions of GameState — so we feed
them futsal vs classic goal lines and check each targets the right goal. This is
the regression guard for the bug being fixed (the old path baked in goal_x=370).

Run: `uv run haxballgym/tests/test_stadium_geometry.py`.
"""

import numpy as np

from haxballgym import BLUE, RED, DefaultObs, GameState, VelocityBallToGoal

# Real goal lines straight from the .hbs stadiums.
GOALS = {
    "classic": (
        np.array([[-370.0, 64.0], [370.0, 64.0]]),
        np.array([[-370.0, -64.0], [370.0, -64.0]]),
        np.array([RED, BLUE]),
    ),
    "futsal": (
        np.array([[-408.3, 70.0], [408.3, 70.0]]),
        np.array([[-408.3, -70.0], [408.3, -70.0]]),
        np.array([RED, BLUE]),
    ),
}


def state_for(map_name, ball_pos, ball_vel):
    p0, p1, gteam = GOALS[map_name]
    return GameState(
        ball_pos=np.array([ball_pos], float),
        ball_vel=np.array([ball_vel], float),
        player_pos=np.array([[[-50.0, 0.0], [50.0, 0.0]]]),  # red, blue
        player_vel=np.zeros((1, 2, 2)),
        team=np.array([[RED, BLUE]]),
        scored=np.array([-1], np.int8),
        steps=np.array([0]),
        goal_p0=p0,
        goal_p1=p1,
        goal_team=gteam,
        player_max_speed=0.1066667,
    )


def main():
    obs = DefaultObs()
    # The attacked-goal centre encoded in obs must match the map's real goal x.
    for m, expect_x in (("classic", 370.0), ("futsal", 408.3)):
        st = state_for(m, [0.0, 0.0], [0.0, 0.0])
        target_red = st.goal_center(attacked=True)[0, 0]  # RED attacks +x goal
        assert abs(target_red[0] - expect_x) < 1e-6, f"{m}: red target {target_red} != {expect_x}"
        o = obs.build_obs(st)  # (1,2,16)
        # obs cols 8:10 = (target_goal - self_pos) * pos_coef; red self at x=-50
        rel_x = o[0, 0, 8] / (1 / 420.0)
        assert abs(rel_x - (expect_x - (-50.0))) < 1e-2, f"{m}: obs target rel {rel_x}"
        print(f"{m:8s}: red attacks goal at x={target_red[0]:+.1f}  (obs encodes it) OK")

    # Reward must use the map's goal line: ball drifting toward +x rewards RED on
    # both maps, but the magnitude tracks the (different) nearest goal point.
    vbg = VelocityBallToGoal()
    for m in ("classic", "futsal"):
        st = state_for(m, [100.0, 30.0], [5.0, 0.0])  # ball moving toward +x goal
        r = vbg.get_rewards(st, st, None, None)[0]  # (2,) red, blue
        assert r[0] > 0 and r[1] < 0, f"{m}: expected +red/-blue, got {r}"
        print(f"{m:8s}: ball->+x  reward red={r[0]:+.4f} blue={r[1]:+.4f} OK")

    # The clincher: same ball state, different map -> different target -> the old
    # hardcoded path could not do this.
    c = DefaultObs().build_obs(state_for("classic", [0, 0], [0, 0]))[0, 0, 8]
    f = DefaultObs().build_obs(state_for("futsal", [0, 0], [0, 0]))[0, 0, 8]
    assert c != f, "obs did not change with the stadium!"
    print("\nSTADIUM-DRIVEN OK — obs/reward follow the map's real goals, nothing hardcoded")


if __name__ == "__main__":
    main()
