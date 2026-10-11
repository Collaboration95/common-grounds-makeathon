# Culture idea 2: Kopi Shift

> Naming update: this is **Culture idea 2**, the user’s preferred direction. See [the new exploration](ideas/01-kopi-shift/brief.md) for a compressed one-counter performance.

**Active direction:** run a Singapore coffee stall and learn local orders by making them. This supersedes the customer-ordering and VHS concept in `culture-idea-1.md`. The earlier documents remain a record of that exploration.

**Storyboard:** [Open the editable tldraw board](https://www.tldraw.com/f/FeCDfRNnTgy7PU7czRfdA). It contains a concept overview and 30 storyboard frames on five sequence pages. Each panel specifies the shot, spoken or visible line, player action, and resulting state. Green identifies demo content, blue identifies optional AI help, red identifies recovery, and violet identifies future lessons.

**The game and why it fits**

You take the first morning shift at a neighbourhood kopi stall. Customers ask for drinks using local terms. You select the right ingredients, make the drink, and slide it across the counter. A mentor can coach you; independent mode lets you work without automatic prompts.

The core loop is: **hear/read → understand → choose → prepare → serve → learn**.

This is a strong Culture × Tech direction because cultural knowledge changes the player's decisions. Kopi-O and Kopi-O Kosong require different ingredient choices. Understanding the words becomes something the player can demonstrate through action. The Singapore Mandarin Council documents both those meanings and the mixture of Malay, Hokkien and Teochew in the term kopi-o. [Singapore Mandarin Council](https://www.languagecouncils.sg/mandarin/en/learning-resources/singaporean-mandarin-database/terms/kopi-o)

Common Ground's Culture × Tech track includes food and language, and welcomes open-ended creative technology projects. This concept fits that invitation; there is no published rubric establishing that this direction will score better than the first idea. [Event page](https://luma.com/yjffwqr2)

The design advantage is tangible consequence: a different ingredient changes the cup. It also removes mandatory speech recognition from successful play. The design risk is becoming a generic café assembly game. Preserve the cultural purpose through local terminology, ingredient distinctions, natural customer delivery, reviewed explanations, and a modest glimpse of the people who run and visit the stall.

**Premise and emotional arc**

The player enters a name for their apron, chooses a guidance mode, and opens the shutter. The name can be skipped. A fictional stall mentor introduces the workbench: “I'll show you around. One order at a time.”

The first customer orders Kopi-O Kosong. The surprising action is leaving things out: no added milk or sugar. A second order, Kopi-C, introduces evaporated milk and sugar. A final Kopi-O order asks the player to apply the distinction with optional coaching. The shift ends with a small recipe book and an invitation to practise another morning.

The emotional progression is unfamiliar words, a drink that makes sense, and confidence behind the counter. Returning customers can give later lessons continuity without requiring extensive character stories.

No cassette, VHS interface, 3D opening, friend texting scenario, or out-of-world trainer is needed. Inspiration from café games concerns the readable customer/preparation/serving rhythm; use original characters, art, dialogue, and layout.

**Complete hackathon demo**

- One illustrated 2D stall with a customer view, preparation view, and serving insert made from shared layers.
- Three authored customer orders: Kopi-O Kosong, Kopi-C, then Kopi-O.
- One cup at a time, one customer at a time, discrete ingredient portions.
- Coffee pot, sugar, sweetened condensed milk, evaporated milk, cup, spoon, and serving spot. Condensed milk is a meaningful alternative whose use can be explained even before the Teh lesson ships.
- Coached and Independent modes using the same recipes and order validation.
- Customer audio with matching text, replay, optional mentor questions, specific error feedback, fresh-cup recovery, pause, and a complete shift ending.
- Target play length: 3–5 minutes; target presentation route: 60–90 seconds. These are internal targets, not the organiser's announced demo allowance.

Exclude queues, anger meters, timers, cash, upgrades, stock management, live customer generation, continuous voice conversation, brewing physics, and extra stalls. Tea and kaya toast have storyboarded later lessons, but do not block the demo ending.

**Recipe meanings and simulation rules**

| Order | This stall's teaching recipe | Lesson |
| --- | --- | --- |
| Kopi-O Kosong | Coffee; no added milk or sugar | O and kosong encode separate distinctions |
| Kopi-O | Coffee + sugar; no milk | Black coffee need not mean unsweetened |
| Kopi-C | Coffee + evaporated milk + sugar | Evaporated and condensed milk are not interchangeable |
| Kopi, later practice | Coffee + sweetened condensed milk + sugar | This stall's stated conventional recipe |
| Teh, later lesson | Tea + sweetened condensed milk + sugar | Transfer the same distinctions to another base |

The authored definitions follow [HealthHub's local coffee-shop table](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea). Use “our stall's recipe” for the Kopi/Teh sugar portion; preparations and amounts vary. A source that omits sugar from a short description does not prove that no sugar is added.

The number of game portions is an interaction convention. It does not teach actual ratios. Keep real quantities out of the demo unless a practitioner supplies and reviews them. Likewise, say “no added sugar” rather than promising that a drink is chemically sugar-free.

Use “sweetened condensed milk” and “evaporated milk” on the controls. Avoid an ambiguous generic “creamer” ingredient. Match labels with distinct container silhouettes and secondary colours. Do not make colour recognition necessary to succeed.

Teach the completed recipe and meaningful dependencies. A cup must exist before a pour. A drink containing additions must be mixed after its final addition. Black coffee alone does not need a ceremonial stirring step. Coffee and milk can be added in either order if both paths produce the same modeled drink. Toast must become toasted before it can complete the toast item.

**Controls and cup state**

Use select-then-apply controls: click an ingredient, then click the cup. Provide keyboard equivalents and an optional drag gesture. A single action adds one defined portion. Disable further additions until its short animation completes, and deduplicate repeated input events.

Keep the actual contents of the cup visible on a small contents strip in both modes. This describes the player's actions; it does not reveal the target recipe. In Independent mode, hide the target breakdown and next-step highlights, not the user's own progress.

An unpoured ingredient selection can be changed without consequence. Once an unwanted ingredient has been mixed into the cup, offer New cup with confirmation. Preserve the customer order. Do not animate milk magically disappearing from coffee.

Before serving, validate ingredient types, portion counts, required mixing, and completion state. Report one actionable mismatch at a time. A correct cup commits the order once, then plays the serving animation. Do not let animation callbacks award success a second time.

**Coached and Independent modes**

| Behavior | Coached | Independent |
| --- | --- | --- |
| Customer order and replay | Always visible | Always visible |
| Ingredient labels and actual cup contents | Visible | Visible |
| Expected recipe breakdown | Shown progressively | Hidden until help or feedback |
| Next action highlight | Available | Off |
| Wrong ingredient feedback | Explain immediately after the action | Explain when Serve is attempted |
| Impossible action, such as pouring without a cup | Explain without changing state | Same |
| Mentor question | On demand | On demand |
| Time pressure | None | None |
| Success requirement | Same correct drink | Same correct drink |

Both modes are available from the start. Offer Independent for the last customer, but let the player remain Coached. Switching mode mid-order preserves the cup. Mark an order as completed with help if useful in the recap; do not punish asking.

**A useful role for the model**

Retain a model that understands the player's own words in an on-demand mentor interaction. Example questions include “Which white tin do I need?”, “Does kosong mean no milk?”, “Why was my cup wrong?”, and “Did they say Kopi-C?”

Provide typed input first and a microphone button for optional speech. Explain microphone use when it is activated. Customer lines can be authored recordings, so no speech service is required just to hear an order.

The interpreter receives the question, current order, selected object, actual cup contents, mode, and the reviewed lesson facts. It classifies the question, identifies the relevant concept or mismatch, and selects an approved explanation or asks for clarification. For “the white tin,” ask which one if the application has no selected container; do not pretend to see pointing or gaze.

Unlike the old customer-ordering concept, the mentor may know the target recipe: its purpose is to help explain that order. This knowledge must not grant permission to change the cup, silently fix a mistake, or advance the shift. The recipe validator stays deterministic.

Keep generated responses short and grounded in reviewed facts. A safe first build has the model select fact/hint identifiers and uses authored lines to render them. This gives flexible input without making cultural truth depend on freeform generation.

On transcription failure, show the heard text only when useful, offer retry or typing, and preserve the cup. On model timeout or an unsupported question, offer approved local help cards. Ignore replies from old orders, abandoned questions, or restarted sessions. Do not accept instructions in player text to mark an order correct.

Make typed natural-language mentor help part of the intended AI demo. Voice input is the first optional integration to cut if the event environment is unreliable. Participation in the help interaction is always optional for the player.

**Visual direction and storyboarding**

Use a warm, original illustrated 2D counter. Limited cutout movement is enough: a customer settles into view, a pot tips, a spoon turns, a cup slides forward, and the customer reacts. A carefully framed close-up and serving sound can make a discrete action satisfying without physics.

Use three camera views: customer medium shot, stable preparation view, and serving close-up. Cut when an order arrives or is served. Hold the frame during choices, reading, questions, and recovery. Keep the order ticket in a stable place. Always caption speech and preserve controls when motion is reduced.

The storyboard shows major player-visible states and branches rather than animation keyframes. It is deliberately rough and editable so we can change the interaction before producing final assets.

| Board page | Frames | Coverage |
| --- | --- | --- |
| 00 Concept and reading map | Overview | Purpose, modes, direction, AI role, scope, page guide |
| 01 Open the stall | 01–06 | Name/mode, opening, mentor, first order, explanation, natural-language question |
| 02 First cup | 07–12 | Cup, pour, omission, serving, response, next order |
| 03 Learn the difference | 13–18 | Milk distinction, ingredients, mixing, independent attempt, shift ending |
| 04 Mistakes and recovery | 19–24 | Wrong milk, reset, missing ingredient/impossible action, replay, unavailable help, pause/restart |
| 05 Tea and toast later | 25–30 | Tea base, milk tea, combined order, toast, kaya and butter, combined serving |

Main demo route: 01–05 → optionally 06 → 07–18. A wrong ingredient uses 19 → 20 → a fresh cup at 07, keeping the active recipe. Missing ingredients at 21 return to the current cup. Frames 22–24 return to the current order after recovery. Independent entry skips unsolicited explanations and highlights; it uses the same scenes and validator.

**Later levels**

Tea introduces one new base while reusing cups, milk, sugar, mixing, and serving. Kaya toast introduces a second station and a two-item ticket. Bread is toasted, prepared kaya and butter are added, and the toast is assembled and cut according to this fictional stall's serving style. Both items must be ready before a combined order can complete. Soft-boiled eggs are a separate future side, not an ingredient to add to the toast.

Kaya toast with butter is an actual local menu item; the exact assembly gesture and timing still need review rather than being presented as universal practice. [Ya Kun menu](https://app.yakun.com/kaya-toast-with-butter.html)

Unlocks should introduce a new cultural distinction or meaningful action. Avoid adding complexity purely by shortening timers or stacking more tickets. A later regular customer can order the same drink in a slightly different reviewed phrasing to test transfer.

**Build gates and review**

1. Lock the three recipes, a small set of explanations, and one representative final-art frame.
2. Complete Kopi-O Kosong from customer line to successful serve, using direct controls and deterministic state.
3. Add the Kopi-C and Kopi-O contrasts, both guidance modes, and the shift ending.
4. Add typed model-powered questions and their static fallback; add voice if time permits.
5. Verify all recovery paths and review the actual wording, art, and audio with someone familiar with local kopi ordering.
6. Freeze features and rehearse on the event laptop. Keep tea and toast as clearly labelled future content.

Acceptance checks: a wrong milk cannot pass; a missing sugar portion can be repaired; an equivalent valid addition order succeeds; a mixed wrong cup requires a reset; double input cannot duplicate ingredients or rewards; reduced motion finishes; stale AI replies cannot affect a new order; switching mode keeps the cup; unavailable AI still leaves a complete playable shift.

Ask a new player to make a different supported order afterward and explain one ingredient choice. Track whether help was used. This is evidence for understanding within the session, not proof of long-term learning or real stall competence.

**Pitch**

“You hear Kopi-O Kosong all the time—but what actually goes into the cup? In Kopi Shift, you run the stall for one morning and learn Singapore's coffee language by making the orders.”

Original storyboard source is preserved in `reference/source-snapshot/kopi-shift-storyboard.js`. The original board above remains the prior 30-frame exploration. This worktree adds a separate smaller concept board.
