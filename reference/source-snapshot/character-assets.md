# Hawker-centre character walk cycles

Created for the warm illustrated sprite/VHS direction in `design-idea-1.md`, using the built-in `image_gen` tool. The exact generation prompts are in `generation-prompts.json`.

- `kopi-uncle-walk.png`: short, stocky older coffee-stall worker with glasses, cream shirt, rust waist apron and teal shorts.
- `food-stall-auntie-walk.png`: taller, leaner older food-stall worker with a sage hijab, coral tunic and indigo bib apron.

Both PNGs have real transparent backgrounds. Each sheet is **1536 × 1024**, arranged as **4 columns × 2 rows**, with **384 × 512** cells and eight right-facing walk poses. Read left to right across the top row, then the bottom row. Loop at about **8 fps** for the stepped motion described in the design. Mirror horizontally for left-facing movement.

For zero-based frame index `i`, crop at `x = (i % 4) * 384`, `y = Math.floor(i / 4) * 512`, width `384`, height `512`.

Open `preview.html` for both animated cycles, play/pause, speed, direction, background and frame controls. It works as a standalone local file and respects reduced-motion preferences by starting paused.

The generated sheets are preserved unchanged. They contain walking poses; the design's separate speaking, reaching and serving poses remain future assets.
