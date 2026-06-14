"""Action parsers. Batched: `parse_actions(policy_actions) -> engine (N, P, 3)`."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np


class ActionParser(ABC):
    @abstractmethod
    def action_space(self) -> tuple[int, ...]: ...

    @abstractmethod
    def parse_actions(self, actions: np.ndarray) -> np.ndarray: ...

    def reset(self, state) -> None:  # noqa: B027
        pass


class DiscreteAction(ActionParser):
    """3 categorical bins per agent -> engine input (dx, dy, kick).

    Policy emits bins x,y in {0,1,2} and kick in {0,1}; engine wants
    dx,dy in {-1,0,1} and kick in {0,1}. (Matches `decode()` in the old train.py.)
    """

    def action_space(self) -> tuple[int, ...]:
        return (3, 3, 2)

    def parse_actions(self, actions: np.ndarray) -> np.ndarray:
        a = np.asarray(actions, dtype=np.int64)
        out = np.empty_like(a)
        out[..., 0] = a[..., 0] - 1
        out[..., 1] = a[..., 1] - 1
        out[..., 2] = a[..., 2]
        return out
