"""One command: export a checkpoint and host a Haxball room with it.

    HEADLESS_TOKEN=<token> uv run headless-bot/play.py path/to/model.pt
    HEADLESS_TOKEN=<token> uv run headless-bot/play.py my_run --stadium big

Equivalent to running `export_policy.py` then `node bot.js`, but in a single step — point it
at any checkpoint (a `.pt`, or a run-dir name under `checkpoints/`) and it hosts a private room
you can join from the official client. Get a token at https://www.haxball.com/headlesstoken.
"""

import argparse
import subprocess
import sys
from pathlib import Path

import export_policy

HERE = Path(__file__).parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ckpt", nargs="?", default=None, help="a .pt file or a checkpoints/<run> name")
    ap.add_argument("--stadium", default=None, help="override the map (else the checkpoint's)")
    args = ap.parse_args()

    # 1. export the policy to policy.json (reuse export_policy's CLI)
    sys.argv = ["export_policy", *([args.ckpt] if args.ckpt else [])]
    if args.stadium:
        sys.argv += ["--stadium", args.stadium]
    export_policy.main()

    # 2. host the room (install node deps once, then launch the loader)
    if not (HERE / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=HERE, check=True)
    subprocess.run(["node", "bot.js"], cwd=HERE, check=True)


if __name__ == "__main__":
    main()
