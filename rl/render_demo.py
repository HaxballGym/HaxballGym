"""Headless proof: load the trained model, play a match, save demo.gif + a frame.

Run:  uv run python render_demo.py
"""
import json
import os

import numpy as np
import torch

import haxball_core as hc
from render import draw_frame
from train import Policy, decode

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

    env = hc.VecEnv(1, 1, 1, step_limit=100000)
    obs = env.reset().reshape(2, -1)
    frames = []
    rng = np.random.default_rng(0)
    for t in range(steps):
        bins = greedy(model, obs)  # (2,3) both agents
        if opponent == "random":
            bins[1] = [rng.integers(3), rng.integers(3), rng.integers(2)]
        elif opponent == "static":
            bins[1] = [1, 1, 0]
        acts = decode(bins, 1, 2)
        obs, rew, done = env.step(acts)
        obs = obs.reshape(2, -1)
        if t % 2 == 0:
            bx, by, *_ = env.ball_state(0)
            players = []
            for k in range(2):
                px, py, _, _, team = env.player_state(0, k)
                players.append((px, py, int(team)))
            frames.append(draw_frame((bx, by), players, env.scores(0)))
    out = os.path.join(HERE, "demo.gif")
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=40, loop=0)
    frames[len(frames) // 3].save(os.path.join(HERE, "frame.png"))
    print(f"saved {out} ({len(frames)} frames), frame.png, final score {env.scores(0)}")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else "self")
