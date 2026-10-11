// node contact.mjs [w] [h] -> video/out/contact-sheet.png (one frame per scene beat)
import { serve, openPage, ROOT } from "./lib.mjs";
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const w = +process.argv[2] || 1080, h = +process.argv[3] || 1920;
const times = (process.argv[4] || "0.9,2.7,3.9,5.7,7.0,8.5,10.0,11.5,13.8,15.0,16.3,18.0,19.0,20.5,21.8,23.0").split(",").map(Number);
const { srv, port } = await serve();
const pg = await openPage(`http://127.0.0.1:${port}/video/src/composition.html?w=${w}&h=${h}`, w, h);
fs.mkdirSync(`${ROOT}/video/out/tmp`, { recursive: true });
for (let i = 0; i < times.length; i++) fs.writeFileSync(`${ROOT}/video/out/tmp/c${String(i).padStart(2, "0")}.jpg`, await pg.frame(times[i]));
pg.close(); srv.close();
const cols = w >= h ? 4 : 8, rows = Math.ceil(times.length / cols), tw = w >= h ? 480 : 270, th = Math.round(tw * h / w);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${ROOT}/video/out/tmp/c%02d.jpg`, "-vf", `scale=${tw}:${th},tile=${cols}x${rows}:padding=6:color=0x1d1424`, "-frames:v", "1", `${ROOT}/video/out/${process.argv[5] || "contact-sheet.png"}`]);
console.log("contact sheet ok", times.length);
