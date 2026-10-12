// /wish - the phone page. Form -> status timeline -> live mini view centred on your thing + Poke it.
import { createWorld } from '/engine.js';
import { createFeed, bindWorld, getDeviceId, DEV } from '/feed.js';
import { voteCard } from '/vote.js';
const showVote = voteCard((c) => document.getElementById('liveCard').after(c), { className: 'card votecard' }); // once your own creature is live

const $ = (s) => document.querySelector(s);
const store = {
  get(k) { try { return localStorage.getItem('commons.' + k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('commons.' + k) : localStorage.setItem('commons.' + k, v); } catch { /* ignore */ } },
};
const EXAMPLES = [
  'a durian that rolls away from your cursor',
  'a cat that naps on whatever is warmest',
  'a teapot that steams when someone is near',
];

const feed = createFeed({ auto: false });
const engine = createWorld();
const binder = bindWorld(engine, feed);
binder.initialRoom = () => { const w = myId && feed.wishes.get(myId); return w ? binder.roomOf(w) : null; };

let myId = store.get('wishId');
let sawHello = false;

const els = { boot: $('#boot'), form: $('#form'), track: $('#track') };
function show(which) {
  const wasTrack = !els.track.hidden;
  for (const k of Object.keys(els)) els[k].hidden = k !== which;
  if (which === 'track' && !wasTrack) { resizeMini(); startMini(); }
}

// ---- form ---------------------------------------------------------------------------------------------
const text = $('#text'), nameEl = $('#name'), err = $('#err'), go = $('#go');
nameEl.value = store.get('name') || '';
const chips = $('#chips');
for (const ex of EXAMPLES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = ex;
  b.onclick = () => { text.value = ex; text.dispatchEvent(new Event('input')); };
  chips.append(b);
}
text.addEventListener('input', () => { $('#cnt').textContent = text.value.length; });
text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#form').requestSubmit(); } });
function showErr(msg) { err.textContent = msg || ''; err.hidden = !msg; }

async function post(path, body) {
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    let data = null;
    try { data = await r.json(); } catch { /* not json */ }
    return { ok: r.ok, status: r.status, data, error: r.ok ? null : (data && data.error) || `Something went wrong (${r.status}).` };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Could not reach the Commons. Check your connection and try again.' };
  }
}

// Tabs: "Wish for one" (Codex builds it) / "Pick one" (preset character). Both can wear a preset hat.
let mode = 'wish', pickId = null, hatId = null, presets = { characters: [], hats: [] };
const picksEl = $('#picks'), hatsEl = $('#hats');

function goLabel() {
  if (mode === 'wish') return 'Make my wish';
  if (mode === 'sketch') return 'Sketch it';
  const c = presets.characters.find((x) => x.id === pickId);
  return c ? `Put ${c.name} in the room` : 'Pick a character';
}
function setMode(m) {
  mode = m;
  for (const t of document.querySelectorAll('#form .tab')) {
    const on = t.dataset.mode === m;
    t.classList.toggle('on', on);
    t.setAttribute('aria-selected', String(on));
  }
  $('#panelWish').hidden = m !== 'wish';
  $('#panelPick').hidden = m !== 'pick';
  $('#panelSketch').hidden = m !== 'sketch';
  go.textContent = goLabel();
  showErr('');
}
for (const t of document.querySelectorAll('#form .tab')) t.addEventListener('click', () => setMode(t.dataset.mode));

// Opaque bounding box of a sprite as fractions of its image (same idea as the engine's hat placement).
function opaqueBox(img) {
  try {
    const n = 96, c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, n, n);
    const d = g.getImageData(0, 0, n, n).data;
    let x0 = n, y0 = n, x1 = -1, y1 = -1;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[(y * n + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x0: x0 / n, y0: y0 / n, x1: (x1 + 1) / n, y1: (y1 + 1) / n };
  } catch { return null; }
}
/** Draw the chosen hat on one pick card's sprite: ~55% of the sprite's width, sitting on top of its bounding box. */
function placeHat(card) {
  const hp = card.querySelector('.hatp'), spr = card.querySelector('.spr'), hat = presets.hats.find((h) => h.id === hatId);
  if (!hat || !spr.naturalWidth) { hp.hidden = true; return; }
  const box = spr._box || (spr._box = opaqueBox(spr)) || { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.9 };
  const put = () => {
    // the sprite fills a square (13%,26%,74%) of the stage, leaving headroom for tall hats
    const X = (f) => 13 + f * 74, Y = (f) => 26 + f * 74;
    let wPct = (box.x1 - box.x0) * 74 * 0.55, hPct = wPct * (hp.naturalHeight / hp.naturalWidth);
    if (hPct > 42) { wPct *= 42 / hPct; hPct = 42; }
    hp.style.width = wPct + '%';
    hp.style.left = (X(box.x0) + X(box.x1)) / 2 - wPct / 2 + '%';
    hp.style.top = Y(box.y0) - hPct * 0.88 + '%';
    hp.hidden = false;
  };
  if (hp.dataset.src !== hat.img) { hp.dataset.src = hat.img; hp.hidden = true; hp.onload = put; hp.src = hat.img; }
  else if (hp.naturalWidth) put();
}
const placeHats = () => picksEl.querySelectorAll('.pick').forEach(placeHat);

function renderPicks() {
  picksEl.textContent = '';
  if (!presets.characters.length) { picksEl.innerHTML = '<p class="small">The ready-made characters are still being drawn. Try a wish instead!</p>'; return; }
  for (const c of presets.characters) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (c.id === pickId ? ' on' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(c.id === pickId));
    b.dataset.id = c.id;
    const stage = document.createElement('span'), spr = new Image(), hp = new Image(), nm = document.createElement('b'), ol = document.createElement('small');
    stage.className = 'stage';
    spr.className = 'spr'; spr.alt = ''; spr.draggable = false;
    hp.className = 'hatp'; hp.alt = ''; hp.hidden = true; hp.draggable = false;
    spr.onload = () => placeHat(b);
    spr.src = c.sprite;
    nm.textContent = c.name;
    ol.textContent = c.oneLine || '';
    stage.append(spr, hp);
    b.append(stage, nm, ol);
    b.addEventListener('click', () => {
      pickId = c.id;
      for (const x of picksEl.querySelectorAll('.pick')) { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); }
      go.textContent = goLabel();
      showErr('');
    });
    picksEl.append(b);
  }
}

function renderHats() {
  hatsEl.textContent = '';
  $('#hatBox').hidden = !presets.hats.length;
  const opts = [{ id: null, name: 'No hat' }, ...presets.hats];
  for (const h of opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hat' + (h.id === hatId ? ' on' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(h.id === hatId));
    if (h.id) { const im = new Image(); im.src = h.img; im.alt = ''; im.draggable = false; b.append(im); }
    else { const x = document.createElement('span'); x.className = 'none'; x.textContent = '∅'; b.append(x); }
    const l = document.createElement('small');
    l.textContent = h.name;
    b.append(l);
    b.addEventListener('click', () => {
      hatId = h.id;
      for (const x of hatsEl.children) { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); }
      placeHats();
    });
    hatsEl.append(b);
  }
}

if (!DEV) {
  fetch('/api/presets').then((r) => r.json()).then((p) => {
    presets = { characters: p.characters || [], hats: p.hats || [] };
    renderPicks();
    renderHats();
    $('#tabPick').hidden = !presets.characters.length;
    placeHats();
  }).catch(() => { $('#tabPick').hidden = true; });
} else {
  $('#tabPick').hidden = true; $('#tabSketch').hidden = true; // the dev simulator has no presets
}

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const t = (mode === 'sketch' ? $('#sk') : text).value.trim(), nm = nameEl.value.trim();
  if (mode !== 'pick' && t.length < 3) return showErr('Say a little more: a wish needs at least 3 characters.');
  if (mode === 'pick' && !pickId) return showErr('Tap one of the characters first.');
  showErr('');
  go.disabled = true;
  go.textContent = 'Sending…';
  store.set('name', nm);
  const deviceId = getDeviceId();
  const r = mode === 'sketch' ? await post('/api/sketch', { text: t, name: nm, hat: hatId, deviceId })
    : mode === 'pick' ? await post('/api/place', { presetId: pickId, hat: hatId, name: nm, deviceId })
    : DEV ? await feed.submit(t, nm) : await post('/api/wish', { text: t, name: nm, hat: hatId, deviceId });
  go.disabled = false;
  go.textContent = goLabel();
  if (!r.ok) return showErr(r.error);
  myId = r.data && r.data.id;
  store.set('wishId', myId);
  if (r.data && r.data.pin) store.set('pet', JSON.stringify({ id: myId, pin: r.data.pin })); renderPet();
  engine.markId = myId;
  if (feed.wishes.has(myId)) render(); else show('track'), renderPending();
});

$('#retry').addEventListener('click', () => {
  store.set('wishId', null);
  engine.markId = null;
  myId = null;
  showErr('');
  show('form');
  if (mode === 'wish') text.focus();
});

// ---- surprise me ---------------------------------------------------------------------------------------
$('#surprise').addEventListener('click', () => {
  if (!presets.characters.length) return;
  const c = presets.characters[Math.floor(Math.random() * presets.characters.length)];
  pickId = c.id;
  hatId = Math.random() < 0.3 || !presets.hats.length ? null : presets.hats[Math.floor(Math.random() * presets.hats.length)].id;
  renderPicks(); renderHats(); placeHats();
  go.textContent = goLabel();
  showErr('');
});

// ---- pet controls --------------------------------------------------------------------------------------
const pet = () => { try { return JSON.parse(store.get('pet')); } catch { return null; } };
let manual = false;
function renderPet() {
  const p = pet(), w = p && feed.wishes.get(p.id);
  const show = manual || (p && w && w.status === 'live');
  $('#petCard').hidden = !show || els.track.hidden;
  $('#petLogin').hidden = !!(p && !manual) ;
  $('#petNo').textContent = w && w.n ? '#' + w.n : '';
  const rn = w && feed.rooms.length ? feed.rooms.findIndex((r) => r.id === binder.roomOf(w)) + 1 : 0;
  $('#petPin').textContent = p ? `Your pet ${w && w.n ? '#' + w.n : ''} · PIN ${p.pin} — keep it to control your pet` + (rn ? ` · in Room ${rn}` : '') : '';
}
async function petPost(body) {
  let p = pet();
  if (!p || manual) {
    const n = Number($('#petN').value), w = [...feed.wishes.values()].find((x) => x.n === n);
    if (!w) return $('#petMsg').textContent = 'No pet with that number.';
    p = { id: w.id, pin: $('#petP').value.trim() };
  }
  const r = await post('/api/pet', { id: p.id, pin: p.pin, ...body });
  $('#petMsg').textContent = r.ok ? 'Done!' : r.error;
  if (r.ok && manual) { store.set('pet', JSON.stringify(p)); manual = false; renderPet(); }
}
$('#petSet').onclick = () => petPost({ status: $('#petStatus').value });
$('#petClear').onclick = () => { $('#petStatus').value = ''; petPost({ status: null }); };
for (const b of document.querySelectorAll('.mood')) b.onclick = () => petPost({ mood: b.dataset.mood });
$('#ctlLink').onclick = (e) => { e.preventDefault(); manual = true; show('track'); $('#statusCard').hidden = true; $('#liveCard').hidden = true; $('#retryCard').hidden = true; mini.hidden = true; renderPet(); };

// ---- tracking -----------------------------------------------------------------------------------------
const STEPS = ['Checking your wish', 'In the queue', 'Codex is writing it', 'Testing it', 'Drawing it', 'Live!'];
function stepStates(w) {
  const idx = { screening: 0, queued: 1, coding: 2, testing: 3, live: 5 }[w.status];
  const spriteDone = w.sprite === 'done' || w.sprite === 'failed';
  return STEPS.map((_, i) => {
    if (w.status === 'live') return 'done';
    if (i === 4) return spriteDone ? 'done' : w.sprite === 'drawing' ? 'active' : 'todo';
    return i < idx ? 'done' : i === idx ? 'active' : 'todo';
  });
}

function renderPending() {
  $('#stTitle').textContent = 'Sending your wish…';
  $('#stQuote').textContent = '';
  $('#steps').textContent = '';
}

let lastKey = '';
function render() {
  renderPet();
  const w = myId && feed.wishes.get(myId);
  if (!w) return;
  if (feed.rooms.length) binder.setRoom(binder.roomOf(w));
  engine.markId = w.status === 'live' ? w.id : null;
  const key = JSON.stringify([w.status, w.queuePos, w.sprite, w.thing && w.thing.name, w.reason]);
  const bad = w.status === 'declined' || w.status === 'failed';
  const out = bad || w.status === 'vetoed' || w.status === 'departed';
  mini.hidden = out;
  show('track');
  $('#stQuote').textContent = `“${w.text}”`;
  $('#statusCard').hidden = out || w.status === 'live';
  $('#liveCard').hidden = w.status !== 'live';
  $('#retryCard').hidden = !out;
  if (key === lastKey) return;
  lastKey = key;

  if (bad) {
    $('#rtTitle').textContent = w.status === 'failed' ? 'Codex got stuck on that one.' : 'Not this one, sorry.';
    $('#rtMsg').textContent = w.reason || (w.status === 'failed' ? "Codex couldn't build that one." : 'That wish was not accepted.');
    $('#retry').textContent = 'Try a different wish';
    $('#retry').hidden = false; // the server decides when a device is out of tries (2 declined) and says so
    return;
  }
  if (w.status === 'departed') {
    $('#rtTitle').textContent = `${(w.thing && w.thing.name) || 'Your thing'} headed home.`;
    $('#rtMsg').textContent = 'The Commons only has room for a few at a time, so the oldest one wandered off. You can add another now!';
    $('#retry').textContent = 'Add another';
    $('#retry').hidden = false;
    return;
  }
  if (w.status === 'vetoed') {
    $('#rtTitle').textContent = 'The Commons took that one back.';
    $('#rtMsg').textContent = 'It was removed from the big screen. You can add a different one.';
    $('#retry').textContent = 'Add another';
    $('#retry').hidden = false;
    return;
  }
  const states = stepStates(w);
  const labels = w.kind === 'sketch' ? ['Checking your line', 'In the queue', 'Sketching it', 'Giving it moves', 'Drawing it', 'Live!'] : STEPS;
  const ol = $('#steps');
  ol.textContent = '';
  labels.forEach((label, i) => {
    const li = document.createElement('li');
    li.className = states[i] + (i === 5 ? ' fin' : '');
    const dot = document.createElement('span');
    dot.className = 'dot';
    const sp = document.createElement('span');
    sp.textContent = i === 1 && w.queuePos ? `${label} (#${w.queuePos})` : label;
    li.append(dot, sp);
    ol.append(li);
  });
  $('#stTitle').textContent = w.status === 'live' ? 'It is alive!' : `Wish #${w.n ?? ''}`.trim();
  $('#stMsg').textContent = w.status === 'live' ? '' : 'This usually takes about a minute. You can watch it get built below.';
  if (w.status === 'live') {
    const nm = (w.thing && w.thing.name) || 'Your thing';
    const secs = w.stats && w.stats.buildMs ? Math.max(1, Math.round(w.stats.buildMs / 1000)) : null;
    $('#lvTitle').textContent = `${nm} is live!`;
    showVote(6000);
    $('#lvLine').textContent = (w.thing && w.thing.oneLine ? w.thing.oneLine + ' ' : '') + (secs ? (w.kind === 'sketch' ? `Sketched in ${secs}s.` : `Built by Codex in ${secs}s.`) : '');
  }
}

feed.on('hello', () => {
  sawHello = true;
  if (myId && !feed.wishes.has(myId)) { store.set('wishId', null); myId = null; engine.markId = null; }
  route();
});
feed.on('wish', (w) => { if (w.id === myId) { if (feed.rooms.length) binder.setRoom(binder.roomOf(w)); render(); } });
feed.on('remove', ({ id }) => { if (id === myId) render(); });
feed.on('status', () => {});

function route() {
  if (myId && feed.wishes.has(myId)) render();
  else if (!els.track.hidden && myId) renderPending();
  else show('form');
}

// ---- poke ---------------------------------------------------------------------------------------------
let pokes = 0;
$('#poke').addEventListener('click', async () => {
  const b = $('#poke');
  if (!myId) return;
  b.disabled = true;
  if (navigator.vibrate) navigator.vibrate(25);
  const r = await feed.poke(myId);
  pokes++;
  $('#pokeNote').textContent = r && r.ok === false ? (r.error || 'Could not poke right now.') : `Poked ${pokes} time${pokes === 1 ? '' : 's'}. Everyone watching saw that.`;
  setTimeout(() => { b.disabled = false; }, 450);
});

// ---- mini view ----------------------------------------------------------------------------------------
const mini = $('#mini'), mctx = mini.getContext('2d');
const cam = { x: 800, y: 560, zoom: 3, init: false };
function resizeMini() {
  const w = mini.clientWidth || 340;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const h = Math.round(w * 0.72);
  mini.style.height = h + 'px';
  mini.width = Math.round(w * dpr);
  mini.height = Math.round(h * dpr);
}
window.addEventListener('resize', resizeMini);

function miniPointer(e) {
  const v = engine.view;
  if (!v) return;
  const r = mini.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * v.cw, py = ((e.clientY - r.top) / r.height) * v.ch;
  engine.setPointer((px - v.cw / 2) / v.s + v.cx, (py - v.ch / 2) / v.s + v.cy);
}
mini.addEventListener('pointermove', miniPointer);
mini.addEventListener('pointerdown', miniPointer);
mini.addEventListener('pointerup', () => engine.setPointer(null));
mini.addEventListener('pointerleave', () => engine.setPointer(null));
mini.addEventListener('pointercancel', () => engine.setPointer(null));

let running = false, last = performance.now();
function startMini() {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
}
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  engine.step(dt);
  // follow my thing (or its scaffold), showing ~560 world units across
  const f = myId && engine.focus(myId);
  const fit = Math.min(mini.width / engine.width, mini.height / engine.height);
  const zoom = mini.width / 560 / fit;
  if (f) {
    if (!cam.init) { cam.x = f.x; cam.y = f.y; cam.init = true; }
    const k = Math.min(1, dt * 4);
    cam.x += (f.x - cam.x) * k;
    cam.y += (f.y - cam.y) * k;
  }
  cam.zoom = zoom;
  engine.draw(mctx, cam);
  requestAnimationFrame(loop);
}

// ---- boot ---------------------------------------------------------------------------------------------
engine.markId = null;
if (myId) show('boot'); else show('form');
setTimeout(() => {
  if (!sawHello && !els.boot.hidden) { show('track'); renderPending(); $('#stTitle').textContent = 'Reconnecting to the Commons…'; }
}, 5000);
