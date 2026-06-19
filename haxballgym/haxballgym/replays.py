"""Read Haxball `.hbr2` replays into per-frame player inputs.

It exists for **behavioral cloning**: turning human replays into `(observation,
action)` pairs that pre-train the policy to play like a human, which PPO then
finetunes (the Necto recipe). Verified end to end: `iter_inputs()` parses all 21,394
replays of a 1v1 dataset to the exact end of the buffer, ~400-1100 input changes per
player per game, every mask in 0..31.

The format, top to bottom
─────────────────────────
A `.hbr2` file is a small header followed by a DEFLATE-compressed body:

    "HBR2"          4 bytes, magic
    version         uint32   (3 for this dataset)
    frameCount      uint32   (total simulation frames)
    body            raw DEFLATE  ->  inflate to get everything below

All multi-byte numbers are BIG-ENDIAN. The inflated body has three parts:

  1. marker log   — highlights for the seek bar (goal markers). Not gameplay.
  2. room state   — one snapshot of the room when recording began: settings, the
                    stadium, and who is playing on which team.
  3. action log   — the game itself: a stream of timed "actions". One action type
                    (PlayerInput, type 3) is a player pressing/releasing keys.

Replaying = walk the action log, apply each action on its frame, step physics one
tick per frame. To clone the humans we pull the PlayerInput actions out of the log.
"""

import struct
import zipfile
import zlib

# Movement/kick mask: the low 5 bits of a PlayerInput action. These are Haxball's
# canonical key bits (verified by re-simulating replays: a player only reaches the
# ball with this mapping). `dy` uses up=+1 because our core's y points up (the .hbs
# loader flips Haxball's screen-down y), so pressing "up" should increase y.
UP, DOWN, LEFT, RIGHT, KICK = 1, 2, 4, 8, 16


def input_mask_to_bins(mask: int) -> list[int]:
    """Map a 5-bit Haxball input mask -> our (dx, dy, kick) action bins {0,1,2},{0,1,2},{0,1}."""
    dx = (1 if mask & RIGHT else 0) - (1 if mask & LEFT else 0)
    dy = (1 if mask & UP else 0) - (1 if mask & DOWN else 0)
    return [dx + 1, dy + 1, 1 if mask & KICK else 0]


# ── Byte reader ──────────────────────────────────────────────────────────────
# A cursor over the inflated body; every read advances it.            game-min.js: J
class Reader:
    def __init__(self, data: bytes, pos: int = 0):
        self.data = data
        self.pos = pos

    def _scalar(self, fmt: str, size: int):
        value = struct.unpack_from(fmt, self.data, self.pos)[0]
        self.pos += size
        return value

    # fmt: off
    def u8(self):  return self._scalar(">B", 1)
    def i8(self):  return self._scalar(">b", 1)
    def u16(self): return self._scalar(">H", 2)
    def i16(self): return self._scalar(">h", 2)
    def u32(self): return self._scalar(">I", 4)
    def i32(self): return self._scalar(">i", 4)
    def f32(self): return self._scalar(">f", 4)
    def f64(self): return self._scalar(">d", 8)
    # fmt: on

    def varint(self) -> int:
        """7 bits per byte, high bit means 'more bytes follow'.        game-min.js: Bb"""
        value = shift = 0
        while True:
            byte = self.data[self.pos]
            self.pos += 1
            if shift < 35:
                value |= (byte & 0x7F) << shift
            shift += 7
            if not (byte & 0x80):
                return value & 0xFFFFFFFF

    def string(self, n: int) -> str:
        text = self.data[self.pos : self.pos + n].decode("utf-8", "replace")
        self.pos += n
        return text

    def string_var(self) -> str:  # length-prefixed string            game-min.js: kc
        return self.string(self.varint())

    def string_or_none(self):  # nullable string                      game-min.js: Ab
        n = self.varint()
        return self.string(n - 1) if n > 0 else None

    def bytes_left(self) -> int:
        return len(self.data) - self.pos


# ── Container ────────────────────────────────────────────────────────────────
def decode_container(raw: bytes):
    """Validate the header and inflate the body. Returns (body, version, frame_count)."""
    assert raw[:4] == b"HBR2", "not an HBR2 file"
    version = struct.unpack_from(">I", raw, 4)[0]
    frame_count = struct.unpack_from(">I", raw, 8)[0]
    body = zlib.decompress(raw[12:], -15)  # raw DEFLATE
    return body, version, frame_count


def iter_replays(zip_path: str):
    """Yield (name, body, version, frame_count) for every `.hbr2` in a zip."""
    archive = zipfile.ZipFile(zip_path)
    for name in archive.namelist():
        if not name.lower().endswith(".hbr2"):
            continue
        try:
            body, version, frame_count = decode_container(archive.read(name))
        except Exception:
            continue
        yield name, body, version, frame_count


# ── Top-level parse ──────────────────────────────────────────────────────────
def parse_replay(body: bytes):
    """Parse an inflated body into {room, inputs}, where inputs is a list of
    (frame, player_session_id, mask)."""
    r = Reader(body)
    read_marker_log(r)
    room = read_room_state(r)
    inputs = read_action_log(r)
    return {"room": room, "inputs": inputs}


def iter_inputs(body: bytes):
    """Yield (frame, player_session_id, input_mask) for every input change in a replay.
    `player_session_id` matches a player's `session` from read_room_state() -> team."""
    r = Reader(body)
    read_marker_log(r)
    read_room_state(r)
    frame = 0
    while r.bytes_left() > 0:
        frame += r.varint()
        player_id = r.u16()
        mask = read_action(r)
        if mask is not None:
            yield frame, player_id, mask & 0x1F


def iter_chat(body: bytes):
    """Yield (frame, author_session_id, text) for every ChatMessage and Announcement.

    Chat is part of the replay; the DNA ladder's ranking bot prints each match's ELO
    here ("Versus history: … [elo: A - B]"), which is how we filter replays by skill.
    Peeks the action type and delegates every non-text action to `read_action`."""
    r = Reader(body)
    read_marker_log(r)
    read_room_state(r)
    frame = 0
    while r.bytes_left() > 0:
        frame += r.varint()
        author = r.u16()
        kind = r.data[r.pos]  # peek the type byte (read_action would consume it)
        if kind == 0:  # ChatMessage: text, color, style, weight
            r.u8()
            text = r.string_var()
            r.i32()
            r.u8()
            r.u8()
            yield frame, author, text
        elif kind == 4:  # Announcement: text
            r.u8()
            yield frame, author, r.string_var()
        else:
            read_action(r)


def read_marker_log(r: Reader):
    """Seek-bar highlights: a count, then (cumulative-frame, kind) pairs.  game-min.js: $b.mr

    Returns the list of (frame, kind) — mostly goal highlights, handy as a ground-truth
    timeline of when goals happened for validating a re-simulation."""
    frame = 0
    markers = []
    for _ in range(r.u16()):
        frame += r.varint()
        markers.append((frame, r.u8()))  # (cumulative frame, marker kind)
    return markers


def read_action_log(r: Reader):
    """The rest of the body: timed actions. Keep only the player inputs.  game-min.js: $b.dm"""
    inputs = []
    frame = 0
    while r.bytes_left() > 0:
        frame += r.varint()  # frame delta
        player_id = r.u16()
        mask = read_action(r)
        if mask is not None:
            inputs.append((frame, player_id, mask & 0x1F))
    return inputs


# ── Room state ───────────────────────────────────────────────────────────────
# Each reader returns a named record so the field names document the binary layout.
# A list is a u8 count followed by that many items.
def read_list(r: Reader, read_item):
    return [read_item(r) for _ in range(r.u8())]


def read_room_state(r: Reader):
    """One snapshot of the room when recording began.                  game-min.js: world.na (6441)

    Read in full so the cursor lands exactly on the action log, and so we learn which
    player session is on which team."""
    room = {
        "name": r.string_or_none(),
        "locked": r.u8() != 0,
        "score_limit": r.i32(),
        "time_limit": r.i32(),
    }
    # kickRateLimit, as the room stored it (game-min.js room-state order): burst cap,
    # burst cost, then min (= Haxball's setKickRateLimit min/rate/burst → ne, gd, Gd).
    room["kick_rate_cap"] = r.i16()
    room["kick_rate_cost"] = r.u8()
    room["kick_rate_min"] = r.u8()
    room["stadium"] = read_stadium(r)
    room["in_progress"] = r.u8() != 0
    # When a match is live, its physics snapshot (ball + every disc) precedes the
    # player list. We keep it so a re-simulation can be *seeded* from the recorded
    # state instead of the kickoff (via ReplayStateMutator).
    room["physics"] = read_physics_state(r) if room["in_progress"] else None
    room["players"] = read_list(r, read_player)
    read_team_state(r)  # red
    read_team_state(r)  # blue
    return room


def read_player(r: Reader):  # game-min.js: wa.wa (8408) — we only need session + team
    r.u8()  # admin flag
    numeric_id = r.i32()
    name = r.string_or_none()
    r.string_or_none()  # (unused)
    r.u8()
    country = r.string_or_none()
    r.i32()
    avatar = r.string_or_none()
    r.i32()
    session = r.varint()  # the id the action log refers to
    r.u8()
    r.i16()
    r.u8()
    team = r.i8()  # 1 = red, 2 = blue, anything else = spectator
    disc_index = r.i16()  # index of this player's disc in the physics snapshot (-1 if none)
    return {
        "numeric_id": numeric_id,
        "session": session,
        "name": name,
        "country": country,
        "avatar": avatar,
        "team": team,
        "disc_index": disc_index,
    }


def read_team_state(r: Reader):  # game-min.js: xa.na — kind, color, then a list of ids
    r.u8()
    r.i32()
    read_list(r, lambda x: x.i32())


def read_physics_state(r: Reader):  # game-min.js: aa.na — live snapshot, only present mid-match
    discs = read_list(r, read_disc)  # ball + player discs
    for _ in range(4):  # game-state counters
        r.i32()
    r.f64()
    r.i32()
    r.i8()
    return discs


# ── Stadium ──────────────────────────────────────────────────────────────────
def read_stadium(r: Reader):
    """One tag byte: 255 = a full custom stadium follows; else a built-in map index.
    game-min.js: q.na (5398). Built-ins: 0 Classic, 1 Easy, 2 Small, 3 Big, 4 Rounded, ..."""
    tag = r.u8()
    if tag != 255:
        return {"builtin": tag}
    return read_custom_stadium(r)


def read_custom_stadium(r: Reader):  # game-min.js: q.ys (4655) — the binary twin of an .hbs
    stadium = {"name": r.string_or_none()}
    r.i32()  # background type
    for _ in range(5):  # camera bounds, spawn distance, kickoff radius
        r.f64()
    r.i32()  # background color
    stadium["width"] = r.f64()
    stadium["height"] = r.f64()
    r.f64()  # max view height
    read_default_physics(r)
    r.u16()  # three more flags
    r.u8()
    r.u8()
    r.u8()
    stadium["vertexes"] = read_list(r, read_vertex)
    stadium["segments"] = read_list(r, read_segment)
    stadium["planes"] = read_list(r, read_plane)
    stadium["goals"] = read_list(r, read_goal)
    stadium["discs"] = read_list(r, read_disc)
    stadium["joints"] = read_list(r, read_joint)
    stadium["red_spawns"] = read_list(r, read_point)
    stadium["blue_spawns"] = read_list(r, read_point)
    return stadium


def read_point(r: Reader):
    return {"x": r.f64(), "y": r.f64()}


def read_vertex(r: Reader):  # game-min.js: G.na
    return {"x": r.f64(), "y": r.f64(), "bcoef": r.f64(), "cgroup": r.i32(), "cmask": r.i32()}


def read_plane(r: Reader):  # game-min.js: S.na — an infinite wall (normal + distance)
    return {
        "normal_x": r.f64(),
        "normal_y": r.f64(),
        "dist": r.f64(),
        "bcoef": r.f64(),
        "cgroup": r.i32(),
        "cmask": r.i32(),
    }


def read_goal(r: Reader):  # game-min.js: lb.na — a goal line between two points
    return {"x0": r.f64(), "y0": r.f64(), "x1": r.f64(), "y1": r.f64(), "team": r.i8()}


def read_joint(r: Reader):  # game-min.js: Ab.na — a joint between two discs
    return {
        "disc_a": r.u8(),
        "disc_b": r.u8(),
        "length": r.f64(),
        "strength": r.f64(),
        "d": r.f64(),
        "color": r.i32(),
    }


def read_disc(r: Reader):  # game-min.js: ya.na / ta.na
    return {
        "x": r.f64(),
        "y": r.f64(),
        "vx": r.f64(),
        "vy": r.f64(),
        "gravity_x": r.f64(),
        "gravity_y": r.f64(),
        "radius": r.f64(),
        "bcoef": r.f64(),
        "inv_mass": r.f64(),
        "damping": r.f64(),
        "color": r.u32(),
        "cgroup": r.i32(),
        "cmask": r.i32(),
    }


def read_segment(r: Reader):  # game-min.js: I.na — variable length; a flags byte gates fields
    flags = r.u8()
    seg = {"v0": r.u8(), "v1": r.u8()}
    if flags & 1:
        seg["curve"] = r.f64()
    if flags & 2:
        seg["bias"] = r.f64()
    if flags & 4:
        seg["color"] = r.i32()
    seg["visible"] = bool(flags & 8)
    seg["bcoef"] = r.f64()
    seg["cgroup"] = r.i32()
    seg["cmask"] = r.i32()
    return seg


def read_default_physics(r: Reader):  # game-min.js: Sb.na — defaults new discs inherit
    return {
        "radius": r.f64(),
        "bcoef": r.f64(),
        "inv_mass": r.f64(),
        "damping": r.f64(),
        "kick_strength": r.f64(),
        "kickback": r.f64(),
        "kick_back_coef": r.f64(),
        "gravity_x": r.f64(),
        "gravity_y": r.f64(),
        "color": r.i32(),
        "p": r.f64(),
        "q": r.f64(),
    }


# ── Actions ──────────────────────────────────────────────────────────────────
# The 24 action types, in registration order — the index IS the type byte.
ACTION_NAMES = [
    "ChatMessage",
    "AdminAction",
    "OpaqueBlob",
    "PlayerInput",
    "Announcement",
    "JoinPlayer",
    "RemovePlayer",
    "StartGame",
    "StopGame",
    "PauseGame",
    "SetLimits",
    "SetStadium",
    "MoveToTeam",
    "SetTeamLock",
    "Action14",
    "AutoTeams",
    "Action16",
    "Action17",
    "SetAvatar",
    "SetTeamColors",
    "Action20",
    "SetKickRate",
    "Action22",
    "DiscSync",
]
PLAYER_INPUT = 3  # the input action: a u32 whose low 5 bits are the move/kick mask


def read_action(r: Reader):
    """Read past one action's payload; return the input mask for PlayerInput, else None.
    game-min.js: the per-class `.wa` methods (9790+)."""
    t = r.u8()
    match t:
        case 3:  # PlayerInput — a u32; only the low 5 bits (the key mask) matter
            return r.u32()
        case 0:  # ChatMessage: text, color, style, weight
            r.string_var()
            r.i32()
            r.u8()
            r.u8()
        case 1:  # AdminAction: one byte
            r.u8()
        case 2:  # OpaqueBlob: a length then that many bytes
            r.string_var()
        case 4:  # Announcement: text
            r.string_var()
        case 5:  # JoinPlayer: id + three names
            r.i32()
            r.string_or_none()
            r.string_or_none()
            r.string_or_none()
        case 6:  # RemovePlayer: id + reason + ban flag
            r.i32()
            r.string_or_none()
            r.u8()
        case 7 | 8 | 15:  # StartGame / StopGame / AutoTeams — no payload
            pass
        case 9 | 13 | 16:  # PauseGame / SetTeamLock / Action16 — one boolean
            r.u8()
        case 10:  # SetLimits: score limit + time limit
            r.i32()
            r.i32()
        case 11:  # SetStadium: a uint16-length blob
            r.pos += r.u16()
        case 12:  # MoveToTeam: player id + team
            r.i32()
            r.i8()
        case 14:  # Action14: id + flag
            r.i32()
            r.u8()
        case 17:  # Action17: a list of var-ints
            for _ in range(r.varint()):
                r.varint()
        case 18:  # SetAvatar
            r.string_or_none()
        case 19:  # SetTeamColors: team + a team-state record
            r.i8()
            read_team_state(r)
        case 20:  # Action20: flag + a list of ints
            r.u8()
            for _ in range(r.u8()):
                r.i32()
        case 21:  # SetKickRate: min, rate, burst
            r.i32()
            r.i32()
            r.i32()
        case 22:  # Action22
            r.string_or_none()
            r.i32()
        case 23:  # DiscSync: a disc id, a flag, then a bitmask of which fields changed
            r.i32()
            r.u8()
            changed = r.u16()
            for _ in range(10):  # position / velocity / ... as f32
                if changed & 1:
                    r.f32()
                changed >>= 1
            for _ in range(3):  # color / collision groups as i32
                if changed & 1:
                    r.i32()
                changed >>= 1
        case _:
            raise ValueError(f"unknown action type {t}")
    return None


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        raise SystemExit("usage: python -m haxballgym.replays <replays.zip>")
    games = inputs = 0
    for _name, body, _version, _frames in iter_replays(sys.argv[1]):
        inputs += sum(1 for _ in iter_inputs(body))
        games += 1
        if games >= 200:
            break
    print(f"parsed {games} replays, {inputs} input changes ({inputs // max(games, 1)}/game)")
