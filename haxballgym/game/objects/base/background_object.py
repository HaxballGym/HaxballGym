from typing import List
from numpy import pi
from PIL import Image
from ursina import Entity, Mesh, Pipe, Sprite, Sky, Texture, load_texture
from haxballgym.game.common_values import (
    GRASS_BORDER_COLOR,
    GRASS_FILL_COLOR,
    HOCKEY_BORDER_COLOR,
    HOCKEY_FILL_COLOR,
    DEFAULT_BORDER_COLOR,
    DEFAULT_FILL_COLOR,
)
from haxballgym.game.objects.base import PhysicsObject
import pygame


class Background:
    def __init__(self, data_object=None):

        if data_object is None:
            data_object = {}

        self.type: str = data_object.get("type")
        self.limit_width: float = data_object.get("width")
        self.limit_height: float = data_object.get("height")
        self.kickoff_radius: float = data_object.get("kickOffRadius")
        self.color: str = data_object.get("color")

        if self.type == "grass":
            self.border_color = GRASS_BORDER_COLOR
            self.fill_color = GRASS_FILL_COLOR
        elif self.type == "hockey":
            self.border_color = HOCKEY_BORDER_COLOR
            self.fill_color = HOCKEY_FILL_COLOR
        else:
            self.border_color = DEFAULT_BORDER_COLOR
            self.fill_color = DEFAULT_FILL_COLOR

    def get_limit_entity(self) -> Entity:
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

    def draw_limit(self, surface, window_size) -> None:
        if self.limit_width is not None and self.limit_height is not None:
            pygame.draw.rect(
                surface=surface,
                color=PhysicsObject.parse_color_entity_pygame(self.border_color),
                rect=(
                    -self.limit_width + window_size[0] / 2,
                    -self.limit_height + window_size[1] / 2,
                    self.limit_width * 2,
                    self.limit_height * 2,
                ),
                width=4,
                border_radius=0,
            )

    def get_kickoff_circle_entity(self) -> Entity:
        if self.type == "grass" or self.type == "hockey":
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

    def draw_kickoff_circle(self, surface, window_size) -> None:
        if self.type == "grass" or self.type == "hockey":
            pygame.draw.circle(
                surface=surface,
                color=PhysicsObject.parse_color_entity_pygame(self.border_color),
                center=(0 + window_size[0] / 2, 0 + window_size[1] / 2),
                radius=self.kickoff_radius,
                width=4,
            )

    def get_kickoff_line_entity(self) -> Entity:
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

    def draw_kickoff_line(self, surface, window_size) -> None:
        if self.limit_height is not None:
            pygame.draw.line(
                surface=surface,
                color=PhysicsObject.parse_color_entity_pygame(self.border_color),
                start_pos=(
                    0 + window_size[0] / 2,
                    -self.limit_height + window_size[1] / 2,
                ),
                end_pos=(
                    0 + window_size[0] / 2,
                    self.limit_height + window_size[1] / 2 - 2,
                ),
                width=4,
            )

    def get_fill_canvas(self) -> Entity:
        color = self.color if self.color is not None else self.fill_color
        sky = Sky()
        sky = Entity(
            scale=9900,
            model="quad",
            color=color,
            z=2,
        )
        return sky

    def fill_screen(self, surface) -> None:
        color = self.color if self.color is not None else self.fill_color
        surface.fill(PhysicsObject.parse_color_entity_pygame(color))

    def get_entities(self):
        return [
            self.get_limit_entity(),
            self.get_kickoff_circle_entity(),
            self.get_kickoff_line_entity(),
            self.get_fill_canvas(),
        ]

    def draw(self, surface, window_size) -> None:
        self.fill_screen(surface)
        self.draw_limit(surface, window_size)
        self.draw_kickoff_circle(surface, window_size)
        self.draw_kickoff_line(surface, window_size)
