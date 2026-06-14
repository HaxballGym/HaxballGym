"""Watch the trained model play *itself*, live in a pygame window.

    uv run rl/watch.py            # sampled actions (like training)
    press G to toggle greedy/sampled, Esc to quit

Uses the composable Env so the obs x-mirror + action un-mirror are handled correctly.
"""

import json
from pathlib import Path

import numpy as np
import pygame
import torch
from render import H, W, w2i
from torch.distributions import Categorical
from train import Policy

from haxballgym import make_default_env

HERE = Path(__file__).parent


def main():
    meta = json.loads((HERE / "checkpoints" / "meta.json").read_text())
    model = Policy(meta["obs_dim"])
    model.load_state_dict(torch.load(HERE / "checkpoints" / "model.pt", map_location="cpu"))
    model.eval()

    env = make_default_env(1, 1, 1, step_limit=100000)
    obs = env.reset()
    score = [0, 0]
    greedy = False

    pygame.init()
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("RL-Bot self-play")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("menlo", 20)

    running = True
    while running:
        for e in pygame.event.get():
            if e.type == pygame.QUIT or (e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE):
                running = False
            if e.type == pygame.KEYDOWN and e.key == pygame.K_g:
                greedy = not greedy

        with torch.no_grad():
            lx, ly, lk, _ = model(torch.as_tensor(obs.reshape(2, -1), dtype=torch.float32))
            if greedy:
                bins = torch.stack([lx.argmax(-1), ly.argmax(-1), lk.argmax(-1)], -1)
            else:
                bins = torch.stack(
                    [Categorical(logits=lx).sample(), Categorical(logits=ly).sample(), Categorical(logits=lk).sample()],
                    -1,
                )
        obs, rew, term, trunc = env.step(bins.numpy().reshape(1, 2, 3))
        if rew[0, 0] > 1:
            score[0] += 1
        elif rew[0, 0] < -1:
            score[1] += 1
        state = env.prev_state

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
        mode = "greedy" if greedy else "sampled"
        screen.blit(
            font.render(f"RED {score[0]} - {score[1]} BLUE   [{mode}]   (G toggles, Esc quits)", True, (255, 255, 255)),
            (12, 8),
        )
        pygame.display.flip()
        clock.tick(15)  # ~2x real-time, watchable

    pygame.quit()


if __name__ == "__main__":
    main()
