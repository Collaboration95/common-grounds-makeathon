// Claude builder: one Messages call that returns thing.js, the server's own checker, and one repair call on failure.
// Same contract as buildThing in codex.mjs (no shell, no agent loop: the checker runs here).
import fs from "node:fs";
import path from "node:path";
import { ROOT, thingDir } from "./store.mjs";
import { CONTRACT, SAMPLES, INTRO, RULES, wishLines } from "./buildprompt.mjs";
import { ask } from "./claude.mjs";

const TIMEOUT_MS = Number(process.env.CODEX_TIMEOUT_MS) || 4 * 60 * 1000;

const SYSTEM = [{ type: "text", cache_control: { type: "ephemeral" }, text: `${INTRO}

${CONTRACT}

${SAMPLES}

Your job: write the complete thing.js for the wish. It is run through an automated checker (the contract above is exactly what it enforces), so follow the contract literally.
${RULES}
- Be quick. No explanation.
Reply in exactly this shape and nothing else: one line \`META {"name":..., "tags":[...], "zone":"ground"|"air", "size":1|2, "oneLine":...}\` (oneLine: a charming sentence under 80 chars about what it does), then the whole file in one \`\`\`js fenced block.` }];

const followUp = (errors) => `The authoritative checker rejects thing.js:\n${errors.map((e) => "- " + e).join("\n")}\nReply again in the same shape (META line, then the complete corrected file in one \`\`\`js block).`;

function parse(text) {
  const code = /```(?:js|javascript)?\n([\s\S]*?)```/.exec(text)?.[1];
  let meta = null;
  try { meta = JSON.parse(/META\s*(\{.*\})/.exec(text)?.[1]); } catch { /* the checker still decides */ }
  return { code, meta };
}

export async function buildThingClaude({ id, text, brief, signal, log, onTesting, check, model, effort }) {
  const dir = thingDir(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "wish.json"), JSON.stringify({ text }, null, 1));
  fs.copyFileSync(path.join(ROOT, "tools", "check-thing.mjs"), path.join(dir, "check-thing.mjs"));
  fs.rmSync(path.join(dir, "thing.js"), { force: true });

  const res = { ok: false, turns: 0, checkRuns: 0, checkFails: 0, usd: 0, tokens: { in: 0, out: 0 } };
  const sig = AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]);
  const messages = [{ role: "user", content: wishLines(text, brief) }];
  let meta = null, errors = [];
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) { log("asking Claude to fix it (one more turn)"); messages.push({ role: "user", content: followUp(errors) }); }
      res.turns++;
      const r = await ask({ model, system: SYSTEM, messages, maxTokens: 8000, effort, signal: sig, label: `build ${id}` });
      res.usd += r.usd; res.tokens.in += r.usage.input_tokens + (r.usage.cache_read_input_tokens || 0); res.tokens.out += r.usage.output_tokens;
      messages.push({ role: "assistant", content: r.text });
      const p = parse(r.text);
      meta = p.meta || meta;
      if (!p.code) { errors = ["thing.js missing: reply with the META line and the whole file in one ```js block"]; res.checkFails++; res.checkRuns++; log("no code in the reply"); continue; }
      fs.writeFileSync(path.join(dir, "thing.js"), p.code);
      log(`wrote thing.js (${p.code.split("\n").length} lines)`);
      onTesting();
      const chk = await check(dir);
      res.checkRuns++;
      if (chk.ok) {
        log("check → passed");
        const oneLine = typeof meta?.oneLine === "string" ? meta.oneLine.slice(0, 120) : "";
        return { ...res, ok: true, thing: { ...chk.thing, oneLine } };
      }
      res.checkFails++;
      errors = chk.errors || ["checker failed"];
      log(`check → ${errors.length} errors: ${String(errors[0]).slice(0, 70)}`);
    }
    return { ...res, error: "check failed: " + errors.join("; ") };
  } catch (e) {
    const timedOut = sig.aborted && !signal?.aborted;
    return { ...res, error: timedOut ? "timed out" : String(e?.message || e).slice(0, 300) };
  }
}
