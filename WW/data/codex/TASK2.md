# Task: paint one Where's Waldo style game world with the built-in image_gen tool

Use the **imagegen skill in its default built-in `image_gen` tool mode** (no CLI, no API key). Highest quality, landscape (3:2 if possible, e.g. 1536x1024). Do not edit any code.

For each world assigned to you (details below), make exactly these three images and copy them into `WW/data/codex/`:

1. `<world>-scene.png` — Use the text of `WW/data/codex/<world>.prompt.txt` as the base prompt, and add: the famous characters who belong in this moment are present and recognisable, acting naturally, AND the guest (given below) is hidden in the scene, acting naturally as part of it (sitting, peeking, queueing, eating), at the same size and style as everyone else, partly tucked among people or objects but with their face and silhouette visible. Exactly one of the guest.
2. `<world>-noguest.png` — An EDIT of image 1 (load it with view_image first if needed): remove only the guest and fill the space naturally with what would be behind them. Change nothing else at all; same framing, same size.
3. `<world>-guest.png` — The guest alone, exactly as they look in image 1 (same pose, clothes, pixel-art style), on a fully transparent background.

Record wall-clock seconds for the whole world with `date +%s` before and after.

Finish with a report line per world: `world | seconds | files saved | any refusal or problem`, and write it to `WW/data/codex/report2-<worlds joined by +>.md`.

## Worlds
- `shire-party` — guest: Gollum, crouched under the end of a feast table, eyeing a gold ring on a plate.
- `cantina` — guest: Paddington Bear in his blue duffle coat and red hat, on a bar stool asking for a marmalade sandwich.
- `great-hall` — guest: Shrek, squeezed onto the bench at the yellow (Hufflepuff) table, eating.
- `hawker-centre` — guest: Kermit the Frog, saving a table by placing a tissue packet on it.
