"""Observation builders. Batched: `build_obs(state) -> (N, P, obs_dim)`."""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .state import RED, GameState


def _field_half(state: GameState) -> np.ndarray:
    """Per-axis field half-extent (hx, hy) from the stadium's real collision walls. Drop the
    boundary planes, which wall_segments() renders as huge (±3000) segments."""
    pts = np.asarray(state.walls, dtype=np.float64).reshape(-1, 2)
    real = pts[np.abs(pts).max(axis=1) < 1500.0]
    return np.abs(real if len(real) else pts).max(axis=0)


def _derive_pos_coef(state: GameState) -> np.ndarray:
    """Per-axis position scale (cx, cy) for the "auto" obs normalization: derive it from the
    stadium's real collision walls so positions land in ~[-1, 1] on ANY map (classic, futsal,
    big, ...). The 1.1× margin leaves headroom for discs that penetrate a wall slightly."""
    return 1.0 / np.maximum(_field_half(state) * 1.1, 1.0)


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
        # pos_coef is a per-axis (cx, cy) scale, or the string "auto" to derive it from the
        # stadium's field bounds on reset() — so positions land in ~[-1, 1] on ANY map
        # (classic, futsal, ...), not just the classic-tuned default.
        self._auto = isinstance(pos_coef, str) and pos_coef == "auto"
        self.pos_coef = None if self._auto else np.asarray(pos_coef, dtype=np.float64)
        self.vel_coef = float(vel_coef)

    def reset(self, state: GameState) -> None:
        if self._auto:  # re-derive every reset so a map switch (curriculum) re-scales
            self.pos_coef = _derive_pos_coef(state)

    def obs_dim(self, n_players: int) -> int:
        return 12 + 4 * (n_players - 1)

    def build_obs(self, state: GameState) -> np.ndarray:
        n, p = state.n_envs, state.n_players
        if self.pos_coef is None:  # auto mode, build_obs called without a prior reset()
            self.pos_coef = _derive_pos_coef(state)
        pc, vc = self.pos_coef, self.vel_coef
        ppos, pvel = state.player_pos, state.player_vel  # (N,P,2)
        bpos = state.ball_pos[:, None, :]  # (N,1,2)
        bvel = state.ball_vel[:, None, :]  # (N,1,2)

        # target/own goal centres come from the stadium (side-aware per player)
        target = state.goal_center(attacked=True)  # (N,P,2)
        own = state.goal_center(attacked=False)  # (N,P,2)

        out = np.empty((n, p, 12 + 4 * (p - 1)), dtype=np.float32)  # DefaultObs base dim (not
        # self.obs_dim — a subclass like GeoObs overrides that to a larger total)
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


class GeoObs(DefaultObs):
    """DefaultObs + map-agnostic WALL GEOMETRY, so the bot can read rebounds and pin the ball
    for rockets on ANY stadium. It raycasts the REAL collision walls (`state.walls`, exposed
    by the core) and adds, per player:
      - **ball lidar** — distance to the nearest wall along `n_rays` directions around the BALL
        (the local wall layout: is the ball pinnable? where will it bounce?)
      - **ball bounce-ray** — distance to the wall the ball is heading toward (rebound predictor)
    Rays are cast in the player's CANONICAL frame (x flipped for blue, like the rest of the obs)
    so both teams share weights. Distances are normalized to [0,1] by `max_dist`. Pair with
    `ACTION_STACK>0` for the action memory the rocket's double-kick timing needs.

    Because it reads geometry from the stadium (not hardcoded), the SAME obs works on every map —
    the path to a bot that's good on all stadiums."""

    def __init__(self, n_rays: int = 8, max_dist: float = 900.0, **kw):
        super().__init__(**kw)
        self.n_rays = n_rays
        # In "auto" mode (pos_coef="auto") the geo DISTANCE scales follow the map too — else the
        # ray cap (max_dist) and the player→ball scalar overflow [0,1]/[−1,1] on a big map. They
        # are derived per-map in reset()/build_obs; otherwise the fixed defaults are used.
        self.max_dist = None if self._auto else float(max_dist)
        self._dpb_scale = None if self._auto else 500.0  # player→ball distance normalizer
        ang = np.linspace(0.0, 2 * np.pi, n_rays, endpoint=False)
        self._base_dirs = np.stack([np.cos(ang), np.sin(ang)], axis=-1)  # (R,2) canonical rays

    def _ensure_geo_scale(self, state: GameState) -> None:
        if self._auto and self.max_dist is None:
            half = _field_half(state)
            hx, hy = float(half[0]), float(half[1])
            self.max_dist = (4.0 * hx * hx + 4.0 * hy * hy) ** 0.5  # full-field diagonal (ray cap)
            self._dpb_scale = (hx * hx + hy * hy) ** 0.5  # half-field diagonal (player→ball)

    def reset(self, state: GameState) -> None:
        super().reset(state)  # re-derive pos_coef
        if self._auto:  # force per-map re-derivation of the distance scales on a map switch
            self.max_dist = None
            self._ensure_geo_scale(state)

    def obs_dim(self, n_players: int) -> int:
        # base + ball lidar + self lidar + bounce-ray + 6 explicit scalars (player→ball,
        # ball→wall, ball→post, self→post, 2 speeds). Lidar/bounce hit BOTH walls and posts.
        return super().obs_dim(n_players) + 2 * self.n_rays + 1 + 6

    @staticmethod
    def _nearest_wall(P, A, B):
        """Min distance from points P (N,2) to the wall segments (A,B each (M,2)). -> (N,)."""
        E = B - A  # (M,2)
        L2 = np.maximum((E * E).sum(-1), 1e-9)  # (M,)
        AP = P[:, None, :] - A[None, :, :]  # (N,M,2)
        s = np.clip((AP * E[None]).sum(-1) / L2[None], 0.0, 1.0)  # (N,M) projection param
        closest = A[None] + s[..., None] * E[None]  # (N,M,2)
        return np.linalg.norm(P[:, None, :] - closest, axis=-1).min(-1)  # (N,)

    @staticmethod
    def _nearest_disc(P, C, r):
        """Min surface distance from points P (N,2) to obstacle discs (C (D,2), r (D,)). -> (N,)."""
        if C is None or len(C) == 0:
            return np.full(P.shape[0], np.inf)
        d = np.linalg.norm(P[:, None, :] - C[None, :, :], axis=-1) - r[None, :]  # (N,D)
        return np.maximum(d.min(-1), 0.0)

    @staticmethod
    def _raycast_discs(O, D, C, r, max_dist):
        """Ray-circle: O (K,2), D (K,R,2) unit dirs, discs C (Dd,2) r (Dd,). -> (K,R) norm dist."""
        if C is None or len(C) == 0:
            return np.ones((O.shape[0], D.shape[1]))
        L = C[None, None, :, :] - O[:, None, None, :]  # (K,1,Dd,2) -> broadcasts over R
        tca = (L * D[:, :, None, :]).sum(-1)  # (K,R,Dd) projection of center onto ray
        d2 = (L * L).sum(-1) - tca**2  # (K,R,Dd) perpendicular dist²
        thc2 = r[None, None, :] ** 2 - d2  # (K,R,Dd) >0 if the ray pierces the circle
        thc = np.sqrt(np.maximum(thc2, 0.0))
        t0, t1 = tca - thc, tca + thc
        t = np.where(t0 > 1e-6, t0, np.where(t1 > 1e-6, t1, np.inf))  # nearest hit ahead
        t = np.where(thc2 > 0, t, np.inf)
        return np.minimum(t.min(-1), max_dist) / max_dist

    @staticmethod
    def _raycast(O, D, A, B, max_dist):
        """O (K,2) origins, D (K,R,2) unit ray dirs, segments A,B (M,2). -> (K,R) norm dist."""
        E = B - A  # (M,2)
        crossDE = D[:, :, None, 0] * E[None, None, :, 1] - D[:, :, None, 1] * E[None, None, :, 0]  # (K,R,M)
        AO = A[None, :, :] - O[:, None, :]  # (K,M,2)
        crossAOE = AO[..., 0] * E[:, 1] - AO[..., 1] * E[:, 0]  # (K,M)
        crossAOD = AO[:, None, :, 0] * D[:, :, None, 1] - AO[:, None, :, 1] * D[:, :, None, 0]  # (K,R,M)
        with np.errstate(divide="ignore", invalid="ignore"):
            t = crossAOE[:, None, :] / crossDE  # (K,R,M) distance along the ray
            s = crossAOD / crossDE  # position along the segment
        valid = np.isfinite(t) & (t > 1e-6) & (s >= -1e-6) & (s <= 1 + 1e-6)
        t = np.where(valid, t, np.inf)
        return np.minimum(t.min(axis=-1), max_dist) / max_dist  # (K,R)

    def build_obs(self, state: GameState) -> np.ndarray:
        base = super().build_obs(state)  # (N,P,base_dim), x-mirrored for blue
        n, p = state.n_envs, state.n_players
        walls = state.walls
        if walls is None or len(walls) == 0:  # no geometry (shouldn't happen) -> zero-pad
            pad = np.zeros((n, p, 2 * self.n_rays + 1 + 6), dtype=np.float32)
            return np.concatenate([base, pad], axis=-1)
        self._ensure_geo_scale(state)  # auto mode: derive distance scales (lazy if no reset())
        A, B = np.ascontiguousarray(walls[:, :2]), np.ascontiguousarray(walls[:, 2:])
        obs_ = state.obstacles  # (D,3) post discs [x,y,radius] (or None)
        C = r = None
        if obs_ is not None and len(obs_):
            C, r = np.ascontiguousarray(obs_[:, :2]), np.ascontiguousarray(obs_[:, 2])
        md = self.max_dist
        assert md is not None and self._dpb_scale is not None  # set by _ensure_geo_scale above
        sx = np.where(state.team == RED, 1.0, -1.0)  # (N,P) canonical x-flip per player
        flip = np.stack([sx, np.ones_like(sx)], axis=-1).reshape(n * p, 2)  # (N*P,2)

        def ray(O, D):  # nearest hit on a wall segment OR a post disc, normalized
            return np.minimum(self._raycast(O, D, A, B, md), self._raycast_discs(O, D, C, r, md))

        # ball lidar: rays around the BALL, in each player's canonical frame
        O = np.broadcast_to(state.ball_pos[:, None, :], (n, p, 2)).reshape(n * p, 2)
        D = self._base_dirs[None, :, :] * flip[:, None, :]  # (N*P,R,2)
        lidar = ray(O, D).reshape(n, p, self.n_rays)
        # self lidar: rays around the PLAYER (own wall/post surroundings — positioning, cornering)
        Os = state.player_pos.reshape(n * p, 2)
        slidar = ray(Os, D).reshape(n, p, self.n_rays)
        # bounce-ray: distance to the wall/post the ball is heading toward. This is a
        # reflection-invariant SCALAR (how far the ball travels before it hits a wall), so it is
        # cast in WORLD frame and is identical for both sides — do NOT apply the per-side `flip`
        # (that mirrors a single real ray into a different physical direction, breaking the
        # side-symmetry the shared net relies on). The ball lidar above flips a whole canonical
        # ray-SET, where mirroring only relabels which ray is which, so that one is correct.
        bv = state.ball_vel  # (N,2)
        spd = np.linalg.norm(bv, axis=-1, keepdims=True)
        bdir = np.where(spd > 1e-6, bv / np.maximum(spd, 1e-9), 0.0)  # (N,2)
        Db = np.broadcast_to(bdir[:, None, :], (n, p, 2)).reshape(n * p, 2)[:, None, :]
        bounce = ray(O, Db).reshape(n, p, 1)
        moving = (spd[:, 0] > 1e-6)[:, None, None]  # still ball -> no imminent bounce (=1.0)
        bounce = np.where(np.broadcast_to(moving, bounce.shape), bounce, 1.0)
        # explicit scalar features (cheap, help a small net not re-derive norms). Non-directional
        # (magnitudes/distances) so they need no x-mirror.
        vc = self.vel_coef
        d_pb = (np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1) / self._dpb_scale)[
            ..., None
        ]
        d_bw = np.broadcast_to((self._nearest_wall(state.ball_pos, A, B) / md)[:, None, None], (n, p, 1))
        d_bp = np.broadcast_to(  # ball -> nearest POST (rocket-pin / block awareness)
            (np.minimum(self._nearest_disc(state.ball_pos, C, r), md) / md)[:, None, None], (n, p, 1)
        )
        d_sp = (np.minimum(self._nearest_disc(state.player_pos.reshape(n * p, 2), C, r), md) / md).reshape(
            n, p, 1
        )  # player -> nearest post (don't get blocked while chasing)
        sp_b = np.broadcast_to((np.linalg.norm(bv, axis=-1) * vc)[:, None, None], (n, p, 1))
        sp_s = (np.linalg.norm(state.player_vel, axis=-1) * vc)[..., None]
        scalars = np.concatenate([d_pb, d_bw, d_bp, d_sp, sp_b, sp_s], axis=-1).astype(np.float32)
        return np.concatenate(
            [base, lidar.astype(np.float32), slidar.astype(np.float32), bounce.astype(np.float32), scalars],
            axis=-1,
        )


class SharedObs(ObsBuilder):
    """Fixed-size, team-size-AGNOSTIC obs so ONE net plays 1v1 … 4v4 — and a net trained at
    4v4 drops into 1v1 unchanged (same input width). Per player: the 12 self/ball/goal
    features, then the `k_team` nearest TEAMMATES and `k_opp` nearest OPPONENTS as
    [rel_pos, vel, present] each — closest-first, ZERO-padded with a presence flag. So
    `obs_dim = 12 + 5·(k_team+k_opp)` is constant regardless of how many players are on the
    pitch. Side-symmetric (x mirror for blue) like DefaultObs, so red/blue share weights.
    This is the ordered-by-distance cousin of the entity/attention obs the top RL bots use
    to play every team size with a single network."""

    def __init__(
        self,
        k_team: int = 3,
        k_opp: int = 3,
        pos_coef=(1.0 / 420.0, 1.0 / 200.0),
        vel_coef: float = 1.0 / 10.0,
    ):
        self.k_team = k_team
        self.k_opp = k_opp
        # "auto" derives the per-axis scale from the map walls (like DefaultObs) — needed on
        # non-classic maps (the big map's ±600×±240 field overflows the classic-tuned default).
        self._auto = isinstance(pos_coef, str) and pos_coef == "auto"
        self.pos_coef = None if self._auto else np.asarray(pos_coef, dtype=np.float64)
        self.vel_coef = float(vel_coef)
        # x-component column indices (for the blue mirror): the 6 base vectors + each
        # other-slot's rel_pos.x and vel.x (the present flag at +4 is never mirrored).
        self._x_idx = np.array(
            [0, 2, 4, 6, 8, 10] + [c for s in range(k_team + k_opp) for c in (12 + 5 * s, 12 + 5 * s + 2)]
        )

    def obs_dim(self, n_players: int) -> int:
        return 12 + 5 * (self.k_team + self.k_opp)  # constant, ignores n_players

    def reset(self, state: GameState) -> None:
        if self._auto:  # re-derive every reset so a map switch (curriculum) re-scales
            self.pos_coef = _derive_pos_coef(state)

    def build_obs(self, state: GameState) -> np.ndarray:
        n, p = state.n_envs, state.n_players
        if self.pos_coef is None:  # auto mode, build_obs called without a prior reset()
            self.pos_coef = _derive_pos_coef(state)
        pc, vc = self.pos_coef, self.vel_coef
        ppos, pvel = state.player_pos, state.player_vel  # (N,P,2)
        bpos, bvel = state.ball_pos[:, None, :], state.ball_vel[:, None, :]
        target = state.goal_center(attacked=True)
        own = state.goal_center(attacked=False)
        out = np.zeros((n, p, self.obs_dim(p)), dtype=np.float32)
        out[..., 0:2] = ppos * pc
        out[..., 2:4] = pvel * vc
        out[..., 4:6] = (bpos - ppos) * pc
        out[..., 6:8] = bvel * vc
        out[..., 8:10] = (target - ppos) * pc
        out[..., 10:12] = (own - ppos) * pc

        rows = np.arange(n)
        relvel = pvel * vc  # (N,P,2) every player's velocity (filled relative to ego below)
        for k in range(p):
            rel = (ppos - ppos[:, k : k + 1, :]) * pc  # (N,P,2) others relative to player k
            d = np.linalg.norm(ppos - ppos[:, k : k + 1, :], axis=-1)  # (N,P)
            d[:, k] = np.inf  # exclude self
            same = state.team == state.team[:, k : k + 1]  # (N,P) teammates (incl self)
            for ismember, kk, base in (
                (same, self.k_team, 12),
                (~same, self.k_opp, 12 + 5 * self.k_team),
            ):
                dd = np.where(ismember, d, np.inf)  # distance to members of this group
                order = np.argsort(dd, axis=-1)  # (N,P) nearest first
                # only fill as many slots as there are players to order; the rest of the kk
                # slots stay zero-padded (present=0) — that's what lets a 4v4 net run in 1v1.
                for slot in range(min(kk, p)):
                    j = order[:, slot]  # (N,) the slot-th nearest member per env
                    present = np.isfinite(dd[rows, j])[:, None]  # (N,1)
                    o = base + slot * 5
                    out[rows, k, o : o + 2] = np.where(present, rel[rows, j], 0.0)
                    out[rows, k, o + 2 : o + 4] = np.where(present, relvel[rows, j], 0.0)
                    out[rows, k, o + 4] = present[:, 0]

        # mirror x for blue (both teams see attacking +x); only the rel/vel x columns
        sgn = np.where(state.team == RED, 1.0, -1.0)[:, :, None]  # (N,P,1)
        out[..., self._x_idx] *= sgn
        return out


class PredictObs(DefaultObs):
    """DefaultObs + K deterministic future ball positions (relative to each player,
    normalized, side-mirrored). Hands the policy "where the ball will be" — lookahead a
    tiny memoryless net can't learn implicitly, and exactly what's needed to read wall/
    corner rebounds and time interceptions. Requires the engine to attach
    `state.ball_pred` (TransitionEngine(predict_offsets=[...]) with len == n_pred)."""

    def __init__(self, n_pred: int = 3, **kw):
        super().__init__(**kw)
        self.n_pred = int(n_pred)

    def obs_dim(self, n_players: int) -> int:
        return super().obs_dim(n_players) + 2 * self.n_pred

    def build_obs(self, state: GameState) -> np.ndarray:
        base = super().build_obs(state)  # (N,P,base) — already x-mirrored for blue
        n, p = state.n_envs, state.n_players
        out = np.zeros((n, p, 2 * self.n_pred), dtype=np.float32)
        pred = state.ball_pred  # (N, K, 2) future ball positions
        if pred is not None:
            pc = self.pos_coef
            ppos = state.player_pos  # (N,P,2)
            sx = np.where(state.team == RED, 1.0, -1.0)  # (N,P)
            for k in range(min(self.n_pred, pred.shape[1])):
                rel = (pred[:, None, k, :] - ppos) * pc  # (N,P,2) future ball relative to player
                rel[..., 0] *= sx  # mirror x for blue (same frame as the base obs)
                out[..., 2 * k : 2 * k + 2] = rel
        return np.concatenate([base, out], axis=-1)
