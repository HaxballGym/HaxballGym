from haxballgym.utils.gamestates import PhysicsObject
import numpy as np


class PhysicsWrapper(object):

    def __init__(self, phys_obj: PhysicsObject = None):
        """
        PhysicsWrapper constructor. Under most circumstances, users should not expect to instantiate their own PhysicsWrapper objects.

        :param phys_obj: PhysicsObject object from which values will be read.
        """
        if phys_obj is None:
            self.position: np.ndarray = np.zeros(2)
            self.velocity: np.ndarray = np.zeros(2)
        else:
            self._read_from_physics_object(phys_obj)

    def _read_from_physics_object(self, phys_obj: PhysicsObject):
        """
        A function to modify PhysicsWrapper values from values in a PhysicsObject object.
        """
        self.position = phys_obj.position
        self.velocity = phys_obj.velocity

    def set_pos(self, x: float = None, y: float = None):
        """
        Sets position.

        :param x: Float indicating x position value.
        :param y: Float indicating y position value.
        """
        if x is not None:
            self.position[0] = x
        if y is not None:
            self.position[1] = y

    def set_vel(self, x: float = None, y: float = None):
        """
        Sets velocity.

        :param x: Float indicating x velocity value.
        :param y: Float indicating y velocity value.
        """
        if x is not None:
            self.velocity[0] = x
        if y is not None:
            self.velocity[1] = y

    def _encode(self) -> list:
        """
        Function called by a StateWrapper to produce a state string.

        :return: String containing value data.
        """
        encoded = np.concatenate((self.position, self.velocity))
        return encoded.tolist()
