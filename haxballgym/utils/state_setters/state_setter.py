"""
Base state setter class.
"""
from abc import ABC, abstractmethod

from ursinaxball import Game


class StateSetter(ABC):
    @abstractmethod
    def reset(self, game: Game, save_recording: bool):
        """
        Function to be called each time the environment is reset.
        """
        raise NotImplementedError
