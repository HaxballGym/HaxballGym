# Reverse Engineering Haxball

This directory contains the obfuscated code of Haxball.

## Use of this folder

Use this folder in order to:

- Replicate perfectly the replay system of HaxBall to exploit the 20k 1v1 replays
- Understand how to edit the headless part to deploy a room, so that we can run bots in it
- Being able to load any map so that we can train on them

## Progress

- **Load any map → DONE.** The `.hbs` (JSON) stadium format is implemented in
  `rust/haxball_core/src/stadium.rs`; train on any map via
  `haxballgym.make_default_env(stadium=...)`.
- **Replay system → reverse-engineered.** `recording.js` is the clean, de-obfuscated
  `.hbr2` reader extracted from `game-min.js`. The container, timeline-marker log,
  RoomState scalar prefix, action-log framing, the full 24-action table, and the
  player-input action (type 1, a 1-byte mask) are cracked and **verified on the real
  files** (the room name parses to exactly `[DNA] Classic 1vs1`). Ported into
  `rl/replays.py`. Remaining: the stadium *binary* sub-reader (`q.na`) to skip the
  RoomState and reach the action log — a direct port of the `.hbs` fields above.
- **Headless room / bot deployment** — not started (`headless.js` is here for it).

## Legal

We have the explicit permission of Mario Carbajal to use this code for research purposes.
