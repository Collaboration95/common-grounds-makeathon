// Image generation (sprites, bleed patches, one-off assets) via POST /v1/images/generations.
// IMAGE_MODEL defaults to gpt-image-2.5-flare: same speed as gpt-image-2 here, and it supports
// real transparency (gpt-image-2 rejects background:"transparent"). If transparency is rejected we
// retry on flat white and key the white out ourselves.
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { execFile } from "node:child_process";
import { thingDir } from "./store.mjs";

const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-flare";
const QUALITY = process.env.IMAGE_QUALITY || "low";
const STYLE = "warm slightly faded paper-cutout illustration, gouache texture, dark brown ink outline, single character, full body, centred, no text, no ground, no shadow";

// ---- tiny PNG codec (8-bit RGB/RGBA, non-interlaced: what the API returns) ----
export function decodePng(buf) {
  let off = 8, w, h, ct, idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("latin1", off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0 || ![2, 6].includes(ct)) throw new Error("unsupported png"); }
    else if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(w * h * 4);
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    raw.copy(cur, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let add = 0;
      if (f === 1) add = a; else if (f === 2) add = b; else if (f === 3) add = (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = (cur[i] + add) & 255;
    }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; px[o] = cur[x * bpp]; px[o + 1] = cur[x * bpp + 1]; px[o + 2] = cur[x * bpp + 2]; px[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255; }
    cur.copy(prev);
  }
  return { w, h, px };
}
export function encodePng({ w, h, px }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, "latin1"); data.copy(b, 8); b.writeUInt32BE(zlib.crc32(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Flood-fill near-white pixels from the border to transparent, with a soft 1px edge. */
export function keyOutWhite(pngBuf) {
  const { w, h, px } = decodePng(pngBuf), bg = new Uint8Array(w * h), stack = [];
  const white = (i) => px[i * 4] > 232 && px[i * 4 + 1] > 232 && px[i * 4 + 2] > 232;
  const push = (i) => { if (!bg[i] && white(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w);
  }
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) { px[i * 4 + 3] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    if ((x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w])) px[i * 4 + 3] = 150;
  }
  return encodePng({ w, h, px });
}

const sips = (args) => new Promise((res, rej) => execFile("sips", args, { timeout: 30000 }, (e) => (e ? rej(e) : res())));

let busy = 0; const waiting = [];
const slot = async () => { if (busy >= 5) await new Promise((r) => waiting.push(r)); busy++; return () => { busy--; waiting.shift()?.(); }; };

/**
 * Returns PNG bytes. opts: { size, quality, model, transparent }.
 * transparent:true asks for a real alpha channel (falls back to white keying).
 */
export async function generate(prompt, { size = "1024x1024", quality = QUALITY, model = MODEL, transparent = true, timeoutMs = 75000 } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("no OPENAI_API_KEY");
  const release = await slot();
  try {
    const call = async (p, extra) => {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model, prompt: p, size, quality, n: 1, ...extra }), signal: AbortSignal.timeout(timeoutMs),
      });
      const j = await r.json();
      if (!r.ok) throw Object.assign(new Error(j.error?.message || `images ${r.status}`), { param: j.error?.param });
      return Buffer.from(j.data[0].b64_json, "base64");
    };
    if (!transparent) return await call(prompt, {});
    try { return await call(prompt + ", transparent background", { background: "transparent" }); }
    catch (e) {
      if (e.param !== "background") throw e;
      return keyOutWhite(await call(prompt + ", on a plain flat pure white background, no checkerboard", {}));
    }
  } finally { release(); }
}

/** Save a PNG and downscale its longest side with sips (keeps alpha). */
export async function savePng(bytes, file, maxPx) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp.png";
  fs.writeFileSync(tmp, bytes);
  if (maxPx) await sips(["-Z", String(maxPx), tmp]).catch(() => {}); // if sips is missing we keep the full-size file
  fs.renameSync(tmp, file);
}

export const spritePrompt = (desc) => `${desc}. ${STYLE}`;

/** Draws things/<id>/sprite.png. Resolves true/false; never throws. */
export async function drawSprite(id, desc) {
  try {
    await savePng(await generate(spritePrompt(desc)), path.join(thingDir(id), "sprite.png"), 256);
    return true;
  } catch (e) { console.error(`sprite ${id} failed:`, e.message); return false; }
}

/** Draws things/<id>/patch.png (the bleed ground patch). Resolves true/false; never throws. */
export async function drawPatch(id, label) {
  try {
    const p = `a small soft-edged patch of ${label} ground seen at a low 3/4 angle, fading to transparent at the edges, no objects, warm paper-cutout gouache texture`;
    await savePng(await generate(p), path.join(thingDir(id), "patch.png"), 512);
    return true;
  } catch (e) { console.error(`patch ${id} failed:`, e.message); return false; }
}
