import numpy as np
from typing import Any, List
from haxballgym.utils.gamestates import PlayerData, GameState
from haxballgym.utils.obs_builders import ObsBuilder


class DefaultObs(ObsBuilder):
    def __init__(self):
        """
        Default Observation builder.
        """
        super().__init__()

    def reset(self, initial_state: GameState):
        pass

    def build_obs(self, player: PlayerData, state: GameState, previous_action: np.ndarray) -> Any:
        ball = state.ball

        obs = [ball.position,
               ball.velocity,
               previous_action
               ]

        self._add_player_to_obs(obs, player)

        allies = []
        enemies = []

        for other in state.players:
            if other.pawn_id == player.pawn_id:
                continue

            if other.team_num == player.team_num:
                team_obs = allies
            else:
                team_obs = enemies

            self._add_player_to_obs(team_obs, other)

        obs.extend(allies)
        obs.extend(enemies)
        return np.concatenate(obs)

    def _add_player_to_obs(self, obs: List, player: PlayerData):
        player_pawn = player.pawn_data

        obs.extend([
            player_pawn.position,
            player_pawn.velocity,
            [player.is_shooting]])

        return player_pawn
