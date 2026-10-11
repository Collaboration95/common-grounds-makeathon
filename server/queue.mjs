// Wish lifecycle: screening -> queued -> coding -> testing -> live (or declined / failed / vetoed).
// Codex builds run CONCURRENCY at a time; the sprite (and bleed patch) draw in parallel from acceptance.
import fs from "node:fs";
import path from "node:path";
import * as store from "./store.mjs";
import { screen } from "./screen.mjs";
import { drawSprite, drawPatch } from "./image.mjs";
import { buildThing } from "./codex.mjs";
import * as presets from "./presets.mjs";
import { animateThing, makeFrames } from "./animate.mjs";
import { execFile } from "node:child_process";

const CONCURRENCY = Number(process.env.CONCURRENCY) || 3;
const MAX_PENDING = 40; // flood guard
const FAILED = "Codex couldn't build that one.";

const waiting = []; // wish ids waiting for a Codex slot, FIFO
const runs = new Map(); // id -> { abort, codeOk, artDone }
let active = 0;

const run = (id) => { if (!runs.has(id)) runs.set(id, { abort: new AbortController(), codeOk: false, artDone: false }); return runs.get(id); };
const gone = (w) => w.status === "vetoed";
const pending = () => store.all().filter((w) => ["screening", "queued", "coding", "testing"].includes(w.status)).length;

export function submit({ text, name, deviceId, hat = null }, { admin = false } = {}) {
  if (!admin && pending() >= MAX_PENDING) return null;
  const w = store.addWish({ text, name, deviceId, hat });
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
  store.log(w, `#${w.n} ${name}: "${text}" (sketch)`);
  sketchRun(w).catch((e) => { console.error("sketch crashed", e); });
  return w;
}

async function sketchRun(w) {
  const t0 = Date.now();
  const fail = (why) => { store.update(w, { status: "failed", sprite: "failed", reason: "The sketch didn't come out. Try another line!" }); store.log(w, `#${w.n} sketch failed: ${String(why).slice(0, 80)}`); };
  store.log(w, `#${w.n} checking the line…`);
  const r = await screen(w.text);
  if (gone(w)) return;
  if (!r.allowed) { store.update(w, { status: "declined", reason: r.userMessage, queuePos: null, sprite: "failed" }); store.log(w, `#${w.n} declined`); return; }
  store.log(w, `#${w.n} sketching with gpt-6-luna…`);
  const ok = await codexSprite(w, r.spritePrompt || w.text);
  if (gone(w)) return;
  if (!ok) return fail("no sprite sheet");
  store.log(w, `#${w.n} sprite sheet ready (12 frames)`);
  const dir = store.thingDir(w.id), nm = titleName(w.text);
  fs.writeFileSync(path.join(dir, "thing.js"), fs.readFileSync(path.join(store.ROOT, "template", "generic", "thing.js"), "utf8").replace("NAME_HERE", nm));
  const ms = Date.now() - t0;
  store.update(w, { sprite: "done", thing: { name: nm, tags: ["critter", "friend"], zone: "ground", size: 1, oneLine: w.text }, stats: { buildMs: ms, turns: 0, checkRuns: 0, checkFails: 0 }, status: "live", acceptedAt: Date.now(), queuePos: null });
  store.log(w, `#${w.n} LIVE: ${nm} (sketched by gpt-6-luna in ${(ms / 1000).toFixed(0)}s)`);
  store.enforceCap();
}

export function veto(id) {
  const w = store.get(id);
  if (!w || !store.veto(id)) return;
  runs.get(id)?.abort.abort();
  const i = waiting.indexOf(id);
  if (i >= 0) { waiting.splice(i, 1); refreshPositions(); }
  store.log(w, `#${w.n} vetoed`);
}

/** After a restart, pick up anything that was in flight. */
export function resume() {
  for (const w of store.all()) {
    if (!["screening", "queued", "coding", "testing"].includes(w.status)) continue;
    if (w.kind === "sketch") { store.update(w, { status: "failed", sprite: "failed", reason: "The server restarted mid-sketch. Try again!" }); continue; }
    store.log(w, `#${w.n} resuming after restart`);
    if (store.getPrivate(w.id).spritePrompt) { store.update(w, { status: "queued", sprite: "pending" }); accept(w); }
    else intake(w);
  }
}

async function intake(w) {
  store.log(w, `#${w.n} checking the wish…`);
  const r = await screen(w.text);
  if (gone(w)) return;
  if (!r.allowed) {
    store.update(w, { status: "declined", reason: r.userMessage, queuePos: null });
    store.log(w, `#${w.n} declined`);
    return;
  }
  store.setPrivate(w.id, { spritePrompt: r.spritePrompt, thingSummary: r.thingSummary });
  store.update(w, { status: "queued", bleed: r.bleed });
  store.log(w, `#${w.n} accepted: ${r.thingSummary.slice(0, 90)}${r.bleed ? ` (ground: ${r.bleed.label})` : ""}`);
  accept(w);
}

function accept(w) {
  art(w);
  waiting.push(w.id);
  refreshPositions();
  pump();
}

function refreshPositions() {
  waiting.forEach((id, i) => { const w = store.get(id); if (w && w.queuePos !== i + 1) store.update(w, { queuePos: i + 1 }); });
}

function pump() {
  while (active < CONCURRENCY && waiting.length) {
    const id = waiting.shift();
    const w = store.get(id);
    if (!w || gone(w)) continue;
    active++;
    refreshPositions();
    build(w).catch((e) => console.error("build crashed", e)).finally(() => { active--; pump(); });
  }
}

async function build(w) {
  const rs = run(w.id), t0 = Date.now();
  store.update(w, { status: "coding", queuePos: null });
  store.log(w, `#${w.n} Codex is writing it`);
  const res = await buildThing({
    id: w.id, text: w.text, brief: store.getPrivate(w.id).thingSummary, signal: rs.abort.signal,
    log: (line) => store.log(w, `#${w.n} ${line}`),
    onTesting: () => { if (w.status === "coding") store.update(w, { status: "testing" }); },
  });
  if (gone(w)) return;
  const stats = { buildMs: Date.now() - t0, turns: res.turns, checkRuns: res.checkRuns, checkFails: res.checkFails };
  if (!res.ok) {
    console.error(`wish ${w.id} failed: ${res.error}`);
    store.log(w, `#${w.n} failed: ${res.error?.slice(0, 80)}`);
    store.update(w, { status: "failed", reason: FAILED, stats });
    return;
  }
  rs.codeOk = true;
  store.update(w, { thing: res.thing, stats, status: "testing" });
  store.log(w, `#${w.n} code passed in ${(stats.buildMs / 1000).toFixed(1)}s`);
  maybeLive(w);
}

async function art(w) {
  const rs = run(w.id), p = store.getPrivate(w.id);
  store.update(w, { sprite: "drawing" });
  store.log(w, `#${w.n} drawing it`);
  await Promise.all([
    (SPRITE_VIA_CODEX ? codexSprite(w, p.spritePrompt || w.text) : drawSprite(w.id, p.spritePrompt)).then((ok) => { store.update(w, { sprite: ok ? "done" : "failed" }); store.log(w, `#${w.n} ${ok ? "sprite ready" : "sprite failed, using a paper blob"}`); }),
    w.bleed ? drawPatch(w.id, w.bleed.label).then((ok) => { store.update(w, { hasPatch: ok }); if (ok) store.log(w, `#${w.n} ground patch ready`); }) : null,
  ]);
  rs.artDone = true;
  maybeLive(w);
}

// Default: Codex draws the whole sprite sheet (ChatGPT login, no API cost); its idle frame becomes sprite.png.
const SPRITE_VIA_CODEX = process.env.SPRITE_VIA !== "api";
async function codexSprite(w, description) {
  const dir = store.thingDir(w.id);
  try {
    const a = await makeFrames(dir, description);
    const fw = a.frameW, x = fw * (a.anims?.idle?.[0] ?? 4);
    await new Promise((ok, no) => execFile("sips", ["-c", String(a.frameH), String(fw), "--cropOffset", "0", String(x),
      path.join(dir, "frames.png"), "--out", path.join(dir, "sprite.png")], (e) => (e ? no(e) : ok())));
    store.update(w, { anim: true, animAt: Date.now() });
    return true;
  } catch (e) { console.error(`codex sprite ${w.id} failed:`, e.message); return false; }
}

/** Live once the code passed AND the sprite (and patch) have settled. */
function maybeLive(w) {
  const rs = run(w.id);
  if (gone(w) || w.status === "live" || !rs.codeOk || !rs.artDone) return;
  store.update(w, { status: "live", acceptedAt: Date.now(), queuePos: null });
  store.log(w, `#${w.n} LIVE: ${w.thing?.name} (built by Codex in ${(w.stats.buildMs / 1000).toFixed(0)}s)`);
  store.enforceCap();
  if (process.env.ANIMATE !== "0" && w.sprite === "done" && !w.anim) animateThing(w, store.getPrivate(w.id).spritePrompt || w.text);
}
