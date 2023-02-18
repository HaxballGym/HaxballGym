from ursinaxball import Game

from haxballgym.utils.state_setters import StateSetter


class RandomState(StateSetter):
    def __init__(self):
        super().__init__()

    def reset(self, game: Game, save_recording):
        game.reset(save_recording)
