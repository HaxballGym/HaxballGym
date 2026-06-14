# HaxballGym → superhuman: diagnosis & plan

## Diagnosis (why it's slow and hard to maintain)

The three-library stack (`Ursinaxball` physics, `HaxballGym` env, `HaxballGym-tools`
training) mirrors RLGym's *old* design, but with two foundational problems:

1. **The simulator is built on a 3D game engine.** Every disc in `Ursinaxball` is
   an `ursina` / `panda3d` `Entity` (`import ursina` appears in `disc_object.py`,
   `ball_physics.py`, `player_physics.py`, … — the *state*, not just the renderer).
   Even headless, this caps a single game at low-thousands of steps/sec. This is
   the single reason it's "a million times slower" than RLGym.

2. **The training path is `SB3 SubprocVecEnv`** (one OS process per slow Python
   env) on **stable-baselines3 1.6** — the low-throughput path the RL community
   left behind for exactly this workload.

RLGym, by contrast, puts physics in a headless native core (**RocketSim**, C++)
behind a single `TransitionEngine` interface, steps envs in **batches**, and trains
with high-SPS learners. That throughput — not a cleverer algorithm — is how
Nexto/Necto reached ~SSL: tens of billions of self-play timesteps against a pool
of past policies, discrete actions, tick-skip, simple reward shaping.

## What's already done in this branch

`rust/haxball_core/` — a headless, vectorized physics core (the RocketSim-equivalent):

- Faithful Rust port of `fn_base.py`, **verified bit-for-bit (1e-9) over 25k cases**.
- Batched `VecEnv` (N matches in parallel via rayon, GIL released).
- **~50M env-steps/s (1v1) / ~18M (3v3)** raw; ~12.5M / ~6.5M through the full
  numpy `step`. vs Ursina's low-thousands → **~1,000–10,000×**, and 3v3 works.

See `rust/haxball_core/README.md` for build/run and the measured table.

## Roadmap (RLGym playbook, ordered by leverage)

1. **Collapse to one repo.** This becomes the monorepo: `rust/` (core),
   `python/haxballgym/` (env), later `web/` (WASM play). Kills the version-coupling.
2. **RLGym-v2-style API** over the core: `TransitionEngine` (= `haxball_core`) +
   `StateMutator` / `ObsBuilder` / `ActionParser` / `RewardFunction` /
   `DoneCondition`. HaxballGym's existing utils map almost 1:1 onto these.
3. **Multi-agent**: PettingZoo-parallel + one shared, permutation-invariant policy
   → 1v1 / 2v2 / 3v3 from a single network.
4. **Modern learner**: PufferLib (highest SPS for custom envs) or CleanRL PPO,
   with **self-play vs a past-policy pool** + simple soccer reward shaping
   (ball-touch, vel-to-ball, vel-ball-to-goal, goal).
5. **Play against your bot**: compile the same Rust core to **WASM**, export the
   policy to **ONNX**, run it in the browser — Haxball is a browser game, so this
   is the natural home for both the renderer and human-vs-bot.

## Realistic path to "superintelligent"

With a fast core, a solo dev on one GPU box reaches strong superhuman in days–weeks,
not years — the bottleneck was always sample throughput, which this branch removes.
