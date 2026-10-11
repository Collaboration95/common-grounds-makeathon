**Page Orchestra — Margin Sweep**

Sweep down a webpage’s margin to hear its headings and text as a brief composition, with its spacing, columns and images visibly shaping the performance.

**Example, in three beats.**

1. A fictional library guide loads muted: one title, two section headings, three paragraphs and one large photograph.
2. Enable sound and drag down its margin. A conducting line crosses the title: bass answers. Paragraph punctuation makes soft taps; the photograph holds a silent, translucent pad.
3. Lift; everything settles back. Switch to a fictional museum visit page with two columns of short information blocks and paired images. The same sweep produces simultaneous notes, fewer taps and wider pauses.

**Target experience and Design × Tech.** The feeling is “this familiar page was quietly a score.” Reading becomes conducting. The first smile comes from a heading answering the hand; the deeper discovery is that editorial composition determines musical composition. Layout, gesture and sound share one recognisable scene. Arbitrary keyboard sound banks would weaken that relationship.

**One refined mapping.** Snapshot at most 16 visible `h1`, `h2`, `p` and `img` nodes inside `main`; clip boxes to the viewport. A downward margin drag advances the line; hand speed controls tempo. Events fire once per pass; upward movement never retriggers them. A focused Conduct button, activated with Enter, supplies an eight-second automatic sweep.

- `h1` / `h2`: crossing their vertical centres triggers 350 ms triangle bass notes at C2 / G2, with gentle attack and release. Hierarchy sets register; headings sharing a row sound together.
- `p`: up to four sentence-ending punctuation positions become 45 ms band-pass-filtered noise taps, placed proportionally along the paragraph’s height. Without sentence punctuation, use one final tap. Sentence-rich paragraphs create clusters; short captions create isolated ticks.
- `img`: a silent paper-colour pad remains lit while the line traverses its height. Image-only rows and empty gaps become musical rests. Image pixels are never sampled.

Horizontal centres set modest stereo position. Sounds get matching outlines or underlines; source elements stay still. No semantic interpretation, random melody or separate sequencer is needed.

**Six MUST requirements.**

1. Both structurally different fixtures run through the same extraction and mapping rules, without fixture-specific musical presets.
2. Pointer sweep and keyboard sweep expose immediate, corresponding visual and sonic causality; bound the mix to four simultaneous voices.
3. Start muted. An explicit Enable sound action resumes Web Audio; provide volume, mute and Escape stop. Use browser-generated oscillators/noise and gain envelopes.
4. Draw one removable SVG overlay; preserve page text, styles, links and scroll position. Release, completion or a ten-second timeout clears it within 400 ms and silences tails.
5. Scroll or resize cancels the pass and discards its geometry snapshot; the next pass remeasures. Exclude navigation, forms and unsupported nodes.
6. Use gentle outlines and fades, with no flashes or strobe. Reduced motion uses static highlighting; muted mode preserves the complete interaction.

**Three explicit cuts.** No AI music, speech or content analysis. No universal webpage support, embedded frames or complex app DOMs. No recording, looping, sharing, camera gestures or instrument editor.

**90-second demo.**

- **0–15:** Show the ordinary library guide and its silent first sweep; identify the margin gesture.
- **15–35:** Enable sound and conduct one slow pass. Name heading bass, punctuation taps and the photograph’s rest.
- **35–45:** Release; show the restored reading view.
- **45–65:** Switch to the museum fixture; repeat at similar speed. Point out simultaneous column events and shorter text rhythms.
- **65–80:** Use the keyboard sweep, then Escape to demonstrate immediate recovery.
- **80–90:** Explain that the page’s composition is the score; end on the ordinary page.

**Five-hour build/cut plan.** Hour 1: establish both fixture layouts; audition bass/taps on demo speakers and prove one crossing. Hour 2: measure nodes and finish pointer/keyboard traversal. Hour 3: finish synthesis, correlated overlay feedback and restoration. Hour 4: verify fixture contrast, voice limits, mute, reduced motion and cancellation. Hour 5: rehearse and polish the ending. Cut stereo and decorative trails first; retain both pages and recovery.

**Minimum stack and extension boundary.** Local HTML/CSS/JavaScript, two static fixtures, SVG, Pointer Events and Web Audio; no backend. Use this controlled webpage stage for the MVP. Extension integration is worthwhile later if an unprepared public page is essential to the discovery, and the mapper works on two agreed pages with clean removal and no site-specific selectors. Use user-invoked `activeTab`/`scripting` injection; an extension icon alone adds little experiential value.

**Fallback and acceptance.** If dragging misbehaves, retain the keyboard sweep over measured geometry. If venue audio fails, demonstrate muted mapping without claiming it proves sound. Acceptance: fresh load stays silent until enabled; both fixtures audibly and visibly differ under identical rules; Escape/completion restores the page and stops every voice, including after repeated passes.

**Hardest uncertainty.** Geometry-driven timing may sound cluttered, and low bass may disappear on laptop speakers. Test this first; reduce the node cap to eight before adding musical complexity.

**Primary sources checked.** [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) documents oscillator/buffer synthesis, user-gesture startup and gain scheduling; the gentle palette is our inference. [MDN bounding rectangles](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) documents viewport-relative geometry that changes with scrolling; mapping spacing to rests is our design. [Chrome scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting) documents temporary `activeTab` host permission and default isolated execution; dependable overlay cleanup still requires validation.

**Verdict.** Feasible as a tightly directed local demo; arbitrary-page reliability remains unproven. Sharpen the seed by making whitespace and column alignment audible: the page’s arrangement should be recognisable with your eyes closed.
