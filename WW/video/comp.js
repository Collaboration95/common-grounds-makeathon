// "Who's Hiding?" promo: one deterministic timeline drawn on a canvas.
// renderFrame(t) paints time t (seconds); setSize(w, h) picks the aspect (9:16, 1:1 or 16:9).
// Cue times here must match sound.py (120 BPM, one beat = 0.5 s).

export const DUR = 21;
const cvs = document.getElementById('c');
const ctx = cvs.getContext('2d');
let W, H, PORT, LAND;

export function setSize(w, h) {
  W = cvs.width = w; H = cvs.height = h;
  PORT = h / w > 1.2; LAND = w / h > 1.2;
}

// ---------- palette and type (lifted from the site's style.css and THEMES) ----------
const INK = '#17120e', PAPER = '#fbf3df', EDGE = '#3b2a1c', RED = '#d8432f', GOLD = '#ffcf4a', KERMIT = '#7bd44a';
const F = { hawker: 'Bungee', hall: '"Cinzel Decorative"', shire: '"Uncial Antiqua"', cantina: 'Audiowide', ui: 'Fredoka' };

// ---------- maths ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eo3 = x => 1 - (1 - x) ** 3;
const ei3 = x => x * x * x;
const eio = x => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };
const elastic = x => (x <= 0 ? 0 : x >= 1 ? 1 : 2 ** (-9 * x) * Math.sin((x * 9 - 0.75) * (2 * Math.PI / 3)) + 1);
const pop = (t, a, d = 0.3) => back(seg(t, a, a + d));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// Keyframes: [[t, value, ease?], ...]; values are numbers or arrays.
function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = eio] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const x = e(seg(t, t0, t1));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], x)) : lerp(v0, v1, x);
    }
  }
  return keys.at(-1)[1];
}

// ---------- assets ----------
const A = {};
const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) });

// Crop an RGBA portrait (full-scene size, transparent except the guest) to the guest.
function cutout(im) {
  const c = canvas(im.width, im.height), x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) {
    if (d[(y * c.width + i) * 4 + 3] > 40) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  const o = canvas(x1 - x0 + 1, y1 - y0 + 1);
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  o.at = { x: x0, y: y0 };
  return o;
}

// Sticker: upscale crisply, then add a thick paper outline and a hard drop shadow.
function sticker(src, scale, line) {
  const pad = line * 2 + 4, w = src.width * scale, h = src.height * scale;
  const big = canvas(w, h), b = big.getContext('2d');
  b.imageSmoothingEnabled = false; b.drawImage(src, 0, 0, w, h);
  const sil = canvas(w, h), s = sil.getContext('2d');
  s.drawImage(big, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = PAPER; s.fillRect(0, 0, w, h);
  const o = canvas(w + pad * 2, h + pad * 2), x = o.getContext('2d');
  for (let a = 0; a < 24; a++) x.drawImage(sil, pad + Math.cos(a / 24 * 2 * Math.PI) * line, pad + Math.sin(a / 24 * 2 * Math.PI) * line);
  x.globalCompositeOperation = 'destination-over';
  x.globalAlpha = 0.55; x.filter = 'brightness(0)'; x.drawImage(o, line * 0.4, line * 0.9); x.filter = 'none'; x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  x.drawImage(big, pad, pad);
  return o;
}

// Round face crop for the suspects strip.
function face(src, cx, cy, r, size = 220) {
  const o = canvas(size, size), x = o.getContext('2d');
  x.fillStyle = '#2c2219'; x.fillRect(0, 0, size, size);
  x.drawImage(src, cx - r, cy - r, r * 2, r * 2, 0, 0, size, size);
  return o;
}

// The wall of worlds, feathered and blended like the site's front page.
const WALL = { w: 4178, h: 1904 };
function buildWall() {
  const c = canvas(WALL.w, WALL.h), x = c.getContext('2d');
  for (const t of A.tiles) {
    const tc = canvas(1536, 1024), tx = tc.getContext('2d');
    tx.drawImage(t.img, 0, 0);
    tx.globalCompositeOperation = 'destination-in';
    for (const [x1, y1] of [[1536, 0], [0, 1024]]) {
      const g = tx.createLinearGradient(0, 0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.14, '#000'); g.addColorStop(0.86, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tx.fillStyle = g; tx.fillRect(0, 0, 1536, 1024);
    }
    x.drawImage(tc, t.x, t.y);
  }
  return c;
}

export async function load() {
  const S = 'assets/scenes/';
  const [hc, gh, sh, ct, qd, kP, gP, pP, sP] = await Promise.all([
    'codex-hawker-centre-scene.webp', 'codex-great-hall-scene.webp', 'codex-shire-party-scene.webp', 'codex-cantina-scene.webp',
    'mv3eyoo6-the-case-of-missing-omnioculars-scene.webp', 'codex-hawker-centre-portrait.png', 'codex-shire-party-portrait.png',
    'codex-cantina-portrait.png', 'mv3eyoo6-the-case-of-missing-omnioculars-portrait.png',
  ].map(f => img(S + f)));
  Object.assign(A, { hc, gh, sh, ct, qd });
  A.qr = await (await fetch('assets/qr.json')).json();
  A.kermit = cutout(kP);
  A.kSticker = sticker(A.kermit, 6, 10);
  A.kCard = sticker(A.kermit, 3, 5);
  A.shrekCard = (() => { // Shrek has no clean cutout: a framed crop of his head from the scene.
    const o = canvas(240, 240), x = o.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(gh, 448, 486, 60, 60, 0, 0, 240, 240); return o;
  })();
  const gol = cutout(gP), pad = cutout(pP), sher = cutout(sP);
  const headOf = (c, k = 0.32) => face(c, c.width / 2, Math.min(c.height * 0.3, c.width * 0.45), Math.max(c.width, c.height) * k);
  A.faces = [
    headOf(A.kermit, 0.3), face(gh, 478, 516, 30), headOf(gol), headOf(pad), headOf(sher),
  ];
  A.tiles = [
    { img: sh, x: 1321, y: 0, font: F.shire }, { img: qd, x: 2642, y: 0, font: F.shire }, { img: hc, x: 0, y: 0, font: F.hawker },
    { img: ct, x: 660, y: 880, font: F.cantina }, { img: gh, x: 1981, y: 880, font: F.hall },
  ];
  A.wall = buildWall();
  await Promise.all(['400 40px Bungee', '900 40px "Cinzel Decorative"', '700 40px "Cinzel Decorative"', '400 40px "Uncial Antiqua"',
    '400 40px Audiowide', '700 40px Fredoka', '500 40px Fredoka'].map(f => document.fonts.load(f)));
}

// ---------- drawing helpers ----------
function sceneXf(im, [cx, cy, z], fy = 0.5) {
  const s = Math.max(W / im.width, H / im.height) * z;
  return {
    s,
    ox: clamp(W / 2 - cx * s, W - im.width * s, 0),
    oy: clamp(H * fy - cy * s, H - im.height * s, 0),
  };
}
const toScreen = (xf, [x, y]) => [xf.ox + x * xf.s, xf.oy + y * xf.s];
function drawXf(im, xf) { ctx.drawImage(im, xf.ox, xf.oy, im.width * xf.s, im.height * xf.s); }

// Draw a scene with camera motion blur: average several sub-frame camera positions when it moves fast.
function drawScene(im, camAt, t, filter = 'none', shutter = 1.2, threshold = 14) {
  const xf = sceneXf(im, camAt(t));
  const prev = sceneXf(im, camAt(t - 1 / 30));
  const speed = Math.hypot(xf.ox - prev.ox, xf.oy - prev.oy) + Math.abs(xf.s - prev.s) * 400;
  const n = speed > threshold ? 10 : 1;
  ctx.save(); ctx.filter = filter;
  for (let k = 0; k < n; k++) {
    ctx.globalAlpha = 1 / (k + 1);
    drawXf(im, n === 1 ? xf : sceneXf(im, camAt(t - (k / n) * (shutter / 30))));
  }
  ctx.restore();
  return xf;
}

function font(size, fam, weight = 400) { ctx.font = `${weight} ${Math.round(size)}px ${fam}`; }
function fitSize(text, fam, weight, maxW, maxSize) {
  font(100, fam, weight);
  return Math.min(maxSize, (maxW / ctx.measureText(text).width) * 100);
}
// Display type: fill + thick ink outline + hard drop shadow, like the site's headings.
function title(text, x, y, size, fam, { fill = PAPER, weight = 400, line = 0.12, shadow = 0.07, align = 'center', alpha = 1, scale = 1, rot = 0 } = {}) {
  if (alpha <= 0 || scale <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  font(size, fam, weight); ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * line; ctx.strokeStyle = INK; ctx.fillStyle = INK;
  ctx.strokeText(text, 0, size * shadow); ctx.fillText(text, 0, size * shadow);
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(text, 0, 0);
  ctx.restore();
}

function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
// Paper panel with the site's chunky border and offset shadow.
function panel(x, y, w, h, r = 16, b = 4) {
  ctx.fillStyle = EDGE; rrect(x, y + b * 1.6, w, h, r); ctx.fill();
  ctx.fillStyle = PAPER; rrect(x, y, w, h, r); ctx.fill();
  ctx.lineWidth = b; ctx.strokeStyle = EDGE; rrect(x, y, w, h, r); ctx.stroke();
}

function wrap(text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  return [...out, line];
}
// Speech bubble anchored at (ax, ay) with the tail pointing at it; dir = -1 bubble above, +1 below.
function bubble(text, ax, ay, size, maxW, s, dir = -1, fam = F.ui) {
  if (s <= 0) return;
  font(size, fam, 700);
  const lines = wrap(text, maxW), lh = size * 1.18;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.3, h = lines.length * lh + size * 0.8;
  const bx = clamp(ax - w / 2, W * 0.04, W * 0.96 - w);
  if (dir < 0 && ay - size * 0.9 - h < H * 0.03) dir = 1;
  if (dir > 0 && ay + size * 0.9 + h > H * 0.97) { dir = -1; }
  const by = dir < 0 ? ay - size * 0.9 - h : ay + size * 0.9;
  ctx.save();
  ctx.translate(ax, ay); ctx.scale(s, s); ctx.translate(-ax, -ay);
  panel(bx, by, w, h, size * 0.5, size * 0.14);
  const ty = dir < 0 ? by + h : by;
  ctx.fillStyle = PAPER; ctx.strokeStyle = EDGE; ctx.lineWidth = size * 0.14;
  ctx.beginPath(); ctx.moveTo(ax - size * 0.45, ty); ctx.lineTo(ax, ay); ctx.lineTo(ax + size * 0.45, ty); ctx.fill(); ctx.stroke();
  ctx.fillRect(ax - size * 0.38, ty + (dir < 0 ? -size * 0.2 : 0), size * 0.76, size * 0.2);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + size * 0.4 + lh * (i + 0.5)));
  ctx.restore();
}

// The magnifier from the game: a 2.5x pixel-sharp view of the scene under it.
function loupe(im, xf, p, R, mag, { ring = PAPER, shakeX = 0 } = {}) {
  if (R <= 1) return;
  let [sx, sy] = toScreen(xf, p); sx += shakeX;
  ctx.save();
  // handle
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = EDGE; rrect(R * 0.9, -R * 0.13, R * 0.95, R * 0.26, R * 0.1); ctx.fill();
  ctx.fillStyle = '#6b4a2f'; rrect(R * 1.05, -R * 0.09, R * 0.75, R * 0.18, R * 0.08); ctx.fill();
  ctx.restore();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = R * 0.25; ctx.shadowOffsetY = R * 0.06;
  ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  const s2 = xf.s * mag;
  ctx.drawImage(im, sx - p[0] * s2, sy - p[1] * s2, im.width * s2, im.height * s2);
  const g = ctx.createRadialGradient(sx - R * 0.35, sy - R * 0.4, 0, sx, sy, R);
  g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = g; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
  ctx.restore();
  ctx.lineWidth = R * 0.075; ctx.strokeStyle = ring; ctx.stroke();
  ctx.beginPath(); ctx.arc(sx, sy, R * 1.04, 0, Math.PI * 2); ctx.lineWidth = R * 0.03; ctx.strokeStyle = EDGE; ctx.stroke();
  ctx.restore();
  return [sx, sy];
}

// Red "not me" cross stamped on the loupe.
function stamp(x, y, R, t0, t) {
  const k = seg(t, t0, t0 + 0.12), fade = 1 - seg(t, t0 + 0.75, t0 + 0.95);
  if (k <= 0 || fade <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2); ctx.scale(lerp(2.2, 1, eo3(k)), lerp(2.2, 1, eo3(k)));
  ctx.globalAlpha = fade * k; ctx.lineCap = 'round';
  for (const [w, c] of [[R * 0.3, INK], [R * 0.2, RED]]) {
    ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath();
    ctx.moveTo(-R * 0.5, -R * 0.5); ctx.lineTo(R * 0.5, R * 0.5); ctx.moveTo(R * 0.5, -R * 0.5); ctx.lineTo(-R * 0.5, R * 0.5); ctx.stroke();
  }
  ctx.restore();
}

// The site's "Find" card: paper, red FIND, portrait, name in the world's typeface.
function findCard(t, t0, tOut, pic, name, fam, accentName) {
  const k = pop(t, t0, 0.35) * (1 - eo3(seg(t, tOut, tOut + 0.25)));
  if (k <= 0) return;
  const w = LAND ? 250 : 270, h = w * 1.22, m = LAND ? 36 : 44;
  const x = PORT ? W - m - w : m, y = PORT ? H * 0.07 : H - m - h - 8;
  ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.3); ctx.translate(-(x + w / 2), -y);
  panel(x, y, w, h, 18, 5);
  font(w * 0.085, F.ui, 700); ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${w * 0.03}px`; ctx.fillText('FIND', x + w / 2, y + w * 0.11); ctx.letterSpacing = '0px';
  const pw = w * 0.74, ph = pw * 0.86, px = x + (w - pw) / 2, py = y + w * 0.2;
  ctx.save(); rrect(px, py, pw, ph, 10); ctx.clip(); ctx.fillStyle = '#efe4c6'; ctx.fillRect(px, py, pw, ph);
  const sc = Math.min(pw / pic.width, ph / pic.height) * 0.95; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pic, px + (pw - pic.width * sc) / 2, py + (ph - pic.height * sc) / 2, pic.width * sc, pic.height * sc);
  ctx.restore();
  ctx.fillStyle = INK; const ns = fitSize(name, fam, 900, w * 0.86, w * 0.12); font(ns, fam, 900);
  ctx.fillStyle = accentName; ctx.fillText(name, x + w / 2, y + h - w * 0.13);
  ctx.restore();
}

function countdown(t, times, labels, y) {
  times.forEach((t0, i) => {
    const k = seg(t, t0, t0 + 0.45);
    if (k <= 0 || k >= 1) return;
    const s = lerp(1.7, 1, eo3(seg(t, t0, t0 + 0.12)));
    title(labels[i], W / 2, y, PORT ? 300 : 240, F.hawker, { fill: PAPER, alpha: 1 - ei3(seg(t, t0 + 0.25, t0 + 0.45)), scale: s, line: 0.1 });
  });
}

function confetti(t, t0, x, y, colors, seed, n = 70) {
  if (t < t0 || t > t0 + 1.6) return;
  const r = rng(seed), dt = t - t0;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, v = 500 + r() * 1100, sz = 10 + r() * 16, c = colors[Math.floor(r() * colors.length)], spin = (r() - 0.5) * 12;
    const px = x + Math.cos(a) * v * dt * (1 - dt * 0.35), py = y + Math.sin(a) * v * dt * (1 - dt * 0.35) + 900 * dt * dt;
    ctx.save(); ctx.globalAlpha = 1 - seg(dt, 1.0, 1.6); ctx.translate(px, py); ctx.rotate(spin * dt);
    ctx.fillStyle = c; ctx.fillRect(-sz / 2, -sz / 2, sz, sz * (0.5 + 0.5 * Math.abs(Math.cos(spin * dt * 2)))); ctx.restore();
  }
}

function sparkles(t, t0, x, y, R, seed) {
  if (t < t0) return;
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = R * (1.05 + r() * 0.6), ph = r() * 2, sp = 1.5 + r() * 2;
    const tw = Math.max(0, Math.sin((t - t0) * sp * Math.PI + ph * Math.PI));
    const k = seg(t, t0 + r() * 0.3, t0 + 0.6 + r() * 0.3) * (1 - seg(t, 12.0, 12.3));
    const s = (6 + r() * 14) * tw * k;
    if (s <= 0.5) continue;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    ctx.save(); ctx.translate(px, py); ctx.fillStyle = GOLD; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(0, -s * 2); ctx.lineTo(s * 0.4, 0); ctx.lineTo(0, s * 2); ctx.lineTo(-s * 0.4, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 2, 0); ctx.lineTo(0, s * 0.4); ctx.lineTo(s * 2, 0); ctx.lineTo(0, -s * 0.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function vignette(strength = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Dark band behind headlines so they read on busy pixel art.
function topShade(a, h = 0.32) {
  const g = ctx.createLinearGradient(0, 0, 0, H * h);
  g.addColorStop(0, `rgba(10,7,5,${0.8 * a})`); g.addColorStop(1, 'rgba(10,7,5,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * h);
}
function flash(t, t0, d = 0.18, a = 0.85) {
  const k = seg(t, t0, t0 + d);
  if (k <= 0 || k >= 1) return;
  ctx.fillStyle = `rgba(255,248,230,${a * (1 - k)})`; ctx.fillRect(0, 0, W, H);
}
// Screen shake: decaying jitter after each hit.
function shake(t, hits) {
  let x = 0, y = 0;
  for (const [t0, amp] of hits) {
    const d = t - t0; if (d < 0 || d > 0.35) continue;
    const k = amp * (1 - d / 0.35) ** 2;
    x += Math.sin(d * 90) * k; y += Math.cos(d * 73) * k;
  }
  return [x, y];
}

// ---------- scene 1: the hawker centre (0 - 7.5 s) ----------
const HC = { phua: [240, 345], kermit: [1037, 292] };
const hcCam = t => track(t, [
  [0, [560, 560, 1.06]], [2.7, [760, 520, 1.12], x => x],
  [3.15, [340, 420, 1.1]], [4.6, [360, 420, 1.1]], [5.5, [1000, 380, 1.12]], [6.0, [1030, 340, 1.14]],
  [7.0, [1037, 300, 1.55], eo3], [7.5, [1037, 300, 1.7]],
]);
const hcLoupe = t => track(t, [[3.0, [300, 420]], [3.3, HC.phua, eo3], [4.6, HC.phua], [5.5, HC.kermit], [7, HC.kermit]]);

function sceneHawker(t) {
  const found = seg(t, 6.0, 6.25);
  const xf = drawScene(A.hc, hcCam, t, found > 0 ? `grayscale(${0.75 * found}) brightness(${1 - 0.55 * found})` : 'none', 0.45, 30);
  const R = (LAND ? 150 : 170) * pop(t, 3.0, 0.28) * (1 - eo3(seg(t, 6.0, 6.12)));
  const shakeX = t > 3.5 && t < 4.0 ? Math.sin((t - 3.5) * 60) * 26 * (1 - seg(t, 3.5, 4.0)) : 0;
  const lp = loupe(A.hc, xf, hcLoupe(t), R, 2.6, { shakeX });
  if (lp && t < 4.6) {
    stamp(lp[0], lp[1], R, 3.5, t);
    bubble('Not me lah! See the yellow boots?', lp[0], lp[1] - R * 1.05, 44, PORT ? 640 : 560, pop(t, 3.55, 0.3) * (1 - seg(t, 4.35, 4.5)));
  }
  // Hook headline, then it collapses into the Find card.
  topShade(1 - seg(t, 6.0, 6.3) * 0 , 0.34);
  const out = eio(seg(t, 1.05, 1.35));
  const hy = PORT ? H * 0.2 : H * 0.22;
  title('CAN YOU FIND', W / 2 - out * W * 0.3, hy - (PORT ? 150 : 125), PORT ? 76 : 60, F.ui, { weight: 700, scale: pop(t, 0.0, 0.25) * (1 - out), alpha: 1 - out });
  title('KERMIT?', W / 2 + out * W * 0.3, hy + 10, fitSize('KERMIT?', F.hawker, 400, W * 0.84, PORT ? 230 : 170), F.hawker,
    { fill: KERMIT, scale: lerp(2.4, 1, eo3(seg(t, 0.25, 0.42))) * (1 - out), alpha: seg(t, 0.25, 0.3) * (1 - out), rot: -0.05 });
  findCard(t, 1.2, 6.0, A.kCard, 'KERMIT THE FROG', F.hawker, INK);
  countdown(t, [1.5, 2.0, 2.5], ['3', '2', '1'], PORT ? H * 0.74 : H * 0.7);

  // Found: Kermit hops out of the scene as a sticker.
  if (t >= 6.0) {
    const [kx, ky] = toScreen(xf, [A.kermit.at.x + A.kermit.width / 2, A.kermit.at.y + A.kermit.height / 2]);
    const k = back(seg(t, 6.0, 6.4)), tx = W / 2, ty = PORT ? H * 0.5 : H * 0.56;
    const target = (PORT ? H * 0.3 : H * 0.48) / A.kSticker.height, from = (A.kermit.height * xf.s) / (A.kermit.height * 6);
    const s = lerp(from, target, k) * (1 + 0.04 * Math.sin((t - 6.4) * 14) * seg(t, 6.4, 6.6));
    const x = lerp(kx, tx, eo3(seg(t, 6.0, 6.3))), y = lerp(ky, ty, eo3(seg(t, 6.0, 6.3))) - Math.abs(Math.sin((t - 6.35) * 7)) * 40 * seg(t, 6.35, 6.5);
    confetti(t, 6.05, tx, ty, [KERMIT, PAPER, RED, GOLD, '#4aa2ff'], 7);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin((t - 6) * 5) * 0.06); ctx.scale(s, s);
    ctx.drawImage(A.kSticker, -A.kSticker.width / 2, -A.kSticker.height / 2); ctx.restore();
    const sh = A.kSticker.height * target;
    bubble('Hi-ho! One bowl of mee, with extra enthusiasm!', tx, ty + sh * 0.5, PORT ? 50 : 40, PORT ? 760 : 620, pop(t, 6.35, 0.3), 1);
    title("IT'S NOT EASY", W / 2, PORT ? H * 0.17 : H * 0.12, PORT ? 92 : 70, F.hawker, { fill: PAPER, scale: pop(t, 6.15, 0.25) });
    title('BEING MEE.', W / 2, PORT ? H * 0.17 + 112 : H * 0.12 + 86, PORT ? 118 : 90, F.hawker, { fill: KERMIT, scale: pop(t, 6.3, 0.25), rot: -0.04 });
  }
  flash(t, 6.0);
}

// ---------- scene 2: the Great Hall (7 - 12.4 s) ----------
const GH = { snape: [1329, 224], shrek: [478, 516] };
const ghCam = t => track(t, [
  [7.0, [700, 600, 1.0]], [8.8, [960, 520, 1.05], x => x], [9.1, [1250, 300, 1.12]], [10.25, [1270, 300, 1.12]],
  [10.7, [520, 500, 1.15], eio], [11.0, [490, 510, 1.18]], [12.0, [490, 515, 1.3]], [12.4, [768, 512, 1.0]],
]);
const ghLoupe = t => track(t, [[9.0, [1300, 300]], [9.2, GH.snape, eo3], [10.25, GH.snape], [10.7, GH.shrek], [12.4, GH.shrek]]);

function sceneHall(t) {
  const found = seg(t, 11.0, 11.2) * (1 - seg(t, 12.0, 12.35));
  const xf = drawScene(A.gh, ghCam, t, found > 0 ? `grayscale(${0.6 * found}) brightness(${1 - 0.6 * found})` : 'none');
  const grow = eo3(seg(t, 11.0, 11.3)) * (1 - eio(seg(t, 12.0, 12.3)));
  const baseR = LAND ? 150 : 170, bigR = Math.min(W, H) * (PORT ? 0.4 : LAND ? 0.26 : 0.28);
  const R = lerp(baseR, bigR, grow) * pop(t, 9.0, 0.28) * (1 - eo3(seg(t, 12.15, 12.35)));
  const shakeX = t > 9.25 && t < 9.75 ? Math.sin((t - 9.25) * 60) * 26 * (1 - seg(t, 9.25, 9.75)) : 0;
  const lp = loupe(A.gh, xf, ghLoupe(t), R, lerp(2.6, 4.2, grow), { ring: grow > 0 ? GOLD : PAPER, shakeX });
  if (lp && t < 10.3) {
    stamp(lp[0], lp[1], R, 9.25, t);
    bubble('Your powers of observation remain pitiful.', lp[0], lp[1] + R * 1.05, 44, PORT ? 600 : 560, pop(t, 9.3, 0.3) * (1 - seg(t, 10.05, 10.2)), 1, F.ui);
  }
  if (lp && t >= 11.0) {
    sparkles(t, 11.0, lp[0], lp[1], R, 3);
    bubble('Yellow and black? Fine. But I’m not sharing my onions.', lp[0], lp[1] + R * 1.02, PORT ? 48 : 38, PORT ? 780 : 640,
      pop(t, 11.3, 0.3) * (1 - seg(t, 11.95, 12.1)), 1);
  }
  topShade(1, 0.34);
  // "...now find Shrek." in the Great Hall's typeface.
  const out = eio(seg(t, 8.0, 8.3));
  const hy = PORT ? H * 0.2 : H * 0.22;
  title('NOW FIND', W / 2, hy - (PORT ? 140 : 105), PORT ? 84 : 66, F.hall, { weight: 900, fill: PAPER, scale: pop(t, 7.45, 0.25) * (1 - out), alpha: 1 - out });
  title('SHREK.', W / 2, hy + 14, fitSize('SHREK.', F.hall, 900, W * 0.82, PORT ? 220 : 180), F.hall,
    { weight: 900, fill: GOLD, scale: lerp(2.4, 1, eo3(seg(t, 7.6, 7.78))) * (1 - out), alpha: seg(t, 7.6, 7.65) * (1 - out) });
  findCard(t, 8.1, 11.0, A.shrekCard, 'SHREK', F.hall, INK);
  countdown(t, [8.25, 8.5, 8.75], ['3', '2', '1'], PORT ? H * 0.74 : H * 0.7);
  if (t >= 11.0) {
    const k = 1 - seg(t, 11.95, 12.15);
    title('AN OGRE', W / 2, PORT ? H * 0.12 : H * 0.085, PORT ? 104 : 74, F.hall, { weight: 900, fill: PAPER, scale: pop(t, 11.1, 0.25), alpha: k });
    title('GETS SORTED.', W / 2, PORT ? H * 0.12 + 118 : H * 0.085 + 80, fitSize('GETS SORTED.', F.hall, 900, W * 0.9, PORT ? 112 : 84), F.hall,
      { weight: 900, fill: GOLD, scale: pop(t, 11.25, 0.25), alpha: k });
  }
  flash(t, 11.0, 0.2, 0.7);
}

// The loupe ring blows open into the next world.
function iris(t, t0, t1, cx, cy, drawInside) {
  const k = ei3(seg(t, t0, t1));
  if (k <= 0) return false;
  const r = k * Math.hypot(W, H) * 0.75;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); drawInside(); ctx.restore();
  if (k < 1) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 26; ctx.strokeStyle = PAPER; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = EDGE; ctx.stroke(); }
  return k >= 1;
}

// ---------- scene 3: the wall of worlds (12.35 - 15.2 s) ----------
function wallXf(t) {
  const gh = A.tiles[4];
  const xf0 = sceneXf(A.gh, ghCam(12.4));
  const c0 = [gh.x + (W / 2 - xf0.ox) / xf0.s, gh.y + (H / 2 - xf0.oy) / xf0.s], s0 = xf0.s;
  const s1 = Math.max(W / WALL.w, (PORT ? 0.52 : 0.5) * H / WALL.h);
  const wy = WALL.h / 2 + (PORT ? 0 : WALL.h * 0.03);
  const panFrom = clamp(gh.x + 768, W / 2 / s1, WALL.w - W / 2 / s1), panTo = clamp(WALL.w * 0.32, W / 2 / s1, WALL.w - W / 2 / s1);
  const k = eio(seg(t, 12.35, 13.4));
  const s = s0 * (s1 / s0) ** k;
  const cx = lerp(c0[0], panFrom, k) + (panTo - panFrom) * eio(seg(t, 13.4, 16.0)) * 1;
  const cy = lerp(c0[1], wy, k);
  return { s, ox: W / 2 - cx * s, oy: H / 2 - cy * s, k };
}

const SUSPECTS = ['Kermit', 'Shrek', 'Gollum', 'Paddington', 'Sherlock'];
function sceneWall(t) {
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#2c2219'); g.addColorStop(1, INK); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const xf = wallXf(t);
  const dim = seg(t, 15.0, 15.35);
  ctx.save(); if (dim > 0) ctx.filter = `blur(${dim * 10}px) brightness(${1 - dim * 0.55})`;
  drawXf(A.wall, xf);
  // the unfeathered hall fades out as we pull back, so the hand-off from scene 2 is seamless
  const gh = A.tiles[4];
  ctx.globalAlpha = 1 - seg(xf.k, 0, 0.45);
  if (ctx.globalAlpha > 0) ctx.drawImage(A.gh, xf.ox + gh.x * xf.s, xf.oy + gh.y * xf.s, 1536 * xf.s, 1024 * xf.s);
  ctx.restore();
  vignette(0.6);
  const out = 1 - seg(t, 14.95, 15.2);
  topShade(seg(t, 12.8, 13.1) * out, 0.36);
  // tagline from the site, word by word on the eighth notes
  const l1 = ['Every', 'world', 'hides', 'someone'], l2 = ['who', "doesn't", 'belong.'];
  const size = PORT ? 84 : 66;
  const lines = PORT ? [l1.slice(0, 2), l1.slice(2), l2] : [l1, l2];
  let i = 0;
  lines.forEach((ws, li) => {
    font(size, F.ui, 700);
    const sp = size * 0.28, widths = ws.map(w => ctx.measureText(w).width), total = widths.reduce((a, b) => a + b) + sp * (ws.length - 1);
    let x = W / 2 - total / 2;
    ws.forEach((w, j) => {
      const t0 = 12.9 + i * 0.125 + (li === lines.length - 1 ? 0.25 : 0);
      const k = pop(t, t0, 0.22);
      title(w, x + widths[j] / 2, (PORT ? H * 0.1 : H * 0.12) + li * size * 1.15 - (1 - k) * 30, size, F.ui,
        { weight: 700, fill: li === lines.length - 1 ? GOLD : PAPER, scale: k, alpha: seg(t, t0, t0 + 0.06) * out, line: 0.14 });
      x += widths[j] + sp; i++;
    });
  });
  // suspects strip: "?" coins flip to the faces hiding in each world
  const n = 5, d = PORT ? 150 : 120, gap = d * 0.28, y = PORT ? H * 0.84 : H * 0.85;
  const sx = W / 2 - (n * d + (n - 1) * gap) / 2 + d / 2;
  for (let j = 0; j < n; j++) {
    const ap = pop(t, 13.5 + j * 0.06, 0.3) * out;
    if (ap <= 0) continue;
    const tf = 14.0 + j * 0.125, fl = seg(t, tf, tf + 0.14), sxk = Math.abs(Math.cos(fl * Math.PI)), showFace = fl >= 0.5;
    const x = sx + j * (d + gap);
    ctx.save(); ctx.translate(x, y); ctx.scale(ap * sxk, ap);
    ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#120d09'; ctx.fill();
    if (showFace) { ctx.save(); ctx.clip(); ctx.imageSmoothingEnabled = false; ctx.drawImage(A.faces[j], -d / 2, -d / 2, d, d); ctx.restore(); }
    else { font(d * 0.5, F.hawker); ctx.fillStyle = GOLD; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, d * 0.03); }
    ctx.lineWidth = d * 0.045; ctx.strokeStyle = PAPER; ctx.stroke();
    ctx.restore();
    if (showFace) title(SUSPECTS[j], x, y + d * 0.68, d * 0.2, F.ui, { weight: 700, alpha: seg(t, tf + 0.1, tf + 0.2) * out, line: 0.18 });
  }
}

// ---------- scene 4: hide someone (15 - 17 s) ----------
const MOMENT = 'The Quidditch World Cup final', GUEST = 'Sherlock Holmes';
function sceneCreate(t) {
  const k = back(seg(t, 15.05, 15.4)), out = seg(t, 16.75, 17.0);
  if (k <= 0) return;
  const w = Math.min(W * 0.86, 860), h = w * 0.78, x = (W - w) / 2, y = H * (PORT ? 0.36 : 0.5) - h / 2 + (1 - k) * H * 0.4 - out * 40;
  ctx.save(); ctx.globalAlpha = 1 - out;
  panel(x, y, w, h, 22, 5);
  const p = w * 0.07;
  title('Hide someone', x + w / 2, y + p * 1.3, w * 0.075, F.ui, { weight: 700, line: 0, shadow: 0, fill: INK });
  const field = (label, value, fy, fh, t0, t1) => {
    font(w * 0.036, F.ui, 700); ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x + p, fy);
    ctx.fillStyle = '#fff'; rrect(x + p, fy + w * 0.02, w - p * 2, fh, 10); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = t >= t0 && t < t1 + 0.4 ? RED : EDGE; ctx.stroke();
    const n = Math.floor(value.length * seg(t, t0, t1));
    font(w * 0.05, F.ui, 500); ctx.fillStyle = INK; ctx.textBaseline = 'middle';
    const typed = value.slice(0, n);
    ctx.fillText(typed, x + p * 1.4, fy + w * 0.02 + fh / 2);
    if (t >= t0 - 0.2 && t < t1 + 0.4 && Math.floor(t * 6) % 2 === 0) ctx.fillRect(x + p * 1.4 + ctx.measureText(typed).width + 3, fy + w * 0.02 + fh * 0.22, 4, fh * 0.56);
  };
  field('The moment', MOMENT, y + p * 2.9, w * 0.1, 15.25, 15.9);
  field("Who's hiding in it?", GUEST, y + p * 5.3, w * 0.1, 15.95, 16.3);
  // buttons
  const bh = w * 0.1, by = y + h - p - bh, press = seg(t, 16.48, 16.52) * (1 - seg(t, 16.6, 16.66));
  const btn = (label, bx, bw, primary) => {
    const dy = primary ? press * 4 : 0;
    ctx.fillStyle = EDGE; rrect(bx, by + 6, bw, bh, 12); ctx.fill();
    ctx.fillStyle = primary ? RED : PAPER; rrect(bx, by + dy, bw, bh, 12); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = EDGE; ctx.stroke();
    font(w * 0.04, F.ui, 700); ctx.fillStyle = primary ? '#fff' : INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + dy + bh / 2);
  };
  btn('Surprise me', x + p, w * 0.3, false);
  btn('Paint it', x + w - p - w * 0.28, w * 0.28, true);
  // cursor
  const cp = track(t, [[16.1, [x + w * 0.62, y + h * 1.25]], [16.45, [x + w - p - w * 0.12, by + bh * 0.6], eo3]]);
  if (t > 16.1) {
    ctx.save(); ctx.translate(cp[0], cp[1]); ctx.scale(1 - press * 0.15, 1 - press * 0.15);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 58); ctx.lineTo(14, 45); ctx.lineTo(25, 68); ctx.lineTo(34, 64); ctx.lineTo(23, 41); ctx.lineTo(41, 41); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  // caption under the card
  const cy = y + h + (PORT ? 150 : 70);
  if (!LAND || true) {
    const cs = PORT ? 64 : 50;
    title('Type any moment. Name anyone.', W / 2, PORT ? cy : y - 60, fitSize('Type any moment. Name anyone.', F.ui, 700, W * 0.9, cs), F.ui,
      { weight: 700, scale: pop(t, 15.2, 0.25), alpha: 1 - out });
    title('AI paints the world and hides them in it.', W / 2, PORT ? cy + cs * 1.25 : y + h + 70, fitSize('AI paints the world and hides them in it.', F.ui, 700, W * 0.9, cs * 0.8), F.ui,
      { weight: 700, fill: GOLD, scale: pop(t, 16.55, 0.25), alpha: 1 - out });
  }
}

// ---------- scene 5: the logo and the QR (17 - 21 s) ----------
const WORLD_FONTS = [[F.hawker, 400], [F.hall, 900], [F.ui, 700], [F.cantina, 400], [F.ui, 700]];
const lc = canvas(600, 600), lx = lc.getContext('2d');

// A letter cut out of one world's painting, set in that world's typeface (the site's Loki-style logo).
function letter(ch, x, y, size, wi, slot, sy = 1, alpha = 1) {
  const [fam, wt] = WORLD_FONTS[wi], im = A.tiles[[2, 4, 0, 3, 1][wi]].img;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(1, sy);
  font(size, fam, wt);
  const fitW = ch === "'" ? size : size * 0.8, mw = ctx.measureText(ch).width;
  if (mw > fitW) { size *= fitW / mw; font(size, fam, wt); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16; ctx.strokeStyle = INK; ctx.strokeText(ch, 0, size * 0.06); ctx.strokeText(ch, 0, 0);
  ctx.lineWidth = size * 0.07; ctx.strokeStyle = PAPER; ctx.strokeText(ch, 0, 0);
  // texture fill
  lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, 600, 600);
  lx.font = ctx.font; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.fillStyle = '#fff'; lx.fillText(ch, 300, 300);
  lx.globalCompositeOperation = 'source-in';
  const r = rng(slot * 97 + wi * 13), sc = size * 3.2 / 1024;
  lx.filter = 'brightness(1.35) saturate(1.25) contrast(1.05)';
  lx.drawImage(im, 300 - (300 + r() * 900) * sc, 300 - (250 + r() * 450) * sc, 1536 * sc, 1024 * sc);
  lx.filter = 'none';
  ctx.drawImage(lc, -300, -300);
  ctx.restore();
}

function sceneEnd(t) {
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  // faint drifting wall behind everything
  ctx.save(); ctx.globalAlpha = 0.22; ctx.filter = 'blur(5px)';
  const s = Math.max(W / WALL.w, H / WALL.h) * 1.15, dx = (t - 17) * 18;
  ctx.drawImage(A.wall, W / 2 - WALL.w * s / 2 - dx, H / 2 - WALL.h * s / 2, WALL.w * s, WALL.h * s);
  ctx.restore();
  vignette(0.75);

  // logo
  const LOGO = LAND ? ["WHO'S HIDING?"] : ["WHO'S", 'HIDING?'];
  const size = PORT ? 190 : LAND ? 140 : 130;
  const ly = PORT ? [H * 0.15, H * 0.15 + size * 1.08] : LAND ? [H * 0.16] : [H * 0.1, H * 0.1 + size * 1.05];
  let n = 0;
  LOGO.forEach((word, li) => {
    const chars = [...word], advOf = ch => size * (ch === "'" ? 0.38 : ch === ' ' ? 0.4 : 0.8);
    const xs = []; let acc = 0;
    chars.forEach(ch => { xs.push(acc + advOf(ch) / 2); acc += advOf(ch); });
    const startX = W / 2 - acc / 2;
    chars.forEach((ch, j) => {
      const k = n++;
      if (ch === ' ') return;
      const t0 = 17.0 + k * 0.05, kin = back(seg(t, t0, t0 + 0.32));
      // each letter jumps to another world on its own clock; at 19.5 they all lock to the hawker centre in a wave
      const r = rng(k * 31 + 5), period = 0.5 * (1 + Math.floor(r() * 3)), phase = r() * 0.5;
      const lt = Math.max(0, t - 17.6 - phase), swaps = Math.floor(lt / period) + 1;
      const lockT = 19.5 + k * 0.04, locked = t >= lockT;
      let wi = locked ? 0 : (k + swaps) % 5;
      let fl = locked ? seg(t, lockT, lockT + 0.14) : t > 17.6 + phase ? seg(lt % period, 0, 0.14) : 1;
      const sy = Math.max(0.05, Math.abs(Math.cos(fl * Math.PI))) * kin;
      letter(ch, startX + xs[j], ly[li] - (1 - kin) * 60, size, wi, swaps + (locked ? 99 : 0), sy, clamp(kin * 2));
    });
  });
  const tagY = PORT ? H * 0.15 + size * 1.08 + 175 : LAND ? H * 0.31 : H * 0.355;
  title('Find them. Then hide your own.', W / 2, tagY, fitSize('Find them. Then hide your own.', F.ui, 700, W * 0.86, PORT ? 62 : 52), F.ui,
    { weight: 700, scale: pop(t, 17.75, 0.3), line: 0.14 });

  // QR card, with Kermit peeking out from behind it
  const q = PORT ? W * 0.5 : LAND ? H * 0.42 : H * 0.36, qx = W / 2 - q / 2, qy = PORT ? H * 0.47 : LAND ? H * 0.4 : H * 0.465;
  const qk = back(seg(t, 18.0, 18.4));
  const peek = eo3(seg(t, 18.8, 19.15)) * (1 - 0.15 * Math.sin(Math.max(0, t - 19.15) * 4));
  if (peek > 0) {
    const ks = q * 0.55 / A.kSticker.height;
    ctx.save(); ctx.translate(qx + q - q * 0.2 + peek * q * 0.26, qy + q * 0.6); ctx.rotate(0.28 * peek); ctx.scale(ks, ks);
    ctx.drawImage(A.kSticker, -A.kSticker.width / 2, -A.kSticker.height / 2); ctx.restore();
  }
  if (qk > 0) {
    ctx.save(); ctx.translate(W / 2, qy + q / 2); ctx.scale(qk, qk); ctx.rotate((1 - qk) * -0.2); ctx.translate(-W / 2, -(qy + q / 2));
    panel(qx, qy, q, q, 20, 5);
    const m = A.qr.length, cell = (q * 0.84) / m, ox = qx + q * 0.08, oy = qy + q * 0.08;
    ctx.fillStyle = INK;
    A.qr.forEach((row, yy) => [...row].forEach((v, xx) => { if (v === '1') ctx.fillRect(ox + xx * cell, oy + yy * cell, cell + 0.6, cell + 0.6); }));
    ctx.restore();
  }
  if (peek > 0) bubble('psst.', qx + q + q * 0.2, qy + q * 0.3, PORT ? 40 : 34, 300, pop(t, 19.25, 0.25), -1);
  const label = PORT || !LAND ? 'SCAN FOR THE CODE' : 'SCAN FOR THE CODE';
  title(label, W / 2, qy - (PORT ? 50 : 38), PORT ? 40 : 32, F.hawker, { fill: GOLD, scale: pop(t, 18.15, 0.25), line: 0.16 });
  const url = 'github.com/Collaboration95/common-grounds-makeathon';
  title(url, W / 2, qy + q + (PORT ? 70 : 52), fitSize(url, F.ui, 500, W * 0.9, PORT ? 40 : 32), F.ui, { weight: 500, alpha: seg(t, 18.35, 18.6), line: 0.14 });
  title('Built in a day at the Common Ground Makeathon · Singapore', W / 2, H - (PORT ? 90 : 46),
    fitSize('Built in a day at the Common Ground Makeathon · Singapore', F.ui, 500, W * 0.9, PORT ? 30 : 26), F.ui,
    { weight: 500, fill: '#cdbf9f', alpha: seg(t, 18.6, 18.9), line: 0.1, shadow: 0 });
  // fade out
  if (t > 20.5) { ctx.fillStyle = `rgba(10,7,5,${seg(t, 20.5, 21) * 0})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- master ----------
export function renderFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const [sx, sy] = shake(t, [[0.25, 16], [3.5, 8], [6.0, 22], [7.6, 16], [9.25, 8], [11.0, 22], [17.0, 18]]);
  ctx.translate(sx, sy);
  if (t < 7.5) {
    sceneHawker(t);
    const [cx, cy] = [W / 2, PORT ? H * 0.5 : H * 0.56];
    iris(t, 7.0, 7.5, cx, cy, () => sceneHall(t));
    if (t >= 7.0) flash(t, 7.0, 0.1, 0.3);
  } else if (t < 12.35) {
    sceneHall(t);
  } else if (t < 17.0) {
    sceneWall(t);
    sceneCreate(t);
  } else {
    sceneEnd(t);
  }
  flash(t, 17.0, 0.25, 0.9);
  flash(t, 12.35, 0.12, 0.25);
  vignette(0.35);
}
