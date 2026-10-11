// Re-hide the characters of existing games without repainting anything: `npm run rehide -- <gameId> [--fresh-spots]`.
// Standing spots are cached in the game file; --fresh-spots asks the vision model again.
import { readFile, writeFile } from 'node:fs/promises';
import { findSpots, placeCast } from '../lib/generate.js';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch {}
const fresh = process.argv.includes('--fresh-spots');

for (const id of process.argv.slice(2).filter(a => !a.startsWith('--'))) {
  const file = new URL(`../data/games/${id}.json`, import.meta.url);
  const game = JSON.parse(await readFile(file, 'utf8'));
  if (fresh || !game.spots?.length) game.spots = await findSpots(game.bg.src);
  const cast = [...game.characters].sort((a, b) => (b.id === game.targetId) - (a.id === game.targetId));
  Object.assign(game, placeCast(cast, game.spots));
  await writeFile(file, JSON.stringify(game, null, 2));
  console.log(`✓ ${game.title}: ${game.spots.length} spots, guest ${game.hint.text || 'placed at random'}`);
}
