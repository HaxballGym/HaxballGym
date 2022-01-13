import os
from typing import List

from haxballgym.envs import Match
from haxballgym.utils.terminal_conditions import common_conditions
from haxballgym.utils.reward_functions import DefaultReward
from haxballgym.utils.obs_builders import DefaultObs
from haxballgym.utils.action_parsers import DefaultAction
from haxballgym.utils.state_setters import DefaultState
from haxballgym.gym import Gym
from haxballgym.version import print_current_release_notes


def make(game_speed: int = 100,
         tick_skip: int = 8,
         spawn_opponents: bool = False,
         self_play: bool = False,
         team_size: int = 1,
         terminal_conditions: List[object] = (common_conditions.TimeoutCondition(225), common_conditions.GoalScoredCondition()),
         reward_fn: object = DefaultReward(),
         obs_builder: object = DefaultObs(),
         action_parser: object = DefaultAction(),
         state_setter: object = DefaultState()):
    """
    :param game_speed: The speed the physics will run at, leave it at 100 unless your game can't run at over 240fps
    :param tick_skip: The amount of physics ticks your action will be repeated for
    :param spawn_opponents: Whether you want opponents or not
    :param self_play: If there are agent controller opponents or not
    :param random_resets: If enabled cars and ball will spawn in random locations after every reset
    :param team_size: Cars per team
    :param terminal_conditions: List of terminal condition objects (rlgym.utils.TerminalCondition)
    :param reward_fn: Reward function object (rlgym.utils.RewardFunction)
    :param obs_builder: Observation builder object (rlgym.utils.ObsBuilder)
    :param action_parser: Action parser object (rlgym.utils.ActionParser)
    :param state_setter: State Setter object (rlgym.utils.StateSetter)
    :return: Gym object
    """

    print_current_release_notes()

    match = Match(reward_function=reward_fn,
                  terminal_conditions=terminal_conditions,
                  obs_builder=obs_builder,
                  action_parser=action_parser,
                  state_setter=state_setter,
                  team_size=team_size,
                  tick_skip=tick_skip,
                  game_speed=game_speed,
                  spawn_opponents=spawn_opponents,
                  self_play=self_play)

    return Gym(match)
