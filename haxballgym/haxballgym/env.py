"""`Env` — composes the engine + components into a batched, RLGym-v2-style env.

`step(actions)` returns `(obs, rewards, terminated, truncated)`, all batched arrays.
Done envs auto-reset (gym-style): rewards are computed on the terminal state, then
the env is reset and the returned obs is the fresh post-reset observation.
"""

from __future__ import annotations

from dataclasses import replace

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
        action_stack: int = 0,
        continuous: bool = False,
        max_steps: int = 0,
    ):
        self.engine = engine
        self.obs_builder = obs_builder
        self.action_parser = action_parser
        self.reward_fn = reward_fn
        self.termination_cond = termination_cond
        self.truncation_cond = truncation_cond
        self.state_mutator = state_mutator
        self.prev_state = None
        # Continuous play (Nexto/Seer-style): a goal re-kickoffs but does NOT end the episode; the
        # episode runs `max_steps` decisions, spanning many goals/kickoffs. A re-kickoff zeros the
        # engine's tick counter, so we keep our own per-env decision clock `_ep`.
        self.continuous = bool(continuous)
        self.max_steps = int(max_steps)
        if self.continuous and self.max_steps <= 0:
            raise ValueError(
                "continuous=True needs max_steps > 0 (the episode length in decisions, spanning "
                f"many goals/kickoffs); got {self.max_steps}. Without it every step would time out."
            )
        self._ep = np.zeros(self.engine.n_envs, dtype=np.int64)  # per-env decision clock
        # DefaultObs mirrors the x-axis for blue (so both sides see "attacking +x");
        # undo that mirror on the action's dx so blue moves the right way in the world.
        self._mirror_x = np.where(engine._teams == RED, 1, -1)  # (N, P): +1 red, -1 blue
        # Action stacking (Lucy-SKG): append the last `action_stack` actions to each
        # player's obs, giving the policy short-term memory of what it just did.
        self.action_stack = int(action_stack)
        self._act_buf: np.ndarray | None = None  # (N, P, action_stack*3)

    # --- spaces / shapes ---
    @property
    def n_envs(self) -> int:
        return self.engine.n_envs

    @property
    def n_players(self) -> int:
        return self.engine.n_players

    @property
    def obs_dim(self) -> int:
        return self.obs_builder.obs_dim(self.n_players) + 3 * self.action_stack

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
        self._ep = np.zeros(self.n_envs, dtype=np.int64)
        obs = self.obs_builder.build_obs(state)
        if self.action_stack:
            self._act_buf = np.zeros((self.n_envs, self.n_players, 3 * self.action_stack), dtype=np.float32)
            obs = np.concatenate([obs, self._act_buf], axis=-1)
        return obs

    def step(self, actions: np.ndarray):
        engine_actions = self.action_parser.parse_actions(actions)
        engine_actions[..., 0] *= self._mirror_x  # un-mirror dx for blue
        state = self.engine.step(engine_actions)
        scored = state.scored  # who conceded THIS step; preserved across the auto-reset below

        terminated = self.termination_cond.is_done(state)  # (N,) goal scored this step
        # In continuous mode this engine-tick `truncated` is overridden below by the decision
        # clock (`_ep >= max_steps`); it still feeds the reward fn here, but the value RETURNED
        # to the caller comes from the clock, so `truncation_cond` does not govern truncation then.
        truncated = self.truncation_cond.is_done(state)  # (N,) engine-tick timeout
        rewards = self.reward_fn.get_rewards(state, self.prev_state, terminated, truncated)

        if self.continuous:
            # a goal is NOT terminal here: the Rust core runs the 150-tick goal celebration
            # (game-min.js Cb==2) and then re-kickoffs itself (conceding team, score kept), exactly
            # as a live game / the replay does — the env just keeps stepping. The episode ends only
            # on our own decision clock (which survives the engine's goal re-kickoffs); a timeout
            # does a full reset (new game). `terminated` (the goal flag) is kept above only so the
            # reward fn sees the goal, then zeroed.
            self._ep += 1
            timeout = self._ep >= self.max_steps
            if timeout.any():
                self.state_mutator.reset_mask(self.engine, timeout)
                # post-reset positions, but keep THIS step's `scored` (the reset would zero it,
                # making goals invisible to metrics/eval that read `state.scored`).
                state = replace(self.engine.snapshot(), scored=scored)
            self._ep[timeout] = 0
            rekickoff = timeout  # clear action history only on a real episode reset
            terminated = np.zeros_like(terminated)
            truncated = timeout
        else:
            rekickoff = terminated | truncated
            if rekickoff.any():
                self.state_mutator.reset_mask(self.engine, rekickoff)
                # post-reset positions, but keep THIS step's `scored` (the reset would zero it,
                # making goals invisible to metrics/eval that read `state.scored`).
                state = replace(self.engine.snapshot(), scored=scored)

        obs = self.obs_builder.build_obs(state)
        if self.action_stack:
            # roll the buffer: drop the oldest action, append this tick's (centered to
            # [-1,1] for dx/dy). The actions are in policy frame (mirror-consistent obs).
            buf = self._act_buf
            assert buf is not None  # initialized in reset() whenever action_stack > 0
            a = np.asarray(actions, dtype=np.float32).copy()
            a[..., 0] -= 1.0
            a[..., 1] -= 1.0
            buf = np.concatenate([buf[..., 3:], a], axis=-1)
            if rekickoff.any():
                buf[rekickoff] = 0.0  # fresh kickoff (goal or episode end) -> no action history
            self._act_buf = buf
            obs = np.concatenate([obs, buf], axis=-1)
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
    kick_values: int = 2,
) -> Env:
    """A sensible baseline setup (1v1 by default; pass n_red/n_blue for team modes): the bundled
    CombinedReward, DefaultObs, discrete actions, goal-or-timeout episodes. Swap any piece to
    experiment. `stadium` picks the map (bundled name or .hbs path); None = built-in classic.
    `kick_values=3` exposes the engine's rapid-fire "rocket" kick as a third action."""
    engine = TransitionEngine(
        n_envs, n_red, n_blue, step_limit=step_limit, tick_skip=tick_skip, stadium=stadium
    )
    return Env(
        engine=engine,
        obs_builder=DefaultObs(),
        action_parser=DiscreteAction(kick_values=kick_values),
        reward_fn=CombinedReward(
            (VelocityPlayerToBall(), 1.0),
            (VelocityBallToGoal(), 1.0),
            (GoalReward(), goal_weight),
        ),
        termination_cond=GoalCondition(),
        truncation_cond=TimeoutCondition(step_limit),
        state_mutator=KickoffMutator(),
    )
