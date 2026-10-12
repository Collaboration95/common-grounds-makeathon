// Run log: one JSON line per pet in commons-world/runs.jsonl, written when it ends up live, declined, failed or vetoed.
// It keeps what was asked, the hat, the models used and how long each step took, so changes can be compared later.
import fs from "node:fs";
import path from "node:path";
import { WORLD } from "./store.mjs";

export const FILE = path.join(WORLD, "runs.jsonl");
const open = new Map(); // wish id -> facts gathered so far

export const start = (id, facts = {}) => { open.set(id, { ...facts }); };
/** Add facts to an open record (each step adds its own key: screen, sheet, build). Late facts for a finished pet are dropped. */
export const note = (id, patch) => { if (open.has(id)) open.set(id, { ...open.get(id), ...patch }); };
export const isOpen = (id) => open.has(id);

/** The pet reached an end state: write its line. */
export function finish(w, extra = {}) {
  const rec = {
    at: new Date().toISOString(), id: w.id, n: w.n, kind: w.kind, status: w.status, text: w.text, name: w.name, hat: w.hat ?? null, room: w.room ?? null,
    totalMs: Date.now() - w.createdAt, ...open.get(w.id), ...extra,
  };
  open.delete(w.id);
  fs.appendFile(FILE, JSON.stringify(rec) + "\n", (e) => e && console.error("run log:", e.message));
}

/** The last n records, oldest first. */
export function tail(n = 500) {
  try { return fs.readFileSync(FILE, "utf8").trim().split("\n").slice(-n).map((l) => JSON.parse(l)); } catch { return []; }
}
