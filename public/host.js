// /host: photograph the room -> redraw -> map -> review the map over the picture -> make it the live scene.
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
let KEY = params.get('k') || '';
try { if (KEY) sessionStorage.setItem('commons.hostKey', KEY); else KEY = sessionStorage.getItem('commons.hostKey') || ''; } catch { /* private mode */ }
if (params.has('k')) history.replaceState(null, '', location.pathname); // keep the key out of the address bar / screenshots

const SECTIONS = ['denied', 'start', 'work', 'review', 'done'];
const show = (name) => SECTIONS.forEach((s) => { $('#' + s).hidden = s !== name; });
const say = (el, msg) => { el.textContent = msg || ''; el.hidden = !msg; };

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  let r;
  try { r = await fetch(path, { method, body, headers: { 'x-host-key': KEY, ...headers }, cache: 'no-store' }); }
  catch { return { ok: false, status: 0, error: 'Could not reach the Commons. Check your connection.' }; }
  let data = null;
  try { data = await r.json(); } catch { /* not json */ }
  return { ok: r.ok, status: r.status, data, error: r.ok ? null : (data && data.error) || `Something went wrong (${r.status}).` };
}
const post = (path, obj) => api(path, { method: 'POST', body: JSON.stringify(obj || {}), headers: { 'content-type': 'application/json' } });

// ---------- downscale to a JPEG of at most 1600px (long side), under the 3 MB server cap ----------
async function toJpeg(file) {
  let src, w, h;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; }
  catch {
    src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const k = Math.min(1, 1600 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size <= 2.8 * 1024 * 1024) return blob;
  }
  throw new Error('That photo is too big.');
}

// ---------- progress ----------
const STEPS = ['Photo sent', 'Redrawing the room', 'Finding the floor and perches', 'Ready to review'];
let jobId = null, poll = null, stepAt = { step: null, t: 0 };
const store = (id) => { try { id ? sessionStorage.setItem('commons.hostJob', id) : sessionStorage.removeItem('commons.hostJob'); } catch { /* ignore */ } };

function renderSteps(job) {
  const idx = { redrawing: 1, mapping: 2, ready: 4, failed: -1 }[job.step] ?? 1;
  if (stepAt.step !== job.step) stepAt = { step: job.step, t: Date.now() - (job.stepMs || 0) };
  const secs = Math.round((Date.now() - stepAt.t) / 1000);
  $('#steps').innerHTML = STEPS.map((label, i) => {
    const cls = i < idx ? 'done' : i === idx ? 'active' : '';
    return `<li class="${cls}"><span class="dot"></span><span>${label}${cls === 'active' ? ` · ${secs}s` : ''}</span></li>`;
  }).join('');
}

function watch(id) {
  jobId = id; store(id); show('work');
  say($('#wkErr'), ''); $('#again0').hidden = true; $('#wkTitle').textContent = 'Working on it…'; $('#wkNote').hidden = false;
  stepAt = { step: null, t: 0 };
  let last = { step: 'redrawing' };
  renderSteps(last);
  clearInterval(poll);
  const tick = setInterval(() => $('#work').hidden ? clearInterval(tick) : renderSteps(last), 1000);
  const once = async () => {
    const r = await api('/api/host/scene/' + id);
    if (jobId !== id) return;
    if (r.status === 404) { clearInterval(poll); store(null); return show('start'); }
    if (!r.ok) return; // flaky wifi: keep polling
    last = r.data;
    renderSteps(last);
    if (last.step === 'ready') { clearInterval(poll); clearInterval(tick); openReview(last); }
    else if (last.step === 'failed') {
      clearInterval(poll); clearInterval(tick);
      $('#wkTitle').textContent = "That didn't work."; $('#wkNote').hidden = true;
      say($('#wkErr'), last.error || 'Something went wrong.'); $('#again0').hidden = false;
    }
  };
  poll = setInterval(once, 1500);
  once();
}

// ---------- review: the map over the picture ----------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
let base = null, tweak = null, bg = null;

/** Same ordering rules the server applies on "Use this room", so the preview matches what you get. */
function view() {
  const f = base.floor;
  const backY = clamp(tweak.backY, 200, 780), frontY = clamp(tweak.frontY, backY + 80, 899);
  const ceilingY = clamp(tweak.ceilingY, 0, backY - 130);
  const top = clamp(base.air.top, ceilingY, backY - 110), bottom = clamp(base.air.bottom, top + 100, backY - 10);
  return { ...base, ceilingY, air: { top, bottom }, floor: { ...f, backY, frontY } };
}

function draw() {
  const s = view(), cv = $('#map'), g = cv.getContext('2d'), W = 1600, H = 900, f = s.floor;
  g.clearRect(0, 0, W, H);
  if (bg) g.drawImage(bg, 0, 0, W, H);
  g.lineJoin = 'round';
  // air band
  g.fillStyle = 'rgba(242,184,75,0.22)'; g.fillRect(0, s.air.top, W, s.air.bottom - s.air.top);
  g.strokeStyle = '#f2b84b'; g.lineWidth = 7; g.setLineDash([30, 20]);
  for (const y of [s.air.top, s.air.bottom]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.setLineDash([]);
  // floor trapezoid
  g.beginPath(); g.moveTo(f.backX[0], f.backY); g.lineTo(f.backX[1], f.backY); g.lineTo(f.frontX[1], f.frontY); g.lineTo(f.frontX[0], f.frontY); g.closePath();
  g.fillStyle = 'rgba(143,174,124,0.38)'; g.fill(); g.strokeStyle = '#8fd16a'; g.lineWidth = 8; g.stroke();
  // ceiling
  g.strokeStyle = '#e0694b'; g.lineWidth = 9; g.beginPath(); g.moveTo(0, s.ceilingY); g.lineTo(W, s.ceilingY); g.stroke();
  const tag = (txt, x, y, col) => { g.font = '700 54px ui-rounded, system-ui, sans-serif'; g.lineWidth = 11; g.strokeStyle = '#1a1220'; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); };
  tag('ceiling', 16, clamp(s.ceilingY - 14, 56, H)); tag('air', 16, s.air.top + 58); tag('floor', f.backX[0] + 40, f.backY + 64);
  // spots
  for (const p of s.spots) {
    g.beginPath(); g.arc(p.x, p.y, 20, 0, Math.PI * 2);
    g.fillStyle = { seat: '#8fd16a', table: '#f2b84b', perch: '#6ab7e0', rest: '#e0a0d0' }[p.kind] || '#fff'; g.fill();
    g.lineWidth = 6; g.strokeStyle = '#1a1220'; g.stroke();
    g.font = '700 54px ui-rounded, system-ui, sans-serif';
    const label = `${p.name}`, tw = g.measureText(label).width, lx = p.x + 30 + tw > W ? p.x - 30 - tw : p.x + 30;
    tag(label, Math.max(8, lx), clamp(p.y + 16, 56, H - 10), '#fff');
  }
}

async function openReview(job) {
  base = job.scene;
  tweak = { backY: base.floor.backY, frontY: base.floor.frontY, ceilingY: base.ceilingY };
  say($('#rvErr'), '');
  say($('#rvWarn'), job.warning || '');
  $('#rvTitle').textContent = job.mapSource === 'fallback' ? 'Fit the floor by hand' : `${base.name}: does the floor fit?`;
  $('#use').disabled = false; $('#use').textContent = 'Use this room';
  const set = (id, vid, v) => { $(id).value = v; $(vid).textContent = v; };
  set('#sBack', '#vBack', tweak.backY); set('#sFront', '#vFront', tweak.frontY); set('#sCeil', '#vCeil', tweak.ceilingY);
  bg = null;
  show('review');
  draw();
  const img = new Image();
  img.onload = () => { bg = img; draw(); };
  img.src = base.background + '?v=' + Date.now();
}

for (const [id, vid, key] of [['#sBack', '#vBack', 'backY'], ['#sFront', '#vFront', 'frontY'], ['#sCeil', '#vCeil', 'ceilingY']]) {
  $(id).addEventListener('input', () => {
    tweak[key] = Number($(id).value); const s = view();
    $('#vBack').textContent = s.floor.backY; $('#vFront').textContent = s.floor.frontY; $('#vCeil').textContent = s.ceilingY;
    draw();
  });
}

// ---------- actions ----------
function startOver() { jobId = null; store(null); clearInterval(poll); say($('#err'), ''); $('#file').value = ''; show('start'); }

$('#file').addEventListener('change', async () => {
  const file = $('#file').files[0];
  if (!file) return;
  say($('#err'), '');
  $('#pick').textContent = 'Sending…';
  try {
    const blob = await toJpeg(file);
    const r = await api('/api/host/scene', { method: 'POST', body: blob, headers: { 'content-type': 'image/jpeg' } });
    if (!r.ok) { say($('#err'), r.error); return; }
    watch(r.data.id);
  } catch (e) { say($('#err'), e.message || "Couldn't read that photo."); }
  finally { $('#pick').textContent = 'Take a photo'; }
});

$('#use').addEventListener('click', async () => {
  $('#use').disabled = true; $('#use').textContent = 'Switching…'; say($('#rvErr'), '');
  const r = await post(`/api/host/scene/${jobId}/apply`, { floor: { backY: tweak.backY, frontY: tweak.frontY }, ceilingY: tweak.ceilingY });
  if (!r.ok) { say($('#rvErr'), r.error); $('#use').disabled = false; $('#use').textContent = 'Use this room'; return; }
  $('#dnTitle').textContent = "It's live!"; $('#dnMsg').textContent = 'Taking you to the live room…';
  show('done');
  setTimeout(() => location.assign('/world'), 1500); // same origin, so the tunnel link stays on the tunnel
});

async function reset() {
  const r = await post('/api/host/scene/reset');
  if (!r.ok) { alert(r.error); return; }
  $('#dnTitle').textContent = 'Back at the void deck.'; $('#dnMsg').textContent = 'The big screen is showing the HDB void deck again.';
  show('done');
}

for (const id of ['#again0', '#again', '#again2']) $(id).addEventListener('click', startOver);
for (const id of ['#reset', '#reset2']) $(id).addEventListener('click', reset);

// ---------- boot ----------
(async function boot() {
  if (!KEY) return show('denied');
  let saved = null;
  try { saved = sessionStorage.getItem('commons.hostJob'); } catch { /* ignore */ }
  if (saved) {
    const r = await api('/api/host/scene/' + saved);
    if (r.status === 401) return show('denied');
    if (r.ok) return watch(saved);
  }
  show('start');
})();
