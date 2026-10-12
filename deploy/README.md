# Hosting The Commons on a Linux box

How The Commons ran for the three-day public vote: one Ubuntu 24.04 VM in Singapore (AWS Lightsail, 4 vCPU / 8 GB). Pets are still built by the Codex CLI on a ChatGPT login; only room-photo redraws use `OPENAI_API_KEY`.

## Setup

```bash
# Node 24, Codex CLI, pm2, ImageMagick, python alias
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs imagemagick python-is-python3
sudo npm i -g @openai/codex pm2
codex login --device-auth            # approve in the browser with the ChatGPT account

# Ubuntu 24.04 blocks the user namespaces Codex's sandbox needs
echo kernel.apparmor_restrict_unprivileged_userns=0 | sudo tee /etc/sysctl.d/60-codex-userns.conf
sudo sysctl --system

# the server shells out to macOS `sips`; this ImageMagick shim covers the calls it makes
sudo install -m 755 deploy/sips /usr/local/bin/sips

# copy the repo plus commons-world/ (the live pets), then
npm ci --omit=dev
CODEX_BIN=/usr/bin/codex pm2 start npm --name commons -- start
pm2 save && pm2 startup
```

## Settings (`.env` on the server)

| Variable | What it does |
| --- | --- |
| `OPENAI_API_KEY` | Room-photo redraws only |
| `HOST_KEY` | Fallback host key |
| `PUBLIC_HOST=1` | Anyone can change the room (online vote) |
| `CONCURRENCY` | Codex builds at once (default 3) |
| `ANIM_CONCURRENCY` | Sprite sheets drawn at once (default 3) |
| `CODEX_TIER=fast` | Priority processing for every Codex call (uses more of the ChatGPT plan) |
| `ANIM_MODEL`, `ANIM_EFFORT` | Model that calls the image tool (default `gpt-6-luna`, `low`) |
| `EARLY_START=0` | Wait for the screen before drawing and coding (default: all three run side by side) |
| `MAX_CHARACTERS` | Pets per room before a new room opens (default 10) |
| `ADMIN_PASSWORD`, `ADMIN_PATH` | Turn on the hidden keeper page at `ADMIN_PATH` (remove pets, merge or clear rooms) |
| `CANONICAL_URL` | Page loads on a `*.ts.net` host redirect here |
| `VOTE_URL` | Shows the "Vote for The Commons" card |

## Public URL

- Tailscale Funnel (`tailscale funnel --bg 8787`) gives a permanent `https://<machine>.<tailnet>.ts.net` link for free. It went into the voting form.
- Funnel's ingress was about 80 ms away, so each request cost about 150 ms. A CloudFront distribution in front of the box (origin on port 8787, caching disabled, all viewer headers forwarded) brought that to about 30 ms. `CANONICAL_URL` sends Funnel visitors there.

## Run log and test runs

- Every pet adds a line to `commons-world/runs.jsonl` when it goes live, is declined, fails or is removed: the wish, the hat, the models, and how long the screen, the drawing and the coding took. The keeper page shows the latest runs and downloads the whole file.
- `node tools/try-wishes.mjs ["a wish" ...]` runs wishes end to end on a throwaway server (its own temp world, a free port), then prints the timings and writes `report.html` with every pet's frames. It never touches the live room, so it is safe to run on the box.
