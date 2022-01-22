"""
    Object to contain all relevant information about the game state.
"""

from typing import List, Optional

from haxballgym.game import Game
from haxballgym.game.objects.base import Disc
from haxballgym.utils.gamestates import PlayerData


class GameState(object):

    def __init__(self, game_object: Game):
        self.red_score: int = game_object.score.red
        self.blue_score: int = game_object.score.blue
        self.last_touch: Optional[int] = -1

        self.players: List[PlayerData] = game_object.players
        self.ball: Disc = game_object.stadium_game.discs[0]

    def update(self, game_object: Game):
        self.red_score = game_object.score.red
        self.blue_score = game_object.score.blue
