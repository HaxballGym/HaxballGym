# HaxballGym

A headless, vectorized **Haxball** simulator for reinforcement learning — the
"RocketSim/RLGym for Haxball" — plus a composable training env, runnable examples,
and the tools to play your bot back in the real browser game.

The physics is a faithful Rust port of Haxball's, **verified to agree with the original
to within 1e-9**, stepped in batches of thousands of matches in parallel. That is ~1,000–10,000×
faster than the old Panda3D-based clone, which is the whole reason strong self-play
is now reachable on a single machine.

## Repo layout

| Path | What it is |
|---|---|
| **`rust/haxball_core/`** | The physics core. Headless, `f64`, vectorized `VecEnv` (N matches via rayon). Compiles to a Python extension today, WASM next. |
| **`haxballgym/`** | The composable env API — obs, reward, action, done, and state mutators — on top of the core (the RLGym-v2 decomposition). |
| **`rl/`** | Runnable examples: `train.py` (PPO self-play) and `play.py` (human vs your model). |
| **`headless-bot/`** | Host a private Haxball room and play your trained policy in the real browser game. |
| **`docs/`** | Architecture, how-to, and design docs. **Start here:** [`docs/HOW_TO.md`](docs/HOW_TO.md). |
| **`ARCHITECTURE.md`** | The layered architecture (read before changing structure). |

## Quickstart

This is a **uv workspace** (`rust/haxball_core` + `haxballgym` + `rl`). One command
builds the Rust core and installs everything into `.venv`:

```bash
uv sync                                          # builds core + installs deps + uv.lock
uv run rust/haxball_core/tests/test_fidelity.py  # port matches Haxball to 1e-9

uv run rl/train.py                 # PPO self-play vs the chase bot -> rl/checkpoints/model.pt
uv run rl/play.py                  # YOU (arrows + X/space) vs the trained model
```

No venv activation, no `pip`. Add a dep with `uv add <pkg>`.

Full onboarding, including the why behind each piece: **[`docs/HOW_TO.md`](docs/HOW_TO.md)**.

## Status

The fast core, fidelity tests, the composable env API, and a runnable PPO self-play
example are in place. Next up: WASM + ONNX for in-browser play and larger team sizes
(2v2/3v3). The env pieces are fully composable — swap obs/reward/mutators to
experiment (see `rl/README.md` for where to extend).

## Legal

Haxball is created by Mario Carbajal. This project is an independent,
research-oriented physics port and is not affiliated with or endorsed by him.
