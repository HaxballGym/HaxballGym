# HaxballGym — next iteration handoff

Read [`../../design-docs/improvement-plan.md`](../../design-docs/improvement-plan.md),
[`../../../ARCHITECTURE.md`](../../../ARCHITECTURE.md), `rust/haxball_core/README.md`,
and `rl/README.md` first. This file is the prioritized to-do for whoever picks it up
next.

## Where things stand (works, committed, verified)

- **`rust/haxball_core/`** — headless, vectorized physics core (RocketSim-equivalent).
  Faithful Rust port of Ursinaxball's `fn_base.py`, **verified bit-for-bit to 1e-9**
  (`tests/test_fidelity.py`). Batched `VecEnv` via rayon: ~50M env-steps/s (1v1),
  ~18M (3v3). `step(actions)` returns obs/reward/done; obs is goal-relative &
  side-aware (one shared net plays red & blue, no per-team mirroring). `tick_skip`
  and velocity rewards live in `src/lib.rs`.
- **`rl/`** — PPO (CleanRL-style) on the core. Rewards = WazBot's CombinedReward
  (VelocityPlayerToBall + VelocityBallToGoal). `play.py` = human vs model;
  `render_demo.py` = headless GIF; `opponents.py` = chase bot (with angular jiggle).
  A trained checkpoint ships in `rl/checkpoints/`.

## The open problem to solve first

**The model loses to the chase bot (`opponents.chase_bins`), ~90:500, and doesn't
climb.** The chase bot beelines to the ball and kicks it goalward; the current
reward is **offense-only** (ball toward *opponent* goal + go-to-ball), so the agent
has almost no incentive to defend. Fixes, in order:

1. **Add a defensive reward term.** Options (do the cheap ones first, they're in
   `rust/haxball_core/src/lib.rs` reward block):
   - penalize ball velocity toward *own* goal (mirror of VelocityBallToGoal with
     `own_goal=True`), and/or
   - reward for being positioned between ball and own goal, and/or
   - a save/possession term. Keep the terminal goal reward (eval detects goals via
     reward sign `>1 / <-1`, so don't drop `R_GOAL`).
2. **Curriculum.** Start vs random/static (learns offense fast — verified ~seconds),
   then phase in the chase bot, then self-play vs a past-policy pool. Pure-chase from
   scratch stalls.
3. **Train longer / tune.** The chase bot is a strong pursuit policy; 1M decisions
   isn't enough. Try more iters, higher entropy early, LR schedule. Consider MPS only
   if batch grows (small MLP → CPU was faster: ~46–78k dec/s).

## Backlog (independent, roughly by leverage)

- **Behavioral cloning from the 21k human replays** (`~/Downloads/1v1_recs.zip`,
  21,394 `.hbr2`, custom stadium "[DNA] Classic 1vs1"). Container is decoded
  (`rl/replays.py`: HBR2 v3, `uint32` frame count, raw-DEFLATE from byte 12). **Remaining:
  port a Haxball event-stream reader into `replays.parse_events()`** to get per-frame
  input masks (try github `mertushka/haxball-replay-reader`, or dump via Haxball
  Headless). Then re-simulate through the core to build `(obs, action)` and run
  `rl/bc_train.py` → PPO finetunes from it (the Necto recipe). NOTE the BC obs must
  use the replays' stadium, not default classic.
- **Wire curved segments into collision** (`physics.rs` `resolve_collisions`). The
  curve math is ported & unit-tested (`segment_curve` / `segment_apply_bias`), and the
  `.hbs` loader already parses curved segments — it just **skips** them today (goal-net
  arcs, kickoff semicircles; logged with a count). Add a `curve` field to the `Segment`
  struct + circle center/radius/angles, and resolve disc-vs-arc to finish them. Until
  then maps load fine (curved pieces are cosmetic / kickoff-only for training).
- ~~**`.hbs` stadium loader**~~ **DONE.** `haxball_core::stadium` parses any `.hbs`
  (serde, trait resolution, defaults, y-symmetry, collision flags) →
  `VecEnv.from_hbs(text, ...)`. `haxballgym.make_default_env(stadium="futsal-classic")`
  or any `.hbs` path. Classic-loaded is bit-identical to the built-in classic
  (`haxballgym/tests/test_stadium_loader.py`). Obs/reward are stadium-driven (goal
  geometry from `VecEnv.goals()`), so the same policy setup trains on any map.
- **2v2 / 3v3**: the core already supports N players and the obs already includes other
  players; wrap a PettingZoo-parallel API and train the shared policy at larger team sizes.
- **WASM + ONNX**: compile `haxball_core` to WASM (wasm-bindgen) + export the policy to
  ONNX → play the bot in-browser (Haxball is a browser game; this is the real
  "play against your bot" target).

## Gotchas / lessons (don't relearn the hard way)

- **Velocity rewards are essential.** Distance/goal-only shaping collapsed into a
  no-score defensive equilibrium under self-play. VelocityPlayerToBall is dense AND
  non-zero-sum, which keeps both agents engaged.
- **Shared-policy self-play vs the *current* policy collapses** (saw 20:0 → 0:0). Use a
  past-policy pool, or scripted/curriculum opponents.
- **Obs is side-symmetric by design** (target/own-goal relative), so a policy trained on
  one side transfers — this is the opposite of the old HaxballGym red/blue bug.
- **Old HaxballGym red/blue bug** (for the collaborator): it mirrors blue **twice**
  (`DefaultObs` flips x AND `Match.parse_actions` flips `action[0]`) — a user-added flip
  double-flips. Also `DefaultObs._add_player_to_obs` flips each entity by ITS OWN team,
  not the ego's, so the enemy lands in the wrong frame (hurts dribble reading); and
  `game.team_kickoff` resets to RED every episode.
- Build: `cd rust/haxball_core && uv run maturin develop --release`. `cargo build` alone
  fails to link (PyO3 extension-module needs maturin's linker flags) — that's expected.
- Don't fan out a swarm of research agents; the owner prefers tight, in-loop work.
