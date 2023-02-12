"""
    The HaxBall gym environment.
"""

from typing import Dict, List, Tuple, Union

import numpy as np
from gym import Env

from haxballgym.envs.match import Match


class Gym(Env):
    def __init__(self, match: Match):
        super().__init__()

        self._match = match
        self.observation_space = match.observation_space
        self.action_space = match.action_space

        self._prev_state = None

    def reset(self, return_info=False, save_recording=False) -> Union[List, Tuple]:
        """
        The environment reset function.
        When called, this will reset the state of the environment.
        This should be called once when the environment is initialized,
        then every time the `done` flag from the `step()` function is `True`.
        """

        self._match.get_reset_state(save_recording)
        state = self._receive_state()
        self._match.episode_reset(state)
        self._prev_state = state

        obs = self._match.build_observations(state)
        if return_info:
            info = {"state": state, "result": self._match.get_result(state)}
            return obs, info
        return obs

    def step(self, actions: list[int] | np.ndarray) -> Tuple[List, List, bool, Dict]:
        """
        The step function will send the list of provided actions to the game,
        then advance the game forward by `tick_skip` physics ticks using that action.
        We then get the `GameState` object, which gets passed to the configuration
        objects to determine the rewards, next observation, and done signal.

        :param actions: An object containing actions, in the correct format
        :return: A tuple containing (obs, rewards, done, info)
        """
        actions = self._match.parse_actions(actions, self._prev_state)
        actions_all = self._get_all_actions(actions)

        for _ in range(self._match._tick_skip + 1):
            self._match._game.step(actions_all)

        state = self._receive_state()
        obs = self._match.build_observations(state)
        done = self._match.is_done(state)
        reward = self._match.get_rewards(state, done)
        self._prev_state = state

        info = {"state": state, "result": self._match.get_result(state)}

        return obs, reward, done, info

    def _receive_state(self):
        self._match._game_state.update(self._match._game)
        return self._match._game_state

    def _get_all_actions(self, actions: list[int] | np.ndarray):
        if self._match._bots is None:
            return actions

        actions_all = [p.step(self._match._game) for p in self._match._game.players]

        i = 0
        for j, act in enumerate(actions_all):
            if act is None:
                actions_all[j] = actions[i]
                i += 1

        return actions_all
