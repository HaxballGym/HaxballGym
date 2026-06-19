"""Fidelity vs the REAL Haxball engine (game-min.js), not a numpy reimplementation.

`tests/fixtures/nh_ball_trajectories.json` holds ground-truth ball trajectories generated
by driving node-haxball (the actual Haxball engine) deterministically — see
`headless-bot/nh_oracle.js`, which regenerates the fixture. Each scenario sets the ball at
the kickoff centre with a velocity and steps the engine tick-by-tick (no player input), so
the ball bounces off walls / segments / curved corners / posts on a real official stadium.

This test re-runs each scenario in the Rust port and asserts the ball trajectory matches the
real engine to 1e-9. It needs no node at test time (the fixture is committed), and it is the
authoritative cross-engine check (the older test_fidelity.py only checks collision primitives
against Ursinaxball's numpy port).

Run: `uv run haxballgym/tests/test_real_engine.py`.
"""

import json
from pathlib import Path

import numpy as np

from haxballgym import TransitionEngine

FIXTURE = Path(__file__).parent / "fixtures" / "nh_ball_trajectories.json"
TOL = 1e-9


def test_matches_real_engine():
    scenarios = json.loads(FIXTURE.read_text())
    worst = 0.0
    for sc in scenarios:
        npl = sc["n_red"] + sc["n_blue"]
        eng = TransitionEngine(1, sc["n_red"], sc["n_blue"], stadium=sc["stadium"], tick_skip=1)
        eng.reset()
        spawn = eng.snapshot().player_pos.copy()  # leave players at spawn (ball won't reach them)
        eng.set_state(
            np.array([[0.0, 0.0]]),  # ball at kickoff centre, like node-haxball
            np.array([sc["ball_vel"]], dtype=float),
            spawn,
            np.zeros_like(spawn),
        )
        oracle = np.asarray(sc["ball_traj"])  # (T, 2) from the real engine
        rust = np.array(
            [eng.step(np.zeros((1, npl, 3), dtype=np.int64)).ball_pos[0] for _ in range(len(oracle))]
        )
        d = float(np.abs(rust - oracle).max())
        worst = max(worst, d)
        tag = "OK" if d < TOL else "FAIL"
        print(f"  {sc['stadium']:8s} {sc['n_red']}v{sc['n_blue']} {sc['ball_vel']} diff={d:.2e} {tag}")
        assert d < TOL, f"{sc['stadium']} {sc['ball_vel']} diverges from the real engine by {d:.2e}"
    print(f"\nMATCHES REAL HAXBALL ENGINE (node-haxball) to {worst:.2e} over {len(scenarios)} scenarios")


if __name__ == "__main__":
    test_matches_real_engine()
