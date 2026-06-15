// Host a private Haxball room and play against our RL bot.
//
//   HEADLESS_TOKEN=<token from https://www.haxball.com/headlesstoken> node bot.js
//
// Optional env: ROOM_NAME, ROOM_PASS (default "bot"), TICK_SKIP (8), FLIP_Y (0/1).
//
// node-haxball is used only as a thin loader for the official Haxball engine. All the
// bot logic (obs + policy) is ours and mirrors the training code; because the Rust
// core is a bit-faithful port, the sim-trained policy transfers to a real room.
const fs = require("fs");
const path = require("path");
const { Room, Utils, OperationType } = require("node-haxball")();

const TOKEN = process.env.HEADLESS_TOKEN;
if (!TOKEN) {
  console.error("Set HEADLESS_TOKEN (get one at https://www.haxball.com/headlesstoken).");
  process.exit(1);
}

const CONFIG = {
  roomName: process.env.ROOM_NAME || "RL Bot — private",
  password: process.env.ROOM_PASS || "bot",
  tickSkip: parseInt(process.env.TICK_SKIP || "8", 10), // decisions every N physics ticks
  flipY: process.env.FLIP_Y === "1", // flip if the bot moves up/down the wrong way
};
const BOT_ID = 65535;
const RED = 1, BLUE = 2, SPEC = 0;

// ── Policy (the trained MLP; weights from export_policy.py) ───────────────────
const VS = 1 / 10;
// Obs normalization is map-aware and travels in policy.json (pos_coef/goal_x), so the room
// obs matches what the bot trained on (futsal's bigger field needs a different scale than
// classic). Absent fields fall back to the classic defaults. `let` so a reload updates them.
let PX, PY, GOAL_X;
const POLICY_PATH = path.join(__dirname, "policy.json");
// `let` so we can HOT-RELOAD new weights live (the `!reload` command / file-watch) without
// restarting the room — re-export policy.json, the running bot picks it up, same link.
let P = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
let roomRef = null; // set in onOpen; lets the file-watch announce the new bot in-room
function applyObsParams() {
  PX = P.pos_coef ? P.pos_coef[0] : 1 / 420;
  PY = P.pos_coef ? P.pos_coef[1] : 1 / 200;
  GOAL_X = P.goal_x != null ? P.goal_x : 370;
}
applyObsParams();
function reloadPolicy() {
  P = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
  applyObsParams(); // pick up the new bot's obs scaling too (not just weights)
  return P.obs_dim;
}
// auto-reload whenever policy.json changes on disk (so a fresh export swaps the bot instantly)
try {
  fs.watchFile(POLICY_PATH, { interval: 1000 }, () => {
    try {
      reloadPolicy();
      console.log(`policy.json changed -> reloaded "${P.name || "bot"}"`);
      if (roomRef) roomRef.sendAnnouncement(`▶ Now playing: "${P.name || "bot"}".`, null, 0x88ccff);
    } catch (e) { console.log("reload failed:", e.message); }
  });
} catch { /* watch unsupported; !reload still works */ }

function linear(x, layer) {
  const out = new Array(layer.b.length);
  for (let i = 0; i < out.length; i++) {
    let sum = layer.b[i];
    const row = layer.w[i];
    for (let j = 0; j < x.length; j++) sum += row[j] * x[j];
    out[i] = sum;
  }
  return out;
}
const tanh = (a) => a.map(Math.tanh);
const argmax = (a) => a.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);

function act(obs) {
  let h = tanh(linear(obs, P.trunk0));
  h = tanh(linear(h, P.trunk2));
  return {
    dx: argmax(linear(h, P.head_x)) - 1, // {0,1,2} -> {-1,0,1}
    dy: argmax(linear(h, P.head_y)) - 1,
    kick: argmax(linear(h, P.head_k)) === 1,
  };
}

// Goal-relative, side-aware observation — identical to haxballgym DefaultObs.
// CRITICAL: DefaultObs MIRRORS the x-axis for blue (so both teams see "attacking +x" and one
// net plays both sides). We must apply the SAME mirror here — `sx = -1` for blue negates every
// x-component — or a blue bot gets left/right inverted and runs the wrong way. The action's dx
// is un-mirrored by the same `sx` in controlBot (matches env.py `engine_actions[...,0]*=mirror`).
function buildObs(self, ball, opp, team) {
  const fy = CONFIG.flipY ? -1 : 1;
  const sx = team === RED ? 1 : -1; // blue x-mirror, matching DefaultObs (out[...,0::2] *= sx)
  const targetX = team === RED ? GOAL_X : -GOAL_X; // attacked goal in WORLD: red +x, blue -x
  return [
    sx * self.pos.x * PX, self.pos.y * fy * PY,
    sx * self.speed.x * VS, self.speed.y * fy * VS,
    sx * (ball.pos.x - self.pos.x) * PX, (ball.pos.y - self.pos.y) * fy * PY,
    sx * ball.speed.x * VS, ball.speed.y * fy * VS,
    sx * (targetX - self.pos.x) * PX, -self.pos.y * fy * PY,
    sx * (-targetX - self.pos.x) * PX, -self.pos.y * fy * PY,
    sx * (opp.pos.x - self.pos.x) * PX, (opp.pos.y - self.pos.y) * fy * PY,
    sx * opp.speed.x * VS, opp.speed.y * fy * VS,
  ];
}

// ── Room ──────────────────────────────────────────────────────────────────────
let tick = 0, lastKey = -1, decisions = 0;
const DEBUG = process.env.DEBUG === "1";
const announce = (room, msg, to = null, color = 0x88ccff) =>
  Utils.runAfterGameTick(() => room.sendAnnouncement(msg, to, color, "normal", 0));
const after = (fn) => Utils.runAfterGameTick(fn);

function humans(room) {
  return room.players.filter((p) => p.id !== BOT_ID);
}

function startIfReady(room) {
  const blue = humans(room).find((p) => p.team?.id === BLUE);
  if (blue && !room.gameState) after(() => room.startGame());
}

function controlBot(room) {
  if (++tick % CONFIG.tickSkip !== 0) return;
  room.extrapolate();
  const me = room.getPlayer(BOT_ID);
  const self = me?.disc?.ext;
  const ball = room.gameState?.physicsState?.discs?.[0];
  const opp = humans(room).find((p) => p.team?.id && p.team.id !== SPEC)?.disc?.ext;
  if (!self || !ball || !opp) return;

  const { dx, dy, kick } = act(buildObs(self, ball, opp, me.team.id));
  // un-mirror dx for blue (the obs was x-mirrored): world dx = sx·dx, matching env.py.
  const sx = me.team.id === RED ? 1 : -1;
  const key = Utils.keyState(sx * dx, CONFIG.flipY ? -dy : dy, kick);
  after(() => {
    if (key !== lastKey || kick !== me.isKicking) {
      // to re-kick when the keystate is unchanged, release the kick bit first
      if (key === lastKey && kick && !me.isKicking) room.fakeSendPlayerInput(key & ~16, BOT_ID);
      room.fakeSendPlayerInput(key, BOT_ID);
      lastKey = key;
    }
  });
}

function handleCommand(room, player, text) {
  const [cmd] = text.slice(1).toLowerCase().split(/\s+/);
  switch (cmd) {
    case "restart": after(() => { room.stopGame(); room.startGame(); }); break;
    case "start": after(() => room.startGame()); break;
    case "stop": after(() => room.stopGame()); break;
    case "swap": // swap the bot and you between teams
      after(() => {
        const me = humans(room)[0];
        const botTeam = room.getPlayer(BOT_ID).team.id;
        room.setPlayerTeam(BOT_ID, botTeam === RED ? BLUE : RED);
        if (me) room.setPlayerTeam(me.id, botTeam === RED ? RED : BLUE);
      });
      break;
    case "reload": // hot-swap the bot's weights from policy.json — no room restart
      try {
        reloadPolicy();
        announce(room, `▶ Now playing: "${P.name || "bot"}" (obs_dim ${P.obs_dim}).`);
      } catch (e) {
        announce(room, `Reload failed: ${e.message}`, player.id, 0xff8888);
      }
      break;
    case "who": // which bot is loaded?
      announce(room, `▶ Current bot: "${P.name || "bot"}".`, player.id);
      break;
    case "help":
      announce(room, "Commands: !restart  !start  !stop  !swap  !reload  !who  (UI buttons work too)", player.id);
      break;
    default:
      announce(room, `Unknown command: !${cmd}`, player.id, 0xff8888);
  }
}

Room.create(
  {
    name: CONFIG.roomName,
    password: CONFIG.password,
    showInRoomList: false,
    maxPlayerCount: 10,
    token: TOKEN,
    noPlayer: true,
  },
  {
    storage: { player_name: "RL-Host" },
    onOpen: (room) => {
      roomRef = room; // for file-watch in-room announcements
      // non-classic maps ship in policy.json; load the right pitch (futsal etc.) before play
      if (P.stadium_hbs) {
        try {
          room.setCustomStadium(Utils.parseStadium(P.stadium_hbs));
          console.log(`stadium -> ${P.stadium_name || "custom"}`);
        } catch (e) { console.log("stadium load failed:", e.message); }
      }
      room.fakePlayerJoin(BOT_ID, `🤖 RL · ${P.name || "bot"}`, "tr", "🤖", "fake-conn", "fake-auth");
      after(() => room.setPlayerTeam(BOT_ID, RED));

      room.onRoomLink = (link) =>
        console.log(`\n  >>> JOIN: ${link}\n  >>> password: ${CONFIG.password}\n`);

      room.onPlayerJoin = (player) => {
        console.log(`+ ${player.name} (id ${player.id})`);
        after(() => {
          room.setPlayerAdmin(player.id, true); // you control the room (restart, teams, …)
          const blueTaken = humans(room).some((p) => p.id !== player.id && p.team?.id === BLUE);
          room.setPlayerTeam(player.id, blueTaken ? SPEC : BLUE);
        });
        announce(room, `You're admin. Bot on red, playing "${P.name || "bot"}". Type !help.`, player.id);
        startIfReady(room);
      };

      room.onPlayerLeave = () => {
        if (!humans(room).some((p) => p.team?.id === BLUE) && room.gameState) after(() => room.stopGame());
      };

      // chat commands (suppress them from the public chat)
      room.onBeforeOperationReceived = (type, msg) => {
        if (type === OperationType.SendChat && msg.byId !== 0 && msg.text?.startsWith("!")) {
          handleCommand(room, room.getPlayer(msg.byId), msg.text);
          return false;
        }
        return true;
      };

      // keep playing: restart shortly after a goal-limit victory
      room.onGameEnd = () => setTimeout(() => startIfReady(room), 3000);
      room.onTeamGoal = () => startIfReady(room);

      room.onGameTick = () => controlBot(room);
    },
    onClose: (msg) => {
      console.error("Room closed:", msg?.code ?? msg ?? "(unknown)");
      process.exit(1);
    },
  }
);
