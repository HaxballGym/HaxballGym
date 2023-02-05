"""
The action parser.
"""

from abc import ABC, abstractmethod
from typing import Any

import gym.spaces
import numpy as np

from haxballgym.utils.gamestates import GameState


class ActionParser(ABC):
    def __init__(self):
        pass

    @abstractmethod
    def get_action_space(self) -> gym.spaces.Space:
        """
        Function that returns the action space type.
        It will be called during the initialization of the environment.

        :return: The type of the action space
        """
        raise NotImplementedError

    @abstractmethod
    def parse_actions(self, actions: Any, state: GameState) -> np.ndarray:
        """
        Function that parses actions from the action space into the correct format.

        :param actions: An object of actions, as passed to the `env.step` function.
        :param state: The GameState object that was used to generate the actions.

        :return: the parsed actions.
        """
        raise NotImplementedError
