"""Export the trained PPO policy (rl/checkpoints/model.pt) to policy.json so the
Node bot can run the forward pass without torch. Run: `uv run headless-bot/export_policy.py`."""

import json
from pathlib import Path

import torch

HERE = Path(__file__).parent
CKPT = HERE.parent / "rl" / "checkpoints"


def main():
    sd = torch.load(CKPT / "model.pt", map_location="cpu")
    meta = json.loads((CKPT / "meta.json").read_text())

    def mat(key):  # weight (out, in) and bias (out,) as plain nested lists
        return {"w": sd[f"{key}.weight"].tolist(), "b": sd[f"{key}.bias"].tolist()}

    policy = {
        "obs_dim": meta["obs_dim"],
        "trunk0": mat("trunk.0"),  # 16 -> 256, tanh
        "trunk2": mat("trunk.2"),  # 256 -> 256, tanh
        "head_x": mat("head_x"),  # -> 3 (dx bin)
        "head_y": mat("head_y"),  # -> 3 (dy bin)
        "head_k": mat("head_k"),  # -> 2 (kick bin)
    }
    out = HERE / "policy.json"
    out.write_text(json.dumps(policy))
    print(f"wrote {out} (obs_dim={meta['obs_dim']})")


if __name__ == "__main__":
    main()
