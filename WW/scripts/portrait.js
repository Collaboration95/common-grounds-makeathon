// Re-lift the guest's portrait from a painted-in game's scene: `node scripts/portrait.js <gameId>`.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { liftPortrait } from '../lib/insert.js';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}

for (const id of process.argv.slice(2)) {
  const file = new URL(`../data/games/${id}.json`, import.meta.url);
  const game = JSON.parse(await readFile(file, 'utf8'));
  const guest = game.characters.find(c => c.id === game.targetId);
  const scene = sharp(new URL(`..${game.bg.src}`, import.meta.url).pathname);
  const { width: W, height: H } = await scene.metadata();
  const ph = guest.h * H, S = Math.round(Math.min(Math.max(ph * 1.6, 160), W, H));
  const left = Math.round(Math.min(Math.max(guest.x * W - S / 2, 0), W - S));
  const top = Math.round(Math.min(Math.max(guest.y * H - S * 0.9, 0), H - S));
  const crop = await scene.extract({ left, top, width: S, height: S }).resize(1024, 1024, { kernel: 'nearest' }).png().toBuffer();
  const look = game.plan?.guest?.look ?? guest.name;
  const png = await liftPortrait(crop, { look }, process.env.SPRITE_QUALITY || 'low');
  const name = `${id}-portrait-${Date.now().toString(36)}.png`;
  await writeFile(new URL(`../data/assets/${name}`, import.meta.url), png);
  guest.portrait = `/data/assets/${name}`;
  await writeFile(file, JSON.stringify(game, null, 2));
  console.log(`✓ ${guest.name}: ${guest.portrait}`);
}
