// Try wishes end to end on a throwaway server: real screen, Codex build and sprite sheet, nothing touches commons-world/.
//   node tools/try-wishes.mjs ["a wish" ...]        (no wishes: a built-in set of past troublemakers)
// Starts server/index.mjs on a free port with COMMONS_WORLD in a temp folder, sends every wish at once (hats cycle),
// waits for each to end up live / declined / failed, then prints the run log and writes report.html with each pet's frames.
// Model settings pass through the environment, e.g. CODEX_TIER=fast ANIM_MODEL=gpt-6.1-sol node tools/try-wishes.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const WISHES = process.argv.slice(2).length ? process.argv.slice(2) : [
  "a cool dog that eats ice cream",
  "a dog with sunglasses eating icecream",
  "a snail eating leaves",
  "a tiny adorable snail carrying a fresh green leaf in its mouth",
  "a kopi cup that hops around looking for a stool",
  "a sleepy panda wearing a raincoat",
];
const HATS = [null, "party", "crown", "chef", "bucket", "songkok", "caping"];
const WAIT_MS = 8 * 60 * 1000;

const port = await new Promise((ok) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });
const world = fs.mkdtempSync(path.join(os.tmpdir(), "commons-try-"));
const base = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ["--env-file-if-exists=.env", "server/index.mjs"], {
  cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
  env: { CONCURRENCY: "6", ANIM_CONCURRENCY: "6", ...process.env, PORT: String(port), COMMONS_WORLD: world, PUBLIC_URL: base, CANONICAL_URL: "", ADMIN_PASSWORD: "", VOTE_URL: "" },
});
let errs = "";
srv.stderr.on("data", (d) => { errs += d; });
const quit = () => { try { srv.kill(); } catch {} };
process.on("exit", quit);
process.on("SIGINT", () => process.exit(130));

await new Promise((ok, no) => {
  const t = setTimeout(() => no(new Error("server did not start:\n" + errs)), 20000);
  srv.stdout.on("data", (d) => { if (process.env.TRY_DEBUG) process.stderr.write(d); if (String(d).includes("The Commons is up")) { clearTimeout(t); ok(); } });
  srv.on("exit", (c) => no(new Error(`server exited ${c}:\n${errs}`)));
});
console.log(`server on ${base}, world in ${world}\nsending ${WISHES.length} wishes at once…`);

const post = (p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
const t0 = Date.now();
const sent = await Promise.all(WISHES.map((text, i) => post("/api/wish", { text, name: `tester${i + 1}`, deviceId: `try-${Date.now()}-${i}`, hat: HATS[i % HATS.length] })));
const ids = sent.map((s) => s.id).filter(Boolean);
sent.forEach((s, i) => { if (!s.id) console.log(`  "${WISHES[i]}" was refused: ${s.error}`); });

const END = ["live", "declined", "failed"];
for (;;) {
  const { wishes } = await fetch(base + "/api/world").then((r) => r.json());
  const mine = wishes.filter((w) => ids.includes(w.id));
  process.stdout.write(`\r  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${mine.map((w) => `#${w.n} ${w.status}`).join("  ")}      `);
  if (mine.every((w) => END.includes(w.status))) break;
  if (Date.now() - t0 > WAIT_MS) { console.log("\n  gave up waiting"); break; }
  await new Promise((r) => setTimeout(r, 2000));
}
console.log("\n");
await new Promise((r) => setTimeout(r, 500)); // let the run log flush

const runs = fs.existsSync(path.join(world, "runs.jsonl")) ? fs.readFileSync(path.join(world, "runs.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
const s = (ms) => (ms == null ? "  -" : String(Math.round(ms / 1000)).padStart(3));
console.log("  #  status    total screen  draw  code  wish");
for (const r of runs) console.log(`${String(r.n).padStart(3)}  ${r.status.padEnd(8)} ${s(r.totalMs)}s  ${s(r.screen?.ms)}s  ${s(r.sheet?.ms)}s  ${s(r.build?.ms)}s  ${r.text}${r.hat ? ` [${r.hat}]` : ""}${r.sheet?.attempts > 1 ? ` (${r.sheet.attempts} drawing tries: ${r.sheet.errors.join("; ")})` : ""}${r.sheet && !r.sheet.ok ? ` DRAW FAILED: ${r.sheet.error}` : ""}`);
const live = runs.filter((r) => r.status === "live");
if (live.length) console.log(`\n  live ${live.length}/${runs.length}, average ${Math.round(live.reduce((a, r) => a + r.totalMs, 0) / live.length / 1000)}s, slowest ${Math.round(Math.max(...live.map((r) => r.totalMs)) / 1000)}s`);

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rows = runs.map((r) => {
  const f = path.join(world, "things", r.id, "frames.png");
  return `<section><h3>#${r.n} ${esc(r.text)}${r.hat ? ` <small>[${esc(r.hat)} hat]</small>` : ""}</h3>
<p>${esc(r.status)} · total ${s(r.totalMs)}s · screen ${s(r.screen?.ms)}s · draw ${s(r.sheet?.ms)}s · code ${s(r.build?.ms)}s${r.screen?.spritePrompt ? `<br><i>${esc(r.screen.spritePrompt)}</i>` : ""}</p>
${fs.existsSync(f) ? `<img src="file://${f}">` : "<p>(no frames)</p>"}</section>`;
}).join("\n");
const report = path.join(world, "report.html");
fs.writeFileSync(report, `<!doctype html><meta charset="utf-8"><title>try-wishes</title><style>body{font:14px system-ui;margin:20px;background:#3b2a1f;color:#fbf3e2}img{max-width:100%;background:#7a4a2a}section{margin-bottom:24px}</style>
<p>${esc(new Date().toISOString())} · CODEX_TIER=${esc(process.env.CODEX_TIER || "default")} · ANIM_MODEL=${esc(process.env.ANIM_MODEL || "gpt-6-luna")} · EARLY_START=${esc(process.env.EARLY_START ?? "1")}</p>${rows}`);
console.log(`\n  report: ${report}\n  run log: ${path.join(world, "runs.jsonl")}`);
quit();
process.exit(0);
