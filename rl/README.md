# rl — self-play training + play against the model

Trains a 1v1 Haxball policy on the headless Rust core (`../rust/haxball_core`) and
lets you play against it.

## Quickstart

```bash
# from rust/haxball_core: uv venv .venv && source .venv/bin/activate
#                         uv pip install maturin numpy torch pygame pillow && maturin develop --release
source ../rust/haxball_core/.venv/bin/activate

python train.py        # ~4 min: PPO self-play -> checkpoints/model.pt (best vs-random)
python play.py         # YOU (red, arrow keys + X/space to kick) vs the model (blue)
python render_demo.py static   # headless: writes demo.gif + frame.png
```

## How it works (the RLGym playbook, minimal)

- **Env**: the Rust `VecEnv` steps 512 matches in parallel. `tick_skip=8`
  (~7.5 decisions/s), obs is goal-relative + side-aware so one shared net plays
  red and blue with **no per-team mirroring** (the bug that breaks old HaxballGym).
- **Reward**: a faithful port of WazBot's `CombinedReward` —
  `VelocityPlayerToBall` (dense, non-zero-sum → no defensive collapse) +
  `VelocityBallToGoal`. This is what makes it learn ball/shooting/goals in minutes.
- **Algo**: vanilla PPO (CleanRL-style), shared-policy self-play, gamma from a 5s
  half-life. Saves the best-vs-random checkpoint.

Trains at ~46k decisions/s on CPU; within ~10 iterations it already scores. The
current baseline understands ball control, shooting and goals but is over-aggressive
(concedes too) — next levers: a defensive/own-goal-penalty reward term, longer
training, and the BC warm-start below.

## Behavioral cloning from the 21k human replays (next)

`replays.py` decodes the `.hbr2` container (done) and documents how to extract
per-frame inputs; `bc_train.py` pretrains this same `Policy` to imitate humans,
after which `train.py` finetunes from it — the Necto recipe. See those files.
