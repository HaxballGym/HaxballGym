"""Done conditions. Batched: `is_done(state) -> (N,) bool`. Termination (a real
terminal, e.g. a goal) and truncation (a timeout) are kept separate, as in RLGym.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .state import GameState


class DoneCondition(ABC):
    @abstractmethod
    def is_done(self, state: GameState) -> np.ndarray: ...

    def reset(self, state: GameState) -> None:  # noqa: B027
        pass


class GoalCondition(DoneCondition):
    """Terminal: a goal was scored this step."""

    def is_done(self, state: GameState) -> np.ndarray:
        return state.scored != -1


class TimeoutCondition(DoneCondition):
    """Truncation: the episode hit the tick budget."""

    def __init__(self, step_limit: int):
        self.step_limit = step_limit

    def is_done(self, state: GameState) -> np.ndarray:
        return state.steps >= self.step_limit
