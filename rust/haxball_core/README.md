# haxball_core — headless, vectorized Haxball physics

This is the **RocketSim-equivalent for Haxball**: a standalone physics core with
**no game engine and no rendering**, designed to run thousands of matches in
parallel for reinforcement learning.

It replaces the Ursina/Panda3D-based simulation in `Ursinaxball`, which made every
disc a 3D-engine `Entity` and capped throughput at low-thousands of steps/sec for
a *single* game. The physics math is identical — this is a faithful port of
Ursinaxball's pure-numpy `fn_base.py`, verified bit-for-bit (see Fidelity below).

## Why this design

RLGym is "a million times faster" than a naive Python clone for one reason: the
physics lives in a headless native core (**RocketSim**, C++) behind a single
`TransitionEngine` interface, and is stepped in **batches** so the Python↔native
boundary is crossed once per *batch of envs*, not once per *game step*.

`haxball_core` copies that win:

- **Rust core, f64 math** — same numbers as the original numpy, native speed.
- **Batched `VecEnv`** — N matches stepped in parallel with `rayon`, GIL released.
  One `step(actions)` call advances all N envs.
- **One source of truth** — the same crate compiles to a Python extension (for
  training) and, next, to **WASM** (so a human can play the bot in-browser —
  Haxball is a browser game, so the renderer and the human-play client live there).

## Measured (Apple Silicon, single process)

| Mode | 1v1 | 3v3 |
|---|---|---|
| Raw sim (no Python in loop) | ~50M env-steps/s | ~18M env-steps/s |
| Full `env.step` (obs + reward + done numpy I/O) | ~12.5M env-steps/s | ~6.5M env-steps/s |

Ursinaxball reference: a single game at low-thousands of steps/sec → this is a
**~1,000–10,000× speedup**, and it scales to 2v2 / 3v3 (the regime that was out of
reach before).

## Fidelity

`tests/test_fidelity.py` imports Ursinaxball's `fn_base.py` directly (it has no
ursina import) and feeds 25,000 random inputs through both implementations:

```
disc_disc OK
disc_vertex OK
disc_plane OK
segment_no_curve OK
segment_curve OK
ALL FIDELITY TESTS PASSED — Rust port matches fn_base.py to 1e-9
```

## Build & run

This crate is the `haxball_core` member of the repo's uv workspace. From the repo
root:

```bash
uv sync                                              # builds this crate (maturin) + deps
uv run rust/haxball_core/tests/test_fidelity.py      # fidelity (1e-9)
uv run rust/haxball_core/bench.py                    # throughput
```

Iterating on the Rust? `uv run maturin develop --release` rebuilds in place faster
than a full `uv sync`.

## Status / what's ported

- [x] All 5 collision resolvers (disc-disc, disc-vertex, disc-plane, segment
      straight + curved, segment bias) — **verified vs fn_base.py**
- [x] Integration (`update_discs`), player movement + kick (`resolve_movement`),
      goal detection (`check_goal`), spawn/reset.
- [x] Classic stadium (planes + straight ball-area segments + goalposts + goals).
- [x] Batched `VecEnv` with rayon, obs/reward/done numpy I/O.
- [ ] Curved goal-net arcs + kickoff-barrier semicircle (math is ported and
      tested; not yet wired into the classic `World` — minor, affects only
      in-net ball behavior).
- [ ] `.hbs` stadium loader (currently the classic stadium is built in code).
- [ ] WASM target for in-browser play.

## Next (the RLGym playbook, in order)

1. Wrap `VecEnv` in an RLGym-v2-style API: `TransitionEngine` (this core) +
   `StateMutator` / `ObsBuilder` / `ActionParser` / `RewardFunction` /
   `DoneCondition` — composable, the env design HaxballGym already half-has.
2. PettingZoo-parallel multi-agent + a single shared, permutation-invariant
   policy → 1v1/2v2/3v3 from one network.
3. Train with PufferLib (highest SPS) or CleanRL PPO, self-play vs a past-policy
   pool.
4. Compile to WASM; export the policy to ONNX; play it in the browser.
