import numpy as np

from haxballgym.game import Game
from haxballgym.game.modules import GameRecorder, PlayerHandler
from haxballgym.game.common_values import (
    INPUT_DOWN, INPUT_SHOOT, INPUT_LEFT, INPUT_RIGHT, INPUT_UP
)


def input_decode_js(input_js: int) -> np.ndarray:
    actions = np.zeros(3, dtype=float)
    
    if input_js & INPUT_LEFT != 0:
        actions[0] = -1
    elif input_js & INPUT_RIGHT != 0:
        actions[0] = 1
        
    if input_js & INPUT_UP != 0:
        actions[1] = 1
    elif input_js & INPUT_DOWN != 0:
        actions[1] = -1
    
    if input_js & INPUT_SHOOT != 0:
        actions[2] = 1
        
    return actions



def play_recording(recording: GameRecorder) -> None:
    game = Game()
    game.team_kickoff = recording.options[0] / 8
    for player_array in recording.player_info:
        player_handler = PlayerHandler(player_array[0], player_array[2])
        game.add_player(player_handler)     
        
    game.start()
    
    done = False
    i = 0
    while not done and i < len(recording.player_action[0]):
        actions = []
        for player_action in recording.player_action:
            actions.append(input_decode_js(player_action[i]))
        done = game.step(actions)
        i += 1
        
    game.stop(save_recording=False)
