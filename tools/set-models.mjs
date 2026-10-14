// Switch the models of a RUNNING server (no restart): writes commons-world/models.json, which the server re-reads on change.
//   node tools/set-models.mjs haiku | sonnet | luna | show        (luna = the Codex setup: needs the ChatGPT login)
//   node tools/set-models.mjs draw api | draw codex               (the sprite-sheet drawing, separate from screen + build)
//   node tools/set-models.mjs budget 60                          (hard stop on Claude spend in dollars, 0 = none)
//   COMMONS_WORLD=/path node tools/set-models.mjs ...             (another world folder)
import fs from "node:fs";
import path from "node:path";
import { FLAGS_FILE } from "../server/flags.mjs";

const claude = (model) => ({ screen: { model, effort: "none" }, build: { model, effort: "none" } });
const PRESETS = {
  haiku: claude("claude-haiku-5-5"),
  sonnet: claude("claude-sonnet-5-5"),
  luna: { screen: { model: "gpt-6-luna", effort: "low" }, build: { model: "gpt-6-luna", effort: "medium" } },
};

// drawing is set on its own: `draw api` = OpenAI image API (about 12 s a sheet, needs OPENAI_API_KEY), `draw codex` = Codex CLI on the ChatGPT login (about 45 s)
const DRAW = { api: { model: "gpt-image-2.5-flare", effort: "low" }, codex: { model: "gpt-6-luna", effort: "low" } };
const read = () => { try { return JSON.parse(fs.readFileSync(FLAGS_FILE, "utf8")); } catch { return {}; } };
const write = (o) => {
  const tmp = FLAGS_FILE + ".tmp"; // write then rename, so the server never reads half a file
  fs.mkdirSync(path.dirname(FLAGS_FILE), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(o, null, 2) + "\n");
  fs.renameSync(tmp, FLAGS_FILE);
};

const [cmd, arg] = process.argv.slice(2);
if (PRESETS[cmd]) { write({ ...read(), ...PRESETS[cmd] }); console.log(`switched screen + build to ${PRESETS[cmd].build.model}`); }
else if (cmd === "draw" && DRAW[arg]) { write({ ...read(), draw: DRAW[arg] }); console.log(`drawing now on ${DRAW[arg].model}`); }
else if (cmd === "budget") { write({ ...read(), claudeBudgetUsd: Number(arg) || 0 }); console.log(`claude budget: ${Number(arg) ? "$" + Number(arg) : "none"}`); }
else if (cmd !== "show") { console.error("usage: set-models.mjs haiku | sonnet | luna | draw api | draw codex | budget <usd> | show"); process.exit(2); }

console.log(`${FLAGS_FILE}:`, JSON.stringify(read(), null, 1));
try {
  const spent = fs.readFileSync(path.join(path.dirname(FLAGS_FILE), "claude-spend.jsonl"), "utf8").trim().split("\n").reduce((s, l) => s + (JSON.parse(l).usd || 0), 0);
  console.log(`claude spend so far: $${spent.toFixed(3)}`);
} catch { console.log("claude spend so far: $0"); }
