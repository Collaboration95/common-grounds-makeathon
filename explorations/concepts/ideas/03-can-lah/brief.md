# Can Lah!

**Culture × Tech. A tiny phrase you can play like an instrument.**

[Play the preview](preview.html) · [Open the editable board](https://www.tldraw.com/f/FD0q0Kmp6GjGqaibzevm0?d=v-80.-80.1710.1600.canlah-hero)

Two words dominate an acid-green stage: **Can lah.** Drag across the lettering and let go. The letters answer with a little rhythmic performance; a seat moves into place and a friend replies. Change the situation to a sudden shower. The words remain identical, but the typographic voices exchange roles, the stage cools to slate blue, the musical contour changes, and an umbrella makes room for two. The culture lives in the exchange, rather than in a vocabulary list beside the interaction.

**Exact magic moment:** play the confident seat-saving reply, press **2**, and play again without changing the words. “Can lah” changes from having a friend's seat covered to agreeing to a rainy walk. Then bend the delivery left and release: the reply becomes a more reluctant authored reading of that same walk. The rain does not vanish just because the player sounds enthusiastic. Context has consequences.

## Relationship to the originals

The original **Your First Lunch in Singapore** is a CULTURE idea: a newcomer participates by speaking, and a fictional tape visibly responds. Can Lah inherits the welcoming, adult-to-adult participation, authored scenes, captions, and patient replay. It replaces the listening tape with a visible performance instrument. It does not claim to satisfy that original's live voice requirement.

The active **Kopi Shift** is also a CULTURE idea and the user's favoured direction. It is stronger at demonstrating concrete recipe knowledge: hearing Kopi-O Kosong changes which ingredients the player adds or omits. Can Lah borrows the causal rule “understanding changes what happens,” the small number of exchanges, direct controls, and recovery without punishment. Its material is conversational relationship, so a single correct recipe would be the wrong assessment model. It asks people to notice differences, rather than mark a cultural reading right or wrong. This is a separate alternative, not an extra lesson or menu in Kopi Shift.

The audit's most useful constraint survives: a response should change a composed object, and the ending should fulfil a social promise. Here the chair waits for a friend, the umbrella accommodates a companion, and a team tries again. The generated hawker walk sheets are not reused; simple original SVG props fit this instrument. All seven current source-snapshot files were read, including the newly arrived design-idea-2.md.

## Three variants and a choice

| Variant | Primary gesture and reveal | Tradeoff |
| --- | --- | --- |
| **A. Context strings — recommended** | Keep Can lah fixed; select one of three situations; bend the words and release to play the exchange. | Makes contextual interpretation central. Needs careful authored writing and eventual speaker review. |
| B. Particle percussion | Move lah / meh / lor tokens between a few explicitly scripted phrases, then tap to play. | Immediate tactile appeal, but a grid risks looking like particles are interchangeable modifiers or fixed meanings. Too much branch content for the first build. |
| C. Two-person echo | Two participants alternate the same phrase; each changes the next person's typographic instrument through buttons. | Strong social performance, but requires a second person and careful turn timing. Less reliable for a solo demonstration. |

Choose **A**. One phrase, three situations, two authored delivery takes per situation, continuous visual bending. This offers the cleanest ten-second reveal with the smallest cultural claim. No particle selector in the preview: holding lah constant is the experiment.

## Research and precedents

Research checked 11 October 2026. Takeaways below are design inferences, not evidence that these particular fictional exchanges represent every Singapore speaker.

1. [Lisa Lim, “Talk like that meh? no, lah!” (ISCA, 1998)](https://www.isca-archive.org/sposs_1998/lim98_sposs.html). This research examines intonation carried by pragmatic particles in spontaneous Singapore English and the relationship between particle tones and discourse-level intonation. **Takeaway:** letter motion and rhythm can invite attention to delivery, but synthetic notes must not be labelled linguistic pitch models.
2. [Soh et al., “An Analysis of Colloquial Singapore English lah and Its Interpretation across Speech Acts” (Languages, 2022)](https://doi.org/10.3390/languages7030203). The paper distinguishes semantics from discourse effects and discusses interpretation using utterance context and speech act. The search index supplied its abstract and corpus discussion; the full publisher page returned HTTP 429 in this session. **Takeaway:** show the prior turn and relationship; avoid a standalone “lah means…” label. The chosen dialogue remains authored and needs local performance review.
3. [Chan Young Jung, “Same Spelling, Different Functions Mah” (PACLIC, 2025), full paper](https://aclanthology.org/2025.paclic-1.2.pdf). The study describes the combined role of context and prosody and reports limited performance for text-only particle prediction. **Takeaway:** do not use a language model to judge the player's tone or silently generate authoritative interpretations. Six finite takes are more honest for this toy.
4. [SG101, “Singlish” (Singapore government heritage article)](https://www.sg101.gov.sg/resources/archives/til-singlish/). The article describes a history of language contact, criticism, and later public acceptance. **Takeaway:** frame Singlish as everyday cultural participation, not broken English, an accent costume, or a test of belonging.
5. [Patatap](https://patatap.com/), an interactive audiovisual instrument. **Takeaway from the live precedent:** an immediate input-to-shape-and-sound response can make a browser feel performative. Borrow the short feedback loop, not its assets or specific compositions.
6. [Typatone](https://typatone.com/), a text/music experiment. **Takeaway from the live precedent:** typography can be playable material. Can Lah differs by making a relationship and prior conversational turn determine the scene rather than composing arbitrary text.

Optional further study: [Ng E-Ching's papers and talks](https://eching.org/research/papers-and-talks/) links the 2019 “Singlish pragmatic particles: Tone or intonation?” handout; the older script is explicitly labelled uncorrected. The script fetch failed here, so it is not used as authority for any specific take.

## One-screen anatomy

- Slim masthead: Can Lah!, Sound off/on, gallery link. No setup needed.
- Three context keys: Save a seat / Walk in rain / One more try. Keys 1–3 do the same thing.
- Previous speaker's short line and situation label, always visible.
- One large performance pad: the fixed phrase, ruled musical space, a context prop, and drag/release instruction.
- Persistent reply caption and **“In this scene…”** reading underneath.
- Delivery range and circular Play key. Slider arrows and Play replace dragging.
- Sound, still mode, reset, three played dots, and a small inline ending.

Palette: charcoal `#202520`, warm paper `#f3f0e5`, acid green `#d5ff5f`, rain blue `#b9cadb`, apricot `#ffa585`. Bold grotesque and italic serif switch roles between scenes. It should feel like a small live-print concert poster rather than a language app.

## Authored versus live

The three situations, their six reply lines, reading labels, props, type styles, and three-note motifs are authored. Softer values 0–54 and firmer values 55–100 select two take bands; type angle and width vary continuously. These bands are an interface convention, not a prosodic or linguistic classifier.

Pointer and keyboard state changes, SVG prop updates, CSS performance, and Web Audio synthesis happen live in the browser. Sound is off by default and enabled explicitly. The synth makes abstract musical cues; there are no spoken recordings in this preview. No microphone, speech recognition, pitch recognition, camera, model call, or accent score exists. No remote service is needed for the preview, including via file://.

The tldraw board is the editable storyboard, not the running product. storyboard.js replays only idea-specific shapes. An SDK snapshot and SVG page exports preserve the drawings independently of the service.

## Internal 90-second demo

This is a rehearsal assumption, not an organiser requirement.

| Time | Presenter action and point |
| --- | --- |
| 0–10s | “Two words can carry a whole exchange.” Show seat-saving prompt; drag and release the phrase. |
| 10–25s | Enable sound if useful, play softer then firmer. Point at the chair and friend's reply; explain these are authored takes. |
| 25–45s | Press 2. Same words, new font roles and umbrella. Play reluctant and encouraging walk readings; rain remains. |
| 45–60s | Press 3. Play the team reassurance; the unfinished tower nudges. |
| 60–75s | Switch sound off and still mode. Use the delivery slider and Play; same caption and prop consequence. |
| 75–90s | Show “Same words. Three exchanges.” Reset. “This is an instrument for noticing context, not a translator or a pronunciation test.” |

## Minimum build: five focused hours

An internal solo-build budget, not an event schedule.

| Hours | Work and gate |
| --- | --- |
| 0.0–0.6 | Lock six takes; research and get a local speaker's review of the dialogue if available. Flag unreviewed lines if unavailable. |
| 0.6–1.8 | Compose one final pad and implement drag/release, delivery slider, keyboard Play, and reset. Seat prop and caption must work. |
| 1.8–2.7 | Add two contexts, deliberate type changes, umbrella and tower reactions; preserve fixed phrase and social consequence. |
| 2.7–3.3 | Add optional synth cues, still mode, cancellation, and inline ending. |
| 3.3–4.2 | Visual checks on laptop and phone; test all takes, focus, interrupted gestures, replay, and file://. |
| 4.2–5.0 | Freeze scope; complete storyboard/export, rehearse 90 seconds, record honest backup if needed. |

Cuts: no particle rack, recording, live voice, generated conversation, social sharing, saved performances, or extra contexts. If time tightens, cut synth complexity before keyboard/captions. Keep all three simple situations; no actor audio is necessary for this concept sketch. A later recorded-speaker version needs consent, performance review, matching captions, and explicit attribution; it is not represented as implemented.

## Risks and originality boundary

The biggest risk is flattening a living variety into six personality buttons. Persistent context, “In this scene” wording, fixed phrase, and lack of scoring reduce that risk; they do not replace review by people who use the language. No cultural validation or user research has been completed. The rainy-walk reluctant reading especially needs a local speaker's review and could change.

Musical synth contours are expressive design, not measured Singlish acoustics. “Softer/firmer” is a direction for these six fictional performances; it is not a universal mapping from force or pitch to meaning. The preview demonstrates visual attention to delivery without reproducing a voice.

The technical novelty is modest: audiovisual browser instruments, kinetic typography, and context-sensitive language art already exist. The specific proposition is a performable conversational exchange with a fixed phrase, social scene props, and authored interpretive openness. No world-first, archival authenticity, or winning claim is made. Kopi Shift remains the better choice if the priority is demonstrable practical coffee-order understanding.
