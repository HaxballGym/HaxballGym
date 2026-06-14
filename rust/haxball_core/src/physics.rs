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
    pub const WALL: i64 = 32;
    pub const ALL: i64 = 63;
    pub const KICK: i64 = 64;
    pub const SCORE: i64 = 128;
    pub const PLAYER_COLLISION: i64 = BALL | RED | BLUE | WALL; // 39
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

/// Port of `resolve_disc_disc_collision_fn`.
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
    let dist = norm(sub(pa, pb));
    let radius_sum = ra + rb;
    if dist > 0.0 && dist <= radius_sum {
        let normal = scale(sub(pa, pb), 1.0 / dist);
        let mass_factor = ima / (ima + imb);
        pa = add(pa, scale(normal, (radius_sum - dist) * mass_factor));
        pb = sub(pb, scale(normal, (radius_sum - dist) * (1.0 - mass_factor)));
        let relative_velocity = sub(va, vb);
        let normal_velocity = dot(relative_velocity, normal);
        if normal_velocity < 0.0 {
            let bouncing_factor = -(1.0 + ba * bb);
            va = add(va, scale(normal, normal_velocity * bouncing_factor * mass_factor));
            vb = sub(vb, scale(normal, normal_velocity * bouncing_factor * (1.0 - mass_factor)));
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
            let normal = scale(normal_circle, 1.0 / dist_norm);
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
    pub is_player: bool,
    // player-only params (unused for ball / posts)
    pub accel: f64,
    pub kick_accel: f64,
    pub kick_damping: f64,
    pub kick_strength: f64,
    pub kickback: f64,
    pub team: i64, // RED / BLUE flag, 0 for ball/post
}

impl Disc {
    fn ball() -> Self {
        // Canonical classic Haxball ball (added by the stadium loader, not in .hbs).
        Disc {
            pos: [0.0, 0.0],
            vel: [0.0, 0.0],
            radius: 10.0,
            inv_mass: 1.0,
            damping: 0.99,
            bcoef: 0.5,
            gravity: [0.0, 0.0],
            cgroup: flag::BALL | flag::KICK | flag::SCORE,
            cmask: flag::ALL,
            is_player: false,
            accel: 0.0,
            kick_accel: 0.0,
            kick_damping: 0.0,
            kick_strength: 0.0,
            kickback: 0.0,
            team: 0,
        }
    }
    fn goalpost(pos: Vec2) -> Self {
        // trait goalPost: radius 8, invMass 0, bCoef 0.5 (classic.hbs).
        Disc {
            pos,
            vel: [0.0, 0.0],
            radius: 8.0,
            inv_mass: 0.0,
            damping: 1.0,
            bcoef: 0.5,
            gravity: [0.0, 0.0],
            cgroup: flag::WALL,
            cmask: flag::ALL,
            is_player: false,
            accel: 0.0,
            kick_accel: 0.0,
            kick_damping: 0.0,
            kick_strength: 0.0,
            kickback: 0.0,
            team: 0,
        }
    }
    fn player(team: i64) -> Self {
        // PlayerPhysics.apply_default_values() in player_physics.py.
        Disc {
            pos: [0.0, 0.0],
            vel: [0.0, 0.0],
            radius: 15.0,
            inv_mass: 0.5,
            damping: 0.96,
            bcoef: 0.5,
            gravity: [0.0, 0.0],
            cgroup: flag::PLAYER_COLLISION | team,
            cmask: flag::PLAYER_COLLISION,
            is_player: true,
            accel: 0.1,
            kick_accel: 0.07,
            kick_damping: 0.96,
            kick_strength: 5.0,
            kickback: 0.0,
            team,
        }
    }
}

/// A static line segment (straight only in v1; curved goal-net arcs are TODO).
#[derive(Clone)]
pub struct Segment {
    pub v0: Vec2,
    pub v1: Vec2,
    pub bcoef: f64,
    pub bias: f64,
    pub cgroup: i64,
    pub cmask: i64,
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
    pub kick_cancel: Vec<bool>, // per player
}

const HALF_GOAL: f64 = 64.0; // classic goal mouth spans y in [-64, 64]

impl World {
    /// Build a classic-stadium match with `n_red` vs `n_blue` players.
    pub fn classic(n_red: usize, n_blue: usize) -> Self {
        let mut discs = Vec::new();
        discs.push(Disc::ball());
        // 4 goalposts (classic.hbs discs).
        for p in [[-370.0, 64.0], [-370.0, -64.0], [370.0, 64.0], [370.0, -64.0]] {
            discs.push(Disc::goalpost(p));
        }
        let first_player = discs.len();
        for _ in 0..n_red {
            discs.push(Disc::player(flag::RED));
        }
        for _ in 0..n_blue {
            discs.push(Disc::player(flag::BLUE));
        }

        // ballArea straight segments at x = ±370 (ball containment, leaves goal
        // mouth open between y=-64..64). cMask = ball, bCoef = 1.
        let seg = |v0: Vec2, v1: Vec2| Segment {
            v0,
            v1,
            bcoef: 1.0,
            bias: 0.0,
            cgroup: flag::WALL,
            cmask: flag::BALL,
        };
        let segments = vec![
            seg([-370.0, 170.0], [-370.0, 64.0]),
            seg([-370.0, -64.0], [-370.0, -170.0]),
            seg([370.0, 170.0], [370.0, 64.0]),
            seg([370.0, -64.0], [370.0, -170.0]),
        ];

        // Planes (classic.hbs). ballArea planes constrain the ball top/bottom
        // (cMask ball, bCoef 1); the bCoef 0.1 planes constrain players.
        let plane = |normal: Vec2, dist: f64, bcoef: f64, cmask: i64| Plane {
            normal,
            dist,
            bcoef,
            cgroup: flag::WALL,
            cmask,
        };
        let planes = vec![
            plane([0.0, 1.0], -170.0, 1.0, flag::BALL),
            plane([0.0, -1.0], -170.0, 1.0, flag::BALL),
            plane([0.0, 1.0], -200.0, 0.1, flag::ALL),
            plane([0.0, -1.0], -200.0, 0.1, flag::ALL),
            plane([1.0, 0.0], -420.0, 0.1, flag::ALL),
            plane([-1.0, 0.0], -420.0, 0.1, flag::ALL),
        ];

        let goals = vec![
            Goal { p0: [-370.0, 64.0], p1: [-370.0, -64.0], team: flag::RED },
            Goal { p0: [370.0, 64.0], p1: [370.0, -64.0], team: flag::BLUE },
        ];

        let n_players = n_red + n_blue;
        let mut w = World {
            discs,
            n_players,
            first_player,
            segments,
            planes,
            goals,
            red_score: 0,
            blue_score: 0,
            steps: 0,
            kick_cancel: vec![false; n_players],
        };
        w.reset_positions();
        w
    }

    /// Reset ball to center and players to spawn points (game.reset_discs_positions).
    pub fn reset_positions(&mut self) {
        self.discs[0].pos = [0.0, 0.0];
        self.discs[0].vel = [0.0, 0.0];
        let spawn = 277.5; // classic spawnDistance
        let mut red_i = 0i32;
        let mut blue_i = 0i32;
        for k in 0..self.n_players {
            let d = &mut self.discs[self.first_player + k];
            d.vel = [0.0, 0.0];
            if d.team == flag::RED {
                let row = (red_i + 1) >> 1;
                let y = if red_i % 2 == 1 { -55.0 * row as f64 } else { 55.0 * row as f64 };
                d.pos = [-spawn, y];
                red_i += 1;
            } else {
                let row = (blue_i + 1) >> 1;
                let y = if blue_i % 2 == 1 { -55.0 * row as f64 } else { 55.0 * row as f64 };
                d.pos = [spawn, y];
                blue_i += 1;
            }
        }
    }

    /// One physics tick. `actions` is [n_players][3] = (dx, dy, kick).
    /// Returns Some(scoring_team_flag) if a goal was scored this tick.
    pub fn step(&mut self, actions: &[[i64; 3]]) -> Option<i64> {
        // --- player movement + kick (player_handler.resolve_movement) ---
        for k in 0..self.n_players {
            let pi = self.first_player + k;
            let act = actions[k];
            let kicking_input = act[2] == 1;
            if act[2] == 0 {
                self.kick_cancel[k] = false;
            }
            let is_kicking = kicking_input && !self.kick_cancel[k];

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
                let dist = norm(sub(bpos, ppos));
                if (dist - pradius - self.discs[di].radius) < 4.0 {
                    if is_kicking && dist > 0.0 {
                        let normal = scale(sub(bpos, ppos), 1.0 / dist);
                        self.discs[di].vel = add(self.discs[di].vel, scale(normal, pkstr));
                        self.discs[pi].vel =
                            add(self.discs[pi].vel, scale(normal, -pkback * pinvmass));
                        player_has_kicked = true;
                    }
                }
            }
            if player_has_kicked {
                self.kick_cancel[k] = true;
            }

            // acceleration from input direction (normalized).
            let inp = [act[0] as f64, act[1] as f64];
            let n = norm(inp);
            let input_dir = if n > 0.0 { [inp[0] / n, inp[1] / n] } else { [0.0, 0.0] };
            let a = if is_kicking { self.discs[pi].kick_accel } else { self.discs[pi].accel };
            self.discs[pi].vel = add(self.discs[pi].vel, scale(input_dir, a));
        }

        // --- integrate (physics_handler.update_discs) ---
        let prev_ball = self.discs[0].pos;
        for k in 0..self.n_players {
            let pi = self.first_player + k;
            let act = actions[k];
            let is_kicking = act[2] == 1 && !self.kick_cancel[k];
            let d = &mut self.discs[pi];
            d.pos = add(d.pos, d.vel);
            let damping = if is_kicking { d.kick_damping } else { d.damping };
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

        // --- goal detection (game.check_goal) ---
        self.steps += 1;
        let cur_ball = self.discs[0].pos;
        if let Some(team) = self.check_goal(prev_ball, cur_ball) {
            if team == flag::RED {
                self.blue_score += 1; // RED conceded -> BLUE scored
            } else {
                self.red_score += 1;
            }
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
                // segments (straight)
                for s in &self.segments {
                    let d = &self.discs[i];
                    if !collides(d.cgroup, d.cmask, s.cgroup, s.cmask) {
                        continue;
                    }
                    if let Some((dist, normal)) = segment_no_curve(d.pos, s.v0, s.v1) {
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
