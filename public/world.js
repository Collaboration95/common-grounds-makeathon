// /world - the projector. 16:9 canvas (letterboxed), plain log rail, counter, QR.
// Keys: T timelapse · V veto hovered thing · Q toggle QR · F fullscreen · (dev only) N new fake wish · D depart · S swap scene
import { createWorld } from '/engine.js';
import { createFeed, bindWorld, counts, DEV } from '/feed.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#c'), ctx = canvas.getContext('2d');
const frame = $('#frame'), stage = $('#stage');
const engine = createWorld();
engine.credits = true;
const feed = createFeed({ auto: DEV });
const binder = bindWorld(engine, feed);
const dbg = { engine, feed, binder, scale: 1 }; // dev only: poke around from the console, slow-mo with __commons.scale = 0.1
if (DEV) window.__commons = dbg;

// ---- layout: fit 16:9 into the stage, backing store at device resolution ---------------------------
function resize() {
  const r = stage.getBoundingClientRect();
  let w = r.width, h = (w * 9) / 16;
  if (h > r.height) { h = r.height; w = (h * 16) / 9; }
  w = Math.floor(w); h = Math.floor(h);
  frame.style.width = w + 'px';
  frame.style.height = h + 'px';
  frame.style.setProperty('--u', w / 100 + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
}
window.addEventListener('resize', resize);
resize();

// ---- counter ----------------------------------------------------------------------------------------
// "N wishes · N here · N waved goodbye" (written from here so world.html's static labels never go stale)
const foot = $('#foot');
function renderCounts() {
  const c = counts(feed.wishes);
  const bits = [];
  [[c.total, 'wishes'], [c.here, 'here'], [c.gone, 'waved goodbye']].forEach(([n, label], i) => {
    const b = document.createElement('b');
    b.textContent = n;
    bits.push(...(i ? [' · '] : []), b, ' ' + label);
  });
  foot.replaceChildren(...bits);
}
['hello', 'wish', 'remove', 'depart'].forEach((t) => feed.on(t, renderCounts));
renderCounts();

// ---- workbench rail (plain log lines) ---------------------------------------------------------------
const logEl = $('#log');
const fmtTime = (t) => new Date(t || Date.now()).toLocaleTimeString('en-GB');
function addLog(d) {
  const row = document.createElement('div');
  row.className = 'l' + (/passed|live|ready/i.test(d.line) ? ' ok' : /error|fail|declined|resting|quarantin/i.test(d.line) ? ' bad' : '');
  for (const [cls, text] of [['t', fmtTime(d.t)], ['n', d.n != null ? '#' + d.n : '·'], ['m', String(d.line).replace(/^#\d+\s+/, '')]]) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    row.append(s);
  }
  logEl.append(row);
  while (logEl.childElementCount > 80) logEl.firstElementChild.remove();
}
feed.on('log', addLog);
feed.on('status', (s) => { $('#conn').textContent = s === 'open' ? 'live' : s === 'error' ? 'reconnecting…' : 'connecting…'; });
engine.onQuarantine = (t, err) => addLog({ n: t.wish && t.wish.n, line: `${t.name} threw (${(err && err.message) || err}) → resting`, t: Date.now() });

// ---- QR ---------------------------------------------------------------------------------------------
const qrCard = $('#qrcard'), setQr = (on) => { qrCard.hidden = !on; $('#qrBtn').classList.toggle('on', on); };
$('#qrImg').src = DEV ? '/dev/qr.svg' : '/qr.svg';
$('#qrUrl').textContent = location.origin + '/wish';
$('#qrBtn').addEventListener('click', () => setQr(qrCard.hidden));

// ---- pointer, hover, poke ---------------------------------------------------------------------------
function toWorld(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * engine.width, y: ((e.clientY - r.top) / r.height) * engine.height };
}
canvas.addEventListener('pointermove', (e) => {
  const p = toWorld(e);
  engine.setPointer(p.x, p.y);
  engine.hoverId = engine.thingAt(p.x, p.y);
  canvas.style.cursor = engine.hoverId ? 'pointer' : 'default';
});
canvas.addEventListener('pointerleave', () => { engine.setPointer(null); engine.hoverId = null; });
canvas.addEventListener('click', () => { if (engine.hoverId) { feed.poke(engine.hoverId); engine.showCard(engine.hoverId); } });

// ---- keys -------------------------------------------------------------------------------------------
const toastEl = $('#toast');
let toastT = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('on'), 1600);
}
// F / ⛶ button / ?scene=1: show only the room (no QR, no workbench), and go browser-fullscreen.
function toggleSceneOnly(on = !document.body.classList.contains('sceneonly')) {
  document.body.classList.toggle('sceneonly', on);
  if (on && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  window.dispatchEvent(new Event('resize'));
}
{
  const b = document.createElement('button');
  b.id = 'fsBtn'; b.type = 'button'; b.title = 'Room only / fullscreen (F)'; b.textContent = '⛶';
  b.onclick = () => toggleSceneOnly();
  document.body.appendChild(b);
  if (new URLSearchParams(location.search).has('scene')) document.body.classList.add('sceneonly');
}
window.addEventListener('keydown', async (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'q') setQr(qrCard.hidden);
  else if (k === 't') timelapse();
  else if (k === 'f') toggleSceneOnly();
  else if (k === 'n' && DEV && feed.sim) feed.sim.spawn();
  else if (k === 'd' && DEV && feed.sim) {
    // dev: send the hovered thing away, else the oldest live one that isn't the founder
    const live = [...feed.wishes.values()].filter((w) => w.status === 'live').sort((a, b) => (a.acceptedAt || 0) - (b.acceptedAt || 0));
    const id = engine.hoverId || (live[1] && live[1].id);
    if (id) feed.sim.depart(id); else toast('nothing to send away');
  } else if (k === 's' && DEV && feed.sim) toast(`scene → ${feed.sim.swapScene()}`);
  else if (k === 'v') {
    const id = engine.hoverId;
    if (!id) return toast('hover a thing, then press V');
    const r = await feed.veto(id);
    if (r && r.ok) { feed.localRemove(id); toast('removed'); } else toast('veto failed: ' + ((r && r.error) || 'unknown'));
  }
});

// ---- timelapse: replay live + departed things in acceptedAt order over ~12s, with the cap of 10 --------
const TL_CAP = 10;
const tlEl = $('#tl');
let tl = null;
async function timelapse() {
  if (tl) return;
  const list = [...feed.wishes.values()]
    .filter((w) => (w.status === 'live' || w.status === 'departed') && (w.thing || w.resident))
    .sort((a, b) => (a.acceptedAt || 0) - (b.acceptedAt || 0));
  if (!list.length) return toast('nothing to replay yet');
  tl = { loading: true };
  binder.hold = true; // live events must not add things mid-replay
  toast('loading the replay…');
  try { await binder.preload(list); } catch { /* replay what loaded */ }
  engine.clear();
  tl = { list, i: 0, added: [], t0: performance.now(), dur: 12000 };
  engine.credits = false; // too noisy while 40 things drop in
  tlEl.hidden = false;
}
function tickTimelapse(now) {
  if (!tl || tl.loading) return;
  const el = now - tl.t0, n = tl.list.length;
  while (tl.i < n && el >= (tl.i / n) * tl.dur) {
    const id = tl.list[tl.i++].id;
    if (!binder.addNow(id, true)) continue;
    tl.added.push(id);
    // the same rule as the real room: past the cap, the oldest (never the founder) says bye
    let alive = tl.added.filter((x) => engine.has(x) && !engine.isDeparting(x));
    while (alive.length > TL_CAP) { engine.depart(alive[1]); alive = alive.slice(0, 1).concat(alive.slice(2)); }
  }
  const first = tl.list[0].acceptedAt || 0;
  const cur = tl.list[Math.max(0, tl.i - 1)].acceptedAt || first;
  tlEl.textContent = `timelapse · ${tl.i} / ${n}` + (cur > first ? ` · +${Math.max(1, Math.round((cur - first) / 60000))} min` : '');
  if (tl.i >= n && el > tl.dur + 6500) { // leave time for the last goodbyes
    for (const t of engine.list()) {
      const w = feed.wishes.get(t.id);
      if (!w || w.status !== 'live') engine.remove(t.id, { silent: true });
    }
    binder.hold = false;
    binder.flush();
    tl = null;
    engine.credits = true;
    tlEl.hidden = true;
  }
}

// ---- rooms: one at a time, auto-cycling every 12s, <-/-> to switch, jump to wherever something arrives ----
const roomLbl = document.createElement('div');
roomLbl.style.cssText = 'position:absolute;left:50%;top:2.2%;transform:translateX(-50%);padding:.5em 1.1em;background:#f6ecd4;color:#3a2b1a;border:2px solid #3a2b1a;border-radius:.3em;font:600 clamp(11px,1.5vw,22px)/1 Georgia,serif;box-shadow:2px 3px 0 rgba(0,0,0,.25);z-index:5;pointer-events:none;transition:opacity .4s';
roomLbl.hidden = true;
frame.appendChild(roomLbl);
let cycleT = 0;
function renderRoom() {
  const rs = feed.rooms;
  roomLbl.hidden = rs.length < 2;
  if (!binder.room) return;
  const i = Math.max(0, rs.findIndex((r) => r.id === binder.room));
  const here = [...feed.wishes.values()].filter((w) => w.status === 'live' && binder.roomOf(w) === binder.room).length;
  roomLbl.textContent = `Room ${i + 1} of ${rs.length} · ${here} here`;
}
function goRoom(id) { binder.setRoom(id); clearInterval(cycleT); cycleT = setInterval(() => step(1), 12000); renderRoom(); }
function step(d) {
  const rs = feed.rooms;
  if (rs.length < 2) return;
  const i = Math.max(0, rs.findIndex((r) => r.id === binder.room));
  goRoom(rs[(i + d + rs.length) % rs.length].id);
}
['hello', 'wish', 'remove', 'rooms'].forEach((t) => feed.on(t, renderRoom));
feed.on('wish', (w, prev) => { // an arrival: go see it
  const fresh = !prev || (prev.status !== 'live' && w.status === 'live');
  if (fresh && !w.resident && feed.rooms.length > 1 && !['declined', 'failed', 'vetoed', 'departed'].includes(w.status) && binder.roomOf(w) !== binder.room) goRoom(binder.roomOf(w));
});
feed.on('rooms', (list, prev) => { if (list.length > prev && prev > 0) toast('A new room opened!'); });
feed.on('hello', () => { if (feed.rooms.length > 1) goRoom(binder.room); });
window.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });

// ---- main loop --------------------------------------------------------------------------------------
let last = performance.now();
function frameLoop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  tickTimelapse(now);
  engine.step(DEV ? dt * dbg.scale : dt);
  engine.draw(ctx);
  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);
