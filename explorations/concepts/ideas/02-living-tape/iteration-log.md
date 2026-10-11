# Living Tape · critique and refinement

## Pass 1 — make the tape necessary

Read creative-direction first, all six original source-snapshot files, then newly arrived `design-idea-2.md`. Initial proposal: a tray wakes when named, then lunch arrives. Critique: a vintage filter alone would not earn the fictional tape; an instructional recap would miss the user's preference for performance; two meals/friends would scatter the scene.

Changes: choose The Second Take over The Held Breath and The Last Seat. Make an order correction reverse portion, rice, tray, arm and slip before the revised dish performs. One shared plate and one friend remove grading. Introduce the saved stool in the opening and resolve it with the friend's hand and second chopsticks. Keep the stall in the same TV all the way to the ending. Explicitly separate product microphone consent from simulated preview input.

Created a dedicated tldraw board and dedicated T3 tabs (`tab_b` board; `tab_j` preview). MCP open returned opening; MCP exec later reported board not open. Used `window.editor` through T3. Visually inspected the initial hero page and opening preview with T3 snapshots. Board contained 614 editable primitives and 12 frame containers, not raster screenshots or twelve prose cards.

## Pass 2 — make the performance reviewable and robust

Visual critique: desktop composition pushed some controls below the viewport. “Actually…” did not say which replacement would happen. Board's product listening frame could be mistaken for implemented preview speech.

Changes: tightened TV/deck width and spacing; correction key now explicitly names the other dish. Added PRODUCT STORYBOARD / PREVIEW INPUTS ARE SIMULATED under all twelve board scenes. Three storyboard pages only; removed this board's unused empty default page. Added no microphone/network calls to the preview.

T3 host disconnected during resizing; stopped retrying it. Used local headless Chrome via Playwright to inspect the actual `file://` preview and live tldraw page. The first automated interaction uncovered a real duplicate SVG/button `roast` ID: the controls selected the SVG definition rather than the button. Renamed the food definition `roast-food`. Both dish keys, correction and reset then passed. Captured roast-pork preparation, halfway rewind, corrected char siew, ambiguity, scrubbing, shared lunch, replay and reduced motion. A new browser context fetched all 614 original shapes from the live URL, establishing persistence independently of the original T3 session. Rebuilt and exported the refined 626-shape board, then waited for sync and reloaded: 626 shapes and three pages survived.

## Pass 3 — finish the saved seat

Visually inspected desktop, mobile, live core and live recovery screenshots. Critique: subtitle obscured the second chopsticks; Enter as a global save shortcut conflicted with native button activation; pointer targets were only 40px high; the desktop footer still needed vertical space.

Changes: moved both pairs of chopsticks above the subtitle. Added S as the preview's unambiguous Save the seat shortcut while retaining native Tab/Enter button behavior. Made phrase keys at least 44px high. Tightened desktop composition again; the current desktop page fits 1280×800 (see final measured height in `qa-results.json`), while the 390px phone layout remains full width with no horizontal scrolling. Replayed the final storyboard source twice to verify stable idea-specific IDs and shape count; reloaded after sync. Preserved the SDK document/session snapshot and three visual SVG/PNG exports.

## Evidence and remaining limits

- `qa-results.json`: full `file://` path, real reverse progress around 0.5 before swapping dish, ambiguity preserves selection, scrub prevents early commit, reduced-motion instant completion, active-animation reset, keyboard 2 → R → S, system reduced-motion preference, unique IDs and mobile bounds.
- `board-fresh-context.json`: a separate browser loaded the original remote content.
- `board-reload.json`: final persisted shape/frame/page counts and repeated replay counts.
- `storyboard.snapshot.json`: exported using `editor.getSnapshot()`, including document and session. Three `storyboard-*.svg` files and three `board-*.png` screenshots preserve visual review.
- Preview screenshots: `preview-setup.png`, `preview-desktop.png`, `preview-rewind.png`, `preview-lunch.png`, `preview-mobile.png`. Earlier T3 screenshots were inspected but the final evidence uses local PNGs.
- No child tool was exposed in ALL_TOOLS; no child spawned and no child ID exists. Proceeded locally without waiting.
- Live microphone, transcription, runtime interpretation, recorded actor audio and venue-noise latency remain unimplemented. No educational outcome or historical authenticity has been measured. Local cultural/performance review remains needed for production. The delivered toy is deliberately authored and labels that boundary.
