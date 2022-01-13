from haxballgym.game.common_values import COLLISION_FLAG_ALL
from haxballgym.game.objects.base import PhysicsObject
import numpy as np

class Disc(PhysicsObject):
    """
    A class to represent the state of a disc from the game.
    """

    def __init__(self, data_object, data_stadium):
        
        if data_object is None:
            data_object = {}
        
        self.collision_group: int = self.transform_collision_dict(data_object.get('cGroup'))
        self.collision_mask: int = self.transform_collision_dict(data_object.get('cMask'))
        self.position: np.ndarray = np.array(data_object.get('pos'))
        self.velocity: np.ndarray = np.array(data_object.get('speed'))
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
        if self.velocity == None:
            self.velocity = np.zeros(2)
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 0.5
        if self.radius is None:
            self.radius = 10
        if self.inverse_mass is None:
            self.inverse_mass = 0
        if self.damping is None:
            self.damping = 0.99
