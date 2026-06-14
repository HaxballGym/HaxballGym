"""Observation builders. Batched: `build_obs(state) -> (N, P, obs_dim)`."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .state import RED, GameState


class ObsBuilder(ABC):
    @abstractmethod
    def obs_dim(self, n_players: int) -> int: ...

    @abstractmethod
    def build_obs(self, state: GameState) -> np.ndarray: ...

    def reset(self, state: GameState) -> None:  # noqa: B027 (optional hook)
        pass


class DefaultObs(ObsBuilder):
    """Goal-relative, fully side-symmetric obs. The x-axis is mirrored for blue so
    BOTH teams see themselves attacking +x — one network then plays both sides
    identically (the action's dx is mirrored back in Env.step). Per player:
    [self_pos, self_vel, ball_rel, ball_vel, target_goal_rel, own_goal_rel] (=12)
    + [rel_pos, vel] per other player (=4 each).
    """

    def __init__(self, pos_coef=(1.0 / 420.0, 1.0 / 200.0), vel_coef=1.0 / 10.0):
        self.pos_coef = np.asarray(pos_coef, dtype=np.float64)
        self.vel_coef = float(vel_coef)

    def obs_dim(self, n_players: int) -> int:
        return 12 + 4 * (n_players - 1)

    def build_obs(self, state: GameState) -> np.ndarray:
        n, p = state.n_envs, state.n_players
        pc, vc = self.pos_coef, self.vel_coef
        ppos, pvel = state.player_pos, state.player_vel  # (N,P,2)
        bpos = state.ball_pos[:, None, :]  # (N,1,2)
        bvel = state.ball_vel[:, None, :]  # (N,1,2)

        # target/own goal centres come from the stadium (side-aware per player)
        target = state.goal_center(attacked=True)  # (N,P,2)
        own = state.goal_center(attacked=False)  # (N,P,2)

        out = np.empty((n, p, self.obs_dim(p)), dtype=np.float32)
        out[..., 0:2] = ppos * pc
        out[..., 2:4] = pvel * vc
        out[..., 4:6] = (bpos - ppos) * pc
        out[..., 6:8] = bvel * vc
        out[..., 8:10] = (target - ppos) * pc
        out[..., 10:12] = (own - ppos) * pc

        # other players, relative, in ascending index order (skip self) — matches lib.rs
        for k in range(p):
            slot = 12
            for j in range(p):
                if j == k:
                    continue
                out[:, k, slot : slot + 2] = (ppos[:, j] - ppos[:, k]) * pc
                out[:, k, slot + 2 : slot + 4] = pvel[:, j] * vc
                slot += 4

        # Mirror the x-axis for blue so both teams see an "attacking +x" frame
        # (every 2-vector's x component is at an even index).
        sx = np.where(state.team == RED, 1.0, -1.0)[:, :, None]  # (N, P, 1)
        out[:, :, 0::2] *= sx
        return out
