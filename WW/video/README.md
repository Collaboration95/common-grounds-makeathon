# Who's Hiding? — 21 s promo

Final videos are in `out/`: `whos-hiding-portrait.mp4` (1080×1920, main), `whos-hiding-square.mp4` (1080×1080) and `whos-hiding-landscape.mp4` (1920×1080). All three use the same timeline and soundtrack. Contact sheets are `out/contact-*.png`.

## Concept: "Can you find him?"

The video is a challenge, not an ad. It opens on a crowded hawker centre and asks "CAN YOU FIND KERMIT?", then counts down 3-2-1 so viewers pause and search. The game's own magnifier then plays it out: a wrong guess (Phua Chu Kang: "Not me lah! See the yellow boots?"), then the find, where Kermit pops out as a sticker under the world's real title, *It's Not Easy Being Mee*. The loupe ring blows open into the Great Hall and the round repeats faster: an eighth-note countdown, Snape's "Your powers of observation remain pitiful.", a whip pan, and Shrek found behind a Hufflepuff (*An Ogre Gets Sorted*). The camera then pulls back to the whole wall of worlds, using the site's tagline and suspects strip. The create dialog types a real prompt that was used on the site. The end card is the site's Loki-style logo, with each letter cut from a different world in that world's typeface. It shows the repo QR, and Kermit peeks out from behind the QR code ("psst."): someone is hiding on the end card too.

- **Look:** everything is lifted from the product. Pixel-art worlds, the paper/ink/red palette and chunky bordered panels from `public/style.css`, and the per-world typefaces from `THEMES` in `app.js` (Bungee for the hawker centre, Cinzel Decorative for Hogwarts, Fredoka for the UI).
- **Motion:** a different payoff per world (sticker pop and confetti vs. a golden loupe bloom with sparkles), iris and pull-back transitions instead of cuts, and camera shake only on hits.
- **Sound:** an original 120 BPM chiptune synthesised in `sound.py`. Square arpeggios play in Singapore and bell arpeggios at Hogwarts, over C–Am–F–G and then Am–E. The SFX are woodblock countdowns, a loupe whoosh, a "nope" buzzer, a found chime with a crash, typing, a riser, a silent drop and then the logo hit. Every visual hit sits on a beat or an eighth note.

All lines, titles, names and the tagline come from the game manifests (`data/games/codex-hawker-centre.json`, `codex-great-hall.json`) and the live site. No metrics are claimed.

## Assets (`assets/`)

- `site-land-*.png`: authentic screenshots of the live site (wall, both games, wrong guess, clue, find, create dialog), captured by puppeting it with Playwright (`capture.mjs`).
- `scenes/`: the real generated scenes and guest cutouts from `../data/assets`.
- `fonts/`: the site's Google Fonts, stored locally so renders are deterministic.
- `qr.json`: QR matrix for https://github.com/Collaboration95/common-grounds-makeathon

## Rebuild

```sh
npm i                                   # playwright + qrcode
npx playwright install chromium
python3 sound.py                        # -> out/audio.wav
node render.mjs portrait                # or square / landscape -> out/whos-hiding-<fmt>.mp4
node render.mjs portrait contact 0.35,3.8,6.6,11.5,19.6   # contact sheet
```

To preview live, serve this folder (`python3 -m http.server 8123`) and open `index.html?w=1080&h=1920&play`.
`comp.js` holds the whole timeline (cue times are in seconds and match `sound.py`).
