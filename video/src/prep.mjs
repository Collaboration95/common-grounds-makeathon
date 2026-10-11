// node prep.mjs : decode clips (with time remap segments) to jpg frame sequences at 30fps + write media.json
// spec: clips.spec.json {key:{src,w,crop?:"x:y:w:h",segs:[[srcStart,srcEnd,outDur],...]}, ...}; extra top-level fields copied into media.json
import fs from "node:fs"; import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";
const spec = JSON.parse(fs.readFileSync(`${ROOT}/video/src/clips.spec.json`, "utf8"));
const only = process.argv.slice(2);
const media = { clips: {}, ...(spec._extra || {}) };
for (const [key, c] of Object.entries(spec)) {
  if (key === "_extra") continue;
  const dir = `${ROOT}/video/assets/frames/${key}`; const rel = `/video/assets/frames/${key}`;
  let n = 0;
  if (only.length && !only.includes(key) && fs.existsSync(dir)) n = fs.readdirSync(dir).length;
  else {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const [a, b, out] of c.segs) {
      const k = out / (b - a), cnt = Math.round(out * 30);
      const vf = [c.crop ? `crop=${c.crop}` : null, `setpts=(PTS-STARTPTS)*${k}`, "fps=30", `scale=${c.w}:-2:flags=lanczos`].filter(Boolean).join(",");
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(a), "-t", String(b - a), "-i", `${ROOT}/video/assets/clips/${c.src}`, "-vf", vf, "-frames:v", String(cnt), "-q:v", "3", "-start_number", String(n + 1), `${dir}/%04d.jpg`]);
      n += cnt;
    }
  }
  media.clips[key] = { dir: rel, fps: 30, n, ext: "jpg" };
  console.log(key, n, "frames");
}
fs.writeFileSync(`${ROOT}/video/src/media.json`, JSON.stringify(media, null, 1));
