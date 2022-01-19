"""
The physics object.
"""

from abc import ABC, abstractmethod
from haxballgym.game.common_values import DICT_COLLISION, DICT_KEYS


class PhysicsObject(ABC):

    def __init__(self, data_object: dict, data_stadium: dict): 
        pass
    
    @staticmethod
    def apply_trait(self, data: dict) -> None:
        """
        Applies the trait to the physics object.
        """
        if self.trait is not None:
            trait_value = data.get('traits').get(self.trait)
            for key in trait_value:
                key_object = DICT_KEYS.get(key)
                if key_object is not None and hasattr(self, key_object):
                    if getattr(self, key_object) is None:
                        
                        if (key_object == 'collision_group' or key_object == 'collision_mask'):
                            value = self.transform_collision_dict(trait_value.get(key))
                        elif (key_object == 'curve'):
                            value = self.calculate_curve_float(trait_value.get(key))
                        else:
                            value = trait_value.get(key)
                            
                        setattr(self, key_object, value)

    @abstractmethod
    def apply_default_values(self):
        """
        Applies the default values to the physics object if they are none
        """
        pass
    
    @staticmethod
    def transform_collision_dict(collision_dict: dict) -> int:
        """
        Transforms the collision into a float.
        For example, ["ball", "red", "blue", "wall"] should return 1 + 2 + 4 + 32 = 39
        """
        if collision_dict is None:
            return None
        else:
            return sum(DICT_COLLISION[key] for key in collision_dict)
