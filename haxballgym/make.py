import os
from typing import List

from haxballgym.envs import Match

from haxballgym.utils.terminal_conditions import common_conditions
from haxballgym.utils.reward_functions import DefaultReward
from haxballgym.utils.obs_builders import DefaultObs
from haxballgym.utils.action_parsers import DefaultAction

from haxballgym.game import Game, common_values
from haxballgym.game.physics import Player

from haxballgym.gym import Gym
from haxballgym.version import print_current_release_notes


def make(game: Game = Game(),
         tick_skip: int = 8,
         team_size: int = 1,
         terminal_conditions: List[object] = (common_conditions.TimeoutCondition(225 * 60), common_conditions.GoalScoredCondition()),
         reward_fn: object = DefaultReward(),
         obs_builder: object = DefaultObs(),
         action_parser: object = DefaultAction()):
    """
    :param tick_skip: The amount of physics ticks your action will be repeated for
    :param team_size: Cars per team
    :param terminal_conditions: List of terminal condition objects
    :param reward_fn: Reward function object
    :param obs_builder: Observation builder object
    :param action_parser: Action parser object
    :param state_setter: State Setter object
    :return: Gym object
    """
    
    players_red = [Player(f"P{i}", common_values.TEAM_RED_ID) for i in range(team_size)]
    players_blue = [Player(f"P{team_size + i}", common_values.TEAM_BLUE_ID) for i in range(team_size)]
    players = players_red + players_blue
    
    game.add_players(players)

    print_current_release_notes()

    match = Match(game = game,
                  reward_function=reward_fn,
                  terminal_conditions=terminal_conditions,
                  obs_builder=obs_builder,
                  action_parser=action_parser,
                  team_size=team_size,
                  tick_skip=tick_skip)

    return Gym(match)
