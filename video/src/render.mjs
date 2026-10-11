// node render.mjs [9x16,1x1,16x9] [--fps=30] [--frames=N]   (aspects render in parallel, each its own Chrome)
import { serve, openPage, ROOT } from "./lib.mjs";
import fs from "node:fs"; import { spawn } from "node:child_process";
const A = { "9x16": [1080, 1920], "1x1": [1080, 1080], "16x9": [1920, 1080] };
const args = process.argv.slice(2), want = (args.find((a) => !a.startsWith("--")) || "9x16,1x1,16x9").split(",");
const fps = +(args.find((a) => a.startsWith("--fps="))?.slice(6) || 30), dur = 24, N = +(args.find((a) => a.startsWith("--frames="))?.slice(9) || fps * dur);
fs.mkdirSync(`${ROOT}/video/out`, { recursive: true });
const { srv, port } = await serve();
const audio = fs.existsSync(`${ROOT}/video/audio/mix.wav`) ? `${ROOT}/video/audio/mix.wav` : null;
console.log("audio:", audio || "none");
await Promise.all(want.map(async (k) => {
  const [w, h] = A[k], out = `${ROOT}/video/out/commons-${k}.mp4`;
  const pg = await openPage(`http://127.0.0.1:${port}/video/src/composition.html?w=${w}&h=${h}`, w, h);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", ...(audio ? ["-i", audio] : []), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(fps), ...(audio ? ["-c:a", "aac", "-b:a", "192k", "-t", String(dur), "-shortest"] : []), "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((r) => ff.on("close", r)); const t0 = Date.now();
  for (let i = 0; i < N; i++) { const buf = await pg.frame(i / fps); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); if (i % 120 === 0) console.log(k, i, "/", N, ((Date.now() - t0) / 1000).toFixed(0) + "s"); }
  ff.stdin.end(); await done; pg.close(); console.log("wrote", out);
}));
srv.close(); process.exit(0);
