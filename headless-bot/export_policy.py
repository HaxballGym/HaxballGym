"""Export a trained PPO policy to policy.json so the Node bot can run the forward pass
without torch.

  uv run headless-bot/export_policy.py                       # default (rl/checkpoints/model.pt)
  uv run headless-bot/export_policy.py my_run                # a run dir (uses model_final.pt)
  uv run headless-bot/export_policy.py rl/checkpoints/x.pt   # an explicit .pt (meta inferred)

Only the default 256×2, obs_dim-16 DefaultObs arch is supported by bot.js (trunk.0/trunk.2)."""

import json
import sys
from pathlib import Path

import torch

HERE = Path(__file__).parent
CKPT = HERE.parent / "rl" / "checkpoints"


def resolve(arg: str | None) -> tuple[Path, dict]:
    """Return (state_dict_path, meta). `arg` may be None (champion), a run-dir name, or a .pt."""
    if arg is None:
        meta_path = CKPT / "meta.json"  # optional — obs_dim/depth are inferred from the weights
        meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
        return CKPT / "model.pt", meta
    p = Path(arg)
    if p.suffix == ".pt":  # explicit checkpoint file
        sd_path = p if p.is_absolute() else (HERE.parent / p)
        meta_path = sd_path.parent / "meta.json"
    else:  # a run-dir name under checkpoints/ — prefer the deploy weights (model_final.pt)
        run = CKPT / arg
        sd_path = run / "model_final.pt"
        if not sd_path.exists():
            sd_path = run / "model.pt"
        meta_path = run / "meta.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    return sd_path, meta


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    sd_path, meta = resolve(arg)
    sd = torch.load(sd_path, map_location="cpu")
    obs_dim = meta.get("obs_dim") or sd["trunk.0.weight"].shape[1]
    depth = sum(1 for k in sd if k.startswith("trunk.") and k.endswith(".weight"))
    if obs_dim != 16 or depth != 2:
        print(f"WARNING: bot.js expects obs_dim=16, depth=2 — this is obs_dim={obs_dim}, depth={depth}")

    def mat(key):  # weight (out, in) and bias (out,) as plain nested lists
        return {"w": sd[f"{key}.weight"].tolist(), "b": sd[f"{key}.bias"].tolist()}

    # a human-readable name for the loaded bot (run dir, or the .pt stem) — shown in the room
    name = sd_path.parent.name if sd_path.name == "model_final.pt" else sd_path.stem
    if name in ("checkpoints", ""):
        name = sd_path.stem
    policy = {
        "obs_dim": obs_dim,
        "name": name,
        "trunk0": mat("trunk.0"),  # 16 -> 256, tanh
        "trunk2": mat("trunk.2"),  # 256 -> 256, tanh
        "head_x": mat("head_x"),  # -> 3 (dx bin)
        "head_y": mat("head_y"),  # -> 3 (dy bin)
        "head_k": mat("head_k"),  # -> 2 (kick bin)
    }
    out = HERE / "policy.json"
    out.write_text(json.dumps(policy))
    print(f"wrote {out} from {sd_path.relative_to(HERE.parent)} (obs_dim={obs_dim})")


if __name__ == "__main__":
    main()
