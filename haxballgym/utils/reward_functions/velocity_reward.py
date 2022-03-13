import numpy as np

from haxballgym.utils.reward_functions import RewardFunction
from haxballgym.utils.gamestates import GameState
from haxballgym.game.modules import PlayerHandler
from haxballgym.game.objects import Stadium
from haxballgym.game.common_values import TEAM_RED_ID, TEAM_BLUE_ID


class VelocityPlayerToBallReward(RewardFunction):
    def __init__(self):
        super().__init__()

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        vel = np.copy(player.disc.velocity)
        pos_diff = state.ball.position - player.disc.position
        player_max_speed = player.disc.acceleration * player.disc.damping / (1 - player.disc.acceleration)
        
        norm_pos_diff = pos_diff / np.linalg.norm(pos_diff)
        vel /= player_max_speed
        return float(np.dot(norm_pos_diff, vel))


def position_diff_point_segment(p: np.ndarray, v: np.ndarray, w: np.ndarray) -> np.ndarray:
    """
    Calculates the distance between a point and a segment
    :param p: Point
    :param v: Start of segment
    :param w: End of segment
    :return: Difference vector
    """
    return p - (v + (w - v) * np.dot(p - v, w - v) / np.dot(w - v, w - v))

    

class VelocityBallToGoalReward(RewardFunction):
    def __init__(self, stadium: Stadium, own_goal=False):
        super().__init__()
        self.own_goal = own_goal
        self.red_goal = [goal for goal in stadium.goals if goal.team == "red"][0]
        self.blue_goal = [goal for goal in stadium.goals if goal.team == "blue"][0]

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        if player.team == TEAM_RED_ID and not self.own_goal \
                or player.team == TEAM_BLUE_ID and self.own_goal:
            objective = self.blue_goal
        else:
            objective = self.red_goal

        vel = np.copy(state.ball.velocity)
        pos_diff = position_diff_point_segment(state.ball.position, objective.points[0], objective.points[1])
        player_max_speed = player.disc.acceleration * player.disc.damping / (1 - player.disc.acceleration)

        norm_pos_diff = pos_diff / np.linalg.norm(pos_diff)
        vel /= player_max_speed
        return float(np.dot(norm_pos_diff, vel))
