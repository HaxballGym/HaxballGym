from typing import List
import numpy as np
import copy
import logging

from haxballgym.game.common_values import (
    COLLISION_FLAG_BLUE, COLLISION_FLAG_BLUEKO, COLLISION_FLAG_RED, COLLISION_FLAG_REDKO,
    TEAM_RED_ID, TEAM_BLUE_ID, TEAM_SPECTATOR_ID, GAME_STATE_KICKOFF, GAME_STATE_PLAYING,
    GAME_STATE_GOAL, GAME_STATE_END, COLLISION_FLAG_SCORE, MAP_CLASSIC
    
)
from haxballgym.game.objects.base import Disc
from haxballgym.game.objects.stadium_object import Stadium, load_stadium_hbs
from haxballgym.game.modules import GameScore, GameRecorder, resolve_collisions, update_discs, PlayerHandler

class Game():
    
    def __init__(self, stadium_file: str = MAP_CLASSIC, folder_rec: str = "", logging_level: int = logging.DEBUG):
        
        logging.basicConfig(level=logging_level, format="%(levelname)s - %(message)s")
        
        self.folder_rec = folder_rec
        self.score = GameScore()
        self.state = GAME_STATE_KICKOFF
        self.players: List[PlayerHandler] = []
        self.team_kickoff = TEAM_RED_ID
        self.stadium_file = stadium_file
        self.stadium_store: Stadium = load_stadium_hbs(self.stadium_file)
        self.stadium_game: Stadium = copy.deepcopy(self.stadium_store)
        self.recorder = GameRecorder(self, self.folder_rec)
   
   
    def add_player(self, player: PlayerHandler) -> None:
        player.disc.copy(self.stadium_store.player_physics)
        player.disc.collision_group |= COLLISION_FLAG_RED if player.team == TEAM_RED_ID else COLLISION_FLAG_BLUE
        self.players.append(player)
   
     
    def add_players(self, players: List[PlayerHandler]) -> None:
        for player in players:
            self.add_player(player)
    
    
    def make_player_action(self, player: PlayerHandler, action: np.ndarray) -> None:
        player.action = action
        player.resolve_movement(self.stadium_game, self.score)
    
    
    def load_map(self, map_file: str) -> None:
        """
        Loads a map from a hbs file.
        """
        self.stadium_file = map_file
        self.stadium_store: Stadium = load_stadium_hbs(map_file)
        self.stadium_game: Stadium = copy.deepcopy(self.stadium_store)
    
    
    def step(self, actions: np.ndarray) -> bool:
        for action, player in zip(actions, self.players):
            self.make_player_action(player, action)
        
        self.recorder.step(actions)
        previous_discs_position = [
            copy.deepcopy(disc) for disc in self.stadium_game.discs if disc.collision_group & COLLISION_FLAG_SCORE != 0
        ]
        update_discs(self.stadium_game)
        resolve_collisions(self.stadium_game)
        done = self.handle_game_state(previous_discs_position)
        
        return done
      

    def check_goal(self, previous_discs_position: List[Disc]) -> int:
        current_disc_position = [
            disc for disc in self.stadium_game.discs if disc.collision_group & COLLISION_FLAG_SCORE != 0
        ]
        for previous_disc_pos, current_disc_pos in zip(previous_discs_position, current_disc_position):
            for goal in self.stadium_game.goals:
                previous_p0 = previous_disc_pos.position - goal.points[0]
                current_p0 = current_disc_pos.position - goal.points[0]
                current_p1 = current_disc_pos.position - goal.points[1]
                disc_vector = current_disc_pos.position - previous_disc_pos.position
                goal_vector = goal.points[1] - goal.points[0]
                if np.cross(current_p0, disc_vector) * np.cross(current_p1, disc_vector) <= 0 and \
                   np.cross(previous_p0, goal_vector) * np.cross(current_p0, goal_vector) <= 0:
                       team_score = TEAM_RED_ID if goal.team == "red" else TEAM_BLUE_ID
                       return team_score
                    
        return TEAM_SPECTATOR_ID        
    

    def handle_game_state(self, previous_discs_position: List[Disc]) -> bool:

        self.score.step(self.state)
        
        if self.state == GAME_STATE_KICKOFF:
            for player in self.players:
                if player.disc.position is not None:
                    kickoff_collision = COLLISION_FLAG_REDKO if self.team_kickoff == TEAM_RED_ID else COLLISION_FLAG_BLUEKO
                    player.disc.collision_mask = 39 | kickoff_collision
            ball_disc = self.stadium_game.discs[0]
            if np.linalg.norm(ball_disc.velocity) > 0:
                logging.debug("Kickoff made")
                self.state = GAME_STATE_PLAYING
                
        elif self.state == GAME_STATE_PLAYING:
            for player in self.players:
                if player.disc.position is not None:
                    player.disc.collision_mask = 39
            team_goal = self.check_goal(previous_discs_position)
            if team_goal != TEAM_SPECTATOR_ID:
                logging.debug(f"Team {team_goal} conceded a goal")
                self.state = GAME_STATE_GOAL
                self.score.update_score(team_goal)
                if not self.score.is_game_over():
                    self.team_kickoff = TEAM_BLUE_ID if team_goal == TEAM_BLUE_ID else TEAM_RED_ID   
            elif self.score.is_game_over():
                self.state = GAME_STATE_END
                self.score.end_animation() 
                
        elif self.state == GAME_STATE_GOAL:
            self.score.animation_timeout -= 1
            if not self.score.is_animation():
                if self.score.is_game_over():
                    self.state = GAME_STATE_END
                    self.score.end_animation()
                else:
                    self.reset_discs_positions()
                    self.state = GAME_STATE_KICKOFF
                    
        elif self.state == GAME_STATE_END:
            self.score.animation_timeout -= 1
            if not self.score.is_animation():
                return True
            
        return False


    def reset_discs_positions(self) -> None:
        discs_game = self.stadium_game.discs if self.stadium_game.kickoff_reset == "full" else [self.stadium_game.discs[0]]
        discs_store = self.stadium_store.discs if self.stadium_store.kickoff_reset == "full" else [self.stadium_store.discs[0]]
        
        for disc_game, disc_store in zip(discs_game, discs_store):
            disc_game.copy(disc_store)
        
        red_count = 0
        blue_count = 0
        for player in self.players:
            if player.team == TEAM_RED_ID:
                player.disc.position[0] = -self.stadium_game.spawn_distance
                if ((red_count % 2) == 1):
                    player.disc.position[1] = -55 * (red_count + 1 >> 1)
                else:
                    player.disc.position[1] = 55 * (red_count + 1 >> 1)
                red_count += 1
                
            elif player.team == TEAM_BLUE_ID:
                player.disc.position[0] = self.stadium_game.spawn_distance
                if ((blue_count % 2) == 1):
                    player.disc.position[1] = -55 * (blue_count + 1 >> 1)
                else:
                    player.disc.position[1] = 55 * (blue_count + 1 >> 1)
                blue_count += 1


    def start(self) -> None:
        for player in self.players:
            self.stadium_game.discs.append(player.disc)
        self.reset_discs_positions()
        self.recorder.start()
    

    def stop(self, save_recording: bool) -> None:
        self.recorder.stop(save=save_recording)
        
        self.score = GameScore()
        self.state = GAME_STATE_KICKOFF
        self.team_kickoff = TEAM_RED_ID
        self.stadium_game: Stadium = copy.deepcopy(self.stadium_store)
        self.recorder = GameRecorder(self, self.folder_rec)


    def reset(self, save_recording: bool) -> None:
        self.stop(save_recording)
        self.start()

    
    
if __name__ == "__main__":
    game = Game()
    
    custom_score = GameScore(time_limit=1, score_limit=1)
    game.score = custom_score
    
    player_red = PlayerHandler("P0", TEAM_RED_ID)
    player_blue = PlayerHandler("P1", TEAM_BLUE_ID)
    game.add_players([player_red, player_blue])
    
    game.start()
    
    done = False
    while not done:
        RIGHT_ACTION = 1
        UP_ACTION = 0
        KICK_ACTION = 0
        actions_player_1 = [RIGHT_ACTION, UP_ACTION, KICK_ACTION]
        RIGHT_ACTION = -1
        UP_ACTION = 1
        KICK_ACTION = 1
        actions_player_2 = [RIGHT_ACTION, UP_ACTION, KICK_ACTION]
        done = game.step([actions_player_1, actions_player_2])
    
    
    logging.debug("Game over")
    game.stop(save_recording=True)
