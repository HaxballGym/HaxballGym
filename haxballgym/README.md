# haxballgym

A composable, batched, **RLGym-v2-style** reinforcement-learning environment for
**Haxball**, built on top of the headless [`haxball_core`](https://pypi.org/project/haxball-core/)
physics engine.

The physics is a faithful Rust port of Haxball's, verified to agree with the original
engine to within 1e-9, and stepped in batches of thousands of matches in parallel —
fast enough for serious self-play on a single machine.

## Install

```bash
pip install haxballgym
```

This pulls in `haxball_core` (the Rust engine) automatically.

## Quick start

```python
from haxballgym import make_default_env

env = make_default_env(n_envs=512)
obs = env.reset()
obs, rewards, terminated, truncated = env.step(actions)
```

Or compose your own environment from the pieces — engine plus obs / action / reward
/ done / state-mutator builders:

```python
from haxballgym import (
    TransitionEngine, DefaultObs, DiscreteAction,
    CombinedReward, GoalReward, TouchReward,
    GoalCondition, TimeoutCondition, KickoffMutator, Env,
)
```

See the [project repository](https://github.com/HaxballGym/HaxballGym) for the full
docs, runnable training examples, and tools to play your trained policy back in the
real browser game.

## License

MIT
