"""
A class containing all data about a player in the game.
"""

from haxballgym.utils.gamestates import PhysicsObject


class PlayerData(object):
    def __init__(self):
        self.pawn_id: int = -1
        self.team_num: int = -1
        self.match_goals: int = -1
        self.match_saves: int = -1
        self.match_shots: int = -1
        self.ball_touched: bool = False
        self.is_shooting: bool = False
        self.pawn_data: PhysicsObject = PhysicsObject()

    def __str__(self):
        output = f"****PLAYER DATA OBJECT****\n" \
                 "Match Goals: {self.match_goals}\n" \
                 "Match Saves: {self.match_saves}\n" \
                 "Match Shots: {self.match_shots}\n" \
                 "Ball Touched: {self.ball_touched}\n" \
                 "Is Shooting: {self.is_shooting}\n" \
                 "Pawn Data: {self.pawn_data}\n"
        return output