// Slice a 4x2 sprite sheet into one normalised horizontal strip + anim.json.
//   node tools/slice-sheet.mjs <sheet.png> <outDir>
// Row 1 = 4-frame walk (facing right); row 2 = idle, sit, sleep, action. Writes outDir/frames.png + outDir/anim.json.
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const COLS = 4, MAX_H = 256, PAD = 4, A = 20;

/** Slice a sheet file; returns the anim.json object (also written to outDir). */
export function sliceSheet(sheetPath, outDir, layout = "auto") {
  const png = PNG.sync.read(fs.readFileSync(sheetPath));
  const { width: W, height: H, data } = png;
  let ROWS = layout === "4x3" ? 3 : layout === "4x2" ? 2 : 0;
  let cw, ch;

  // flat background (no real transparency)? key the border colours (white, a solid colour, a painted checkerboard) in each cell
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) clear++;
  const flat = clear < data.length / 4 * 0.02;

  const grid = (rows) => {
    cw = Math.floor(W / COLS); ch = Math.floor(H / rows);
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
      const g = Buffer.alloc(cw * ch * 4);
      for (let y = 0; y < ch; y++) data.copy(g, y * cw * 4, ((r * ch + y) * W + c * cw) * 4, ((r * ch + y) * W + c * cw + cw) * 4);
      if (flat) keyBackground(g, cw, ch);
      out.push(cropCell(g, cw, ch));
    }
    return out;
  };
  let cells;
  if (ROWS) cells = grid(ROWS);
  else { cells = grid(3); ROWS = 3; if (cells.filter(Boolean).length < 12) { cells = grid(2); ROWS = 2; } }
  const N = ROWS * COLS;
  const live = cells.filter(Boolean);
  if (live.length < N) throw new Error(`only ${live.length}/${N} cells have a character`);
  // a cell that is still a full rectangle kept its background: better to redraw than show a box
  const boxed = cells.filter((c) => c.w >= cw * 0.97 && c.h >= ch * 0.97).length;
  if (boxed >= 3) throw new Error(`background left in ${boxed}/${N} cells`);

  // ONE scale for all frames: the tallest frame fits MAX_H
  const maxW = Math.max(...cells.map((c) => c.w)), maxH = Math.max(...cells.map((c) => c.h));
  const k = Math.min(1, (MAX_H - PAD) / maxH);
  const fw = Math.ceil(maxW * k) + PAD * 2, fh = Math.ceil(maxH * k) + PAD * 2;
  const out = new PNG({ width: fw * N, height: fh });
  out.data.fill(0);
  cells.forEach((cell, i) => {
    const sw = Math.max(1, Math.round(cell.w * k)), sh = Math.max(1, Math.round(cell.h * k));
    const ox = i * fw + Math.round((fw - sw) / 2), oy = fh - PAD - sh; // bottom-centre
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const px = boxSample(cell, x / k, y / k, 1 / k);
      const o = ((oy + y) * out.width + ox + x) * 4;
      out.data[o] = px[0]; out.data[o + 1] = px[1]; out.data[o + 2] = px[2]; out.data[o + 3] = px[3];
    }
  });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "frames.png"), PNG.sync.write(out));
  const anims = ROWS === 3 ? { walk: [0, 1, 2, 3], fly: [4, 5, 6, 7], idle: [8], sit: [9], sleep: [10], action: [11] } : { walk: [0, 1, 2, 3], idle: [4], sit: [5], sleep: [6], action: [7] };
  const anim = { frameW: fw, frameH: fh, count: N, anims, facing: "right" };
  fs.writeFileSync(path.join(outDir, "anim.json"), JSON.stringify(anim));
  return { ...anim, flatBackground: flat, sheet: [W, H], scale: +k.toFixed(3) };
}

/** No real alpha: the colours along the cell's edge are the background. Flood them out from the edges (the dark outline stops it). */
function keyBackground(g, w, h) {
  const buckets = new Map(); // 4-bit colour bucket -> [count, r, g, b]
  let edge = 0;
  const tally = (p) => {
    const i = p * 4, k = ((g[i] >> 4) << 8) | ((g[i + 1] >> 4) << 4) | (g[i + 2] >> 4), b = buckets.get(k) || [0, 0, 0, 0];
    b[0]++; b[1] += g[i]; b[2] += g[i + 1]; b[3] += g[i + 2]; buckets.set(k, b); edge++;
  };
  for (let x = 0; x < w; x++) { tally(x); tally((h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { tally(y * w); tally(y * w + w - 1); }
  const pal = [];
  for (let got = 0, sorted = [...buckets.values()].sort((a, b) => b[0] - a[0]); pal.length < 4 && got < edge * 0.9 && sorted[pal.length];) {
    const b = sorted[pal.length]; got += b[0]; pal.push([b[1] / b[0], b[2] / b[0], b[3] / b[0]]);
  }
  const diff = (i, c) => Math.max(Math.abs(g[i] - c[0]), Math.abs(g[i + 1] - c[1]), Math.abs(g[i + 2] - c[2]));
  const isBg = (i, tol) => pal.some((c) => diff(i, c) <= tol);
  const step = (i, j) => Math.max(Math.abs(g[i] - g[j]), Math.abs(g[i + 1] - g[j + 1]), Math.abs(g[i + 2] - g[j + 2])) <= 6; // soft gradients
  const seen = new Uint8Array(w * h), stack = [];
  const push = (x, y, from) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (seen[p] || !(isBg(p * 4, 26) || (from >= 0 && step(p * 4, from * 4)))) return;
    seen[p] = 1; stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0, -1); push(x, h - 1, -1); }
  for (let y = 0; y < h; y++) { push(0, y, -1); push(w - 1, y, -1); }
  while (stack.length) { const p = stack.pop(), x = p % w, y = (p / w) | 0; g[p * 4 + 3] = 0; push(x + 1, y, p); push(x - 1, y, p); push(x, y + 1, p); push(x, y - 1, p); }
  // soften the halo: background-ish pixels touching the keyed area become half transparent
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x;
    if (!seen[p] && g[p * 4 + 3] && (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w]) && isBg(p * 4, 48)) g[p * 4 + 3] = 90;
  }
}

/** Keep the biggest connected blob (plus blobs near it, so detached ears/tails survive); return {w,h,px} cropped to its bbox. */
function cropCell(g, w, h) {
  const lab = new Int32Array(w * h), comps = [];
  for (let s = 0; s < w * h; s++) {
    if (lab[s] || g[s * 4 + 3] <= A) continue;
    const id = comps.length + 1, st = [s]; lab[s] = id;
    const c = { id, n: 0, x0: w, y0: h, x1: -1, y1: -1 };
    while (st.length) {
      const p = st.pop(), x = p % w, y = (p / w) | 0; c.n++;
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (!lab[q] && g[q * 4 + 3] > A) { lab[q] = id; st.push(q); }
      }
    }
    comps.push(c);
  }
  if (!comps.length) return null;
  const big = comps.reduce((a, b) => (b.n > a.n ? b : a));
  const gap = Math.max(w, h) * 0.04;
  const keep = new Set(comps.filter((c) => c === big || (c.n > big.n * 0.01 && c.x1 >= big.x0 - gap && c.x0 <= big.x1 + gap && c.y1 >= big.y0 - gap && c.y0 <= big.y1 + gap)).map((c) => c.id));
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let p = 0; p < w * h; p++) if (keep.has(lab[p])) { const x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cw = x1 - x0 + 1, chh = y1 - y0 + 1, px = Buffer.alloc(cw * chh * 4);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const p = (y0 + y) * w + x0 + x, o = (y * cw + x) * 4;
    if (keep.has(lab[p])) g.copy(px, o, p * 4, p * 4 + 4);
  }
  return { w: cw, h: chh, px };
}

/** Area-average sample (premultiplied) of a box of size `s` source pixels at (sx, sy). */
function boxSample(c, sx, sy, s) {
  const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(c.w, Math.max(x0 + 1, Math.ceil(sx + s))), y1 = Math.min(c.h, Math.max(y0 + 1, Math.ceil(sy + s)));
  let r = 0, g = 0, b = 0, a = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * c.w + x) * 4, al = c.px[o + 3];
    r += c.px[o] * al; g += c.px[o + 1] * al; b += c.px[o + 2] * al; a += al; n++;
  }
  if (!n || !a) return [0, 0, 0, 0];
  return [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a / n)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), li = args.indexOf("--layout"), layout = li >= 0 ? args.splice(li, 2)[1] : "auto";
  const [sheet, out] = args;
  if (!sheet || !out) { console.error("usage: node tools/slice-sheet.mjs <sheet.png> <outDir> [--layout 4x3|4x2]"); process.exit(2); }
  try { console.log(JSON.stringify(sliceSheet(sheet, out, layout))); } catch (e) { console.error(e.message); process.exit(1); }
}
