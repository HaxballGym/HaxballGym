"""Behavioral cloning: pretrain the policy to imitate humans, then PPO finetunes.

Consumes a dataset.npz of human (obs, action-bins) pairs (produced once
replays.parse_events is ported and build_bc_dataset re-simulates the games through
the core). Writes checkpoints/model.pt in the SAME format as train.py's Policy, so
PPO self-play picks it up automatically and finetunes from a strong human prior —
the Necto recipe.

Usage:
  uv run python bc_train.py dataset.npz       # BC pretrain -> checkpoints/model.pt
  uv run python train.py                       # then PPO finetunes from it
"""
import json
import os
import sys

import numpy as np
import torch
import torch.nn as nn

from train import Policy

HERE = os.path.dirname(__file__)
CKPT = os.path.join(HERE, "checkpoints")


def bc_train(npz_path, epochs=10, bs=4096, lr=3e-4):
    data = np.load(npz_path)
    obs = torch.as_tensor(data["obs"], dtype=torch.float32)
    bins = torch.as_tensor(data["bins"], dtype=torch.long)  # (N,3): x,y,kick
    N, obs_dim = obs.shape
    print(f"BC dataset: {N} samples, obs_dim={obs_dim}")

    model = Policy(obs_dim)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    ce = nn.CrossEntropyLoss()

    idx = np.arange(N)
    for ep in range(epochs):
        np.random.shuffle(idx)
        tot = 0.0
        for s in range(0, N, bs):
            b = torch.as_tensor(idx[s:s + bs])
            lx, ly, lk, _ = model(obs[b])
            loss = ce(lx, bins[b, 0]) + ce(ly, bins[b, 1]) + ce(lk, bins[b, 2])
            opt.zero_grad(); loss.backward(); opt.step()
            tot += float(loss) * len(b)
        # action-match accuracy
        with torch.no_grad():
            lx, ly, lk, _ = model(obs[:20000])
            acc = ((lx.argmax(-1) == bins[:20000, 0]) & (ly.argmax(-1) == bins[:20000, 1])
                   & (lk.argmax(-1) == bins[:20000, 2])).float().mean()
        print(f"ep {ep+1:2d}  loss {tot/N:.4f}  exact-action-acc {acc:.3f}")

    os.makedirs(CKPT, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(CKPT, "model.pt"))
    json.dump({"obs_dim": obs_dim, "n_red": 1, "n_blue": 1},
              open(os.path.join(CKPT, "meta.json"), "w"))
    print(f"saved {CKPT}/model.pt  (PPO `train.py` will finetune from this)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python bc_train.py dataset.npz  (build it via replays.build_bc_dataset)")
        sys.exit(1)
    bc_train(sys.argv[1])
