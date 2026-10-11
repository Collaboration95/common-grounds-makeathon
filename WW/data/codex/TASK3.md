# Task: repaint Where's Waldo worlds with the guest IN DISGUISE (built-in image_gen)

Use the **imagegen skill in its default built-in `image_gen` tool mode** (no CLI, no API key). Highest quality, landscape 3:2 (1536x1024). Do not edit any code. You may overwrite the files named below; that is intended.

The last version made the guest far too easy to spot (big, foreground, unmistakable colours). This time the guest must be HARD to find, like a real Where's Waldo page:
- The guest wears the world's own costume (the disguise below), so their outfit matches the people around them.
- They are the same size as nearby people, in the MIDDLE DISTANCE, not the foreground, not in the centre, not in a spotlight, partly overlapped by people or objects.
- Only a small tell gives them away: their face/skin and silhouette remain recognisable if you look closely.
- Make the scene busy with many similar-looking people around them (decoys in the same costume).
- Exactly one guest. The famous characters of the moment are still present and recognisable.

For each assigned world:
1. `<world>-scene.png`: use the text of `WW/data/codex/<world>.prompt.txt` as the base prompt plus the rules above and the disguise.
2. `<world>-noguest.png`: an EDIT of image 1 (use view_image to load it): remove only the guest, fill naturally, change nothing else, same framing.
3. `<world>-guest.png`: the guest alone exactly as drawn in image 1 (same disguise, pose and style) on a transparent background. If refused, skip it and note it.

Record seconds per world with `date +%s`. Finish with one line per world: `world | seconds | files | problems`, also written to `WW/data/codex/report3-<worlds joined by +>.md`.

## Worlds and disguises
- `great-hall`: Shrek in black Hogwarts school robes with a yellow-and-black Hufflepuff scarf, seated halfway down the yellow table among many robed students, partly behind a student and a goblet.
- `shire-party`: Gollum wearing a hobbit's green waistcoat and a little flower crown, half-hidden among a row of seated hobbits at the far feast table.
- `cantina`: Paddington Bear with his hood up in a brown hooded desert robe (no red hat), sitting in the back booth between cloaked aliens, sipping from a mug.
- `hawker-centre`: Kermit the Frog wearing a stall-worker's white cap and apron, behind the counter of one of the back-row stalls next to the cooks.
