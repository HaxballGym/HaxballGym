import numpy as np
import gym.spaces
from haxballgym.utils.gamestates import GameState
from haxballgym.utils.action_parsers import ActionParser
from haxballgym.utils.common_values import NUM_ACTIONS


class DiscreteAction(ActionParser):
    """
    Simple discrete action space. All the analog actions have 3 bins by default: -1, 0 and 1.
    Mapping of the actions is as follows:
    - Left/Right: 1 for right, 0 for nothing, -1 for left
    - Up/Down: 1 for up, 0 for nothing, -1 for down
    - Kick: 1 for kick, 0 for nothing
    """

    def __init__(self, n_bins=3):
        super().__init__()
        assert n_bins % 2 == 1, "n_bins must be an odd number"
        self._n_bins = n_bins

    def get_action_space(self) -> gym.spaces.Space:
        return gym.spaces.MultiDiscrete([self._n_bins] * 2 + [2])

    def parse_actions(self, actions: np.ndarray, state: GameState) -> np.ndarray:
        actions = actions.reshape((-1, NUM_ACTIONS))

        # map all ternary actions from {0, 1, 2} to {-1, 0, 1}.
        actions[..., :2] = actions[..., :2] / (self._n_bins // 2) - 1
        # map all binary actions from {0, 1} to {True, False}.
        actions[..., 2] = actions[..., 2] == 1

        return actions
