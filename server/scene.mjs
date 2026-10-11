// Scene from a photo (SPEC v2 "Host: a scene from a photo").
//   photo.jpg -> gpt-image edit (redraw) -> background.png 1600x900 -> local Codex maps it -> validated scene.json
// The OpenAI API key is used for the image edit ONLY. Mapping runs on the local codex CLI (ChatGPT login).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { Codex } from "@openai/codex-sdk";
import { ROOT, WORLD, setScene } from "./store.mjs";

export const HOST_KEY = process.env.HOST_KEY || crypto.randomBytes(5).toString("hex");
export const SCENES = path.join(WORLD, "scenes");
export const W = 1600, H = 900;

const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-flare";
const IMAGE_FALLBACK = "gpt-image-2";
const IMAGE_QUALITY = process.env.SCENE_IMAGE_QUALITY || process.env.IMAGE_QUALITY || "medium";
const MODEL = process.env.CODEX_MODEL || "gpt-6.1-sol";
const EFFORT = process.env.SCENE_EFFORT || process.env.CODEX_EFFORT || "low";
const MAP_TIMEOUT_MS = Number(process.env.SCENE_MAP_TIMEOUT_MS) || 150000;

export const REDRAW_PROMPT = "Redraw this photo as a warm paper-cutout gouache illustration of the same room: the same room, simplified and decluttered, recognisable layout, warm dusk colours with soft lamp light. " +
  "Any people are removed, or turned into simple small cartoon figures in the background. Keep a large, clear, empty floor area in the lower half of the picture with nothing standing on it. " +
  "Wide 16:9 composition, nothing important at the very top or bottom edge. No text, no logos, no writing, no screens full of words.";

const expand = (p) => (p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p);
const binPath = expand(process.env.CODEX_BIN || "~/.local/bin/codex");
// Codex uses the ChatGPT login: keep our API keys out of its environment.
const codexEnv = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => v !== undefined && !/^(OPENAI_API_KEY|CODEX_API_KEY)$/.test(k)));
let codex;
const getCodex = () => (codex ||= new Codex({ ...(fs.existsSync(binPath) ? { codexPathOverride: binPath } : {}), env: codexEnv }));

// ---------- validation ----------
const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rnd = (v) => Math.round(v);
const KINDS = ["seat", "table", "perch", "rest"];

function pair(a, d, minW) {
  const arr = Array.isArray(a) ? a : [];
  let l = clamp(rnd(num(arr[0], d[0])), 0, W), r = clamp(rnd(num(arr[1], d[1])), 0, W);
  if (l > r) [l, r] = [r, l];
  if (r - l < minW) { l = clamp(rnd((l + r) / 2 - minW / 2), 0, W - minW); r = l + minW; }
  return [l, r];
}

export const FALLBACK_MAP = {
  ceilingY: 170, air: { top: 190, bottom: 470 },
  floor: { backY: 520, frontY: 880, backX: [80, 1520], frontX: [0, 1600] }, depthScale: [0.6, 1.2], spots: [],
};

/** Turn whatever Codex (or the host sliders) produced into a scene map the engine can trust. */
export function normalizeMap(raw = {}) {
  const f = raw.floor || {}, a = raw.air || {};
  const backY = clamp(rnd(num(f.backY, FALLBACK_MAP.floor.backY)), 200, 780);
  const frontY = clamp(rnd(num(f.frontY, FALLBACK_MAP.floor.frontY)), backY + 80, 899);
  const floor = { backY, frontY, backX: pair(f.backX, FALLBACK_MAP.floor.backX, 300), frontX: pair(f.frontX, FALLBACK_MAP.floor.frontX, 500) };
  const ceilingY = clamp(rnd(num(raw.ceilingY, FALLBACK_MAP.ceilingY)), 0, backY - 130);
  const top = clamp(rnd(num(a.top, ceilingY + 10)), ceilingY, backY - 110);
  const bottom = clamp(rnd(num(a.bottom, backY - 20)), top + 100, backY - 10);
  const air = { top, bottom: Math.max(bottom, top + 80) };
  const ds = Array.isArray(raw.depthScale) ? raw.depthScale : [];
  const dBack = clamp(num(ds[0], 0.6), 0.35, 1);
  const depthScale = [Math.round(dBack * 100) / 100, Math.round(clamp(num(ds[1], 1.2), Math.max(dBack, 0.8), 1.6) * 100) / 100];

  const at = (y, k) => { const t = clamp((y - backY) / (frontY - backY), 0, 1); return [0, 1].map((i) => floor.backX[i] + (floor.frontX[i] - floor.backX[i]) * t)[k]; };
  const used = new Set();
  const spots = [];
  for (const s of Array.isArray(raw.spots) ? raw.spots : []) {
    if (spots.length >= 10 || !s || !KINDS.includes(s.kind)) continue;
    let id = String(s.id || s.name || s.kind).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || s.kind;
    for (let i = 2; used.has(id); i++) id = id.replace(/-\d+$/, "") + "-" + i;
    used.add(id);
    let x = clamp(rnd(num(s.x, 800)), 10, W - 10), y = clamp(rnd(num(s.y, backY)), 10, H - 1);
    if (s.kind === "perch") y = Math.min(y, backY - 20); // perches live above the floor
    else if (s.kind === "rest") { y = clamp(y, backY, frontY); x = clamp(x, rnd(at(y, 0)) + 10, rnd(at(y, 1)) - 10); } // a floor spot: inside the trapezoid
    else y = clamp(y, backY - 150, frontY); // seat/table: (x,y) is the TOP surface where feet go, so it may sit a little above the far edge
    const tags = (Array.isArray(s.tags) ? s.tags : []).map((t) => String(t).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 16)).filter(Boolean).slice(0, 4);
    spots.push({ id, name: String(s.name || id).replace(/\s+/g, " ").trim().slice(0, 24) || id, kind: s.kind, x, y, tags });
  }
  return { ceilingY, air, floor, depthScale, spots };
}

// ---------- jobs ----------
const jobs = new Map();
export const getJob = (id) => {
  if (!/^[a-z0-9-]{3,24}$/.test(id)) return null;
  const j = jobs.get(id);
  if (j) return j;
  try { // after a restart: a finished room on disk is still reviewable
    const scene = JSON.parse(fs.readFileSync(path.join(SCENES, id, "scene.json"), "utf8"));
    return { id, step: "ready", scene, message: "Ready", mapSource: "disk" };
  } catch { return null; }
};
export const busy = () => [...jobs.values()].some((j) => ["redrawing", "mapping"].includes(j.step));

const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { timeout: 30000 }, (e) => (e ? rej(e) : res())));

async function redraw(photoBuf) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("no OPENAI_API_KEY on the server");
  const call = async (model) => {
    const form = new FormData();
    form.set("model", model); form.set("prompt", REDRAW_PROMPT); form.set("size", "1536x1024"); form.set("quality", IMAGE_QUALITY); form.set("n", "1");
    form.set("image", new Blob([photoBuf], { type: "image/jpeg" }), "photo.jpg");
    const r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(200000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error?.message || `images/edits ${r.status}`), { status: r.status });
    return { png: Buffer.from(j.data[0].b64_json, "base64"), model };
  };
  try { return await call(IMAGE_MODEL); }
  catch (e) {
    if (IMAGE_MODEL === IMAGE_FALLBACK || (e.status && ![400, 403, 404].includes(e.status))) throw e; // model unavailable: try the stable one
    console.error(`scene redraw with ${IMAGE_MODEL} failed (${e.message}); falling back to ${IMAGE_FALLBACK}`);
    return await call(IMAGE_FALLBACK);
  }
}

/** 1536x1024 -> centre crop 1536x864 -> exactly 1600x900 (sips, macOS). */
async function fit16x9(png, outFile) {
  const tmp = outFile + ".raw.png";
  fs.writeFileSync(tmp, png);
  try {
    const dims = await new Promise((res, rej) => execFile("sips", ["-g", "pixelWidth", "-g", "pixelHeight", tmp], (e, out) => (e ? rej(e) : res(out))));
    const w = Number(/pixelWidth: (\d+)/.exec(dims)?.[1]), h = Number(/pixelHeight: (\d+)/.exec(dims)?.[1]);
    if (!w || !h) throw new Error("sips could not read the redraw");
    const cropH = Math.min(h, Math.round((w * 9) / 16)), cropW = Math.min(w, Math.round((h * 16) / 9));
    await run("sips", ["-c", String(cropH), String(cropW), tmp, "--out", outFile]);
    await run("sips", ["-z", String(H), String(W), outFile]);
  } finally { fs.rmSync(tmp, { force: true }); }
}

const MAP_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    ceilingY: { type: "integer" },
    air: { type: "object", properties: { top: { type: "integer" }, bottom: { type: "integer" } }, required: ["top", "bottom"], additionalProperties: false },
    floor: {
      type: "object",
      properties: {
        backY: { type: "integer" }, frontY: { type: "integer" },
        backX: { type: "array", items: { type: "integer" } }, frontX: { type: "array", items: { type: "integer" } },
      },
      required: ["backY", "frontY", "backX", "frontX"], additionalProperties: false,
    },
    depthScale: { type: "array", items: { type: "number" } },
    spots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" }, name: { type: "string" }, kind: { type: "string", enum: KINDS },
          x: { type: "integer" }, y: { type: "integer" }, tags: { type: "array", items: { type: "string" } },
        },
        required: ["id", "name", "kind", "x", "y", "tags"], additionalProperties: false,
      },
    },
  },
  required: ["name", "ceilingY", "air", "floor", "depthScale", "spots"],
  additionalProperties: false,
};

const MAP_PROMPT = `You are mapping a room picture for "The Commons", a 2D game where small paper-cutout characters walk on the floor and fly through the air of this room.

The attached image is the room, exactly ${W} pixels wide and ${H} pixels tall. Give every coordinate in that pixel space: x from 0 (left) to ${W} (right), y from 0 (top) to ${H} (bottom). Look at the picture and estimate carefully. Do not run any commands and do not read any files; answer from the image alone.

Return JSON with:
- name: a short name for this room (max 30 chars, e.g. "Seminar room").
- floor: the walkable floor, a trapezoid. backY = the y of its far edge (where the floor meets the back wall or the horizon of the floor); frontY = the y of its near edge (usually 860 to 895, near the bottom of the picture). backX = [left, right] x of the far edge at backY; frontX = [left, right] x of the near edge at frontY. Be GENEROUS: include all open floor characters could plausibly walk on, running to the left and right walls (or the image edges) and down to the bottom of the picture. Characters' feet must land on floor, so exclude only big furniture and walls. The near edge is normally as wide as, or wider than, the far edge.
- ceilingY: the y of the ceiling line (where the back wall meets the ceiling). Nothing flies above it. Use a small value (like 120) if there is little or no visible ceiling.
- air: { top, bottom }, the band where small birds and kites fly: top is at or just below ceilingY; bottom is a bit above floor.backY. Keep bottom - top at least 150.
- depthScale: [back, front], how big a character looks at floor.backY versus at floor.frontY, as a multiplier. Typically [0.55, 1.2]; use a lower first number when the room recedes strongly.
- spots: up to 10 notable places in the picture. kind is "seat" (a chair, stool, sofa or bench: x,y is the point on its seat surface where a sitter's bottom/feet rest), "table" (a table, counter, lectern or ledge a character can stand on: x,y is a point on its top surface), "rest" (a nice open FLOOR spot such as a rug or a sunny patch: x,y on the floor), or "perch" (a high place a bird would land: a lamp, a shelf, a curtain rail, the top of a screen, a beam; x,y is the point where its feet would grip, above floor.backY). Each spot needs a short id (lowercase, hyphens), a name (max 24 chars), x, y and tags (0 to 3 lowercase words like "warm", "light", "soft"). Only list things that really are in the picture. Fewer good spots beats many guesses.`;

async function mapScene(imagePath, log) {
  const thread = () => getCodex().startThread({
    workingDirectory: path.dirname(imagePath), sandboxMode: "read-only", approvalPolicy: "never",
    networkAccessEnabled: false, webSearchEnabled: false, skipGitRepoCheck: true, model: MODEL, modelReasoningEffort: EFFORT,
  });
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const sig = AbortSignal.timeout(MAP_TIMEOUT_MS);
      const { events } = await thread().runStreamed([{ type: "text", text: MAP_PROMPT }, { type: "local_image", path: imagePath }], { outputSchema: MAP_SCHEMA, signal: sig });
      let final = null;
      for await (const ev of events) {
        if (ev.type === "item.completed" && ev.item.type === "agent_message") final = ev.item.text;
        else if (ev.type === "turn.completed") break; // don't wait for the stream to close (7-12s)
        else if (ev.type === "turn.failed") throw new Error(ev.error?.message || "turn failed");
        else if (ev.type === "error") throw new Error(ev.message || "stream error");
      }
      if (!final) throw new Error("Codex returned nothing");
      return JSON.parse(final.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch (e) { lastErr = e; log?.(`mapping attempt ${attempt} failed: ${String(e.message).slice(0, 120)}`); }
  }
  throw lastErr;
}

/** Start a pipeline for an uploaded JPEG. Returns the job at once; poll getJob(id). */
export function startJob(photoBuf, log = console.log) {
  const id = "r" + crypto.randomBytes(3).toString("hex");
  const dir = path.join(SCENES, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "photo.jpg"), photoBuf);
  const job = { id, step: "redrawing", message: "Redrawing the room…", startedAt: Date.now(), stepAt: Date.now(), redrawMs: null, mapMs: null, mapSource: null, error: null, scene: null,
    toJSON() { const { toJSON, ...rest } = this; return { ...rest, stepMs: Date.now() - this.stepAt }; } }; // stepMs: how long the current step has run (server clock)
  jobs.set(id, job);
  (async () => {
    let t = Date.now();
    try {
      const { png, model } = await redraw(photoBuf);
      await fit16x9(png, path.join(dir, "background.png"));
      job.redrawMs = Date.now() - t; job.imageModel = model;
      log(`scene ${id}: redrawn with ${model} in ${(job.redrawMs / 1000).toFixed(1)}s`);
      job.step = "mapping"; job.stepAt = Date.now(); job.message = "Finding the floor, ceiling and perches…"; t = Date.now();
      let map, source = "codex";
      try { map = await mapScene(path.join(dir, "background.png"), log); }
      catch (e) { source = "fallback"; map = FALLBACK_MAP; job.warning = "Codex couldn't map this room, so this is a generic guess. Use the sliders to fit the floor."; log(`scene ${id}: mapping failed (${e.message}); using the generic map`); }
      job.mapMs = Date.now() - t; job.mapSource = source;
      log(`scene ${id}: mapped by ${source} in ${(job.mapMs / 1000).toFixed(1)}s`);
      job.scene = { id, name: String(map.name || "").replace(/\s+/g, " ").trim().slice(0, 30) || "Our room", background: `/scenes/${id}/background.png`, width: W, height: H, ...normalizeMap(map) };
      fs.writeFileSync(path.join(dir, "scene.json"), JSON.stringify(job.scene, null, 1));
      job.step = "ready"; job.message = "Ready";
    } catch (e) {
      console.error(`scene ${id} failed:`, e);
      job.step = "failed"; job.error = String(e.message || e).slice(0, 300); job.message = "That didn't work.";
    }
  })();
  return job;
}

/** Apply a reviewed room (optionally with the host's slider tweaks) as the live scene. */
export function applyJob(id, tweaks = {}) {
  const job = getJob(id);
  if (!job?.scene) return null;
  const s = job.scene;
  const floor = { ...s.floor };
  for (const k of ["backY", "frontY"]) if (tweaks.floor && Number.isFinite(Number(tweaks.floor[k]))) floor[k] = Number(tweaks.floor[k]);
  const next = { ...s, ...normalizeMap({ ...s, floor, ceilingY: Number.isFinite(Number(tweaks.ceilingY)) ? Number(tweaks.ceilingY) : s.ceilingY }) };
  return setScene(next); // job.scene stays as Codex mapped it, so a later review can start from the original
}

/** Back to the built-in void deck. */
export function resetScene() {
  return setScene(JSON.parse(fs.readFileSync(path.join(ROOT, "public", "scenes", "voiddeck", "scene.json"), "utf8")));
}
