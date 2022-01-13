from haxballgym.utils.state_setters import StateSetter
from haxballgym.utils.state_setters import StateWrapper
import numpy as np
from haxballgym.utils.common_values import RED_TEAM, BLUE_TEAM


class DefaultState(StateSetter):

    def __init__(self):
        super().__init__()

    def reset(self, state_wrapper: StateWrapper):
        """
        Modifies state_wrapper values to emulate a randomly selected default kickoff.

        :param state_wrapper: StateWrapper object to be modified with desired state values.
        """
        SPAWN_DISTANCE_DEFAULT = 277.5
        red_count = 0
        blue_count = 0
        for pawn in state_wrapper.pawns:
            pos = [0, 0]
            
            if pawn.team_num == RED_TEAM:
                pos[0] = -SPAWN_DISTANCE_DEFAULT
                if ((red_count % 2) == 1):
                    pos[1] = -red_count + 1 >> 1
                else:
                    pos[1] = red_count + 1 >> 1
                
                red_count += 1
                
            elif pawn.team_num == BLUE_TEAM:
                pos[0] = SPAWN_DISTANCE_DEFAULT
                if ((blue_count % 2) == 1):
                    pos[1] = -blue_count + 1 >> 1
                else:
                    pos[1] = blue_count + 1 >> 1
                
                blue_count += 1
            
            # set car state values
            pawn.set_pos(*pos)
