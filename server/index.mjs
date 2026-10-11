// The Commons server: static files, JSON API, SSE, localhost-only admin. Plain node:http.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import QRCode from "qrcode";
import * as store from "./store.mjs";
import * as queue from "./queue.mjs";
import * as scene from "./scene.mjs";
import * as presets from "./presets.mjs";
import { timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT) || 8787;
const PUBLIC = path.join(store.ROOT, "public");
const PAGES = { "/world": "world.html", "/wish": "wish.html", "/console": "console.html", "/host": "host.html", "/gallery": "gallery.html", "/join-qr": "join-qr.html" };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

// ---------- helpers ----------
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
const none = (res, code = 204) => { res.writeHead(code); res.end(); };

/** Loopback AND not relayed by a tunnel/proxy (tunnels connect from localhost too). */
const isLocal = (req) => {
  const h = req.headers;
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress)) return false;
  if (h["x-forwarded-for"] || h["x-forwarded-host"] || h["forwarded"] || h["x-real-ip"] || h["cf-connecting-ip"] || h["cf-ray"]) return false;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h.host || "")) return false;
  try { return !h.origin || new URL(h.origin).host === h.host; } catch { return false; } // other web pages can't post here
};

const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on("data", (c) => { size += c.length; if (size > 8192) { reject(new Error("too big")); req.destroy(); } else chunks.push(c); });
  req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch { reject(new Error("bad json")); } });
  req.on("error", reject);
});

const sendFile = (req, res, file) => {
  let st;
  try { st = fs.statSync(file); if (!st.isFile()) throw 0; } catch { return none(res, 404); }
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  const headers = { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-cache", etag };
  if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, { ...headers, "content-length": st.size });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
};

const lanUrl = () => {
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === "IPv4" && !i.internal) return `http://${i.address}:${PORT}`;
  return `http://localhost:${PORT}`;
};
const publicUrl = (req) => { // derive from the request (tunnel URL changes); env/LAN only when there is no request
  const h = req && String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (h && /^[a-z0-9.\-:\[\]]+$/i.test(h)) {
    const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || (/^(localhost|127\.|\[::1\])/.test(h) ? "http" : /\.trycloudflare\.com$/.test(h) ? "https" : "http");
    return `${proto}://${h}`;
  }
  return (process.env.PUBLIC_URL || lanUrl()).replace(/\/+$/, "");
};

// ---------- SSE ----------
const clients = new Set();
const PAD = ":" + " ".repeat(2048) + "\n"; // pushes each event through proxy buffers
const sse = (res, event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n${PAD}\n`);
const broadcast = (event, data) => { for (const c of clients) sse(c, event, data); };
for (const ev of ["wish", "log", "poke", "remove", "scene", "depart"]) store.bus.on(ev, (d) => broadcast(ev, d));
setInterval(() => { for (const c of clients) c.write(": hb\n\n"); }, 15000).unref();

// ---------- host: a scene from a photo (all /api/host/* need the x-host-key header; logic in scene.mjs) ----------
const ROOM = path.join(store.WORLD, "room.json");
let room = null; try { room = JSON.parse(fs.readFileSync(ROOM, "utf8")); } catch {}
const mkCode = () => Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const hostKey = () => room?.code || scene.HOST_KEY;
const hostUrl = (req) => `${publicUrl(req)}/host?k=${hostKey()}`;
const same = (x, y) => { const a = Buffer.from(String(x)), b = Buffer.from(String(y)); return a.length === b.length && timingSafeEqual(a, b); };
const hostOk = (req) => { const k = String(req.headers["x-host-key"] || ""); return (room && same(k.toUpperCase(), room.code)) || same(k, scene.HOST_KEY); };
const roomPanel = (req) => ({ name: room.name, code: room.code, hostUrl: hostUrl(req), qr: "/qr?u=" + encodeURIComponent("/host?k=" + room.code) });
const RESIDENTS = path.join(store.ROOT, "template", "residents");
const residents = () => { try { return fs.readdirSync(RESIDENTS).filter((id) => /^[a-z0-9-]+$/.test(id)).map((id) => {
  let name = id, oneLine = ""; try { const src = fs.readFileSync(path.join(RESIDENTS, id, "thing.js"), "utf8"); name = /name:\s*"([^"]+)"/.exec(src)?.[1] || id; oneLine = (/^\/\/\s*[^:]+:\s*(.+)$/m.exec(src)?.[1] || "").trim(); } catch {}
  return { id, name, oneLine, sprite: `/residents/${id}/sprite.png`, frames: `/residents/${id}/frames.png`, anim: `/residents/${id}/anim.json` }; }); } catch { return []; } };
const readRaw = (req, max) => new Promise((resolve, reject) => { // the JSON readBody caps at 8 KB; photos need this one
  let size = 0; const chunks = [];
  req.on("data", (c) => { size += c.length; if (size <= max) chunks.push(c); }); // over the cap: keep draining so we can still answer 413
  req.on("end", () => (size > max ? reject(Object.assign(new Error("too big"), { code: 413 })) : resolve(Buffer.concat(chunks))));
  req.on("error", reject);
});

async function hostApi(req, res, p, m) {
  if (!hostOk(req)) return json(res, 401, { error: "Wrong or missing host key." });
  if (p === "/api/host/scene" && m === "POST") {
    if (scene.busy()) return json(res, 429, { error: "Still working on the last photo." });
    let buf; try { buf = await readRaw(req, 3 * 1024 * 1024); } catch (e) { return json(res, e.code || 400, { error: e.code === 413 ? "That photo is too big (3 MB max)." : "Bad upload." }); }
    if (buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: "Send a JPEG photo." });
    const job = scene.startJob(buf, (l) => console.log(l));
    return json(res, 202, { id: job.id, step: job.step });
  }
  if (p === "/api/host/scene/reset" && m === "POST") return json(res, 200, { scene: scene.resetScene() });
  const [, , , , id, action] = p.split("/"); // /api/host/scene/<id>[/apply]
  if (p.startsWith("/api/host/scene/") && id && m === "GET" && !action) {
    const job = scene.getJob(id);
    return job ? json(res, 200, job) : json(res, 404, { error: "No such room." });
  }
  if (p.startsWith("/api/host/scene/") && id && action === "apply" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    const next = scene.applyJob(id, b);
    return next ? json(res, 200, { scene: next }) : json(res, 409, { error: "That room isn't ready yet." });
  }
  none(res, 404);
}

// ---------- routes ----------
const pokeAt = new Map(); // deviceId -> last poke ms

const petAt = new Map();
async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = decodeURIComponent(url.pathname);
  const m = req.method;

  if (m === "GET" && p === "/") return sendFile(req, res, path.join(PUBLIC, "index.html"));
  if (p === "/api/room" && m === "GET") return json(res, 200, { name: room?.name || null });
  if (p === "/api/room" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    const name = String(b.name ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    if (!name) return json(res, 400, { error: "Give your room a name." });
    room = { name, code: mkCode(), createdAt: Date.now() };
    fs.mkdirSync(store.WORLD, { recursive: true }); fs.writeFileSync(ROOM, JSON.stringify(room));
    broadcast("room", { name });
    return json(res, 200, roomPanel(req));
  }
  if (p === "/api/room/check" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    if (!room || !same(String(b.code ?? "").trim().toUpperCase(), room.code)) return json(res, 403, { error: "No room with that code." });
    return json(res, 200, roomPanel(req));
  }
  if (p === "/api/characters" && m === "GET") return json(res, 200, { residents: residents(), presets: presets.list().characters });
  if ((m === "GET" || m === "HEAD") && p.startsWith("/residents/")) {
    const [, , id, file] = p.split("/");
    if (!/^[a-z0-9-]+$/.test(id || "") || !["sprite.png", "frames.png", "anim.json"].includes(file)) return none(res, 404);
    return sendFile(req, res, path.join(RESIDENTS, id, file));
  }
  if (p === "/qr" && m === "GET") {
    const u = url.searchParams.get("u") || "";
    if (!u.startsWith("/") || u.startsWith("//")) return json(res, 400, { error: "path must start with /" });
    const svg = await QRCode.toString(publicUrl(req) + u, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "no-cache" });
    return res.end(svg);
  }

  if (p === "/api/world" && m === "GET") return json(res, 200, { wishes: store.publicWishes(), scene: store.getScene(), logs: store.logs() });
  if (p === "/api/scene" && m === "GET") return json(res, 200, store.getScene());

  if (p === "/api/events" && m === "GET") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
    res.write("retry: 2000\n:" + " ".repeat(8192) + "\n\n"); // pad: tunnels buffer small SSE chunks
    sse(res, "hello", { wishes: store.publicWishes(), logs: store.logs(), scene: store.getScene(), room: { name: room?.name || null } });
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (p === "/api/wish" && m === "POST") {
    let b; try { b = await readBody(req); } catch (e) { return json(res, 400, { error: "Bad request." }); }
    const clean = (s) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
    const text = clean(b.text), name = clean(b.name).slice(0, 20) || "someone", deviceId = clean(b.deviceId).slice(0, 64);
    if (text.length < 3 || text.length > 120) return json(res, 400, { error: "A wish is 3 to 120 characters." });
    if (!deviceId) return json(res, 400, { error: "Missing deviceId." });
    const hat = b.hat == null || b.hat === "" ? null : String(b.hat);
    if (hat && !presets.hasHat(hat)) return json(res, 400, { error: "Unknown hat." });
    const limit = store.deviceAllowance(deviceId);
    if (limit) return json(res, 429, { error: limit });
    const w = queue.submit({ text, name, deviceId, hat });
    if (!w) return json(res, 429, { error: "The room is very busy right now. Try again in a minute!" });
    return json(res, 200, { id: w.id, pin: store.getPrivate(w.id).pin });
  }

  if (p === "/api/sketch" && m === "POST") {
    let b; try { b = await readBody(req); } catch (e) { return json(res, 400, { error: "Bad request." }); }
    const clean = (s) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
    const text = clean(b.text), name = clean(b.name).slice(0, 20) || "someone", deviceId = clean(b.deviceId).slice(0, 64);
    if (text.length < 3 || text.length > 60) return json(res, 400, { error: "Describe it in 3 to 60 characters." });
    if (!deviceId) return json(res, 400, { error: "Missing deviceId." });
    const hat = b.hat == null || b.hat === "" ? null : String(b.hat);
    if (hat && !presets.hasHat(hat)) return json(res, 400, { error: "Unknown hat." });
    const limit = store.deviceAllowance(deviceId);
    if (limit) return json(res, 429, { error: limit });
    const w = queue.sketch({ text, name, deviceId, hat });
    if (!w) return json(res, 429, { error: "The room is very busy right now. Try again in a minute!" });
    return json(res, 200, { id: w.id, pin: store.getPrivate(w.id).pin });
  }

  // presets: GET /api/presets, POST /api/place (live immediately), files under /presets/
  if (p === "/api/presets" && m === "GET") return json(res, 200, presets.list());
  if (p === "/api/place" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    const clean = (s) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
    const name = clean(b.name).slice(0, 20) || "someone", deviceId = clean(b.deviceId).slice(0, 64);
    const hat = b.hat == null || b.hat === "" ? null : String(b.hat);
    if (!deviceId) return json(res, 400, { error: "Missing deviceId." });
    if (!presets.getCharacter(String(b.presetId))) return json(res, 400, { error: "Pick one of the characters." });
    if (hat && !presets.hasHat(hat)) return json(res, 400, { error: "Unknown hat." });
    const limit = store.deviceAllowance(deviceId);
    if (limit) return json(res, 429, { error: limit });
    const w = queue.place({ presetId: String(b.presetId), hat, name, deviceId });
    return json(res, 200, { id: w.id, pin: store.getPrivate(w.id).pin });
  }
  if ((m === "GET" || m === "HEAD") && p.startsWith("/presets/")) {
    const f = presets.resolveFile(p.slice("/presets/".length));
    return f ? sendFile(req, res, f) : none(res, 404);
  }

  if (p === "/api/pet" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    const w = store.get(String(b.id));
    const pin = store.getPrivate(String(b.id)).pin;
    const k = req.socket.remoteAddress + String(b.id), now = Date.now();
    if (now - (petAt.get(k) || 0) < 300) return json(res, 429, { error: "Easy! Try again in a second." });
    petAt.set(k, now);
    if (!w || !pin || String(b.pin) !== pin) return json(res, 403, { error: "Wrong pet # or PIN." });
    const patch = {};
    if ("status" in b) patch.note = b.status == null ? null : String(b.status).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || null;
    if ("mood" in b) {
      if (!["normal", "sleep", "moody"].includes(b.mood)) return json(res, 400, { error: "Unknown mood." });
      patch.mood = b.mood;
    }
    store.update(w, patch);
    return json(res, 200, { ok: true, status: w.note ?? null, mood: w.mood || "normal" });
  }

  if (p === "/api/poke" && m === "POST") {
    let b; try { b = await readBody(req); } catch { return none(res, 400); }
    const dev = String(b.deviceId || "anon").slice(0, 64), now = Date.now();
    if (now - (pokeAt.get(dev) || 0) > 250) { pokeAt.set(dev, now); store.poke(String(b.id)); }
    return none(res);
  }

  if (p === "/api/host-link" && m === "GET") return isLocal(req) ? json(res, 200, { url: hostUrl(req) }) : json(res, 403, { error: "localhost only" }); // console shows it
  if (p.startsWith("/api/host/")) return hostApi(req, res, p, m);
  if ((m === "GET" || m === "HEAD") && p.startsWith("/scenes/")) { // host-made rooms live in commons-world/scenes; voiddeck falls through to public/scenes
    const [, , sid, file] = p.split("/");
    const mine = /^[a-z0-9-]+$/.test(sid || "") && ["background.png", "scene.json"].includes(file) ? path.join(scene.SCENES, sid, file) : null;
    if (mine && fs.existsSync(mine)) return sendFile(req, res, mine);
  }

  if (p.startsWith("/api/admin/")) {
    if (!isLocal(req)) return json(res, 403, { error: "localhost only" });
    if (m !== "POST") return none(res, 405);
    let b; try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request." }); }
    if (p === "/api/admin/wish") {
      const text = String(b.text ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
      if (text.length < 3) return json(res, 400, { error: "A wish is 3 to 120 characters." });
      const name = String(b.name ?? "").replace(/\s+/g, " ").trim().slice(0, 20) || "someone";
      const w = queue.submit({ text, name, deviceId: "admin" }, { admin: true });
      return json(res, 200, { id: w.id });
    }
    if (p === "/api/admin/veto") { queue.veto(String(b.id)); return none(res); }
    return none(res, 404);
  }

  if (p === "/qr.svg" && m === "GET") {
    const svg = await QRCode.toString(publicUrl(req) + "/wish", { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "no-cache", "x-wish-url": publicUrl(req) + "/wish" });
    return res.end(svg);
  }

  if ((m === "GET" || m === "HEAD") && p.startsWith("/things/")) {
    const [, , id, file] = p.split("/");
    if (!/^[a-z0-9]+$/.test(id || "") || !["thing.js", "sprite.png", "patch.png", "frames.png", "anim.json"].includes(file)) return none(res, 404);
    return sendFile(req, res, path.join(store.THINGS, id, file));
  }

  if (m === "GET" || m === "HEAD") {
    if (PAGES[p]) {
      if (p === "/console" && !isLocal(req)) return json(res, 403, { error: "localhost only" });
      return sendFile(req, res, path.join(PUBLIC, PAGES[p]));
    }
    const file = path.join(PUBLIC, p);
    if (file.startsWith(PUBLIC + path.sep) && !p.endsWith("/console.html")) return sendFile(req, res, file);
  }
  none(res, 404);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => { console.error(e); if (!res.headersSent) json(res, 500, { error: "server error" }); else res.end(); });
});

await store.init();
queue.resume();
server.listen(PORT, () => {
  console.log(`The Commons is up.`);
  console.log(`  projector  http://localhost:${PORT}/world`);
  console.log(`  console    http://localhost:${PORT}/console`);
  console.log(`  phones     ${publicUrl()}/wish${process.env.PUBLIC_URL ? "" : "   (set PUBLIC_URL for a tunnel)"}`);
  console.log(`  host       ${hostUrl()}`);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(0));
