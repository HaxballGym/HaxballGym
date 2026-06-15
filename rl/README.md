# Train your first Haxball bot

Minimal, readable examples for [`haxballgym`](../haxballgym) — go from a fresh network to a
bot that crushes a hand-coded opponent, then play it yourself.

## Quickstart

```bash
# 1. train (a few minutes on a CPU; saves checkpoints/model.pt)
uv run rl/train.py                 # ~600 iterations
uv run rl/train.py --iters 1500    # train longer for a stronger bot

# 2. play against it (arrows to move, X/Space to kick)
uv run rl/play.py
```

You'll watch `net vs chase` climb as it trains — that's goals-for minus goals-against against a
"run at the ball and kick" baseline. A few hundred iterations is enough to comfortably beat it.

## What's here

| File | What it is |
|---|---|
| `train.py` | A self-contained **PPO self-play** trainer. The whole algorithm in ~200 lines. |
| `play.py` | A pygame window to **play against your trained model** (you're red). |

## How it works (the techniques)

All standard, published RL — nothing exotic:

- **PPO** with GAE for the policy update.
- **Self-play with an 80/20 snapshot pool** (OpenAI Five): most of the time the opponent is a
  frozen copy of the current policy; the rest of the time it's a random past snapshot, so the bot
  keeps beating older strategies and doesn't cycle.
- **Linear LR + entropy annealing** — explore early, sharpen late.

The bot is a small MLP (256×2) acting every 8 physics ticks. Because the
[engine](../rust/haxball_core) is a batched, bit-exact Rust port of Haxball, 512 matches step in
parallel and a laptop CPU does tens of thousands of environment steps per second — so this trains
fast without a GPU.

## Where to go next

`haxballgym` is fully composable — swap any piece to experiment:

- **Observations** — write your own `ObsBuilder` (see `haxballgym/obs.py`).
- **Rewards** — combine the provided reward terms, or add your own (`haxballgym/reward.py`).
- **Episode starts** — `StateMutator`s let you start from kickoff, random positions, or your own
  scenarios (`haxballgym/mutator.py`).
- **Team sizes** — the same code trains 1v1 up to 4v4 (`make_default_env(n_envs, n_red, n_blue)`).
