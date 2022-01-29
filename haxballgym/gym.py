"""
    The HaxBall gym environment.
"""

from typing import List, Union, Tuple, Dict, Any
from haxballgym.envs.match import Match
from haxballgym.utils.common_values import NUM_ACTIONS

import numpy as np
from gym import Env


class Gym(Env):
    def __init__(self, match: Match):
        super().__init__()

        self._match = match
        self.observation_space = match.observation_space
        self.action_space = match.action_space

        self._prev_state = None

    def reset(self, return_info=False, save_recording=False) -> Union[List, Tuple]:
        """
        The environment reset function. When called, this will reset the state of the environment and objects in the game.
        This should be called once when the environment is initialized, then every time the `done` flag from the `step()`
        function is `True`.
        """

        self._match.get_reset_state(save_recording)

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
        self._send_actions(actions)
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
        self._match._game_state.update(self._match._game)
        return self._match._game_state

    def _send_actions(self, actions):
        assert isinstance(actions, np.ndarray), f"Invalid action type, action must be of type np.ndarray(n, {NUM_ACTIONS})."
        assert len(actions.shape) == 2, f"Invalid action shape, shape must be of the form (n, {NUM_ACTIONS})."
        assert actions.shape[-1] == NUM_ACTIONS, f"Invalid action shape, last dimension must be {NUM_ACTIONS}."

        for _ in range(self._match._tick_skip):
            self._match._game.step(actions)

        return True
