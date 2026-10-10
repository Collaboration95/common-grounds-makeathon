# Table Chorus — A place for you

A top-down hawker table is a social instrument. One person places a tissue packet; another asks for the empty seat. The first makes room, the second slides a cup closer, and their saucer taps answer each other. Clear the objects and the table reveals a face: the two cup rings are eyes, their exchanged taps a smile. Download the table portrait as a small keepsake of being together.

**Track: Culture × Tech.** Reservation, permission, proximity and reciprocity are the controls. The cultural subject is participating in a shared dining space. Design × Tech is plausible for the object-to-sound interface, but Culture is stronger because removing the social meanings would break the story. A tissue is a claim on a place before it is an instrument; an empty seat needs a question before it becomes a second voice.

## The exact magic moment

“Clear & keep our table” removes the cups, saucer and tissue. Their traces stay in their actual positions and resolve into a smiling table portrait. The player realises the table was remembering an encounter. A deterministic SVG export preserves the guest cup position and the three exchanged taps. The metaphor is authored; the encounter inputs are live. There is no camera, microphone, generative portrait service or pretend AI.

The first micro-surprise is earlier: the tissue's low note stands alone until an explicit invitation gives the second cup a voice. Sliding the cup within 185 SVG units of the first produces a paired response and a visible link. It is a deliberately small relationship model, not an open-ended proximity synthesiser. No metronome, musical competence or perfect timing is needed.

## Relationship to the original directions

Read all source snapshots, including the newly supplied `design-idea-2.md`. The speaking welcome VHS and Kopi Shift are both Culture ideas. The earlier brainstorm's strongest motivation was feeling confident participating in everyday Singapore life. Table Chorus keeps that motivation while exploring the moment after getting food: what can an object say about who belongs here?

The original welcome tape's moving tray makes a word consequential. Here a reservation packet makes absence consequential, and moving it to your side changes another person's access to the table. The audit asked for an emotional shared-lunch payoff rather than a summary card. This concept makes that payoff the entire interaction and turns its physical traces into the ending.

Kopi Shift makes local words understandable by preparing drinks behind a counter. Table Chorus uses cups already on the table. There are no recipes, ingredients, order validation, stallholder role, customer queue or preparation lesson. A cup is someone's presence; sliding it is a gesture toward another person. The keepsake records an exchange rather than skill mastery. The source's preference for Kopi Shift remains the established preference; this is a separate alternative for review, not a replacement decision.

## Three variants, one choice

| Variant | Interaction and reveal | Strength / cost |
| --- | --- | --- |
| **A place for you — recommended** | Ask → invite → bring cup nearer → exchanged taps → smiling table portrait | Consent and belonging are legible; one device and five props suffice. A face made from traces is concrete and exportable. |
| The seat that sings | Leave one chair free; each open place creates a rest in an ensemble. Fill every seat and the final phrase cannot breathe. | Beautiful absence-as-music metaphor; risks making an empty seat seem morally superior to eating with friends. Musical rests are less visible in a noisy room. |
| Pass it on | Slide a shared tissue pack between people; paths of small acts of care become a woven tablecloth. | More freeform and tactile; requires more object relationships and a less predictable reveal. Tissue sharing can also be confused with reservation. |

Choose **A place for you**. Its physical arrangement has a visible social cause before any sound happens, and the final image is readable with sound off. Two people can alternate on one laptop; one presenter may explicitly play both parts. No multiplayer server is required.

## Research and takeaways

Sources accessed 11 October 2026; some are historical descriptions, not current policy or universal etiquette.

1. [Singapore Tourism Board, *Veg is In*, hawker-centre etiquette](https://www.visitsingapore.com/content/dam/desktop/in/downloadkit/veg-is-in.pdf). The guide describes reserving with belongings such as tissues, sharing during busy periods, and asking at a partly occupied table. **Takeaway:** give the packet meaning, but make the spoken question and invitation explicit. This is a fictional encounter, not an authoritative etiquette simulator.
2. [National Heritage Board, *Serving Up a Legacy*](https://www.roots.gov.sg/stories-landing/stories/Serving-Up-a-Legacy). Places hawker centres in the social role of community dining rooms. **Takeaway:** the table is the centre of the piece; belonging comes from making room, not correctly identifying a dish.
3. [Reactable, *Experience — How does it work?*](https://reactable.com/experience/). Describes manipulating objects and connecting them, with graphical sonic flows on the surface. **Takeaway:** relationships should be visible between objects, rather than isolated sound buttons. Table Chorus is a pointer-based screen sketch inspired by tangible interaction, not a tracked physical Reactable.
4. [Yuri Suzuki, *Sonic Playground*](https://yurisuzuki.com/projects/sonicplayground). Its acoustic sculptures change the experience through where people stand, listen or speak. **Takeaway:** make listening and responding a spatial social activity; avoid an editor full of music settings.
5. [Yuri Suzuki, *Sonic Bloom*](https://yurisuzuki.com/jp/projects/sonic-bloom). A network carries voices and encourages spontaneous communication in public space. **Takeaway:** sound can reveal a relationship between people, not merely reward an action. Our notes are synthetic and authored; we do not capture or transport visitor voices.

These precedents make the originality boundary clear. Tabletop instruments, object-driven sound and communal sound installations already exist. The contribution proposed here is the particular social grammar—reserve one place, ask, invite, respond—and the trace-to-face keepsake in a small hawker-table fiction. No world-first, historical-authenticity or winning claim is made. A local reader should review phrasing and the packet-placement staging.

## Internal 90-second demo

| Time | What the audience sees and does |
| --- | --- |
| 0–10s | “What can a tissue packet say?” Show the single table; sound remains optional. |
| 10–23s | Place a tissue. A low note and one reserved place. Pass the device. |
| 23–37s | Neighbour asks “Is this seat taken?” Host answers “Only this one. Please join.” Packet moves to one side; second cup appears. |
| 37–53s | Guest drags their cup closer. A line and paired notes connect the two cups. Show the slide button if dragging is awkward. |
| 53–67s | Two people alternate saucer taps: ting, tang, ting. Smile marks accumulate without a timing test. |
| 67–80s | Clear objects. Cup rings and tap marks become the smiling portrait. Download its SVG. |
| 80–90s | “The table remembers that we made room.” Briefly state authored sound/portrait, real local gestures; reset. |

Ninety seconds and the five-hour budget below are internal assumptions. The event's actual judging weights and presentation allowance are unknown. This pack is an interaction sketch, not evidence of a measured belonging outcome.

## One-screen anatomy

Rust tiled floor; cream oval tabletop with green checked edge; two seats, pink and yellow cup saucers, green tissue packet and a small tapping saucer. The camera never leaves the top-down table. A short turn caption lives below it. One large button supplies a pointer/keyboard equivalent for the current gesture. Sound, reduced motion and reset sit at the edge. The only ending overlay is a paper keepsake note, moved below the table on narrow screens so it cannot obscure the face. A visible gallery link returns to `../../index.html`.

Pointer cup dragging, arrow-key cup movement, Enter-to-slide and button-to-slide share the same state. Saucer taps accept pointer, Enter, Space or the main button. Focus is visible; captions announce state; motion reduction never changes completion. Sound begins off and requires a user gesture. Synthetic notes accompany packet placement, invitation, cup relationship and reciprocal taps. There is no continuous sequencer or hidden beat grid.

## Authored versus live

**Live:** button actions, cup position, constrained drag distance, turn progress, actual taps, reset, local SVG download. **Authored:** neighbour line, invitation wording, three-tap threshold, synthetic pitches, appearance of the guest cup, facial metaphor and clearing animation. The prototype does not distinguish two actual people, measure consent, listen to speech, infer emotion, identify culture or generate music with a model. Turn labels are an invitation to collaborate, not identity verification.

## Minimum build and cuts

Five focused hours, one builder, existing browser tools; internal estimate rather than organiser schedule:

| Budget | Work / completion gate |
| --- | --- |
| 0.5h | Review packet/seat language with a local person; lock five props and portrait composition. |
| 1.25h | Render polished SVG table and implement reservation, question and invitation states. |
| 1h | Cup distance relationship, keyboard/buttons, saucer taps and deterministic portrait. |
| 0.75h | Optional sound, captions, reduced motion and SVG keepsake. |
| 1h | Rehearse two-person and solo paths; inspect laptop/mobile; test offline/reset; freeze. |

Cut room ambience, recorded dialogue, variations and freeform objects first. Cut decorative motion before recovery controls. Keep the question, invitation, proximity response and trace reveal: removing them leaves either a lesson card or a generic instrument. Physical sensing, real multiplayer, AI conversation and a shared public archive are outside the minimum build.

## Risks and review questions

Chope can be contested; a packet is not universal permission to occupy or exclude. The host reserves one place, and the neighbour asks before joining. A fictional table cannot represent every dining custom or community. Avoid caricatured accents, named ethnic instrument assignments and harmony-as-assimilation claims. Synthetic equal-tempered notes do not purport to represent local traditional music.

The face might read as arbitrary if rings and tap marks are not visible before clearing; inspect that exact transition. A nearby cup is a playful metaphor, not advice about strangers' physical boundaries. Two-person participation is social turn taking, not simultaneous input. Browser audio and SVG downloads may vary; captions and the still portrait remain complete. No sound-quality rehearsal with human listeners or cultural-review session has occurred yet.
