from typing import Tuple
from haxballgym.game.common_values import COLLISION_FLAG_ALL
from haxballgym.game.objects.base import PhysicsObject

from ursina import Entity
import pygame

import numpy as np
import copy


class Disc(PhysicsObject):
    """
    A class to represent the state of a disc from the game.
    """

    def __init__(self, data_object=None, data_stadium=None):

        if data_object is None:
            data_object = {}

        self.collision_group: int = self.transform_collision_dict(
            data_object.get("cGroup")
        )
        self.collision_mask: int = self.transform_collision_dict(
            data_object.get("cMask")
        )
        self.position: np.ndarray = np.array(data_object.get("pos"), dtype=float)
        self.velocity: np.ndarray = np.array(data_object.get("speed"), dtype=float)
        self.gravity: np.ndarray = np.array(data_object.get("gravity"), dtype=float)
        self.bouncing_coefficient: float = data_object.get("bCoef")
        self.radius: float = data_object.get("radius")
        self.inverse_mass: float = data_object.get("invMass")
        self.damping: float = data_object.get("damping")
        self.color: str = data_object.get("color")
        self.trait = data_object.get("trait")

        self.apply_trait(self, data_stadium)
        self.apply_default_values()

    def apply_default_values(self):
        if self.collision_group is None:
            self.collision_group = COLLISION_FLAG_ALL
        if self.collision_mask is None:
            self.collision_mask = COLLISION_FLAG_ALL
        if np.isnan(self.velocity):
            self.velocity = np.zeros(2)
        if np.isnan(self.gravity):
            self.gravity = np.zeros(2)
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 0.5
        if self.radius is None:
            self.radius = 10
        if self.inverse_mass is None:
            self.inverse_mass = 0
        if self.damping is None:
            self.damping = 0.99
        if self.color is None:
            self.color = "FFFFFF"

    def copy(self, other: "Disc") -> None:
        self.collision_group = copy.copy(other.collision_group)
        self.collision_mask = copy.copy(other.collision_mask)
        self.position = copy.copy(other.position)
        self.velocity = copy.copy(other.velocity)
        self.gravity = copy.copy(other.gravity)
        self.bouncing_coefficient = copy.copy(other.bouncing_coefficient)
        self.radius = copy.copy(other.radius)
        self.inverse_mass = copy.copy(other.inverse_mass)
        self.damping = copy.copy(other.damping)
        self.color = copy.copy(other.color)

    def get_entity(self) -> Entity:
        disc_entity = Entity(
            model="quad",
            texture="circle_outlined",
            x=self.position[0],
            y=self.position[1],
            z=0,
            color=self.parse_color_entity(self.color),
            scale=(self.radius + 0.5) * 2,
            always_on_top=True,
        )

        return disc_entity

    def draw(self, surface: pygame.Surface, window_size: Tuple[int]) -> None:
        pygame.draw.circle(
            surface=surface,
            color=self.parse_color_entity_pygame(self.color),
            center=(
                self.position[0] + window_size[0] / 2,
                self.position[1] + window_size[1] / 2,
            ),
            radius=self.radius,
        )
        pygame.draw.circle(
            surface=surface,
            color=pygame.Color("black"),
            center=(
                self.position[0] + window_size[0] / 2,
                self.position[1] + window_size[1] / 2,
            ),
            radius=self.radius + 1,
            width=2,
        )
