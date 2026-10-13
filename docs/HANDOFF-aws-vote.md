# Handoff: The Commons on AWS for the public vote (12 Oct 2026)

Context for whoever picks this up next. How it is hosted, what changed on 12 Oct, and what to watch out for. Secrets (keeper password and path, API key, host key) live only in the server's `~/commons/.env` and pm2 env, never in git.

## Where it runs

- **Box:** AWS Lightsail `commons-vote-host` (`c_xlarge_1_0`, 4 vCPU / 8 GB, Ubuntu 24.04, ap-southeast-1, IP 18.141.231.110). It's in the Rewind AWS account (`AWS_PROFILE=rewind-terraform-apply`), outside Terraform, tagged `project=commons-vote expires=2026-10-15`.
- **SSH:** `ssh ubuntu@18.141.231.110` (key pair `commons-vote` = `~/.ssh/id_ed25519`).
- **App:** in `~/commons`, run by pm2 as `commons` (`npm start`). The pm2 env has `PUBLIC_HOST=1`, `CONCURRENCY=6`, `CODEX_BIN=/usr/bin/codex` and `HOST_KEY`.
- **Server `.env` keys:**
  - `OPENAI_API_KEY`: room-photo redraws only.
  - `ADMIN_PASSWORD` and `ADMIN_PATH`: the hidden keeper page.
  - `MAX_CHARACTERS=24`: one shared room.
  - `CANONICAL_URL`: the CloudFront URL.
  - `VOTE_URL`: the vote card.
  - `CODEX_TIER=fast` and `ANIM_CONCURRENCY=6`.
- **Codex:** signed in with the ChatGPT account (device auth), so pets cost no API money.

## URLs: do not change them

- `https://commons.tailca286e.ts.net` (Tailscale Funnel) is the link in the voting form, which can't be edited any more. Page loads there redirect with a 302 to CloudFront; API calls are not redirected.
- `https://d2agp4q5votfoz.cloudfront.net`: CloudFront `E75EB38XOK6UR`. Its origin is the box on port 8787 (Lightsail firewall open). Caching is disabled and all viewer headers are forwarded. It's the fast path, about 30 ms against about 150 ms through Funnel.
- Vote page: https://thisisshaw-04.github.io/Common-Ground-Makeathon/

## Deploying

1. Check nothing is mid-build: no wish in `commons-world/manifest.json` should be in `screening`, `queued`, `coding` or `testing`.
2. Run `rsync -az server/ public/ tools/` from the repo into `ubuntu@18.141.231.110:commons/<same dir>/`.
3. Run `pm2 restart commons` on the box.
4. Never rsync a local `.env` or `commons-world/` over the server's copies.

The code before 12 Oct night is backed up on the box in `~/commons-backup-20261012-1531`.

## Linux gotchas, already fixed on the box

See `deploy/README.md`:
- the AppArmor userns sysctl for the Codex sandbox
- `/usr/local/bin/sips`, an ImageMagick shim
- `python-is-python3`

## 12 Oct night: sprite and speed fixes

Bugs found in the Codex session logs (`~/.codex/sessions/...`):
- **Wrong picture (a sunglasses dog came out as a kopi cup):** the drawing model saved its image by appending base64 to a shared `/tmp/sheet.b64`, so it decoded an older pet's PNG. The same bug produced a corrupt sheet: "read requests waiting on finished stream".
- **Slow pets:** the model called the image tool 3–6 times per pet because saving kept failing, so a pet took about 3 minutes.
- **Checkerboard in the room:** with no `transparent_background`, the image came back with a painted checkerboard, and the slicer only keyed white.

Fixes, in commits `b609a71`, `7d6fa8b` and `ccfb3f0` on `public-vote`:
- **Drawing (`server/animate.mjs`):** the model calls the image tool exactly once. The server takes the PNG from `~/.codex/generated_images/<thread_id>/` and kills the run. It retries once on a bad sheet. The prompt carries the visitor's own words plus "no extra hats, bags, goggles", because the chosen hat is drawn on top.
- **Slicing (`tools/slice-sheet.mjs`):** keys the border colours (white, a solid colour, a checkerboard, a soft gradient). It rejects a sheet whose background is left in 3 or more cells.
- **Queue (`server/queue.mjs`):** drawing and coding start alongside the screen. A decline stops both; `EARLY_START=0` restores the old order. The screen timeout is now 30 s.
- **Models:** the screen and the code use gpt-6.1-sol (effort low). The drawing uses gpt-6-luna (low). Everything runs on the `fast` tier, which uses more of the ChatGPT plan.
- **Measured:**

  | Setup | Average per pet | Slowest |
  |---|---|---|
  | Before | about 3 min | |
  | Mac, default tier | 52 s | |
  | Mac, fast tier | 46 s | |
  | Mac, Sol drawing on fast | 50 s | |
  | Server, fast tier | 44 s | 51 s |

  Each run was 6 wishes at once.
- **Run log:** `commons-world/runs.jsonl` gets one line per pet with the wish, hat, models, outcome, and `screen`, `sheet` and `build` timings.
- **Keeper page:** thumbnails, a Redraw button per live wished pet, recent runs and a JSONL download. Open screens swap in redrawn frames when `animAt` changes.
- **Live pets redrawn:** `ww3s` (the dog), `w5gn` (the snail), and `wc62`, `wyp9` and `w9e4`, which had no drawing and were paper blobs.

## Testing without touching the live room

```bash
node tools/try-wishes.mjs ["a wish" ...]                                  # local (Mac)
ssh ubuntu@18.141.231.110 'cd ~/commons && CODEX_BIN=/usr/bin/codex node tools/try-wishes.mjs'   # on the box
```

It starts a throwaway server with its own temp world on a free port, prints timings and writes `report.html`. Try other settings through env, e.g. `CODEX_TIER=fast ANIM_MODEL=gpt-6.1-sol`. On the box it leaves `/tmp/commons-try-*`; delete those afterwards.

## Open items

- **Merges:** PR #2 (`public-vote`, the site plus these fixes) and PR #3 (`video-slow-cut`) are not merged yet.
- **Videos:** the slow-cut renders are in `video/out/`. The 230–410 MB `commons-slow-*.mp4` masters are git-ignored because they're too big for GitHub; the `share-commons-slow-*` cuts are committed.
- **Budget:** set an OpenAI budget cap, since room-photo redraws are public and use the API key.
- **Shut down after the vote (about 15 Oct), only when the user says so:**
  1. Disable, then delete, CloudFront `E75EB38XOK6UR`.
  2. Run `aws lightsail delete-instance --instance-name commons-vote-host`.
  3. Run `aws lightsail delete-key-pair --key-pair-name commons-vote`.

  Don't touch `rewind-demo` or `rewind-release`.
