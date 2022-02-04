"""
The observation builder.
"""

from abc import ABC, abstractmethod
from haxballgym.utils.gamestates import GameState
from haxballgym.game.modules import PlayerHandler
import numpy as np
from typing import Any


class ObsBuilder(ABC):

    def __init__(self):
        pass

    @abstractmethod
    def reset(self, initial_state: GameState):
        """
        Function to be called each time the environment is reset. Note that this does not need to return anything,
        the environment will call `build_obs` automatically after reset, so the initial observation for a policy will be
        constructed in the same way as every other observation.

        :param initial_state: The initial game state of the reset environment.
        """
        raise NotImplementedError

    @abstractmethod
    def build_obs(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> Any:
        """
        Function to build observations for a policy. This is where all observations will be constructed every step and
        every reset. This function is given a player argument, and it is expected that the observation returned by this
        function will contain information from the perspective of that player. This function is called once for each
        agent automatically at every step.

        :param player: The player to build an observation for. The observation returned should be from the perspective of
        this player.

        :param state: The current state of the game.
        :param previous_action: The action taken at the previous environment step.

        :return: An observation for the player provided.
        """
        raise NotImplementedError
