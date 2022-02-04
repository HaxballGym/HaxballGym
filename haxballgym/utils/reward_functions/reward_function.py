"""
The reward function.
"""

from abc import ABC, abstractmethod
from haxballgym.utils.gamestates import GameState
from haxballgym.game.modules import PlayerHandler
import numpy as np


class RewardFunction(ABC):
    @abstractmethod
    def reset(self, initial_state: GameState):
        """
        Function to be called each time the environment is reset. This is meant to enable users to design stateful reward
        functions that maintain information about the game throughout an episode to determine a reward.

        :param initial_state: The initial state of the reset environment.
        """
        raise NotImplementedError

    @abstractmethod
    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        """
        Function to compute the reward for a player. This function is given a player argument, and it is expected that
        the reward returned by this function will be for that player.

        :param player: Player to compute the reward for.
        :param state: The current state of the game.
        :param previous_action: The action taken at the previous environment step.

        :return: A reward for the player provided.
        """
        raise NotImplementedError

    def get_final_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        """
        Function to compute the reward for a player at the final step of an episode. This will be called only once, when
        it is determined that the current state is a terminal one. This may be useful for sparse reward signals that only
        produce a value at the final step of an environment. By default, the regular get_reward is used.

        :param player: Player to compute the reward for.
        :param state: The current state of the game.
        :param previous_action: The action taken at the previous environment step.

        :return: A reward for the player provided.
        """
        return self.get_reward(player, state, previous_action)
