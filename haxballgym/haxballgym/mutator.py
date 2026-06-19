"""State mutators set up the state on (re)set.

`KickoffMutator` delegates to the core's built-in classic kickoff. The others build
an explicit state and push it through `engine.set_state` — the extension point for
non-kickoff resets (random spawns, scenario drills, seeding a replay position), the
RLGym `StateMutator` role. A state setter starting episodes from varied positions is
the standard exploration-curriculum trick (e.g. Seer's replay/goalie/wall setters).
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .engine import TransitionEngine
from .state import GameState


class StateMutator(ABC):
    @abstractmethod
    def reset_all(self, engine: TransitionEngine) -> GameState: ...

    @abstractmethod
    def reset_mask(self, engine: TransitionEngine, mask: np.ndarray) -> None: ...


class KickoffMutator(StateMutator):
    """The classic Haxball kickoff (spawn positions + still ball), built in the core."""

    def reset_all(self, engine: TransitionEngine) -> GameState:
        return engine.reset()

    def reset_mask(self, engine: TransitionEngine, mask: np.ndarray) -> None:
        engine.reset_mask(mask)


class StateSetterMutator(StateMutator):
    """Base for mutators that place an explicit state via `engine.set_state`.

    Subclasses implement `sample(engine, n) -> (ball_pos, ball_vel, player_pos,
    player_vel)`, each shaped to `n` envs. `reset_mask` patches only the done envs
    onto the current snapshot (so live envs keep their state and step counter)."""

    @abstractmethod
    def sample(
        self, engine: TransitionEngine, n: int
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]: ...

    def reset_all(self, engine: TransitionEngine) -> GameState:
        return engine.set_state(*self.sample(engine, engine.n_envs))

    def reset_mask(self, engine: TransitionEngine, mask: np.ndarray) -> None:
        st = engine.snapshot()
        bp, bv = st.ball_pos.copy(), st.ball_vel.copy()
        pp, pv = st.player_pos.copy(), st.player_vel.copy()
        steps = st.steps.copy()
        idx = np.flatnonzero(mask)
        if idx.size:
            nbp, nbv, npp, npv = self.sample(engine, idx.size)
            bp[idx], bv[idx], pp[idx], pv[idx] = nbp, nbv, npp, npv
            steps[idx] = 0
        engine.set_state(bp, bv, pp, pv, steps)


class RandomStateMutator(StateSetterMutator):
    """Scatter every disc uniformly in the play area with (optionally) a random ball
    kick. Field bounds default to the classic stadium; pass `x_half`/`y_half` for
    other maps. The x-extent is auto-fit to the goal geometry when not given."""

    def __init__(
        self,
        x_half: float | None = None,
        y_half: float = 150.0,
        pad: float = 30.0,
        ball_speed: float = 0.0,
        rng: int | np.random.Generator | None = None,
    ):
        self.x_half = x_half
        self.y_half = y_half
        self.pad = pad
        self.ball_speed = ball_speed
        self.rng = np.random.default_rng(rng)  # accepts an int seed, a Generator, or None

    def _bounds(self, engine: TransitionEngine) -> tuple[float, float]:
        if self.x_half is not None:
            return self.x_half, self.y_half
        gx = float(np.abs(np.concatenate([engine._goal_p0[:, 0], engine._goal_p1[:, 0]])).max())
        return gx, self.y_half

    def sample(self, engine: TransitionEngine, n: int):
        p = engine.n_players
        xh, yh = self._bounds(engine)
        xh, yh = max(xh - self.pad, 1.0), max(yh - self.pad, 1.0)
        u = lambda shape, h: self.rng.uniform(-h, h, shape)  # noqa: E731
        ball_pos = np.stack([u(n, xh), u(n, yh)], axis=-1)
        player_pos = np.stack([u((n, p), xh), u((n, p), yh)], axis=-1)
        player_vel = np.zeros((n, p, 2))
        if self.ball_speed:
            theta = self.rng.uniform(0, 2 * np.pi, n)
            ball_vel = self.ball_speed * np.stack([np.cos(theta), np.sin(theta)], axis=-1)
        else:
            ball_vel = np.zeros((n, 2))
        return ball_pos, ball_vel, player_pos, player_vel


class FixedStateMutator(StateSetterMutator):
    """Always reset to one explicit (per-env) state — for scenario eval / debugging.
    Arrays are `(N, …)` for the engine's env count, or `(…)`/`(1, …)` to broadcast."""

    def __init__(
        self,
        ball_pos: np.ndarray,
        player_pos: np.ndarray,
        ball_vel: np.ndarray | None = None,
        player_vel: np.ndarray | None = None,
    ):
        self.ball_pos = np.asarray(ball_pos, dtype=np.float64)
        self.player_pos = np.asarray(player_pos, dtype=np.float64)
        self.ball_vel = None if ball_vel is None else np.asarray(ball_vel, dtype=np.float64)
        self.player_vel = None if player_vel is None else np.asarray(player_vel, dtype=np.float64)

    def sample(self, engine: TransitionEngine, n: int):
        bp = np.broadcast_to(self.ball_pos, (n, 2)).copy()
        pp = np.broadcast_to(self.player_pos, (n, engine.n_players, 2)).copy()
        bv = np.zeros((n, 2)) if self.ball_vel is None else np.broadcast_to(self.ball_vel, (n, 2)).copy()
        pv = (
            np.zeros((n, engine.n_players, 2))
            if self.player_vel is None
            else np.broadcast_to(self.player_vel, (n, engine.n_players, 2)).copy()
        )
        return bp, bv, pp, pv


class ScenarioMutator(StateSetterMutator):
    """Skill DRILLS — "challenge maps" as state-setters. Each reset spawns a *purposeful*
    1v1 situation so the policy practices the specific skills random self-play rarely sets
    up:
      - "shoot":     attacker + ball near the opponent goal, often PINNED to a side wall (→
                     the ROCKET); defender recovering. Drills finishing / power shots.
      - "breakaway": attacker with the ball, the defender BEATEN (goal-side behind) — a clear
                     run at goal. Drills converting the gap.
      - "rebound":   ball fired INTO a side wall near the attacker so it bounces back. Drills
                     reading wall rebounds (a known bot weakness).
      - "dribble":   attacker with the ball, defender pressing at midfield. Drills possession.
      - "defend":    opponent with the ball attacking YOUR goal. Drills last-ditch defending.
    World frame: RED attacks +x. Training plays both sides, so each drill trains the attacker
    AND the defender. Generalizes to NvN (reds share the attack role, blues defend). One drill
    is picked uniformly per env per reset; pass `scenarios` to restrict the set."""

    ALL = ("shoot", "breakaway", "rebound", "dribble", "defend")

    def __init__(self, scenarios=None, x_half=None, y_half: float = 150.0, pad: float = 24.0, rng=None):
        self.scenarios = tuple(scenarios) if scenarios else self.ALL
        self.x_half, self.y_half, self.pad = x_half, y_half, pad
        self.rng = np.random.default_rng(rng)  # accepts an int seed, a Generator, or None

    def _bounds(self, engine: TransitionEngine) -> tuple[float, float]:
        if self.x_half is not None:
            return self.x_half, self.y_half
        gx = float(np.abs(np.concatenate([engine._goal_p0[:, 0], engine._goal_p1[:, 0]])).max())
        return gx, self.y_half

    def _drill(self, name: str, k: int, xh: float, yh: float):
        """Return per-env (red_anchor, blue_anchor, ball_pos, ball_vel), each (k, 2)."""
        R = self.rng
        uy = lambda: R.uniform(-yh, yh, k)  # noqa: E731
        z = np.zeros((k, 2))
        if name == "shoot":
            pin = R.random(k) < 0.5  # half the time pin the ball to a side wall (the rocket)
            by = np.where(pin, np.sign(R.uniform(-1, 1, k)) * (yh - R.uniform(2, 12, k)), uy())
            bx = R.uniform(0.6 * xh, 0.88 * xh, k)
            ball = np.stack([bx, by], -1)
            ra = np.stack(
                [bx - R.uniform(16, 26, k), by - np.where(pin, np.sign(by), 0.0) * R.uniform(12, 20, k)], -1
            )
            ba = np.stack([R.uniform(0.7 * xh, 0.92 * xh, k), uy()], -1)  # defender near own goal
            return ra, ba, ball, z
        if name == "breakaway":
            rx, ry = R.uniform(-0.1 * xh, 0.4 * xh, k), uy()
            ra = np.stack([rx, ry], -1)
            ball = np.stack([rx + R.uniform(8, 18, k), ry + R.uniform(-6, 6, k)], -1)
            ba = np.stack([rx - R.uniform(50, 150, k), ry + R.uniform(-30, 30, k)], -1)  # beaten, behind
            return ra, ba, ball, z
        if name == "rebound":
            wall = np.sign(R.uniform(-1, 1, k))
            bx, by = R.uniform(0.1 * xh, 0.55 * xh, k), wall * (yh - R.uniform(2, 10, k))
            ball = np.stack([bx, by], -1)
            bv = np.stack([R.uniform(-4, 4, k), wall * R.uniform(4, 9, k)], -1)  # fired INTO the wall
            ra = np.stack([bx - R.uniform(20, 70, k), by - wall * R.uniform(30, 80, k)], -1)
            ba = np.stack([R.uniform(0.55 * xh, 0.9 * xh, k), uy()], -1)
            return ra, ba, ball, bv
        if name == "dribble":
            rx, ry = R.uniform(-0.35 * xh, 0.15 * xh, k), uy()
            ra = np.stack([rx, ry], -1)
            ball = np.stack([rx + R.uniform(8, 16, k), ry + R.uniform(-6, 6, k)], -1)
            ba = np.stack([rx + R.uniform(45, 100, k), ry + R.uniform(-25, 25, k)], -1)  # pressing ahead
            return ra, ba, ball, z
        # "defend": blue attacks our (-x) goal; red defends goal-side
        bx, byy = R.uniform(-0.8 * xh, -0.45 * xh, k), uy()
        ba = np.stack([bx, byy], -1)
        ball = np.stack([bx - R.uniform(8, 18, k), byy + R.uniform(-6, 6, k)], -1)  # at blue's feet
        bv = np.stack([-R.uniform(2, 6, k), R.uniform(-3, 3, k)], -1)  # toward our goal
        ra = np.stack([bx - R.uniform(40, 110, k), byy + R.uniform(-30, 30, k)], -1)  # red goal-side
        return ra, ba, ball, bv

    def sample(self, engine: TransitionEngine, n: int):
        xh, yh = self._bounds(engine)
        xh, yh = max(xh - self.pad, 1.0), max(yh - self.pad, 1.0)
        R = self.rng
        teams = np.asarray(engine._teams)
        teams = teams[0] if teams.ndim == 2 else teams
        red, blue = np.where(teams == 2)[0], np.where(teams == 4)[0]  # RED=2, BLUE=4
        p = engine.n_players
        bp, bv = np.zeros((n, 2)), np.zeros((n, 2))
        ra, ba = np.zeros((n, 2)), np.zeros((n, 2))
        which = R.integers(0, len(self.scenarios), n)
        for si, name in enumerate(self.scenarios):
            m = which == si
            k = int(m.sum())
            if k:
                ra[m], ba[m], bp[m], bv[m] = self._drill(name, k, xh, yh)
        pp, pv = np.zeros((n, p, 2)), np.zeros((n, p, 2))
        for s in red:  # scatter teammates around the team anchor
            pp[:, s] = ra + R.uniform(-18, 18, (n, 2))
        for s in blue:
            pp[:, s] = ba + R.uniform(-18, 18, (n, 2))
        np.clip(pp[..., 0], -xh, xh, out=pp[..., 0])
        np.clip(pp[..., 1], -yh, yh, out=pp[..., 1])
        np.clip(bp[..., 0], -xh, xh, out=bp[..., 0])
        np.clip(bp[..., 1], -yh, yh, out=bp[..., 1])
        return bp, bv, pp, pv


class MultiSetter(StateSetterMutator):
    """Compose several setters into ONE richer reset distribution: per env, delegate to a
    weighted-random choice among them. Lets a run mix e.g. real REPLAY states + skill DRILLS
    + kickoff — broader coverage than any single setter."""

    def __init__(self, setters, weights=None, rng=None):
        self.setters = list(setters)
        w = np.ones(len(self.setters)) if weights is None else np.asarray(weights, dtype=float)
        self.weights = w / w.sum()
        self.rng = np.random.default_rng(rng)  # accepts an int seed, a Generator, or None

    def sample(self, engine: TransitionEngine, n: int):
        pick = self.rng.choice(len(self.setters), size=n, p=self.weights)
        p = engine.n_players
        bp, bv = np.zeros((n, 2)), np.zeros((n, 2))
        pp, pv = np.zeros((n, p, 2)), np.zeros((n, p, 2))
        for i, s in enumerate(self.setters):
            m = pick == i
            k = int(m.sum())
            if k:
                a, b, c, d = s.sample(engine, k)
                bp[m], bv[m], pp[m], pv[m] = a, b, c, d
        return bp, bv, pp, pv


class ReplayStateMutator(StateSetterMutator):
    """Seed episodes from REAL states sampled from human replay games — the Nexto/Seer
    "replay setter", one of the biggest levers in top RL bots. Instead of always starting
    at kickoff, the policy trains on the realistic, in-distribution positions skilled
    humans actually create, so its coverage matches real play.

    The pool `.npz` holds `ball_pos (M,2)`, `ball_vel (M,2)`, `player_pos (M,2,2)`,
    `player_vel (M,2,2)` (slot 0 = red, 1 = blue, world coords from the re-sim). If it
    also has `frames_to_goal (M,)`, pass `goal_bias>0` to weight states CLOSE to a goal
    more heavily — a reverse curriculum ("start just before a goal, learn to finish").
    `goal_bias` can be lowered over training to broaden the start distribution."""

    def __init__(self, pool_path, goal_bias: float = 0.0, rng=None):
        d = np.load(pool_path)
        self.ball_pos, self.ball_vel = d["ball_pos"], d["ball_vel"]
        self.player_pos, self.player_vel = d["player_pos"], d["player_vel"]
        self.ftg = d["frames_to_goal"] if "frames_to_goal" in d else None
        self.m = len(self.ball_pos)
        self.rng = np.random.default_rng(rng)  # accepts an int seed, a Generator, or None
        self.goal_bias = float(goal_bias)

    def _weights(self):
        if not self.goal_bias or self.ftg is None:
            return None
        # exponential preference for states near a goal; goal_bias sets the timescale
        w = np.exp(-self.ftg / max(self.goal_bias, 1e-6))
        return w / w.sum()

    def sample(self, engine: TransitionEngine, n: int):
        idx = self.rng.choice(self.m, size=n, p=self._weights())
        return (
            self.ball_pos[idx].astype(np.float64).copy(),
            self.ball_vel[idx].astype(np.float64).copy(),
            self.player_pos[idx].astype(np.float64).copy(),
            self.player_vel[idx].astype(np.float64).copy(),
        )
