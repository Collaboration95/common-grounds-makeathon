// Turn a Codex-painted world (data/codex/<world>-scene.png, -noguest.png, -guest.png) into a game.
// The guest's position comes from diffing the scene with and without them; a vision model names the
// other famous characters for click reactions and writes the title, story and lines.
// Usage: node scripts/import-codex.js <world> "<guest name>" "<moment>"
import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { ask } from '../lib/generate.js';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}
const [world, guestName, moment] = process.argv.slice(2);
const dir = new URL('../data/codex/', import.meta.url).pathname;
const data = new URL('../data/', import.meta.url).pathname;
const id = `codex-${world}`;

const scene = sharp(`${dir}${world}-scene.png`);
const { width: W, height: H } = await scene.metadata();
const box = b => ({ type: 'object', additionalProperties: false, required: ['x', 'y', 'w', 'h'], properties: { x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } }, description: b });

// 1. Where the guest is: biggest blob of pixels that changed when they were removed.
async function diffBox() {
  const SW = 384, SH = Math.round((SW * H) / W);
  const a = await sharp(`${dir}${world}-scene.png`).resize(SW, SH).removeAlpha().raw().toBuffer();
  const b = await sharp(`${dir}${world}-noguest.png`).resize(SW, SH).removeAlpha().raw().toBuffer();
  const on = new Uint8Array(SW * SH);
  for (let i = 0; i < SW * SH; i++) on[i] = Math.abs(a[i * 3] - b[i * 3]) + Math.abs(a[i * 3 + 1] - b[i * 3 + 1]) + Math.abs(a[i * 3 + 2] - b[i * 3 + 2]) > 90 ? 1 : 0;
  const seen = new Uint8Array(SW * SH);
  let best = null;
  for (let s = 0; s < SW * SH; s++) {
    if (!on[s] || seen[s]) continue;
    const stack = [s]; seen[s] = 1;
    let n = 0, x0 = SW, y0 = SH, x1 = 0, y1 = 0;
    while (stack.length) {
      const p = stack.pop(), x = p % SW, y = (p / SW) | 0;
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const q of [p - 1, p + 1, p - SW, p + SW]) if (q >= 0 && q < SW * SH && on[q] && !seen[q] && Math.abs((q % SW) - x) <= 1) { seen[q] = 1; stack.push(q); }
    }
    if (!best || n > best.n) best = { n, x: x0 / SW, y: y0 / SH, w: (x1 - x0 + 1) / SW, h: (y1 - y0 + 1) / SH };
  }
  return best && best.w * best.h < 0.12 && best.n > 40 ? best : null;
}

// 2. Vision model: title, story, lines, and the other famous characters with boxes.
const png = (await scene.clone().png().toBuffer()).toString('base64');
const plan = await ask([{ role: 'user', content: [
  { type: 'input_text', text: `This pixel-art scene is a Where's Waldo puzzle. The moment: ${moment}. The hidden guest is ${guestName}. Write the game text and locate characters. Boxes are fractions of the image (x, y = top-left corner). Residents are up to 6 recognisable famous characters who belong in this moment, excluding the guest; only include ones you can actually see.` },
  { type: 'input_image', image_url: `data:image/png;base64,${png}` },
] }], 'codex_world', {
  type: 'object', additionalProperties: false,
  required: ['title', 'story', 'world', 'guest_box', 'guest_line', 'guest_quips', 'hint', 'residents'],
  properties: {
    title: { type: 'string', description: 'Punchy title, max 6 words.' },
    story: { type: 'string', description: 'One or two witty sentences revealed when the guest is found.' },
    world: { type: 'string' },
    guest_box: box('The guest\'s bounding box.'),
    guest_line: { type: 'string', description: 'What the guest says when found, in their voice, max 12 words.' },
    guest_quips: { type: 'array', items: { type: 'string' } },
    hint: { type: 'string', description: 'Where the guest is, completing "Look …", without naming them.' },
    residents: { type: 'array', items: {
      type: 'object', additionalProperties: false, required: ['name', 'box', 'line', 'quips', 'move'],
      properties: {
        name: { type: 'string' }, box: box('Their bounding box.'),
        line: { type: 'string', description: 'Disapproving "not me" line in their voice, max 8 words.' },
        quips: { type: 'array', items: { type: 'string' }, description: '3 short lines in their voice.' },
        move: { type: 'string', enum: ['nod', 'hop', 'shake', 'wave', 'tilt'] },
      },
    } },
  },
});

const guestBox = (await diffBox()) ?? plan.guest_box;
console.log(`guest box from ${guestBox === plan.guest_box ? 'vision' : 'diff'}:`, guestBox);

// 3. Hit areas are rectangles cut from the scene; the guest's portrait is the transparent painting.
await mkdir(`${data}assets`, { recursive: true });
const cut = async (b, name) => {
  const left = Math.max(0, Math.round(b.x * W)), top = Math.max(0, Math.round(b.y * H));
  const width = Math.min(W - left, Math.max(4, Math.round(b.w * W))), height = Math.min(H - top, Math.max(4, Math.round(b.h * H)));
  await scene.clone().extract({ left, top, width, height }).png().toFile(`${data}assets/${id}-${name}.png`);
  return `/data/assets/${id}-${name}.png`;
};
const place = b => ({ x: b.x + b.w / 2, y: b.y + b.h, h: b.h });
const characters = [
  { id: 'c0', name: guestName.split(',')[0], role: 'guest', sprite: await cut(guestBox, 'hit0'), portrait: `/data/assets/${id}-portrait.png`, quips: plan.guest_quips, line: plan.guest_line, move: 'hop', ...place(guestBox) },
  ...await Promise.all(plan.residents.map(async (r, i) => ({ id: `c${i + 1}`, name: r.name, role: 'resident', sprite: await cut(r.box, `hit${i + 1}`), quips: r.quips, line: r.line, move: r.move, ...place(r.box) }))),
];
// No transparent portrait (e.g. refused): the card shows the guest cropped from the scene instead.
await sharp(`${dir}${world}-guest.png`).png().toFile(`${data}assets/${id}-portrait.png`)
  .catch(() => { characters[0].portrait = characters[0].sprite; });
await scene.clone().webp({ quality: 92 }).toFile(`${data}assets/${id}-scene.webp`);

const hw = 0.4, hh = 0.42, g = place(guestBox);
const clamp = v => Math.min(Math.max(v, 0), 1);
const game = {
  id, createdAt: Date.now(), source: 'codex', baked: true, moment, title: plan.title, story: plan.story, world: plan.world,
  bg: { src: `/data/assets/${id}-scene.webp`, w: W, h: H },
  targetId: 'c0', characters,
  hint: { x: Math.min(clamp(g.x - hw * (0.2 + Math.random() * 0.6)), 1 - hw), y: Math.min(clamp(g.y - g.h / 2 - hh * (0.2 + Math.random() * 0.6)), 1 - hh), w: hw, h: hh, text: `Look ${plan.hint}` },
};
await writeFile(`${data}games/${id}.json`, JSON.stringify(game, null, 2));
console.log(`✓ ${game.title}: guest + ${plan.residents.length} residents (${plan.residents.map(r => r.name).join(', ')})`);
