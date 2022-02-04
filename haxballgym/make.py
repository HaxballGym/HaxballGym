import os
from typing import List

from haxballgym.envs import Match
from haxballgym.game.modules import GameScore

from haxballgym.utils.terminal_conditions import common_conditions, TerminalCondition
from haxballgym.utils.reward_functions import DefaultReward, RewardFunction
from haxballgym.utils.obs_builders import DefaultObs, ObsBuilder
from haxballgym.utils.action_parsers import DefaultAction, ActionParser

from haxballgym.game import Game, common_values
from haxballgym.game.modules import PlayerHandler

from haxballgym.gym import Gym
from haxballgym.version import print_current_release_notes


def make(game: Game = Game(),
         tick_skip: int = 15,
         team_size: int = 1,
         terminal_conditions: List[TerminalCondition] = (common_conditions.TimeoutCondition(1 * 60 * 4), common_conditions.GoalScoredCondition()),
         reward_fn: RewardFunction = DefaultReward(),
         obs_builder: ObsBuilder = DefaultObs(),
         action_parser: ActionParser = DefaultAction()):
    """
    :param tick_skip: The amount of physics ticks your action will be repeated for
    :param team_size: Players per team
    :param terminal_conditions: List of terminal condition objects
    :param reward_fn: Reward function object
    :param obs_builder: Observation builder object
    :param action_parser: Action parser object
    :param state_setter: State Setter object
    :return: Gym object
    """
    
    game.score = GameScore(time_limit=0, score_limit=0)
    
    players_red = [PlayerHandler(f"P{i}", common_values.TEAM_RED_ID) for i in range(team_size)]
    players_blue = [PlayerHandler(f"P{team_size + i}", common_values.TEAM_BLUE_ID) for i in range(team_size)]
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
