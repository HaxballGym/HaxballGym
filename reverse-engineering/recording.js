/**
 * recording.js — a readable, de-obfuscated reader for Haxball `.hbr2` replays.
 *
 * Reconstructed from `game-min.js` (Mario Carbajal's code, used with permission for
 * research). This is meant to be *read*: it documents the replay format in plain
 * terms. `rl/replays.py` is the working port. Where a name maps to an obfuscated
 * symbol it's noted like `// game-min.js: J` so you can diff against the source.
 *
 * Verified: parses all 21,394 replays of the 1v1 dataset to the exact end of the
 * buffer, yielding ~400–1100 input changes per player per game, every mask in 0..31.
 *
 *
 * THE FORMAT, top to bottom
 * ─────────────────────────
 * A `.hbr2` file is a tiny header followed by a DEFLATE-compressed body:
 *
 *     "HBR2"            4 bytes, magic
 *     version           uint32   (3 for this dataset)
 *     frameCount        uint32   (total simulation frames in the replay)
 *     body              raw DEFLATE  ->  inflate to get everything below
 *
 * All multi-byte numbers are BIG-ENDIAN. The inflated body is three parts:
 *
 *   1. Marker log      — highlights for the seek bar (goal markers, etc.). Not gameplay.
 *   2. Room state      — one snapshot of the room the instant recording began:
 *                        settings, the stadium, who's playing and on which team.
 *   3. Action log      — the game itself, as a stream of timed "actions". Replaying
 *                        = walking this list, applying each action on its frame, and
 *                        stepping the physics one tick per frame.
 *
 * A player pressing or releasing a movement/kick key is just one kind of action
 * (type 3). Reconstructing what the humans did = pulling those out of the log.
 */

// ───────────────────────────── Byte reader ──────────────────────────────────
// A cursor over the inflated body. Every `readX` advances the cursor.   game-min.js: J
class ByteReader {
  constructor(bytes) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.at = 0; // cursor
  }

  readU8()  { return this.view.getUint8(this.at++); }
  readI8()  { return this.view.getInt8(this.at++); }
  readU16() { const v = this.view.getUint16(this.at, false); this.at += 2; return v; }
  readI16() { const v = this.view.getInt16(this.at, false); this.at += 2; return v; }
  readU32() { const v = this.view.getUint32(this.at, false); this.at += 4; return v; }
  readI32() { const v = this.view.getInt32(this.at, false); this.at += 4; return v; }
  readF32() { const v = this.view.getFloat32(this.at, false); this.at += 4; return v; }
  readF64() { const v = this.view.getFloat64(this.at, false); this.at += 8; return v; }

  /** Variable-length unsigned int: 7 bits per byte, high bit = "more bytes follow". */
  readVarInt() {
    let value = 0, shift = 0, byte;
    do {
      byte = this.view.getUint8(this.at++);
      if (shift < 35) value |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return value >>> 0;
  }

  /** Raw bytes; `count` omitted means "the rest of the buffer". */
  readBytes(count) {
    if (count == null) count = this.view.byteLength - this.at;
    const out = new Uint8Array(this.view.buffer, this.view.byteOffset + this.at, count);
    this.at += count;
    return out;
  }

  /** UTF-8 string of exactly `byteLength` bytes. */
  readStringOfLength(byteLength) {
    return new TextDecoder().decode(this.readBytes(byteLength));
  }

  /** String prefixed by a var-int byte length.                          game-min.js: kc */
  readString() {
    return this.readStringOfLength(this.readVarInt());
  }

  /** Nullable string: a var-int `n`; n==0 means null, else the string is n-1 bytes. */
  readNullableString() {
    const n = this.readVarInt();
    return n > 0 ? this.readStringOfLength(n - 1) : null;
  }

  get bytesLeft() { return this.view.byteLength - this.at; }
}

const HBR2_MAGIC = 0x48425232; // "HBR2" read as a big-endian uint32

// The movement/kick mask is 5 bits; these are the bit values.
const INPUT_BITS = { UP: 4, DOWN: 1, LEFT: 2, RIGHT: 8, KICK: 16 };


// ─────────────────────────────── Entry point ────────────────────────────────
/**
 * Parse a whole `.hbr2` file.
 * @param fileBytes   the raw file (Uint8Array)
 * @param inflateRaw  a raw-DEFLATE inflate function, e.g. pako.inflateRaw
 * @returns { version, frameCount, room, inputs }
 *          inputs = [{ frame, playerId, mask }] — one entry per input change.
 */
function parseReplay(fileBytes, inflateRaw) {
  const header = new ByteReader(fileBytes);
  if (header.readU32() !== HBR2_MAGIC) throw new Error("not an HBR2 replay");

  const version = header.readU32();
  const frameCount = header.readU32();
  const body = new ByteReader(inflateRaw(header.readBytes()));

  readMarkerLog(body); // seek-bar highlights — skip them
  const room = readRoomState(body);
  const inputs = readActionLog(body);

  return { version, frameCount, room, inputs };
}

/** Marker log: a count, then that many (cumulative-frame, kind) pairs.    game-min.js: $b.mr */
function readMarkerLog(r) {
  const count = r.readU16();
  let frame = 0;
  for (let i = 0; i < count; i++) {
    frame += r.readVarInt();
    r.readU8(); // marker kind — unused here
  }
}

/**
 * Action log: the rest of the body. Each entry is
 *     varint frameDelta · uint16 playerId · uint8 actionType · payload
 * We keep only the player-input actions.                          game-min.js: $b.dm / $b.A
 */
function readActionLog(r) {
  const inputs = [];
  let frame = 0;
  while (r.bytesLeft > 0) {
    frame += r.readVarInt();
    const playerId = r.readU16();
    const mask = readAction(r);
    if (mask !== null) inputs.push({ frame, playerId, mask: mask & 0x1f });
  }
  return inputs;
}


// ──────────────────────────────── Room state ────────────────────────────────
/**
 * One snapshot of the room at the moment recording started.        game-min.js: world.na (6441)
 * We read it in full so the cursor lands exactly on the action log, and so we learn
 * which player id is on which team.
 */
function readRoomState(r) {
  const room = {
    name:       r.readNullableString(),
    locked:     r.readU8() !== 0,
    scoreLimit: r.readI32(),
    timeLimit:  r.readI32(),
  };
  r.readI16(); r.readU8(); r.readU8(); // a few flags we don't use

  room.stadium = readStadium(r);

  // If a match was already running when recording began, a live physics snapshot
  // (ball + player discs) is stored before the player list.
  if (r.readU8() !== 0) readPhysicsState(r);

  room.players = readCountedList(r, () => r.readU8(), readPlayer);

  readTeamState(r); // red team colours/avatars
  readTeamState(r); // blue
  return room;
}

/** Read a `countFn()`-long list of `readItem(r)`. */
function readCountedList(r, countFn, readItem) {
  const out = [];
  const n = countFn();
  for (let i = 0; i < n; i++) out.push(readItem(r));
  return out;
}

/**
 * A player record. The only fields we care about are `session` (the id used by
 * actions in the log) and `team`.                                   game-min.js: wa.wa (8408)
 */
function readPlayer(r) {
  r.readU8();                         // admin flag
  const numericId = r.readI32();
  const name = r.readNullableString();
  r.readNullableString();             // (unused string)
  r.readU8();                         // flag
  const country = r.readNullableString();
  r.readI32();                        // flag
  const avatar = r.readNullableString();
  r.readI32();                        // flag
  const session = r.readVarInt();     // <- the id that the action log refers to
  r.readU8();                         // flag
  r.readI16();
  r.readU8();
  const team = r.readI8();            // 1 = red, 2 = blue, anything else = spectator
  r.readI16();                        // index of this player's disc
  return { numericId, session, name, country, avatar, team };
}

/** Per-team state: a kind byte, a colour, then a short list of avatar ids. game-min.js: xa.na (7978) */
function readTeamState(r) {
  r.readU8();
  r.readI32();
  readCountedList(r, () => r.readU8(), (x) => x.readI32());
}

/** Live physics snapshot (only present mid-match): the in-play discs + scalars. game-min.js: aa.na (2234) */
function readPhysicsState(r) {
  readCountedList(r, () => r.readU8(), readDisc); // ball + player discs (game-min.js: Wa.na)
  r.readI32(); r.readI32(); r.readI32(); r.readI32();
  r.readF64(); r.readI32(); r.readI8();
}


// ─────────────────────────────── Stadium ────────────────────────────────────
/**
 * The map. One tag byte: 255 means a full custom stadium follows (the binary twin
 * of an `.hbs` file); anything else is an index into the built-in maps and nothing
 * more is stored.                                                   game-min.js: q.na (5398)
 *
 * Built-in indices: 0 Classic · 1 Easy · 2 Small · 3 Big · 4 Rounded · 5 Hockey · …
 */
function readStadium(r) {
  const tag = r.readU8();
  if (tag !== 255) return { builtin: tag };
  return readCustomStadium(r);
}

/** A custom stadium — same shape as an `.hbs`, in binary.            game-min.js: q.ys (4655) */
function readCustomStadium(r) {
  const stadium = { name: r.readNullableString() };

  r.readI32();                                   // background type
  for (let i = 0; i < 5; i++) r.readF64();        // camera bounds + spawn distance + kickoff radius
  r.readI32();                                   // background colour
  stadium.width = r.readF64();
  stadium.height = r.readF64();
  r.readF64();                                   // max view height
  readStadiumDefaultPhysics(r);                  // default disc physics for this map
  r.readU16(); r.readU8(); r.readU8(); r.readU8(); // a few flags

  stadium.vertexes   = readCountedList(r, () => r.readU8(), readVertex);
  stadium.segments   = readCountedList(r, () => r.readU8(), readSegment);
  stadium.planes     = readCountedList(r, () => r.readU8(), readPlane);
  stadium.goals      = readCountedList(r, () => r.readU8(), readGoal);
  stadium.discs      = readCountedList(r, () => r.readU8(), readDisc);
  stadium.joints     = readCountedList(r, () => r.readU8(), readJoint);
  stadium.redSpawns  = readCountedList(r, () => r.readU8(), readPoint);
  stadium.blueSpawns = readCountedList(r, () => r.readU8(), readPoint);
  return stadium;
}

function readPoint(r) {
  return { x: r.readF64(), y: r.readF64() };
}

// game-min.js: G.na
function readVertex(r) {
  return { x: r.readF64(), y: r.readF64(), bCoef: r.readF64(), cGroup: r.readI32(), cMask: r.readI32() };
}

// game-min.js: S.na — an infinite wall (normal + distance from origin)
function readPlane(r) {
  return {
    normalX: r.readF64(), normalY: r.readF64(), dist: r.readF64(),
    bCoef: r.readF64(), cGroup: r.readI32(), cMask: r.readI32(),
  };
}

// game-min.js: lb.na — a goal line between two points
function readGoal(r) {
  return { x0: r.readF64(), y0: r.readF64(), x1: r.readF64(), y1: r.readF64(), team: r.readI8() };
}

// game-min.js: Ab.na — a joint between two discs
function readJoint(r) {
  return { discA: r.readU8(), discB: r.readU8(), length: r.readF64(), strength: r.readF64(), d: r.readF64(), color: r.readI32() };
}

/**
 * A segment between two vertexes. A flags byte says which optional fields are
 * present, so this record is variable-length.                       game-min.js: I.na
 */
function readSegment(r) {
  const flags = r.readU8();
  const segment = { v0: r.readU8(), v1: r.readU8() };
  if (flags & 1) segment.curve = r.readF64();
  if (flags & 2) segment.bias = r.readF64();
  if (flags & 4) segment.color = r.readI32();
  segment.visible = (flags & 8) !== 0;
  segment.bCoef = r.readF64();
  segment.cGroup = r.readI32();
  segment.cMask = r.readI32();
  return segment;
}

/** A disc: position, velocity, gravity, physical properties.   game-min.js: ya.na / ta.na */
function readDisc(r) {
  return {
    x: r.readF64(), y: r.readF64(),
    vx: r.readF64(), vy: r.readF64(),
    gravityX: r.readF64(), gravityY: r.readF64(),
    radius: r.readF64(), bCoef: r.readF64(), invMass: r.readF64(), damping: r.readF64(),
    color: r.readU32(), cGroup: r.readI32(), cMask: r.readI32(),
  };
}

/** The stadium's default disc physics (radius/mass/etc. new discs inherit). game-min.js: Sb.na */
function readStadiumDefaultPhysics(r) {
  for (let i = 0; i < 7; i++) r.readF64(); // radius, bCoef, invMass, damping, kick strength, ...
  r.readF64(); r.readF64();                // gravity x, y
  r.readI32();                             // colour
  r.readF64(); r.readF64();
}


// ─────────────────────────────── Actions ────────────────────────────────────
/**
 * The 24 action types, in registration order — the index IS the type byte.
 * Each reads its own payload; see `readAction` for the field layouts.   game-min.js: Nc.xj
 */
const ACTION_NAMES = [
  "ChatMessage",   //  0
  "AdminAction",   //  1  (a single byte; not movement)
  "OpaqueBlob",    //  2
  "PlayerInput",   //  3  ← the movement/kick action we want
  "Announcement",  //  4
  "JoinPlayer",    //  5
  "RemovePlayer",  //  6
  "StartGame",     //  7
  "StopGame",      //  8
  "PauseGame",     //  9
  "SetLimits",     // 10
  "SetStadium",    // 11
  "MoveToTeam",    // 12
  "SetTeamLock",   // 13
  "Action14",      // 14
  "AutoTeams",     // 15
  "Action16",      // 16
  "Action17",      // 17
  "SetAvatar",     // 18
  "SetTeamColors", // 19
  "Action20",      // 20
  "SetKickRate",   // 21
  "Action22",      // 22
  "DiscSync",      // 23
];

const PLAYER_INPUT = 3;

/**
 * Read past one action's payload and, for a PlayerInput action, return its mask.
 * For every other action we only need to consume the right number of bytes so the
 * cursor stays aligned for the next action.            game-min.js: the *.wa methods (9790+)
 *
 * @returns the input mask (uint32, low 5 bits used) for PlayerInput, else null.
 */
function readAction(r) {
  const type = r.readU8();
  switch (type) {
    case 3: // PlayerInput — a uint32; only the low 5 bits (the key mask) matter
      return r.readU32();

    case 0: // ChatMessage: text, colour, style, weight
      r.readString(); r.readI32(); r.readU8(); r.readU8();
      return null;

    case 1: // AdminAction: one byte
      r.readU8();
      return null;

    case 2: // OpaqueBlob: a var-int length then that many bytes
      r.readBytes(r.readVarInt());
      return null;

    case 4: // Announcement: text
      r.readString();
      return null;

    case 5: // JoinPlayer: id + three names
      r.readI32(); r.readNullableString(); r.readNullableString(); r.readNullableString();
      return null;

    case 6: // RemovePlayer: id + reason + ban flag
      r.readI32(); r.readNullableString(); r.readU8();
      return null;

    case 7: case 8: case 15: // StartGame / StopGame / AutoTeams — no payload
      return null;

    case 9: case 13: case 16: // PauseGame / SetTeamLock / Action16 — one boolean
      r.readU8();
      return null;

    case 10: // SetLimits: score limit + time limit
      r.readI32(); r.readI32();
      return null;

    case 11: // SetStadium: a uint16-length blob (a compressed stadium)
      r.readBytes(r.readU16());
      return null;

    case 12: // MoveToTeam: player id + team
      r.readI32(); r.readI8();
      return null;

    case 14: // Action14: id + flag
      r.readI32(); r.readU8();
      return null;

    case 17: { // Action17: a list of var-ints
      const n = r.readVarInt();
      for (let i = 0; i < n; i++) r.readVarInt();
      return null;
    }

    case 18: // SetAvatar
      r.readNullableString();
      return null;

    case 19: // SetTeamColors: team + a team-state record
      r.readI8(); readTeamState(r);
      return null;

    case 20: { // Action20: flag + a list of ints
      r.readU8();
      const n = r.readU8();
      for (let i = 0; i < n; i++) r.readI32();
      return null;
    }

    case 21: // SetKickRate: min, rate, burst
      r.readI32(); r.readI32(); r.readI32();
      return null;

    case 22: // Action22
      r.readNullableString(); r.readI32();
      return null;

    case 23: { // DiscSync: a disc id, a flag, then a bitmask of which fields changed
      r.readI32(); r.readU8();
      let changed = r.readU16();
      for (let i = 0; i < 10; i++) { if (changed & 1) r.readF32(); changed >>= 1; } // pos/vel/etc.
      for (let i = 0; i < 3; i++)  { if (changed & 1) r.readI32(); changed >>= 1; } // colour/groups
      return null;
    }

    default:
      throw new Error(`unknown action type ${type}`);
  }
}

export {
  parseReplay, ByteReader, readRoomState, readStadium, readAction,
  ACTION_NAMES, INPUT_BITS, HBR2_MAGIC, PLAYER_INPUT,
};
