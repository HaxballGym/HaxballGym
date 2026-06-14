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
import sys
import time

import numpy as np
import torch
import torch.nn as nn
from loguru import logger
from opponents import chase_bins
from pydantic_settings import BaseSettings, SettingsConfigDict
from torch.distributions import Categorical

from haxballgym import (
    CombinedReward,
    DefaultObs,
    DiscreteAction,
    Env,
    GoalCondition,
    GoalReward,
    KickoffMutator,
    TimeoutCondition,
    TransitionEngine,
    VelocityBallToGoal,
    VelocityPlayerToBall,
)

# Clean console output: timestamp + level + message, no module noise.
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> <level>{level: <7}</level> {message}",
    colorize=True,
    level="INFO",
)


class Settings(BaseSettings):
    """Training config. Every field is overridable from the environment by its
    upper-cased name, e.g. `ITERS=500 JIGGLE=0.2 DEV=mps WANDB=1 python train.py`,
    or from a `.env` file in the working directory.
    """

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    # run / compute
    iters: int = 250
    dev: str = "cpu"  # "cpu" | "mps" | "cuda"
    jiggle: float = 0.30  # chase-bot angular jiggle

    # live experiment tracking
    tb: bool = True  # TensorBoard (local, no account)
    wandb: bool = False  # Weights & Biases (cloud dashboard)
    wandb_project: str = "haxballgym"
    run_name: str = ""  # blank -> timestamped


settings = Settings()


def make_logger():
    """Optional live experiment tracking. TensorBoard by default (local, no
    account): `tensorboard --logdir rl/runs`. Set WANDB=1 for the cloud dashboard
    (needs `pip install wandb` + `wandb login`). TB=0 disables all logging.

    Returns a `log(step, **scalars)` callable and a `close()` callable.
    """
    if not settings.tb and not settings.wandb:
        return (lambda step, **kw: None), (lambda: None)

    run_name = settings.run_name or f"run_{time.strftime('%Y%m%d_%H%M%S')}"
    logdir = os.path.join(os.path.dirname(__file__), "runs", run_name)

    writers = []
    if settings.tb:
        try:
            from torch.utils.tensorboard import SummaryWriter

            writers.append(("tb", SummaryWriter(logdir)))
            logger.info(
                "tensorboard -> {}  |  view: tensorboard --logdir {}", logdir, os.path.dirname(logdir)
            )
        except Exception as e:  # tensorboard not installed -> degrade gracefully
            logger.warning("tensorboard disabled ({}); pip install tensorboard to enable", e)

    if settings.wandb:
        try:
            import wandb

            wandb.init(project=settings.wandb_project, name=run_name)
            writers.append(("wandb", wandb))
            logger.info("wandb -> run '{}' in project '{}'", run_name, settings.wandb_project)
        except Exception as e:
            logger.warning("wandb disabled ({}); pip install wandb && wandb login to enable", e)

    def log(step, **scalars):
        for kind, w in writers:
            if kind == "tb":
                for k, v in scalars.items():
                    w.add_scalar(k, v, step)
            else:  # wandb
                w.log(scalars, step=step)

    def close():
        for kind, w in writers:
            if kind == "tb":
                w.close()
            else:
                w.finish()

    return log, close


N_ENVS = 512
STEP_LIMIT = 2000
TICK_SKIP = 8
T = 64
TOTAL_ITERS = settings.iters
CHASE_JIGGLE = settings.jiggle
HALF_LIFE_S = 5.0
FPS = 60 / TICK_SKIP
GAMMA = math.exp(math.log(0.5) / (FPS * HALF_LIFE_S))
LAM = 0.95
CLIP, EPOCHS, N_MB = 0.2, 4, 8
LR = 3e-4
ENT_COEF, VF_COEF, MAX_GRAD = 0.01, 0.5, 0.5
DEVICE = torch.device(settings.dev)
torch.set_num_threads(max(1, os.cpu_count() - 1))
CKPT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
os.makedirs(CKPT_DIR, exist_ok=True)
torch.manual_seed(0)
np.random.seed(0)


class Policy(nn.Module):
    def __init__(self, obs_dim):
        super().__init__()
        self.trunk = nn.Sequential(nn.Linear(obs_dim, 256), nn.Tanh(), nn.Linear(256, 256), nn.Tanh())
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


def make_env(n_envs, stadium=None):
    """This bot's env config — compose the haxballgym pieces with the reward we want.
    Reward = dense velocity shaping (WazBot) + a DEFENSIVE term that punishes the ball
    drifting toward our own goal, so the agent learns to defend (not just attack).
    This composition is research config; tune it freely (it lives here, not in the lib)."""
    return Env(
        TransitionEngine(n_envs, 1, 1, step_limit=STEP_LIMIT, tick_skip=TICK_SKIP, stadium=stadium),
        DefaultObs(),
        DiscreteAction(),
        CombinedReward(
            (VelocityPlayerToBall(), 1.0),
            (VelocityBallToGoal(attacked=True), 1.0),  # offense: ball -> opponent goal
            (VelocityBallToGoal(attacked=False), -1.0),  # defense: punish ball -> own goal
            (GoalReward(), 5.0),
        ),
        GoalCondition(),
        TimeoutCondition(STEP_LIMIT),
        KickoffMutator(),
    )


@torch.no_grad()
def evaluate_vs(model, opponent="chase", n_envs=256, steps=400, seed=123, jiggle=CHASE_JIGGLE, stadium=None):
    """Policy=RED (idx 0), opponent=BLUE (idx 1). Returns (red_goals, blue_goals)."""
    rng = np.random.default_rng(seed)
    env = make_env(n_envs, stadium=stadium)
    obs = env.reset()  # (n, 2, od)
    rg = bg = 0
    for _ in range(steps):
        red = model.act(torch.as_tensor(obs[:, 0], dtype=torch.float32, device=DEVICE))[0].cpu().numpy()
        if opponent == "chase":
            blue = chase_bins(obs[:, 1], rng, jiggle=jiggle)
        elif opponent == "random":
            blue = np.stack(
                [rng.integers(0, 3, n_envs), rng.integers(0, 3, n_envs), rng.integers(0, 2, n_envs)], 1
            )
        else:  # static
            blue = np.tile([1, 1, 0], (n_envs, 1))
        full = np.empty((n_envs, 2, 3), dtype=np.int64)
        full[:, 0] = red
        full[:, 1] = blue
        obs, rew, term, trunc = env.step(full)
        d = term | trunc
        if d.any():
            rr = rew[d, 0]  # red's reward on terminal envs
            rg += int((rr > 1.0).sum())
            bg += int((rr < -1.0).sum())
    return rg, bg


def main():
    env = make_env(N_ENVS)
    obs_dim = env.obs_dim
    B = N_ENVS  # one learner per env
    logger.info(
        "device={} obs_dim={} B={} gamma={:.4f} jiggle={} iters={}",
        DEVICE,
        obs_dim,
        B,
        GAMMA,
        CHASE_JIGGLE,
        TOTAL_ITERS,
    )
    log, close_log = make_logger()
    log(
        0,
        **{
            "hparams/gamma": GAMMA,
            "hparams/lr": LR,
            "hparams/n_envs": N_ENVS,
            "hparams/tick_skip": TICK_SKIP,
            "hparams/jiggle": CHASE_JIGGLE,
        },
    )

    # learner side: RED (idx 0) in first half of envs, BLUE (idx 1) in the rest
    learner_idx = np.zeros(N_ENVS, dtype=np.int64)
    learner_idx[N_ENVS // 2 :] = 1
    rows = np.arange(N_ENVS)
    opp_idx = 1 - learner_idx

    model = Policy(obs_dim).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    obs = env.reset()  # (N, 2, obs_dim)
    chase_rng = np.random.default_rng(2024)

    S_obs = torch.zeros(T, B, obs_dim, device=DEVICE)
    S_bins = torch.zeros(T, B, 3, dtype=torch.long, device=DEVICE)
    S_logp = torch.zeros(T, B, device=DEVICE)
    S_val = torch.zeros(T, B, device=DEVICE)
    S_rew = torch.zeros(T, B, device=DEVICE)
    S_done = torch.zeros(T, B, device=DEVICE)

    best = -1
    t0 = time.perf_counter()
    total = 0
    for it in range(1, TOTAL_ITERS + 1):
        for t in range(T):
            lo = torch.as_tensor(obs[rows, learner_idx], dtype=torch.float32, device=DEVICE)
            with torch.no_grad():
                bins, logp, val = model.act(lo)
            S_obs[t] = lo
            S_bins[t] = bins
            S_logp[t] = logp
            S_val[t] = val

            chase = chase_bins(obs[rows, opp_idx], chase_rng, jiggle=CHASE_JIGGLE)
            full = np.empty((N_ENVS, 2, 3), dtype=np.int64)
            full[rows, learner_idx] = bins.cpu().numpy()
            full[rows, opp_idx] = chase
            obs, rew, term, trunc = env.step(full)
            S_rew[t] = torch.as_tensor(rew[rows, learner_idx], device=DEVICE)
            S_done[t] = torch.as_tensor((term | trunc).astype(np.float32), device=DEVICE)
            total += N_ENVS

        with torch.no_grad():
            last_val = model(torch.as_tensor(obs[rows, learner_idx], dtype=torch.float32, device=DEVICE))[3]
        adv = torch.zeros(T, B, device=DEVICE)
        lastgae = torch.zeros(B, device=DEVICE)
        for t in reversed(range(T)):
            nnt = 1.0 - S_done[t]
            nv = last_val if t == T - 1 else S_val[t + 1]
            delta = S_rew[t] + GAMMA * nv * nnt - S_val[t]
            lastgae = delta + GAMMA * LAM * nnt * lastgae
            adv[t] = lastgae
        ret = adv + S_val

        bo = S_obs.reshape(T * B, obs_dim)
        bb = S_bins.reshape(T * B, 3)
        bl = S_logp.reshape(T * B)
        ba = adv.reshape(T * B)
        br = ret.reshape(T * B)
        ba = (ba - ba.mean()) / (ba.std() + 1e-8)
        idx = np.arange(T * B)
        mb = (T * B) // N_MB
        pls, vls, ents = [], [], []
        for _ in range(EPOCHS):
            np.random.shuffle(idx)
            for s in range(0, T * B, mb):
                mi = torch.as_tensor(idx[s : s + mb], device=DEVICE)
                logp, ent, val = model.evaluate(bo[mi], bb[mi])
                ratio = (logp - bl[mi]).exp()
                a = ba[mi]
                pl = -torch.min(ratio * a, torch.clamp(ratio, 1 - CLIP, 1 + CLIP) * a).mean()
                vl = 0.5 * (val - br[mi]).pow(2).mean()
                ent_m = ent.mean()
                loss = pl + VF_COEF * vl - ENT_COEF * ent_m
                opt.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD)
                opt.step()
                pls.append(pl.item())
                vls.append(vl.item())
                ents.append(ent_m.item())

        # --- per-iteration metrics (live in TensorBoard/W&B) ---
        sps = total / (time.perf_counter() - t0)
        log(
            total,
            **{
                "loss/policy": float(np.mean(pls)),
                "loss/value": float(np.mean(vls)),
                "loss/entropy": float(np.mean(ents)),
                "rollout/reward_mean": S_rew.mean().item(),
                "rollout/return_mean": ret.mean().item(),
                "rollout/value_mean": S_val.mean().item(),
                "perf/decisions_per_s": sps,
            },
        )

        if it % 10 == 0 or it == TOTAL_ITERS:
            cg, cb = evaluate_vs(model, "chase", 256, 400)
            net = cg - cb
            saved = net >= best
            if saved:
                best = net
                torch.save(model.state_dict(), os.path.join(CKPT_DIR, "model.pt"))
                json.dump(
                    {"obs_dim": obs_dim, "n_red": 1, "n_blue": 1},
                    open(os.path.join(CKPT_DIR, "meta.json"), "w"),
                )
            log(total, **{"eval/chase_goals": cg, "eval/chase_conceded": cb, "eval/chase_net": net})
            logger.info(
                "it {:4d} | {:5.2f}M dec | {:4.0f}k dec/s | vs CHASE {:3d}:{:<3d} (net {:+d}){}",
                it,
                total / 1e6,
                sps / 1e3,
                cg,
                cb,
                net,
                "  <- saved" if saved else "",
            )

    logger.success("best net-vs-chase: {:+d}", best)
    m = Policy(obs_dim)
    m.load_state_dict(torch.load(os.path.join(CKPT_DIR, "model.pt"), map_location=DEVICE))
    for opp in ("chase", "random", "static"):
        rg, bg = evaluate_vs(m, opp, 400, 600)
        logger.info("  vs {:7s}: RED {} - {} BLUE", opp, rg, bg)
    close_log()


if __name__ == "__main__":
    main()
