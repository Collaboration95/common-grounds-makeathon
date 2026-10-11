// Paint characters into the scene itself (sitting, peeking, queueing) with the image edit API, so they
// share its style and light. Each character is painted into a crop around its spot; the pixels that
// changed become that character's cut-out, used for clicks, the portrait card and the found animation.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const EDIT = 1024;
// Draft: the fast model. Final: the quality model, which is also the more precise editor.
export const imageModel = () => process.env.IMAGE_MODEL || (process.env.MODE === 'final' ? 'gpt-image-2.5-sunburst' : 'gpt-image-2.5-flare');

async function edit(crop, mask, prompt, quality, extra = {}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Add OPENAI_API_KEY to WW/.env');
  const form = new FormData();
  form.append('model', imageModel());
  form.append('prompt', prompt);
  form.append('quality', quality);
  form.append('size', `${EDIT}x${EDIT}`);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  form.append('image[]', new Blob([crop], { type: 'image/png' }), 'scene.png');
  if (mask) form.append('mask', new Blob([mask], { type: 'image/png' }), 'mask.png');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST', headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Image edit failed (${res.status})`);
  return Buffer.from(json.data[0].b64_json, 'base64');
}

// Where a character goes inside its crop: an ellipse above the feet, a bit taller than a person.
function region(spot, W, H) {
  const ph = spot.h * H;
  const S = Math.round(Math.min(Math.max(ph * 3, 256), 720, W, H));
  const fx = spot.x * W, fy = spot.y * H;
  const left = Math.round(Math.min(Math.max(fx - S / 2, 0), W - S));
  const top = Math.round(Math.min(Math.max(fy - S * 0.72, 0), H - S));
  return { left, top, S, cx: fx - left, cy: fy - top - ph * 0.55, rx: ph * 0.5, ry: ph * 0.75 };
}

// 1 inside the ellipse, fading to 0 over its outer edge.
const weight = (x, y, r, feather = 0.25) => {
  const d = Math.hypot((x - r.cx) / r.rx, (y - r.cy) / r.ry);
  return d <= 1 - feather ? 1 : d >= 1 ? 0 : (1 - d) / feather;
};

async function paintOne({ base, W, H, spot, c, quality }) {
  const r = region(spot, W, H);
  const crop = sharp(base, { raw: { width: W, height: H, channels: 4 } }).extract({ left: r.left, top: r.top, width: r.S, height: r.S });
  const before = await crop.clone().raw().toBuffer();
  const cropPng = await crop.clone().resize(EDIT, EDIT, { kernel: 'nearest' }).png().toBuffer();

  // Transparent = paint here. A slightly larger ellipse than we keep, so the model has room.
  const k = EDIT / r.S;
  const mask = Buffer.alloc(EDIT * EDIT * 4, 255);
  for (let y = 0; y < EDIT; y++) for (let x = 0; x < EDIT; x++) {
    if (Math.hypot((x / k - r.cx) / (r.rx * 1.25), (y / k - r.cy) / (r.ry * 1.15)) < 1) mask[(y * EDIT + x) * 4 + 3] = 0;
  }
  const maskPng = await sharp(mask, { raw: { width: EDIT, height: EDIT, channels: 4 } }).png().toBuffer();

  const prompt = `Paint exactly one extra person into the transparent area of this pixel-art scene: ${c.look} They are ${spot.action}, acting naturally as part of the scene. Match the surrounding pixel-art style, palette, lighting and the size of the nearby people exactly, so they blend in like everyone else; it is fine for tables, people or objects to partly overlap them. Keep everything outside the transparent area unchanged. No text.`;
  const out = await edit(cropPng, maskPng, prompt, quality);
  const after = await sharp(out).resize(r.S, r.S, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer();

  // Blend the new pixels into the scene. The model repaints the whole masked area, so the click
  // target is the painted ellipse rather than an exact silhouette.
  // Keep a wider area than the mask so nothing the model drew gets half-faded into a ghost.
  const wide = { ...r, rx: r.rx * 1.45, ry: r.ry * 1.3 };
  let changed = 0, inside = 0;
  for (let y = 0; y < r.S; y++) for (let x = 0; x < r.S; x++) {
    const i = (y * r.S + x) * 4, w = weight(x, y, wide, 0.3);
    if (!w) continue;
    inside++;
    if (Math.abs(after[i] - before[i]) + Math.abs(after[i + 1] - before[i + 1]) + Math.abs(after[i + 2] - before[i + 2]) > 70) changed++;
    const j = ((r.top + y) * W + r.left + x) * 4;
    for (let ch = 0; ch < 3; ch++) base[j + ch] = Math.round(base[j + ch] * (1 - w) + after[i + ch] * w);
  }
  if (changed < inside * 0.08) throw new Error(`nobody appeared for ${c.name}`);

  const minX = Math.max(0, Math.floor(r.cx - r.rx)), maxX = Math.min(r.S - 1, Math.ceil(r.cx + r.rx));
  const minY = Math.max(0, Math.floor(r.cy - r.ry)), maxY = Math.min(r.S - 1, Math.ceil(r.cy + r.ry));
  const cw = maxX - minX + 1, chh = maxY - minY + 1;
  const hit = Buffer.alloc(cw * chh * 4);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const i = ((minY + y) * r.S + minX + x) * 4, o = (y * cw + x) * 4;
    after.copy(hit, o, i, i + 3);
    hit[o + 3] = weight(minX + x, minY + y, r) > 0.3 ? 255 : 0;
  }
  return {
    cutout: await sharp(hit, { raw: { width: cw, height: chh, channels: 4 } }).png().toBuffer(),
    painted: out, x: (r.left + minX + cw / 2) / W, y: (r.top + maxY + 1) / H, h: chh / H,
  };
}

// Lift the painted guest out of their crop onto transparency: the "Find" card and found animation.
export const liftPortrait = (painted, c, quality) => edit(painted, null,
  `Show only the one person matching this description, exactly as they are drawn in this image (same pose, pixel-art style, colours and clothes), on a fully transparent background. Remove everything else, including furniture and other people. Person: ${c.look}`,
  quality, { background: 'transparent', output_format: 'png' });

// Guest first: if they're refused or don't appear, stop before paying for the residents.
export async function paintCast({ id, bgFile, cast, spots, quality, onStage = () => {} }) {
  const { data: base, info } = await sharp(path.join(DATA, bgFile.replace(/^\/data\//, ''))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const save = async (name, buffer) => { await writeFile(path.join(DATA, 'assets', name), buffer); return `/data/assets/${name}`; };
  const painted = [];
  const paint = async (c, i, spot) => {
    const p = await paintOne({ base, W, H, spot, c, quality });
    painted[i] = { ...c, sprite: await save(`${id}-cut${i}.png`, p.cutout), x: p.x, y: p.y, h: p.h, area: spot.area };
    if (i === 0) {
      painted[0].portrait = await liftPortrait(p.painted, c, quality)
        .then(b => save(`${id}-portrait.png`, b))
        .catch(err => { console.warn(`No portrait for ${c.name}: ${err.message}`); return null; });
    }
  };

  onStage(`Painting ${cast[0].name} into the scene`);
  try { await paint(cast[0], 0, spots[0]); } catch (err) {
    throw new Error(/safety system/i.test(err.message) ? `The image model won't draw ${cast[0].name}. Try a different guest.` : `${cast[0].name} could not be painted in: ${err.message}`);
  }
  onStage('Painting the locals in');
  const results = await Promise.allSettled(cast.slice(1).map((c, i) => paint(c, i + 1, spots[i + 1])));
  results.forEach((r, i) => r.status === 'rejected' && console.warn(`Skipped ${cast[i + 1].name}: ${r.reason.message}`));

  const scene = await save(`${id}-scene.webp`, await sharp(base, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 92 }).toBuffer());
  return { scene, painted: painted.filter(Boolean) };
}
