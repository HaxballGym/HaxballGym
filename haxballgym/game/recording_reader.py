import numpy as np

from haxballgym.game import Game
from haxballgym.game.modules import GameActionRecorder, GamePositionRecorder, PlayerHandler
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


def set_disc_position(disc, player_position):
    disc.position = np.array([player_position[0], player_position[1]])
    disc.velocity = np.array([player_position[2], player_position[3]])
    disc.collision_group = player_position[4]
    disc.collision_mask = player_position[5]
    disc.radius = player_position[6]
    disc.inverse_mass = player_position[7]
    disc.bouncing_coefficient = player_position[8]
    disc.damping_coefficient = player_position[9]
    

def play_action_recording(action_recording: GameActionRecorder) -> None:
    game = Game()
    game.team_kickoff = action_recording.options[0] / 8
    for player_array in action_recording.player_info:
        player_handler = PlayerHandler(player_array[0], player_array[2])
        game.add_player(player_handler)     
        
    game.start()
    
    done = False
    i = 0
    while not done and i < len(action_recording.player_action[0]):
        actions = []
        for player_action in action_recording.player_action:
            actions.append(input_decode_js(player_action[i]))
        done = game.step(actions)
        i += 1
        
    game.stop(save_recording=False)

def play_position_recording(position_recording: GamePositionRecorder) -> None:
    game = Game()
    game.team_kickoff = position_recording.options[0] / 8
    for player_array in position_recording.player_info:
        player_handler = PlayerHandler(player_array[0], player_array[2])
        game.add_player(player_handler)     
        
    game.start()
    
    done = False
    i = 0
    while not done and i < len(position_recording.player_info):
        actions = []
        for j, act in enumerate(position_recording.player_action):
            actions.append(input_decode_js(0))
            set_disc_position(game.players[j].disc, act)
            
        done = game.step(actions)
        i += 1
        
    game.stop(save_recording=False)

if __name__ == "__main__":
    game = Game()
    rec_path = "/FULL/PATH/TO/recording.hbar"
    rec = GamePositionRecorder(game)
    rec.read_from_file(rec_path)
    play_position_recording(rec)