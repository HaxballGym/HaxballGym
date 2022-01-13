"""
    The HaxBall gym environment.
"""

from time import sleep
from typing import List, Union, Tuple, Dict, Any
from haxballgym.envs.match import Match

import numpy as np
from gym import Env


class Gym(Env):
    def __init__(self, match: Match):
        super().__init__()

        self._match = match
        self.observation_space = match.observation_space
        self.action_space = match.action_space

        self._prev_state = None

    def reset(self, return_info=False) -> Union[List, Tuple]:
        """
        The environment reset function. When called, this will reset the state of the environment and objects in the game.
        This should be called once when the environment is initialized, then every time the `done` flag from the `step()`
        function is `True`.
        """

        state_str = self._match.get_reset_state()

        state = self._receive_state()
        self._match.episode_reset(state)
        self._prev_state = state
        
        obs = self._match.build_observations(state)
        if return_info:
            info = {
                'state': state,
                'result': self._match.get_result(state)
            }
            return obs, info
        return obs

    def step(self, actions: Any) -> Tuple[List, List, bool, Dict]:
        """
        The step function will send the list of provided actions to the game, then advance the game forward by `tick_skip`
        physics ticks using that action. The game is then paused, and the current state is sent back to RLGym. This is
        decoded into a `GameState` object, which gets passed to the configuration objects to determine the rewards,
        next observation, and done signal.

        :param actions: An object containing actions, in the format specified by the `ActionParser`.
        :return: A tuple containing (obs, rewards, done, info)
        """
            
        actions = self._match.parse_actions(actions, self._prev_state)
        actions_sent = self._send_actions(actions)
        state = self._receive_state()

        obs = self._match.build_observations(state)
        done = self._match.is_done(state)
        reward = self._match.get_rewards(state, done)
        self._prev_state = state

        info = {
            'state': state,
            'result': self._match.get_result(state)
        }

        return obs, reward, done, info

    def _receive_state(self):
        return self._match.parse_state()

    def _send_actions(self, actions):
        assert isinstance(actions, np.ndarray), "Invalid action type, action must be of type np.ndarray(n, 8)."
        assert len(actions.shape) == 2, "Invalid action shape, shape must be of the form (n, 8)."
        assert actions.shape[-1] == 8, "Invalid action shape, last dimension must be 8."

        actions_formatted = self._match.format_actions(actions)
        self._match.send_actions(actions_formatted) # smth like that

        return True
