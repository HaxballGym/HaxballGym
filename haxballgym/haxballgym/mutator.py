"""State mutators set up the state on (re)set. In the batched core the classic
kickoff layout is built in Rust, so a mutator delegates the reset to the engine.
This is the extension point for custom resets (random positions, scenarios, …),
which will land once the engine grows a `set_state`.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .engine import TransitionEngine
from .state import GameState


class StateMutator(ABC):
    @abstractmethod
    def reset_all(self, engine: TransitionEngine) -> GameState: ...

    @abstractmethod
    def reset_mask(self, engine: TransitionEngine, mask: np.ndarray) -> None: ...


class KickoffMutator(StateMutator):
    """The classic Haxball kickoff (spawn positions + still ball), built in the core."""

    def reset_all(self, engine: TransitionEngine) -> GameState:
        return engine.reset()

    def reset_mask(self, engine: TransitionEngine, mask: np.ndarray) -> None:
        engine.reset_mask(mask)
