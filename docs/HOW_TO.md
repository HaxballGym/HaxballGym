# HOW_TO — onboarding for new developers

Everything you need to go from a fresh clone to training a bot and playing against
it, with enough of the *why* that you can change things safely. Read
`ARCHITECTURE.md` alongside this.

## 0. Mental model in three sentences

The physics lives in a fast headless Rust core (`rust/haxball_core`). The
`haxballgym` package wraps it in a composable env (obs / reward / action / done /
mutators). The example training code (`rl/`) imports that env and steps thousands of
matches at once. Nothing renders during training — human-play is separate, and the
in-browser version comes later via WASM.

## 1. Prerequisites

- **Rust** (stable) — uv pulls `maturin` itself as the build backend.
- **`uv`** — manages the workspace, the lockfile, the venv, and Python itself.
- That's it. uv fetches a managed **Python 3.12+** if you don't have one.

## 2. Build everything

This repo is a **uv workspace** (`rust/haxball_core` + `haxballgym` + `rl`). One
command compiles the Rust core and installs all deps into `.venv` at the repo root:

```bash
uv sync                          # builds haxball_core (maturin) + installs deps -> uv.lock
```

> You never activate the venv or call `pip`. Prefix commands with `uv run`. Adding a
> dep is `uv add <pkg>` (run it inside `rl/` for training deps). `cargo build` alone
> fails to link — expected; the build always goes through maturin, which `uv sync`
> drives for you.

Verify the physics is faithful to the real game:

```bash
uv run rust/haxball_core/tests/test_fidelity.py   # 25k inputs vs fn_base.py, 1e-9
uv run rust/haxball_core/bench.py                 # throughput sanity check
```

If `test_fidelity.py` passes, the simulator is byte-trustworthy and you can believe
any speed numbers you measure.

## 3. Train a bot

```bash
uv run rl/train.py                 # PPO self-play -> rl/checkpoints/model.pt (best vs-chase)
uv run rl/train.py --iters 1500    # train longer for a stronger bot
```

It prints `vs chase R:B (net ±)` every 10 iterations — goals-for minus
goals-against against the hand-coded "run at the ball" baseline. Watch that net
climb; a few hundred iterations is enough to comfortably beat the baseline. The best
checkpoint so far is saved to `rl/checkpoints/model.pt`.

## 4. Configure a run

The trainer is a single self-contained script with `argparse` flags and a block of
hyper-parameters at the top of `rl/train.py`:

```bash
uv run rl/train.py --iters 1500 --hidden 256 --depth 2 --out my_model.pt
```

Tune `N_ENVS`, `T`, `GAMMA`, `LR`, the snapshot-pool size, etc. directly in the
constants block — they're documented inline.

## 5. Play against your bot

```bash
uv run rl/play.py                  # YOU = red (arrow keys, X/space to kick), model = blue
uv run rl/play.py --model my_model.pt
```

## 6. Make a change safely

- **Touching physics** (`rust/haxball_core/src/physics.rs`)? Re-run
  `test_fidelity.py`; add a case if you add a collision path. Rebuild with
  `uv sync` (or `uv run maturin develop --release` for a faster inner loop).
- **Changing obs / reward / action / done / mutators**? These live in the
  `haxballgym` package, not the Rust core — each is a small composable class. Keep
  the obs side-symmetric (see the invariants in `ARCHITECTURE.md`). The Rust core
  exposes only physics + batched state.
- **Training code** (`rl/`)? It's example code — keep it self-contained and readable.
  Keep `rl/` → `haxballgym` → `haxball_core` as the only dependency direction.

## 7. Where to go next

- Why the architecture is what it is, and the lessons already paid for:
  `docs/design-docs/`.
- A runnable training example to build on: `rl/` (`train.py` + `play.py`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: haxball_core` | Run `uv sync`, and prefix commands with `uv run`. |
| Link error from `cargo build` | Expected — the build goes through maturin; use `uv sync`. |
| `torch`/`pygame`/`numpy` missing | `uv sync` (they're declared in `rl/pyproject.toml`). |
| Edited Rust but Python didn't change | Rebuild: `uv sync` (or `uv run maturin develop --release`). |
| `play.py` can't open a window | It needs a local display; train headless on a server, play locally. |
