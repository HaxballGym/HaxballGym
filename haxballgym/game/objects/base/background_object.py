from numpy import pi
from ursina import *
from haxballgym.game.common_values import (
    GRASS_BORDER_COLOR,
    GRASS_FILL_COLOR,
    HOCKEY_BORDER_COLOR,
    HOCKEY_FILL_COLOR,
    DEFAULT_BORDER_COLOR,
    DEFAULT_FILL_COLOR,
)
from haxballgym.game.objects.base import PhysicsObject


class Background:
    def __init__(self, data_object=None):

        if data_object is None:
            data_object = {}

        self.type = data_object.get("type")
        self.limit_width = data_object.get("width")
        self.limit_height = data_object.get("height")
        self.kickoff_radius = data_object.get("kickOffRadius")
        self.color = data_object.get("color")

        if self.type == "grass":
            self.border_color = GRASS_BORDER_COLOR
            self.fill_color = GRASS_FILL_COLOR
        elif self.type == "hockey":
            self.border_color = HOCKEY_BORDER_COLOR
            self.fill_color = HOCKEY_FILL_COLOR
        else:
            self.border_color = DEFAULT_BORDER_COLOR
            self.fill_color = DEFAULT_FILL_COLOR

    def get_limit_entity(self):
        if self.limit_width is not None and self.limit_height is not None:
            vertices_entity = tuple(
                [
                    (-self.limit_width - 1.25, -self.limit_height, 0),
                    (self.limit_width + 1.25, -self.limit_height, 0),
                    (self.limit_width, -self.limit_height, 0),
                    (self.limit_width, self.limit_height, 0),
                    (self.limit_width + 1.25, self.limit_height, 0),
                    (-self.limit_width - 1.25, self.limit_height, 0),
                    (-self.limit_width, self.limit_height, 0),
                    (-self.limit_width, -self.limit_height, 0),
                ]
            )

            limit_entity = Entity(
                model=Mesh(
                    vertices=vertices_entity,
                    mode="line",
                    thickness=6,
                ),
                z=0.1,
                color=PhysicsObject.parse_color_entity(self.border_color),
            )
            return limit_entity

    def get_kickoff_circle_entity(self):

        circle_vertices = PhysicsObject.arc(
            x=0,
            y=0,
            radius=self.kickoff_radius,
            start_angle=0,
            end_angle=2 * pi,
            segments=64,
            clockwise=True,
        )
        vert_mesh = tuple((v[0], v[1], 0.1) for v in circle_vertices)

        kickoff_circle_entity = Entity(
            model=Pipe(
                path=vert_mesh,
                thicknesses=[3],
            ),
            z=0.1,
            color=PhysicsObject.parse_color_entity(self.border_color),
        )

        return kickoff_circle_entity

    def get_kickoff_line_entity(self):
        if self.limit_height is not None:
            vertices_entity = tuple(
                [
                    (0, -self.limit_height, 0),
                    (0, self.limit_height, 0),
                ]
            )

            limit_entity = Entity(
                model=Mesh(
                    vertices=vertices_entity,
                    mode="line",
                    thickness=6,
                ),
                z=0.1,
                color=PhysicsObject.parse_color_entity(self.border_color),
            )
            return limit_entity

    def get_entities(self):
        return [
            self.get_limit_entity(),
            self.get_kickoff_circle_entity(),
            self.get_kickoff_line_entity(),
        ]
