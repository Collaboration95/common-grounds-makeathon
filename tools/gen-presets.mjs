// Preset art and behaviours (see server/presets.mjs for the definitions).
//   npm run presets                         draws whatever sprite / hat PNG is missing, in parallel, and writes meta.json
//   npm run presets -- --force [ids...]     redraw the named ids (or everything)
//   npm run presets -- --behaviour [ids]    ALSO builds thing.js with the real Codex worker (needs "Thing contract v2" in
//                                           template/CONTRACT.md); with --force it rebuilds existing ones
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const ids = args.filter((a) => !a.startsWith("--"));
const force = flag("--force"), behaviour = flag("--behaviour");
const want = (id) => !ids.length || ids.includes(id);

// Codex builds in a scratch world so the real commons-world is untouched.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "commons-presets-"));
process.env.COMMONS_WORLD = scratch;
const { generate, savePng, spritePrompt, decodePng, encodePng } = await import("../server/image.mjs");
const { CHARACTERS, HATS, DIR } = await import("../server/presets.mjs");
const { ROOT, checkThing } = await import("../server/store.mjs");

const charDir = (id) => path.join(DIR, "characters", id);
const rel = (f) => path.relative(ROOT, f);
const jobs = [];
const hasRealThing = (id) => { try { return !fs.readFileSync(path.join(charDir(id), "thing.js"), "utf8").startsWith("// PLACEHOLDER"); } catch { return false; } };

/** Crop a transparent PNG to its opaque bounding box (+ a few px) so hats sit predictably on any sprite. */
function cropToContent(buf) {
  const { w, h, px } = decodePng(buf);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return buf;
  const pad = 6; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) px.copy(out, y * cw * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + cw) * 4);
  return encodePng({ w: cw, h: ch, px: out });
}

for (const c of CHARACTERS) {
  if (!want(c.id)) continue;
  const file = path.join(charDir(c.id), "sprite.png");
  if (force || !fs.existsSync(file)) jobs.push({ label: `sprite ${c.id}`, run: async () => savePng(await generate(spritePrompt(c.art)), file, 256), out: file });
  const meta = path.join(charDir(c.id), "meta.json");
  if (force || !fs.existsSync(meta)) {
    fs.mkdirSync(charDir(c.id), { recursive: true });
    fs.writeFileSync(meta, JSON.stringify({ name: c.name, tags: c.tags, zone: c.zone, size: c.size, oneLine: c.oneLine, text: c.text }, null, 1));
  }
}
for (const h of HATS) {
  if (!want(h.id)) continue;
  const file = path.join(DIR, "hats", h.id + ".png");
  if (force || !fs.existsSync(file)) jobs.push({ label: `hat ${h.id}`, run: async () => savePng(cropToContent(await generate(h.art)), file, 256), out: file });
}

async function drawAll() {
  if (!jobs.length) return console.log("art: nothing to draw (use --force to redraw)");
  await Promise.all(jobs.map(async (j) => {
    const t0 = Date.now();
    try { await j.run(); console.log(`${j.label}: ${rel(j.out)} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
    catch (e) { console.error(`${j.label} failed: ${e.message}`); process.exitCode = 1; }
  }));
}

async function buildBehaviours() {
  const contract = fs.readFileSync(path.join(ROOT, "template", "CONTRACT.md"), "utf8");
  if (!contract.includes("Thing contract v2")) {
    console.error('behaviour: template/CONTRACT.md does not say "Thing contract v2" yet; not building thing.js.');
    process.exitCode = 1;
    return;
  }
  const { buildThing } = await import("../server/codex.mjs"); // reads CONTRACT.md at import, so import after the check
  const todo = CHARACTERS.filter((c) => want(c.id) && (force || !hasRealThing(c.id)));
  if (!todo.length) return console.log("behaviour: nothing to build (use --force to rebuild)");
  await Promise.all(todo.map(async (c) => {
    const t0 = Date.now(), tag = `[${c.id}]`;
    const res = await buildThing({ id: "preset-" + c.id, text: c.text, brief: `${c.name}. ${c.oneLine} Zone: ${c.zone}.`, log: (l) => console.log(tag, l), onTesting: () => {}, check: checkThing });
    if (!res.ok) { console.error(`${tag} FAILED: ${res.error}`); process.exitCode = 1; return; }
    const dir = charDir(c.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(scratch, "things", "preset-" + c.id, "thing.js"), path.join(dir, "thing.js"));
    const meta = path.join(dir, "meta.json");
    const old = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, "utf8")) : {};
    // thing.js is the source of truth for name / tags / zone / size; the hand-written oneLine and text stay.
    fs.writeFileSync(meta, JSON.stringify({ ...old, name: res.thing.name, tags: res.thing.tags, zone: res.thing.zone, size: res.thing.size, oneLine: old.oneLine || res.thing.oneLine, text: c.text }, null, 1));
    console.log(`${tag} thing.js ok (${((Date.now() - t0) / 1000).toFixed(0)}s, ${res.turns} turn(s))`);
  }));
}

await Promise.all([drawAll(), behaviour ? buildBehaviours() : null]);
fs.rmSync(scratch, { recursive: true, force: true });
process.exit(process.exitCode || 0);
