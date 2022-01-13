"""
A class to represent the state of a physics object from the game.
"""

import numpy as np

class PhysicsObject(object):
    def __init__(self, position=None, velocity=None):
        self.position: np.ndarray = position if position is not None else np.zeros(2)
        self.velocity: np.ndarray = velocity if velocity is not None else np.zeros(2)