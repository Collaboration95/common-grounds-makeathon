// node contact.mjs [w] [h] -> video/out/contact-sheet.png (one frame per scene beat)
import { serve, openPage, ROOT } from "./lib.mjs";
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const w = +process.argv[2] || 1080, h = +process.argv[3] || 1920;
const times = (process.argv[4] || "2.6,5.5,8.0,10.5,12.8,15.0,17.0,20.5,23.4,25.0,27.5,30.0,33.0,35.0,36.5,39.0,41.5,43.5,45.5,47.5,49.5,51.5,53.5,57.5").split(",").map(Number);
const { srv, port } = await serve();
const pg = await openPage(`http://127.0.0.1:${port}/video/src/composition.html?w=${w}&h=${h}`, w, h);
fs.mkdirSync(`${ROOT}/video/out/tmp`, { recursive: true });
for (let i = 0; i < times.length; i++) fs.writeFileSync(`${ROOT}/video/out/tmp/c${String(i).padStart(2, "0")}.jpg`, await pg.frame(times[i]));
pg.close(); srv.close();
const cols = w >= h ? 4 : 8, rows = Math.ceil(times.length / cols), tw = w >= h ? 480 : 270, th = Math.round(tw * h / w);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${ROOT}/video/out/tmp/c%02d.jpg`, "-vf", `scale=${tw}:${th},tile=${cols}x${rows}:padding=6:color=0x1d1424`, "-frames:v", "1", `${ROOT}/video/out/${process.argv[5] || "contact-sheet.png"}`]);
console.log("contact sheet ok", times.length);
