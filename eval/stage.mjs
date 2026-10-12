// Run ONE pipeline stage for a set of wishes under whatever model env this process was started with. Local only.
//   node eval/stage.mjs <screen|build|sheet> <wishes.jsonl> <outDir> [--only e01,e02] [--conc 4]
// Writes <outDir>/<stage>/<id>.json (+ artifacts for build / sheet). Env passes through: SCREEN_CODEX_MODEL, SCREEN_EFFORT,
// CODEX_MODEL, CODEX_EFFORT, ANIM_MODEL, ANIM_EFFORT, CODEX_TIER. For `build`, set COMMONS_WORLD to a temp folder.
import fs from "node:fs";
import path from "node:path";

const [stage, wishFile, outDir, ...rest] = process.argv.slice(2);
const opt = (k, d) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : d);
const only = opt("--only", "") ? new Set(opt("--only").split(",")) : null;
const conc = Number(opt("--conc", 4));
const wishes = fs.readFileSync(wishFile, "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((w) => !only || only.has(w.id));
const dir = path.join(outDir, stage);
fs.mkdirSync(dir, { recursive: true });
const save = (id, o) => fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(o, null, 1));

const impl = {
  async screen(w) {
    const { screen } = await import("../server/screen.mjs");
    const t = Date.now();
    return { ...(await screen(w.text)), ms: Date.now() - t };
  },
  async build(w) {
    const { buildThing } = await import("../server/codex.mjs");
    const { thingDir } = await import("../server/store.mjs");
    let brief = null; // same brief production passes: the screen's summary, from this config's own screen run if there is one
    try { brief = JSON.parse(fs.readFileSync(path.join(outDir, "screen", `${w.id}.json`), "utf8")).thingSummary || null; } catch {}
    const t = Date.now(), lines = [];
    const r = await buildThing({ id: w.id, text: w.text, brief, log: (l) => lines.push(`${((Date.now() - t) / 1000).toFixed(1)}s ${l}`), onTesting() {} });
    const dst = path.join(outDir, "things", w.id);
    fs.mkdirSync(dst, { recursive: true });
    for (const f of ["thing.js", "wish.json"]) try { fs.copyFileSync(path.join(thingDir(w.id), f), path.join(dst, f)); } catch {}
    return { ...r, ms: Date.now() - t, log: lines };
  },
  async sheet(w) {
    const { makeFrames } = await import("../server/animate.mjs");
    const dst = path.join(outDir, "things", w.id), t = Date.now();
    try {
      const a = await makeFrames(dst, w.text, { wish: w.text });
      return { ok: true, ms: Date.now() - t, ...a.run, scale: a.scale, flat: a.flatBackground };
    } catch (e) { return { ok: false, ms: Date.now() - t, error: String(e.message), ...e.run }; }
  },
}[stage];
if (!impl) { console.error("stage must be screen | build | sheet"); process.exit(2); }

const queue = [...wishes];
let done = 0;
await Promise.all(Array.from({ length: Math.min(conc, queue.length) }, async () => {
  for (let w; (w = queue.shift()); ) {
    let o;
    try { o = await impl(w); } catch (e) { o = { ok: false, crashed: String(e.stack || e).slice(0, 400) }; }
    save(w.id, o);
    console.log(`${stage} ${++done}/${wishes.length} ${w.id} ${o.ok === false ? "FAIL" : "ok"} ${o.ms ?? ""}ms`);
  }
}));
process.exit(0);
