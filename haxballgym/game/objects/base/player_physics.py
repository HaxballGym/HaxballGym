from haxballgym.game.common_values import COLLISION_FLAG_NONE, COLLISION_FLAG_ALL
from haxballgym.game.objects.base import Disc
import numpy as np

class PlayerPhysics(Disc):
    """
    A class to represent the player disc object from the game.
    """

    def __init__(self, data_object=None, data_stadium=None):
        
        if data_object is None:
            data_object = {}
        
        self.acceleration: float = data_object.get('acceleration')
        self.kicking_acceleration: float = data_object.get('kickingAcceleration')
        self.kicking_damping: float = data_object.get('kickingDamping')
        self.kick_strength: float = data_object.get('kickStrength')
        
        super().__init__(data_object, data_stadium)
        
        self.position = np.array([0, 0], dtype=np.float)
        self.velocity = np.array([0, 0], dtype=np.float)
        del self.trait
    
    def apply_default_values(self):
        """
        Applies the default values to the player if they are none
        """
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 0.5
        if self.collision_group is None:
            self.collision_group = COLLISION_FLAG_NONE
        if self.collision_mask is None:
            self.collision_mask = COLLISION_FLAG_ALL
        if self.radius is None:
            self.radius = 15
        if self.inverse_mass is None:
            self.inverse_mass = 0.5
        if self.damping is None:
            self.damping = 0.96
        if self.acceleration is None:
            self.acceleration = 0.1
        if self.kicking_acceleration is None:
            self.kicking_acceleration = 0.07
        if self.kicking_damping is None:
            self.kicking_damping = 0.96
        if self.kick_strength is None:
            self.kick_strength = 5
