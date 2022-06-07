from ursina import Ursina, window, camera, Vec2


class GameRenderer(object):
    def __init__(self, game) -> None:
        self.game = game
        self.app: Ursina = None
        self.disc_entities = []
        self.segment_entities = []
        self.background_entities = []

    def start(self) -> None:
        window.borderless = False
        window.vsync = True

        self.app = Ursina(
            title="HaxballGym",
            borderless=False,
            vsync=True,
        )
        window.exit_button.visible = False

        self.disc_entities = [
            disc.get_entity() for disc in self.game.stadium_game.discs
        ]
        self.segment_entities = [
            segment.get_entity() for segment in self.game.stadium_game.segments
        ]
        self.background_entities = self.game.stadium_game.background.get_entities()

        camera.orthographic = True
        camera.position = Vec2(0, 0)
        camera.fov = 550

        self.app.run()

    def update(self):
        for entity, game_disc in zip(self.disc_entities, self.game.stadium_game.discs):
            entity.position = game_disc.position
            entity.texture = "circle_outlined"
