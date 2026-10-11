# The Commons: 24s motion piece, creative brief

## Concept: "Twelve cells"
Every creature in The Commons is a 4×3 sprite sheet with 12 frames, in a fixed order: walk ×4, fly ×4, idle, rest, sleep, special.
The film borrows that grid as its structure and motion language:
- **Transitions** are cells flipping over and pixel-grid dissolves. There are no generic slides or zooms.
- **Pace:** the frame snaps on the beat, like a sprite animation at 12 fps.
- **Story:** one person's wish ends up as one living creature in the room.

## Art direction
- **Palette:** dusk void deck. Night `#1d1424`, ink `#3b2414`, cream paper `#fbf3e2`, amber `#f2a65a`, lamp `#ffd27a`, teal accent `#5fb3a1`.
- **Type:** a chunky geometric display face for big kinetic words (system fallback `"Avenir Next", "Helvetica Neue"` heavy). A monospace face for Codex lines.
- **Product visuals:** real captures only, from `video/assets/clips` and `video/assets/stills`. UI is never faked.
- **Texture:** a subtle paper grain over everything. Pixel edges stay crisp, using `image-rendering: pixelated` on sprites.

## Music
- 120 BPM: 2 beats per second, so one beat is 0.5s and one bar is 2s.
- Warm chiptune plus lo-fi: square-wave arpeggio, soft kick, a pad, and a final chime.

## Timeline (seconds; hits are on beats)

| Time | Scene | Content | Audio |
| --- | --- | --- | --- |
| 0.0–2.0 | **Hook** | Night. A blinking caret. Real phone clip: the wish being typed, "a durian in sunglasses". | Key clicks; the music enters at 1.0 |
| 2.0–6.0 | **Build** | The phone's real progress timeline (Checking → Queue → Codex is writing it → Testing → Drawing → Live). Each step is a big kinetic word on a beat, with real `thing.js` lines streaming in mono behind. | A blip on each step |
| 6.0–9.0 | **Sheet** | The real 12-frame sprite sheet assembles cell by cell on beats; then the frames play as animation. | Ascending arp |
| 9.0–13.0 | **Arrival** | The sprite steps out of the grid and into the real void deck (projector capture): scaffold, then drop, then credit tag. | Whoosh, then a thud/pop at the drop |
| 13.0–17.0 | **Your room** | "Point a phone at any room." The real venue photo pixel-dissolves into its paper redraw, then the characters walk in (real scene-swap capture). | Swell |
| 17.0–21.0 | **Your pet** | Phone montage: Pick one / 🎲 / PIN / status "shipping The Commons" / Moody (rain) / Sleep (zzz) / Poke (special attack). | Quick blips |
| 21.0–24.0 | **End** | "THE COMMONS: a room that builds itself" plus "Every creature written, tested & drawn live by Codex" plus the URL or join QR. Grid closes. | Chime, then a tail |

## Deliverables
- `video/out/commons-9x16.mp4` (1080×1920, primary)
- `video/out/commons-1x1.mp4` (1080×1080)
- `video/out/commons-16x9.mp4` (1920×1080)
- `video/out/contact-sheet.png`

All three formats come from the same timeline (`video/src`).

## Claims
These are the only claims allowed:
- A wish goes from words to a live creature in about a minute.
- The creature is written and tested by Codex, and its sprite sheet is drawn by Codex.
- A room photo becomes the scene.
- Presets, hats, PIN, status, moods, and a 10-character room.

No made-up metrics.
