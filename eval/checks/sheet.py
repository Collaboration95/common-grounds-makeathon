"""Deterministic checks on a sliced sprite sheet (frames.png + anim.json). Pixel maths only; whether it is the RIGHT animal
is not decidable here, so the report puts the strips side by side for a human eye."""
import json, pathlib
import numpy as np
from PIL import Image


def frames(d):
    meta = json.loads((pathlib.Path(d) / "anim.json").read_text())
    img = np.asarray(Image.open(pathlib.Path(d) / "frames.png").convert("RGBA"))
    fw = meta["frameW"]
    return meta, [img[:, i * fw:(i + 1) * fw] for i in range(meta["count"])]


def hist(f):
    m = f[..., 3] > 40
    q = (f[..., :3][m] >> 5).astype(int)  # 3 bits per channel
    h = np.bincount(q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2], minlength=512).astype(float)
    return h / max(h.sum(), 1)


def check(w, stage, thing_dir):
    out = {"sheet_made": (bool(stage.get("ok")), stage.get("error", "") or stage.get("crashed", ""))}
    if not stage.get("ok"):
        return out
    out["first_attempt"] = (stage.get("attempts", 1) == 1, f"{stage.get('attempts')} attempts: {stage.get('errors')}")
    out["real_transparency"] = (not stage.get("flat"), "model painted a background; slicer had to key it")
    meta, fr = frames(thing_dir)
    out["twelve_frames"] = (meta["count"] == 12 and meta["anims"]["walk"] == [0, 1, 2, 3], f"count={meta['count']}")
    cov = [float((f[..., 3] > 40).mean()) for f in fr]
    out["coverage_sane"] = (all(0.03 <= c <= 0.85 for c in cov), "min %.2f max %.2f" % (min(cov), max(cov)))
    corners = [all(f[y, x, 3] < 40 for y, x in ((0, 0), (0, -1), (-1, 0), (-1, -1))) for f in fr]
    out["not_boxed"] = (all(corners), f"{corners.count(False)} frames have an opaque corner")
    box = []
    for f in fr:
        ys, xs = np.where(f[..., 3] > 40)
        box.append((xs.min(), xs.max(), ys.min(), ys.max()) if len(xs) else (0, 0, 0, 0))
    H, Wd = fr[0].shape[:2]
    out["not_clipped"] = (all(b[0] > 0 and b[1] < Wd - 1 and b[2] > 0 for b in box), "content touches the frame edge")
    hs = [hist(f) for f in fr]
    inter = [float(np.minimum(hs[8], h).sum()) for h in hs]  # every frame vs the idle frame
    out["same_character"] = (min(inter) >= 0.45, "palette overlap with idle: min %.2f" % min(inter))
    hh = [b[3] - b[2] for b in box[:4]]
    out["walk_height_steady"] = (max(hh) <= 1.35 * max(min(hh), 1), f"walk frame heights {hh}")
    d = [float(np.abs(fr[i].astype(int) - fr[i + 1].astype(int)).mean()) for i in range(3)]
    out["walk_actually_moves"] = (min(d) > 1.0, "frame-to-frame diff %s" % [round(x, 1) for x in d])
    out["frames_distinct"] = (len({f.tobytes() for f in fr}) == 12, "")
    return out
