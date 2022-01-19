"""
A class containing all data about a player in the game.
"""

from haxballgym.game.physics import Player
from haxballgym.game.objects.base import Disc

# TODO: Add relevant statistics for the player

class PlayerData(object):
    def __init__(self, player_object: Player):
        self.id: int = player_object.id
        self.team: int = player_object.team
        self.disc: Disc = player_object.disc
        
        self.ball_touched: bool = False