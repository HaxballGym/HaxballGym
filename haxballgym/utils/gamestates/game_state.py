"""
    Object to contain all relevant information about the game state.
"""

from typing import List, Optional

from haxballgym.game import Game
from haxballgym.game.modules import PlayerData, PlayerHandler
from haxballgym.game.objects.base import Disc


class GameState(object):

    def __init__(self, game_object: Game):
        self.red_score: int = game_object.score.red
        self.blue_score: int = game_object.score.blue
        
        self.last_touch: Optional[int] = -1
        self.last_touch_time: Optional[int] = -1
        
        self.last_kick: Optional[int] = -1
        self.last_kick_time: Optional[int] = -1

        self.players: List[PlayerHandler] = game_object.players
        self.players_data: List[PlayerData] = [p.player_data for p in self.players]
        self.ball: Disc = game_object.stadium_game.discs[0]

    def update(self, game_object: Game):
        self.red_score = game_object.score.red
        self.blue_score = game_object.score.blue
        
        for p_data in self.players_data:
            if p_data.last_touch_time > self.last_touch_time:
                self.last_touch_time = p_data.last_touch_time
                self.last_touch = p_data.id
            if p_data.last_kick_time > self.last_kick_time:
                self.last_kick_time = p_data.last_kick_time
                self.last_kick = p_data.id
        
