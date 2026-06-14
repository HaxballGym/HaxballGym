# AGENTS.md — map of the repo

A lean entry point for anyone (human or agent) touching this codebase. It is a
**map, not a manual**: it points at the sources of truth, it does not duplicate
them. Keep it under ~120 lines. If a section starts growing, move the detail into
`docs/` and leave a pointer here.

## What this is

A headless, vectorized Haxball simulator for RL + the training code + the tools to
play the bot in the real browser game. See `README.md` for the pitch and
`ARCHITECTURE.md` for the layering.

## The three components (and their boundary rules)

1. **`rust/haxball_core/`** — physics + batched env. Pure simulation, **no game
   engine, no rendering, no RL**. The fidelity test (`tests/test_fidelity.py`) is
   the contract: it must keep matching Haxball's numbers to 1e-9. Changes to physics
   require re-running it.
2. **`rl/`** — everything learning-related: policy, PPO, opponents, rendering,
   replays. Depends on the core (as the `haxball_core` Python extension) and on
   nothing in the reverse-engineering folder at runtime.
3. **`reverse-engineering/`** — reference only. Read it to replicate the replay
   format / headless rooms / map loading. Never imported by the core or `rl/`.

Dependency direction is one-way: `rl/` → `haxball_core`. The core never imports
upward. Keep it that way (see `ARCHITECTURE.md`).

## Where things live

| Need | Go to |
|---|---|
| Build / run / onboard | `docs/HOW_TO.md` |
| Why it's structured this way | `ARCHITECTURE.md` |
| Current task + backlog | `docs/exec-plans/active/next-iteration.md` |
| Design rationale & lessons | `docs/design-docs/` |
| North-star goals | `CURRENT_GOALS.md` |
| Physics math | `rust/haxball_core/src/physics.rs` |
| Env / obs / reward / step | `rust/haxball_core/src/lib.rs` |
| Training config (typed) | `Settings` in `rl/train.py` |

## Build & verify (the short version)

uv workspace (`rust/haxball_core` + `rl`); Python 3.12+ (uv fetches it). No venv
activation, no `pip` — prefix with `uv run`.

```bash
uv sync                                                    # build core + install all deps
uv run rust/haxball_core/tests/test_fidelity.py     # physics contract (1e-9)
uv run rl/train.py                                  # trains; streams to TensorBoard (rl/runs)
```

`cargo build` alone fails to link — expected; PyO3's extension-module needs maturin's
linker flags, which `uv sync` (and `uv run maturin develop --release`) drive. Add
deps with `uv add <pkg>` (training deps go in `rl/`), not `pip`.

## Conventions

- **Config = `pydantic-settings`.** New tunables go in a `Settings` model and are
  env-overridable, not scattered `os.environ.get` calls.
- **Console output = `loguru`**, not `print`. Metrics = TensorBoard/W&B via the
  `log()` helper in `train.py`.
- **Physics changes** must keep `test_fidelity.py` green; add a case if you add a
  collision path.
- Keep `rl/runs/`, `wandb/`, `.env`, checkpoints out of git (already gitignored).

## Working style

The owner prefers tight, in-loop work over fanning out a swarm of agents. Make a
focused change, verify it, report. Don't relearn the gotchas — they're in
`docs/exec-plans/active/next-iteration.md` and `docs/design-docs/`.
