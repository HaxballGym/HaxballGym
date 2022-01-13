import numpy as np

from haxballgym.utils.common_values import RED_TEAM, BLUE_TEAM
from haxballgym.utils.gamestates import GameState, PlayerData
from haxballgym.utils.reward_functions import RewardFunction


class EventReward(RewardFunction):
    def __init__(self, goal=0., team_goal=0., concede=-0., touch=0., shot=0., save=0.):
        """
        :param goal: reward for goal scored by player.
        :param team_goal: reward for goal scored by player's team.
        :param concede: reward for goal scored by opponents. Should be negative if used as punishment.
        :param touch: reward for touching the ball.
        :param shot: reward for shooting the ball (as detected by Rocket League).
        :param save: reward for saving the ball (as detected by Rocket League).
        :param demo: reward for demolishing a player.
        """
        super().__init__()
        self.weights = np.array([goal, team_goal, concede, touch, shot, save])

        # Need to keep track of last registered value to detect changes
        self.last_registered_values = {}

    @staticmethod
    def _extract_values(player: PlayerData, state: GameState):
        if player.team_num == RED_TEAM:
            team, opponent = state.red_score, state.blue_score
        elif player.team_num == BLUE_TEAM:
            team, opponent = state.blue_score, state.red_score

        return np.array([player.match_goals, team, opponent, player.ball_touched, player.match_shots,
                         player.match_saves, player.match_demolishes])

    def reset(self, initial_state: GameState, optional_data=None):
        # Update every reset since rocket league may crash and be restarted with clean values
        self.last_registered_values = {}
        for player in initial_state.players:
            self.last_registered_values[player.pawn_id] = self._extract_values(player, initial_state)

    def get_reward(self, player: PlayerData, state: GameState, previous_action: np.ndarray, optional_data=None):
        old_values = self.last_registered_values[player.pawn_id]
        new_values = self._extract_values(player, state)

        diff_values = new_values - old_values
        diff_values[diff_values < 0] = 0  # We only care about increasing values

        reward = np.dot(self.weights, diff_values)

        self.last_registered_values[player.pawn_id] = new_values
        return reward


class VelocityReward(RewardFunction):
    # Simple reward function to ensure the model is training.
    def __init__(self, negative=False):
        super().__init__()
        self.negative = negative

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerData, state: GameState, previous_action: np.ndarray) -> float:
        return np.linalg.norm(player.car_data.velocity) * (1 - 2 * self.negative)


class ConstantReward(RewardFunction):
    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerData, state: GameState, previous_action: np.ndarray) -> float:
        return 1
