// Animate every resident and preset character in parallel (the server's own limit of 3 at a time applies).
//   node tools/animate-all.mjs [id ...]      writes frames.png + anim.json next to each sprite.png
import fs from "node:fs";
import path from "node:path";
import { makeFrames } from "../server/animate.mjs";

const T = path.resolve(import.meta.dirname, "..", "template");
const only = process.argv.slice(2);
const jobs = [];
const RES = { oyen: "an orange void-deck cat", kopi: "a cheeky mynah bird" };
for (const [kind, sub] of [["residents", "residents"], ["presets", "presets/characters"]]) {
  const root = path.join(T, sub);
  if (!fs.existsSync(root)) continue;
  for (const id of fs.readdirSync(root)) {
    const dir = path.join(root, id);
    if (!fs.existsSync(path.join(dir, "sprite.png")) || (only.length && !only.includes(id))) continue;
    let desc = RES[id] || id;
    try { const m = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")); desc = `${m.name}: ${m.art || m.text || m.oneLine}`; } catch {}
    const c = (await import("../server/presets.mjs")).CHARACTERS?.find((x) => x.id === id);
    if (c) desc = `${c.name}: ${c.art}`;
    jobs.push({ id, dir, desc });
  }
}
await Promise.all(jobs.map(async (j) => {
  try { const r = await makeFrames(j.dir, j.desc); fs.rmSync(path.join(j.dir, "anim-work"), { recursive: true, force: true }); console.log(j.id, "ok", r.frameW + "x" + r.frameH); }
  catch (e) { console.log(j.id, "FAILED", e.message); }
}));
