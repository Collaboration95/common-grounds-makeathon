// Prompt generator + pixel generator: a moment and a guest in, a playable game manifest out.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paintCast } from './insert.js';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const env = (key, fallback) => process.env[key] || fallback;

const WORLD_STYLE = 'Richly detailed high-resolution pixel art illustration: realistic proportions, perspective and lighting rendered in fine visible pixels, like a premium modern pixel-art game or a large pixel-art poster. Believable, coherent layout where every building, prop and person makes sense for the place and moment.';
const MOVES = ['nod', 'hop', 'shake', 'wave', 'tilt'];
// MODE=draft is cheap for testing; MODE=final is for the demo wall.
const QUALITY = { draft: { bg: 'low', sprite: 'low' }, final: { bg: 'high', sprite: 'medium' } };
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
    background: { type: 'string', description: 'Image prompt for the background only, described visually without character names: the setting and moment from a wide elevated view, packed with a crowd of generic extras and lots of small incidents. Must not depict the guest or the residents.' },
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

async function ask(input, name, schema) {
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

async function image(prompt, { size, quality, transparent }) {
  const json = await openai('images/generations', {
    model: env('IMAGE_MODEL', 'gpt-image-2.5-flare'),
    // WebP keeps transparency and is a fraction of PNG's size, so the wall loads fast.
    prompt, size, quality, n: 1, output_format: 'webp', output_compression: 92,
    ...(transparent && { background: 'transparent' }),
  });
  return Buffer.from(json.data[0].b64_json, 'base64');
}

const backgroundPrompt = plan => `${WORLD_STYLE} ${plan.background} Wide elevated three-quarter view, packed edge to edge: crowds of extras going about believable business, props, stalls, decorations and small incidents everywhere to search through. People are drawn at a consistent realistic scale for their distance. No captions, UI or borders.`;

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

  onStage('Painting the world');
  const base = cachedBg ?? await image(backgroundPrompt(plan), { size: '1536x1024', quality: quality('bg') }).then(b => save(`${id}-bg.webp`, b));
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
