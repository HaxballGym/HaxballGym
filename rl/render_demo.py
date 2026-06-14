"""Headless proof: load the trained model, play a match, save demo.gif + a frame.

Run:  uv run python render_demo.py
"""

import json
import os

import numpy as np
import torch
from loguru import logger
from opponents import chase_bins
from render import draw_frame
from train import Policy

from haxballgym import RED, DefaultObs, DiscreteAction, TransitionEngine

HERE = os.path.dirname(__file__)


@torch.no_grad()
def greedy(model, obs):
    lx, ly, lk, _ = model(torch.as_tensor(obs, dtype=torch.float32))
    bx = lx.argmax(-1).numpy()
    by = ly.argmax(-1).numpy()
    bk = lk.argmax(-1).numpy()
    return np.stack([bx, by, bk], -1)


def main(opponent="self", steps=900):
    meta = json.load(open(os.path.join(HERE, "checkpoints/meta.json")))
    model = Policy(meta["obs_dim"])
    model.load_state_dict(torch.load(os.path.join(HERE, "checkpoints/model.pt"), map_location="cpu"))
    model.eval()

    eng = TransitionEngine(1, 1, 1, step_limit=100000)
    obs_b, act_p = DefaultObs(), DiscreteAction()
    state = eng.reset()
    obs = obs_b.build_obs(state).reshape(2, -1)
    frames, score = [], [0, 0]  # [red, blue]
    rng = np.random.default_rng(0)
    for t in range(steps):
        bins = greedy(model, obs)  # (2,3) both agents
        if opponent == "chase":
            bins[1] = chase_bins(obs[1:2], rng)[0]
        elif opponent == "random":
            bins[1] = [rng.integers(3), rng.integers(3), rng.integers(2)]
        elif opponent == "static":
            bins[1] = [1, 1, 0]
        state = eng.step(act_p.parse_actions(bins[None]))
        conceded = int(state.scored[0])
        if conceded != -1:  # red concedes -> blue scored, & vice-versa
            score[1 if conceded == RED else 0] += 1
            eng.reset_mask(np.array([True]))
            state = eng.snapshot()
        obs = obs_b.build_obs(state).reshape(2, -1)
        if t % 2 == 0:
            ball = tuple(state.ball_pos[0])
            players = [
                (state.player_pos[0, k, 0], state.player_pos[0, k, 1], int(state.team[0, k]))
                for k in range(2)
            ]
            frames.append(draw_frame(ball, players, tuple(score)))
    out = os.path.join(HERE, "demo.gif")
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=40, loop=0)
    frames[len(frames) // 3].save(os.path.join(HERE, "frame.png"))
    logger.success("saved {} ({} frames), frame.png, final score {}", out, len(frames), tuple(score))


if __name__ == "__main__":
    import sys

    main(sys.argv[1] if len(sys.argv) > 1 else "self")
