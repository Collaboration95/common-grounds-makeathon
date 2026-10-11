great-hall | 432 | great-hall-scene.png, great-hall-noguest.png | guest cutout skipped: safety refusal; noguest has global pixel drift; initial removal refusal recovered on retry

Built-in image_gen mode, highest quality requested; both saved PNGs verified at 1536x1024. No code edited.

Prompt set:
- Scene: great-hall.prompt.txt plus TASK3.md hiding rules and the great-hall disguise; retain recognizable Harry, Hermione, Ron, Dumbledore and McGonagall. Exactly one student-sized Shrek, seated halfway down the yellow table in black school robes and a yellow-and-black scarf. A refinement edit places the neighboring student in front of his lower face and torso.
- Removal edit: use the final scene; remove only Shrek and fill the exposed area naturally; preserve all other characters, objects, framing and pixels. This request succeeded on the second attempt, but comparison confirmed changes outside the guest area, so the strict change-nothing-else requirement was not achieved.
- Transparent cutout: use the final scene; extract only source-visible Shrek pixels with the same costume, pose, scale and style on a transparent 1536x1024 canvas. The image tool refused this request; skipped as directed by TASK3.md.
