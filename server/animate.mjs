// "It learns to walk": ask local Codex (ChatGPT login, image tool) for a 4x3 sprite sheet, slice it, flip wish.anim on.
// The model only calls the image tool. Codex keeps every image it makes in ~/.codex/generated_images/<thread>/, so the
// server takes the sheet from there and stops the run: no save step for the model to fumble (or to mix up with another
// pet's file in a shared /tmp).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import * as store from "./store.mjs";
import { sliceSheet } from "../tools/slice-sheet.mjs";
import { setting, tier } from "./flags.mjs";

export const STYLE = "high-detail pixel art sprite (like Octopath / Celeste HD), clearly pixel-rendered with crisp square pixels, not blurry, rich warm palette, dark outline, readable silhouette";

const ENV = { model: process.env.ANIM_MODEL || "gpt-6-luna", effort: process.env.ANIM_EFFORT || "low" };
const ENV_TIER = process.env.CODEX_TIER || ""; // "fast" = priority processing on the ChatGPT plan
/** The drawing model: models.json "draw" (read per sheet). A claude-* id is ignored, since Claude cannot draw. */
const drawCfg = () => { const c = setting("draw", ENV); return { ...(/^claude-/.test(c.model) ? ENV : c), tier: tier(ENV_TIER) }; };
const TIMEOUT_MS = 4 * 60 * 1000;
const ATTEMPTS = 2;
const CONCURRENCY = Number(process.env.ANIM_CONCURRENCY) || 3;
const IMAGES = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "generated_images");
const bin = (process.env.CODEX_BIN || "~/.local/bin/codex").replace(/^~/, os.homedir());
const env = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => v !== undefined && !/^(OPENAI_API_KEY|CODEX_API_KEY|ANTHROPIC_API_KEY)$/.test(k)));

/** The unified action map (template/ACTION_MAP.md) as ONE prompt fragment. */
export const SHEET_SPEC = `Layout: landscape 1536x1024, a 4-column x 3-row grid of equal cells, NO grid lines, NO text, NO labels, fully TRANSPARENT background, the SAME character drawn identically in every cell (same size, colours, proportions), centred in each cell, side view facing RIGHT.
Cells 1-4 (row 1): WALK cycle (feet on the cell bottom, legs clearly alternating).
Cells 5-8 (row 2): FLY / hover cycle (character airborne, flapping, floating or bouncing in its own way — wings, propeller, steam, magic, whatever suits it).
Cell 9: IDLE standing. Cell 10: RESTING, sitting down. Cell 11: SLEEPING curled up, eyes closed. Cell 12: SPECIAL ATTACK — a big signature move with a small effect burst (still the same character).`;

const imagePrompt = (description, wish) => `A game SPRITE SHEET for this character: ${description}.
${wish && wish !== description ? `The visitor's own words: ${wish}. ` : ""}Everything visible they named (what it is, what it wears, holds or eats) must show clearly in every cell. Add nothing they did not ask for: no extra hats, caps, bags, backpacks, goggles or scarves (a hat is added separately).
${SHEET_SPEC}
Art style: ${STYLE}`;

const sheetPrompt = (description, wish) => `Call the image generation tool exactly once, with transparent_background set to true, passing the prompt below word for word. Do not run shell commands, do not write or save any files, and do not call the tool again. When the image comes back, reply: done.

${imagePrompt(description, wish)}`;

let active = 0;
const waiting = [];
const slot = () => new Promise((res) => { const go = () => { active++; res(); }; active < CONCURRENCY ? go() : waiting.push(go); });
const release = () => { active--; waiting.shift()?.(); };

const complete = (f) => { try { const b = fs.readFileSync(f); return b.length > 1000 && b.subarray(-8, -4).toString("latin1") === "IEND" ? b : null; } catch { return null; } };
const firstImage = (thread) => {
  const dir = path.join(IMAGES, thread);
  let pngs = [];
  try { pngs = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).map((f) => path.join(dir, f)); } catch { return null; }
  pngs.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  for (const f of pngs) { const b = complete(f); if (b) return b; }
  return null;
};

/** One Codex run. Resolves {thread, png} as soon as the image lands (the run is stopped then), or when Codex exits. */
function runCodex(cwd, prompt, signal, cfg) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("stopped"));
    const args = ["exec", "--json", "--skip-git-repo-check", "-s", "workspace-write", "-m", cfg.model, "-c", `model_reasoning_effort=${cfg.effort}`];
    if (cfg.tier) args.push("-c", `service_tier=${JSON.stringify(cfg.tier)}`);
    const p = spawn(bin, [...args, prompt], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let err = "", out = "", thread = null, done = false;
    const onAbort = () => finish(() => { stop(); reject(new Error("stopped")); });
    const finish = (fn) => { if (done) return; done = true; clearInterval(poll); clearTimeout(timer); signal?.removeEventListener("abort", onAbort); fn(); };
    const stop = () => { p.kill("SIGTERM"); setTimeout(() => p.exitCode === null && p.kill("SIGKILL"), 3000).unref(); };
    p.stderr.on("data", (d) => { err = (err + d).slice(-500); });
    p.stdout.on("data", (d) => { if (!thread) { out += d; thread = /"thread_id":"([^"]+)"/.exec(out)?.[1] || null; } });
    const poll = setInterval(() => {
      const png = thread && firstImage(thread);
      if (png) finish(() => { stop(); resolve({ thread, png }); });
    }, 500);
    const timer = setTimeout(() => finish(() => { stop(); reject(new Error("timeout")); }), TIMEOUT_MS);
    signal?.addEventListener("abort", onAbort);
    p.on("error", (e) => finish(() => reject(e)));
    p.on("close", (code) => finish(() => {
      const png = (thread && firstImage(thread)) || complete(path.join(cwd, "sheet.png")); // older Codex: the model may have saved it itself
      png ? resolve({ thread, png }) : reject(new Error(code === 0 ? "no image made" : `codex exited ${code}: ${err}`));
    }));
  });
}

/**
 * Generate + slice a sheet for a description into outDir (frames.png + anim.json). Throws on failure.
 * `wish` is the visitor's own words, so the picture keeps what they asked for. Returns the slice info plus `run` timings.
 */
export async function makeFrames(outDir, description, { wish = null, signal = null } = {}) {
  const work = path.join(outDir, "anim-work"), t0 = Date.now(), cfg = drawCfg(), run = { model: cfg.model, effort: cfg.effort, tier: cfg.tier || "default", attempts: 0, waitMs: 0, imageMs: [], errors: [] };
  fs.mkdirSync(work, { recursive: true });
  await slot();
  run.waitMs = Date.now() - t0;
  try {
    for (;;) {
      run.attempts++;
      const ta = Date.now();
      try {
        fs.rmSync(path.join(work, "sheet.png"), { force: true });
        const r = await runCodex(work, sheetPrompt(description, wish), signal, cfg);
        run.imageMs.push(Date.now() - ta);
        fs.writeFileSync(path.join(work, "sheet.png"), r.png);
        const a = sliceSheet(path.join(work, "sheet.png"), outDir);
        return { ...a, run: { ...run, ms: Date.now() - t0, thread: r.thread } };
      } catch (e) {
        run.errors.push(String(e.message).slice(0, 160));
        if (run.attempts >= ATTEMPTS || signal?.aborted) throw Object.assign(new Error(e.message), { run: { ...run, ms: Date.now() - t0 } });
      }
    }
  } finally { release(); }
}

/** Never throws: on any failure the static sprite stays. */
export async function animateThing(w, description) {
  try {
    await makeFrames(store.thingDir(w.id), description || w.text, { wish: w.text });
    if (w.status === "vetoed") return;
    store.update(w, { anim: true, animAt: Date.now() });
    store.log(w, `#${w.n} learned to walk`);
  } catch (e) { console.error(`animate ${w.id} failed:`, e.message); }
}
