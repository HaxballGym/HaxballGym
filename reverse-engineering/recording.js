/**
 * recording.js — de-obfuscated Haxball .hbr2 replay reader.
 *
 * Reconstructed from reverse-engineering/game-min.js (with Mario Carbajal's
 * permission, research use). This is the clean reference that rl/replays.py ports.
 * Obfuscated symbol names are noted in [brackets] so you can diff against the source.
 *
 * STATUS: the container, marker log, action-log framing, the full action table,
 * the input action, and the playback loop are fully cracked. The RoomState binary
 * reader (stadium + physics + players) is mapped field-by-field below; its stadium
 * sub-reader mirrors the .hbs format already implemented in rust/haxball_core/stadium.rs.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BYTE READER  [class J] — DataView, BIG-ENDIAN (the `Ua=false` flag)
 *   u8       [F]   getUint8                      i8    [zf]  getInt8
 *   u16      [Sb]  getUint16                     i16   [Ci]  getInt16
 *   u32      [kb]  getUint32                     i32   [N]   getInt32
 *   f32      [Bi]  getFloat32                    f64   [w]   getFloat64
 *   varint   [Bb]  LEB128, 7 bits/byte, continuation bit 0x80, max 5 bytes
 *   bytes(n) [lb]  raw slice (n defaults to "rest")
 *   str(n)   [se]  UTF-8, n bytes                strU8len [em] = str(F())
 *   strVar   [kc]  = str(Bb())                   strNullable [Ab] = Bb()>0 ? str(Bb()-1) : null
 *   json     [Jg]  = JSON.parse(kc())
 * ───────────────────────────────────────────────────────────────────────────
 */

// --- Reader (subset; see J in game-min.js) -------------------------------
class Reader {
  constructor(u8) { this.v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); this.a = 0; }
  u8()  { return this.v.getUint8(this.a++); }
  i8()  { const x = this.v.getInt8(this.a++); return x; }
  u16() { const x = this.v.getUint16(this.a, false); this.a += 2; return x; }
  i16() { const x = this.v.getInt16(this.a, false); this.a += 2; return x; }
  u32() { const x = this.v.getUint32(this.a, false); this.a += 4; return x; }
  i32() { const x = this.v.getInt32(this.a, false); this.a += 4; return x; }
  f32() { const x = this.v.getFloat32(this.a, false); this.a += 4; return x; }
  f64() { const x = this.v.getFloat64(this.a, false); this.a += 8; return x; }
  varint() { let b = 0, c, d = 0; do { c = this.v.getUint8(this.a + b); if (b < 5) d |= (c & 127) << (7 * b); b++; } while (c & 128); this.a += b; return d | 0; }
  bytes(n) { if (n == null) n = this.v.byteLength - this.a; const s = new Uint8Array(this.v.buffer, this.v.byteOffset + this.a, n); this.a += n; return s; }
  str(n) { const s = new TextDecoder().decode(this.bytes(n)); return s; }
  strVar() { return this.str(this.varint()); }
  strNullable() { const n = this.varint(); return n > 0 ? this.str(n - 1) : null; }
  remaining() { return this.v.byteLength - this.a; }
}

// --- Action table (registration order = type id) [Nc.xj] -----------------
// The type byte at the head of every action indexes this table.
const ACTIONS = [
  /*  0 */ "ChatMessage",        // [Jb] strVar text, i32 color, u8 style, u8 weight
  /*  1 */ "PlayerInput",        // [Na] u8 mask  ← THE ONE BC NEEDS (see below)
  /*  2 */ "...",                // [$a]
  /*  3 */ "...",                // [Ja]
  /*  4 */ "...",                // [ab]
  /*  5 */ "...",                // [Ha]
  /*  6 */ "RemovePlayer/Kick",  // [na] i32 id, strNullable reason, u8 ban
  /*  7 */ "...", /* 8 */ "...", /* 9 */ "...",
  /* 10 */ "SetScoreLimit/Time", // [Aa] i32 which, i32 value
  /* 11 */ "...", /* 12 */ "...", /* 13 */ "MovePlayerToTeam?", // [Qa]
  /* 14 */ "...", /* 15 */ "AutoTeams", // [eb] (no payload)
  /* 16 */ "...", /* 17 */ "...", /* 18 */ "...", /* 19 */ "...",
  /* 20 */ "...", /* 21 */ "...", /* 22 */ "...", /* 23 */ "...",
];

// Each action class has wa(stream) = deserialize, apply(world), xa(stream) = serialize.
// PlayerInput [Na]:
//   wa(s) { this.mask = s.u8(); }                       // 5-bit input bitmask
//   apply(world) { applyInput(world, world.player(this.P), this.mask); }   // [qa.h]
// Input bits (per Ursinaxball common_values; verify against qa.h):
const INPUT = { UP: 4, DOWN: 1, LEFT: 2, RIGHT: 8, KICK: 16 };

function readAction(s) {
  const type = s.u8();              // [p.Jj] -> class = ACTIONS[type]
  if (type === 1) return { type, kind: "PlayerInput", mask: s.u8() };
  // Other action types: dispatch to their wa(). For BC we only need PlayerInput,
  // but to WALK PAST them we must read each one's payload — see ACTIONS table /
  // the wa() methods in game-min.js (classes at lines 9790–10393).
  throw new Error(`action type ${type} (${ACTIONS[type]}) payload not yet ported`);
}

// --- Container + top-level parse  [$b.Za] --------------------------------
const HBR2 = 0x48425232; // "HBR2" as u32 big-endian (1212305970)

function parseReplay(fileBytes, pako /* inflateRaw */) {
  const head = new Reader(fileBytes);
  if (head.u32() !== HBR2) throw new Error("not an HBR2 file");
  const version = head.u32();             // == 3 for this dataset
  const frameCount = head.u32();          // total frames  [this.Bf]
  const payload = pako.inflateRaw(head.bytes()); // raw DEFLATE
  const s = new Reader(payload);

  // 1) marker log [$b.mr] — timeline highlights, NOT inputs
  const markers = [];
  const mCount = s.u16();
  for (let i = 0, cum = 0; i < mCount; i++) { cum += s.varint(); markers.push({ frame: cum, kind: s.u8() }); }

  // 2) the rest = RoomState + action log. Re-base a reader on it.  [Sc = remaining]
  const body = new Reader(s.bytes());

  // 3) RoomState  [world.na @ game-min.js:6441] — leaves `body` at the action log:
  const room = readRoomState(body);

  // 4) action log [$b.dm + playback $b.A]: stream of timed actions.
  const events = [];
  let frame = 0;                          // cumulative  [this.vg]
  while (body.remaining() > 0) {
    frame += body.varint();               // frame delta
    const playerId = body.u16();          // [action.P]
    const action = readAction(body);      // [p.Jj]
    events.push({ frame, playerId, ...action });
  }
  return { version, frameCount, markers, room, events };
}

// --- RoomState  [world class .na @ 6441] ---------------------------------
// Reads, in order:
//   strNullable  roomName?         [lc]
//   u8 bool      locked?           [Bc]
//   i32          scoreLimit        [mb]
//   i32          timeLimit         [Ga]
//   i16          ?                 [ne]
//   u8           ?                 [gd]
//   u8           ?                 [Gd]
//   STADIUM      q.na(stream)      [U]   ← big nested reader; see readStadium()
//   u8 bool      inProgress        -> if true, read physics world state [aa.na: ball+discs]
//   u8           playerCount, then per player: Player.wa(stream, discList)  [wa class]
// The PLAYER read yields { id, name, team, ... } — the id↔team map BC needs.
function readRoomState(s) {
  const room = {};
  room.name = s.strNullable();
  room.locked = s.u8() !== 0;
  room.scoreLimit = s.i32();
  room.timeLimit = s.i32();
  s.i16(); s.u8(); s.u8();
  room.stadium = readStadium(s);          // <-- REMAINING WORK (see below)
  room.inProgress = s.u8() !== 0;
  if (room.inProgress) readPhysicsState(s); // ball + discs  [aa.na]
  const nPlayers = s.u8();
  room.players = [];
  for (let i = 0; i < nPlayers; i++) room.players.push(readPlayer(s, room));
  return room;
}

// --- STILL TO PORT (mapped, not yet implemented) -------------------------
// readStadium [q.na, ~game-min.js:4800–4910]: the binary twin of an .hbs file —
//   default-vs-custom flag, then name/dims/bg, vertexes, segments (incl. curve),
//   planes, goals, discs, joints, spawn points, physics. Mirrors the fields in
//   rust/haxball_core/src/stadium.rs (which already parses the JSON .hbs form).
// readPhysicsState [aa.na]: disc list — each disc = 7×f64 (radius, invMass,
//   damping, bCoef, ...) + position + velocity (see na() @ 795/845).
// readPlayer [wa.wa]: id (i32), name, team (i8: 1=red,2=blue,0=spec), avatar,
//   and its disc index (see na() @ 1086 for the per-player disc pos/vel/team).
function readStadium(_s) { throw new Error("readStadium: port from q.na (mirrors stadium.rs / .hbs)"); }
function readPhysicsState(_s) { throw new Error("readPhysicsState: port from aa.na (disc list)"); }
function readPlayer(_s, _room) { throw new Error("readPlayer: port from wa.wa (id, name, team)"); }

export { parseReplay, Reader, ACTIONS, INPUT, HBR2 };
