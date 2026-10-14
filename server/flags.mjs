// Live model switch: commons-world/models.json is re-read whenever its mtime changes (one stat per call), so models,
// effort, tier and the Claude budget can change on a running server. Missing file or key = the env defaults.
// A broken file keeps the last good settings. Change it with `node tools/set-models.mjs haiku|luna|sonnet|show`.
import fs from "node:fs";
import path from "node:path";

const WORLD = process.env.COMMONS_WORLD ? path.resolve(process.env.COMMONS_WORLD) : path.resolve(import.meta.dirname, "..", "commons-world");
export const FLAGS_FILE = path.join(WORLD, "models.json");

let seen = -1, data = {}; // seen: mtime of the loaded file, 0 = no file, -1 = not looked yet
function read() {
  let st;
  try { st = fs.statSync(FLAGS_FILE); } catch { if (seen > 0) console.log("models.json gone: using the env defaults"); seen = 0; data = {}; return data; }
  if (st.mtimeMs === seen) return data;
  seen = st.mtimeMs;
  try {
    data = JSON.parse(fs.readFileSync(FLAGS_FILE, "utf8"));
    console.log("models.json loaded:", JSON.stringify(data));
  } catch (e) { console.error("models.json is not valid JSON, keeping the last good settings:", e.message); }
  return data;
}

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** { model, effort } for "screen" | "build" | "draw": the file's value where set, else the given defaults. */
export function setting(section, defaults) {
  const f = read()[section] || {};
  return { model: str(f.model) || defaults.model, effort: str(f.effort) || defaults.effort };
}

/** Codex service tier ("fast" or ""), shared by every Codex call. */
export const tier = (envTier = "") => { const t = read().tier; return typeof t === "string" ? t : envTier; };

/** Hard stop on Claude spend in dollars (0 = none). */
export const claudeBudget = (envBudget = 0) => Number(read().claudeBudgetUsd) || envBudget;
