from math import pi, tan
from typing import List
from ursina import Entity, Pipe
import pygame
from haxballgym.game.common_values import COLLISION_FLAG_WALL, COLLISION_FLAG_ALL
from haxballgym.game.objects.base import PhysicsObject
from haxballgym.game.objects.base import Vertex
import numpy as np


class Segment(PhysicsObject):
    """
    A class to represent the state of a segment from the game.
    """

    def __init__(self, data_object: dict, data_stadium: dict):

        if data_object is None:
            data_object = {}

        self.collision_group: int = self.transform_collision_dict(
            data_object.get("cGroup")
        )
        self.collision_mask: int = self.transform_collision_dict(
            data_object.get("cMask")
        )
        self.vertices_index: List[int] = [data_object.get("v0"), data_object.get("v1")]
        self.vertices: List[Vertex] = [
            Vertex(data_stadium.get("vertexes")[i], data_stadium)
            for i in self.vertices_index
        ]

        self.bouncing_coefficient: float = data_object.get("bCoef")
        self.curve: float = data_object.get("curve")
        self._curveF: float = data_object.get("curveF")
        self.bias: float = data_object.get("bias")
        self.color: str = data_object.get("color")
        self.visible: bool = data_object.get("vis")
        self.trait: str = data_object.get("trait")

        # Additional properties
        self.circle_center: np.ndarray = np.zeros(2)
        self.circle_radius: float = 0
        self.circle_tangeant: List[np.ndarray] = np.array(
            [np.zeros(2), np.zeros(2)], dtype=float
        )
        self.circle_angle: np.ndarray = np.zeros(2)

        self.apply_trait(self, data_stadium)
        self.apply_default_values()

        self.curve = self.calculate_curve()
        self.calculate_additional_properties()

    def apply_default_values(self):
        """
        Applies the default values to the segment if they are none
        """
        if self.bouncing_coefficient is None:
            self.bouncing_coefficient = 1
        if self.collision_group is None:
            self.collision_group = COLLISION_FLAG_WALL
        if self.collision_mask is None:
            self.collision_mask = COLLISION_FLAG_ALL
        if self.curve is None:
            self.curve = 0
        if self.bias is None:
            self.bias = 0
        if self.color is None:
            self.color = "000000"
        if self.visible is None:
            self.visible = "true"

    def calculate_curve(self) -> float:
        # TODO: Figure out why this works. In the dev notes, it says it's to keep the correct float value.
        # Dev notes on curveF: This value is only useful for exporting stadiums without precision loss.

        if self._curveF is not None:
            return self._curveF

        if self.curve is not None:
            curve_value = self.curve * pi / 180
            if curve_value < 0:
                curve_value *= -1
                self.vertices = [self.vertices[1], self.vertices[0]]
                self.bias = -self.bias

            liminf = 0.17435839227423353
            limsup = 340 * pi / 180
            if liminf < curve_value < limsup:
                curve_value = 1 / tan(curve_value / 2)

            return curve_value

        return 0

    def calculate_additional_properties(self) -> None:
        """
        Calculate the additional properties of the segment
        """
        if self.curve != 0:
            vector_center = (self.vertices[1].position - self.vertices[0].position) / 2
            self.circle_center[0] = (
                self.vertices[0].position[0]
                + vector_center[0]
                - vector_center[1] * self.curve
            )
            self.circle_center[1] = (
                self.vertices[0].position[1]
                + vector_center[1]
                + vector_center[0] * self.curve
            )
            self.circle_radius = np.linalg.norm(
                self.vertices[1].position - self.circle_center
            )

            self.circle_tangeant[0][0] = -(
                self.vertices[0].position[1] - self.circle_center[1]
            )
            self.circle_tangeant[0][1] = (
                self.vertices[0].position[0] - self.circle_center[0]
            )
            self.circle_tangeant[1][0] = -(
                self.circle_center[1] - self.vertices[1].position[1]
            )
            self.circle_tangeant[1][1] = (
                self.vertices[1].position[0] - self.circle_center[0]
            )

            self.circle_angle[0] = np.arctan2(
                self.vertices[0].position[1] - self.circle_center[1],
                self.vertices[0].position[0] - self.circle_center[0],
            )
            self.circle_angle[1] = np.arctan2(
                self.vertices[1].position[1] - self.circle_center[1],
                self.vertices[1].position[0] - self.circle_center[0],
            )

            # Arc is always clockwise
            while self.circle_angle[1] < self.circle_angle[0]:
                self.circle_angle[1] += 2 * pi

            if self.curve < 0:
                self.circle_tangeant = -self.circle_tangeant

    def get_entity(self) -> Entity:
        if self.visible is False:
            return None

        if self.curve != 0:
            # TODO: add the radius as a parameter
            # this is to draw enough segments, but not too many depending on the angle
            nb_segments = int(
                (self.circle_angle[1] - self.circle_angle[0]) / (2 * pi) * 64
            )

            arc_vertices = self.arc(
                x=self.circle_center[0],
                y=self.circle_center[1],
                radius=self.circle_radius,
                start_angle=self.circle_angle[0],
                end_angle=self.circle_angle[1],
                segments=nb_segments,
                clockwise=True,
            )
            vert_mesh = tuple((v[0], v[1], 0) for (k, v) in enumerate(arc_vertices))
        else:
            vert_mesh = tuple((v.position[0], v.position[1], 0) for v in self.vertices)

        line_entity_mesh = Entity(
            model=Pipe(
                path=vert_mesh,
                thicknesses=[3],
            ),
            color=self.parse_color_entity(self.color),
        )

        return line_entity_mesh

    def draw(self, surface, window_size):
        if self.visible is False:
            return None

        if self.curve != 0:
            nb_segments = int(
                (self.circle_angle[1] - self.circle_angle[0]) / (2 * pi) * 64
            )

            vertices_draw = self.arc(
                x=self.circle_center[0] + window_size[0] / 2,
                y=self.circle_center[1] + window_size[1] / 2,
                radius=self.circle_radius,
                start_angle=self.circle_angle[0],
                end_angle=self.circle_angle[1],
                segments=nb_segments,
                clockwise=True,
            )
        else:
            vertices_draw = [
                (v.position[0] + window_size[0] / 2, v.position[1] + window_size[1] / 2)
                for v in self.vertices
            ]

        pygame.draw.lines(
            surface=surface,
            color=self.parse_color_entity_pygame(self.color),
            closed=False,
            points=vertices_draw,
            width=4,
        )
