from typing import List
from haxballgym.game.common_values import COLLISION_FLAG_BLUEKO, COLLISION_FLAG_REDKO, TEAM_RED_ID, TEAM_BLUE_ID, TEAM_SPECTATOR_ID, GAME_STATE_KICKOFF, \
    GAME_STATE_PLAYING, GAME_STATE_GOAL, GAME_STATE_END, COLLISION_FLAG_SCORE
from haxballgym.game.objects.stadium_object import Stadium
from haxballgym.game.physics import GameScore, resolve_collisions, update_discs, Player
import numpy as np
from copy import deepcopy

class Game():
    
    def __init__(self, stadium) -> None:
        self.score = GameScore()
        self.state = GAME_STATE_KICKOFF
        self.players: List[Player] = []
        self.team_kickoff = TEAM_RED_ID
        self.stadium_store: Stadium = stadium
        self.stadium_game: Stadium = deepcopy(stadium)
        
    
    def step(self, actions):
        for action, player in zip(actions, self.players):
            player.make_action(action)
        previous_discs_position = [
            disc for disc in self.stadium_game.discs if disc.collision_group & COLLISION_FLAG_SCORE != 0
        ]
        update_discs(self.stadium_game)
        resolve_collisions(self.stadium_game)
        self.handle_game_state(previous_discs_position)
        
        return
      

    def handle_game_state(self, previous_discs_position) -> None:
        
        if self.state == GAME_STATE_KICKOFF:
            for player in self.players:
                if player.disc.position is not None:
                    kickoff_collision = COLLISION_FLAG_REDKO if self.team_kickoff == TEAM_RED_ID else COLLISION_FLAG_BLUEKO
                    player.disc.collision_mask = 39 | kickoff_collision
            ball_disc = self.stadium_game.discs[0]
            if np.linalg.norm(ball_disc.velocity) > 0:
                self.state = GAME_STATE_PLAYING
                
        elif self.state == GAME_STATE_PLAYING:
            self.score.step()
            for player in self.players:
                if player.disc.position is not None:
                    player.disc.collision_mask = 39
            team_goal = self.check_goal(previous_discs_position)
            if team_goal != TEAM_SPECTATOR_ID:
                self.state = GAME_STATE_GOAL
                self.score.update_score(team_goal)
                if not self.score.is_game_over():
                    self.team_kickoff = TEAM_BLUE_ID if team_goal == TEAM_RED_ID else TEAM_RED_ID   
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
                    
        elif self.state == GAME_STATE_END:
            self.score.animation_timeout -= 1
            if not self.score.is_animation():
                self.reset()
            
        return


    def check_goal(self, previous_disc_position) -> int:
        current_disc_position = [
            disc for disc in self.stadium_game.discs if disc.collision_group & COLLISION_FLAG_SCORE != 0
        ]
        for previous_disc_pos, current_disc_pos in zip(previous_disc_position, current_disc_position):
            for goal in self.stadium_game.goals:
                previous_p0 = previous_disc_pos.position - goal.points[0]
                current_p0 = current_disc_pos.position - goal.points[0]
                current_p1 = current_disc_pos.position - goal.points[1]
                disc_vector = current_disc_pos.position - previous_disc_pos.position
                goal_vector = goal.points[1] - goal.points[0]
                if np.cross(current_p0, disc_vector) * np.cross(current_p1, disc_vector) <= 0 and \
                   np.cross(previous_p0, goal_vector) * np.cross(current_p0, goal_vector) <= 0:
                        return goal.team
                    
        return TEAM_SPECTATOR_ID        
    

    def reset_discs_positions(self):
        discs_game = self.stadium_game.discs if self.stadium_game.kickoff_reset == "full" else self.stadium_game.discs[0]
        discs_store = self.stadium_store.discs if self.stadium_store.kickoff_reset == "full" else self.stadium_store.discs[0]
        
        for disc_game, disc_store in zip(discs_game, discs_store):
            disc_game.position = disc_store.position
            disc_game.velocity = disc_store.velocity
            disc_game.radius = disc_store.radius
            disc_game.bouncing_coefficient = disc_store.bouncing_coefficient
            disc_game.inverse_mass = disc_store.inverse_mass
            disc_game.damping = disc_store.damping
            disc_game.collision_mask = disc_store.collision_mask
            disc_game.collision_group = disc_store.collision_group
        
        for player in self.players:
            red_count = 0
            blue_count = 0
            if player.team_num == TEAM_RED_ID:
                player.disc.position[0] = -self.stadium_game.spawn_distance
                if ((red_count % 2) == 1):
                    player.disc.position[1] = -55 * (red_count + 1 >> 1)
                else:
                    player.disc.position[1] = 55 * (red_count + 1 >> 1)
                red_count += 1
                
            elif player.team_num == TEAM_BLUE_ID:
                player.disc.position[0] = self.stadium_game.spawn_distance
                if ((blue_count % 2) == 1):
                    player.disc.position[1] = -55 * (blue_count + 1) >> 1
                else:
                    player.disc.position[1] = 55 * (blue_count + 1) >> 1
                blue_count += 1


    def reset(self):
        pass


    def start(self):
        # Must add ball and players to discs
        self.stadium_game.discs.insert(0, self.ball)
        for player in self.players:
            self.stadium_game.discs.append(player.disc)
            
        self.reset_discs_positions()
        self.start_recording()
        return


    def stop(self):
        pass


    def start_recording(self):
        # TODO: Add recording
        pass
    
    
    def stop_recording(self):
        # TODO: Add recording
        pass
    