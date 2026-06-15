"""Fidelity test: the Rust port must match Ursinaxball's pure-numpy `fn_base.py`.

`fn_base.py` has NO ursina/panda3d import, so we can import it directly without
the game engine. We feed thousands of random inputs through both the Python and
the Rust implementation and assert the outputs are identical to ~1e-9.

Run:  uv run pytest test_fidelity.py -q     (after `maturin develop`)
"""

import importlib.util
import os

import haxball_core as hc
import numpy as np

# --- import the original numpy fn_base.py straight from the Ursinaxball clone ---
FN_BASE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "..",
    "Ursinaxball",
    "ursinaxball",
    "modules",
    "physics",
    "fn_base.py",
)
if not os.path.exists(os.path.abspath(FN_BASE)):
    # The reference is the original numpy implementation, which lives in a separate repo.
    # Clone it next to this one to run the cross-check:
    #   git clone https://github.com/HaxballGym/Ursinaxball.git   (sibling of HaxballGym)
    print(f"SKIP: Ursinaxball reference not found at {FN_BASE} — fidelity cross-check skipped.")
    raise SystemExit(0)
spec = importlib.util.spec_from_file_location("fn_base", os.path.abspath(FN_BASE))
fb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fb)

rng = np.random.default_rng(0)
TOL = 1e-9
N = 5000


def v(x):
    return (float(x[0]), float(x[1]))


def test_disc_disc():
    bad = 0
    for _ in range(N):
        pa = rng.uniform(-50, 50, 2)
        pb = rng.uniform(-50, 50, 2)
        va = rng.uniform(-10, 10, 2)
        vb = rng.uniform(-10, 10, 2)
        ra, rb = rng.uniform(5, 20), rng.uniform(5, 20)
        ima, imb = rng.uniform(0.1, 2), rng.uniform(0.1, 2)
        ba, bb = rng.uniform(0, 1), rng.uniform(0, 1)
        (pa_p, va_p), (pb_p, vb_p) = fb.resolve_disc_disc_collision_fn(
            pa.copy(), pb.copy(), va.copy(), vb.copy(), ra, rb, ima, imb, ba, bb
        )
        ra_pa, ra_pb, ra_va, ra_vb = hc.disc_disc(v(pa), v(pb), v(va), v(vb), ra, rb, ima, imb, ba, bb)
        if not (
            np.allclose(pa_p, ra_pa, atol=TOL)
            and np.allclose(pb_p, ra_pb, atol=TOL)
            and np.allclose(va_p, ra_va, atol=TOL)
            and np.allclose(vb_p, ra_vb, atol=TOL)
        ):
            bad += 1
    assert bad == 0, f"{bad}/{N} disc-disc mismatches"


def test_disc_vertex():
    bad = 0
    for _ in range(N):
        pd = rng.uniform(-30, 30, 2)
        pv = rng.uniform(-30, 30, 2)
        vel = rng.uniform(-10, 10, 2)
        r = rng.uniform(5, 20)
        bd, bv = rng.uniform(0, 1), rng.uniform(0, 1)
        pd_p, vel_p = fb.resolve_disc_vertex_collision_fn(pd.copy(), pv.copy(), vel.copy(), r, bd, bv)
        (rpd, rvel) = hc.disc_vertex(v(pd), v(pv), v(vel), r, bd, bv)
        if not (np.allclose(pd_p, rpd, atol=TOL) and np.allclose(vel_p, rvel, atol=TOL)):
            bad += 1
    assert bad == 0, f"{bad}/{N} disc-vertex mismatches"


def test_disc_plane():
    bad = 0
    for _ in range(N):
        pd = rng.uniform(-200, 200, 2)
        normal = rng.uniform(-1, 1, 2)
        if np.linalg.norm(normal) < 1e-6:
            continue
        vel = rng.uniform(-10, 10, 2)
        dist = rng.uniform(-200, 0)
        r = rng.uniform(5, 20)
        bd, bp = rng.uniform(0, 1), rng.uniform(0, 1)
        pd_p, vel_p = fb.resolve_disc_plane_collision_fn(
            pd.copy(), normal.copy(), vel.copy(), dist, r, bd, bp
        )
        (rpd, rvel) = hc.disc_plane(v(pd), v(normal), v(vel), dist, r, bd, bp)
        if not (np.allclose(pd_p, rpd, atol=TOL) and np.allclose(vel_p, rvel, atol=TOL)):
            bad += 1
    assert bad == 0, f"{bad}/{N} disc-plane mismatches"


def test_segment_no_curve():
    bad = 0
    for _ in range(N):
        pd = rng.uniform(-200, 200, 2)
        v0 = rng.uniform(-200, 200, 2)
        v1 = rng.uniform(-200, 200, 2)
        if np.linalg.norm(v1 - v0) < 1e-6:
            continue
        dist_p, normal_p = fb.resolve_disc_segment_collision_no_curve_fn(pd.copy(), v0.copy(), v1.copy())
        res = hc.segment_no_curve(v(pd), v(v0), v(v1))
        if dist_p is None:
            if res is not None:
                bad += 1
        else:
            if (
                res is None
                or not np.isclose(dist_p, res[0], atol=TOL)
                or not np.allclose(normal_p, res[1], atol=TOL)
            ):
                bad += 1
    assert bad == 0, f"{bad}/{N} segment-no-curve mismatches"


def test_segment_curve():
    bad = 0
    for _ in range(N):
        pd = rng.uniform(-200, 200, 2)
        c = rng.uniform(-100, 100, 2)
        cr = rng.uniform(20, 200)
        t0 = rng.uniform(-1, 1, 2)
        t1 = rng.uniform(-1, 1, 2)
        curve = rng.choice([-180, -90, 90, 180.0])
        dist_p, normal_p = fb.resolve_disc_segment_collision_curve_fn(
            pd.copy(), c.copy(), cr, t0.copy(), t1.copy(), curve
        )
        res = hc.segment_curve(v(pd), v(c), cr, v(t0), v(t1), float(curve))
        if dist_p is None:
            if res is not None:
                bad += 1
        else:
            if (
                res is None
                or not np.isclose(dist_p, res[0], atol=TOL)
                or not np.allclose(normal_p, res[1], atol=TOL)
            ):
                bad += 1
    assert bad == 0, f"{bad}/{N} segment-curve mismatches"


if __name__ == "__main__":
    test_disc_disc()
    print("disc_disc OK")
    test_disc_vertex()
    print("disc_vertex OK")
    test_disc_plane()
    print("disc_plane OK")
    test_segment_no_curve()
    print("segment_no_curve OK")
    test_segment_curve()
    print("segment_curve OK")
    print("\nALL FIDELITY TESTS PASSED — Rust port matches fn_base.py to 1e-9")
