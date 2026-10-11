// Repaint the cast of existing games straight into their cached background (no new background):
// `npm run repaint -- <gameId> [<gameId>...]`. Needs the game's saved plan.
import { readFile, writeFile } from 'node:fs/promises';
import { findSpots, paintIntoScene } from '../lib/generate.js';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}

await Promise.all(process.argv.slice(2).map(async id => {
  const file = new URL(`../data/games/${id}.json`, import.meta.url);
  const game = JSON.parse(await readFile(file, 'utf8'));
  if (!game.plan) return console.error(`✗ ${id}: no saved plan to repaint from`);
  const base = game.bg.base ?? game.bg.src;
  const cast = [{ ...game.plan.guest, role: 'guest' }, ...game.plan.residents.slice(0, 4).map(r => ({ ...r, role: 'resident' }))];
  try {
    if (!game.spots?.[0]?.action) game.spots = await findSpots(base);
    const { scene, ...play } = await paintIntoScene({ id: `${id}-v${Date.now().toString(36)}`, bgFile: base, cast, spots: game.spots, onStage: s => console.log(`[${id}] ${s}`) });
    Object.assign(game, play, { bg: { ...game.bg, src: scene, base } });
    await writeFile(file, JSON.stringify(game, null, 2));
    console.log(`✓ ${game.title}: ${game.characters.length} characters painted in`);
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`);
  }
}));
