from abc import abstractmethod

import numpy as np

from haxballgym.utils import RewardFunction
from haxballgym.utils.gamestates import GameState
from haxballgym.game.modules import PlayerHandler


class ConditionalRewardFunction(RewardFunction):
    def __init__(self, reward_func: RewardFunction):
        super().__init__()
        self.reward_func = reward_func

    @abstractmethod
    def condition(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> bool:
        raise NotImplementedError

    def reset(self, initial_state: GameState):
        pass

    def get_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        if self.condition(player, state, previous_action):
            return self.reward_func.get_reward(player, state, previous_action)
        return 0

    def get_final_reward(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> float:
        if self.condition(player, state, previous_action):
            return self.reward_func.get_final_reward(player, state, previous_action)
        return 0


class RewardIfClosestToBall(ConditionalRewardFunction):
    def __init__(self, reward_func: RewardFunction, team_only=True):
        super().__init__(reward_func)
        self.team_only = team_only

    def condition(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> bool:
        dist = np.linalg.norm(player.disc.position - state.ball.position)
        for player2 in state.players:
            if not self.team_only or player2.team == player.team:
                dist2 = np.linalg.norm(player2.disc.position - state.ball.position)
                if dist2 < dist:
                    return False
        return True


class RewardIfTouchedLast(ConditionalRewardFunction):
    def condition(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> bool:
        return state.last_touch == player.id


class RewardIfKickedLast(ConditionalRewardFunction):
    def condition(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> bool:
        return state.last_kick == player.id
    