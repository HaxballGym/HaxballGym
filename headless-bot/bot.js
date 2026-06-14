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
const PX = 1 / 420, PY = 1 / 200, VS = 1 / 10, GOAL_X = 370;
const P = JSON.parse(fs.readFileSync(path.join(__dirname, "policy.json"), "utf8"));

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
function buildObs(self, ball, opp, team) {
  const fy = CONFIG.flipY ? -1 : 1;
  const targetX = team === RED ? GOAL_X : -GOAL_X; // red attacks +x, blue attacks -x
  return [
    self.pos.x * PX, self.pos.y * fy * PY,
    self.speed.x * VS, self.speed.y * fy * VS,
    (ball.pos.x - self.pos.x) * PX, (ball.pos.y - self.pos.y) * fy * PY,
    ball.speed.x * VS, ball.speed.y * fy * VS,
    (targetX - self.pos.x) * PX, -self.pos.y * fy * PY,
    (-targetX - self.pos.x) * PX, -self.pos.y * fy * PY,
    (opp.pos.x - self.pos.x) * PX, (opp.pos.y - self.pos.y) * fy * PY,
    opp.speed.x * VS, opp.speed.y * fy * VS,
  ];
}

// ── Room ──────────────────────────────────────────────────────────────────────
let tick = 0, lastKey = -1;
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
  const key = Utils.keyState(dx, CONFIG.flipY ? -dy : dy, kick);
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
    case "help":
      announce(room, "Commands: !restart  !start  !stop  !swap   (you're admin — UI buttons work too)", player.id);
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
      room.fakePlayerJoin(BOT_ID, "RL-Bot 🤖", "tr", "🤖", "fake-conn", "fake-auth");
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
        announce(room, "You're admin. The bot is on red. Type !help for commands.", player.id);
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
