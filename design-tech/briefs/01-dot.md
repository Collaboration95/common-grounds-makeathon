# Dot — the living footnote

A small, expressive dot carries your question from something you point at to the exact words or link that answer it, then leaves your note beside those words.

**Example, three beats.**

1. Drop Dot onto a restaurant’s terrace photo and ask, “Smoking allowed?” Its body squashes onto the photo; the caption becomes context.
2. Dot leans, rolls down the page, and lands beside “Smoking permitted only in the designated terrace area.” That sentence lights up; its short reply preserves “only.”
3. On the restaurant variant without a policy, Dot returns to the photo, looking uncertain: “Page does not say.” An outdoor photograph never becomes permission.

**Target experience.** Dot feels like a reader sharing your attention. Its stretch and soft landing produce the first smile; watching your question arrive at evidence is the memorable moment. The question bubble closes as Dot departs; its answer opens at the destination. Select text to pin “Ask about terrace seating.” Ask “Where can I book?” and Dot perches beside the original Book link, awaiting your click.

**Why Design × Tech.** Reference becomes spatial: pointing establishes context, movement explains the evidence relationship, and resting position communicates certainty. Personality carries information. Found evidence produces a definite landing; absent evidence produces a return. Cosmetic bouncing around an ordinary chatbot would miss the experiment.

**Demo MVP — six MUST requirements.**

- Invoke an unpacked Manifest V3 extension through its toolbar action, using `activeTab`, `scripting`, and `storage`. Support three localhost HTML reference pages: `/permitted.html`, `/prohibited.html`, `/unstated.html`. Unknown pages get an unsupported state.
- Drag a 28-pixel Dot onto a paragraph, menu section, or captioned photo. Highlight the captured target. Photo context uses caption/alt text, never visual inference. Accept one question, at most 160 characters; support smoking and finding Book.
- For evidence, scroll the source into view, animate Dot there, highlight the exact text range, and reply in at most 30 words beside it. Preserve qualifications. Unsupported questions and extraction failures have separate states from “page does not say.”
- Include one real constrained model request if credentials are ready. Ask previews selected context and locally retrieved passages, totaling at most 1,200 characters. Send only that explicitly selected material and question. Validate the returned evidence ID and verbatim quote; render a reviewed reply preserving qualifications. Fixed extension code controls movement and navigation.
- Pin one editable local note to selected text. Store URL, exact quote, and surrounding text locally; restore after reload and recompute position on scroll/resize. A missing or ambiguous anchor displays “Original text changed” rather than attaching elsewhere.
- Locate the actual Book anchor and expose its destination. The user’s click opens `/booking-info.html`, a fictional information landing page. Stop before any booking form.

**Three explicit cuts.**

- Universal website support, Gmail, PDFs, iframes, hidden content, image understanding, and dynamic-page anchor repair.
- Chat history, multiple companions, proactive advice, general browsing, and cross-page research.
- Booking completion, form filling, messages, accounts, note sync, and publishing.

**Directed 90-second demo.**

- **0–12:** Invoke Dot; drag for a squishy landing.
- **12–30:** Drop on the terrace photo; ask “Smoking allowed?” Submit the evidence preview.
- **30–45:** Follow Dot to the permission sentence, including its designated-area condition.
- **45–60:** Repeat on the unstated variant. Dot returns: “Page does not say.”
- **60–72:** Select text; pin “Ask about terrace seating,” then scroll.
- **72–90:** Ask “Where can I book?” Follow Dot to the original link; click and stop at booking information.

**Five-hour build/cut plan.** Hour 1: three fixtures, injection, drag, target capture. Hour 2: complete evidence/absence travel and scrolling; cut secondary expressions if late. Hour 3: constrained request, quote validation, and deterministic fallback; cut model integration after 45 minutes without a reliable round trip. Hour 4: local pin/reload, Book targeting, unsupported states. Hour 5: geometry checks, reduced-motion behavior, projector sizing, and two rehearsals; cut embellishment before the ending.

**Minimum stack/content and fallback.** Vanilla JavaScript/CSS, content-script overlay, extension local storage; optional local model proxy retaining its credential. Three fictional restaurant fixtures share a layout and original Book link, covering allowed, forbidden, and absent policy. Offline, fixed smoking/booking intents resolve to checked DOM quotes or reviewed absence. Label fallback “Local evidence.” Failed extraction or mismatched content abstains.

**Three observable acceptance checks.**

1. Allowed and prohibited fixtures highlight their exact policy sentences; the unstated terrace photo returns “Page does not say,” never “No.”
2. A pinned note survives reload and follows its sentence through scroll/resize; Book highlights the original anchor and cannot open itself.
3. With the model disconnected, the complete demo still works; unsupported questions abstain without fabricated evidence.

**Hardest uncertainty.** Reliable anchoring and readable travel across sticky headers and nested scrolling. The fixtures establish an interaction; arbitrary-site competence remains unproven.

**Primary-source checks, 11 October 2026.**

- [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab): documented temporary access follows explicit invocation; `scripting` enables injection, and same-origin navigation can retain access. Design inference: enforce our own three-page support boundary.
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts): documented DOM access with isolated JavaScript execution. Design inference: a page-resident companion is plausible; isolation does not guarantee layout compatibility.
- [W3C CSSOM View, Range geometry](https://www.w3.org/TR/cssom-view-1/#dom-range-getclientrects): specified rectangles cover selected text and are not live. Design inference: precise landings are possible, but geometry needs recomputation.

**Verdict.** Strong five-hour candidate if the evidence journey is the product. Sharpen the seed with one rule: **every answer must have a landing place; missing evidence brings Dot home.**
