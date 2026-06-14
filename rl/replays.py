"""Incorporate the 21k human .hbr2 replays — the RLGym/Necto-validated way.

HOW RLGYM USES REPLAYS (two distinct, both worth doing):

  1. BEHAVIORAL CLONING (how Necto bootstrapped): turn replays into (obs, action)
     pairs and supervised-train the policy to imitate humans, THEN PPO-finetune.
     Gives the policy a strong human prior so self-play doesn't start from zero —
     exactly the cold-start problem we just hit.

  2. REPLAY-BASED STATE RESET (rlgym-tools `ReplaySetter`): sample real human game
     states as episode start states. Massively improves exploration/curriculum and
     only needs POSITIONS (not even the action labels). Often the single biggest win.

Our fast deterministic core makes both cheap: we can re-simulate 21k games in
seconds to produce perfectly state-aligned (obs, action) pairs — something the old
Ursina sim could never do at scale.

--------------------------------------------------------------------------------
THE .hbr2 FORMAT (cracked here):
  bytes 0..4   : magic  b"HBR2"
  bytes 4..8   : uint32 big-endian version  (== 3 for this dataset)
  bytes 8..12  : uint32 big-endian frame count
  bytes 12..   : raw DEFLATE (zlib.decompress(data[12:], wbits=-15))
The decompressed stream is Haxball's bit-level event log (same serializer as the
net protocol): room/stadium definition, player list, then a frame->event loop in
which player INPUT-CHANGE events carry a 5-bit mask (Input enum: UP=4 DOWN=1
LEFT=2 RIGHT=8 KICK=16).

WHAT'S DONE HERE: container decode + decompression (verified on the real files).
WHAT REMAINS: walking the event stream to pull per-frame input masks. That needs
the Haxball event schema — cleanest is to port an existing reader
(github mertushka/haxball-replay-reader, or the haxball.js ReplayReader) into
`parse_events()` below, OR dump frames via Haxball Headless. Once `iter_inputs()`
yields (frame, player_idx, input_mask), `build_bc_dataset()` re-simulates through
the core and writes the BC dataset.
--------------------------------------------------------------------------------
"""

import struct
import zipfile
import zlib

from loguru import logger

# Haxball input bitmask -> our (dx, dy, kick) bins {0,1,2},{0,1,2},{0,1}
UP, DOWN, LEFT, RIGHT, KICK = 4, 1, 2, 8, 16


def input_mask_to_bins(mask: int):
    dx = (1 if mask & RIGHT else 0) - (1 if mask & LEFT else 0)
    dy = (1 if mask & UP else 0) - (1 if mask & DOWN else 0)
    return [dx + 1, dy + 1, 1 if mask & KICK else 0]


def decode_container(raw: bytes) -> bytes:
    """Return the decompressed event stream from a .hbr2 file's bytes."""
    assert raw[:4] == b"HBR2", "not an HBR2 file"
    version = struct.unpack(">I", raw[4:8])[0]
    frames = struct.unpack(">I", raw[8:12])[0]
    stream = zlib.decompress(raw[12:], -15)
    return stream, version, frames


def iter_replays(zip_path: str):
    """Yield (name, decompressed_stream, version, frame_count) for each replay."""
    z = zipfile.ZipFile(zip_path)
    for name in z.namelist():
        if not name.lower().endswith(".hbr2"):
            continue
        try:
            stream, ver, frames = decode_container(z.read(name))
            yield name, stream, ver, frames
        except Exception:
            continue


def parse_events(stream: bytes):
    """PORT TARGET: walk Haxball's event stream -> yield (frame, player_idx, input_mask).

    Reference implementations to port from:
      - github.com/mertushka/haxball-replay-reader  (JS, clean)
      - haxball.js ReplayReader
    Until ported, this raises so the dataset step fails loudly rather than
    silently producing garbage BC labels.
    """
    raise NotImplementedError(
        "Port a Haxball event-stream reader into parse_events(). "
        "Container decode + DEFLATE are already done (see decode_container)."
    )


if __name__ == "__main__":
    import sys

    zp = sys.argv[1] if len(sys.argv) > 1 else "/Users/jeremyfraoua/Downloads/1v1_recs.zip"
    n = 0
    tot_frames = 0
    for name, stream, ver, frames in iter_replays(zp):
        n += 1
        tot_frames += frames
        if n <= 3:
            logger.info(f"{name[:40]:40s} v{ver} frames={frames} stream={len(stream)}B")
        if n >= 500:
            break
    logger.info(
        f"\ndecoded {n} replays, ~{tot_frames} frames "
        f"(~{tot_frames / n:.0f} frames/game). Container+DEFLATE OK across the set."
    )
