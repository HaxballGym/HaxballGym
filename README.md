# HaxballGym

A headless, vectorized **Haxball** simulator for reinforcement learning — the
"RocketSim/RLGym for Haxball" — plus the training code to reach superhuman play and
the tools to play your bot back in the real browser game.

The physics is a faithful Rust port of Haxball's, **verified bit-for-bit to 1e-9**,
stepped in batches of thousands of matches in parallel. That is ~1,000–10,000×
faster than the old Panda3D-based clone, which is the whole reason strong self-play
is now reachable on a single machine.

## Repo layout

| Path | What it is |
|---|---|
| **`rust/haxball_core/`** | The physics core. Headless, `f64`, vectorized `VecEnv` (N matches via rayon). Compiles to a Python extension today, WASM next. |
| **`rl/`** | PPO training on the core, live metrics (TensorBoard/W&B), `play.py` (human vs model), GIF rendering. |
| **`reverse-engineering/`** | The (permissioned) original Haxball source — used to replicate the replay format, headless rooms, and map loading. |
| **`docs/`** | Architecture, how-to, design docs, and execution plans. **Start here:** [`docs/HOW_TO.md`](docs/HOW_TO.md). |
| **`AGENTS.md`** / **`ARCHITECTURE.md`** | The lean map and the layered architecture (read before changing structure). |

## Quickstart

This is a **uv workspace** (`rust/haxball_core` + `rl`). One command builds the Rust
core and installs everything into `.venv`:

```bash
uv sync                                                   # builds core + installs deps + uv.lock
uv run rust/haxball_core/tests/test_fidelity.py    # port matches Haxball to 1e-9

uv run rl/train.py                 # PPO vs the chase bot -> rl/checkpoints/model.pt
uv run tensorboard --logdir rl/runs       # live curves at http://localhost:6006
uv run rl/play.py                  # YOU (arrows + X/space) vs the trained model
```

No venv activation, no `pip`. Add a dep with `uv add <pkg>` (in `rl/` for training
deps); the optional W&B dashboard is `uv sync --extra wandb`.

Full onboarding, including the why behind each piece: **[`docs/HOW_TO.md`](docs/HOW_TO.md)**.

## Status & roadmap

The fast core, fidelity tests, and a working PPO + live-tracking loop are in place.
The current open problem and the prioritized backlog (defensive reward, behavioral
cloning from 21k human replays, 2v2/3v3, WASM+ONNX in-browser play) live in
[`docs/exec-plans/active/next-iteration.md`](docs/exec-plans/active/next-iteration.md).
The north-star goals are in [`CURRENT_GOALS.md`](CURRENT_GOALS.md).

## Legal

The contents of `reverse-engineering/` are used with the explicit permission of
Mario Carbajal (Haxball's author) for research purposes.
