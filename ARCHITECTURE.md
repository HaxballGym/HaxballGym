# Architecture

This repo follows the **RLGym playbook**: put the physics in a fast, headless,
native core behind one interface, step it in batches, and train a high-throughput
learner against it. Everything below serves that one idea — throughput, not a
cleverer algorithm, is what reaches superhuman.

## Layers (dependencies point downward only)

```
┌─────────────────────────────────────────────────────────────┐
│  rl/            policy · PPO · opponents · replays · render   │   Python
│                 live tracking (TensorBoard / W&B)             │
└───────────────▲─────────────────────────────────────────────┘
                │  composes env pieces; one step() advances ALL envs
┌───────────────┴─────────────────────────────────────────────┐
│  haxballgym/    RLGym-v2-style composable env (batched):      │   Python
│    Env · ObsBuilder · RewardFunction · ActionParser ·         │
│    DoneCondition · StateMutator · GameState · stadiums/*.hbs   │
└───────────────▲─────────────────────────────────────────────┘
                │  imports the `haxball_core` extension; physics only
┌───────────────┴─────────────────────────────────────────────┐
│  rust/haxball_core/                                           │   Rust (PyO3)
│    lib.rs      VecEnv: batched physics + GameState, rayon     │
│    physics.rs  collisions + integration (port of fn_base.py)  │
│    stadium.rs  .hbs loader (serde): any map -> World          │
└──────────────────────────────────────────────────────────────┘
                ▲
                │  reference only (never imported)
┌───────────────┴─────────────────────────────────────────────┐
│  reverse-engineering/   original Haxball source (replays,     │   JS (read-only)
│                         headless rooms, map formats)          │
└──────────────────────────────────────────────────────────────┘
```

**Rule:** dependencies point downward only — `rl/` → `haxballgym` → `haxball_core`;
the core depends on nothing above it; `reverse-engineering/` is documentation,
imported by nobody. A change that makes a lower layer import from a higher one, or
that runs game-engine/render code inside the core, is an architecture violation — it
reintroduces the slowness this whole design exists to kill.

**Obs/reward/done now live in `haxballgym`** (composable Python, batched-vectorized),
not baked into the core. The core exposes a batched `GameState` + geometry
(`goals()`, `player_max_speed`) and resolves no rewards. Goal geometry is read from
the stadium, so the same obs/reward train on any `.hbs` map.

## Why a native core (the core belief)

The old stack made every disc a Panda3D `Entity`, so even headless a single game
ran at low-thousands of steps/sec — the reason it was "a million times slower" than
RLGym. The core removes the engine entirely: pure `f64` math, no objects, no
rendering. The Python↔Rust boundary is crossed **once per batch of envs**, not once
per game step, and the GIL is released during the sim (rayon). Result: ~50M
env-steps/s (1v1) raw. See `docs/design-docs/improvement-plan.md` for the full
diagnosis and the measured table.

## The simulation contract

`rust/haxball_core/tests/test_fidelity.py` feeds 25k random inputs through both the
Rust core and Ursinaxball's pure-numpy `fn_base.py` and asserts agreement to 1e-9.
**This is the contract that lets us trust the speed.** Any change under `physics.rs`
must keep it green; new collision paths get a new fidelity case.

## The env interface (today, and where it's going)

`VecEnv` currently bakes the obs, reward, action decoding, and done logic directly
into `lib.rs` (fast, but monolithic). The planned evolution is an **RLGym-v2-style
decomposition** — `StateMutator` / `ObsBuilder` / `ActionParser` / `RewardFunction`
/ `DoneCondition` as composable pieces over the same `VecEnv` transition engine — so
experiments swap a reward or obs without touching the physics. The legacy package
(now deleted, recoverable from git) already modeled these interfaces in Python; they
map almost 1:1. Tracked in `docs/exec-plans/active/next-iteration.md`.

## Key invariants worth not breaking

- **Obs is side-symmetric** (target-goal / own-goal relative). One shared policy
  plays red and blue with no per-team mirroring. This is deliberate — the old
  HaxballGym double-mirror bug is documented in the next-iteration doc.
- **Velocity rewards are dense and non-zero-sum** → they prevent the no-score
  defensive collapse that pure distance/goal shaping caused under self-play.
- **`R_GOAL` magnitude is also the eval signal** (goals detected via reward sign);
  don't drop it when adding reward terms.

## Conventions

Config via `pydantic-settings` (`Settings`), console via `loguru`, metrics via the
`log()` helper (TensorBoard default, W&B optional). New code follows these so a run
is always inspectable and reproducible from env/`.env` alone.
