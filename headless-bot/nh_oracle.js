// Ground-truth trajectory generator using node-haxball (the REAL Haxball engine).
// Produces fixtures to validate the Rust port against game-min.js (not Ursinaxball).
// Usage: node nh_oracle.js > fixture.json
const { Room, Utils } = require("node-haxball")();
const NAMES = { classic: "Classic", big: "Big", rounded: "Rounded", hockey: "Hockey", huge: "Huge" };
// scenarios: ball-only physics (no player input), players left at spawn. Velocities are
// upward-dominant so the ball bounces off walls/segments/curves WITHOUT scoring (a goal would
// trigger the engine's re-kickoff and diverge the comparison).
const SCENARIOS = [
  { stadium: "classic", n_red: 1, n_blue: 1, ball_vel: [8, 55], ticks: 180 },
  { stadium: "classic", n_red: 1, n_blue: 1, ball_vel: [-30, 45], ticks: 180 },
  { stadium: "classic", n_red: 3, n_blue: 3, ball_vel: [40, 50], ticks: 180 },
  { stadium: "big", n_red: 3, n_blue: 3, ball_vel: [12, 60], ticks: 180 },
  { stadium: "big", n_red: 1, n_blue: 1, ball_vel: [-55, 40], ticks: 180 },
  { stadium: "rounded", n_red: 1, n_blue: 1, ball_vel: [45, 45], ticks: 180 },
  { stadium: "hockey", n_red: 1, n_blue: 1, ball_vel: [25, 52], ticks: 180 },
];
function run(sc) {
  const stad = Utils.getDefaultStadiums().find(s => JSON.parse(Utils.exportStadium(s)).name === NAMES[sc.stadium]);
  const room = Room.sandbox({}, {});
  room.setCurrentStadium(stad, 0);
  let id = 1;
  for (let i = 0; i < sc.n_red; i++) { room.playerJoin(id, "r"+id, "tr", "", "", ""); room.setPlayerTeam(id, 1, 0); id++; }
  for (let i = 0; i < sc.n_blue; i++) { room.playerJoin(id, "b"+id, "tr", "", "", ""); room.setPlayerTeam(id, 2, 0); id++; }
  room.startGame(0);
  const gs = room.gameState.copy();
  const ball = gs.physicsState.discs[0];
  ball.I.x = sc.ball_vel[0]; ball.I.y = sc.ball_vel[1];
  const traj = [];
  for (let t = 0; t < sc.ticks; t++) {
    gs.runSteps(1);
    const b = gs.physicsState.discs[0];
    traj.push([b.pos.x, b.pos.y]);
  }
  // also capture the spawn layout (disc positions at t=0 before stepping)
  return { ...sc, ball_traj: traj };
}
console.log(JSON.stringify(SCENARIOS.map(run)));
process.exit(0);
