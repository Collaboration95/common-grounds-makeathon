// Authoritative thing checker (thing contract v2). Usage: node check-thing.mjs <dir containing thing.js>
// Prints {ok, errors[], warnings[], thing?} as JSON on stdout; exit 0 when ok, 1 otherwise.
// Codex runs a copy of this in its workspace; the server re-runs the repo copy.
// Standalone: no imports besides node: builtins. The walk map comes from public/scenes/voiddeck/scene.json when it can
// be found (repo checkout), else from the embedded copy below.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = process.argv[2] || ".";
const errors = [];
const fail = (m) => { if (errors.length < 8) errors.push(String(m).slice(0, 220)); };
let warnings = [];
const done = (thing) => {
  console.log(JSON.stringify({ ok: errors.length === 0, errors, ...(warnings.length ? { warnings } : {}), ...(thing ? { thing } : {}) }));
  process.exit(errors.length ? 1 : 0);
};

let src = "";
try { src = fs.readFileSync(path.join(dir, "thing.js"), "utf8"); } catch { fail("thing.js missing"); done(); }

// ---- 1. static checks ----
if (Buffer.byteLength(src) > 6144) fail("thing.js is over 6 KB");
if (!/^\s*export\s+default\b/m.test(src)) fail("thing.js must contain `export default { ... }`");
const BANNED = ["import", "require", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "setTimeout", "setInterval",
  "document", "window", "globalThis", "self", "eval", "Function", "localStorage", "sessionStorage", "indexedDB",
  "Math\\.random", "constructor", "__proto__", "process", "Reflect", "Proxy", "Worker", "postMessage", "WebAssembly",
  "location", "navigator", "async", "await", "Promise"];
for (const b of BANNED) if (new RegExp(`\\b${b}\\b`).test(src)) fail(`banned identifier: ${b.replace("\\.", ".")}`);
if (/while\s*\(\s*(true|1)\s*\)/.test(src) || /for\s*\(\s*;\s*;\s*\)/.test(src)) fail("unbounded loop (while(true) / for(;;)) is banned");
if (errors.length) done();

// ---- the room: public/scenes/voiddeck/scene.json (embedded copy as a fallback) ----
const EMBEDDED_SCENE = {
  id: "voiddeck", name: "HDB void deck at dusk", background: "/assets/background.png", width: 1600, height: 900,
  ceilingY: 250, air: { top: 260, bottom: 560 },
  floor: { backY: 600, frontY: 885, backX: [20, 1580], frontX: [10, 1590] }, depthScale: [0.6, 1.2],
  spots: [
    { id: "table-left", name: "stone table", kind: "table", x: 145, y: 594, tags: [] },
    { id: "stool-l1", name: "stool", kind: "seat", x: 250, y: 622, tags: [] },
    { id: "stool-l2", name: "stool", kind: "seat", x: 293, y: 645, tags: [] },
    { id: "stool-l3", name: "stool", kind: "seat", x: 60, y: 655, tags: [] },
    { id: "table-right", name: "stone table", kind: "table", x: 1195, y: 568, tags: [] },
    { id: "stool-r1", name: "stool", kind: "seat", x: 1100, y: 600, tags: [] },
    { id: "stool-r2", name: "stool", kind: "seat", x: 1298, y: 612, tags: [] },
    { id: "table-far", name: "stone table", kind: "table", x: 1555, y: 566, tags: [] },
    { id: "lamp-left", name: "wall lamp", kind: "perch", x: 115, y: 255, tags: ["warm", "light"] },
    { id: "lamp-mid", name: "wall lamp", kind: "perch", x: 392, y: 362, tags: ["warm", "light"] },
    { id: "lamp-right", name: "wall lamp", kind: "perch", x: 1372, y: 290, tags: ["warm", "light"] },
    { id: "tube-light", name: "ceiling light", kind: "perch", x: 815, y: 108, tags: ["warm", "light"] },
    { id: "lamp-post", name: "lamp post", kind: "perch", x: 1283, y: 378, tags: ["light"] },
  ],
};
function loadScene() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cands = [process.env.COMMONS_SCENE, path.join(here, "..", "public", "scenes", "voiddeck", "scene.json"),
    path.join(here, "..", "..", "..", "public", "scenes", "voiddeck", "scene.json")];
  for (const f of cands) {
    if (!f) continue;
    try {
      const s = JSON.parse(fs.readFileSync(f, "utf8"));
      if (s && s.floor && s.air && Array.isArray(s.spots)) return s;
    } catch { /* try the next one */ }
  }
  return EMBEDDED_SCENE;
}

// ---- 2. load + simulate inside a vm context ----
// Everything the thing can touch (me, world, helpers, Math) is created INSIDE the context, so no outer-realm object is
// reachable from thing code. The harness below is serialised into the context. It mirrors the engine (public/engine.js).
function harness(cfg) {
  const W = cfg.width, H = cfg.height, DT = 1 / 60;
  delete Math.random; Object.freeze(Math);
  const problems = [];
  const bad = (m) => { if (problems.indexOf(m) < 0 && problems.length < 6) problems.push(m); };
  const thing = __thing;
  const freeze = (o) => { Object.freeze(o); for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object" && !Object.isFrozen(o[k])) freeze(o[k]); return o; };
  const SC = freeze(JSON.parse(cfg.scene));
  const F = SC.floor;
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // proximity (nearest / nearby / onMeet / signal range) is between BODY centres, like the engine: a ground thing's is ~60px above its feet
  const body = (o) => (o.zone === "ground" ? { x: o.x, y: o.y - (o.z || 0) - 60 } : { x: o.x, y: o.y });
  const bdist = (a, b) => dist(a === me ? body(me) : a, body(b));
  const depthY = (y) => clamp((y - F.backY) / (F.frontY - F.backY), 0, 1);
  const airT = (y) => clamp((y - SC.air.top) / (SC.air.bottom - SC.air.top), 0, 1);
  const toFloor = (x, y) => {
    const yy = clamp(y, F.backY, F.frontY), k = depthY(yy);
    const l = lerp(F.backX[0], F.frontX[0], k), r = lerp(F.backX[1], F.frontX[1], k);
    return [clamp(x, l + 6, Math.max(l + 6, r - 6)), yy];
  };
  const ground = thing.zone === "ground";
  const midY = lerp(F.backY, F.frontY, 0.5);

  // ---- me ----
  const live = { time: 0, pointer: null, goal: null, goalTick: -9, tick: 0 };
  let spotId = null, soft = 0;
  const occ = {}; // spot id -> id of whoever sits there (dummies never do)
  const me = { x: 800, y: ground ? midY : lerp(SC.air.top, SC.air.bottom, 0.4), z: 0, vx: 0, vy: 0, vz: 0, angle: 0, scale: 1, flip: false, alpha: 1, anim: null, state: {} };
  const ro = (k, get) => Object.defineProperty(me, k, { get, set() {}, enumerable: true });
  ro("id", () => "me"); ro("name", () => String(thing.name)); ro("tags", () => Object.freeze(thing.tags.slice()));
  ro("zone", () => thing.zone); ro("size", () => thing.size); ro("spot", () => spotId);
  ro("depth", () => (ground ? depthY(me.y) : airT(me.y)));
  const stats = { y0: me.y, y1: me.y, spotUsed: false, signals: 0, meets: 0, gotSignals: 0, steered: false };
  me.say = function (text, seconds) {
    if (typeof text !== "string") return bad("say(text) needs a string");
    if (text.trim().split(/\s+/).length > 6) bad("say() text must be at most 6 words");
    if (seconds !== undefined && !Number.isFinite(seconds)) bad("say(text, seconds): seconds must be a number");
  };
  Object.defineProperty(me, "say", { writable: false });

  // ---- neighbours: they wander close so onMeet fires, and send signals ----
  const sigQ = [];
  const D = [
    { id: "n1", tags: ["cat", "warm"], zone: "ground", hat: null, orbit: 1.0, ph: 0 },
    { id: "n2", tags: ["hat", "food"], zone: "ground", hat: "crown", sweep: true, ph: 1 },
    { id: "n3", tags: ["bird", "spiky"], zone: "air", hat: null, orbit: 0.7, ph: 2 },
    { id: "n4", tags: ["light", "water"], zone: "ground", hat: null, fixed: [1420, 700], ph: 3 },
  ];
  const lastMeet = {};
  const dpos = (d, t) => {
    if (d.fixed) return [d.fixed[0], d.fixed[1]];
    if (d.sweep) { const p = toFloor(800 + 650 * Math.sin(0.31 * t + d.ph), midY + 110 * Math.sin(0.23 * t)); return [p[0], p[1]]; }
    const R = 40 + 150 * (1 + Math.sin(0.45 * t + d.ph)) / 2 + 40 * Math.abs(Math.sin(t)); // orbits me, dipping inside 110px now and then
    const x = clamp(me.x + R * Math.cos(d.orbit * t + d.ph), 40, W - 40);
    const y = d.zone === "air" ? clamp(me.y + R * Math.sin(d.orbit * t + d.ph) * 0.6, SC.air.top, SC.air.bottom) : toFloor(0, me.y + R * Math.sin(d.orbit * t + d.ph) * 0.6)[1];
    return [x, y];
  };
  let views = [];
  const mkViews = (t) => {
    views = D.map((d) => {
      const [x, y] = dpos(d, t), [x2, y2] = dpos(d, t + DT);
      return Object.freeze({ id: d.id, name: d.id, tags: Object.freeze(d.tags.slice()), zone: d.zone, x, y, z: 0, vx: (x2 - x) / DT, vy: (y2 - y) / DT, spot: null, hat: d.hat });
    });
  };
  me.signal = function (kind, toId) {
    if (typeof kind !== "string" || !kind.trim()) return bad("signal(kind, toId?): kind must be a non-empty string");
    if (kind.length > 16) return bad("signal kind must be at most 16 chars, got " + kind.length);
    if (toId !== undefined && toId !== null && typeof toId !== "string") return bad("signal(kind, toId): toId must be a thing id string");
    stats.signals++;
  };
  Object.defineProperty(me, "signal", { writable: false });

  // ---- world ----
  const KINDS = ["burst", "hearts", "zzz", "rain", "sparkle", "steam"];
  const spotView = (s) => Object.freeze({ id: s.id, name: s.name, kind: s.kind, x: s.x, y: s.y, tags: s.tags, occupant: occ[s.id] || null });
  const spotRef = (r) => { const id = r && typeof r === "object" ? r.id : r; return SC.spots.find((s) => s.id === id) || null; };
  const leave = () => { if (!spotId) return; delete occ[spotId]; spotId = null; soft = 320; if (ground && me.z <= 0.5) me.vz = 220; };
  const steer = (m, target, speed) => {
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) { bad("steer(me, {x, y}, speed) needs a target with finite x and y"); return Infinity; }
    if (typeof speed !== "number" || !Number.isFinite(speed)) bad("steer(me, target, speed): speed must be a finite number");
    speed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
    stats.steered = true;
    const dx = target.x - me.x, dy = target.y - me.y, d = Math.hypot(dx, dy);
    if (spotId && speed > 0 && d > 4) leave();
    if (spotId) return d;
    if (d < 1e-3 || speed <= 0) { me.vx = 0; me.vy = 0; return d; }
    const sp = Math.min(speed, d / DT);
    me.vx = (dx / d) * sp; me.vy = (dy / d) * sp;
    return d;
  };
  const goTo = (m, ref, speed) => {
    const sp = spotRef(ref);
    if (!sp) { bad("goTo(me, spot, speed): unknown spot " + String(ref && typeof ref === "object" ? ref.id : ref)); return false; }
    if (spotId === sp.id) return true;
    if (ground && sp.kind === "perch") return false;
    speed = Number.isFinite(speed) && speed > 0 ? Math.min(speed, 1200) : 120;
    if (spotId) leave();
    const [fx, fy] = ground ? toFloor(sp.x, sp.y) : [sp.x, sp.y];
    if (ground && me.z > 6) { me.vx = 0; me.vy = 0; return false; }
    live.goal = sp.y; live.goalTick = live.tick;
    const d = steer(me, { x: fx, y: fy }, speed);
    if (d <= Math.max(speed * DT * 1.05, 4)) {
      spotId = sp.id; occ[sp.id] = "me"; stats.spotUsed = true; soft = 0;
      me.x = sp.x; me.y = sp.y; me.z = 0; me.vx = 0; me.vy = 0; me.vz = 0;
      return true;
    }
    return false;
  };
  const world = Object.freeze({
    get time() { return live.time; }, get pointer() { return live.pointer; },
    width: W, height: H, groundY: F.frontY, scene: SC, random: rnd, dist,
    nearest(m, tag) {
      let best = null, bd = Infinity;
      for (const o of views) if ((!tag || o.tags.indexOf(tag) >= 0) && bdist(m, o) < bd) { best = o; bd = bdist(m, o); }
      return best;
    },
    nearby(m, radius) {
      const r = typeof radius === "number" && Number.isFinite(radius) ? radius : 200;
      return views.map((o) => [bdist(m, o), o]).filter((e) => e[0] <= r).sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    },
    things(tag) { return views.filter((o) => !tag || o.tags.indexOf(tag) >= 0); },
    spots(kind) { return SC.spots.filter((s) => !kind || s.kind === kind).map(spotView); },
    steer, goTo, leave,
    fx(kind, x, y) {
      if (KINDS.indexOf(kind) < 0) bad("fx kind must be one of " + KINDS.join("|") + ", got " + String(kind));
      if (!Number.isFinite(x) || !Number.isFinite(y)) bad("fx(kind, x, y) needs finite x and y");
    },
  });

  const NUM = ["x", "y", "z", "vx", "vy", "vz", "angle", "scale", "alpha"];
  const ANIMS = ["walk", "fly", "idle", "sit", "sleep", "action"];
  const finite = (when) => { if (me.anim != null && !ANIMS.includes(me.anim)) bad("me.anim must be null or one of " + ANIMS.join("|") + ", got " + String(me.anim)); for (const k of NUM) if (typeof me[k] !== "number" || !Number.isFinite(me[k])) { bad("me." + k + " is " + String(me[k]) + " " + when); return false; } return true; };
  const physics = () => { // mirrors the engine, applied after each update
    me.scale = clamp(me.scale, 0.1, 4);
    if (spotId) { const s = SC.spots.find((q) => q.id === spotId); me.x = s.x; me.y = s.y; me.z = 0; me.vx = me.vy = me.vz = 0; return; }
    if (ground) { me.vz -= 1400 * DT; me.z += me.vz * DT; if (me.z <= 0) { me.z = 0; if (me.vz < 0) me.vz = 0; } } else { me.z = 0; me.vz = 0; }
    me.x += me.vx * DT; me.y += me.vy * DT;
    let tx, ty;
    if (ground) [tx, ty] = toFloor(me.x, me.y);
    else {
      let lo = SC.air.top, hi = SC.air.bottom;
      if (live.goalTick >= live.tick - 1 && live.goal !== null) { lo = Math.min(lo, live.goal); hi = Math.max(hi, live.goal); }
      tx = clamp(me.x, 30, W - 30); ty = clamp(me.y, lo, hi);
    }
    if (soft > 0) {
      const dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), st = soft * DT;
      if (d <= st) { me.x = tx; me.y = ty; soft = 0; } else { me.x += (dx / d) * st; me.y += (dy / d) * st; }
    } else {
      if (tx !== me.x) { if ((tx > me.x && me.vx < 0) || (tx < me.x && me.vx > 0)) me.vx = 0; me.x = tx; }
      if (ty !== me.y) { if ((ty > me.y && me.vy < 0) || (ty < me.y && me.vy > 0)) me.vy = 0; me.y = ty; }
    }
  };
  const safe = (label, fn) => { try { fn(); return true; } catch (e) { bad(label + " threw: " + String(e && e.message)); return false; } };
  let i = 0;
  globalThis.__init = () => { if (typeof thing.init === "function") { safe("init", () => thing.init(me, world)); finite("after init"); if (ground) { const p = toFloor(me.x, me.y); me.x = p[0]; me.y = p[1]; } } };
  globalThis.__tick = () => {
    const t = i / 60, s = Math.floor(t) % 10;
    live.time = t; live.tick = i;
    live.pointer = s === 5 ? { x: 1450, y: 300 } : s !== 3 ? null : { x: me.x + 200 * Math.sin(t * 1.3), y: me.y - 40 + 80 * Math.sin(t * 0.7) };
    mkViews(t);
    // signals sent by neighbours arrive on the next tick; every ~2s one of them waves at us
    if (typeof thing.onSignal === "function") {
      while (sigQ.length) {
        const sg = sigQ.shift();
        stats.gotSignals++;
        safe("onSignal", () => thing.onSignal(me, world, Object.freeze({ from: sg.from, fromId: sg.from.id, kind: sg.kind })));
        finite("after onSignal");
      }
    } else sigQ.length = 0;
    if (i % 120 === 60) {
      const from = views[(i / 120) % views.length | 0];
      if (i % 240 === 60 || bdist(me, from) <= 200) sigQ.push({ from, kind: i % 240 === 60 ? "tease" : "hello" }); // direct, or broadcast within 200px
    }
    if (typeof thing.onMeet === "function") {
      for (const v of views) {
        if (bdist(me, v) > 110 || t - (lastMeet[v.id] === undefined ? -99 : lastMeet[v.id]) < 5) continue;
        lastMeet[v.id] = t; stats.meets++;
        safe("onMeet", () => thing.onMeet(me, world, v));
        finite("after onMeet");
      }
    }
    safe("update", () => thing.update(me, world, DT));
    finite("after update"); physics();
    if (me.y < stats.y0) stats.y0 = me.y;
    if (me.y > stats.y1) stats.y1 = me.y;
    i++;
  };
  globalThis.__poke = () => {
    if (typeof thing.onPoke === "function") { safe("onPoke", () => thing.onPoke(me, world)); finite("after onPoke"); }
  };
  globalThis.__end = () => {
    try { JSON.stringify(me.state); } catch (e) { bad("me.state must be plain JSON"); }
    const warn = [];
    if (stats.y1 - stats.y0 < 40) warn.push("it never moved in depth (me.y changed by " + Math.round(stats.y1 - stats.y0) + "px in 60s): use world.steer / me.vy so it walks or flies around the room, not just left and right");
    if (!stats.spotUsed) warn.push("it never occupied a spot: use world.spots(kind) + world.goTo(me, spot, speed) (seat/table/rest for walkers, perch for fliers) and world.leave(me)");
    if (typeof thing.onMeet !== "function" && typeof thing.onSignal !== "function" && !/\b(nearby|nearest|things)\b/.test(cfg.src)) warn.push("it ignores other things: add onMeet / onSignal or look at world.nearby / world.nearest");
    return JSON.stringify({ problems, warn });
  };
  globalThis.__meta = () => JSON.stringify({ name: thing.name, tags: thing.tags, zone: thing.zone, size: thing.size });
}

const ctx = vm.createContext({}, { codeGeneration: { strings: false, wasm: false }, microtaskMode: "afterEvaluate" });
const run = (code, timeout = 50) => new vm.Script(code).runInContext(ctx, { timeout });
const timedOut = (e) => /timed out/i.test(String(e && e.message));

let meta;
try {
  // `export default X` becomes `var __thing = X`, so a preamble of helpers still works.
  run('"use strict";\n' + src.replace(/^\s*export\s+default\b/m, "var __thing ="), 200);
} catch (e) { fail("load: " + (timedOut(e) ? "took too long to load (infinite loop?)" : e && e.message)); done(); }

// shape
try {
  const shape = JSON.parse(run(`(() => { const t = __thing; if (!t || typeof t !== "object") return JSON.stringify({bad:"export default must be an object"});
    const bad = [];
    if (typeof t.name !== "string" || !t.name || t.name.length > 24) bad.push("name must be a non-empty string of at most 24 chars");
    if (!Array.isArray(t.tags) || t.tags.length > 4 || t.tags.some((x) => typeof x !== "string" || !/^[a-z]+$/.test(x))) bad.push("tags must be an array of at most 4 lowercase words (a-z only)");
    if (t.zone !== "ground" && t.zone !== "air") bad.push('zone must be "ground" or "air"');
    if (t.size !== 1 && t.size !== 2) bad.push("size must be 1 or 2");
    if (typeof t.update !== "function") bad.push("update(me, world, dt) must be a function");
    for (const k of ["init", "onPoke", "onMeet", "onSignal"]) if (t[k] !== undefined && typeof t[k] !== "function") bad.push(k + " must be a function");
    return JSON.stringify({bad: bad.join("; ")}); })()`));
  if (shape.bad) for (const m of shape.bad.split("; ")) fail(m);
} catch (e) { fail("shape: " + e.message); }
if (errors.length) done();

try {
  run(`(${harness.toString()})(${JSON.stringify({ width: 1600, height: 900, scene: JSON.stringify(loadScene()), src })}); 0`);
  meta = JSON.parse(run("__meta()"));
  const call = (name) => { const s = new vm.Script(`${name}()`); return () => s.runInContext(ctx, { timeout: 50 }); };
  const initS = call("__init"), tickS = call("__tick"), pokeS = call("__poke");
  const step = (fn, what) => { try { fn(); return true; } catch (e) { fail(what + (timedOut(e) ? " took over 50 ms (infinite or very slow loop?)" : " failed: " + (e && e.message))); return false; } };
  let ok = step(initS, "init");
  let total = 0;
  const TICKS = 3600; // 60 s of room time
  const POKES = new Set([150, 300, 450, 900, 1500, 2400]);
  for (let i = 0; ok && i < TICKS; i++) {
    const t0 = performance.now();
    ok = step(tickS, "update");
    total += performance.now() - t0;
    if (ok && POKES.has(i)) ok = step(pokeS, "onPoke");
  }
  if (ok && total / TICKS > 1) fail(`update is too slow: ${(total / TICKS).toFixed(2)} ms on average (limit 1 ms)`);
  const end = JSON.parse(run("__end()", 200));
  for (const m of end.problems) fail(m);
  if (ok) warnings = end.warn;
} catch (e) { fail("sim: " + (e && e.message)); }
done(meta);
