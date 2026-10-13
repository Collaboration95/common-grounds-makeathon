// Wish lifecycle: screening -> queued -> coding -> testing -> live (or declined / failed / vetoed).
// The sprite sheet and the Codex build start the moment a wish arrives, alongside the screening (EARLY_START=0 waits
// for the screen instead); a decline stops both. Codex builds run CONCURRENCY at a time. Each pet gets a run-log line.
import fs from "node:fs";
import path from "node:path";
import * as store from "./store.mjs";
import * as runlog from "./runlog.mjs";
import { screen, MODEL as SCREEN_MODEL, EFFORT as SCREEN_EFFORT } from "./screen.mjs";
import { drawSprite, drawPatch } from "./image.mjs";
import { buildThing, MODEL as BUILD_MODEL, EFFORT as BUILD_EFFORT } from "./codex.mjs";
import * as presets from "./presets.mjs";
import { animateThing, makeFrames } from "./animate.mjs";
import { execFile } from "node:child_process";

const CONCURRENCY = Number(process.env.CONCURRENCY) || 3;
const EARLY = process.env.EARLY_START !== "0";
const MAX_PENDING = 40; // flood guard
const FAILED = "Codex couldn't build that one.";

const waiting = []; // wish ids waiting for a Codex slot, FIFO
const runs = new Map(); // id -> { abort, screened, building, testing, codeOk, sheetDone, patchDone, queuedAt }
let active = 0;

const run = (id) => {
  if (!runs.has(id)) runs.set(id, { abort: new AbortController(), screened: false, building: false, testing: false, codeOk: false, sheetDone: false, patchDone: false, queuedAt: Date.now() });
  return runs.get(id);
};
const gone = (w) => w.status === "vetoed";
const settled = (w) => ["live", "declined", "failed", "vetoed"].includes(w.status);
const pending = () => store.all().filter((w) => ["screening", "queued", "coding", "testing"].includes(w.status)).length;

export function submit({ text, name, deviceId, hat = null }, { admin = false } = {}) {
  if (!admin && pending() >= MAX_PENDING) return null;
  const w = store.addWish({ text, name, deviceId, hat });
  runlog.start(w.id, { early: EARLY });
  store.log(w, `#${w.n} ${name}: "${text}"`);
  intake(w);
  return w;
}

/** A preset character goes live immediately (thing.js + sprite.png copied in), then the cap is enforced. */
export function place({ presetId, hat = null, name, deviceId }) {
  const c = presets.getCharacter(presetId);
  if (!c) return null;
  const id = store.newId(), dir = store.thingDir(id);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ["thing.js", "sprite.png"]) fs.copyFileSync(path.join(c.dir, f), path.join(dir, f));
  const anim = ["frames.png", "anim.json"].every((f) => fs.existsSync(path.join(c.dir, f)));
  if (anim) for (const f of ["frames.png", "anim.json"]) fs.copyFileSync(path.join(c.dir, f), path.join(dir, f));
  const w = store.addWish({
    id, text: c.text, name, deviceId, hat, kind: "preset",
    status: "live", acceptedAt: Date.now(), sprite: "done", anim, animAt: Date.now(),
    thing: { name: c.name, tags: c.tags, zone: c.zone, size: c.size, oneLine: c.oneLine },
  });
  store.log(w, `#${w.n} ${name} picked ${c.name}${hat ? ` with a ${hat} hat` : ""}`);
  runlog.finish(w, { preset: presetId });
  store.enforceCap();
  return w;
}

const titleName = (text) => {
  const words = text.replace(/^(an?|the|my)\s+/i, "").replace(/[^\p{L}\p{N} '-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 4);
  while (words.join(" ").length > 24 && words.length > 1) words.pop();
  return (words.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(" ").slice(0, 24).trim()) || "Sketchy Friend";
};

/** "Sketch one": screen the line, gpt-6-luna draws the unified sheet, the generic behaviour goes live. No Codex code-writing. */
export function sketch({ text, name, deviceId, hat = null }) {
  if (pending() >= MAX_PENDING) return null;
  const w = store.addWish({ text, name, deviceId, hat, kind: "sketch", status: "coding", sprite: "drawing" });
  runlog.start(w.id, { early: EARLY });
  store.log(w, `#${w.n} ${name}: "${text}" (sketch)`);
  sketchRun(w).catch((e) => { console.error("sketch crashed", e); });
  return w;
}

async function sketchRun(w) {
  const t0 = Date.now(), rs = run(w.id);
  const fail = (why) => { store.update(w, { status: "failed", sprite: "failed", reason: "The sketch didn't come out. Try another line!" }); store.log(w, `#${w.n} sketch failed: ${String(why).slice(0, 80)}`); runlog.finish(w); };
  store.log(w, `#${w.n} checking the line…`);
  const drawing = EARLY ? codexSprite(w, w.text, rs.abort.signal) : null; // the drawing starts while the screen runs
  const r = await screen(w.text);
  if (gone(w)) return;
  runlog.note(w.id, { screen: screenNote(r, Date.now() - t0) });
  if (!r.allowed) {
    rs.abort.abort();
    store.update(w, { status: "declined", reason: r.userMessage, queuePos: null, sprite: "failed" });
    store.log(w, `#${w.n} declined`);
    runlog.finish(w);
    return;
  }
  store.log(w, `#${w.n} sketching with gpt-6-luna…`);
  const ok = await (drawing || codexSprite(w, r.spritePrompt || w.text, rs.abort.signal));
  if (gone(w)) return;
  if (!ok) return fail("no sprite sheet");
  store.log(w, `#${w.n} sprite sheet ready (12 frames)`);
  const dir = store.thingDir(w.id), nm = titleName(w.text);
  fs.writeFileSync(path.join(dir, "thing.js"), fs.readFileSync(path.join(store.ROOT, "template", "generic", "thing.js"), "utf8").replace("NAME_HERE", nm));
  const ms = Date.now() - t0;
  store.update(w, { sprite: "done", thing: { name: nm, tags: ["critter", "friend"], zone: "ground", size: 1, oneLine: w.text }, stats: { buildMs: ms, turns: 0, checkRuns: 0, checkFails: 0 }, status: "live", acceptedAt: Date.now(), queuePos: null });
  store.log(w, `#${w.n} LIVE: ${nm} (sketched by gpt-6-luna in ${(ms / 1000).toFixed(0)}s)`);
  runlog.finish(w);
  store.enforceCap();
}

/** Stop everything still running for a wish: its Codex build, its drawing, its place in the queue. */
function stop(id) {
  runs.get(id)?.abort.abort();
  const i = waiting.indexOf(id);
  if (i >= 0) { waiting.splice(i, 1); refreshPositions(); }
}

export function veto(id) {
  const w = store.get(id), running = runlog.isOpen(id);
  if (!w || !store.veto(id)) return;
  stop(id);
  store.log(w, `#${w.n} vetoed`);
  if (running) runlog.finish(w);
}

/** After a restart, pick up anything that was in flight. */
export function resume() {
  for (const w of store.all()) {
    if (!["screening", "queued", "coding", "testing"].includes(w.status)) continue;
    if (w.kind === "sketch") { store.update(w, { status: "failed", sprite: "failed", reason: "The server restarted mid-sketch. Try again!" }); continue; }
    store.log(w, `#${w.n} resuming after restart`);
    runlog.start(w.id, { resumed: true });
    if (store.getPrivate(w.id).spritePrompt) { screened(w); start(w); }
    else intake(w);
  }
}

const screenNote = (r, ms) => ({ ms, model: SCREEN_MODEL, effort: SCREEN_EFFORT, allowed: r.allowed, fallback: !!r.fallback, spritePrompt: r.spritePrompt, thingSummary: r.thingSummary, bleed: r.bleed?.label || null });

async function intake(w) {
  store.log(w, `#${w.n} checking the wish…`);
  if (EARLY) start(w); // drawing and coding start on the visitor's own words while the screen runs
  const t0 = Date.now();
  const r = await screen(w.text);
  runlog.note(w.id, { screen: screenNote(r, Date.now() - t0) });
  if (settled(w)) return; // vetoed, or the build already failed
  if (!r.allowed) {
    stop(w.id);
    store.update(w, { status: "declined", reason: r.userMessage, queuePos: null, sprite: "failed" });
    store.log(w, `#${w.n} declined`);
    runlog.finish(w);
    return;
  }
  store.setPrivate(w.id, { spritePrompt: r.spritePrompt, thingSummary: r.thingSummary });
  store.update(w, { bleed: r.bleed });
  store.log(w, `#${w.n} accepted: ${r.thingSummary.slice(0, 90)}${r.bleed ? ` (ground: ${r.bleed.label})` : ""}`);
  screened(w);
  if (!EARLY) start(w);
}

/** The screen passed: draw the ground patch if it needs one, and let it go live once everything else is done. */
function screened(w) {
  const rs = run(w.id);
  rs.screened = true;
  if (w.bleed) drawPatch(w.id, w.bleed.label).then((ok) => { store.update(w, { hasPatch: ok }); if (ok) store.log(w, `#${w.n} ground patch ready`); }).finally(() => { rs.patchDone = true; maybeLive(w); });
  else rs.patchDone = true;
  progress(w);
  maybeLive(w);
}

/** The sprite sheet starts drawing now; the build waits for a Codex slot. */
function start(w) {
  run(w.id).queuedAt = Date.now();
  sheet(w);
  waiting.push(w.id);
  refreshPositions();
  pump();
}

/** The status visitors see, from where each part of the run is. */
function progress(w) {
  const rs = run(w.id);
  if (settled(w)) return;
  const status = !rs.screened ? "screening" : rs.codeOk || rs.testing ? "testing" : rs.building ? "coding" : "queued";
  if (w.status !== status) store.update(w, { status });
}

function refreshPositions() {
  waiting.forEach((id, i) => { const w = store.get(id); if (w && w.queuePos !== i + 1) store.update(w, { queuePos: i + 1 }); });
}

function pump() {
  while (active < CONCURRENCY && waiting.length) {
    const id = waiting.shift();
    const w = store.get(id);
    if (!w || settled(w)) continue;
    active++;
    refreshPositions();
    build(w).catch((e) => console.error("build crashed", e)).finally(() => { active--; pump(); });
  }
}

async function build(w) {
  const rs = run(w.id), t0 = Date.now();
  rs.building = true;
  store.update(w, { queuePos: null });
  progress(w);
  store.log(w, `#${w.n} Codex is writing it`);
  const res = await buildThing({
    id: w.id, text: w.text, brief: store.getPrivate(w.id).thingSummary, signal: rs.abort.signal,
    log: (line) => store.log(w, `#${w.n} ${line}`),
    onTesting: () => { rs.testing = true; progress(w); },
  });
  rs.building = false;
  if (settled(w)) return; // vetoed or declined while it was building
  const stats = { buildMs: Date.now() - t0, turns: res.turns, checkRuns: res.checkRuns, checkFails: res.checkFails };
  runlog.note(w.id, { build: { ms: stats.buildMs, waitMs: t0 - rs.queuedAt, model: BUILD_MODEL, effort: BUILD_EFFORT, turns: res.turns, checkRuns: res.checkRuns, checkFails: res.checkFails, ok: res.ok, ...(res.ok ? {} : { error: String(res.error).slice(0, 200) }) } });
  if (!res.ok) {
    console.error(`wish ${w.id} failed: ${res.error}`);
    store.log(w, `#${w.n} failed: ${res.error?.slice(0, 80)}`);
    stop(w.id);
    store.update(w, { status: "failed", reason: FAILED, stats, queuePos: null });
    runlog.finish(w);
    return;
  }
  rs.codeOk = true;
  store.update(w, { thing: res.thing, stats });
  progress(w);
  store.log(w, `#${w.n} code passed in ${(stats.buildMs / 1000).toFixed(1)}s`);
  maybeLive(w);
}

async function sheet(w) {
  const rs = run(w.id), p = store.getPrivate(w.id);
  store.update(w, { sprite: "drawing" });
  store.log(w, `#${w.n} drawing it`);
  const ok = SPRITE_VIA_CODEX ? await codexSprite(w, p.spritePrompt || w.text, rs.abort.signal) : await drawSprite(w.id, p.spritePrompt || w.text);
  if (settled(w) || rs.abort.signal.aborted) return;
  store.update(w, { sprite: ok ? "done" : "failed" });
  store.log(w, `#${w.n} ${ok ? "sprite ready" : "sprite failed, using a paper blob"}`);
  rs.sheetDone = true;
  maybeLive(w);
}

// Default: Codex draws the whole sprite sheet (ChatGPT login, no API cost); its idle frame becomes sprite.png.
const SPRITE_VIA_CODEX = process.env.SPRITE_VIA !== "api";
async function codexSprite(w, description, signal) {
  const dir = store.thingDir(w.id);
  try {
    const a = await makeFrames(dir, description, { wish: w.text, signal });
    const fw = a.frameW, x = fw * (a.anims?.idle?.[0] ?? 4);
    await new Promise((ok, no) => execFile("sips", ["-c", String(a.frameH), String(fw), "--cropOffset", "0", String(x),
      path.join(dir, "frames.png"), "--out", path.join(dir, "sprite.png")], (e) => (e ? no(e) : ok())));
    store.update(w, { anim: true, animAt: Date.now() });
    runlog.note(w.id, { sheet: { ok: true, ...a.run } });
    return true;
  } catch (e) {
    runlog.note(w.id, { sheet: { ok: false, error: String(e.message).slice(0, 200), ...e.run } });
    if (!signal?.aborted) console.error(`codex sprite ${w.id} failed:`, e.message);
    return false;
  }
}

const redrawing = new Set();
/** Keeper: draw a live pet's sprite sheet again (wrong picture, background left in). Clients swap it in via animAt. */
export function redraw(id) {
  const w = store.get(id);
  if (!w || w.status !== "live" || !["wish", "sketch"].includes(w.kind) || redrawing.has(id)) return false;
  redrawing.add(id);
  const t0 = Date.now();
  store.log(w, `#${w.n} redrawing it`);
  runlog.start(id, { redraw: true });
  codexSprite(w, store.getPrivate(id).spritePrompt || w.text, null).then((ok) => {
    redrawing.delete(id);
    if (ok && w.sprite !== "done") store.update(w, { sprite: "done" }); // it was a paper blob until now
    store.log(w, `#${w.n} ${ok ? "redrawn" : "redraw failed, kept the old one"}`);
    runlog.finish(w, { totalMs: Date.now() - t0 });
  });
  return true;
}

/** Live once the screen passed, the code passed AND the sprite (and patch) have settled. */
function maybeLive(w) {
  const rs = run(w.id);
  if (settled(w) || !rs.screened || !rs.codeOk || !rs.sheetDone || !rs.patchDone) return;
  store.update(w, { status: "live", acceptedAt: Date.now(), queuePos: null });
  store.log(w, `#${w.n} LIVE: ${w.thing?.name} (built by Codex in ${(w.stats.buildMs / 1000).toFixed(0)}s)`);
  runlog.finish(w);
  store.enforceCap();
  if (process.env.ANIMATE !== "0" && w.sprite === "done" && !w.anim) animateThing(w, store.getPrivate(w.id).spritePrompt || w.text);
}
