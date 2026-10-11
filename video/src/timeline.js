// The Commons, 24s. Deterministic: window.renderAt(t) draws the exact frame; window.ensure(t) preloads then draws.
// Motif: every creature is a 4x3 sprite sheet (12 frames). Transitions are cell flips + pixel dissolves.
(() => {
const Q = new URLSearchParams(location.search);
const W = +Q.get("w") || 1080, H = +Q.get("h") || 1920;
const MODE = H / W > 1.3 ? "v" : W / H > 1.3 ? "h" : "s";
const S = Math.min(W, H) / 1080;
const C = document.getElementById("c"); C.width = W; C.height = H;
const ctx = C.getContext("2d");
const mk = (w = W, h = H) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const CA = mk(), CB = mk(), CT = mk(), GA = CA.getContext("2d"), GB = CB.getContext("2d"), GT = CT.getContext("2d");

const P = { night: "#1d1424", ink: "#3b2414", cream: "#fbf3e2", amber: "#f2a65a", lamp: "#ffd27a", teal: "#5fb3a1", coral: "#e0694a" };
const DISP = '"Avenir Next Condensed","Avenir Next","Helvetica Neue",sans-serif';
const MONO = '"SF Mono",Menlo,Monaco,monospace';
const BEAT = 0.5;

// ---------- timing (overridden by media.json / cues.json) ----------
const T = {
  build: 2, sheet: 6, arrival: 9, room: 13, pet: 17, end: 21, dur: 24,
  steps: [2.0, 2.5, 3.0, 4.0, 4.5, 5.5],
  stepWords: ["CHECKING", "IN THE\nQUEUE", "CODEX IS\nWRITING IT", "TESTING IT", "DRAWING IT", "LIVE!"],
  petSegs: [["PICK", 17.0, 17.5], ["SURPRISE", 17.5, 18.0], ["PIN", 18.0, 18.5], ["STATUS", 18.5, 19.0], ["MOODY", 19.0, 20.0], ["SLEEP", 20.0, 20.5], ["POKE", 20.5, 21.0]],
};
let MJ = { clips: {}, wish: "a durian in sunglasses", arrival: {}, room: {} };
let CUES = null;

// ---------- helpers ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  out: (x) => 1 - Math.pow(1 - cl(x), 3),
  io: (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  back: (x) => { x = cl(x); const c = 2.2; return 1 + c * Math.pow(x - 1, 3) + (c - 1) * Math.pow(x - 1, 2); },
};
const st = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;
const rnd = (n) => { n = Math.imul(n ^ (n >>> 15), 1 | n); n ^= n + Math.imul(n ^ (n >>> 7), 61 | n); return ((n ^ (n >>> 14)) >>> 0) / 4294967296; };
const lerp = (a, b, k) => a + (b - a) * k;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---------- assets ----------
const IM = {}; const FR = new Map(); const missing = new Set();
const loadImg = (url) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
const STILLS = {
  durian: "/video/assets/stills/durian-frames.png",
  photo: "/video/assets/stills/venue-photo.jpg",
  redraw: "/video/assets/stills/venue-redraw.png",
  void: "/video/assets/stills/voiddeck.png",
  world: "/docs/screens/04-world-room-only.png",
  wish: "/docs/screens/06-wish-wish-tab.png",
  pet: "/docs/screens/10-wish-control-my-pet.png",
  pick: "/docs/screens/07-wish-pick-tab.png",
};
const WALKERS = ["kopi", "oyen", "kaya-turtle", "merlion-pup", "bishan-otter", "auntie-trolley", "kachang-yeti", "karung-guni-radio"];
let CODE = [];

async function boot() {
  try { MJ = Object.assign(MJ, await (await fetch("/video/src/media.json?" + Math.random())).json()); } catch {}
  try { CUES = await (await fetch("/video/audio/cues.json?" + Math.random())).json(); } catch {}
  if (MJ.timing) Object.assign(T, MJ.timing);
  await Promise.all([
    ...Object.entries(STILLS).map(async ([k, u]) => (IM[k] = await loadImg(u))),
    ...WALKERS.map(async (k) => (IM["w_" + k] = await loadImg(`/docs/screens/sprites/${k}.png`))),
  ]);
  try {
    const txt = await (await fetch("/video/assets/stills/durian-thing.js")).text();
    CODE = txt.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).slice(0, 80);
  } catch {}
  makeGrain();
}

// clips: media.json clips[key] = {dir, fps, n, ext, crop?:[x,y,w,h], w, h}
function clipFrame(key, lt) {
  const c = MJ.clips[key]; if (!c) return null;
  const i = cl(Math.floor(lt * c.fps + 1e-6), 0, c.n - 1);
  const url = `${c.dir}/${String(i + 1).padStart(4, "0")}.${c.ext || "jpg"}`;
  const im = FR.get(url);
  if (!im) { missing.add(url); // fall back to nearest cached for continuity
    for (let d = 1; d < 4; d++) for (const j of [i - d, i + d]) { const u = `${c.dir}/${String(j + 1).padStart(4, "0")}.${c.ext || "jpg"}`; if (FR.get(u)) return mediaOf(FR.get(u), c); }
    return null; }
  return mediaOf(im, c);
}
const mediaOf = (img, c) => ({ img, sx: c.crop ? c.crop[0] : 0, sy: c.crop ? c.crop[1] : 0, sw: c.crop ? c.crop[2] : img.width, sh: c.crop ? c.crop[3] : img.height });
const still = (k, crop) => { const img = IM[k]; if (!img) return null; return { img, sx: crop ? crop[0] : 0, sy: crop ? crop[1] : 0, sw: crop ? crop[2] : img.width, sh: crop ? crop[3] : img.height }; };
function media(key, lt, fallback) { return clipFrame(key, lt) || fallback; }
async function ensure(t) {
  for (let k = 0; k < 6; k++) {
    missing.clear(); renderAt(t);
    if (!missing.size) return;
    await Promise.all([...missing].map(async (u) => { const i = await loadImg(u); if (i) FR.set(u, i); else FR.set(u, mk(2, 2)); }));
    if (FR.size > 90) { let n = FR.size - 60; for (const key of FR.keys()) { if (n-- <= 0) break; if (!missing.has(key)) FR.delete(key); } }
  }
}

// ---------- grain / vignette ----------
const grainTiles = []; let vig = null;
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = mk(256, 256), g = c.getContext("2d"), d = g.createImageData(256, 256);
    for (let i = 0; i < 65536; i++) { const r = rnd(i * 7 + k * 99991), v = r < 0.5 ? 255 : 0; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = rnd(i * 13 + k * 31) * 26; }
    g.putImageData(d, 0, 0); grainTiles.push(g.createPattern(c, "repeat"));
  }
  vig = mk(); const g = vig.getContext("2d");
  const r = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  r.addColorStop(0, "rgba(20,10,25,0)"); r.addColorStop(1, "rgba(20,10,25,0.55)"); g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function grain(g, t, a = 1) {
  const f = Math.floor(t * 12), p = grainTiles[f % 6]; if (!p) return;
  g.save(); g.globalAlpha = a; g.translate(Math.floor(rnd(f) * 256), Math.floor(rnd(f + 77) * 256)); g.fillStyle = p; g.fillRect(-256, -256, W + 512, H + 512); g.restore();
}

// ---------- text ----------
const font = (size, w = 900) => `${w} ${size}px ${DISP}`;
function fitSize(g, s, maxW, size, f = font) { g.font = f(size); const w = g.measureText(s).width; return w > maxW ? size * maxW / w : size; }
function text(g, s, x, y, o = {}) {
  g.save(); g.font = o.mono ? `${o.weight || 600} ${o.size}px ${MONO}` : font(o.size, o.weight || 900);
  g.fillStyle = o.color || P.cream; g.textAlign = o.align || "left"; g.textBaseline = o.base || "alphabetic"; g.globalAlpha = o.alpha ?? 1;
  if (o.sp) g.letterSpacing = o.sp + "px";
  g.fillText(s, x, y); g.restore();
}
// kinetic word: letters slam in (12fps stepping) from time 0, exit after dur
function slam(g, word, cx, cy, size, lt, o = {}) {
  if (lt < 0) return;
  const lines = word.split("\n"), color = o.color || P.cream, dur = o.dur ?? 99;
  g.save(); g.font = font(size); g.textBaseline = "middle"; g.textAlign = "left";
  const lh = size * 0.92; let idx = 0;
  lines.forEach((ln, li) => {
    const wTot = g.measureText(ln).width, x0 = cx - wTot / 2, y = cy + (li - (lines.length - 1) / 2) * lh;
    let x = x0;
    for (const ch of ln) {
      const cw = g.measureText(ch).width, d = idx * 0.032; idx++;
      const p = Math.floor(cl((lt - d) / 0.2) * 5) / 5, ex = cl((lt - dur - d * 0.5) / 0.18);
      if (p > 0 && ex < 1) {
        const k = E.back(p);
        g.save(); g.translate(x + cw / 2, y + (1 - E.out(p)) * -size * 0.55);
        g.scale(1 + (1 - k) * -0.1, (0.6 + 0.4 * k) * (1 - ex)); g.globalAlpha = p;
        g.fillStyle = o.shadow || "rgba(0,0,0,.35)"; g.fillText(ch, -cw / 2 + size * 0.04, size * 0.045);
        g.fillStyle = color; g.fillText(ch, -cw / 2, 0); g.restore();
      }
      x += cw;
    }
  });
  g.restore();
}

// ---------- backgrounds ----------
function nightBg(g, t, o = {}) {
  g.fillStyle = P.night; g.fillRect(0, 0, W, H);
  const beat = Math.exp(-((t % BEAT)) * 9);
  const gl = g.createRadialGradient(o.gx ?? W * 0.5, o.gy ?? H * 0.55, 0, o.gx ?? W * 0.5, o.gy ?? H * 0.55, Math.max(W, H) * 0.7);
  gl.addColorStop(0, `rgba(242,166,90,${0.16 + 0.07 * beat})`); gl.addColorStop(1, "rgba(242,166,90,0)");
  g.fillStyle = gl; g.fillRect(0, 0, W, H);
  // the 12-cell grid motif, faint
  const cols = MODE === "v" ? 3 : 4, rows = MODE === "v" ? 4 : 3, cw = W / cols, ch = H / rows;
  g.strokeStyle = "rgba(251,243,226,.07)"; g.lineWidth = 2;
  for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, H); g.stroke(); }
  for (let j = 1; j < rows; j++) { g.beginPath(); g.moveTo(0, j * ch); g.lineTo(W, j * ch); g.stroke(); }
  g.fillStyle = "rgba(251,243,226,.22)";
  for (let i = 1; i < cols; i++) for (let j = 1; j < rows; j++) g.fillRect(i * cw - 6, j * ch - 1, 12, 2), g.fillRect(i * cw - 1, j * ch - 6, 2, 12);
}
function hudStrip(g, t, onCream = false) {
  const n = 12, gap = 8 * S, m = 56 * S, y = (MODE === "v" ? 70 : 34) * S, w = (W - 2 * m - gap * (n - 1)) / n, h = 10 * S;
  for (let k = 0; k < n; k++) {
    const p = cl(t / 2 - k), on = p >= 1, cur = p > 0 && p < 1;
    g.fillStyle = onCream ? "rgba(59,36,20,.18)" : "rgba(251,243,226,.16)"; g.fillRect(m + k * (w + gap), y, w, h);
    g.fillStyle = on ? (onCream ? P.ink : P.cream) : P.amber;
    if (on || cur) g.fillRect(m + k * (w + gap), y, w * (on ? 1 : st(p, 12) ), h);
  }
}

// ---------- phone / media ----------
function drawMedia(g, m, x, y, w, h, o = {}) {
  if (!m) { g.fillStyle = "#2a1c33"; g.fillRect(x, y, w, h); return; }
  const z = o.zoom || 1, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  const s = Math.max(w / m.sw, h / m.sh) * z, vw = w / s, vh = h / s;
  const cx = cl(m.sx + m.sw * fx, m.sx + vw / 2, m.sx + m.sw - vw / 2), cy = cl(m.sy + m.sh * fy, m.sy + vh / 2, m.sy + m.sh - vh / 2);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(m.img, cx - vw / 2, cy - vh / 2, vw, vh, x, y, w, h); g.restore();
}
function phone(g, r, m, o = {}) {
  const rad = r.w * 0.11, b = 10 * S;
  g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); if (o.rot) g.rotate(o.rot); if (o.scale) g.scale(o.scale, o.scale); g.translate(-r.w / 2, -r.h / 2);
  g.shadowColor = "rgba(242,166,90,.35)"; g.shadowBlur = 60 * S; g.shadowOffsetY = 20 * S; g.fillStyle = "#120b17"; rr(g, -b, -b, r.w + 2 * b, r.h + 2 * b, rad + b); g.fill();
  g.shadowColor = "transparent"; g.strokeStyle = "rgba(251,243,226,.5)"; g.lineWidth = 2; g.stroke();
  rr(g, 0, 0, r.w, r.h, rad); g.clip(); drawMedia(g, m, 0, 0, r.w, r.h, o);
  g.restore();
}
function cellCard(g, x, y, w, h, o = {}) {
  g.save(); g.fillStyle = o.fill || P.cream; g.strokeStyle = o.stroke || P.ink; g.lineWidth = 3 * S;
  rr(g, x, y, w, h, 10 * S); g.fill(); g.stroke(); g.restore();
}
function frameAt(g, img, idx, x, y, w, h, smooth) {
  if (!img) return; const fw = img.width / 12;
  g.save(); g.imageSmoothingEnabled = !!smooth; g.imageSmoothingQuality = "high";
  g.drawImage(img, idx * fw, 0, fw, img.height, x, y, w, h); g.restore();
}
// draw a sprite frame fitted (contain) into a box, bottom aligned
function sprite(g, img, idx, bx, by, bw, bh, o = {}) {
  if (!img) return; const fw = img.width / 12, fh = img.height, k = Math.min(bw / fw, bh / fh) * (o.k || 1), w = fw * k, h = fh * k;
  g.save(); g.imageSmoothingEnabled = k < 1; g.imageSmoothingQuality = "high";
  if (o.flip) { g.translate(bx + bw / 2, 0); g.scale(-1, 1); g.translate(-(bx + bw / 2), 0); }
  g.drawImage(img, idx * fw, 0, fw, fh, bx + (bw - w) / 2, (o.top ? by : by + bh - h), w, h); g.restore();
}

// ---------- transitions ----------
function flipGrid(g, A, B, p, cols, rows, back = P.amber) {
  g.fillStyle = P.night; g.fillRect(0, 0, W, H);
  const cw = W / cols, ch = H / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const d = ((i + j) / (cols + rows - 2)) * 0.45 + rnd(i * 31 + j * 7) * 0.1;
    const q = st(cl((p - d) / 0.45), 12), x = i * cw, y = j * ch;
    const src = q < 0.5 ? A : B, k = q < 0.5 ? 1 - 2 * q : 2 * q - 1;
    if (q === 0 || q === 1) { g.drawImage(src, x, y, cw, ch, x, y, cw, ch); continue; }
    const w = cw * Math.max(0.02, k), dx = x + (cw - w) / 2;
    g.drawImage(src, x, y, cw, ch, dx, y, w, ch);
    g.fillStyle = `rgba(29,20,36,${0.55 * (1 - k)})`; g.fillRect(dx, y, w, ch);
    g.fillStyle = back; g.fillRect(dx, y + 0, Math.max(2, 3 * S), ch);
    g.fillStyle = back; g.fillRect(dx + w - Math.max(2, 3 * S), y, Math.max(2, 3 * S), ch);
  }
}
let maskC = null;
function dissolve(g, A, B, p, blk = 24) {
  g.drawImage(A, 0, 0);
  const bs = blk * S, mw = Math.ceil(W / bs), mh = Math.ceil(H / bs);
  if (!maskC || maskC.width !== mw) { maskC = mk(mw, mh); }
  const mg = maskC.getContext("2d"), d = mg.createImageData(mw, mh), pp = st(p, 12) * 1.25 - 0.12;
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const v = rnd(y * 977 + x * 31 + 5) * 0.7 + (x / mw * 0.15 + y / mh * 0.15);
    const a = v < pp ? 255 : 0, o = (y * mw + x) * 4; d.data[o] = d.data[o + 1] = d.data[o + 2] = 255; d.data[o + 3] = a;
  }
  mg.putImageData(d, 0, 0);
  GT.clearRect(0, 0, W, H); GT.globalCompositeOperation = "source-over"; GT.drawImage(B, 0, 0);
  GT.globalCompositeOperation = "destination-in"; GT.imageSmoothingEnabled = false; GT.drawImage(maskC, 0, 0, mw, mh, 0, 0, mw * bs, mh * bs);
  GT.globalCompositeOperation = "source-over"; g.drawImage(CT, 0, 0);
}

// ---------- scenes ----------
const phoneRect = () => MODE === "v" ? { w: 545, h: 1180, x: (W - 545) / 2, y: H - 1180 - 56 }
  : MODE === "s" ? { w: 410, h: 888, x: 70, y: 96 } : { w: 434, h: 940, x: 210, y: 90 };
const wordBox = () => MODE === "v" ? { cx: W / 2, cy: 400, maxW: W - 110, size: 230 }
  : MODE === "s" ? { cx: 765, cy: 520, maxW: 500, size: 150 } : { cx: 1290, cy: 500, maxW: 1000, size: 250 };
const pulse = (t) => Math.exp(-(t % BEAT) * 14);

function hookPhone(t) { return media("phone", t, still("wish", [0, 0, 750, 1624])); }
function buildPhone(t) { return media("phone", t, still("wish", [0, 0, 750, 1624])); }

function sceneBuild(g, t) {
  nightBg(g, t, { gx: W * 0.5, gy: H * 0.6 });
  // streaming real thing.js
  if (t > T.build - 0.2) {
    const fs = Math.round((MODE === "h" ? 26 : 30) * S), lh = fs * 1.35, rows = Math.ceil(H / lh) + 1;
    const total = Math.max(0, (t - T.build) * 70 * (MODE === "h" ? 1.4 : 1)), lines = [];
    let rem = total, i = 0;
    while (rem > 0 && i < CODE.length * 2) { const ln = CODE[i % CODE.length]; const take = Math.min(ln.length, rem); lines.push(ln.slice(0, Math.floor(take))); rem -= ln.length + 4; i++; }
    const visible = lines.slice(-rows); const y0 = H - visible.length * lh - 20 * S;
    g.save(); g.font = `600 ${fs}px ${MONO}`; g.textBaseline = "top";
    visible.forEach((ln, k) => {
      const last = k === visible.length - 1, fade = last ? 1 : 0.18 + 0.2 * (k / visible.length);
      const kw = /^\s*(init|update|me\.|world\.|const|let|if|else|for|return|export)/.test(ln);
      g.fillStyle = last ? P.lamp : kw ? P.teal : P.amber; g.globalAlpha = fade;
      g.fillText(ln, 36 * S, y0 + k * lh);
    });
    if (visible.length && (Math.floor(t * 4) % 2 === 0)) { g.globalAlpha = 1; g.fillStyle = P.lamp; const lw = g.measureText(visible[visible.length - 1]).width; g.fillRect(36 * S + lw + 4, y0 + (visible.length - 1) * lh, fs * 0.55, fs); }
    g.restore();
    text(g, "CODEX  >  thing.js", MODE === "v" ? 36 * S : phoneRect().x + phoneRect().w + 50 * S, (MODE === "v" ? 150 : 70) * S, { mono: true, size: 26 * S, color: P.teal, sp: 2 });
  }
  hudStrip(g, t);
  // step words
  const wb = wordBox(); let si = -1;
  T.steps.forEach((s, i) => { if (t >= s - 1e-6) si = i; });
  const colors = [P.cream, P.teal, P.amber, P.teal, P.lamp, P.cream];
  if (si >= 0) {
    const s0 = T.steps[si], word = T.stepWords[si], lt = t - s0, last = si === T.steps.length - 1;
    const size = fitSize(g, word.split("\n").sort((a, b) => b.length - a.length)[0], wb.maxW, wb.size);
    if (last) { // LIVE! panel
      const k = E.back(cl(lt / 0.2)); g.fillStyle = P.amber; const bw = wb.maxW, bh = size * 1.25;
      g.save(); g.translate(wb.cx, wb.cy); g.scale(1, Math.max(0.01, st(k, 12))); g.fillRect(-bw / 2, -bh / 2, bw, bh); g.restore();
    }
    // step counter
    text(g, `${String(si + 1).padStart(2, "0")} / 06`, wb.cx, wb.cy - (word.includes("\n") ? 1.28 : 0.85) * size * 0.9, { mono: true, size: 30 * S, color: colors[si], align: "center", sp: 4 });
    const shake = lt < 0.12 ? (rnd(Math.floor(t * 30)) - 0.5) * 10 * S : 0;
    g.save(); g.translate(shake, 0);
    slam(g, word, wb.cx, wb.cy, size, lt, { color: last ? P.night : colors[si], shadow: last ? "rgba(0,0,0,0)" : undefined });
    g.restore();
    // underline bar sweeping at 12fps
    if (!last) { const bw = Math.min(wb.maxW, size * 0.6 * Math.max(...word.split("\n").map((l) => l.length))) * st(E.out(lt / 0.4), 12); g.fillStyle = colors[si]; g.globalAlpha = 0.9; g.fillRect(wb.cx - bw / 2, wb.cy + (word.includes("\n") ? 1.05 : 0.62) * size * 0.9, bw, 8 * S); g.globalAlpha = 1; }
  }
  if (t > 1.9) text(g, "wish \u2192 live creature in about a minute", MODE === "s" ? Math.min(wb.cx, W - 40 * S - 300 * S) : wb.cx, wb.cy + (MODE === "v" ? 330 : 360) * S - (MODE === "v" ? 0 : 20), { mono: true, size: (MODE === "s" ? 18 : 22) * S, color: "rgba(251,243,226,.6)", align: "center", sp: MODE === "s" ? 0 : 2, alpha: cl((t - 2) / 0.5) });
  // phone
  const r = phoneRect(), rise = E.out(cl((t - 0.9) / 0.5));
  const slide = MODE === "v" ? { y: r.y + (1 - st(rise, 12)) * (H - r.y + 40) } : { x: r.x - (1 - st(rise, 12)) * (r.x + r.w + 80) };
  const pr = { ...r, ...slide };
  phone(g, pr, t < T.build ? hookPhone(t) : buildPhone(t));
  // hook: caret + typed wish
  sceneHookText(g, t);
}
function sceneHookText(g, t) {
  const wish = MJ.wish, wb = MODE === "v" ? { cx: W / 2, cy: 400, w: W - 150, size: 128 } : MODE === "s" ? { cx: 765, cy: 520, w: 460, size: 84 } : { cx: 1290, cy: 520, w: 900, size: 130 };
  if (t > T.build - 0.0) return; // text yields to the first kinetic word
  const n = Math.floor(cl((t - 0.35) / 1.2) * wish.length), s = wish.slice(0, n);
  g.save(); g.font = font(wb.size); const words = s.split(" "), lines = []; let cur = "";
  for (const w of (wish.split(" "))) { /* layout on the full wish so lines don't reflow */ const test = cur ? cur + " " + w : w; if (g.measureText(test).width > wb.w && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur); g.restore();
  const lh = wb.size * 0.95, y0 = wb.cy - ((lines.length - 1) * lh) / 2; let used = 0;
  let caretX = wb.cx, caretY = y0;
  lines.forEach((ln, i) => {
    const shown = ln.slice(0, Math.max(0, n - used)); used += ln.length + 1;
    g.save(); g.font = font(wb.size); const fw = g.measureText(ln).width; g.restore();
    text(g, shown, wb.cx - fw / 2, y0 + i * lh, { size: wb.size, color: P.cream });
    if (n - (used - ln.length - 1) >= 0 && n <= used) { g.save(); g.font = font(wb.size); caretX = wb.cx - fw / 2 + g.measureText(shown).width; g.restore(); caretY = y0 + i * lh; }
  });
  const on = t < 0.35 ? Math.floor(t / 0.25) % 2 === 0 : (n < wish.length ? true : Math.floor(t / 0.25) % 2 === 0);
  if (on) { g.fillStyle = P.lamp; g.fillRect(caretX + 8 * S, caretY - wb.size * 0.78, wb.size * 0.14, wb.size * 0.85); }
  text(g, "ONE WISH", wb.cx, y0 - wb.size * 1.1 - (lines.length - 1) * lh / 2, { mono: true, size: 28 * S, color: P.teal, align: "center", sp: 8, alpha: cl(t / 0.3) });
}

// --- SHEET ---
const ANIMS = ["walk", "walk", "walk", "walk", "fly", "fly", "fly", "fly", "idle", "rest", "sleep", "special"];
function sheetGeom() {
  if (MODE === "v") { const cw = 255, ch = cw * 260 / 299, gap = 14; return { cw, ch, gap, x: (W - (4 * cw + 3 * gap)) / 2, y: 470, hero: { x: 90, y: 470 + 3 * ch + 2 * gap + 70, w: W - 180, h: 520 } }; }
  if (MODE === "s") { const cw = 236, ch = cw * 260 / 299, gap = 12; return { cw, ch, gap, x: (W - (4 * cw + 3 * gap)) / 2, y: 340, hero: { x: 240, y: 300, w: 600, h: 620 } }; }
  const cw = 262, ch = cw * 260 / 299, gap = 14; return { cw, ch, gap, x: 90, y: 300, hero: { x: 90 + 4 * cw + 3 * gap + 70, y: 230, w: 560, h: 700 } };
}
const cellXY = (G, i) => ({ x: G.x + (i % 4) * (G.cw + G.gap), y: G.y + Math.floor(i / 4) * (G.ch + G.gap) });
function sceneSheet(g, t) {
  nightBg(g, t, { gx: W * 0.5, gy: H * 0.45 }); hudStrip(g, t);
  const lt = t - T.sheet, G = sheetGeom(), img = IM.durian;
  const playing = t >= T.sheet + 2, pf = playing ? Math.floor((t - (T.sheet + 2)) * 12) % 12 : -1;
  // heading
  const hy = MODE === "v" ? 250 : MODE === "s" ? 150 : 150, hx = MODE === "h" ? G.x : W / 2;
  const head = lt < 2 ? "TWELVE CELLS" : "ONE CREATURE";
  slam(g, "TWELVE\nCELLS", MODE === "h" ? G.x + (4 * G.cw + 3 * G.gap) / 2 : W / 2, MODE === "v" ? 300 : MODE === "s" ? 150 : 150 + 0, MODE === "v" ? 170 : MODE === "s" ? 100 : 100, lt - 0.0, { color: P.cream, dur: 99 });
  if (MODE === "h") { /* heading sits above grid via G.y offset */ }
  text(g, "drawn by Codex  ·  walk · fly · idle · rest · sleep · special", MODE === "h" ? G.x : W / 2, MODE === "v" ? 430 : MODE === "s" ? 270 : G.y - 30 * S, { mono: true, size: 22 * S, color: P.teal, align: MODE === "h" ? "left" : "center", sp: 1, alpha: cl((lt - 0.4) / 0.4) });
  // cells
  for (let i = 0; i < 12; i++) {
    const { x, y } = cellXY(G, i), ti = i * 0.125, q = st(cl((lt - ti) / 0.28), 12);
    const hot = i === pf;
    g.save();
    if (q <= 0) { g.strokeStyle = "rgba(251,243,226,.18)"; g.setLineDash([8 * S, 8 * S]); g.lineWidth = 2; rr(g, x, y, G.cw, G.ch, 10 * S); g.stroke(); g.restore(); continue; }
    const k = q < 0.5 ? 1 - 2 * q : 2 * q - 1, w = Math.max(2, G.cw * k), dx = x + (G.cw - w) / 2;
    g.translate(dx, y);
    if (q < 0.5) { cellCard(g, 0, 0, w, G.ch, { fill: P.amber }); }
    else {
      g.save(); g.translate(w / 2, 0); g.scale(k, 1); g.translate(-G.cw / 2, 0);
      cellCard(g, 0, 0, G.cw, G.ch, { fill: hot ? P.lamp : P.cream, stroke: hot ? P.amber : P.ink });
      frameAt(g, img, i, G.cw * 0.06, G.ch * 0.06, G.cw * 0.88, G.ch * 0.88, true);
      text(g, String(i + 1).padStart(2, "0"), 10 * S, 22 * S, { mono: true, size: 15 * S, color: P.ink, alpha: 0.6 });
      if (i === 0 || i === 4 || i >= 8) text(g, ANIMS[i].toUpperCase(), G.cw - 10 * S, G.ch - 10 * S, { mono: true, size: 15 * S, color: P.ink, align: "right", alpha: 0.7, sp: 1 });
      g.restore();
    }
    g.restore();
  }
  // hero: plays the 12 frames at 12fps
  if (lt >= 1.9) {
    const h = G.hero, k = E.back(cl((lt - 1.9) / 0.3)), f = pf < 0 ? 0 : pf;
    g.save();
    if (MODE === "s") { g.fillStyle = "rgba(29,20,36,.78)"; g.fillRect(0, 0, W, H); }
    g.translate(h.x + h.w / 2, h.y + h.h / 2); g.scale(k, k); g.translate(-h.w / 2, -h.h / 2);
    cellCard(g, 0, 0, h.w, h.h, { fill: P.cream });
    g.fillStyle = "rgba(95,179,161,.25)"; g.fillRect(h.w * 0.1, h.h * 0.84, h.w * 0.8, 10 * S);
    sprite(g, img, f, h.w * 0.08, h.h * 0.06, h.w * 0.84, h.h * 0.8, { k: 1 });
    text(g, `${String(f + 1).padStart(2, "0")}/12  ${ANIMS[f]}`, h.w / 2, h.h - 22 * S, { mono: true, size: 26 * S, color: P.ink, align: "center", sp: 3 });
    g.restore();
  }
}

// --- ARRIVAL: the creature steps out of its cell into the real room capture ---
function roomMedia(t) { return media("arrival", t - T.arrival, still("world", [184, 103, 1553, 874])); }
function arrivalRect() { return MODE === "v" ? { x: 40, y: 330, w: W - 80, h: 1150 } : MODE === "s" ? { x: 50, y: 50, w: W - 100, h: H - 100 } : { x: 0, y: 0, w: W, h: H }; }
function sceneArrival(g, t) {
  nightBg(g, t, { gx: W / 2, gy: H / 2 }); hudStrip(g, t);
  const r = arrivalRect(), lt = t - T.arrival, A = MJ.arrival || {};
  const cam = A.cam ? camAt(A.cam, lt) : { fx: 0.5, fy: 0.55, zoom: 1 };
  g.save(); if (MODE !== "h") { rr(g, r.x, r.y, r.w, r.h, 18 * S); g.clip(); }
  drawMedia(g, roomMedia(t), r.x, r.y, r.w, r.h, cam); g.restore();
  if (MODE !== "h") { g.strokeStyle = "rgba(251,243,226,.5)"; g.lineWidth = 3 * S; rr(g, r.x, r.y, r.w, r.h, 18 * S); g.stroke(); }
  // sprite steps out of its cell: a 12fps walking durian card hops from the sheet's hero spot toward the room
  const G = sheetGeom(), h = G.hero, out = E.io(cl(lt / 0.8));
  if (lt < 0.9) {
    const x0 = h.x + h.w / 2, y0 = h.y + h.h / 2, x1 = r.x + r.w * 0.5, y1 = r.y + r.h * 0.62, k = lerp(1, 0.22, out);
    const x = lerp(x0, x1, out), y = lerp(y0, y1, out) - Math.sin(out * Math.PI) * 120 * S;
    g.save(); g.globalAlpha = 1 - cl((lt - 0.6) / 0.3); g.translate(x, y); g.scale(k, k);
    cellCard(g, -h.w / 2, -h.h / 2, h.w, h.h, { fill: P.cream });
    sprite(g, IM.durian, Math.floor(t * 12) % 4, -h.w / 2 + h.w * 0.08, -h.h / 2 + h.h * 0.06, h.w * 0.84, h.h * 0.8);
    g.restore();
  }
  // beat captions
  const caps = A.caps || [[0.5, "SCAFFOLD"], [1.5, "DROP"], [2.5, "BUILT BY CODEX"]];
  let cap = null; caps.forEach((c) => { if (lt >= c[0]) cap = c; });
  if (cap) {
    const by = MODE === "v" ? r.y + r.h + 90 : MODE === "s" ? H - 56 : H - 90, c = cl((lt - cap[0]) / 0.25);
    const size = (MODE === "h" ? 74 : 92) * S;
    g.save(); g.fillStyle = "rgba(29,20,36,.82)"; const tw = (g.font = font(size), g.measureText(cap[1]).width) + 70 * S;
    if (MODE === "v") { slam(g, cap[1], W / 2, by, 110, lt - cap[0], { color: P.lamp }); } else {
      g.translate(MODE === "h" ? 80 * S : W / 2 - tw / 2 + 0, by - size * 0.62); g.globalAlpha = c; g.fillRect(0, 0, tw, size * 1.2); g.fillStyle = P.lamp; g.fillRect(0, 0, 8 * S, size * 1.2);
      g.restore(); g.save(); text(g, cap[1], (MODE === "h" ? 80 * S : W / 2 - tw / 2) + 35 * S, by + size * 0.3, { size, color: P.lamp, alpha: c });
    }
    g.restore();
  }
}
function camAt(keys, lt) { // keys: [[t, fx, fy, zoom], ...] eased between
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (lt >= keys[i][0] && lt < keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; }
  const k = a === b ? 1 : E.io((lt - a[0]) / (b[0] - a[0]));
  return { fx: lerp(a[1], b[1], k), fy: lerp(a[2], b[2], k), zoom: lerp(a[3], b[3], k) };
}

// --- YOUR ROOM: venue photo pixel-dissolves into its paper redraw, then characters walk in ---
function sceneRoom(g, t) {
  nightBg(g, t, { gx: W / 2, gy: H / 2 }); hudStrip(g, t);
  const lt = t - T.room, R = MODE === "v" ? { x: 50, y: 640, w: W - 100, h: 1060 } : MODE === "s" ? { x: 50, y: 330, w: 640, h: 480 } : { x: 100, y: 120, w: 960, h: 720 };
  if (MODE === "s") { R.w = 980; R.h = 735; R.x = 50; R.y = 300; }
  // text
  const tb = MODE === "v" ? { cx: W / 2, cy: 360, size: 150, maxW: W - 120 } : MODE === "s" ? { cx: W / 2, cy: 150, size: 100, maxW: W - 100 } : { cx: 1480, cy: 400, size: 150, maxW: 700 };
  const words = [["POINT\nA PHONE", 0], ["AT ANY\nROOM.", 1.0]];
  const idx = lt >= 1.0 ? 1 : 0, sz = fitSize(g, "AT ANY", tb.maxW, tb.size);
  if (MODE === "s") { slam(g, lt >= 1 ? "POINT A PHONE\nAT ANY ROOM." : "POINT A PHONE", tb.cx, tb.cy, fitSize(g, "POINT A PHONE", tb.maxW, tb.size), lt, { color: P.cream }); }
  else slam(g, "POINT\nA PHONE", tb.cx, tb.cy, sz, lt - 0, { color: P.cream, dur: 0.95 }), slam(g, "AT ANY\nROOM.", tb.cx, tb.cy, sz, lt - 1.0, { color: P.lamp });
  // photo card (tilted polaroid) -> dissolve
  const tilt = (MODE === "h" ? -0.025 : 0) * (1 - E.out(lt / 0.6));
  g.save(); g.translate(R.x + R.w / 2, R.y + R.h / 2); g.rotate(tilt); g.translate(-R.w / 2, -R.h / 2);
  const pad = 14 * S; g.fillStyle = P.cream; g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 40 * S; g.shadowOffsetY = 16 * S; g.fillRect(-pad, -pad, R.w + 2 * pad, R.h + 2 * pad + 46 * S); g.shadowColor = "transparent";
  g.save(); g.beginPath(); g.rect(0, 0, R.w, R.h); g.clip();
  const drawPhoto = (c, x, y, w, h) => { const a = still("photo"); drawMedia(c, a, x, y, w, h); };
  const drawRedraw = (c, x, y, w, h) => { drawMedia(c, still("redraw"), x, y, w, h, { fx: 0.5, fy: 0.5 }); };
  const dp = cl((lt - 0.75) / 1.5), pw = Math.ceil(R.w / 8), ph = Math.ceil(R.h / 8);
  drawPhoto(g, 0, 0, R.w, R.h);
  if (dp > 0) {
    // pixel-grid dissolve inside the card
    const mw = Math.ceil(R.w / (16 * S)), mh = Math.ceil(R.h / (16 * S)), mc = mk(mw, mh), mg = mc.getContext("2d"), d = mg.createImageData(mw, mh), pp = st(dp, 12) * 1.25 - 0.1;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const v = rnd(y * 911 + x * 17 + 3) * 0.75 + x / mw * 0.25, o = (y * mw + x) * 4; d.data[o] = d.data[o + 1] = d.data[o + 2] = 255; d.data[o + 3] = v < pp ? 255 : 0; }
    mg.putImageData(d, 0, 0);
    const tc = mk(Math.ceil(R.w), Math.ceil(R.h)), tg = tc.getContext("2d"); drawRedraw(tg, 0, 0, tc.width, tc.height);
    tg.globalCompositeOperation = "destination-in"; tg.imageSmoothingEnabled = false; tg.drawImage(mc, 0, 0, mw, mh, 0, 0, mw * 16 * S, mh * 16 * S);
    g.drawImage(tc, 0, 0);
  }
  // the real projector capture of that redraw, creatures walking in, pixel-dissolves over it
  const sp = cl((lt - 2.0) / 0.5);
  if (sp > 0) {
    const sm = media("swap", lt - 2.0, null), tc2 = mk(Math.ceil(R.w), Math.ceil(R.h)), t2 = tc2.getContext("2d");
    drawMedia(t2, sm, 0, 0, tc2.width, tc2.height);
    if (sp < 1) { const bs = 24 * S, mw = Math.ceil(R.w / bs), mh = Math.ceil(R.h / bs), mc = mk(mw, mh), mg = mc.getContext("2d"), d = mg.createImageData(mw, mh), pp = st(sp, 12) * 1.2 - 0.1;
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const o = (y * mw + x) * 4; d.data[o + 3] = rnd(y * 433 + x * 29 + 11) < pp ? 255 : 0; }
      mg.putImageData(d, 0, 0); t2.globalCompositeOperation = "destination-in"; t2.imageSmoothingEnabled = false; t2.drawImage(mc, 0, 0, mw, mh, 0, 0, mw * bs, mh * bs); }
    g.drawImage(tc2, 0, 0);
  }
  // characters walk in (real sprites, 12fps stepping) once the redraw has landed
  const wt = lt - 2.5;
  if (wt > 0) {
    const walkers = MJ.room.clip ? [] : WALKERS.slice(0, 5);
    walkers.forEach((k, i) => {
      const im = IM["w_" + k], start = i * 0.25, p = cl((wt - start) / 1.4); if (p <= 0) return;
      const fx = lerp(-0.1, 0.12 + i * 0.17, E.out(p)), fy = 0.62 + (i % 3) * 0.1, f = p < 1 ? Math.floor(wt * 12) % 4 : 8 + (i % 2);
      sprite(g, im, f, R.w * fx - R.w * 0.07, R.h * fy - R.h * 0.2, R.w * 0.14, R.h * 0.2, { flip: false });
    });
  }
  g.restore();
  text(g, lt < 1.4 ? "the venue photo" : lt < 2.25 ? "its paper redraw" : "now it's the room", R.w / 2, R.h + 36 * S, { mono: true, size: 24 * S, color: P.ink, align: "center", sp: 3 });
  g.restore();
}

// --- YOUR PET: phone montage, creature frame mirrors the mood ---
function petSeg(t) { let cur = null; T.petSegs.forEach((s) => { if (t >= s[1] - 1e-6) cur = s; }); return cur || T.petSegs[0]; }
const PET_FRAME = { PICK: 0, SURPRISE: 0, PIN: 8, STATUS: 8, MOODY: 9, SLEEP: 10, POKE: 11 };
const PET_LABEL = { PICK: "PICK ONE", SURPRISE: "SURPRISE ME", PIN: "PIN 196", STATUS: "STATUS", MOODY: "MOODY", SLEEP: "SLEEP", POKE: "POKE!" };
const PET_SUB = { PICK: "or pick a ready-made pet", SURPRISE: "+ a hat: crown", PIN: "your pet #13, yours to control", STATUS: "\u201cshipping The Commons\u201d", MOODY: "a rain cloud follows it", SLEEP: "it naps in the room", POKE: "special attack, everyone sees it" };
function scenePet(g, t) {
  nightBg(g, t, { gx: W / 2, gy: H / 2 }); hudStrip(g, t);
  const seg = petSeg(t), lt = t - seg[1], r = phoneRect();
  const pr = MODE === "v" ? { w: 520, h: 1126, x: 60, y: 700 } : MODE === "s" ? { w: 410, h: 888, x: 70, y: 96 } : { w: 434, h: 940, x: 340, y: 70 };
  const fb = still("pet", [0, 0, 750, 1624]);
  // sub-clip flip: each seg a fast cell flip
  const m = media("pet.phone", t - T.pet, fb);
  const flipK = cl(lt / 0.2), sc = st(flipK, 12);
  g.save(); g.translate(pr.x + pr.w / 2, pr.y + pr.h / 2); g.scale(lt < 0.2 ? 0.55 + 0.45 * sc / 1 * 1 : 1, 1); g.translate(-(pr.x + pr.w / 2), -(pr.y + pr.h / 2));
  phone(g, pr, m); g.restore();
  // kinetic label
  const wbx = MODE === "v" ? { cx: W / 2, cy: 380, size: 260, maxW: W - 120 } : MODE === "s" ? { cx: 765, cy: 330, size: 170, maxW: 520 } : { cx: 1280, cy: 330, size: 300, maxW: 900 };
  slam(g, PET_LABEL[seg[0]], wbx.cx, wbx.cy, fitSize(g, PET_LABEL[seg[0]], wbx.maxW, wbx.size), lt, { color: seg[0] === "POKE" ? P.lamp : P.cream });
  g.save(); g.font = `600 ${26 * S}px ${MONO}`; const subW = g.measureText(PET_SUB[seg[0]]).width + 6 * S * PET_SUB[seg[0]].length * 0.5; g.restore();
  const subX = MODE === "v" ? wbx.cx : Math.min(wbx.cx, W - 40 * S - subW / 2);
  text(g, PET_SUB[seg[0]], subX, wbx.cy - wbx.size * (MODE === "v" ? 0.62 : 0.55), { mono: true, size: 26 * S, color: P.teal, align: "center", sp: 3, alpha: cl((lt - 0.15) / 0.2) });
  // mirrored creature on a cell card + mini 12-grid
  const cardR = MODE === "v" ? { x: pr.x + pr.w + 30, y: pr.y + 30, w: W - (pr.x + pr.w + 30) - 30, h: 0 } : null;
  let cx, cy, cw, chh;
  if (MODE === "v") { cw = W - (pr.x + pr.w) - 60; cw = Math.max(cw, 0); }
  const cardW = MODE === "v" ? 0 : MODE === "s" ? 380 : 520, cardH = cardW * 1.1;
  if (MODE !== "v") {
    cx = MODE === "s" ? 590 : 1040; cy = MODE === "s" ? 540 : 480 ; cw = cardW; chh = cardH;
    const wob = Math.floor(t * 12) % 2;
    cellCard(g, cx, cy, cw, chh, { fill: P.cream });
    const f = seg[0] === "POKE" ? (lt < 0.1 ? 8 : 11) : seg[0] === "PICK" || seg[0] === "SURPRISE" ? Math.floor(t * 12) % 4 : PET_FRAME[seg[0]];
    sprite(g, IM["w_karung-guni-radio"], f, cx + cw * 0.06, cy + chh * 0.06 + wob * 2, cw * 0.88, chh * 0.78);
    text(g, `${String(f + 1).padStart(2, "0")}/12`, cx + cw / 2, cy + chh - 18 * S, { mono: true, size: 24 * S, color: P.ink, align: "center", sp: 3 });
    if (seg[0] === "MOODY") rain(g, cx, cy, cw, chh, t); if (seg[0] === "SLEEP") zzz(g, cx + cw * 0.6, cy + chh * 0.25, t);
  } else {
    // vertical: creature card beside the phone
    cx = pr.x + pr.w + 36; cw = W - cx - 50; chh = cw * 1.05; cy = pr.y + 40;
    cellCard(g, cx, cy, cw, chh, { fill: P.cream });
    const f = seg[0] === "PICK" || seg[0] === "SURPRISE" ? Math.floor(t * 12) % 4 : PET_FRAME[seg[0]];
    sprite(g, IM["w_karung-guni-radio"], f, cx + cw * 0.04, cy + chh * 0.06, cw * 0.92, chh * 0.78);
    text(g, `${String(f + 1).padStart(2, "0")}`, cx + cw / 2, cy + chh - 16 * S, { mono: true, size: 24 * S, color: P.ink, align: "center", sp: 3 });
    if (seg[0] === "MOODY") rain(g, cx, cy, cw, chh, t); if (seg[0] === "SLEEP") zzz(g, cx + cw * 0.6, cy + chh * 0.25, t);
    // mini 12-grid indicator
    const mw = cw / 4 - 6, mh = mw * 0.8; for (let i = 0; i < 12; i++) { const mx = cx + (i % 4) * (mw + 6), my = cy + chh + 30 + Math.floor(i / 4) * (mh + 6); g.fillStyle = i === f ? P.lamp : "rgba(251,243,226,.15)"; g.fillRect(mx, my, mw, mh); }
  }
  // segment pips (5)
  T.petSegs.forEach((s, i) => { const on = t >= s[1]; g.fillStyle = on ? P.lamp : "rgba(251,243,226,.2)"; const px = (MODE === "h" ? 1040 : MODE === "s" ? 590 : 60) + i * 44 * S, py = (MODE === "v" ? 600 : MODE === "s" ? 980 : 1010) * (MODE === "h" ? 1 : 1) - (MODE === "h" ? 0 : 0); if (MODE !== "h") g.fillRect(px, py - 0, 30 * S, 10 * S); else g.fillRect(px, 1010 * 0 + 940, 30 * S, 10 * S); });
}
function rain(g, x, y, w, h, t) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = "#5fb3a1"; g.lineWidth = 3 * S; for (let i = 0; i < 26; i++) { const px = x + rnd(i * 5) * w, sp = 300 + rnd(i * 9) * 200, py = y + ((rnd(i * 3) * h + st(t, 12) * sp) % (h + 40)) - 20; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 6 * S, py + 22 * S); g.stroke(); } g.restore(); }
function zzz(g, x, y, t) { for (let i = 0; i < 3; i++) { const k = ((st(t, 6) * 0.9 + i / 3) % 1); text(g, "z", x + k * 60 * S + i * 10, y - k * 120 * S, { size: (30 + i * 20) * S, color: P.night, alpha: 1 - k }); } }

// --- END ---
function sceneEnd(g, t) {
  g.fillStyle = P.cream; g.fillRect(0, 0, W, H);
  const lt = t - T.end;
  // paper tint
  const gl = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); gl.addColorStop(0, "rgba(255,210,122,.45)"); gl.addColorStop(1, "rgba(242,166,90,.0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  hudStrip(g, t, true);
  // 12-frame sprite grid, decorative (cells pop in on 16ths), the pet walks along
  const cols = MODE === "v" ? 4 : 6, rows = 12 / cols, cw = MODE === "v" ? 215 : MODE === "s" ? 150 : 150, ch = cw * 260 / 299, gap = 10 * S;
  const gw = cols * cw + (cols - 1) * gap, gx = (W - gw) / 2, gy = MODE === "v" ? 1130 : MODE === "s" ? 700 : 680;
  for (let i = 0; i < 12; i++) {
    const q = st(cl((lt - 0.3 - i * 0.06) / 0.25), 12); if (q <= 0) continue;
    const x = gx + (i % cols) * (cw + gap), y = gy + Math.floor(i / cols) * (ch + gap), k = q < .5 ? 1 - 2 * q : 2 * q - 1, w = Math.max(2, cw * k);
    g.save(); g.translate(x + cw / 2, y); g.scale(k, 1); g.translate(-cw / 2, 0);
    if (q < .5) cellCard(g, 0, 0, cw, ch, { fill: P.amber }); else { cellCard(g, 0, 0, cw, ch, { fill: "#fff9ec" }); frameAt(g, IM.durian, i, cw * 0.06, ch * 0.06, cw * 0.88, ch * 0.88, true); }
    g.restore();
  }
  const ts = fitSize(g, "THE COMMONS", W - 120 * S, MODE === "v" ? 270 : MODE === "s" ? 190 : 270);
  const ty = MODE === "v" ? 520 : MODE === "s" ? 230 : 250;
  if (MODE === "v") { slam(g, "THE\nCOMMONS", W / 2, ty, fitSize(g, "COMMONS", W - 100, 300), lt - 0.5, { color: P.ink, shadow: "rgba(242,166,90,.8)" }); }
  else slam(g, "THE COMMONS", W / 2, ty, ts, lt - 0.5, { color: P.ink, shadow: "rgba(242,166,90,.8)" });
  const sy = MODE === "v" ? 800 : MODE === "s" ? 380 : 440;
  slam(g, "a room that builds itself", W / 2, sy, (MODE === "v" ? 72 : MODE === "s" ? 56 : 80) * 1, lt - 1.0, { color: P.coral, shadow: "rgba(0,0,0,0)" });
  const cy2 = sy + (MODE === "v" ? 150 : 100);
  const line1 = "Every creature written, tested & drawn live by Codex";
  const fs = (MODE === "v" ? 36 : 28) * S; g.save(); g.font = `700 ${fs}px ${MONO}`; const lw = g.measureText(line1).width; g.restore();
  const maxw = W - 100 * S, fs2 = lw > maxw ? fs * maxw / lw : fs;
  if (lt >= 1.5) {
    const n = Math.floor(cl((lt - 1.5) / 0.7) * line1.length);
    text(g, line1.slice(0, n), W / 2 - (lw * fs2 / fs) / 2, cy2 + (MODE === "v" ? 40 : 0), { mono: true, size: fs2, color: P.ink, weight: 700 });
    if (n < line1.length || Math.floor(lt * 4) % 2 === 0) { g.fillStyle = P.coral; g.fillRect(W / 2 - (lw * fs2 / fs) / 2 + g.measureText("").width + (g.save(), g.font = `700 ${fs2}px ${MONO}`, g.measureText(line1.slice(0, n)).width) + 4, cy2 + (MODE === "v" ? 40 : 0) - fs2 * 0.85, fs2 * 0.5, fs2); g.restore(); }
  }
  if (lt >= 2.0) text(g, "Common Ground Makeathon  ·  Singapore  ·  11 Oct 2026", W / 2, H - (MODE === "v" ? 120 : 52) * S, { mono: true, size: 24 * S, color: P.ink, align: "center", sp: 2, alpha: cl((lt - 2.0) / 0.3) * 0.75 });
  // the creature walks along the bottom row of the paper
  if (lt >= 0.8) { const p = cl((lt - 0.8) / 2.2), x = lerp(-120, W + 120, p); sprite(g, IM.durian, Math.floor(t * 12) % 4, x - 90, (MODE === "v" ? gy - 20 : gy - 140) - 120 * 0, 180, 150, { top: false }); }
}

// ---------- composition ----------
const SC = [
  { s: 0, e: T.sheet, draw: sceneBuild },
  { s: T.sheet, e: T.arrival, draw: sceneSheet },
  { s: T.arrival, e: T.room, draw: sceneArrival },
  { s: T.room, e: T.pet, draw: sceneRoom },
  { s: T.pet, e: T.end, draw: scenePet },
  { s: T.end, e: T.dur, draw: sceneEnd },
];
const TR = [
  { at: T.sheet, kind: "dissolve" }, { at: T.arrival, kind: "flip" }, { at: T.room, kind: "dissolve" },
  { at: T.pet, kind: "flip" }, { at: T.end, kind: "flip", back: P.coral },
];
const sceneAt = (t) => { for (let i = SC.length - 1; i >= 0; i--) if (t >= SC[i].s - 1e-9) return i; return 0; };
function renderAt(t) {
  t = cl(t, 0, T.dur - 1e-4);
  const HALF = 0.25; let tr = null;
  TR.forEach((x, i) => { if (t >= x.at - HALF && t < x.at + HALF) tr = { ...x, i }; });
  const loop = false;
  if (tr) {
    const a = SC[tr.i], b = SC[tr.i + 1], p = (t - (tr.at - HALF)) / (2 * HALF);
    a.draw(GA, t); b.draw(GB, t);
    if (tr.kind === "flip") flipGrid(ctx, CA, CB, p, MODE === "v" ? 3 : 4, MODE === "v" ? 4 : 3, tr.back || P.amber); else dissolve(ctx, CA, CB, p);
  } else if (loop) {
    const p = (t - (T.dur - 0.5)) / 0.5; SC[5].draw(GA, t); SC[0].draw(GB, 0);
    flipGrid(ctx, CA, CB, p, MODE === "v" ? 3 : 4, MODE === "v" ? 4 : 3, P.night);
  } else SC[sceneAt(t)].draw(ctx, t);
  // global finish: vignette + beat flash + grain
  ctx.save(); ctx.globalAlpha = 1; if (vig) ctx.drawImage(vig, 0, 0); ctx.restore();
  const bf = (T.steps.concat([T.sheet, T.arrival, T.room, T.pet, T.end])).reduce((m, s) => (t >= s && t - s < 0.12 ? Math.max(m, 1 - (t - s) / 0.12) : m), 0);
  if (bf > 0) { ctx.fillStyle = `rgba(255,210,122,${0.14 * bf})`; ctx.fillRect(0, 0, W, H); }
  grain(ctx, t, 1);
}
window.renderAt = renderAt; window.ensure = ensure; window.TL = { T, W, H, MODE };
window.ready = boot().then(() => { renderAt(0); return true; });
})();
