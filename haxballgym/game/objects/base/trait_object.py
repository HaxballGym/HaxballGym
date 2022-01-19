from haxballgym.game.objects.base import PhysicsObject

class Trait(PhysicsObject):
    """
    A class to represent the state of a Trait from the game.
    """

    def __init__(self, data_object: dict, name: str):
        
        if data_object is None:
            data_object = {}

        self.collision_group: int = self.transform_collision_dict(data_object.get('cGroup'))
        self.collision_mask: int = self.transform_collision_dict(data_object.get('cMask'))
        self.name = name
        self.bouncing_coefficient: float = data_object.get('bCoef')
        self.radius: float = data_object.get('radius')
        self.inverse_mass: float = data_object.get('invMass')
        self.damping: float = data_object.get('damping')
        self.trait = data_object.get('trait')
        
    def apply_default_values(self):
        pass
