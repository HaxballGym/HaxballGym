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
    def teams(self) -> NDArray[np.int64]: ...
    def goals(
        self,
    ) -> tuple[NDArray[np.float64], NDArray[np.float64], NDArray[np.int64]]: ...
    def rollout_bench(self, n_steps: int) -> int: ...

# fn_base.py mirrors used only by the fidelity test
def disc_disc(pa, pb, va, vb, ra, rb, ima, imb, ba, bb): ...
def disc_vertex(pd, pv, v, radius, bd, bv): ...
def segment_no_curve(pd, v0, v1): ...
def segment_curve(pd, c, cr, t0, t1, curve): ...
def disc_plane(pd, normal, v, dist, radius, bd, bp): ...
