import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from './lib/generate.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const PORT = Number(process.env.PORT || 5173);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const jobs = new Map();

async function listGames() {
  const dir = path.join(ROOT, 'data/games');
  const files = (await readdir(dir).catch(() => [])).filter(f => f.endsWith('.json'));
  const games = await Promise.all(files.map(async f => JSON.parse(await readFile(path.join(dir, f), 'utf8'))));
  return games.sort((a, b) => a.createdAt - b.createdAt);
}

function send(res, code, body, headers = {}) {
  const json = !Buffer.isBuffer(body) && typeof body !== 'string';
  res.writeHead(code, { 'content-type': json ? 'application/json' : 'text/plain', ...headers });
  res.end(json ? JSON.stringify(body) : body);
}

async function api(req, res, url) {
  if (url.pathname === '/api/games' && req.method === 'GET') return send(res, 200, await listGames());
  if (url.pathname === '/api/games' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const { moment = '', guest = '' } = JSON.parse(raw || '{}');
    if (!moment.trim() || !guest.trim()) return send(res, 400, { error: 'Tell me the moment and who is hiding.' });
    const job = { id: crypto.randomUUID().slice(0, 8), status: 'working', stage: 'Writing the scene' };
    jobs.set(job.id, job);
    createGame({ moment: moment.trim().slice(0, 300), guest: guest.trim().slice(0, 120) }, stage => { job.stage = stage; })
      .then(game => Object.assign(job, { status: 'done', gameId: game.id }))
      .catch(err => { console.error(err); Object.assign(job, { status: 'failed', error: err.message }); });
    return send(res, 202, job);
  }
  const jobMatch = url.pathname.match(/^\/api\/jobs\/([\w-]+)$/);
  if (jobMatch && jobs.has(jobMatch[1])) return send(res, 200, jobs.get(jobMatch[1]));
  return send(res, 404, { error: 'Not found' });
}

async function staticFile(res, url) {
  const isData = url.pathname.startsWith('/data/');
  const base = path.join(ROOT, isData ? 'data' : 'public');
  const rel = isData ? url.pathname.slice('/data'.length) : url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(base, decodeURIComponent(rel));
  if (!file.startsWith(base + path.sep)) return send(res, 403, 'Forbidden');
  // Generated assets get unique names, so browsers can cache them forever.
  const cache = url.pathname.startsWith('/data/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
  send(res, 200, await readFile(file), { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': cache });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    await (url.pathname.startsWith('/api/') ? api(req, res, url) : staticFile(res, url));
  } catch (err) {
    if (err.code === 'ENOENT') return send(res, 404, 'Not found');
    console.error(err);
    send(res, 500, { error: err.message });
  }
}).listen(PORT, () => console.log(`Wes Waldo on http://localhost:${PORT}`));
