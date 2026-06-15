"""Type stub for the Rust extension `haxball_core` (see src/lib.rs).

Physics-only engine: it exposes a batched GameState surface and a .hbs loader;
obs/reward/done live in the `haxballgym` Python layer.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

FLAG_RED: int
FLAG_BLUE: int

class VecEnv:
    def __init__(
        self,
        n_envs: int,
        n_red: int,
        n_blue: int,
        step_limit: int = ...,
        tick_skip: int = ...,
    ) -> None: ...
    @staticmethod
    def from_hbs(
        hbs: str,
        n_envs: int,
        n_red: int,
        n_blue: int,
        step_limit: int = ...,
        tick_skip: int = ...,
    ) -> VecEnv: ...
    @property
    def n_envs(self) -> int: ...
    @property
    def n_players(self) -> int: ...
    @property
    def obs_dim(self) -> int: ...
    @property
    def player_max_speed(self) -> float: ...
    def reset_all(self) -> None: ...
    def reset_mask(self, mask: NDArray[np.bool_]) -> None: ...
    def physics_step(self, actions: NDArray[np.int64]) -> NDArray[np.int8]: ...
    def snapshot(
        self,
    ) -> tuple[
        NDArray[np.float64],  # ball_pos (N, 2)
        NDArray[np.float64],  # ball_vel (N, 2)
        NDArray[np.float64],  # player_pos (N, P, 2)
        NDArray[np.float64],  # player_vel (N, P, 2)
        NDArray[np.int64],  # steps (N,)
    ]: ...
    def set_state(
        self,
        ball_pos: NDArray[np.float64],  # (N, 2)
        ball_vel: NDArray[np.float64],  # (N, 2)
        player_pos: NDArray[np.float64],  # (N, P, 2)
        player_vel: NDArray[np.float64],  # (N, P, 2)
        steps: NDArray[np.int64] | None = ...,  # (N,)
    ) -> None: ...
    def set_kick_rate_limit(self, min: int, cost: int, cap: int) -> None: ...
    def teams(self) -> NDArray[np.int64]: ...
    def goals(
        self,
    ) -> tuple[NDArray[np.float64], NDArray[np.float64], NDArray[np.int64]]: ...
    def wall_segments(self) -> NDArray[np.float64]: ...  # (M, 4) ball-colliding walls [x0,y0,x1,y1]
    def obstacle_discs(self) -> NDArray[np.float64]: ...  # (D, 3) static post discs [x, y, radius]
    def set_player_cmask(self, mask: int) -> None: ...  # set every player disc's collision mask
    def kick_state(self) -> tuple[NDArray[np.int64], NDArray[np.int64]]: ...  # per-player kick state
    def predict_ball(self, offsets: list[int]) -> NDArray[np.float64]: ...  # (N, K, 2) future ball pos
    def rollout_bench(self, n_steps: int) -> int: ...

# fn_base.py mirrors used only by the fidelity test
def disc_disc(pa, pb, va, vb, ra, rb, ima, imb, ba, bb): ...
def disc_vertex(pd, pv, v, radius, bd, bv): ...
def segment_no_curve(pd, v0, v1): ...
def segment_curve(pd, c, cr, t0, t1, curve): ...
def disc_plane(pd, normal, v, dist, radius, bd, bp): ...
