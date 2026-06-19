# Architecture

This repo follows the **RLGym playbook**: put the physics in a fast, headless,
native core behind one interface, step it in batches, and train a high-throughput
learner against it. Everything below serves that one idea — throughput, not a
cleverer algorithm, is what reaches superhuman.

## Layers (dependencies point downward only)

```
┌─────────────────────────────────────────────────────────────┐
│  rl/            example scripts: PPO self-play · play vs model │   Python
│                 (train.py · play.py)                          │
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
```

**Rule:** dependencies point downward only — `rl/` → `haxballgym` → `haxball_core`;
the core depends on nothing above it. A change that makes a lower layer import from a
higher one, or that runs game-engine/render code inside the core, is an architecture
violation — it reintroduces the slowness this whole design exists to kill.

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
env-steps/s (1v1) raw — orders of magnitude faster, which is the whole reason
strong self-play is reachable on a single machine.

## The simulation contract

`haxballgym/tests/test_real_engine.py` is the authoritative check: it replays ball
trajectories captured from the **real Haxball engine** (game-min.js, via node-haxball —
see `headless-bot/nh_oracle.js`) and asserts the Rust port reproduces them **bit-for-bit**
(zero difference, every tick), on the official stadiums including curved walls. This holds
because every op on the trajectory path is correctly-rounded f64 (+,-,*,/,sqrt) or the curve
cotangent via the pure-Rust `libm::tan` (matching V8 deterministically across targets).
`rust/haxball_core/tests/test_fidelity.py` additionally feeds 25k random inputs through both
the Rust core and Ursinaxball's pure-numpy `fn_base.py` and asserts agreement to 1e-9.
**These are the contract that lets us trust the speed.** Any change under `physics.rs` must
keep them green; new collision paths get a new fidelity case.

## The env interface

The Rust `VecEnv` is a pure **transition engine** — physics + batched state, nothing
else (no obs, no reward, no done). Everything else lives in the `haxballgym` Python
package as an **RLGym-v2-style decomposition**: `StateMutator` / `ObsBuilder` /
`ActionParser` / `RewardFunction` / `DoneCondition` are composable pieces over the
same engine, so an experiment swaps a reward or obs without touching the physics.
See `docs/design-docs/env-api.md` for the full surface.

## Key invariants worth not breaking

- **Obs is side-symmetric** (target-goal / own-goal relative). One shared policy
  plays red and blue with no per-team mirroring. This is deliberate — a naive
  per-team mirror is easy to apply twice (once on the obs, once on the action) and
  silently halves your effective data.
- **Velocity rewards are dense and non-zero-sum** → they prevent the no-score
  defensive collapse that pure distance/goal shaping caused under self-play.
- **`R_GOAL` magnitude is also the eval signal** (goals detected via reward sign);
  don't drop it when adding reward terms.

## Conventions

`haxballgym` stays dependency-light (numpy + the core) and fully batched — every
obs/reward/done operates on `(N, P, …)` arrays, never a per-env Python loop. The
`rl/` scripts are deliberately self-contained and dependency-light (numpy + torch +
pygame) so they read as a starting point you can copy and extend, not a framework.
