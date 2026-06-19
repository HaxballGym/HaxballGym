"""TransitionEngine — a thin, batched wrapper over the Rust `haxball_core.VecEnv`.

Physics only. It steps N matches in one call and hands back a `GameState`; it has
no idea what an observation or a reward is. (RLGym's `TransitionEngine`, but the
engine *is* the batch instead of one match per process.)
"""

from __future__ import annotations

import haxball_core as hc
import numpy as np

from .state import GameState


class TransitionEngine:
    def __init__(
        self,
        n_envs: int,
        n_red: int = 1,
        n_blue: int = 1,
        step_limit: int = 2000,
        tick_skip: int = 8,
        stadium: str | None = None,
        predict_offsets: list[int] | None = None,
    ):
        # PHYSICS-tick offsets (not decisions!) at which to attach deterministic ball-trajectory
        # prediction to each state (for a lookahead obs); None = off. Since the env advances
        # `tick_skip` physics ticks per decision, a horizon of K decisions is `tick_skip*K` here
        # (e.g. tick_skip=8 -> [8, 16, 24]); offsets like [1,2,3] look only a fraction of one
        # decision ahead. predict_ball assumes STRICTLY ASCENDING, POSITIVE offsets.
        if predict_offsets:
            self._predict_offsets = [int(o) for o in predict_offsets]
            if self._predict_offsets[0] < 1 or any(
                b <= a for a, b in zip(self._predict_offsets, self._predict_offsets[1:], strict=False)
            ):
                raise ValueError(
                    f"predict_offsets must be strictly ascending positive ticks; got {self._predict_offsets}"
                )
        else:
            self._predict_offsets = None
        if stadium is None:
            self._e = hc.VecEnv(n_envs, n_red, n_blue, step_limit=step_limit, tick_skip=tick_skip)
        else:
            from .stadium import stadium_text

            self._e = hc.VecEnv.from_hbs(
                stadium_text(stadium),
                n_envs,
                n_red,
                n_blue,
                step_limit=step_limit,
                tick_skip=tick_skip,
            )
        self.stadium = stadium or "classic"
        self.n_envs = self._e.n_envs
        self.n_players = self._e.n_players
        self.player_max_speed = self._e.player_max_speed
        self._teams = self._e.teams()  # (N, P), static
        self._goal_p0, self._goal_p1, self._goal_team = self._e.goals()  # stadium geometry
        self._walls = self._e.wall_segments()  # (M, 4) ball-colliding walls [x0,y0,x1,y1], static
        self._obstacles = self._e.obstacle_discs()  # (D, 3) static post discs [x,y,radius]
        self._no_goal = np.full(self.n_envs, -1, dtype=np.int8)

    def reset(self) -> GameState:
        """Reset all envs and return the initial state."""
        self._e.reset_all()
        return self._state(self._no_goal)

    def step(self, engine_actions: np.ndarray) -> GameState:
        """Advance all envs by tick_skip ticks with parsed engine actions (N,P,3)."""
        scored = self._e.physics_step(np.ascontiguousarray(engine_actions, dtype=np.int64))
        return self._state(scored)

    def reset_mask(self, mask: np.ndarray) -> None:
        """Reset only the envs whose mask entry is true (gym-style auto-reset)."""
        self._e.reset_mask(np.ascontiguousarray(mask, dtype=bool))

    def snapshot(self) -> GameState:
        """Current state without stepping (used to refresh after a masked reset)."""
        return self._state(self._no_goal)

    def set_state(
        self,
        ball_pos: np.ndarray,  # (N, 2)
        ball_vel: np.ndarray,  # (N, 2)
        player_pos: np.ndarray,  # (N, P, 2)
        player_vel: np.ndarray,  # (N, P, 2)
        steps: np.ndarray | None = None,  # (N,) — defaults to 0 (a fresh episode)
    ) -> GameState:
        """Place an arbitrary state into every env and return it. The inverse of
        `snapshot`; the primitive behind non-kickoff `StateMutator`s (random spawns,
        scenario drills, seeding a replay position). Scores are untouched."""
        self._e.set_state(
            np.ascontiguousarray(ball_pos, dtype=np.float64),
            np.ascontiguousarray(ball_vel, dtype=np.float64),
            np.ascontiguousarray(player_pos, dtype=np.float64),
            np.ascontiguousarray(player_vel, dtype=np.float64),
            None if steps is None else np.ascontiguousarray(steps, dtype=np.int64),
        )
        return self.snapshot()

    def set_kick_rate_limit(self, min_ticks: int, cost: int = 0, cap: int = 1) -> None:
        """Set the kickRateLimit (Haxball's min/rate/burst) for all envs. The DNA replay
        rooms use min=6; default is min=2. Needed to re-simulate replays faithfully."""
        self._e.set_kick_rate_limit(int(min_ticks), int(cost), int(cap))

    def _state(self, scored: np.ndarray) -> GameState:
        bp, bv, pp, pv, st = self._e.snapshot()
        return GameState(
            ball_pos=bp,
            ball_vel=bv,
            player_pos=pp,
            player_vel=pv,
            team=self._teams,
            scored=scored,
            steps=st,
            goal_p0=self._goal_p0,
            goal_p1=self._goal_p1,
            goal_team=self._goal_team,
            walls=self._walls,
            obstacles=self._obstacles,
            ball_pred=(self._e.predict_ball(self._predict_offsets) if self._predict_offsets else None),
            player_max_speed=self.player_max_speed,
        )
