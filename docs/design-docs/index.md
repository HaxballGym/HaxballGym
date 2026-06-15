# Design docs

Rationale and lessons — the *why* behind the code, and the mistakes already paid
for so they aren't repeated. Code is the system of record; these explain decisions
the code can't.

## Index

- [`env-api.md`](env-api.md) — the engine/env surface: how the batched Rust core,
  the composable obs/reward/action/done layer, and the RLGym-v2 decomposition fit
  together.

## Core beliefs

1. **Throughput is the lever, not the algorithm.** The strongest self-play bots reach
   their level with simple PPO plus an enormous volume of self-play against a
   past-policy pool. The native batched core exists to make that volume reachable on
   one machine.
2. **The simulator must be byte-faithful.** A fast sim that doesn't match the real
   game teaches the bot the wrong game. `test_fidelity.py` (1e-9) is non-negotiable.
3. **One source of truth, compiled many ways.** The same Rust core can power training
   today and in-browser play (WASM) later — no second physics implementation to keep
   in sync.
4. **Composable env pieces.** Obs/reward/action/done should be swappable without
   touching physics (the RLGym-v2 decomposition; see `ARCHITECTURE.md`).

## Lessons paid for (don't relearn)

Read these before changing the reward, the obs, or the self-play setup:

- **Velocity-to-ball / ball-to-goal rewards prevent defensive collapse.** A pure
  goal-difference reward in 1v1 lets both agents learn to sit on their own goal; dense,
  non-zero-sum velocity terms keep them engaged.
- **Self-play against *only* the current policy collapses.** The policy chases its own
  latest weaknesses and cycles. Mix in a pool of past snapshots (the 80/20 pool).
- **Mind the red/blue symmetry.** One network plays both sides, so the observation must
  be mirrored for one team and the action un-mirrored on the way out — a double-mirror
  bug silently halves your effective data.
- **The Rust core must be rebuilt after edits.** `uv sync --reinstall-package
  haxball-core` recompiles the extension; forgetting it runs stale physics.
