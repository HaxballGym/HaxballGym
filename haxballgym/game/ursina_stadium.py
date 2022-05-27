from ursina import *
from ursina.prefabs.video_recorder import VideoRecorderUI, VideoRecorder
from ursina.application import paused, pause, resume

from haxballgym.game import Game
from haxballgym.game.common_values import TEAM_BLUE_ID, TEAM_RED_ID

from haxballgym.game.modules.game.game_score import GameScore
from haxballgym.game.modules.player.player_handler import PlayerHandler


game = Game()

custom_score = GameScore(time_limit=1, score_limit=1)
game.score = custom_score

player_red = PlayerHandler("P0", TEAM_RED_ID)
player_blue = PlayerHandler("P1", TEAM_BLUE_ID)
game.add_players([player_red, player_blue])

game.start()

segment_entities = [segment.get_entity() for segment in game.stadium_game.segments]
disc_entities = [disc.get_entity() for disc in game.stadium_game.discs]

window.borderless = False
window.vsync = True

app = Ursina()

window.title = "HaxballGym"
window.exit_button.visible = False


def update():
    RIGHT_ACTION_1 = 1
    UP_ACTION_1 = 0
    KICK_ACTION_1 = 0
    actions_player_1 = [RIGHT_ACTION_1, UP_ACTION_1, KICK_ACTION_1]
    RIGHT_ACTION_2 = -1
    UP_ACTION_2 = 1
    KICK_ACTION_2 = 1
    actions_player_2 = [RIGHT_ACTION_2, UP_ACTION_2, KICK_ACTION_2]
    done = game.step([actions_player_1, actions_player_2])
    for entity, game_disc in zip(disc_entities, game.stadium_game.discs):
        entity.position = game_disc.position
        entity.texture = "circle_outlined"

    if done:
        # quit()
        done = False


background_entities = []

camera.orthographic = True
camera.position = Vec2(0, 0)
camera.fov = 480

vr = VideoRecorderUI()

app.run()
