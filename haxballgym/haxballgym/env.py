"""`Env` — composes the engine + components into a batched, RLGym-v2-style env.

`step(actions)` returns `(obs, rewards, terminated, truncated)`, all batched arrays.
Done envs auto-reset (gym-style): rewards are computed on the terminal state, then
the env is reset and the returned obs is the fresh post-reset observation.
"""

from __future__ import annotations

import numpy as np

from .action import ActionParser, DiscreteAction
from .done import DoneCondition, GoalCondition, TimeoutCondition
from .engine import TransitionEngine
from .mutator import KickoffMutator, StateMutator
from .obs import DefaultObs, ObsBuilder
from .reward import (
    CombinedReward,
    GoalReward,
    RewardFunction,
    VelocityBallToGoal,
    VelocityPlayerToBall,
)
from .state import RED


class Env:
    def __init__(
        self,
        engine: TransitionEngine,
        obs_builder: ObsBuilder,
        action_parser: ActionParser,
        reward_fn: RewardFunction,
        termination_cond: DoneCondition,
        truncation_cond: DoneCondition,
        state_mutator: StateMutator,
    ):
        self.engine = engine
        self.obs_builder = obs_builder
        self.action_parser = action_parser
        self.reward_fn = reward_fn
        self.termination_cond = termination_cond
        self.truncation_cond = truncation_cond
        self.state_mutator = state_mutator
        self.prev_state = None
        # DefaultObs mirrors the x-axis for blue (so both sides see "attacking +x");
        # undo that mirror on the action's dx so blue moves the right way in the world.
        self._mirror_x = np.where(engine._teams == RED, 1, -1)  # (N, P): +1 red, -1 blue

    # --- spaces / shapes ---
    @property
    def n_envs(self) -> int:
        return self.engine.n_envs

    @property
    def n_players(self) -> int:
        return self.engine.n_players

    @property
    def obs_dim(self) -> int:
        return self.obs_builder.obs_dim(self.n_players)

    @property
    def action_space(self) -> tuple[int, ...]:
        return self.action_parser.action_space()

    # --- gym loop ---
    def reset(self) -> np.ndarray:
        state = self.state_mutator.reset_all(self.engine)
        for c in (
            self.obs_builder,
            self.action_parser,
            self.reward_fn,
            self.termination_cond,
            self.truncation_cond,
        ):
            c.reset(state)
        self.prev_state = state
        return self.obs_builder.build_obs(state)

    def step(self, actions: np.ndarray):
        engine_actions = self.action_parser.parse_actions(actions)
        engine_actions[..., 0] *= self._mirror_x  # un-mirror dx for blue
        state = self.engine.step(engine_actions)

        terminated = self.termination_cond.is_done(state)  # (N,)
        truncated = self.truncation_cond.is_done(state)  # (N,)
        rewards = self.reward_fn.get_rewards(state, self.prev_state, terminated, truncated)

        done = terminated | truncated
        if done.any():
            self.state_mutator.reset_mask(self.engine, done)
            state = self.engine.snapshot()  # refreshed post-reset

        obs = self.obs_builder.build_obs(state)
        self.prev_state = state
        return obs, rewards, terminated, truncated


def make_default_env(
    n_envs: int,
    n_red: int = 1,
    n_blue: int = 1,
    step_limit: int = 2000,
    tick_skip: int = 8,
    goal_weight: float = 5.0,
    stadium: str | None = None,
) -> Env:
    """The current baseline 1v1 setup: WazBot's CombinedReward, DefaultObs,
    discrete actions, goal-or-timeout episodes. Swap any piece to experiment.
    `stadium` picks the map (bundled name or .hbs path); None = built-in classic."""
    engine = TransitionEngine(
        n_envs, n_red, n_blue, step_limit=step_limit, tick_skip=tick_skip, stadium=stadium
    )
    return Env(
        engine=engine,
        obs_builder=DefaultObs(),
        action_parser=DiscreteAction(),
        reward_fn=CombinedReward(
            (VelocityPlayerToBall(), 1.0),
            (VelocityBallToGoal(), 1.0),
            (GoalReward(), goal_weight),
        ),
        termination_cond=GoalCondition(),
        truncation_cond=TimeoutCondition(step_limit),
        state_mutator=KickoffMutator(),
    )
