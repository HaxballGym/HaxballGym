"""Scripted opponents for training/eval.

chase_bot: moves straight at the ball and kicks when close — a real possession
contest, unlike random/static (which let the learner just shove the ball goalward).
A small angular `jiggle` perturbs its heading every tick so it does NOT travel on
perfect straight lines — that way we can confirm the trained agent copes with a
non-linear mover, not just an on-rails one.
"""
import numpy as np

# obs layout (per agent, built in Rust): [self_pos(2), self_vel(2),
#   ball_rel(2) normalized by (1/420,1/200), ball_vel(2), target_goal_rel(2),
#   own_goal_rel(2), other_players(4 each)]
BALL_REL_X, BALL_REL_Y = 4, 5
NX, NY = 420.0, 200.0


def chase_bins(obs, rng, jiggle=0.30, kick_dist=34.0):
    """obs = the chaser's own egocentric rows (M, obs_dim) -> bins (M,3) {0,1,2}x2,{0,1}."""
    rx = obs[:, BALL_REL_X] * NX           # ball - player, world units
    ry = obs[:, BALL_REL_Y] * NY
    dist = np.hypot(rx, ry)
    ang = np.arctan2(ry, rx) + rng.normal(0.0, jiggle, size=len(rx))  # <- the jiggle
    dx, dy = np.cos(ang), np.sin(ang)
    bx = np.where(dx > 0.33, 2, np.where(dx < -0.33, 0, 1))
    by = np.where(dy > 0.33, 2, np.where(dy < -0.33, 0, 1))
    kick = (dist < kick_dist).astype(np.int64)
    return np.stack([bx, by, kick], 1).astype(np.int64)
