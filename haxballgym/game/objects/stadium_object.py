from typing import List
from haxballgym.game.objects.base import Vertex, Segment, Plane, Disc, Goal, Trait, PlayerPhysics, BallPhysics
import json
import importlib.resources as pkg_resources

from haxballgym.game import stadiums

class Stadium(object):
    """
    A class to represent the state of a stadium from the game.
    """

    def __init__(self, data: dict):

        self.name: str = data.get('name')
        self.spawn_distance: float = data.get('spawnDistance')
        self.kickoff_reset: str = data.get('kickoffReset')
        
        traits = data.get('traits')
        traits_name = [t for t in traits]
        traits_data = [traits.get(t) for t in traits_name]
        self.traits: List[Trait] = [Trait(v, k) for v, k in zip(traits_data, traits_name)]
        
        self.vertices: List[Vertex] = [Vertex(v, data) for v in data.get('vertexes')]
        self.segments: List[Segment] = [Segment(s, data) for s in data.get('segments')]
        self.goals: List[Goal] = [Goal(g, data) for g in data.get('goals')]
        self.discs: List[Disc] = [Disc(d, data) for d in data.get('discs')]
        self.planes: List[Plane] = [Plane(p, data) for p in data.get('planes')]
        self.player_physics: PlayerPhysics = PlayerPhysics(data.get('playerPhysics'), data)
        self.ball_physics: BallPhysics = BallPhysics(data.get('ballPhysics'), data)
        
        self.discs.insert(0, self.ball_physics)
        
        self.apply_default_values()
        
    def apply_default_values(self):
        """
        Apply default values to the stadium.
        """
        if self.kickoff_reset is None:
            self.kickoff_reset = "partial"


def load_stadium_hbs(file_name: str) -> Stadium:
    """
    Load a stadium from a file with extension hbs.
    """
    if file_name.endswith(".hbs"):
        with pkg_resources.open_text(stadiums, file_name) as f:
            data = json.load(f)
        return Stadium(data)
    
    else:
        raise ValueError("File name must end with .hbs")

if __name__ == "__main__":
    stadium = load_stadium_hbs("classic.hbs")
    print(stadium.name)
