// Pre-generate games for the wall. `npm run seed` does all of seeds.json; `npm run seed -- 0 3` does entries 0 and 3.
import { readFile } from 'node:fs/promises';
import { createGame } from './lib/generate.js';

try { process.loadEnvFile(new URL('.env', import.meta.url)); } catch {}
const seeds = JSON.parse(await readFile(new URL('seeds.json', import.meta.url), 'utf8'));
const picks = process.argv.slice(2).map(Number);
const queue = picks.length ? picks.map(i => seeds[i]).filter(Boolean) : [...seeds];

async function worker() {
  for (let seed; (seed = queue.shift()); ) {
    const started = Date.now();
    try {
      const game = await createGame(seed, stage => console.log(`[${seed.guest}] ${stage}`));
      console.log(`✓ ${game.title} — ${game.characters.length} characters, ${Math.round((Date.now() - started) / 1000)}s`);
    } catch (err) {
      console.error(`✗ ${seed.guest} @ ${seed.moment}: ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: Number(process.env.SEED_CONCURRENCY || 2) }, worker));
