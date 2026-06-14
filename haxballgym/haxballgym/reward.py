"""Reward functions. Batched: `get_rewards(state, prev, term, trunc) -> (N, P)`.

Ports WazBot's CombinedReward (the proven Haxball shaping): dense, non-zero-sum
velocity terms keep both agents engaged (no defensive collapse), plus a terminal
goal bonus. Composes exactly like RLGym's `CombinedReward((fn, weight), ...)`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .state import GameState, closest_on_line


class RewardFunction(ABC):
    @abstractmethod
    def get_rewards(
        self, state: GameState, prev: GameState | None, terminated: np.ndarray, truncated: np.ndarray
    ) -> np.ndarray: ...

    def reset(self, state: GameState) -> None:  # noqa: B027
        pass


class VelocityPlayerToBall(RewardFunction):
    """Reward speed of each player projected onto the direction to the ball."""

    def get_rewards(self, state, prev, terminated, truncated):
        pd = state.ball_pos[:, None, :] - state.player_pos  # (N,P,2)
        npd = np.maximum(np.linalg.norm(pd, axis=-1, keepdims=True), 1e-9)
        proj = np.sum((pd / npd) * state.player_vel, axis=-1)  # (N,P)
        return proj / state.player_max_speed


class VelocityBallToGoal(RewardFunction):
    """Reward ball speed toward the nearest point of the *attacked* goal line
    (side-aware per player, geometry from the stadium — works on any map)."""

    def get_rewards(self, state, prev, terminated, truncated):
        p0, p1 = state.goal_line(attacked=True)  # (N,P,2) each
        ball = state.ball_pos[:, None, :]  # (N,1,2)
        target = closest_on_line(ball, p0, p1)  # (N,P,2)
        bd = target - ball  # (N,P,2)
        nbd = np.maximum(np.linalg.norm(bd, axis=-1, keepdims=True), 1e-9)
        proj = np.sum((bd / nbd) * state.ball_vel[:, None, :], axis=-1)  # (N,P)
        return proj / state.player_max_speed


class GoalReward(RewardFunction):
    """+1 for the scoring team, -1 for the conceding team, 0 otherwise."""

    def get_rewards(self, state, prev, terminated, truncated):
        has_goal = (state.scored != -1)[:, None]  # (N,1)
        conceding = state.scored[:, None]  # (N,1) team flag
        return np.where(has_goal, np.where(state.team == conceding, -1.0, 1.0), 0.0)


class CombinedReward(RewardFunction):
    def __init__(self, *terms: tuple[RewardFunction, float]):
        self.terms = terms

    def reset(self, state):
        for fn, _ in self.terms:
            fn.reset(state)

    def get_rewards(self, state, prev, terminated, truncated):
        total = np.zeros((state.n_envs, state.n_players), dtype=np.float32)
        for fn, w in self.terms:
            total += w * fn.get_rewards(state, prev, terminated, truncated)
        return total
