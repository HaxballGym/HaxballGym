"""
The Match object.
"""

from haxballgym.envs import Environment

from haxballgym.game import Game
from haxballgym.game.modules import PlayerHandler

from haxballgym.utils.gamestates import GameState
from haxballgym.utils.action_parsers import ActionParser
from haxballgym.utils.obs_builders import ObsBuilder
from haxballgym.utils.reward_functions import RewardFunction
from haxballgym.utils.terminal_conditions import TerminalCondition
from haxballgym.utils import common_values

import gym.spaces
import numpy as np
from typing import List, Union, Any



class Match(Environment):
    def __init__(self,
                 game: Game,
                 reward_function: RewardFunction,
                 terminal_conditions: TerminalCondition,
                 obs_builder: ObsBuilder,
                 action_parser: ActionParser,
                 team_size=1,
                 tick_skip=8):
        super().__init__()

        self._team_size = team_size
        self._tick_skip = tick_skip
        self._reward_fn = reward_function
        self._terminal_conditions = terminal_conditions
        self._obs_builder = obs_builder
        self._action_parser = action_parser
        self._game = game
        self._game_state = GameState(game_object=game)

        if type(terminal_conditions) not in (tuple, list):
            self._terminal_conditions = [terminal_conditions, ]

        self.agents = self._team_size * 2

        self.observation_space = None
        self._auto_detect_obs_space()
        self.action_space = self._action_parser.get_action_space()

        self._prev_actions = np.zeros((self.agents, common_values.NUM_ACTIONS), dtype=float)

    def episode_reset(self, initial_state: GameState):
        self._prev_actions.fill(0)
        for condition in self._terminal_conditions:
            condition.reset(initial_state)
        self._reward_fn.reset(initial_state)
        self._obs_builder.reset(initial_state)

    def build_observations(self, state: GameState) -> Union[Any, List]:
        observations = []
        for i in range(len(state.players)):
            player = state.players[i]
            obs = self._obs_builder.build_obs(player, state, self._prev_actions[i])

            observations.append(obs)

        if len(observations) == 1:
            return observations[0]

        return observations

    def get_rewards(self, state: GameState, done: bool) -> Union[float, List]:
        rewards = []

        for i in range(len(state.players)):
            player = state.players[i]

            if done:
                reward = self._reward_fn.get_final_reward(player, state, self._prev_actions[i])
            else:
                reward = self._reward_fn.get_reward(player, state, self._prev_actions[i])

            rewards.append(reward)

        if len(rewards) == 1:
            return rewards[0]

        return rewards

    def is_done(self, state: GameState) -> bool:
        for condition in self._terminal_conditions:
            if condition.is_terminal(state):
                return True
        return False

    def get_result(self, state: GameState) -> int:
        return state.red_score - state.blue_score

    def parse_actions(self, actions: Any, state: GameState) -> np.ndarray:
        # Prevent people from accidentally modifying numpy arrays inside the ActionParser
        if isinstance(actions, np.ndarray):
            actions = np.copy(actions)
        return self._action_parser.parse_actions(actions, state)

    def format_actions(self, actions: np.ndarray):
        self._prev_actions[:] = actions[:]

        acts = []
        for i in range(len(actions)):
            acts.append(float(self._game.players[i].id))
            for act in actions[i]:
                acts.append(float(act))

        return acts
    
    def get_reset_state(self, save_recording=False) -> bool:
        self._game.reset(save_recording)
        return True

    def get_config(self):
        return [self._team_size,
                self._tick_skip]

    def _auto_detect_obs_space(self):

        empty_game = Game()
        empty_game_state = GameState(game_object=empty_game)
        empty_player_list = [PlayerHandler("") for _ in range(self._team_size * 2)]
        prev_inputs = np.zeros(common_values.NUM_ACTIONS)

        empty_game_state.players = empty_player_list

        obs_shape = np.shape(self._obs_builder.build_obs(empty_player_list[0], empty_game_state, prev_inputs))

        self.observation_space = gym.spaces.Box(-np.inf, np.inf, shape=obs_shape)