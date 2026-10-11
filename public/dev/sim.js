// Dev-mode simulator: stands in for the backend (SSE + HTTP API) when a page is opened with ?dev=1.
// Drives the same push hooks the real EventSource drives: hello / wish / log / poke / remove / scene / depart.
// Contract v2: also plays the server's cap of 10 (oldest non-founder says bye) and can swap the room (alt scene).
const RESERVE = [
  { thing: 'hat', meta: { name: 'Red Fez', tags: ['hat', 'red'], zone: 'ground', size: 1, oneLine: 'A fez that wants to be left alone.' } },
  { thing: 'raincloud', meta: { name: 'Left-Side Rain', tags: ['weather', 'wet'], zone: 'air', size: 2, oneLine: 'Rains on the left half only.' } },
];
const SLOTS = [180, 470, 760, 1000, 1240, 1500];
const HATS = ['crown', 'chef', 'party', 'songkok', 'bucket', 'caping'];
const CAP = 10;

export async function start(push, { auto = false } = {}) {
  const fixtures = await (await fetch('/dev/wishes.json')).json();
  const scenes = {
    voiddeck: await (await fetch('/scenes/voiddeck/scene.json')).json(),
    alt: await (await fetch('/dev/scenes/alt/scene.json')).json(),
  };
  let sceneNow = 'voiddeck';
  const now = Date.now();
  const list = fixtures.wishes.map((w) => {
    const { agoMin = 0, ...rest } = w;
    const t = now - agoMin * 60000;
    return {
      createdAt: t - 50000, acceptedAt: w.status === 'live' ? t : null, queuePos: null, bleed: null, hasPatch: false,
      reason: null, stats: null, thing: null, resident: false, kind: 'wish', hat: null, departedAt: null, ...rest,
    };
  });
  const byId = new Map(list.map((w) => [w.id, w]));
  let n = list.length;
  let simCount = 0;
  const myDevices = new Map(); // deviceId -> {declined, wishes}

  const emitWish = (w) => { byId.set(w.id, w); push.wish({ ...w }); };
  const logLine = (w, line) => push.log({ id: w.id, n: w.n, line, t: Date.now() });
  const at = (ms, fn) => setTimeout(fn, ms);

  function pickSlot() {
    const used = [...byId.values()].filter((w) => w.status !== 'declined' && w.status !== 'failed').map((w) => w.slotX);
    const free = SLOTS.filter((x) => used.every((u) => Math.abs(u - x) > 130));
    const pool = free.length ? free : SLOTS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function submit(text, name, deviceId) {
    text = String(text || '').trim();
    if (text.length < 3 || text.length > 120) return Promise.resolve({ ok: false, status: 400, error: 'A wish needs 3 to 120 characters.' });
    const dev = myDevices.get(deviceId) || { declined: 0, active: false };
    if (deviceId !== 'admin') {
      if (dev.active) return Promise.resolve({ ok: false, status: 429, error: 'You already made a wish. One per person, so everyone gets a turn.' });
      if (dev.declined > 1) return Promise.resolve({ ok: false, status: 429, error: 'That was your retry. Thanks for trying!' });
      dev.active = true;
      myDevices.set(deviceId, dev);
    }
    const reserve = RESERVE[simCount++ % RESERVE.length];
    const w = {
      id: 'sim' + simCount, n: ++n, text, name: String(name || '').trim().slice(0, 20) || 'someone', createdAt: Date.now(), acceptedAt: null,
      status: 'screening', queuePos: null, sprite: 'pending', slotX: pickSlot(), thing: null, bleed: null, hasPatch: false,
      reason: null, stats: null, resident: false, devThing: reserve.thing,
    };
    const started = Date.now();
    emitWish(w);
    at(1200, () => {
      if (/ignore|delete|president|kill/i.test(text)) {
        dev.active = false;
        dev.declined++;
        logLine(w, 'screening: declined');
        return emitWish({ ...w, status: 'declined', reason: 'That one sounds like it is about the rules rather than a creature. Try describing one thing you would like to see.' });
      }
      logLine(w, 'screening: ok');
      emitWish({ ...w, status: 'queued', queuePos: 1 });
      at(1200, () => {
        emitWish({ ...w, status: 'coding', sprite: 'drawing' });
        logLine(w, 'codex thread started');
        at(1800, () => logLine(w, 'wrote thing.js (38 lines)'));
        at(3000, () => {
          emitWish({ ...w, status: 'testing', sprite: 'drawing' });
          logLine(w, 'ran check-thing → 2 errors');
        });
        at(4300, () => logLine(w, 'fixed update()'));
        at(5200, () => logLine(w, 'ran check-thing → passed'));
        at(5800, () => {
          logLine(w, 'sprite ready');
          emitWish({ ...w, status: 'testing', sprite: 'failed' });
        });
        at(6300, () => {
          const buildMs = Date.now() - started;
          dev.active = false;
          emitWish({ ...w, status: 'live', sprite: 'failed', acceptedAt: Date.now(), thing: reserve.meta,
            hat: HATS[simCount % HATS.length], stats: { buildMs, turns: 2, checkRuns: 2, checkFails: 1 } });
          logLine(w, `live: ${reserve.meta.name}`);
          enforceCap();
        });
      });
    });
    return Promise.resolve({ ok: true, status: 200, data: { id: w.id } });
  }

  // the server's rule: past CAP live things, the oldest one (never the founder) departs
  function enforceCap() {
    const live = [...byId.values()].filter((w) => w.status === 'live').sort((a, b) => (a.acceptedAt || 0) - (b.acceptedAt || 0));
    if (live.length > CAP) depart(live[1].id);
  }
  function depart(id) {
    const w = byId.get(id);
    if (!w || w.status !== 'live') return false;
    push.depart({ id }); // SSE `depart` first (the thing says bye and walks off) ...
    emitWish({ ...w, status: 'departed', departedAt: Date.now() }); // ... then the manifest update
    logLine(w, `${w.thing ? w.thing.name : 'a thing'} waved goodbye`);
    return true;
  }

  const api = {
    depart,
    swapScene() { // dev key S: flip between the void deck and a very different room
      sceneNow = sceneNow === 'voiddeck' ? 'alt' : 'voiddeck';
      push.scene(scenes[sceneNow]);
      return scenes[sceneNow].name;
    },
    submit,
    poke(id) { at(80, () => push.poke({ id })); return Promise.resolve({ ok: true, status: 204 }); },
    veto(id) { at(30, () => push.remove({ id })); return Promise.resolve({ ok: true, status: 204 }); },
    spawn(text = 'a hat that is very proud of itself', name = 'Dev') { return submit(text, name, 'admin'); },
  };

  push.hello(list, scenes.voiddeck);
  if (auto) {
    at(2000, () => api.spawn('a mynah-proof fez that sulks', 'Priya'));
    at(5500, () => api.spawn('rain that only falls on the left half', 'Sam'));
  }
  return api;
}
