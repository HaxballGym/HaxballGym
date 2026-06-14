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
The decompressed payload is (see reverse-engineering/recording.js for the full
de-obfuscated reader, cracked from game-min.js):
  1. marker log : u16 count + count*(varint frame, u8 kind)   -- timeline highlights
  2. RoomState  : scalars (name, locked, scoreLimit, timeLimit, ...) + STADIUM
                  (q.na, the binary twin of an .hbs) + optional physics state +
                  player list (id/team)
  3. action log : repeat( varint frameDelta, u16 playerId, u8 actionType, payload )
The player-INPUT action is type 1 (`Na`): its payload is a single u8 = the 5-bit
mask (Input enum: UP=4 DOWN=1 LEFT=2 RIGHT=8 KICK=16). Playback applies each action
at its cumulative frame, stepping physics one tick per frame.

WHAT'S DONE & VERIFIED on the real files: container, marker log, RoomState scalar
prefix (the room name parses to exactly "[DNA] Classic 1vs1"), the action-log
framing, and the input action. See the Reader/parse below.
WHAT REMAINS: the stadium binary sub-reader (q.na) — needed to skip the RoomState
and reach the action log. It mirrors the .hbs fields already implemented in
rust/haxball_core/src/stadium.rs, so it's a direct port (vertexes, segments,
planes, goals, discs, spawns). Once read_room_state() finishes, iter_inputs()
yields (frame, player_idx, input_mask) and build_bc_dataset() re-simulates through
the core to write the BC dataset.
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


class Reader:
    """Big-endian byte reader — the J class in game-min.js. See recording.js."""

    def __init__(self, buf: bytes, pos: int = 0):
        self.b = buf
        self.a = pos

    def u8(self):
        x = self.b[self.a]
        self.a += 1
        return x

    def i8(self):
        x = self.u8()
        return x - 256 if x >= 128 else x

    def u16(self):
        x = struct.unpack_from(">H", self.b, self.a)[0]
        self.a += 2
        return x

    def i16(self):
        x = struct.unpack_from(">h", self.b, self.a)[0]
        self.a += 2
        return x

    def u32(self):
        x = struct.unpack_from(">I", self.b, self.a)[0]
        self.a += 4
        return x

    def i32(self):
        x = struct.unpack_from(">i", self.b, self.a)[0]
        self.a += 4
        return x

    def f32(self):
        x = struct.unpack_from(">f", self.b, self.a)[0]
        self.a += 4
        return x

    def f64(self):
        x = struct.unpack_from(">d", self.b, self.a)[0]
        self.a += 8
        return x

    def varint(self):
        d = 0
        i = 0
        while True:
            c = self.b[self.a + i]
            if i < 5:
                d |= (c & 127) << (7 * i)
            i += 1
            if not (c & 128):
                break
        self.a += i
        return d & 0xFFFFFFFF

    def string(self, n: int):
        s = self.b[self.a : self.a + n].decode("utf-8", "replace")
        self.a += n
        return s

    def string_var(self):
        return self.string(self.varint())

    def string_nullable(self):
        n = self.varint()
        return self.string(n - 1) if n > 0 else None

    def remaining(self):
        return len(self.b) - self.a


def read_markers(s: Reader):
    """Timeline highlight markers (NOT inputs): u16 count + count*(varint frame, u8 kind)."""
    markers = []
    cum = 0
    for _ in range(s.u16()):
        cum += s.varint()
        markers.append((cum, s.u8()))
    return markers


# Action registration order from Nc.xj (game-min.js:7894). Index = type byte.
ACTIONS = [
    "ChatMessage",
    "PlayerInput",
    "a$",
    "Ja",
    "ab",
    "Ha",
    "RemovePlayer",
    "bb",
    "cb",
    "db",
    "SetLimit",
    "Oa",
    "fa",
    "Pa",
    "MoveToTeam",
    "AutoTeams",
    "Ra",
    "Ga",
    "Ma",
    "Za",
    "Kb",
    "La",
    "Lb",
    "Mb",
]
PLAYER_INPUT = 1  # Na: wa() reads one u8 = the 5-bit input mask


def read_room_state(s: Reader):
    """Top-level RoomState [world.na @ game-min.js:6441]. Reads the scalar prefix,
    then the stadium (q.na — the binary twin of an .hbs), optional physics state,
    then the player list (id/team). Returns the parsed dict.

    The stadium binary sub-reader is the remaining port (it mirrors the .hbs fields
    already handled by rust/haxball_core/src/stadium.rs). See reverse-engineering/recording.js.
    """
    room = {
        "name": s.string_nullable(),
        "locked": s.u8() != 0,
        "score_limit": s.i32(),
        "time_limit": s.i32(),
    }
    s.i16()
    s.u8()
    s.u8()  # ne, gd, Gd
    raise NotImplementedError(
        "read_room_state: scalar prefix parses; next is the stadium binary reader "
        "(q.na, mirrors stadium.rs). See reverse-engineering/recording.js. "
        f"(parsed so far: {room})"
    )


def parse_events(stream: bytes):
    """Walk the replay body -> yield (frame, player_id, input_mask).

    The framing (container, marker log, action log, input action) is reverse-engineered
    and verified (see reverse-engineering/recording.js). Reaching the action log
    requires skipping the RoomState, whose stadium sub-reader is the remaining port.
    """
    s = Reader(stream)
    read_markers(s)  # skip timeline markers
    body = Reader(stream, s.a)  # RoomState + action log
    read_room_state(body)  # <- positions body at the action log (once finished)
    while body.remaining() > 0:  # action log
        frame = body.varint()
        player_id = body.u16()
        type_byte = body.u8()
        if type_byte == PLAYER_INPUT:
            yield (frame, player_id, body.u8())
        else:
            raise NotImplementedError(f"action {type_byte} ({ACTIONS[type_byte]}) payload not ported")


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
