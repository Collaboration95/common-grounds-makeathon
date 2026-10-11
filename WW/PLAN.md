# Wes Waldo: MVP plan

Decided 11 Oct 2026. Build budget: 3 hours. Only the presenter plays during the demo.

## What we're building

1. **World of worlds (front page).** Every game's background sits on one wall, edges feathered so the worlds blend into a single landscape. The whole world is visible at once. Motion stays gentle: a slow drift, new worlds fade in, nothing jumps or reshuffles. Hover a world to see its title and who's hiding; click it and the camera glides in.
2. **The game.** One scene that fills the screen, with "Find <guest>" and their portrait in the corner. Five characters stand in the crowd: the guest plus four residents of that world.
   - Hover any character: they do a tiny move (nod, hop, head-shake, wave, tilt) and say a quip in their own voice.
   - Click a resident: they give a small disapproving reaction ("Not me.").
   - **Need a clue?** spotlights the area that contains the guest.
   - Find the guest: everyone else dims, the camera pushes in, the guest bounces and says their found line, then the story caption appears.
3. **Create.** Type a moment and who's hiding, or press Surprise me. A text model writes the scene plan: title, story, background prompt, cast, and every quip. Then the image model paints the background and each character separately, in parallel. Code places the characters, so the answer key is always correct. The new world fades onto the wall and you drop straight into it.

Content: famous film and book moments with famous characters, plus crossovers ("Snape at the Quidditch final", "Gollum at Bilbo's party", "Darth Vader at a hawker centre"). Content rules are left to the model.

## Architecture (zero dependencies)

```
WW/
  server.js          static files + /api/games, /api/jobs/:id (holds the API key)
  lib/generate.js    prompt generator + pixel generator + placement -> game manifest
  seed.js            pre-generate the wall from seeds.json (npm run seed [-- 0 3])
  seeds.json         editable list of {moment, guest}
  public/            index.html, style.css, app.js (wall, game, create)
  data/games/*.json  one manifest per game
  data/assets/*.png  background + each sprite as separate files (cacheable, swappable)
```

- Text model: `gpt-6.1-sol` (Responses API, strict JSON schema). Image model: `gpt-image-2.5-flare`. `MODE=draft` (default) paints at low quality; `MODE=final` paints high-quality backgrounds and medium-quality sprites.
- Art style: richly detailed, realistic-proportion pixel art (not 16-bit). Backgrounds are 1536x1024 with no guest in them; sprites are 1024x1024 on transparent backgrounds, saved as WebP. The browser crops sprites to the figure, strips their faint glow, and dims them to the scene's brightness.
- Placement: a vision call lists believable standing spots, each with the size a person would be there and a nearby landmark. Characters go only in those spots, and the guest's landmark becomes the clue text. Spots are cached in the game file; `npm run rehide -- <id>` re-hides the cast for free.
- `createGame({ moment, guest, bg })` can reuse a cached background and paint only characters.

## What we learned (11 Oct, first real runs)

- The image model refuses named characters, so it only ever gets visual descriptions. It still refuses some well-known likenesses even when they're only described (Snape, Yoda, Luke, Obi-Wan). Creatures and cartoon-like characters get through (Gollum, Paddington, the Harry/Ron/Hermione types). The guest is drawn first; if they're refused, the job stops before paying for the rest and the create box says to pick someone else. Refused residents are simply left out.
- A new world takes about 4 minutes at draft quality when 3 are painted at once, which is too slow to wait through on stage. For the demo, start a creation at the beginning of the pitch, play a seeded world while it paints, and let the new world arrive on the wall.

## Build order

| Step | Done when |
| --- | --- |
| 1. Skeleton with placeholder art | Wall → zoom in → find → caption works with no API key |
| 2. Generation test: `npm run seed -- 0` | One real game appears; time per game and image quality noted |
| 3. Tune style prompt and sprite scale | Sprites blend into the crowd; finds take 15-45 s |
| 4. Seed the wall (6-8 games) | The wall looks like one world on the projector |
| 5. Live create flow polish | Create → wait screen → dropped into the new game, reliably |
| 6. Rehearse | Full demo route works three times in a row |

## Back pocket (only if time allows)

- Room joins from phones: local server + tunnel + QR code; people create during the pitch and their worlds appear on the wall.
- Recast: reuse a cached background with a new guest (fast, ~30 s).
- Timer and best-time on each world.
- Magnifying-glass cursor.
- Several card and post styles.
