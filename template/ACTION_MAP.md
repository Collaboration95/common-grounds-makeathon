# Unified action map (sprite sheet v1)

Every animated character, whatever it is, uses the SAME sheet. No per-character behaviour code is needed:
`template/generic/thing.js` drives every action below through `me.anim`.

Sheet: **1536x1024 PNG, transparent background, 4 columns x 3 rows**, equal cells, same character in every cell, side view facing right, no grid lines, no text.

| Cell | Action | anim.json key | Used when |
|------|--------|---------------|-----------|
| 1-4  | walk cycle | `walk` [0-3] | wandering the floor |
| 5-8  | fly / hover cycle | `fly` [4-7] | hopping or airborne |
| 9    | idle | `idle` [8] | standing still |
| 10   | rest / sit | `sit` [9] | on a seat spot |
| 11   | sleep | `sleep` [10] | napping |
| 12   | special attack (burst) | `action` [11] | poked / meeting another thing |

`tools/slice-sheet.mjs` turns the sheet into `frames.png` (one horizontal strip of 12 frames) and:

```json
{ "frameW": 0, "frameH": 0, "count": 12, "facing": "right",
  "anims": { "walk": [0,1,2,3], "fly": [4,5,6,7], "idle": [8], "sit": [9], "sleep": [10], "action": [11] } }
```

The prompt is the exported `SHEET_SPEC` in `server/animate.mjs`; the model is `ANIM_MODEL` (default `gpt-6-luna`).
