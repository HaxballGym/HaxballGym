import numpy as np
from typing import Any, List

from haxballgym.utils.gamestates import GameState
from haxballgym.utils.obs_builders import ObsBuilder
from haxballgym.game.modules import PlayerHandler


class DefaultObs(ObsBuilder):
    def __init__(self):
        """
        Default Observation builder.
        """
        super().__init__()

    def reset(self, initial_state: GameState):
        pass

    def build_obs(self, player: PlayerHandler, state: GameState, previous_action: np.ndarray) -> Any:
        ball = state.ball

        obs = [ball.position,
               ball.velocity,
               previous_action
               ]

        self._add_player_to_obs(obs, player)

        allies = []
        enemies = []

        for other in state.players:
            if other.id == player.id:
                continue

            if other.team == player.team:
                team_obs = allies
            else:
                team_obs = enemies

            self._add_player_to_obs(team_obs, other)

        obs.extend(allies)
        obs.extend(enemies)
        return np.concatenate(obs)

    def _add_player_to_obs(self, obs: List, player: PlayerHandler):
        player_disc = player.disc

        obs.extend([
            player_disc.position,
            player_disc.velocity])

        return player_disc
