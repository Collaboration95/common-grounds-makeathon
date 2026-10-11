// Prompt generator + pixel generator: a moment and a guest in, a playable game manifest out.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paintCast, imageModel } from './insert.js';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const env = (key, fallback) => process.env[key] || fallback;

const WORLD_STYLE = 'Clean, crisp, high-resolution pixel art illustration in the style of a premium modern pixel-art game, with a limited cohesive palette, strong dark outlines and clear readable silhouettes. Medium-scale single setting that fits in one room, courtyard or street, not an epic panorama. Logical, believable layout where every prop and person makes sense for the place and moment, lit by one consistent light source.';
const MOVES = ['nod', 'hop', 'shake', 'wave', 'tilt'];
// MODE=draft is cheap for testing; MODE=final is for the demo wall.
const QUALITY = { draft: { bg: 'low', sprite: 'low' }, final: { bg: 'high', sprite: 'high' } };
const quality = kind => env(kind === 'bg' ? 'BG_QUALITY' : 'SPRITE_QUALITY', (QUALITY[env('MODE', 'draft')] ?? QUALITY.draft)[kind]);

const character = extra => ({
  type: 'object',
  additionalProperties: false,
  required: ['name', 'look', 'quips', 'line', 'move'],
  properties: {
    name: { type: 'string' },
    look: { type: 'string', description: 'The only thing the illustrator sees, so it must contain no names, titles, franchises, places, houses or teams. Describe what is visible: age, build, face, hair, clothing and colours, at most one hand-held prop, posture and expression. No furniture, railings or scenery. One or two sentences.' },
    quips: { type: 'array', items: { type: 'string' }, description: 'Exactly 3 short lines (max 8 words each) they mutter when someone hovers over them, in their own voice. Never say their own name.' },
    line: { type: 'string', description: extra },
    move: { type: 'string', enum: MOVES, description: 'The tiny gesture that suits their personality.' },
  },
});

const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'story', 'world', 'background', 'guest', 'residents'],
  properties: {
    title: { type: 'string', description: 'Punchy scene title, max 6 words.' },
    story: { type: 'string', description: 'Caption revealed when the guest is found: one or two witty sentences about why they are here.' },
    world: { type: 'string', description: 'Short name of the setting, e.g. "Quidditch World Cup final".' },
    background: { type: 'string', description: 'Image prompt for the background only, described visually without character names: one medium-scale setting (a single room, yard or street, never a stadium or vista) with about 25 to 40 large, distinct generic extras and lots of small incidents. Must not depict the guest or the residents.' },
    guest: character('What the guest says the moment they are found, in their own voice. Max 12 words.'),
    residents: { type: 'array', items: character('What they say when someone wrongly clicks them, a little disapproving. Max 8 words.'), description: 'Exactly 4 recognisable characters who belong in this world and moment.' },
  },
};

async function openai(endpoint, body) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Add OPENAI_API_KEY to WW/.env');
  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `OpenAI ${endpoint} failed (${res.status})`);
  return json;
}

export async function ask(input, name, schema) {
  const json = await openai('responses', {
    model: env('TEXT_MODEL', 'gpt-6.1-sol'),
    input,
    text: { format: { type: 'json_schema', name, schema, strict: true } },
  });
  const text = json.output?.flatMap(item => item.content ?? []).find(part => part.type === 'output_text')?.text;
  if (!text) throw new Error(`The model returned no ${name}`);
  return JSON.parse(text);
}

const planScene = (moment, guest) => ask([
  { role: 'system', content: 'You design one Where\'s Waldo style pixel-art puzzle. The player gets a famous moment from a film, book, game or real life, plus a guest hidden somewhere in it who may not belong. Make it affectionate, funny and instantly recognisable to fans. Characters are drawn separately as small sprites and placed into the crowd later, so the background must contain only generic extras.' },
  { role: 'user', content: `Moment: ${moment}\nGuest hiding in it: ${guest}` },
], 'scene_plan', PLAN_SCHEMA);

const SPOTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['spots'],
  properties: {
    spots: {
      type: 'array',
      description: '16 to 24 spots spread across the whole image.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'h', 'area', 'action'],
        properties: {
          x: { type: 'number', description: 'Horizontal position of the feet, 0 = left edge, 1 = right edge.' },
          y: { type: 'number', description: 'Vertical position of the feet, 0 = top edge, 1 = bottom edge.' },
          h: { type: 'number', description: 'Height of a standing adult at this spot as a fraction of image height, matching the people drawn nearby.' },
          area: { type: 'string', description: 'Where it is, as a phrase that completes "Look …", e.g. "near the candyfloss stall".' },
          action: { type: 'string', description: 'What someone would naturally be doing exactly there, interacting with what is drawn, e.g. "sitting at the long table with a mug", "peeking out from behind the tent pole", "queueing at the stall".' },
        },
      },
    },
  },
};

// Ask a vision model where a person could believably stand, so characters never float on the pitch or in the sky.
export async function findSpots(src) {
  const png = await readFile(path.join(DATA, src.replace(/^\/data\//, '')));
  const { spots } = await ask([{ role: 'user', content: [
    { type: 'input_text', text: 'This is a busy illustrated scene. We will hide a few extra people in it, Where\'s Waldo style, so they should blend in. List believable spots where an extra person could be painted in: seats at tables, gaps in crowds and queues, behind tent poles, barrels and corners where someone could peek out, stands and walkways, wherever the existing people are. Prefer spots where they would be partly tucked among people or objects. Never on a playing field, in the sky, on walls or rooftops, or over water.' },
    { type: 'input_image', image_url: `data:image/${src.endsWith('.png') ? 'png' : 'webp'};base64,${png.toString('base64')}` },
  ] }], 'spots', SPOTS_SCHEMA);
  return spots.filter(s => s.x > 0.03 && s.x < 0.97 && s.y - s.h > 0.02 && s.y < 0.99 && s.h > 0.02 && s.h < 0.35);
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pass', 'problems', 'revised_prompt_addition'],
  properties: {
    pass: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' }, description: 'Short, specific problems with where they are. Empty if it passes.' },
    revised_prompt_addition: { type: 'string', description: 'One or two sentences to append to the image prompt so the next attempt fixes the problems. Empty if it passes.' },
  },
};

export const CRITIC_RUBRIC = `You are the art director for a Where's Waldo style pixel-art game shown on a projector. Answer each check; pass only if all are yes.
1. Smallest people: is the smallest person at least about 4% of the image height, with a clear head and body?
2. Separation: can you count and tell apart individual figures everywhere, with no crowd blobs, smears or merged bodies?
3. Scale: is the scene medium-scale (one room, yard or street), not a stadium, panorama or tiered crowd?
4. Logic: does the layout make physical sense, with coherent props, furniture and architecture that fit the place?
5. Light: is the lighting consistent, with no region so dark that figures lose their silhouettes?
6. Frame: no big murky foreground objects, no cropped half-figures at the edges, no gibberish text?
Set pass to false only if check 1, 2, 3 or 4 fails; list failures of checks 5 and 6 as problems but still pass, since a repaint costs a lot.
Problems must say where and what, e.g. "upper-left: tiny crowd merges into noise".`;

export async function reviewScene(src) {
  const img = await readFile(path.join(DATA, src.replace(/^\/data\//, '')));
  return ask([{ role: 'user', content: [
    { type: 'input_text', text: CRITIC_RUBRIC },
    { type: 'input_image', image_url: `data:image/${src.endsWith('.png') ? 'png' : 'webp'};base64,${img.toString('base64')}` },
  ] }], 'art_review', REVIEW_SCHEMA);
}

async function image(prompt, { size, quality, transparent }) {
  const json = await openai('images/generations', {
    model: imageModel(),
    // WebP keeps transparency and is a fraction of PNG's size, so the wall loads fast.
    prompt, size, quality, n: 1, output_format: 'webp', output_compression: 92,
    ...(transparent && { background: 'transparent' }),
  });
  return Buffer.from(json.data[0].b64_json, 'base64');
}

// Prompt rules from the Sonnet art-direction review (art-direction.md): medium-scale, no tiny crowds.
export const backgroundPrompt = plan => `${WORLD_STYLE} ${plan.background} Camera: moderately close elevated three-quarter view, like looking down into one scene from a balcony, with only three depth layers (foreground, middle, back wall or edge). Show about 25 to 40 people in total. The farthest person is still about 4 percent of the image height, with a distinct head, body and clothing colour. Never draw tiny distant crowds, spectator stands, packed audiences or masses of heads; instead use a few large clear groups, and show the back of the space as walls, scenery or empty open ground. Every person is a separate, fully drawn figure with clear space around them, overlapping at most slightly, in varied poses, outfits and silhouettes. Fill the space with large readable props, stalls, furniture and small funny incidents, each drawn as a complete object. Make the foreground and middle ground dense and detailed, and the background simple and calm. Avoid cropped figures at the frame edge, huge blurry foreground objects, gibberish text, captions, UI and borders.`;

// Fallback when no spots came back: the lower part of the scene; lower on screen means closer, so bigger.
function randomSpot() {
  const y = 0.45 + Math.random() * 0.5;
  return { x: 0.06 + Math.random() * 0.88, y, h: 0.07 + ((y - 0.45) / 0.5) * 0.05, area: '' };
}

// The clue spotlight: a box roughly 40% of the scene that contains the guest, not centred on them.
function hintBox({ x, y, h, area }) {
  const w = 0.4, hh = 0.42;
  const clamp = v => Math.min(Math.max(v, 0), 1);
  const left = clamp(x - w * (0.2 + Math.random() * 0.6));
  const top = clamp(y - h / 2 - hh * (0.2 + Math.random() * 0.6));
  return { x: Math.min(left, 1 - w), y: Math.min(top, 1 - hh), w, h: hh, text: area ? `Look ${area}` : '' };
}

// Well-separated spots, one per character. Far-away spots make people too tiny to find on a projector;
// very close ones make them obvious.
export function chooseSpots(spots, count, scale = 1) {
  const pool = spots.filter(s => s.h * scale >= 0.065 && s.h * scale <= 0.2).sort(() => Math.random() - 0.5);
  const chosen = [];
  for (const gap of [0.2, 0.12, 0]) {
    for (const s of pool) if (chosen.length < count && !chosen.includes(s) && chosen.every(c => Math.hypot(c.x - s.x, (c.y - s.y) * 1.5) > gap)) chosen.push(s);
  }
  while (chosen.length < count) chosen.push(randomSpot());
  return chosen;
}

const toCharacters = cast => cast.map((c, i) => ({
  id: `c${i}`, name: c.name, role: c.role, sprite: c.sprite, quips: c.quips, line: c.line, move: c.move, x: c.x, y: c.y, h: c.h,
  ...(c.portrait && { portrait: c.portrait }),
}));

// Legacy path for standing sprites pasted on top (kept for old games and `npm run rehide`).
export function placeCast(cast, spots, scale = Number(env('SPRITE_SCALE', 1.15))) {
  const chosen = chooseSpots(spots, cast.length, scale);
  const characters = toCharacters(cast.map((c, i) => ({ ...c, x: chosen[i].x, y: chosen[i].y, h: chosen[i].h * scale })));
  return { characters, targetId: 'c0', hint: hintBox(chosen[0]) };
}

// Paint the cast into the scene and build the playable part of the game manifest.
export async function paintIntoScene({ id, bgFile, cast, spots, onStage }) {
  const chosen = chooseSpots(spots, cast.length);
  const { scene, painted } = await paintCast({ id, bgFile, cast, spots: chosen, quality: quality('sprite'), onStage });
  return { baked: true, scene, characters: toCharacters(painted), targetId: 'c0', hint: hintBox(painted[0]) };
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// Pass `bg` (an existing /data/assets path) to reuse a cached background and only paint new characters.
export async function createGame({ moment, guest, bg: cachedBg }, onStage = () => {}) {
  onStage('Writing the scene');
  const plan = await planScene(moment, guest);
  const id = `${Date.now().toString(36)}-${slug(plan.title)}`;
  const cast = [{ ...plan.guest, role: 'guest' }, ...plan.residents.slice(0, 4).map(r => ({ ...r, role: 'resident' }))];

  await mkdir(path.join(DATA, 'assets'), { recursive: true });
  await mkdir(path.join(DATA, 'games'), { recursive: true });
  const save = async (name, buffer) => {
    await writeFile(path.join(DATA, 'assets', name), buffer);
    return `/data/assets/${name}`;
  };

  let base = cachedBg, review = null;
  // Paint, let the art director check it, and repaint with its fixes if it fails.
  for (let attempt = 0; !base; attempt++) {
    onStage(attempt ? `Repainting: ${review.problems[0] ?? 'clearer scene'}` : 'Painting the world');
    const prompt = backgroundPrompt(plan) + (review ? ` Fix these problems from the last attempt: ${review.revised_prompt_addition}` : '');
    const file = await image(prompt, { size: '1536x1024', quality: quality('bg') }).then(b => save(`${id}-bg${attempt || ''}.webp`, b));
    if (attempt >= Number(env('CRITIC_RETRIES', 1))) { base = file; break; }
    onStage('Art director checking the scene');
    review = await reviewScene(file).catch(err => { console.warn(`No review: ${err.message}`); return { pass: true, problems: [] }; });
    console.log(`[art director] ${review.pass ? 'pass' : 'redo'}: ${review.problems.join('; ')}`);
    if (review.pass) base = file;
  }
  onStage('Finding hiding spots');
  const spots = await findSpots(base);
  const { scene, ...play } = await paintIntoScene({ id, bgFile: base, cast, spots, onStage });
  const game = {
    id, createdAt: Date.now(), moment, title: plan.title, story: plan.story, world: plan.world,
    bg: { src: scene, base, w: 1536, h: 1024 },
    ...play, spots, plan, mode: env('MODE', 'draft'),
  };
  await writeFile(path.join(DATA, 'games', `${id}.json`), JSON.stringify(game, null, 2));
  return game;
}
