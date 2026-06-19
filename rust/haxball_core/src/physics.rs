//! Headless Haxball physics, ported 1:1 from Ursinaxball's pure-numpy core.
//!
//! Source of truth for each function is named in its doc comment so the port
//! can be diffed against the Python. All math is f64 to match numpy float64
//! bit-for-bit (the fidelity test in `tests/test_fidelity.py` checks this).
//!
//! No rendering, no game engine, no allocation in the hot loop.

// ---------------------------------------------------------------------------
// 2D vector helpers (a Vec2 is just [f64; 2], like a numpy 2-vector)
// ---------------------------------------------------------------------------
pub type Vec2 = [f64; 2];

#[inline(always)]
fn sub(a: Vec2, b: Vec2) -> Vec2 {
    [a[0] - b[0], a[1] - b[1]]
}
#[inline(always)]
fn add(a: Vec2, b: Vec2) -> Vec2 {
    [a[0] + b[0], a[1] + b[1]]
}
#[inline(always)]
fn scale(a: Vec2, s: f64) -> Vec2 {
    [a[0] * s, a[1] * s]
}
#[inline(always)]
fn dot(a: Vec2, b: Vec2) -> f64 {
    a[0] * b[0] + a[1] * b[1]
}
#[inline(always)]
fn norm(a: Vec2) -> f64 {
    (a[0] * a[0] + a[1] * a[1]).sqrt()
}
#[inline(always)]
fn cross(a: Vec2, b: Vec2) -> f64 {
    a[0] * b[1] - a[1] * b[0]
}

// ---------------------------------------------------------------------------
// Collision groups / masks (CollisionFlag in common_values.py)
// ---------------------------------------------------------------------------
pub mod flag {
    pub const BALL: i64 = 1;
    pub const RED: i64 = 2;
    pub const BLUE: i64 = 4;
    pub const REDKO: i64 = 8;
    pub const BLUEKO: i64 = 16;
    pub const WALL: i64 = 32;
    pub const ALL: i64 = 63;
    pub const KICK: i64 = 64;
    pub const SCORE: i64 = 128;
    pub const PLAYER_COLLISION: i64 = BALL | RED | BLUE | WALL; // 39

    /// Parse a Haxball collision list like ["ball","red","wall"] -> bitset.
    pub fn parse(names: &[String]) -> i64 {
        names.iter().fold(0, |acc, n| {
            acc | match n.as_str() {
                "ball" => BALL,
                "red" => RED,
                "blue" => BLUE,
                "redKO" => REDKO,
                "blueKO" => BLUEKO,
                "wall" => WALL,
                "all" => ALL,
                "kick" => KICK,
                "score" => SCORE,
                _ => 0,
            }
        })
    }
}

#[inline(always)]
fn collides(group_a: i64, mask_a: i64, group_b: i64, mask_b: i64) -> bool {
    // Mirrors the bitwise test in physics_handler.resolve_collisions.
    (group_a & mask_b) != 0 && (mask_a & group_b) != 0
}

// ===========================================================================
// COLLISION RESOLVERS — direct port of modules/physics/fn_base.py
// Each returns the mutated (position, velocity) just like the Python.
// ===========================================================================

/// Port of Haxball's disc-disc collision, matching game-min.js's EXACT float operation
/// order (so a re-simulation stays bit-identical to the real engine over a whole game —
/// the `overlap - overlap*mf` and `e - mf*e` forms differ from `overlap*(1-mf)` by 1 ULP,
/// which compounds during dribbles). Verified vs node-haxball ground truth.
#[allow(clippy::too_many_arguments)]
pub fn disc_disc(
    mut pa: Vec2,
    mut pb: Vec2,
    mut va: Vec2,
    mut vb: Vec2,
    ra: f64,
    rb: f64,
    ima: f64,
    imb: f64,
    ba: f64,
    bb: f64,
) -> (Vec2, Vec2, Vec2, Vec2) {
    let dx = pa[0] - pb[0];
    let dy = pa[1] - pb[1];
    let distsq = dx * dx + dy * dy;
    let rs = ra + rb;
    if distsq > 0.0 && distsq <= rs * rs {
        let dist = distsq.sqrt();
        let nx = dx / dist;
        let ny = dy / dist;
        let mf = ima / (ima + imb);
        let overlap = rs - dist;
        let pf = overlap * mf; // a's share of the separation
        pa[0] += nx * pf;
        pa[1] += ny * pf;
        let ob = overlap - pf; // b's share, as Haxball computes it (NOT overlap*(1-mf))
        pb[0] -= nx * ob;
        pb[1] -= ny * ob;
        let mut nv = nx * (va[0] - vb[0]) + ny * (va[1] - vb[1]);
        if nv < 0.0 {
            nv *= ba * bb + 1.0;
            let ca = mf * nv;
            va[0] -= nx * ca;
            va[1] -= ny * ca;
            let cb = nv - ca; // b's share, again as `nv - mf*nv`
            vb[0] += nx * cb;
            vb[1] += ny * cb;
        }
    }
    (pa, pb, va, vb)
}

/// Port of `resolve_disc_vertex_collision_fn`.
pub fn disc_vertex(
    mut pd: Vec2,
    pv: Vec2,
    mut v: Vec2,
    radius: f64,
    bd: f64,
    bv: f64,
) -> (Vec2, Vec2) {
    let dist = norm(sub(pd, pv));
    if dist > 0.0 && dist <= radius {
        let normal = scale(sub(pd, pv), 1.0 / dist);
        pd = add(pd, scale(normal, radius - dist));
        let normal_velocity = dot(v, normal);
        if normal_velocity < 0.0 {
            let bouncing_factor = -(1.0 + bd * bv);
            v = add(v, scale(normal, normal_velocity * bouncing_factor));
        }
    }
    (pd, v)
}

/// Port of `resolve_disc_segment_collision_no_curve_fn`. Returns None if no hit.
pub fn segment_no_curve(pd: Vec2, v0: Vec2, v1: Vec2) -> Option<(f64, Vec2)> {
    let normal_segment = sub(v1, v0);
    let normal_disc_v0 = sub(pd, v0);
    let normal_disc_v1 = sub(pd, v1);
    if dot(normal_segment, normal_disc_v0) > 0.0 && dot(normal_segment, normal_disc_v1) < 0.0 {
        let len = norm(normal_segment);
        let normal = [-normal_segment[1] / len, normal_segment[0] / len];
        let dist = dot(normal, normal_disc_v1);
        return Some((dist, normal));
    }
    None
}

/// Port of `resolve_disc_segment_collision_curve_fn`.
pub fn segment_curve(
    pd: Vec2,
    circle_center: Vec2,
    circle_radius: f64,
    tangent_0: Vec2,
    tangent_1: Vec2,
    curve: f64,
) -> Option<(f64, Vec2)> {
    let normal_circle = sub(pd, circle_center);
    let cond = (dot(normal_circle, tangent_0) > 0.0) && (dot(normal_circle, tangent_1) > 0.0);
    if cond != (curve < 0.0) {
        let dist_norm = norm(normal_circle);
        if dist_norm > 0.0 {
            let dist = dist_norm - circle_radius;
            // Divide each component (engine: `H/=$$, W/=$$`), NOT multiply by the
            // reciprocal: `x/d` and `x*(1/d)` round differently in f64.
            let normal = [normal_circle[0] / dist_norm, normal_circle[1] / dist_norm];
            return Some((dist, normal));
        }
    }
    None
}

/// Port of `segment_apply_bias` in physics_handler.py.
/// Returns None when the disc is past the bias band (Python returns np.inf dist,
/// which `resolve_disc_segment_final_fn`'s `dist < radius` check then rejects).
pub fn segment_apply_bias(bias: f64, mut dist: f64, mut normal: Vec2) -> Option<(f64, Vec2)> {
    let mut bias_segment = bias;
    if bias_segment == 0.0 {
        if dist < 0.0 {
            dist = -dist;
            normal = scale(normal, -1.0);
        }
    } else if bias_segment < 0.0 {
        bias_segment = -bias_segment;
        dist = -dist;
        normal = scale(normal, -1.0);
    }
    if dist < -bias_segment {
        return None; // == np.inf, never satisfies dist < radius
    }
    Some((dist, normal))
}

/// Port of `resolve_disc_segment_final_fn`.
pub fn segment_final(
    dist: f64,
    normal: Vec2,
    mut pd: Vec2,
    mut v: Vec2,
    radius: f64,
    bd: f64,
    bs: f64,
) -> (Vec2, Vec2) {
    if dist < radius {
        pd = add(pd, scale(normal, radius - dist));
        let normal_velocity = dot(v, normal);
        if normal_velocity < 0.0 {
            let bouncing_factor = -(1.0 + bd * bs);
            v = add(v, scale(normal, normal_velocity * bouncing_factor));
        }
    }
    (pd, v)
}

/// Port of `resolve_disc_plane_collision_fn`.
/// NOTE: faithfully reproduces the Python quirk where position uses the
/// normalized plane normal but velocity uses the raw `normal_plane`.
/// For unit-normal planes (all stadium planes) these are identical.
pub fn disc_plane(
    mut pd: Vec2,
    normal_plane: Vec2,
    mut v: Vec2,
    distance_plane: f64,
    radius: f64,
    bd: f64,
    bp: f64,
) -> (Vec2, Vec2) {
    let len = norm(normal_plane);
    let norm_plane = scale(normal_plane, 1.0 / len);
    let dist = distance_plane - dot(pd, norm_plane) + radius;
    if dist > 0.0 {
        pd = add(pd, scale(norm_plane, dist));
        let normal_velocity = dot(v, norm_plane);
        if normal_velocity < 0.0 {
            let bouncing_factor = -(1.0 + bd * bp);
            v = add(v, scale(normal_plane, normal_velocity * bouncing_factor));
        }
    }
    (pd, v)
}

// ===========================================================================
// WORLD — a single Haxball match (ball + players + static geometry)
// Ports game.step / update_discs / resolve_collisions / resolve_movement.
// ===========================================================================

#[derive(Clone)]
pub struct Disc {
    pub pos: Vec2,
    pub vel: Vec2,
    pub radius: f64,
    pub inv_mass: f64,
    pub damping: f64,
    pub bcoef: f64,
    pub gravity: Vec2,
    pub cgroup: i64,
    pub cmask: i64,
    #[allow(dead_code)] // descriptive flag set by constructors; not read in the hot loop
    pub is_player: bool,
    // player-only params (unused for ball / posts)
    pub accel: f64,
    pub kick_accel: f64,
    pub kick_damping: f64,
    pub kick_strength: f64,
    pub kickback: f64,
    pub team: i64, // RED / BLUE flag, 0 for ball/post
}

/// A static segment, straight or a circular arc (goal nets, kickoff semicircles).
/// For a straight segment `curve == 0` and only `v0/v1` matter; for an arc the
/// precomputed `center/radius/tangent_0/tangent_1` drive `segment_curve`.
#[derive(Clone)]
pub struct Segment {
    pub v0: Vec2,
    pub v1: Vec2,
    pub bcoef: f64,
    pub bias: f64,
    pub cgroup: i64,
    pub cmask: i64,
    pub curve: f64, // 0 = straight; else the cotangent form used by segment_curve
    pub center: Vec2,
    pub radius: f64,
    pub tangent_0: Vec2,
    pub tangent_1: Vec2,
}

impl Segment {
    /// Build a segment from raw `.hbs` data (vertices in native coords, `curve` in
    /// degrees). The vertices/bias/curve are y-flipped into the engine's *mirror* segment
    /// (every official stadium is y-symmetric, so the mirror exists and the negations are
    /// exact); then the arc center/radius/tangents are computed by replicating game-min.js's
    /// `calculate_curve` (`G5`) + `calculate_additional_properties` (`W_`) VERBATIM — same
    /// operations, same order — so the curve collision path is bit-exact to the real engine.
    /// `curve_deg == 0` (or a curve outside the engine's arc range) → a straight segment.
    pub fn build(
        v0_raw: Vec2,
        v1_raw: Vec2,
        curve_deg: f64,
        bias_raw: f64,
        bcoef: f64,
        cgroup: i64,
        cmask: i64,
    ) -> Self {
        // y-flip into the mirror segment (vertex y -> -y, bias negated, curve negated).
        let mut h = [v0_raw[0], -v0_raw[1]]; // engine `this.H.B`
        let mut m = [v1_raw[0], -v1_raw[1]]; // engine `this.M.B`
        let mut bias = -bias_raw; // engine `this.Z$`

        // --- calculate_curve (G5): degrees -> radians, fold sign, cotangent form ---
        let mut rad = (-curve_deg) * 0.017_453_292_519_943_295; // engine `h *= PI/180`
        if rad < 0.0 {
            rad = -rad;
            std::mem::swap(&mut h, &mut m);
            bias = -bias;
        }
        // o$ defaults to +inf (straight); only an arc in (≈9.99°, 340°) gets a finite cotangent.
        // Use the pure-Rust `libm::tan` (not `f64::tan`) so the one transcendental on the
        // trajectory path is deterministic across targets and matches V8's `Math.tan` — the
        // host libm can be 1 ULP off, which would break bit-exactness with the real engine.
        let o = if 0.174_358_392_274_233_53 < rad && rad < 5.934_119_456_780_721 {
            1.0 / libm::tan(rad / 2.0)
        } else {
            f64::INFINITY
        };

        // --- calculate_additional_properties (W_) ---
        let (mut center, mut radius, mut curve) = ([0.0, 0.0], 0.0, 0.0);
        let (mut t0, mut t1) = ([0.0, 0.0], [0.0, 0.0]);
        if o.is_finite() {
            let f = 0.5 * (m[0] - h[0]);
            let i = 0.5 * (m[1] - h[1]);
            let cx = h[0] + f - i * o;
            let cy = h[1] + i + f * o;
            let fr = h[0] - cx;
            let ir = h[1] - cy;
            radius = (fr * fr + ir * ir).sqrt(); // engine `xr = sqrt(F*F + I*I)` from vertex0
            t0 = [cy - h[1], h[0] - cx]; // engine `Uc`
            t1 = [m[1] - cy, cx - m[0]]; // engine `uc`
            if o <= 0.0 {
                t0 = [-t0[0], -t0[1]];
                t1 = [-t1[0], -t1[1]];
            }
            center = [cx, cy];
            curve = o;
        }
        Segment {
            v0: h,
            v1: m,
            bcoef,
            bias,
            cgroup,
            cmask,
            curve,
            center,
            radius,
            tangent_0: t0,
            tangent_1: t1,
        }
    }
}

#[derive(Clone)]
pub struct Plane {
    pub normal: Vec2,
    pub dist: f64,
    pub bcoef: f64,
    pub cgroup: i64,
    pub cmask: i64,
}

#[derive(Clone)]
pub struct Goal {
    pub p0: Vec2,
    pub p1: Vec2,
    pub team: i64, // team that CONCEDES when ball crosses (RED goal on the left)
}

#[derive(Clone)]
pub struct World {
    pub discs: Vec<Disc>, // [0] = ball, then goalposts, then players
    pub n_players: usize,
    pub first_player: usize, // index in discs where players start
    pub segments: Vec<Segment>,
    pub planes: Vec<Plane>,
    pub goals: Vec<Goal>,
    pub red_score: u32,
    pub blue_score: u32,
    pub steps: u64,
    pub kick_flag: Vec<bool>, // "winding up to kick", set on the kick key's rising
    //                                edge, cleared on release or an actual kick (d.Yb)
    pub kick_held_prev: Vec<bool>, // kick key state last tick (for rising-edge detection)
    pub kick_cooldown: Vec<i64>,   // ticks of kick lockout remaining (Haxball's d.Zc)
    pub kick_burst: Vec<i64>,      // kick burst counter, capped at kickRateLimit (d.Cc)
    // kickRateLimit (min, rate-cost, burst-cap) = Haxball's (Gd, gd, ne). A kick needs
    // cooldown<=0 and burst>=0; after a kick: cooldown=min, burst-=cost. Default min=2.
    pub kick_rate_min: i64,
    pub kick_rate_cost: i64,
    pub kick_rate_cap: i64,
    pub spawn_distance: f64,  // stadium spawnDistance (kickoff spread)
    pub red_spawn: Vec<Vec2>, // explicit spawn points (else the spawn_distance formula)
    pub blue_spawn: Vec<Vec2>,
    // Game state machine (game-min.js `this.Cb`): 0 = KICKOFF, 1 = PLAYING. During KICKOFF the
    // non-kicking team is held behind the centre semicircle (every player's cMask gains the
    // kicking team's KO group, `.i = 39 | this.le.Lp`); the lock releases the moment the ball's
    // velocity becomes non-zero. `kicking_team` is RED at kickoff and becomes the conceding team
    // after a goal.
    pub state: u8,
    pub kicking_team: i64,
    // GOAL-state countdown (game-min.js `this.zc`): on a goal the game enters the GOAL state and
    // freezes scoring for `goal_timer` ticks (the celebration) before re-kickoff. 150 in vanilla.
    pub goal_timer: i64,
}

pub const STATE_KICKOFF: u8 = 0;
pub const STATE_PLAYING: u8 = 1;
pub const STATE_GOAL: u8 = 2;

const HALF_GOAL: f64 = 64.0; // classic goal mouth spans y in [-64, 64]

/// Default kickoff y-offset for the i-th player of a team (game.reset_discs_positions):
/// 0, +55, -55, +110, -110, … used when the stadium has no explicit spawn points.
#[inline]
fn row_offset(i: usize) -> f64 {
    let row = ((i + 1) >> 1) as f64;
    if i % 2 == 1 {
        -55.0 * row
    } else {
        55.0 * row
    }
}

impl World {
    /// Build a classic-stadium match with `n_red` vs `n_blue` players.
    /// Build a classic-stadium match with `n_red` vs `n_blue` players by parsing the canonical
    /// `classic.hbs` embedded in the crate — the SAME path as `from_hbs("classic")`, so the
    /// default (`stadium=None`) and the loaded classic stadium are identical by construction
    /// (no hand-maintained duplicate to drift, which was the source of an earlier kickoff bug).
    pub fn classic(n_red: usize, n_blue: usize) -> Self {
        const CLASSIC_HBS: &str = include_str!("stadiums/classic.hbs");
        crate::stadium::world_from_hbs(CLASSIC_HBS, n_red, n_blue)
            .expect("bundled classic.hbs is valid")
            .0
    }

    /// Reset ball to center and players to spawn points (game.reset_discs_positions).
    pub fn reset_positions(&mut self) {
        self.discs[0].pos = [0.0, 0.0];
        self.discs[0].vel = [0.0, 0.0];
        let spawn = self.spawn_distance;
        let mut red_i = 0usize;
        let mut blue_i = 0usize;
        for k in 0..self.n_players {
            let (team, fp) = (
                self.discs[self.first_player + k].team,
                self.first_player + k,
            );
            let d = &mut self.discs[fp];
            d.vel = [0.0, 0.0];
            if team == flag::RED {
                d.pos = match self.red_spawn.get(red_i) {
                    Some(p) => *p,
                    None => [-spawn, row_offset(red_i)],
                };
                red_i += 1;
            } else {
                d.pos = match self.blue_spawn.get(blue_i) {
                    Some(p) => *p,
                    None => [spawn, row_offset(blue_i)],
                };
                blue_i += 1;
            }
        }
        // a kickoff is a fresh play: clear per-player kick state + restore the normal cMask
        // (game-min.js `al()` copies the stadium discs back, so cMask reverts to 39).
        for k in 0..self.n_players {
            self.kick_flag[k] = false;
            self.kick_held_prev[k] = false;
            self.kick_cooldown[k] = 0;
            self.kick_burst[k] = 0;
            self.discs[self.first_player + k].cmask = flag::PLAYER_COLLISION;
        }
        // back to the KICKOFF state (Cb = 0). `kicking_team` is left as-is: after a goal it was
        // set to the conceding team (game-min.js `this.le = d`); a fresh game/episode sets it to
        // RED explicitly via the VecEnv reset path.
        self.state = STATE_KICKOFF;
        self.goal_timer = 0;
    }

    /// One physics tick. `actions` is [n_players][3] = (dx, dy, kick).
    /// Returns Some(scoring_team_flag) if a goal was scored this tick.
    #[allow(clippy::needless_range_loop)] // k indexes discs/actions/kick state in lockstep
    pub fn step(&mut self, actions: &[[i64; 3]]) -> Option<i64> {
        // --- player movement + kick (player_handler.resolve_movement) ---
        for k in 0..self.n_players {
            let pi = self.first_player + k;
            let act = actions[k];
            // act[2]: 0 = kick not held, 1 = held, 2 = held AND a rising edge happened
            // *within this frame* (a human tapping kick fast produces release+repress in
            // one frame). game-min.js processes every input event, so each off->on edge
            // re-arms the flag (Yb) via XA; collapsing a frame to its last value would miss
            // that re-arm. The re-sim passes 2 to signal it; live training only ever uses
            // 0/1, so this stays backward-compatible.
            let kicking_input = act[2] >= 1;
            let intra_frame_rearm = act[2] == 2;
            // Yb state machine: rising edge of the kick key arms the flag; releasing it
            // disarms it (an actual kick disarms it too, below).
            if (kicking_input && !self.kick_held_prev[k]) || intra_frame_rearm {
                self.kick_flag[k] = true;
            }
            if !kicking_input {
                self.kick_flag[k] = false;
            }
            self.kick_held_prev[k] = kicking_input;

            // Kick rate limit (game-min.js: tick `Zc` down, `Cc` up, gate the kick on
            // both). Values come from the room's kickRateLimit. A player can only kick
            // while armed AND off cooldown AND with burst credit.
            if self.kick_cooldown[k] > 0 {
                self.kick_cooldown[k] -= 1;
            }
            if self.kick_burst[k] < self.kick_rate_cap {
                self.kick_burst[k] += 1;
            }
            let kick_allowed =
                self.kick_flag[k] && self.kick_cooldown[k] <= 0 && self.kick_burst[k] >= 0;

            // kick: only the ball has the KICK group in classic.
            let (ppos, pradius, pkstr, pkback, pinvmass) = {
                let d = &self.discs[pi];
                (d.pos, d.radius, d.kick_strength, d.kickback, d.inv_mass)
            };
            let mut player_has_kicked = false;
            for di in 0..self.discs.len() {
                if di == pi {
                    continue;
                }
                if self.discs[di].cgroup & flag::KICK == 0 {
                    continue;
                }
                let bpos = self.discs[di].pos;
                let bim = self.discs[di].inv_mass;
                let dx = bpos[0] - ppos[0];
                let dy = bpos[1] - ppos[1];
                let dist = (dx * dx + dy * dy).sqrt();
                // Haxball: `4 > n - k.V - d.I.V` → dist - r_ball - r_player < 4.
                if dist - self.discs[di].radius - pradius < 4.0 {
                    if kick_allowed && dist > 0.0 {
                        // normal via direct division (not reciprocal-multiply) and impulse
                        // `f*l*k` = normal·kickStrength·invMass — game-min.js exact order.
                        let nx = dx / dist;
                        let ny = dy / dist;
                        self.discs[di].vel[0] += nx * pkstr * bim;
                        self.discs[di].vel[1] += ny * pkstr * bim;
                        self.discs[pi].vel[0] += nx * -pkback * pinvmass;
                        self.discs[pi].vel[1] += ny * -pkback * pinvmass;
                        player_has_kicked = true;
                    }
                }
            }
            if player_has_kicked {
                self.kick_flag[k] = false;
                self.kick_cooldown[k] = self.kick_rate_min;
                self.kick_burst[k] -= self.kick_rate_cost;
            }

            // acceleration from input direction (normalized).
            let inp = [act[0] as f64, act[1] as f64];
            let n = norm(inp);
            let input_dir = if n > 0.0 {
                [inp[0] / n, inp[1] / n]
            } else {
                [0.0, 0.0]
            };
            // Acceleration uses the kick flag AFTER the kick loop: if the player just
            // kicked a ball this tick, the flag is cleared, so the kick frame uses normal
            // accel (0.10) — only "winding up" (armed, ball not yet kicked) uses the
            // slower kicking accel (0.07). Verified bit-exact vs node-haxball.
            let a = if self.kick_flag[k] {
                self.discs[pi].kick_accel
            } else {
                self.discs[pi].accel
            };
            self.discs[pi].vel = add(self.discs[pi].vel, scale(input_dir, a));
        }

        // --- integrate (physics_handler.update_discs) ---
        let prev_ball = self.discs[0].pos;
        for k in 0..self.n_players {
            let pi = self.first_player + k;
            let kf = self.kick_flag[k];
            let d = &mut self.discs[pi];
            d.pos = add(d.pos, d.vel);
            let damping = if kf { d.kick_damping } else { d.damping };
            d.vel = scale(add(d.vel, d.gravity), damping);
        }
        // non-player discs: only the ball moves (posts have inv_mass 0 but the
        // Python still integrates them; their vel stays 0 so it's a no-op).
        {
            let d = &mut self.discs[0];
            d.pos = add(d.pos, d.vel);
            d.vel = scale(add(d.vel, d.gravity), d.damping);
        }

        // --- resolve collisions (physics_handler.resolve_collisions) ---
        self.resolve_collisions();
        self.steps += 1;

        // --- game state machine (game-min.js `this.Cb`, run AFTER the physics update so the
        // cMask set here gates the NEXT tick's collisions, exactly like the original) ---
        if self.state == STATE_KICKOFF {
            // hold the non-kicking team behind the centre semicircle: every player's cMask gains
            // the kicking team's KO group (`.i = 39 | this.le.Lp`). No goal can occur during a
            // kickoff (game-min.js only checks goals in Cb == 1).
            let ko = if self.kicking_team == flag::RED {
                flag::REDKO
            } else {
                flag::BLUEKO
            };
            for k in 0..self.n_players {
                self.discs[self.first_player + k].cmask = flag::PLAYER_COLLISION | ko;
            }
            // kickoff is "made" the instant the ball moves (ball.G.x^2 + ball.G.y^2 > 0 -> Cb = 1).
            let bv = self.discs[0].vel;
            if bv[0] * bv[0] + bv[1] * bv[1] > 0.0 {
                self.state = STATE_PLAYING;
            }
            None
        } else if self.state == STATE_PLAYING {
            // PLAYING: drop the barrier (cMask = 39) and check for goals.
            for k in 0..self.n_players {
                self.discs[self.first_player + k].cmask = flag::PLAYER_COLLISION;
            }
            self.score_goal(prev_ball)
        } else {
            // GOAL (game-min.js Cb = 2): the 150-tick goal celebration. Physics keeps running (the
            // ball sits in the net, players move on) while `goal_timer` counts down; at zero the
            // game re-kickoffs (al()) -> KICKOFF, with the conceding team kicking off.
            self.goal_timer -= 1;
            if self.goal_timer <= 0 {
                self.reset_positions(); // kicking_team (conceding) is preserved by reset_positions
            }
            None
        }
    }

    /// game.check_goal + score/kickoff bookkeeping. Returns the conceding team on a goal and enters
    /// the GOAL celebration state (game-min.js: Cb = 2, zc = 150, le = conceding team).
    fn score_goal(&mut self, prev_ball: Vec2) -> Option<i64> {
        let cur_ball = self.discs[0].pos;
        if let Some(team) = self.check_goal(prev_ball, cur_ball) {
            if team == flag::RED {
                self.blue_score += 1; // RED conceded -> BLUE scored
            } else {
                self.red_score += 1;
            }
            self.kicking_team = team; // the conceding team kicks off next (game-min.js `this.le = d`)
            self.state = STATE_GOAL;
            self.goal_timer = 150;
            return Some(team);
        }
        None
    }

    fn resolve_collisions(&mut self) {
        let n = self.discs.len();
        // disc-disc
        for i in 0..n {
            for j in (i + 1)..n {
                let (a, b) = {
                    let a = &self.discs[i];
                    let b = &self.discs[j];
                    if !collides(a.cgroup, a.cmask, b.cgroup, b.cmask) {
                        continue;
                    }
                    (a.clone(), b.clone())
                };
                let (pa, pb, va, vb) = disc_disc(
                    a.pos, b.pos, a.vel, b.vel, a.radius, b.radius, a.inv_mass, b.inv_mass,
                    a.bcoef, b.bcoef,
                );
                self.discs[i].pos = pa;
                self.discs[i].vel = va;
                self.discs[j].pos = pb;
                self.discs[j].vel = vb;
            }
            if self.discs[i].inv_mass != 0.0 {
                // planes
                for p in &self.planes {
                    let d = &self.discs[i];
                    if !collides(d.cgroup, d.cmask, p.cgroup, p.cmask) {
                        continue;
                    }
                    let (pd, v) =
                        disc_plane(d.pos, p.normal, d.vel, p.dist, d.radius, d.bcoef, p.bcoef);
                    self.discs[i].pos = pd;
                    self.discs[i].vel = v;
                }
                // segments (straight lines and curved arcs)
                for s in &self.segments {
                    let d = &self.discs[i];
                    if !collides(d.cgroup, d.cmask, s.cgroup, s.cmask) {
                        continue;
                    }
                    let hit = if s.curve != 0.0 {
                        segment_curve(d.pos, s.center, s.radius, s.tangent_0, s.tangent_1, s.curve)
                    } else {
                        segment_no_curve(d.pos, s.v0, s.v1)
                    };
                    if let Some((dist, normal)) = hit {
                        if let Some((dist, normal)) = segment_apply_bias(s.bias, dist, normal) {
                            let (pd, v) = segment_final(
                                dist, normal, d.pos, d.vel, d.radius, d.bcoef, s.bcoef,
                            );
                            self.discs[i].pos = pd;
                            self.discs[i].vel = v;
                        }
                    }
                }
            }
        }
    }

    /// Deterministic ball prediction: roll the ball (disc 0) forward against the STATIC
    /// geometry (posts, planes, segments) with players ignored — i.e. where the ball goes
    /// if no one touches it — and return its position at each ascending tick offset in
    /// `offsets`. Replays the exact integrate + collision code of `step`/`resolve_collisions`
    /// for the ball alone, so it's bit-faithful until a player would touch the ball; most
    /// useful at short horizons (interception, reading wall/corner rebounds).
    pub fn predict_ball(&self, offsets: &[u64]) -> Vec<Vec2> {
        let mut ball = self.discs[0].clone();
        let max_t = offsets.iter().copied().max().unwrap_or(0);
        let mut out = Vec::with_capacity(offsets.len());
        let mut next = 0usize;
        for t in 1..=max_t {
            // integrate (identical to step's ball integration)
            ball.pos = add(ball.pos, ball.vel);
            ball.vel = scale(add(ball.vel, ball.gravity), ball.damping);
            if ball.inv_mass != 0.0 {
                // ball vs static posts (discs[1..first_player]); players are skipped
                for di in 1..self.first_player {
                    let post = &self.discs[di];
                    if !collides(ball.cgroup, ball.cmask, post.cgroup, post.cmask) {
                        continue;
                    }
                    let (pa, _pb, va, _vb) = disc_disc(
                        ball.pos,
                        post.pos,
                        ball.vel,
                        post.vel,
                        ball.radius,
                        post.radius,
                        ball.inv_mass,
                        post.inv_mass,
                        ball.bcoef,
                        post.bcoef,
                    );
                    ball.pos = pa;
                    ball.vel = va;
                }
                for p in &self.planes {
                    if !collides(ball.cgroup, ball.cmask, p.cgroup, p.cmask) {
                        continue;
                    }
                    let (pd, v) = disc_plane(
                        ball.pos,
                        p.normal,
                        ball.vel,
                        p.dist,
                        ball.radius,
                        ball.bcoef,
                        p.bcoef,
                    );
                    ball.pos = pd;
                    ball.vel = v;
                }
                for s in &self.segments {
                    if !collides(ball.cgroup, ball.cmask, s.cgroup, s.cmask) {
                        continue;
                    }
                    let hit = if s.curve != 0.0 {
                        segment_curve(
                            ball.pos,
                            s.center,
                            s.radius,
                            s.tangent_0,
                            s.tangent_1,
                            s.curve,
                        )
                    } else {
                        segment_no_curve(ball.pos, s.v0, s.v1)
                    };
                    if let Some((dist, normal)) = hit {
                        if let Some((dist, normal)) = segment_apply_bias(s.bias, dist, normal) {
                            let (pd, v) = segment_final(
                                dist,
                                normal,
                                ball.pos,
                                ball.vel,
                                ball.radius,
                                ball.bcoef,
                                s.bcoef,
                            );
                            ball.pos = pd;
                            ball.vel = v;
                        }
                    }
                }
            }
            while next < offsets.len() && offsets[next] == t {
                out.push(ball.pos);
                next += 1;
            }
        }
        while next < offsets.len() {
            out.push(ball.pos); // offsets beyond max_t -> last position
            next += 1;
        }
        out
    }

    /// Port of game.check_goal (the two-cross-product line-crossing test).
    fn check_goal(&self, prev: Vec2, cur: Vec2) -> Option<i64> {
        for g in &self.goals {
            let prev_p0 = sub(prev, g.p0);
            let cur_p0 = sub(cur, g.p0);
            let cur_p1 = sub(cur, g.p1);
            let disc_vec = sub(cur, prev);
            let goal_vec = sub(g.p1, g.p0);
            if cross(cur_p0, disc_vec) * cross(cur_p1, disc_vec) <= 0.0
                && cross(prev_p0, goal_vec) * cross(cur_p0, goal_vec) <= 0.0
            {
                return Some(g.team);
            }
        }
        let _ = HALF_GOAL;
        None
    }
}
