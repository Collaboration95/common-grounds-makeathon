# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""Local prompt-adherence harness. Never talks to the live server.
  uv run eval/run.py run  <screen|build|sheet> <cfg> [<cfg>...] [--only e01,e02] [--conc N] [--cat plain,decline-brand]
  uv run eval/run.py score <stage> <cfg>...      re-score saved outputs (no model calls)
  uv run eval/run.py report <stage> <cfg>...     compare configs; writes results/report-<stage>.html
Each stage's deterministic checks live in eval/checks/. Results land in eval/results/<cfg>/ (git-ignored)."""
import sys, os, json, subprocess, pathlib, importlib, collections, html

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
CFG = json.loads((HERE / "configs.json").read_text())
WISHES = [json.loads(l) for l in (HERE / "wishes.jsonl").read_text().splitlines()]
BY_ID = {w["id"]: w for w in WISHES}
if "ANTHROPIC_API_KEY" not in os.environ:  # the repo's .env holds it; only that one key is taken
    for l in (HERE.parent / ".env").read_text().splitlines() if (HERE.parent / ".env").exists() else []:
        if l.startswith("ANTHROPIC_API_KEY="): os.environ["ANTHROPIC_API_KEY"] = l.split("=", 1)[1].strip().strip("\"'")


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def positional():
    skip, out = False, []
    for a in sys.argv[2:]:
        if skip: skip = False; continue
        if a.startswith("--"): skip = True; continue
        out.append(a)
    return out[0], out[1:]


def selected():
    only, cats = arg("--only"), arg("--cat")
    return [w for w in WISHES if (not only or w["id"] in only.split(",")) and (not cats or w["cat"] in cats.split(","))]


def run_stage(stage, cfg):
    out = HERE / "results" / cfg
    sel = HERE / "results" / f".sel-{cfg}.jsonl"
    sel.write_text("\n".join(json.dumps(w, ensure_ascii=False) for w in selected()))
    env = {**os.environ, **CFG[cfg]["env"], "COMMONS_WORLD": str(out / "world"),
           "CLAUDE_LEDGER": str(HERE / "results" / "claude-spend.jsonl"), "CLAUDE_BUDGET_USD": os.environ.get("CLAUDE_BUDGET_USD", "8")}  # hard stop on the shared Anthropic test ledger
    subprocess.run(["node", str(HERE / "stage.mjs"), stage, str(sel), str(out), "--conc", arg("--conc", "4")], env=env, check=False)
    sel.unlink(missing_ok=True)


def score(stage, cfg):
    out, rows = HERE / "results" / cfg, []
    mod = importlib.import_module("checks." + {"build": "thing"}.get(stage, stage))
    ids = {w["id"] for w in selected()}  # only what this invocation asked for: older files in the folder are not re-scored
    for f in sorted((out / stage).glob("*.json")):
        if f.stem not in ids: continue
        w, r = BY_ID[f.stem], json.loads(f.read_text())
        if stage == "screen":
            checks = mod.check(w, r)
        else:
            checks = mod.check(w, r, out / "things" / w["id"])
        rows.append({"id": w["id"], "text": w["text"], "cat": w["cat"], "ms": r.get("ms"), "checks": {k: [bool(v[0]), str(v[1])] for k, v in checks.items()}})
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{stage}.score.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    return rows


def load(stage, cfg):
    p = HERE / "results" / cfg / f"{stage}.score.json"
    return json.loads(p.read_text()) if p.exists() else []


def report(stage, cfgs):
    data = {c: load(stage, c) for c in cfgs}
    names = sorted({k for rows in data.values() for r in rows for k in r["checks"]})
    print(f"\n{stage}: pass rate per check (passed/ran)")
    print(f"{'check':26}" + "".join(f"{c:>14}" for c in cfgs))
    for n in names:
        line = f"{n:26}"
        for c in cfgs:
            ran = [r["checks"][n][0] for r in data[c] if n in r["checks"]]
            line += f"{sum(ran)}/{len(ran)}".rjust(14)
        print(line)
    print(f"{'ALL CHECKS PASSED (items)':26}" + "".join(f"{sum(all(v[0] for v in r['checks'].values()) for r in data[c])}/{len(data[c])}".rjust(14) for c in cfgs))
    ms = lambda c: sorted(r["ms"] for r in data[c] if r["ms"])
    print(f"{'median ms':26}" + "".join(f"{(ms(c)[len(ms(c)) // 2] if ms(c) else 0):>14}" for c in cfgs))
    print(f"{'p90 ms':26}" + "".join(f"{(ms(c)[int(len(ms(c)) * .9) - 1] if ms(c) else 0):>14}" for c in cfgs))
    print("\nfailures:")
    for c in cfgs:
        for r in data[c]:
            bad = {k: v[1] for k, v in r["checks"].items() if not v[0]}
            if bad: print(f"  [{c}] {r['id']} {r['text'][:46]!r}: " + "; ".join(f"{k} ({d})" if d else k for k, d in bad.items()))
    if stage == "sheet":
        rows = []
        for w in WISHES:
            cells = "".join(f"<td><b>{c}</b><br>" + (f'<img src="../results/{c}/things/{w["id"]}/frames.png">' if (HERE / "results" / c / "things" / w["id"] / "frames.png").exists() else "no frames") + "</td>" for c in cfgs)
            if any((HERE / "results" / c / "things" / w["id"] / "frames.png").exists() for c in cfgs):
                rows.append(f"<tr><th>{html.escape(w['id'])} {html.escape(w['text'])}</th>{cells}</tr>")
        (HERE / "results" / f"report-{stage}.html").write_text("<style>body{background:#3b2a1f;color:#fbf3e2;font:13px system-ui}img{max-width:560px;background:#7a4a2a}td,th{vertical-align:top;padding:6px;text-align:left}</style><table>" + "".join(rows) + "</table>")
        print(f"\nside by side: {HERE / 'results' / ('report-' + stage + '.html')}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    stage, cfgs = positional()
    for c in cfgs:
        if cmd == "run": run_stage(stage, c)
        if cmd in ("run", "score"): score(stage, c)
    report(stage, cfgs)
