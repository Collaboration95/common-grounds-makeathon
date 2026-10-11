# Design idea: Waldo / Cameo

**A complete creative and technical brief for a personalised pixel-art hidden-character experience.**

**Status:** under consideration alongside The Commons, an extendible universe. Proposed track: **Culture × Tech**.

Recorded 11 October 2026. This brief preserves the concept’s ideology, vibe, philosophy and technical specifications.

This is the consolidated specification for a multiversal hidden-character experience, including on-site award information. No working game, tested generation pipeline or final artwork exists yet.

**Status vocabulary matters.** “Core” identifies the creative direction to preserve. “Recommended” identifies a proposed production choice. “Optional” identifies an enhancement. “Later” identifies an expansion outside the proposed one-day build. Numerical targets are starting assumptions unless explicitly attributed to the organisers. Accepting this brief is not evidence that every example, model, name or engineering choice has been individually selected or tested.

**The idea in one sentence:** choose a world, a moment and a guest; turn them into a miniature pixel scene; find the guest and watch them briefly steal the moment.

**Working identity and language**

| Item | Direction |
| --- | --- |
| Requested document/concept handle | Waldo; personalised Where's Waldo-like game |
| Recommended working product name | Cameo |
| Other names explored | Scene Stealer; Guest in the Story |
| Tagline | Someone unexpected. Somewhere unforgettable. |
| Short pitch | We turn the worlds people love into little places they can hide each other in. |
| More performative pitch | Your favourite moment. One tiny scene-stealing performance. |
| Recommended event track | Culture × Tech |
| Primary interaction | Cast → search → discover → watch the payoff → recast or challenge someone |
| Signature pleasure | “Why is that person here?” followed by “Where did you hide them?” |

“Waldo” is the familiar explanation of the mechanic, not a requirement to use the original striped character or branding. Product naming remains open; name availability has not been checked.

**The original user idea must remain recognisable.**

- Use image generation to make a Where's Waldo-like scene in a pixel-game style.
- Let someone describe a famous moment from a film or book.
- Let them choose or customise the character they must find; the target changes between puzzles.
- Support favourite fictional characters, a personal avatar and, eventually, people meaningful to the creator.
- Example seed: find Snape in a Quidditch crowd while Harry and Cho compete for the Snitch.
- Extend to real-world or historical settings, including famous guests who could not have been there at that time.
- Make the experience personal to the creator, their interests and their moments.
- Evaluate it in the context of the Common Ground makeathon.

The refined concept adds an expressive discovery, a friend-to-friend challenge loop and an explicit separation between image generation and reliable puzzle construction. These additions support the original idea; they must not erase the ambition to describe a custom moment.

**The ideology is playful cultural authorship.**

The player gets to decide who enters a world, what moment deserves attention and how familiar material can be reinterpreted. A fan gives a minor character a moment. A friend inserts an inside joke into a favourite film. A reader creates the setting they imagined before seeing an adaptation. A visitor from another era misunderstands the occasion in a recognisable way.

Searching turns passive viewing into sustained attention. People inspect costumes, relationships, props and tiny incidents because those details might lead them to the guest. The ambition is a world worth looking at and a discovery worth sharing.

The creative priorities are immediate delight, strong art direction, very few screens and an experience that makes people react. An educational benefit is welcome when it arises naturally.

The central design principles are:

| Principle | What it means in the actual product |
| --- | --- |
| Personal casting | The guest and moment should express someone's taste, memory or joke |
| Specificity | Recognisable details and relationships make the setting meaningful |
| Discovery has a payoff | Finding someone triggers an expressive moment, not only a success marker |
| Fairness earns trust | The target exists, matches its portrait and can be found from visible information |
| Richness within one scene | Spend effort on composition, reactions and feedback before adding screens |
| Player authorship stays visible | A changed guest, accessory or moment produces an understandable change |
| AI has a concrete job | It creates or interprets requested material; application logic preserves a playable puzzle |
| Shared enjoyment | A recipient and the presentation audience can understand what is happening |
| Taste over volume | A few excellent scenes and discoveries are preferable to many indifferent generations |
| Honest scope | Prepared content, live generation, templates and unsupported requests are distinguishable |

Avoid turning this into a generic prompt form followed by a static output gallery. A chat transcript, dashboard, account flow or long avatar setup should not dominate the experience.

**The intended vibe is an affectionate miniature spectacle.**

Think of a dense illustrated puzzle page meeting a little pixel theatre: cosy enough to inspect slowly, playful enough to hide an absurd guest, and deliberate enough that the reveal feels directed. The emotional progression is recognition, curiosity, searching, discovery, a smile, and the urge to make a version for someone else.

The proposed tone is warm, mischievous and observant. Humour comes from character and context. A randomly inserted celebrity can be amusing; a celebrity visibly trying to participate in the wrong occasion is a stronger scene. Affectionate, chaotic and nostalgic are useful authoring tones, not three separate game systems.

Avoid visual noise masquerading as richness, relentless movement, unreadable retro typography, an aggressive countdown, punishment for asking for help, and jokes that require a long explanatory paragraph. Small incidental sound and a short reveal cue can help; essential information must remain visible with sound muted.

**Why this belongs in Culture × Tech**

The event includes contemporary culture, subcultures and emerging expression alongside heritage, language and tradition. Films, books, fandom, communal rituals, shared references and personal memories are suitable cultural material. The project's cultural act is reinterpretation through casting and attention. Pixel styling alone does not establish cultural depth. [Event description](https://luma.com/yjffwqr2).

Give each showcase scene at least three identifying anchors: a recognisable event or composition, distinctive objects or costumes, and relationships or behaviours specific to that world. Familiarity should enrich the search and the joke. Someone unfamiliar with the fandom must still be able to solve the puzzle from the target portrait.

For local heritage scenes, choose references with care. A Singapore setting should contain specific, reviewed details rather than generic lanterns, food stalls and a skyline. For personal memories, preserve the creator's perspective and distinguish recollection from documentary reconstruction. For books, allow an interpretation of the text rather than requiring the visual language of an existing film.

A historical remix must be presented as imaginative. Initially ask players to find a named guest. A later “find what does not belong” mode needs a reviewed setting and a defined answer set: accidental generation errors must not become competing correct answers.

The user's Harry-versus-Cho example can be framed as Gryffindor versus Ravenclaw for a canon-faithful scene; Cho is Ravenclaw's Seeker. A Hufflepuff version can remain an intentional alternate-universe remix. The application should not turn this distinction into a lecture or silently claim an invented matchup is canonical. [Official Cho Chang profile](https://www.harrypotter.com/fact-file/characters-and-pets/cho-chang).

**Updated event evidence and its implications**

The local [event reference](reference/hackathon.md) now includes an [on-site prize-slide photograph](reference/prizes-slide-2026-10-11.jpg), inspected while preparing this brief. The award criteria inform the demo priorities below.

| Evidence | Implication for this concept |
| --- | --- |
| Track awards consider originality, relevance and execution within the track | Show a distinctive casting/reveal idea, explain the cultural relationship briefly, and finish the actual game loop |
| People's Choice rewards the biggest impression on the room | Projector legibility, audience recasting and the discovery payoff deserve production time |
| Best Use of Codex rewards use beyond the obvious and essential to the build | Preserve genuine evidence of Codex's contribution to development; a runtime image call alone does not establish this |
| Common Ground Award wording is partially obscured in the photo | Do not invent its full criterion or optimise against a guessed interpretation |
| Weights, exact presentation allowance and build cutoff remain unspecified in the reference | Treat five focused build hours and a 90-second demo as internal assumptions |

The event's published window is 9 a.m.–5 p.m. on 11 October 2026. It includes activities beyond building; use actual remaining time when implementing. This document does not predict a win or assume a particular prize is obtainable. Codex development credits do not establish image-API access or application inference funding.

**Three concept directions were explored.**

| Direction | Concrete example | Strength | Limitation | Disposition |
| --- | --- | --- | --- | --- |
| Favourite-scene cameo / Scene Stealer | Snape at Quidditch; finding him makes him confiscate a cheering flag | Recognition, fandom and a comic payoff | Search-and-click interaction is familiar | Core direction |
| Unexpected guest / Time Crash | A modern performer at an imagined old royal ball; a space traveller in a wizarding stadium | Immediate incongruity; strong presentation hook | Can be visually obvious or culturally shallow | Signature recasting example; no separate campaign |
| Personal postcard / Someone Was Here | A friend's avatar in a shared trip; a remembered family kitchen and apron | Emotional attachment and a reason to send the scene | Private context is less legible to strangers; accurate reconstruction is harder | Later extension |

Recommended synthesis: a favourite cultural scene with an unexpected guest and a small scene-stealing performance. Historical settings are additional destinations. Personal memories extend the same casting-and-discovery system.

**The signature example gives the world, search and joke different jobs.**

World: a packed wizarding stadium. Moment: the instant before the Snitch is caught. Guest: Snape, visibly unimpressed.

The distant aerial chase establishes the moment. Spectator stands, a refreshments area and an officials' platform provide readable search regions. A spectator spills a drink; two others argue over binoculars; scarves and flags add local movement. The target appears at a plausible crowd scale among several people who share some of his visual features.

The player finds Snape. The surrounding crowd becomes less prominent, the camera moves closer and he confiscates an overenthusiastic spectator's flag. Proposed caption: “Enthusiasm confiscated.” This is an authored comic interpretation, not a quotation from the source work.

Recast the same setting with a space traveller. Their colour treatment fits the world, but their suit, posture and helmet preserve identity. On discovery, they lift their visor as everyone else watches the match. This second version makes personalization visible without demanding another full background generation.

Use an authored reaction for each showcase guest. A general custom avatar can use a shared wave, hop or prop-lift. Arbitrary user prompts do not imply arbitrary bespoke animation on day one.

**Personalisation operates at three levels.**

| Level | Input | Visible consequence | Initial implementation |
| --- | --- | --- | --- |
| Casting | Select a fictional or famous guest | Different target appearance and reveal | Two curated guests |
| Avatar | Hair, clothing, accessory and name | Recognisably different small character | Small editor if chosen over the second curated target |
| World and moment | Describe a setting and event | Different cultural scene and composition | Full vision; curated destinations first if necessary |

Photo-based likeness is later. Start with a small set of clear identity cues. A recognisable silhouette and signature prop are more dependable than tiny facial detail. Do not force a person to customise before they have experienced a satisfying search.

**The full vision and the one-day build are different delivery levels.**

The full vision accepts an arbitrary described moment, generates a suitable scene, creates the requested guest, composes a fair puzzle and lets a recipient play the exact result. This is the product ambition, including the user's movie, book and historical examples.

The recommended vertical slice has one polished destination, two materially different castings or a working avatar editor, automatic hiding, hints, a reveal and replay. A saved challenge link is the next priority. Generated guest customization and a second destination follow if the core is strong.

If only curated destinations work, label the selection honestly. Do not accept an arbitrary book scene and return the same unrelated stadium. A supported prose input can alter a documented accessory, guest, tone or scene parameter; unsupported changes need a clear response. Curated scenes with custom guests demonstrate an important part of the idea but do not fulfil unrestricted prompt-to-world generation.

**Player activities and complete loops**

| Activity | What the person knows | Main pleasure | Scope |
| --- | --- | --- | --- |
| Find | Target portrait; unknown location | Recognition and discovery | Core |
| Recast | Existing setting; changeable guest | Reinterpretation and a new joke | Core, narrowly implemented |
| Challenge | A completed puzzle can be passed to someone | Sharing a reference or inside joke | Preferred extension |
| Direct | Exact placement, crowd and clues | Composing a deliberate experience | Later editor |
| Detect an anomaly | Rules of the setting; unknown intruder | Deduction and contextual knowledge | Later distinct game mode |

Player loop: open a ready puzzle → inspect target → scan/pan/zoom → notice details → optionally ask for help → choose target → enjoy reaction → choose another casting or share.

Creator loop: choose destination or describe a supported moment → choose guest → approve its small portrait → let the system hide it → play without seeing placement or send it to someone else.

Recipient loop: open an unsolved stable link → see the target and title without spoilers → play → discover → recast into a new puzzle.

Automatic placement preserves solo play. A later manual placement tool belongs to Direct mode because its creator already knows the answer. Do not animate the target travelling into the actual hiding position during setup.

**Replayability must be earned.**

Moving the same target to another coordinate adds limited novelty. A different silhouette changes the recognition task; different casting changes the joke; a different composition changes the search space; a friend's version adds curiosity about their choices. These are stronger reasons to play again.

One target is sufficient for a complete first round. Later, a few secondary discoveries can reward another look, but a large checklist can turn the experience into chores. Optional competitive timing would need the same immutable puzzle for every participant. No timer, leaderboard, account, feed, follower graph or real-time multiplayer is required for the first build.

**One main scene should carry the interface.**

Recommended layout: the world occupies most of the viewport; a stable target card gives the name and exact sprite; small controls provide hint, zoom/reset view, sound and recast. A setup overlay and a completion overlay are enough. These are states of one experience, not separate product pages.

| UI element | Purpose and behaviour |
| --- | --- |
| Scene title | Establish the moment and identify a remix where appropriate |
| Target card | Show the same sprite used in the scene, enlarged without changing identity cues |
| World canvas | Pan, zoom, inspect and select; keep input feedback visible |
| Hint control | Region clue → narrowed area → explicit reveal; label increasing assistance clearly |
| Recast control | Open a small casting overlay; keep the existing puzzle intact until replacement is ready |
| Completion treatment | Close-up and short performance, followed by replay/recast/share choices |
| Generation feedback | Truthful queued/working/failed state; preserve an already playable scene |
| Challenge link | Opens the exact unsolved scene; no preview revealing the answer location |

Candidate copy: “Find Snape”; “Need a clue?”; “Look near the refreshments”; “Show me”; “Recast this scene”; “Hide someone else”; “I put someone in this scene for you.” Hints must be selected from actual placement metadata, not invented independently.

**A proposed shot and interaction sequence**

| Beat | Frame and direction | Player action / exit |
| --- | --- | --- |
| 1. Immediate invitation | Ready scene with readable target portrait and one short task | Begin looking; no compulsory login or creation |
| 2. Establish | Brief wide view showing the main event and distinct search regions | Player takes control; respect reduced motion |
| 3. Search | Stable world, restrained ambient movement, fixed target | Pan, zoom, inspect, click or use keyboard equivalent |
| 4. Small discovery | A clicked background prop gives one short joke or response | Return to search; do not imply every pixel is interactive |
| 5. Wrong guess | Neutral local feedback; no time loss | Continue immediately |
| 6. Hint | True region clue; optional broad highlight | Return to search without moving target |
| 7. Found | Immediate confirmation, then camera emphasis | Lock duplicate success; transition once |
| 8. Performance | Guest's authored gesture and optional short caption | Skip or finish into completion |
| 9. Recast | Existing world remains visible behind compact casting choices | Approve guest or cancel |
| 10. Prepare | Hide placement details; keep old puzzle usable if generation is pending | Atomically install new puzzle when complete |
| 11. New challenge | New guest and placement, clean progress state | Play or share |
| 12. Recovery | Plain local message for failed generation or missing asset | Retry, keep current puzzle, or choose an available guest |

Scene recognition, target identity and found-state feedback must be visible to a person watching the projector. Use a magnifier or deliberate camera movement; the operator's laptop view alone is insufficient. Audience suggestions such as “upper stand” can provide participation without networking.

**Pixel-art and composition specification**

Choose a single perspective, logical pixel scale, outline treatment, light direction, character proportion and palette discipline before producing a large asset set. Elevated side-on or shallow isometric composition is a candidate, not a locked choice. Use the selected convention throughout background, crowd, guest, props and effects.

Generate larger assets if needed, then crop and normalize into the chosen logical grid. Nearest-neighbour scaling preserves existing pixels; it does not create missing identifying detail. Keep ordinary UI text comfortably readable instead of applying tiny pixel lettering everywhere.

Avoid committing to a small logical resolution merely because it looks retro. The first experiment should establish how many final-size figures remain distinguishable on the demo laptop and projector. Start by exploring roughly 30–60 crowd figures across several regions. This is a test range, not a minimum quota. Character size, crowd count and available screen area must be designed together.

A famous scene may need to be widened: show the ballroom around the dance, station around the farewell or stands around the match. The iconic event is an anchor; it need not be the hidden target. Group people into readable social clusters and leave enough spatial rhythm that the eye can choose where to look next.

The target should be visually plausible and conceptually unexpected. A neon astronaut in a muted historical crowd is an obvious target. Shared colours with a distinctive silhouette or accessory create a better recognition task. Add a few decoys that share some features but never every required identifying feature.

Keep the target stationary during searching. Give comparable ambient activity to other parts of the scene; the target must not be the only moving object. A handful of flags, steam effects and prop responses are enough. Continuous crowd simulation, arbitrary walking NPCs and camera spectacle that interrupts searching are outside the first build.

**Asset contract and art-production workflow**

Each reusable asset needs an identifier, version, file path or URL, dimensions, logical scale, anchor point, style-set identifier and role. Character assets additionally need visible identity features, an opaque hit mask or bounds, target-card crop and compatible reveal poses. Background templates need world dimensions, regions, crowd positions, approved target slots and any occlusion information.

Recommended art order:

1. Produce one representative final-style frame, one target and two distractors.
2. Test their legibility and integration at final size.
3. Produce the compatible crowd and a limited set of props.
4. Mark plausible floor/seat slots and region boundaries.
5. Add the second guest and authored reveal assets.
6. Add optional ambient motion and background interactions.

Example background instruction, to be adapted after selecting the art bible: “A wide, elevated view of a packed wizarding sports stadium at the instant of a distant aerial chase. Three readable spectator regions, a refreshments area, coherent seating perspective, consistent pixel scale and restrained palette. Preserve the central match as an establishing detail. Leave planned crowd positions readable. Exclude the named search target.”

Example target instruction: “One full-body character with [specific silhouette, clothing and accessory], matching the supplied crowd reference in scale, light, outline and palette. Transparent background; no caption, duplicate figure, surrounding scene or cast shadow inconsistent with the reference.”

These are authoring examples, not tested prompts or guarantees. Review actual outputs. A generated background without the named target can still contain an accidental lookalike.

**Puzzle fairness is a product requirement.**

| Rule | Required behaviour |
| --- | --- |
| Target existence | Exactly one designated target instance is placed within playable bounds |
| Identity | The reference portrait depicts the actual sprite; identifying features survive placement |
| Visibility | A sufficient visible portion remains; the target is not hidden beneath UI or fully obscured |
| Plausibility | Scale and placement agree with the scene; no floating or impossible seat positions |
| Distinction | Decoys are distinguishable using visible information; accidental target lookalikes are reviewed |
| Stable search | The target does not relocate during a round, after a hint, or on resize |
| Accurate interaction | Hit detection agrees with the visible sprite under every supported viewport transform |
| Honest assistance | Clues refer to the actual region, prop or placement |
| Neutral mistakes | Wrong guesses do not shame the player or deduct time |
| Single completion | Repeated clicks and animation callbacks cannot award or restart success twice |

Difficulty should vary through search region, crowd density, controlled similarity and hints. Do not equate “hard” with almost invisible pixels. Start with reviewed candidate slots; randomize among valid alternatives. A seeded arrangement is useful for reproducibility, but assets and renderer version must also be fixed.

Use a rough 15–45-second search target for the presentation's opening puzzle. Longer ordinary play may be enjoyable; this range serves the stage pacing, not a universal difficulty rule. Do not silently move the target to guarantee a fast find. Offer a clear hint or reveal instead.

**Input and accessibility specification**

- Pointer click/tap selects; drag pans. Use a movement threshold so releasing a pan does not count as a guess.
- Support bounded zoom and Reset view. Keep a large target preview available without hover.
- Implement pointer-to-world coordinate conversion consistently for mouse and touch.
- Provide keyboard access to controls and a visible inspection cursor or region-navigation alternative for the canvas. Focusing controls must not reveal the target inadvertently.
- Use silhouette, prop and text cues alongside colour. Avoid puzzles distinguishable only by hue.
- Respect reduced-motion preferences; replace camera travel and gestures with immediate, readable states that still complete.
- Make audio optional. Visible confirmation and captions carry the meaning.
- Keep focus sensible when opening/closing setup and completion overlays; announce found/error states without continuously narrating the canvas.
- A visual search remains inaccessible to some people. A nonvisual clue-based game is a separate design task; canvas labels alone are not equivalent gameplay.

**Recommended technical architecture**

Use a small browser application with a deterministic renderer and game state. A TypeScript frontend with Canvas 2D and ordinary DOM controls is a suitable starting point. Reuse an existing frontend setup if one is introduced elsewhere; this brief does not require a framework migration. A minimal server handles image-generation credentials, asynchronous jobs and optional shared puzzle storage. Unity, a full physics engine, 3D rendering and a large game framework are unnecessary for the proposed slice.

| Component | Responsibility | Boundary |
| --- | --- | --- |
| Scene renderer | Draw ordered assets, camera, feedback and authored animation | Does not invent gameplay truth from the rendered pixels |
| Game controller | Active puzzle, guesses, hint state, found transition, replay | Owns deterministic state transitions |
| Composer | Select valid slots, place target/crowd, produce final manifest | Guarantees explicit placement constraints |
| Content library | Reviewed scene metadata, guests, props, reveals and clue text | Separates cultural content from generated speculation |
| Generation adapter | Convert supported requests into asset-generation jobs | Returns candidates requiring normalization/validation |
| Job service | Status, retries, cancellation semantics and results | Never replaces an active puzzle with a partial result |
| Puzzle store | Persist immutable manifest and referenced assets | Does not regenerate artwork when a recipient opens a link |
| Share view | Open unsolved puzzle, local play progress, recast into a child puzzle | Never mutates the original challenge |

Keep private API credentials server-side. Accept bounded text and validated structured data; do not execute model-produced JavaScript, HTML or arbitrary animation code. Render generated labels as text. The model can help interpret a moment and generate visual assets; code owns visibility, answer identity, scoring if any, state transitions and click validation.

**Three rendering strategies were compared.**

| Strategy | Strength | Unresolved risk | Recommendation |
| --- | --- | --- | --- |
| Single complete raster, then model localization | Cohesive full-scene art | Missing/duplicated target, wrong likeness, uncertain coordinates | Acceptable for manually reviewed fixed puzzles |
| Generated setting plus controlled sprites | Explicit target location, consistent reference, recasting and saved answers | Style matching, valid slots and foreground occlusion | Recommended prototype foundation |
| Fully tiled world | Strong spatial and pixel control | Asset preparation, seams and repetitive layout | Consider if an appropriate tileset already exists |

A vision model may propose a location or flag a concern; that proposal is not the authoritative answer key. Precise localization in cluttered images has documented limitations. [OpenAI vision guidance](https://developers.openai.com/api/docs/guides/images-vision).

Do not send the completed guaranteed composite through another whole-image generation step and assume its target remains unchanged. Any edit to gameplay-bearing imagery requires renewed validation.

**Image-model assumptions and generation flow**

The earlier research on 11 October 2026 verified official documentation naming `gpt-image-2.5-flare` for speed-oriented generation and `gpt-image-2.5-sunburst` for demanding quality/editing work. Transparent PNG/WebP output is supported. Precise composition, recurring-character consistency and latency remain limitations; complex requests may take up to two minutes. Access, cost and actual performance for this game remain unmeasured. Recheck the current API contract when implementing. [Official image-generation guide](https://developers.openai.com/api/docs/guides/image-generation).

Treat these names as candidate configuration, not hardcoded product identity. The game should depend on a small generation adapter rather than a model-specific UI. Select output dimensions and quality after measuring target legibility, completion time and retry rate; do not assume a native tiny sprite request is supported.

Recommended full pipeline:

1. Validate the requested world, moment, guest and tone against the implemented capability level.
2. Resolve a curated scene template, or create a draft scene plan for the later arbitrary-world mode.
3. Generate missing background/guest assets using the style references; reuse compatible cached assets.
4. Crop and normalize assets to the scene's pixel grid and character scale.
5. Preview/approve guest identity before hiding; keep the eventual placement concealed.
6. Compose the target and distractors using known valid slots, layer rules and a chosen layout seed.
7. Validate bounds, visible identity, conflicts, references and relevant cultural anchors. Review showcase imagery manually.
8. Persist the finished assets and manifest before publishing a share link.
9. Activate the complete puzzle in one state change; retain the previous round if preparation fails.

Curated templates can have authored placement metadata. Arbitrary generated backgrounds do not automatically come with reliable floors, seats, layers or hiding positions. Establishing that metadata is an additional capability and a principal limit on unrestricted live generation.

While a new job runs, preserve an already playable puzzle. Report real job state rather than fictitious percentage progress. Allow the user to dismiss the request; a late response must not replace a puzzle they have since selected. Bound retries and surface failure with a usable alternative. A failed or blocked request should not quietly produce a different promised scene.

For the demo, pre-generate backgrounds and crowd assets. If a live guest-generation request proves fast enough, start it while the first puzzle is played. Prepared assets must remain described as prepared. No generation benchmark has been run for this brief.

**Suggested scene data contract**

The following fields describe an implementation contract, not an existing database schema. Coordinates use the scene's logical units; all referenced assets are versioned.

| Record | Required content |
| --- | --- |
| Scene template | `id`, `version`, `title`, `worldDescription`, `momentDescription`, `interpretation` (faithful/remix/memory), logical width/height, style-set ID, region definitions, background layers, crowd slots, target slots, content notes |
| Asset | `id`, `version`, URL/path, content hash, width/height, logical scale, anchor, style-set ID; optional alpha hit mask |
| Guest | `id`, display name, sprite asset ID, visible identity cues, target portrait reference, compatible reveal ID, supported customization |
| Placement slot | `id`, region ID, world position, scale, layer order, permitted bounds, compatible guest dimensions, allowed occlusion, clue IDs |
| Placed entity | `id`, asset ID, role, world transform, anchor, z-order, hit data, optional prop-interaction ID |
| Puzzle | `id`, schema version, renderer version, scene template version, guest version, immutable entity placements, target entity ID, ordered hints, reveal specification, layout seed, asset hashes, optional parent puzzle ID |
| Local play state | Active puzzle ID, camera, hint step, found state, current feedback, motion/audio preferences; separate from shared puzzle data |
| Generation job | `id`, request revision, status, stage, candidate/result IDs, failure code and display message; never API secrets |

Every shared puzzle must retain its assets; expiring generation-response URLs alone are not sufficient storage. A seed only recreates layout under fixed assets and rules. Saving a prompt is not saving a puzzle.

The proposed casual client can receive target metadata for immediate local hit testing. This is not an anti-cheat architecture. Competitive or trusted scoring would require a different answer-verification design; that is outside the scope.

**State and transition contract**

Use explicit game phases: `loading`, `searching`, `revealing`, `complete`, and `unavailable`. Treat setup overlays and pending generation as separate UI/job state so the current puzzle can remain playable.

| Event | Allowed result |
| --- | --- |
| Complete manifest and assets load | Enter `searching`, set reference portrait and camera, clear local progress |
| Wrong guess while searching | Show neutral feedback; preserve puzzle and target |
| Valid target guess while searching | Enter `revealing` once; record found state |
| Reveal finishes or is skipped | Enter `complete`; show recast/replay/share actions |
| Hint request | Advance assistance for this puzzle; never move target |
| Recast opens | Show draft guest controls; preserve active puzzle |
| Recast cancelled | Discard draft; return to unchanged active puzzle |
| Matching current generation job succeeds | Offer/activate complete replacement; do not overwrite a newer request |
| Generation fails | Keep active puzzle and draft; show retry or available choices |
| Resize or zoom | Change view transform only; retain placements and progress |
| Replay same challenge | Reset local progress and camera; retain exact puzzle |
| Re-hide or remix | Create a new puzzle ID and placement; leave old links unchanged |

Tie asynchronous replies to job ID and request revision. Ignore stale completions after cancellation, recasting or navigation. Persist success at most once per local round. Reset pending reveal callbacks when leaving the puzzle so they cannot complete a different round.

**Rendering and selection details**

Draw from logical scene coordinates. Keep camera pan and zoom in a single transform. Convert pointer coordinates from the canvas CSS rectangle into the same world coordinates using the inverse camera transform. Handle device-pixel ratio for backing-store resolution separately; do not apply it twice to hit testing.

For pixel art, disable smoothing where appropriate and use consistent scaling. Clamp pan/zoom to useful bounds and preserve a route back to the overview. Do not let the target card or other controls obscure an inaccessible portion of the world.

Select the topmost visible interactive entity at the world point. Prefer alpha-aware target hit regions where a rectangular box would include substantial empty space. Modest touch tolerance is useful but must not let a nearby decoy count as the target. Start with no complex foreground occlusion; if occlusion is added, the visible area and hit test must agree.

Show wrong-guess feedback locally and briefly. A decorative prop interaction should not be mistaken for a target failure. Keep reduced-motion paths independent of an animation callback that may never run. The found flag is authoritative; camera movement and sprite animation display that result.

**Optional backend API outline**

These endpoints are proposed boundaries, not an instruction to build unnecessary services for a static prototype.

| Endpoint | Role |
| --- | --- |
| `GET /api/catalog` | Return available scene/guest versions and customization capabilities |
| `POST /api/generation-jobs` | Accept a supported casting request with a request ID; return job ID and status |
| `GET /api/generation-jobs/:id` | Poll actual stage/status and result or error |
| `POST /api/puzzles` | Validate a composed manifest, persist required assets and return immutable puzzle ID |
| `GET /api/puzzles/:id` | Load that exact puzzle version |
| `/p/:id` | Player-facing route to the unsolved challenge |

For a local curated prototype, manifests can be static files and composition can run in the browser. Real cross-device sharing needs a reachable host and persisted content. A local-only URL is not a working friend challenge. Choose hosting and storage based on the project's actual environment when implementation starts; no cloud provider is committed here.

**Hints, reveals and cultural text need their own content contract.**

Author region-based hints for the reviewed placements. Select them after placement so the clue remains true after recasting. Reveal instructions should refer to known sprite poses or props: wave, fold arms, lift cup, confiscate flag. Do not depend on unconstrained model text to execute an action.

An optional “why this moment?” note can be supplied by the creator and shown after discovery. This gives personal context without obstructing the search. Keep historical notes and factual claims reviewed; omit an explanation if it adds little. Do not generate a solemn lesson for every comic cameo.

**Failure and recovery requirements**

| Failure | Required recovery |
| --- | --- |
| Guest does not resemble requested identity at final size | Show preview for revision; use available avatar/guest if chosen; do not silently declare success |
| Background and guest have incompatible styles | Normalize or regenerate before publication; do not hide the mismatch with an overlay filter |
| No valid target slot for guest dimensions | Select another valid slot or refuse this combination; never place outside bounds |
| Duplicate-looking target in scenery | Review/replace artwork or choose a distinguishable guest before publishing showcase puzzle |
| Missing/corrupt image asset | Do not start an apparently solvable round with missing target; show retry or available puzzle |
| Generation timeout, quota, service or blocked-request error | Preserve active round; explain failure; offer retry where suitable or curated choice |
| Rapid repeated create/recast actions | Associate results with current request revision; ignore stale results |
| Player cannot find target | Progressively narrow the region, then offer explicit reveal |
| Share save fails | Keep local puzzle; do not display a success link until persistence succeeds |
| Sound unavailable or reduced motion on | Complete the same game states with visible feedback |
| Projection makes characters unreadable | Increase target preview and useful scene scale; simplify crowd; use camera/magnifier |

**One-day scope and cut order**

Core delivery:

- One culturally recognisable final-style scene with readable regions.
- One complete search through expressive reveal and replay.
- Two substantially different guests or a real small avatar editor; demonstrate an actual casting change.
- Controlled placement among compatible distractors, exact target portrait and deterministic answer checking.
- Pan/zoom, useful progressive assistance, wrong-guess feedback and view reset.
- One main scene with compact setup/completion states, optional sound and reduced motion.
- Clear supported-scope copy and usable failure recovery.

Preferred additions, only after the core works: a saved share link; one or two responsive background jokes; live generated guest customization; a second destination. The specific order can follow which element is cheapest and most persuasive with the actual available assets.

Later: arbitrary prompt-to-world generation, photo likeness, deeply personal memory reconstruction, manual scene editor, historical anomaly puzzles, more targets per world, complex occlusion, multiplayer races, extensive character animation, progression, accounts and public feeds.

Cut additional worlds and arbitrary generation before cutting the readable target, fair search, meaningful recasting and characterful reveal. If the art is not integrating, reduce crowd complexity or use a compatible asset set. If generation remains unreliable, curated assets are a viable declared fallback. That fallback narrows the generative promise and must be presented accordingly.

**Build order with decision gates**

The following is an assumed five-focused-hour plan, not the event's official timetable. Recalculate against the actual remaining time and team capacity.

| Budget | Work | Exit condition |
| --- | --- | --- |
| First hour | Representative scene, target and distractors; basic pan/zoom and find feedback | An unfamiliar player can identify the target and enjoy a short search |
| Second hour | Finish composition, placement slots, fairness and one reveal | A complete directed round works at presentation scale |
| Third hour | Second casting or avatar editor; hints; request/state boundaries | Recasting visibly changes the challenge without breaking the first one |
| Fourth hour | Sharing if feasible, recovery, sound/motion settings, small background responses | Another device can play the saved puzzle if sharing is claimed |
| Final hour | Formative playtests, visual fixes, projection check and demo rehearsal | A complete live route works repeatedly without developer intervention |

For multiple builders, separate art/content and scene metadata, renderer/game state, and generation/persistence/rehearsal. Agree on the manifest and style contract first. More parallel agents cannot compensate for incompatible art or an unreviewed integrated experience.

**A presentation that demonstrates the actual pleasure**

Assume 90 seconds until the organisers state otherwise. Show a prepared opening scene immediately. Allow a participant or the room to suggest a region, then make the discovery and reveal large enough to see. The second casting provides a live choice; a fully regenerated background is unnecessary for that beat.

| Time | Visible action | Purpose |
| --- | --- | --- |
| 0–10 seconds | Stadium and large target card: “Find Snape” | Immediate task and recognition |
| 10–30 | Audience suggests a region; operator pans or magnifies | Shared attention and participation |
| 30–40 | Find the target and play the flag-confiscation or equivalent gesture | Complete payoff |
| 40–55 | Audience chooses the next available guest or accessory | Show real authorship |
| 55–75 | Re-hide; play another short search with help if needed | Prove the puzzle changed |
| 75–90 | New guest's reaction; show challenge link if actually implemented | End inside the world with something others can play |

If a live generation is measured to fit, start it during the first puzzle and introduce its result when ready. Never pretend a prepared asset was generated live. Keep a recorded successful run for a clearly labelled backup; it does not prove the live service works in the room.

Suggested closing line: “Pick a world you love. Hide someone in it. Send it to the person who will get the joke.”

**Testing should establish both correctness and pleasure.**

Technical acceptance checks for implementation:

- Every offered layout has one designated, visible target in a valid slot with matching portrait and truthful hints.
- A target click passes after supported zoom, pan, resize and device-pixel-ratio changes; nearby decoys fail.
- Dragging does not accidentally select; overlays do not block permanently inaccessible target positions.
- Repeated clicks, skipped reveals and reduced motion complete the round exactly once.
- A stale generation reply or animation callback cannot replace or complete a newer round.
- Recast cancellation preserves the original; replay resets local progress without changing the shared puzzle.
- A challenge opened on another device has the same assets, placements and answer; remix leaves it unchanged.
- Generation and asset failures leave a usable current puzzle or a clear recovery view.
- Credentials do not appear in client code or responses; input is interpreted as data.
- Scene title, target and found-state feedback remain readable on the actual presentation display.

Use several varied guest examples, not one successful generation, before claiming personalization works. Measure request completion time, failed/retried outputs, final-size recognizability and style mismatch. Document the chosen quality setting and observed trade-off. No measurements currently exist.

First quick playtest: three unfamiliar people, no route coaching. Observe comprehension, search pattern, wrong clicks, hint use, discovery reaction and desire for a second round. Provisional gate: they understand the task quickly, no one is defeated by misleading identity or hit detection, and at least two voluntarily want another casting or suggest a guest.

If time permits, use six people including non-fans. First show the image briefly, then ask them to search; distinguish admiration of the picture from enjoyment of the game. Offer a real choice to stop, play another version or create one for someone. A useful directional target is four of six understanding how to begin within roughly ten seconds and at least three voluntarily taking another action. These are formative heuristics, not statistically meaningful success rates.

Watch why a search is fast or slow. Fast may mean satisfying recognition or an obvious sticker. Slow may mean absorbing exploration or frustrating visual noise. If people love the picture and dislike searching, consider a casting toy. If they enjoy searching but ignore personalization, the cameo premise needs a stronger visible consequence.

**Originality and comparisons remain useful context.**

[Hidden Folks](https://hiddenfolks.com/) already demonstrates interactive miniature search worlds. [Hidden Through Time 2](https://store.steampowered.com/app/2304640/Hidden_Through_Time_2_Myths__Magic/) includes custom worlds, characters and sharing. The [Hidden Realms developer report](https://dev.to/sanarahman/hidden-realms-ai-powered-find-the-hidden-objects-game-jod) describes generated scenes, coordinates and hints; that is evidence of a precedent, not independent proof of its reliability. Do not claim that AI hidden-object games or historical search scenes are new categories.

This version's potential distinction is the coherent combination of personal casting, specific cultural references, pixel art direction, reliable puzzles, expressive reveals and challenges meant for particular people. Its quality depends on execution of that combination.

**Open decisions for the first implementation session**

| Decision | Recommended starting assumption | What resolves it |
| --- | --- | --- |
| Product name | Cameo; keep Waldo as internal explanation | User preference and naming review |
| First world | Wizarding stadium or another crowd-friendly beloved scene | Art test and recognition by intended audience |
| Guests | One familiar character and one incongruous guest | Final-size recognizability and reveal quality |
| Pixel perspective/resolution | One coherent elevated miniature view | Representative frame and display test |
| Customization scope | Two castings or a small avatar editor | Remaining time and asset compatibility |
| Live generation | Guest first, pre-generated destination | Actual account access, latency and quality measurements |
| Arbitrary scene descriptions | Preserve as full vision; curated MVP honestly labelled | Valid placement metadata and reliable composition pipeline |
| Hosting/storage | Minimal existing project-compatible solution | Actual deployment environment and need for cross-device sharing |
| Difficulty | A fair short opening hunt with progressive hints | Uncoached players and projector test |
| Exact reveal | Flag confiscation, folded arms, visor lift or equivalent | Available poses/props and clarity at small scale |
| Presentation duration/build budget | 90 seconds / five focused hours are planning assumptions | Organiser schedule and actual remaining time |

**Instructions to future implementers:** preserve the cultural authorship, pixel-world atmosphere, fair search, expressive discovery and meaningful recasting. Read this document as a complete intended experience. Use the first art-and-search test to settle uncertain production choices. Do not substitute a generic generated-image gallery, claim unrestricted generation from a curated demo, or bury the game beneath product infrastructure. Record actual implementation and test evidence separately from this design specification.
