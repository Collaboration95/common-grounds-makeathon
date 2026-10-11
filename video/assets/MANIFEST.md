# Real product footage, The Commons (captured 2026-10-11 from the live server, headless Chrome via CDP)

Clips are h264 / yuv420p / 30 fps CFR mp4 built from timestamped JPEG frame sequences (Page.startScreencast / captureScreenshot JPEG q92; PNG polling only reached 3 fps at 1080p). Frames are kept in `frames/<clip>/` (`timing.json` = per-frame time in seconds; frame sequences are variable-rate, the mp4 holds each frame for its real duration, so mp4 time == real time). Times below are mp4 seconds. Several clips are real-time, so a build runs ~100 s: speed-ramp the dull parts in the edit.

NOTE: `/world?scene=1` is the app's room-only view: the 16:9 room is inset in a 1920x1080 night (#1d1424) frame, room rect approx x184..1737, y103..977 (1553x874). Crop to that rect for full-bleed.

## clips/ (resolution, duration)

### phone-wish.mp4 (780x1688 = 390x844 @2x, 102.5 s; frames/phone-wish; ~15 fps typing & last 4.5 s, ~2 fps during the progress timeline)
Wish "a durian in sunglasses", name "Mei", fresh deviceId (wish #12, id wx3q, PIN 302).
- 0.0 empty form, Wish for one tab
- 1.65-3.48 wish text typed char by char (80 ms/char)
- ~3.9-4.5 name "Mei" typed
- 5.03 tap "Make my wish"; timeline starts (Checking your wish)
- ~6.5 "In the queue" / mini view shows scaffold "#12 Mei testing + drawing"
- 13.1 "Codex is writing it" (status coding)
- 42.7 "Testing it" (+ "Drawing it" in parallel)
- 97.99 server status Live (phone card flips within ~0-2 s): "Too Cool Durian is live!", "Built by Codex in 34s", Poke it
- 98.0-102.5 live card at 15 fps, durian in the mini view with the "yours" marker
- Codex-reported build time on the card: 34 s of code; the sprite sheet took until t=98 s (draw ~90 s this run).

### phone-wish-pet.mp4 (780x1688, 4.07 s, 15 fps; frames/phone-wish-pet)
Same wish (wx3q) reopened with its saved localStorage; smooth-scrolls so the live card and "Your pet #12 PIN 302" panel are centred (scroll runs 1.0-3.0 s). Still: stills/phone-durian-pet-panel.png.

### world-arrival.mp4 (1920x1080, 101.0 s; frames/world-arrival; 4 fps build, 20 fps from t=92.4 to 100.9)
`/world?scene=1`, void deck scene, Oyen/Kopi + 8 others on screen. t=0 is 1 s before the submit.
- 0.96 phone submits; scaffold + progress ring + tag "#12 Mei" appears (~2 s later; screening)
- 9.0 coding, 38.7 testing (tag reads "testing + drawing...")
- ~93.9 last scaffold frame; 94.0 scaffold vanishes, dust puffs
- 94.3 durian falls in (squash and drop), 94.4 lands with dust
- 94.8 credit tag fades in ("Too Cool Durian"); ~95.1 it flies/walks off. Keep playing to 100.9 (it wanders).
- NB: others on screen show a "building The Commons" status tag and rain from an earlier mood test (pet #8/#9 state).

### world-rail.mp4 (1920x1080, 101.0 s, ~4 fps; frames/world-rail)
Bonus: `/world` full (not scene=1) so the Codex workbench log rail + QR card are visible. Same clock as world-arrival (arrival drop at ~94.3 s, rail lines "wrote thing.js", "check -> passed", "LIVE: Too Cool Durian (built by Codex in 34s)" appear at ~9, ~37 and ~94 s). Log text itself is in stills/durian-log.json.

### world-scene-swap.mp4 (1920x1080, 8.0 s, 20 fps; frames/world-scene-swap)
Void deck -> venue redraw (scene ra27a77, "Sunset Commons") via POST /api/host/scene/ra27a77/apply.
- 0-1.44 void deck
- 1.44 apply sent; crossfade 1.5-3.0 s; creatures re-clamp/hop; by 3.5 s fully the venue room; 3.5-8.0 creatures wander in the venue

### world-venue.mp4 (1920x1080, 4.0 s, 20 fps; frames/world-venue)
Venue room alive (continuation of the swap, ~0.1 s gap), speech bubbles, 10 creatures.

### phone-pet.mp4 (780x1688, 55.3 s, ~15 fps; frames/phone-pet) and world-moods.mp4 (1920x1080, 55.3 s, 15 fps; frames/world-moods)
Same clock, recorded simultaneously (venue scene on the projector). Fresh deviceId; preset Karung Guni Radio + Crown, name "Mei", pet #13, PIN 196.
- 0.9 tap "Pick one"; 2.5 tap Surprise me (picks Karung Guni Radio); 5.3 choose Crown hat; 7.4 type name; 8.15 tap "Put Karung Guni Radio in the room"
- 8.2-19.8 waiting (live card + radio appears on the projector; ~11 s lag for the pet card to appear this run, cut it)
- 19.9 pet card scrolled into view with "Your pet #13 PIN 196"; 22.1 status typed "shipping The Commons"; 23.9 Set; the status tag shows above the pet on the projector ~24.5-30
- 30.3 Moody (rain around the pet on projector from ~31 s)
- 36.8 Sleep (zzz; pet naps from ~37.5)
- 43.2 Normal; 45.7 scroll to Poke; 46.9 Poke (special-attack burst; speech bubble "Krrrsh! That's my tickle frequency!"-style reaction); 50.2 poke #2; ends 55.3
Stills at each step: stills/phone-pet-01-pick-tab ... 09-poke.png (780x1688 PNG).
Caveat: with a 10-creature room the pet is small on the projector; crop to the pet when the edit uses it.

## stills/
- durian-frames.png (3480x260, 12 cells of 290x260, transparent), durian-anim.json (walk 0-3, fly 4-7, idle 8, sit 9, sleep 10, action 11), durian-thing.js (the Codex-written behaviour, 91 lines), durian-sprite.png, durian-sheet.png (source 4x3 sheet from anim-work/sheet.png)
- durian-log.json: wish stats (buildMs 34264, 1 turn, 2 check runs, 0 fails) + status transitions + the Codex log lines for wish #12
- venue-photo.jpg (reference/venue-photo-2026-10-11.jpg), venue-redraw.png (scene ra27a77 background, 1600x900), voiddeck.png (public/assets/background.png)
- phone-pet-01..09 + phone-durian-pet-panel.png (780x1688), join-qr.png (1080x1920; note card is rotated/cropped by the page layout, QR shows localhost:8787), gallery.png (1600x1000)
- 01..13 *.png copied from docs/screens, sprites/*.png (12-frame strips of the 8 characters)

## frames/
JPEG frame sequences for every clip (+ timing.json). ~1 GB total, mostly the 1080p world clips.

## Notes
- An earlier take had a failed sprite ("paper blob"); discarded. This take (wx3q) has a real Codex-drawn sheet. Earlier failed/second-take durians (wpbk, wrqo) were vetoed from the live world.
- The world was left on the venue scene (ra27a77), 10 live characters. Reset with POST /api/host/scene/reset if the void deck is wanted.
