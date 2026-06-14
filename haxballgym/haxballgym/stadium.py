"""Stadium (.hbs) loading. The parsing/geometry build lives in the Rust engine
(`haxball_core.VecEnv.from_hbs`); this just resolves a name to its `.hbs` text.
Bundled maps ship under `haxballgym/stadiums/`; or pass a path to any `.hbs`.
"""

from __future__ import annotations

import importlib.resources as resources
from pathlib import Path

BUNDLED = ("classic", "futsal-classic", "big", "rounded")


def stadium_text(name_or_path: str) -> str:
    """Return the raw `.hbs` JSON for a bundled map name or a filesystem path."""
    p = Path(name_or_path)
    if p.suffix == ".hbs" and p.exists():
        return p.read_text()
    key = name_or_path[:-4] if name_or_path.endswith(".hbs") else name_or_path
    if key in BUNDLED:
        return (resources.files("haxballgym.stadiums") / f"{key}.hbs").read_text()
    raise ValueError(f"unknown stadium {name_or_path!r}; bundled maps: {list(BUNDLED)}, or pass a .hbs path")
