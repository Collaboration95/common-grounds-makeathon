# Web Magnets — Caption Split

Tear a phrase and a photo from two pages into a floating margin; slide the words through the photo and it opens into a tiny poster, with threads back to both sources.

**Three beats.**
1. On fixture page A, “Instructions for a busy day,” select **KEEP MOVING** and pin it; the words lift off like a paper strip.
2. On fixture page B, “Things outside my window,” pin the team's own snail photo. The shared margin now holds five clippings: three phrases and two photos.
3. Drag KEEP MOVING across the snail. Its picture splits horizontally around the words: an absurd motivational poster. Pull the phrase free and try **TAKE YOUR TIME**; the same snail becomes permission to slow down.

**Target experience.** “I made those two things say something together.” The snail and imperative should earn a smile within seconds. Springy attraction, paper separation, and crisp type show causality. Loose cards are a generic moodboard; this interaction changes their roles and composition.

**One grammar.** Text crossing an image's horizontal seam attracts within 24 pixels. Release locks the pair: intact image halves separate vertically around a white band for the verbatim phrase. Type fits automatically; two source tags finish the poster. No pixels are invented or discarded. Pull text away to unpair. One pair composes at once; three clips float nearby. This rule supplies hierarchy and spacing. Meaning comes from user juxtaposition, not semantic detection.

**Why Design × Tech.** Proximity becomes an editorial operation; a reading fragment becomes a visual voice. Distinct from Pocket Stage's puppeteering, this directly manipulates sourced language and images through one composition grammar.

**Demo MVP — six MUSTs.**
- Two localhost fixture pages, five selectable items: KEEP MOVING, TAKE YOUR TIME, DO NOT DISTURB; a snail and a spinning fan photographed by the team. Label both pages as fixtures.
- Explicit selection or image context-menu action pins only the chosen item. A short lift animation connects capture to the margin; the original stays on its page.
- One floating margin board, shared across the two page invocations, capped at six inputs; store coordinates and provenance locally. The rehearsed board has five.
- Exactly the seam rule above, including attraction preview, poster transformation, and drag-to-unpair. No freeform typography editing.
- Preserve exact text, photo asset ID, page URL/title, and fixture anchor. Hovering a source tag draws a thin thread to the highlighted origin on the visible page; another page gets a labelled A/B return chip. Never draw a fictitious thread through tabs.
- Working source return, phrase replacement after unpairing, and reset. Source links return to the fixture anchor; the finished composition visibly retains both tags.

**Three cuts.** No searchable archive, folders, accounts, or summariser. No AI rewriting, inferred relationships, multiple snap types, or multi-image layouts. No universal site support, arbitrary third-party artwork capture, or image/PDF export.

**Real versus authored.** Selection, dragging, snapping, unpairing, and source return work live. Fixture phrases, owned photos, asset mappings, seam geometry, and animation are authored. The composition is new; words and photos are unchanged. No model or hidden classification.

**90-second performance.**
- **0–15:** Show page A, select KEEP MOVING, pin it; explain “words can leave the page.”
- **15–30:** Switch to B, invoke the margin, pin the snail. Three other clippings are preloaded and visibly marked as fixture selections.
- **30–50:** Slide words into the seam; pause on the split-photo poster and its absurd instruction.
- **50–65:** Pull apart, replace with TAKE YOUR TIME, repeat the same snap. Explain that the person supplies the interpretation.
- **65–80:** Hover each source tag, follow A's return chip, show the original phrase highlighted.
- **80–90:** Return to the poster: “A thought made by putting two sources together.”

**Five-hour build/cut plan.** Hour 1: prove seam, reversal, readability; cut decorative motion first. Hour 2: live selection and owned-image capture; fallback if unreliable. Hour 3: shared state, source anchors, return, reset. Hour 4: swapping, pointer feedback, fitting, five-item layout. Hour 5: provenance checks and rehearsal; freeze scope. Minimum stack: JavaScript/CSS/SVG overlay, Manifest V3 extension, local state, two HTML fixtures, owned images. No framework or backend.

**Fallback.** Use the same two fixture documents inside one local browser demo shell with a persistent margin. Keep capture and snapping live; disclose that navigation is simulated and extension integration is absent.

**Three observable checks.** Both pages contribute to one five-item board without losing positions. An unfamiliar tester snaps then unpairs a phrase/photo within ten seconds of seeing the seam cue. Both poster source tags return to the exact fixture origins, with verbatim text preserved after swapping.

**Hardest uncertainty.** Reliable cross-page capture and provenance within five hours. Controlled anchors and owned assets bound the risk; arbitrary image retrieval remains unproven.

**Primary-source checks; observed versus inferred.**
- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab): observed—user invocation grants temporary page access, revoked across origins. Inference—invoke on each source page; board continuity is separate local state.
- [Chrome contextMenus](https://developer.chrome.com/docs/extensions/reference/api/contextMenus): observed—selectionText, pageUrl, and srcUrl are available. Inference—text capture is straightforward; srcUrl alone proves neither retrievable bytes nor reuse permission, hence mapped owned fixtures.
- [Whitney: John Baldessari](https://whitney.org/artists/55): observed—the museum describes snapshots paired with didactic text and meaning changing with context. Inference—one verbatim imperative plus an incongruous photo can carry the demo. No artwork is copied.

**Verdict.** Recommend the fixture version. Sharpen “magnetic clippings” to **words physically opening an image to become its voice**; the transformation earns this beyond a moodboard.
