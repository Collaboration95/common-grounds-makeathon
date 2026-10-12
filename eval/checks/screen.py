"""Deterministic checks on one screen() result. No model involved: same input -> same verdict."""
import re

STYLE = re.compile(r"\b(pixel|watercolou?r|cartoon|anime|oil paint\w*|3d|realistic|photo\w*|vector|style|cel[- ]shad\w*)\b", re.I)
STOP = set("that with from this have into onto around about makes their which would could there where while when each very some just like then them they what your".split())


def words(s):
    return re.findall(r"[a-z']+", s.lower())


def check(w, r):
    """w = dataset row, r = screen result. Returns {check_name: (passed, detail)}."""
    out = {}
    allowed = r.get("allowed")
    out["real_llm"] = (not r.get("fallback"), "fell back to the keyword list" if r.get("fallback") else "")
    out["verdict"] = (allowed == w["allow"], f"allowed={allowed} expected={w['allow']}")
    sp, summ = r.get("spritePrompt") or "", r.get("thingSummary") or ""
    if w["allow"] and allowed:
        low = sp.lower()
        miss = [g[0] for g in w["kw"] if not any(k in low for k in g)]
        out["sprite_keeps_nouns"] = (not miss, f"missing {miss}" if miss else "")
        out["sprite_no_style_words"] = (not STYLE.search(sp), (STYLE.search(sp) or [""])[0] if STYLE.search(sp) else "")
        out["sprite_facing_right"] = ("right" in low, "")
        out["sprite_length"] = (15 <= len(sp) <= 450, f"{len(sp)} chars")
        out["summary_present"] = (0 < len(summ) <= 240, f"{len(summ)} chars")
        label = (r.get("bleed") or {}).get("label")
        out["bleed"] = (w["bleed"] is None or bool(label) == w["bleed"] and (not label or len(label.split()) <= 3), f"label={label!r} expected_bleed={w['bleed']}")
    elif not w["allow"] and not allowed:
        msg = r.get("userMessage") or ""
        out["decline_msg_short"] = (0 < len(msg.split()) <= 20, f"{len(msg.split())} words")
        echo = [x for x in set(words(w["text"])) if len(x) >= 5 and x not in STOP and x in words(msg)]
        out["decline_msg_no_echo"] = (not echo, f"repeats {echo}" if echo else "")
        out["decline_clears_fields"] = (not sp and not summ, "")
    return out
