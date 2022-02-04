from haxballgym.game.objects import stadium_object, Stadium
from haxballgym.game.modules import GameScore

class PlayerData(object):
    
    def __init__(self) -> None: 
        self.number_touch = 0
        self.number_kick = 0
        self.last_touch_time = 0
        self.last_kick_time = 0
        
        
    def update_touch(self, stadium_game: Stadium, game_score: GameScore):
        self.number_touch += 1
        self.last_touch_time = game_score.time
    
    
    def update_kick(self, stadium_game: Stadium, game_score: GameScore):
        self.number_kick += 1
        self.last_kick_time = game_score.time