// One-off art: public/assets/background.png and the resident sprites.
// Usage: npm run assets            (draws whatever is missing)
//        npm run assets -- --force bg oyen kopi   (redraw the named ones)
import fs from "node:fs";
import path from "node:path";
import { generate, savePng, spritePrompt } from "../server/image.mjs";
import { ROOT } from "../server/store.mjs";

const force = process.argv.includes("--force");
const names = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const want = (n) => !names.length || names.includes(n);

const JOBS = {
  bg: {
    file: path.join(ROOT, "public", "assets", "background.png"),
    run: async (file) => {
      const prompt = "An empty Singapore HDB void deck at dusk opening onto a grass field, wide 16:9 side-on stage-set view. "
        + "Concrete void-deck floor in the bottom strip of the frame (the floor line sits about 85 percent of the way down), "
        + "a row of chunky concrete pillars and a few faded stone tables with stools in the shade, a low ceiling with a hanging fluorescent tube, "
        + "the open side looking out over a green field with a distant HDB block silhouette and a golden-pink dusk sky. "
        + "Soft warm lantern light, calm and empty with plenty of open floor space in the middle. "
        + "Warm slightly faded paper-cutout illustration, gouache texture, dark brown ink outlines, empty, no people, no animals, no text";
      const bytes = await generate(prompt, { model: process.env.BG_MODEL || "gpt-image-2", size: "1792x1008", quality: process.env.BG_QUALITY || "medium", transparent: false, timeoutMs: 300000 });
      await savePng(bytes, file, 1600); // 1600x900
    },
  },
  oyen: {
    file: path.join(ROOT, "template", "residents", "oyen", "sprite.png"),
    run: async (file) => savePng(await generate(spritePrompt("an orange tabby void-deck cat, standing alert, side view facing right, tail up, friendly face, white chest")), file, 256),
  },
  kopi: {
    file: path.join(ROOT, "template", "residents", "kopi", "sprite.png"),
    run: async (file) => savePng(await generate(spritePrompt("a cheeky common myna bird with brown body, black head, yellow beak and yellow eye patch, wings half open as if about to swoop, side view facing right")), file, 256),
  },
};

const todo = Object.entries(JOBS).filter(([n, j]) => want(n) && (force || !fs.existsSync(j.file)));
if (!todo.length) console.log("nothing to draw (use --force to redraw)");
await Promise.all(todo.map(async ([n, j]) => {
  const t0 = Date.now();
  try { await j.run(j.file); console.log(`${n}: ${path.relative(ROOT, j.file)} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { console.error(`${n} failed: ${e.message}`); process.exitCode = 1; }
}));
