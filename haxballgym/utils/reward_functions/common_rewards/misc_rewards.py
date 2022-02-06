import numpy as np

from haxballgym.game.objects import Stadium
from haxballgym.game.modules.player import PlayerHandler
from haxballgym.game.common_values import TEAM_RED_ID, TEAM_BLUE_ID
from haxballgym.utils.gamestates import GameState
from haxballgym.utils.reward_functions import RewardFunction


class EventReward(RewardFunction):
    def __init__(self, team_goal=0., team_concede=-0., touch=0., kick=0.):
        """
        :param team_goal: reward for goal scored by player's team.
        :param team_concede: reward for goal scored by opponents. Should be negative if used as punishment.
        :param touch: reward for touching the ball.
        :param kick: reward for kicking the ball.
        """
        super().__init__()
        self.weights = np.array([team_goal, team_concede, touch, kick])

        # Need to keep track of last registered value to detect changes
        self.last_registered_values = {}

    @staticmethod
    def _extract_values(player: PlayerHandler, state: GameState):
        if player.team == TEAM_RED_ID:
            team, opponent = state.red_score, state.blue_score
        else:
            team, opponent = state.blue_score, state.red_score

        return np.array([team, opponent, player.player_data.number_touch, player.player_data.number_kick])

    def reset(self, initial_state: GameState, optional_data=None):
        # Update every reset since rocket league may crash and be restarted with clean values
        self.last_registered_values = {}
        for player in initial_state.players:
            self.last_registered_values[player.id] = self._extract_values(player, initial_state)

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray, optional_data=None):
        old_values = self.last_registered_values[player.id]
        new_values = self._extract_values(player, state)

        diff_values = new_values - old_values
        diff_values[diff_values < 0] = 0  # We only care about increasing values

        reward = np.dot(self.weights, diff_values)

        self.last_registered_values[player.id] = new_values
        return reward


class VelocityReward(RewardFunction):
    # Simple reward function to ensure the model is training.
    def __init__(self, negative=False):
        super().__init__()
        self.negative = negative

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        return np.linalg.norm(player.disc.velocity) / 10 * (1 - 2 * self.negative)


class ConstantReward(RewardFunction):
    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        return 1


class AlignBallGoal(RewardFunction):
    def __init__(self, stadium: Stadium, defense=1., offense=1.):
        super().__init__()
        self.defense = defense
        self.defense_goal = [goal for goal in stadium.goals if goal.team == "red"][0]
        self.offense = offense
        self.offense_goal = [goal for goal in stadium.goals if goal.team == "blue"][0]

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        ball = state.ball.position
        pos = player.car_data.position
        protecc = (self.defense_goal.points[0] + self.defense_goal.points[1]) / 2
        attacc = (self.offense_goal.points[0] + self.offense_goal.points[1]) / 2
        if player.team == TEAM_BLUE_ID:
            protecc, attacc = attacc, protecc

        # Align player->ball and net->player vectors
        cosine_similarity_def = np.dot(ball - pos / np.linalg.norm(ball - pos), pos - protecc / np.linalg.norm(pos - protecc))
        defensive_reward = self.defense * cosine_similarity_def

        # Align player->ball and player->net vectors
        cosine_similarity_off = np.dot(ball - pos / np.linalg.norm(ball - pos), attacc - pos / np.linalg.norm(attacc - pos))
        offensive_reward = self.offense * cosine_similarity_off

        return defensive_reward + offensive_reward
