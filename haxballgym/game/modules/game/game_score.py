from haxballgym.game.common_values import (
    TEAM_RED_ID,
    TEAM_BLUE_ID,
    TEAM_SPECTATOR_ID,
    GAME_STATE_KICKOFF,
    GAME_STATE_PLAYING,
    TEAM_RED_COLOR,
    TEAM_BLUE_COLOR,
)
from haxballgym.game.objects.base import PhysicsObject

from ursina import *


class GameScore(object):
    def __init__(self, time_limit=None, score_limit=None):
        # The GameScore object is used to keep track of the score of the game.
        # Score limit = 0 means no score limit, same for time limit.
        self.ticks = 0
        self.total_ticks = 0
        self.time = 0
        self.red = 0
        self.blue = 0
        self.time_limit = time_limit * 60 if time_limit is not None else 3 * 60
        self.score_limit = score_limit if score_limit is not None else 3
        self.animation_timeout = 0

    def step(self, state: int) -> None:
        if state == GAME_STATE_KICKOFF:
            self.total_ticks += 1
        elif state == GAME_STATE_PLAYING:
            self.total_ticks += 1
            self.ticks += 1
            self.time = self.ticks / 60

    def reset(self) -> None:
        self.total_ticks = 0
        self.ticks = 0
        self.time = 0
        self.red = 0
        self.blue = 0

    def update_score(self, team_id: int) -> None:
        if team_id == TEAM_BLUE_ID:
            self.red += 1
        elif team_id == TEAM_RED_ID:
            self.blue += 1
        else:
            raise ValueError("Invalid team_id: {}".format(team_id))
        self.animation_timeout = 150

    def is_score_limit_reached(self) -> bool:
        return self.score_limit > 0 and (
            self.red >= self.score_limit or self.blue >= self.score_limit
        )

    def is_time_limit_reached(self) -> bool:
        return self.time_limit > 0 and (
            self.time >= self.time_limit and self.red != self.blue
        )

    def is_animation(self) -> bool:
        return self.animation_timeout > 0

    def end_animation(self) -> None:
        self.animation_timeout = 300
        return

    def is_game_over(self) -> bool:
        return self.is_score_limit_reached() or self.is_time_limit_reached()

    def get_winner(self) -> int:
        if self.red > self.blue:
            return TEAM_RED_ID
        elif self.blue > self.red:
            return TEAM_BLUE_ID
        else:
            return TEAM_SPECTATOR_ID

    def get_time_string(self) -> str:
        return f"{int(self.time / 60):02d}:{int(self.time % 60):02d}"

    def get_score_string(self) -> str:
        return f"{self.red} - {self.blue}"

    def get_time_entity(self) -> Entity:
        text_time = self.get_time_string()
        text_time_width = Text.get_width(text_time, font="fonts/arial-black.ttf")
        print(text_time_width)

        time_text_entity = Text(
            position=Vec2(0.3 - 1.5 * text_time_width / 2, 0.5 - Text.size * 1.35),
            origin=Vec2(0, 0),
            size=1.25 * Text.size,
            text=self.get_time_string(),
            font="fonts/arial-black.ttf",
        )

        return time_text_entity

    def get_fixed_entities(self) -> Entity:
        background_score = Entity(
            parent=camera.ui,
            position=Vec3(0, 0.5 - Text.size * 1.25, 1),
            scale=(0.6, Text.size * 2.5),
            model=Quad(
                aspect=(0.6 / Text.size * 2.5),
                radius=0.1,
            ),
            color=PhysicsObject.parse_color_entity("1A2125"),
        )

        red_score_square = Entity(
            parent=camera.ui,
            position=Vec2(-0.25, 0.5 - Text.size * 1.25),
            scale=Text.size * 1.5,
            model=Quad(
                aspect=1,
                radius=0.1,
            ),
            color=PhysicsObject.parse_color_entity(TEAM_RED_COLOR),
        )

        blue_score_square = Entity(
            parent=camera.ui,
            position=Vec2(-0.10, 0.5 - Text.size * 1.25),
            scale=Text.size * 1.5,
            model=Quad(
                aspect=1,
                radius=0.1,
            ),
            color=PhysicsObject.parse_color_entity(TEAM_BLUE_COLOR),
        )

        return [background_score, red_score_square, blue_score_square]

    def get_string_entities(self) -> Entity:

        score_text_entity = Text(
            position=Vec2(-0.175, 0.5 - Text.size * 1.35),
            origin=Vec2(0, 0),
            size=1.25 * Text.size,
            text=self.get_score_string(),
            font="fonts/arial-black.ttf",
        )

        time_text_entity = self.get_time_entity()

        return [
            score_text_entity,
            time_text_entity,
        ]
