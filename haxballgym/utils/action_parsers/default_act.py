from typing import List, Union

import gym.spaces
import numpy as np

from haxballgym.utils.action_parsers import DiscreteAction
from haxballgym.utils.common_values import NUM_ACTIONS
from haxballgym.utils.gamestates import GameState


class DefaultAction(DiscreteAction):
    def __init__(self):
        super().__init__()

    def get_action_space(self) -> gym.spaces.Space:
        return super().get_action_space()

    def parse_actions(
        self,
        actions: Union[np.ndarray, List[np.ndarray], List[float]],
        state: GameState,
    ) -> np.ndarray:

        if type(actions) != np.ndarray:
            actions = np.asarray(actions)

        if len(actions.shape) == 1:
            actions = actions.reshape((-1, NUM_ACTIONS))
        elif len(actions.shape) > 2:
            raise ValueError("{} is not a valid action shape".format(actions.shape))

        return super().parse_actions(actions, state)
