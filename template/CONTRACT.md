# Thing contract v2

A thing is one living paper-cutout creature or object in a shared room (a 1600x900 scene; the default is an HDB void deck at dusk opening onto a grass field, but a host can swap the room). You write only its BEHAVIOUR in `thing.js`. A separate artist draws the picture; the renderer draws it at the thing's transform, plus speech bubbles, effects and an optional hat. Things never draw anything themselves.

`thing.js` is at most 6 KB, has no imports, and is a single `export default { ... }`:

```js
export default {
  name: "Rolling Durian",      // at most 24 chars
  tags: ["food", "spiky"],     // at most 4 lowercase a-z words; other things find it by tag
  zone: "ground",              // "ground" (walks the floor, hops) | "air" (flies)
  size: 1,                     // 1 = 140px tall, 2 = 220px tall (before depth scaling)
  init(me, world) {},          // optional
  update(me, world, dt) {},    // required, every frame, dt in seconds (about 1/60)
  onPoke(me, world) {},        // optional: someone poked it
  onMeet(me, world, other) {}, // optional: another thing came within 110px (both sides get it, 5s cooldown per pair)
  onSignal(me, world, sig) {}, // optional: sig = { from: view, fromId, kind }, delivered the tick after another thing's me.signal
};
```

## The room (world.scene, frozen)
`ceilingY`; `air: { top, bottom }` (y-band where air things fly); `floor: { backY, frontY, backX: [l, r], frontX: [l, r] }` (a trapezoid: ground things' feet stay inside it; larger y = nearer the viewer = drawn bigger); `depthScale: [back, front]` (sprite scale at backY and frontY); `spots: [{ id, name, kind, x, y, tags }]` where kind is `seat | table | rest | perch` and (x, y) is where feet go (stools, tables, a sunny rest patch, wall lamps). Do not hard-code coordinates: read them from `world.scene`, because the room can change.

## me (read/write unless noted)
- `x, y`: feet position on screen (px). For GROUND things y is DEPTH on the floor: smaller y = further back = smaller on screen. For AIR things (x, y) is the centre of the sprite.
- `z, vz`: ground things only: height above the floor and its velocity (up is positive). Hop with `me.vz = 450`; gravity (1400 px/s^2) brings it back to z = 0.
- `vx, vy`: velocity in px/s. The ENGINE integrates (`x += vx*dt`, `y += vy*dt`); you only set velocities. Setting x or y directly teleports.
- `angle` (radians), `scale` (default 1), `flip` (bool; the sprite faces right, so use `me.flip = me.vx < 0`), `alpha`, `state` (plain JSON object: your memory between frames).
- `anim` (optional string): when the thing has a sprite sheet, force a pose: `"walk"|"fly"|"idle"|"sit"|"sleep"|"action"` (see template/ACTION_MAP.md) (or `null` for automatic). The engine picks one by itself from your motion, so you rarely need it; ignored if the thing has no sheet.
- `me.say(text, seconds)`: speech bubble, at most 6 words, short and in character.
- `me.signal(kind, toId?)`: send a short message (kind at most 16 chars, e.g. "tease"). With `toId` it goes to that thing; without it, to every thing within 200px. They receive it in `onSignal` on the next tick.
- Read-only: `id, name, tags, zone, size, spot` (id of the spot you occupy, or null), `depth` (0 at the back of the floor to 1 at the front).

## world (read-only)
Values: `time` (s), `width` (1600), `height` (900), `pointer` (`{x, y}` in screen px, or null), `scene`.
Helpers:
- `random()` seeded random in [0,1). Never use Math.random.
- `dist(a, b)` distance between two {x, y}.
- `nearest(me, tag)` nearest OTHER thing with that tag (a view), or null. `nearby(me, radius)` views within radius, nearest first. `things(tag?)` all other things. A view is a frozen `{ id, name, tags, zone, x, y, z, vx, vy, spot, hat }` (hat = id of the hat it wears, or null). Never write to views. Nearness is measured between body centres, so a bird low over a cat is close to it.
- `spots(kind?)` the scene's spots, each with `occupant` (id of whoever sits there, or null).
- `steer(me, {x, y}, speed)` sets vx/vy toward the target and returns the distance left (it never overshoots). Ground things steer in x and depth.
- `goTo(me, spotOrId, speed)` steers to a spot and returns `true` once it has ARRIVED and occupies it: from then on the engine pins your feet to the spot (no moving, z = 0) until you call `leave(me)`. Call it every frame until it returns true. Walkers use seat/table/rest spots, fliers use perch spots; if the spot is taken it returns false.
- `leave(me)` stand up / take off from the spot you occupy.
- `fx(kind, x, y)` effect, kind is one of `burst | hearts | zzz | rain | sparkle | steam`. Put it near the head: about `me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth)` for ground things, where `ds = world.scene.depthScale`.

## Physics (the ENGINE applies this after each update)
- Ground things: feet are clamped into the floor trapezoid; z is height above it (feet are drawn at y - z, the shadow stays at y). Nothing goes above the ceiling.
- Air things: x, y are clamped to the air band; no gravity.
- A thing drawn lower on screen is drawn in front of things further back; the sprite shrinks toward the back automatically.

## Forbidden (the checker enforces this)
import, require, fetch, XMLHttpRequest, WebSocket, setTimeout, setInterval, document, window, globalThis, self, eval, Function, constructor, localStorage, Math.random, process, async/await/Promise, `while(true)`, `for(;;)`. No unbounded loops. No writing to other things. Every call must take well under 1 ms.

## Quality bar (every thing must do all three)
1. MOVE IN DEPTH: wander the floor front-to-back as well as left-to-right (ground) or through the whole air band (air), using `world.steer`. Not just left and right.
2. USE A SPOT: go to at least one spot kind with `world.goTo` (sit on a stool, lounge on a table, perch on a lamp...), stay a while, then `world.leave(me)`. Choose the spot once and keep it in `me.state` (do not re-pick every frame).
3. REACT TO NEIGHBOURS: implement `onMeet` (greet, flirt, flee, show off, hearts) and/or `onSignal`, and use tags (cat, bird, food, hat, warm, spiky, water, light, ...). Handle null from `nearest` and `pointer`.

Also: charming and readable from across a room. Big, legible motion (not jitter), a clear personality, a reaction when the pointer comes near, a funny `onPoke`, one memorable line of speech. Keep it small and cheap.
