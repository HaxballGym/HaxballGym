# headless-bot — play against your bot in real Haxball

Hosts a **private Haxball room** with your trained policy as an opponent. You join
from the official client and play 1v1. Because `rust/haxball_core` is a bit-faithful
port of Haxball's physics, a policy trained in the sim transfers straight to a real
room — the bot reads the live room state, builds the same observation as training,
runs the (tiny) policy, and sends inputs.

`node-haxball` is used only as a thin loader for the **official** Haxball engine; all
the bot logic (`bot.js`) is ours.

## Run

```bash
npm install                                    # once
uv run export_policy.py                        # checkpoint -> policy.json (re-run after training)
HEADLESS_TOKEN=<token> node bot.js             # token from https://www.haxball.com/headlesstoken
```

It prints a room link + password (default `bot`). Join it; you get **admin** and the
game auto-starts. Chat commands: `!restart` `!start` `!stop` `!swap` `!help`.

Env knobs: `ROOM_NAME`, `ROOM_PASS`, `TICK_SKIP` (default 8), `FLIP_Y=1` (if the bot
moves up/down the wrong way).

> The bot is only as good as the checkpoint. The current one is weak (over-aggressive,
> barely beats random) — the integration is correct; a stronger policy (BC from the
> human replays, defensive reward) is the win.
