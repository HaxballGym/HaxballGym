# Env API — RLGym-v2, adapted for a batched core

## What RLGym 2.0 does (the inspiration)

RLGym 2.0 is a small, fully generic API. An environment is one `RLGym` object
composed of swappable pieces, each a class with `reset(...)` + a per-step method,
all threaded through a shared `GameState` and a `shared_info` dict:

| Component | Per-step method | Role |
|---|---|---|
| `TransitionEngine` | `step(actions, shared_info) -> state` | the simulator (RocketSim). Owns `state`, `create_base_state()`, `reset(initial_state)`. |
| `StateMutator` | `apply(state, shared_info)` | mutate the base state on reset (team sizes, kickoff layout). |
| `ObsBuilder` | `build_obs(agents, state, shared_info) -> {agent: obs}` | state → policy input. |
| `ActionParser` | `parse_actions(actions, state, shared_info) -> {agent: engine_action}` | policy output → engine input. |
| `RewardFunction` | `get_rewards(agents, state, is_terminated, is_truncated, shared_info) -> {agent: r}` | reward shaping. |
| `DoneCondition` | `is_done(agents, state, shared_info) -> {agent: bool}` | **two** of these: `termination_cond` (real terminal, e.g. goal) and `truncation_cond` (timeout). |

`RLGym(state_mutator, obs_builder, action_parser, reward_fn, termination_cond,
truncation_cond, transition_engine)`. `reset() -> {agent: obs}`;
`step(actions) -> (obs, rewards, terminated, truncated, info)`, all agent-keyed
dicts. Rewards compose: `CombinedReward((RewardA(), wA), (RewardB(), wB), ...)`.
Conditions compose: `AnyTerminationCondition(...)`. State setup composes:
`MutatorSequence(...)`. Scale comes from an **external** vectorized layer
(`rlgym-ppo` spawns many single-env `RLGym` instances across processes).

## What we change, and why

Our reason to exist is throughput: `haxball_core` steps **N matches in one
in-process batch** (rayon, GIL released). Per-env Python dicts over thousands of
agents would throw that away. So we keep RLGym's **decomposition, names, and
the termination/truncation split**, but make every component **batched-native**:
it operates on a whole batch at once and returns numpy arrays, not per-agent dicts.

| RLGym (per-env) | Here (batched) |
|---|---|
| `state`: one `GameState` | `GameState`: arrays `ball_pos (N,2)`, `ball_vel (N,2)`, `player_pos (N,P,2)`, `player_vel (N,P,2)`, `player_team (N,P)`, `scored (N,)`, `steps (N,)` |
| `build_obs(...) -> {agent: obs}` | `build_obs(state) -> (N, P, obs_dim)` |
| `parse_actions(...) -> {agent: ea}` | `parse_actions(actions) -> (N, P, 3)` engine input |
| `get_rewards(...) -> {agent: r}` | `get_rewards(state, prev, term, trunc) -> (N, P)` |
| `is_done(...) -> {agent: bool}` | `is_done(state) -> (N,)` (termination & truncation kept separate) |
| `StateMutator.apply(state)` | `apply(engine, mask)` — reset the masked envs in place |
| external multi-process vec layer | built in: the engine *is* the batch |

This is the same mental model a RLGym user already has — drop in a different
`RewardFunction` and nothing else changes — but it runs vectorized.

## The split (who owns what)

- **Rust `TransitionEngine`** (`haxball_core`): physics only. Steps `tick_skip`
  ticks, returns the batched `GameState` arrays, resets masked envs. No obs, no
  reward, no done — those leave the core. Keeps the 1e-9 fidelity contract.
- **Python components** (`haxballgym/`): `DefaultObs`, `CombinedReward` +
  `VelocityPlayerToBall` / `VelocityBallToGoal` / `GoalReward`, `DiscreteAction`,
  `GoalCondition` (termination) + `TimeoutCondition` (truncation), `KickoffMutator`.
  Each is plain vectorized numpy — readable and swappable.
- **`Env`** composes them and exposes `reset()` / `step(actions)` returning batched
  arrays, with gym-style auto-reset of done envs.

Goal geometry, `player_max_speed`, and team layout are engine truth and are read
from the engine; obs normalization coefficients are `DefaultObs` parameters (as in
RLGym's `DefaultObs(pos_coef=..., lin_vel_coef=...)`).

## Where it lives

The split above is what ships today: the Rust core (`haxball_core`) is physics +
batched `GameState` only, and the env components (`DefaultObs`, the reward terms,
`DiscreteAction`, `GoalCondition`/`TimeoutCondition`, `KickoffMutator`) are plain
vectorized numpy in `haxballgym/`. `make_default_env(...)` wires them into an `Env`
with the defaults that reproduce the original baked-in obs/reward (parity-tested to
the same trajectories). Swap any component without touching the core.
