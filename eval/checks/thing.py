"""Deterministic checks on a built thing.js: the authoritative JS simulator (tools/check-thing.mjs) plus static lints
that mirror the build prompt's requirements. Same file -> same result, every time."""
import json, re, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]


def sim(thing_dir):
    p = subprocess.run(["node", str(ROOT / "tools" / "check-thing.mjs"), str(thing_dir)], capture_output=True, text=True, timeout=120)
    try:
        return json.loads(p.stdout.strip().splitlines()[-1])
    except Exception:
        return {"ok": False, "errors": ["checker printed nothing: " + p.stderr[-120:]]}


def check(w, stage, thing_dir):
    out = {"build_finished": (bool(stage.get("ok")), stage.get("error", "") or stage.get("crashed", ""))}
    f = pathlib.Path(thing_dir) / "thing.js"
    if not f.exists():
        out["thing_written"] = (False, "thing.js missing")
        return out
    src = f.read_text()
    s = sim(thing_dir)
    out["sim_passes"] = (s.get("ok", False), "; ".join(s.get("errors", []))[:160])
    out["sim_no_warnings"] = (not s.get("warnings"), "; ".join(s.get("warnings", []))[:160])
    out["first_try"] = (stage.get("checkFails", 0) == 0, f"{stage.get('checkFails', 0)} failed checks, {stage.get('turns', 0)} turns")
    says = re.findall(r"""\.say\(\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)""", src)
    lines = [next(x for x in t if x is not None) for t in says]
    out["says_something"] = (bool(lines), "no me.say() with a literal")
    out["say_max_6_words"] = (all(len(l.split()) <= 6 for l in lines), "; ".join(l for l in lines if len(l.split()) > 6)[:100])
    out["has_onPoke"] = (bool(re.search(r"\bonPoke\b", src)), "")
    out["moves_in_depth"] = (bool(re.search(r"\bsteer\s*\(", src)), "no world.steer")
    out["uses_a_spot"] = (bool(re.search(r"\bgoTo\s*\(", src)), "no world.goTo")
    out["reacts_to_neighbours"] = (bool(re.search(r"\b(onMeet|onSignal)\b", src)), "no onMeet/onSignal")
    thing = s.get("thing") or {}
    if w.get("zone") and thing:
        out["zone_matches_wish"] = (thing.get("zone") == w["zone"], f"zone={thing.get('zone')} expected={w['zone']}")
    hay = (src + " " + str(thing.get("name", ""))).lower()
    miss = [g[0] for g in w["kw"] if not any(k in hay for k in g)]
    out["mentions_wish_nouns"] = (not miss, f"missing {miss}" if miss else "")
    return out
