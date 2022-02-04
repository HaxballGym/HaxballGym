
import numpy as np
import itertools

from haxballgym.game.common_values import TEAM_SPECTATOR_ID, ACTION_BIN_KICK, COLLISION_FLAG_KICK
from haxballgym.game.modules.player import PlayerData
from haxballgym.game.objects.base import PlayerPhysics
from haxballgym.game.objects import Stadium
from haxballgym.game.modules import GameScore



class PlayerHandler(object):
    
    id_iterate = itertools.count()
    
    def __init__(self, name: str, team: int = TEAM_SPECTATOR_ID) -> None:
        
        self.id = next(PlayerHandler.id_iterate)
        self.name = name
        self.team = team
        self.bot = True
        self.action = []
        self.kicking = False
        # Once you kick the ball, the player should stop kicking. kick_cancel is used to make sure the mechanism works.
        self._kick_cancel = False
        self.disc: PlayerPhysics = PlayerPhysics()
        self.player_data = PlayerData()
    
        
    def is_player_kicking(self):
        return self.kicking and not self._kick_cancel
    
    
    def resolve_movement(self, stadium_game: Stadium, game_score: GameScore) -> None:
        if self.disc is not None:
            self.kicking = self.action[ACTION_BIN_KICK] == 1
            if self.action[ACTION_BIN_KICK] == 0:
                self._kick_cancel = False
                
        for disc_stadium in stadium_game.discs:
            if (disc_stadium.collision_group & COLLISION_FLAG_KICK) != 0 and disc_stadium != self.disc:
                dist = np.linalg.norm(disc_stadium.position - self.disc.position)
                if (dist - self.disc.radius - disc_stadium.radius) < 4:
                    if self.is_player_kicking():
                        # Player kicks the ball
                        normal = (disc_stadium.position - self.disc.position) / dist
                        disc_stadium.velocity += normal * self.disc.kick_strength
                        self._kick_cancel = True
                        self.player_data.update_touch(stadium_game, game_score)
                    else:
                        # Player touches the ball
                        self.player_data.update_touch(stadium_game, game_score)
        
        input_direction = self.action[:2] / np.linalg.norm(self.action[:2]) if np.linalg.norm(self.action[:2]) > 0 else np.array([0., 0.])
        player_acceleration = self.disc.kicking_acceleration if self.is_player_kicking() else self.disc.acceleration
        self.disc.velocity += input_direction * player_acceleration
    