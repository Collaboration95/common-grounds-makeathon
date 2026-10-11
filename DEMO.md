# DEMO.md: handoff for the demo video and submission of "The Commons"

You know nothing about this project; this file is enough. Do not edit code. Do not restart the live server. Do not commit (the owner does).

## 1. Event and goal

| Item | Value |
| --- | --- |
| Event | Common Ground Makeathon, Singapore, Sun 11 Oct 2026 (9:00-17:00 SGT) |
| Track | Design x Tech |
| Targets | People's Choice: Design x Tech (voted, "biggest impression on the room") and **Best Use of Codex** ("pushes Codex beyond the obvious and makes it essential to their build") |
| Presentations | about 16:00 (format/length, submission method: UNKNOWN, see `reference/hackathon.md`; safe default = working demo + link/repo + 1-2 min pitch) |
| Prize slide / venue photo | `reference/prizes-slide-2026-10-11.jpg`, `reference/venue-photo-2026-10-11.jpg` |

**One-liner:** The room builds itself.

**Pitch:** Everyone in the room scans a QR code and wishes for a creature, picks one, or sketches one. A local Codex agent writes the creature's code, tests it, and draws its sprite sheet. It then walks into a shared scene of the actual room, credited to the person who made it. None of these creatures was hand-coded; Codex built each one while you watched.

**Honest framing:** precedents are Scribblenauts (type a noun) and r/place (crowd canvas). What is new is that every object is real code written live by a coding agent and checked before admission. Do not claim "first" or "will win".

## 2. How it is run (already running; do not restart)

```
HOST_KEY=commons-host npm start          # port 8787
cloudflared tunnel --url http://localhost:8787
caffeinate -dis                          # keep the Mac awake
```

- Quick-tunnel URL **changes on every cloudflared restart**. Current one is in `/tmp/commons-tunnel.log`: **https://drawn-tourist-travel-freedom.trycloudflare.com** (re-check with `grep -o "https://[a-z-]*\.trycloudflare.com" /tmp/commons-tunnel.log | tail -1`).
- The server derives public links and QR codes from the request host, so the QR shown on a page always matches the URL you opened it from. Open pages via the tunnel URL if you want phone-scannable QR codes in screenshots; open via localhost for the projector.
- The tunnel buffers SSE, so clients **poll `/api/world` every 2s** (the server also pads SSE events). Expect up to ~2s lag.
- **Projector/screen recording: use http://localhost:8787/world** (fastest, no tunnel).
- Data lives in `commons-world/` (git-ignored); restart restores the world.

## 3. Pages

| URL | Audience | What it shows / does |
| --- | --- | --- |
| `/` | anyone | Intro "The Commons: a room that builds itself". **Create a room** (name -> 4-char room code + host QR; the code is your host key) or **I have a room code** |
| `/world` | projector | 16:9 shared scene, the creatures, scaffolds with progress rings for builds in progress, credit tags ("{name} wished by {who}, built by Codex in {s}s"), Codex workbench log rail, counter footer, QR card. Keys: **T** timelapse (~12s replay of arrivals), **V** veto hovered creature, **Q** toggle QR card, **F** or the **⛶** button = room-only fullscreen (hides QR + rail), `?scene=1` opens already room-only |
| `/join-qr` | projector | Big full-screen join QR ("Add one thing to the Commons") pointing at `/wish` |
| `/wish` | phone | Heading "Add one thing to the Commons." Tabs **Wish for one** (Codex builds it), **Pick one** (6 presets, instant), **Sketch one** (short line -> drawn sheet + generic behaviour). **Surprise me** button, 6 hats, name field (max 20 chars). After submit: live status timeline, then mini view + **Poke it**. Also a name -> 3-digit **PIN**; **Control my pet** (pet # + PIN) sets a status line (60 chars, shown above the pet) and mood **Normal / Sleep / Moody** |
| `/host?k=<room code or commons-host>` | phone/laptop | Change the room: take/upload photo -> gpt-image redraw -> local Codex maps floor/air/ceiling/spots -> overlay with sliders (floor back/front, ceiling) -> **Use this room**; **Back to the void deck** resets. Host key accepted: the room code or `commons-host` |
| `/gallery` | anyone | All characters (residents + presets) with animation strips |
| `/console` | **localhost only** (blocked via tunnel) | Presenter console: type a wish as admin (skips device limit, still screened), recent wishes with veto buttons, host link |

Other: `/qr?u=/path` (QR for any path), `/api/world`, `/api/presets`.

## 4. Pipelines and timings (measured)

| Path | What happens | Time |
| --- | --- | --- |
| **Wish** | local Codex screening (`gpt-6.1-sol`, ~7s) -> Codex `gpt-6.1-sol` writes `thing.js` and must pass `tools/check-thing.mjs` (~30s; server re-checks, one fix turn max) -> Codex `gpt-6-luna` draws the 4x3 sprite sheet (~60s, in parallel) | **live in ~65s** |
| **Pick** | copy a preset (6 characters, 6 hats) | instant |
| **Sketch** | screening + `gpt-6-luna` sheet + `template/generic/thing.js` | ~85s |
| **Room photo** | image edit redraw (~17s) + Codex scene mapping (~15s) | ~30s |

- The **only** use of the OpenAI API key is the room-photo image edit. Everything else (screening, code, sprite sheets, scene mapping) runs on the **local Codex CLI with the ChatGPT login** (`gpt-6.1-sol` at low effort for text/code; `gpt-6-luna` for images).
- Concurrency: 3 builds at once; wish queue flood guard at 40 pending.
- Style: high-detail pixel sprites ("Octopath / Celeste HD").

## 5. Unified action map and contract v2

- Every character shares one **4x3 sprite sheet** (1536x1024, transparent): cells 1-4 walk, 5-8 fly, 9 idle, 10 sit, 11 sleep, 12 action (special burst). `tools/slice-sheet.mjs` produces `frames.png` + `anim.json` (`frameW`, `frameH`, `count: 12`, `anims: {walk:[0-3], fly:[4-7], idle:[8], sit:[9], sleep:[10], action:[11]}`). Spec: `template/ACTION_MAP.md`.
- **Contract v2** (`template/CONTRACT.md`): Codex writes only behaviour, in a single `export default {name, tags, zone: "ground"|"air", size, init, update, onPoke, onMeet, onSignal}`, max 6KB, no imports. Creatures move in depth (`world.steer`), use spots (`world.goTo`: stools, tables, perches), react to neighbours via tags, `onMeet`, `me.signal`. Forbidden APIs (fetch, eval, Math.random, timers, etc.) are rejected by the checker, which also simulates 600 ticks. A creature that throws is quarantined ("resting...") and a broken one never goes live.
- **Cap of 10** characters on screen: the 11th arrival makes the oldest (except the founder) say "bye!" and walk off.
- **Pet controls:** PIN/status/mood (see `/wish`); mood Sleep makes the pet nap and emit zzz; Moody slows it.
- **Residents:** Oyen (orange void-deck cat, ground) and Kopi (mynah, air; steals hats).
- **Presets (6):** Kaya Turtle, Bishan Otter, Auntie's Trolley, Kachang Yeti, Merlion Pup, Karung Guni Radio. Hats: party, songkok, caping, crown, chef, bucket.

## 6. The scene for the video: the real room

- The venue photo is `reference/venue-photo-2026-10-11.jpg`. **For the video, upload it via `/host` so the world is this real room.** Frame it as "the camera input of the future": point any phone at any room and it becomes the shared world.
- Fallback / default: the original HDB void deck (`public/scenes/voiddeck`). Use "Back to the void deck" on `/host` to restore it.
- Host steps: open `/host?k=commons-host` (or with the room code), choose the photo, wait for "redrawing" -> "mapping" -> review overlay (check floor trapezoid fits the floor; nudge sliders), press **Use this room**. `/world` crossfades (~1.5s) and creatures re-clamp with a hop.
- If the photo lives on the laptop only, transfer it to the device you use for `/host`, or open `/host` in the laptop browser and use the file picker.

## 7. Screenshots

All in `docs/screens/` (taken 11 Oct ~14:45; QR panels show `localhost:8787`, so retake those over the tunnel URL if the video needs a scannable QR).

| File | Shows |
| --- | --- |
| `01-intro.png` | `/` intro (desktop) |
| `02-intro-room-created.png` | room "Common Ground Makeathon", code EV4D, host QR panel |
| `03-world.png` | `/world` projector with characters, QR card and Codex rail (1920x1080) |
| `04-world-room-only.png` | `/world?scene=1` room-only mode |
| `05-join-qr.png` | `/join-qr` big join QR |
| `06-wish-wish-tab.png` | phone: Wish for one tab |
| `07-wish-pick-tab.png` | phone: Pick one tab with hat selected |
| `08-wish-sketch-tab.png` | phone: Sketch one tab (gpt-6-luna) |
| `09-wish-pet-panel.png` | phone: your pet, PIN, status "demo time!", moods |
| `10-wish-control-my-pet.png` | phone: control my pet with # + PIN |
| `11-host.png` | phone: host photo upload |
| `12-gallery.png` | `/gallery` (preset cards currently show static sprites only) |
| `13-console.png` | `/console` presenter view (localhost only) |
| `sprites/<id>.png` | full 12-frame animation strip for each of the 8 characters |

Not captured yet: a wish mid-build (scaffold + Codex log lines), the arrival credit tag, and the host review overlay. Take these live while recording.

## 8. 90-second demo video: shot list and voiceover

Pre-flight (do 5 min before): confirm `/world` loads on localhost; upload the venue photo via `/host` and press Use this room; make sure under 10 characters are live (so nothing departs mid-take); open `/wish` on a phone through the tunnel URL; have a screen recording (macOS Cmd+Shift+5) ready. Record `/world` with `F` room-only for hero shots.

| Time | Show | Voiceover |
| --- | --- | --- |
| 0:00-0:08 | `/world` room-only, real venue room, Oyen and Kopi wandering | "This is the room we are standing in. It is empty, until you build it." |
| 0:08-0:16 | Phone scans the `/join-qr` code, `/wish` opens | "Everyone scans one QR code. No app, no account." |
| 0:16-0:30 | Type the live wish (below), submit, show timeline on phone; cut to `/world` showing the scaffold + progress ring + Codex log lines ("wrote thing.js", "check -> passed") | "I describe a creature in one sentence. A local Codex agent screens it, writes its program, runs a test suite against it, and fixes it if it fails." |
| 0:30-0:45 | Meanwhile on the phone: Pick tab, choose Merlion Pup + a hat, place (instant) and Surprise me | "Don't want to wait? Pick one of six, put a hat on it. Or sketch your own." |
| 0:45-0:58 | Wished creature drops in with squash and stretch, credit tag "built by Codex in ~65s"; creature walks, sits on a spot, reacts to Oyen | "Sixty-five seconds later it lands in the room, credited to me. Codex drew the sprite sheet, walk, fly, sit, sleep, special move. Every creature is real code." |
| 0:58-1:08 | Poke it on phone; creature reacts on the projector. Pet control: set status "hungry" and mood Sleep -> zzz | "It's mine: I can poke it, set a status, put it to sleep." |
| 1:08-1:18 | Press `T`: timelapse of arrivals; mention cap of 10 / someone says bye | "Ten live at a time; the oldest waves goodbye. Press T and watch the room build itself." |
| 1:18-1:30 | `/host`: photo -> redraw -> overlay -> Use this room (pre-recorded/cut), then title card | "And the room itself comes from a phone photo. Point a camera at any room and it becomes the shared world. The Commons: the room builds itself." |

**Live wish to type:** `a hawker auntie dragon that serves tiny teapots` (any single, friendly, concrete creature works; keep it one thing, under 120 chars, no brands/people/politics or it is declined). Backup wish already tested-style: `a sleepy snail with a lantern`. Because the build takes ~65s, start it first and cut/speed-ramp the wait; do not wait on camera.

**What to say about Codex (the key message):** "Codex isn't just how we built the app; it is the engine running at demo time. For every wish it screens the request, writes the creature's program under a safety contract, runs an automated checker and repairs failures, then draws the sprite sheet and maps the room from a photo. Take Codex away and the project does not exist."

## 9. Best Use of Codex: evidence list

1. Codex runs **at runtime**, not only at build time: each wish spawns a Codex thread (`@openai/codex-sdk`, `gpt-6.1-sol`) that writes `thing.js` in a sandbox (workspace-write, no network).
2. Codex **tests itself**: it runs `tools/check-thing.mjs` (static ban list + 600-tick simulation); the server re-runs the check and sends one repair turn on failure; only passing code goes live.
3. Codex **screens** wishes (structured output) and **maps rooms**: reads a redrawn photo and returns floor/air/ceiling/spots as a JSON schema.
4. Codex **draws**: `gpt-6-luna` via Codex produces the 4x3 unified action-map sprite sheets (walk/fly/idle/sit/sleep/action).
5. Live **workbench rail** on `/world` streams Codex's events (wrote thing.js, check -> passed/errors).
6. Everything except one image edit runs on the local Codex CLI via ChatGPT login; the API key is used only for the room-photo redraw.
7. Credit tags on screen: "built by Codex in N s". `T` timelapse shows the room accumulating Codex-built creatures.
8. Safety: sandboxed, no network, forbidden-API checker, quarantine of throwing creatures, presenter veto (`V`), 10-character cap.
9. Don't claim Codex built the app. The app code was written with Claude Code agents. Codex is the runtime engine: it writes, tests and draws every creature, screens wishes, maps rooms and drew the preset art and sprite sheets.

## 10. Known limitations / gotchas

- Quick-tunnel URL changes on every cloudflared restart: old QR/links die. Re-read `/tmp/commons-tunnel.log`. Don't restart cloudflared or the server during the demo.
- Tunnel buffers SSE; phones poll every 2s, so there is lag. Use localhost for the projector.
- Names: person name max **20 chars**; creature name derived/truncated at **24 chars**; wish text 3-120 chars; Sketch 60; pet status 60; room name 40.
- Host key is `commons-host` (the env var set at start) or the 4-char room code, whichever you have. `/console` and `/api/admin/*` work only from real localhost (any tunnel header blocks them).
- One active creature per device; max 2 declined tries per device. Use a different browser/incognito or `/console` for repeat takes.
- Cap of 10: pre-existing creatures may be departing; the founder never leaves.
- Declined wishes: sexual, hate, gore, real people (including attendees), politics, brand logos, multiple things, meta-requests.
- Builds take ~65-85s; 3 concurrent. Many simultaneous wishes queue.
- The gpt-image room redraw is the only paid API call; if the key or the image model fails the photo flow errors (scene falls back to `gpt-image-2`).
- **Don't on stage:** restart server or tunnel; open `/console` through the tunnel; wish for a real person/brand; veto by accident (`V` acts on the hovered creature); press `F` in dev-looking windows; submit a photo with faces you don't want on screen (people are redrawn as cartoon figures but check the result).
- Tools like `N`/`D`/`S` keys on `/world` are dev-only and do nothing in production.
