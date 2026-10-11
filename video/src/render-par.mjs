// node render-par.mjs <9x16|16x9|1x1> [--jobs=6]
// Resumable: renders frame chunks in parallel (one headless Chrome each) to out/tmp/<aspect>-NN.mp4,
// skips chunks that already exist, then concats + muxes audio/mix.wav -> out/commons-motion-<aspect>.mp4.
import { serve, openPage, ROOT } from "./lib.mjs";
import fs from "node:fs"; import { spawn, execFileSync } from "node:child_process";
const A = { "9x16": [1080, 1920], "1x1": [1080, 1080], "16x9": [1920, 1080] };
const args = process.argv.slice(2), k = args[0], [w, h] = A[k];
const jobs = +(args.find((a) => a.startsWith("--jobs="))?.slice(7) || 6), fps = 30, N = fps * 24, per = Math.ceil(N / jobs);
const TMP = `${ROOT}/video/out/tmp`, PROG = `${ROOT}/video/out/PROGRESS.md`;
fs.mkdirSync(TMP, { recursive: true });
const log = (s) => { fs.appendFileSync(PROG, `- ${new Date().toISOString().slice(11, 19)} ${s}\n`); console.log(s); };
const { srv, port } = await serve();
const chunk = async (c) => {
  const out = `${TMP}/${k}-${String(c).padStart(2, "0")}.mp4`, a = c * per, b = Math.min(N, a + per);
  if (fs.existsSync(out)) return out;
  const pg = await openPage(`http://127.0.0.1:${port}/video/src/composition.html?w=${w}&h=${h}`, w, h);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-color_range", "tv", "-r", String(fps), out + ".part.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((r) => ff.on("close", r));
  for (let i = a; i < b; i++) { const buf = await pg.frame(i / fps); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); }
  ff.stdin.end(); await done; pg.close(); fs.renameSync(out + ".part.mp4", out);
  log(`${k} chunk ${c} frames ${a}-${b - 1} done`); return out;
};
const t0 = Date.now(); log(`${k} start (${jobs} chunks)`);
const files = await Promise.all(Array.from({ length: jobs }, (_, c) => chunk(c)));
srv.close();
fs.writeFileSync(`${TMP}/${k}-list.txt`, files.map((f) => `file '${f}'`).join("\n"));
const final = `${ROOT}/video/out/commons-motion-${k}.mp4`;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${TMP}/${k}-list.txt`, "-i", `${ROOT}/video/audio/mix.wav`, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", "24", "-movflags", "+faststart", final]);
log(`${k} DONE -> ${final} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
process.exit(0);
