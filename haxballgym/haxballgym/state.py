"""The batched game state passed to every component, plus stadium geometry helpers.

Unlike RLGym (one `GameState` per match), this holds the *whole batch* of N
matches as numpy arrays, so components run vectorized. Goal geometry comes from the
stadium (the engine's `goals()`), never hardcoded — so the same obs/reward work on
any map. See docs/design-docs/env-api.md.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

# Engine team flags (mirrors haxball_core.FLAG_RED / FLAG_BLUE).
RED = 2
BLUE = 4


@dataclass(frozen=True)
class GameState:
    # dynamic, per step
    ball_pos: np.ndarray  # (N, 2)    f64
    ball_vel: np.ndarray  # (N, 2)    f64
    player_pos: np.ndarray  # (N, P, 2) f64
    player_vel: np.ndarray  # (N, P, 2) f64
    team: np.ndarray  # (N, P)    i64   RED/BLUE
    scored: np.ndarray  # (N,)      i8    -1 none, else conceding team
    steps: np.ndarray  # (N,)      i64   physics ticks since reset
    # stadium geometry (static; same for every env), straight from the engine
    goal_p0: np.ndarray  # (G, 2)    f64   goal-line endpoints
    goal_p1: np.ndarray  # (G, 2)    f64
    goal_team: np.ndarray  # (G,)      i64   team that DEFENDS/concedes at each goal
    walls: np.ndarray | None = None  # (M, 4)  f64  ball-colliding walls [x0,y0,x1,y1] (raycast geometry)
    obstacles: np.ndarray | None = None  # (D, 3)  f64  static post discs [x,y,radius] (raycast obstacles)
    ball_pred: np.ndarray | None = None  # (N, K, 2)  f64  future ball positions (deterministic prediction)
    # player physics constant
    player_max_speed: float = 0.0

    @property
    def n_envs(self) -> int:
        return self.ball_pos.shape[0]

    @property
    def n_players(self) -> int:
        return self.player_pos.shape[1]

    def goal_line(self, attacked: bool) -> tuple[np.ndarray, np.ndarray]:
        """The goal line each player attacks (or defends), as `(p0, p1)` of shape
        `(N, P, 2)`. 'Attacked' = the goal whose defender isn't the ego team.
        (Classic has exactly one opponent goal; argmax picks the first match.)"""
        # (N, P, G): which goals are valid targets for each player
        if attacked:
            match = self.goal_team[None, None, :] != self.team[:, :, None]
        else:
            match = self.goal_team[None, None, :] == self.team[:, :, None]
        if not match.any(axis=-1).all():
            # argmax would silently return goal 0; a player with no matching goal means a
            # stadium with no goal for/against some team — surface it instead of lying.
            side = "attacks" if attacked else "defends"
            raise ValueError(f"goal_line: some player has no goal it {side} (stadium goal/team mismatch)")
        idx = np.argmax(match, axis=-1)  # (N, P) first match
        return self.goal_p0[idx], self.goal_p1[idx]  # (N, P, 2) each

    def goal_center(self, attacked: bool) -> np.ndarray:
        p0, p1 = self.goal_line(attacked)
        return 0.5 * (p0 + p1)  # (N, P, 2)


def closest_on_line(p: np.ndarray, v: np.ndarray, w: np.ndarray) -> np.ndarray:
    """Closest point on the infinite line through (v, w) to p (no clamping), matching
    Ursinaxball's `position_diff_point_segment`. All args broadcast to (..., 2)."""
    wv = w - v
    pv = p - v
    denom = np.maximum(np.sum(wv * wv, axis=-1, keepdims=True), 1e-12)
    t = np.sum(pv * wv, axis=-1, keepdims=True) / denom
    return v + wv * t
