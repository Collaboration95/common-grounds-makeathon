// Manifest, slots, ids, private device map, and the change-event bus. No http in here.
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { execFile } from "node:child_process";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const WORLD = process.env.COMMONS_WORLD ? path.resolve(process.env.COMMONS_WORLD) : path.join(ROOT, "commons-world");
export const THINGS = path.join(WORLD, "things");
const MANIFEST = path.join(WORLD, "manifest.json");
const PRIVATE = path.join(WORLD, "private.json"); // { [wishId]: { deviceId, spritePrompt, thingSummary } }

export const bus = new EventEmitter(); // wish (Wish) | log ({id,n,line,t}) | poke | remove | depart ({id}) | scene
bus.setMaxListeners(0);

let wishes = [];
let rooms = []; // [{ id, n, sceneId, createdAt }] (ROOMS=0 turns rooms off: old cap + depart)
export const ROOMS_ON = process.env.ROOMS !== "0";
let priv = {};
const recentLogs = [];

const writeAtomic = (file, data) => {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
};
const save = () => {
  writeAtomic(MANIFEST, JSON.stringify({ version: 1, wishes, rooms }, null, 1));
  writeAtomic(PRIVATE, JSON.stringify(priv));
};

export const get = (id) => wishes.find((w) => w.id === id);
export const getPrivate = (id) => priv[id] || {};
export const setPrivate = (id, patch) => { priv[id] = { ...priv[id], ...patch }; save(); };
export const all = () => wishes;
/** Wishes clients should know about (vetoed ones are gone). */
export const publicWishes = () => wishes.filter((w) => w.status !== "vetoed");
export const logs = () => recentLogs;
export const thingDir = (id) => path.join(THINGS, id);

export function update(w, patch) {
  Object.assign(w, patch);
  save();
  bus.emit("wish", w);
  return w;
}

export function log(w, line) {
  const entry = { id: w.id, n: w.n, line: String(line).slice(0, 200), t: Date.now() };
  recentLogs.push(entry);
  if (recentLogs.length > 80) recentLogs.shift();
  bus.emit("log", entry);
}

export function veto(id) {
  const w = get(id);
  if (!w || w.status === "vetoed") return false;
  w.status = "vetoed";
  w.queuePos = null;
  save();
  bus.emit("remove", { id });
  return true;
}

export function poke(id) {
  const w = get(id);
  if (w && w.status === "live") bus.emit("poke", { id });
}

export const newId = () => {
  for (;;) {
    const id = "w" + Math.random().toString(36).slice(2, 5);
    if (!get(id) && /^w[a-z0-9]{3}$/.test(id)) return id;
  }
};

/** A slot far from the neighbours that will actually be on screen. */
function pickSlot() {
  const taken = wishes.filter((w) => !["declined", "failed", "vetoed", "departed"].includes(w.status)).map((w) => w.slotX);
  const cands = [];
  for (let x = 120; x <= 1480; x += 20) {
    cands.push({ x, d: taken.length ? Math.min(...taken.map((t) => Math.abs(t - x))) : 1e9 });
  }
  cands.sort((a, b) => b.d - a.d);
  const top = cands.slice(0, 4); // a little variety among the best spots
  return top[Math.floor(Math.random() * top.length)].x + Math.round((Math.random() - 0.5) * 30);
}

/** `extra` overrides fields at creation (presets: id, kind, status "live", thing...), so clients only see the final state. */
export function addWish({ text, name, deviceId, hat = null, ...extra }) {
  const w = {
    id: newId(),
    n: wishes.reduce((m, x) => Math.max(m, x.n), 0) + 1,
    text, name,
    createdAt: Date.now(), acceptedAt: null, departedAt: null,
    status: "screening", queuePos: null, sprite: "pending",
    slotX: pickSlot(),
    thing: null, bleed: null, hasPatch: false, reason: null,
    stats: { buildMs: 0, turns: 0, checkRuns: 0, checkFails: 0 },
    resident: false, kind: "wish", hat,
    ...(ROOMS_ON ? { room: pickRoom() } : {}),
    ...extra,
  };
  wishes.push(w);
  priv[w.id] = { deviceId, pin: String(100 + Math.floor(Math.random() * 900)) };
  save();
  bus.emit("wish", w);
  return w;
}

/** One ACTIVE thing per device (not declined/failed/departed/vetoed), and at most 2 declined/failed tries. */
export function deviceAllowance(deviceId) {
  const mine = wishes.filter((w) => priv[w.id]?.deviceId === deviceId);
  if (mine.some((w) => !["declined", "failed", "departed", "vetoed"].includes(w.status))) return "You already have one in the room. When it heads home you can add another!";
  if (mine.filter((w) => w.status === "declined" || w.status === "failed").length >= 2) return "That's two tries already. Come find us at the table!";
  return null;
}

// ---------- rooms: a new one opens when the newest is full ----------
const ENDED = ["declined", "failed", "vetoed", "departed"];
const DEFAULT_SCENE_ID = "voiddeck";
const sceneFile = (sid) => sid === DEFAULT_SCENE_ID ? DEFAULT_SCENE : path.join(WORLD, "scenes", sid, "scene.json");
const sceneChoices = () => {
  let ids = [];
  try { ids = fs.readdirSync(path.join(WORLD, "scenes")).filter((d) => /^[a-z0-9-]+$/.test(d) && fs.existsSync(sceneFile(d))).sort(); } catch {}
  return [DEFAULT_SCENE_ID, ...ids];
};
const roomOf = (w) => w.room || rooms[0]?.id;
function pickRoom() {
  const cur = rooms[rooms.length - 1];
  if (!cur) return undefined;
  if (wishes.filter((w) => roomOf(w) === cur.id && !ENDED.includes(w.status)).length < MAX_CHARACTERS) return cur.id;
  const choices = sceneChoices(), n = rooms.length + 1;
  const room = { id: "r" + n, n, sceneId: choices[(n - 1) % choices.length], createdAt: Date.now() };
  rooms.push(room);
  bus.emit("rooms", publicRooms());
  return room.id;
}
/** Rooms for clients, each with its resolved scene (room 1 always follows the live scene). */
export function publicRooms() {
  if (!ROOMS_ON) return [];
  return rooms.map((r, i) => {
    let sc = i === 0 ? scene : null;
    if (!sc) { try { sc = JSON.parse(fs.readFileSync(sceneFile(r.sceneId), "utf8")); } catch { sc = JSON.parse(fs.readFileSync(DEFAULT_SCENE, "utf8")); } }
    return { ...r, scene: sc };
  });
}

/** Keeper "clear": back to one room (call after the visitors' things are vetoed). */
export function resetRooms() {
  if (!ROOMS_ON || rooms.length < 2) return;
  rooms = [rooms[0]];
  for (const w of wishes) if (w.room && w.room !== rooms[0].id && !ENDED.includes(w.status)) w.room = rooms[0].id;
  save();
  bus.emit("rooms", publicRooms());
}

// ---------- the cap ----------
export const MAX_CHARACTERS = Number(process.env.MAX_CHARACTERS) || 10;

/** Over the cap: the oldest live thing by acceptedAt leaves, except the founder (the single oldest). Residents count. */
export function enforceCap() {
  if (ROOMS_ON) return;
  const live = () => wishes.filter((w) => w.status === "live").sort((a, b) => (a.acceptedAt || 0) - (b.acceptedAt || 0));
  for (let l = live(); l.length > MAX_CHARACTERS && l.length > 1; l = live()) {
    const w = l[1]; // l[0] is the founder
    Object.assign(w, { status: "departed", departedAt: Date.now() });
    save();
    bus.emit("depart", { id: w.id }); // first, so clients can play the "bye!" walk-off before the status update
    bus.emit("wish", w);
  }
}

// ---------- boot ----------

const RESIDENTS = {
  oyen: { text: "an orange void-deck cat who naps, wanders and hops when poked", oneLine: "Naps in the shade, wanders off, and loves warm things.", slotX: 520 },
  kopi: { text: "a cheeky mynah who swoops at fingers and steals hats", oneLine: "Perches high, swoops at fingers, eyes your hat.", slotX: 1100 },
};

const checkDir = (dir) => new Promise((resolve) =>
  execFile(process.execPath, [path.join(ROOT, "tools", "check-thing.mjs"), dir], { timeout: 30000 }, (err, out) => {
    try { resolve(JSON.parse(String(out).trim().split("\n").pop())); } catch { resolve({ ok: false, errors: [err?.message || "checker crashed"] }); }
  }));
export { checkDir as checkThing };

const SEED = (process.env.SEED_RESIDENTS || "oyen").split(","); // kopi's files stay in template/residents, unseeded
async function seedResidents() {
  const src = path.join(ROOT, "template", "residents");
  if (!fs.existsSync(src)) return;
  for (const id of fs.readdirSync(src).filter((d) => SEED.includes(d) && fs.statSync(path.join(src, d)).isDirectory())) {
    const from = path.join(src, id), to = thingDir(id);
    fs.mkdirSync(to, { recursive: true });
    let newest = 0;
    for (const f of ["thing.js", "sprite.png", "frames.png", "anim.json"]) {
      if (!fs.existsSync(path.join(from, f))) continue;
      fs.copyFileSync(path.join(from, f), path.join(to, f));
      newest = Math.max(newest, Math.floor(fs.statSync(path.join(from, f)).mtimeMs));
    }
    if (!fs.existsSync(path.join(to, "thing.js"))) continue;
    const spriteOk = fs.existsSync(path.join(to, "sprite.png"));
    const animOk = fs.existsSync(path.join(from, "frames.png")) && fs.existsSync(path.join(from, "anim.json"));
    const chk = await checkDir(to);
    if (!chk.ok) { console.error(`resident ${id} fails its check:`, chk.errors); continue; }
    const info = RESIDENTS[id] || { text: id, oneLine: "", slotX: 800 };
    const existing = get(id);
    if (existing?.status === "vetoed") continue;
    const fields = {
      acceptedAt: newest || Date.now(), sprite: spriteOk ? "done" : "failed", anim: animOk, animAt: newest || 0,
      thing: { ...chk.thing, oneLine: info.oneLine },
    };
    if (existing) Object.assign(existing, fields);
    else wishes.push({
      id, n: 0, text: info.text, name: "the Commons", createdAt: newest || Date.now(), status: "live", queuePos: null,
      slotX: info.slotX, bleed: null, hasPatch: false, reason: null,
      stats: { buildMs: 0, turns: 0, checkRuns: 0, checkFails: 0 }, resident: true, kind: "resident", hat: null, departedAt: null, ...fields,
    });
  }
}

// ---------- scene (current room: background + walk map, see SPEC v2) ----------
const SCENE = path.join(WORLD, "scene.json");
const DEFAULT_SCENE = path.join(ROOT, "public", "scenes", "voiddeck", "scene.json");
let scene = null;
export const getScene = () => scene;
/** Replace the current scene; clients get an SSE `scene` event. */
export function setScene(next) {
  scene = next;
  if (rooms[0]) rooms[0].sceneId = next.id || rooms[0].sceneId;
  writeAtomic(SCENE, JSON.stringify(scene, null, 1));
  bus.emit("scene", scene);
  return scene;
}

export async function init() {
  fs.mkdirSync(THINGS, { recursive: true });
  for (const f of [SCENE, DEFAULT_SCENE]) { try { scene = JSON.parse(fs.readFileSync(f, "utf8")); break; } catch {} }
  try { const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8")); wishes = m.wishes || []; rooms = m.rooms || []; } catch (e) { if (e.code !== "ENOENT") console.error("manifest unreadable, starting empty:", e.message); }
  try { priv = JSON.parse(fs.readFileSync(PRIVATE, "utf8")); } catch { priv = {}; }
  for (const w of wishes) { w.kind ??= w.resident ? "resident" : "wish"; w.hat ??= null; w.departedAt ??= null; } // v1 manifests
  if (ROOMS_ON && !rooms.length) rooms = [{ id: "r1", n: 1, sceneId: scene?.id || DEFAULT_SCENE_ID, createdAt: Date.now() }];
  await seedResidents();
  if (ROOMS_ON) for (const w of wishes) if (w.kind === "resident") w.room ??= rooms[0].id;
  save();
}
