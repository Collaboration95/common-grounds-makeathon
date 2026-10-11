// Placeholder worlds so the UI works before the API key is in. Real games hide these automatically.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA = fileURLToPath(new URL('../data/', import.meta.url));
await mkdir(`${DATA}assets`, { recursive: true });
await mkdir(`${DATA}games`, { recursive: true });

const rand = (a, b) => a + Math.random() * (b - a);
const colours = ['#d8432f', '#2f6fd8', '#f2b632', '#3aa357', '#8a4fd8', '#e87fb0', '#f7f2e8', '#333'];

function background(hue) {
  let crowd = '';
  for (let i = 0; i < 700; i++) {
    const y = rand(330, 1000), s = 6 + (y / 1000) * 10, x = rand(0, 1536);
    crowd += `<rect x="${x - s / 2}" y="${y}" width="${s}" height="${s * 1.4}" fill="${colours[i % colours.length]}"/><rect x="${x - s / 3}" y="${y - s * 0.7}" width="${s * 0.66}" height="${s * 0.66}" fill="#e0b48a"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" shape-rendering="crispEdges">
<rect width="1536" height="1024" fill="hsl(${hue} 45% 62%)"/>
<rect y="300" width="1536" height="724" fill="hsl(${hue + 30} 35% 42%)"/>
${[360, 520, 680, 840].map(y => `<rect y="${y}" width="1536" height="12" fill="hsl(${hue} 25% 25%)"/>`).join('')}
${crowd}</svg>`;
}

function person(colour, hat) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" shape-rendering="crispEdges">
<rect x="432" y="560" width="64" height="300" fill="#2b2b2b"/><rect x="528" y="560" width="64" height="300" fill="#2b2b2b"/>
<rect x="400" y="320" width="224" height="280" fill="${colour}"/>
<rect x="432" y="160" width="160" height="160" fill="#e0b48a"/>
<rect x="470" y="220" width="20" height="20" fill="#000"/><rect x="534" y="220" width="20" height="20" fill="#000"/>
${hat ? `<rect x="400" y="120" width="224" height="48" fill="${hat}"/><rect x="448" y="40" width="128" height="96" fill="${hat}"/>` : ''}
</svg>`;
}

const worlds = [['Placeholder Stadium', 210], ['Placeholder Party', 120], ['Placeholder Cantina', 30], ['Placeholder Hall', 280]];
for (const [i, [title, hue]] of worlds.entries()) {
  const id = `placeholder-${i}`;
  await writeFile(`${DATA}assets/${id}-bg.svg`, background(hue));
  const cast = ['Mystery Guest', 'Resident A', 'Resident B', 'Resident C', 'Resident D'];
  const characters = [];
  for (const [j, name] of cast.entries()) {
    await writeFile(`${DATA}assets/${id}-c${j}.svg`, person(colours[(i + j) % 6], j === 0 ? '#111' : null));
    const y = 0.45 + j * 0.1, h = 0.075 + ((y - 0.4) / 0.54) * 0.045;
    characters.push({
      id: `c${j}`, name, role: j ? 'resident' : 'guest', sprite: `/data/assets/${id}-c${j}.svg`,
      quips: ['Lovely day for it.', 'Have we met?', 'Mind the queue.'],
      line: j ? 'Not me, friend.' : 'You found me! Took your time.',
      move: ['hop', 'nod', 'shake', 'wave', 'tilt'][j], x: rand(0.1, 0.9), y, h,
    });
  }
  const g = characters[0];
  await writeFile(`${DATA}games/${id}.json`, JSON.stringify({
    id, placeholder: true, createdAt: i, moment: title, title, world: title,
    story: 'A placeholder world. Add your API key and run the seeds to paint real ones.',
    bg: { src: `/data/assets/${id}-bg.svg`, w: 1536, h: 1024 }, targetId: 'c0', characters,
    hint: { x: Math.max(0, Math.min(g.x - 0.2, 0.6)), y: Math.max(0, Math.min(g.y - 0.3, 0.58)), w: 0.4, h: 0.42 },
  }, null, 2));
}
console.log(`Wrote ${worlds.length} placeholder worlds to data/`);
