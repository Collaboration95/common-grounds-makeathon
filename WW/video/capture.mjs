// Puppets the live site and saves authentic screenshots to ./assets/site-*.png
import { chromium } from 'playwright';
const URL = 'https://naples-worked-dining-city.trycloudflare.com/';
const [vw, vh, tag] = process.argv.slice(2).length ? [+process.argv[2], +process.argv[3], process.argv[4]] : [1600, 1000, 'land'];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
const shot = async name => { await p.screenshot({ path: `assets/site-${tag}-${name}.png` }); console.log('saved', name); };
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
await shot('wall');
const games = await p.evaluate(() => fetch('/api/games').then(r => r.json()));
async function play(id, wrongId) {
  const g = games.find(g => g.id === id);
  await p.locator('.tile').filter({ hasText: g.title }).click({ force: true });
  await p.waitForTimeout(2500);
  await shot(`${id}-game`);
  const box = await p.locator('#stage').boundingBox();
  const at = c => ({ x: box.x + c.x * box.width, y: box.y + (c.y - c.h * 0.5) * box.height });
  const wrong = g.characters.find(c => c.id === wrongId);
  const w = at(wrong);
  await p.mouse.move(w.x, w.y); await p.waitForTimeout(400); await shot(`${id}-loupe`);
  await p.mouse.click(w.x, w.y); await p.waitForTimeout(700); await shot(`${id}-wrong`);
  await p.click('#hint-btn'); await p.waitForTimeout(900); await shot(`${id}-hint`);
  const guest = g.characters.find(c => c.id === g.targetId);
  const gp = at(guest);
  await p.mouse.move(gp.x, gp.y); await p.waitForTimeout(400); await shot(`${id}-loupe-guest`);
  await p.mouse.click(gp.x, gp.y); await p.waitForTimeout(700); await shot(`${id}-found-a`);
  await p.waitForTimeout(1500); await shot(`${id}-found`);
  await p.click('#found-back-btn'); await p.waitForTimeout(1500);
}
await play('codex-hawker-centre', 'c1');
await play('codex-great-hall', 'c5');
await p.click('#create-btn'); await p.waitForTimeout(600);
await p.fill('textarea[name=moment]', 'A Singapore hawker centre at lunch rush');
await p.fill('input[name=guest]', 'Kermit the Frog');
await shot('create');
await b.close();
