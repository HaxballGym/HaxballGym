from haxballgym.utils.reward_functions import RewardFunction
from haxballgym.utils.gamestates import GameState
from haxballgym.game.modules import PlayerHandler
import numpy as np

class DefaultReward(RewardFunction):
    def __init__(self):
        super().__init__()
        self.last_touch = None

    def reset(self, initial_state: GameState):
        self.last_touch = initial_state.last_touch

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        return np.linalg.norm(player.disc.velocity)

    def get_final_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        return self.get_reward(player, state, previous_action)
