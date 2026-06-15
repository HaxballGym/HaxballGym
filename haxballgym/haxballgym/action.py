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

    Policy emits bins x,y in {0,1,2}; engine wants dx,dy in {-1,0,1}. The kick bin is
    passed straight through. `kick_values=2` is the standard 0/1 (release/hold). Set
    `kick_values=3` to expose the engine's intra-frame re-arm as a third action: held
    across a decision window, `2` makes the ball kick repeatedly (every kick-rate tick)
    — a "rocket" — which 0/1 can't do at tick_skip>1 (one kick on the rising edge, then
    locked until release). So 3 lets the policy pick release / single-tap / rapid-fire.
    """

    def __init__(self, kick_values: int = 2):
        self.kick_values = int(kick_values)

    def action_space(self) -> tuple[int, ...]:
        return (3, 3, self.kick_values)

    def parse_actions(self, actions: np.ndarray) -> np.ndarray:
        a = np.asarray(actions, dtype=np.int64)
        out = np.empty_like(a)
        out[..., 0] = a[..., 0] - 1
        out[..., 1] = a[..., 1] - 1
        out[..., 2] = a[..., 2]
        return out
