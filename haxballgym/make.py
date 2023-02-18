from typing import List

from ursinaxball import Game, common_values
from ursinaxball.modules import Bot, GameScore, PlayerHandler

from haxballgym.envs import Match
from haxballgym.gym import Gym
from haxballgym.utils.action_parsers import ActionParser, DefaultAction
from haxballgym.utils.obs_builders import DefaultObs, ObsBuilder
from haxballgym.utils.reward_functions import RewardFunction, common_rewards
from haxballgym.utils.terminal_conditions import TerminalCondition, common_conditions
from haxballgym.utils.state_setters import StateSetter, DefaultState


def make(
    game: Game = Game(),
    tick_skip: int = 15,
    team_size: int = 1,
    bots: list[Bot] | None = None,
    terminal_conditions: List[TerminalCondition] = (
        common_conditions.TimeoutCondition(1 * 60 * 60 / 15),
        common_conditions.GoalScoredCondition(),
    ),
    reward_fn: RewardFunction = common_rewards.EventReward(
        team_goal=1, team_concede=-1, touch=0.1, kick=0.1
    ),
    obs_builder: ObsBuilder = DefaultObs(),
    action_parser: ActionParser = DefaultAction(),
    state_setter: StateSetter = DefaultState(),
):
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

    players_red = [
        PlayerHandler(f"P{i}", common_values.TeamID.RED) for i in range(team_size)
    ]
    if bots is None:
        players_blue = [
            PlayerHandler(f"P{team_size + i}", common_values.TeamID.BLUE)
            for i in range(team_size)
        ]
    else:
        players_blue = [
            PlayerHandler(f"P{team_size + i}", common_values.TeamID.BLUE, bot=bot)
            for i, bot in enumerate(bots)
        ]

    players = players_red + players_blue

    game.add_players(players)

    match = Match(
        game=game,
        reward_function=reward_fn,
        terminal_conditions=terminal_conditions,
        obs_builder=obs_builder,
        action_parser=action_parser,
        state_setter=state_setter,
        team_size=team_size,
        tick_skip=tick_skip,
        bots=bots,
    )

    return Gym(match)
