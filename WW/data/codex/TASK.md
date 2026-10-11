# Task: paint game backgrounds with the built-in image_gen tool

You are helping compare Codex's built-in image generation against our API pipeline for a Where's Waldo style pixel-art game.

Use the **imagegen skill in its default built-in `image_gen` tool mode** (not the CLI fallback, no API key). For each scene assigned to you below:

1. Read the prompt file `WW/data/codex/<scene>.prompt.txt` and use its text exactly as the image prompt.
2. Ask for the **highest quality and largest landscape size the tool allows** (aim for 3:2 landscape, e.g. 1536x1024 or larger).
3. Copy the final image into `WW/data/codex/<scene>-codex.png` (do not overwrite other files).
4. Record the wall-clock seconds from starting the generation to having the file: run `date +%s` before and after.

Do not edit any code. Do not generate anything beyond your assigned scenes (one image per scene; if the tool refuses, note it and move on).

Finish with a short report, one line per scene: `scene | seconds | saved path | any refusal or problem`. Also write that report to `WW/data/codex/report-<your scenes joined by +>.md`.
