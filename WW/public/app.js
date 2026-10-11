const $ = sel => document.querySelector(sel);
const wall = $('#wall'), worlds = $('#worlds'), game = $('#game'), stage = $('#stage');
const MOVES = ['nod', 'hop', 'shake', 'wave', 'tilt'];
const SURPRISES = [
  ['The Fellowship leaving Rivendell, elves lining the bridges', 'Hagrid, carrying a suspicious egg'],
  ['The Hunger Games opening ceremony, chariots and roaring Capitol crowds', 'Paddington Bear, offering marmalade sandwiches'],
  ['A packed MRT train at peak hour on the North-South Line', 'Gandalf, insisting you shall not pass'],
  ['The Yule Ball at Hogwarts, everyone dancing', 'Shrek, in a tuxedo two sizes too small'],
  ['The Jurassic Park visitor centre the moment the T-rex breaks in', 'Mary Poppins, entirely unbothered'],
  ['Woodstock 1969, a sea of fans in the mud', 'Yoda, crowd-surfing'],
];

const state = { games: [], game: null, found: false, hovered: null };
const tiles = new Map();
const sprites = new Map();
const drift = Object.assign(document.createElement('div'), { className: 'drift' });
worlds.append(drift);

const guestOf = g => g.characters.find(c => c.id === g.targetId);
const pick = list => list[Math.floor(Math.random() * list.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));
// Scenes come in different shapes (Codex picks its own size), so the stage follows the current scene.
const ratioOf = g => (g?.bg?.w && g?.bg?.h ? g.bg.w / g.bg.h : 1.5);
const stageSize = () => { const r = ratioOf(state.game); const w = Math.min(innerWidth, innerHeight * r); return { w, h: w / r }; };
function sizeStage() { const { w, h } = stageSize(); Object.assign(stage.style, { width: `${w}px`, height: `${h}px` }); }

// Sprites: crop to the drawn figure so the click area matches what you see. If the model ignored
// the transparent background, key out the corner colour.
async function loadSprite(src) {
  if (!sprites.has(src)) sprites.set(src, new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(cropToFigure(img));
    img.onerror = reject;
    img.src = src;
  }));
  return sprites.get(src);
}

function cropToFigure(img) {
  const c = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  const { data, width, height } = pixels;
  const [r, g, b, a] = data;
  for (let i = 0; i < data.length; i += 4) {
    // Generated sprites carry a faint coloured glow at very low alpha; it would give the guest away.
    if (data[i + 3] < 48) data[i + 3] = 0;
    else if (a > 200 && Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) < 40) data[i + 3] = 0;
  }
  ctx.putImageData(pixels, 0, 0);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 24) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return c;
  const out = Object.assign(document.createElement('canvas'), { width: maxX - minX + 1, height: maxY - minY + 1 });
  out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function copyCanvas(src) {
  const c = Object.assign(document.createElement('canvas'), { width: src.width, height: src.height });
  c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0);
  return c;
}

// ---------- Logo and world themes ----------

// A typeface per world; unknown (newly created) worlds cycle through these.
const THEMES = {
  'codex-shire-party': { font: '"Uncial Antiqua", serif', accent: '#9bd46a' },
  'codex-great-hall': { font: '"Cinzel Decorative", serif', accent: '#ffcf4a' },
  'codex-cantina': { font: 'Audiowide, sans-serif', accent: '#ff9a4a' },
  'codex-hawker-centre': { font: 'Bungee, sans-serif', accent: '#ff5a4a' },
};
const FALLBACK = Object.values(THEMES);
const themeOf = g => THEMES[g.id] ?? FALLBACK[state.games.indexOf(g) % FALLBACK.length] ?? FALLBACK[0];
const LOGO = "WHO'S HIDING?";
let logoTick = 0, logoLock = null;

function buildLogo() {
  $('#logo').replaceChildren(...[...LOGO].map((c, i) => {
    const s = document.createElement('span');
    s.className = c === ' ' ? 'gap' : 'ch';
    s.textContent = c === ' ' ? '' : c;
    s.dataset.i = i;
    return s;
  }));
}

// Paint one letter with a world: its typeface, and a slice of its painting as the fill.
function paintLetter(s, g, flip) {
  const k = Number(s.dataset.i);
  s.dataset.world = g.id;
  Object.assign(s.style, {
    fontFamily: themeOf(g).font,
    backgroundImage: `url("${g.bg.src}")`,
    backgroundPosition: `${Math.random() * 100}% ${20 + Math.random() * 60}%`,
  });
  if (flip) { s.classList.remove('flip', 'glitch', 'flicker'); s.offsetWidth; if (!logoLock) { const fx = ['', 'glitch', 'flicker'][Math.floor(Math.random() * 3)]; if (fx) s.classList.add(fx); } s.style.animationDelay = logoLock ? `${k * 40}ms` : '0ms'; s.classList.add('flip'); }
}

// Like the Loki titles: every letter swaps to a random other world on its own random clock.
function paintLogo(flip) {
  const games = state.games;
  if (!games.length) return;
  $('#logo').querySelectorAll('.ch').forEach((s, k) => paintLetter(s, logoLock ?? games[(k + logoTick) % games.length], flip));
}

function scheduleLetter(s) {
  setTimeout(() => {
    const others = state.games.filter(g => g.id !== s.dataset.world);
    if (!wall.hidden && !logoLock && others.length) paintLetter(s, others[Math.floor(Math.random() * others.length)], true);
    scheduleLetter(s);
  }, 700 + Math.random() * 2600);
}

function buildSuspects() {
  $('#suspects').replaceChildren(...state.games.map(g => {
    const guest = guestOf(g);
    const b = document.createElement('button');
    b.title = `${g.title}`;
    b.style.setProperty('--face', `url("${guest.portrait ?? guest.sprite}")`);
    b.onmouseenter = () => focusWorld(g);
    b.onmouseleave = () => focusWorld(null);
    b.onclick = () => zoomInto(g);
    b.dataset.id = g.id;
    return b;
  }));
}

// Hovering a world (or its suspect) turns the whole logo into that world.
function focusWorld(g) {
  if (logoLock === g) return;
  logoLock = g;
  $('#suspects').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === g?.id));
  $('#tagline').textContent = g ? `${g.title} · Find ${guestOf(g).name}` : "Every world hides someone who doesn't belong. Pick a world.";
  paintLogo(true);
}

buildLogo();
$('#logo').querySelectorAll('.ch').forEach(scheduleLetter);

// ---------- World of worlds ----------

async function refresh() {
  const all = await fetch('/api/games').then(r => r.json());
  const real = all.filter(g => !g.placeholder);
  const games = real.length ? real : all;
  const changed = games.map(g => g.id).join() !== state.games.map(g => g.id).join();
  state.games = games;
  if (changed) { layoutWall(); buildSuspects(); paintLogo(false); }
  return games;
}

function layoutWall() {
  const n = state.games.length;
  $('#wall-empty').hidden = n > 0;
  for (const [id, el] of tiles) if (!state.games.some(g => g.id === id)) { el.remove(); tiles.delete(id); }
  if (!n) return;
  const ratio = 1.5, overlap = 1.25;
  let best;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    // Tiles overlap their neighbours by (overlap - 1); keep the outer feathered edges on screen too.
    const step = Math.min(innerWidth / (cols + overlap - 1), (innerHeight * ratio) / (rows + overlap - 1));
    if (!best || step > best.step) best = { cols, rows, step };
  }
  const { cols, rows, step } = best;
  const stepH = step / ratio, tileW = step * overlap, tileH = stepH * overlap;
  const offX = (innerWidth - cols * step) / 2, offY = (innerHeight - rows * stepH) / 2;
  state.games.forEach((g, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const inRow = row === rows - 1 ? n - row * cols : cols;
    let el = tiles.get(g.id);
    if (!el) {
      el = Object.assign(document.createElement('button'), { className: 'tile fresh' });
      el.innerHTML = `<img alt=""><span class="label"></span>`;
      el.querySelector('.label').innerHTML = `<span></span><small></small>`;
      el.querySelector('.label span').textContent = g.title;
      el.querySelector('.label small').textContent = `Find ${guestOf(g).name}`;
      el.setAttribute('aria-label', `${g.title}. Find ${guestOf(g).name}`);
      const img = el.querySelector('img');
      img.onload = () => el.classList.remove('fresh');
      img.src = g.bg.src;
      el.onclick = () => zoomInto(g);
      el.onmouseenter = () => focusWorld(g);
      el.onmouseleave = () => focusWorld(null);
      drift.append(el);
      tiles.set(g.id, el);
    }
    Object.assign(el.style, {
      left: `${offX + ((cols - inRow) * step) / 2 + col * step - (tileW - step) / 2}px`,
      top: `${offY + row * stepH - (tileH - stepH) / 2}px`,
      width: `${tileW}px`, height: `${tileH}px`,
    });
  });
}

// Camera transform that makes a tile land exactly where the game's stage will be.
function cameraOnto(el) {
  const r = el.getBoundingClientRect();
  const { w, h } = stageSize();
  const s = w / r.width;
  return `translate(${(innerWidth - w) / 2 - r.left * s}px, ${(innerHeight - h) / 2 - r.top * s}px) scale(${s})`;
}

async function zoomInto(g) {
  const el = tiles.get(g.id);
  const ready = startGame(g);
  wall.classList.add('zooming');
  if (el) { worlds.style.transform = cameraOnto(el); await wait(900); }
  await ready;
  wall.hidden = true;
  game.hidden = false;
}

function backToWall() {
  const el = state.game && tiles.get(state.game.id);
  game.hidden = true;
  wall.hidden = false;
  if (el) {
    worlds.style.transition = 'none';
    worlds.style.transform = cameraOnto(el);
    worlds.offsetWidth;
    worlds.style.transition = '';
  }
  worlds.style.transform = '';
  wall.classList.remove('zooming');
  refresh();
}

// ---------- The game ----------

async function startGame(g) {
  state.game = g;
  sizeStage();
  document.body.style.setProperty('--world-font', themeOf(g).font);
  state.found = false;
  state.hovered = null;
  stage.className = g.baked ? 'baked' : '';
  stage.style.transform = '';
  $('#found').hidden = true;
  $('#hint-box').hidden = true;
  $('#hint-text').hidden = true;
  $('#bg').src = g.bg.src;

  const [canvases] = await Promise.all([
    Promise.all(g.characters.map(c => loadSprite(c.sprite))),
    $('#bg').decode().then(() => matchLighting($('#bg'))).catch(() => {}),
  ]);
  const layer = $('#sprites');
  layer.replaceChildren(...g.characters
    .map((c, i) => ({ c, canvas: canvases[i] }))
    .sort((a, b) => a.c.y - b.c.y)
    .map(({ c, canvas }) => {
      const el = Object.assign(document.createElement('div'), { className: 'char' });
      el.dataset.id = c.id;
      Object.assign(el.style, { left: `${c.x * 100}%`, top: `${c.y * 100}%`, height: `${c.h * 100}%` });
      el.append(copyCanvas(canvas), Object.assign(document.createElement('div'), { className: 'bubble' }));
      return el;
    }));

  const guest = guestOf(g);
  const portrait = guest.portrait ? await loadSprite(guest.portrait) : canvases[g.characters.indexOf(guest)];
  $('#target-portrait').replaceChildren(copyCanvas(portrait));
  state.portrait = guest.portrait ? portrait : null;
  $('#target-name').textContent = guest.name;
}

// Sprites are lit like a studio shot; dim them to the scene's overall brightness so they sit in it.
function matchLighting(img) {
  const c = Object.assign(document.createElement('canvas'), { width: 16, height: 16 });
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 16, 16);
  const d = ctx.getImageData(0, 0, 16, 16).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const lum = sum / (d.length / 4) / 255;
  const brightness = Math.min(1.05, Math.max(0.7, 0.55 + lum * 0.9));
  stage.style.setProperty('--sprite-filter', `brightness(${brightness.toFixed(2)}) saturate(0.88) contrast(0.95)`);
}

function charAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.tagName !== 'CANVAS' || !el.closest('#sprites')) continue;
    const r = el.getBoundingClientRect();
    const ctx = el.getContext('2d', { willReadFrequently: true });
    // A few pixels of slack so tiny sprites stay clickable.
    for (const [dx, dy] of [[0, 0], [-3, 0], [3, 0], [0, -3], [0, 3]]) {
      const px = Math.floor(((x + dx - r.left) / r.width) * el.width);
      const py = Math.floor(((y + dy - r.top) / r.height) * el.height);
      if (px >= 0 && py >= 0 && px < el.width && py < el.height && ctx.getImageData(px, py, 1, 1).data[3] > 24) return el.closest('.char');
    }
  }
  return null;
}

// Magnifying glass: a 2.5x view of the scene under the cursor.
const loupe = $('#loupe'), ZOOM = 2.5;
let loupeOn = true;
function moveLoupe(e) {
  const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
  loupe.hidden = !loupeOn || state.found || !inside;
  if (loupe.hidden) return;
  const size = loupe.offsetWidth;
  Object.assign(loupe.style, {
    left: `${x}px`, top: `${y}px`, backgroundImage: `url("${state.game.bg.src}")`,
    backgroundSize: `${r.width * ZOOM}px ${r.height * ZOOM}px`,
    backgroundPosition: `${size / 2 - x * ZOOM}px ${size / 2 - y * ZOOM}px`,
  });
}
stage.addEventListener('pointermove', moveLoupe);
stage.addEventListener('pointerleave', () => { loupe.hidden = true; });
function toggleLoupe() {
  loupeOn = !loupeOn;
  $('#loupe-btn').textContent = loupeOn ? '🔍 On' : '🔍 Off';
  $('#loupe-btn').setAttribute('aria-pressed', loupeOn);
  if (!loupeOn) loupe.hidden = true;
}
$('#loupe-btn').onclick = toggleLoupe;
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'm' && !game.hidden && !dialog.open) toggleLoupe(); });

const charData = el => state.game.characters.find(c => c.id === el.dataset.id);

function react(el, text, move, ms = 1800) {
  el.querySelector('.bubble').textContent = text;
  el.classList.remove(...MOVES);
  el.offsetWidth;
  el.classList.add(move, 'talking');
  clearTimeout(el.timer);
  if (ms) el.timer = setTimeout(() => el.classList.remove('talking', move), ms);
}

stage.addEventListener('click', e => {
  if (state.found) return;
  const el = charAt(e.clientX, e.clientY);
  if (!el) {
    const r = stage.getBoundingClientRect();
    const ring = Object.assign(document.createElement('div'), { className: 'ripple' });
    Object.assign(ring.style, { left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px` });
    stage.append(ring);
    return setTimeout(() => ring.remove(), 600);
  }
  const c = charData(el);
  if (c.id === state.game.targetId) return found(el, c);
  // First click gets their "not me" line, later clicks their other quips.
  el.clicks = (el.clicks || 0) + 1;
  react(el, el.clicks === 1 ? c.line : pick(c.quips), el.clicks === 1 ? 'shake' : c.move, 2200);
});

function found(el, c) {
  state.found = true;
  $('#hint-box').hidden = true;
  $('#hint-text').hidden = true;
  // Painted-in guests pop out of the scene as their clean lifted portrait.
  if (state.portrait) el.querySelector('canvas').replaceWith(copyCanvas(state.portrait));
  el.classList.add('found');
  stage.classList.add('is-found');
  react(el, c.line, 'hop', 0);
  // Push the camera in and bring the guest to the upper middle, clear of the caption.
  const { w, h } = stageSize();
  const s = 1.7, tx = c.x * w, ty = (c.y - c.h / 2) * h;
  stage.style.transformOrigin = '0 0';
  stage.style.transform = `translate(${w / 2 - s * tx}px, ${h * 0.36 - s * ty}px) scale(${s})`;
  $('#found-title').textContent = `You found ${c.name}!`;
  $('#found-story').textContent = state.game.story;
  setTimeout(() => { $('#found').hidden = false; }, 1100);
}

$('#hint-btn').onclick = () => {
  if (state.found) return;
  const { x, y, w, h, text } = state.game.hint;
  Object.assign($('#hint-box').style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });
  $('#hint-box').hidden = false;
  $('#hint-text').textContent = text;
  $('#hint-text').hidden = !text;
};
$('#replay-btn').onclick = () => startGame(state.game);
$('#back-btn').onclick = backToWall;
$('#found-back-btn').onclick = backToWall;

// ---------- Create ----------

const dialog = $('#create'), form = $('#create-form'), status = $('#job-status');
let pending = null;

function openCreate() {
  status.textContent = pending ? status.textContent : '';
  dialog.showModal();
}
$('#create-btn').onclick = openCreate;
$('#found-create-btn').onclick = openCreate;
$('#cancel-btn').onclick = () => dialog.close();
$('#surprise-btn').onclick = () => {
  const [moment, guest] = pick(SURPRISES);
  form.moment.value = moment;
  form.guest.value = guest;
};

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (pending) return;
  $('#make-btn').disabled = true;
  status.className = 'working';
  status.textContent = 'Writing the scene';
  try {
    const res = await fetch('/api/games', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ moment: form.moment.value, guest: form.guest.value }),
    });
    let job = await res.json();
    if (!res.ok) throw new Error(job.error);
    pending = job.id;
    while (job.status === 'working') {
      await wait(1500);
      job = await fetch(`/api/jobs/${pending}`).then(r => r.json());
      status.textContent = job.stage;
    }
    if (job.status === 'failed') throw new Error(job.error);
    const games = await refresh();
    const made = games.find(g => g.id === job.gameId);
    form.reset();
    status.className = '';
    status.textContent = '';
    if (dialog.open && made) {
      dialog.close();
      if (!wall.hidden) { await wait(1200); zoomInto(made); }
      else await startGame(made);
    }
  } catch (err) {
    status.className = '';
    status.textContent = `Couldn't paint that: ${err.message}`;
  } finally {
    pending = null;
    $('#make-btn').disabled = false;
  }
});

// ---------- Boot ----------

addEventListener('resize', () => { layoutWall(); if (state.game) sizeStage(); });
setInterval(() => { if (!wall.hidden) refresh(); }, 8000);
refresh();
