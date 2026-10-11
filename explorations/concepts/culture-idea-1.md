# Culture idea 1: Your First Lunch in Singapore

> Naming update: this is **Culture idea 1**. The preserved source used “Design idea 1” as a sequence label; its track has always been Culture × Tech. See [the new exploration](ideas/02-living-tape/brief.md) for a smaller, performance-led alternative. This document preserves the original scope for comparison.

## Product definition

Build a short browser game that looks like an old instructional VHS programme and responds to the player's voice.

The player orders coffee and a meal for friends who are coming to meet them at a Singapore hawker centre. The friends describe their preferences in ordinary English. A friendly host helps the player translate those requests into local ordering terms.

The central reveal is simple: **the tape can hear you**. Saying a drink or dish name changes the scene. A cup appears, a food tray lifts, and the stallholder prepares the order.

This document combines the ideas and recommendations from the brainstorm into one proposed specification. It also supplies implementation defaults where the conversation left choices unresolved. These defaults form a buildable design, rather than a record of who suggested each detail.

- Working title: **Your First Lunch in Singapore**.
- Track: **Culture × Tech**.
- Format: a single-player, illustrated 2D browser experience with spoken interaction.
- Primary audience: newcomers to Singapore who find local food names and ordering shorthand unfamiliar.
- Secondary audience: visitors, local friends introducing the culture, and event attendees trying the demo.
- Proposed complete session: approximately 3–5 minutes, including a coffee chapter, a meal chapter, and a short recap.
- Demo goal: make the voice-to-scene interaction understandable within the first 30 seconds of gameplay.
- Implementation direction: a simple frontend and backend. A game engine is unnecessary for the proposed scenes.

## Problem, purpose, and design hypotheses

- A newcomer can obtain food by pointing without learning its name or understanding the exchange.
- Unfamiliar coffee terms can make someone avoid trying a drink because they fear ordering something they will dislike.
- The experience should help the player connect a preference, a local term, and the resulting food or drink.
- The purpose is confidence in everyday cultural participation, rather than pronunciation grading or a comprehensive language course.
- Ordinary English remains a valid way to order. Local terms provide an additional skill.
- Ordering for friends gives the player a practical reason to translate preferences into an order.
- A visible response to speech should make the connection between words and objects memorable.
- A host who prompts, waits, and gives hints should make speaking feel less intimidating.
- The tape premise should make direct address to the viewer feel natural and give the nostalgic presentation a purpose.
- These are design hypotheses. A working prototype should test whether players understand the words and feel more willing to try an order.

## Narrative and characters

### The tape

- The player finds an old instructional tape titled “Your First Lunch in Singapore.”
- A brief title card establishes the premise. Avoid a long explanation before the first interaction.
- Pressing Play starts a warm, slightly dated educational programme.
- The host pauses for an answer, then the stallholder responds to the player.
- The surprise concerns the programme responding. Microphone permission and recording controls remain explicit.
- The tape frames a lesson. It does not require a historically exact simulation of a particular decade.

### The player and friends

- The player is already at the hawker centre.
- Two friends are on their way and ask the player to order ahead.
- Their requests appear as small message cards inside the programme.
- Use a telegram-inspired card treatment: paper texture, a short sender label, and a concise message.
- These are scripted fictional messages. They do not require a messaging application or external integration.
- Friends' requests use ordinary English, because translating the preference is the learning task.
- For the takeaway meal, the friend can say they will meet the player at the centre and collect lunch to take away.
- Other requests can specify eating there. The order container must follow the stated choice.

### Host and stallholder

- The host acts as a patient guide and addresses the player directly.
- The host asks a short question, pauses, and offers help when needed.
- The stallholder is a warm older character with a small set of reusable poses.
- The stallholder acknowledges an order and performs a simple preparation animation.
- Use conversational local phrasing without treating the character as a caricature.
- The host and stallholder can appear as separate illustrated figures. The host may instead appear in a small programme inset.
- Names and exact dialogue can change without changing the gameplay.
- Character voice, delivery, and vocabulary should receive a brief review from someone familiar with local ordering.

## Scope for a complete small build

### Included

- One tape opening and microphone setup.
- One coffee-shop scene with three visible drink variants.
- Two sequential friend requests in the coffee scene, with one drink per request.
- One food-stall scene with three visible food choices and one meal mission.
- Rice, one selected dish, quantity, and having-here or takeaway information in the meal order.
- Host prompts, progressive hints, short explanations, and recovery from unclear speech.
- A visible order slip and in-scene preparation animation.
- A replayable closing recap.
- A constrained parser that accepts supported local terms and ordinary-English descriptions.

### Scope limits

- Use scripted missions and a finite menu.
- Use preset animations and a small set of character poses.
- Keep the first build to one serving per friend request.
- Exclude payments, prices, accounts, real orders, multiplayer, and real messaging integrations.
- Defer additional stalls, beverages, dialects, and open-ended conversation.
- Defer voice interruption, arbitrary mid-order changes, and freeform negotiation.
- Do not add those features merely because the brainstorm mentioned them as possible interaction examples.

### Build fallback

- If time is limited, finish one coffee mission and the core meal-selection loop before adding more content.
- Keep the full coffee-plus-meal experience as the target.
- A coffee-only slice can validate speech and cultural teaching. It does not demonstrate the complete meal vision.
- The most important meal moment is naming a dish and seeing its tray lift before food enters the container.

## Core gameplay loop

1. A friend card describes an order in ordinary English.
2. The menu and scene show the available choices.
3. The host asks what the player should tell the stallholder.
4. The player speaks an answer.
5. The system identifies a supported drink, dish, or ordering detail.
6. The scene acknowledges that choice visibly.
7. The host or stallholder asks for a missing detail, if necessary.
8. The player confirms the complete order by voice.
9. The stallholder prepares the drink or meal.
10. The programme briefly connects the local term to the friend's preference.
11. The player continues to the next request or chapter.

- Players may give a complete order in one turn or answer a short follow-up question.
- A correct English description completes the order and receives a local-language teaching moment.
- A correct local phrase completes the same order and receives a brief positive acknowledgement.
- A wrong order receives a specific hint. An unclear recording receives a request to repeat.
- Do not confuse unclear recognition with incorrect cultural knowledge.
- Do not require one exact sentence or a particular accent.
- Dish images help the player identify items. Clicking them does not place an order in the normal voice flow.

## UI layout and visual direction

### Main scene

Use one scene-first layout, rather than a conventional form or chat interface.

| Area | Content | Behavior |
| --- | --- | --- |
| Outer frame | Tape title, subtle VHS border, chapter label | Establishes the programme and current lesson |
| Upper scene | Menu board with local names and short meanings | Gives the player enough information to attempt an order |
| Centre | Coffee stall or food counter with the stallholder | Provides the main visual setting and character response |
| Food counter | Three separately addressable trays behind glass | Lifts the recognized tray and shows preparation |
| Side or corner | One active friend-request card | Keeps the ordinary-English goal visible |
| Lower corner | Small order slip with selected items and unresolved details | Reflects actual game state without covering the food |
| Bottom scene | Subtitles and a compact microphone control | Shows whose turn it is and how to answer |
| Secondary controls | Hint, repeat prompt, sound, restart | Helps the player recover without leaving the scene |

- Keep the menu, friend request, and current order readable at the same time.
- Present one active request, even when two friends are part of the story.
- Give food and drink objects stable positions so the player can connect a word with the same object across turns.
- Avoid a large transcript panel competing with the stall scene.
- A small “Heard: …” line may appear when the system needs the player to resolve recognition uncertainty.
- Keep technology names, confidence values, and raw model responses out of the player interface.

### VHS and art treatment

- Use a warm, slightly faded palette, paper signs, tiled surfaces, and familiar coffee-shop or hawker-stall details.
- Use an illustrated collage or simple sprite style with limited, slightly stepped motion.
- This can evoke stop-motion without producing actual stop-motion video.
- Add light grain, restrained scanlines, a brief tape-start effect, and small programme title cards.
- Keep overlays away from text and microphone controls.
- Keep strong flicker, distortion, and long glitch transitions out of the default experience.
- Preserve clear contrast and subtitle readability.
- Offer a reduced-motion mode that keeps selection and completion understandable without tray movement or tape effects.

### Responsive behavior

- Prioritize laptop screens for the event demo.
- Use a fixed composition ratio inside a responsive container, rather than coordinates tied to one pixel resolution.
- On smaller screens, place the request and order slip below the scene while preserving food visibility.
- Keep microphone and help controls reachable without horizontal scrolling.
- Use keyboard-operable controls with visible focus states.
- Define the initial browser support around the actual demo laptop. Expand support after the main interaction works.

## Screens and transitions

### Tape opening and setup

- Show the tape title and a large Play control.
- Explain briefly: “This tape listens when you answer.”
- Request microphone access after the player presses Play.
- Show a short microphone check before the host begins.
- If permission fails, explain how to enable it and offer a retry.
- Keep setup short. Do not hide microphone permission to preserve the surprise.

### Coffee chapter

- Show the coffee stall, its menu, the stallholder, and the first friend's request.
- Introduce the request before asking the player to order.
- Highlight or raise the recognized cup when the order is understood.
- Add the confirmed drink to the order slip and prepare it visibly.
- Show the second friend's request after the first drink is complete.
- Conclude with a short explanation of the terms used.

### Meal chapter

- Use a brief chapter card and transition to the food stall.
- Show the trays, rice, the stallholder, and the friend's meal request.
- Raise the selected tray after recognizing its name or equivalent English description.
- Ask for missing rice, serving, or dining details only when the mission requires them.
- Confirm the completed order, then transfer rice and food into the correct container.
- Use a takeaway box for takeaway. Use a plate for having here.

### Recap and replay

- Show the completed drinks and meal with their local names and plain-English meanings.
- Highlight the terms the player practised, including terms supplied by a hint.
- End with encouragement to try an order in everyday life.
- Offer “Replay the tape” and “Practise the meal again.”
- Do not present a false claim that the player mastered the vocabulary after one attempt.

## Learning content and example missions

The messages and dialogue below are proposed game content. They make the design concrete and can change after review.

### Coffee menu

| Local term | Meaning shown in the game | Accepted ordinary-English meaning |
| --- | --- | --- |
| Kopi-O | Black coffee with sugar, without milk | Black coffee with sugar |
| Kopi-O Kosong | Black coffee without sugar or milk | Black coffee, no sugar and no milk |
| Kopi-C | Coffee with evaporated milk and sugar | Coffee with evaporated milk and sugar |

These distinctions follow Singapore's [HealthHub coffee guide](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/i-love-coffee-i-love-tea). This is a small teaching menu, rather than a claim that every stall prepares every drink identically.

- Friend one: “Could you get me a black coffee with no sugar or milk?”
- Target order: one Kopi-O Kosong.
- Friend two: “I'd like coffee with evaporated milk and sugar.”
- Target order: one Kopi-C.
- Kopi-O stays visible to make the sugar distinction concrete.
- All coffee in these missions is hot. State that in the menu or mission context.
- Requests such as “coffee with milk” need clarification because the milk type affects the local order.
- Requests for unsupported iced or extra-sweet variants receive a brief explanation of the available lesson menu.

### Food menu

- Show char siew, roast pork, and soy sauce chicken as visually distinct choices.
- Label char siew as barbecued pork. Singapore's [National Heritage Board cuisine guide](https://www.roots.gov.sg/ich-landing/ich/chinese-cuisine-in-singapore) identifies char siew among Cantonese barbecued meats.
- Keep char siew and roast pork as separate items. A [local restaurant menu](https://www.powsing.sg/wp-content/uploads/pdf/menu_bb.pdf) lists them separately and also offers combinations.
- Do not automatically translate an ambiguous request for “roast pork” into char siew.
- Keep each tray's image, label, supported English description, and parser identifier aligned.
- Use a short menu explanation rather than requiring the player to infer a dish from appearance alone.

### Meal mission

- Friend message: “I'm meeting you at the hawker centre to collect lunch. Could you get me rice with barbecued pork to take away?”
- Target: one serving of rice with char siew, takeaway.
- Example local answer: “One char siew rice, tapao.”
- Accepted English answer: “One rice with barbecued pork, takeaway.”
- The takeaway term can use `tapao`, `ta bao`, or `dabao` as configured recognition variants.
- Display one reviewed spelling consistently in the lesson. Do not grade spelling from spoken input.
- The [Singapore Global Network guide](https://singaporeglobalnetwork.gov.sg/wp-content/uploads/2025/04/exploringsg2025.pdf) uses “Kopi Ta Bao” for a to-go order.
- The same meal system supports a having-here response and a plate, even if the first mission uses takeaway.
- A response that conflicts with the friend's request receives a specific reminder before preparation.

## Dialogue, hints, and completion

### Dialogue style

- Keep each spoken prompt short enough to remember while looking at the menu.
- Speak one question at a time.
- Mirror spoken prompts in subtitles.
- Use authored response templates for the core missions.
- Use a small set of recorded voice clips for the initial build.
- For a response without a recorded clip, use a generic spoken acknowledgement and a specific subtitle.
- Optional text-to-speech can supply dynamic lines later. It is not required for the main loop.

### Example exchange

1. Friend card: “Black coffee, no sugar or milk, please.”
2. Host: “What do we tell uncle?”
3. Player: “Kopi-O Kosong.”
4. Stallholder: “One Kopi-O Kosong?”
5. Player: “Yes.”
6. The cup rises and moves to the order area.
7. Host: “That's black coffee without sugar or milk.”

### Progressive hints

- First hint: identify the missing distinction, such as sugar or milk.
- Second hint: direct attention to the relevant menu term.
- Final hint: show and speak the complete phrase so the player can practise it.
- Make hints available by button and through supported spoken requests such as “Help” or “What should I say?”
- After repeated silence, offer help without marking an answer wrong.
- Allow unlimited retries within the short session.

### Success and mistakes

- Complete an order when its meaning matches the mission, whether the player uses local terms or ordinary English.
- Teach the local term after an English answer. Do not force a second local-language attempt to unlock completion.
- If the player uses the wrong drink variant, explain the specific mismatch.
- If a required detail is missing, ask for that detail and retain the details already understood.
- Ask for confirmation before committing the order to preparation.
- A spoken “No” returns to the draft order so the player can replace a choice before preparation.
- A tray lift indicates recognition. It does not imply that food was already packed.
- Do not use a countdown, lives, public ranking, or a pronunciation score in the initial design.

## Voice behavior and recovery

### Recommended initial voice interaction

- Use short, explicit turns: press a microphone control to start, then press it again to finish the answer.
- Allow the same operation with a keyboard control that ignores key repeats.
- Keep the microphone closed during host and stallholder playback.
- Show clear states: Ready, Listening, Understanding, and Replying.
- The turn-based implementation supports the programme's ask-and-pause format and avoids needing continuous conversation infrastructure.
- Upgrade to automatic speech-end detection or streamed transcription only after the basic loop works reliably.

### Processing behavior

- Capture one utterance, transcribe it, parse its meaning, and return a validated result.
- Animate recognition after the interpreted result arrives. Do not promise movement while the player is still speaking in this first version.
- Target visible processing feedback immediately and a result within roughly two seconds after submission on the demo setup.
- Treat that response time as a target to measure, not a verified service guarantee.
- Allow only one pending utterance per game session.
- Cancel or ignore outdated results after replay, scene changes, or a new session.

### Recovery cases

| Situation | Player-facing behavior | State behavior |
| --- | --- | --- |
| No microphone permission | Explain how to enable it and offer retry | Do not enter a listening state |
| No detected speech | Ask the player to try again | Keep the current request and order |
| Unclear transcription | Show the uncertain phrase briefly and ask for repetition | Do not choose or pack a dish |
| Ambiguous dish or drink | Ask a targeted clarification | Preserve already understood details |
| Wrong but understood order | Explain the mismatch with the friend request | Keep preparation uncommitted |
| Unsupported menu item | Name the available choices for this lesson | Do not invent a dish or recipe |
| Network or service failure | Explain that the answer could not be heard and offer retry | Do not apply a partial result |
| Duplicate answer submission | Acknowledge the existing result | Do not pack the same order twice |

- A separately labeled typed-answer mode can support accessibility or a failed microphone setup.
- Keep spoken ordering as the normal experience.
- Typed answers must use the same interpretation and validation rules.
- Never pass a simulated or typed response off as live speech during the demo.

## Animation and asset requirements

### Minimum asset set

- One tape title card and a lightweight frame treatment.
- One coffee-stall background and one food-stall background.
- One host portrait or figure.
- One stallholder with idle, speaking, reaching, and serving poses.
- Three coffee variants, with distinct labels and useful ingredient cues.
- Three independently movable food trays.
- Rice, a food portion, a plate, and an empty and filled takeaway box.
- Friend cards, order-slip styling, subtitles, and microphone-state icons.
- A small set of voice lines and restrained preparation sound effects.

### Preset sequences

- Drink recognized: raise or emphasize the matching cup.
- Dish recognized: raise the matching tray slightly and emphasize its label.
- Order confirmed: acknowledge the order and begin preparation.
- Meal preparation: show rice entering the container, the stallholder reaching, and a portion moving from tray to container.
- Completion: show the finished order clearly before continuing.
- Wrong or unclear answer: return preview objects to neutral and preserve the committed order.

- Use layered images, SVG, and CSS transforms for the first implementation.
- A cutout moving along a short path can represent food transfer. Continuous character simulation is unnecessary.
- Keep animation definitions reusable across dishes.
- Update order state independently of animation timing.
- Provide an animation-completion event and a reduced-motion path so the game cannot become stuck waiting for movement.
- Preload the next scene's essential images and voice clips before its chapter begins.

## Recommended technology and architecture

### Stack

| Concern | Recommendation | Purpose |
| --- | --- | --- |
| Frontend | React, TypeScript, and Vite | Scene composition, controls, subtitles, and game state |
| Rendering | Layered DOM elements, SVG, images, and CSS animation | The small number of interactive 2D objects |
| Backend | Node.js with TypeScript and Express | Audio processing, provider credentials, parsing, and validation |
| Speech input | One server-side speech-to-text service behind an adapter | Transcribes microphone recordings without coupling gameplay to a vendor |
| Character speech | Pre-recorded clips with subtitles | Predictable delivery and limited runtime dependencies |
| Game logic | Authored content and deterministic validation | Keeps menu choices and progression consistent |
| Storage | Static content files and temporary session memory | Avoids needing accounts or a database for the demo |
| Hosting | One HTTPS service serving the built frontend and API | Reduces deployment and cross-origin configuration |

React documents [TypeScript support](https://react.dev/learn/typescript), and Vite offers a [React TypeScript template](https://vite.dev/guide/). Express supports the [HTTP routes](https://expressjs.com/en/starter/basic-routing/) needed for a small API.

### Why a web application fits

- The proposed gameplay needs a few scenes, illustrated objects, sound, microphone capture, and preset movement.
- A DOM-based scene can represent each of those objects directly.
- A browser link makes the event demo easy to open and share.
- Unity could implement the idea, but the proposed scope does not require physics, a navigable 3D world, or complex character simulation.
- Use a game engine only if the product later develops those requirements.
- Reconsider a 2D rendering library only if the asset count or animation complexity becomes difficult to manage in the DOM.

### Architecture

```mermaid
flowchart LR
    A[Browser microphone] --> B[Frontend records one answer]
    B --> C[Backend audio endpoint]
    C --> D[Speech-to-text adapter]
    D --> E[Transcript parser]
    E --> F[Menu and mission validation]
    F --> G[Structured turn result]
    G --> H[Frontend state and preset animations]
    H --> I[Recorded dialogue and subtitles]
```

- The frontend owns scene presentation, playback, and microphone controls.
- The backend owns interpretation of the audio and validation against the current mission.
- The speech provider returns a transcript. It does not choose arbitrary animations or alter game state directly.
- The parser resolves only supported items and details.
- The backend returns a finite set of outcomes such as clarify, hint, preview, confirm, or complete.
- The frontend maps those outcomes to known visuals and clips.

### Browser audio

- Request microphone audio with `getUserMedia()`.
- Record each answer with `MediaRecorder`.
- Detect a supported recording format instead of assuming every browser produces the same audio type.
- Check that the chosen speech service accepts that format. Convert it on the backend if necessary.
- Release recording buffers after processing and stop microphone tracks when the session ends.
- Request microphone access on HTTPS in deployment. Local development can use localhost.

These browser requirements follow MDN's documentation for [microphone access](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), and [recording-format support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

### AI boundaries

- Begin with normalization, an alias table, and explicit rules for the small lesson menu.
- Recognize local names, ordinary-English ingredient descriptions, confirmation, help, quantity, rice, and dining mode.
- Match longer coffee terms before shorter ones. “Kopi-O Kosong” must not become “Kopi-O.”
- Preserve negation: “no sugar” and “no milk” change the intended drink.
- Do not map a vague request such as “milk coffee” to a specific milk type without clarification.
- Use a language model only if realistic paraphrases exceed the rule parser's coverage.
- If used, require structured output restricted to menu identifiers and supported fields.
- Validate that output with the same rules before changing state.
- Keep lesson facts, dialogue templates, and success conditions in authored content.
- Freeform generated explanations must not become the source of truth for cultural meanings.
- Select the speech provider and any optional model after a quick test with the actual vocabulary and demo microphone.
- Do not assume hackathon Codex credits also fund the application's speech or inference API calls.

## State and proposed API contract

This contract is a proposed application design, not an existing service interface.

### Session state

- `sessionId`: identifier for the current playthrough.
- `sceneId`: coffee or meal.
- `missionId`: active friend request.
- `phase`: setup, prompting, listening, processing, clarifying, confirming, animating, or complete.
- `draftOrder`: understood fields that the player has not confirmed.
- `committedOrders`: completed, confirmed orders.
- `hintLevel`: current mission's hint progress.
- `turnId`: identifier for the active answer.
- `revision`: version of the session state used to reject stale results.

### Order content

- A drink order contains a menu item and quantity.
- A meal order contains rice selection, dish identifier, quantity, and dining mode.
- Canonical menu items store ingredient meanings, English descriptions, aliases, hint lines, and animation identifiers.
- Use the same content definitions to render the menu and validate the answer.
- Friend missions define expected order fields and a short ordinary-English request.
- Missing information stays missing until the player supplies it or the mission explicitly establishes a default.
- Only a confirmed order enters `committedOrders`.
- On confirmation, the backend returns the completed order and the next mission. The frontend displays that mission after serving finishes.
- A null next mission signals that the frontend should show the recap after the final serving animation.
- Completing the serving animation advances the presentation, without committing the same order again.

### Endpoints

| Endpoint | Input | Output |
| --- | --- | --- |
| `POST /api/sessions` | Lesson identifier | Session identifier, first mission, and initial revision |
| `POST /api/sessions/:id/turns` | Recorded audio or a typed accessibility answer, turn identifier, and expected revision | Transcript, validated outcome, updated order, next mission when completing, and new revision |
| `POST /api/sessions/:id/hints` | Mission identifier and expected revision | Next authored hint and updated hint state |
| `DELETE /api/sessions/:id` | Session identifier | Session cleanup acknowledgement |

- Spoken confirmation is another turn. A separate order-confirmation endpoint is unnecessary.
- Hint buttons request authored help through the hint endpoint. Spoken help uses the turn endpoint.
- Return response identifiers for dialogue and animation, rather than executable scripts or arbitrary asset URLs.
- Enforce turn ordering and deduplicate repeated `turnId` values.
- Keep sessions in temporary memory for a single-instance demo. A restarted backend may require the player to restart the tape.
- Serve frontend assets from the same origin as the API for the initial deployment.
- Keep provider credentials on the backend.
- Set short recording limits, upload limits, and processing timeouts suitable for one answer.
- Do not retain raw recordings after processing in the demo application. Confirm the chosen speech service's own retention behavior separately.

## Build sequence

1. Define the small menu, friend requests, local-term meanings, and authored prompts.
2. Build the coffee and meal scenes with placeholder assets and direct scripted events.
3. Implement the order state and parser using text fixtures before connecting speech.
4. Connect microphone capture, one transcription service, and the backend turn endpoint.
5. Complete one coffee request from spoken answer through confirmation and serving.
6. Complete the meal tray-lift and packing loop.
7. Add the second coffee request, hints, chapter transitions, and recap.
8. Replace placeholders with the limited final asset set and recorded dialogue.
9. Add tape styling, responsive behavior, and reduced-motion presentation.
10. Rehearse the full demo on the actual browser, microphone, and network.

- Resolve the hardest dependency early: recognition of kopi terms and dish names from the intended microphone.
- Keep the narration and art independent of provider selection.
- Prioritize the visible spoken-order loop before elaborate tape effects.
- Finish a playable path before adding more vocabulary or conversation freedom.

## Acceptance criteria

### Experience

- The player understands that they are ordering for friends and can identify the active request.
- The tape premise establishes why the host speaks to the viewer.
- The microphone controls explain when the game listens.
- One spoken answer produces an understandable scene response early in the demo.
- The player can finish both chapters without developer intervention.
- The player can recover from an unclear answer, a wrong choice, and a service error.

### Learning and order correctness

- “Kopi-O Kosong” selects the no-sugar, no-milk drink rather than Kopi-O.
- The equivalent ordinary-English coffee request completes the same mission.
- “Coffee with milk” receives a clarification when milk type is unresolved.
- A sugar mismatch receives a specific correction tied to the friend request.
- “Char siew” previews its tray, rather than a generic pork tray.
- The corresponding English description can select the same dish.
- An ambiguous pork description does not silently select the wrong dish.
- Rice and dining details remain visible in the order slip.
- Having here produces a plate. Takeaway produces a box.
- A wrong dining mode is resolved before completing the mission.
- Hints teach the available content without punishing ordinary-English answers.

### Reliability

- Host audio does not become a player order.
- Unrecognized speech does not pack food or advance the lesson.
- A duplicate turn does not create a duplicate drink or meal.
- An outdated response cannot modify a restarted playthrough or a different mission.
- Reduced-motion mode still reaches completion.
- The main flow runs from an HTTPS deployment and on the intended demo browser.
- Processing feedback remains visible while waiting for the speech service.

### Evidence to collect during a short rehearsal

- Whether a new player understands the mission without verbal explanation from the presenter.
- Whether the player notices the connection between a spoken name and a moving object.
- Whether the player can explain at least one coffee distinction afterward.
- Whether the player understands that ordinary English remains acceptable in real ordering.
- How often speech requires repetition and how long a turn takes on the demo setup.
- Whether the nostalgic presentation helps the interaction or distracts from the menu and voice controls.

## Remaining production choices

- Final illustration style and character appearance.
- Exact recorded dialogue and reviewed local phrasing.
- Consistent display spelling for the takeaway term.
- Speech provider, recording format, credentials, and runtime budget.
- Whether the rule parser needs an optional model after vocabulary testing.
- Hosting destination and intended browser support beyond the demo laptop.
- Whether typed-answer accessibility ships in the first build or follows the main voice flow.
