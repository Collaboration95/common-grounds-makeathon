// engine.js - shared sim + Canvas2D renderer for The Commons (projector + phone mini view).
// Things are untrusted code: every call into them is wrapped in try/catch and a thing that throws is
// quarantined (greyed out, "resting...", no more update calls). Things never draw; this file does.
// Contract v2 (SPEC.md): scene-driven floor with depth (y) + hops (z), spots, onMeet / onSignal, hats, departures.

export const INK = '#3a2416';
export const PAPER = '#fff3d6';
export const HAND = '"Marker Felt","Chalkboard SE","Segoe Print","Bradley Hand","Comic Sans MS",ui-rounded,system-ui,sans-serif';

const FX_KINDS = new Set(['burst', 'hearts', 'zzz', 'rain', 'sparkle', 'steam']);
// min seconds between two spawns of the same kind from the same thing (things call fx() every frame)
const FX_GAP = { burst: 0.2, hearts: 0.3, zzz: 0.7, rain: 0.03, sparkle: 0.12, steam: 0.08 };
const GRAVITY = 1400; // on vz (height above the floor); y is depth, not height
const MEET_R = 110; // onMeet radius (px)
const MEET_COOL = 5; // seconds between two onMeet calls for the same pair
const SIGNAL_R = 200; // me.signal(kind) without a target reaches everything this close
const LEAVE_SPEED = 160; // px/s when a departing ground thing walks off
const BG_FADE = 1.5; // background crossfade on scene change (s)
const ARRIVE_FALL = 0.5; // seconds of falling before the squash
const ARRIVE_DUR = 1.2; // whole arrival animation
const TAU = Math.PI * 2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const easeOutBack = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ---------------------------------------------------------------------------------------------
// sprites: crop to the opaque bounding box so "size 1 = 64px tall" is honest and feet touch the ground
// ---------------------------------------------------------------------------------------------
const boxCache = new WeakMap();
function spriteBox(src) {
  let b = boxCache.get(src);
  if (b) return b;
  const w = src.naturalWidth || src.width || 256;
  const h = src.naturalHeight || src.height || 256;
  b = { sx: 0, sy: 0, sw: w, sh: h };
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 16) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 >= x0 && y1 >= y0) b = { sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 };
  } catch {
    /* tainted or unreadable: use the whole image */
  }
  boxCache.set(src, b);
  return b;
}

function greyCopy(src, box) {
  try {
    const c = document.createElement('canvas');
    c.width = box.sw;
    c.height = box.sh;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, box.sx, box.sy, box.sw, box.sh, 0, 0, box.sw, box.sh);
    const im = g.getImageData(0, 0, box.sw, box.sh);
    const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      const v = l * 0.7 + 70;
      d[i] = v;
      d[i + 1] = v * 0.98;
      d[i + 2] = v * 0.96;
    }
    g.putImageData(im, 0, 0);
    return c;
  } catch {
    return null;
  }
}

// A paper-cutout blob with the thing's name on it: used whenever a sprite is missing or failed.
function makeBlob(id, name) {
  const R = rng(hashStr(String(id)));
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const pal = [
    ['#f0a35e', '#fbd49a'],
    ['#e0694b', '#f4a58a'],
    ['#f2c35b', '#fbe6a2'],
    ['#9bb87a', '#cfe0aa'],
    ['#d58c9c', '#efc0c8'],
    ['#78a8a0', '#b6d8cf'],
    ['#e58a58', '#f8c49c'],
  ];
  const [base, light] = pal[Math.floor(R() * pal.length)];
  const N = 11, cx = 128, cy = 136, pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + (R() - 0.5) * 0.25;
    const rr = 0.88 + R() * 0.22;
    pts.push([cx + Math.cos(a) * 104 * rr, cy + Math.sin(a) * 94 * rr]);
  }
  const path = () => {
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    g.beginPath();
    const m0 = mid(pts[N - 1], pts[0]);
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < N; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % N]);
      g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    g.closePath();
  };
  g.save();
  g.translate(5, 7);
  path();
  g.fillStyle = 'rgba(58,36,22,0.32)';
  g.fill();
  g.restore();
  path();
  g.fillStyle = base;
  g.fill();
  g.save();
  path();
  g.clip();
  const gr = g.createRadialGradient(92, 88, 8, 112, 112, 150);
  gr.addColorStop(0, light);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalAlpha = 0.75;
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  g.globalAlpha = 1;
  for (let i = 0; i < 70; i++) {
    g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(58,36,22,0.08)';
    g.beginPath();
    g.arc(R() * S, R() * S, 1 + R() * 2.6, 0, TAU);
    g.fill();
  }
  const sh = g.createLinearGradient(0, 150, 0, 235);
  sh.addColorStop(0, 'rgba(58,36,22,0)');
  sh.addColorStop(1, 'rgba(58,36,22,0.22)');
  g.fillStyle = sh;
  g.fillRect(0, 140, S, 110);
  g.restore();
  path();
  g.lineWidth = 7;
  g.lineJoin = 'round';
  g.strokeStyle = INK;
  g.stroke();
  // face
  g.fillStyle = INK;
  for (const ex of [98, 158]) {
    g.beginPath();
    g.arc(ex, 100, 9, 0, TAU);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(ex + 3, 97, 3, 0, TAU);
    g.fill();
    g.fillStyle = INK;
  }
  g.fillStyle = 'rgba(214,96,80,0.38)';
  for (const ex of [80, 176]) {
    g.beginPath();
    g.ellipse(ex, 124, 12, 7, 0, 0, TAU);
    g.fill();
  }
  // name tag
  const label = String(name || 'a thing');
  let fs = 38, lines = [label];
  for (; fs >= 20; fs -= 2) {
    g.font = `700 ${fs}px ${HAND}`;
    lines = wrapText(g, label, 188);
    if (lines.length <= 2 && lines.every((l) => g.measureText(l).width <= 188)) break;
  }
  g.font = `700 ${fs}px ${HAND}`;
  const lw = Math.max(...lines.map((l) => g.measureText(l).width)) + 24;
  const lh = lines.length * fs * 1.12 + 14;
  g.save();
  g.translate(128, 190);
  g.rotate(-0.04);
  g.fillStyle = PAPER;
  g.strokeStyle = INK;
  g.lineWidth = 4;
  roundRect(g, -lw / 2, -lh / 2, lw, lh, 12);
  g.fill();
  g.stroke();
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.12 + 1));
  g.restore();
  return c;
}

function wrapText(g, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && g.measureText(test).width > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 0.8, y - s * 0.9, x, y - s * 0.3);
  g.bezierCurveTo(x + s * 0.8, y - s * 0.9, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  g.closePath();
}

function starPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 ? r * 0.3 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}

// ---------------------------------------------------------------------------------------------
// fallback backdrop: HDB void deck + grass field at dusk (used until/unless /assets/background.png loads)
// ---------------------------------------------------------------------------------------------
function makeBackdrop(W, H) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const R = rng(7);
  const HZ = Math.round(H * 0.62);
  // sky
  let gr = g.createLinearGradient(0, 0, 0, HZ);
  gr.addColorStop(0, '#3a2a58');
  gr.addColorStop(0.45, '#8c4f72');
  gr.addColorStop(0.8, '#e68d5d');
  gr.addColorStop(1, '#f7cb7c');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, HZ + 2);
  // sun + glow
  gr = g.createRadialGradient(1180, HZ - 10, 10, 1180, HZ - 10, 460);
  gr.addColorStop(0, 'rgba(255,226,160,0.85)');
  gr.addColorStop(0.35, 'rgba(255,190,120,0.35)');
  gr.addColorStop(1, 'rgba(255,170,110,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, HZ);
  g.fillStyle = '#ffe6a8';
  g.beginPath();
  g.arc(1180, HZ + 6, 64, Math.PI, TAU);
  g.fill();
  // clouds (flat paper strips)
  for (let i = 0; i < 8; i++) {
    const x = R() * W, y = 90 + R() * 300, w = 160 + R() * 280, h = 14 + R() * 18;
    g.fillStyle = `rgba(255,${170 + Math.floor(R() * 40)},${150 + Math.floor(R() * 30)},${0.18 + R() * 0.2})`;
    roundRect(g, x, y, w, h, h / 2);
    g.fill();
    roundRect(g, x + w * 0.2, y - h * 0.6, w * 0.5, h, h / 2);
    g.fill();
  }
  // far HDB blocks
  let bx = 800;
  while (bx < W) {
    const bw = 70 + R() * 70, bh = 110 + R() * 130;
    g.fillStyle = ['#6a4a62', '#5e4259', '#755068'][Math.floor(R() * 3)];
    g.fillRect(bx, HZ - bh + 4, bw, bh);
    for (let wy = HZ - bh + 16; wy < HZ - 8; wy += 20) {
      for (let wx = bx + 8; wx < bx + bw - 10; wx += 14) {
        g.fillStyle = R() < 0.32 ? 'rgba(255,216,138,0.9)' : 'rgba(60,40,70,0.7)';
        g.fillRect(wx, wy, 7, 10);
      }
    }
    bx += bw + 4 + R() * 12;
  }
  gr = g.createLinearGradient(0, HZ - 90, 0, HZ + 4);
  gr.addColorStop(0, 'rgba(240,170,130,0)');
  gr.addColorStop(1, 'rgba(240,170,130,0.5)');
  g.fillStyle = gr;
  g.fillRect(780, HZ - 90, W - 780, 96);
  // tree line
  for (let x = 700; x < W + 40; x += 22 + R() * 14) {
    const r = 26 + R() * 24;
    g.fillStyle = R() < 0.5 ? '#46394f' : '#3b3646';
    g.beginPath();
    g.arc(x, HZ - r * 0.25, r, 0, TAU);
    g.fill();
  }
  // grass
  gr = g.createLinearGradient(0, HZ - 4, 0, H);
  gr.addColorStop(0, '#a3a85c');
  gr.addColorStop(0.35, '#738e47');
  gr.addColorStop(1, '#46663a');
  g.fillStyle = gr;
  g.fillRect(0, HZ - 4, W, H - HZ + 4);
  for (const [y0, col] of [[HZ + 54, 'rgba(60,92,50,0.28)'], [HZ + 140, 'rgba(46,76,44,0.3)']]) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) g.lineTo(x, y0 + Math.sin(x / 130 + y0) * 10 + R() * 4);
    g.lineTo(W, H);
    g.closePath();
    g.fill();
  }
  g.save();
  g.translate(1180, HZ + 30);
  g.scale(2.4, 0.5);
  gr = g.createRadialGradient(0, 0, 10, 0, 0, 300);
  gr.addColorStop(0, 'rgba(255,205,125,0.4)');
  gr.addColorStop(1, 'rgba(255,205,125,0)');
  g.fillStyle = gr;
  g.fillRect(-400, -400, 800, 800);
  g.restore();
  for (let i = 0; i < 420; i++) {
    const x = R() * W, y = HZ + 6 + Math.pow(R(), 0.8) * (H - HZ - 6), l = 5 + (y - HZ) / 18 + R() * 8;
    g.strokeStyle = R() < 0.5 ? 'rgba(140,166,84,0.8)' : 'rgba(44,76,46,0.65)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (R() - 0.5) * 6, y - l / 2, x + (R() - 0.5) * 10, y - l);
    g.stroke();
  }
  for (let i = 0; i < 46; i++) {
    g.fillStyle = ['#fff3d6', '#f4b6c2', '#ffd36e'][Math.floor(R() * 3)];
    g.beginPath();
    g.arc(R() * W, HZ + 30 + R() * (H - HZ - 40), 2 + R() * 2, 0, TAU);
    g.fill();
  }
  // void deck: back wall, floor, pillars, slab
  const wallB = 590;
  g.fillStyle = '#8b7b84';
  g.fillRect(0, 118, 770, wallB - 118);
  gr = g.createLinearGradient(0, 118, 0, wallB);
  gr.addColorStop(0, 'rgba(40,24,40,0.45)');
  gr.addColorStop(1, 'rgba(255,190,130,0.12)');
  g.fillStyle = gr;
  g.fillRect(0, 118, 770, wallB - 118);
  // mailboxes + notice board
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 9; k++) {
      g.fillStyle = (r + k) % 2 ? '#6d6670' : '#7d7480';
      g.fillRect(480 + k * 22, 340 + r * 28, 19, 24);
    }
  }
  g.fillStyle = '#b79a6a';
  g.fillRect(150, 300, 120, 80);
  g.strokeStyle = '#5b4430';
  g.lineWidth = 5;
  g.strokeRect(150, 300, 120, 80);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = ['#f4e3b8', '#f1b6a0', '#cfe0c0'][i % 3];
    g.fillRect(160 + (i % 4) * 27, 310 + Math.floor(i / 4) * 34, 20, 26);
  }
  // lamps
  for (const lx of [200, 460, 700]) {
    const lg = g.createRadialGradient(lx, 124, 4, lx, 150, 200);
    lg.addColorStop(0, 'rgba(255,224,150,0.65)');
    lg.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = lg;
    g.fillRect(lx - 220, 118, 440, 300);
    g.fillStyle = '#ffeab0';
    g.fillRect(lx - 24, 116, 48, 8);
  }
  // floor (tiles in perspective), slanted apron edge onto the grass
  g.save();
  g.beginPath();
  g.moveTo(0, wallB);
  g.lineTo(770, wallB);
  g.lineTo(930, H);
  g.lineTo(0, H);
  g.closePath();
  gr = g.createLinearGradient(0, wallB, 0, H);
  gr.addColorStop(0, '#bfae9c');
  gr.addColorStop(1, '#a28f7d');
  g.fillStyle = gr;
  g.fill();
  g.clip();
  g.strokeStyle = 'rgba(80,60,60,0.2)';
  g.lineWidth = 2;
  const vpx = 400, vpy = 330;
  for (let xs = -1400; xs <= 2200; xs += 120) {
    g.beginPath();
    g.moveTo(vpx + (xs - vpx) * ((wallB - vpy) / (H - vpy)), wallB);
    g.lineTo(xs, H);
    g.stroke();
  }
  for (let k = 1; k < 8; k++) {
    const y = wallB + (H - wallB) * Math.pow(k / 8, 1.7);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.save();
  g.translate(1180, 640);
  g.scale(2.2, 0.55);
  gr = g.createRadialGradient(0, 0, 10, 0, 0, 340);
  gr.addColorStop(0, 'rgba(255,190,120,0.35)');
  gr.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = gr;
  g.fillRect(-700, -700, 1400, 1400);
  g.restore();
  g.restore();
  g.strokeStyle = '#d9c8b0';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(770, wallB);
  g.lineTo(930, H);
  g.stroke();
  // stone chess table + stools (void deck classic)
  g.fillStyle = 'rgba(40,24,36,0.25)';
  g.beginPath();
  g.ellipse(430, 690, 78, 16, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#8f8a8e';
  g.fillRect(418, 640, 24, 48);
  g.fillStyle = '#b4adb0';
  g.beginPath();
  g.ellipse(430, 634, 74, 17, 0, 0, TAU);
  g.fill();
  g.strokeStyle = '#6a6469';
  g.lineWidth = 3;
  g.stroke();
  for (const sx of [352, 508]) {
    g.fillStyle = '#9d979b';
    g.fillRect(sx - 8, 668, 16, 26);
    g.fillStyle = '#bab3b6';
    g.beginPath();
    g.ellipse(sx, 664, 18, 6, 0, 0, TAU);
    g.fill();
  }
  // pillars
  for (const px of [60, 320, 580]) {
    gr = g.createLinearGradient(px, 0, px + 76, 0);
    gr.addColorStop(0, '#8a7d86');
    gr.addColorStop(0.6, '#b9a39a');
    gr.addColorStop(1, '#d7b293');
    g.fillStyle = gr;
    g.fillRect(px, 112, 76, 488);
    g.fillStyle = 'rgba(40,24,40,0.28)';
    g.fillRect(px, 112, 76, 24);
    g.fillStyle = '#7a6d74';
    g.fillRect(px - 6, 566, 88, 38);
    g.fillStyle = '#9d8f93';
    g.fillRect(px - 6, 566, 88, 6);
  }
  // slab
  g.fillStyle = '#4d4453';
  g.fillRect(0, 0, 830, 116);
  g.fillStyle = '#6b6069';
  g.fillRect(0, 100, 830, 16);
  g.fillStyle = 'rgba(255,200,150,0.18)';
  g.fillRect(0, 112, 830, 4);
  g.fillStyle = '#3d3542';
  g.beginPath();
  g.moveTo(830, 0);
  g.lineTo(846, 14);
  g.lineTo(846, 116);
  g.lineTo(830, 116);
  g.closePath();
  g.fill();
  // vignette + grain
  gr = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.15);
  gr.addColorStop(0, 'rgba(20,10,30,0)');
  gr.addColorStop(1, 'rgba(20,10,30,0.5)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 7000; i++) {
    g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
    g.fillRect(R() * W, R() * H, 2, 2);
  }
  return c;
}

// ---------------------------------------------------------------------------------------------
// scenes (SPEC v2): background + the walk map. The default is /scenes/voiddeck/scene.json; the server
// sends the live one in SSE `hello` / `scene`. This copy keeps the engine usable before that arrives.
// ---------------------------------------------------------------------------------------------
export const DEFAULT_SCENE = {
  id: 'voiddeck', name: 'HDB void deck at dusk', background: '/assets/background.png', width: 1600, height: 900,
  ceilingY: 250, air: { top: 260, bottom: 560 },
  floor: { backY: 600, frontY: 885, backX: [20, 1580], frontX: [10, 1590] },
  depthScale: [0.6, 1.2],
  spots: [
    { id: 'table-left', name: 'stone table', kind: 'table', x: 145, y: 594, tags: [] },
    { id: 'stool-l1', name: 'stool', kind: 'seat', x: 250, y: 622, tags: [] },
    { id: 'stool-l2', name: 'stool', kind: 'seat', x: 293, y: 645, tags: [] },
    { id: 'stool-l3', name: 'stool', kind: 'seat', x: 60, y: 655, tags: [] },
    { id: 'table-right', name: 'stone table', kind: 'table', x: 1195, y: 568, tags: [] },
    { id: 'stool-r1', name: 'stool', kind: 'seat', x: 1100, y: 600, tags: [] },
    { id: 'stool-r2', name: 'stool', kind: 'seat', x: 1298, y: 612, tags: [] },
    { id: 'table-far', name: 'stone table', kind: 'table', x: 1555, y: 566, tags: [] },
    { id: 'lamp-left', name: 'wall lamp', kind: 'perch', x: 115, y: 255, tags: ['warm', 'light'] },
    { id: 'lamp-mid', name: 'wall lamp', kind: 'perch', x: 392, y: 362, tags: ['warm', 'light'] },
    { id: 'lamp-right', name: 'wall lamp', kind: 'perch', x: 1372, y: 290, tags: ['warm', 'light'] },
    { id: 'tube-light', name: 'ceiling light', kind: 'perch', x: 815, y: 108, tags: ['warm', 'light'] },
    { id: 'lamp-post', name: 'lamp post', kind: 'perch', x: 1283, y: 378, tags: ['light'] },
  ],
};

const SPOT_KINDS = new Set(['seat', 'table', 'perch', 'rest']);
function deepFreeze(o) {
  Object.freeze(o);
  for (const v of Object.values(o)) if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
  return o;
}

// Fill gaps / clamp nonsense so a bad scene can never break the sim. Returns a deep-frozen scene.
export function normalizeScene(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const D = DEFAULT_SCENE;
  const n = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(+v) ? +v : d);
  const pair = (a, d) => (Array.isArray(a) && a.length >= 2 ? [n(a[0], d[0]), n(a[1], d[1])] : d.slice());
  const f = s.floor && typeof s.floor === 'object' ? s.floor : {};
  const backY = clamp(n(f.backY, D.floor.backY), 0, 880);
  const frontY = clamp(Math.max(n(f.frontY, D.floor.frontY), backY + 40), 40, 900);
  const asc = (p) => (p[0] <= p[1] ? p : [p[1], p[0]]);
  const a = s.air && typeof s.air === 'object' ? s.air : {};
  const top = clamp(n(a.top, D.air.top), 0, 860);
  const bottom = clamp(Math.max(n(a.bottom, D.air.bottom), top + 40), 40, 900);
  const spots = [];
  const seen = new Set();
  for (const sp of Array.isArray(s.spots) ? s.spots.slice(0, 24) : []) {
    if (!sp || typeof sp !== 'object' || !fin(sp.x) || !fin(sp.y) || sp.id == null || seen.has(String(sp.id))) continue;
    seen.add(String(sp.id));
    spots.push({
      id: String(sp.id).slice(0, 32), name: String(sp.name || sp.id).slice(0, 32), kind: SPOT_KINDS.has(sp.kind) ? sp.kind : 'seat',
      x: clamp(sp.x, 0, 1600), y: clamp(sp.y, 0, 900),
      tags: (Array.isArray(sp.tags) ? sp.tags : []).slice(0, 4).map((x) => String(x).toLowerCase().slice(0, 16)),
    });
  }
  const ds = pair(s.depthScale, D.depthScale).map((v) => clamp(v, 0.2, 3));
  return deepFreeze({
    id: String(s.id || 'scene').slice(0, 40), name: String(s.name || s.id || 'scene').slice(0, 60),
    background: typeof s.background === 'string' && s.background ? s.background : D.background,
    width: 1600, height: 900, ceilingY: clamp(n(s.ceilingY, D.ceilingY), 0, 800),
    air: { top, bottom },
    floor: { backY, frontY, backX: asc(pair(f.backX, D.floor.backX)), frontX: asc(pair(f.frontX, D.floor.frontX)) },
    depthScale: ds, spots,
    notice: s.notice && fin(s.notice.x) && fin(s.notice.y) ? { x: clamp(s.notice.x, 0, 1600), y: clamp(s.notice.y, 0, 900), w: clamp(fin(s.notice.w) ? s.notice.w : 170, 60, 500) } : null,
  });
}

// hats: /presets/hats/<id>.png, shared by every engine on the page. A missing image just means no hat.
const hatCache = new Map(); // id -> { img, loading, failedAt }
function hatImage(id) {
  if (!id) return null;
  let h = hatCache.get(id);
  if (!h) { h = { img: null, loading: false, failedAt: -1e9 }; hatCache.set(id, h); }
  if (h.img) return h.img;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!h.loading && now - h.failedAt > 20000) {
    h.loading = true;
    loadImage(`/presets/hats/${encodeURIComponent(id)}.png`).then((img) => {
      h.loading = false;
      if (img) h.img = img; else h.failedAt = now;
    });
  }
  return null;
}
const cleanHat = (h) => (typeof h === 'string' && /^[a-z0-9_-]{1,32}$/i.test(h) ? h : null);

// ---------------------------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------------------------
export function createWorld({ width = 1600, height = 900, background = null } = {}) {
  const W = width, H = height;
  const things = new Map();
  const scaffolds = new Map();
  const particles = [];
  const bubbles = [];
  const ripples = [];
  const occ = new Map(); // spot id -> thing id (who occupies it)
  const pairAt = new Map(); // "idA|idB" -> time of the last onMeet for that pair
  let sigQ = []; // signals sent this tick, delivered next tick
  let sc = normalizeScene(background ? { ...DEFAULT_SCENE, background } : DEFAULT_SCENE);
  let time = 0;
  let tick = 0;
  let pointer = null;
  let views = [];
  const bodies = new Map(); // view id -> [x, body-centre y]
  let spotViews = null;
  let bgCur = null; // loaded background image (null = painted fallback backdrop)
  let bgPrev = null;
  let bgFade = 1;
  let bgToken = 0;
  let backdrop = null;
  let seq = 0;
  let scaffoldSpark = 0;

  const api = {
    width: W, height: H,
    credits: false, // projector turns this on: credit tag after arrival + on hover
    hoverId: null,
    markId: null, // phone: "yours" marker
    onQuarantine: null, // (thingView, error) => void
    onLand: null, // (thingView) => void
    onDeparted: null, // (id) => void, after a departure has faded out and the thing is gone
    view: null, // set by draw(): { s, cx, cy, cw, ch } for mapping canvas pixels to world coordinates
    get time() { return time; },
    get count() { return things.size; },
    get bubbleCount() { return bubbles.length; },
    get scene() { return sc; },
    get groundY() { return sc.floor.frontY; },
  };

  // ---- geometry (all driven by the scene) ----------------------------------------------------
  const depthY = (y) => clamp((y - sc.floor.backY) / (sc.floor.frontY - sc.floor.backY), 0, 1);
  const airT = (y) => clamp((y - sc.air.top) / (sc.air.bottom - sc.air.top), 0, 1);
  const dsAt = (k) => lerp(sc.depthScale[0], sc.depthScale[1], k);
  const depthOf = (t) => (t.zone === 'ground' ? depthY(t.me.y) : airT(t.me.y));
  const floorRange = (y) => {
    const k = depthY(y), f = sc.floor;
    return [lerp(f.backX[0], f.frontX[0], k), lerp(f.backX[1], f.frontX[1], k)];
  };
  // nearest point inside the floor trapezoid
  const toFloor = (x, y) => {
    const yy = clamp(y, sc.floor.backY, sc.floor.frontY);
    const [l, r] = floorRange(yy);
    return [clamp(x, l + 6, Math.max(l + 6, r - 6)), yy];
  };
  const airShadowY = (m) => lerp(sc.floor.backY + 30, sc.floor.frontY - 60, airT(m.y));
  const spotById = (id) => sc.spots.find((s) => s.id === id) || null;

  function geom(t) {
    const H0 = t.size === 2 ? 96 : 64;
    const b = t.box;
    const s0 = Math.min(H0 / b.sh, (1.5 * H0) / b.sw);
    const k = dsAt(depthOf(t)) * (fin(t.me.scale) ? t.me.scale : 1);
    return { dw: b.sw * s0 * k, dh: b.sh * s0 * k, k };
  }

  function slotFor(wish, zone) {
    const x0 = fin(wish.slotX) ? wish.slotX : W / 2;
    if (zone === 'air') {
      const r = rng(hashStr(String(wish.id) + 'y'))();
      return { x: clamp(x0, 40, W - 40), y: lerp(sc.air.top, sc.air.bottom, 0.15 + 0.5 * r) };
    }
    const r = rng(hashStr(String(wish.id) + 'd'))();
    const [x, y] = toFloor(x0, lerp(sc.floor.backY, sc.floor.frontY, 0.38 + 0.24 * r)); // mid-depth, a little varied
    return { x, y };
  }

  // ---- background (with the ~1.5s crossfade on scene change) ---------------------------------
  function applyBackground(url, { fade }) {
    const token = ++bgToken;
    return loadImage(url).then((img) => {
      if (token !== bgToken) return false;
      if (img && fade && bgCur) { bgPrev = bgCur; bgFade = 0; } else { bgPrev = null; bgFade = 1; }
      if (img) bgCur = img;
      return !!img;
    });
  }
  api.ready = applyBackground(sc.background, { fade: false });
  api.setBackground = (img) => { bgToken++; bgCur = img; bgPrev = null; bgFade = 1; };

  // ---- fx ------------------------------------------------------------------------------------
  function emit(kind, x, y) {
    if (particles.length > 700) return;
    const R = Math.random;
    switch (kind) {
      case 'burst':
        for (let i = 0; i < 14; i++) {
          const a = R() * TAU, sp = 120 + R() * 260;
          particles.push({ k: i % 3 === 0 ? 'star' : 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, g: 700,
            life: 0.55 + R() * 0.4, max: 0.95, size: 4 + R() * 7, col: ['#ffd27a', '#ff9d5c', '#fff0c4', '#f27a54'][i % 4], rot: R() * TAU });
        }
        break;
      case 'hearts':
        particles.push({ k: 'heart', x: x + (R() - 0.5) * 24, y, vx: (R() - 0.5) * 24, vy: -58 - R() * 30, life: 1.5, max: 1.5,
          size: 9 + R() * 6, col: ['#e8506a', '#f27a8e', '#d93f5c'][Math.floor(R() * 3)], ph: R() * TAU });
        break;
      case 'zzz':
        particles.push({ k: 'zzz', x, y, vx: 12, vy: -32, life: 2.3, max: 2.3, size: 15, col: '#f3ecff', ph: R() * TAU });
        break;
      case 'rain':
        for (let i = 0; i < 2; i++) {
          particles.push({ k: 'rain', x: x + (R() - 0.5) * 30, y, vx: -50, vy: 520 + R() * 180, life: 4, max: 4, size: 12 + R() * 8, col: '#a9cbe6',
            gy: Math.max(y + 40, lerp(sc.floor.backY, sc.floor.frontY, R())) });
        }
        break;
      case 'sparkle':
        for (let i = 0; i < 3; i++) {
          particles.push({ k: 'star', x: x + (R() - 0.5) * 70, y: y + (R() - 0.5) * 70, vx: 0, vy: -14, life: 0.5 + R() * 0.4, max: 0.9,
            size: 5 + R() * 6, col: ['#fff6c8', '#ffd86a', '#ffffff'][i % 3], rot: R() * TAU });
        }
        break;
      case 'steam':
        particles.push({ k: 'steam', x: x + (R() - 0.5) * 10, y, vx: (R() - 0.5) * 22, vy: -52 - R() * 30, life: 1.7, max: 1.7, size: 9, col: '#ffffff' });
        break;
      case 'dust':
        for (let i = 0; i < 9; i++) {
          const dir = i < 5 ? -1 : 1;
          particles.push({ k: 'steam', x: x + dir * R() * 20, y: y - 4, vx: dir * (40 + R() * 110), vy: -10 - R() * 24, life: 0.55 + R() * 0.3, max: 0.85, size: 7 + R() * 5, col: '#f1dcc0', a: 0.5 });
        }
        break;
    }
  }

  function spawnFx(t, kind, x, y) {
    if (!FX_KINDS.has(kind)) return;
    x = Number(x);
    y = Number(y);
    if (!fin(x) || !fin(y)) return;
    if (time - (t.fxAt[kind] ?? -9) < FX_GAP[kind]) return;
    t.fxAt[kind] = time;
    emit(kind, x, y);
  }

  // ---- speech bubbles (<= 2 on screen) ------------------------------------------------------
  function say(t, text, secs, force = false) {
    if (t.q && !force) return;
    let s = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!s) return;
    s = s.split(' ').slice(0, 6).join(' ').slice(0, 48);
    secs = clamp(Number(secs) || 2, 0.6, 6);
    const mine = bubbles.find((b) => b.t === t);
    if (mine) {
      if (mine.text !== s) {
        mine.text = s;
        mine.life = mine.max = secs;
        mine.age = 0;
      }
      return;
    }
    if (!force && time < t.sayCool) return;
    if (bubbles.length >= 2) {
      if (!t.inPoke && !force) return;
      bubbles.shift();
    }
    bubbles.push({ t, text: s, life: secs, max: secs, age: 0 });
  }

  // ---- thing lifecycle -----------------------------------------------------------------------
  function quarantine(t, err, where) {
    if (t.q) return;
    t.q = true;
    t.me.vx = 0;
    t.me.vy = 0;
    releaseSpot(t);
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].t === t) bubbles.splice(i, 1);
    console.warn(`[commons] ${t.id} "${t.name}" quarantined (${where}):`, err);
    emit('zzz', t.me.x + 10, t.me.y - 40);
    try { api.onQuarantine && api.onQuarantine(describe(t), err); } catch { /* ignore */ }
  }

  function guard(t, where, fn) {
    try {
      fn();
      return true;
    } catch (err) {
      quarantine(t, err, where);
      return false;
    }
  }

  function describe(t) {
    return { id: t.id, name: t.name, tags: t.tags, x: t.me.x, y: t.me.y, z: t.me.z, quarantined: t.q, wish: t.wish, spot: t.spot };
  }

  const viewOf = (t) => Object.freeze({
    id: t.id, name: t.name, tags: t.tags, zone: t.zone, x: t.me.x, y: t.me.y, z: t.me.z, vx: t.me.vx, vy: t.me.vy, spot: t.spot, hat: t.hat,
  });

  // Proximity (onMeet / signal / nearby / nearest) is measured between BODY centres, not feet: a bird skimming
  // over a cat's back counts as close, even though its y is a few hundred px "behind" the cat's feet.
  function bodyPt(t) {
    const m = t.me, dh = geom(t).dh;
    return t.zone === 'ground' ? [m.x, m.y - m.z - dh / 2] : [m.x, m.y - t.anchor * (dh / 2)];
  }
  function rebuildViews() {
    views = [];
    bodies.clear();
    for (const t of things.values()) {
      if (t.leaving || (t.arr !== null && t.arr < ARRIVE_FALL)) continue;
      views.push(viewOf(t));
      bodies.set(t.id, bodyPt(t));
    }
  }

  // callbacks into thing code: always guarded; quarantined / departing / still-landing things get none
  function callThing(t, name, ...args) {
    if (t.q || t.leaving || !t.def || typeof t.def[name] !== 'function') return;
    if (t.arr !== null && t.arr < ARRIVE_DUR) return;
    guard(t, name, () => t.def[name](t.me, t.world, ...args));
  }

  // ---- spots ---------------------------------------------------------------------------------
  function listSpots(kind) {
    if (!spotViews) {
      spotViews = sc.spots.map((s) => Object.freeze({ id: s.id, name: s.name, kind: s.kind, x: s.x, y: s.y, tags: s.tags, occupant: occ.get(s.id) || null }));
    }
    return kind ? spotViews.filter((s) => s.kind === kind) : spotViews.slice();
  }
  function releaseSpot(t) {
    if (!t.spot) return;
    if (occ.get(t.spot) === t.id) occ.delete(t.spot);
    t.spot = null;
    spotViews = null;
  }
  function leave(t) {
    if (!t.spot) return;
    releaseSpot(t);
    t.soft = 320; // glide back inside the floor / air band if the spot sat outside it
    if (t.zone === 'ground' && t.me.z <= 0.5) t.me.vz = 220; // hop down
  }
  function resolveSpot(ref) {
    const id = ref && typeof ref === 'object' ? ref.id : ref;
    return id == null ? null : spotById(String(id));
  }
  function steer(t, target, speed) {
    const m = t.me;
    if (!target || !fin(Number(target.x)) || !fin(Number(target.y))) return Infinity;
    speed = fin(Number(speed)) ? Math.max(0, Number(speed)) : 0;
    const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy);
    if (t.spot && speed > 0 && d > 4) leave(t); // asked to walk somewhere: stand up first
    if (t.spot) return d;
    if (d < 1e-3 || speed <= 0) { m.vx = 0; m.vy = 0; return d; }
    const sp = Math.min(speed, d / Math.max(t.dt, 1e-3)); // never overshoot within one tick
    m.vx = (dx / d) * sp;
    m.vy = (dy / d) * sp;
    return d;
  }
  function goTo(t, ref, speed) {
    const sp = resolveSpot(ref);
    if (!sp || t.leaving || t.q) return false;
    if (t.spot === sp.id) return true;
    const ground = t.zone === 'ground';
    if (ground && sp.kind === 'perch') return false; // walkers can't reach a lamp on the wall
    speed = fin(Number(speed)) && Number(speed) > 0 ? Math.min(Number(speed), 1200) : 120;
    const m = t.me;
    if (t.spot) leave(t);
    const [fx, fy] = ground ? toFloor(sp.x, sp.y) : [sp.x, sp.y]; // walkers aim for the nearest floor point
    const taken = occ.get(sp.id);
    if (ground && m.z > 6) { m.vx = 0; m.vy = 0; return false; } // wait for the hop to land
    t.goal = { y: sp.y, tick };
    const d = steer(t, { x: fx, y: fy }, speed);
    if (taken && taken !== t.id) { // someone is sitting there: wait politely next to it
      if (d < 44) { m.vx = 0; m.vy = 0; }
      return false;
    }
    if (d <= Math.max(speed * t.dt * 1.05, 4)) { // arrived: the engine pins the feet to the spot
      t.spot = sp.id;
      occ.set(sp.id, t.id);
      spotViews = null;
      [m.x, m.y] = ground ? toFloor(sp.x, sp.y) : [sp.x, sp.y]; m.z = 0; m.vx = 0; m.vy = 0; m.vz = 0;
      t.soft = 0;
      return true;
    }
    return false;
  }

  // ---- signals + meetings --------------------------------------------------------------------
  function signal(t, kind, toId) {
    if (t.q || t.leaving) return;
    const k = String(kind ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!k) return;
    if (time - t.sigWin >= 1) { t.sigWin = time; t.sigN = 0; }
    if (++t.sigN > 8 || sigQ.length > 80) return; // no signal storms
    const from = viewOf(t);
    const id = toId !== null && typeof toId === 'object' ? toId.id : toId;
    if (id !== undefined && id !== null) {
      const r = things.get(String(id));
      if (r && r !== t && !r.leaving) sigQ.push({ to: r.id, from, kind: k });
      return;
    }
    const me = bodyPt(t);
    for (const v of views) {
      const b = bodies.get(v.id);
      if (v.id !== t.id && Math.hypot(b[0] - me[0], b[1] - me[1]) <= SIGNAL_R) sigQ.push({ to: v.id, from, kind: k });
    }
  }
  function deliverSignals() {
    if (!sigQ.length) return;
    const batch = sigQ;
    sigQ = [];
    for (const s of batch) {
      const r = things.get(s.to);
      if (r) callThing(r, 'onSignal', Object.freeze({ from: s.from, fromId: s.from.id, kind: s.kind }));
    }
  }
  function runMeets() {
    const n = views.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = views[i], b = views[j];
        const pa = bodies.get(a.id), pb = bodies.get(b.id);
        if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) > MEET_R) continue;
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        if (time - (pairAt.get(key) ?? -99) < MEET_COOL) continue;
        pairAt.set(key, time);
        const ta = things.get(a.id), tb = things.get(b.id);
        if (ta) callThing(ta, 'onMeet', b);
        if (tb) callThing(tb, 'onMeet', a);
      }
    }
  }

  // ---- thing construction --------------------------------------------------------------------
  function makeMe(t, x, y) {
    const me = { x, y, z: 0, vx: 0, vy: 0, vz: 0, angle: 0, scale: 1, flip: false, alpha: 1, anim: null, state: {} };
    Object.defineProperties(me, {
      id: { get: () => t.id, set() {}, enumerable: true },
      name: { get: () => t.name, set() {}, enumerable: true },
      tags: { get: () => t.tags, set() {}, enumerable: true },
      zone: { get: () => t.zone, set() {}, enumerable: true },
      size: { get: () => t.size, set() {}, enumerable: true },
      spot: { get: () => t.spot, set() {}, enumerable: true },
      depth: { get: () => depthOf(t), set() {}, enumerable: true },
      say: { value: (text, secs) => say(t, text, secs), enumerable: false },
      signal: { value: (kind, toId) => signal(t, kind, toId), enumerable: false },
    });
    return me;
  }

  // the reference point: the caller's own body centre (when it passes its `me`), else the given {x, y} as is
  const refPoint = (t, me) => (!me || me === t.me || !fin(me.x) || !fin(me.y) ? bodyPt(t) : [me.x, me.y]);
  function nearestFor(t, me, tag) {
    const ref = refPoint(t, me);
    let best = null, bd = Infinity;
    for (const v of views) {
      if (v.id === t.id) continue;
      if (tag && !v.tags.includes(tag)) continue;
      const b = bodies.get(v.id), d = Math.hypot(b[0] - ref[0], b[1] - ref[1]);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  function nearbyFor(t, me, radius) {
    const ref = refPoint(t, me);
    const r = fin(Number(radius)) ? Number(radius) : 200;
    const out = [];
    for (const v of views) {
      if (v.id === t.id) continue;
      const b = bodies.get(v.id), d = Math.hypot(b[0] - ref[0], b[1] - ref[1]);
      if (d <= r) out.push([d, v]);
    }
    out.sort((a, b) => a[0] - b[0]);
    return out.map((e) => e[1]);
  }

  function makeWorldFor(t) {
    return Object.freeze({
      get time() { return time; },
      width: W,
      height: H,
      get groundY() { return sc.floor.frontY; }, // v1 leftover; scene.floor is the real thing
      get pointer() { return pointer; },
      get scene() { return sc; },
      random: t.rand,
      dist: (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity),
      nearest: (me, tag) => nearestFor(t, me, tag),
      nearby: (me, radius) => nearbyFor(t, me, radius),
      things: (tag) => views.filter((v) => v.id !== t.id && (!tag || v.tags.includes(tag))),
      spots: (kind) => listSpots(kind),
      steer: (me, target, speed) => steer(t, target, speed),
      goTo: (me, spot, speed) => goTo(t, spot, speed),
      leave: () => leave(t),
      fx: (kind, x, y) => spawnFx(t, kind, x, y),
    });
  }

  function setSpriteOn(t, spriteImg) {
    t.sprite = spriteImg || null;
    t.blob = !t.sprite; // the fallback blob carries the name: never mirror it
    if (!t.sprite) t.sprite = makeBlob(t.id, t.name);
    t.box = t.anim ? t.box : spriteBox(t.sprite);
    t.grey = null;
    t.patchW = null;
  }

  // ---- sprite sheets: frames.png strip + anim.json (SPEC: animated things) -----------------------
  const ANIMS = ['walk', 'fly', 'idle', 'sit', 'sleep', 'action'];
  function prepAnim(a) { // per-frame content top / centre / width, for hats
    if (!a || !a.img || !a.meta) return null;
    const { frameW: fw, frameH: fh, count } = a.meta;
    const fr = [];
    try {
      const c = document.createElement('canvas');
      c.width = fw * count; c.height = fh;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(a.img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < count; i++) {
        let x0 = fw, x1 = -1, y0 = fh;
        for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (d[(y * c.width + i * fw + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; }
        fr.push(x1 >= x0 ? { top: y0, cx: (x0 + x1) / 2, w: x1 - x0 + 1 } : { top: 0, cx: fw / 2, w: fw });
      }
    } catch { for (let i = 0; i < count; i++) fr.push({ top: 0, cx: fw / 2, w: fw }); }
    return { img: a.img, meta: a.meta, fr };
  }
  function setAnimOn(t, a) {
    const pa = prepAnim(a);
    t.anim = pa;
    if (pa) {
      t.box = { sx: 0, sy: 0, sw: pa.meta.frameW, sh: pa.meta.frameH };
      t.af = { name: 'idle', i: 0, ph: 0, idle: 0, px: t.me ? t.me.x : 0, py: t.me ? t.me.y : 0, flip: false, bob: 0 };
    } else { t.af = null; t.box = spriteBox(t.sprite); }
    return !!pa;
  }
  api.hasAnim = (id) => !!things.get(id)?.anim;
  /** Swap in the animation live: "it learns to walk". */
  api.setAnim = (id, a, { sparkle = true } = {}) => {
    const t = things.get(id);
    if (!t || !setAnimOn(t, a)) return;
    if (sparkle) {
      const r = t.rect, cx = r ? (r.x0 + r.x1) / 2 : t.me.x, cy = r ? (r.y0 + r.y1) / 2 : t.me.y - 70;
      emit('sparkle', cx, cy); emit('burst', cx, cy);
      setTimeout(() => things.has(id) && emit('sparkle', cx, cy), 250);
    }
  };
  function animStep(t, dt, thingRan) {
    const m = t.me, f = t.af, A = t.anim;
    if (!f || !A) return;
    const k = geom(t).k, d = Math.hypot(m.x - f.px, m.y - f.py);
    f.px = m.x; f.py = m.y;
    const speed = dt > 0 ? d / dt : 0;
    // facing: the thing's own explicit flip wins on the tick it changes, otherwise follow vx
    if (t.leaving) f.flip = m.flip;
    else if (thingRan && m.flip !== t.flipBefore) f.flip = m.flip;
    else if (Math.abs(m.vx) > 8) f.flip = m.vx < 0;
    const forced = ANIMS.includes(m.anim) ? m.anim : null;
    const moving = speed > 15;
    if (moving || t.spot) f.idle = 0; else f.idle += dt;
    const an = A.meta.anims;
    let name;
    if (t.leaving) name = t.zone === 'air' && an.fly ? 'fly' : 'walk';
    else if (forced) name = forced;
    else if (t.actionUntil > time && an.action) name = 'action';
    else if (t.zone === 'air' && !t.spot) name = an.fly ? 'fly' : moving ? 'walk' : 'idle';
    else if (m.z > 4 || Math.abs(m.vz) > 150) name = an.fly ? 'fly' : 'action';
    else if (t.spot) name = 'sit';
    else if (moving) name = 'walk';
    else name = f.idle > 8 ? 'sleep' : 'idle';
    const seq = an[name] || (name === 'fly' ? an.walk : null) || an.idle || [0];
    if (name !== f.name) { f.name = name; if (name !== 'walk' && name !== 'fly') f.ph = 0; }
    if (name === 'fly') f.ph += dt * 9;
    if (name === 'walk') {
      f.ph += moving || t.leaving ? d / (10 * k) : forced ? dt * 6 : 0;
      f.bob = moving || t.leaving ? Math.abs(Math.sin(f.ph * Math.PI / 2)) : 0;
    } else f.bob = 0;
    f.i = seq[Math.floor(f.ph) % seq.length] ?? 0;
  }

  api.add = (wish, mod, spriteImg, patchImg, opts = {}) => {
    api.remove(wish.id, { silent: true });
    const def = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
    const meta = wish.thing || {};
    const ok = def && typeof def === 'object' && typeof def.update === 'function';
    const t = {
      id: wish.id, wish, def: ok ? def : null, q: false, idx: seq++, age: 0, fxAt: {}, sayCool: 0, inPoke: false,
      name: String((ok && def.name) || meta.name || 'thing').slice(0, 24),
      tags: Object.freeze((Array.isArray(ok && def.tags) ? def.tags : meta.tags || []).slice(0, 4).map((s) => String(s).toLowerCase())),
      zone: ((ok && def.zone) || meta.zone) === 'air' ? 'air' : 'ground',
      size: ((ok && def.size) || meta.size) === 2 ? 2 : 1,
      rand: rng(hashStr(wish.id + ':' + (wish.n ?? ''))),
      arr: opts.arrive ? 0 : null, landed: !opts.arrive, landedAt: opts.arrive ? null : -99,
      poke: 0, breath: Math.random() * TAU, rect: null, patch: patchImg || null, patchX: 0, patchY: 0, patchW: null,
      spot: null, anchor: 0, soft: 0, goal: null, dt: 1 / 60, leaving: null, fade: 1, sigWin: -9, sigN: 0,
      hat: cleanHat(wish.hat),
    };
    const pos = slotFor(wish, t.zone);
    t.me = makeMe(t, pos.x, pos.y);
    t.world = makeWorldFor(t);
    t.last = { x: pos.x, y: pos.y };
    t.patchX = pos.x;
    t.patchY = t.zone === 'air' ? lerp(sc.floor.backY, sc.floor.frontY, 0.5) : pos.y; // bleed patch: the floor under the arrival point
    setSpriteOn(t, spriteImg);
    things.set(t.id, t);
    if (opts.anim) setAnimOn(t, opts.anim);
    rebuildViews();
    if (!ok) quarantine(t, new Error('module did not load or has no update()'), 'load');
    else if (typeof def.init === 'function') guard(t, 'init', () => def.init(t.me, t.world));
    if (t.zone === 'ground') { [t.me.x, t.me.y] = toFloor(fin(t.me.x) ? t.me.x : pos.x, fin(t.me.y) ? t.me.y : pos.y); t.me.z = 0; }
    t.last.x = t.me.x;
    t.last.y = t.me.y;
    return describe(t);
  };

  api.remove = (id, { silent = false } = {}) => {
    const t = things.get(id);
    if (!t) return false;
    releaseSpot(t);
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].t === t) bubbles.splice(i, 1);
    if (!silent) {
      emit('dust', t.me.x, t.me.y - t.me.z);
      emit('burst', t.me.x, t.me.y - t.me.z - 40);
    }
    things.delete(id);
    for (const k of pairAt.keys()) if (k.startsWith(id + '|') || k.endsWith('|' + id)) pairAt.delete(k);
    return true;
  };

  api.clear = () => {
    things.clear();
    bubbles.length = 0;
    occ.clear();
    pairAt.clear();
    sigQ = [];
    spotViews = null;
  };
  api.has = (id) => things.has(id);
  api.list = () => [...things.values()].map(describe);

  api.setSprite = (id, spriteImg, patchImg) => {
    const t = things.get(id);
    if (!t) return;
    setSpriteOn(t, spriteImg);
    if (patchImg !== undefined) t.patch = patchImg;
  };
  api.updateWish = (wish) => {
    const t = things.get(wish.id);
    if (!t) return;
    t.wish = wish;
    t.hat = cleanHat(wish.hat);
  };
  api.showCard = (id) => { const t = things.get(id); if (t && !t.leaving) t.cardUntil = time + 5; };

  // owner controls: mood from the wish (sleep / moody / normal)
  const moodOf = (t) => (t.wish && t.wish.mood) || 'normal';

  // ---- departures: "bye!", walk off (or fly up), fade, gone ----------------------------------
  api.depart = (id) => {
    const t = things.get(id);
    if (!t || t.leaving) return false;
    if (!t.landed) { api.remove(id, { silent: true }); return true; }
    releaseSpot(t);
    t.soft = 0;
    const dir = t.me.x < W / 2 ? -1 : 1; // nearest side edge
    t.leaving = t.zone === 'air' ? { mode: 'fly', age: 0, vy: 40, vx: dir * 40 } : { mode: 'walk', age: 0, dir };
    t.me.vx = t.me.vy = t.me.vz = 0;
    say(t, 'bye!', 2.4, true);
    return true;
  };
  api.isDeparting = (id) => { const t = things.get(id); return !!(t && t.leaving); };

  function stepLeaving(t, dt) {
    const m = t.me, L = t.leaving;
    L.age += dt;
    t.breath += dt * 2;
    if (L.mode === 'walk') {
      m.x += L.dir * LEAVE_SPEED * dt;
      m.y = clamp(m.y, sc.floor.backY, sc.floor.frontY);
      m.z = Math.abs(Math.sin(L.age * 9)) * 9; // little walking hops
      m.flip = L.dir < 0;
      const edge = L.dir < 0 ? m.x : W - m.x;
      t.fade = clamp(edge / 110, 0, 1);
      if (edge <= 0 || L.age > 40) finishLeaving(t);
    } else {
      L.vy = Math.min(L.vy + 560 * dt, 480);
      m.y -= L.vy * dt;
      m.x += L.vx * dt;
      m.flip = L.vx < 0;
      m.angle = clamp(-L.vx / 900, -0.3, 0.3);
      t.fade = clamp(1 - (L.age - 0.5) / 1.1, 0, 1);
      if (t.fade <= 0 || m.y < -geom(t).dh) finishLeaving(t);
    }
  }
  function finishLeaving(t) {
    const id = t.id;
    api.remove(id, { silent: true });
    try { api.onDeparted && api.onDeparted(id); } catch { /* ignore */ }
  }

  /** The sheet's 'special' frame for ~0.8s with a burst. */
  api.special = (id) => {
    const t = things.get(id);
    if (!t || t.leaving) return;
    if (t.anim && t.anim.meta.anims.action) t.actionUntil = time + 0.8;
    emit('burst', t.me.x, t.rect ? (t.rect.y0 + t.rect.y1) / 2 : t.me.y - 30);
  };
  api.poke = (id) => {
    const t = things.get(id);
    if (!t || t.leaving) return;
    t.poke = 0.001;
    api.special(id);
    const r = t.rect;
    ripples.push({ x: t.me.x, y: r ? (r.y0 + r.y1) / 2 : t.me.y - 40, age: 0 });
    if (t.q || (t.arr !== null && t.arr < ARRIVE_DUR) || !t.def || typeof t.def.onPoke !== 'function') return;
    t.inPoke = true;
    guard(t, 'onPoke', () => t.def.onPoke(t.me, t.world));
    t.inPoke = false;
  };

  api.setPointer = (x, y) => {
    pointer = x == null || !fin(x) || !fin(y) ? null : Object.freeze({ x, y });
  };

  // ---- scene changes: crossfade the background, re-clamp everyone into the new floor ---------
  api.setScene = (raw) => {
    const next = normalizeScene(raw);
    const bgChanged = next.background !== sc.background;
    sc = next;
    spotViews = null;
    if (bgChanged) api.ready = applyBackground(next.background, { fade: true });
    // spots: drop occupancy that no longer matches the new map
    for (const t of things.values()) {
      if (t.spot) {
        const sp = spotById(t.spot);
        if (!sp || Math.hypot(sp.x - t.me.x, sp.y - t.me.y) > 2) { releaseSpot(t); t.soft = 700; if (t.zone === 'ground') [t.me.x, t.me.y] = toFloor(t.me.x, t.me.y); if (t.zone === 'ground') t.me.vz = 380; }
      }
    }
    occ.clear();
    for (const t of things.values()) if (t.spot) occ.set(t.spot, t.id);
    for (const t of things.values()) {
      if (t.leaving || t.spot) continue;
      const m = t.me;
      let tx = m.x, ty = m.y;
      if (t.zone === 'ground') [tx, ty] = toFloor(m.x, m.y);
      else { tx = clamp(m.x, 30, W - 30); ty = clamp(m.y, sc.air.top, sc.air.bottom); }
      if (Math.hypot(tx - m.x, ty - m.y) > 3) {
        if (t.zone === 'ground') { m.x = tx; m.y = ty; t.soft = 0; continue; }
        t.soft = 700; // scoot into the new floor, with a small hop
        if (t.zone === 'ground' && m.z <= 0.5) m.vz = 380;
      }
    }
    for (const s of scaffolds.values()) { const p = slotFor(s.wish, 'ground'); s.x = p.x; s.y = p.y; }
    for (const t of things.values()) { // patches stay glued to the floor of the new room
      if (t.patch) { const p = slotFor(t.wish, t.zone); t.patchX = p.x; t.patchY = t.zone === 'air' ? lerp(sc.floor.backY, sc.floor.frontY, 0.5) : p.y; }
    }
    rebuildViews();
    return api.ready;
  };

  // ---- scaffolds (wish still being built) ----------------------------------------------------
  api.setScaffold = (wish) => {
    let s = scaffolds.get(wish.id);
    if (!s) {
      s = { id: wish.id, born: time, since: time, status: wish.status, p: 0, dying: null, x: 0, y: 0 };
      scaffolds.set(wish.id, s);
    }
    if (s.status !== wish.status) { s.status = wish.status; s.since = time; }
    s.wish = wish;
    const p = slotFor(wish, 'ground');
    s.x = p.x;
    s.y = p.y;
    s.dying = null;
  };
  api.clearScaffold = (id, poof = true) => {
    const s = scaffolds.get(id);
    if (!s) return;
    if (poof) emit('dust', s.x, s.y);
    scaffolds.delete(id);
  };
  api.hasScaffold = (id) => scaffolds.has(id);

  function scaffoldTarget(s) {
    const e = time - s.since;
    switch (s.status) {
      case 'screening': return 0.03 + 0.05 * (1 - Math.exp(-e / 3));
      case 'queued': return 0.09 + 0.04 * (1 - Math.exp(-e / 15));
      case 'coding': return 0.14 + 0.46 * (1 - Math.exp(-e / 20));
      case 'testing': return 0.62 + 0.3 * (1 - Math.exp(-e / 9));
      default: return 1;
    }
  }

  // ---- step ----------------------------------------------------------------------------------
  api.step = (dt) => {
    dt = clamp(Number(dt) || 0, 0, 0.05);
    time += dt;
    tick++;
    if (bgFade < 1) {
      bgFade = Math.min(1, bgFade + dt / BG_FADE);
      if (bgFade >= 1) bgPrev = null;
    }
    rebuildViews();
    deliverSignals();
    runMeets();

    for (const t of [...things.values()]) {
      if (!things.has(t.id)) continue; // departed while we were iterating
      t.age += dt;
      t.breath += dt * 2;
      t.dt = dt;
      if (t.poke > 0) { t.poke += dt; if (t.poke > 0.5) t.poke = 0; }
      if (t.arr !== null) {
        t.arr += dt;
        if (!t.landed && t.arr >= ARRIVE_FALL) {
          t.landed = true;
          t.landedAt = time;
          emit('dust', t.me.x, t.zone === 'air' ? t.me.y + 30 : t.me.y);
          try { api.onLand && api.onLand(describe(t)); } catch { /* ignore */ }
        }
        if (t.arr < ARRIVE_DUR) continue; // held while landing
        t.arr = null;
      }
      if (t.leaving) { stepLeaving(t, dt); animStep(t, dt, false); continue; }
      const m = t.me;
      t.flipBefore = m.flip;
      const mood = moodOf(t);
      if (mood === 'sleep' && !t.q) {
        m.vx = 0; m.vy = 0;
        if (t.anim) { m.anim = 'sleep'; t.petAnim = true; } else { m.angle = -1.15; t.petAngle = true; }
        t.moodT = (t.moodT || 0) - dt;
        if (t.moodT <= 0 && t.rect) { t.moodT = 1.6; emit('zzz', m.x + 10, t.rect.y0 + 10); }
      } else {
        if (t.petAnim) { t.petAnim = false; m.anim = null; }
        if (t.petAngle) { t.petAngle = false; m.angle = 0; }
      }
      const mdt = mood === 'moody' ? dt * 0.5 : dt;
      if (mood === 'moody' && !t.q && t.rect) {
        t.moodT = (t.moodT || 0) - dt;
        if (t.moodT <= 0) { t.moodT = 2.5 + Math.random() * 2; t.rainFor = 1.2; if (Math.random() < 0.5) say(t, 'hmph.', 1.8); }
        if (t.rainFor > 0) { t.rainFor -= dt; if (Math.random() < dt * 12) emit('rain', m.x + (Math.random() - 0.5) * 40, t.rect.y0 - 40); }
      }
      if (!t.q && t.def && mood !== 'sleep') guard(t, 'update', () => t.def.update(m, t.world, mdt));
      integrate(t, mdt);
      animStep(t, dt, true);
      // anchor easing: perched / seated air things stand on the spot, flying ones hang from their centre
      const want = t.spot ? 1 : 0;
      t.anchor += (want - t.anchor) * Math.min(1, dt * 9);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.g) p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.k === 'rain' && p.y >= p.gy) {
        if (Math.random() < 0.5) particles.push({ k: 'splash', x: p.x, y: p.gy, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 6, col: '#cfe4f3' });
        p.life = 0;
      }
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].age += dt;
      if (ripples[i].age > 0.7) ripples.splice(i, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.age += dt;
      b.life -= dt;
      if (b.life <= 0) { b.t.sayCool = time + 1.2; bubbles.splice(i, 1); }
    }

    // scaffolds: smooth ring progress, a few sparks while Codex works
    scaffoldSpark -= dt;
    for (const s of scaffolds.values()) {
      s.p += (scaffoldTarget(s) - s.p) * Math.min(1, dt * 2.2);
      if (scaffoldSpark <= 0 && s.status === 'coding') emit('sparkle', s.x, s.y - 50 * dsAt(depthY(s.y)));
    }
    if (scaffoldSpark <= 0) scaffoldSpark = 0.5;

    // quarantined things breathe out the odd zzz
    for (const t of things.values()) {
      if (t.q && t.landed && Math.random() < dt * 0.35) emit('zzz', t.me.x + 14, t.rect ? t.rect.y0 : t.me.y - 70);
    }
  };

  function integrate(t, dt) {
    const m = t.me;
    if (!(fin(m.x) && fin(m.y) && fin(m.z) && fin(m.vx) && fin(m.vy) && fin(m.vz) && fin(m.angle) && fin(m.scale) && fin(m.alpha))) {
      quarantine(t, new Error('non-finite value on me'), 'physics');
      m.x = t.last.x; m.y = t.last.y; m.z = 0; m.vx = 0; m.vy = 0; m.vz = 0;
      if (!fin(m.angle)) m.angle = 0;
      if (!fin(m.scale)) m.scale = 1;
      if (!fin(m.alpha)) m.alpha = 1;
    }
    const ground = t.zone === 'ground';
    m.scale = clamp(m.scale, 0.1, 4);
    m.alpha = clamp(m.alpha, 0, 1);
    if (Math.abs(m.angle) > 1e4) m.angle %= TAU;

    if (t.spot) { // occupied spot: the feet are pinned until leave()
      const sp = spotById(t.spot);
      if (sp) { if (ground) [m.x, m.y] = toFloor(sp.x, sp.y); else { m.x = sp.x; m.y = sp.y; } m.z = 0; m.vx = m.vy = m.vz = 0; t.last.x = m.x; t.last.y = m.y; return; }
      releaseSpot(t);
    }

    if (ground) {
      m.vz -= GRAVITY * dt;
      m.z += m.vz * dt;
      if (m.z <= 0) { m.z = 0; if (m.vz < 0) m.vz = 0; }
    } else { m.z = 0; m.vz = 0; }
    m.x += m.vx * dt;
    m.y += m.vy * dt;

    // bounds: floor trapezoid for walkers, the air band for fliers (a goTo() target may stretch it)
    let tx, ty;
    if (ground) {
      [tx, ty] = toFloor(m.x, m.y);
    } else {
      let lo = sc.air.top, hi = sc.air.bottom;
      if (t.goal && t.goal.tick >= tick - 1) { lo = Math.min(lo, t.goal.y); hi = Math.max(hi, t.goal.y); }
      tx = clamp(m.x, 30, W - 30);
      ty = clamp(m.y, lo, hi);
    }
    if (t.soft > 0 && !ground) {
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), step = t.soft * dt;
      if (d <= step) { m.x = tx; m.y = ty; t.soft = 0; } else { m.x += (dx / d) * step; m.y += (dy / d) * step; }
    } else {
      if (tx !== m.x) { if ((tx > m.x && m.vx < 0) || (tx < m.x && m.vx > 0)) m.vx = 0; m.x = tx; }
      if (ty !== m.y) { if ((ty > m.y && m.vy < 0) || (ty < m.y && m.vy > 0)) m.vy = 0; m.y = ty; }
    }
    if (ground && m.z > 0) { // nothing goes above the ceiling
      const maxZ = Math.max(0, m.y - geom(t).dh - sc.ceilingY);
      if (m.z > maxZ) { m.z = maxZ; if (m.vz > 0) m.vz = 0; }
    }
    t.last.x = m.x;
    t.last.y = m.y;
  }

  // ---- hit testing ---------------------------------------------------------------------------
  const sortKey = (t) => {
    if (t.zone === 'ground') return t.me.y;
    if (t.spot) { const sp = spotById(t.spot); if (sp) return sp.y; }
    return airShadowY(t.me);
  };
  const drawOrder = () => [...things.values()].sort((a, b) => sortKey(a) - sortKey(b) || a.idx - b.idx);

  api.thingAt = (x, y) => {
    const arr = drawOrder();
    for (let i = arr.length - 1; i >= 0; i--) {
      const r = arr[i].rect;
      if (arr[i].leaving) continue;
      if (r && x >= r.x0 - 8 && x <= r.x1 + 8 && y >= r.y0 - 8 && y <= r.y1 + 8) return arr[i].id;
    }
    return null;
  };
  // visual centre of a thing (or of a scaffold) for cameras
  api.focus = (id) => {
    const t = things.get(id);
    if (t) return { x: t.me.x, y: t.rect ? (t.rect.y0 + t.rect.y1) / 2 : t.me.y - 60, thing: true };
    const s = scaffolds.get(id);
    if (s) return { x: s.x, y: s.y - 80 * dsAt(depthY(s.y)), thing: false };
    return null;
  };

  // ---- draw ----------------------------------------------------------------------------------
  function arrivalPose(a) {
    if (a < ARRIVE_FALL) {
      const u = a / ARRIVE_FALL;
      return { dy: -(1 - u * u) * 640, sx: lerp(1, 0.86, u), sy: lerp(1, 1.22, u), alpha: Math.min(1, a / 0.1), u };
    }
    const e = a - ARRIVE_FALL;
    const k = Math.exp(-e * 7) * Math.cos(e * 22);
    return { dy: 0, sx: 1 + 0.32 * k, sy: 1 - 0.38 * k, alpha: 1, u: 1 };
  }

  function drawCover(ctx, img, alpha) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const ar = iw / ih, tr = W / H;
    let sw = iw, sh = ih, sx = 0, sy = 0;
    if (ar > tr) { sw = sh * tr; sx = (iw - sw) / 2; } else if (ar < tr) { sh = sw / tr; sy = (ih - sh) / 2; }
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  function drawShadow(ctx, t) {
    const m = t.me;
    if (t.leaving && t.leaving.mode === 'fly') return;
    const { dw } = geom(t);
    const pose = t.arr !== null ? arrivalPose(t.arr) : null;
    let sx = m.x, sy, a, rx;
    if (t.zone === 'ground') {
      const lift = clamp(m.z / 160, 0, 1);
      sy = m.y;
      a = 0.3 * (1 - lift * 0.65);
      rx = dw * 0.44 * (1 - lift * 0.3);
    } else if (t.spot) {
      const sp = spotById(t.spot);
      if (!sp || sp.kind === 'perch') return; // a bird on a wall lamp casts nothing on the floor
      sy = sp.y;
      a = 0.22;
      rx = dw * 0.36;
    } else {
      sy = airShadowY(m);
      a = 0.14;
      rx = dw * 0.3;
    }
    a *= m.alpha * t.fade * (t.q ? 0.6 : 1);
    if (pose) a *= pose.u * pose.u;
    rx = Math.max(4, rx);
    ctx.fillStyle = `rgba(40,20,36,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(sx - dw * 0.06, sy + 2, rx, Math.max(2, rx * 0.2), 0, 0, TAU);
    ctx.fill();
  }

  function drawThing(ctx, t) {
    const m = t.me;
    const { dw, dh } = geom(t);
    const ground = t.zone === 'ground';
    const pose = t.arr !== null ? arrivalPose(t.arr) : { dy: 0, sx: 1, sy: 1, alpha: 1 };
    let sx = pose.sx, sy = pose.sy;
    if (t.poke > 0) {
      const k = Math.sin((t.poke / 0.5) * Math.PI * 3) * Math.exp(-t.poke * 5) * 0.2;
      sx -= k * 0.6; sy += k;
    }
    if (!t.q) {
      const br = Math.sin(t.breath) * 0.018;
      sy += br; sx -= br * 0.5;
    }
    const x = m.x;
    const baseY = m.y - (ground ? m.z : 0) + pose.dy; // feet (ground) / anchor point (air)
    const lift = ground ? 1 : t.anchor; // 1 = feet anchored, 0 = centre anchored
    const cy = baseY - lift * (dh / 2);
    t.rect = { x0: x - dw / 2, x1: x + dw / 2, y0: cy - dh / 2, y1: cy + dh / 2 };
    let src = t.sprite, box = t.box, alpha = m.alpha * pose.alpha * t.fade;
    if (t.q) {
      if (t.grey === null) t.grey = greyCopy(t.sprite, t.box) || false;
      if (t.grey) { src = t.grey; box = { sx: 0, sy: 0, sw: t.grey.width, sh: t.grey.height }; alpha *= 0.85; }
      else alpha *= 0.5;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, baseY);
    ctx.scale(sx, sy);
    ctx.translate(0, -lift * (dh / 2));
    ctx.save();
    ctx.rotate(m.angle + (moodOf(t) === 'moody' ? 0.09 : 0));
    const an = !t.q && t.anim && t.af ? t.anim : null, fi = an ? t.af.i : 0, flp = an ? t.af.flip : m.flip && !t.blob;
    const bob = an ? -t.af.bob * 3 * geom(t).k : 0;
    if (bob) ctx.translate(0, bob);
    if (flp) ctx.scale(-1, 1);
    if (an) ctx.drawImage(an.img, fi * an.meta.frameW, 0, an.meta.frameW, an.meta.frameH, -dw / 2, -dh / 2, dw, dh);
    else ctx.drawImage(src, box.sx, box.sy, box.sw, box.sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    const hat = t.hat ? hatImage(t.hat) : null;
    if (hat) { // rides on the sprite's opaque bounding box, tilting with the thing (a rolling durian keeps its hat on top)
      const hb = spriteBox(hat);
      const F = an ? an.fr[fi] : null; // current frame's content box (animated things)
      const hw = (F ? (F.w / an.meta.frameW) * dw : dw) * 0.55, hh = hw * (hb.sh / hb.sw);
      const hx = F ? ((F.cx - an.meta.frameW / 2) / an.meta.frameW) * dw * (t.af.flip ? -1 : 1) : 0;
      const hy = F ? (F.top / an.meta.frameH) * dh : 0;
      let a = m.angle % TAU;
      if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU;
      ctx.save();
      ctx.rotate(clamp(a, -0.5, 0.5) - 0.05 + Math.sin(t.age * 2.3) * 0.015);
      ctx.translate(hx, -dh / 2 + hy + hh * 0.22 + bob);
      ctx.drawImage(hat, hb.sx, hb.sy, hb.sw, hb.sh, -hw / 2, -hh, hw, hh);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPatch(ctx, t) {
    if (!t.patch || !t.landed || t.leaving) return;
    const pw = t.patch.naturalWidth || t.patch.width || 1, ph = t.patch.naturalHeight || t.patch.height || 1;
    if (t.patchW === null) t.patchW = geom(t).dw * 3; // 3x the thing's width at its arrival depth
    const w = t.patchW, ar = ph / pw;
    const k = clamp((time - t.landedAt) / 1.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.drawImage(t.patch, t.patchX - w / 2, t.patchY - w * ar * 0.55, w, w * ar);
    ctx.restore();
  }

  function pill(ctx, x, y, lines, opts = {}) {
    const fs = opts.fs || 20;
    ctx.font = `${opts.bold === false ? 500 : 700} ${fs}px ${HAND}`;
    const widths = lines.map((l) => ctx.measureText(l.text).width);
    const w = Math.max(...widths) + 22, h = lines.length * fs * 1.2 + 12;
    const px = clamp(x - w / 2, 8, W - w - 8);
    const py = clamp(y - h, 6, H - h - 6);
    ctx.save();
    ctx.globalAlpha *= opts.alpha ?? 1;
    ctx.fillStyle = opts.fill || 'rgba(255,243,214,0.96)';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    roundRect(ctx, px, py, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      ctx.font = `${l.bold === false ? 500 : 700} ${l.fs || fs}px ${HAND}`;
      ctx.fillStyle = l.col || INK;
      ctx.fillText(l.text, px + w / 2, py + 6 + (i + 0.5) * fs * 1.2);
    });
    ctx.restore();
    return { x: px, y: py, w, h };
  }

  function creditLines(t) {
    const w = t.wish || {};
    if (w.resident) return [{ text: t.name }, { text: 'a resident of the Commons', bold: false, fs: 16, col: '#7a5a40' }];
    return [{ text: t.name }];
  }

  function drawOverlayFor(ctx, t) {
    if (!t.landed || !t.rect || t.leaving) return;
    const hasBubble = bubbles.some((b) => b.t === t);
    const hovered = api.hoverId === t.id;
    let ta = 0;
    if (api.credits) {
      const e = time - t.landedAt;
      ta = e < 0.35 ? 0 : e < 0.85 ? (e - 0.35) / 0.5 : e < 7.5 ? 1 : e < 9 ? 1 - (e - 7.5) / 1.5 : 0;
      if (t.landedAt < 0) ta = 0;
    }
    if (hovered) ta = 1;
    const cx = t.me.x;
    const above = t.rect.y0 - 10, below = t.rect.y1 + 36;
    const note = t.wish && t.wish.note ? String(t.wish.note) : '';
    let tagTop = above;
    if (note) {
      const short = note.length > 28 ? note.slice(0, 27) + '…' : note;
      const r = pill(ctx, cx, above, [{ text: short, bold: false, fs: 16, col: '#5a3d2a' }], { fs: 16, fill: 'rgba(255,250,235,0.97)' });
      tagTop = r.y - 4;
    }
    if (t.cardUntil > time) {
      const w = t.wish || {}, lines = [{ text: t.name }, { text: w.resident ? 'a resident of the Commons' : `wished by ${w.name || 'someone'}`, bold: false, fs: 16, col: '#7a5a40' }];
      if (note) lines.push({ text: `“${note}”`, bold: false, fs: 16, col: '#5a3d2a' });
      pill(ctx, cx, t.rect.y1 + 14 + lines.length * 26, lines, { alpha: Math.min(1, (t.cardUntil - time) / 0.4), fs: 20 });
    }
    if (ta > 0) {
      const lines = creditLines(t);
      const place = hasBubble || t.q ? below + lines.length * 24 : tagTop;
      pill(ctx, cx, place, lines, { alpha: ta, fs: 20 });
    }
    if (t.q) {
      ctx.save();
      ctx.font = `600 italic 18px ${HAND}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,243,214,0.85)';
      ctx.strokeStyle = 'rgba(58,36,22,0.7)';
      ctx.lineWidth = 4;
      const ry = t.rect.y0 - 6;
      if (ta === 0 || hasBubble) { ctx.strokeText('resting…', cx, ry); ctx.fillText('resting…', cx, ry); }
      ctx.restore();
    }
    if (api.markId === t.id) {
      const bob = Math.sin(time * 4) * 5;
      const my = t.rect.y0 - 14 + bob - (ta > 0 ? 54 : 0);
      ctx.save();
      ctx.fillStyle = '#e0694b';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 12, my - 16);
      ctx.lineTo(cx + 12, my - 16);
      ctx.lineTo(cx, my);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = `700 20px ${HAND}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      ctx.strokeText('yours', cx, my - 24);
      ctx.fillText('yours', cx, my - 24);
      ctx.restore();
    }
  }

  function drawBubble(ctx, b) {
    const t = b.t;
    if (!t.rect) return;
    const k = clamp(b.age / 0.14, 0, 1), fade = clamp(b.life / 0.25, 0, 1);
    const sc2 = easeOutBack(k);
    ctx.save();
    ctx.font = `700 24px ${HAND}`;
    const lines = wrapText(ctx, b.text, 250);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 28, h = lines.length * 29 + 16;
    const bx = clamp(t.me.x - w / 2, 8, W - w - 8);
    const by = clamp(t.rect.y0 - h - 22, 6, H - h - 30);
    ctx.globalAlpha = fade;
    ctx.translate(bx + w / 2, by + h + 12);
    ctx.scale(sc2, sc2);
    ctx.translate(-(bx + w / 2), -(by + h + 12));
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    roundRect(ctx, bx, by, w, h, 16);
    ctx.fill();
    ctx.stroke();
    const tx = clamp(t.me.x, bx + 20, bx + w - 20);
    ctx.beginPath();
    ctx.moveTo(tx - 10, by + h - 1);
    ctx.lineTo(tx + 2, by + h + 14);
    ctx.lineTo(tx + 10, by + h - 1);
    ctx.closePath();
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx - 8, by + h - 2);
    ctx.lineTo(tx + 8, by + h - 2);
    ctx.strokeStyle = '#fffaf0';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 8 + 14.5 + i * 29));
    ctx.restore();
  }

  function drawScaffold(ctx, s) {
    const pop = easeOutBack(clamp((time - s.born) / 0.45, 0, 1));
    const waiting = s.status === 'screening' || s.status === 'queued';
    const ds = dsAt(depthY(s.y)); // sits on the floor, so it shrinks toward the back like everything else
    const x = s.x, y = s.y;
    const w = 86, h = 120;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop * ds * 0.55, pop * ds * 0.55);
    ctx.globalAlpha = waiting ? 0.62 : 1;
    // shadow
    ctx.fillStyle = 'rgba(40,20,36,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 3, w * 0.62, 11, 0, 0, TAU);
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#d9a566';
    if (waiting) ctx.setLineDash([9, 6]);
    // brace, poles, planks
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -h * 0.34);
    ctx.lineTo(w / 2 - 8, -h * 0.72);
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e8c48a';
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = INK;
    for (const px of [-w / 2, w / 2 - 11]) { roundRect(ctx, px, -h, 11, h, 3); ctx.fill(); ctx.stroke(); }
    for (const py of [-h * 0.36, -h * 0.74]) { roundRect(ctx, -w / 2 - 8, py - 6, w + 16, 12, 3); ctx.fill(); ctx.stroke(); }
    ctx.setLineDash([]);
    // progress ring
    const bob = Math.sin(time * 2.4 + s.born) * 3;
    const ry = -h - 50 + bob, rr = 36;
    ctx.beginPath();
    ctx.arc(0, ry, rr + 9, 0, TAU);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ecd6ae';
    ctx.beginPath();
    ctx.arc(0, ry, rr - 2, 0, TAU);
    ctx.stroke();
    const p = clamp(s.p, 0.02, 1);
    ctx.strokeStyle = s.status === 'testing' ? '#e09a3a' : '#d96f4a';
    ctx.beginPath();
    ctx.arc(0, ry, rr - 2, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = INK;
    ctx.font = `700 24px ${HAND}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${s.wish.n ?? '?'}`, 0, ry + 1);
    ctx.restore();
    // label under the feet
    const stage = {
      screening: 'checking…', queued: s.wish.queuePos ? `in the queue · #${s.wish.queuePos}` : 'in the queue',
      coding: 'Codex is writing…', testing: s.wish.sprite === 'drawing' ? 'testing + drawing…' : 'testing…',
    }[s.status] || s.status;
    ctx.save();
    ctx.globalAlpha = clamp(pop, 0, 1);
    pill(ctx, x, y + 34, [
      { text: `#${s.wish.n ?? '?'} · ${s.wish.name || 'someone'}`, fs: 19 },
      { text: stage, bold: false, fs: 15, col: '#7a5a40' },
    ], { fs: 19 });
    ctx.restore();
  }

  function drawParticle(ctx, p) {
    const k = clamp(p.life / p.max, 0, 1);
    ctx.save();
    switch (p.k) {
      case 'dot':
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, TAU);
        ctx.fill();
        break;
      case 'star':
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillStyle = p.col;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot || 0) + (1 - k) * 2);
        starPath(ctx, 0, 0, p.size * (0.5 + k * 0.7));
        ctx.fill();
        break;
      case 'heart': {
        ctx.globalAlpha = Math.min(1, k * 2);
        const wob = Math.sin((1 - k) * 7 + p.ph) * 10;
        heartPath(ctx, p.x + wob, p.y, p.size * (1.1 - k * 0.2));
        ctx.fillStyle = p.col;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'zzz': {
        ctx.globalAlpha = Math.min(1, k * 2);
        const sz = p.size + (1 - k) * 12;
        ctx.font = `700 ${sz}px ${HAND}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const wob = Math.sin((1 - k) * 4 + p.ph) * 8;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 4;
        ctx.strokeText('z', p.x + wob, p.y);
        ctx.fillStyle = p.col;
        ctx.fillText('z', p.x + wob, p.y);
        break;
      }
      case 'rain':
        ctx.strokeStyle = p.col;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 3, p.y - p.size);
        ctx.stroke();
        break;
      case 'splash':
        ctx.globalAlpha = k;
        ctx.strokeStyle = p.col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * (2 - k), p.size * (2 - k) * 0.35, 0, 0, TAU);
        ctx.stroke();
        break;
      case 'steam':
        ctx.globalAlpha = (p.a ?? 0.4) * k;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - k) * 2.4), 0, TAU);
        ctx.fill();
        break;
    }
    ctx.restore();
  }

  api.draw = (ctx, cam) => {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1a1220';
    ctx.fillRect(0, 0, cw, ch);
    const fit = Math.min(cw / W, ch / H);
    const s = fit * (cam && cam.zoom ? cam.zoom : 1);
    const vw = cw / s, vh = ch / s;
    let cx = cam && fin(cam.x) ? cam.x : W / 2, cy = cam && fin(cam.y) ? cam.y : H / 2;
    cx = vw >= W ? W / 2 : clamp(cx, vw / 2, W - vw / 2);
    cy = vh >= H ? H / 2 : clamp(cy, vh / 2, H - vh / 2);
    ctx.setTransform(s, 0, 0, s, cw / 2 - cx * s, ch / 2 - cy * s);
    api.view = { s, cx, cy, cw, ch }; // canvas px <-> world: wx = (px - cw/2) / s + cx
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    // background (crossfades when the scene changes)
    if (!bgCur && !backdrop) backdrop = makeBackdrop(W, H);
    if (bgPrev && bgFade < 1) {
      drawCover(ctx, bgPrev, 1);
      drawCover(ctx, bgCur || backdrop, bgFade * bgFade * (3 - 2 * bgFade));
    } else drawCover(ctx, bgCur || backdrop, 1);


    // everything stands on the floor: draw back to front
    const ordered = drawOrder();
    for (const t of ordered) drawPatch(ctx, t);
    for (const t of ordered) drawShadow(ctx, t);
    const items = ordered.map((t) => ({ y: sortKey(t), t }));
    for (const s2 of scaffolds.values()) items.push({ y: s2.y, s: s2 });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) { if (it.t) drawThing(ctx, it.t); else drawScaffold(ctx, it.s); }
    for (const p of particles) drawParticle(ctx, p);
    for (const r of ripples) {
      const k = r.age / 0.7;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = '#fff3d6';
      ctx.lineWidth = 5 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 20 + k * 90, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (const t of ordered) drawOverlayFor(ctx, t);
    for (const b of bubbles) drawBubble(ctx, b);
    ctx.restore();
  };

  return api;
}
