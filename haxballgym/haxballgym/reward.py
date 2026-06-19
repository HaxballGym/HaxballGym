"""Reward functions. Batched: `get_rewards(state, prev, term, trunc) -> (N, P)`.

A proven Haxball shaping: dense, non-zero-sum velocity terms keep both agents
engaged (no defensive collapse), plus a terminal goal bonus. Composes exactly like
RLGym's `CombinedReward((fn, weight), ...)`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from .state import GameState, closest_on_line


def _pairwise_dist(pos: np.ndarray) -> np.ndarray:
    """(N,P,2) player positions -> (N,P,P) Euclidean distance between every pair of players."""
    return np.linalg.norm(pos[:, :, None, :] - pos[:, None, :, :], axis=-1)


class _SameTeamMask:
    """Caches the (N,P,P) same-team boolean masks across ticks. Teams are constant within an
    episode, so the per-tick team rewards needn't rebuild the mask (and the np.eye) every step.
    Recomputes only when handed a different `team` array — an identity check, since the engine
    hands back the same static `team` array each tick; a fresh array (tests, replays) just misses
    the cache and recomputes, so this is always correct, only sometimes faster."""

    def __init__(self) -> None:
        self._team: np.ndarray | None = None
        self._same: np.ndarray | None = None
        self._excl: np.ndarray | None = None

    def get(self, team: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """-> (same, excl): (N,P,P) bool masks, `same` incl. the diagonal (self), `excl` without."""
        if self._team is not team:
            self._team = team
            same = team[:, :, None] == team[:, None, :]
            self._same = same
            self._excl = same & ~np.eye(team.shape[1], dtype=bool)[None]
        assert self._same is not None and self._excl is not None  # set above on any cache miss
        return self._same, self._excl


class RewardFunction(ABC):
    @abstractmethod
    def get_rewards(
        self, state: GameState, prev: GameState | None, terminated: np.ndarray, truncated: np.ndarray
    ) -> np.ndarray: ...

    def reset(self, state: GameState) -> None:  # noqa: B027
        pass


class VelocityPlayerToBall(RewardFunction):
    """Reward speed of each player projected onto the direction to the ball."""

    def get_rewards(self, state, prev, terminated, truncated):
        pd = state.ball_pos[:, None, :] - state.player_pos  # (N,P,2)
        npd = np.maximum(np.linalg.norm(pd, axis=-1, keepdims=True), 1e-9)
        proj = np.sum((pd / npd) * state.player_vel, axis=-1)  # (N,P)
        return proj / state.player_max_speed


class VelocityBallToGoal(RewardFunction):
    """Reward ball speed toward the nearest point of a goal line (side-aware per
    player, geometry from the stadium — works on any map). `attacked=True` is the
    opponent goal (offense); `attacked=False` is the own goal — combine it with a
    negative weight to punish conceding (defense)."""

    def __init__(self, attacked: bool = True):
        self.attacked = attacked

    def get_rewards(self, state, prev, terminated, truncated):
        p0, p1 = state.goal_line(attacked=self.attacked)  # (N,P,2) each
        ball = state.ball_pos[:, None, :]  # (N,1,2)
        target = closest_on_line(ball, p0, p1)  # (N,P,2)
        bd = target - ball  # (N,P,2)
        nbd = np.maximum(np.linalg.norm(bd, axis=-1, keepdims=True), 1e-9)
        proj = np.sum((bd / nbd) * state.ball_vel[:, None, :], axis=-1)  # (N,P)
        return proj / state.player_max_speed


class GoalReward(RewardFunction):
    """+1 for the scoring team, −(1−aggression) for the conceding team, 0 otherwise.
    `aggression` (RLGym's aggression_bias) softens the concede penalty so the bot values
    SCORING over merely not-conceding — at 1.0 conceding is free (all-out attack)."""

    def __init__(self, aggression: float = 0.0):
        self.concede = -(1.0 - aggression)

    def get_rewards(self, state, prev, terminated, truncated):
        has_goal = (state.scored != -1)[:, None]  # (N,1)
        conceding = state.scored[:, None]  # (N,1) team flag
        return np.where(has_goal, np.where(state.team == conceding, self.concede, 1.0), 0.0)


class TouchReward(RewardFunction):
    """+1 on the step a player is in contact with the ball (within player+ball radii).
    Rewards engaging the ball — pairs well with possession to discourage ball-watching."""

    def __init__(self, contact_dist: float = 26.0):  # player 15 + ball 10 + 1 buffer
        self.contact_dist = contact_dist

    def get_rewards(self, state, prev, terminated, truncated):
        d = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1)  # (N,P)
        return (d < self.contact_dist).astype(np.float32)


class PossessionReward(RewardFunction):
    """Zero-sum possession: +1 to the player closest to the ball, −1 to the rest.
    Encourages winning the ball and denying it (good 1v1 pressure)."""

    def get_rewards(self, state, prev, terminated, truncated):
        d = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1)  # (N,P)
        closest = np.argmin(d, axis=-1, keepdims=True)  # (N,1)
        idx = np.arange(state.n_players)[None, :]
        return np.where(idx == closest, 1.0, -1.0).astype(np.float32)


class TeammateSpacingReward(RewardFunction):
    """⚠ DISCOURAGED (hand-coded spacing). Per-player anti-swarm signal: reward distance to the
    NEAREST teammate (saturating at `cap`). Making spacing a PRIMARY reward produced an idle bot
    that spread out and stopped chasing the ball (the "v5 mistake"). The right way to get NvN
    teamwork is `TeamSpiritReward` (reward redistribution → cooperation emerges), optionally with
    a small `CrowdingPenalty` as a SECONDARY anti-scrum term — not this. Kept for experiments.
    Solo/1v1 players (no teammate) get 0 — no spacing signal — rather than a constant max bias."""

    def __init__(self, cap: float = 300.0):
        self.cap = float(cap)
        self._mask = _SameTeamMask()

    def get_rewards(self, state, prev, terminated, truncated):
        _, excl = self._mask.get(state.team)  # (N,P,P) teammates, excluding self
        d = np.where(excl, _pairwise_dist(state.player_pos), np.inf)  # only teammates
        nearest = d.min(axis=-1)  # (N,P) nearest-teammate distance (inf if solo)
        out = np.minimum(nearest, self.cap) / self.cap  # 0..1, far = good
        return np.where(np.isinf(nearest), 0.0, out).astype(np.float32)  # solo -> no signal


class TeamPossessionReward(RewardFunction):
    """⚠ DISCOURAGED (hand-coded roles; see `TeammateSpacingReward`). Per-team, per-player: +1 to
    the player CLOSEST to the ball on each team; a −penalty to teammates who also crowd the ball
    (within `crowd_dist`) instead of covering. Hand-coding 'one presser + supporters' tends to
    suppress the ball-chase; prefer `TeamSpiritReward` (+ optional `CrowdingPenalty`). Experiments only."""

    def __init__(self, crowd_dist: float = 160.0, crowd_pen: float = 0.5):
        self.crowd_dist = float(crowd_dist)
        self.crowd_pen = float(crowd_pen)

    def get_rewards(self, state, prev, terminated, truncated):
        d = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1)  # (N,P)
        team = state.team
        idx = np.arange(state.n_players)[None, :]
        out = np.zeros_like(d, dtype=np.float32)
        for t in np.unique(team):
            mask = team == t  # (N,P) this team
            closest = np.where(mask, d, np.inf).argmin(axis=-1, keepdims=True)  # (N,1)
            is_closest = (idx == closest) & mask
            crowding = mask & ~is_closest & (d < self.crowd_dist)  # piling on, not contesting
            out = np.where(is_closest, 1.0, out)
            out = np.where(crowding, -self.crowd_pen, out)
        return out


class BallOnOpponentHalf(RewardFunction):
    """+1 while the ball is closer to the opponent's goal than to your own — sustained
    territorial pressure rather than reflexive ball-chasing."""

    def get_rewards(self, state, prev, terminated, truncated):
        ball = state.ball_pos[:, None, :]  # (N,1,2)
        d_opp = np.linalg.norm(ball - state.goal_center(attacked=True), axis=-1)  # (N,P)
        d_own = np.linalg.norm(ball - state.goal_center(attacked=False), axis=-1)
        return (d_opp < d_own).astype(np.float32)


class BallToGoalPotential(RewardFunction):
    """Potential-based shaping (Ng et al. 1999): r = γ·Φ(s') − Φ(s), Φ = −dist(ball, opp
    goal) (normalized). Provably policy-invariant — it speeds learning toward putting the
    ball in the net WITHOUT biasing the optimal policy the way raw velocity shaping does."""

    def __init__(self, gamma: float = 0.9817, scale: float = 1.0 / 2000.0):
        self.gamma = gamma
        self.scale = scale

    def _phi(self, state) -> np.ndarray:
        ball = state.ball_pos[:, None, :]  # (N,1,2)
        return -np.linalg.norm(ball - state.goal_center(attacked=True), axis=-1) * self.scale

    def get_rewards(self, state, prev, terminated, truncated):
        phi = self._phi(state)
        prev_phi = self._phi(prev) if prev is not None else phi
        return (self.gamma * phi - prev_phi).astype(np.float32)


class LiuDistanceBallToGoal(RewardFunction):
    """RLGym staple: `exp(-dist(ball, opp goal) / scale)` ∈ (0,1] — a smooth, bounded
    distance potential (1 at the goal mouth). Better-behaved than raw distance; used by
    ~every top RL bot. `scale` ≈ half the field so the gradient spans the pitch."""

    def __init__(self, scale: float = 400.0):
        self.scale = scale

    def get_rewards(self, state, prev, terminated, truncated):
        ball = state.ball_pos[:, None, :]  # (N,1,2)
        d = np.linalg.norm(ball - state.goal_center(attacked=True), axis=-1)  # (N,P)
        return np.exp(-d / self.scale).astype(np.float32)


class LiuDistancePlayerToBall(RewardFunction):
    """RLGym staple: `exp(-dist(player, ball) / scale)` ∈ (0,1] — smooth "be near the
    ball" potential, 1 on contact. Replaces raw player-to-ball distance shaping."""

    def __init__(self, scale: float = 400.0):
        self.scale = scale

    def get_rewards(self, state, prev, terminated, truncated):
        d = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1)  # (N,P)
        return np.exp(-d / self.scale).astype(np.float32)


class AlignBallGoal(RewardFunction):
    """RLGym `AlignBallGoal`: reward good POSITIONING relative to the ball — `offense`
    rewards being behind the ball toward the opponent goal (so a touch sends it goalward);
    `defense` rewards sitting goal-side of the ball toward your own net. Cosine of the
    player→ball direction against the ball→goal directions, in [-1, 1]."""

    def __init__(self, defense: float = 0.5, offense: float = 0.5):
        self.defense, self.offense = defense, offense

    def get_rewards(self, state, prev, terminated, truncated):
        ball = state.ball_pos[:, None, :]  # (N,1,2)

        def unit(v):
            return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-9)

        a2b = unit(ball - state.player_pos)  # player -> ball
        attack = unit(state.goal_center(attacked=True) - ball)  # ball -> opp goal
        protect = unit(ball - state.goal_center(attacked=False))  # own goal -> ball
        offensive = np.sum(attack * a2b, axis=-1) * self.offense
        defensive = np.sum(protect * a2b, axis=-1) * self.defense
        return (offensive + defensive).astype(np.float32)


class DistanceWeightedAlignment(RewardFunction):
    """Lucy-SKG's key idea: `AlignBallGoal × LiuDistancePlayerToBall` — only credit good
    alignment when you're close enough to the ball to act on it. This combination (with
    potential-based shaping) is why Lucy-SKG beat Nexto 300–4 at ~5× sample-efficiency."""

    def __init__(self, defense: float = 0.5, offense: float = 0.5, scale: float = 400.0):
        self.align = AlignBallGoal(defense, offense)
        self.prox = LiuDistancePlayerToBall(scale)

    def get_rewards(self, state, prev, terminated, truncated):
        a = self.align.get_rewards(state, prev, terminated, truncated)
        p = self.prox.get_rewards(state, prev, terminated, truncated)
        return (a * p).astype(np.float32)


class TouchVelocityToGoal(RewardFunction):
    """Event-style: reward = ball speed toward the opponent goal, but ONLY on the frames
    the player is touching the ball (credit your OWN touches, not the opponent's). A
    cleaner "good touch" signal than raw ball-to-goal velocity."""

    def __init__(self, contact_dist: float = 26.0, scale: float = 1.0):
        self.contact_dist = contact_dist
        self.vbg = VelocityBallToGoal(attacked=True)
        self.scale = scale

    def get_rewards(self, state, prev, terminated, truncated):
        touching = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1) < self.contact_dist
        return (self.vbg.get_rewards(state, prev, terminated, truncated) * touching * self.scale).astype(
            np.float32
        )


class PowerShotReward(RewardFunction):
    """Rewards the ROCKET — the pro's most important technique. On the frames a player is
    touching the ball, reward the ball's speed toward the opponent goal, raised to a power
    `>1` so the very fastest shots (the wall-pinned double-kick "rocket") pay off
    disproportionately. We don't need to detect the wall: a rocket is just the highest
    goalward ball-speed achievable, and the physics make pinning the ball against a wall the
    optimal way to reach it — so rewarding raw goalward power makes RL *discover* the rocket.
    Only the toucher is credited (so you reward YOUR power shots, not the opponent's)."""

    def __init__(self, contact_dist: float = 26.0, exponent: float = 1.5, clip: float = 6.0):
        self.contact_dist = contact_dist
        self.exponent = exponent
        self.clip = clip
        self.vbg = VelocityBallToGoal(attacked=True)

    def get_rewards(self, state, prev, terminated, truncated):
        touching = (
            np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1) < self.contact_dist
        )  # (N,P)
        # vbg is already normalized by player_max_speed; a rocket's ball speed exceeds it, so
        # the projected value runs well above 1 — exactly what the exponent amplifies.
        proj = np.maximum(self.vbg.get_rewards(state, prev, terminated, truncated), 0.0)  # (N,P)
        power = np.minimum(proj, self.clip) ** self.exponent
        return (power * touching).astype(np.float32)


class BreakawayReward(RewardFunction):
    """Rewards the core 1v1 objective: BREAK AWAY from the opponent — meaning you've gotten
    GOAL-SIDE of the defender, ahead of them toward the goal you attack. NOT raw distance to
    the opponent: a sideways gap isn't a breakaway, but an 'up gap' that still leaves you
    nearer the goal than the defender is. So reward = (you have the ball) × relu(nearest-
    defender's distance to that goal − your distance to that goal)/scale, clipped to 1.
    Positive only when you are closer to the opponent's goal than the defender — i.e. you've
    broken through. Distance-to-goal (not x-projection) so progress in any direction that
    beats the defender to the goal counts. Works NvN (nearest opponent = the defender)."""

    def __init__(self, scale: float = 300.0):
        self.scale = scale

    def get_rewards(self, state, prev, terminated, truncated):
        d_ball = np.linalg.norm(state.ball_pos[:, None, :] - state.player_pos, axis=-1)  # (N,P)
        has_ball = d_ball == d_ball.min(axis=-1, keepdims=True)  # (N,P) closest player(s)
        attacked = state.goal_center(attacked=True)  # (N,P,2) the goal each player attacks
        my_d = np.linalg.norm(state.player_pos - attacked, axis=-1)  # (N,P) my dist to that goal
        # each OTHER player's distance to player p's attacked goal: pos[o] vs attacked[p]
        diff = state.player_pos[:, None, :, :] - attacked[:, :, None, :]  # (N,P,P,2): [p, o]
        d_o = np.linalg.norm(diff, axis=-1)  # (N,P,P)
        opp = state.team[:, None, :] != state.team[:, :, None]  # (N,P,P) o is p's opponent
        def_d = np.where(opp, d_o, np.inf).min(axis=-1)  # (N,P) nearest defender's dist to my goal
        ahead = np.minimum(np.maximum(def_d - my_d, 0.0) / self.scale, 1.0)  # goal-side advantage
        return (has_ball * ahead).astype(np.float32)


class CombinedReward(RewardFunction):
    def __init__(self, *terms: tuple[RewardFunction, float]):
        self.terms = terms

    def reset(self, state):
        for fn, _ in self.terms:
            fn.reset(state)

    def get_rewards(self, state, prev, terminated, truncated):
        total = np.zeros((state.n_envs, state.n_players), dtype=np.float32)
        for fn, w in self.terms:
            total += w * fn.get_rewards(state, prev, terminated, truncated)
        return total


class CrowdingPenalty(RewardFunction):
    """Per-player anti-rugby penalty: for each player, −Σ over same-team others of max(0, 1−dist/
    crowd_dist) — strongest when teammates are stacked, smoothly zero beyond `crowd_dist`. A SECONDARY
    term (keep the weight low) layered on top of the working ball-chase + team-spirit reward; it
    discourages the 3-on-the-ball scrum WITHOUT removing the ball-chase (the v5 mistake was making
    spacing primary and deleting the chase, which produced an idle bot). Applied OUTSIDE the
    team-spirit redistribution so each player feels its OWN crowding, not a shared/averaged version."""

    def __init__(self, crowd_dist: float = 80.0):
        self.crowd_dist = float(crowd_dist)
        self._mask = _SameTeamMask()

    def get_rewards(self, state, prev, terminated, truncated):
        _, excl = self._mask.get(state.team)  # (N,P,P) teammates, excluding self
        d = _pairwise_dist(state.player_pos)  # (N,P,P) pairwise
        crowd = np.where(excl, np.maximum(0.0, 1.0 - d / self.crowd_dist), 0.0)  # (N,P,P), 0..1
        return (-crowd.sum(-1)).astype(np.float32)  # (N,P) — negative, biggest when stacked


class TeamSpiritReward(RewardFunction):
    """RLGym's `DistributeRewardsWrapper` — the OpenAI-Five team-spirit credit-assignment scheme,
    and the ACTUAL way RLGym/Nexto/Seer get teamwork (NOT hand-coded spacing). It wraps a normal
    per-agent reward and redistributes it:

        spirit_i   = selfishness · own_i + selflessness · mean(team_rewards)
        adjusted_i = team_coef · spirit_i − opp_coef · mean(opponent_rewards)

    `selflessness` (= "team spirit") blends each agent's reward toward its team mean, so a
    teammate's good play rewards everyone → cooperation; the −opp_coef·mean(opp) term makes it
    zero-sum vs the other team → defense. Roles (keeper + attackers) then EMERGE from self-play at
    scale — you don't reward spacing directly. Keep the base rewards as ordinary per-agent signals
    (every player still gets VelocityPlayerToBall etc.). Anneal `selflessness` low→high over the run
    (learn ball mechanics selfishly first, then cooperate) via `set_team_spirit`."""

    def __init__(
        self,
        reward_fn: RewardFunction,
        *,
        selflessness: float = 0.3,
        selfishness: float | None = None,
        team_coef: float = 0.5,
        opp_coef: float | None = None,
    ):
        self.reward_fn = reward_fn
        self.selflessness = float(selflessness)
        self.selfishness = (1.0 - self.selflessness) if selfishness is None else float(selfishness)
        self.team_coef = float(team_coef)
        self.opp_coef = (1.0 - self.team_coef) if opp_coef is None else float(opp_coef)
        self._mask = _SameTeamMask()

    def set_team_spirit(self, s: float) -> None:
        """Anneal hook: set selflessness (team spirit); selfishness tracks as 1−s."""
        self.selflessness = float(s)
        self.selfishness = 1.0 - self.selflessness

    def reset(self, state):
        self.reward_fn.reset(state)

    def get_rewards(self, state, prev, terminated, truncated):
        base = self.reward_fn.get_rewards(state, prev, terminated, truncated)  # (N,P)
        same, _ = self._mask.get(state.team)  # (N,P,P): j on i's team (incl. self)
        opp = ~same
        team_mean = (base[:, None, :] * same).sum(-1) / np.maximum(same.sum(-1), 1)  # (N,P)
        opp_mean = (base[:, None, :] * opp).sum(-1) / np.maximum(opp.sum(-1), 1)  # (N,P)
        spirit = self.selfishness * base + self.selflessness * team_mean
        return (self.team_coef * spirit - self.opp_coef * opp_mean).astype(np.float32)


class CurriculumReward(RewardFunction):
    """A reward whose active term-set CHANGES as the policy improves — the dense→sparse
    staging the top RL bots hand-tune (Necto/Seer), made adaptive: each `tier` is a
    `[(fn, weight), ...]` list, and the trainer advances `level` (via `set_level`) only
    when the bot crosses a skill threshold. So early on it rewards "touch the ball", and
    only "unlocks" positioning / goal-dominant rewards once the bot is good enough.
    `set_level` switches tiers directly (a hard cut, not a cross-fade)."""

    def __init__(self, tiers: list[list[tuple[RewardFunction, float]]]):
        self.tiers = tiers
        self.level = 0

    def set_level(self, k: int) -> None:
        self.level = max(0, min(int(k), len(self.tiers) - 1))

    def reset(self, state):
        for tier in self.tiers:
            for fn, _ in tier:
                fn.reset(state)

    def get_rewards(self, state, prev, terminated, truncated):
        total = np.zeros((state.n_envs, state.n_players), dtype=np.float32)
        for fn, w in self.tiers[self.level]:
            total += w * fn.get_rewards(state, prev, terminated, truncated)
        return total
