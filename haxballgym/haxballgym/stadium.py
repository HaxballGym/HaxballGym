"""Stadium (.hbs) loading. The parsing/geometry build lives in the Rust engine
(`haxball_core.VecEnv.from_hbs`); this just resolves a name to its `.hbs` text.
Bundled maps ship under `haxballgym/stadiums/`; or pass a path to any `.hbs`.

The named maps are Haxball's official default stadiums, exported verbatim from
node-haxball (the real engine) — so the geometry is exactly the game's. `futsal-classic`
is the one extra non-default (custom) map kept for convenience.
"""

from __future__ import annotations

import importlib.resources as resources
from pathlib import Path

# Official Haxball default stadiums (from node-haxball) + the custom futsal map.
BUNDLED = (
    "classic",
    "easy",
    "small",
    "big",
    "big-easy",
    "rounded",
    "big-rounded",
    "hockey",
    "big-hockey",
    "huge",
    "futsal-classic",
)


def stadium_text(name_or_path: str) -> str:
    """Return the raw `.hbs` JSON for a bundled map name or a filesystem path."""
    p = Path(name_or_path)
    if p.suffix == ".hbs" and p.exists():
        return p.read_text()
    key = name_or_path[:-4] if name_or_path.endswith(".hbs") else name_or_path
    if key in BUNDLED:
        return (resources.files("haxballgym.stadiums") / f"{key}.hbs").read_text()
    raise ValueError(f"unknown stadium {name_or_path!r}; bundled maps: {list(BUNDLED)}, or pass a .hbs path")
