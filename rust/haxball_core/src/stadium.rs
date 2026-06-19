//! Parse a Haxball `.hbs` stadium (plain JSON) and build a [`World`].
//!
//! Ports Ursinaxball's object construction: each object optionally names a
//! `trait`; properties it doesn't set are inherited from that trait, then from
//! per-type defaults. Coordinates are y-flipped (vertices, disc/plane geometry,
//! spawns), bias/curve are negated — exactly as `objects/base/*.py` do.
//!
//! Curved segments (goal nets, kickoff semicircles, rounded corners) are fully
//! resolved: `Segment::build` precomputes each arc's centre/radius/tangents and the
//! collision core handles disc-vs-arc (`physics::segment_curve`), so maps like futsal
//! are bit-faithful including their corners.

use std::collections::HashMap;

use serde::Deserialize;

use crate::physics::{flag, Disc, Goal, Plane, Segment, Vec2, World};

// ---------------------------------------------------------------------------
// Raw .hbs schema (serde). Every physics field is Option so we can tell
// "unset" (inherit / default) from "set".
// ---------------------------------------------------------------------------

/// Shared physics properties an object or a trait may carry.
#[derive(Deserialize, Default, Clone)]
struct Props {
    #[serde(rename = "bCoef")]
    b_coef: Option<f64>,
    #[serde(rename = "cGroup")]
    c_group: Option<Vec<String>>,
    #[serde(rename = "cMask")]
    c_mask: Option<Vec<String>>,
    radius: Option<f64>,
    #[serde(rename = "invMass")]
    inv_mass: Option<f64>,
    damping: Option<f64>,
    bias: Option<f64>,
    curve: Option<f64>,
}

impl Props {
    /// Object properties win; whatever they leave unset falls back to the trait's.
    fn over(&self, base: Option<&Props>) -> Props {
        let b = base.cloned().unwrap_or_default();
        Props {
            b_coef: self.b_coef.or(b.b_coef),
            c_group: self.c_group.clone().or(b.c_group),
            c_mask: self.c_mask.clone().or(b.c_mask),
            radius: self.radius.or(b.radius),
            inv_mass: self.inv_mass.or(b.inv_mass),
            damping: self.damping.or(b.damping),
            bias: self.bias.or(b.bias),
            curve: self.curve.or(b.curve),
        }
    }
    fn cgroup(&self, default: i64) -> i64 {
        self.c_group
            .as_ref()
            .map(|l| flag::parse(l))
            .unwrap_or(default)
    }
    fn cmask(&self, default: i64) -> i64 {
        self.c_mask
            .as_ref()
            .map(|l| flag::parse(l))
            .unwrap_or(default)
    }
}

#[derive(Deserialize)]
struct RawVertex {
    x: f64,
    y: f64,
}

#[derive(Deserialize)]
struct RawSegment {
    v0: usize,
    v1: usize,
    #[serde(rename = "trait")]
    tr: Option<String>,
    #[serde(flatten)]
    props: Props,
}

#[derive(Deserialize)]
struct RawPlane {
    normal: [f64; 2],
    dist: f64,
    #[serde(rename = "trait")]
    tr: Option<String>,
    #[serde(flatten)]
    props: Props,
}

#[derive(Deserialize)]
struct RawDisc {
    #[serde(default)]
    pos: Option<[f64; 2]>, // the ball disc (official format) omits pos — spawns at centre
    #[serde(rename = "trait")]
    tr: Option<String>,
    #[serde(flatten)]
    props: Props,
}

/// `ballPhysics`: either an inline physics object (our dialect) OR the official Haxball
/// `"discN"` string, meaning "the ball IS `discs[N]`" (that disc carries the ball's flags).
#[derive(Deserialize)]
#[serde(untagged)]
enum BallPhysics {
    Ref(String), // "disc0"
    Inline(Props),
}

impl Default for BallPhysics {
    fn default() -> Self {
        BallPhysics::Inline(Props::default())
    }
}

#[derive(Deserialize)]
struct RawGoal {
    p0: [f64; 2],
    p1: [f64; 2],
    team: String,
}

/// Player physics block (`playerPhysics`). Defaults from `player_physics.py`.
#[derive(Deserialize, Default)]
struct RawPlayerPhysics {
    radius: Option<f64>,
    #[serde(rename = "invMass")]
    inv_mass: Option<f64>,
    damping: Option<f64>,
    #[serde(rename = "bCoef")]
    b_coef: Option<f64>,
    acceleration: Option<f64>,
    #[serde(rename = "kickingAcceleration")]
    kicking_acceleration: Option<f64>,
    #[serde(rename = "kickingDamping")]
    kicking_damping: Option<f64>,
    #[serde(rename = "kickStrength")]
    kick_strength: Option<f64>,
    kickback: Option<f64>,
}

#[derive(Deserialize)]
struct RawStadium {
    name: Option<String>,
    #[serde(default)]
    traits: HashMap<String, Props>,
    #[serde(default)]
    vertexes: Vec<RawVertex>,
    #[serde(default)]
    segments: Vec<RawSegment>,
    #[serde(default)]
    planes: Vec<RawPlane>,
    #[serde(default)]
    discs: Vec<RawDisc>,
    #[serde(default)]
    goals: Vec<RawGoal>,
    #[serde(rename = "spawnDistance")]
    spawn_distance: Option<f64>,
    #[serde(rename = "playerPhysics", default)]
    player_physics: RawPlayerPhysics,
    #[serde(rename = "ballPhysics", default)]
    ball_physics: BallPhysics,
    #[serde(rename = "redSpawnPoints", default)]
    red_spawn: Vec<[f64; 2]>,
    #[serde(rename = "blueSpawnPoints", default)]
    blue_spawn: Vec<[f64; 2]>,
}

// ---------------------------------------------------------------------------
// Build a World from the parsed stadium.
// ---------------------------------------------------------------------------

fn make_disc(
    pos: Vec2,
    radius: f64,
    inv_mass: f64,
    damping: f64,
    bcoef: f64,
    cgroup: i64,
    cmask: i64,
) -> Disc {
    Disc {
        pos,
        vel: [0.0, 0.0],
        radius,
        inv_mass,
        damping,
        bcoef,
        gravity: [0.0, 0.0],
        cgroup,
        cmask,
        is_player: false,
        accel: 0.0,
        kick_accel: 0.0,
        kick_damping: 0.0,
        kick_strength: 0.0,
        kickback: 0.0,
        team: 0,
    }
}

/// Build a single-match `World` from `.hbs` JSON text.
/// Returns the World and a second field kept for API compat (always 0; curves are resolved).
pub fn world_from_hbs(json: &str, n_red: usize, n_blue: usize) -> Result<(World, usize), String> {
    let s: RawStadium = serde_json::from_str(json).map_err(|e| format!("bad .hbs JSON: {e}"))?;

    // Ball: canonical collision flags (ball|kick|score, mask ALL); physics from `ballPhysics`.
    // Two dialects: an inline physics object, OR the official "discN" string where the ball IS
    // discs[N] (so that disc must NOT also be added as a goalpost).
    let (ball_props, ball_disc_idx) = match &s.ball_physics {
        BallPhysics::Inline(p) => (p.clone(), None),
        BallPhysics::Ref(r) => {
            let idx = r
                .strip_prefix("disc")
                .and_then(|n| n.parse::<usize>().ok())
                .ok_or_else(|| format!("ballPhysics ref {r:?} is not 'discN'"))?;
            let d = s
                .discs
                .get(idx)
                .ok_or_else(|| format!("ballPhysics {r} references a missing disc"))?;
            (
                d.props.over(d.tr.as_ref().and_then(|t| s.traits.get(t))),
                Some(idx),
            )
        }
    };
    let ball = make_disc(
        [0.0, 0.0],
        ball_props.radius.unwrap_or(10.0),
        ball_props.inv_mass.unwrap_or(1.0),
        ball_props.damping.unwrap_or(0.99),
        ball_props.b_coef.unwrap_or(0.5),
        flag::BALL | flag::KICK | flag::SCORE,
        flag::ALL,
    );

    // Goalposts: every `.hbs` disc EXCEPT the one that IS the ball. y-flipped; default cGroup/
    // cMask = ALL.
    let mut discs = vec![ball];
    for (i, d) in s.discs.iter().enumerate() {
        if Some(i) == ball_disc_idx {
            continue;
        }
        let p = d.props.over(d.tr.as_ref().and_then(|t| s.traits.get(t)));
        let pos = d.pos.unwrap_or([0.0, 0.0]);
        discs.push(make_disc(
            [pos[0], -pos[1]],
            p.radius.unwrap_or(10.0),
            p.inv_mass.unwrap_or(1.0),
            p.damping.unwrap_or(0.99),
            p.b_coef.unwrap_or(0.5),
            p.cgroup(flag::ALL),
            p.cmask(flag::ALL),
        ));
    }

    // Players from playerPhysics + defaults.
    let pp = &s.player_physics;
    let first_player = discs.len();
    let mut push_player = |team: i64| {
        discs.push(Disc {
            pos: [0.0, 0.0],
            vel: [0.0, 0.0],
            radius: pp.radius.unwrap_or(15.0),
            inv_mass: pp.inv_mass.unwrap_or(0.5),
            damping: pp.damping.unwrap_or(0.96),
            bcoef: pp.b_coef.unwrap_or(0.5),
            gravity: [0.0, 0.0],
            cgroup: team, // just the team flag (no `ball`) — players pass through ballArea
            cmask: flag::PLAYER_COLLISION,
            is_player: true,
            accel: pp.acceleration.unwrap_or(0.1),
            kick_accel: pp.kicking_acceleration.unwrap_or(0.07),
            kick_damping: pp.kicking_damping.unwrap_or(0.96),
            kick_strength: pp.kick_strength.unwrap_or(5.0),
            kickback: pp.kickback.unwrap_or(0.0),
            team,
        });
    };
    for _ in 0..n_red {
        push_player(flag::RED);
    }
    for _ in 0..n_blue {
        push_player(flag::BLUE);
    }

    // Segments — straight lines and curved arcs alike. `Segment::build` replicates
    // Ursinaxball's geometry (y-flip vertices, negate curve/bias, precompute the arc),
    // so we pass the *raw* .hbs vertex coords here.
    let mut segments = Vec::new();
    for seg in &s.segments {
        let p = seg
            .props
            .over(seg.tr.as_ref().and_then(|t| s.traits.get(t)));
        let (rv0, rv1) = match (s.vertexes.get(seg.v0), s.vertexes.get(seg.v1)) {
            (Some(a), Some(b)) => ([a.x, a.y], [b.x, b.y]),
            _ => {
                return Err(format!(
                    "segment references missing vertex {} / {}",
                    seg.v0, seg.v1
                ))
            }
        };
        segments.push(Segment::build(
            rv0,
            rv1,
            p.curve.unwrap_or(0.0),
            p.bias.unwrap_or(0.0),
            p.b_coef.unwrap_or(1.0),
            p.cgroup(flag::WALL),
            p.cmask(flag::ALL),
        ));
    }

    // Planes (normal y-flipped).
    let planes = s
        .planes
        .iter()
        .map(|pl| {
            let p = pl.props.over(pl.tr.as_ref().and_then(|t| s.traits.get(t)));
            Plane {
                normal: [pl.normal[0], -pl.normal[1]],
                dist: pl.dist,
                bcoef: p.b_coef.unwrap_or(1.0),
                cgroup: p.cgroup(flag::WALL),
                cmask: p.cmask(flag::ALL),
            }
        })
        .collect();

    // Goals (no y-flip; team string -> conceding-team flag).
    let goals = s
        .goals
        .iter()
        .map(|g| Goal {
            p0: g.p0,
            p1: g.p1,
            team: match g.team.as_str() {
                "red" => flag::RED,
                "blue" => flag::BLUE,
                _ => 0,
            },
        })
        .collect();

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
        kick_flag: vec![false; n_players],
        kick_held_prev: vec![false; n_players],
        kick_cooldown: vec![0; n_players],
        kick_burst: vec![0; n_players],
        kick_rate_min: 2,
        kick_rate_cost: 0,
        kick_rate_cap: 1,
        spawn_distance: s.spawn_distance.unwrap_or(277.5),
        red_spawn: s.red_spawn.iter().map(|p| [p[0], -p[1]]).collect(),
        blue_spawn: s.blue_spawn.iter().map(|p| [p[0], -p[1]]).collect(),
        state: crate::physics::STATE_KICKOFF,
        kicking_team: flag::RED,
        goal_timer: 0,
    };
    w.reset_positions();
    Ok((w, 0)) // second field kept for API compat; curved segments are now resolved
}
