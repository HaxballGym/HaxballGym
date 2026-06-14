"""Self-play... no — train the policy against a CHASE BOT on the headless core.

The learner plays a scripted chase bot (moves at the ball + kicks, with angular
jiggle so it isn't on-rails). That forces real possession contests instead of the
"just shove the ball right" behaviour you get vs random/static. The learner is put
on RED in half the envs and BLUE in the other half, so one net becomes strong on
both sides (the obs is goal-relative/side-aware -> no per-team mirroring).

Rewards = WazBot's CombinedReward (VelocityPlayerToBall + VelocityBallToGoal),
in Rust; tick_skip=8; gamma from a 5s half-life. Vanilla PPO (CleanRL-style).

Run:   uv run python train.py
Saves: rl/checkpoints/model.pt = best-vs-chase checkpoint
"""
import json
import math
import os
import time

import numpy as np
import torch
import torch.nn as nn
from torch.distributions import Categorical

import haxball_core as hc
from opponents import chase_bins

N_ENVS = 512
STEP_LIMIT = 2000
TICK_SKIP = 8
T = 64
TOTAL_ITERS = int(os.environ.get("ITERS", 250))
CHASE_JIGGLE = float(os.environ.get("JIGGLE", 0.30))
HALF_LIFE_S = 5.0
FPS = 60 / TICK_SKIP
GAMMA = math.exp(math.log(0.5) / (FPS * HALF_LIFE_S))
LAM = 0.95
CLIP, EPOCHS, N_MB = 0.2, 4, 8
LR = 3e-4
ENT_COEF, VF_COEF, MAX_GRAD = 0.01, 0.5, 0.5
DEVICE = torch.device(os.environ.get("DEV", "cpu"))
torch.set_num_threads(max(1, os.cpu_count() - 1))
CKPT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
os.makedirs(CKPT_DIR, exist_ok=True)
torch.manual_seed(0); np.random.seed(0)


def decode(bins, n_envs, n_players):
    a = np.empty((n_envs * n_players, 3), dtype=np.int64)
    a[:, 0] = bins[:, 0] - 1
    a[:, 1] = bins[:, 1] - 1
    a[:, 2] = bins[:, 2]
    return a.reshape(n_envs, n_players, 3)


class Policy(nn.Module):
    def __init__(self, obs_dim):
        super().__init__()
        self.trunk = nn.Sequential(nn.Linear(obs_dim, 256), nn.Tanh(),
                                   nn.Linear(256, 256), nn.Tanh())
        self.head_x = nn.Linear(256, 3)
        self.head_y = nn.Linear(256, 3)
        self.head_k = nn.Linear(256, 2)
        self.value = nn.Linear(256, 1)

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


@torch.no_grad()
def evaluate_vs(model, opponent="chase", n_envs=256, steps=400, seed=123, jiggle=CHASE_JIGGLE):
    """Policy=RED (idx 0), opponent=BLUE (idx 1). Returns (red_goals, blue_goals)."""
    rng = np.random.default_rng(seed)
    env = hc.VecEnv(n_envs, 1, 1, step_limit=STEP_LIMIT, tick_skip=TICK_SKIP)
    obs = env.reset().reshape(n_envs * 2, -1)
    rg = bg = 0
    for _ in range(steps):
        bins = model.act(torch.as_tensor(obs, dtype=torch.float32, device=DEVICE))[0].cpu().numpy()
        if opponent == "chase":
            blue = chase_bins(obs[1::2], rng, jiggle=jiggle)
        elif opponent == "random":
            blue = np.stack([rng.integers(0, 3, n_envs), rng.integers(0, 3, n_envs), rng.integers(0, 2, n_envs)], 1)
        else:  # static
            blue = np.tile([1, 1, 0], (n_envs, 1))
        ab = np.empty((n_envs * 2, 3), dtype=np.int64)
        ab[0::2] = bins[0::2]; ab[1::2] = blue
        obs, rew, done = env.step(decode(ab, n_envs, 2))
        obs = obs.reshape(n_envs * 2, -1)
        d = done.astype(bool)
        if d.any():
            rr = rew.reshape(n_envs, 2)[d, 0]
            rg += int((rr > 1.0).sum()); bg += int((rr < -1.0).sum())
    return rg, bg


def main():
    env = hc.VecEnv(N_ENVS, 1, 1, step_limit=STEP_LIMIT, tick_skip=TICK_SKIP)
    obs_dim = env.obs_dim
    B = N_ENVS  # one learner per env
    print(f"device={DEVICE} obs_dim={obs_dim} B={B} gamma={GAMMA:.4f} jiggle={CHASE_JIGGLE} iters={TOTAL_ITERS}")

    # learner side: RED (idx 0) in first half of envs, BLUE (idx 1) in the rest
    learner_idx = np.zeros(N_ENVS, dtype=np.int64); learner_idx[N_ENVS // 2:] = 1
    rows = np.arange(N_ENVS) * 2
    learner_rows = rows + learner_idx
    opp_rows = rows + (1 - learner_idx)

    model = Policy(obs_dim).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    obs = env.reset().reshape(N_ENVS * 2, obs_dim)
    chase_rng = np.random.default_rng(2024)

    S_obs = torch.zeros(T, B, obs_dim, device=DEVICE)
    S_bins = torch.zeros(T, B, 3, dtype=torch.long, device=DEVICE)
    S_logp = torch.zeros(T, B, device=DEVICE)
    S_val = torch.zeros(T, B, device=DEVICE)
    S_rew = torch.zeros(T, B, device=DEVICE)
    S_done = torch.zeros(T, B, device=DEVICE)

    best = -1
    t0 = time.perf_counter(); total = 0
    for it in range(1, TOTAL_ITERS + 1):
        for t in range(T):
            lo = torch.as_tensor(obs[learner_rows], dtype=torch.float32, device=DEVICE)
            with torch.no_grad():
                bins, logp, val = model.act(lo)
            S_obs[t] = lo; S_bins[t] = bins; S_logp[t] = logp; S_val[t] = val

            chase = chase_bins(obs[opp_rows], chase_rng, jiggle=CHASE_JIGGLE)
            full = np.empty((N_ENVS * 2, 3), dtype=np.int64)
            full[learner_rows] = bins.cpu().numpy()
            full[opp_rows] = chase
            nobs, rew, done = env.step(decode(full, N_ENVS, 2))
            obs = nobs.reshape(N_ENVS * 2, obs_dim)
            S_rew[t] = torch.as_tensor(rew.reshape(N_ENVS, 2)[np.arange(N_ENVS), learner_idx], device=DEVICE)
            S_done[t] = torch.as_tensor(done.astype(np.float32), device=DEVICE)
            total += N_ENVS

        with torch.no_grad():
            last_val = model(torch.as_tensor(obs[learner_rows], dtype=torch.float32, device=DEVICE))[3]
        adv = torch.zeros(T, B, device=DEVICE); lastgae = torch.zeros(B, device=DEVICE)
        for t in reversed(range(T)):
            nnt = 1.0 - S_done[t]
            nv = last_val if t == T - 1 else S_val[t + 1]
            delta = S_rew[t] + GAMMA * nv * nnt - S_val[t]
            lastgae = delta + GAMMA * LAM * nnt * lastgae
            adv[t] = lastgae
        ret = adv + S_val

        bo = S_obs.reshape(T * B, obs_dim); bb = S_bins.reshape(T * B, 3)
        bl = S_logp.reshape(T * B); ba = adv.reshape(T * B); br = ret.reshape(T * B)
        ba = (ba - ba.mean()) / (ba.std() + 1e-8)
        idx = np.arange(T * B); mb = (T * B) // N_MB
        for _ in range(EPOCHS):
            np.random.shuffle(idx)
            for s in range(0, T * B, mb):
                mi = torch.as_tensor(idx[s:s + mb], device=DEVICE)
                logp, ent, val = model.evaluate(bo[mi], bb[mi])
                ratio = (logp - bl[mi]).exp(); a = ba[mi]
                pl = -torch.min(ratio * a, torch.clamp(ratio, 1 - CLIP, 1 + CLIP) * a).mean()
                vl = 0.5 * (val - br[mi]).pow(2).mean()
                loss = pl + VF_COEF * vl - ENT_COEF * ent.mean()
                opt.zero_grad(); loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD); opt.step()

        if it % 10 == 0 or it == TOTAL_ITERS:
            cg, cb = evaluate_vs(model, "chase", 256, 400)
            sps = total / (time.perf_counter() - t0)
            tag = ""
            net = cg - cb
            if net >= best:
                best = net
                torch.save(model.state_dict(), os.path.join(CKPT_DIR, "model.pt"))
                json.dump({"obs_dim": obs_dim, "n_red": 1, "n_blue": 1}, open(os.path.join(CKPT_DIR, "meta.json"), "w"))
                tag = "  <- saved"
            print(f"it {it:4d} | {total/1e6:5.2f}M dec | {sps/1e3:4.0f}k dec/s | vs CHASE {cg:3d}:{cb:<3d} (net {net:+d}){tag}")

    print(f"\nbest net-vs-chase: {best:+d}")
    m = Policy(obs_dim); m.load_state_dict(torch.load(os.path.join(CKPT_DIR, "model.pt"), map_location=DEVICE))
    for opp in ("chase", "random", "static"):
        rg, bg = evaluate_vs(m, opp, 400, 600)
        print(f"  vs {opp:7s}: RED {rg} - {bg} BLUE")


if __name__ == "__main__":
    main()
