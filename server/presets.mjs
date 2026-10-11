// Preset characters and hats (SPEC v2): definitions used by tools/gen-presets.mjs, plus the loaders the server uses.
//   template/presets/characters/<id>/{thing.js, sprite.png, meta.json}   meta = {name, tags, zone, size, oneLine, text}
//   template/presets/hats/<id>.png
// Served at /presets/... A character is listed only when all three of its files exist.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./store.mjs";

export const DIR = path.join(ROOT, "template", "presets");
const CHARS = path.join(DIR, "characters"), HATDIR = path.join(DIR, "hats");

/** `text` doubles as the Codex brief for the behaviour; `art` is the illustrator prompt (side view facing right). */
export const CHARACTERS = [
  {
    id: "kaya-turtle", name: "Kaya Turtle", tags: ["turtle", "food", "warm"], zone: "ground", size: 1,
    oneLine: "Carries a slice of kaya toast on its back and takes its time.",
    text: "a sleepy turtle whose shell is a slice of kaya toast with butter. It plods very slowly and hides in its shell when poked, but perks up near anything warm or food-like and loves sitting on a stool",
    art: "a chubby green turtle whose shell is a thick slice of golden kaya toast with green coconut jam and a pat of butter on top, friendly sleepy eyes, side view facing right",
  },
  {
    id: "bishan-otter", name: "Bishan Otter", tags: ["otter", "water", "playful"], zone: "ground", size: 1,
    oneLine: "A Bishan park otter that slides, plays and chases anything it can.",
    text: "a sleek playful otter from Bishan park. It zooms around the floor in fast zig-zags, slides on its belly after hopping, chases the pointer and other small animals, and squeaks when poked",
    art: "a sleek brown otter with a cream chin and whiskers, long thick tail, bright curious eyes, mid-bound pose, side view facing right",
  },
  {
    id: "auntie-trolley", name: "Auntie's Trolley", tags: ["trolley", "wheels", "shopping"], zone: "ground", size: 1,
    oneLine: "A tartan shopping trolley that rolls itself to the market.",
    text: "an auntie's tartan two-wheeled shopping trolley with a face. It trundles around on its own as if heading to the wet market, collects the nearest food or hat on its way (it stops and says it is for later), and rattles and spins its wheels when poked",
    art: "a red-and-blue tartan fold-up shopping trolley on two little wheels with a handle, a spring onion and a loaf of bread poking out of the top, two cartoon eyes on the front, side view facing right",
  },
  {
    id: "kachang-yeti", name: "Kachang Yeti", tags: ["yeti", "cold", "food"], zone: "ground", size: 2,
    oneLine: "A shaggy yeti built from ice kachang, melting happily in the heat.",
    text: "a big shaggy yeti made of ice kachang: shaved ice drizzled with rainbow syrup, red beans and sweet corn. It lumbers slowly, shivers happily in the shade, sweats and drips near anything warm, and shakes off a burst of sparkle when poked",
    art: "a big friendly yeti made of ice kachang, a mound of shaved white ice with rainbow syrup stripes in red, green and orange, red beans and sweet corn kernels as decorations, small dark eyes and a gentle smile, side view facing right",
  },
  {
    id: "merlion-pup", name: "Merlion Pup", tags: ["merlion", "water", "cute"], zone: "ground", size: 1,
    oneLine: "A baby Merlion that squirts tiny fountains when it is happy.",
    text: "a baby Merlion pup with a lion's head and a little fish tail. It bounces around excitedly, stops to spout a little fountain from its mouth, follows the pointer like a puppy, and spouts a bigger fountain when poked",
    art: "a cute baby Merlion with a fluffy lion cub head with a small mane, a fish body covered in blue-teal scales, a curled fish tail, a little arc of water spouting from its mouth, side view facing right",
  },
  {
    id: "karung-guni-radio", name: "Karung Guni Radio", tags: ["radio", "music", "metal"], zone: "air", size: 1,
    oneLine: "A rescued old radio that floats about humming the karung guni jingle.",
    text: "a rescued retro transistor radio with a bobbing antenna, floating gently through the air as if on invisible balloons. It hums and drifts in loops, sings little tunes (say short snatches of lyrics), perches on high spots to listen, and crackles with static fx when poked",
    art: "a battered cream-and-brown retro transistor radio with a round speaker grille, two dials, a telescopic antenna and a leather carry strap, a friendly face on the speaker grille, small music notes floating around it, side view facing right",
  },
];

const HAT_STYLE = "single front-facing hat object only, no head, no person, centred, flat paper-cutout illustration, warm slightly faded gouache texture, dark brown ink outline, no text, no shadow";
export const HATS = [
  { id: "party", name: "Party hat", art: `a short stubby striped cone party hat, nearly as wide as it is tall, with a fluffy pom-pom on top and NO chin strap, ${HAT_STYLE}` },
  { id: "songkok", name: "Songkok", art: `a black velvet songkok (peci), a tall flat-topped cap with a subtle gold-thread band, ${HAT_STYLE}` },
  { id: "caping", name: "Caping", art: `a wide conical caping straw hat woven from pale golden straw with a woven pattern and a red cord, ${HAT_STYLE}` },
  { id: "crown", name: "Crown", art: `a small golden royal crown with three points, each tipped with a round red or blue jewel, ${HAT_STYLE}` },
  { id: "chef", name: "Chef hat", art: `a tall white puffy chef toque with pleated folds, ${HAT_STYLE}` },
  { id: "bucket", name: "Bucket hat", art: `a soft floppy olive-green bucket hat with a stitched brim and a small band, ${HAT_STYLE}` },
];

export const hatIds = () => HATS.filter((h) => fs.existsSync(path.join(HATDIR, h.id + ".png"))).map((h) => h.id);
export const hasHat = (id) => hatIds().includes(id);

const readMeta = (id) => { try { return JSON.parse(fs.readFileSync(path.join(CHARS, id, "meta.json"), "utf8")); } catch { return null; } };
const ready = (id) => ["thing.js", "sprite.png", "meta.json"].every((f) => fs.existsSync(path.join(CHARS, id, f)));

/** The preset character, or null when it is unknown or incomplete. */
export function getCharacter(id) {
  if (!CHARACTERS.some((c) => c.id === id) || !ready(id)) return null;
  const meta = readMeta(id);
  return meta ? { id, ...meta, dir: path.join(CHARS, id) } : null;
}

/** GET /api/presets body. */
export function list() {
  const characters = CHARACTERS.map((c) => getCharacter(c.id)).filter(Boolean)
    .map((c) => ({ id: c.id, name: c.name, oneLine: c.oneLine, sprite: `/presets/characters/${c.id}/sprite.png` }));
  const hats = HATS.filter((h) => hasHat(h.id)).map((h) => ({ id: h.id, name: h.name, img: `/presets/hats/${h.id}.png` }));
  return { characters, hats };
}

/** Files served under /presets/ (anything outside characters/<id>/{sprite.png,meta.json} and hats/<id>.png is a 404). */
export function resolveFile(rel) {
  const parts = rel.split("/").filter(Boolean);
  if (parts[0] === "hats" && parts.length === 2 && /^[a-z]+\.png$/.test(parts[1])) return path.join(HATDIR, parts[1]);
  if (parts[0] === "characters" && parts.length === 3 && /^[a-z-]+$/.test(parts[1]) && ["sprite.png", "meta.json"].includes(parts[2])) return path.join(CHARS, parts[1], parts[2]);
  return null;
}
