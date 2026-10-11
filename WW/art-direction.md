# WW art direction: legible backgrounds

## 1. Review of current images

**Quidditch stadium: 3/10.**
- Mashed: both stands (upper left, right, centre back) are a colour-wash of thousands of 1-3px heads with no individual figures. Roughly 70% of the frame is noise.
- Smeared: the left mid-tier crowd between the pillar and the pitch fades into green blur. Figures merge into one mass, so a hidden character would vanish.
- Illogical: the pitch is a soccer field with football markings, and goal hoops are stuck on it. The scoreboards are gibberish ("140 140", glyph blobs). The far stand and the castle are decor only.
- Works: foreground fans with binoculars, the popcorn thrower, the candy-floss stall, and the flags are crisp. Palette and mood are strong.

**Bilbo's party: 7/10.**
- Mashed: the mid-distance crowd behind the long tables (centre, y 400-520) and the far crowd by the lake are tiny repeated heads. The far-left tables are also dense, and the painted Gollum there is hard to find.
- Odd: the right-edge figures near the blue tent are partly cropped and cluttered. Gandalf is half hidden by the tent edge. The under-table kids are ambiguous.
- Works: the maypole dancers, the foreground kids with the cake, the dog, the stage band, and the tent stalls are distinct and varied. The layout is logical and the lantern tree reads well. This is the best of the three.

**Cantina: 8/10.**
- Mashed: the far-left street through the arch has a tiny repeated crowd. The back alcoves are dark with blurry figures. The foreground bottom-left crates and sacks are large and murky and eat about 25% of the frame.
- Odd: the foreground figures at the bottom right are cropped by the frame. A few dark-on-dark hooded figures lose their silhouettes.
- Works: the round bar, the band on the stage, the booths, and the card-game table are readable. The figures are distinct, large, and well separated, with a clear logical layout and a consistent warm light. This is the target density.

Pattern: legibility drops wherever people shrink below about 3% of image height. The cantina works because nearly every person is 8-15% tall. The stadium fails because it is an epic vista.

## 2. Replacement prompt text

```js
const WORLD_STYLE = 'Clean, crisp, high-resolution pixel art illustration in the style of a premium modern pixel-art game, with a limited cohesive palette, strong dark outlines and clear readable silhouettes. Medium-scale single setting that fits in one room, courtyard or street, not an epic panorama. Logical, believable layout where every prop and person makes sense for the place and moment, lit by one consistent light source.';

const BACKGROUND_SUFFIX = ' Camera: moderately close elevated three-quarter view, like looking down into one scene from a balcony, with only three depth layers (foreground, middle, back wall or edge). Show about 25 to 40 people in total. The farthest person is still about 4 percent of the image height, with a distinct head, body and clothing colour. Never draw tiny distant crowds, spectator stands, packed audiences or masses of heads; instead use a few large clear groups, and show the back of the space as walls, scenery or empty open ground. Every person is a separate, fully drawn figure with clear space around them, overlapping at most slightly, in varied poses, outfits and silhouettes. Fill the space with large readable props, stalls, furniture and small funny incidents, each drawn as a complete object. Make the foreground and middle ground dense and detailed, and the background simple and calm. Avoid cropped figures at the frame edge, huge blurry foreground objects, gibberish text, captions, UI and borders.';
```

## 3. Critic rubric (vision model, per background)

Answer yes/no. Pass only if all are yes.
1. Smallest people: is the smallest person at least about 4% of the image height, with a clear head and body?
2. Separation: can you count and tell apart individual figures everywhere, with no crowd blobs, smears or merged bodies?
3. Scale: is the scene medium-scale (one room, yard or street) and not a stadium, panorama or tiered crowd?
4. Logic: does the layout make physical sense (props, furniture and architecture are coherent and fit the place)?
5. Light: is the lighting consistent, with no region so dark that figures lose their silhouettes?
6. Frame: are there no big murky foreground objects, no cropped half-figures at the edges, and no gibberish text?

Return JSON only:
```json
{"pass": true, "problems": ["where + what is wrong, e.g. 'upper-left: tiny crowd merges into noise'"], "revised_prompt_addition": "one or two sentences to append to the prompt, e.g. 'Remove the distant crowd and replace it with a plain wall; show fewer, larger people.'"}
```
If `pass` is true, `problems` is `[]` and `revised_prompt_addition` is `""`.

## 4. Tightened scene descriptions (no names)

**(a) Bilbo's eleventy-first birthday party.** A night-time garden party on a grassy field in front of a round green hill-home, seen from above and close. In the centre, about eight barefoot, curly-haired small folk dance around a ribbon maypole. On the left, two long wooden feast tables hold platters and candles, with about ten seated diners. On the right, one blue-and-white striped tent shelters a cake stall. In the foreground a child carries a lit birthday cake while another child chases a dog. A cloaked old wizard with a tall pointed grey hat and long white beard stands clearly beside the tent. A hunched, pale, thin creature with huge eyes crouches under the far end of the left table. Lanterns hang from one big oak. Colourful fireworks fill a plain dark sky. Behind the field is only a quiet hedge and a few round doors in the hillside.

**(b) Mos Eisley cantina.** A single dim, round-arched sandy-stone bar room seen from a balcony, warm lamp light, with the back wall plain. A big circular bar with a central bottle tower sits left of centre, with a six-armed bartender and about five aliens on stools. A small stage on the right holds a four-piece alien band with horns and a lute. Two curved red booths and a card table hold about ten varied aliens, among them a green horned one, a hooded cloaked one and a pale tentacled one. A waitress with blue hair carries a tray across the open floor. A small round astromech-style droid waits by a pillar. Everything stays in the middle two thirds of the frame, with a clear walkway between groups. The foreground is just empty floor and one small crate.

**(c) Hogwarts Great Hall start-of-term feast.** A single stone hall with a high beamed ceiling and floating candles, seen from a balcony at one end. Four long wooden tables run lengthwise, each seated with about eight students in black robes and house-coloured scarves in four colours (red, yellow, blue, green). A raised teachers' table across the far end holds seven robed adults, including a white-bearded old wizard in the central chair. The tables are laid with golden plates, goblets and roast food. In the front aisle a line of first-years in oversized robes stands before a stool holding a battered pointed hat. A grey ghost floats near a pillar and a cat sits on a bench. There are only four huge arched windows and a tall banner on the far wall.

**(d) Singapore hawker centre at lunch rush.** One open-sided covered food hall with ceiling fans, plastic stools and round-topped tables, seen from a raised corner, bright daylight. Along the back wall there is a row of six distinct food stalls with neon signs and steaming woks. Each has a cook, and a few customers queue in front. The middle floor holds about eight tables with two or three diners each, eating noodles, rice and iced drinks. In the foreground a tray-carrying auntie weaves past, an uncle reads a newspaper, a cleaner pushes a tray trolley and a boy points at a menu. There is a tray return station on the right and green palm trees outside the open edge. Nothing beyond the hall is shown.
