// Anthropic API backend for screening and building: used when SCREEN_CODEX_MODEL / CODEX_MODEL is a claude-* id.
// Every call is priced from its usage and appended to a ledger; CLAUDE_BUDGET_USD (if set) is a hard stop on the ledger's total.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { Agent, fetch as undiciFetch } from "undici";
import { WORLD } from "./store.mjs";
import { claudeBudget } from "./flags.mjs";

export const isClaude = (model) => /^claude-/.test(model || "");

// $ per million tokens (prompts up to 100K): input, output. Cache reads are 0.1x input, 5-minute cache writes 1.25x.
const PRICE = { "claude-haiku-5-5": [0.1, 0.5], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };
export const LEDGER = process.env.CLAUDE_LEDGER || path.join(WORLD, "claude-spend.jsonl");
const ENV_BUDGET = Number(process.env.CLAUDE_BUDGET_USD) || 0;

// Node's built-in fetch ran our concurrent Messages calls strictly one after another (6 at once took 6x as long).
// A plain HTTP/1.1 undici agent keeps them parallel.
const agent = new Agent({ allowH2: false, connections: 32 });
let client;
export const getClient = () => (client ||= new Anthropic({ maxRetries: 2, fetch: (url, init) => undiciFetch(url, { ...init, dispatcher: agent }) }));

let spent = null;
const total = () => (spent ??= (() => { try { return fs.readFileSync(LEDGER, "utf8").trim().split("\n").reduce((s, l) => s + (JSON.parse(l).usd || 0), 0); } catch { return 0; } })());
export const spentUsd = () => total();

export function cost(model, u) {
  const [i, o] = PRICE[model] || PRICE["claude-opus-5-5"];
  return ((u.input_tokens || 0) * i + (u.cache_read_input_tokens || 0) * i * 0.1 + (u.cache_creation_input_tokens || 0) * i * 1.25 + (u.output_tokens || 0) * o) / 1e6;
}

/** Thinking off by default (fast, cheap). CLAUDE_EFFORT/CODEX_EFFORT = low|medium|high turns adaptive thinking on at that effort. */
export function thinkingFor(model, effort) {
  if (effort && effort !== "none") return { thinking: { type: "adaptive" }, output_config: { effort } };
  return { thinking: model.includes("sonnet") ? { type: "between_tools" } : { type: "disabled" }, output_config: { effort: "low" } };
}

/** One priced Messages call. Throws when the budget is spent. Returns { text, usage, usd, stop }. */
export async function ask({ model, system, messages, maxTokens = 4000, effort, format, signal, label = "" }) {
  const budget = claudeBudget(ENV_BUDGET);
  if (budget && total() >= budget) throw new Error(`claude budget cap reached ($${total().toFixed(2)} of $${budget})`);
  const t = thinkingFor(model, effort);
  const r = await getClient().messages.create({
    model, max_tokens: maxTokens, system, messages,
    thinking: t.thinking, output_config: { ...t.output_config, ...(format ? { format } : {}) },
  }, { signal });
  const usd = cost(model, r.usage);
  spent = total() + usd;
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), model, label, in: r.usage.input_tokens, out: r.usage.output_tokens, cacheR: r.usage.cache_read_input_tokens || 0, cacheW: r.usage.cache_creation_input_tokens || 0, usd }) + "\n");
  if (r.stop_reason === "refusal") throw new Error("claude refused");
  return { text: r.content.filter((b) => b.type === "text").map((b) => b.text).join(""), usage: r.usage, usd, stop: r.stop_reason };
}
