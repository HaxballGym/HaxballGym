# Simple pygame program

# Import and initialize the pygame library
import pygame
from haxballgym.game import common_values as cv

from haxballgym.game import Game
from haxballgym.game import common_values as cv
from haxballgym.game.common_values import TEAM_BLUE_ID, TEAM_RED_ID

from haxballgym.game.modules.game.game_score import GameScore
from haxballgym.game.modules.player.player_handler import PlayerHandler


def fps_counter():
    fps = str(int(clock.get_fps()))
    fps_t = font.render(fps, 1, pygame.Color("RED"))
    width_text = fps_t.get_width()
    screen.blit(fps_t, (SCREEN_WIDTH - width_text, 0))


pygame.init()

game = Game(stadium_file=cv.MAP_PENALTY)
game.score = GameScore(time_limit=1, score_limit=1)

player_red = PlayerHandler("P0", TEAM_RED_ID)
player_blue = PlayerHandler("P1", TEAM_BLUE_ID)
game.add_players([player_red, player_blue])

game.start()

SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800

# Set up the drawing window
screen = pygame.display.set_mode([SCREEN_WIDTH, SCREEN_HEIGHT])
clock = pygame.time.Clock()
font = pygame.font.SysFont("Arial", 18, bold=True)

# Run until the user asks to quit
running = True
while running:
    # Did the user click the window close button?
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    game.stadium_game.background.draw(screen, (SCREEN_WIDTH, SCREEN_HEIGHT))

    for segment in game.stadium_game.segments:
        segment.draw(screen, (SCREEN_WIDTH, SCREEN_HEIGHT))

    for disc in game.stadium_game.discs:
        disc.draw(screen, (SCREEN_WIDTH, SCREEN_HEIGHT))

    fps_counter()
    clock.tick()

    # Flip the display
    pygame.display.flip()

# Done! Time to quit.
pygame.quit()
