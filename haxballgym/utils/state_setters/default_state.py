from ursinaxball import Game

from haxballgym.utils.state_setters import StateSetter


class DefaultState(StateSetter):
    def __init__(self):
        super().__init__()

    def reset(self, game: Game, save_recording: bool):
        game.reset(save_recording)
