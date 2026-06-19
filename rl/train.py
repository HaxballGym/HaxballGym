"""Train your first Haxball bot — a clean, self-contained PPO self-play example.

This is the *starting point*: a compact, readable trainer that takes a fresh network to a
solid 1v1 bot (it comfortably crushes a hand-coded "chase the ball" opponent) in a few
minutes on a CPU. It uses only standard, published techniques:

  * PPO (Schulman et al. 2017) with GAE — the workhorse on-policy RL algorithm.
  * Self-play with an 80/20 snapshot pool (OpenAI Five): 80 % of the time the opponent is a
    frozen copy of the *current* policy (stay sharp), 20 % a past snapshot (don't forget how
    to beat older strategies / avoid cycling).
  * Linear learning-rate + entropy annealing (explore early, exploit late).

Everything runs on `haxballgym` — the batched, bit-exact Haxball simulator. The whole rollout
crosses the Python⇄Rust boundary once per batch, so a small CPU does tens of thousands of
environment steps per second.

Run:
    uv run rl/train.py                  # ~600 iters, saves rl/checkpoints/model.pt
    uv run rl/train.py --iters 1500     # train longer for a stronger bot
Then watch it play:  uv run rl/play.py
"""

from __future__ import annotations

import argparse
import os

import numpy as np
import torch
import torch.nn as nn
from torch.distributions import Categorical

from haxballgym import make_default_env

DEVICE = torch.device("cpu")  # tiny nets + a CPU-resident sim → CPU is fastest here
HERE = os.path.dirname(__file__)

# ── hyper-parameters (sane defaults; tweak via CLI) ───────────────────────────────
N_ENVS = 512  # parallel matches per rollout
T = 64  # rollout length (policy steps) per iteration
TICK_SKIP = 8  # physics ticks per policy decision (7.5 decisions/sec)
GAMMA = 0.9817  # discount (~5 s half-life at this decision rate)
LAM = 0.95  # GAE lambda
CLIP = 0.2  # PPO clip
EPOCHS, N_MB = 4, 8  # PPO epochs and minibatches per iteration
LR = 3e-4
ENT_COEF, VF_COEF, MAX_GRAD = 0.01, 0.5, 0.5
POOL_SIZE, SNAPSHOT_EVERY = 20, 10  # self-play snapshot pool


class Policy(nn.Module):
    """A small MLP with a shared trunk and three discrete action heads (move-x, move-y,
    kick) plus a value head. Discrete actions keep it simple and fast."""

    def __init__(self, obs_dim: int, hidden: int = 256, depth: int = 2, n_kick: int = 2):
        super().__init__()
        layers, d = [], obs_dim
        for _ in range(depth):
            layers += [nn.Linear(d, hidden), nn.Tanh()]
            d = hidden
        self.trunk = nn.Sequential(*layers)
        self.head_x = nn.Linear(hidden, 3)  # dx ∈ {-1, 0, +1}
        self.head_y = nn.Linear(hidden, 3)  # dy ∈ {-1, 0, +1}
        self.head_k = nn.Linear(hidden, n_kick)  # kick: 2-way {release, hold} or 3-way {.., rocket}
        self.value = nn.Linear(hidden, 1)

    def forward(self, obs):
        h = self.trunk(obs)
        return self.head_x(h), self.head_y(h), self.head_k(h), self.value(h).squeeze(-1)

    def act(self, obs):
        lx, ly, lk, v = self(obs)
        dx, dy, dk = Categorical(logits=lx), Categorical(logits=ly), Categorical(logits=lk)
        bx, by, bk = dx.sample(), dy.sample(), dk.sample()
        logp = dx.log_prob(bx) + dy.log_prob(by) + dk.log_prob(bk)
        return torch.stack([bx, by, bk], -1), logp, v

    def evaluate(self, obs, bins):
        lx, ly, lk, v = self(obs)
        dx, dy, dk = Categorical(logits=lx), Categorical(logits=ly), Categorical(logits=lk)
        logp = dx.log_prob(bins[:, 0]) + dy.log_prob(bins[:, 1]) + dk.log_prob(bins[:, 2])
        ent = dx.entropy() + dy.entropy() + dk.entropy()
        return logp, ent, v


def chase_action(obs_red, state, n_envs):
    """A hand-coded 'run at the ball and kick' opponent — the sanity-check baseline a
    trained bot should crush. Reads the raw state (not the obs) for clarity."""
    d = state.ball_pos[:, None, :] - state.player_pos  # (N, P, 2) toward the ball
    dx = np.sign(d[..., 0]).astype(np.int64) + 1
    dy = np.sign(d[..., 1]).astype(np.int64) + 1
    kick = (np.linalg.norm(d, axis=-1) < 30).astype(np.int64)
    return np.stack([dx, dy, kick], -1)  # (N, P, 3)


@torch.no_grad()
def eval_vs_chase(model, n_envs=256, steps=400):
    """Play the model (RED) vs the chase bot (BLUE); return (red_goals, blue_goals)."""
    env = make_default_env(n_envs, 1, 1, kick_values=model.head_k.out_features)
    obs = env.reset()
    rg = bg = 0
    od = obs.shape[-1]
    for _ in range(steps):
        red = model.act(torch.as_tensor(obs[:, :1].reshape(-1, od), dtype=torch.float32))[0]
        red = red.numpy().reshape(n_envs, 1, 3)
        blue = chase_action(obs[:, 1:], env.prev_state, n_envs)[:, 1:]
        full = np.concatenate([red, blue], axis=1)
        obs, rew, term, trunc = env.step(full)
        d = term | trunc
        if d.any():
            rr = rew[d, 0]
            rg += int((rr > 1.0).sum())
            bg += int((rr < -1.0).sum())
    return rg, bg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--iters", type=int, default=600)
    ap.add_argument("--hidden", type=int, default=256)
    ap.add_argument("--depth", type=int, default=2)
    ap.add_argument(
        "--kick-values",
        type=int,
        default=2,
        choices=(2, 3),
        help="2 = release/hold; 3 adds the rapid-fire 'rocket' kick",
    )
    ap.add_argument("--out", default=os.path.join(HERE, "checkpoints", "model.pt"))
    args = ap.parse_args()

    env = make_default_env(N_ENVS, 1, 1, kick_values=args.kick_values)
    obs_dim = env.obs_dim
    P = env.n_players  # 2 for 1v1
    print(
        f"obs_dim={obs_dim}  players={P}  envs={N_ENVS}  kick_values={args.kick_values}  iters={args.iters}"
    )

    model = Policy(obs_dim, args.hidden, args.depth, n_kick=args.kick_values).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR)

    # Self-play: the learner controls one team; half the envs it's red, half blue (one net
    # plays both sides). The opponent is a frozen snapshot (current copy or a past one).
    learner_side = np.zeros(N_ENVS, dtype=np.int64)
    learner_side[N_ENVS // 2 :] = 1
    lp, op = [], []
    for e in range(N_ENVS):
        mine, theirs = ([0], [1]) if learner_side[e] == 0 else ([1], [0])
        lp.append(e * P + np.array(mine))
        op.append(e * P + np.array(theirs))
    learner_pos, opp_pos = np.concatenate(lp), np.concatenate(op)
    learner_pos_t = torch.as_tensor(learner_pos)
    opp_pos_t = torch.as_tensor(opp_pos)
    opp_model = Policy(obs_dim, args.hidden, args.depth, n_kick=args.kick_values).to(DEVICE)
    pool: list[dict] = []
    B = len(learner_pos)

    def snapshot():
        return {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    # rollout buffers
    S = {
        k: torch.zeros(T, B, *s)
        for k, s in {"obs": (obs_dim,), "bins": (3,), "logp": (), "val": (), "rew": (), "done": ()}.items()
    }
    S["bins"] = S["bins"].long()

    obs = env.reset().reshape(P * N_ENVS, obs_dim)
    rng = np.random.default_rng(0)
    best = -(10**9)

    for it in range(1, args.iters + 1):
        frac = (it - 1) / max(1, args.iters - 1)
        lr_now = LR * (1 - frac) + 1e-4 * frac
        for g in opt.param_groups:
            g["lr"] = lr_now
        ent_coef = ENT_COEF * (1 - frac) + 0.005 * frac

        # pick this iteration's opponent: 80 % current copy, 20 % a past snapshot
        use_pool = pool and rng.random() < 0.2
        opp_model.load_state_dict(pool[rng.integers(len(pool))] if use_pool else snapshot())

        for t in range(T):
            o = torch.as_tensor(obs, dtype=torch.float32, device=DEVICE)
            with torch.no_grad():
                bins, logp, val = model.act(o[learner_pos_t])
            S["obs"][t], S["bins"][t], S["logp"][t], S["val"][t] = o[learner_pos_t], bins, logp, val
            acts = np.empty((P * N_ENVS, 3), dtype=np.int64)
            acts[learner_pos] = bins.numpy()
            with torch.no_grad():
                acts[opp_pos] = opp_model.act(o[opp_pos_t])[0].numpy()
            nobs, rew, term, trunc = env.step(acts.reshape(N_ENVS, P, 3))
            obs = nobs.reshape(P * N_ENVS, obs_dim)
            done = np.repeat((term | trunc).astype(np.float32), P)
            S["rew"][t] = torch.as_tensor(rew.reshape(P * N_ENVS)[learner_pos])
            S["done"][t] = torch.as_tensor(done[learner_pos])

        if it % SNAPSHOT_EVERY == 0:  # grow the self-play pool
            pool.append(snapshot())
            if len(pool) > POOL_SIZE:
                pool.pop(0)

        # GAE advantages
        with torch.no_grad():
            last_val = model(torch.as_tensor(obs, dtype=torch.float32)[learner_pos_t])[3]
        adv = torch.zeros(T, B)
        last = torch.zeros(B)
        for t in reversed(range(T)):
            nnt = 1.0 - S["done"][t]
            nv = last_val if t == T - 1 else S["val"][t + 1]
            delta = S["rew"][t] + GAMMA * nv * nnt - S["val"][t]
            last = delta + GAMMA * LAM * nnt * last
            adv[t] = last
        ret = adv + S["val"]

        bo, bb = S["obs"].reshape(T * B, obs_dim), S["bins"].reshape(T * B, 3)
        bl, ba, br = S["logp"].reshape(-1), adv.reshape(-1), ret.reshape(-1)
        ba = (ba - ba.mean()) / (ba.std() + 1e-8)
        idx = np.arange(T * B)
        mb = (T * B) // N_MB
        for _ in range(EPOCHS):
            rng.shuffle(idx)
            for s in range(0, T * B, mb):
                mi = torch.as_tensor(idx[s : s + mb])
                lp, ent, v = model.evaluate(bo[mi], bb[mi])
                ratio = (lp - bl[mi]).exp()
                a = ba[mi]
                pl = -torch.min(ratio * a, torch.clamp(ratio, 1 - CLIP, 1 + CLIP) * a).mean()
                vl = 0.5 * (v - br[mi]).pow(2).mean()
                loss = pl + VF_COEF * vl - ent_coef * ent.mean()
                opt.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD)
                opt.step()

        if it % 10 == 0 or it == args.iters:
            rg, bg = eval_vs_chase(model)
            net = rg - bg
            tag = ""
            if net >= best:
                best = net
                os.makedirs(os.path.dirname(args.out), exist_ok=True)
                torch.save(model.state_dict(), args.out)
                tag = "  <- saved"
            print(f"it {it:4d} | lr {lr_now:.1e} | vs chase {rg:3d}:{bg:<3d} (net {net:+d}){tag}")

    print(f"\ndone. best net vs chase: +{best}.  saved -> {args.out}\n  play it:  uv run rl/play.py")


if __name__ == "__main__":
    main()
