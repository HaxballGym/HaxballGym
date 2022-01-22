from haxballgym.game.common_values import COLLISION_FLAG_ALL
from haxballgym.game.objects.base import PhysicsObject

import numpy as np
import copy

class Disc(PhysicsObject):
    """
    A class to represent the state of a disc from the game.
    """

    def __init__(self, data_object=None, data_stadium=None):
        
        if data_object is None:
            data_object = {}
        
        self.collision_group: int = self.transform_collision_dict(data_object.get('cGroup'))
        self.collision_mask: int = self.transform_collision_dict(data_object.get('cMask'))
        self.position: np.ndarray = np.array(data_object.get('pos'), dtype=float)
        self.velocity: np.ndarray = np.array(data_object.get('speed'), dtype=float)
        self.bouncing_coefficient: float = data_object.get('bCoef')
        self.radius: float = data_object.get('radius')
        self.inverse_mass: float = data_object.get('invMass')
        self.damping: float = data_object.get('damping')
        self.trait = data_object.get('trait')
        
        self.apply_trait(self, data_stadium)
        self.apply_default_values()
    
    def apply_default_values(self):
        if self.collision_group is None:
            self.collision_group = COLLISION_FLAG_ALL
        if self.collision_mask is None:
            self.collision_mask = COLLISION_FLAG_ALL
        if np.isnan(self.velocity):
            self.velocity = np.zeros(2)
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 0.5
        if self.radius is None:
            self.radius = 10
        if self.inverse_mass is None:
            self.inverse_mass = 0
        if self.damping is None:
            self.damping = 0.99

    def copy(self, other: 'Disc') -> 'Disc':
        self.collision_group = copy.copy(other.collision_group)
        self.collision_mask = copy.copy(other.collision_mask)
        self.position = copy.copy(other.position)
        self.velocity = copy.copy(other.velocity)
        self.bouncing_coefficient = copy.copy(other.bouncing_coefficient)
        self.radius = copy.copy(other.radius)
        self.inverse_mass = copy.copy(other.inverse_mass)
        self.damping = copy.copy(other.damping)