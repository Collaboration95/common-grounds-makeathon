# Pocket Stage — The Moth & the Light

Your browser becomes a miniature paper theatre. A small light obeys your pointer. Open a paper hand and its shadow becomes a moth. Move the light until the moth visits one flower; the flower opens in greeting. You have performed a tiny story with light rather than selected a result from a menu.

**Track: Design × Tech. Recommended variant: The Moth & the Light.** The design question is whether moving a light can make a flat screen feel like a material you perform with. The invitation is tactile and legible within seconds. No camera, account, runtime model or microphone is needed. This is a concept toy, not a finished puppetry tool.

## Exact magic moment

Press **Open hand · Space**. The rose paper fist at the stage lip opens, while its projected shadow crossfades into an original moth cutout. Moving the light left moves the moth right; changing light height changes its scale. Bring the open moth into the flower neighbourhood and five petals unfold. An optional short chime marks the greeting. The moth keeps responding afterward, so the ending is still a stage you can perform in.

Core states are closed hand → open moth → flower greeting. Gesture interpretation is explicit, immediate and reversible. Flower completion uses a generous spatial threshold; no hold, precision timer or gesture classifier blocks it. **Guide to flower** moves the light to an authored position but still requires the player to open the hand.

## Relationship to the originals

Both originals are **CULTURE ideas**. In CULTURE idea 1, *Your First Lunch in Singapore*, the player speaks inside a fictional welcome VHS lesson: a dish name makes its tray lift. Pocket Stage keeps that unusual feeling of an authored world responding to the person in front of it. It changes the input from words to lighting choreography and gives the frame a material purpose: the curtains contain a performance rather than decorate an app.

CULTURE idea 2, *Kopi Shift*, is the active and user-favoured direction in the new `design-idea-2.md`. Its deeper contribution is embodied understanding: selecting, pouring and deliberately omitting ingredients make the meanings tangible. Pocket Stage similarly makes the consequence continuously visible. Light direction and hand opening are the things you do, and shadow position and character form are the things you understand through doing. It follows Kopi Shift's reliable direct-control core, with sensing optional. It does **not** replace Kopi Shift's newcomer participation purpose or offer comparable cultural learning. The choice here is a distinct Design alternative.

The older sprite assets demonstrate the practicality of limited reusable poses, but no hawker figures are reused on this stage. The existing 30-frame Kopi board informed stable object positions, captions, production notes and explicit recovery branches; this proposal compresses to one scene and 12 states.

## Three distinct variants and the choice

| Variant | Gesture and payoff | Why choose / why defer |
| --- | --- | --- |
| **The Moth & the Light** | Open hand; direct its moth shadow to one flower | Chosen. One silhouette, light and prop give an immediate, complete little story. Continuous light play survives after completion. |
| **A Giant in a Teacup** | Bring light close; a finger shadow becomes a towering figure beside one cup | Scale alone is striking, but the character reveal needs an extra action and the cup risks reading as a borrowed kopi scene. |
| **The Paper Tide** | Sweep light; an open palm's shadow becomes a tide around one folded boat | A broad bodily sweep feels expressive, but water deformation and boat motion create more animation work and make the shadow relationship less clear. |

Protect the chosen miniature rather than combine these into modes. The preview implements only the moth variant.

## Researched precedents and boundaries

Research checked 11 October 2026. Takeaways below are design interpretations, not claims that those sources endorse this project.

1. [BFI: Lotte Reiniger's cut-out figures and backgrounds for Cinderella](https://www.bfi.org.uk/inside-the-archive/features/object-week-lotte-reiniger-cut-out-figures-backgrounds-cinderella). BFI shows articulated cutouts and layered translucent backgrounds, with composition arranged around movement. **Takeaway:** design the moth silhouette and its clear performance space first; a few layers can carry atmosphere. Credit Reiniger's paper silhouette craft. Use original geometry, not her characters or the archive photographs.
2. [Exploratorium: The geometry of seeing](https://annex.exploratorium.edu/geometry-playground/seeing.html). Its explanation treats shadows as projections of edges and connects appearance to relative position. **Takeaway:** make the light's effect visible in real time. Our inverse translation and scale are deliberately stylised mappings, not a ray-traced optical simulation.
3. [Exploratorium: Colored Shadows](https://annex.exploratorium.edu/xref/exhibits/colored_shadows.html). Visitors' bodies interrupt multiple lights, revealing changing colour relationships. **Takeaway:** the person's movement can be the instrument. Keep only one light here so causal relationships stay readable; do not import a three-light colour puzzle into this demo.
4. [UNESCO: Wayang puppet theatre](https://ich.unesco.org/en/RL/wayang-puppet-theatre-00063), with [UNESCO's illustrated heritage brochure](https://ich.unesco.org/doc/src/00010-EN.pdf) as accessible supporting material. UNESCO describes Indonesian wayang's differentiated puppet forms, articulated performance and musical traditions. **Takeaway:** this is a living performance tradition, not a generic filter. Pocket Stage is an original paper silhouette miniature, **not authentic wayang**, a reconstruction or a lesson. No wayang character, gamelan soundtrack or combined traditional iconography is used. A future Culture version would require a named practitioner, specific tradition and reviewed attribution rather than cosmetic borrowing.

Honest originality boundary: interactive shadows, shadow puppets, paper animation, moth/flower stories and light-controlled interfaces already exist. The proposed contribution is this small combination: explicit paper-hand opening, inverse light control, an authored living moth, one spatial greeting and a fully playable sensing-free path. No world-first or winning claim is made.

## Internal 90-second demo route

**0–12s:** “What if your browser were a theatre you could perform with?” Show the closed paper hand and move the light once. The shadow moves in the opposite direction.

**12–28s:** Press Space. The foreground hand opens and its shadow becomes a moth. Pause briefly so the audience sees both ends of the relationship.

**28–48s:** Move the light left and change height. The moth moves right and changes scale. Keep the flower clear. Show that movement is live pointer input, while the creature is an authored cutout.

**48–62s:** Guide the moth to the flower; petals open. Sound is optional and captions carry the payoff. Use Guide to flower if precision or projection makes free positioning difficult.

**62–78s:** Close/open the hand again, switch Still mode on and use arrow keys or a range. The same scene remains playable without sound or camera.

**78–90s:** Reset. “The light is the control; the shadow is the story.” Mention optional hand tracking as a future input experiment, not something running in this demo.

The 90 seconds and five-hour plan are internal assumptions. The event's exact presentation duration and judging weights are unknown; neither is an organiser requirement.

## One-screen anatomy

- Top: small Design × Tech label, large editorial title and a one-sentence invitation.
- Main scene: plum proscenium and rose curtains surround an amber paper screen. The screen contains one shadow and one flower. A few static translucent layers suggest depth without a navigable world.
- Front lip: one warm lamp and the rose paper hand; these show the source and performer.
- Lower screen: one readable state caption, held in a safe band clear of the moth and flower.
- Below stage: hand toggle, guide, reset, optional sound and Still mode; native labelled light ranges supply keyboard alternatives.
- Footer: explicit authored/sensing boundary, Reiniger credit and gallery return link. No setup overlay is needed; the flower greeting is the ending inside the same scene.

## Authored versus live

| Element | What really happens |
| --- | --- |
| Pointer / touch / arrow / range input | Live browser events update the lamp, shadow position and scale immediately. |
| Hand opening | An explicit button or Space toggles original closed/open cutouts; no real hand is observed. |
| Creature and greeting | Authored moth geometry and a deterministic proximity condition open authored flower petals. |
| Wing movement | A decorative CSS loop, disabled by Still mode or the OS reduced-motion preference. |
| Assistance | Guide to flower places the lamp at a known authored coordinate. It is clearly labelled help. |
| Sound | Optional local synthesised chime; initially off. No voice capture or generated narration. |
| Camera tracking stretch | Not implemented. A future local hand-open classifier could map to the same toggle, with pointer/keyboard always available. |
| AI | None at runtime. This prototype does not infer gestures or generate creatures live. |

## Minimum build: five focused hours, one builder

| Budget | Build and gate |
| --- | --- |
| 0:00–0:40 | Draw one paper stage, original fist/open hand and moth. Gate: three silhouettes readable without texture. |
| 0:40–1:35 | Implement light position and height mappings, continuous shadow feedback and explicit hand toggle. Gate: magic moment usable by pointer and keyboard. |
| 1:35–2:20 | Add one flower and spatial greeting; preserve free play after ending. Gate: no timing dependency. |
| 2:20–3:10 | Tune screen layers, captions and short transitions; sound opt-in. Gate: source → shadow → prop remains clear. |
| 3:10–4:00 | Add ranges, guide, reset, reduced motion, focus states and phone layout. Gate: complete path without sound or pointer precision. |
| 4:00–5:00 | New-player check, keyboard/restart rehearsal, export backup and record actual demo. Freeze features. |

Cut camera tracking first, then sound, animated curtain movement and decorative wing breathing. Keep closed/open hand clarity, light response, flower greeting, captions, keyboard, reset and rehearsal. SVG primitives are the full rendering pipeline; no 3D model, rigging import, inference backend or asset-generation dependency is needed. Current preview is dependency-free and works from `file://`.

## Risks and questions to test

- Inverse movement can feel surprising or confusing. Keep the visible light and generous spatial threshold; ask whether a new player understands the relationship after one sweep. Guide and native ranges provide recovery.
- Hand-to-moth can read as an arbitrary crossfade. The foreground hand must visibly change shape; a future build should refine the moth's wing contour to echo the open fingers. The current transform is authored, not physical projection.
- Flat SVG shadows cannot faithfully model arbitrary hands or 3D occlusion. Do not sell the stylised mapping as physics or gesture recognition.
- On small screens the art shrinks faster than the controls. Preserve normal text size and adequate touch targets; check captions separately from art.
- Repeated play may exhaust one greeting. That is acceptable for a short concept toy. Test two minutes of free light play before adding another prop or scene.
- Live board browser saving may be separate from authenticated tldraw account saving. See `board.json` and `qa-report.json` for actual reload and independent-session evidence; editable source and snapshot are supplied as recovery artifacts.

Success evidence would be a first-time viewer releasing the moth, understanding light direction and completing the greeting without verbal help, then deliberately changing its scale. Automated tests establish state and accessibility paths, not delight, novelty or learning effectiveness.
