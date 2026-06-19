"""Export a trained PPO policy to policy.json so the Node bot can run the forward pass
without torch.

  uv run headless-bot/export_policy.py                         # default (rl/checkpoints/model.pt)
  uv run headless-bot/export_policy.py my_run                  # a run dir (uses model_final.pt)
  uv run headless-bot/export_policy.py path/x.pt --stadium futsal-classic

policy.json is self-describing: besides the weights it carries the obs normalization
(pos_coef, goal_x) and — for non-classic maps — the stadium itself, so swapping the file
switches the bot, its observation, AND the room's map together. bot.js falls back to the
classic defaults when those fields are absent.

Only the 256×2, obs_dim-16 DefaultObs arch is supported by bot.js (trunk.0/trunk.2)."""

import argparse
import json
from pathlib import Path

import torch

HERE = Path(__file__).parent
CKPT = HERE.parent / "rl" / "checkpoints"


def resolve(arg: str | None) -> tuple[Path, dict]:
    """Return (state_dict_path, meta). `arg` may be None (default), a run-dir name, or a .pt."""
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


def stadium_obs_params(stadium: str) -> tuple[list[float], float, str | None]:
    """Map-aware obs scaling for bot.js: (pos_coef [px,py], goal_x, stadium_hbs|None).
    Mirrors haxballgym's DefaultObs(pos_coef='auto') so the room obs matches training."""
    from haxballgym.obs import DefaultObs
    from haxballgym.stadium import stadium_text

    from haxballgym import TransitionEngine

    is_classic = stadium in ("", "classic")
    eng = TransitionEngine(1, 1, 1, stadium=None if is_classic else stadium)
    ob = DefaultObs(pos_coef="auto")
    ob.reset(eng.snapshot())
    goal_x = float(max(abs(eng._goal_p0[:, 0]).max(), abs(eng._goal_p1[:, 0]).max()))
    hbs = None if is_classic else stadium_text(stadium)
    return [float(ob.pos_coef[0]), float(ob.pos_coef[1])], goal_x, hbs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ckpt", nargs="?", default=None)
    ap.add_argument("--stadium", default=None, help="override; else meta.stadium, else classic")
    args = ap.parse_args()

    sd_path, meta = resolve(args.ckpt)
    sd = torch.load(sd_path, map_location="cpu")
    obs_dim = meta.get("obs_dim") or sd["trunk.0.weight"].shape[1]
    depth = sum(1 for k in sd if k.startswith("trunk.") and k.endswith(".weight"))
    if obs_dim != 16 or depth != 2:
        raise SystemExit(
            f"refusing to export: bot.js's buildObs produces the 16-dim DefaultObs (1v1, depth-2 MLP) "
            f"only, but this checkpoint is obs_dim={obs_dim}, depth={depth}. Deploying it would feed a "
            f"truncated obs into the policy (silently wrong forward pass). Extend bot.js's buildObs to "
            f"match this obs (PredictObs/GeoObs/SharedObs/action_stack/team size) before exporting."
        )

    stadium = args.stadium or meta.get("stadium") or "classic"
    pos_coef, goal_x, hbs = stadium_obs_params(stadium)

    def mat(key):  # weight (out, in) and bias (out,) as plain nested lists
        return {"w": sd[f"{key}.weight"].tolist(), "b": sd[f"{key}.bias"].tolist()}

    name = sd_path.parent.name if sd_path.name == "model_final.pt" else sd_path.stem
    if name in ("checkpoints", ""):
        name = sd_path.stem
    policy = {
        "obs_dim": obs_dim,
        "name": name,
        "stadium_name": stadium,
        "pos_coef": pos_coef,  # [px, py] obs position scale — map-aware (DefaultObs 'auto')
        "goal_x": goal_x,  # goal-line x for target/own-goal-rel obs terms
        "stadium_hbs": hbs,  # .hbs text for non-classic maps -> bot.js setCustomStadium; null on classic
        "trunk0": mat("trunk.0"),
        "trunk2": mat("trunk.2"),
        "head_x": mat("head_x"),
        "head_y": mat("head_y"),
        "head_k": mat("head_k"),
    }
    out = HERE / "policy.json"
    out.write_text(json.dumps(policy))
    print(
        f"wrote {out.name} from {sd_path.relative_to(HERE.parent)} | obs_dim={obs_dim} "
        f"stadium={stadium} pos_coef={[round(c, 5) for c in pos_coef]} goal_x={goal_x:.0f}"
    )


if __name__ == "__main__":
    main()
