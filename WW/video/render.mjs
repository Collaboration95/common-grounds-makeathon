// node render.mjs <portrait|square|landscape> [stills t1,t2,...]   → out/ww-<fmt>.mp4 (with out/audio.wav) or out/stills/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join } from 'node:path';

const SIZES = { portrait: [1080, 1920], square: [1080, 1080], landscape: [1920, 1080] };
const [fmt = 'portrait', mode, list] = process.argv.slice(2);
const [w, h] = SIZES[fmt];
const FPS = 30, root = new URL('.', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.error('[page error]', e));
await page.goto(`http://localhost:${port}/index.html?w=${w}&h=${h}`);
await page.evaluate(() => window.ready);
const grab = (t, type = 'image/jpeg') => page.evaluate(([t, type]) => { comp.renderFrame(t); return document.getElementById('c').toDataURL(type, 0.95).split(',')[1]; }, [t, type]);

await mkdir(join(root, 'out/stills'), { recursive: true });
if (mode === 'contact') {
  // Contact sheet: one labelled thumbnail per representative moment, drawn in the page.
  const times = list.split(',').map(Number);
  const png = await page.evaluate(times => {
    const src = document.getElementById('c'), tw = 360, th = tw * src.height / src.width, cols = Math.min(5, times.length);
    const sheet = Object.assign(document.createElement('canvas'), { width: cols * tw, height: Math.ceil(times.length / cols) * th });
    const x = sheet.getContext('2d');
    times.forEach((t, i) => {
      comp.renderFrame(t);
      const px = (i % cols) * tw, py = Math.floor(i / cols) * th;
      x.drawImage(src, px, py, tw, th);
      x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(px, py, 92, 34); x.fillStyle = '#fff'; x.font = '700 22px Fredoka'; x.fillText(t.toFixed(2) + 's', px + 8, py + 25);
      x.strokeStyle = '#000'; x.strokeRect(px, py, tw, th);
    });
    return sheet.toDataURL('image/png').split(',')[1];
  }, times);
  await writeFile(join(root, `out/contact-${fmt}.png`), Buffer.from(png, 'base64'));
} else if (mode === 'stills') {
  for (const t of list.split(',').map(Number)) await writeFile(join(root, `out/stills/${fmt}-${t.toFixed(2)}.png`), Buffer.from(await grab(t, 'image/png'), 'base64'));
} else {
  const { DUR } = await page.evaluate(() => ({ DUR: comp.DUR }));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', FPS, '-c:v', 'mjpeg', '-i', '-', '-i', join(root, 'out/audio.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
    join(root, `out/whos-hiding-${fmt}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(DUR * FPS);
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from(await grab(i / FPS), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(fmt, i, '/', n);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close(); server.close();
