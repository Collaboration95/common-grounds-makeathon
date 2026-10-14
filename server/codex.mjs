// Codex SDK worker: builds one thing.js in commons-world/things/<id>/, streams log lines,
// re-checks with the repo's checker, and gives Codex one follow-up turn if the check fails.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Codex } from "@openai/codex-sdk";
import { ROOT, thingDir, checkThing } from "./store.mjs";
import { CONTRACT, SAMPLES, INTRO, RULES, wishLines } from "./buildprompt.mjs";
import { isClaude } from "./claude.mjs";
import { setting, tier } from "./flags.mjs";
import { buildThingClaude } from "./claude-build.mjs";

const ENV = { model: process.env.CODEX_MODEL || "gpt-6-luna", effort: process.env.CODEX_EFFORT || "medium" };
const ENV_TIER = process.env.CODEX_TIER || ""; // "fast" = priority processing on the ChatGPT plan
const TIMEOUT_MS = Number(process.env.CODEX_TIMEOUT_MS) || 4 * 60 * 1000;

const expand = (p) => (p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p);
const binPath = expand(process.env.CODEX_BIN || "~/.local/bin/codex");

// Codex uses the ChatGPT login. Keep our API keys out of its environment.
const env = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => v !== undefined && !/^(OPENAI_API_KEY|CODEX_API_KEY|ANTHROPIC_API_KEY)$/.test(k)));
const codexByTier = new Map();
const getCodex = (t) => { if (!codexByTier.has(t)) codexByTier.set(t, new Codex({ ...(fs.existsSync(binPath) ? { codexPathOverride: binPath } : {}), env, ...(t ? { config: { service_tier: t } } : {}) })); return codexByTier.get(t); };

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    zone: { type: "string", enum: ["ground", "air"] },
    size: { type: "integer", enum: [1, 2] },
    oneLine: { type: "string" },
  },
  required: ["name", "tags", "zone", "size", "oneLine"],
  additionalProperties: false,
};

const prompt = (text, brief) => `${INTRO}
${wishLines(text, brief)}

${CONTRACT}

${SAMPLES}

Your job:
- Write ONLY thing.js in the current directory (the only file you create). Do not read other files.
- Run \`node check-thing.mjs .\` and fix thing.js until it prints {"ok":true,...}. If it prints "warnings", fix those too (one quick pass), but ok:true is what matters.
${RULES}
- Be quick. Do not explain. When it passes, reply with the JSON {name, tags, zone, size, oneLine} (oneLine: a charming sentence under 80 chars about what it does).`;

const followUp = (errors) => errors.some((e) => /thing\.js missing/.test(e))
  ? `thing.js does not exist yet. Create it NOW in the current directory (write the whole file, nothing else), run \`node check-thing.mjs .\` until it prints {"ok":true,...}, then reply with the JSON {name, tags, zone, size, oneLine}.`
  : `The authoritative checker still rejects thing.js:\n${errors.map((e) => "- " + e).join("\n")}\nFix thing.js, re-run \`node check-thing.mjs .\` until it prints {"ok":true,...}, then reply with the JSON {name, tags, zone, size, oneLine} again.`;

const isCheck = (cmd) => /check-thing/.test(cmd || "");

function parseCheck(item) {
  const line = String(item.aggregated_output || "").split("\n").reverse().find((l) => l.trim().startsWith('{"ok"'));
  try { return JSON.parse(line); } catch { return { ok: item.exit_code === 0, errors: [] }; }
}

/**
 * @param {{id:string,text:string,brief?:string,signal?:AbortSignal,log:(s:string)=>void,onTesting:()=>void}} o
 * @returns {Promise<{ok:boolean, thing?:object, turns:number, checkRuns:number, checkFails:number, error?:string}>}
 */
export async function buildThing({ id, text, brief, signal, log, onTesting, check = checkThing }) {
  const { model, effort } = setting("build", ENV); // read per build: models.json can change while the server runs
  if (isClaude(model)) return { model, effort, ...(await buildThingClaude({ id, text, brief, signal, log, onTesting, check, model, effort })) };
  const dir = thingDir(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "wish.json"), JSON.stringify({ text }, null, 1));
  fs.copyFileSync(path.join(ROOT, "tools", "check-thing.mjs"), path.join(dir, "check-thing.mjs"));
  fs.rmSync(path.join(dir, "thing.js"), { force: true });

  const res = { ok: false, turns: 0, checkRuns: 0, checkFails: 0, model, effort };
  const sig = AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]);
  const thread = getCodex(tier(ENV_TIER)).startThread({
    workingDirectory: dir, sandboxMode: "workspace-write", approvalPolicy: "never",
    networkAccessEnabled: false, webSearchEnabled: false, skipGitRepoCheck: true,
    model, modelReasoningEffort: effort,
  });

  let testing = false, lastSig = "";
  const noteWrite = () => { // file_change events, or a shell heredoc: either way, report a changed thing.js once
    try {
      const st = fs.statSync(path.join(dir, "thing.js"));
      const s = `${st.size}:${st.mtimeMs}`;
      if (s === lastSig) return;
      lastSig = s;
      log(`wrote thing.js (${fs.readFileSync(path.join(dir, "thing.js"), "utf8").split("\n").length - 1} lines)`);
    } catch { /* not written yet */ }
  };

  async function turn(input) {
    res.turns++;
    let final = null, started = false;
    const { events } = await thread.runStreamed(input, { outputSchema: SCHEMA, signal: sig });
    for await (const ev of events) {
      const it = ev.item;
      if (ev.type === "turn.started") started = true;
      else if (ev.type === "item.started" && it.type === "command_execution" && isCheck(it.command)) {
        if (!testing) { testing = true; onTesting(); }
      } else if (ev.type === "item.completed") {
        if (it.type === "file_change" || it.type === "command_execution") noteWrite(); // before any check result
        if (it.type === "command_execution" && isCheck(it.command)) {
          const r = parseCheck(it);
          res.checkRuns++;
          if (!r.ok) res.checkFails++;
          log(r.ok ? "check → passed" : `check → ${r.errors?.length || "some"} errors${r.errors?.[0] ? ": " + r.errors[0].slice(0, 70) : ""}`);
        } else if (it.type === "agent_message") final = it.text;
        else if (it.type === "reasoning" && it.text) log("thinking: " + it.text.replace(/\s+/g, " ").slice(0, 80));
        else if (it.type === "error" && started && !/agent|role|hook|config|deprecat/i.test(it.message || "")) log("codex: " + String(it.message).slice(0, 100));
      } else if (ev.type === "turn.completed") break; // don't wait for the stream to close (7-12s)
      else if (ev.type === "turn.failed") throw new Error(ev.error?.message || "turn failed");
      else if (ev.type === "error") throw new Error(ev.message || "stream error");
    }
    try { return JSON.parse(final); } catch { return null; }
  }

  async function serverCheck() {
    const r = await check(dir);
    res.checkRuns++;
    if (!r.ok) res.checkFails++;
    log(r.ok ? "server re-check → passed" : `server re-check → ${r.errors.length} errors: ${String(r.errors[0]).slice(0, 70)}`);
    return r;
  }

  try {
    let said = await turn(prompt(text, brief));
    let chk = await serverCheck();
    if (!chk.ok) {
      log("asking Codex to fix it (one more turn)");
      said = await turn(followUp(chk.errors));
      chk = await serverCheck();
    }
    if (!chk.ok) return { ...res, error: "check failed: " + chk.errors.join("; ") };
    const oneLine = typeof said?.oneLine === "string" ? said.oneLine.slice(0, 120) : "";
    return { ...res, ok: true, thing: { ...chk.thing, oneLine } };
  } catch (e) {
    const timedOut = sig.aborted && !signal?.aborted;
    return { ...res, error: timedOut ? "timed out" : String(e?.message || e).slice(0, 300) };
  }
}
