# Design docs

Rationale and lessons — the *why* behind the code, and the mistakes already paid
for so they aren't repeated. Code is the system of record; these explain decisions
the code can't.

## Index

- [`improvement-plan.md`](improvement-plan.md) — the original diagnosis (why the old
  stack was ~1000× too slow) and the RLGym-playbook roadmap. The founding document.

## Core beliefs

1. **Throughput is the lever, not the algorithm.** Nexto/Necto reached ~SSL with
   simple PPO + tens of billions of self-play steps against a past-policy pool. The
   native batched core exists to make that volume reachable on one machine.
2. **The simulator must be byte-faithful.** A fast sim that doesn't match the real
   game teaches the bot the wrong game. `test_fidelity.py` (1e-9) is non-negotiable.
3. **One source of truth, compiled many ways.** The same Rust core powers training
   today and in-browser play (WASM) later — no second physics implementation to keep
   in sync.
4. **Composable env pieces.** Obs/reward/action/done should be swappable without
   touching physics (the RLGym-v2 decomposition; see `ARCHITECTURE.md`).

## Lessons paid for (don't relearn)

These live in detail in [`../exec-plans/active/next-iteration.md`](../exec-plans/active/next-iteration.md)
under "Gotchas / lessons" — velocity rewards prevent defensive collapse, self-play
vs the *current* policy collapses (use a past-policy pool), the old red/blue
double-mirror bug, and the maturin build requirement. Read them before changing the
reward, the obs, or the self-play setup.
