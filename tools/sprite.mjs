// node tools/sprite.mjs "<short line>" [outDir]  -> sheet.png + frames.png + anim.json via the server pipeline (ANIM_MODEL, default gpt-6-luna)
import fs from "node:fs";
import path from "node:path";
import { makeFrames } from "../server/animate.mjs";

const line = process.argv[2];
if (!line) { console.error('usage: node tools/sprite.mjs "<short line>" [outDir]'); process.exit(1); }
const out = path.resolve(process.argv[3] || "sprite-out");
const t0 = Date.now();
const a = await makeFrames(out, line);
fs.copyFileSync(path.join(out, "anim-work", "sheet.png"), path.join(out, "sheet.png"));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out} (sheet.png, frames.png, anim.json; ${a.count} frames ${a.frameW}x${a.frameH})`);
