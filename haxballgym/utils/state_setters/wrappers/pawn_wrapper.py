from haxballgym.utils.state_setters.wrappers import PhysicsWrapper
from haxballgym.utils.gamestates import PlayerData
import numpy as np



class PawnWrapper(PhysicsWrapper):

    def __init__(self, team_num: int = -1, id: int = -1, player_data: PlayerData = None):
        """
        CarWrapper constructor. Under most circumstances, users should not expect to instantiate their own CarWrapper objects.

        :param team_num: Integer indicating 0 for red and 1 for blue.
        :param id: Integer indicating the spectator ID assigned to the car.
        :param player_data: PlayerData object for values to be copied from.

        NOTE: team_num and id will be ignored if a PlayerData object is passed.
        """
        if player_data is None:
            super().__init__()
            self.id: int = id
            self.position = np.asarray([id * 100, 0])
            self.team_num: int = team_num
        else:
            super().__init__(phys_obj=player_data.pawn_data)
            self._read_from_player_data(player_data)

    def _read_from_player_data(self, player_data: PlayerData):
        """
        A function to modify CarWrapper values from values in a PlayerData object.
        """
        self.id = player_data.pawn_id
        self.team_num = player_data.team_num

    def _encode(self) -> list:
        """
        Function called by a StateWrapper to produce a state string.

        :return: String containing value data.
        """
        encoded = np.concatenate(((self.id,), self.position, self.velocity))

        return encoded.tolist()