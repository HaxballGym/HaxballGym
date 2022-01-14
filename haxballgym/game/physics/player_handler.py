
import numpy as np
from haxballgym.game.common_values import TEAM_SPECTATOR_ID, ACTION_BIN_KICK, COLLISION_FLAG_KICK
from haxballgym.game.objects.base.player_physics import PlayerPhysics
from haxballgym.game.objects.stadium_object import Stadium


class Player():
    
    def __init__(self, name, team=TEAM_SPECTATOR_ID) -> None:
        
        self.name = name
        self.team = team
        self.bot = True
        self.action = []
        self.kicking = False
        # Once you kick the ball, the player should stop kicking. kick_cancel is used to make sure the mechanism works.
        self._kick_cancel = False
        self.disc: PlayerPhysics = PlayerPhysics()
        
    def is_player_kicking(self):
        return self.kicking and not self._kick_cancel    
    
    def resolve_movement(self, stadium_game: Stadium):
        
        if self.disc is not None:
            self.kicking = self.action[ACTION_BIN_KICK]
            if not self.action[ACTION_BIN_KICK]:
                self._kick_cancel = False
                
        if self.is_player_kicking():
            for disc_stadium in stadium_game.discs:
                if (disc_stadium.collision_group & COLLISION_FLAG_KICK) != 0 and disc_stadium != self.disc:
                    dist = np.linalg.norm(disc_stadium.position - self.disc.position)
                    if (dist - self.disc.radius - disc_stadium.radius) < 4:
                        normal = (disc_stadium.position - self.disc.position) / dist
                        disc_stadium.velocity += normal * self.disc.kick_strength
                        self._kick_cancel = True
        
        input_direction = self.action[:2] / np.linalg.norm(self.action[:2])
        player_acceleration = self.disc.kicking_acceleration if self.is_player_kicking() else self.disc.acceleration
        self.disc.velocity += input_direction * player_acceleration
        
        return
    