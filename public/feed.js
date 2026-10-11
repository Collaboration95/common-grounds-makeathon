// feed.js - shared data plumbing for /world, /wish and /console.
//   createFeed()          SSE (or ?dev=1 simulator) -> wishes Map + events: hello wish log poke remove depart scene status
//   bindWorld(engine, feed)  wish upserts -> scaffolds / things in an engine world
// No backend needed in dev: add ?dev=1 and fixtures from /dev/ are used.
import { loadImage } from '/engine.js';

export const DEV = new URLSearchParams(location.search).has('dev');

export function getDeviceId() {
  let id = null;
  try { id = localStorage.getItem('commons.deviceId'); } catch { /* private mode */ }
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    try { localStorage.setItem('commons.deviceId', id); } catch { /* ignore */ }
  }
  return id;
}

async function post(path, body) {
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    let data = null;
    if (r.status !== 204) { try { data = await r.json(); } catch { /* not json */ } }
    return { ok: r.ok, status: r.status, data, error: r.ok ? null : (data && data.error) || `Something went wrong (${r.status}).` };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Could not reach the Commons. Check your connection and try again.' };
  }
}

// total = wishes made (residents excluded), here = live right now, gone = waved goodbye (cap of 10).
export function counts(wishes) {
  let total = 0, here = 0, gone = 0, declined = 0;
  for (const w of wishes.values()) {
    if (w.status === 'vetoed') continue;
    if (w.status === 'live') here++;
    if (w.status === 'departed') gone++;
    if (w.resident || w.kind === 'resident') continue;
    total++;
    if (w.status === 'declined' || w.status === 'failed') declined++;
  }
  return { total, here, gone, declined, living: here };
}

export function createFeed({ auto = false } = {}) {
  const wishes = new Map();
  const handlers = {};
  const feed = { wishes, DEV, status: 'connecting', sim: null, scene: null };
  const emit = (type, ...args) => {
    for (const fn of handlers[type] || []) {
      try { fn(...args); } catch (e) { console.error(`[feed:${type}]`, e); }
    }
  };
  const setStatus = (s) => { if (feed.status !== s) { feed.status = s; emit('status', s); } };
  feed.on = (type, fn) => { (handlers[type] ||= []).push(fn); return feed; };
  feed.localRemove = (id) => push.remove({ id }); // same path as the SSE 'remove' event

  const push = {
    hello(list, scene) {
      if (scene) push.scene(scene); // before the wishes, so things land in the right room
      const seen = new Set();
      for (const w of list) { wishes.set(w.id, w); seen.add(w.id); }
      for (const id of [...wishes.keys()]) if (!seen.has(id)) wishes.delete(id);
      setStatus('open');
      emit('hello', list);
    },
    wish(w) {
      const prev = wishes.get(w.id);
      wishes.set(w.id, w);
      emit('wish', w, prev);
    },
    log(d) { emit('log', d); },
    poke(d) { emit('poke', d); },
    remove(d) {
      const w = wishes.get(d.id);
      if (w) wishes.set(d.id, { ...w, status: 'vetoed' });
      emit('remove', d);
    },
    scene(s) {
      if (!s || typeof s !== 'object') return;
      feed.scene = s;
      emit('scene', s);
    },
    depart(d) { // cap of 10: the oldest thing says bye and walks off
      const w = wishes.get(d.id);
      if (w && w.status !== 'departed') wishes.set(d.id, { ...w, status: 'departed', departedAt: w.departedAt || Date.now() });
      emit('depart', d);
    },
  };

  if (DEV) {
    import('/dev/sim.js').then((m) => m.start(push, { auto })).then((sim) => {
      feed.sim = sim;
    }).catch((e) => { console.error('dev sim failed', e); setStatus('error'); });
    feed.submit = (text, name) => feed.sim.submit(text, name, getDeviceId());
    feed.poke = (id) => feed.sim.poke(id);
    feed.veto = (id) => feed.sim.veto(id);
    feed.adminWish = (text, name) => feed.sim.submit(text, name, 'admin');
  } else {
    const es = new EventSource('/api/events');
    const on = (type, fn) => es.addEventListener(type, (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch { return; }
      fn(data);
    });
    on('hello', (d) => push.hello(d.wishes || [], d.scene));
    on('wish', push.wish);
    on('log', push.log);
    on('poke', push.poke);
    on('remove', push.remove);
    on('scene', push.scene);
    on('depart', push.depart);
    es.onopen = () => setStatus('open');
    es.onerror = () => setStatus('error');
    // Some tunnels (cloudflared quick tunnels) buffer SSE forever: if no hello arrives, poll /api/world instead.
    let gotHello = false, polling = false, lastScene = null, lastLog = 0;
    es.addEventListener('hello', () => { gotHello = true; });
    const poll = async () => {
      try {
        const d = await (await fetch('/api/world', { cache: 'no-store' })).json();
        const list = d.wishes || [];
        if (!polling) { polling = true; lastScene = d.scene?.id; push.hello(list, d.scene); }
        else {
          if (d.scene && d.scene.id !== lastScene) { lastScene = d.scene.id; push.scene(d.scene); }
          const seen = new Set();
          for (const w of list) {
            seen.add(w.id);
            const prev = wishes.get(w.id);
            if (prev && JSON.stringify(prev) === JSON.stringify(w)) continue;
            if (w.status === 'departed' && prev && prev.status !== 'departed') push.depart({ id: w.id });
            push.wish(w);
          }
          for (const id of [...wishes.keys()]) if (!seen.has(id) && wishes.get(id).status !== 'vetoed') push.remove({ id });
        }
        for (const l of d.logs || []) if (l.t > lastLog) { lastLog = l.t; push.log(l); }
        setStatus('open');
      } catch { setStatus('error'); }
      setTimeout(poll, 2000);
    };
    setTimeout(() => { if (!gotHello) { es.close(); poll(); } }, 3000);
    feed.submit = (text, name) => post('/api/wish', { text, name, deviceId: getDeviceId() });
    feed.poke = (id) => post('/api/poke', { id, deviceId: getDeviceId() });
    feed.veto = (id) => post('/api/admin/veto', { id });
    feed.adminWish = (text, name) => post('/api/admin/wish', { text, name });
    feed.close = () => es.close();
  }
  return feed;
}

// ---- wish -> engine bridge ---------------------------------------------------------------------
const thingUrl = (w) => (DEV && w.devThing ? `/dev/things/${w.devThing}/thing.js` : `/things/${w.id}/thing.js?v=${w.acceptedAt || 0}`);
const spriteUrl = (w) => w.spriteUrl || `/things/${w.id}/sprite.png?v=${w.acceptedAt || 0}`;
const animUrl = (w, f) => `/things/${w.id}/${f}?v=${w.animAt || 0}`;
async function loadAnim(w) {
  if (!w.anim) return null;
  try {
    const [meta, img] = await Promise.all([fetch(animUrl(w, 'anim.json')).then((r) => (r.ok ? r.json() : null)), loadImage(animUrl(w, 'frames.png'))]);
    return meta && img ? { meta, img } : null;
  } catch { return null; }
}
const patchUrl = (w) => `/things/${w.id}/patch.png?v=${w.acceptedAt || 0}`;

export function bindWorld(engine, feed) {
  const known = new Map(); // id -> last status this client has seen (drives "should it animate in?")
  const loading = new Set();
  const animLoading = new Set();
  const binder = { assets: new Map(), hold: false };

  async function load(w) {
    const [mod, sprite, patch, anim] = await Promise.all([
      import(thingUrl(w)).catch((err) => { console.warn(`[commons] could not load thing ${w.id}:`, err); return null; }),
      w.sprite === 'done' || w.spriteUrl ? loadImage(spriteUrl(w)) : null,
      w.hasPatch ? loadImage(patchUrl(w)) : null,
      loadAnim(w),
    ]);
    return { mod, sprite, patch, anim };
  }

  binder.addNow = (id, arrive) => {
    const a = binder.assets.get(id);
    if (!a) return false;
    engine.clearScaffold(id, arrive);
    engine.add(a.wish, a.mod, a.sprite, a.patch, { arrive, anim: a.anim });
    return true;
  };

  // timelapse: make sure live AND departed things have their module + art loaded (departed ones were never brought live here)
  binder.preload = async (list) => {
    await Promise.all(list.map(async (w) => {
      const a = binder.assets.get(w.id);
      if (a) { a.wish = w; return; }
      binder.assets.set(w.id, { wish: w, ...(await load(w)) });
    }));
  };

  binder.flush = () => {
    for (const [id, a] of binder.assets) {
      if (a.wish.status === 'live' && !engine.has(id)) binder.addNow(id, true);
    }
  };

  async function bringLive(w, arrive) {
    loading.add(w.id);
    const a = await load(w);
    loading.delete(w.id);
    const cur = feed.wishes.get(w.id) || w;
    if (cur.status !== 'live') return;
    binder.assets.set(w.id, { wish: cur, ...a });
    if (binder.hold) return;
    binder.addNow(w.id, arrive);
  }

  function apply(w) {
    const prev = known.get(w.id);
    known.set(w.id, w.status);
    switch (w.status) {
      case 'screening':
      case 'queued':
      case 'coding':
      case 'testing':
        if (engine.has(w.id)) engine.remove(w.id, { silent: true });
        binder.assets.delete(w.id);
        engine.setScaffold(w);
        break;
      case 'live': {
        const a = binder.assets.get(w.id);
        if (a) a.wish = w;
        if (engine.has(w.id)) {
          engine.updateWish(w);
          if (w.anim && !engine.hasAnim(w.id) && !animLoading.has(w.id)) { // it learns to walk
            animLoading.add(w.id);
            loadAnim(w).then((an) => { animLoading.delete(w.id); if (an) { if (a) a.anim = an; engine.setAnim(w.id, an, { sparkle: true }); } });
          }
        }
        else if (!loading.has(w.id) && !(a && binder.hold)) bringLive(w, prev !== undefined && prev !== 'live');
        break;
      }
      case 'departed': { // cap of 10: said bye, walks off, fades. Assets stay for the timelapse.
        engine.clearScaffold(w.id, false);
        const a = binder.assets.get(w.id);
        if (a) a.wish = w;
        if (engine.has(w.id) && !engine.isDeparting(w.id)) engine.depart(w.id);
        break;
      }
      default: // declined | failed | vetoed
        engine.clearScaffold(w.id, false);
        binder.assets.delete(w.id);
        engine.remove(w.id);
    }
  }

  feed.on('hello', (list) => {
    const ids = new Set(list.map((w) => w.id));
    for (const w of list) apply(w);
    for (const id of [...known.keys()]) {
      if (!ids.has(id)) { known.delete(id); engine.clearScaffold(id, false); binder.assets.delete(id); engine.remove(id, { silent: true }); }
    }
  });
  feed.on('wish', apply);
  feed.on('scene', (s) => engine.setScene(s));
  feed.on('depart', ({ id }) => {
    known.set(id, 'departed');
    engine.clearScaffold(id, false);
    engine.depart(id);
  });
  feed.on('remove', ({ id }) => {
    known.set(id, 'vetoed');
    engine.clearScaffold(id, false);
    binder.assets.delete(id);
    engine.remove(id);
  });
  feed.on('poke', ({ id }) => engine.poke(id));
  return binder;
}
