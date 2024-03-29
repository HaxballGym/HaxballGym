from typing import Any, List, Union

import gym.spaces
import numpy as np
from ursinaxball import Game
from ursinaxball.modules import Bot, PlayerHandler

from haxballgym.envs import Environment
from haxballgym.utils import common_values
from haxballgym.utils.action_parsers import ActionParser
from haxballgym.utils.gamestates import GameState
from haxballgym.utils.obs_builders import ObsBuilder
from haxballgym.utils.reward_functions import RewardFunction
from haxballgym.utils.terminal_conditions import TerminalCondition
from haxballgym.utils.state_setters import StateSetter


class Match(Environment):
    def __init__(
        self,
        game: Game,
        reward_function: RewardFunction,
        terminal_conditions: TerminalCondition,
        obs_builder: ObsBuilder,
        action_parser: ActionParser,
        state_setter: StateSetter,
        team_size: int = 1,
        bots: list[Bot] | None = None,
        tick_skip: int = 15,
    ):
        super().__init__()

        self._team_size = team_size
        self._tick_skip = tick_skip
        self._reward_fn = reward_function
        self._terminal_conditions = terminal_conditions
        self._obs_builder = obs_builder
        self._action_parser = action_parser
        self._game = game
        self._game_state = GameState(game_object=game)
        self._state_setter = state_setter
        self._bots = bots

        if type(terminal_conditions) not in (tuple, list):
            self._terminal_conditions = [
                terminal_conditions,
            ]

        self.agents = self._team_size * 2 if bots is None else self._team_size

        self.observation_space = None
        self._auto_detect_obs_space()
        self.action_space = self._action_parser.get_action_space()

        self._prev_actions = np.zeros(
            (self.agents, common_values.NUM_ACTIONS),
            dtype=float,
        )

    def episode_reset(self, initial_state: GameState):
        self._prev_actions.fill(0)
        for condition in self._terminal_conditions:
            condition.reset(initial_state)
        self._reward_fn.reset(initial_state)
        self._obs_builder.reset(initial_state)

    def build_observations(self, state: GameState) -> Union[Any, List]:
        observations = []
        for i, player in enumerate(state.players):
            if player.bot is not None:
                continue
            obs = self._obs_builder.build_obs(player, state, self._prev_actions[i])

            observations.append(obs)

        if len(observations) == 1:
            observations = observations[0]

        return observations

    def get_rewards(self, state: GameState, done: bool) -> Union[float, List]:
        rewards = []

        for i, player in enumerate(state.players):
            if player.bot is not None:
                continue

            if done:
                reward = self._reward_fn.get_final_reward(
                    player, state, self._prev_actions[i]
                )
            else:
                reward = self._reward_fn.get_reward(
                    player, state, self._prev_actions[i]
                )

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

    def parse_actions(
        self, actions: list[int] | np.ndarray, state: GameState
    ) -> np.ndarray:
        # Prevent people from modifying numpy arrays inside the ActionParser
        if isinstance(actions, np.ndarray):
            actions = np.copy(actions)

        actions_parsed = self._action_parser.parse_actions(actions, state)

        for action, player in zip(actions_parsed, self._game_state.players):
            if player.team == common_values.BLUE_TEAM and player.bot is None:
                action[0] = action[0] * -1

        return actions_parsed

    def get_reset_state(self, save_recording=False):
        self._state_setter.reset(self._game, save_recording)

    def get_config(self):
        return [self._team_size, self._tick_skip]

    def _auto_detect_obs_space(self):
        empty_game = Game()
        empty_game_state = GameState(game_object=empty_game)
        empty_player_list = [PlayerHandler("") for _ in self._game.players]
        prev_inputs = np.zeros(common_values.NUM_ACTIONS)

        empty_game_state.players = empty_player_list

        obs_shape = np.shape(
            self._obs_builder.build_obs(
                empty_player_list[0], empty_game_state, prev_inputs
            )
        )

        self.observation_space = gym.spaces.Box(-np.inf, np.inf, shape=obs_shape)
