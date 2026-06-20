"""haxballgym — a composable, batched RLGym-v2-style env over the headless
`haxball_core` engine. See docs/design-docs/env-api.md.

Quick start:

    from haxballgym import make_default_env
    env = make_default_env(n_envs=512)
    obs = env.reset()
    obs, rewards, terminated, truncated = env.step(actions)

Or compose your own from the pieces (engine + obs/action/reward/done/mutator).
"""

__version__ = "1.0.1"

from .action import ActionParser, DiscreteAction
from .done import DoneCondition, GoalCondition, TimeoutCondition
from .engine import TransitionEngine
from .env import Env, make_default_env
from .mutator import (
    FixedStateMutator,
    KickoffMutator,
    MultiSetter,
    RandomStateMutator,
    ReplayStateMutator,
    ScenarioMutator,
    StateMutator,
    StateSetterMutator,
)
from .obs import DefaultObs, GeoObs, ObsBuilder, PredictObs, SharedObs
from .reward import (
    AlignBallGoal,
    BallOnOpponentHalf,
    BallToGoalPotential,
    BreakawayReward,
    CombinedReward,
    CrowdingPenalty,
    CurriculumReward,
    DistanceWeightedAlignment,
    GoalReward,
    LiuDistanceBallToGoal,
    LiuDistancePlayerToBall,
    PossessionReward,
    PowerShotReward,
    RewardFunction,
    TeammateSpacingReward,
    TeamPossessionReward,
    TeamSpiritReward,
    TouchReward,
    TouchVelocityToGoal,
    VelocityBallToGoal,
    VelocityPlayerToBall,
)
from .stadium import BUNDLED, stadium_text
from .state import BLUE, RED, GameState, closest_on_line

__all__ = [
    "__version__",
    "Env",
    "make_default_env",
    "TransitionEngine",
    "GameState",
    "RED",
    "BLUE",
    "closest_on_line",
    "ObsBuilder",
    "DefaultObs",
    "PredictObs",
    "SharedObs",
    "GeoObs",
    "ActionParser",
    "DiscreteAction",
    "RewardFunction",
    "CombinedReward",
    "CurriculumReward",
    "VelocityPlayerToBall",
    "VelocityBallToGoal",
    "GoalReward",
    "TouchReward",
    "PossessionReward",
    "TeammateSpacingReward",
    "TeamPossessionReward",
    "TeamSpiritReward",
    "CrowdingPenalty",
    "BallOnOpponentHalf",
    "BallToGoalPotential",
    "LiuDistanceBallToGoal",
    "LiuDistancePlayerToBall",
    "AlignBallGoal",
    "DistanceWeightedAlignment",
    "TouchVelocityToGoal",
    "PowerShotReward",
    "BreakawayReward",
    "DoneCondition",
    "GoalCondition",
    "TimeoutCondition",
    "StateMutator",
    "KickoffMutator",
    "StateSetterMutator",
    "RandomStateMutator",
    "FixedStateMutator",
    "MultiSetter",
    "ReplayStateMutator",
    "ScenarioMutator",
    "stadium_text",
    "BUNDLED",
]
