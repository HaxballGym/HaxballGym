"""Play against your trained model.  YOU are RED, the model is BLUE.

Controls:  Arrow keys = move,  X or Space = kick.   Esc/close = quit.

Run:  uv run python play.py
(Needs a display; run it locally on your Mac, not over SSH.)
"""

import json
import os

import numpy as np
import pygame
import torch
from render import H, W, w2i
from train import Policy

from haxballgym import make_default_env

HERE = os.path.dirname(__file__)


@torch.no_grad()
def model_action(model, obs_row):
    lx, ly, lk, _ = model(torch.as_tensor(obs_row[None], dtype=torch.float32))
    return np.array([lx.argmax(-1).item(), ly.argmax(-1).item(), lk.argmax(-1).item()])


def human_bins(keys):
    dx = (1 if keys[pygame.K_RIGHT] else 0) - (1 if keys[pygame.K_LEFT] else 0)
    dy = (1 if keys[pygame.K_UP] else 0) - (1 if keys[pygame.K_DOWN] else 0)
    kick = 1 if (keys[pygame.K_x] or keys[pygame.K_SPACE]) else 0
    return np.array([dx + 1, dy + 1, kick])  # back to {0,1,2},{0,1,2},{0,1}


def main():
    meta = json.load(open(os.path.join(HERE, "checkpoints/meta.json")))
    model = Policy(meta["obs_dim"])
    model.load_state_dict(torch.load(os.path.join(HERE, "checkpoints/model.pt"), map_location="cpu"))
    model.eval()

    env = make_default_env(1, 1, 1, step_limit=100000)
    obs = env.reset()  # (1, 2, obs_dim)
    you = mdl = 0

    pygame.init()
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("Haxball — YOU (red) vs model (blue)")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("menlo", 22)
    running = True
    while running:
        for e in pygame.event.get():
            if e.type == pygame.QUIT or (e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE):
                running = False
        keys = pygame.key.get_pressed()

        bins = np.empty((2, 3), dtype=np.int64)
        bins[0] = human_bins(keys)  # player 0 = RED = human
        bins[1] = model_action(model, obs[0, 1])  # player 1 = BLUE = model
        obs, rew, term, trunc = env.step(bins[None])  # (1, 2, 3)
        if rew[0, 0] > 1.0:
            you += 1  # red (you) scored
        elif rew[0, 0] < -1.0:
            mdl += 1
        state = env.prev_state  # GameState (post auto-reset)

        # draw
        screen.fill((123, 140, 90))
        pygame.draw.rect(screen, (199, 230, 189), (*w2i(-370, 170), 740, 340), 3)
        pygame.draw.line(screen, (199, 230, 189), w2i(0, 170), w2i(0, -170), 2)
        for gx, col in [(-370, (255, 120, 120)), (370, (120, 150, 255))]:
            pygame.draw.line(screen, col, w2i(gx, 64), w2i(gx, -64), 4)
        bx, by = state.ball_pos[0]
        for k in range(2):
            px, py = state.player_pos[0, k]
            col = (229, 110, 86) if int(state.team[0, k]) == 2 else (86, 137, 229)
            pygame.draw.circle(screen, col, w2i(px, py), 15)
        pygame.draw.circle(screen, (240, 240, 240), w2i(bx, by), 10)
        screen.blit(
            font.render(f"YOU {you} - {mdl} MODEL   (arrows move, X/space kick)", True, (255, 255, 255)),
            (12, 8),
        )
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()


if __name__ == "__main__":
    main()
