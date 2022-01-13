"""
Data classes to permit the manipulation of environment variables.
"""

from haxballgym.utils.gamestates.game_state import GameState
from haxballgym.utils.state_setters.wrappers import PhysicsWrapper, PawnWrapper
from haxballgym.utils.common_values import RED_TEAM, BLUE_TEAM
from typing import List


class StateWrapper(object):

    def __init__(self, red_count: int = 0, blue_count: int = 0, game_state = None):
        """
        StateWrapper constructor. Under most circumstances, users should not expect to instantiate their own StateWrapper objects.

        :param red_count: Integer indicating the amount of players on the red team.
        :param blue_count: Integer indicating The amount of players on the blue team.
        :param game_state: GameState object for values to be copied from.

        NOTE: red_count and blue_count will be ignored if a GameState object is passed.
        """
        if game_state is None:
            self.ball: PhysicsWrapper = PhysicsWrapper()
            self.pawns: List[PawnWrapper] = []
            for i in range(red_count):
                self.pawns.append(PawnWrapper(RED_TEAM, 2*i))
            for i in range(blue_count):
                self.pawns.append(PawnWrapper(BLUE_TEAM, 2*i + 1))
        else:
            self._read_from_gamestate(game_state)

    def _read_from_gamestate(self, game_state: GameState):
        """
        A function to modify the StateWrapper with values read in from a GameState object.
        """
        self.ball: PhysicsWrapper = PhysicsWrapper(game_state.ball)
        self.pawns: List[PawnWrapper] = []
        for player in game_state.players:
            self.pawns.append(PawnWrapper(player_data=player))

    def red_pawns(self) -> List[PawnWrapper]:
        
        return [p for p in self.pawns if p.team_num == RED_TEAM]

    def blue_pawns(self) -> List[PawnWrapper]:
        
        return [p for p in self.pawns if p.team_num == BLUE_TEAM]

    def format_state(self) -> list:
        """
        A function to format the values stored within a StateWrapper object.
        These values are sent as a string to be applied to the game engine upon an environment reset.

        :return: String containing all state values.
        """
        # Ball: X, Y, VX, VY
        # Pawns: ID, X, Y, VX, VY

        # retrieve the ball string
        ball_state = self.ball._encode()

        # retrieve pawn strings
        pawn_states = []
        for c in self.cars:
            pawn_states += c._encode()

        encoded = ball_state + pawn_states

        return encoded