'use strict';
(function (pa) {
    function ka() {
        return w.Pe(this, "")
    }
    function hc(a) {
        return 66 > a ? 66 : 400 < a ? 400 : a
    }
    function M(a, b) {
        if (null == b)
            return null;
        null == b.vh && (b.vh = pa.Kj++);
        var c;
        null == a.vj ? a.vj = {} : c = a.vj[b.vh];
        null == c && (c = b.bind(a),
            a.vj[b.vh] = c);
        return c
    }
    class hb {
        constructor() {
            this.Rb = -1;
            this.hb = new T(m.j.ki.v());
            this.Wc = new ic;
            this.f = x.Ia(hb.O);
            let a = x.Ba(this.f);
            this.Tb = new Ob(a.get("red-score"), 0);
            this.Ob = new Ob(a.get("blue-score"), 0);
            x.replaceWith(a.get("timer"), this.Wc.f);
            x.replaceWith(a.get("canvas"), this.hb.oa)
        }
        A(a) {
            var b = m.j.ki.v();
            if (this.hb.Hp != b) {
                let c = this.hb.oa;
                this.hb = new T(b);
                x.replaceWith(c, this.hb.oa)
            }
            b = a.M;
            null == b ? this.f.hidden = !0 : (this.f.hidden = !1,
                this.Wc.gs(60 * a.Ga),
                this.Wc.fs(b.Nc | 0),
                this.Ob.set(b.Ob),
                this.Tb.set(b.Tb),
                this.hb.Rc(a, this.Rb))
        }
    }
    class Pb {
        constructor(a) {
            this.rd = null;
            this.pr = 1E4;
            this.Ed = !0;
            a.nk();
            this.La = a.La;
            this.cd = a.cd;
            this.Ae = a.Ae;
            this.rd = a.rd;
            this.Xm = window.performance.now();
            let b = null
                , c = this;
            b = function () {
                var e = c.pr - c.ps();
                0 >= e ? c.la() : (window.clearTimeout(c.$m),
                    e = window.setTimeout(b, e + 1E3),
                    c.$m = e)
            }
                ;
            b();
            this.La.oniceconnectionstatechange = function () {
                let e = c.La.iceConnectionState;
                "closed" != e && "failed" != e || c.la()
            }
                ;
            a = 0;
            let d = this.cd;
            for (; a < d.length;) {
                let e = d[a];
                ++a;
                e.onmessage = function (f) {
                    c.Ed && (c.Xm = window.performance.now(),
                        null != c.zg && c.zg(f.data))
                }
                    ;
                e.onclose = function () {
                    c.la()
                }
            }
        }
        ps() {
            return window.performance.now() - this.Xm
        }
        Vb(a, b) {
            if (this.Ed) {
                var c = this.cd[a];
                0 != a && "open" != c.readyState && (c = this.cd[0]);
                if ("open" == c.readyState) {
                    a = b.Vg();
                    try {
                        c.send(a)
                    } catch (d) {
                        c = v.Mb(d).Fb(),
                            pa.console.log(c)
                    }
                }
            }
        }
        la() {
            window.clearTimeout(this.$m);
            this.Ed && (this.Ed = !1,
                this.La.close(),
                null != this.tf && this.tf())
        }
    }
    class ib {
        constructor(a) {
            this.Bk = !1;
            this.Pm = new Ba(u.Pa);
            this.dk = new Ba(u.Da);
            this.hm = new Ba(u.ja);
            this.f = x.Ia(ib.O);
            let b = x.Ba(this.f);
            this.lc = b.get("room-name");
            this.Sm = b.get("start-btn");
            this.Um = b.get("stop-btn");
            this.vi = b.get("pause-btn");
            this.bo = b.get("auto-btn");
            this.hl = b.get("lock-btn");
            this.rm = b.get("reset-all-btn");
            this.fm = b.get("rec-btn");
            let c = b.get("link-btn")
                , d = b.get("leave-btn")
                , e = b.get("rand-btn");
            this.Lf = b.get("time-limit-sel");
            this.Ef = b.get("score-limit-sel");
            this.Qm = b.get("stadium-name");
            this.Rm = b.get("stadium-pick");
            let f = this;
            this.Rm.onclick = function () {
                H.h(f.Iq)
            }
                ;
            this.di(b.get("red-list"), this.hm, a);
            this.di(b.get("blue-list"), this.dk, a);
            this.di(b.get("spec-list"), this.Pm, a);
            this.ol(this.Lf, this.nl());
            this.ol(this.Ef, this.nl());
            this.Lf.onchange = function () {
                D.h(f.Mq, f.Lf.selectedIndex)
            }
                ;
            this.Ef.onchange = function () {
                D.h(f.Eq, f.Ef.selectedIndex)
            }
                ;
            this.Sm.onclick = function () {
                H.h(f.Jq)
            }
                ;
            this.Um.onclick = function () {
                H.h(f.Kq)
            }
                ;
            this.vi.onclick = function () {
                H.h(f.xq)
            }
                ;
            this.bo.onclick = function () {
                H.h(f.nq)
            }
                ;
            this.hl.onclick = function () {
                D.h(f.Lq, !f.ii)
            }
                ;
            this.rm.onclick = function () {
                null != f.pe && (f.pe(u.Da),
                    f.pe(u.ja))
            }
                ;
            this.fm.onclick = function () {
                H.h(f.Bq)
            }
                ;
            c.onclick = function () {
                H.h(f.Hq)
            }
                ;
            d.onclick = function () {
                H.h(f.oe)
            }
                ;
            e.onclick = function () {
                H.h(f.Aq)
            }
                ;
            this.Uj(!1);
            this.Vj(!1)
        }
        di(a, b, c) {
            x.replaceWith(a, b.f);
            let d = this;
            b.Ag = function (e, f) {
                qa.h(d.Ag, e, f)
            }
                ;
            b.pe = function (e) {
                D.h(d.pe, e)
            }
                ;
            b.uq = function (e) {
                qa.h(d.Ag, c, e)
            }
                ;
            b.wf = function (e) {
                D.h(d.wf, e)
            }
        }
        nl() {
            let a = []
                , b = 0;
            for (; 15 > b;) {
                let c = b++;
                a.push(null == c ? "null" : "" + c)
            }
            return a
        }
        ol(a, b) {
            let c = 0;
            for (; c < b.length;) {
                let d = b[c++]
                    , e = window.document.createElement("option");
                e.textContent = d;
                a.appendChild(e)
            }
        }
        ds(a) {
            this.fm.classList.toggle("active", a)
        }
        A(a, b) {
            this.Fr != a.lc && (this.Fr = a.lc,
                this.lc.textContent = a.lc);
            b = null == b ? !1 : b.cb;
            this.Bk != b && (this.f.className = "room-view" + (b ? " admin" : ""),
                this.Bk = b);
            var c = !b || null != a.M;
            this.Lf.disabled = c;
            this.Ef.disabled = c;
            this.Rm.disabled = c;
            c = null != a.M;
            this.Sm.hidden = c;
            this.Um.hidden = !c;
            this.vi.hidden = !c;
            this.Lf.selectedIndex = a.Ga;
            this.Ef.selectedIndex = a.mb;
            this.Qm.textContent = a.U.D;
            this.Qm.classList.toggle("custom", !a.U.cf());
            let d = a.Bc;
            for (var e = this.hm, f = a.K, g = [], h = 0; h < f.length;) {
                var k = f[h];
                ++h;
                k.fa == u.ja && g.push(k)
            }
            e.A(g, d, c, b);
            e = this.dk;
            f = a.K;
            g = [];
            for (h = 0; h < f.length;)
                k = f[h],
                    ++h,
                    k.fa == u.Da && g.push(k);
            e.A(g, d, c, b);
            e = this.Pm;
            f = a.K;
            g = [];
            for (h = 0; h < f.length;)
                k = f[h],
                    ++h,
                    k.fa == u.Pa && g.push(k);
            e.A(g, d, c, b);
            this.rm.disabled = c;
            this.ii != a.Bc && this.Uj(a.Bc);
            c && (a = 120 == a.M.Ta,
                this.Ll != a && this.Vj(a))
        }
        Uj(a) {
            this.ii = a;
            this.hl.innerHTML = this.ii ? "<i class='icon-lock'></i>Unlock" : "<i class='icon-lock-open'></i>Lock"
        }
        Vj(a) {
            this.Ll = a;
            this.vi.innerHTML = "<i class='icon-pause'></i>" + (this.Ll ? "Resume (P)" : "Pause (P)")
        }
    }
    class x {
        static Ba(a) {
            let b = new Map
                , c = 0;
            for (a = a.querySelectorAll("[data-hook]"); c < a.length;) {
                let d = a[c++];
                b.set(d.getAttribute("data-hook"), d)
            }
            return b
        }
        static Ia(a, b) {
            null == b && (b = "div");
            b = window.document.createElement(b);
            b.innerHTML = a;
            return b.firstElementChild
        }
        static replaceWith(a, b) {
            a.parentElement.replaceChild(b, a)
        }
        static Qf(a) {
            let b = a.firstChild;
            for (; null != b;)
                a.removeChild(b),
                    b = a.firstChild
        }
    }
    class jc {
        constructor(a) {
            function b(d) {
                return new Promise(function (e) {
                    let f = a.file(d).asArrayBuffer();
                    c.c.decodeAudioData(f, e, function () {
                        e(null)
                    })
                }
                )
            }
            this.c = new AudioContext;
            this.qg = this.c.createGain();
            this.Fi();
            this.qg.connect(this.c.destination);
            let c = this;
            this.Zo = Promise.all([b("sounds/chat.wav").then(function (d) {
                return c.jk = d
            }), b("sounds/highlight.wav").then(function (d) {
                return c.Uk = d
            }), b("sounds/kick.wav").then(function (d) {
                return c.Kp = d
            }), b("sounds/goal.wav").then(function (d) {
                return c.qp = d
            }), b("sounds/join.wav").then(function (d) {
                return c.Ip = d
            }), b("sounds/leave.wav").then(function (d) {
                return c.Op = d
            }), b("sounds/crowd.ogg").then(function (d) {
                c.Po = d;
                c.tk = new kc(c.Po, c.c);
                c.tk.connect(c.qg)
            })])
        }
        sm() {
            this.c.resume()
        }
        md(a) {
            let b = this.c.createBufferSource();
            b.buffer = a;
            b.connect(this.qg);
            b.start()
        }
        Fi() {
            let a = m.j.Xi.v();
            m.j.ye.v() || (a = 0);
            this.qg.gain.value = a
        }
    }
    class lc {
        constructor() {
            function a(g) {
                return new ra(g, f, function (h) {
                    if (null == h)
                        return null;
                    try {
                        return la.Sh(h)
                    } catch (k) {
                        return null
                    }
                }
                    , function (h) {
                        if (null == h)
                            return null;
                        try {
                            return h.De()
                        } catch (k) {
                            return null
                        }
                    }
                )
            }
            function b(g, h) {
                return new ra(g, f, function (k) {
                    return null != k ? "0" != k : h
                }
                    , function (k) {
                        return k ? "1" : "0"
                    }
                )
            }
            function c(g, h) {
                return new ra(g, f, function (k) {
                    let l = h;
                    try {
                        null != k && (l = parseFloat(k))
                    } catch (n) { }
                    return l
                }
                    , function (k) {
                        return "" + k
                    }
                )
            }
            function d(g, h) {
                return new ra(g, f, function (k) {
                    let l = h;
                    try {
                        null != k && (l = Q.parseInt(k))
                    } catch (n) { }
                    return l
                }
                    , function (k) {
                        return "" + k
                    }
                )
            }
            function e(g, h, k) {
                return new ra(g, f, function (l) {
                    return null == l ? h : ha.Xc(l, k)
                }
                    , function (l) {
                        return l
                    }
                )
            }
            let f = Bc.rn();
            this.qe = e("player_name", "", 25);
            this.Rd = d("view_mode", -1);
            this.Qh = d("fps_limit", 0);
            this.zh = e("avatar", null, 2);
            e("rctoken", null, 1024);
            this.Wm = b("team_colors", !0);
            this.Vk = b("show_indicators", !0);
            this.Xi = c("sound_volume", 1);
            this.ye = b("sound_main", !0);
            this.Wi = b("sound_chat", !0);
            this.Om = b("sound_highlight", !0);
            this.Nm = b("sound_crowd", !0);
            this.Zj = e("player_auth_key", null, 1024);
            this.Ad = d("extrapolation", 0);
            this.Li = c("resolution_scale", 1);
            this.Lm = b("show_avatars", !0);
            this.lk = d("chat_height", 160);
            this.Gh = d("chat_focus_height", 140);
            this.Hh = c("chat_opacity", .8);
            this.kk = e("chat_bg_mode", "compact", 50);
            this.ki = b("low_latency_canvas", !0);
            this.$e = a("geo");
            this.af = a("geo_override");
            this.Jd = function () {
                return new ra("player_keys", f, function (g) {
                    if (null == g)
                        return sa.wk();
                    try {
                        return sa.Sh(g)
                    } catch (h) {
                        return sa.wk()
                    }
                }
                    , function (g) {
                        try {
                            return g.De()
                        } catch (h) {
                            return null
                        }
                    }
                )
            }()
        }
        Vh() {
            return null != this.af.v() ? this.af.v() : null != this.$e.v() ? this.$e.v() : new la
        }
    }
    class Cc {
        static xf(a) {
            let b = new mc("([^&=]+)=?([^&]*)", "g");
            a = a.substring(1);
            var c = 0;
            let d = new Map;
            for (; b.dt(a, c);) {
                c = b.yn(1);
                c = decodeURIComponent(c.split("+").join(" "));
                let e = b.yn(2);
                d.set(c, decodeURIComponent(e.split("+").join(" ")));
                c = b.et();
                c = c.Dj + c.bt
            }
            return d
        }
        static v() {
            return Cc.xf(window.top.location.search)
        }
    }
    class nc {
        constructor() { }
    }
    class ha {
        static Xc(a, b) {
            return a.length <= b ? a : O.substr(a, 0, b)
        }
        static Os(a) {
            let b = ""
                , c = 0
                , d = a.byteLength;
            for (; c < d;)
                b += Y.hh(a[c++], 2);
            return b
        }
    }
    class Qb {
        static parse(a) {
            a.F();
            let b = [];
            for (; 0 != a.s.byteLength - a.a;) {
                let c = a.se(a.Sb())
                    , d = a.cm(a.Sb());
                try {
                    let e = new Rb;
                    e.na(new J(new DataView(d), !1));
                    let f = new oc;
                    f.ke = e;
                    f.ba = c;
                    b.push(f)
                } catch (e) { }
            }
            return b
        }
        static Zs(a, b, c, d) {
            return Math.acos(Math.sin(a) * Math.sin(c) + Math.cos(a) * Math.cos(c) * Math.cos(b - d))
        }
        static vt(a, b) {
            let c = a.Jc;
            a = a.Mc;
            let d = 0;
            for (; d < b.length;) {
                let e = b[d];
                ++d;
                let f = e.ke;
                e.Ze = 6378 * Qb.Zs(.017453292519943295 * f.Jc, .017453292519943295 * f.Mc, .017453292519943295 * c, .017453292519943295 * a);
                isFinite(e.Ze) || (e.Ze = 22E3)
            }
        }
        static get() {
            return Z.v(m.Se + "api/list", "arraybuffer").then(function (a) {
                return Qb.parse(new J(new DataView(a), !1))
            })
        }
    }
    class Z {
        static pm(a, b, c, d, e) {
            return new Promise(function (f, g) {
                let h = new XMLHttpRequest;
                h.open(b, a);
                h.responseType = c;
                h.onload = function () {
                    200 <= h.status && 300 > h.status ? null != h.response ? f(h.response) : g(null) : g("status: " + h.status)
                }
                    ;
                h.onerror = function (k) {
                    g(k)
                }
                    ;
                null != e && h.setRequestHeader("Content-type", e);
                h.send(d)
            }
            )
        }
        static v(a, b) {
            return Z.pm(a, "GET", b, null)
        }
        static Ok(a) {
            return Z.v(a, "json").then(function (b) {
                let c = b.error;
                if (null != c)
                    throw v.B(c);
                return b.data
            })
        }
        static Xq(a, b, c) {
            return Z.pm(a, "POST", "json", b, c)
        }
        static Zl(a, b, c) {
            return Z.Xq(a, b, c).then(function (d) {
                let e = d.error;
                if (null != e)
                    throw v.B(e);
                return d.data
            })
        }
    }
    class pc {
        constructor(a) {
            this.sl = new qc(15);
            this.bi = 0;
            this.Qj = new Map;
            this.pp = new jb(100, 16);
            this.Lg = !1;
            this.zb = 0;
            this.ua = a;
            a = A.ka(8);
            a.u(Math.random());
            this.Ve = a.Wb()
        }
        Vb(a, b) {
            null == b && (b = 0);
            this.ua.Vb(b, a)
        }
    }
    class kb {
        constructor() {
            this.f = x.Ia(kb.O);
            let a = x.Ba(this.f)
                , b = this;
            a.get("cancel").onclick = function () {
                D.h(b.sb, !1)
            }
                ;
            a.get("leave").onclick = function () {
                D.h(b.sb, !0)
            }
        }
    }
    class J {
        constructor(a, b) {
            null == b && (b = !1);
            this.s = a;
            this.Ua = b;
            this.a = 0
        }
        lb(a) {
            null == a && (a = this.s.byteLength - this.a);
            if (this.a + a > this.s.byteLength)
                throw v.B("Read too much");
            let b = new Uint8Array(this.s.buffer, this.s.byteOffset + this.a, a);
            this.a += a;
            return b
        }
        cm(a) {
            let b = this.lb(a);
            a = new ArrayBuffer(a);
            (new Uint8Array(a)).set(b);
            return a
        }
        zf() {
            return this.s.getInt8(this.a++)
        }
        F() {
            return this.s.getUint8(this.a++)
        }
        Ci() {
            let a = this.s.getInt16(this.a, this.Ua);
            this.a += 2;
            return a
        }
        Sb() {
            let a = this.s.getUint16(this.a, this.Ua);
            this.a += 2;
            return a
        }
        N() {
            let a = this.s.getInt32(this.a, this.Ua);
            this.a += 4;
            return a
        }
        kb() {
            let a = this.s.getUint32(this.a, this.Ua);
            this.a += 4;
            return a
        }
        Bi() {
            let a = this.s.getFloat32(this.a, this.Ua);
            this.a += 4;
            return a
        }
        w() {
            let a = this.s.getFloat64(this.a, this.Ua);
            this.a += 8;
            return a
        }
        Bb() {
            let a = this.a, b = 0, c, d = 0;
            do
                c = this.s.getUint8(a + b),
                    5 > b && (d |= (c & 127) << 7 * b >>> 0),
                    ++b;
            while (0 != (c & 128));
            this.a += b;
            return d | 0
        }
        se(a) {
            let b = this.a, c, d = "";
            for (a = b + a; b < a;)
                c = J.Ro(this.s, b),
                    b += c.length,
                    d += String.fromCodePoint(c.char);
            if (b != a)
                throw v.B("Actual string length differs from the specified: " + (b - a) + " bytes");
            this.a = b;
            return d
        }
        Ab() {
            let a = this.Bb();
            return 0 >= a ? null : this.se(a - 1)
        }
        kc() {
            return this.se(this.Bb())
        }
        em() {
            return this.se(this.F())
        }
        Jg() {
            let a = this.kc();
            return JSON.parse(a)
        }
        static Ro(a, b) {
            var c = a.getUint8(b);
            let d, e, f, g, h = b;
            if (0 == (c & 128))
                ++b;
            else if (192 == (c & 224))
                d = a.getUint8(b + 1),
                    c = (c & 31) << 6 | d & 63,
                    b += 2;
            else if (224 == (c & 240))
                d = a.getUint8(b + 1),
                    e = a.getUint8(b + 2),
                    c = (c & 15) << 12 | (d & 63) << 6 | e & 63,
                    b += 3;
            else if (240 == (c & 248))
                d = a.getUint8(b + 1),
                    e = a.getUint8(b + 2),
                    f = a.getUint8(b + 3),
                    c = (c & 7) << 18 | (d & 63) << 12 | (e & 63) << 6 | f & 63,
                    b += 4;
            else if (248 == (c & 252))
                d = a.getUint8(b + 1),
                    e = a.getUint8(b + 2),
                    f = a.getUint8(b + 3),
                    g = a.getUint8(b + 4),
                    c = (c & 3) << 24 | (d & 63) << 18 | (e & 63) << 12 | (f & 63) << 6 | g & 63,
                    b += 5;
            else if (252 == (c & 254))
                d = a.getUint8(b + 1),
                    e = a.getUint8(b + 2),
                    f = a.getUint8(b + 3),
                    g = a.getUint8(b + 4),
                    a = a.getUint8(b + 5),
                    c = (c & 1) << 30 | (d & 63) << 24 | (e & 63) << 18 | (f & 63) << 12 | (g & 63) << 6 | a & 63,
                    b += 6;
            else
                throw v.B("Cannot decode UTF8 character at offset " + b + ": charCode (" + c + ") is invalid");
            return {
                char: c,
                length: b - h
            }
        }
    }
    class Sb {
        constructor() {
            this.ff = 0;
            this.V = 15;
            this.C = 0;
            this.ra = new P(0, 0);
            this.ca = this.o = .5;
            this.Ea = .96;
            this.Qe = .1;
            this.gf = .07;
            this.hf = .96;
            this.ef = 5
        }
        ha(a) {
            a.u(this.o);
            a.u(this.ca);
            a.u(this.Ea);
            a.u(this.Qe);
            a.u(this.gf);
            a.u(this.hf);
            a.u(this.ef);
            let b = this.ra;
            a.u(b.x);
            a.u(b.y);
            a.R(this.C);
            a.u(this.V);
            a.u(this.ff)
        }
        na(a) {
            this.o = a.w();
            this.ca = a.w();
            this.Ea = a.w();
            this.Qe = a.w();
            this.gf = a.w();
            this.hf = a.w();
            this.ef = a.w();
            let b = this.ra;
            b.x = a.w();
            b.y = a.w();
            this.C = a.N();
            this.V = a.w();
            this.ff = a.w()
        }
    }
    class ta {
        constructor() {
            this.jc = -1;
            this.ic = null;
            this.Jl = 0;
            this.i = this.C = 63;
            this.ek = 0;
            this.S = 16777215;
            this.Ea = .99;
            this.ca = 1;
            this.o = .5;
            this.V = 10;
            this.ra = new P(0, 0);
            this.G = new P(0, 0);
            this.a = new P(0, 0)
        }
        ha(a) {
            var b = this.a;
            a.u(b.x);
            a.u(b.y);
            b = this.G;
            a.u(b.x);
            a.u(b.y);
            b = this.ra;
            a.u(b.x);
            a.u(b.y);
            a.u(this.V);
            a.u(this.o);
            a.u(this.ca);
            a.u(this.Ea);
            a.tb(this.S);
            a.R(this.i);
            a.R(this.C)
        }
        na(a) {
            var b = this.a;
            b.x = a.w();
            b.y = a.w();
            b = this.G;
            b.x = a.w();
            b.y = a.w();
            b = this.ra;
            b.x = a.w();
            b.y = a.w();
            this.V = a.w();
            this.o = a.w();
            this.ca = a.w();
            this.Ea = a.w();
            this.S = a.kb();
            this.i = a.N();
            this.C = a.N()
        }
        yo(a) {
            var b = this.a
                , c = a.a
                , d = b.x - c.x;
            b = b.y - c.y;
            var e = a.V + this.V
                , f = d * d + b * b;
            if (0 < f && f <= e * e) {
                f = Math.sqrt(f);
                d /= f;
                b /= f;
                c = this.ca / (this.ca + a.ca);
                e -= f;
                f = e * c;
                var g = this.a
                    , h = this.a;
                g.x = h.x + d * f;
                g.y = h.y + b * f;
                h = g = a.a;
                e -= f;
                g.x = h.x - d * e;
                g.y = h.y - b * e;
                e = this.G;
                f = a.G;
                e = d * (e.x - f.x) + b * (e.y - f.y);
                0 > e && (e *= this.o * a.o + 1,
                    c *= e,
                    g = f = this.G,
                    f.x = g.x - d * c,
                    f.y = g.y - b * c,
                    a = f = a.G,
                    c = e - c,
                    f.x = a.x + d * c,
                    f.y = a.y + b * c)
            }
        }
        zo(a) {
            if (0 != 0 * a.vb) {
                var b = a.$.a;
                var c = a.ea.a;
                var d = c.x - b.x;
                var e = c.y - b.y
                    , f = this.a;
                var g = f.x - c.x;
                c = f.y - c.y;
                f = this.a;
                if (0 >= (f.x - b.x) * d + (f.y - b.y) * e || 0 <= g * d + c * e)
                    return;
                d = a.ya;
                b = d.x;
                d = d.y;
                g = b * g + d * c
            } else {
                d = a.ge;
                g = this.a;
                b = g.x - d.x;
                d = g.y - d.y;
                g = a.Sg;
                c = a.Tg;
                if ((0 < g.x * b + g.y * d && 0 < c.x * b + c.y * d) == 0 >= a.vb)
                    return;
                c = Math.sqrt(b * b + d * d);
                if (0 == c)
                    return;
                g = c - a.uk;
                b /= c;
                d /= c
            }
            c = a.Hc;
            if (0 == c)
                0 > g && (g = -g,
                    b = -b,
                    d = -d);
            else if (0 > c && (c = -c,
                g = -g,
                b = -b,
                d = -d),
                g < -c)
                return;
            g >= this.V || (g = this.V - g,
                e = c = this.a,
                c.x = e.x + b * g,
                c.y = e.y + d * g,
                g = this.G,
                g = b * g.x + d * g.y,
                0 > g && (g *= this.o * a.o + 1,
                    c = a = this.G,
                    a.x = c.x - b * g,
                    a.y = c.y - d * g))
        }
        vc() {
            let a = ua.Dc
                , b = this.ic;
            this.jc != a && (null == b && (this.ic = b = new ta),
                this.jc = a,
                ta.zd(b, this));
            return b
        }
        static zd(a, b) {
            a.V = b.V;
            a.o = b.o;
            a.ca = b.ca;
            a.Ea = b.Ea;
            a.S = b.S;
            a.ek = b.ek;
            a.i = b.i;
            a.C = b.C;
            var c = a.a
                , d = b.a;
            c.x = d.x;
            c.y = d.y;
            c = a.G;
            d = b.G;
            c.x = d.x;
            c.y = d.y;
            a = a.ra;
            b = b.ra;
            a.x = b.x;
            a.y = b.y
        }
    }
    class Tb {
        constructor(a) {
            this.$b = a.slice()
        }
        eval(a) {
            var b = this.$b.length - 1;
            if (a <= this.$b[0])
                return this.$b[1];
            if (a >= this.$b[b])
                return this.$b[b - 2];
            var c = 0;
            b = b / 5 | 0;
            do {
                var d = b + c >>> 1;
                a > this.$b[5 * d] ? c = d + 1 : b = d - 1
            } while (c <= b);
            c = 5 * b;
            b = this.$b[c];
            a = (a - b) / (this.$b[c + 5] - b);
            b = a * a;
            d = b * a;
            return (2 * d - 3 * b + 1) * this.$b[c + 1] + (d - 2 * b + a) * this.$b[c + 2] + (-2 * d + 3 * b) * this.$b[c + 3] + (d - b) * this.$b[c + 4]
        }
    }
    class da {
        constructor(a, b) {
            let c = []
                , d = 0;
            for (; d < a.length;)
                c.push(this.bq(a[d++], b));
            this.kf = c
        }
        hp() {
            return 2.31 + .1155 * (this.kf.length - 1)
        }
        Rc(a, b) {
            b /= 2.31;
            let c = 0;
            a.imageSmoothingEnabled = !0;
            let d = 0
                , e = this.kf;
            for (; d < e.length;) {
                let g = e[d];
                ++d;
                var f = b - .05 * c;
                let h = da.Nn.eval(f)
                    , k = 35 * -(this.kf.length - 1) + 70 * c;
                f = 180 * da.On.eval(f);
                a.globalAlpha = h;
                a.drawImage(g, f * (0 != (c & 1) ? -1 : 1) - .5 * g.width, k - .5 * g.height);
                a.globalAlpha = 1;
                ++c
            }
            a.imageSmoothingEnabled = !1
        }
        Er(a) {
            let b = 0;
            a.imageSmoothingEnabled = !0;
            let c = 0
                , d = this.kf;
            for (; c < d.length;) {
                let e = d[c];
                ++c;
                a.drawImage(e, .5 * -e.width, 35 * -(this.kf.length - 1) + 70 * b - .5 * e.height);
                ++b
            }
            a.imageSmoothingEnabled = !1
        }
        nc(a) {
            return "rgba(" + [(a & 16711680) >>> 16, (a & 65280) >>> 8, a & 255].join() + ",255)"
        }
        bq(a, b) {
            let c = window.document.createElement("canvas")
                , d = c.getContext("2d", null);
            d.font = "900 70px 'Arial Black','Arial Bold',Gadget,sans-serif";
            c.width = Math.ceil(d.measureText(a).width) + 7;
            c.height = 90;
            d.font = "900 70px 'Arial Black','Arial Bold',Gadget,sans-serif";
            d.textAlign = "left";
            d.textBaseline = "middle";
            d.fillStyle = "black";
            d.fillText(a, 7, 52);
            d.fillStyle = this.nc(b);
            d.fillText(a, 0, 45);
            return c
        }
    }
    class lb {
        constructor() {
            this.Be = u.Pa;
            this.ea = new P(0, 0);
            this.$ = new P(0, 0)
        }
        ha(a) {
            var b = this.$;
            a.u(b.x);
            a.u(b.y);
            b = this.ea;
            a.u(b.x);
            a.u(b.y);
            a.m(this.Be.ba)
        }
        na(a) {
            var b = this.$;
            b.x = a.w();
            b.y = a.w();
            b = this.ea;
            b.x = a.w();
            b.y = a.w();
            a = a.zf();
            this.Be = 1 == a ? u.ja : 2 == a ? u.Da : u.Pa
        }
    }
    class mb {
        constructor() {
            this.nb = null;
            this.f = x.Ia(mb.O);
            let a = x.Ba(this.f)
                , b = this;
            a.get("cancel").onclick = function () {
                H.h(b.si)
            }
                ;
            this.wi = a.get("pick");
            this.yk = a.get("delete");
            this.Mk = a.get("export");
            let c = a.get("list")
                , d = a.get("file");
            this.Xg();
            this.wi.onclick = function () {
                null != b.nb && b.nb.Yd().then(function (e) {
                    D.h(b.Cg, e)
                })
            }
                ;
            this.yk.onclick = function () {
                if (null != b.nb) {
                    var e = b.nb.nn;
                    null != e && (b.nb.Ma.remove(),
                        b.nb = null,
                        e(),
                        b.Xg())
                }
            }
                ;
            this.Mk.onclick = function () {
                null != b.nb && b.nb.Yd().then(function (e) {
                    Ub.Nr(e.De(), e.D + ".hbs")
                })
            }
                ;
            this.zi(c);
            this.bm = nb.mi(c);
            window.setTimeout(function () {
                b.bm.update()
            }, 0);
            d.onchange = function () {
                var e = d.files;
                if (!(1 > e.length)) {
                    e = e.item(0);
                    var f = new FileReader;
                    f.onload = function () {
                        try {
                            var g = f.result;
                            let h = new q;
                            h.fl(g);
                            D.h(b.Cg, h)
                        } catch (h) {
                            g = v.Mb(h).Fb(),
                                g instanceof SyntaxError ? D.h(b.ui, "SyntaxError in line: " + Q.Je(g.lineNumber)) : g instanceof Sa ? D.h(b.ui, g.gq) : D.h(b.ui, "Error loading stadium file.")
                        }
                    }
                        ;
                    f.readAsText(e)
                }
            }
        }
        Xg() {
            this.wi.disabled = null == this.nb;
            this.yk.disabled = null == this.nb || null == this.nb.nn;
            this.Mk.disabled = null == this.nb
        }
        ml(a, b, c) {
            let d = window.document.createElement("div");
            d.textContent = a;
            d.className = "elem";
            null != c && d.classList.add("custom");
            let e = {
                Ma: d,
                Yd: b,
                nn: c
            }
                , f = this;
            d.onclick = function () {
                null != f.nb && f.nb.Ma.classList.remove("selected");
                f.nb = e;
                d.classList.add("selected");
                f.Xg()
            }
                ;
            d.ondblclick = function () {
                f.nb = e;
                f.Xg();
                return f.wi.onclick()
            }
                ;
            return d
        }
        zi(a) {
            let b = q.Uh()
                , c = 0;
            for (; c < b.length;) {
                let e = b[c];
                ++c;
                a.appendChild(this.ml(e.D, function () {
                    return Promise.resolve(e)
                }, null))
            }
            let d = this;
            ob.getAll().then(function (e) {
                let f = 0;
                for (; f < e.length;) {
                    let g = e[f];
                    ++f;
                    let h = g.id;
                    a.appendChild(d.ml(g.name, function () {
                        return ob.get(h)
                    }, function () {
                        return ob.delete(h)
                    }))
                }
                d.bm.update()
            })
        }
    }
    class Dc {
    }
    class pb {
        constructor(a) {
            this.f = x.Ia(pb.O);
            var b = x.Ba(this.f);
            this.Eh = b.get("cancel");
            this.sk = b.get("create");
            this.pf = b.get("name");
            this.Kl = b.get("pass");
            this.pi = b.get("max-pl");
            this.en = b.get("unlisted");
            this.pf.maxLength = 40;
            this.pf.value = a;
            let c = this;
            this.pf.oninput = function () {
                c.A()
            }
                ;
            this.Kl.maxLength = 30;
            this.en.onclick = function () {
                c.Yj(!c.fn)
            }
                ;
            this.Eh.onclick = function () {
                H.h(c.si)
            }
                ;
            this.sk.onclick = function () {
                if (c.Ic()) {
                    let d = c.Kl.value;
                    "" == d && (d = null);
                    D.h(c.tq, {
                        name: c.pf.value,
                        password: d,
                        ft: c.pi.selectedIndex + 2,
                        xt: c.fn
                    })
                }
            }
                ;
            for (a = 2; 21 > a;)
                b = window.document.createElement("option"),
                    b.textContent = "" + a++,
                    this.pi.appendChild(b);
            this.pi.selectedIndex = 10;
            this.Yj(!1);
            this.A()
        }
        Yj(a) {
            this.fn = a;
            this.en.textContent = "Show in room list: " + (a ? "No" : "Yes")
        }
        Ic() {
            let a = this.pf.value;
            return 40 >= a.length ? 0 < a.length : !1
        }
        A() {
            this.sk.disabled = !this.Ic()
        }
    }
    class ra {
        constructor(a, b, c, d) {
            this.D = a;
            this.Is = d;
            this.li = b;
            d = null;
            null != b && (d = b.getItem(a));
            this.jn = c(d)
        }
        v() {
            return this.jn
        }
        ia(a) {
            this.jn = a;
            if (null != this.li)
                try {
                    let b = this.Is(a);
                    null == b ? this.li.removeItem(this.D) : this.li.setItem(this.D, b)
                } catch (b) { }
        }
    }
    class qb {
        constructor(a, b, c, d) {
            this.Ah = new Set;
            this.Yf = new Set;
            this.Mg = this.Cf = this.Dm = !1;
            this.Tc = null;
            this.Ff = this.ba = "";
            this.Lr = 5E4;
            this.Kr = 1E4;
            this.xd = new Map;
            this.ls = a;
            this.kg = b;
            this.ro = c;
            this.Ff = d;
            null == this.Ff && (this.Ff = "");
            this.Zi()
        }
        la() {
            window.clearTimeout(this.tm);
            window.clearTimeout(this.ve);
            this.ve = null;
            window.clearInterval(this.Ol);
            this.aa.onmessage = null;
            this.aa.onerror = null;
            this.aa.onclose = null;
            this.aa.onopen = null;
            this.aa.close();
            this.aa = null;
            this.Lk()
        }
        Ui(a) {
            if (null != this.Tc || null != a) {
                if (null != this.Tc && null != a && this.Tc.byteLength == a.byteLength) {
                    let c = new Uint8Array(this.Tc)
                        , d = new Uint8Array(a)
                        , e = !1
                        , f = 0
                        , g = this.Tc.byteLength;
                    for (; f < g;) {
                        let h = f++;
                        if (c[h] != d[h]) {
                            e = !0;
                            break
                        }
                    }
                    if (!e)
                        return
                }
                this.Tc = a.slice(0);
                this.Mg = !0;
                var b = this;
                null != this.aa && 1 == this.aa.readyState && null == this.ve && (this.Pi(),
                    this.ve = window.setTimeout(function () {
                        b.ve = null;
                        1 == b.aa.readyState && b.Mg && b.Pi()
                    }, 1E4))
            }
        }
        Ti(a) {
            function b() {
                null != c.aa && 1 == c.aa.readyState && c.Cf != c.Dm && c.Cm();
                c.qm = null
            }
            this.Cf = a;
            let c = this;
            null == this.qm && (b(),
                this.qm = window.setTimeout(b, 1E3))
        }
        Zi(a) {
            function b(e) {
                e = e.sitekey;
                if (null == e)
                    throw v.B(null);
                null != d.vf && d.vf(e, function (f) {
                    d.Zi(f)
                })
            }
            function c(e) {
                let f = e.url;
                if (null == f)
                    throw v.B(null);
                e = e.token;
                if (null == e)
                    throw v.B(null);
                d.aa = new WebSocket(f + "?token=" + e);
                d.aa.binaryType = "arraybuffer";
                d.aa.onopen = function () {
                    d.Ap()
                }
                    ;
                d.aa.onclose = function (g) {
                    d.Wh(4001 != g.code)
                }
                    ;
                d.aa.onerror = function () {
                    d.Wh(!0)
                }
                    ;
                d.aa.onmessage = M(d, d.$h)
            }
            null == a && (a = "");
            let d = this;
            Z.Zl(this.ls, "token=" + this.Ff + "&rcr=" + a, Z.Mj).then(function (e) {
                switch (e.action) {
                    case "connect":
                        c(e);
                        break;
                    case "recaptcha":
                        b(e)
                }
            }).catch(function () {
                d.Wh(!0)
            })
        }
        Ap() {
            null != this.Tc && this.Pi();
            0 != this.Cf && this.Cm();
            let a = this;
            this.Ol = window.setInterval(function () {
                a.Oi()
            }, 4E4)
        }
        $h(a) {
            a = new J(new DataView(a.data), !1);
            switch (a.F()) {
                case 1:
                    this.Zh(a);
                    break;
                case 4:
                    this.Yh(a);
                    break;
                case 5:
                    this.vp(a);
                    break;
                case 6:
                    this.yp(a)
            }
        }
        Zh(a) {
            let b = a.kb(), c = ha.Os(a.lb(a.F())), d, e, f;
            try {
                var g = Ta.mn(a.lb(), Kc);
                a = new J(new DataView(g.buffer, g.byteOffset, g.byteLength), !1);
                d = 0 != a.F();
                e = a.kc();
                let h = a.Jg();
                g = [];
                let k = 0;
                for (; k < h.length;)
                    g.push(new RTCIceCandidate(h[k++]));
                f = g
            } catch (h) {
                this.Hf(b, 0);
                return
            }
            this.zp(b, c, e, f, a, d)
        }
        zp(a, b, c, d, e, f) {
            if (16 <= this.xd.size)
                this.Hf(a, 4104);
            else if (this.Ah.has(b))
                this.Hf(a, 4102);
            else {
                for (var g = [], h = 0; h < d.length;) {
                    let r = qb.Qk(d[h++]);
                    if (null != r) {
                        if (this.Yf.has(r)) {
                            this.Hf(a, 4102);
                            return
                        }
                        g.push(r)
                    }
                }
                if (null != this.rk && (h = new J(e.s),
                    h.a = e.a,
                    e = this.rk(b, h),
                    1 == e.qb)) {
                    this.Hf(a, e.reason);
                    return
                }
                var k = new Ca(a, this.kg, this.ro);
                f && (k.xk = 2500);
                k.Ae = g;
                k.rd = b;
                this.xd.set(a, k);
                var l = this
                    , n = function () {
                        l.Uc(0, k, null);
                        l.xd.delete(k.ba)
                    };
                k.kd = n;
                k.Hd = function () {
                    l.xd.delete(k.ba);
                    l.Uc(0, k, null);
                    null != l.Bl && l.Bl(new Pb(k))
                }
                    ;
                k.bj();
                (async function () {
                    try {
                        let r = await k.Lo(new RTCSessionDescription({
                            sdp: c,
                            type: "offer"
                        }), d);
                        l.Qi(k, r, k.ig, null);
                        k.jg.then(function () {
                            l.Uc(0, k, null)
                        });
                        k.xg = function (t) {
                            l.Ni(k, t)
                        }
                    } catch (r) {
                        n()
                    }
                }
                )()
            }
        }
        Yh(a) {
            let b = a.kb(), c;
            try {
                let d = Ta.mn(a.lb(), Kc);
                a = new J(new DataView(d.buffer, d.byteOffset, d.byteLength), !1);
                c = new RTCIceCandidate(a.Jg())
            } catch (d) {
                return
            }
            this.up(b, c)
        }
        up(a, b) {
            a = this.xd.get(a);
            if (null != a) {
                let c = qb.Qk(b);
                if (null != c && (a.Ae.push(c),
                    this.Yf.has(c)))
                    return;
                a.Rj(b)
            }
        }
        vp(a) {
            this.ba = a.se(a.F());
            null != this.yg && this.yg(this.ba)
        }
        yp(a) {
            this.Ff = a.se(a.s.byteLength - a.a)
        }
        Uc(a, b, c) {
            if (!b.Hl) {
                0 == a && (b.Hl = !0);
                var d = b.ba;
                b = A.ka(32, !1);
                b.m(a);
                b.tb(d);
                null != c && (a = pako.deflateRaw(c.Wb()),
                    b.Lb(a));
                this.aa.send(b.Qd())
            }
        }
        Hf(a, b) {
            let c = A.ka(16, !1);
            c.m(0);
            c.tb(a);
            c.Xb(b);
            this.aa.send(c.Qd())
        }
        Oi() {
            let a = A.ka(1, !1);
            a.m(8);
            this.aa.send(a.Qd())
        }
        Pi() {
            this.Mg = !1;
            let a = A.ka(256, !1);
            a.m(7);
            null != this.Tc && a.Yg(this.Tc);
            this.aa.send(a.Qd())
        }
        Cm() {
            let a = A.ka(2, !1);
            a.m(9);
            a.m(this.Cf ? 1 : 0);
            this.aa.send(a.Qd());
            this.Dm = this.Cf
        }
        Qi(a, b, c, d) {
            let e = A.ka(32, !1);
            e.oc(b.sdp);
            e.Zg(c);
            null != d && e.Lb(d.Wb());
            this.Uc(1, a, e)
        }
        Ni(a, b) {
            let c = A.ka(32, !1);
            c.Zg(b);
            this.Uc(4, a, c)
        }
        Lk() {
            let a = this.xd.values()
                , b = a.next();
            for (; !b.done;) {
                let c = b.value;
                b = a.next();
                c.la()
            }
            this.xd.clear()
        }
        Wh(a) {
            this.Lk();
            window.clearTimeout(this.ve);
            this.ve = null;
            this.Mg = !1;
            window.clearInterval(this.Ol);
            window.clearTimeout(this.tm);
            let b = this;
            a && (this.tm = window.setTimeout(function () {
                b.Zi()
            }, this.Kr + Math.random() * this.Lr | 0))
        }
        fo(a) {
            let b = 0
                , c = a.Ae;
            for (; b < c.length;)
                this.Yf.add(c[b++]);
            null != a.rd && this.Ah.add(a.rd);
            return {
                Gt: a.Ae,
                Et: a.rd
            }
        }
        de() {
            this.Yf.clear();
            this.Ah.clear()
        }
        static Qk(a) {
            try {
                let b = Lc.xf(a.candidate);
                if ("srflx" == b.xs)
                    return b.Fp
            } catch (b) { }
            return null
        }
    }
    class Ec {
        static Zm(a, b) {
            return new Promise(function (c, d) {
                let e = window.setTimeout(function () {
                    d("Timed out")
                }, b);
                a.then(function (f) {
                    window.clearTimeout(e);
                    c(f)
                }, function (f) {
                    window.clearTimeout(e);
                    d(f)
                })
            }
            )
        }
    }
    class rc {
        static h(a, b, c, d) {
            null != a && a(b, c, d)
        }
    }
    class rb {
        constructor() {
            this.f = x.Ia(rb.O);
            let a = x.Ba(this.f);
            this.Db = a.get("input");
            this.rf = a.get("ok");
            let b = this;
            a.get("cancel").onclick = function () {
                null != b.Wa && b.Wa(null)
            }
                ;
            this.Db.maxLength = 30;
            this.Db.oninput = function () {
                b.A()
            }
                ;
            this.Db.onkeydown = function (c) {
                13 == c.keyCode && b.Ic() && null != b.Wa && b.Wa(b.Db.value)
            }
                ;
            this.rf.onclick = function () {
                b.Ic() && null != b.Wa && b.Wa(b.Db.value)
            }
                ;
            this.A()
        }
        Ic() {
            let a = this.Db.value;
            return 30 >= a.length ? 0 < a.length : !1
        }
        A() {
            this.rf.disabled = !this.Ic()
        }
    }
    class Ua {
        constructor(a, b) {
            this.f = x.Ia(Ua.O);
            let c = x.Ba(this.f);
            this.kq = c.get("ok");
            let d = this;
            this.kq.onclick = function () {
                H.h(d.Wa)
            }
                ;
            this.nm = c.get("replay");
            let e = null != b;
            this.nm.hidden = !e;
            e && (this.nm.onclick = function () {
                Da.xm(b)
            }
            );
            c.get("reason").textContent = a
        }
    }
    class O {
        static sj(a, b) {
            a = a.charCodeAt(b);
            if (a == a)
                return a
        }
        static substr(a, b, c) {
            if (null == c)
                c = a.length;
            else if (0 > c)
                if (0 == b)
                    c = a.length + c;
                else
                    return "";
            return a.substr(b, c)
        }
        static remove(a, b) {
            b = a.indexOf(b);
            if (-1 == b)
                return !1;
            a.splice(b, 1);
            return !0
        }
        static now() {
            return Date.now()
        }
    }
    class Y {
        static at(a, b) {
            a = O.sj(a, b);
            return 8 < a && 14 > a ? !0 : 32 == a
        }
        static ut(a) {
            let b = a.length
                , c = 0;
            for (; c < b && Y.at(a, b - c - 1);)
                ++c;
            return 0 < c ? O.substr(a, 0, b - c) : a
        }
        static Of(a) {
            var b;
            let c = "";
            for (b = 2 - a.length; c.length < b;)
                c += "0";
            return c + (null == a ? "null" : "" + a)
        }
        static replace(a, b, c) {
            return a.split(b).join(c)
        }
        static hh(a, b) {
            let c = "";
            do
                c = "0123456789ABCDEF".charAt(a & 15) + c,
                    a >>>= 4;
            while (0 < a);
            if (null != b)
                for (; c.length < b;)
                    c = "0" + c;
            return c
        }
    }
    class P {
        constructor(a, b) {
            this.x = a;
            this.y = b
        }
    }
    class ma {
        constructor(a) {
            function b(y) {
                let F = window.document.createElement("div");
                F.className = "inputrow";
                var K = window.document.createElement("div");
                K.textContent = y;
                F.appendChild(K);
                K = sb.mp(y);
                let ea = 0;
                for (; ea < K.length;) {
                    let U = K[ea];
                    ++ea;
                    let sc = window.document.createElement("div");
                    var R = U;
                    U.startsWith("Key") && (R = O.substr(U, 3, null));
                    sc.textContent = R;
                    F.appendChild(sc);
                    R = window.document.createElement("i");
                    R.className = "icon-cancel";
                    R.onclick = function () {
                        sb.ur(U);
                        m.j.Jd.ia(sb);
                        sc.remove()
                    }
                        ;
                    sc.appendChild(R)
                }
                K = window.document.createElement("i");
                K.className = "icon-plus";
                F.appendChild(K);
                K.onclick = function () {
                    tc.classList.toggle("show", !0);
                    tc.focus();
                    tc.onkeydown = function (U) {
                        tc.classList.toggle("show", !1);
                        U.stopPropagation();
                        U = U.code;
                        null == sb.v(U) && (sb.Qa(U, y),
                            m.j.Jd.ia(sb),
                            Fc())
                    }
                }
                    ;
                return F
            }
            function c(y, F, K) {
                y = l.get(y);
                if (null == K)
                    y.hidden = !0;
                else {
                    y.innerHTML = F + ": <div class='flagico'></div> <span></span>";
                    F = y.querySelector(".flagico");
                    y = y.querySelector("span");
                    try {
                        F.classList.add("f-" + K.ub)
                    } catch (ea) { }
                    y.textContent = K.ub.toUpperCase()
                }
            }
            function d() {
                let y = m.j.Gh.v();
                L.textContent = "" + y;
                N.value = "" + y
            }
            function e() {
                let y = m.j.Hh.v();
                t.textContent = "" + y;
                z.value = "" + y
            }
            function f(y, F, K, ea) {
                let R = l.get(y);
                y = F.v();
                R.selectedIndex = ea(y);
                R.onchange = function () {
                    F.ia(K(R.selectedIndex))
                }
            }
            function g(y, F, K) {
                function ea(U) {
                    R.classList.toggle("icon-ok", U);
                    R.classList.toggle("icon-cancel", !U)
                }
                y = l.get(y);
                y.classList.add("toggle");
                let R = window.document.createElement("i");
                R.classList.add("icon-ok");
                y.insertBefore(R, y.firstChild);
                y.onclick = function () {
                    let U = !F.v();
                    F.ia(U);
                    ea(U);
                    null != K && K(U)
                }
                    ;
                ea(F.v())
            }
            function h(y) {
                let F = {
                    ln: l.get(y + "btn"),
                    ph: l.get(y + "sec")
                };
                n.push(F);
                F.ln.onclick = function () {
                    k(F)
                }
            }
            function k(y) {
                let F = 0
                    , K = 0;
                for (; K < n.length;) {
                    let ea = n[K];
                    ++K;
                    let R = ea == y;
                    R && (ma.zm = F);
                    ea.ph.classList.toggle("selected", R);
                    ea.ln.classList.toggle("selected", R);
                    ++F
                }
            }
            null == a && (a = !1);
            this.f = x.Ia(ma.O);
            let l = x.Ba(this.f);
            this.wd = l.get("close");
            let n = [];
            h("sound");
            h("video");
            h("misc");
            h("input");
            k(n[ma.zm]);
            g("tsound-main", m.j.ye, function () {
                m.Ra.Fi()
            });
            g("tsound-chat", m.j.Wi);
            g("tsound-highlight", m.j.Om);
            g("tsound-crowd", m.j.Nm);
            f("viewmode", m.j.Rd, function (y) {
                return y - 1
            }, function (y) {
                return y + 1
            });
            f("fps", m.j.Qh, function (y) {
                return y
            }, function (y) {
                return y
            });
            let r = [1, .75, .5, .25];
            f("resscale", m.j.Li, function (y) {
                return r[y]
            }, function (y) {
                let F = 0
                    , K = r.length - 1;
                for (; F < K && !(r[F] <= y);)
                    ++F;
                return F
            });
            g("tvideo-lowlatency", m.j.ki);
            g("tvideo-teamcol", m.j.Wm);
            g("tvideo-showindicators", m.j.Vk);
            g("tvideo-showavatars", m.j.Lm);
            let t = l.get("chatopacity-value")
                , z = l.get("chatopacity-range");
            e();
            z.oninput = function () {
                m.j.Hh.ia(parseFloat(z.value));
                e()
            }
                ;
            let L = l.get("chatfocusheight-value")
                , N = l.get("chatfocusheight-range");
            d();
            N.oninput = function () {
                m.j.Gh.ia(Q.parseInt(N.value));
                d()
            }
                ;
            f("chatbgmode", m.j.kk, function (y) {
                return 0 == y ? "full" : "compact"
            }, function (y) {
                return "full" == y ? 0 : 1
            });
            let tb = null
                , Mc = this;
            tb = function () {
                let y = m.j.af.v();
                c("loc", "Detected location", m.j.$e.v());
                c("loc-ovr", "Location override", y);
                let F = l.get("loc-ovr-btn");
                F.disabled = !a;
                null == y ? (F.textContent = "Override location",
                    F.onclick = function () {
                        H.h(Mc.oq)
                    }
                ) : (F.textContent = "Remove override",
                    F.onclick = function () {
                        m.j.af.ia(null);
                        tb()
                    }
                )
            }
                ;
            tb();
            let sb = m.j.Jd.v()
                , tc = l.get("presskey")
                , Fc = null
                , Va = l.get("inputsec");
            Fc = function () {
                x.Qf(Va);
                Va.appendChild(b("Up"));
                Va.appendChild(b("Down"));
                Va.appendChild(b("Left"));
                Va.appendChild(b("Right"));
                Va.appendChild(b("Kick"));
                Va.appendChild(b("ToggleChat"))
            }
                ;
            Fc();
            this.wd.onclick = function () {
                H.h(Mc.sb)
            }
        }
    }
    class aa {
        constructor() {
            this.jc = -1;
            this.ic = null;
            this.Tb = this.Ob = this.Nc = this.Ta = 0;
            this.le = u.ja;
            this.zc = this.Cb = 0;
            this.va = new Wa;
            this.Ga = 0;
            this.mb = 5;
            this.U = null
        }
        Ep(a) {
            this.Sa = a;
            this.mb = a.mb;
            this.Ga = a.Ga;
            this.U = a.U;
            this.va.L = this.U.L;
            this.va.sa = this.U.sa;
            this.va.X = this.U.X;
            this.va.rb = this.U.rb;
            a = 0;
            let b = this.U.H;
            for (; a < b.length;)
                this.va.H.push(b[a++].aq());
            this.al()
        }
        Xk(a) {
            if (a.fa == u.Pa)
                a.I = null;
            else {
                a.W = 0;
                var b = a.I;
                null == b && (b = new ta,
                    a.I = b,
                    this.va.H.push(b));
                var c = this.U.Kd;
                b.S = 0;
                b.V = c.V;
                b.ca = c.ca;
                b.Ea = c.Ea;
                b.o = c.o;
                b.i = 39;
                b.C = a.fa.C | c.C;
                var d = a.fa == u.ja ? this.U.Md : this.U.vd;
                0 == d.length ? (b.a.x = a.fa.Nh * this.U.bc,
                    b.a.y = 0) : (a = b.a,
                        d = d[d.length - 1],
                        a.x = d.x,
                        a.y = d.y);
                d = b.G;
                d.x = 0;
                d.y = 0;
                b = b.ra;
                c = c.ra;
                b.x = c.x;
                b.y = c.y
            }
        }
        A(a) {
            if (0 < this.Ta)
                120 > this.Ta && this.Ta--;
            else {
                var b = this.Sa.Ct;
                null != b && b();
                b = this.Sa.K;
                for (var c = 0; c < b.length;) {
                    var d = b[c];
                    ++c;
                    if (null != d.I) {
                        0 == (d.W & 16) && (d.Yb = !1);
                        var e = this.U.Kd;
                        0 < d.Zc && d.Zc--;
                        d.Cc < this.Sa.ne && d.Cc++;
                        if (d.Yb && 0 >= d.Zc && 0 <= d.Cc) {
                            for (var f = !1, g = 0, h = this.va.H; g < h.length;) {
                                var k = h[g];
                                ++g;
                                if (0 != (k.C & 64) && k != d.I) {
                                    var l = k.a
                                        , n = d.I.a
                                        , r = l.x - n.x;
                                    l = l.y - n.y;
                                    n = Math.sqrt(r * r + l * l);
                                    if (4 > n - k.V - d.I.V) {
                                        f = r / n;
                                        r = l / n;
                                        l = e.ef;
                                        var t = n = k.G;
                                        k = k.ca;
                                        n.x = t.x + f * l * k;
                                        n.y = t.y + r * l * k;
                                        t = d.I;
                                        k = -e.ff;
                                        n = l = t.G;
                                        t = t.ca;
                                        l.x = n.x + f * k * t;
                                        l.y = n.y + r * k * t;
                                        f = !0
                                    }
                                }
                            }
                            f && (null != this.Sa.yi && this.Sa.yi(d),
                                d.Yb = !1,
                                d.Zc = this.Sa.Gd,
                                d.Cc -= this.Sa.gd)
                        }
                        f = d.W;
                        h = g = 0;
                        0 != (f & 1) && --h;
                        0 != (f & 2) && ++h;
                        0 != (f & 4) && --g;
                        0 != (f & 8) && ++g;
                        0 != g && 0 != h && (f = Math.sqrt(g * g + h * h),
                            g /= f,
                            h /= f);
                        f = d.I.G;
                        k = d.Yb ? e.gf : e.Qe;
                        f.x += g * k;
                        f.y += h * k;
                        d.I.Ea = d.Yb ? e.hf : e.Ea
                    }
                }
                c = 0;
                d = this.va.H;
                e = 0;
                for (g = d.length; e < g;)
                    f = e++,
                        h = d[f],
                        0 != (h.C & 128) && (aa.zk[c] = f,
                            f = aa.vl[c],
                            h = h.a,
                            f.x = h.x,
                            f.y = h.y,
                            ++c);
                this.va.A(a);
                if (0 == this.Cb) {
                    for (a = 0; a < b.length;)
                        c = b[a],
                            ++a,
                            null != c.I && (c.I.i = 39 | this.le.Lp);
                    b = this.va.H[0].G;
                    0 < b.x * b.x + b.y * b.y && (this.Cb = 1)
                } else if (1 == this.Cb) {
                    this.Nc += .016666666666666666;
                    for (a = 0; a < b.length;)
                        d = b[a],
                            ++a,
                            null != d.I && (d.I.i = 39);
                    d = u.Pa;
                    b = this.va.H;
                    for (a = 0; a < c && (d = a++,
                        d = this.U.to(b[aa.zk[d]].a, aa.vl[d]),
                        d == u.Pa);)
                        ;
                    d != u.Pa ? (this.Cb = 2,
                        this.zc = 150,
                        this.le = d,
                        d == u.ja ? this.Ob++ : this.Tb++,
                        null != this.Sa.cj && this.Sa.cj(d.Dg),
                        null != this.Sa.om && this.Sa.om(d.ba)) : 0 < this.Ga && this.Nc >= 60 * this.Ga && this.Tb != this.Ob && (null != this.Sa.ej && this.Sa.ej(),
                            this.Tm())
                } else if (2 == this.Cb)
                    this.zc--,
                        0 >= this.zc && (0 < this.mb && (this.Tb >= this.mb || this.Ob >= this.mb) || 0 < this.Ga && this.Nc >= 60 * this.Ga && this.Tb != this.Ob ? this.Tm() : (this.al(),
                            null != this.Sa.Wq && this.Sa.Wq()));
                else if (3 == this.Cb && (this.zc--,
                    0 >= this.zc && (b = this.Sa,
                        null != b.M))) {
                    b.M = null;
                    a = 0;
                    for (c = b.K; a < c.length;)
                        d = c[a],
                            ++a,
                            d.I = null,
                            d.Nb = 0;
                    null != b.Kf && b.Kf(null)
                }
            }
        }
        Tm() {
            this.zc = 300;
            this.Cb = 3;
            null != this.Sa.dj && this.Sa.dj(this.Tb > this.Ob ? u.ja : u.Da)
        }
        al() {
            let a = this.Sa.K;
            this.Cb = 0;
            for (var b = this.U.H, c = this.va.H, d = 0, e = this.U.Df ? b.length : 1; d < e;) {
                var f = d++;
                b[f].Wk(c[f])
            }
            b = [0, 0, 0];
            for (c = 0; c < a.length;)
                if (d = a[c],
                    ++c,
                    this.Xk(d),
                    e = d.fa,
                    e != u.Pa) {
                    f = d.I.a;
                    var g = this.U
                        , h = b[e.ba]
                        , k = e == u.ja ? g.Md : g.vd;
                    0 == k.length ? (k = h + 1 >> 1,
                        0 == (h & 1) && (k = -k),
                        g = g.mc * e.Nh,
                        h = 55 * k) : (h >= k.length && (h = k.length - 1),
                            h = k[h],
                            g = h.x,
                            h = h.y);
                    f.x = g;
                    f.y = h;
                    b[e.ba]++;
                    d.Nb = b[e.ba]
                }
        }
        ha(a) {
            this.va.ha(a);
            a.R(this.zc);
            a.R(this.Cb);
            a.R(this.Tb);
            a.R(this.Ob);
            a.u(this.Nc);
            a.R(this.Ta);
            a.m(this.le.ba)
        }
        na(a, b) {
            this.va.na(a);
            this.zc = a.N();
            this.Cb = a.N();
            this.Tb = a.N();
            this.Ob = a.N();
            this.Nc = a.w();
            this.Ta = a.N();
            a = a.zf();
            this.le = 1 == a ? u.ja : 2 == a ? u.Da : u.Pa;
            this.Sa = b;
            this.mb = b.mb;
            this.Ga = b.Ga;
            this.U = b.U;
            this.va.L = this.U.L;
            this.va.X = this.U.X;
            this.va.sa = this.U.sa;
            this.va.rb = this.U.rb
        }
        vc() {
            let a = ua.Dc
                , b = this.ic;
            this.jc != a && (null == b && (this.ic = b = new aa),
                this.jc = a,
                aa.zd(b, this));
            return b
        }
        static zd(a, b) {
            a.Sa = b.Sa.vc();
            a.mb = b.mb;
            a.Ga = b.Ga;
            a.va = b.va.vc();
            a.zc = b.zc;
            a.Cb = b.Cb;
            a.Tb = b.Tb;
            a.Ob = b.Ob;
            a.Nc = b.Nc;
            a.Ta = b.Ta;
            a.U = b.U;
            a.le = b.le
        }
    }
    class Xa {
        constructor() {
            this.bf = this.ei = !1;
            this.f = x.Ia(Xa.O);
            let a = x.Ba(this.f);
            this.Lc = a.get("log");
            this.ji = a.get("log-contents");
            this.$a = a.get("input");
            this.$a.maxLength = 140;
            let b = this;
            a.get("drag").onmousedown = function (c) {
                function d(h) {
                    h.preventDefault();
                    m.j.lk.ia(hc(hc(e + (f - h.y))));
                    b.$a.blur();
                    b.bf = !1;
                    b.Af()
                }
                b.f.classList.add("dragging");
                let e = b.qk()
                    , f = c.y;
                c.preventDefault();
                let g = null;
                g = function (h) {
                    b.f.classList.remove("dragging");
                    d(h);
                    window.document.removeEventListener("mousemove", d, !1);
                    window.document.removeEventListener("mouseup", g, !1)
                }
                    ;
                window.document.addEventListener("mousemove", d, !1);
                window.document.addEventListener("mouseup", g, !1)
            }
                ;
            this.Fc = new Vb(a.get("autocompletebox"), function (c, d) {
                b.$a.value = c;
                b.$a.setSelectionRange(d, d)
            }
            );
            this.$a.onkeydown = function (c) {
                switch (c.keyCode) {
                    case 9:
                        c.preventDefault();
                        b.Fc.Qb.hidden ? b.$a.blur() : b.Fc.Yo();
                        break;
                    case 13:
                        null != b.Fl && "" != b.$a.value && b.Fl(b.$a.value);
                        b.$a.value = "";
                        b.$a.blur();
                        break;
                    case 27:
                        b.Fc.Qb.hidden ? (b.$a.value = "",
                            b.$a.blur()) : b.Fc.ai();
                        break;
                    case 38:
                        b.Fc.ik(-1);
                        break;
                    case 40:
                        b.Fc.ik(1)
                }
                c.stopPropagation()
            }
                ;
            this.$a.onfocus = function () {
                null != b.wg && b.wg(!0);
                b.ei = !0;
                b.Af()
            }
                ;
            this.$a.onblur = function () {
                null != b.wg && b.wg(!1);
                b.ei = !1;
                b.Fc.ai();
                b.Af()
            }
                ;
            this.$a.oninput = function () {
                b.Fc.qo(b.$a.value, b.$a.selectionStart)
            }
                ;
            this.Af()
        }
        an() {
            this.bf = !this.bf;
            this.Af();
            if (!this.bf) {
                let a = this.Lc;
                window.setTimeout(function () {
                    a.scrollTop = a.scrollHeight
                }, 200)
            }
        }
        Af() {
            let a = "" + this.qk();
            this.f.style.height = a + "px"
        }
        qk() {
            let a = hc(m.j.lk.v());
            if (this.ei) {
                let b = hc(m.j.Gh.v());
                a <= b && (a = b)
            } else
                this.bf && (a = 0);
            return a
        }
        Zp(a, b, c) {
            let d = window.document.createElement("p");
            d.className = "announcement";
            d.textContent = a;
            0 <= b && (d.style.color = T.nc(b));
            switch (c) {
                case 1:
                case 4:
                    d.style.fontWeight = "bold";
                    break;
                case 2:
                case 5:
                    d.style.fontStyle = "italic"
            }
            switch (c) {
                case 3:
                case 4:
                case 5:
                    d.style.fontSize = "12px"
            }
            this.il(d)
        }
        il(a) {
            var b = this.Lc.clientHeight;
            b = this.Lc.scrollTop + b - this.Lc.scrollHeight >= .5 * -b || !Xa.Gp(this.Lc);
            this.ji.appendChild(a);
            b && (this.Lc.scrollTop = this.Lc.scrollHeight);
            for (a = b ? 50 : 100; this.ji.childElementCount > a;)
                this.ji.firstElementChild.remove()
        }
        da(a, b) {
            let c = window.document.createElement("p");
            null != b && (c.className = b);
            c.textContent = a;
            this.il(c)
        }
        Hb(a) {
            this.da(a, "notice")
        }
        static Gp(a) {
            return a.parentElement.querySelector(":hover") == a
        }
    }
    class la {
        constructor() {
            this.ub = "";
            this.Jc = this.Mc = 0
        }
        De() {
            return JSON.stringify({
                lat: this.Jc,
                lon: this.Mc,
                code: this.ub
            })
        }
        static Sh(a) {
            return la.gg(JSON.parse(a))
        }
        static gg(a) {
            let b = new la;
            b.Jc = a.lat;
            b.Mc = a.lon;
            b.ub = a.code.toLowerCase();
            return b
        }
        static np() {
            return Z.Ok(m.Se + "api/geo").then(function (a) {
                return la.gg(a)
            })
        }
    }
    class Gc {
        constructor(a) {
            this.current = 0;
            this.Ms = a
        }
        next() {
            return this.Ms[this.current++]
        }
    }
    class Wb {
        constructor(a, b) {
            this.ci = null;
            this.l = a;
            null != b && (this.ci = "@" + Y.replace(b, " ", "_"))
        }
        ij(a) {
            let b = this.l.Ka.Fc
                , c = []
                , d = 0;
            for (a = a.K; d < a.length;) {
                let e = a[d];
                ++d;
                c.push({
                    D: e.D,
                    ba: e.Z
                })
            }
            b.$j = c
        }
        Gi(a) {
            function b(d) {
                return null == d ? "" : " by " + d.D
            }
            this.ij(a);
            let c = this;
            a.Tl = function (d) {
                c.l.Ka.Hb("" + d.D + " has joined");
                m.Ra.md(m.Ra.Ip);
                c.ij(a)
            }
                ;
            a.Ul = function (d, e, f, g) {
                D.h(c.zq, d.Z);
                null == e ? d = "" + d.D + " has left" : (Xb.h(c.yq, d.Z, e, null != g ? g.D : null, f),
                    d = "" + d.D + " was " + (f ? "banned" : "kicked") + b(g) + ("" != e ? " (" + e + ")" : ""));
                c.l.Ka.Hb(d);
                m.Ra.md(m.Ra.Op);
                c.ij(a)
            }
                ;
            a.Rl = function (d, e) {
                let f = null != c.ci && -1 != e.indexOf(c.ci);
                c.l.Ka.da("" + d.D + ": " + e, f ? "highlight" : null);
                m.j.Om.v() && f ? m.Ra.md(m.Ra.Uk) : m.j.Wi.v() && m.Ra.md(m.Ra.jk)
            }
                ;
            a.um = function (d, e, f, g) {
                c.l.Ka.Zp(d, e, f);
                if (m.j.Wi.v())
                    switch (g) {
                        case 1:
                            m.Ra.md(m.Ra.jk);
                            break;
                        case 2:
                            m.Ra.md(m.Ra.Uk)
                    }
            }
                ;
            a.yi = function () {
                m.Ra.md(m.Ra.Kp)
            }
                ;
            a.cj = function (d) {
                m.Ra.md(m.Ra.qp);
                let e = c.l.jb.hb.Cd;
                e.Qa(d == u.ja ? e.qr : e.ko)
            }
                ;
            a.dj = function (d) {
                let e = c.l.jb.hb.Cd;
                e.Qa(d == u.ja ? e.rr : e.lo);
                c.l.Ka.Hb("" + d.D + " team won the match")
            }
                ;
            a.Ml = function (d, e, f) {
                e && !f && c.l.Ka.Hb("Game paused" + b(d))
            }
                ;
            a.ej = function () {
                let d = c.l.jb.hb.Cd;
                d.Qa(d.os)
            }
                ;
            a.$i = function (d) {
                c.l.xe(!1);
                c.l.jb.hb.Cd.wo();
                c.l.Ka.Hb("Game started" + b(d))
            }
                ;
            a.Kf = function (d) {
                null != d && c.l.Ka.Hb("Game stopped" + b(d))
            }
                ;
            a.Yi = function (d, e) {
                if (!e.cf()) {
                    let f = Y.hh(e.mk(), 8);
                    c.l.Ka.Hb('Stadium "' + e.D + '" (' + f + ") loaded" + b(d))
                }
            }
                ;
            a.Sl = function (d) {
                let e = window.performance.now();
                9E3 > e - d.vn || (d.vn = e,
                    c.l.Ka.Hb("" + d.D + " " + (d.Ud ? "has desynchronized" : "is back in sync")))
            }
                ;
            a.Xl = function (d, e, f) {
                null != a.M && c.l.Ka.Hb("" + e.D + " was moved to " + f.D + b(d))
            }
                ;
            a.xi = function (d, e) {
                let f = e.D;
                d = (e.cb ? "" + f + " was given admin rights" : "" + f + "'s admin rights were taken away") + b(d);
                c.l.Ka.Hb(d)
            }
                ;
            a.Wl = function (d, e) {
                c.l.jb.hb.xp(d, e)
            }
                ;
            a.bl = function (d, e, f, g) {
                c.l.Ka.Hb("Kick Rate Limit set to (min: " + e + ", rate: " + f + ", burst: " + g + ")" + b(d))
            }
        }
        zs(a) {
            a.Tl = null;
            a.Ul = null;
            a.Rl = null;
            a.um = null;
            a.yi = null;
            a.cj = null;
            a.dj = null;
            a.Ml = null;
            a.ej = null;
            a.$i = null;
            a.Kf = null;
            a.Yi = null;
            a.Sl = null;
            a.Xl = null;
            a.xi = null;
            a.Wl = null;
            a.bl = null
        }
    }
    class Bc {
        static rn() {
            try {
                let a = window.localStorage;
                a.getItem("");
                if (0 == a.length) {
                    let b = "_hx_" + Math.random();
                    a.setItem(b, b);
                    a.removeItem(b)
                }
                return a
            } catch (a) {
                return null
            }
        }
    }
    class ic {
        constructor() {
            this.Ga = 0;
            this.Dk = this.Ek = !1;
            this.Ye = 0;
            this.f = window.document.createElement("div");
            this.f.className = "game-timer-view";
            this.f.appendChild(this.Nq = this.fe("OVERTIME!", "overtime"));
            this.f.appendChild(this.iq = this.fe("0", "digit"));
            this.f.appendChild(this.hq = this.fe("0", "digit"));
            this.f.appendChild(this.fe(":", null));
            this.f.appendChild(this.Pr = this.fe("0", "digit"));
            this.f.appendChild(this.Or = this.fe("0", "digit"))
        }
        fe(a, b) {
            let c = window.document.createElement("span");
            c.textContent = a;
            c.className = b;
            return c
        }
        fs(a) {
            if (a != this.Ye) {
                let b = a % 60
                    , c = a / 60 | 0;
                this.Or.textContent = "" + b % 10;
                this.Pr.textContent = "" + (b / 10 | 0) % 10;
                this.hq.textContent = "" + c % 10;
                this.iq.textContent = "" + (c / 10 | 0) % 10;
                this.Ye = a
            }
            this.jm();
            this.km()
        }
        gs(a) {
            this.Ga = a;
            this.jm();
            this.km()
        }
        jm() {
            this.bs(0 != this.Ga && this.Ye > this.Ga)
        }
        km() {
            this.hs(this.Ye < this.Ga && this.Ye > this.Ga - 30)
        }
        bs(a) {
            a != this.Dk && (this.Nq.className = a ? "overtime on" : "overtime",
                this.Dk = a)
        }
        hs(a) {
            a != this.Ek && (this.f.className = a ? "game-timer-view time-warn" : "game-timer-view",
                this.Ek = a)
        }
    }
    class Ub {
        static Mr(a, b) {
            Ub.wm(new Blob([a], {
                type: "octet/stream"
            }), b)
        }
        static Nr(a, b) {
            Ub.wm(new Blob([a], {
                type: "text/plain"
            }), b)
        }
        static wm(a, b) {
            let c = window.document.createElement("a");
            c.style.display = "display: none";
            window.document.body.appendChild(c);
            a = URL.createObjectURL(a);
            c.href = a;
            c.download = b;
            c.click();
            URL.revokeObjectURL(a);
            c.remove()
        }
    }
    class ub {
        constructor(a) {
            this.f = x.Ia(ub.O);
            let b = x.Ba(this.f);
            this.nf = b.get("title");
            this.Di = b.get("reason");
            this.eo = b.get("ban-btn");
            this.ho = b.get("ban-text");
            this.df = b.get("kick");
            this.wd = b.get("close");
            let c = this;
            this.eo.onclick = function () {
                c.Tj(!c.bk)
            }
                ;
            this.wd.onclick = function () {
                H.h(c.sb)
            }
                ;
            this.df.onclick = function () {
                rc.h(c.ti, c.Rb, c.Di.value, c.bk)
            }
                ;
            this.Di.onkeydown = function (d) {
                return d.stopPropagation()
            }
                ;
            this.Di.maxLength = 100;
            this.Rb = a.Z;
            this.nf.textContent = "Kick " + a.D;
            this.Tj(!1)
        }
        Tj(a) {
            this.bk = a;
            this.ho.textContent = a ? "Yes" : "No"
        }
    }
    class ob {
        static delete(a) {
            return null == window.indexedDB ? Promise.reject("IndexedDB not supported by browser.") : new Promise(function (b, c) {
                let d = window.indexedDB.open("stadiums", 1);
                d.onblocked = d.onerror = c;
                d.onupgradeneeded = function (e) {
                    let f = d.result;
                    f.onerror = c;
                    1 > e.oldVersion && (f.createObjectStore("files", {
                        autoIncrement: !0
                    }),
                        f.createObjectStore("meta", {
                            keyPath: "id"
                        }))
                }
                    ;
                d.onsuccess = function () {
                    let e = d.result;
                    e.onerror = c;
                    let f = e.transaction(["meta", "files"], "readwrite");
                    f.onerror = f.onabort = function (g) {
                        c(g);
                        e.close()
                    }
                        ;
                    f.oncomplete = function () {
                        b(0);
                        e.close()
                    }
                        ;
                    f.objectStore("files").delete(a);
                    f.objectStore("meta").delete(a)
                }
            }
            )
        }
        static get(a) {
            return null == window.indexedDB ? Promise.reject("IndexedDB not supported by browser.") : new Promise(function (b, c) {
                let d = window.indexedDB.open("stadiums", 1);
                d.onblocked = d.onerror = c;
                d.onupgradeneeded = function (e) {
                    let f = d.result;
                    f.onerror = c;
                    1 > e.oldVersion && (f.createObjectStore("files", {
                        autoIncrement: !0
                    }),
                        f.createObjectStore("meta", {
                            keyPath: "id"
                        }))
                }
                    ;
                d.onsuccess = function () {
                    let e = d.result;
                    e.onerror = c;
                    let f = e.transaction(["files"]);
                    f.onerror = f.onabort = function (g) {
                        c(g);
                        e.close()
                    }
                        ;
                    f.oncomplete = function () {
                        e.close()
                    }
                        ;
                    Yb.rh(f.objectStore("files").get(a)).then(function (g) {
                        try {
                            let h = new q;
                            h.fl(g);
                            b(h)
                        } catch (h) {
                            g = v.Mb(h).Fb(),
                                c(g)
                        }
                    }, c)
                }
            }
            )
        }
        static getAll() {
            return null == window.indexedDB ? Promise.reject("IndexedDB not supported by browser.") : new Promise(function (a, b) {
                let c = window.indexedDB.open("stadiums", 1);
                c.onblocked = c.onerror = b;
                c.onupgradeneeded = function (d) {
                    let e = c.result;
                    e.onerror = b;
                    1 > d.oldVersion && (e.createObjectStore("files", {
                        autoIncrement: !0
                    }),
                        e.createObjectStore("meta", {
                            keyPath: "id"
                        }))
                }
                    ;
                c.onsuccess = function () {
                    let d = c.result;
                    d.onerror = b;
                    let e = d.transaction(["meta"]);
                    e.onerror = e.onabort = function (f) {
                        b(f);
                        d.close()
                    }
                        ;
                    e.oncomplete = function () {
                        d.close()
                    }
                        ;
                    Yb.rh(e.objectStore("meta").getAll()).then(a, b)
                }
            }
            )
        }
        static st() {
            let a = pa.navigator.storage;
            if (null == a || null == a.persist)
                return Promise.resolve(!1);
            try {
                return a.persisted().then(function (b) {
                    return b ? !0 : a.persist()
                }).catch(function () {
                    return !1
                })
            } catch (b) {
                return Promise.resolve(!1)
            }
        }
        static add(a) {
            return null == window.indexedDB ? Promise.reject("IndexedDB not supported by browser.") : new Promise(function (b, c) {
                let d = window.indexedDB.open("stadiums", 1);
                d.onblocked = d.onerror = c;
                d.onupgradeneeded = function (e) {
                    let f = d.result;
                    f.onerror = c;
                    1 > e.oldVersion && (f.createObjectStore("files", {
                        autoIncrement: !0
                    }),
                        f.createObjectStore("meta", {
                            keyPath: "id"
                        }))
                }
                    ;
                d.onsuccess = function () {
                    let e = d.result;
                    e.onerror = c;
                    let f = e.transaction(["files", "meta"], "readwrite");
                    f.onerror = f.onabort = function (g) {
                        c(g);
                        e.close()
                    }
                        ;
                    f.oncomplete = function () {
                        b(0);
                        e.close()
                    }
                        ;
                    try {
                        Yb.rh(f.objectStore("files").add(a.De())).then(function (g) {
                            g = {
                                name: a.D,
                                id: g
                            };
                            return Yb.rh(f.objectStore("meta").add(g))
                        }).catch(c)
                    } catch (g) {
                        c(0)
                    }
                }
            }
            )
        }
    }
    class Wa {
        constructor() {
            this.jc = -1;
            this.ic = null;
            this.H = []
        }
        ha(a) {
            a.m(this.H.length);
            let b = 0
                , c = this.H.length;
            for (; b < c;) {
                let d = b++
                    , e = this.H[d];
                e.Jl = d;
                e.ha(a)
            }
        }
        na(a) {
            this.H = [];
            let b = a.F()
                , c = 0;
            for (; c < b;) {
                ++c;
                let d = new ta;
                d.na(a);
                this.H.push(d)
            }
        }
        A(a) {
            for (var b = 0, c = this.H; b < c.length;) {
                var d = c[b];
                ++b;
                var e = d.a
                    , f = d.a
                    , g = d.G;
                e.x = f.x + g.x * a;
                e.y = f.y + g.y * a;
                f = e = d.G;
                g = d.ra;
                d = d.Ea;
                e.x = (f.x + g.x) * d;
                e.y = (f.y + g.y) * d
            }
            a = 0;
            for (b = this.H.length; a < b;) {
                d = a++;
                c = this.H[d];
                d += 1;
                for (e = this.H.length; d < e;)
                    f = this.H[d++],
                        0 != (f.i & c.C) && 0 != (f.C & c.i) && c.yo(f);
                if (0 != c.ca) {
                    d = 0;
                    for (e = this.sa; d < e.length;)
                        if (f = e[d],
                            ++d,
                            0 != (f.i & c.C) && 0 != (f.C & c.i)) {
                            g = f.ya;
                            var h = c.a;
                            g = f.Va - (g.x * h.x + g.y * h.y) + c.V;
                            if (0 < g) {
                                var k = h = c.a
                                    , l = f.ya;
                                h.x = k.x + l.x * g;
                                h.y = k.y + l.y * g;
                                g = c.G;
                                h = f.ya;
                                g = g.x * h.x + g.y * h.y;
                                0 > g && (g *= c.o * f.o + 1,
                                    k = h = c.G,
                                    f = f.ya,
                                    h.x = k.x - f.x * g,
                                    h.y = k.y - f.y * g)
                            }
                        }
                    d = 0;
                    for (e = this.X; d < e.length;)
                        f = e[d],
                            ++d,
                            0 != (f.i & c.C) && 0 != (f.C & c.i) && c.zo(f);
                    d = 0;
                    for (e = this.L; d < e.length;)
                        if (f = e[d],
                            ++d,
                            0 != (f.i & c.C) && 0 != (f.C & c.i) && (h = c.a,
                                k = f.a,
                                g = h.x - k.x,
                                h = h.y - k.y,
                                k = g * g + h * h,
                                0 < k && k <= c.V * c.V)) {
                            k = Math.sqrt(k);
                            g /= k;
                            h /= k;
                            k = c.V - k;
                            let n = l = c.a;
                            l.x = n.x + g * k;
                            l.y = n.y + h * k;
                            k = c.G;
                            k = g * k.x + h * k.y;
                            0 > k && (k *= c.o * f.o + 1,
                                l = f = c.G,
                                f.x = l.x - g * k,
                                f.y = l.y - h * k)
                        }
                }
            }
            for (a = 0; 2 > a;)
                for (++a,
                    b = 0,
                    c = this.rb; b < c.length;)
                    c[b++].A(this.H)
        }
        vc() {
            let a = ua.Dc
                , b = this.ic;
            this.jc != a && (null == b && (this.ic = b = new Wa),
                this.jc = a,
                Wa.zd(b, this));
            return b
        }
        static zd(a, b) {
            if (null == b.H)
                a.H = null;
            else {
                null == a.H && (a.H = []);
                let d = a.H
                    , e = b.H;
                for (var c = e.length; d.length > c;)
                    d.pop();
                c = 0;
                let f = e.length;
                for (; c < f;) {
                    let g = c++;
                    d[g] = e[g].vc()
                }
            }
            a.L = b.L;
            a.X = b.X;
            a.sa = b.sa;
            a.rb = b.rb
        }
    }
    class vb {
        constructor() {
            this.Gf = null;
            this.f = x.Ia(vb.O);
            var a = x.Ba(this.f);
            let b = this;
            a.get("cancel").onclick = function () {
                H.h(b.sb)
            }
                ;
            this.Fh = a.get("change");
            this.Fh.disabled = !0;
            this.Fh.onclick = function () {
                null != b.Gf && b.ym(b.Gf.index)
            }
                ;
            a = a.get("list");
            this.zi(a);
            let c = nb.mi(a);
            window.setTimeout(function () {
                c.update()
            }, 0)
        }
        zi(a) {
            let b = this
                , c = 0
                , d = Ea.fb.length >> 2;
            for (; c < d;) {
                var e = c++;
                let f = e
                    , g = Ea.fb[e << 2];
                e = Ea.fb[(e << 2) + 1].toLowerCase();
                let h = window.document.createElement("div");
                h.className = "elem";
                h.innerHTML = '<div class="flagico f-' + e + '"></div> ' + g;
                a.appendChild(h);
                h.onclick = function () {
                    null != b.Gf && b.Gf.Ma.classList.remove("selected");
                    b.Fh.disabled = !1;
                    b.Gf = {
                        Ma: h,
                        index: f
                    };
                    h.classList.add("selected")
                }
                    ;
                h.ondblclick = function () {
                    b.ym(f)
                }
            }
        }
        ym(a) {
            let b = new la;
            b.ub = Ea.fb[(a << 2) + 1].toLowerCase();
            b.Jc = Ea.fb[(a << 2) + 2];
            b.Mc = Ea.fb[(a << 2) + 3];
            m.j.af.ia(b);
            H.h(this.sb)
        }
    }
    class Fa {
        constructor(a) {
            function b() {
                let t = g[f];
                a.Pl = e ? t : 0;
                c.get("spd").textContent = t + "x"
            }
            this.lg = !1;
            this.f = x.Ia(Fa.O);
            let c = x.Ba(this.f);
            this.Ii = a;
            let d = this;
            c.get("reset").onclick = function () {
                a.Ji();
                d.El()
            }
                ;
            let e = !0
                , f = 2
                , g = [.5, .75, 1, 2, 3];
            b();
            let h = c.get("playicon");
            h.classList.add("icon-pause");
            c.get("play").onclick = function () {
                e = !e;
                let t = h.classList;
                t.toggle("icon-play", !e);
                t.toggle("icon-pause", e);
                b()
            }
                ;
            c.get("spdup").onclick = function () {
                f += 1;
                let t = g.length - 1;
                f > t && (f = t);
                b()
            }
                ;
            c.get("spddn").onclick = function () {
                --f;
                0 > f && (f = 0);
                b()
            }
                ;
            this.rs = c.get("time");
            let k = c.get("timebar");
            this.kr = c.get("progbar");
            let l = c.get("timetooltip")
                , n = 0
                , r = a.pl;
            for (; n < r.length;) {
                let t = r[n];
                ++n;
                let z = window.document.createElement("div");
                z.className = "marker";
                z.classList.add("k" + t.kind);
                z.style.left = 100 * t.Dj + "%";
                k.appendChild(z)
            }
            k.onclick = function (t) {
                a.Qr((t.pageX - k.offsetLeft) / k.clientWidth * a.uh * a.Bf);
                d.lg || (d.lg = !0,
                    d.Gq(),
                    d.El())
            }
                ;
            k.onmousemove = function (t) {
                t = (t.pageX - k.offsetLeft) / k.clientWidth;
                l.textContent = Fa.ql(a.Bf * a.uh * t);
                return l.style.left = "calc(" + 100 * t + "% - 30px)"
            }
                ;
            this.Pp = c.get("leave");
            this.Pp.onclick = function () {
                H.h(d.oe)
            }
        }
        A() {
            this.rs.textContent = Fa.ql(this.Ii.Ub);
            this.kr.style.width = 100 * this.Ii.op() + "%";
            !this.lg || 0 < this.Ii.Pd || (this.lg = !1,
                this.Fq())
        }
        static ql(a) {
            a = a / 1E3 | 0;
            return (a / 60 | 0) + ":" + Y.Of(Q.Je(a % 60))
        }
    }
    class Ba {
        constructor(a) {
            this.Fd = new Map;
            this.f = x.Ia(Ba.O);
            this.f.className += " " + a.Qo;
            let b = x.Ba(this.f);
            this.fb = b.get("list");
            this.gi = b.get("join-btn");
            this.Ki = b.get("reset-btn");
            a == u.Pa && this.Ki.remove();
            this.gi.textContent = "" + a.D;
            this.f.ondragover = this.f.Ft = function (d) {
                -1 != d.dataTransfer.types.indexOf("player") && d.preventDefault()
            }
                ;
            let c = this;
            this.f.ondrop = function (d) {
                d.preventDefault();
                d = d.dataTransfer.getData("player");
                null != d && (d = Q.parseInt(d),
                    null != d && qa.h(c.Ag, d, a))
            }
                ;
            this.gi.onclick = function () {
                D.h(c.uq, a)
            }
                ;
            this.Ki.onclick = function () {
                D.h(c.pe, a)
            }
        }
        A(a, b, c, d) {
            this.gi.disabled = b || c;
            this.Ki.disabled = c;
            b = new Set;
            c = this.Fd.keys();
            for (var e = c.next(); !e.done;) {
                var f = e.value;
                e = c.next();
                b.add(f)
            }
            let g = this;
            for (c = 0; c < a.length;)
                e = a[c],
                    ++c,
                    f = this.Fd.get(e.Z),
                    null == f && (f = new wb(e),
                        f.wf = function (h) {
                            D.h(g.wf, h)
                        }
                        ,
                        this.Fd.set(e.Z, f),
                        this.fb.appendChild(f.f)),
                    f.A(e, d),
                    b.delete(e.Z);
            d = b.values();
            for (b = d.next(); !b.done;)
                c = b.value,
                    b = d.next(),
                    this.Fd.get(c).f.remove(),
                    this.Fd.delete(c);
            d = 0;
            for (b = a.length - 1; d < b;)
                e = d++,
                    c = this.Fd.get(a[e].Z).f,
                    e = this.Fd.get(a[e + 1].Z).f,
                    c.nextSibling != e && this.fb.insertBefore(c, e)
        }
    }
    class uc {
        constructor() {
            this.hash = 0
        }
        Ns(a) {
            let b = 0
                , c = a.length;
            for (; b < c;)
                this.hash = (this.hash += a[b++]) + (this.hash << 10),
                    this.hash ^= this.hash >>> 6
        }
    }
    class V {
        constructor() { }
        vs() {
            return "idkey." + this.pj + "." + this.qj + "." + this.vk
        }
        ks(a) {
            try {
                let b = A.ka(1024);
                b.m(1);
                let c = b.a;
                b.Xb(0);
                let d = b.a;
                b.oc(this.pj);
                b.oc(this.qj);
                b.Lb(a);
                let e = b.a - d;
                b.s.setUint16(c, e, b.Ua);
                let f = new Uint8Array(b.s.buffer, b.s.byteOffset + d, e);
                return window.crypto.subtle.sign(V.Mm, this.$l, f).then(function (g) {
                    b.Yg(g);
                    return b.Wb()
                })
            } catch (b) {
                return Promise.reject(v.Mb(b).Fb())
            }
        }
        static gp() {
            try {
                return window.crypto.subtle.generateKey(V.xh, !0, ["sign", "verify"]).then(function (a) {
                    let b = a.privateKey;
                    return window.crypto.subtle.exportKey("jwk", b).then(function (c) {
                        let d = c.y
                            , e = c.d
                            , f = new V;
                        f.pj = c.x;
                        f.qj = d;
                        f.vk = e;
                        f.$l = b;
                        return f
                    })
                })
            } catch (a) {
                return Promise.reject(v.Mb(a).Fb())
            }
        }
        static fp(a) {
            a = a.split(".");
            if (4 != a.length || "idkey" != a[0])
                return Promise.reject("Invalid id format");
            let b = a[1]
                , c = a[2]
                , d = a[3];
            return V.Ls(b, c, d).then(function (e) {
                let f = new V;
                f.pj = b;
                f.qj = c;
                f.vk = d;
                f.$l = e;
                return f
            })
        }
        static Es(a, b) {
            try {
                let c = new J(new DataView(a.buffer, a.byteOffset, a.byteLength), !1);
                c.F();
                let d = c.lb(c.Sb())
                    , e = c.lb()
                    , f = new J(new DataView(d.buffer, d.byteOffset, d.byteLength), !1)
                    , g = f.kc()
                    , h = f.kc()
                    , k = f.lb();
                if (k.byteLength != b.byteLength)
                    return Promise.reject(null);
                a = 0;
                let l = k.byteLength;
                for (; a < l;) {
                    let n = a++;
                    if (k[n] != b[n])
                        return Promise.reject(null)
                }
                return V.Ks(g, h).then(function (n) {
                    return window.crypto.subtle.verify(V.Mm, n, e, d)
                }).then(function (n) {
                    if (!n)
                        throw v.B(null);
                    return g
                })
            } catch (c) {
                return Promise.reject(v.Mb(c).Fb())
            }
        }
        static Ls(a, b, c) {
            try {
                return window.crypto.subtle.importKey("jwk", {
                    crv: "P-256",
                    ext: !0,
                    key_ops: ["sign"],
                    kty: "EC",
                    d: c,
                    x: a,
                    y: b
                }, V.xh, !0, ["sign"])
            } catch (d) {
                return Promise.reject(v.Mb(d).Fb())
            }
        }
        static Ks(a, b) {
            try {
                return window.crypto.subtle.importKey("jwk", {
                    crv: "P-256",
                    ext: !0,
                    key_ops: ["verify"],
                    kty: "EC",
                    x: a,
                    y: b
                }, V.xh, !0, ["verify"])
            } catch (c) {
                return Promise.reject(v.Mb(c).Fb())
            }
        }
    }
    class B {
        static $p() {
            C.xj(function () {
                B.Fk(B.hr)
            });
            B.Rp()
        }
        static Rp() {
            let a = m.j.Zj.v();
            null == a ? V.gp().then(function (b) {
                B.Xe = b;
                m.j.Zj.ia(b.vs())
            }).catch(function () { }) : V.fp(a).then(function (b) {
                return B.Xe = b
            }).catch(function () { })
        }
        static jp() {
            let a = Bc.rn();
            return null != a ? null != a.getItem("crappy_router") : !1
        }
        static Fk(a) {
            let b = new xb(m.j.qe.v());
            b.Cl = function (c) {
                m.j.qe.ia(c);
                m.Ra.sm();
                a()
            }
                ;
            C.Oa(b.f);
            b.Db.focus()
        }
        static Gk(a, b) {
            a = new ba(a);
            a.Wa = b;
            C.Oa(a.f)
        }
        static Vo(a, b) {
            function c() {
                let f = new Ua("Failed", null);
                f.Wa = function () {
                    B.xb()
                }
                    ;
                C.Oa(f.f)
            }
            function d(f) {
                f = f.sitekey;
                if (null == f)
                    throw v.B(null);
                B.Gk(f, function (g) {
                    e(a, g)
                })
            }
            C.Oa((new ca("Connecting", "Connecting...", [])).f);
            let e = null;
            e = function (f, g) {
                Z.Zl(m.Se + "api/client", "room=" + f + "&rcr=" + g, Z.Mj).then(function (h) {
                    switch (h.action) {
                        case "connect":
                            h = h.token;
                            if (null == h)
                                throw v.B(null);
                            b(h);
                            break;
                        case "recaptcha":
                            d(h);
                            break;
                        default:
                            throw v.B(null);
                    }
                }).catch(function () {
                    c()
                })
            }
                ;
            e(a, "")
        }
        static hr() {
            let a = Cc.v()
                , b = a.get("c")
                , c = a.get("p");
            a.get("v");
            null != b ? null != c ? B.Oh(b) : B.eg(b) : B.xb()
        }
        static xb() {
            let a = new Ya(m.j.Vh());
            C.Oa(a.Ma);
            a.An = function (b) {
                if (9 != b.ke.Fe) {
                    let c = new ca("Incompatible version", "The room is running a different version.", ["Ok"]);
                    C.Oa(c.f);
                    c.Wa = function () {
                        C.Oa(a.Ma);
                        c.Wa = null
                    }
                } else
                    b.ke.Jb ? B.Oh(b.ba) : B.eg(b.ba)
            }
                ;
            a.kt = function () {
                B.Wo()
            }
                ;
            a.jt = function () {
                B.Fk(B.xb)
            }
                ;
            a.mt = function () {
                B.Ik()
            }
                ;
            a.lt = function (b) {
                B.Xo(b)
            }
        }
        static Ik() {
            let a = new ma(!0)
                , b = window.document.createElement("div");
            b.className = "view-wrapper";
            b.appendChild(a.f);
            C.Oa(b);
            a.sb = function () {
                B.xb()
            }
                ;
            a.oq = function () {
                let c = new vb
                    , d = window.document.createElement("div");
                d.className = "view-wrapper";
                d.appendChild(c.f);
                C.Oa(d);
                c.sb = function () {
                    B.Ik()
                }
            }
        }
        static oi(a, b) {
            return "" + pa.location.origin + "/play?c=" + a + (b ? "&p=1" : "")
        }
        static Wo() {
            let a = m.j.qe.v()
                , b = new pb("" + a + "'s room");
            C.Oa(b.f);
            b.si = function () {
                B.xb()
            }
                ;
            b.tq = function (c) {
                function d() {
                    if (!c.xt) {
                        var t = new Rb;
                        t.Fe = 9;
                        t.D = g.lc;
                        t.K = g.K.length;
                        t.lf = k.tg + 1;
                        t.ub = f.ub;
                        t.Jb = null != k.Jb;
                        t.Jc = f.Jc;
                        t.Mc = f.Mc;
                        var z = A.ka(16);
                        t.ha(z);
                        k.Ui(z.Vg())
                    }
                }
                C.Oa((new ca("Creating room", "Connecting...", [])).f);
                let e = null
                    , f = m.j.Vh()
                    , g = new va;
                g.lc = c.name;
                let h = new wa;
                h.D = a;
                h.cb = !0;
                h.country = f.ub;
                h.Zb = m.j.zh.v();
                g.K.push(h);
                let k = new Zb({
                    iceServers: m.kg,
                    Aj: m.Se + "api/host",
                    state: g,
                    version: 9
                });
                k.tg = c.ft - 1;
                k.Jb = c.password;
                d();
                let l = new Da(k)
                    , n = !1;
                k.vf = function (t, z) {
                    B.Gk(t, function (L) {
                        z(L);
                        C.Oa(l.l.f);
                        n = !0
                    })
                }
                    ;
                let r = window.setInterval(function () {
                    k.ta(Ga.qa(k))
                }, 3E3);
                k.zl = function (t) {
                    null != g.ma(t) && k.ta(na.qa(t, "Bad actor", !1))
                }
                    ;
                k.rq = function (t, z) {
                    let L = z.kc();
                    if (25 < L.length)
                        throw v.B("name too long");
                    let N = z.kc();
                    if (3 < N.length)
                        throw v.B("country too long");
                    z = z.Ab();
                    if (null != z && 2 < z.length)
                        throw v.B("avatar too long");
                    k.ta(Ha.qa(t, L, N, z));
                    d()
                }
                    ;
                k.sq = function (t) {
                    null != g.ma(t) && k.ta(na.qa(t, null, !1))
                }
                    ;
                k.yg = function (t) {
                    e = t;
                    l.Ng = B.oi(t, null != k.Jb);
                    n || (n = !0,
                        C.Oa(l.l.f))
                }
                    ;
                l.Th.yq = function (t, z, L, N) {
                    k.ap(t, z, L, N)
                }
                    ;
                l.Th.zq = function () {
                    d()
                }
                    ;
                l.l.oe = function () {
                    k.la();
                    l.la();
                    B.xb();
                    window.clearInterval(r)
                }
                    ;
                l.dg.Rg = function (t) {
                    k.Jb = t;
                    d();
                    null != e && (l.Ng = B.oi(e, null != k.Jb))
                }
                    ;
                l.dg.Im = function (t) {
                    k.Ti(t)
                }
                    ;
                l.dg.de = M(k, k.de)
            }
        }
        static Oh(a) {
            let b = new rb;
            C.Oa(b.f);
            b.Wa = function (c) {
                null == c ? B.xb() : B.eg(a, c)
            }
        }
        static Xo(a) {
            try {
                let b = new vc(new $b(new Uint8Array(a), new va, 3));
                b.te.oe = function () {
                    b.la();
                    B.xb()
                }
                    ;
                C.Oa(b.l.f)
            } catch (b) {
                let c = v.Mb(b).Fb();
                if (c instanceof ac)
                    a = new ca("Incompatible replay version", "The replay file is of a different version", ["Open player", "Cancel"]),
                        C.Oa(a.f),
                        a.Wa = function (d) {
                            0 == d ? (d = window.top.location,
                                window.top.open(d.protocol + "//" + d.hostname + (null != d.port ? ":" + d.port : "") + "/replay?v=" + c.Fe, "_self")) : B.xb()
                        }
                        ;
                else {
                    let d = new ca("Replay error", "Couldn't load the file.", ["Ok"]);
                    C.Oa(d.f);
                    d.Wa = function () {
                        d.Wa = null;
                        B.xb()
                    }
                }
            }
        }
        static eg(a, b, c) {
            try {
                let d = B.jp()
                    , e = new va
                    , f = A.ka();
                f.oc(m.j.qe.v());
                f.oc(m.j.Vh().ub);
                f.Eb(m.j.zh.v());
                let g = new Ia(a, {
                    iceServers: m.kg,
                    Aj: m.Js,
                    state: e,
                    version: 9,
                    At: f.Vg(),
                    password: b,
                    Gn: d,
                    Mn: c,
                    Ts: B.Xe
                })
                    , h = new yb;
                h.da("Connecting to master...");
                h.Eh.onclick = function () {
                    g.Id = null;
                    g.uf = null;
                    g.la();
                    B.xb()
                }
                    ;
                C.Oa(h.f);
                let k = function (r, t) {
                    r = new Ua(r, t);
                    r.Wa = function () {
                        B.xb()
                    }
                        ;
                    C.Oa(r.f)
                }
                    , l = function () {
                        let r = new ca("Connection Failed", "", ["Ok"]);
                        r.ee.innerHTML = "<p>Failed to connect to room host.</p><p>If this problem persists please see the <a href='https://github.com/haxball/haxball-issues/wiki/Connection-Issues' target='_blank'>troubleshooting guide</a>.</p>";
                        r.Wa = function () {
                            B.xb()
                        }
                            ;
                        C.Oa(r.f)
                    }
                    , n = function () {
                        let r = new Da(g);
                        g.Dl = function (t) {
                            r.l.Jf.cs(g.Gg.mh() | 0, g.Gg.max() | 0);
                            r.l.Jf.Nl.Yn(t)
                        }
                            ;
                        r.Ng = B.oi(a, !1);
                        C.Oa(r.l.f);
                        r.l.oe = function () {
                            g.Id = null;
                            g.la();
                            r.la();
                            B.xb()
                        }
                            ;
                        g.Id = function () {
                            g.Id = null;
                            r.la();
                            let t = null == r.Nd ? null : r.Nd.stop();
                            k(g.Ak, t)
                        }
                    };
                g.uf = function (r) {
                    g.uf = null;
                    g.Id = null;
                    switch (r.qb) {
                        case 1:
                            l();
                            break;
                        case 2:
                            switch (r.reason) {
                                case 4004:
                                    B.Vo(a, function (t) {
                                        B.eg(a, b, t)
                                    });
                                    break;
                                case 4101:
                                    null == b ? B.Oh(a) : k(Ia.Ih(r), null);
                                    break;
                                default:
                                    k(Ia.Ih(r), null)
                            }
                            break;
                        default:
                            k(Ia.Ih(r), null)
                    }
                }
                    ;
                g.Id = function (r) {
                    switch (r) {
                        case 1:
                            h.da("Connecting to peer...");
                            break;
                        case 2:
                            h.da("Awaiting state...");
                            break;
                        case 3:
                            n()
                    }
                }
                    ;
                g.Dq = function () {
                    h.da("Trying reverse connection...")
                }
            } catch (d) {
                c = v.Mb(d).Fb(),
                    pa.console.log(c),
                    c = new ca("Unexpected Error", "", []),
                    c.ee.innerHTML = "An error ocurred while attempting to join the room.<br><br>This might be caused by a browser extension, try disabling all extensions and refreshing the site.<br><br>The error has been printed to the inspector console.",
                    C.Oa(c.f)
            }
        }
    }
    class u {
        constructor(a, b, c, d, e, f, g, h) {
            this.Dg = null;
            this.ba = a;
            this.S = b;
            this.Nh = c;
            this.Lp = d;
            this.D = e;
            this.Qo = f;
            this.C = h;
            this.Vm = new xa;
            this.Vm.ib.push(b)
        }
    }
    class Ca {
        constructor(a, b, c) {
            this.rd = this.Ce = null;
            this.Ae = [];
            this.xk = 0;
            this.Hl = !1;
            this.ig = [];
            this.cd = [];
            this.La = new RTCPeerConnection({
                iceServers: b
            }, Ca.Ho);
            let d;
            this.jg = new Promise(function (f) {
                d = f
            }
            );
            let e = this;
            this.La.onicecandidate = function (f) {
                null == f.candidate ? d(e.ig) : (f = f.candidate,
                    null != f.candidate && "" != f.candidate && (null != e.xg && e.xg(f),
                        e.ig.push(f)))
            }
                ;
            for (b = 0; b < c.length;)
                this.Mo(c[b++]);
            this.ba = a
        }
        bj(a) {
            null == a && (a = 1E4);
            window.clearTimeout(this.Ce);
            this.Ce = window.setTimeout(M(this, this.Bp), a)
        }
        async Lo(a, b) {
            await this.La.setRemoteDescription(a);
            a = await this.La.createAnswer();
            await this.La.setLocalDescription(a);
            let c = 0;
            for (; c < b.length;)
                this.Rj(b[c++]);
            try {
                await Ec.Zm(this.jg, 500)
            } catch (d) { }
            return a
        }
        async No() {
            let a = await this.La.createOffer();
            await this.La.setLocalDescription(a);
            try {
                await Ec.Zm(this.jg, 1E3)
            } catch (b) { }
            return a
        }
        Mo(a) {
            let b = this.cd.length
                , c = {
                    id: b,
                    negotiated: !0,
                    ordered: a.ordered
                };
            a.reliable || (c.maxRetransmits = 0);
            a = this.La.createDataChannel(a.name, c);
            a.binaryType = "arraybuffer";
            let d = this;
            0 == b && (a.onopen = function () {
                null != d.Hd && d.Hd()
            }
            );
            a.onclose = function () {
                d.Xh()
            }
                ;
            a.onmessage = function () {
                d.Xh()
            }
                ;
            this.cd.push(a)
        }
        Rj(a) {
            let b = this;
            window.setTimeout(function () {
                "closed" != b.La.iceConnectionState && "closed" != b.La.signalingState && b.La.addIceCandidate(a).catch(function () { })
            }, this.xk)
        }
        Bp() {
            this.Xh()
        }
        Xh() {
            null != this.kd && this.kd();
            this.la()
        }
        la() {
            this.nk();
            this.La.close()
        }
        nk() {
            window.clearTimeout(this.Ce);
            this.Hd = this.xg = this.kd = null;
            this.La.onicecandidate = null;
            this.La.ondatachannel = null;
            this.La.onsignalingstatechange = null;
            this.La.oniceconnectionstatechange = null;
            let a = 0
                , b = this.cd;
            for (; a < b.length;) {
                let c = b[a];
                ++a;
                c.onopen = null;
                c.onclose = null;
                c.onmessage = null
            }
        }
    }
    class wc {
    }
    class I {
        constructor() {
            this.Sg = this.Tg = this.ya = null;
            this.uk = 0;
            this.ea = this.$ = this.ge = null;
            this.Hc = 0;
            this.o = 1;
            this.i = 63;
            this.C = 32;
            this.vb = 1 / 0;
            this.bb = !0;
            this.S = 0
        }
        ha(a) {
            let b = 0
                , c = a.a;
            a.m(0);
            a.m(this.$.Dd);
            a.m(this.ea.Dd);
            0 != this.Hc && (b = 1,
                a.u(this.Hc));
            this.vb != 1 / 0 && (b |= 2,
                a.u(this.vb));
            0 != this.S && (b |= 4,
                a.R(this.S));
            this.bb && (b |= 8);
            a.s.setUint8(c, b);
            a.u(this.o);
            a.R(this.i);
            a.R(this.C)
        }
        na(a, b) {
            let c = a.F();
            this.$ = b[a.F()];
            this.ea = b[a.F()];
            this.Hc = 0 != (c & 1) ? a.w() : 0;
            this.vb = 0 != (c & 2) ? a.w() : 1 / 0;
            this.S = 0 != (c & 4) ? a.N() : 0;
            this.bb = 0 != (c & 8);
            this.o = a.w();
            this.i = a.N();
            this.C = a.N()
        }
        Vc(a) {
            a *= .017453292519943295;
            if (0 > a) {
                a = -a;
                let b = this.$;
                this.$ = this.ea;
                this.ea = b;
                this.Hc = -this.Hc
            }
            a > I.Qn && a < I.Pn && (this.vb = 1 / Math.tan(a / 2))
        }
        kp() {
            return 0 != 0 * this.vb ? 0 : 114.59155902616465 * Math.atan(1 / this.vb)
        }
        re() {
            if (0 == 0 * this.vb) {
                var a = this.ea.a
                    , b = this.$.a
                    , c = .5 * (a.x - b.x);
                a = .5 * (a.y - b.y);
                b = this.$.a;
                let d = this.vb;
                this.ge = new P(b.x + c + -a * d, b.y + a + c * d);
                a = this.$.a;
                b = this.ge;
                c = a.x - b.x;
                a = a.y - b.y;
                this.uk = Math.sqrt(c * c + a * a);
                c = this.$.a;
                a = this.ge;
                this.Sg = new P(-(c.y - a.y), c.x - a.x);
                c = this.ge;
                a = this.ea.a;
                this.Tg = new P(-(c.y - a.y), c.x - a.x);
                0 >= this.vb && (a = c = this.Sg,
                    c.x = -a.x,
                    c.y = -a.y,
                    a = c = this.Tg,
                    c.x = -a.x,
                    c.y = -a.y)
            } else
                a = this.$.a,
                    b = this.ea.a,
                    c = a.x - b.x,
                    a = -(a.y - b.y),
                    b = Math.sqrt(a * a + c * c),
                    this.ya = new P(a / b, c / b)
        }
    }
    class C {
        static $s() {
            try {
                return window.self != window.top
            } catch (a) {
                return !0
            }
        }
        static ih(a) {
            return new Promise(function (b, c) {
                let d = window.document.createElement("img");
                d.onload = function () {
                    URL.revokeObjectURL(d.src);
                    d.onload = null;
                    b(d)
                }
                    ;
                d.onerror = function () {
                    URL.revokeObjectURL(d.src);
                    c(null)
                }
                    ;
                d.src = URL.createObjectURL(new Blob([a], {
                    type: "image/png"
                }))
            }
            )
        }
        static xj(a) {
            C.$s() && C.Us(function () {
                Nc.xj();
                let b = null == m.j.$e.v() ? la.np().then(function (d) {
                    m.j.$e.ia(d)
                }, function () { }) : Promise.resolve(null)
                    , c = Z.v("res.dat", "arraybuffer").then(function (d) {
                        d = new JSZip(d);
                        m.Ra = new jc(d);
                        return Promise.all([m.Ra.Zo, C.ih(d.file("images/grass.png").asArrayBuffer()).then(function (e) {
                            return m.sp = e
                        }), C.ih(d.file("images/concrete.png").asArrayBuffer()).then(function (e) {
                            return m.Eo = e
                        }), C.ih(d.file("images/concrete2.png").asArrayBuffer()).then(function (e) {
                            return m.Co = e
                        }), C.ih(d.file("images/typing.png").asArrayBuffer()).then(function (e) {
                            return m.dn = e
                        })])
                    });
                Promise.all([c, b]).then(function () {
                    C.it(a)
                })
            })
        }
        static Us(a) {
            let b = Modernizr
                , c = "canvas datachannel dataview es6collections peerconnection promises websockets".split(" ")
                , d = []
                , e = 0;
            for (; e < c.length;) {
                let f = c[e];
                ++e;
                b[f] || d.push(f)
            }
            0 != d.length ? (window.document.body.innerHTML = "",
                C.$g = window.document.createElement("div"),
                window.document.body.appendChild(C.$g),
                a = new zb(d),
                C.Oa(a.f)) : a()
        }
        static it(a) {
            window.document.body.innerHTML = "";
            C.$g = window.document.createElement("div");
            window.document.body.appendChild(C.$g);
            let b = null;
            b = function () {
                m.Ra.sm();
                window.document.removeEventListener("click", b, !0)
            }
                ;
            window.document.addEventListener("click", b, !0);
            a()
        }
        static Oa(a) {
            null != C.xn && C.xn.remove();
            null != a && (C.$g.appendChild(a),
                C.xn = a)
        }
    }
    class Ab {
        constructor() {
            this.S = 0;
            this.ze = 1 / 0;
            this.Ib = this.fc = 100;
            this.he = this.ie = 0
        }
        ha(a) {
            a.m(this.he);
            a.m(this.ie);
            a.u(this.Ib);
            a.u(this.fc);
            a.u(this.ze);
            a.R(this.S)
        }
        na(a) {
            this.he = a.F();
            this.ie = a.F();
            this.Ib = a.w();
            this.fc = a.w();
            this.ze = a.w();
            this.S = a.N()
        }
        A(a) {
            var b = a[this.he];
            a = a[this.ie];
            if (null != b && null != a) {
                var c = b.a
                    , d = a.a
                    , e = c.x - d.x;
                c = c.y - d.y;
                var f = Math.sqrt(e * e + c * c);
                if (!(0 >= f)) {
                    e /= f;
                    c /= f;
                    d = b.ca / (b.ca + a.ca);
                    d != d && (d = .5);
                    if (this.Ib >= this.fc) {
                        var g = this.Ib;
                        var h = 0
                    } else if (f <= this.Ib)
                        g = this.Ib,
                            h = 1;
                    else if (f >= this.fc)
                        g = this.fc,
                            h = -1;
                    else
                        return;
                    f = g - f;
                    if (0 == 0 * this.ze)
                        d = this.ze * f * .5,
                            e *= d,
                            c *= d,
                            h = d = b.G,
                            b = b.ca,
                            d.x = h.x + e * b,
                            d.y = h.y + c * b,
                            d = b = a.G,
                            a = a.ca,
                            b.x = d.x + -e * a,
                            b.y = d.y + -c * a;
                    else {
                        g = f * d;
                        var k = b.a
                            , l = b.a;
                        k.x = l.x + e * g * .5;
                        k.y = l.y + c * g * .5;
                        l = k = a.a;
                        f -= g;
                        k.x = l.x - e * f * .5;
                        k.y = l.y - c * f * .5;
                        f = b.G;
                        g = a.G;
                        f = e * (f.x - g.x) + c * (f.y - g.y);
                        0 >= f * h && (d *= f,
                            b = h = b.G,
                            h.x = b.x - e * d,
                            h.y = b.y - c * d,
                            a = b = a.G,
                            d = f - d,
                            b.x = a.x + e * d,
                            b.y = a.y + c * d)
                    }
                }
            }
        }
    }
    class Sa {
        constructor(a) {
            this.gq = a
        }
    }
    class jb {
        constructor(a, b) {
            this.fk = a;
            this.hj = b;
            this.rc = a;
            this.jf = window.performance.now()
        }
        cn() {
            var a;
            null == a && (a = 1);
            this.A();
            return a <= this.rc ? (this.rc -= a,
                !0) : !1
        }
        qs() {
            this.A();
            let a = 1 - this.rc;
            if (0 >= a)
                return 0;
            let b = window.performance.now();
            return this.jf + a * this.hj - b
        }
        Io(a) {
            let b = this.qs();
            --this.rc;
            window.setTimeout(a, b | 0)
        }
        A() {
            let a = window.performance.now()
                , b = Math.floor((a - this.jf) / this.hj);
            this.jf += b * this.hj;
            this.rc += b;
            this.rc >= this.fk && (this.rc = this.fk,
                this.jf = a)
        }
    }
    class bc {
        constructor() {
            this.Qc = new Set;
            this.ng = 0;
            window.document.addEventListener("focusout", M(this, this.Al))
        }
        la() {
            window.document.removeEventListener("focusout", M(this, this.Al))
        }
        A() {
            let a = 0;
            this.Qc.has("Up") && (a = 1);
            this.Qc.has("Down") && (a |= 2);
            this.Qc.has("Left") && (a |= 4);
            this.Qc.has("Right") && (a |= 8);
            this.Qc.has("Kick") && (a |= 16);
            if (null != this.Bg && a != this.ng) {
                this.ng = a;
                let b = new Ja;
                b.input = a;
                this.Bg(b)
            }
        }
        Fa(a) {
            var b = a.code;
            b = m.j.Jd.v().v(b);
            null != b && (a.preventDefault(),
                this.vq(b))
        }
        ld(a) {
            a = m.j.Jd.v().v(a.code);
            null != a && this.lq(a)
        }
        vq(a) {
            this.Qc.has(a) || (this.Qc.add(a),
                this.A(),
                D.h(this.yl, a))
        }
        lq(a) {
            this.Qc.delete(a) && this.A()
        }
        Al() {
            if (null != this.Bg && 0 != this.ng) {
                this.Qc.clear();
                this.ng = 0;
                let a = new Ja;
                a.input = 0;
                this.Bg(a)
            }
        }
    }
    class xc {
        constructor() {
            this.Wc = 0;
            this.fb = [];
            this.os = new da(["Time is", "Up!"], 16777215);
            this.rr = new da(["Red is", "Victorious!"], 15035990);
            this.qr = new da(["Red", "Scores!"], 15035990);
            this.lo = new da(["Blue is", "Victorious!"], 625603);
            this.ko = new da(["Blue", "Scores!"], 625603);
            this.Pq = new da(["Game", "Paused"], 16777215)
        }
        Qa(a) {
            this.fb.push(a)
        }
        wo() {
            this.fb = [];
            this.Wc = 0
        }
        A(a) {
            0 < this.fb.length && (this.Wc += a) > this.fb[0].hp() && (this.Wc = 0,
                this.fb.shift())
        }
        Rc(a) {
            0 < this.fb.length && this.fb[0].Rc(a, this.Wc)
        }
    }
    class Bb {
        constructor() {
            this.Ck = null;
            this.f = x.Ia(Bb.O);
            var a = x.Ba(this.f);
            this.og = a.get("link");
            let b = a.get("copy");
            a = a.get("close");
            let c = this;
            this.og.onfocus = function () {
                c.og.select()
            }
                ;
            b.onclick = function () {
                c.og.select();
                return window.document.execCommand("Copy")
            }
                ;
            a.onclick = function () {
                H.h(c.sb)
            }
        }
        $r(a) {
            this.Ck != a && (this.Ck = a,
                this.og.value = a)
        }
    }
    class Ya {
        constructor(a) {
            function b(g, h) {
                function k() {
                    l.className = n.Le ? "icon-ok" : "icon-cancel"
                }
                g = c.get(g);
                let l = g.querySelector("i")
                    , n = {
                        Le: h
                    };
                k();
                g.onclick = function () {
                    n.Le = !n.Le;
                    k();
                    e.Fn(e.uj)
                }
                    ;
                return n
            }
            this.uj = [];
            this.Xs = a;
            this.Ma = x.Ia(Ya.Ij);
            let c = x.Ba(this.Ma)
                , d = new Cb(c);
            this.Ej = c.get("refresh");
            this.un = c.get("join");
            a = c.get("create");
            this.Ss = c.get("count");
            let e = this;
            a.onclick = function () {
                H.h(e.kt)
            }
                ;
            c.get("changenick").onclick = function () {
                H.h(e.jt)
            }
                ;
            c.get("settings").onclick = function () {
                H.h(e.mt)
            }
                ;
            let f = c.get("replayfile");
            f.onchange = function () {
                var g = f.files;
                if (!(1 > g.length)) {
                    g = g.item(0);
                    var h = new FileReader;
                    h.onload = function () {
                        D.h(e.lt, h.result)
                    }
                        ;
                    h.readAsArrayBuffer(g)
                }
            }
                ;
            this.Ws = b("fil-full", !0);
            this.nt = b("fil-pass", !0);
            this.Vs = b("fil-empty", !0);
            this.ct = c.get("listscroll");
            this.pt = nb.mi(this.ct);
            this.yj = c.get("list");
            this.Ej.onclick = function () {
                d.im();
                e.qn()
            }
                ;
            this.un.onclick = function () {
                null != e.Xd && D.h(e.An, e.Xd.tt)
            }
                ;
            this.qn()
        }
        qn() {
            function a() {
                d.Ej.disabled = !1;
                d.Fn(b);
                return null
            }
            this.Kn(null);
            this.Ej.disabled = !0;
            x.Qf(this.yj);
            let b = [];
            this.uj = [];
            let c = Qb.get().then(function (e) {
                return b = e
            }, function () {
                return null
            })
                , d = this;
            Ya.ot(c).then(a, a)
        }
        Fn(a) {
            this.uj = a;
            Qb.vt(this.Xs, a);
            a.sort(function (k, l) {
                return k.Ze - l.Ze
            });
            x.Qf(this.yj);
            let b = 0
                , c = 0
                , d = !this.Ws.Le
                , e = !this.nt.Le
                , f = !this.Vs.Le
                , g = this
                , h = 0;
            for (; h < a.length;) {
                let k = a[h];
                ++h;
                let l = k.ke;
                if (d && l.K >= l.lf)
                    continue;
                if (e && l.Jb)
                    continue;
                if (f && 0 == l.K)
                    continue;
                let n = new Db(k);
                n.Ma.ondblclick = function () {
                    D.h(g.An, k)
                }
                    ;
                n.Ma.onclick = function () {
                    g.Kn(n)
                }
                    ;
                this.yj.appendChild(n.Ma);
                b += l.K;
                ++c
            }
            this.Ss.textContent = "" + b + " players in " + c + " rooms";
            this.pt.update()
        }
        Kn(a) {
            null != this.Xd && this.Xd.Ma.classList.remove("selected");
            this.Xd = a;
            null != this.Xd && this.Xd.Ma.classList.add("selected");
            this.un.disabled = null == this.Xd
        }
        static ot(a) {
            let b = new Promise(function (c, d) {
                window.setTimeout(function () {
                    d(null)
                }, 5E3)
            }
            );
            return Promise.race([b, a])
        }
    }
    class qa {
        static h(a, b, c) {
            null != a && a(b, c)
        }
    }
    class Eb {
        constructor(a, b) {
            this.f = x.Ia(Eb.O);
            let c = x.Ba(this.f);
            this.nf = c.get("name");
            this.Xf = c.get("admin");
            this.df = c.get("kick");
            this.wd = c.get("close");
            let d = this;
            this.Xf.onclick = function () {
                qa.h(d.mq, d.Rb, !d.Ql)
            }
                ;
            this.df.onclick = function () {
                D.h(d.ti, d.Rb)
            }
                ;
            this.wd.onclick = function () {
                H.h(d.sb)
            }
                ;
            this.Rb = a.Z;
            this.Xj(a.D);
            this.Wj(a.cb);
            this.Xf.disabled = !b || 0 == this.Rb;
            this.df.disabled = !b || 0 == this.Rb
        }
        A(a, b) {
            a = a.ma(this.Rb);
            null == a ? H.h(this.sb) : (this.Bs(a),
                this.Xf.disabled = !b || 0 == this.Rb,
                this.df.disabled = !b || 0 == this.Rb)
        }
        Bs(a) {
            this.qe != a.D && this.Xj(a.D);
            this.Ql != a.cb && this.Wj(a.cb)
        }
        Xj(a) {
            this.qe = a;
            this.nf.textContent = a
        }
        Wj(a) {
            this.Ql = a;
            this.Xf.textContent = a ? "Remove Admin" : "Give Admin"
        }
    }
    class qc {
        constructor(a) {
            let b = []
                , c = 0;
            for (; c < a;)
                ++c,
                    b.push(0);
            this.Og = b;
            this.Mf = this.qf = 0
        }
        Qa(a) {
            this.Mf -= this.Og[this.qf];
            this.Og[this.qf] = a;
            this.Mf += a;
            this.qf++;
            this.qf >= this.Og.length && (this.qf = 0)
        }
        co() {
            return this.Mf / this.Og.length
        }
    }
    class q {
        constructor() {
            this.L = [];
            this.X = [];
            this.sa = [];
            this.wc = [];
            this.H = [];
            this.rb = [];
            this.Md = [];
            this.vd = [];
            this.Kd = new Sb;
            this.Mh = 255;
            this.Ue = this.mf = 0;
            this.$f = !0;
            this.Df = !1
        }
        rg() {
            let a = new ya;
            a.S = 16777215;
            a.i = 63;
            a.C = 193;
            a.V = 10;
            a.Ea = .99;
            a.ca = 1;
            a.o = .5;
            return a
        }
        ha(a) {
            a.m(this.Mh);
            if (!this.cf()) {
                a.Eb(this.D);
                a.R(this.ud);
                a.u(this.ce);
                a.u(this.be);
                a.u(this.bd);
                a.u(this.Gc);
                a.u(this.Te);
                a.R(this.td);
                a.u(this.bc);
                a.u(this.tc);
                a.u(this.mc);
                this.Kd.ha(a);
                a.Xb(this.mf);
                a.m(this.Ue);
                a.m(this.$f ? 1 : 0);
                a.m(this.Df ? 1 : 0);
                a.m(this.L.length);
                for (var b = 0, c = this.L.length; b < c;) {
                    var d = b++;
                    let e = this.L[d];
                    e.Dd = d;
                    e.ha(a)
                }
                a.m(this.X.length);
                b = 0;
                for (c = this.X; b < c.length;)
                    c[b++].ha(a);
                a.m(this.sa.length);
                b = 0;
                for (c = this.sa; b < c.length;)
                    c[b++].ha(a);
                a.m(this.wc.length);
                b = 0;
                for (c = this.wc; b < c.length;)
                    c[b++].ha(a);
                a.m(this.H.length);
                b = 0;
                for (c = this.H; b < c.length;)
                    c[b++].ha(a);
                a.m(this.rb.length);
                b = 0;
                for (c = this.rb; b < c.length;)
                    c[b++].ha(a);
                a.m(this.Md.length);
                b = 0;
                for (c = this.Md; b < c.length;)
                    d = c[b],
                        ++b,
                        a.u(d.x),
                        a.u(d.y);
                a.m(this.vd.length);
                b = 0;
                for (c = this.vd; b < c.length;)
                    d = c[b],
                        ++b,
                        a.u(d.x),
                        a.u(d.y)
            }
        }
        ys(a) {
            function b() {
                let f = []
                    , g = a.F()
                    , h = 0;
                for (; h < g;) {
                    ++h;
                    let k = new P(0, 0);
                    k.x = a.w();
                    k.y = a.w();
                    f.push(k)
                }
                return f
            }
            this.D = a.Ab();
            this.ud = a.N();
            this.ce = a.w();
            this.be = a.w();
            this.bd = a.w();
            this.Gc = a.w();
            this.Te = a.w();
            this.td = a.N();
            this.bc = a.w();
            this.tc = a.w();
            this.mc = a.w();
            this.Kd.na(a);
            this.mf = a.Sb();
            this.Ue = a.F();
            this.$f = 0 != a.F();
            this.Df = 0 != a.F();
            this.L = [];
            for (var c = a.F(), d = 0; d < c;) {
                var e = new G;
                e.na(a);
                e.Dd = d++;
                this.L.push(e)
            }
            this.X = [];
            c = a.F();
            for (d = 0; d < c;)
                ++d,
                    e = new I,
                    e.na(a, this.L),
                    this.X.push(e);
            this.sa = [];
            c = a.F();
            for (d = 0; d < c;)
                ++d,
                    e = new S,
                    e.na(a),
                    this.sa.push(e);
            this.wc = [];
            c = a.F();
            for (d = 0; d < c;)
                ++d,
                    e = new lb,
                    e.na(a),
                    this.wc.push(e);
            this.H = [];
            c = a.F();
            for (d = 0; d < c;)
                ++d,
                    e = new ya,
                    e.na(a),
                    this.H.push(e);
            this.rb = [];
            c = a.F();
            for (d = 0; d < c;)
                ++d,
                    e = new Ab,
                    e.na(a),
                    this.rb.push(e);
            this.Md = b();
            this.vd = b();
            this.re();
            if (!this.hn())
                throw v.B(new Sa("Invalid stadium"));
        }
        hn() {
            return 0 >= this.H.length || 0 > this.Gc || 0 > this.bd || 0 > this.Kd.V ? !1 : !0
        }
        re() {
            let a = 0
                , b = this.X;
            for (; a < b.length;)
                b[a++].re()
        }
        cf() {
            return 255 != this.Mh
        }
        me(a, b) {
            a = a[b];
            return null != a ? w.J(a, E) : 0
        }
        Yp(a) {
            a = a.canBeStored;
            return null != a ? w.J(a, Hc) : !0
        }
        De() {
            return JSON.stringify(this.us())
        }
        us() {
            if (!this.$f)
                throw v.B(0);
            let a = {};
            for (var b = 0, c = [], d = 0, e = this.L; d < e.length;) {
                var f = e[d];
                ++d;
                f.Dd = b++;
                c.push(q.Gs(f))
            }
            d = new I;
            b = [];
            e = 0;
            for (f = this.X; e < f.length;)
                b.push(q.Rr(f[e++], d));
            d = [];
            e = 0;
            for (f = this.sa; e < f.length;)
                d.push(q.Rq(f[e++]));
            e = [];
            f = 0;
            for (var g = this.wc; f < g.length;)
                e.push(q.rp(g[f++]));
            f = q.Uq(this.Kd);
            var h = new ya;
            g = [];
            for (var k = 0, l = this.H; k < l.length;)
                g.push(q.Uo(l[k++], h));
            h = [];
            k = 0;
            for (l = this.rb; k < l.length;)
                h.push(q.Jp(l[k++]));
            k = [];
            l = 0;
            for (var n = this.Md; l < n.length;) {
                var r = n[l];
                ++l;
                k.push([r.x, r.y])
            }
            l = [];
            n = 0;
            for (r = this.vd; n < r.length;) {
                let t = r[n];
                ++n;
                l.push([t.x, t.y])
            }
            c = {
                name: this.D,
                width: this.bc,
                height: this.tc,
                bg: a,
                vertexes: c,
                segments: b,
                planes: d,
                goals: e,
                discs: g,
                playerPhysics: f,
                ballPhysics: "disc0"
            };
            q.pa(c, "maxViewWidth", this.mf, 0);
            q.pa(c, "cameraFollow", 1 == this.Ue ? "player" : "", "");
            q.pa(c, "spawnDistance", this.mc, 200);
            0 != h.length && (c.joints = h);
            0 != k.length && (c.redSpawnPoints = k);
            0 != l.length && (c.blueSpawnPoints = l);
            q.pa(c, "kickOffReset", this.Df ? "full" : "partial", "partial");
            switch (this.ud) {
                case 1:
                    b = "grass";
                    break;
                case 2:
                    b = "hockey";
                    break;
                default:
                    b = "none"
            }
            q.pa(a, "type", b, "none");
            q.pa(a, "width", this.ce, 0);
            q.pa(a, "height", this.be, 0);
            q.pa(a, "kickOffRadius", this.bd, 0);
            q.pa(a, "cornerRadius", this.Gc, 0);
            q.Eg(a, this.td, 7441498);
            q.pa(a, "goalLine", this.Te, 0);
            return c
        }
        fl(a) {
            function b(h) {
                let k = w.J(h[0], E);
                h = w.J(h[1], E);
                null == h && (h = 0);
                null == k && (k = 0);
                return new P(k, h)
            }
            function c(h, k, l, n) {
                null == n && (n = !1);
                var r = d[k];
                if (!n || null != r)
                    if (n = w.J(r, Array),
                        null != n)
                        for (r = 0; r < n.length;) {
                            let t = n[r];
                            ++r;
                            try {
                                q.ao(t, f),
                                    h.push(l(t))
                            } catch (z) {
                                throw v.B(new Sa('Error in "' + k + '" index: ' + h.length));
                            }
                        }
            }
            let d = JSON5.parse(a);
            this.L = [];
            this.X = [];
            this.sa = [];
            this.wc = [];
            this.H = [];
            this.rb = [];
            this.D = w.J(d.name, String);
            this.bc = w.J(d.width, E);
            this.tc = w.J(d.height, E);
            this.mf = this.me(d, "maxViewWidth") | 0;
            "player" == d.cameraFollow && (this.Ue = 1);
            this.mc = 200;
            a = d.spawnDistance;
            null != a && (this.mc = w.J(a, E));
            a = d.bg;
            let e;
            switch (a.type) {
                case "grass":
                    e = 1;
                    break;
                case "hockey":
                    e = 2;
                    break;
                default:
                    e = 0
            }
            this.ud = e;
            this.ce = this.me(a, "width");
            this.be = this.me(a, "height");
            this.bd = this.me(a, "kickOffRadius");
            this.Gc = this.me(a, "cornerRadius");
            this.td = 7441498;
            null != a.color && (this.td = q.pg(a.color));
            this.Te = this.me(a, "goalLine");
            this.$f = this.Yp(d);
            this.Df = "full" == d.kickOffReset;
            let f = d.traits;
            a = d.ballPhysics;
            "disc0" != a && (null != a ? (a = q.gl(a, this.rg()),
                a.C |= 192,
                this.H.push(a)) : this.H.push(this.rg()));
            c(this.L, "vertexes", q.Xp);
            let g = this;
            c(this.X, "segments", function (h) {
                return q.Wp(h, g.L)
            });
            c(this.wc, "goals", q.Sp);
            c(this.H, "discs", function (h) {
                return q.gl(h, new ya)
            });
            c(this.sa, "planes", q.Up);
            c(this.rb, "joints", function (h) {
                return q.Tp(h, g.H)
            }, !0);
            c(this.Md, "redSpawnPoints", b, !0);
            c(this.vd, "blueSpawnPoints", b, !0);
            a = d.playerPhysics;
            null != a && (this.Kd = q.Vp(a));
            if (255 < this.L.length || 255 < this.X.length || 255 < this.sa.length || 255 < this.wc.length || 255 < this.H.length)
                throw v.B("Error");
            this.re();
            if (!this.hn())
                throw v.B(new Sa("Invalid stadium"));
        }
        mk() {
            let a = q.ss;
            a.a = 0;
            this.ha(a);
            let b = new uc;
            b.Ns(a.Wb());
            b.hash = (b.hash += b.hash << 3) ^ b.hash >>> 11;
            b.hash += b.hash << 15;
            return b.hash | 0
        }
        to(a, b) {
            let c = 0
                , d = this.wc;
            for (; c < d.length;) {
                let h = d[c];
                ++c;
                var e = h.$
                    , f = h.ea
                    , g = b.x - a.x;
                let k = b.y - a.y;
                0 < -(e.y - a.y) * g + (e.x - a.x) * k == 0 < -(f.y - a.y) * g + (f.x - a.x) * k ? e = !1 : (g = f.x - e.x,
                    f = f.y - e.y,
                    e = 0 < -(a.y - e.y) * g + (a.x - e.x) * f == 0 < -(b.y - e.y) * g + (b.x - e.x) * f ? !1 : !0);
                if (e)
                    return h.Be
            }
            return u.Pa
        }
        jd(a, b, c, d, e, f, g, h) {
            null == h && (h = 0);
            this.D = a;
            this.H.push(this.rg());
            this.bc = b;
            this.tc = c;
            this.ud = 1;
            this.td = 7441498;
            this.ce = d;
            this.be = e;
            this.bd = g;
            this.Gc = h;
            this.mc = .75 * d;
            400 < this.mc && (this.mc = 400);
            a = new S;
            var k = a.ya;
            k.x = 0;
            k.y = 1;
            a.Va = -c;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = 0;
            k.y = -1;
            a.Va = -c;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = 1;
            k.y = 0;
            a.Va = -b;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = -1;
            k.y = 0;
            a.Va = -b;
            a.o = 0;
            this.sa.push(a);
            this.sg(d, 1, f, 13421823, u.Da);
            this.sg(-d, -1, f, 16764108, u.ja);
            this.ll(g, c);
            b = new S;
            c = b.ya;
            c.x = 0;
            c.y = 1;
            b.Va = -e;
            b.i = 1;
            this.sa.push(b);
            b = new S;
            c = b.ya;
            c.x = 0;
            c.y = -1;
            b.Va = -e;
            b.i = 1;
            this.sa.push(b);
            b = new G;
            c = b.a;
            c.x = -d;
            c.y = -e;
            b.i = 0;
            c = new G;
            g = c.a;
            g.x = d;
            g.y = -e;
            c.i = 0;
            g = new G;
            a = g.a;
            a.x = d;
            a.y = -f;
            g.i = 0;
            a = new G;
            k = a.a;
            k.x = d;
            k.y = f;
            a.i = 0;
            k = new G;
            var l = k.a;
            l.x = d;
            l.y = e;
            k.i = 0;
            l = new G;
            var n = l.a;
            n.x = -d;
            n.y = e;
            l.i = 0;
            n = new G;
            var r = n.a;
            r.x = -d;
            r.y = f;
            n.i = 0;
            r = new G;
            var t = r.a;
            t.x = -d;
            t.y = -f;
            r.i = 0;
            f = new I;
            f.$ = c;
            f.ea = g;
            f.i = 1;
            f.bb = !1;
            t = new I;
            t.$ = a;
            t.ea = k;
            t.i = 1;
            t.bb = !1;
            let z = new I;
            z.$ = l;
            z.ea = n;
            z.i = 1;
            z.bb = !1;
            let L = new I;
            L.$ = r;
            L.ea = b;
            L.i = 1;
            L.bb = !1;
            this.L.push(b);
            this.L.push(c);
            this.L.push(g);
            this.L.push(a);
            this.L.push(k);
            this.L.push(l);
            this.L.push(n);
            this.L.push(r);
            this.X.push(f);
            this.X.push(t);
            this.X.push(z);
            this.X.push(L);
            this.jl(d, e, h);
            this.re()
        }
        kl(a, b, c, d, e, f, g, h) {
            this.D = a;
            this.H.push(this.rg());
            this.bc = b;
            this.tc = c;
            this.ud = 2;
            this.ce = d;
            this.be = e;
            this.bd = 75;
            this.Gc = h;
            this.Te = g;
            this.mc = .75 * (d - g);
            400 < this.mc && (this.mc = 400);
            a = new S;
            var k = a.ya;
            k.x = 0;
            k.y = 1;
            a.Va = -c;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = 0;
            k.y = -1;
            a.Va = -c;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = 1;
            k.y = 0;
            a.Va = -b;
            a.o = 0;
            this.sa.push(a);
            a = new S;
            k = a.ya;
            k.x = -1;
            k.y = 0;
            a.Va = -b;
            a.o = 0;
            this.sa.push(a);
            this.sg(d - g, 1, f, 13421823, u.Da, 63);
            this.sg(-d + g, -1, f, 16764108, u.ja, 63);
            this.ll(75, c);
            b = new S;
            c = b.ya;
            c.x = 0;
            c.y = 1;
            b.Va = -e;
            b.i = 1;
            this.sa.push(b);
            b = new S;
            c = b.ya;
            c.x = 0;
            c.y = -1;
            b.Va = -e;
            b.i = 1;
            this.sa.push(b);
            b = new S;
            c = b.ya;
            c.x = 1;
            c.y = 0;
            b.Va = -d;
            b.i = 1;
            this.sa.push(b);
            b = new S;
            c = b.ya;
            c.x = -1;
            c.y = 0;
            b.Va = -d;
            b.i = 1;
            this.sa.push(b);
            this.jl(d, e, h);
            this.re()
        }
        sg(a, b, c, d, e, f) {
            var g;
            null == g && (g = 32);
            null == f && (f = 1);
            var h = new G
                , k = h.a;
            k.x = a + 8 * b;
            k.y = -c;
            k = new G;
            var l = k.a;
            l.x = a + 8 * b;
            l.y = c;
            let n = new G;
            l = n.a;
            l.x = h.a.x + 22 * b;
            l.y = h.a.y + 22;
            let r = new G;
            l = r.a;
            l.x = k.a.x + 22 * b;
            l.y = k.a.y - 22;
            l = new I;
            l.$ = h;
            l.ea = n;
            l.Vc(90 * b);
            let t = new I;
            t.$ = r;
            t.ea = n;
            let z = new I;
            z.$ = r;
            z.ea = k;
            z.Vc(90 * b);
            b = this.L.length;
            this.L.push(h);
            this.L.push(k);
            this.L.push(n);
            this.L.push(r);
            h = b;
            for (b = this.L.length; h < b;)
                k = h++,
                    this.L[k].i = f,
                    this.L[k].C = g,
                    this.L[k].o = .1;
            b = this.X.length;
            this.X.push(l);
            this.X.push(t);
            this.X.push(z);
            h = b;
            for (b = this.X.length; h < b;)
                k = h++,
                    this.X[k].i = f,
                    this.X[k].C = g,
                    this.X[k].o = .1;
            f = new ya;
            g = f.a;
            g.x = a;
            g.y = -c;
            f.ca = 0;
            f.V = 8;
            f.S = d;
            this.H.push(f);
            f = new ya;
            g = f.a;
            g.x = a;
            g.y = c;
            f.ca = 0;
            f.V = 8;
            f.S = d;
            this.H.push(f);
            d = new lb;
            f = d.$;
            f.x = a;
            f.y = -c;
            f = d.ea;
            f.x = a;
            f.y = c;
            d.Be = e;
            this.wc.push(d)
        }
        ll(a, b) {
            let c = new G;
            var d = c.a;
            d.x = 0;
            d.y = -b;
            c.o = .1;
            c.C = 24;
            c.i = 6;
            d = new G;
            var e = d.a;
            e.x = 0;
            e.y = -a;
            d.o = .1;
            d.C = 24;
            d.i = 6;
            e = new G;
            var f = e.a;
            f.x = 0;
            f.y = a;
            e.o = .1;
            e.C = 24;
            e.i = 6;
            a = new G;
            f = a.a;
            f.x = 0;
            f.y = b;
            a.o = .1;
            a.C = 24;
            a.i = 6;
            b = new I;
            b.$ = c;
            b.ea = d;
            b.C = 24;
            b.i = 6;
            b.bb = !1;
            b.o = .1;
            f = new I;
            f.$ = e;
            f.ea = a;
            f.C = 24;
            f.i = 6;
            f.bb = !1;
            f.o = .1;
            let g = new I;
            g.$ = d;
            g.ea = e;
            g.C = 8;
            g.i = 6;
            g.bb = !1;
            g.Vc(180);
            g.o = .1;
            let h = new I;
            h.$ = e;
            h.ea = d;
            h.C = 16;
            h.i = 6;
            h.bb = !1;
            h.Vc(180);
            h.o = .1;
            this.L.push(c);
            this.L.push(d);
            this.L.push(e);
            this.L.push(a);
            this.X.push(b);
            this.X.push(f);
            this.X.push(g);
            this.X.push(h)
        }
        jl(a, b, c) {
            if (!(0 >= c)) {
                var d = new G
                    , e = d.a;
                e.x = -a + c;
                e.y = -b;
                d.i = 0;
                e = new G;
                var f = e.a;
                f.x = -a;
                f.y = -b + c;
                e.i = 0;
                f = new G;
                var g = f.a;
                g.x = -a + c;
                g.y = b;
                f.i = 0;
                g = new G;
                var h = g.a;
                h.x = -a;
                h.y = b - c;
                g.i = 0;
                h = new G;
                var k = h.a;
                k.x = a - c;
                k.y = b;
                h.i = 0;
                k = new G;
                var l = k.a;
                l.x = a;
                l.y = b - c;
                k.i = 0;
                l = new G;
                var n = l.a;
                n.x = a - c;
                n.y = -b;
                l.i = 0;
                n = new G;
                var r = n.a;
                r.x = a;
                r.y = -b + c;
                n.i = 0;
                a = new I;
                a.$ = d;
                a.ea = e;
                a.i = 1;
                a.bb = !1;
                a.o = 1;
                a.Vc(-90);
                b = new I;
                b.$ = f;
                b.ea = g;
                b.i = 1;
                b.bb = !1;
                b.o = 1;
                b.Vc(90);
                c = new I;
                c.$ = h;
                c.ea = k;
                c.i = 1;
                c.bb = !1;
                c.o = 1;
                c.Vc(-90);
                r = new I;
                r.$ = l;
                r.ea = n;
                r.i = 1;
                r.bb = !1;
                r.o = 1;
                r.Vc(90);
                this.L.push(d);
                this.L.push(e);
                this.L.push(f);
                this.L.push(g);
                this.L.push(h);
                this.L.push(k);
                this.L.push(l);
                this.L.push(n);
                this.X.push(a);
                this.X.push(b);
                this.X.push(c);
                this.X.push(r)
            }
        }
        static na(a) {
            var b = a.F();
            return 255 == b ? (b = new q,
                b.ys(a),
                b) : q.Uh()[b]
        }
        static Uh() {
            if (null == q.wb) {
                q.wb = [];
                var a = new q;
                a.jd("Classic", 420, 200, 370, 170, 64, 75);
                q.wb.push(a);
                a = new q;
                a.jd("Easy", 420, 200, 370, 170, 90, 75);
                q.wb.push(a);
                a = new q;
                a.jd("Small", 420, 200, 320, 130, 55, 70);
                q.wb.push(a);
                a = new q;
                a.jd("Big", 600, 270, 550, 240, 80, 80);
                q.wb.push(a);
                a = new q;
                a.jd("Rounded", 420, 200, 370, 170, 64, 75, 75);
                q.wb.push(a);
                a = new q;
                a.kl("Hockey", 420, 204, 398, 182, 68, 120, 100);
                q.wb.push(a);
                a = new q;
                a.kl("Big Hockey", 600, 270, 550, 240, 90, 160, 150);
                q.wb.push(a);
                a = new q;
                a.jd("Big Easy", 600, 270, 550, 240, 95, 80);
                q.wb.push(a);
                a = new q;
                a.jd("Big Rounded", 600, 270, 550, 240, 80, 75, 100);
                q.wb.push(a);
                a = new q;
                a.jd("Huge", 750, 350, 700, 320, 100, 80);
                q.wb.push(a);
                a = 0;
                let b = q.wb.length;
                for (; a < b;) {
                    let c = a++;
                    q.wb[c].Mh = c
                }
            }
            return q.wb
        }
        static ao(a, b) {
            if (null != a.trait && (b = b[w.J(a.trait, String)],
                null != b)) {
                let c = 0
                    , d = Ic.on(b);
                for (; c < d.length;) {
                    let e = d[c];
                    ++c;
                    null == a[e] && (a[e] = b[e])
                }
            }
        }
        static mo(a) {
            if (63 == a)
                return ["all"];
            let b = [];
            0 != (a & 2) && b.push("red");
            0 != (a & 4) && b.push("blue");
            0 != (a & 1) && b.push("ball");
            0 != (a & 8) && b.push("redKO");
            0 != (a & 16) && b.push("blueKO");
            0 != (a & 32) && b.push("wall");
            0 != (a & 64) && b.push("kick");
            0 != (a & 128) && b.push("score");
            0 != (a & 268435456) && b.push("c0");
            0 != (a & 536870912) && b.push("c1");
            0 != (a & 1073741824) && b.push("c2");
            0 != (a & -2147483648) && b.push("c3");
            return b
        }
        static Kc(a) {
            a = w.J(a, Array);
            let b = 0
                , c = 0;
            for (; c < a.length;)
                switch (a[c++]) {
                    case "all":
                        b |= 63;
                        break;
                    case "ball":
                        b |= 1;
                        break;
                    case "blue":
                        b |= 4;
                        break;
                    case "blueKO":
                        b |= 16;
                        break;
                    case "c0":
                        b |= 268435456;
                        break;
                    case "c1":
                        b |= 536870912;
                        break;
                    case "c2":
                        b |= 1073741824;
                        break;
                    case "c3":
                        b |= -2147483648;
                        break;
                    case "kick":
                        b |= 64;
                        break;
                    case "red":
                        b |= 2;
                        break;
                    case "redKO":
                        b |= 8;
                        break;
                    case "score":
                        b |= 128;
                        break;
                    case "wall":
                        b |= 32
                }
            return b
        }
        static Pc(a, b, c, d) {
            c != d && (a[b] = q.mo(c))
        }
        static Eg(a, b, c) {
            b != c && (a.color = q.Ao(b))
        }
        static Ao(a) {
            a |= 0;
            return 0 > a ? "transparent" : Y.hh(a)
        }
        static pg(a) {
            if ("transparent" == a)
                return -1;
            if ("string" == typeof a)
                return Q.parseInt("0x" + Q.Je(a));
            if (a instanceof Array)
                return ((a[0] | 0) << 16) + ((a[1] | 0) << 8) + (a[2] | 0);
            throw v.B("Bad color");
        }
        static Gs(a) {
            let b = {
                x: a.a.x,
                y: a.a.y
            };
            q.pa(b, "bCoef", a.o, 1);
            q.Pc(b, "cMask", a.i, 63);
            q.Pc(b, "cGroup", a.C, 32);
            return b
        }
        static Xp(a) {
            let b = new G;
            b.a.x = w.J(a.x, E);
            b.a.y = w.J(a.y, E);
            var c = a.bCoef;
            null != c && (b.o = w.J(c, E));
            c = a.cMask;
            null != c && (b.i = q.Kc(c));
            a = a.cGroup;
            null != a && (b.C = q.Kc(a));
            return b
        }
        static Rr(a, b) {
            let c = {
                v0: a.$.Dd,
                v1: a.ea.Dd
            };
            q.pa(c, "bias", a.Hc, b.Hc);
            q.pa(c, "bCoef", a.o, b.o);
            let d = a.kp();
            q.pa(c, "curve", d, 0);
            0 != d && (c.curveF = a.vb);
            q.pa(c, "vis", a.bb, b.bb);
            q.Pc(c, "cMask", a.i, b.i);
            q.Pc(c, "cGroup", a.C, b.C);
            q.Eg(c, a.S, b.S);
            return c
        }
        static Wp(a, b) {
            let c = new I;
            var d = w.J(a.v1, cc);
            c.$ = b[w.J(a.v0, cc)];
            c.ea = b[d];
            b = a.bias;
            d = a.bCoef;
            let e = a.curve
                , f = a.curveF
                , g = a.vis
                , h = a.cMask
                , k = a.cGroup;
            a = a.color;
            null != b && (c.Hc = w.J(b, E));
            null != d && (c.o = w.J(d, E));
            null != f ? c.vb = w.J(f, E) : null != e && c.Vc(w.J(e, E));
            null != g && (c.bb = w.J(g, Hc));
            null != h && (c.i = q.Kc(h));
            null != k && (c.C = q.Kc(k));
            null != a && (c.S = q.pg(a));
            return c
        }
        static Jp(a) {
            let b = {
                d0: a.he,
                d1: a.ie,
                length: a.Ib >= a.fc ? a.Ib : [a.Ib, a.fc]
            };
            q.Eg(b, a.S, 0);
            q.pa(b, "strength", a.ze, 1 / 0);
            return b
        }
        static Tp(a, b) {
            let c = new Ab;
            var d = w.J(a.d0, cc)
                , e = w.J(a.d1, cc);
            let f = a.color
                , g = a.strength;
            a = a.length;
            if (d >= b.length || 0 > d)
                throw v.B(null);
            if (e >= b.length || 0 > e)
                throw v.B(null);
            c.he = d;
            c.ie = e;
            null == a ? (d = b[d],
                e = b[e],
                null == d || null == e ? c.fc = c.Ib = 100 : (b = d.a,
                    d = e.a,
                    e = b.x - d.x,
                    b = b.y - d.y,
                    c.fc = c.Ib = Math.sqrt(e * e + b * b))) : a instanceof Array ? (c.Ib = w.J(a[0], E),
                        c.fc = w.J(a[1], E)) : c.fc = c.Ib = w.J(a, E);
            c.ze = null == g || "rigid" == g ? 1 / 0 : w.J(g, E);
            null != f && (c.S = q.pg(f));
            return c
        }
        static Rq(a) {
            let b = {
                normal: [a.ya.x, a.ya.y],
                dist: a.Va
            };
            q.pa(b, "bCoef", a.o, 1);
            q.Pc(b, "cMask", a.i, 63);
            q.Pc(b, "cGroup", a.C, 32);
            return b
        }
        static Up(a) {
            let b = new S;
            var c = w.J(a.normal, Array)
                , d = w.J(c[0], E)
                , e = w.J(c[1], E);
            c = b.ya;
            let f = d;
            var g = e;
            null == e && (g = 0);
            null == d && (f = 0);
            d = f;
            e = Math.sqrt(d * d + g * g);
            c.x = d / e;
            c.y = g / e;
            b.Va = w.J(a.dist, E);
            c = a.bCoef;
            d = a.cMask;
            a = a.cGroup;
            null != c && (b.o = w.J(c, E));
            null != d && (b.i = q.Kc(d));
            null != a && (b.C = q.Kc(a));
            return b
        }
        static rp(a) {
            return {
                p0: [a.$.x, a.$.y],
                p1: [a.ea.x, a.ea.y],
                team: a.Be == u.ja ? "red" : "blue"
            }
        }
        static Sp(a) {
            let b = new lb;
            var c = w.J(a.p0, Array);
            let d = w.J(a.p1, Array)
                , e = b.$;
            e.x = c[0];
            e.y = c[1];
            c = b.ea;
            c.x = d[0];
            c.y = d[1];
            switch (a.team) {
                case "blue":
                    a = u.Da;
                    break;
                case "red":
                    a = u.ja;
                    break;
                default:
                    throw v.B("Bad team value");
            }
            b.Be = a;
            return b
        }
        static Uq(a) {
            let b = {};
            q.pa(b, "bCoef", a.o, .5);
            q.pa(b, "invMass", a.ca, .5);
            q.pa(b, "damping", a.Ea, .96);
            q.pa(b, "acceleration", a.Qe, .1);
            q.pa(b, "kickingAcceleration", a.gf, .07);
            q.pa(b, "kickingDamping", a.hf, .96);
            q.pa(b, "kickStrength", a.ef, 5);
            q.Pc(b, "cGroup", a.C, 0);
            if (0 != a.ra.x || 0 != a.ra.y)
                b.gravity = [a.ra.x, a.ra.y];
            q.pa(b, "radius", a.V, 15);
            q.pa(b, "kickback", a.ff, 0);
            return b
        }
        static Vp(a) {
            let b = new Sb;
            var c = a.bCoef
                , d = a.invMass;
            let e = a.damping
                , f = a.acceleration
                , g = a.kickingAcceleration
                , h = a.kickingDamping
                , k = a.kickStrength
                , l = a.gravity
                , n = a.cGroup
                , r = a.radius;
            a = a.kickback;
            null != c && (b.o = w.J(c, E));
            null != d && (b.ca = w.J(d, E));
            null != e && (b.Ea = w.J(e, E));
            null != f && (b.Qe = w.J(f, E));
            null != g && (b.gf = w.J(g, E));
            null != h && (b.hf = w.J(h, E));
            null != k && (b.ef = w.J(k, E));
            null != l && (c = b.ra,
                d = w.J(l[1], E),
                c.x = w.J(l[0], E),
                c.y = d);
            null != n && (b.C = q.Kc(n));
            null != r && (b.V = w.J(r, E));
            null != a && (b.ff = w.J(a, E));
            return b
        }
        static Uo(a, b) {
            let c = {};
            if (a.a.x != b.a.x || a.a.y != b.a.y)
                c.pos = [a.a.x, a.a.y];
            if (a.G.x != b.G.x || a.G.y != b.G.y)
                c.speed = [a.G.x, a.G.y];
            if (a.ra.x != b.ra.x || a.ra.y != b.ra.y)
                c.gravity = [a.ra.x, a.ra.y];
            q.pa(c, "radius", a.V, b.V);
            q.pa(c, "bCoef", a.o, b.o);
            q.pa(c, "invMass", a.ca, b.ca);
            q.pa(c, "damping", a.Ea, b.Ea);
            q.Eg(c, a.S, b.S);
            q.Pc(c, "cMask", a.i, b.i);
            q.Pc(c, "cGroup", a.C, b.C);
            return c
        }
        static gl(a, b) {
            var c = a.pos
                , d = a.speed;
            let e = a.gravity
                , f = a.radius
                , g = a.bCoef
                , h = a.invMass
                , k = a.damping
                , l = a.color
                , n = a.cMask;
            a = a.cGroup;
            if (null != c) {
                let r = b.a;
                r.x = c[0];
                r.y = c[1]
            }
            null != d && (c = b.G,
                c.x = d[0],
                c.y = d[1]);
            null != e && (d = b.ra,
                d.x = e[0],
                d.y = e[1]);
            null != f && (b.V = w.J(f, E));
            null != g && (b.o = w.J(g, E));
            null != h && (b.ca = w.J(h, E));
            null != k && (b.Ea = w.J(k, E));
            null != l && (b.S = q.pg(l));
            null != n && (b.i = q.Kc(n));
            null != a && (b.C = q.Kc(a));
            return b
        }
        static pa(a, b, c, d) {
            c != d && (a[b] = c)
        }
    }
    class zb {
        constructor(a) {
            this.f = x.Ia(zb.O);
            x.Ba(this.f).get("features").textContent = a.join(", ")
        }
    }
    class ca {
        constructor(a, b, c) {
            this.f = x.Ia(ca.O);
            var d = x.Ba(this.f);
            d.get("ok");
            d.get("cancel");
            this.ee = d.get("content");
            let e = d.get("title");
            d = d.get("buttons");
            let f = 0
                , g = this
                , h = 0;
            for (; h < c.length;) {
                let k = c[h++]
                    , l = f++
                    , n = window.document.createElement("button");
                n.textContent = k;
                n.onclick = function () {
                    D.h(g.Wa, l)
                }
                    ;
                d.appendChild(n)
            }
            this.ee.textContent = b;
            e.textContent = a
        }
    }
    class za {
        constructor(a) {
            this.ul = this.tl = this.wl = null;
            this.jb = new hb;
            this.od = !1;
            this.Jf = new Fb;
            this.Ka = new Xa;
            this.Xa = new ib(a);
            this.jb.Rb = a;
            this.f = x.Ia(za.O);
            a = x.Ba(this.f);
            this.ws = a.get("top-section");
            this.yf = a.get("popups");
            this.yf.style.display = "none";
            a.get("gameplay").appendChild(this.jb.f);
            x.replaceWith(a.get("chatbox"), this.Ka.f);
            x.replaceWith(a.get("stats"), this.Jf.f);
            this.ri = a.get("menu");
            let b = this;
            this.ri.onclick = function () {
                b.xe(!b.od);
                b.ri.blur()
            }
                ;
            new yc(a.get("sound"));
            a.get("settings").onclick = function () {
                let c = new ma;
                c.sb = function () {
                    b.ab(null)
                }
                    ;
                b.ab(c.f)
            }
                ;
            this.Xa.oe = function () {
                let c = new kb;
                c.sb = function (d) {
                    b.ab(null);
                    d && H.h(b.oe)
                }
                    ;
                b.ab(c.f)
            }
                ;
            this.Xa.Iq = function () {
                let c = new mb;
                c.si = function () {
                    b.ab(null)
                }
                    ;
                c.Cg = function (d) {
                    D.h(b.Cg, d);
                    b.ab(null)
                }
                    ;
                c.ui = function (d) {
                    d = new ca("Error loading stadium", d, ["Ok"]);
                    d.Wa = function () {
                        b.ab(null)
                    }
                        ;
                    b.ab(d.f)
                }
                    ;
                b.ab(c.f)
            }
        }
        Wr(a) {
            this.ul != a && (this.ul = a,
                this.f.style.setProperty("--chat-opacity", "" + a))
        }
        Vr(a) {
            this.tl != a && (this.tl = a,
                this.f.classList.toggle("chat-bg-full", a))
        }
        es(a) {
            this.wl != a && (this.wl = a,
                this.jb.f.classList.toggle("restricted", a))
        }
        A(a) {
            null == a.T.M && this.xe(!0);
            this.od && this.Xa.A(a.T, a.T.ma(a.yc));
            H.h(this.Yl);
            this.ri.disabled = null == a.T.M;
            let b = m.j.Rd.v()
                , c = this.jb.hb;
            c.ue = m.j.Li.v();
            this.Wr(m.j.Hh.v());
            this.Vr("full" == m.j.kk.v());
            this.es(0 == b);
            let d = this.Ka.f.getBoundingClientRect().height;
            0 == b ? (c.Ig = 1,
                c.Ld = 0,
                c.Wg = 0,
                this.jb.hb.Ch = 0,
                this.jb.f.style.paddingBottom = d + "px") : (c.Wg = 35,
                    0 >= b ? c.Ld = 610 : (c.Ld = 0,
                        c.Ig = 1 + .25 * (b - 1)),
                    this.jb.hb.Ch = d * window.devicePixelRatio,
                    this.jb.f.style.paddingBottom = "0");
            a = a.hg();
            this.jb.A(a);
            m.Ra.tk.zt(a)
        }
        xe(a) {
            this.od != a && (this.od = a,
                this.f.classList.toggle("showing-room-view", this.od),
                this.od ? this.ws.appendChild(this.Xa.f) : this.Xa.f.remove())
        }
        $k() {
            return null != za.Vq
        }
        ab(a, b) {
            x.Qf(this.yf);
            za.Vq = a;
            null != a ? (this.yf.style.display = "flex",
                this.yf.appendChild(a),
                this.Yl = b) : (this.yf.style.display = "none",
                    this.Yl = null)
        }
    }
    class Vb {
        constructor(a, b) {
            this.$j = [];
            this.tr = /[#@][^\s@#]*$/;
            this.Qb = a;
            this.Cq = b;
            a.hidden = !0
        }
        ai() {
            this.jj(null)
        }
        qo(a, b) {
            b = this.tr.exec(O.substr(a, 0, b));
            if (null != b) {
                var c = b[0]
                    , d = O.substr(c, 1, null).split("")
                    , e = Vb.cp
                    , f = Array(d.length);
                let g = 0
                    , h = d.length;
                for (; g < h;) {
                    let l = g++;
                    f[l] = e(d[l])
                }
                let k = new RegExp(f.join(".*?"), "i");
                this.Zk = "#" == c.charAt(0);
                this.Hi = b.index;
                this.Gr = c.length;
                this.mm = a;
                a = function (l) {
                    l = k.exec(l.D);
                    return null == l ? -1 : l.index + l[0].length
                }
                    ;
                b = [];
                c = 0;
                for (d = this.$j; c < d.length;)
                    e = d[c],
                        ++c,
                        f = a(e),
                        0 <= f && b.push({
                            Jn: f,
                            item: e
                        });
                b.sort(function (l, n) {
                    return l.Jn - n.Jn
                });
                this.jj(b)
            } else
                this.jj(null)
        }
        Hk(a) {
            a = this.Zk ? "#" + a.ba : "@" + Y.replace(a.D, " ", "_");
            this.Cq(O.substr(this.mm, 0, this.Hi) + a + " " + O.substr(this.mm, this.Hi + this.Gr, null), this.Hi + a.length + 1)
        }
        jj(a) {
            var b = null != a && 0 != a.length;
            this.Qb.hidden || x.Qf(this.Qb);
            this.dd = null;
            this.Qb.hidden = !b;
            if (b) {
                var c = this;
                b = [];
                for (var d = 0; d < a.length;) {
                    var e = a[d++];
                    let f = window.document.createElement("div")
                        , g = e.item;
                    e = g.D;
                    this.Zk && (e = "(" + g.ba + ") " + e);
                    f.textContent = e;
                    this.Qb.appendChild(f);
                    f.onclick = function () {
                        c.Hk(g)
                    }
                        ;
                    b.push({
                        item: g,
                        Ma: f
                    })
                }
                this.dd = b;
                this.dd[0].Ma.classList.toggle("selected", !0);
                this.Ac = 0
            }
        }
        ik(a) {
            if (null != this.dd) {
                var b = this.Ac;
                this.Ac += a;
                a = this.dd.length - 1;
                0 > this.Ac ? this.Ac = a : this.Ac > a && (this.Ac = 0);
                a = this.dd[this.Ac];
                b != this.Ac && (a.Ma.classList.toggle("selected", !0),
                    this.dd[b].Ma.classList.toggle("selected", !1));
                a = a.Ma;
                b = a.offsetTop;
                a = b + a.offsetHeight;
                var c = this.Qb.scrollTop + this.Qb.clientHeight;
                b < this.Qb.scrollTop ? this.Qb.scrollTop = b : a > c && (this.Qb.scrollTop = a - this.Qb.clientHeight)
            }
        }
        Yo() {
            null != this.dd && (this.Hk(this.dd[this.Ac].item),
                this.ai())
        }
        static cp(a) {
            return -1 != ".$^{[(|)*+?\\".indexOf(a) ? "\\" + a : a
        }
    }
    class Cb {
        constructor(a) {
            this.rl = a.get("notice");
            this.Jo = a.get("notice-contents");
            this.wd = a.get("notice-close");
            this.im()
        }
        im() {
            let a = this;
            Z.Ok(m.Se + "api/notice").then(function (b) {
                let c = b.content;
                null != c && "" != c && Cb.xo != c && (a.Jo.innerHTML = c,
                    a.rl.hidden = !1,
                    a.wd.onclick = function () {
                        Cb.xo = c;
                        return a.rl.hidden = !0
                    }
                )
            })
        }
    }
    class ac {
        constructor(a) {
            this.Fe = a
        }
    }
    class oc {
        constructor() { }
    }
    class xb {
        constructor(a) {
            function b() {
                d.Ic() && null != d.Cl && d.Cl(d.Db.value)
            }
            this.f = x.Ia(xb.O);
            let c = x.Ba(this.f);
            this.Db = c.get("input");
            this.rf = c.get("ok");
            let d = this;
            this.Db.maxLength = 25;
            this.Db.value = a;
            this.Db.oninput = function () {
                d.A()
            }
                ;
            this.Db.onkeydown = function (e) {
                13 == e.keyCode && b()
            }
                ;
            this.rf.onclick = b;
            this.A()
        }
        Ic() {
            let a = this.Db.value;
            return 25 >= a.length ? 0 < a.length : !1
        }
        A() {
            this.rf.disabled = !this.Ic()
        }
    }
    class dc {
        constructor(a, b, c, d, e, f) {
            this.yh = this.Jh = !1;
            this.ua = new Ca(0, b, d);
            let g = this;
            this.ua.kd = function () {
                g.je(ia.$d)
            }
                ;
            this.ua.Hd = function () {
                null != g.Hd && g.Hd(new Pb(g.ua));
                g.ua = null;
                g.pk()
            }
                ;
            (async function () {
                try {
                    let h = await g.ua.No();
                    g.aa = new WebSocket(a + "client?id=" + c + (null == f ? "" : "&token=" + f));
                    g.aa.binaryType = "arraybuffer";
                    g.aa.onclose = function (k) {
                        g.Jh || g.je(ia.Ne(k.code))
                    }
                        ;
                    g.aa.onerror = function () {
                        g.Jh || g.je(ia.Error)
                    }
                        ;
                    g.aa.onmessage = M(g, g.$h);
                    g.aa.onopen = function () {
                        null != g.Gl && g.Gl();
                        g.ua.bj();
                        g.Qi(h, g.ua.ig, e);
                        g.ua.xg = M(g, g.Ni);
                        g.ua.jg.then(function () {
                            g.Uc(0, null)
                        })
                    }
                } catch (h) {
                    g.je(ia.$d)
                }
            }
            )()
        }
        po() {
            this.je(ia.Me)
        }
        pk() {
            null != this.aa && (this.aa.onclose = null,
                this.aa.onmessage = null,
                this.aa.onerror = null,
                this.aa.onopen = null,
                this.aa.close(),
                this.aa = null);
            null != this.ua && (this.ua.la(),
                this.ua = null)
        }
        je(a) {
            null != this.kd && this.kd(a);
            this.pk()
        }
        $h(a) {
            var b = new J(new DataView(a.data));
            a = b.F();
            0 < b.s.byteLength - b.a && (b = pako.inflateRaw(b.lb()),
                b = new J(new DataView(b.buffer, b.byteOffset, b.byteLength), !1));
            switch (a) {
                case 1:
                    a = b.kc();
                    b = b.Jg();
                    let c = []
                        , d = 0;
                    for (; d < b.length;)
                        c.push(new RTCIceCandidate(b[d++]));
                    this.Zh(a, c);
                    break;
                case 4:
                    this.Yh(new RTCIceCandidate(b.Jg()))
            }
        }
        Zh(a, b) {
            this.ua.bj(this.yh ? 1E4 : 4E3);
            this.Jh = !0;
            null != this.xl && this.xl();
            let c = this;
            this.ua.La.setRemoteDescription(new RTCSessionDescription({
                sdp: a,
                type: "answer"
            })).then(function () {
                let d = 0;
                for (; d < b.length;)
                    c.ua.La.addIceCandidate(b[d++])
            }).catch(function () {
                c.je(ia.Error)
            })
        }
        Yh(a) {
            this.ua.La.addIceCandidate(a)
        }
        Uc(a, b) {
            if (null != this.aa) {
                var c = A.ka(32, !1);
                c.m(a);
                null != b && (a = pako.deflateRaw(b.Wb()),
                    c.Lb(a));
                this.aa.send(c.Qd())
            }
        }
        Qi(a, b, c) {
            let d = A.ka(32, !1);
            d.m(this.yh ? 1 : 0);
            d.oc(a.sdp);
            d.Zg(b);
            null != c && d.Lb(c.Wb());
            this.Uc(1, d)
        }
        Ni(a) {
            let b = A.ka(32, !1);
            b.Zg(a);
            this.Uc(4, b)
        }
        static lp(a) {
            switch (a.qb) {
                case 0:
                    return "Failed";
                case 1:
                    return Oc.description(a.code);
                case 2:
                    return "";
                case 3:
                    return "Master connection error"
            }
        }
    }
    class Yb {
        static rh(a) {
            return new Promise(function (b, c) {
                a.onsuccess = function () {
                    b(a.result)
                }
                    ;
                a.onerror = c
            }
            )
        }
    }
    class S {
        constructor() {
            this.C = 32;
            this.i = 63;
            this.o = 1;
            this.Va = 0;
            this.ya = new P(0, 0)
        }
        ha(a) {
            let b = this.ya;
            a.u(b.x);
            a.u(b.y);
            a.u(this.Va);
            a.u(this.o);
            a.R(this.i);
            a.R(this.C)
        }
        na(a) {
            let b = this.ya;
            b.x = a.w();
            b.y = a.w();
            this.Va = a.w();
            this.o = a.w();
            this.i = a.N();
            this.C = a.N()
        }
    }
    class Oc {
        static description(a) {
            switch (a) {
                case 4001:
                    return "The room was closed.";
                case 4100:
                    return "The room is full.";
                case 4101:
                    return "Wrong password.";
                case 4102:
                    return "You are banned from this room.";
                case 4103:
                    return "Incompatible game version.";
                default:
                    return "Connection closed (" + a + ")"
            }
        }
    }
    class ba {
        constructor(a) {
            let b = new ca("Only humans", "", []);
            this.f = b.f;
            b.ee.style.minHeight = "78px";
            let c = this;
            Gb.Qp().then(function (d) {
                null == ba.Kg && (ba.Kg = window.document.createElement("div"),
                    b.ee.appendChild(ba.Kg),
                    ba.nr = d.render(ba.Kg, {
                        sitekey: a,
                        callback: function (e) {
                            D.h(ba.gm, e)
                        },
                        theme: "dark"
                    }));
                d.reset(ba.nr);
                ba.gm = function (e) {
                    window.setTimeout(function () {
                        D.h(c.Wa, e)
                    }, 1E3);
                    ba.gm = null
                }
                    ;
                b.ee.appendChild(ba.Kg)
            })
        }
    }
    class Q {
        static Je(a) {
            return w.Pe(a, "")
        }
        static parseInt(a) {
            a = parseInt(a);
            return isNaN(a) ? null : a
        }
    }
    class va {
        constructor() {
            this.jc = -1;
            this.U = this.ic = null;
            this.Gd = 2;
            this.gd = 0;
            this.ne = 1;
            this.mb = this.Ga = 3;
            this.Bc = !1;
            this.M = null;
            this.K = [];
            this.lc = "";
            this.U = q.Uh()[0];
            this.ob = [null, new xa, new xa];
            this.ob[1].ib.push(u.ja.S);
            this.ob[2].ib.push(u.Da.S)
        }
        ms(a) {
            if (null == this.M) {
                this.M = new aa;
                for (var b = 0, c = this.K; b < c.length;) {
                    let d = c[b];
                    ++b;
                    d.I = null;
                    d.Nb = 0
                }
                this.M.Ep(this);
                null != this.$i && this.$i(a)
            }
        }
        ag(a, b, c) {
            if (b.fa != c) {
                b.fa = c;
                O.remove(this.K, b);
                this.K.push(b);
                if (null != this.M) {
                    null != b.I && (O.remove(this.M.va.H, b.I),
                        b.I = null);
                    this.M.Xk(b);
                    let d = 0
                        , e = !1;
                    for (; !e;) {
                        ++d;
                        e = !0;
                        let f = 0
                            , g = this.K;
                        for (; f < g.length;) {
                            let h = g[f];
                            ++f;
                            if (h != b && h.fa == b.fa && h.Nb == d) {
                                e = !1;
                                break
                            }
                        }
                    }
                    b.Nb = d
                }
                rc.h(this.Xl, a, b, c)
            }
        }
        ma(a) {
            let b = 0
                , c = this.K;
            for (; b < c.length;) {
                let d = c[b];
                ++b;
                if (d.Z == a)
                    return d
            }
            return null
        }
        A(a) {
            null != this.M && this.M.A(a)
        }
        ha(a) {
            a.Eb(this.lc);
            a.m(this.Bc ? 1 : 0);
            a.R(this.mb);
            a.R(this.Ga);
            a.nj(this.ne);
            a.m(this.gd);
            a.m(this.Gd);
            this.U.ha(a);
            a.m(null != this.M ? 1 : 0);
            null != this.M && this.M.ha(a);
            a.m(this.K.length);
            let b = 0
                , c = this.K;
            for (; b < c.length;)
                c[b++].xa(a);
            this.ob[1].ha(a);
            this.ob[2].ha(a)
        }
        na(a) {
            this.lc = a.Ab();
            this.Bc = 0 != a.F();
            this.mb = a.N();
            this.Ga = a.N();
            this.ne = a.Ci();
            this.gd = a.F();
            this.Gd = a.F();
            this.U = q.na(a);
            var b = 0 != a.F();
            this.M = null;
            b && (this.M = new aa,
                this.M.na(a, this));
            b = null == this.M ? null : this.M.va.H;
            let c = a.F();
            for (var d = this.K; d.length > c;)
                d.pop();
            for (d = 0; d < c;) {
                let e = new wa;
                e.wa(a, b);
                this.K[d++] = e
            }
            this.ob[1].na(a);
            this.ob[2].na(a)
        }
        Pk() {
            let a = 0;
            var b = A.ka();
            this.ha(b);
            for (b = b.ts(); 4 <= b.s.byteLength - b.a;)
                a ^= b.N();
            return a
        }
        ip() {
            let a = A.ka(4);
            a.R(this.Pk());
            return a.Vg()
        }
        Bo(a) {
            a = (new J(new DataView(a))).N();
            D.h(this.So, this.Pk() != a)
        }
        Jm(a) {
            this.om = a
        }
        Pb(a) {
            if (0 == a)
                return !0;
            a = this.ma(a);
            return null != a && a.cb ? !0 : !1
        }
        Zr(a, b, c, d) {
            this.Gd = 0 > b ? 0 : 255 < b ? 255 : b;
            this.gd = 0 > c ? 0 : 255 < c ? 255 : c;
            0 > d ? d = 0 : 100 < d && (d = 100);
            this.ne = this.gd * d;
            Xb.h(this.bl, a, this.Gd, this.gd, d)
        }
        vc() {
            let a = ua.Dc
                , b = this.ic;
            this.jc != a && (null == b && (this.ic = b = new va),
                this.jc = a,
                va.zd(b, this));
            return b
        }
        static zd(a, b) {
            a.lc = b.lc;
            if (null == b.K)
                a.K = null;
            else {
                null == a.K && (a.K = []);
                let d = a.K
                    , e = b.K;
                for (var c = e.length; d.length > c;)
                    d.pop();
                c = 0;
                let f = e.length;
                for (; c < f;) {
                    let g = c++;
                    d[g] = e[g].Ys()
                }
            }
            a.M = null == b.M ? null : b.M.vc();
            a.Bc = b.Bc;
            a.mb = b.mb;
            a.Ga = b.Ga;
            a.ne = b.ne;
            a.gd = b.gd;
            a.Gd = b.Gd;
            a.U = b.U;
            a.ob = b.ob
        }
    }
    class mc {
        constructor(a, b) {
            this.r = new RegExp(a, b.split("u").join(""))
        }
        match(a) {
            this.r.global && (this.r.lastIndex = 0);
            this.r.pc = this.r.exec(a);
            this.r.ph = a;
            return null != this.r.pc
        }
        yn(a) {
            if (null != this.r.pc && 0 <= a && a < this.r.pc.length)
                return this.r.pc[a];
            throw v.B("EReg::matched");
        }
        et() {
            if (null == this.r.pc)
                throw v.B("No string matched");
            return {
                Dj: this.r.pc.index,
                bt: this.r.pc[0].length
            }
        }
        dt(a, b) {
            var c;
            null == c && (c = -1);
            if (this.r.global) {
                this.r.lastIndex = b;
                this.r.pc = this.r.exec(0 > c ? a : O.substr(a, 0, b + c));
                if (b = null != this.r.pc)
                    this.r.ph = a;
                return b
            }
            if (c = this.match(0 > c ? O.substr(a, b, null) : O.substr(a, b, c)))
                this.r.ph = a,
                    this.r.pc.index += b;
            return c
        }
    }
    class G {
        constructor() {
            this.Dd = 0;
            this.C = 32;
            this.i = 63;
            this.o = 1;
            this.a = new P(0, 0)
        }
        ha(a) {
            let b = this.a;
            a.u(b.x);
            a.u(b.y);
            a.u(this.o);
            a.R(this.i);
            a.R(this.C)
        }
        na(a) {
            let b = this.a;
            b.x = a.w();
            b.y = a.w();
            this.o = a.w();
            this.i = a.N();
            this.C = a.N()
        }
    }
    class Hb {
        constructor() {
            this.mg = !1;
            this.D = "";
            this.Bh = 0;
            this.Zf = "";
            this.ob = new xa;
            let a = window.document.createElement("canvas");
            a.width = 64;
            a.height = 64;
            this.Kb = a.getContext("2d", null);
            this.ak = null;
            this.Oo()
        }
        Oo() {
            let a = window.document.createElement("canvas");
            a.width = 160;
            a.height = 34;
            this.Vl = a.getContext("2d", null)
        }
        Cs() {
            let a = this.Vl;
            a.resetTransform();
            a.clearRect(0, 0, 160, 34);
            a.font = "26px sans-serif";
            a.fillStyle = "white";
            160 < a.measureText(this.D).width ? (a.textAlign = "left",
                a.translate(2, 29)) : (a.textAlign = "center",
                    a.translate(80, 29));
            a.fillText(this.D, 0, 0)
        }
        $o(a, b, c) {
            a.drawImage(this.Vl.canvas, 0, 0, 160, 34, b - 40, c - 34, 80, 17)
        }
        A(a, b) {
            if (null != a.I) {
                let c = m.j.Wm.v() ? b.ob[a.fa.ba] : a.fa.Vm
                    , d = null != a.Sd ? a.Sd : a.Zb
                    , e = m.j.Lm.v() && null != d;
                if (!Hb.uo(this.ob, c) || !e && a.Nb != this.Bh || e && this.Zf != d)
                    Hb.Ko(this.ob, c),
                        e ? (this.Zf = d,
                            this.Bh = -1) : (this.Zf = "" + a.Nb,
                                this.Bh = a.Nb),
                        this.sr(this.Zf)
            }
            this.To = 0 < b.M.Ta || !a.Yb ? "black" : a.Yb && 0 >= a.Zc && 0 <= a.Cc ? "white" : "black";
            a.D != this.D && (this.D = a.D,
                this.Cs())
        }
        sr(a) {
            let b = this.ob.ib;
            if (!(1 > b.length)) {
                this.Kb.save();
                this.Kb.translate(32, 32);
                this.Kb.rotate(3.141592653589793 * this.ob.sd / 128);
                for (var c = -32, d = 64 / b.length, e = 0; e < b.length;)
                    this.Kb.fillStyle = T.nc(b[e++]),
                        this.Kb.fillRect(c, -32, d + 4, 64),
                        c += d;
                this.Kb.restore();
                this.Kb.fillStyle = T.nc(this.ob.pd);
                this.Kb.textAlign = "center";
                this.Kb.textBaseline = "alphabetic";
                this.Kb.font = "900 34px 'Arial Black','Arial Bold',Gadget,sans-serif";
                this.Kb.fillText(a, 32, 44);
                this.ak = this.Kb.createPattern(this.Kb.canvas, "no-repeat")
            }
        }
        static uo(a, b) {
            if (a.sd != b.sd || a.pd != b.pd)
                return !1;
            a = a.ib;
            b = b.ib;
            if (a.length != b.length)
                return !1;
            let c = 0
                , d = a.length;
            for (; c < d;) {
                let e = c++;
                if (a[e] != b[e])
                    return !1
            }
            return !0
        }
        static Ko(a, b) {
            a.sd = b.sd;
            a.pd = b.pd;
            a.ib = b.ib.slice(0)
        }
    }
    class sa {
        constructor() {
            this.fd = new Map
        }
        Qa(a, b) {
            this.fd.set(a, b)
        }
        v(a) {
            return this.fd.get(a)
        }
        ur(a) {
            this.fd.delete(a)
        }
        mp(a) {
            let b = []
                , c = this.fd.keys()
                , d = c.next();
            for (; !d.done;) {
                let e = d.value;
                d = c.next();
                this.fd.get(e) == a && b.push(e)
            }
            return b
        }
        De() {
            let a = {}
                , b = this.fd.keys()
                , c = b.next();
            for (; !c.done;) {
                let d = c.value;
                c = b.next();
                a[d] = this.fd.get(d)
            }
            return JSON.stringify(a)
        }
        static gg(a) {
            let b = new sa
                , c = Ic.on(a)
                , d = 0;
            for (; d < c.length;) {
                let e = c[d];
                ++d;
                b.fd.set(e, a[e])
            }
            return b
        }
        static Sh(a) {
            return sa.gg(JSON.parse(a))
        }
        static wk() {
            let a = new sa;
            a.Qa("ArrowUp", "Up");
            a.Qa("KeyW", "Up");
            a.Qa("ArrowDown", "Down");
            a.Qa("KeyS", "Down");
            a.Qa("ArrowLeft", "Left");
            a.Qa("KeyA", "Left");
            a.Qa("ArrowRight", "Right");
            a.Qa("KeyD", "Right");
            a.Qa("KeyX", "Kick");
            a.Qa("Space", "Kick");
            a.Qa("ControlLeft", "Kick");
            a.Qa("ControlRight", "Kick");
            a.Qa("ShiftLeft", "Kick");
            a.Qa("ShiftRight", "Kick");
            a.Qa("Numpad0", "Kick");
            return a
        }
    }
    class Fb {
        constructor() {
            this.Nl = new zc;
            this.f = x.Ia(Fb.O);
            let a = x.Ba(this.f);
            this.Fg = a.get("ping");
            this.ep = a.get("fps");
            x.replaceWith(a.get("graph"), this.Nl.f)
        }
        cs(a, b) {
            this.Fg.textContent = "Ping: " + a + " - " + b
        }
        Hm(a) {
            this.ep.textContent = "Fps: " + a
        }
    }
    class yb {
        constructor() {
            this.f = x.Ia(yb.O);
            let a = x.Ba(this.f);
            this.Lc = a.get("log");
            this.Eh = a.get("cancel")
        }
        da(a) {
            let b = window.document.createElement("p");
            b.textContent = a;
            this.Lc.appendChild(b)
        }
    }
    class Ka {
    }
    class ec {
        constructor(a, b) {
            this.za = a;
            this.da = b
        }
        xf(a) {
            if ("/" != a.charAt(0))
                return !1;
            if (1 == a.length)
                return !0;
            a = Y.ut(O.substr(a, 1, null)).split(" ");
            let b = a[0]
                , c = this;
            switch (b) {
                case "avatar":
                    2 == a.length && (this.Fm(a[1]),
                        this.da("Avatar set"));
                    break;
                case "checksum":
                    var d = this.za.T.U;
                    a = d.D;
                    d.cf() ? this.da('Current stadium is original: "' + a + '"') : (d = Y.hh(d.mk(), 8),
                        this.da('Stadium: "' + a + '" (checksum: ' + d + ")"));
                    break;
                case "clear_avatar":
                    this.Fm(null);
                    this.da("Avatar cleared");
                    break;
                case "clear_bans":
                    null == this.de ? this.da("Only the host can clear bans") : (this.de(),
                        this.da("All bans have been cleared"));
                    break;
                case "clear_password":
                    null == this.Rg ? this.da("Only the host can change the password") : (this.Rg(null),
                        this.da("Password cleared"));
                    break;
                case "colors":
                    try {
                        d = ec.Oq(a),
                            this.za.ta(d)
                    } catch (g) {
                        a = v.Mb(g).Fb(),
                            "string" == typeof a && this.da(a)
                    }
                    break;
                case "extrapolation":
                    2 == a.length ? (a = Q.parseInt(a[1]),
                        null != a && -200 <= a && 1E3 >= a ? (m.j.Ad.ia(a),
                            this.za.Gm(a),
                            this.da("Extrapolation set to " + a + " msec")) : this.da("Extrapolation must be a value between -200 and 1000 milliseconds")) : this.da("Extrapolation requires a value in milliseconds.");
                    break;
                case "handicap":
                    2 == a.length ? (a = Q.parseInt(a[1]),
                        null != a && 0 <= a && 300 >= a ? (this.za.Xr(a),
                            this.da("Ping handicap set to " + a + " msec")) : this.da("Ping handicap must be a value between 0 and 300 milliseconds")) : this.da("Ping handicap requires a value in milliseconds.");
                    break;
                case "kick_ratelimit":
                    if (4 > a.length)
                        this.da("Usage: /kick_ratelimit <min> <rate> <burst>");
                    else {
                        d = Q.parseInt(a[1]);
                        var e = Q.parseInt(a[2]);
                        a = Q.parseInt(a[3]);
                        null == d || null == e || null == a ? this.da("Invalid arguments") : this.za.ta(La.qa(d, e, a))
                    }
                    break;
                case "recaptcha":
                    if (null == this.Im)
                        this.da("Only the host can set recaptcha mode");
                    else
                        try {
                            if (2 == a.length) {
                                switch (a[1]) {
                                    case "off":
                                        e = !1;
                                        break;
                                    case "on":
                                        e = !0;
                                        break;
                                    default:
                                        throw v.B(null);
                                }
                                this.Im(e);
                                this.da("Room join Recaptcha " + (e ? "enabled" : "disabled"))
                            } else
                                throw v.B(null);
                        } catch (g) {
                            this.da("Usage: /recaptcha <on|off>")
                        }
                    break;
                case "set_password":
                    2 == a.length && (null == this.Rg ? this.da("Only the host can change the password") : (this.Rg(a[1]),
                        this.da("Password set")));
                    break;
                case "store":
                    let f = this.za.T.U;
                    f.cf() ? this.da("Can't store default stadium.") : ob.st().then(function () {
                        return ob.add(f)
                    }).then(function () {
                        c.da("Stadium stored")
                    }, function () {
                        c.da("Couldn't store stadium")
                    });
                    break;
                default:
                    this.da('Unrecognized command: "' + b + '"')
            }
            return !0
        }
        Fm(a) {
            null != a && (a = ha.Xc(a, 2));
            m.j.zh.ia(a);
            this.za.ta(Ma.qa(a))
        }
        static Oq(a) {
            if (3 > a.length)
                throw v.B("Not enough arguments");
            if (7 < a.length)
                throw v.B("Too many arguments");
            let b = new Za
                , c = new xa;
            b.eh = c;
            switch (a[1]) {
                case "blue":
                    c.ib = [u.Da.S];
                    b.fa = u.Da;
                    break;
                case "red":
                    c.ib = [u.ja.S];
                    b.fa = u.ja;
                    break;
                default:
                    throw v.B('First argument must be either "red" or "blue"');
            }
            if ("clear" == a[2])
                return b;
            c.sd = 256 * Q.parseInt(a[2]) / 360 | 0;
            c.pd = Q.parseInt("0x" + a[3]);
            if (4 < a.length) {
                c.ib = [];
                let d = 4
                    , e = a.length;
                for (; d < e;)
                    c.ib.push(Q.parseInt("0x" + a[d++]))
            }
            return b
        }
    }
    class kc {
        constructor(a, b) {
            this.th = null;
            this.wt = .025;
            this.He = this.qh = this.Sf = 0;
            this.fh = b.createGain();
            this.fh.gain.value = 0;
            b = b.createBufferSource();
            b.buffer = a;
            b.connect(this.fh);
            b.loop = !0;
            b.start()
        }
        update() {
            var a = window.performance.now();
            let b = a - this.wn;
            this.wn = a;
            this.He += (this.qh - this.He) * this.wt;
            this.Sf -= b;
            0 >= this.Sf && (this.Sf = this.qh = 0);
            0 >= this.qh && .05 > this.He && (window.clearInterval(this.th),
                this.th = null,
                this.He = 0);
            a = m.j.Nm.v() ? this.He : 0;
            this.fh.gain.value = a
        }
        Fj(a) {
            this.qh = a;
            this.Sf = 166.66666666666666;
            let b = this;
            null == this.th && (this.th = window.setInterval(function () {
                b.update()
            }, 17),
                this.wn = window.performance.now())
        }
        connect(a) {
            this.fh.connect(a)
        }
        zt(a) {
            let b = a.M;
            if (null != b)
                if (2 == b.Cb)
                    0 >= b.Ta && this.Fj(1);
                else if (1 == b.Cb) {
                    let e = b.va.H[0]
                        , f = null
                        , g = null
                        , h = null
                        , k = 0
                        , l = null
                        , n = null
                        , r = null
                        , t = 0
                        , z = u.ja.Nh
                        , L = 0;
                    for (a = a.K; L < a.length;) {
                        let N = a[L];
                        ++L;
                        if (null == N.I)
                            continue;
                        var c = N.I.a;
                        let tb = e.a;
                        var d = c.x - tb.x;
                        c = c.y - tb.y;
                        d = d * d + c * c;
                        if (N.fa == u.ja) {
                            if (null == f || f.a.x * z < N.I.a.x * z)
                                f = N.I;
                            if (null == g || g.a.x * z > N.I.a.x * z)
                                g = N.I;
                            if (null == h || d < k)
                                h = N.I,
                                    k = d
                        } else if (N.fa == u.Da) {
                            if (null == l || l.a.x * z < N.I.a.x * z)
                                l = N.I;
                            if (null == n || n.a.x * z > N.I.a.x * z)
                                n = N.I;
                            if (null == r || d < t)
                                r = N.I,
                                    t = d
                        }
                    }
                    null != n && null != g && 0 >= b.Ta && (h.a.x > n.a.x && e.a.x > n.a.x && 20 < e.a.x && this.Fj(.3),
                        r.a.x < g.a.x && e.a.x < g.a.x && -20 > e.a.x && this.Fj(.3))
                }
        }
    }
    class p {
        constructor() {
            p.yb || this.Za()
        }
        Za() {
            this.Hn = this.In = this.qc = 0
        }
        Cn() {
            return !0
        }
        apply() {
            throw v.B("missing implementation");
        }
        wa() {
            throw v.B("missing implementation");
        }
        xa() {
            throw v.B("missing implementation");
        }
        static Ha(a) {
            null == a.delay && (a.delay = !0);
            null == a.Ca && (a.Ca = !0);
            return a
        }
        static Ja(a) {
            a.Sn = p.Nf;
            if (null == a.Aa)
                throw v.B("Class doesn't have a config");
            a.prototype.Td = a.Aa;
            p.wj.set(p.Nf, a);
            p.Nf++
        }
        static Cj(a, b) {
            let c = w.pn(a).Sn;
            if (null == c)
                throw v.B("Tried to pack unregistered action");
            b.m(c);
            a.xa(b)
        }
        static Jj(a) {
            var b = a.F();
            b = Object.create(p.wj.get(b).prototype);
            b.qc = 0;
            b.gb = 0;
            b.wa(a);
            return b
        }
        static yt(a) {
            a = a.F();
            a = Object.create(p.wj.get(a).prototype);
            a.qc = 0;
            a.gb = 0;
            return a
        }
    }
    class T {
        constructor(a) {
            this.hd = window.performance.now();
            this.Ug = new Map;
            this.nd = new Map;
            this.ue = 1;
            this.Ch = 100;
            this.Wg = 35;
            this.Ld = 0;
            this.Ig = 1.5;
            this.Ya = new P(0, 0);
            this.Yk = !1;
            this.Cd = new xc;
            this.Hp = a;
            this.oa = window.document.createElement("canvas");
            this.oa.mozOpaque = !0;
            this.c = this.oa.getContext("2d", {
                alpha: !1,
                desynchronized: a
            });
            this.tp = this.c.createPattern(m.sp, null);
            this.Fo = this.c.createPattern(m.Eo, null);
            this.Do = this.c.createPattern(m.Co, null)
        }
        xp(a, b) {
            a = this.nd.get(a.Z);
            if (null != a)
                switch (b) {
                    case 0:
                        a.mg = !0;
                        break;
                    case 1:
                        a.mg = !1
                }
        }
        Ds() {
            if (null != this.oa.parentElement) {
                var a = window.devicePixelRatio * this.ue;
                let b = this.oa.getBoundingClientRect()
                    , c = Math.round(b.width * a);
                a = Math.round(b.height * a);
                if (this.oa.width != c || this.oa.height != a)
                    this.oa.width = c,
                        this.oa.height = a
            }
        }
        Rc(a, b) {
            var c = window.performance.now();
            let d = (c - this.hd) / 1E3;
            this.hd = c;
            this.Ug.clear();
            this.Ds();
            T.Vi(this.c, !0);
            this.c.resetTransform();
            if (null != a.M) {
                c = a.M;
                var e = c.va
                    , f = a.ma(b)
                    , g = null != f ? f.I : null
                    , h = 0 != this.Ld ? this.oa.height / this.Ld : this.Ig * window.devicePixelRatio * this.ue;
                b = this.Wg * this.ue;
                var k = this.Ch * this.ue
                    , l = c.U.mf
                    , n = this.oa.width / h;
                0 < l && n > l && (n = l,
                    h = this.oa.width / l);
                l = (this.oa.height - b - k) / h;
                this.As(c, g, n, l, d);
                for (var r = 0, t = a.K; r < t.length;) {
                    let z = t[r];
                    ++r;
                    if (null == z.I)
                        continue;
                    let L = this.nd.get(z.Z);
                    null == L && (L = new Hb,
                        this.nd.set(z.Z, L));
                    L.A(z, a);
                    this.Ug.set(z.I, L)
                }
                this.c.translate(this.oa.width / 2, (this.oa.height + b - k) / 2);
                this.c.scale(h, h);
                this.c.translate(-this.Ya.x, -this.Ya.y);
                this.c.lineWidth = 3;
                this.Dr(c.U);
                this.Cr(c.U);
                h = e.H;
                r = 0;
                for (t = e.rb; r < t.length;)
                    this.xr(t[r++], h);
                this.wr(a, n, l);
                this.yr(a, f);
                null != g && this.Ar(g.a);
                this.c.lineWidth = 2;
                f = 0;
                for (g = a.K; f < g.length;)
                    l = g[f],
                        ++f,
                        n = l.I,
                        null != n && (l = this.nd.get(l.Z),
                            this.lm(n, l));
                f = 0;
                for (e = e.H; f < e.length;)
                    if (g = e[f],
                        ++f,
                        null == this.Ug.get(g)) {
                        if (0 > g.V)
                            break;
                        this.lm(g, null)
                    }
                this.c.lineWidth = 3;
                this.c.resetTransform();
                this.c.translate(this.oa.width / 2, b + (this.oa.height - b - k) / 2);
                this.zr(c);
                0 >= c.Ta && (this.Cd.A(d),
                    this.Cd.Rc(this.c));
                this.Ug.clear();
                this.vr(a)
            }
        }
        vr(a) {
            let b = new Set;
            var c = 0;
            for (a = a.K; c < a.length;)
                b.add(a[c++].Z);
            c = this.nd.keys();
            for (a = c.next(); !a.done;) {
                let d = a.value;
                a = c.next();
                b.has(d) || this.nd.delete(d)
            }
        }
        As(a, b, c, d, e) {
            if (null != b && 1 == a.U.Ue) {
                var f = b.a;
                var g = f.x;
                f = f.y;
                null == f && (f = 0);
                null == g && (g = 0)
            } else if (f = a.va.H[0].a,
                g = f.x,
                f = f.y,
                null != b) {
                var h = b.a;
                g = .5 * (g + h.x);
                f = .5 * (f + h.y);
                var k = c;
                b = d;
                null == d && (b = 0);
                null == c && (k = 0);
                var l = .5 * k;
                let n = .5 * b;
                b = h.x - l + 50;
                k = h.y - n + 50;
                l = h.x + l - 50;
                h = h.y + n - 50;
                g = g > l ? l : g < b ? b : g;
                f = f > h ? h : f < k ? k : f
            }
            e *= 60;
            1 < e && (e = 1);
            b = g;
            b == b ? (b = f,
                b = b == b) : b = !1;
            b && (k = b = this.Ya,
                e *= .04,
                h = k.x,
                k = k.y,
                b.x = h + (g - h) * e,
                b.y = k + (f - k) * e);
            this.Go(c, d, a.U)
        }
        Go(a, b, c) {
            a > 2 * c.bc ? this.Ya.x = 0 : this.Ya.x + .5 * a > c.bc ? this.Ya.x = c.bc - .5 * a : this.Ya.x - .5 * a < -c.bc && (this.Ya.x = -c.bc + .5 * a);
            b > 2 * c.tc ? this.Ya.y = 0 : this.Ya.y + .5 * b > c.tc ? this.Ya.y = c.tc - .5 * b : this.Ya.y - .5 * b < -c.tc && (this.Ya.y = -c.tc + .5 * b)
        }
        Ar(a) {
            this.c.beginPath();
            this.c.strokeStyle = "white";
            this.c.globalAlpha = .3;
            this.c.arc(a.x, a.y, 25, 0, 2 * Math.PI, !1);
            this.c.stroke();
            this.c.globalAlpha = 1
        }
        zr(a) {
            let b = 0 < a.Ta;
            this.Yr(b);
            b && (120 != a.Ta && (a = a.Ta / 120 * 200,
                this.c.fillStyle = "white",
                this.c.fillRect(.5 * -a, 100, a, 20)),
                this.Cd.Pq.Er(this.c))
        }
        Yr(a) {
            this.Yk != a && (this.oa.style.filter = a ? "grayscale(70%)" : "",
                this.Yk = a)
        }
        vm(a, b, c, d, e, f) {
            d = b + d;
            e = c + e;
            a.beginPath();
            a.moveTo(d - f, c);
            a.arcTo(d, c, d, c + f, f);
            a.lineTo(d, e - f);
            a.arcTo(d, e, d - f, e, f);
            a.lineTo(b + f, e);
            a.arcTo(b, e, b, e - f, f);
            a.lineTo(b, c + f);
            a.arcTo(b, c, b + f, c, f);
            a.closePath()
        }
        Dr(a) {
            T.Vi(this.c, !1);
            var b = a.ce;
            let c = a.be
                , d = this;
            if (1 == a.ud)
                this.c.save(),
                    this.c.resetTransform(),
                    this.c.fillStyle = T.nc(a.td),
                    this.c.fillRect(0, 0, this.oa.width, this.oa.height),
                    this.c.restore(),
                    this.c.strokeStyle = "#C7E6BD",
                    this.c.fillStyle = this.tp,
                    this.vm(this.c, -b, -c, 2 * b, 2 * c, a.Gc),
                    this.c.save(),
                    this.c.scale(2, 2),
                    this.c.fill(),
                    this.c.restore(),
                    this.c.moveTo(0, -c),
                    this.c.lineTo(0, c),
                    this.c.stroke(),
                    this.c.beginPath(),
                    this.c.arc(0, 0, a.bd, 0, 2 * Math.PI),
                    this.c.stroke();
            else if (2 == a.ud) {
                this.c.strokeStyle = "#E9CC6E";
                this.c.save();
                this.c.beginPath();
                this.c.rect(this.Ya.x - 1E4, this.Ya.y - 1E4, 2E4, 2E4);
                this.c.scale(2, 2);
                this.c.fillStyle = this.Do;
                this.c.fill();
                this.c.restore();
                this.c.save();
                this.vm(this.c, -b, -c, 2 * b, 2 * c, a.Gc);
                this.c.scale(2, 2);
                this.c.fillStyle = this.Fo;
                this.c.fill();
                this.c.restore();
                this.c.stroke();
                this.c.beginPath();
                this.c.moveTo(0, -c);
                this.c.setLineDash([15, 15]);
                this.c.lineTo(0, c);
                this.c.stroke();
                this.c.setLineDash([]);
                var e = a.Te;
                b -= e;
                e < a.Gc && (b = 0);
                e = function (f, g, h) {
                    d.c.beginPath();
                    d.c.strokeStyle = f;
                    d.c.arc(0, 0, a.bd, -1.5707963267948966, 1.5707963267948966, h);
                    0 != g && (d.c.moveTo(g, -c),
                        d.c.lineTo(g, c));
                    d.c.stroke()
                }
                    ;
                e("#85ACF3", b, !1);
                e("#E18977", -b, !0)
            } else
                this.c.save(),
                    this.c.resetTransform(),
                    this.c.fillStyle = T.nc(a.td),
                    this.c.fillRect(0, 0, this.oa.width, this.oa.height),
                    this.c.restore();
            T.Vi(this.c, !0)
        }
        yr(a, b) {
            let c = m.j.Vk.v()
                , d = 0;
            for (a = a.K; d < a.length;) {
                let f = a[d];
                ++d;
                var e = f.I;
                if (null == e)
                    continue;
                e = e.a;
                let g = this.nd.get(f.Z);
                c && g.mg && this.c.drawImage(m.dn, e.x - .5 * m.dn.width, e.y - 35);
                f != b && g.$o(this.c, e.x, e.y + 50)
            }
        }
        lm(a, b) {
            0 > a.V || (this.c.beginPath(),
                null == b ? (this.c.fillStyle = T.nc(a.S),
                    this.c.strokeStyle = "black") : (this.c.fillStyle = b.ak,
                        this.c.strokeStyle = b.To),
                this.c.beginPath(),
                this.c.arc(a.a.x, a.a.y, a.V, 0, 2 * Math.PI, !1),
                null != b ? (this.c.save(),
                    b = a.V / 32,
                    this.c.translate(a.a.x, a.a.y),
                    this.c.scale(b, b),
                    this.c.translate(-32, -32),
                    this.c.fill(),
                    this.c.restore()) : -1 != (a.S | 0) && this.c.fill(),
                this.c.stroke())
        }
        Cr(a) {
            if (null != a) {
                var b = 0;
                for (a = a.X; b < a.length;)
                    this.Br(a[b++])
            }
        }
        xr(a, b) {
            if (!(0 > a.S)) {
                this.c.beginPath();
                this.c.strokeStyle = T.nc(a.S);
                var c = b[a.he];
                a = b[a.ie];
                null != c && null != a && (c = c.a,
                    a = a.a,
                    this.c.moveTo(c.x, c.y),
                    this.c.lineTo(a.x, a.y),
                    this.c.stroke())
            }
        }
        Br(a) {
            if (a.bb) {
                this.c.beginPath();
                this.c.strokeStyle = T.nc(a.S);
                var b = a.$.a
                    , c = a.ea.a;
                if (0 != 0 * a.vb)
                    this.c.moveTo(b.x, b.y),
                        this.c.lineTo(c.x, c.y);
                else {
                    a = a.ge;
                    let d = b.x - a.x;
                    b = b.y - a.y;
                    this.c.arc(a.x, a.y, Math.sqrt(d * d + b * b), Math.atan2(b, d), Math.atan2(c.y - a.y, c.x - a.x))
                }
                this.c.stroke()
            }
        }
        wr(a, b, c) {
            var d = a.M;
            if (null != d)
                for (d = d.va.H[0],
                    this.Jk(d.a, d.S, b, c),
                    d = 0,
                    a = a.K; d < a.length;) {
                    let e = a[d];
                    ++d;
                    null != e.I && this.Jk(e.I.a, e.fa.S, b, c)
                }
        }
        Jk(a, b, c, d) {
            c = .5 * c - 25;
            var e = .5 * d - 25;
            null == e && (e = 0);
            null == c && (c = 0);
            d = c;
            c = e;
            var f = this.Ya;
            e = a.x - f.x;
            f = a.y - f.y;
            let g = -d
                , h = -c
                , k = this.Ya;
            d = k.x + (e > d ? d : e < g ? g : e);
            c = k.y + (f > c ? c : f < h ? h : f);
            e = a.x - d;
            a = a.y - c;
            900 < e * e + a * a && (this.c.fillStyle = "rgba(0,0,0,0.5)",
                this.Kk(d + 2, c + 2, Math.atan2(a, e)),
                this.c.fillStyle = T.nc(b),
                this.Kk(d - 2, c - 2, Math.atan2(a, e)))
        }
        Kk(a, b, c) {
            this.c.save();
            this.c.translate(a, b);
            this.c.rotate(c);
            this.c.beginPath();
            this.c.moveTo(15, 0);
            this.c.lineTo(0, 7);
            this.c.lineTo(0, -7);
            this.c.closePath();
            this.c.fill();
            this.c.restore()
        }
        Ir() {
            let a = this.nd.values()
                , b = a.next();
            for (; !b.done;) {
                let c = b.value;
                b = a.next();
                c.mg = !1
            }
        }
        static nc(a) {
            return "rgba(" + [(a & 16711680) >>> 16, (a & 65280) >>> 8, a & 255].join() + ",255)"
        }
        static Vi(a, b) {
            a.imageSmoothingEnabled = b;
            a.mozImageSmoothingEnabled = b
        }
    }
    class fc {
    }
    class ya {
        constructor() {
            this.i = this.C = 63;
            this.S = 16777215;
            this.Ea = .99;
            this.ca = 1;
            this.o = .5;
            this.V = 10;
            this.ra = new P(0, 0);
            this.G = new P(0, 0);
            this.a = new P(0, 0)
        }
        ha(a) {
            var b = this.a;
            a.u(b.x);
            a.u(b.y);
            b = this.G;
            a.u(b.x);
            a.u(b.y);
            b = this.ra;
            a.u(b.x);
            a.u(b.y);
            a.u(this.V);
            a.u(this.o);
            a.u(this.ca);
            a.u(this.Ea);
            a.tb(this.S);
            a.R(this.i);
            a.R(this.C)
        }
        na(a) {
            var b = this.a;
            b.x = a.w();
            b.y = a.w();
            b = this.G;
            b.x = a.w();
            b.y = a.w();
            b = this.ra;
            b.x = a.w();
            b.y = a.w();
            this.V = a.w();
            this.o = a.w();
            this.ca = a.w();
            this.Ea = a.w();
            this.S = a.kb();
            this.i = a.N();
            this.C = a.N()
        }
        aq() {
            let a = new ta;
            this.Wk(a);
            return a
        }
        Wk(a) {
            var b = a.a
                , c = this.a;
            b.x = c.x;
            b.y = c.y;
            b = a.G;
            c = this.G;
            b.x = c.x;
            b.y = c.y;
            b = a.ra;
            c = this.ra;
            b.x = c.x;
            b.y = c.y;
            a.V = this.V;
            a.o = this.o;
            a.ca = this.ca;
            a.Ea = this.Ea;
            a.S = this.S;
            a.i = this.i;
            a.C = this.C
        }
    }
    class W {
        constructor(a) {
            W.yb || this.Za(a)
        }
        Za(a) {
            this.Y = 0;
            this.T = a
        }
    }
    class Ic {
        static on(a) {
            let b = [];
            if (null != a) {
                let d = Object.prototype.hasOwnProperty;
                for (var c in a)
                    "__id__" != c && "hx__closures__" != c && d.call(a, c) && b.push(c)
            }
            return b
        }
    }
    class H {
        static h(a) {
            null != a && a()
        }
    }
    class nb {
        static mi(a) {
            return new PerfectScrollbar(a, {
                handlers: nb.Cp
            })
        }
    }
    class w {
        static pn(a) {
            if (null == a)
                return null;
            if (a instanceof Array)
                return Array;
            {
                let b = a.g;
                if (null != b)
                    return b;
                a = w.Oj(a);
                return null != a ? w.Wn(a) : null
            }
        }
        static Pe(a, b) {
            if (null == a)
                return "null";
            if (5 <= b.length)
                return "<...>";
            var c = typeof a;
            "function" == c && (a.b || a.Wf) && (c = "object");
            switch (c) {
                case "function":
                    return "<function>";
                case "object":
                    if (a.Gb) {
                        var d = Ib[a.Gb].ae[a.qb];
                        c = d.xc;
                        if (d.Oe) {
                            b += "\t";
                            var e = []
                                , f = 0;
                            for (d = d.Oe; f < d.length;) {
                                let g = d[f];
                                f += 1;
                                e.push(w.Pe(a[g], b))
                            }
                            a = e;
                            return c + "(" + a.join(",") + ")"
                        }
                        return c
                    }
                    if (a instanceof Array) {
                        c = "[";
                        b += "\t";
                        e = 0;
                        for (f = a.length; e < f;)
                            d = e++,
                                c += (0 < d ? "," : "") + w.Pe(a[d], b);
                        return c += "]"
                    }
                    try {
                        e = a.toString
                    } catch (g) {
                        return "???"
                    }
                    if (null != e && e != Object.toString && "function" == typeof e && (c = a.toString(),
                        "[object Object]" != c))
                        return c;
                    c = "{\n";
                    b += "\t";
                    e = null != a.hasOwnProperty;
                    f = null;
                    for (f in a)
                        e && !a.hasOwnProperty(f) || "prototype" == f || "__class__" == f || "__super__" == f || "__interfaces__" == f || "__properties__" == f || (2 != c.length && (c += ", \n"),
                            c += b + f + " : " + w.Pe(a[f], b));
                    b = b.substring(1);
                    return c += "\n" + b + "}";
                case "string":
                    return a;
                default:
                    return String(a)
            }
        }
        static Nj(a, b) {
            for (; ;) {
                if (null == a)
                    return !1;
                if (a == b)
                    return !0;
                let c = a.ad;
                if (null != c && (null == a.ga || a.ga.ad != c)) {
                    let d = 0
                        , e = c.length;
                    for (; d < e;) {
                        let f = c[d++];
                        if (f == b || w.Nj(f, b))
                            return !0
                    }
                }
                a = a.ga
            }
        }
        static Un(a, b) {
            if (null == b)
                return !1;
            switch (b) {
                case Array:
                    return a instanceof Array;
                case Hc:
                    return "boolean" == typeof a;
                case Pc:
                    return null != a;
                case E:
                    return "number" == typeof a;
                case cc:
                    return "number" == typeof a ? (a | 0) === a : !1;
                case String:
                    return "string" == typeof a;
                default:
                    if (null != a)
                        if ("function" == typeof b) {
                            if (w.Tn(a, b))
                                return !0
                        } else {
                            if ("object" == typeof b && w.Vn(b) && a instanceof b)
                                return !0
                        }
                    else
                        return !1;
                    return b == Qc && null != a.b || b == Rc && null != a.Wf ? !0 : null != a.Gb ? Ib[a.Gb] == b : !1
            }
        }
        static Tn(a, b) {
            return a instanceof b ? !0 : b.wh ? w.Nj(w.pn(a), b) : !1
        }
        static J(a, b) {
            if (null == a || w.Un(a, b))
                return a;
            throw v.B("Cannot cast " + Q.Je(a) + " to " + Q.Je(b));
        }
        static Oj(a) {
            a = w.Xn.call(a).slice(8, -1);
            return "Object" == a || "Function" == a || "Math" == a || "JSON" == a ? null : a
        }
        static Vn(a) {
            return null != w.Oj(a)
        }
        static Wn(a) {
            return pa[a]
        }
    }
    class Db {
        constructor(a) {
            this.Ma = x.Ia(Db.Ij, "tbody");
            var b = x.Ba(this.Ma);
            let c = b.get("name")
                , d = b.get("players")
                , e = b.get("distance")
                , f = b.get("pass");
            b = b.get("flag");
            this.tt = a;
            let g = a.ke;
            c.textContent = g.D;
            d.textContent = "" + g.K + "/" + g.lf;
            f.textContent = g.Jb ? "Yes" : "No";
            e.textContent = "" + (a.Ze | 0) + "km";
            try {
                b.classList.add("f-" + g.ub.toLowerCase())
            } catch (h) { }
            9 > a.ke.Fe && this.Ma.classList.add("old")
        }
    }
    class Ea {
    }
    class yc {
        constructor(a) {
            this.f = a;
            let b = x.Ba(a);
            this.jo = b.get("sound-bar");
            this.Dp = b.get("sound-icon");
            this.io = b.get("sound-bar-bg");
            let c = this;
            b.get("sound-btn").onclick = function () {
                m.j.ye.ia(!m.j.ye.v());
                c.A()
            }
                ;
            b.get("sound-slider").onmousedown = function (d) {
                function e(g) {
                    g.preventDefault();
                    {
                        let h = c.io.getBoundingClientRect();
                        g = (g.clientY - h.top) / h.height
                    }
                    g = 1 - g;
                    m.j.Xi.ia(1 < g ? 1 : 0 > g ? 0 : g);
                    m.j.ye.ia(!0);
                    c.A()
                }
                e(d);
                let f = null;
                f = function (g) {
                    e(g);
                    a.classList.toggle("dragging", !1);
                    window.document.removeEventListener("mousemove", e, !1);
                    window.document.removeEventListener("mouseup", f, !1)
                }
                    ;
                a.classList.toggle("dragging", !0);
                window.document.addEventListener("mousemove", e, !1);
                window.document.addEventListener("mouseup", f, !1)
            }
                ;
            this.A()
        }
        A() {
            let a = m.j.Xi.v()
                , b = !m.j.ye.v();
            if (this.Np != a || this.Mp != b)
                this.Np = a,
                    (this.Mp = b) && (a = 0),
                    this.Dp.className = "icon-" + (0 >= a ? "volume-off" : .5 >= a ? "volume-down" : "volume-up"),
                    this.jo.style.top = 100 * (1 - a) + "%",
                    m.Ra.Fi()
        }
    }
    class zc {
        constructor() {
            this.Lh = 0;
            this.fq = 400;
            this.Tk = 64;
            this.lj = 32;
            this.oa = window.document.createElement("canvas");
            this.fg = window.document.createElement("canvas");
            this.f = window.document.createElement("div");
            this.fg.width = this.oa.width = this.lj;
            this.fg.height = this.oa.height = this.Tk;
            this.Ph = this.fg.getContext("2d", null);
            this.c = this.oa.getContext("2d", null);
            this.c.fillStyle = "green";
            let a = []
                , b = 0
                , c = this.lj;
            for (; b < c;)
                ++b,
                    a.push(0);
            this.Qq = a;
            this.f.appendChild(this.fg);
            this.f.className = "graph";
            this.f.hidden = !0
        }
        Yn(a) {
            this.f.hidden = !1;
            0 > a ? (a = 150,
                this.c.fillStyle = "#c13535") : this.c.fillStyle = "#32FF32";
            let b = this.lj
                , c = this.Tk
                , d = this.Lh++;
            this.Lh >= b && (this.Lh = 0);
            this.Qq[d] = a;
            this.c.clearRect(d, 0, 1, c);
            a = a * c / this.fq;
            this.c.fillRect(d, c - a, 1, a);
            this.Ph.clearRect(0, 0, b, c);
            this.Ph.drawImage(this.oa, b - d - 1, 0);
            this.Ph.drawImage(this.oa, -d - 1, 0)
        }
    }
    class Rb {
        constructor() { }
        hk() {
            this.D = ha.Xc(this.D, 40);
            this.ub = ha.Xc(this.ub, 3)
        }
        ha(a) {
            this.hk();
            a.Ua = !0;
            a.Xb(this.Fe);
            a.kn(this.D);
            a.kn(this.ub);
            a.mj(this.Jc);
            a.mj(this.Mc);
            a.m(this.Jb ? 1 : 0);
            a.m(this.lf);
            a.m(this.K);
            a.Ua = !1
        }
        na(a) {
            a.Ua = !0;
            this.Fe = a.Sb();
            this.D = a.em();
            this.ub = a.em();
            this.Jc = a.Bi();
            this.Mc = a.Bi();
            this.Jb = 0 != a.F();
            this.lf = a.F();
            this.K = a.F();
            a.Ua = !1;
            if (30 < this.K || 30 < this.lf)
                throw v.B(null);
            this.hk()
        }
    }
    class Nc {
        static xj() {
            p.Ja(Jb);
            p.Ja(Na);
            p.Ja($a);
            p.Ja(Ja);
            p.Ja(ab);
            p.Ja(Ha);
            p.Ja(na);
            p.Ja(bb);
            p.Ja(cb);
            p.Ja(db);
            p.Ja(Aa);
            p.Ja(Oa);
            p.Ja(fa);
            p.Ja(Pa);
            p.Ja(Qa);
            p.Ja(eb);
            p.Ja(Ra);
            p.Ja(Ga);
            p.Ja(Ma);
            p.Ja(Za);
            p.Ja(Kb);
            p.Ja(La);
            p.Ja(Lb);
            p.Ja(Mb)
        }
    }
    class Ob {
        constructor(a, b) {
            this.Ma = a;
            this.value = b;
            a.textContent = "" + b
        }
        set(a) {
            this.value != a && (this.value = a,
                this.Ma.textContent = "" + this.value)
        }
    }
    class m {
    }
    class Ac {
        constructor(a, b) {
            this.zn = 0;
            this.version = 1;
            this.oh = 0;
            this.Wd = A.ka(1E3);
            this.Rf = A.ka(16384);
            this.version = b;
            let c = this.oh = a.Y;
            this.zj = a;
            a.T.ha(this.Rf);
            let d = this;
            a.hc = function (f) {
                let g = a.Y;
                d.Rf.pb(g - c);
                c = g;
                d.Rf.Xb(f.P);
                p.Cj(f, d.Rf)
            }
                ;
            this.Wd.Xb(0);
            let e = this.oh;
            a.T.Jm(function (f) {
                let g = a.Y;
                d.Wd.pb(g - e);
                d.Wd.m(f);
                d.zn++;
                e = g
            })
        }
        stop() {
            this.zj.hc = null;
            this.zj.T.Jm(null);
            this.Wd.s.setUint16(0, this.zn, this.Wd.Ua);
            this.Wd.Lb(this.Rf.Wb());
            let a = pako.deflateRaw(this.Wd.Wb())
                , b = A.ka(a.byteLength + 32);
            b.oj("HBR2");
            b.tb(this.version);
            b.tb(this.zj.Y - this.oh);
            b.Lb(a);
            return b.Wb()
        }
    }
    class xa {
        constructor() {
            this.pd = 16777215;
            this.ib = []
        }
        ha(a) {
            a.m(this.sd);
            a.R(this.pd);
            a.m(this.ib.length);
            let b = 0
                , c = this.ib;
            for (; b < c.length;)
                a.R(c[b++])
        }
        na(a) {
            this.sd = a.F();
            this.pd = a.N();
            let b = a.F();
            if (3 < b)
                throw v.B("too many");
            this.ib = [];
            let c = 0;
            for (; c < b;)
                ++c,
                    this.ib.push(a.N())
        }
    }
    class wb {
        constructor(a) {
            this.D = a.D;
            this.zb = a.zb;
            this.ba = a.Z;
            this.f = x.Ia(wb.O);
            let b = x.Ba(this.f);
            this.nf = b.get("name");
            this.Fg = b.get("ping");
            try {
                b.get("flag").classList.add("f-" + a.country)
            } catch (d) { }
            this.nf.textContent = this.D;
            this.Fg.textContent = "" + this.zb;
            let c = this;
            this.f.ondragstart = function (d) {
                d.dataTransfer.setData("player", Q.Je(c.ba))
            }
                ;
            this.f.oncontextmenu = function (d) {
                d.preventDefault();
                D.h(c.wf, c.ba)
            }
                ;
            this.Em(a.cb)
        }
        A(a, b) {
            this.f.draggable = b;
            this.zb != a.zb && (this.zb = a.zb,
                this.Fg.textContent = "" + this.zb);
            this.Zn != a.cb && this.Em(a.cb)
        }
        Em(a) {
            this.Zn = a;
            this.f.className = "player-list-item" + (a ? " admin" : "")
        }
    }
    class Gb {
        static Qp() {
            if (null != Gb.Ai)
                return Gb.Ai;
            Gb.Ai = new Promise(function (a, b) {
                var c = window.grecaptcha;
                null != c ? a(c) : (c = window.document.createElement("script"),
                    c.src = "https://www.google.com/recaptcha/api.js?onload=___recaptchaload&render=explicit",
                    window.document.head.appendChild(c),
                    window.___recaptchaload = function () {
                        a(window.grecaptcha)
                    }
                    ,
                    c.onerror = function () {
                        b(null)
                    }
                )
            }
            );
            return Gb.Ai
        }
    }
    class gc {
        constructor(a) {
            this.gt = a;
            this.eb = []
        }
        add(a) {
            var b = this.eb.length;
            let c = 0
                , d = this.Zd = 0;
            for (; d < b;) {
                let e = d++
                    , f = this.eb[e];
                f.index++;
                f.weight *= .97;
                this.eb[c].index < f.index && (c = e);
                this.Zd += f.weight
            }
            b >= this.gt ? (b = this.eb[c],
                this.Zd -= b.weight,
                this.eb.splice(c, 1)) : b = new nc;
            b.value = a;
            b.weight = 1;
            b.index = 0;
            this.Zd += b.weight;
            for (a = 0; a < this.eb.length && this.eb[a].value <= b.value;)
                ++a;
            this.eb.splice(a, 0, b)
        }
        mh() {
            if (0 == this.eb.length)
                return 0;
            if (1 == this.eb.length)
                return this.eb[0].value;
            var a = .5 * this.Zd;
            let b = this.eb[0].weight
                , c = 0;
            for (; c < this.eb.length - 1 && !(b >= a);)
                ++c,
                    b += this.eb[c].weight;
            return this.eb[c].value
        }
        max() {
            return 0 == this.eb.length ? 0 : this.eb[this.eb.length - 1].value
        }
    }
    class Da {
        constructor(a) {
            this.cg = null;
            this.cl = this.Kh = !1;
            this.hd = window.performance.now();
            this.Nd = null;
            this.Re = 0;
            this.so = new jb(3, 1E3);
            this.W = new bc;
            this.Ng = "Waiting for link";
            this.Mi = this.Am = !1;
            this.Bd = 0;
            let b = this;
            this.dg = new ec(a, function (d) {
                b.l.Ka.Hb(d)
            }
            );
            this.za = a;
            a.T.So = function (d) {
                b.Am != d && (b.Am = d,
                    a.ta(Ra.qa(d)))
            }
                ;
            this.l = new za(a.yc);
            window.top.document.body.classList.add("hb-playing");
            this.Th = new Wb(this.l, a.T.ma(a.yc).D);
            this.Th.Gi(a.T);
            this.l.Ka.Fl = M(this, this.qq);
            this.l.Ka.wg = M(this, this.pq);
            window.document.addEventListener("keydown", M(this, this.Fa));
            window.document.addEventListener("keyup", M(this, this.ld));
            window.onbeforeunload = function () {
                return "Are you sure you want to leave the room?"
            }
                ;
            this.W.Bg = function (d) {
                a.A();
                a.ta(d)
            }
                ;
            this.W.yl = function (d) {
                "ToggleChat" == d && b.l.Ka.an()
            }
                ;
            this.l.Xa.Mq = function (d) {
                a.ta(Aa.qa(1, d))
            }
                ;
            this.l.Xa.Eq = function (d) {
                a.ta(Aa.qa(0, d))
            }
                ;
            this.l.Cg = function (d) {
                a.ta(Oa.qa(d))
            }
                ;
            this.l.Xa.Jq = function () {
                a.ta(new bb)
            }
                ;
            this.l.Xa.Kq = function () {
                a.ta(new cb)
            }
                ;
            this.l.Xa.xq = function () {
                b.bn()
            }
                ;
            this.l.Xa.Ag = function (d, e) {
                a.ta(fa.qa(d, e))
            }
                ;
            this.l.Xa.pe = M(this, this.Hr);
            this.l.Xa.nq = function () {
                a.ta(new eb)
            }
                ;
            this.l.Xa.Aq = function () {
                Da.lr(a)
            }
                ;
            this.l.Xa.Lq = function (d) {
                a.ta(Pa.qa(d))
            }
                ;
            this.l.Xa.wf = function (d) {
                let e = a.T.ma(d);
                if (null != e) {
                    let f = new Eb(e, b.Mi);
                    f.sb = function () {
                        b.l.ab(null)
                    }
                        ;
                    f.mq = function (g, h) {
                        a.ta(Qa.qa(g, h))
                    }
                        ;
                    f.ti = function () {
                        b.js(e)
                    }
                        ;
                    b.l.ab(f.f, function () {
                        f.A(a.T, b.Mi)
                    })
                }
            }
                ;
            this.l.Xa.Hq = function () {
                let d = new Bb;
                d.sb = function () {
                    b.l.ab(null)
                }
                    ;
                b.l.ab(d.f, function () {
                    d.$r(b.Ng)
                })
            }
                ;
            this.l.Xa.Bq = function () {
                if (null == b.Nd)
                    b.ns();
                else {
                    let d = b.Nd.stop();
                    b.Nd = null;
                    Da.xm(d)
                }
                b.l.Xa.ds(null != b.Nd)
            }
                ;
            window.requestAnimationFrame(M(this, this.sf));
            this.Rh = window.setInterval(function () {
                b.l.Jf.Hm(b.Bd);
                b.Bd = 0
            }, 1E3);
            this.kj = window.setInterval(function () {
                a.A()
            }, 50);
            var c = m.j.Ad.v();
            c = -200 > c ? -200 : 1E3 < c ? 1E3 : c;
            0 != c && (a.Gm(m.j.Ad.v()),
                this.l.Ka.Hb("Extrapolation set to " + c + " msec"))
        }
        ns() {
            this.Nd = new Ac(this.za, 3)
        }
        js(a) {
            a = new ub(a);
            let b = this;
            a.sb = function () {
                b.l.ab(null)
            }
                ;
            a.ti = function (c, d, e) {
                b.za.ta(na.qa(c, d, e));
                b.l.ab(null)
            }
                ;
            this.l.ab(a.f)
        }
        la() {
            window.document.removeEventListener("keydown", M(this, this.Fa));
            window.document.removeEventListener("keyup", M(this, this.ld));
            window.onbeforeunload = null;
            window.cancelAnimationFrame(this.Re);
            window.top.document.body.classList.remove("hb-playing");
            this.W.la();
            window.clearInterval(this.Rh);
            window.clearInterval(this.kj);
            window.clearTimeout(this.cg)
        }
        Hr(a) {
            let b = []
                , c = 0
                , d = this.za.T.K;
            for (; c < d.length;) {
                let e = d[c];
                ++c;
                e.fa == a && b.push(fa.qa(e.Z, u.Pa))
            }
            for (a = 0; a < b.length;)
                this.za.ta(b[a++])
        }
        sf() {
            this.Re = window.requestAnimationFrame(M(this, this.sf));
            this.W.A();
            this.za.A();
            this.Rc()
        }
        Rc() {
            var a = window.performance.now();
            1 == m.j.Qh.v() && 28.333333333333336 > a - this.hd || (this.hd = a,
                this.Bd++,
                a = this.za.T.ma(this.za.yc),
                null != a && (this.Mi = a.cb),
                this.l.A(this.za))
        }
        qq(a) {
            let b = this;
            this.dg.xf(a) || this.so.Io(function () {
                let c = new ab;
                c.$c = a;
                b.za.ta(c)
            })
        }
        pq(a) {
            this.Kh = a;
            let b = this;
            null == this.cg && (this.cg = window.setTimeout(function () {
                b.cg = null;
                b.Bm(b.Kh)
            }, 1E3),
                this.Bm(this.Kh))
        }
        Bm(a) {
            a != this.cl && (this.za.ta(Na.qa(a ? 0 : 1)),
                this.cl = a)
        }
        bn() {
            if (null != this.za.T.M) {
                let a = new db;
                a.Pf = 120 != this.za.T.M.Ta;
                this.za.ta(a)
            }
        }
        Fa(a) {
            var b = m.j.Rd;
            let c = null != m.j.Jd.v().v(a.code);
            switch (a.keyCode) {
                case 9:
                case 13:
                    this.l.Ka.$a.focus({
                        preventScroll: !0
                    });
                    a.preventDefault();
                    break;
                case 27:
                    this.l.$k() ? this.l.ab(null) : (b = this.l,
                        b.xe(!b.od));
                    a.preventDefault();
                    break;
                case 48:
                    c ? this.W.Fa(a) : b.ia(0);
                    break;
                case 49:
                    c ? this.W.Fa(a) : b.ia(1);
                    break;
                case 50:
                    c ? this.W.Fa(a) : b.ia(2);
                    break;
                case 51:
                    c ? this.W.Fa(a) : b.ia(3);
                    break;
                case 52:
                    c ? this.W.Fa(a) : b.ia(4);
                    break;
                case 53:
                    c ? this.W.Fa(a) : b.ia(5);
                    break;
                case 54:
                    c ? this.W.Fa(a) : b.ia(6);
                    break;
                case 55:
                    c ? this.W.Fa(a) : b.ia(7);
                    break;
                case 80:
                    this.bn();
                    break;
                default:
                    this.W.Fa(a)
            }
        }
        ld(a) {
            this.W.ld(a)
        }
        static xm(a) {
            let b = new Date;
            Ub.Mr(a, "HBReplay-" + b.getFullYear() + "-" + Y.Of("" + (b.getMonth() + 1)) + "-" + Y.Of("" + b.getDate()) + "-" + Y.Of("" + b.getHours()) + "h" + Y.Of("" + b.getMinutes()) + "m.hbr2")
        }
        static lr(a) {
            var b = a.T.K;
            let c = [];
            var d = 0;
            let e = 0;
            for (var f = 0; f < b.length;) {
                let g = b[f];
                ++f;
                g.fa == u.Pa && c.push(g.Z);
                g.fa == u.ja ? ++d : g.fa == u.Da && ++e
            }
            f = c.length;
            0 != f && (b = function () {
                return c.splice(Math.random() * c.length | 0, 1)[0]
            }
                ,
                e == d ? 2 > f || (a.ta(fa.qa(b(), u.ja)),
                    a.ta(fa.qa(b(), u.Da))) : (d = e > d ? u.ja : u.Da,
                        a.ta(fa.qa(b(), d))))
        }
    }
    class wa {
        constructor() {
            this.Dc = -1;
            this.En = null;
            this.vn = -Infinity;
            this.fa = u.Pa;
            this.I = null;
            this.Cc = this.Zc = 0;
            this.Yb = !1;
            this.W = this.Z = 0;
            this.D = "Player";
            this.gh = this.zb = 0;
            this.country = null;
            this.Ud = !1;
            this.Zb = this.Sd = null;
            this.Nb = 0;
            this.cb = !1
        }
        xa(a) {
            a.m(this.cb ? 1 : 0);
            a.R(this.Nb);
            a.Eb(this.Zb);
            a.Eb(this.Sd);
            a.m(this.Ud ? 1 : 0);
            a.Eb(this.country);
            a.R(this.gh);
            a.Eb(this.D);
            a.R(this.W);
            a.pb(this.Z);
            a.m(this.Yb ? 1 : 0);
            a.nj(this.Cc);
            a.m(this.Zc);
            a.m(this.fa.ba);
            a.nj(null == this.I ? -1 : this.I.Jl)
        }
        wa(a, b) {
            this.cb = 0 != a.F();
            this.Nb = a.N();
            this.Zb = a.Ab();
            this.Sd = a.Ab();
            this.Ud = 0 != a.F();
            this.country = a.Ab();
            this.gh = a.N();
            this.D = a.Ab();
            this.W = a.N();
            this.Z = a.Bb();
            this.Yb = 0 != a.F();
            this.Cc = a.Ci();
            this.Zc = a.F();
            let c = a.zf();
            this.fa = 1 == c ? u.ja : 2 == c ? u.Da : u.Pa;
            a = a.Ci();
            this.I = 0 > a ? null : b[a]
        }
        Ys() {
            let a = ua.Dc
                , b = this.En;
            this.Dc != a && (null == b && (this.En = b = new wa),
                this.Dc = a,
                wa.Ps(b, this));
            return b
        }
        static Ps(a, b) {
            a.cb = b.cb;
            a.Nb = b.Nb;
            a.Zb = b.Zb;
            a.Sd = b.Sd;
            a.Ud = b.Ud;
            a.country = b.country;
            a.gh = b.gh;
            a.zb = b.zb;
            a.D = b.D;
            a.W = b.W;
            a.Z = b.Z;
            a.Yb = b.Yb;
            a.Cc = b.Cc;
            a.Zc = b.Zc;
            a.I = null == b.I ? null : b.I.vc();
            a.fa = b.fa
        }
    }
    class ua {
    }
    class D {
        static h(a, b) {
            null != a && a(b)
        }
    }
    class Jc {
        constructor(a, b) {
            this.x = a;
            this.y = b
        }
    }
    class Lc {
        static xf(a) {
            a = a.split(" ");
            let b = a[4];
            if ("typ" != a[6])
                throw v.B(null);
            return {
                xs: a[7],
                Fp: b
            }
        }
    }
    class vc {
        constructor(a) {
            this.hd = window.performance.now();
            this.W = new bc;
            this.Bd = this.Re = 0;
            this.za = a;
            this.l = new za(a.yc);
            let b = new Wb(this.l);
            b.Gi(a.T);
            window.document.addEventListener("keydown", M(this, this.Fa));
            window.document.addEventListener("keyup", M(this, this.ld));
            let c = this;
            this.W.yl = function (d) {
                "ToggleChat" == d && c.l.Ka.an()
            }
                ;
            window.requestAnimationFrame(M(this, this.sf));
            this.Rh = window.setInterval(function () {
                c.l.Jf.Hm(c.Bd);
                c.Bd = 0
            }, 1E3);
            this.Km(m.j.Rd.v());
            this.l.f.classList.add("replayer");
            this.te = new Fa(a);
            this.te.Gq = function () {
                b.zs(a.T)
            }
                ;
            this.te.Fq = function () {
                c.l.xe(null == a.T.M);
                b.Gi(a.T)
            }
                ;
            this.te.El = function () {
                c.l.jb.hb.Ir()
            }
                ;
            this.l.f.appendChild(this.te.f);
            this.kj = window.setInterval(function () {
                a.A()
            }, 50)
        }
        la() {
            window.document.removeEventListener("keydown", M(this, this.Fa));
            window.document.removeEventListener("keyup", M(this, this.ld));
            window.onbeforeunload = null;
            window.cancelAnimationFrame(this.Re);
            window.clearInterval(this.Rh);
            window.clearInterval(this.kj);
            this.W.la()
        }
        sf() {
            this.Re = window.requestAnimationFrame(M(this, this.sf));
            this.za.A();
            this.Rc()
        }
        Rc() {
            this.te.A();
            let a = window.performance.now();
            1 == m.j.Qh.v() && 28.333333333333336 > a - this.hd || (this.hd = a,
                this.Bd++,
                this.Km(m.j.Rd.v()),
                0 < this.za.Pd || this.l.A(this.za))
        }
        Fa(a) {
            var b = m.j.Rd;
            let c = null != m.j.Jd.v().v(a.code);
            switch (a.keyCode) {
                case 27:
                    this.l.$k() ? this.l.ab(null) : (b = this.l,
                        b.xe(!b.od));
                    a.preventDefault();
                    break;
                case 48:
                    c ? this.W.Fa(a) : b.ia(0);
                    break;
                case 49:
                    c ? this.W.Fa(a) : b.ia(1);
                    break;
                case 50:
                    c ? this.W.Fa(a) : b.ia(2);
                    break;
                case 51:
                    c ? this.W.Fa(a) : b.ia(3);
                    break;
                case 52:
                    c ? this.W.Fa(a) : b.ia(4);
                    break;
                case 53:
                    c ? this.W.Fa(a) : b.ia(5);
                    break;
                case 54:
                    c ? this.W.Fa(a) : b.ia(6);
                    break;
                case 55:
                    c ? this.W.Fa(a) : b.ia(7);
                    break;
                default:
                    this.W.Fa(a)
            }
        }
        ld(a) {
            this.W.ld(a)
        }
        Km() {
            let a = m.j.Rd.v()
                , b = this.l.jb.hb;
            b.ue = m.j.Li.v();
            b.Wg = 35;
            0 >= a ? b.Ld = 610 : (b.Ld = 0,
                b.Ig = 1 + .25 * (a - 1))
        }
    }
    class Xb {
        static h(a, b, c, d, e) {
            null != a && a(b, c, d, e)
        }
    }
    class A {
        constructor(a, b) {
            null == b && (b = !1);
            this.s = a;
            this.Ua = b;
            this.a = 0
        }
        Vg() {
            let a = new ArrayBuffer(this.a)
                , b = new Uint8Array(this.s.buffer, this.s.byteOffset, this.a);
            (new Uint8Array(a)).set(b);
            return a
        }
        Wb() {
            return new Uint8Array(this.s.buffer, this.s.byteOffset, this.a)
        }
        Qd() {
            return new DataView(this.s.buffer, this.s.byteOffset, this.a)
        }
        ts() {
            return new J(this.Qd(), this.Ua)
        }
        uc(a) {
            this.s.byteLength < a && this.Jr(2 * this.s.byteLength >= a ? 2 * this.s.byteLength : a)
        }
        Jr(a) {
            if (1 > a)
                throw v.B("Can't resize buffer to a capacity lower than 1");
            if (this.s.byteLength < a) {
                let b = new Uint8Array(this.s.buffer);
                a = new ArrayBuffer(a);
                (new Uint8Array(a)).set(b);
                this.s = new DataView(a)
            }
        }
        m(a) {
            let b = this.a++;
            this.uc(this.a);
            this.s.setUint8(b, a)
        }
        nj(a) {
            let b = this.a;
            this.a += 2;
            this.uc(this.a);
            this.s.setInt16(b, a, this.Ua)
        }
        Xb(a) {
            let b = this.a;
            this.a += 2;
            this.uc(this.a);
            this.s.setUint16(b, a, this.Ua)
        }
        R(a) {
            let b = this.a;
            this.a += 4;
            this.uc(this.a);
            this.s.setInt32(b, a, this.Ua)
        }
        tb(a) {
            let b = this.a;
            this.a += 4;
            this.uc(this.a);
            this.s.setUint32(b, a, this.Ua)
        }
        mj(a) {
            let b = this.a;
            this.a += 4;
            this.uc(this.a);
            this.s.setFloat32(b, a, this.Ua)
        }
        u(a) {
            let b = this.a;
            this.a += 8;
            this.uc(this.a);
            this.s.setFloat64(b, a, this.Ua)
        }
        Lb(a) {
            let b = this.a;
            this.a += a.byteLength;
            this.uc(this.a);
            (new Uint8Array(this.s.buffer, this.s.byteOffset, this.s.byteLength)).set(a, b)
        }
        Hs(a) {
            a = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
            this.Lb(a)
        }
        Yg(a) {
            this.Lb(new Uint8Array(a))
        }
        oc(a) {
            this.pb(A.Dh(a));
            this.oj(a)
        }
        Eb(a) {
            null == a ? this.pb(0) : (this.pb(A.Dh(a) + 1),
                this.oj(a))
        }
        kn(a) {
            a = (new TextEncoder).encode(a);
            let b = a.length;
            if (255 < b)
                throw v.B(null);
            this.m(b);
            this.Hs(a)
        }
        Zg(a) {
            this.oc(JSON.stringify(a))
        }
        oj(a) {
            let b = this.a;
            this.uc(b + A.Dh(a));
            let c = a.length
                , d = 0;
            for (; d < c;)
                b += A.bp(O.sj(a, d++), this.s, b);
            this.a = b
        }
        pb(a) {
            let b = this.a;
            a >>>= 0;
            this.uc(b + A.oo(a));
            this.s.setUint8(b, a | 128);
            128 <= a ? (this.s.setUint8(b + 1, a >> 7 | 128),
                16384 <= a ? (this.s.setUint8(b + 2, a >> 14 | 128),
                    2097152 <= a ? (this.s.setUint8(b + 3, a >> 21 | 128),
                        268435456 <= a ? (this.s.setUint8(b + 4, a >> 28 & 127),
                            a = 5) : (this.s.setUint8(b + 3, this.s.getUint8(b + 3) & 127),
                                a = 4)) : (this.s.setUint8(b + 2, this.s.getUint8(b + 2) & 127),
                                    a = 3)) : (this.s.setUint8(b + 1, this.s.getUint8(b + 1) & 127),
                                        a = 2)) : (this.s.setUint8(b, this.s.getUint8(b) & 127),
                                            a = 1);
            this.a += a
        }
        static ka(a, b) {
            null == b && (b = !1);
            null == a && (a = 16);
            return new A(new DataView(new ArrayBuffer(a)), b)
        }
        static bp(a, b, c) {
            let d = c;
            if (0 > a)
                throw v.B("Cannot encode UTF8 character: charCode (" + a + ") is negative");
            if (128 > a)
                b.setUint8(c, a & 127),
                    ++c;
            else if (2048 > a)
                b.setUint8(c, a >> 6 & 31 | 192),
                    b.setUint8(c + 1, a & 63 | 128),
                    c += 2;
            else if (65536 > a)
                b.setUint8(c, a >> 12 & 15 | 224),
                    b.setUint8(c + 1, a >> 6 & 63 | 128),
                    b.setUint8(c + 2, a & 63 | 128),
                    c += 3;
            else if (2097152 > a)
                b.setUint8(c, a >> 18 & 7 | 240),
                    b.setUint8(c + 1, a >> 12 & 63 | 128),
                    b.setUint8(c + 2, a >> 6 & 63 | 128),
                    b.setUint8(c + 3, a & 63 | 128),
                    c += 4;
            else if (67108864 > a)
                b.setUint8(c, a >> 24 & 3 | 248),
                    b.setUint8(c + 1, a >> 18 & 63 | 128),
                    b.setUint8(c + 2, a >> 12 & 63 | 128),
                    b.setUint8(c + 3, a >> 6 & 63 | 128),
                    b.setUint8(c + 4, a & 63 | 128),
                    c += 5;
            else if (-2147483648 > a)
                b.setUint8(c, a >> 30 & 1 | 252),
                    b.setUint8(c + 1, a >> 24 & 63 | 128),
                    b.setUint8(c + 2, a >> 18 & 63 | 128),
                    b.setUint8(c + 3, a >> 12 & 63 | 128),
                    b.setUint8(c + 4, a >> 6 & 63 | 128),
                    b.setUint8(c + 5, a & 63 | 128),
                    c += 6;
            else
                throw v.B("Cannot encode UTF8 character: charCode (" + a + ") is too large (>= 0x80000000)");
            return c - d
        }
        static no(a) {
            if (0 > a)
                throw v.B("Cannot calculate length of UTF8 character: charCode (" + a + ") is negative");
            if (128 > a)
                return 1;
            if (2048 > a)
                return 2;
            if (65536 > a)
                return 3;
            if (2097152 > a)
                return 4;
            if (67108864 > a)
                return 5;
            if (-2147483648 > a)
                return 6;
            throw v.B("Cannot calculate length of UTF8 character: charCode (" + a + ") is too large (>= 0x80000000)");
        }
        static Dh(a) {
            let b = 0
                , c = a.length
                , d = 0;
            for (; d < c;)
                b += A.no(O.sj(a, d++));
            return b
        }
        static oo(a) {
            a >>>= 0;
            return 128 > a ? 1 : 16384 > a ? 2 : 2097152 > a ? 3 : 268435456 > a ? 4 : 5
        }
    }
    class fb {
        constructor() {
            this.list = []
        }
        sn(a) {
            let b = 0
                , c = a.gb
                , d = a.qc
                , e = 0
                , f = this.list;
            for (; e < f.length;) {
                var g = f[e];
                ++e;
                let h = g.gb;
                if (h > c)
                    break;
                if (h == c) {
                    g = g.qc;
                    if (g > d)
                        break;
                    g == d && ++d
                }
                ++b
            }
            a.qc = d;
            this.list.splice(b, 0, a)
        }
        qt(a) {
            let b = 0
                , c = 0
                , d = this.list;
            for (; c < d.length && !(d[c++].gb >= a);)
                ++b;
            this.list.splice(0, b)
        }
        Qs(a, b) {
            let c = this.list;
            for (; 0 < c.length;)
                c.pop();
            fb.ht(a.list, b.list, this.list)
        }
        rt(a) {
            let b = 0
                , c = this.list
                , d = 0
                , e = c.length;
            for (; d < e;) {
                let f = c[d++];
                f.Ge != a && (c[b] = f,
                    ++b)
            }
            for (; c.length > b;)
                c.pop()
        }
        Rs(a) {
            let b = 0
                , c = 0
                , d = this.list;
            for (; c < d.length && !(d[c++].gb >= a);)
                ++b;
            return b
        }
        static ht(a, b, c) {
            if (0 == a.length)
                for (a = 0; a < b.length;)
                    c.push(b[a++]);
            else if (0 == b.length)
                for (b = 0; b < a.length;)
                    c.push(a[b++]);
            else {
                let d = 0
                    , e = a.length
                    , f = 0
                    , g = b.length;
                for (; ;) {
                    let h = a[d]
                        , k = b[f];
                    if (h.gb <= k.gb) {
                        if (c.push(h),
                            ++d,
                            d >= e) {
                            for (; f < g;)
                                c.push(b[f++]);
                            break
                        }
                    } else if (c.push(k),
                        ++f,
                        f >= g) {
                        for (; d < e;)
                            c.push(a[d++]);
                        break
                    }
                }
            }
        }
    }
    class Ta extends pako.Inflate {
        constructor(a) {
            super({
                raw: !0
            });
            this.buffer = a;
            this.total = 0
        }
        onData(a) {
            let b = this.total + a.byteLength;
            if (b > this.buffer.length)
                throw Error("Inflate size exceeds limit");
            this.buffer.set(a, this.total);
            this.total = b
        }
        onEnd(a) {
            this.err = a
        }
        static mn(a, b) {
            let c = new Ta(b);
            c.push(a, !0);
            if (0 != c.err)
                throw Error("Inflate error");
            return b.subarray(0, c.total)
        }
    }
    class $a extends p {
        constructor() {
            super()
        }
        apply(a) {
            a.Bo(this.dh)
        }
        xa(a) {
            a.pb(this.dh.byteLength);
            a.Yg(this.dh)
        }
        wa(a) {
            this.dh = a.cm(a.Bb())
        }
    }
    class oa extends W {
        constructor(a) {
            W.yb ? super() : (W.yb = !0,
                super(),
                W.yb = !1,
                this.Za(a))
        }
        Za(a) {
            this.gj = new fb;
            this.Ee = this.ec = 0;
            this.we = new fb;
            this.yc = this.dc = this.Ad = 0;
            this.Ec = .06;
            this.uh = 16.666666666666668;
            this.Vf = 120;
            super.Za(a)
        }
        ta() {
            throw v.B("missing implementation");
        }
        hg() {
            throw v.B("missing implementation");
        }
        A() {
            throw v.B("missing implementation");
        }
        Sj(a) {
            let b = this.we.list
                , c = 0
                , d = b.length
                , e = 0;
            for (; e < a;) {
                for (++e; c < d;) {
                    let f = b[c];
                    if (f.gb != this.Y)
                        break;
                    f.apply(this.T);
                    null != this.hc && this.hc(f);
                    this.ec++;
                    ++c
                }
                this.T.A(1);
                this.Ee += this.ec;
                this.ec = 0;
                this.Y++
            }
            for (; c < d;) {
                a = b[c];
                if (a.gb != this.Y || a.qc != this.ec)
                    break;
                a.apply(this.T);
                null != this.hc && this.hc(a);
                this.ec++;
                ++c
            }
            b.splice(0, c)
        }
        Pg(a) {
            a.gb == this.Y && a.qc <= this.ec ? (a.qc = this.ec++,
                a.apply(this.T),
                null != this.hc && this.hc(a)) : this.we.sn(a)
        }
        Rk(a, b) {
            if (0 >= a)
                return this.T;
            a > this.Vf && (a = this.Vf);
            ua.Dc++;
            let c = this.T.vc();
            null != b ? (this.gj.Qs(this.we, b),
                b = this.gj) : b = this.we;
            b = b.list;
            let d = 0
                , e = b.length
                , f = this.Y
                , g = a | 0
                , h = f + g;
            for (; f <= h;) {
                for (; d < e;) {
                    let k = b[d];
                    if (k.gb > f)
                        break;
                    k.Td.Ca && k.apply(c);
                    ++d
                }
                c.A(f != h ? 1 : a - g);
                ++f
            }
            for (a = this.gj.list; 0 < a.length;)
                a.pop();
            return c
        }
        Xr(a) {
            300 < a && (a = 300);
            0 > a && (a = 0);
            this.dc = this.Ec * a | 0
        }
        Gm(a) {
            this.Ad = this.Ec * (-200 > a ? -200 : 1E3 < a ? 1E3 : a)
        }
    }
    class Ia extends oa {
        constructor(a, b) {
            W.yb = !0;
            super();
            W.yb = !1;
            this.Za(a, b)
        }
        Za(a, b) {
            this.Si = [];
            this.Ei = [];
            this.Hg = new fb;
            this.jq = 1;
            this.yd = this.Ym = 0;
            this.fj = new gc(50);
            this.Gg = new gc(50);
            this.Rn = 500;
            this.Ak = "";
            super.Za(b.state);
            this.fi = b.At;
            this.Xe = b.Ts;
            let c = null
                , d = this;
            c = function (e) {
                d.If(0);
                let f = A.ka();
                f.Xb(b.version);
                f.Eb(b.password);
                d.sc = new dc(b.Aj, b.iceServers, a, wc.channels, f, b.Mn);
                d.sc.yh = e;
                d.sc.Hd = function (h) {
                    d.sc = null;
                    d.ua = h;
                    h.zg = function (k) {
                        k = new J(new DataView(k));
                        d.er(k)
                    }
                        ;
                    h.tf = function () {
                        3 != d.yd && D.h(d.uf, ja.Tf("Connection closed"));
                        d.la()
                    }
                        ;
                    h = window.setTimeout(function () {
                        D.h(d.uf, ja.Tf("Game state timeout"));
                        d.la()
                    }, 1E4);
                    d.Ce = h;
                    d.If(2)
                }
                    ;
                d.sc.Gl = function () {
                    d.If(1)
                }
                    ;
                let g = !1;
                d.sc.xl = function () {
                    g = !0
                }
                    ;
                d.sc.kd = function (h) {
                    if (!e && 1 == d.yd && g)
                        H.h(d.Dq),
                            c(!0);
                    else {
                        let k = dc.lp(h);
                        switch (h.qb) {
                            case 0:
                                h = ja.$d;
                                break;
                            case 1:
                                h = ja.Ne(h.code);
                                break;
                            case 2:
                                h = ja.Me;
                                break;
                            default:
                                h = ja.Tf(k)
                        }
                        D.h(d.uf, h);
                        d.la(k)
                    }
                }
            }
                ;
            c(null != b.Gn && b.Gn)
        }
        la(a) {
            null != this.sc && (this.sc.kd = null,
                this.sc.po(),
                this.sc = null);
            window.clearTimeout(this.Ce);
            null != this.ua && (this.ua.tf = null,
                this.ua.la(),
                this.ua = null);
            this.Ak = null == a ? "Connection closed" : a;
            this.If(4)
        }
        If(a) {
            this.yd != a && (this.yd = a,
                null != this.Id && this.Id(a))
        }
        Ed() {
            return 3 == this.yd
        }
        A() {
            this.Ed() && window.performance.now() - this.Ym > this.Rn && this.Oi();
            this.ed = window.performance.now() * this.Ec + this.fj.mh() - this.Y;
            this.gk()
        }
        hg() {
            return this.Ed() ? (0 > this.dc && (this.dc = 0),
                this.Rk(window.performance.now() * this.Ec + this.fj.mh() - this.Y + this.dc + this.Ad, this.Hg)) : this.T
        }
        gk() {
            0 > this.ed && (this.ed = 0);
            this.ed > this.Vf && (this.ed = this.Vf)
        }
        er(a) {
            switch (a.F()) {
                case 0:
                    this.br(a);
                    break;
                case 1:
                    this.ar(a);
                    break;
                case 2:
                    this.Yq(a);
                    break;
                case 3:
                    this.gr(a);
                    break;
                case 4:
                    this.dr(a);
                    break;
                case 5:
                    this.$q(a);
                    break;
                case 6:
                    this.fr(a)
            }
        }
        br(a) {
            a = a.lb(a.Bb());
            let b = Promise.resolve(null);
            null != this.Xe && (b = this.Xe.ks(a));
            let c = this;
            b.catch(function () {
                return null
            }).then(function (d) {
                c.Ur(d)
            })
        }
        ar(a) {
            a = pako.inflateRaw(a.lb());
            a = new J(new DataView(a.buffer, a.byteOffset, a.byteLength), !1);
            this.yc = a.Sb();
            this.Y = a.kb();
            this.Ee = a.kb();
            this.ec = a.Bb();
            this.ed = 10;
            for (this.T.na(a); 0 < a.s.byteLength - a.a;)
                this.Pg(this.gn(a));
            window.clearTimeout(this.Ce);
            this.If(3)
        }
        Ur(a) {
            let b = A.ka();
            b.m(0);
            null != a ? (b.pb(a.byteLength),
                b.Lb(a)) : b.pb(0);
            b.pb(this.fi.byteLength);
            b.Yg(this.fi);
            this.Vb(b);
            this.fi = null
        }
        Vb(a, b) {
            null == b && (b = 0);
            this.ua.Vb(b, a)
        }
        gn(a) {
            let b = a.kb()
                , c = a.Bb()
                , d = a.Sb()
                , e = a.kb();
            a = p.Jj(a);
            a.P = d;
            a.Ge = e;
            a.gb = b;
            a.qc = c;
            return a
        }
        Yq(a) {
            a = this.gn(a);
            this.Pg(a);
            a.P == this.yc && this.Hg.rt(a.Ge);
            this.am()
        }
        fr(a) {
            a = p.Jj(a);
            a.P = 0;
            a.Ge = 0;
            a.apply(this.T);
            null != this.hc && this.hc(a)
        }
        gr(a) {
            let b = a.kb();
            a = a.kb();
            this.Ei.push({
                frame: b,
                Nf: a
            });
            this.am()
        }
        am() {
            if (3 == this.yd) {
                for (var a = 0, b = this.Ei; a < b.length;) {
                    var c = b[a];
                    ++a;
                    c.frame <= this.Y || c.Nf == this.Ee + this.ec + this.we.Rs(c.frame) && this.$n(c.frame - this.Y)
                }
                a = 0;
                b = this.Ei;
                c = 0;
                for (var d = b.length; c < d;) {
                    let e = b[c++];
                    e.frame > this.Y && (b[a] = e,
                        ++a)
                }
                for (; b.length > a;)
                    b.pop();
                this.Hg.qt(this.Y)
            }
        }
        $q(a) {
            let b = 0 != a.F()
                , c = a.kc()
                , d = "";
            0 < a.s.byteLength - a.a && (d = a.kc());
            a = b ? "You were banned" : "You were kicked";
            "" != d && (a += " by " + d);
            "" != c && (a += " (" + c + ")");
            this.la(a)
        }
        dr(a) {
            var b = a.w();
            a = a.w();
            let c = window.performance.now() - a;
            this.fj.add(b - a * this.Ec);
            this.Gg.add(c);
            let d = b = 0
                , e = this.Si;
            for (; d < e.length;) {
                let f = e[d];
                ++d;
                if (f > a)
                    break;
                f < a ? D.h(this.Dl, -1) : D.h(this.Dl, c);
                ++b
            }
            this.Si.splice(0, b)
        }
        Oi() {
            let a = window.performance.now();
            this.Ym = a;
            this.Si.push(a);
            let b = this.Gg.mh() | 0
                , c = A.ka();
            c.m(2);
            c.u(a);
            c.pb(b);
            this.Vb(c, 2)
        }
        $n(a) {
            this.Sj(a);
            this.ed -= a;
            this.gk()
        }
        ta(a) {
            if (3 == this.yd) {
                var b = this.jq++
                    , c = 0;
                0 > this.dc && (this.dc = 0);
                a.Td.delay && (c = this.Y + (this.ed | 0) + this.dc);
                var d = A.ka();
                d.m(1);
                d.tb(c);
                d.tb(b);
                p.Cj(a, d);
                this.Vb(d);
                a.Td.Ca && (a.Ge = b,
                    a.P = this.yc,
                    a.gb = c,
                    this.Hg.sn(a))
            }
        }
        static Ih(a) {
            switch (a.qb) {
                case 0:
                    return "Cancelled";
                case 1:
                    return "Failed to connect to peer.";
                case 2:
                    return Oc.description(a.reason);
                case 3:
                    return a.description
            }
        }
    }
    class Zb extends oa {
        constructor(a) {
            W.yb = !0;
            super();
            W.yb = !1;
            this.Za(a)
        }
        Za(a) {
            this.ck = new Map;
            this.Jb = null;
            this.tg = 32;
            this.We = new Map;
            this.cc = [];
            this.Od = 2;
            this.vo = 600;
            super.Za(a.state);
            this.cq = a.Aj;
            this.Fs = a.version;
            this.eq = 1;
            this.dl = this.yc = 0;
            this.aj = window.performance.now();
            this.Oc = new qb(this.cq, a.iceServers, wc.channels, a.Mn);
            this.Oc.rk = M(this, this.wp);
            let b = this;
            this.Oc.Bl = function (c) {
                b.wq(c)
            }
                ;
            this.Oc.yg = function (c) {
                D.h(b.yg, c)
            }
                ;
            this.Oc.vf = function (c, d) {
                null != b.vf && b.vf(c, d)
            }
        }
        la() {
            this.Oc.la();
            let a = 0
                , b = this.cc;
            for (; a < b.length;) {
                let c = b[a++].ua;
                c.tf = null;
                c.zg = null;
                c.la()
            }
        }
        ap(a, b, c, d) {
            let e = this.We.get(a);
            if (null != e) {
                if (d) {
                    let f = this.Oc.fo(e.ua);
                    this.ck.set(a, f)
                }
                a = A.ka();
                a.m(5);
                a.m(d ? 1 : 0);
                a.oc(b);
                null == c && (c = "");
                a.oc(c);
                e.Vb(a);
                e.ua.la()
            }
        }
        de() {
            this.Oc.de();
            this.ck.clear()
        }
        Ui(a) {
            this.Oc.Ui(a)
        }
        Ti(a) {
            this.Oc.Ti(a)
        }
        ta(a) {
            a.P = 0;
            let b = this.Y + this.Od + this.dc;
            a.Td.delay || (b = this.Y);
            a.gb = b;
            this.Pg(a);
            this.Ri();
            0 < this.cc.length && this.Qg(this.ni(a), 1)
        }
        A() {
            let a = ((window.performance.now() - this.aj) * this.Ec | 0) - this.Y;
            0 < a && this.Sj(a);
            7 <= this.Y - this.el && this.Ri();
            this.Y - this.dl >= this.vo && (this.Ri(),
                this.Sr())
        }
        hg() {
            0 > this.dc && (this.dc = 0);
            return this.Rk((window.performance.now() - this.aj) * this.Ec - this.Y + this.Od + this.dc + this.Ad)
        }
        wp(a, b) {
            if (this.cc.length >= this.tg)
                return gb.Uf(4100);
            try {
                if (b.Sb() != this.Fs)
                    throw v.B(null);
            } catch (c) {
                return gb.Uf(4103)
            }
            try {
                let c = b.Ab();
                if (null != this.Jb && c != this.Jb)
                    throw v.B(null);
            } catch (c) {
                return gb.Uf(4101)
            }
            return gb.Lj
        }
        wq(a) {
            if (this.cc.length >= this.tg)
                a.la();
            else {
                var b = new pc(a);
                this.cc.push(b);
                var c = this;
                a.zg = function (d) {
                    c.Zq(d, b)
                }
                    ;
                a.tf = function () {
                    O.remove(c.cc, b);
                    c.We.delete(b.ba);
                    D.h(c.sq, b.ba)
                }
                    ;
                a = A.ka(1 + b.Ve.byteLength);
                a.m(0);
                a.pb(b.Ve.byteLength);
                a.Lb(b.Ve);
                b.Vb(a)
            }
        }
        ni(a) {
            let b = A.ka();
            b.m(2);
            this.Il(a, b);
            return b
        }
        Il(a, b) {
            b.tb(a.gb);
            b.pb(a.qc);
            b.Xb(a.P);
            b.tb(a.Ge);
            p.Cj(a, b)
        }
        Ri() {
            if (!(0 >= this.Y - this.el) && 0 != this.cc.length) {
                var a = A.ka();
                a.m(3);
                a.tb(this.Y);
                a.tb(this.Ee);
                this.Qg(a, 2);
                this.el = this.Y
            }
        }
        Qg(a, b) {
            null == b && (b = 0);
            let c = 0
                , d = this.cc;
            for (; c < d.length;) {
                let e = d[c];
                ++c;
                e.Lg && e.Vb(a, b)
            }
        }
        Tr(a) {
            let b = A.ka();
            b.m(1);
            let c = A.ka();
            c.Xb(a.ba);
            c.tb(this.Y);
            c.tb(this.Ee);
            c.pb(this.ec);
            this.T.ha(c);
            let d = this.we.list
                , e = 0
                , f = d.length;
            for (; e < f;)
                this.Il(d[e++], c);
            b.Lb(pako.deflateRaw(c.Wb()));
            a.Vb(b)
        }
        Sr() {
            this.dl = this.Y;
            if (0 != this.cc.length) {
                var a = new $a;
                a.gb = this.Y;
                a.qc = this.ec++;
                a.P = 0;
                a.dh = this.T.ip();
                this.Qg(this.ni(a))
            }
        }
        ir(a, b) {
            let c = a.lb(a.Bb())
                , d = a.lb(a.Bb());
            a = b.Ve;
            b.Ve = null;
            let e = this;
            V.Es(c, a).catch(function () {
                return null
            }).then(function (f) {
                try {
                    if (-1 != e.cc.indexOf(b)) {
                        b.Bt = f;
                        var g = e.eq++;
                        b.ba = g;
                        e.We.set(g, b);
                        qa.h(e.rq, g, new J(new DataView(d.buffer, d.byteOffset, d.byteLength), !1));
                        b.Lg = !0;
                        e.Tr(b)
                    }
                } catch (h) {
                    f = v.Mb(h).Fb(),
                        e.Sk(b, f)
                }
            })
        }
        Zq(a, b) {
            this.A();
            try {
                let c = new J(new DataView(a));
                if (!b.pp.cn())
                    throw v.B(1);
                let d = c.F();
                if (b.Lg)
                    switch (d) {
                        case 1:
                            this.jr(c, b);
                            break;
                        case 2:
                            this.cr(c, b);
                            break;
                        default:
                            throw v.B(0);
                    }
                else if (0 == d)
                    this.ir(c, b);
                else
                    throw v.B(0);
                if (0 < c.s.byteLength - c.a)
                    throw v.B(2);
            } catch (c) {
                this.Sk(b, v.Mb(c).Fb())
            }
        }
        Sk(a, b) {
            pa.console.log(b);
            this.We.delete(a.ba);
            O.remove(this.cc, a);
            a.Lg && null != this.zl && this.zl(a.ba);
            a.ua.la()
        }
        cr(a, b) {
            let c = a.w();
            b.zb = a.Bb();
            a = A.ka();
            a.m(4);
            a.u((window.performance.now() - this.aj) * this.Ec + this.Od);
            a.u(c);
            b.Vb(a, 2)
        }
        jr(a, b) {
            var c = a.kb();
            let d = a.kb()
                , e = p.yt(a);
            var f = e.Td.nh;
            if (null != f) {
                var g = b.Qj.get(f);
                null == g && (g = new jb(f.bh, f.sh),
                    b.Qj.set(f, g));
                if (!g.cn())
                    throw v.B(3);
            }
            f = e.Td.Dn;
            if (null == f || f(b.ba, this.T)) {
                e.wa(a);
                a = this.Y + this.Od;
                f = this.Y;
                g = this.Y + 20;
                f = c < f ? f : c > g ? g : c;
                g = c - a;
                if (e.Td.delay) {
                    if (g < -this.Od - 3)
                        f = a;
                    else {
                        let h = -this.Od
                            , k = this.Od;
                        b.sl.Qa(g < h ? h : g > k ? k : g)
                    }
                    f < a && -.85 > b.sl.co() && (f = a);
                    f < b.bi && (f = b.bi);
                    b.bi = f
                }
                e.Hn = g;
                c = f - c;
                e.In = 0 < c ? c : 0;
                e.Ge = d;
                e.P = b.ba;
                e.gb = f;
                e.Cn(this.T) && (this.Pg(e),
                    this.Qg(this.ni(e), 1))
            } else
                a.lb()
        }
    }
    class $b extends oa {
        constructor(a, b, c) {
            W.yb = !0;
            super();
            W.yb = !1;
            this.Za(a, b, c)
        }
        Za(a, b, c) {
            this.pl = [];
            this.Pl = 5;
            this.Pd = -1;
            this.vg = this.Ub = this.hi = this.Nk = 0;
            super.Za(b);
            a = new J(new DataView(a.buffer), !1);
            if (1212305970 != a.kb())
                throw v.B("");
            b = a.kb();
            if (c != b)
                throw v.B(new ac(b));
            this.Bf = a.kb();
            c = pako.inflateRaw(a.lb());
            this.Sc = new J(new DataView(c.buffer, c.byteOffset, c.byteLength), !1);
            this.mr(this.Sc);
            c = this.Sc.lb();
            this.Sc = new J(new DataView(c.buffer, c.byteOffset, c.byteLength), !1);
            this.Ji();
            this.hi = window.performance.now();
            this.yc = -1
        }
        mr(a) {
            let b = a.Sb()
                , c = 0
                , d = 0;
            for (; d < b;) {
                ++d;
                c += a.Bb();
                let e = a.F();
                this.pl.push({
                    Dj: c / this.Bf,
                    kind: e
                })
            }
        }
        dm() {
            var a = this.Sc;
            0 < a.s.byteLength - a.a ? (a = this.Sc.Bb(),
                this.vg += a,
                a = this.Sc.Sb(),
                this.ug = p.Jj(this.Sc),
                this.ug.P = a) : this.ug = null
        }
        op() {
            return this.Y / this.Bf
        }
        ta() { }
        hg() {
            this.A();
            ua.Dc++;
            let a = this.T.vc();
            a.A(this.Nk);
            return a
        }
        A() {
            var a = window.performance.now()
                , b = a - this.hi;
            this.hi = a;
            0 < this.Pd ? (this.Ub += 1E4,
                this.Ub > this.Pd && (this.Ub = this.Pd,
                    this.Pd = -1)) : this.Ub += b * this.Pl;
            a = this.Bf * this.uh;
            this.Ub > a && (this.Ub = a);
            b = this.Ub * this.Ec;
            a = b | 0;
            for (this.Nk = b - a; this.Y < a;) {
                for (; null != this.ug && this.vg == this.Y;)
                    b = this.ug,
                        b.apply(this.T),
                        null != this.hc && this.hc(b),
                        this.dm();
                this.Y++;
                this.T.A(1)
            }
        }
        Qr(a) {
            this.Pd = a;
            a < this.Ub && this.Ji()
        }
        Ji() {
            this.vg = 0;
            this.Ub = this.Y = this.Sc.a = 0;
            this.T.na(this.Sc);
            this.dm()
        }
    }
    class Ra extends p {
        constructor() {
            super()
        }
        apply(a) {
            let b = a.ma(this.P);
            null != b && this.kh != b.Ud && (b.Ud = this.kh,
                D.h(a.Sl, b))
        }
        xa(a) {
            a.m(this.kh ? 1 : 0)
        }
        wa(a) {
            this.kh = 0 != a.F()
        }
        static qa(a) {
            let b = new Ra;
            b.kh = a;
            return b
        }
    }
    class Jb extends p {
        constructor() {
            super()
        }
        apply(a) {
            0 == this.P && Xb.h(a.um, this.$c, this.color, this.style, this.Ln)
        }
        xa(a) {
            a.oc(ha.Xc(this.$c, 1E3));
            a.R(this.color);
            a.m(this.style);
            a.m(this.Ln)
        }
        wa(a) {
            this.$c = a.kc();
            if (1E3 < this.$c.length)
                throw v.B("message too long");
            this.color = a.N();
            this.style = a.F();
            this.Ln = a.F()
        }
    }
    class eb extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P)) {
                for (var b = a.ma(this.P), c = a.K, d = [], e = 0, f = 0, g = 0; g < c.length;) {
                    let h = c[g];
                    ++g;
                    h.fa == u.Pa && d.push(h);
                    h.fa == u.ja ? ++e : h.fa == u.Da && ++f
                }
                c = d.length;
                0 != c && (f == e ? 2 > c || (a.ag(b, d[0], u.ja),
                    a.ag(b, d[1], u.Da)) : a.ag(b, d[0], f > e ? u.ja : u.Da))
            }
        }
        xa() { }
        wa() { }
    }
    class Aa extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P) && null == a.M)
                switch (this.Gj) {
                    case 0:
                        var b = this.newValue;
                        a.mb = 0 > b ? 0 : 99 < b ? 99 : b;
                        break;
                    case 1:
                        b = this.newValue,
                            a.Ga = 0 > b ? 0 : 99 < b ? 99 : b
                }
        }
        xa(a) {
            a.R(this.Gj);
            a.R(this.newValue)
        }
        wa(a) {
            this.Gj = a.N();
            this.newValue = a.N()
        }
        static qa(a, b) {
            let c = new Aa;
            c.Gj = a;
            c.newValue = b;
            return c
        }
    }
    class Qa extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P)) {
                var b = a.ma(this.P)
                    , c = a.ma(this.Vd);
                null != c && 0 != c.Z && c.cb != this.jh && (c.cb = this.jh,
                    null != a.xi && a.xi(b, c))
            }
        }
        xa(a) {
            a.R(this.Vd);
            a.m(this.jh ? 1 : 0)
        }
        wa(a) {
            this.Vd = a.N();
            this.jh = 0 != a.F()
        }
        static qa(a, b) {
            let c = new Qa;
            c.Vd = a;
            c.jh = b;
            return c
        }
    }
    class Ma extends p {
        constructor() {
            super()
        }
        apply(a) {
            a = a.ma(this.P);
            null != a && (a.Zb = this.ac)
        }
        xa(a) {
            a.Eb(this.ac)
        }
        wa(a) {
            this.ac = a.Ab();
            null != this.ac && (this.ac = ha.Xc(this.ac, 2))
        }
        static qa(a) {
            let b = new Ma;
            b.ac = a;
            return b
        }
    }
    class fa extends p {
        constructor() {
            super()
        }
        apply(a) {
            let b = a.ma(this.Vd);
            if (null != b) {
                var c = a.ma(this.P)
                    , d = a.Pb(this.P);
                (d = d || b == c && !a.Bc && null == a.M) && a.ag(c, b, this.Bj)
            }
        }
        xa(a) {
            a.R(this.Vd);
            a.m(this.Bj.ba)
        }
        wa(a) {
            this.Vd = a.N();
            a = a.zf();
            this.Bj = 1 == a ? u.ja : 2 == a ? u.Da : u.Pa
        }
        static qa(a, b) {
            let c = new fa;
            c.Vd = a;
            c.Bj = b;
            return c
        }
    }
    class Oa extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P)) {
                var b = a.ma(this.P);
                null == a.M && (a.U = this.Yd,
                    null != a.Yi && a.Yi(b, this.Yd))
            }
        }
        xa(a) {
            var b = A.ka();
            this.Yd.ha(b);
            b = pako.deflateRaw(b.Wb());
            a.Xb(b.byteLength);
            a.Lb(b)
        }
        wa(a) {
            a = pako.inflateRaw(a.lb(a.Sb()));
            this.Yd = q.na(new J(new DataView(a.buffer, a.byteOffset, a.byteLength), !1))
        }
        static qa(a) {
            let b = new Oa;
            b.Yd = a;
            return b
        }
    }
    class Za extends p {
        constructor() {
            super()
        }
        apply(a) {
            a.Pb(this.P) && this.fa != u.Pa && (a.ob[this.fa.ba] = this.eh)
        }
        xa(a) {
            a.m(this.fa.ba);
            this.eh.ha(a)
        }
        wa(a) {
            let b = a.zf();
            this.fa = 1 == b ? u.ja : 2 == b ? u.Da : u.Pa;
            this.eh = new xa;
            this.eh.na(a)
        }
    }
    class Pa extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P)) {
                var b = a.Bc;
                a.Bc = this.newValue;
                b != this.newValue && qa.h(a.Dt, a.ma(this.P), this.newValue)
            }
        }
        xa(a) {
            a.m(this.newValue ? 1 : 0)
        }
        wa(a) {
            this.newValue = 0 != a.F()
        }
        static qa(a) {
            let b = new Pa;
            b.newValue = a;
            return b
        }
    }
    class Ha extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (0 == this.P) {
                var b = new wa;
                b.Z = this.Z;
                b.D = this.name;
                b.country = this.tj;
                b.Zb = this.Zb;
                a.K.push(b);
                a = a.Tl;
                null != a && a(b)
            }
        }
        xa(a) {
            a.R(this.Z);
            a.Eb(this.name);
            a.Eb(this.tj);
            a.Eb(this.Zb)
        }
        wa(a) {
            this.Z = a.N();
            this.name = a.Ab();
            this.tj = a.Ab();
            this.Zb = a.Ab()
        }
        static qa(a, b, c, d) {
            let e = new Ha;
            e.Z = a;
            e.name = b;
            e.tj = c;
            e.Zb = d;
            return e
        }
    }
    class Lb extends p {
        constructor() {
            super()
        }
        apply(a) {
            a = a.ma(this.Ke);
            null != a && 0 == this.P && (a.Sd = this.ac)
        }
        xa(a) {
            a.Eb(this.ac);
            a.R(this.Ke)
        }
        wa(a) {
            this.ac = a.Ab();
            this.Ke = a.N();
            null != this.ac && (this.ac = ha.Xc(this.ac, 2))
        }
    }
    class db extends p {
        constructor() {
            super()
        }
        apply(a) {
            let b = a.M;
            if (null != b && a.Pb(this.P)) {
                var c = a.ma(this.P)
                    , d = 120 == b.Ta
                    , e = 0 < b.Ta;
                this.Pf ? b.Ta = 120 : 120 == b.Ta && (b.Ta = 119);
                d != this.Pf && rc.h(a.Ml, c, this.Pf, e)
            }
        }
        xa(a) {
            a.m(this.Pf ? 1 : 0)
        }
        wa(a) {
            this.Pf = 0 != a.F()
        }
    }
    class ab extends p {
        constructor() {
            super()
        }
        Cn(a) {
            if (null != a.Sq) {
                let b = a.ma(this.P);
                return null == b ? !1 : a.Sq(b, this.$c)
            }
            return !0
        }
        apply(a) {
            let b = a.ma(this.P);
            null != b && qa.h(a.Rl, b, this.$c)
        }
        xa(a) {
            a.oc(ha.Xc(this.$c, 140))
        }
        wa(a) {
            this.$c = a.kc();
            if (140 < this.$c.length)
                throw v.B("message too long");
        }
    }
    class Ja extends p {
        constructor() {
            super()
        }
        apply(a) {
            let b = a.ma(this.P);
            if (null != b) {
                var c = this.input;
                0 == (b.W & 16) && 0 != (c & 16) && (b.Yb = !0);
                b.W = c;
                null != a.Tq && null != b.I && a.Tq(b, this.input, this.Hn, this.In)
            }
        }
        xa(a) {
            a.tb(this.input)
        }
        wa(a) {
            this.input = a.kb()
        }
    }
    class Na extends p {
        constructor() {
            super()
        }
        apply(a) {
            let b = a.ma(this.P);
            null != b && qa.h(a.Wl, b, this.Hj)
        }
        xa(a) {
            a.m(this.Hj)
        }
        wa(a) {
            this.Hj = a.F()
        }
        static qa(a) {
            let b = new Na;
            b.Hj = a;
            return b
        }
    }
    class na extends p {
        constructor() {
            p.yb = !0;
            super();
            p.yb = !1;
            this.Za()
        }
        Za() {
            this.ah = !1;
            super.Za()
        }
        apply(a) {
            if (0 != this.Z && a.Pb(this.P)) {
                var b = a.ma(this.Z);
                if (null != b) {
                    var c = a.ma(this.P);
                    O.remove(a.K, b);
                    null != a.M && O.remove(a.M.va.H, b.I);
                    Xb.h(a.Ul, b, this.qd, this.ah, c)
                }
            }
        }
        xa(a) {
            null != this.qd && (this.qd = ha.Xc(this.qd, 100));
            a.R(this.Z);
            a.Eb(this.qd);
            a.m(this.ah ? 1 : 0)
        }
        wa(a) {
            this.Z = a.N();
            this.qd = a.Ab();
            this.ah = 0 != a.F();
            if (null != this.qd && 100 < this.qd.length)
                throw v.B("string too long");
        }
        static qa(a, b, c) {
            let d = new na;
            d.Z = a;
            d.qd = b;
            d.ah = c;
            return d
        }
    }
    class Kb extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (0 == this.P) {
                for (var b = new Map, c = 0, d = a.K; c < d.length;) {
                    var e = d[c];
                    ++c;
                    b.set(e.Z, e)
                }
                c = [];
                d = 0;
                for (e = this.lh; d < e.length;) {
                    var f = e[d];
                    ++d;
                    let g = b.get(f);
                    null != g && (b.delete(f),
                        c.push(g))
                }
                d = [];
                b = b.values();
                for (e = b.next(); !e.done;)
                    f = e.value,
                        e = b.next(),
                        d.push(f);
                a.K = this.Bn ? c.concat(d) : d.concat(c)
            }
        }
        xa(a) {
            a.m(this.Bn ? 1 : 0);
            a.m(this.lh.length);
            let b = 0
                , c = this.lh;
            for (; b < c.length;)
                a.R(c[b++])
        }
        wa(a) {
            this.Bn = 0 != a.F();
            let b = a.F();
            this.lh = [];
            let c = 0;
            for (; c < b;)
                ++c,
                    this.lh.push(a.N())
        }
    }
    class Mb extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (0 == this.P) {
                var b = a.M;
                if (null != b) {
                    if (this.tn) {
                        a = a.ma(this.Ke);
                        if (null == a)
                            return;
                        a = a.I
                    } else
                        a = b.va.H[this.Ke];
                    null != a && (null != this.Na[0] && (a.a.x = this.Na[0]),
                        null != this.Na[1] && (a.a.y = this.Na[1]),
                        null != this.Na[2] && (a.G.x = this.Na[2]),
                        null != this.Na[3] && (a.G.y = this.Na[3]),
                        null != this.Na[4] && (a.ra.x = this.Na[4]),
                        null != this.Na[5] && (a.ra.y = this.Na[5]),
                        null != this.Na[6] && (a.V = this.Na[6]),
                        null != this.Na[7] && (a.o = this.Na[7]),
                        null != this.Na[8] && (a.ca = this.Na[8]),
                        null != this.Na[9] && (a.Ea = this.Na[9]),
                        null != this.Yc[0] && (a.S = this.Yc[0]),
                        null != this.Yc[1] && (a.i = this.Yc[1]),
                        null != this.Yc[2] && (a.C = this.Yc[2]))
                }
            }
        }
        xa(a) {
            a.R(this.Ke);
            a.m(this.tn ? 1 : 0);
            let b = a.a;
            a.Xb(0);
            let c = 0;
            for (var d = 1, e = 0, f = this.Na; e < f.length;) {
                var g = f[e];
                ++e;
                null != g && (c |= d,
                    a.mj(g));
                d <<= 1
            }
            e = 0;
            for (f = this.Yc; e < f.length;)
                g = f[e],
                    ++e,
                    null != g && (c |= d,
                        a.R(g)),
                    d <<= 1;
            d = a.a;
            a.a = b;
            a.Xb(c);
            a.a = d
        }
        wa(a) {
            this.Ke = a.N();
            this.tn = 0 != a.F();
            let b = a.Sb();
            this.Na = [];
            for (var c = 0; 10 > c;) {
                var d = c++;
                this.Na[d] = null;
                0 != (b & 1) && (this.Na[d] = a.Bi());
                b >>>= 1
            }
            this.Yc = [];
            for (c = 0; 3 > c;)
                d = c++,
                    this.Yc[d] = null,
                    0 != (b & 1) && (this.Yc[d] = a.N()),
                    b >>>= 1
        }
    }
    class La extends p {
        constructor() {
            super()
        }
        apply(a) {
            a.Pb(this.P) && a.Zr(a.ma(this.P), this.min, this.rate, this.rj)
        }
        xa(a) {
            a.R(this.min);
            a.R(this.rate);
            a.R(this.rj)
        }
        wa(a) {
            this.min = a.N();
            this.rate = a.N();
            this.rj = a.N()
        }
        static qa(a, b, c) {
            let d = new La;
            d.min = a;
            d.rate = b;
            d.rj = c;
            return d
        }
    }
    class bb extends p {
        constructor() {
            super()
        }
        apply(a) {
            a.Pb(this.P) && a.ms(a.ma(this.P))
        }
        xa() { }
        wa() { }
    }
    class cb extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (a.Pb(this.P)) {
                var b = a.ma(this.P);
                if (null != a.M) {
                    a.M = null;
                    let c = 0
                        , d = a.K;
                    for (; c < d.length;) {
                        let e = d[c];
                        ++c;
                        e.I = null;
                        e.Nb = 0
                    }
                    null != a.Kf && a.Kf(b)
                }
            }
        }
        xa() { }
        wa() { }
    }
    class Ga extends p {
        constructor() {
            super()
        }
        apply(a) {
            if (0 == this.P) {
                a = a.K;
                for (var b = 0, c = a.length; b < c;) {
                    let d = b++;
                    if (d >= this.Ie.length)
                        break;
                    a[d].zb = this.Ie[d]
                }
            }
        }
        xa(a) {
            a.pb(this.Ie.length);
            let b = 0
                , c = this.Ie;
            for (; b < c.length;)
                a.pb(c[b++])
        }
        wa(a) {
            this.Ie = [];
            let b = a.Bb()
                , c = 0;
            for (; c < b;)
                ++c,
                    this.Ie.push(a.Bb())
        }
        static qa(a) {
            let b = new Ga
                , c = a.T.K
                , d = []
                , e = 0;
            for (; e < c.length;) {
                let f = a.We.get(c[e++].Z);
                d.push(null == f ? 0 : f.zb)
            }
            b.Ie = d;
            return b
        }
    }
    class v extends Error {
        constructor(a, b, c) {
            super(a);
            this.message = a;
            this.Pj = null != c ? c : this
        }
        Fb() {
            return this.Pj
        }
        static Mb(a) {
            return a instanceof v ? a : a instanceof Error ? new v(a.message, null, a) : new Nb(a, null, a)
        }
        static B(a) {
            return a instanceof v ? a.Pj : a instanceof Error ? a : new Nb(a)
        }
    }
    class Nb extends v {
        constructor(a, b, c) {
            super(String(a), b, c);
            this.value = a
        }
        Fb() {
            return this.value
        }
    }
    var Ib = Ib || {}, X;
    mc.b = !0;
    Object.assign(mc.prototype, {
        g: mc
    });
    O.b = !0;
    Math.b = !0;
    Ic.b = !0;
    Q.b = !0;
    Y.b = !0;
    ha.b = !0;
    uc.b = !0;
    Object.assign(uc.prototype, {
        g: uc
    });
    var ia = Ib["bas.basnet.FailReason"] = {
        Wf: !0,
        ae: null,
        $d: {
            xc: "PeerFailed",
            qb: 0,
            Gb: "bas.basnet.FailReason",
            toString: ka
        },
        Ne: (X = function (a) {
            return {
                qb: 1,
                code: a,
                Gb: "bas.basnet.FailReason",
                toString: ka
            }
        }
            ,
            X.xc = "Rejected",
            X.Oe = ["code"],
            X),
        Me: {
            xc: "Cancelled",
            qb: 2,
            Gb: "bas.basnet.FailReason",
            toString: ka
        },
        Error: {
            xc: "Error",
            qb: 3,
            Gb: "bas.basnet.FailReason",
            toString: ka
        }
    };
    ia.ae = [ia.$d, ia.Ne, ia.Me, ia.Error];
    dc.b = !0;
    Object.assign(dc.prototype, {
        g: dc
    });
    Dc.b = !0;
    Dc.wh = !0;
    Ca.b = !0;
    Ca.ad = [Dc];
    Object.assign(Ca.prototype, {
        g: Ca
    });
    var gb = Ib["bas.basnet.ConnectionRequestResponse"] = {
        Wf: !0,
        ae: null,
        Lj: {
            xc: "Accept",
            qb: 0,
            Gb: "bas.basnet.ConnectionRequestResponse",
            toString: ka
        },
        Uf: (X = function (a) {
            return {
                qb: 1,
                reason: a,
                Gb: "bas.basnet.ConnectionRequestResponse",
                toString: ka
            }
        }
            ,
            X.xc = "Reject",
            X.Oe = ["reason"],
            X)
    };
    gb.ae = [gb.Lj, gb.Uf];
    qb.b = !0;
    Object.assign(qb.prototype, {
        g: qb
    });
    Lc.b = !0;
    Pb.b = !0;
    Object.assign(Pb.prototype, {
        g: Pb
    });
    J.b = !0;
    Object.assign(J.prototype, {
        g: J
    });
    A.b = !0;
    Object.assign(A.prototype, {
        g: A
    });
    V.b = !0;
    Object.assign(V.prototype, {
        g: V
    });
    Gb.b = !0;
    Ta.b = !0;
    Ta.ga = pako.Inflate;
    Object.assign(Ta.prototype, {
        g: Ta
    });
    nb.b = !0;
    Ub.b = !0;
    Ob.b = !0;
    Object.assign(Ob.prototype, {
        g: Ob
    });
    x.b = !0;
    Yb.b = !0;
    Ec.b = !0;
    p.b = !0;
    Object.assign(p.prototype, {
        g: p
    });
    fb.b = !0;
    Object.assign(fb.prototype, {
        g: fb
    });
    W.b = !0;
    Object.assign(W.prototype, {
        g: W
    });
    $a.b = !0;
    $a.ga = p;
    Object.assign($a.prototype, {
        g: $a
    });
    fc.b = !0;
    fc.wh = !0;
    Object.assign(fc.prototype, {
        g: fc
    });
    gc.b = !0;
    Object.assign(gc.prototype, {
        g: gc
    });
    nc.b = !0;
    Object.assign(nc.prototype, {
        g: nc
    });
    Ac.b = !0;
    Object.assign(Ac.prototype, {
        g: Ac
    });
    Ka.b = !0;
    Ka.wh = !0;
    ua.b = !0;
    oa.b = !0;
    oa.ga = W;
    Object.assign(oa.prototype, {
        g: oa
    });
    var ja = Ib["bas.marf.net.ConnFailReason"] = {
        Wf: !0,
        ae: null,
        Me: {
            xc: "Cancelled",
            qb: 0,
            Gb: "bas.marf.net.ConnFailReason",
            toString: ka
        },
        $d: {
            xc: "PeerFailed",
            qb: 1,
            Gb: "bas.marf.net.ConnFailReason",
            toString: ka
        },
        Ne: (X = function (a) {
            return {
                qb: 2,
                reason: a,
                Gb: "bas.marf.net.ConnFailReason",
                toString: ka
            }
        }
            ,
            X.xc = "Rejected",
            X.Oe = ["reason"],
            X),
        Tf: (X = function (a) {
            return {
                qb: 3,
                description: a,
                Gb: "bas.marf.net.ConnFailReason",
                toString: ka
            }
        }
            ,
            X.xc = "Other",
            X.Oe = ["description"],
            X)
    };
    ja.ae = [ja.Me, ja.$d, ja.Ne, ja.Tf];
    Ia.b = !0;
    Ia.ga = oa;
    Object.assign(Ia.prototype, {
        g: Ia
    });
    Zb.b = !0;
    Zb.ga = oa;
    Object.assign(Zb.prototype, {
        g: Zb
    });
    pc.b = !0;
    Object.assign(pc.prototype, {
        g: pc
    });
    qc.b = !0;
    Object.assign(qc.prototype, {
        g: qc
    });
    wc.b = !0;
    ac.b = !0;
    Object.assign(ac.prototype, {
        g: ac
    });
    $b.b = !0;
    $b.ga = oa;
    Object.assign($b.prototype, {
        g: $b
    });
    Tb.b = !0;
    Object.assign(Tb.prototype, {
        g: Tb
    });
    Jc.b = !0;
    Object.assign(Jc.prototype, {
        g: Jc
    });
    P.b = !0;
    Object.assign(P.prototype, {
        g: P
    });
    Z.b = !0;
    H.b = !0;
    D.b = !0;
    qa.b = !0;
    rc.b = !0;
    Xb.b = !0;
    jb.b = !0;
    Object.assign(jb.prototype, {
        g: jb
    });
    Cc.b = !0;
    ec.b = !0;
    Object.assign(ec.prototype, {
        g: ec
    });
    Ea.b = !0;
    Da.b = !0;
    Object.assign(Da.prototype, {
        g: Da
    });
    Wb.b = !0;
    Object.assign(Wb.prototype, {
        g: Wb
    });
    bc.b = !0;
    Object.assign(bc.prototype, {
        g: bc
    });
    la.b = !0;
    Object.assign(la.prototype, {
        g: la
    });
    lc.b = !0;
    Object.assign(lc.prototype, {
        g: lc
    });
    Bc.b = !0;
    ra.b = !0;
    Object.assign(ra.prototype, {
        g: ra
    });
    sa.b = !0;
    Object.assign(sa.prototype, {
        g: sa
    });
    m.b = !0;
    oc.b = !0;
    Object.assign(oc.prototype, {
        g: oc
    });
    B.b = !0;
    C.b = !0;
    vc.b = !0;
    Object.assign(vc.prototype, {
        g: vc
    });
    Rb.b = !0;
    Object.assign(Rb.prototype, {
        g: Rb
    });
    Qb.b = !0;
    ob.b = !0;
    jc.b = !0;
    Object.assign(jc.prototype, {
        g: jc
    });
    kc.b = !0;
    Object.assign(kc.prototype, {
        g: kc
    });
    ya.b = !0;
    Object.assign(ya.prototype, {
        g: ya
    });
    aa.b = !0;
    aa.ad = [Ka];
    Object.assign(aa.prototype, {
        g: aa
    });
    lb.b = !0;
    Object.assign(lb.prototype, {
        g: lb
    });
    Sb.b = !0;
    Object.assign(Sb.prototype, {
        g: Sb
    });
    Sa.b = !0;
    Object.assign(Sa.prototype, {
        g: Sa
    });
    q.b = !0;
    Object.assign(q.prototype, {
        g: q
    });
    xa.b = !0;
    Object.assign(xa.prototype, {
        g: xa
    });
    u.b = !0;
    Object.assign(u.prototype, {
        g: u
    });
    va.b = !0;
    va.ad = [Ka, fc];
    Object.assign(va.prototype, {
        g: va
    });
    wa.b = !0;
    wa.ad = [Ka];
    Object.assign(wa.prototype, {
        g: wa
    });
    Ra.b = !0;
    Ra.ga = p;
    Object.assign(Ra.prototype, {
        g: Ra
    });
    Jb.b = !0;
    Jb.ga = p;
    Object.assign(Jb.prototype, {
        g: Jb
    });
    eb.b = !0;
    eb.ga = p;
    Object.assign(eb.prototype, {
        g: eb
    });
    Aa.b = !0;
    Aa.ga = p;
    Object.assign(Aa.prototype, {
        g: Aa
    });
    Qa.b = !0;
    Qa.ga = p;
    Object.assign(Qa.prototype, {
        g: Qa
    });
    Ma.b = !0;
    Ma.ga = p;
    Object.assign(Ma.prototype, {
        g: Ma
    });
    fa.b = !0;
    fa.ga = p;
    Object.assign(fa.prototype, {
        g: fa
    });
    Oa.b = !0;
    Oa.ga = p;
    Object.assign(Oa.prototype, {
        g: Oa
    });
    Za.b = !0;
    Za.ga = p;
    Object.assign(Za.prototype, {
        g: Za
    });
    Pa.b = !0;
    Pa.ga = p;
    Object.assign(Pa.prototype, {
        g: Pa
    });
    Ha.b = !0;
    Ha.ga = p;
    Object.assign(Ha.prototype, {
        g: Ha
    });
    Lb.b = !0;
    Lb.ga = p;
    Object.assign(Lb.prototype, {
        g: Lb
    });
    db.b = !0;
    db.ga = p;
    Object.assign(db.prototype, {
        g: db
    });
    ab.b = !0;
    ab.ga = p;
    Object.assign(ab.prototype, {
        g: ab
    });
    Ja.b = !0;
    Ja.ga = p;
    Object.assign(Ja.prototype, {
        g: Ja
    });
    Na.b = !0;
    Na.ga = p;
    Object.assign(Na.prototype, {
        g: Na
    });
    Nc.b = !0;
    na.b = !0;
    na.ga = p;
    Object.assign(na.prototype, {
        g: na
    });
    Kb.b = !0;
    Kb.ga = p;
    Object.assign(Kb.prototype, {
        g: Kb
    });
    Mb.b = !0;
    Mb.ga = p;
    Object.assign(Mb.prototype, {
        g: Mb
    });
    La.b = !0;
    La.ga = p;
    Object.assign(La.prototype, {
        g: La
    });
    bb.b = !0;
    bb.ga = p;
    Object.assign(bb.prototype, {
        g: bb
    });
    cb.b = !0;
    cb.ga = p;
    Object.assign(cb.prototype, {
        g: cb
    });
    Ga.b = !0;
    Ga.ga = p;
    Object.assign(Ga.prototype, {
        g: Ga
    });
    ta.b = !0;
    ta.ad = [Ka];
    Object.assign(ta.prototype, {
        g: ta
    });
    Ab.b = !0;
    Ab.ad = [Ka];
    Object.assign(Ab.prototype, {
        g: Ab
    });
    Wa.b = !0;
    Wa.ad = [Ka];
    Object.assign(Wa.prototype, {
        g: Wa
    });
    S.b = !0;
    Object.assign(S.prototype, {
        g: S
    });
    I.b = !0;
    Object.assign(I.prototype, {
        g: I
    });
    G.b = !0;
    Object.assign(G.prototype, {
        g: G
    });
    T.b = !0;
    Object.assign(T.prototype, {
        g: T
    });
    da.b = !0;
    Object.assign(da.prototype, {
        g: da
    });
    xc.b = !0;
    Object.assign(xc.prototype, {
        g: xc
    });
    Hb.b = !0;
    Object.assign(Hb.prototype, {
        g: Hb
    });
    vb.b = !0;
    Object.assign(vb.prototype, {
        g: vb
    });
    Xa.b = !0;
    Object.assign(Xa.prototype, {
        g: Xa
    });
    Vb.b = !0;
    Object.assign(Vb.prototype, {
        g: Vb
    });
    xb.b = !0;
    Object.assign(xb.prototype, {
        g: xb
    });
    yb.b = !0;
    Object.assign(yb.prototype, {
        g: yb
    });
    pb.b = !0;
    Object.assign(pb.prototype, {
        g: pb
    });
    Ua.b = !0;
    Object.assign(Ua.prototype, {
        g: Ua
    });
    hb.b = !0;
    Object.assign(hb.prototype, {
        g: hb
    });
    ic.b = !0;
    Object.assign(ic.prototype, {
        g: ic
    });
    yc.b = !0;
    Object.assign(yc.prototype, {
        g: yc
    });
    za.b = !0;
    Object.assign(za.prototype, {
        g: za
    });
    ub.b = !0;
    Object.assign(ub.prototype, {
        g: ub
    });
    kb.b = !0;
    Object.assign(kb.prototype, {
        g: kb
    });
    mb.b = !0;
    Object.assign(mb.prototype, {
        g: mb
    });
    zc.b = !0;
    Object.assign(zc.prototype, {
        g: zc
    });
    Eb.b = !0;
    Object.assign(Eb.prototype, {
        g: Eb
    });
    wb.b = !0;
    Object.assign(wb.prototype, {
        g: wb
    });
    Ba.b = !0;
    Object.assign(Ba.prototype, {
        g: Ba
    });
    ba.b = !0;
    Object.assign(ba.prototype, {
        g: ba
    });
    Fa.b = !0;
    Object.assign(Fa.prototype, {
        g: Fa
    });
    Bb.b = !0;
    Object.assign(Bb.prototype, {
        g: Bb
    });
    Db.b = !0;
    Object.assign(Db.prototype, {
        g: Db
    });
    Ya.b = !0;
    Object.assign(Ya.prototype, {
        g: Ya
    });
    Cb.b = !0;
    Object.assign(Cb.prototype, {
        g: Cb
    });
    rb.b = !0;
    Object.assign(rb.prototype, {
        g: rb
    });
    ib.b = !0;
    Object.assign(ib.prototype, {
        g: ib
    });
    ma.b = !0;
    Object.assign(ma.prototype, {
        g: ma
    });
    ca.b = !0;
    Object.assign(ca.prototype, {
        g: ca
    });
    Fb.b = !0;
    Object.assign(Fb.prototype, {
        g: Fb
    });
    zb.b = !0;
    Object.assign(zb.prototype, {
        g: zb
    });
    v.b = !0;
    v.ga = Error;
    Object.assign(v.prototype, {
        g: v
    });
    Nb.b = !0;
    Nb.ga = v;
    Object.assign(Nb.prototype, {
        g: Nb
    });
    Gc.b = !0;
    Object.assign(Gc.prototype, {
        g: Gc
    });
    w.b = !0;
    pa.Kj |= 0;
    "undefined" != typeof performance && "function" == typeof performance.now && (O.now = performance.now.bind(performance));
    null == String.fromCodePoint && (String.fromCodePoint = function (a) {
        return 65536 > a ? String.fromCharCode(a) : String.fromCharCode((a >> 10) + 55232) + String.fromCharCode((a & 1023) + 56320)
    }
    );
    Object.defineProperty(String.prototype, "__class__", {
        value: String,
        enumerable: !1,
        writable: !0
    });
    String.b = !0;
    Array.b = !0;
    Date.prototype.g = Date;
    Date.b = "Date";
    var cc = {}
        , Pc = {}
        , E = Number
        , Hc = Boolean
        , Qc = {}
        , Rc = {};
    u.Pa = new u(0, 16777215, 0, -1, "Spectators", "t-spec", 0, 0);
    u.ja = new u(1, 15035990, -1, 8, "Red", "t-red", 15035990, 2);
    u.Da = new u(2, 5671397, 1, 16, "Blue", "t-blue", 625603, 4);
    u.Pa.Dg = u.Pa;
    u.ja.Dg = u.Da;
    u.Da.Dg = u.ja;
    w.Xn = {}.toString;
    Ca.Ho = {
        mandatory: {
            OfferToReceiveAudio: !1,
            OfferToReceiveVideo: !1
        }
    };
    var Kc = new Uint8Array(51200);
    V.xh = {
        name: "ECDSA",
        namedCurve: "P-256"
    };
    V.Mm = {
        name: "ECDSA",
        hash: {
            name: "SHA-256"
        }
    };
    nb.Cp = ["click-rail", "drag-thumb", "wheel", "touch"];
    p.yb = !1;
    p.wj = new Map;
    p.Nf = 0;
    W.yb = !1;
    $a.Aa = p.Ha({
        Ca: !1,
        delay: !1,
        Dn: function () {
            throw v.B(null);
        }
    });
    ua.Dc = 0;
    wc.channels = [{
        name: "ro",
        reliable: !0,
        ordered: !0
    }, {
        name: "ru",
        reliable: !0,
        ordered: !1
    }, {
        name: "uu",
        reliable: !1,
        ordered: !1
    }];
    Z.Mj = "application/x-www-form-urlencoded";
    Ea.fb = ["Afghanistan", "AF", 33.3, 65.1, "Albania", "AL", 41.1, 20.1, "Algeria", "DZ", 28, 1.6, "American Samoa", "AS", -14.2, -170.1, "Andorra", "AD", 42.5, 1.6, "Angola", "AO", -11.2, 17.8, "Anguilla", "AI", 18.2, -63, "Antigua and Barbuda", "AG", 17, -61.7, "Argentina", "AR", -34.5, -58.4, "Armenia", "AM", 40, 45, "Aruba", "AW", 12.5, -69.9, "Australia", "AU", -25.2, 133.7, "Austria", "AT", 47.5, 14.5, "Azerbaijan", "AZ", 40.1, 47.5, "Bahamas", "BS", 25, -77.3, "Bahrain", "BH", 25.9, 50.6, "Bangladesh", "BD", 23.6, 90.3, "Barbados", "BB", 13.1, -59.5, "Belarus", "BY", 53.7, 27.9, "Belgium", "BE", 50.5, 4.4, "Belize", "BZ", 17.1, -88.4, "Benin", "BJ", 9.3, 2.3, "Bermuda", "BM", 32.3, -64.7, "Bhutan", "BT", 27.5, 90.4, "Bolivia", "BO", -16.2, -63.5, "Bosnia and Herzegovina", "BA", 43.9, 17.6, "Botswana", "BW", -22.3, 24.6, "Bouvet Island", "BV", -54.4, 3.4, "Brazil", "BR", -14.2, -51.9, "British Indian Ocean Territory", "IO", -6.3, 71.8, "British Virgin Islands", "VG", 18.4, -64.6, "Brunei", "BN", 4.5, 114.7, "Bulgaria", "BG", 42.7, 25.4, "Burkina Faso", "BF", 12.2, -1.5, "Burundi", "BI", -3.3, 29.9, "Cambodia", "KH", 12.5, 104.9, "Cameroon", "CM", 7.3, 12.3, "Canada", "CA", 56.1, -106.3, "Cape Verde", "CV", 16, -24, "Cayman Islands", "KY", 19.5, -80.5, "Central African Republic", "CF", 6.6, 20.9, "Chad", "TD", 15.4, 18.7, "Chile", "CL", -35.6, -71.5, "China", "CN", 35.8, 104.1, "Christmas Island", "CX", -10.4, 105.6, "Colombia", "CO", 4.5, -74.2, "Comoros", "KM", -11.8, 43.8, "Congo [DRC]", "CD", -4, 21.7, "Congo [Republic]", "CG", -.2, 15.8, "Cook Islands", "CK", -21.2, -159.7, "Costa Rica", "CR", 9.7, -83.7, "Croatia", "HR", 45.1, 15.2, "Cuba", "CU", 21.5, -77.7, "Cyprus", "CY", 35.1, 33.4, "Czech Republic", "CZ", 49.8, 15.4, "Côte d'Ivoire", "CI", 7.5, -5.5, "Denmark", "DK", 56.2, 9.5, "Djibouti", "DJ", 11.8, 42.5, "Dominica", "DM", 15.4, -61.3, "Dominican Republic", "DO", 18.7, -70.1, "Ecuador", "EC", -1.8, -78.1, "Egypt", "EG", 26.8, 30.8, "El Salvador", "SV", 13.7, -88.8, "England", "ENG", 55.3, -3.4, "Equatorial Guinea", "GQ", 1.6, 10.2, "Eritrea", "ER", 15.1, 39.7, "Estonia", "EE", 58.5, 25, "Ethiopia", "ET", 9.1, 40.4, "Faroe Islands", "FO", 61.8, -6.9, "Fiji", "FJ", -16.5, 179.4, "Finland", "FI", 61.9, 25.7, "France", "FR", 46.2, 2.2, "French Guiana", "GF", 3.9, -53.1, "French Polynesia", "PF", -17.6, -149.4, "Gabon", "GA", -.8, 11.6, "Gambia", "GM", 13.4, -15.3, "Georgia", "GE", 42.3, 43.3, "Germany", "DE", 51.1, 10.4, "Ghana", "GH", 7.9, -1, "Gibraltar", "GI", 36.1, -5.3, "Greece", "GR", 39, 21.8, "Greenland", "GL", 71.7, -42.6, "Grenada", "GD", 12.2, -61.6, "Guadeloupe", "GP", 16.9, -62, "Guam", "GU", 13.4, 144.7, "Guatemala", "GT", 15.7, -90.2, "Guinea", "GN", 9.9, -9.6, "Guinea-Bissau", "GW", 11.8, -15.1, "Guyana", "GY", 4.8, -58.9, "Haiti", "HT", 18.9, -72.2, "Honduras", "HN", 15.1, -86.2, "Hong Kong", "HK", 22.3, 114.1, "Hungary", "HU", 47.1, 19.5, "Iceland", "IS", 64.9, -19, "India", "IN", 20.5, 78.9, "Indonesia", "ID", -.7, 113.9, "Iran", "IR", 32.4, 53.6, "Iraq", "IQ", 33.2, 43.6, "Ireland", "IE", 53.4, -8.2, "Israel", "IL", 31, 34.8, "Italy", "IT", 41.8, 12.5, "Jamaica", "JM", 18.1, -77.2, "Japan", "JP", 36.2, 138.2, "Jordan", "JO", 30.5, 36.2, "Kazakhstan", "KZ", 48, 66.9, "Kenya", "KE", -0, 37.9, "Kiribati", "KI", -3.3, -168.7, "Kosovo", "XK", 42.6, 20.9, "Kuwait", "KW", 29.3, 47.4, "Kyrgyzstan", "KG", 41.2, 74.7, "Laos", "LA", 19.8, 102.4, "Latvia", "LV", 56.8, 24.6, "Lebanon", "LB", 33.8, 35.8, "Lesotho", "LS", -29.6, 28.2, "Liberia", "LR", 6.4, -9.4, "Libya", "LY", 26.3, 17.2, "Liechtenstein", "LI", 47.1, 9.5, "Lithuania", "LT", 55.1, 23.8, "Luxembourg", "LU", 49.8, 6.1, "Macau", "MO", 22.1, 113.5, "Macedonia [FYROM]", "MK", 41.6, 21.7, "Madagascar", "MG", -18.7, 46.8, "Malawi", "MW", -13.2, 34.3, "Malaysia", "MY", 4.2, 101.9, "Maldives", "MV", 3.2, 73.2, "Mali", "ML", 17.5, -3.9, "Malta", "MT", 35.9, 14.3, "Marshall Islands", "MH", 7.1, 171.1, "Martinique", "MQ", 14.6, -61, "Mauritania", "MR", 21, -10.9, "Mauritius", "MU", -20.3, 57.5, "Mayotte", "YT", -12.8, 45.1, "Mexico", "MX", 23.6, -102.5, "Micronesia", "FM", 7.4, 150.5, "Moldova", "MD", 47.4, 28.3, "Monaco", "MC", 43.7, 7.4, "Mongolia", "MN", 46.8, 103.8, "Montenegro", "ME", 42.7, 19.3, "Montserrat", "MS", 16.7, -62.1, "Morocco", "MA", 31.7, -7, "Mozambique", "MZ", -18.6, 35.5, "Myanmar [Burma]", "MM", 21.9, 95.9, "Namibia", "NA", -22.9, 18.4, "Nauru", "NR", -.5, 166.9, "Nepal", "NP", 28.3, 84.1, "Netherlands", "NL", 52.1, 5.2, "Netherlands Antilles", "AN", 12.2, -69, "New Caledonia", "NC", -20.9, 165.6, "New Zealand", "NZ", -40.9, 174.8, "Nicaragua", "NI", 12.8, -85.2, "Niger", "NE", 17.6, 8, "Nigeria", "NG", 9, 8.6, "Niue", "NU", -19, -169.8, "Norfolk Island", "NF", -29, 167.9, "North Korea", "KP", 40.3, 127.5, "Northern Mariana Islands", "MP", 17.3, 145.3, "Norway", "NO", 60.4, 8.4, "Oman", "OM", 21.5, 55.9, "Pakistan", "PK", 30.3, 69.3, "Palau", "PW", 7.5, 134.5, "Palestinian Territories", "PS", 31.9, 35.2, "Panama", "PA", 8.5, -80.7, "Papua New Guinea", "PG", -6.3, 143.9, "Paraguay", "PY", -23.4, -58.4, "Peru", "PE", -9.1, -75, "Philippines", "PH", 12.8, 121.7, "Pitcairn Islands", "PN", -24.7, -127.4, "Poland", "PL", 51.9, 19.1, "Portugal", "PT", 39.3, -8.2, "Puerto Rico", "PR", 18.2, -66.5, "Qatar", "QA", 25.3, 51.1, "Romania", "RO", 45.9, 24.9, "Russia", "RU", 61.5, 105.3, "Rwanda", "RW", -1.9, 29.8, "Réunion", "RE", -21.1, 55.5, "Saint Helena", "SH", -24.1, -10, "Saint Kitts", "KN", 17.3, -62.7, "Saint Lucia", "LC", 13.9, -60.9, "Saint Pierre", "PM", 46.9, -56.2, "Saint Vincent", "VC", 12.9, -61.2, "Samoa", "WS", -13.7, -172.1, "San Marino", "SM", 43.9, 12.4, "Saudi Arabia", "SA", 23.8, 45, "Scotland", "SCT", 56.5, 4.2, "Senegal", "SN", 14.4, -14.4, "Serbia", "RS", 44, 21, "Seychelles", "SC", -4.6, 55.4, "Sierra Leone", "SL", 8.4, -11.7, "Singapore", "SG", 1.3, 103.8, "Slovakia", "SK", 48.6, 19.6, "Slovenia", "SI", 46.1, 14.9, "Solomon Islands", "SB", -9.6, 160.1, "Somalia", "SO", 5.1, 46.1, "South Africa", "ZA", -30.5, 22.9, "South Georgia", "GS", -54.4, -36.5, "South Korea", "KR", 35.9, 127.7, "Spain", "ES", 40.4, -3.7, "Sri Lanka", "LK", 7.8, 80.7, "Sudan", "SD", 12.8, 30.2, "Suriname", "SR", 3.9, -56, "Svalbard and Jan Mayen", "SJ", 77.5, 23.6, "Swaziland", "SZ", -26.5, 31.4, "Sweden", "SE", 60.1, 18.6, "Switzerland", "CH", 46.8, 8.2, "Syria", "SY", 34.8, 38.9, "São Tomé and Príncipe", "ST", .1, 6.6, "Taiwan", "TW", 23.6, 120.9, "Tajikistan", "TJ", 38.8, 71.2, "Tanzania", "TZ", -6.3, 34.8, "Thailand", "TH", 15.8, 100.9, "Timor-Leste", "TL", -8.8, 125.7, "Togo", "TG", 8.6, .8, "Tokelau", "TK", -8.9, -171.8, "Tonga", "TO", -21.1, -175.1, "Trinidad and Tobago", "TT", 10.6, -61.2, "Tunisia", "TN", 33.8, 9.5, "Turkey", "TR", 38.9, 35.2, "Turkmenistan", "TM", 38.9, 59.5, "Turks and Caicos Islands", "TC", 21.6, -71.7, "Tuvalu", "TV", -7.1, 177.6, "U.S. Minor Outlying Islands", "UM", 0, 0, "U.S. Virgin Islands", "VI", 18.3, -64.8, "Uganda", "UG", 1.3, 32.2, "Ukraine", "UA", 48.3, 31.1, "United Arab Emirates", "AE", 23.4, 53.8, "United Kingdom", "GB", 55.3, -3.4, "United States", "US", 37, -95.7, "Uruguay", "UY", -32.5, -55.7, "Uzbekistan", "UZ", 41.3, 64.5, "Vanuatu", "VU", -15.3, 166.9, "Vatican City", "VA", 41.9, 12.4, "Venezuela", "VE", 6.4, -66.5, "Vietnam", "VN", 14, 108.2, "Wales", "WLS", 55.3, -3.4, "Wallis and Futuna", "WF", -13.7, -177.1, "Western Sahara", "EH", 24.2, -12.8, "Yemen", "YE", 15.5, 48.5, "Zambia", "ZM", -13.1, 27.8, "Zimbabwe", "ZW", -19, 29.1];
    m.Js = "wss://p2p.haxball.com/";
    m.Se = "https://www.haxball.com/rs/";
    m.kg = [{
        urls: "stun:stun.l.google.com:19302"
    }];
    m.j = new lc;
    aa.vl = function () {
        let a = [];
        {
            let b = 0;
            for (; 256 > b;)
                ++b,
                    a.push(new P(0, 0))
        }
        return a
    }(this);
    aa.zk = function () {
        let a = [];
        {
            let b = 0;
            for (; 256 > b;)
                ++b,
                    a.push(0)
        }
        return a
    }(this);
    q.ss = A.ka(1024);
    Ra.Aa = p.Ha({
        Ca: !1,
        delay: !1,
        nh: {
            bh: 2,
            sh: 1E4
        }
    });
    Jb.Aa = p.Ha({
        Ca: !1,
        delay: !1,
        nh: {
            bh: 10,
            sh: 900
        }
    });
    eb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Aa.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Qa.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Ma.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    fa.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Oa.Aa = p.Ha({
        Ca: !1,
        delay: !1,
        nh: {
            bh: 10,
            sh: 2E3
        },
        Dn: function (a, b) {
            a = b.ma(a);
            return null != a ? a.cb : !1
        }
    });
    Za.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Pa.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Ha.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Lb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    db.Aa = p.Ha({});
    ab.Aa = p.Ha({
        Ca: !1,
        delay: !1,
        nh: {
            bh: 10,
            sh: 900
        }
    });
    Ja.Aa = p.Ha({});
    Na.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    na.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Kb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Mb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    La.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    bb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    cb.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    Ga.Aa = p.Ha({
        Ca: !1,
        delay: !1
    });
    I.Qn = .17435839227423353;
    I.Pn = 5.934119456780721;
    da.Nn = new Tb([0, 0, 2, 1, 0, .35, 1, 0, 1, 0, .7, 1, 0, 0, 0, 1]);
    da.On = new Tb([0, -1, 3, 0, 0, .35, 0, 0, 0, 0, .65, 0, 0, 1, 3, 1]);
    vb.O = "<div class='dialog change-location-view'><h1>Change Location</h1><div class='splitter'><div class='list' data-hook='list'></div><div class='buttons'><button data-hook='change'>Change</button><button data-hook='cancel'>Cancel</button></div></div></div>";
    Xa.O = "<div class='chatbox-view'><div class='chatbox-view-contents'><div data-hook='drag' class='drag'></div><div data-hook='log' class='log subtle-thin-scrollbar'><div data-hook='log-contents' class='log-contents'><p>Controls:<br/>Move: WASD or Arrows<br/>Kick: X, Space, Ctrl, Shift, Numpad 0<br/>View: Numbers 1 to 4</p></div></div><div class='autocompletebox' data-hook='autocompletebox'></div><div class='input'><input data-hook='input' type='text' /></div></div></div>";
    xb.O = "<div class='choose-nickname-view'><img src=\"images/haxball.png\" /><div class='dialog'><h1>Choose nickname</h1><div class='label-input'><label>Nick:</label><input data-hook='input' type='text' /></div><button data-hook='ok'>Ok</button></div></div>";
    yb.O = "<div class='connecting-view'><div class='dialog'><h1>Connecting</h1><div class='connecting-view-log' data-hook='log'></div><button data-hook='cancel'>Cancel</button></div></div>";
    pb.O = "<div class='create-room-view'><div class='dialog'><h1>Create room</h1><div class='label-input'><label>Room name:</label><input data-hook='name' required /></div><div class='label-input'><label>Password:</label><input data-hook='pass' /></div><div class='label-input'><label>Max players:</label><select data-hook='max-pl'></select></div><button data-hook='unlisted'></button><div class='row'><button data-hook='cancel'>Cancel</button><button data-hook='create'>Create</button></div></div></div>";
    Ua.O = "<div class='disconnected-view'><div class='dialog basic-dialog'><h1>Disconnected</h1><p data-hook='reason'></p><div class='buttons'><button data-hook='ok'>Ok</button><button data-hook='replay'>Save replay</button></div></div></div>";
    hb.O = "<div class='game-state-view'><div class='bar-container'><div class='bar'><div class='scoreboard'><div class='teamicon red'></div><div class='score' data-hook='red-score'>0</div><div>-</div><div class='score' data-hook='blue-score'>0</div><div class='teamicon blue'></div></div><div class=\"fps-limit-fix\"></div><div data-hook='timer'></div></div></div><div class='canvas' data-hook='canvas'></div></div>";
    za.O = "<div class='game-view' tabindex='-1'><div class='gameplay-section' data-hook='gameplay'></div><div class='top-section' data-hook='top-section'></div><div class='bottom-section'><div data-hook='stats'></div><div data-hook='chatbox'></div><div class='bottom-spacer'></div></div><div class='buttons'><div class='sound-button-container' data-hook=\"sound\"><div class='sound-slider' data-hook='sound-slider'><div class='sound-slider-bar-bg' data-hook='sound-bar-bg'><div class='sound-slider-bar' data-hook='sound-bar'></div></div></div><button data-hook='sound-btn'><i class='icon-volume-up' data-hook='sound-icon'></i></button></div><button data-hook='menu'><i class='icon-menu'></i>Menu<span class='tooltip'>Toggle room menu [Escape]</span></button><button data-hook='settings'><i class='icon-cog'></i></button></div><div data-hook='popups'></div></div>";
    ub.O = "<div class='dialog kick-player-view'><h1 data-hook='title'></h1><div class=label-input><label>Reason: </label><input type='text' data-hook='reason' /></div><button data-hook='ban-btn'><i class='icon-block'></i>Ban from rejoining: <span data-hook='ban-text'></span></button><div class=\"row\"><button data-hook='close'>Cancel</button><button data-hook='kick'>Kick</button></div></div>";
    kb.O = "<div class='dialog basic-dialog leave-room-view'><h1>Leave room?</h1><p>Are you sure you want to leave the room?</p><div class='buttons'><button data-hook='cancel'>Cancel</button><button data-hook='leave'><i class='icon-logout'></i>Leave</button></div></div>";
    mb.O = "<div class='dialog pick-stadium-view'><h1>Pick a stadium</h1><div class='splitter'><div class='list' data-hook='list'></div><div class='buttons'><button data-hook='pick'>Pick</button><button data-hook='delete'>Delete</button><div class='file-btn'><label for='stadfile'>Load</label><input id='stadfile' type='file' accept='.hbs,.json,.json5' data-hook='file'/></div><button data-hook='export'>Export</button><div class='spacer'></div><button data-hook='cancel'>Cancel</button></div></div></div>";
    Eb.O = "<div class='dialog' style='min-width:200px'><h1 data-hook='name'></h1><button data-hook='admin'></button><button data-hook='kick'>Kick</button><button data-hook='close'>Close</button></div>";
    wb.O = "<div class='player-list-item'><div data-hook='flag' class='flagico'></div><div data-hook='name'></div><div data-hook='ping'></div></div>";
    Ba.O = "<div class='player-list-view'><div class='buttons'><button data-hook='join-btn'>Join</button><button data-hook='reset-btn' class='admin-only'></button></div><div class='list thin-scrollbar' data-hook='list'></div></div>";
    Fa.O = "<div class='replay-controls-view'><button data-hook='reset'><i class='icon-to-start'></i></button><button data-hook='play'><i data-hook='playicon'></i></button><div data-hook='spd'>1x</div><button data-hook='spddn'>-</button><button data-hook='spdup'>+</button><div data-hook='time'>00:00</div><div class='timebar' data-hook='timebar'><div class='barbg'><div class='bar' data-hook='progbar'></div></div><div class='timetooltip' data-hook='timetooltip'></div></div><button data-hook='leave'>Leave</button></div>";
    Bb.O = "<div class='dialog basic-dialog room-link-view'><h1>Room link</h1><p>Use this url to link others directly into this room.</p><input data-hook='link' readonly></input><div class='buttons'><button data-hook='close'>Close</button><button data-hook='copy'>Copy to clipboard</button></div></div>";
    Db.Ij = "<tr><td><span data-hook='tag'></span><span data-hook='name'></span></td><td data-hook='players'></td><td data-hook='pass'></td><td><div data-hook='flag' class='flagico'></div><span data-hook='distance'></span></td></tr>";
    Ya.Ij = "<div class='roomlist-view'><div class='notice' data-hook='notice' hidden><div data-hook='notice-contents'>Testing the notice.</div><div data-hook='notice-close'><i class='icon-cancel'></i></div></div><div class='dialog'><h1>Room list</h1><p>Tip: Join rooms near you to reduce lag.</p><div class='splitter'><div class='list'><table class='header'><colgroup><col><col><col><col></colgroup><thead><tr><td>Name</td><td>Players</td><td>Pass</td><td>Distance</td></tr></thead></table><div class='separator'></div><div class='content' data-hook='listscroll'><table><colgroup><col><col><col><col></colgroup><tbody data-hook='list'></tbody></table></div><div class='filters'><span class='bool' data-hook='fil-pass'>Show locked <i></i></span><span class='bool' data-hook='fil-full'>Show full <i></i></span><span class='bool' data-hook='fil-empty'>Show empty <i></i></span></div></div><div class='buttons'><button data-hook='refresh'><i class='icon-cw'></i><div>Refresh</div></button><button data-hook='join'><i class='icon-login'></i><div>Join Room</div></button><button data-hook='create'><i class='icon-plus'></i><div>Create Room</div></button><div class='spacer'></div><div class='file-btn'><label for='replayfile'><i class='icon-play'></i><div>Replays</div></label><input id='replayfile' type='file' accept='.hbr2' data-hook='replayfile'/></div><button data-hook='settings'><i class='icon-cog'></i><div>Settings</div></button><button data-hook='changenick'><i class='icon-cw'></i><div>Change Nick</div></button></div></div><p data-hook='count'></p></div></div>";
    rb.O = "<div class='room-password-view'><div class='dialog'><h1>Password required</h1><div class='label-input'><label>Password:</label><input data-hook='input' /></div><div class='buttons'><button data-hook='cancel'>Cancel</button><button data-hook='ok'>Ok</button></div></div></div>";
    ib.O = "<div class='room-view'><div class='container'><h1 data-hook='room-name'></h1><div class='header-btns'><button data-hook='rec-btn'><i class='icon-circle'></i>Rec</button><button data-hook='link-btn'><i class='icon-link'></i>Link</button><button data-hook='leave-btn'><i class='icon-logout'></i>Leave</button></div><div class='teams'><div class='tools admin-only'><button data-hook='auto-btn'>Auto</button><button data-hook='rand-btn'>Rand</button><button data-hook='lock-btn'>Lock</button><button data-hook='reset-all-btn'>Reset</button></div><div data-hook='red-list'></div><div data-hook='spec-list'></div><div data-hook='blue-list'></div><div class='spacer admin-only'></div></div><div class='settings'><div><label class='lbl'>Time limit</label><select data-hook='time-limit-sel'></select></div><div><label class='lbl'>Score limit</label><select data-hook='score-limit-sel'></select></div><div><label class='lbl'>Stadium</label><label class='val' data-hook='stadium-name'>testing the stadium name</label><button class='admin-only' data-hook='stadium-pick'>Pick</button></div></div><div class='controls admin-only'><button data-hook='start-btn'><i class='icon-play'></i>Start game</button><button data-hook='stop-btn'><i class='icon-stop'></i>Stop game</button><button data-hook='pause-btn'><i class='icon-pause'></i>Pause</button></div></div></div>";
    ma.O = '<div class=\'dialog settings-view\'><h1>Settings</h1><button data-hook=\'close\'>Close</button><div class=\'tabs\'><button data-hook=\'soundbtn\'>Sound</button><button data-hook=\'videobtn\'>Video</button><button data-hook=\'inputbtn\'>Input</button><button data-hook=\'miscbtn\'>Misc</button></div><div data-hook=\'presskey\' tabindex=\'-1\'><div>Press a key</div></div><div class=\'tabcontents\'><div class=\'section\' data-hook=\'miscsec\'><div class=\'loc\' data-hook=\'loc\'></div><div class=\'loc\' data-hook=\'loc-ovr\'></div><button data-hook=\'loc-ovr-btn\'></button></div><div class=\'section\' data-hook=\'soundsec\'><div data-hook="tsound-main">Sounds enabled</div><div data-hook="tsound-chat">Chat sound enabled</div><div data-hook="tsound-highlight">Nick highlight sound enabled</div><div data-hook="tsound-crowd">Crowd sound enabled</div></div><div class=\'section\' data-hook=\'inputsec\'></div><div class=\'section\' data-hook=\'videosec\'><div>Viewport Mode:<select data-hook=\'viewmode\'><option>Dynamic</option><option>Restricted 840x410</option><option>Full 1x Zoom</option><option>Full 1.25x Zoom</option><option>Full 1.5x Zoom</option><option>Full 1.75x Zoom</option><option>Full 2x Zoom</option><option>Full 2.25x Zoom</option><option>Full 2.5x Zoom</option></select></div><div>FPS Limit:<select data-hook=\'fps\'><option>None (Recommended)</option><option>30</option></select></div><div>Resolution Scaling:<select data-hook=\'resscale\'><option>100%</option><option>75%</option><option>50%</option><option>25%</option></select></div><div data-hook="tvideo-lowlatency">Use low latency canvas</div><div data-hook="tvideo-teamcol">Custom team colors enabled</div><div data-hook="tvideo-showindicators">Show chat indicators</div><div data-hook="tvideo-showavatars">Show player avatars</div><div class="option-row"><div style="margin-right: 10px; flex: 1; max-width: 115px;">Chat opacity </div><div style="width: 40px" data-hook="chatopacity-value">1</div><input class="slider" type="range" min="0.5" max="1" step="0.01" data-hook="chatopacity-range"></div><div class="option-row"><div style="margin-right: 10px; flex: 1; max-width: 115px;">Chat focus height </div><div style="width: 40px" data-hook="chatfocusheight-value">200</div><input class="slider" type="range" min="0" max="400" step="10" data-hook="chatfocusheight-range"></div><div>Chat background width:<select data-hook=\'chatbgmode\'><option>Full</option><option>Compact</option></select></div></div></div></div>';
    ma.zm = 0;
    ca.O = "<div class='simple-dialog-view'><div class='dialog basic-dialog'><h1 data-hook='title'></h1><p data-hook='content'></p><div class='buttons' data-hook='buttons'></div></div></div>";
    Fb.O = "<div class=\"stats-view-container\"><div class='stats-view'><p data-hook='ping'></p><p data-hook='fps'></p><div data-hook='graph'></div></div></div>";
    zb.O = '<div class=\'unsupported-browser-view\'><div class=\'dialog\'><h1>Unsupported Browser</h1><p>Sorry! Your browser doesn\'t yet implement some features which are required for HaxBall to work.</p><p>The missing features are: <span data-hook=\'features\'></span></p><h2>Recommended browsers:</h2><div><a href="https://www.mozilla.org/firefox/new/"><img src="images/firefox-icon.png"/>Firefox</a></div><div><a href="https://www.google.com/chrome/"><img src="images/chrome-icon.png"/>Chrome</a></div><div><a href="http://www.opera.com/"><img src="images/opera-icon.png"/>Opera</a></div></div></div>';
    B.$p()
}
)("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this);
