from haxballgym.game.common_values import TEAM_RED_ID, TEAM_BLUE_ID, TEAM_SPECTATOR_ID, \
    GAME_STATE_KICKOFF, GAME_STATE_PLAYING

class GameScore(object):
    
    def __init__(self, time_limit=None, score_limit=None):
        # The GameScore object is used to keep track of the score of the game.
        # Score limit = 0 means no score limit, same for time limit.
        self.ticks = 0
        self.total_ticks = 0
        self.time = 0
        self.red = 0
        self.blue = 0
        self.time_limit = time_limit * 60 if time_limit is not None else 3 * 60
        self.score_limit = score_limit if score_limit is not None else 3
        self.animation_timeout = 0
    
    
    def step(self, state: int) -> None:
        if state == GAME_STATE_KICKOFF:
            self.total_ticks += 1
        elif state == GAME_STATE_PLAYING:
            self.total_ticks += 1
            self.ticks += 1
            self.time = self.ticks / 60
    
    
    def reset(self) -> None:
        self.total_ticks = 0
        self.ticks = 0
        self.time = 0
        self.red = 0
        self.blue = 0
    
    
    def update_score(self, team_id: int) -> None:
        if (team_id == TEAM_BLUE_ID):
            self.red += 1
        elif (team_id == TEAM_RED_ID):
            self.blue += 1
        else:
            raise ValueError("Invalid team_id: {}".format(team_id))
        self.animation_timeout = 150
    
    
    def is_score_limit_reached(self) -> bool:
        return self.score_limit > 0 and (self.red >= self.score_limit or self.blue >= self.score_limit)
    
    
    def is_time_limit_reached(self) -> bool:
        return self.time_limit > 0 and (self.time >= self.time_limit and self.red != self.blue)
    
    
    def is_animation(self) -> bool:
        return self.animation_timeout > 0
    
    
    def end_animation(self) -> None:
        self.animation_timeout = 300
        return
    
    
    def is_game_over(self) -> bool:
        return self.is_score_limit_reached() or self.is_time_limit_reached()
    
    
    def get_winner(self) -> int:
        if (self.red > self.blue):
            return TEAM_RED_ID
        elif (self.blue > self.red):
            return TEAM_BLUE_ID
        else:
            return TEAM_SPECTATOR_ID
