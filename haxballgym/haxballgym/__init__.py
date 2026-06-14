"""haxballgym — a composable, batched RLGym-v2-style env over the headless
`haxball_core` engine. See docs/design-docs/env-api.md.

Quick start:

    from haxballgym import make_default_env
    env = make_default_env(n_envs=512)
    obs = env.reset()
    obs, rewards, terminated, truncated = env.step(actions)

Or compose your own from the pieces (engine + obs/action/reward/done/mutator).
"""
from .action import ActionParser, DiscreteAction
from .done import DoneCondition, GoalCondition, TimeoutCondition
from .engine import TransitionEngine
from .env import Env, make_default_env
from .mutator import KickoffMutator, StateMutator
from .obs import DefaultObs, ObsBuilder
from .reward import (
    CombinedReward,
    GoalReward,
    RewardFunction,
    VelocityBallToGoal,
    VelocityPlayerToBall,
)
from .stadium import BUNDLED, stadium_text
from .state import BLUE, RED, GameState, closest_on_line

__all__ = [
    "Env", "make_default_env", "TransitionEngine", "GameState", "RED", "BLUE",
    "closest_on_line",
    "ObsBuilder", "DefaultObs",
    "ActionParser", "DiscreteAction",
    "RewardFunction", "CombinedReward", "VelocityPlayerToBall",
    "VelocityBallToGoal", "GoalReward",
    "DoneCondition", "GoalCondition", "TimeoutCondition",
    "StateMutator", "KickoffMutator",
    "stadium_text", "BUNDLED",
]
