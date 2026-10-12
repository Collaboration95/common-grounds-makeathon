// "It learns to walk": ask local Codex (ChatGPT login, image tool) for a 4x3 sprite sheet, slice it, flip wish.anim on.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import * as store from "./store.mjs";
import { sliceSheet } from "../tools/slice-sheet.mjs";

export const STYLE = "high-detail pixel art sprite (like Octopath / Celeste HD), clearly pixel-rendered with crisp square pixels, not blurry, rich warm palette, dark outline, readable silhouette";

const MODEL = process.env.ANIM_MODEL || "gpt-6-luna";
const TIMEOUT_MS = 6 * 60 * 1000;
const CONCURRENCY = 3;
const bin = (process.env.CODEX_BIN || "~/.local/bin/codex").replace(/^~/, os.homedir());
const env = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => v !== undefined && !/^(OPENAI_API_KEY|CODEX_API_KEY)$/.test(k)));

/** The unified action map (template/ACTION_MAP.md) as ONE prompt fragment. */
export const SHEET_SPEC = `Layout: landscape 1536x1024, a 4-column x 3-row grid of equal cells, NO grid lines, NO text, NO labels, fully TRANSPARENT background, the SAME character drawn identically in every cell (same size, colours, proportions), centred in each cell, side view facing RIGHT.
Cells 1-4 (row 1): WALK cycle (feet on the cell bottom, legs clearly alternating).
Cells 5-8 (row 2): FLY / hover cycle (character airborne, flapping, floating or bouncing in its own way — wings, propeller, steam, magic, whatever suits it).
Cell 9: IDLE standing. Cell 10: RESTING, sitting down. Cell 11: SLEEPING curled up, eyes closed. Cell 12: SPECIAL ATTACK — a big signature move with a small effect burst (still the same character).`;

const sheetPrompt = (description) => `Use your built-in image generation tool to create ONE image, then save it as sheet.png in the current folder (decode the image data and write the PNG; verify the file exists and print its pixel size).
The image is a game SPRITE SHEET for this character: ${description}.
${SHEET_SPEC}
Art style: ${STYLE}`;

let active = 0;
const waiting = [];
const slot = () => new Promise((res) => { const go = () => { active++; res(); }; active < CONCURRENCY ? go() : waiting.push(go); });
const release = () => { active--; waiting.shift()?.(); };

function runCodex(cwd, prompt) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ["exec", "--json", "--skip-git-repo-check", "-s", "workspace-write", "-m", MODEL, "-c", "model_reasoning_effort=low", prompt], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let err = "", out = "", thread = null;
    p.stderr.on("data", (d) => { err = (err + d).slice(-500); });
    p.stdout.on("data", (d) => { if (!thread) { out += d; thread = /"thread_id":"([^"]+)"/.exec(out)?.[1] || null; } });
    const timer = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("timeout")); }, TIMEOUT_MS);
    p.on("error", (e) => { clearTimeout(timer); reject(e); });
    p.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve(thread) : reject(new Error(`codex exited ${code}: ${err}`)); });
  });
}

/** Generate + slice a sheet for a description into outDir (frames.png + anim.json). Throws on failure. */
export async function makeFrames(outDir, description) {
  const work = path.join(outDir, "anim-work");
  fs.mkdirSync(work, { recursive: true });
  fs.rmSync(path.join(work, "sheet.png"), { force: true });
  await slot();
  let thread = null;
  try { thread = await runCodex(work, sheetPrompt(description)); } finally { release(); }
  if (!fs.existsSync(path.join(work, "sheet.png")) && thread) { // the model drew it but couldn't save it: Codex keeps its own copy
    const dir = path.join(os.homedir(), ".codex", "generated_images", thread);
    const pngs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".png")).map((f) => path.join(dir, f)) : [];
    const newest = pngs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    if (newest) fs.copyFileSync(newest, path.join(work, "sheet.png"));
  }
  if (!fs.existsSync(path.join(work, "sheet.png"))) throw new Error("no sheet.png produced");
  return sliceSheet(path.join(work, "sheet.png"), outDir);
}

/** Never throws: on any failure the static sprite stays. */
export async function animateThing(w, description) {
  try {
    await makeFrames(store.thingDir(w.id), description || w.text);
    if (w.status === "vetoed") return;
    store.update(w, { anim: true, animAt: Date.now() });
    store.log(w, `#${w.n} learned to walk`);
  } catch (e) { console.error(`animate ${w.id} failed:`, e.message); }
}
