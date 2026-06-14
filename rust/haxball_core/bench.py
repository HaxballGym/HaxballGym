"""Throughput benchmark for the headless vectorized core.

Measures raw steps-per-second (SPS) = envs * agents * ticks / wallclock, for a
few team sizes and env counts. This is the number that matters vs Ursina.

Run:  uv run python bench.py
"""

import time

import haxball_core as hc
import numpy as np


def bench(n_envs, n_red, n_blue, ticks=2000):
    env = hc.VecEnv(n_envs, n_red, n_blue)
    env.reset_all()

    # warmup
    env.rollout_bench(50)

    t0 = time.perf_counter()
    agent_steps = env.rollout_bench(ticks)
    dt = time.perf_counter() - t0

    env_steps = n_envs * ticks
    sps_env = env_steps / dt
    sps_agent = agent_steps / dt
    print(
        f"{n_red}v{n_blue} | {n_envs:>5} envs | "
        f"{sps_env / 1e6:6.2f}M env-steps/s | {sps_agent / 1e6:6.2f}M agent-steps/s | {dt * 1000:6.1f} ms"
    )


def bench_full_step(n_envs, n_red, n_blue, ticks=500):
    """Includes Python marshalling (actions in, obs/reward/done out)."""
    env = hc.VecEnv(n_envs, n_red, n_blue)
    env.reset_all()
    n_players = n_red + n_blue
    acts = np.random.randint(-1, 2, size=(n_envs, n_players, 3), dtype=np.int64)
    # warmup
    for _ in range(10):
        env.physics_step(acts)
    t0 = time.perf_counter()
    for _ in range(ticks):
        env.physics_step(acts)
    dt = time.perf_counter() - t0
    sps = n_envs * ticks / dt
    print(
        f"{n_red}v{n_blue} | {n_envs:>5} envs | engine physics_step (marshalled): "
        f"{sps / 1e6:6.2f}M env-steps/s"
    )


if __name__ == "__main__":
    print("=== raw sim throughput (no Python in loop) ===")
    for ne in (256, 1024, 4096):
        bench(ne, 1, 1)
    for ne in (256, 1024, 4096):
        bench(ne, 3, 3)
    print("\n=== full env.step throughput (with obs/reward/done numpy I/O) ===")
    bench_full_step(1024, 1, 1)
    bench_full_step(1024, 3, 3)
    print("\nReference: Ursinaxball single env runs at low thousands of SPS (one game, Python+Ursina).")
