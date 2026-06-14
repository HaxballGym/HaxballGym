# HOW_TO — onboarding for new developers

Everything you need to go from a fresh clone to training a bot and playing against
it, with enough of the *why* that you can change things safely. Read
`ARCHITECTURE.md` alongside this.

## 0. Mental model in three sentences

The physics lives in a fast headless Rust core (`rust/haxball_core`). The RL code
(`rl/`) imports that core as a Python extension and steps thousands of matches at
once. Nothing renders during training — rendering and human-play are separate, and
the in-browser version comes later via WASM.

## 1. Prerequisites

- **Rust** (stable) — uv pulls `maturin` itself as the build backend.
- **`uv`** — manages the workspace, the lockfile, the venv, and Python itself.
- That's it. uv fetches a managed **Python 3.12+** if you don't have one.

## 2. Build everything

This repo is a **uv workspace** (`rust/haxball_core` + `rl`). One command compiles
the Rust core and installs all deps into `.venv` at the repo root:

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

## 3. Train a bot (and watch it live)

```bash
uv run rl/train.py        # PPO vs the chase bot -> rl/checkpoints/model.pt (best vs-chase)
```

In a second terminal, watch the run as it happens:

```bash
uv run tensorboard --logdir rl/runs        # http://localhost:6006
```

You'll see `loss/{policy,value,entropy}`, `rollout/{reward,return,value}_mean`,
`perf/decisions_per_s`, and `eval/chase_{goals,conceded,net}`. Prefer a cloud
dashboard? `uv sync --extra wandb`, `uv run wandb login` once, then
`WANDB=1 uv run rl/train.py`.

## 4. Configure a run

All knobs are a typed `Settings` model (`pydantic-settings`) at the top of
`rl/train.py`. Override any field via an env var (upper-cased) or a `.env` file:

```bash
ITERS=500 JIGGLE=0.2 RUN_NAME=longer uv run rl/train.py
DEV=mps uv run rl/train.py    # try Apple-GPU; CPU is often faster for this small MLP
TB=0 uv run rl/train.py       # disable all tracking
```

Adding a new knob? Add a field to `Settings`, not a scattered `os.environ.get`.

## 5. Play against your bot

```bash
uv run rl/play.py             # YOU = red (arrow keys, X/space to kick), model = blue
uv run rl/render_demo.py static   # headless: writes demo.gif + frame.png
```

## 6. Make a change safely

- **Touching physics** (`rust/haxball_core/src/physics.rs`)? Re-run
  `test_fidelity.py`; add a case if you add a collision path. Rebuild with
  `uv sync` (or `uv run maturin develop --release` for a faster inner loop).
- **Changing obs/reward/done/step** (`lib.rs`)? These are the env contract. Keep the
  obs side-symmetric and keep `R_GOAL` (the eval detects goals from reward sign).
  Read the invariants in `ARCHITECTURE.md` first.
- **Training code** (`rl/`)? Use `loguru` for console, the `log()` helper for
  metrics. Keep `rl/` → `haxball_core` as the only dependency direction.

## 7. Where to go next

- The current open problem and prioritized backlog:
  `docs/exec-plans/active/next-iteration.md`.
- Why the architecture is what it is, and the lessons already paid for:
  `docs/design-docs/`.
- The north-star goals: `CURRENT_GOALS.md`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: haxball_core` | Run `uv sync`, and prefix commands with `uv run`. |
| Link error from `cargo build` | Expected — the build goes through maturin; use `uv sync`. |
| `tensorboard`/`loguru`/`pydantic` missing | `uv sync` (they're declared in `rl/pyproject.toml`). |
| Edited Rust but Python didn't change | Rebuild: `uv sync` (or `uv run maturin develop --release`). |
| Training prints but no curves | TensorBoard needs `--logdir rl/runs`; check the run dir printed at startup. |
