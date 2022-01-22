from haxballgym.game.common_values import COLLISION_FLAG_BALL, COLLISION_FLAG_SCORE, COLLISION_FLAG_KICK, \
    COLLISION_FLAG_ALL, COLLISION_FLAG_REDKO, COLLISION_FLAG_BLUEKO
from haxballgym.game.objects.base import Disc
import numpy as np

class BallPhysics(Disc):
    """
    A class to represent the state of a ball from the game.
    """

    def __init__(self, data_object: dict, data_stadium: dict):
        
        if data_object is None:
            data_object = {}
        
        super().__init__(data_object, data_stadium)
        
        self.position = np.array([0, 0], dtype=float)
        self.velocity = np.array([0, 0], dtype=float)
        self.collision_group = self.collision_group | COLLISION_FLAG_SCORE | COLLISION_FLAG_KICK
        self.collision_mask = self.collision_mask ^ COLLISION_FLAG_REDKO ^ COLLISION_FLAG_BLUEKO
        del self.trait
    
    def apply_default_values(self):
        """
        Applies the default values to the ball if they are none
        """
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 0.5
        if self.collision_group is None:
            self.collision_group = COLLISION_FLAG_BALL
        if self.collision_mask is None:
            self.collision_mask = COLLISION_FLAG_ALL
        if self.radius is None:
            self.radius = 10
        if self.inverse_mass is None:
            self.inverse_mass = 1
        if self.damping is None:
            self.damping = 0.99
