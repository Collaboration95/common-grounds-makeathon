# Kopi Shift — two critique and refinement passes

11 October 2026. All writes confined to `ideas/01-kopi-shift/`. No commits. No child agent spawned: discovery exposed no callable child/spawn tool, so all drawing and research were performed locally.

## Pass 1 — make vocabulary do something

**Critique:** the original 30-frame sequence is culturally clear but its pour/select/serve rhythm could read as a generic cooking game. A full shutter/name setup delays the tangible reveal. A magical “no sugar” ingredient would teach the wrong mental model. The source's final-stir dependency and irreversible wrong pour matter more than brewing realism.

**Changes:** chose Word Cast Counter over an overhead omission-stencil puzzle and a 2.5D serving theatre. Open directly on a composed counter with two cups. Make Kopi and C travel from the written ticket toward their relevant contents. Keep Kosong on the ticket, with an empty sugar silhouette outside the cup. Retain ordinary-English request text and separate O/Kosong meanings. Support alternate ingredient order and black-coffee serving without stirring. Add a meaningful O transfer rather than tea/toast scope.

**Inspected:** own T3 preview tab `tab_g` and own tldraw tab `tab_a`. First board pass had 12 editable frame containers, ingredient vessels, cups, tickets and motion arrows; first preview showed all three labelled ingredients and both cups.

**Refinement from inspection:** tldraw `semi` fill produced a pale scene with white labels too faint to read. Use filled bench/tile geometry and dark storyboard bench captions. Make the lifted-pot arrow point to the cup instead of appearing to target the milk tin. Compress page-header text bounds so zoom-to-fit uses the four scenes instead of excessive right-hand whitespace.

## Pass 2 — contrast, recovery and evidence

**Critique:** manager's desktop visual review identified dark ingredient names, shortcuts and omission prose on the dark teal counter. The omission paragraph sat close to the bench edge. A visual demo needs readable actual contents, a clear distinction between known and ambiguous input, and evidence that board edits survive navigation.

**Changes:** all ingredient names, shortcuts, spoon name and quiet-trick prose now use warm cream `#fff3da` against teal `#2d6960`. Move the prose upward to stage y=444. Final measured gap between quiet-trick bottom and footer controls is 37.1875 CSS pixels in the inspected desktop layout. Mark resolved ticket words copper red while keeping the ticket readable. Source the sugar cast from the written sugar request, not by implying that O means sugar. Keep cup contents visible when meanings are hidden. Add a two-action “Discard & replace?” confirmation. Fix Esc to clear both visible selection and aria-pressed state.

**Inspected again:** final hero/core/recovery board pages and preview starting/ending states. Screenshots saved under `evidence/`. Real T3 clicks completed cup 01; real key presses `1`, `a`, `Escape` retained coffee and cancelled selection. Thirteen programmatic state assertions covered valid serving, wrong sugar, fresh-cup confirmation, duplicate additions, C final stir, milk-first order, clarification preservation, added-after-stir invalidation, preference preservation, reduced-motion completion and O transfer. JavaScript syntax check passed.

**Visual outcome:** one counter remains the scene throughout. Cup controls are below actual contents; the quiet-trick copy stays above the footer; the completed orders become the same-scene ending. No speech, camera or pretend AI is required.

## Board connection and persistence, precisely

- Authenticated tldraw tool created board `VXMrudwLPzcNYmChpVg6z`, URL `https://www.tldraw.com/f/VXMrudwLPzcNYmChpVg6z`.
- MCP `open_board` returned “opening”; a later read-only `exec` returned “That board is not open.” No repeated MCP retry loop.
- Browser fallback opened that exact URL in own tab `tab_a`. `window.editor` allowed actual editable primitive creation and screenshot inspection.
- Full navigation/reload retained **759 shapes, 12 frames, exactly 3 storyboard pages**. The empty new-board starter page was removed only after verifying it had no content. Replay replaces only `shape:ks01-*` shapes; unrelated shapes are preserved.
- **Reload persistence is verified. Authenticated remote/cross-device persistence is not verified.** Browser displays “Untitled file” and “Sign in to share”; same-browser retained state alone cannot prove server synchronization. Do not report the supplied URL as verified populated for another account/device.
- `storyboard.snapshot.json` preserves the actual SDK `document` and `session` export. Its SHA-256 is `a1999f6f322da9bb18e0ca048b230ad618fd46f687aef5358418276f47935702`. `storyboard.js` can rebuild on a connected board without removing unrelated work.

## Limits of this QA

Preview inspected over manager HTTP server at `http://127.0.0.1:8879/ideas/01-kopi-shift/preview.html`. It has inline SVG/CSS/JS, no asset requests, and no fetch/import dependencies; `file://` operation is supported by construction but was not separately opened in this browser tool. Real click and keyboard paths were exercised; a full physical mouse-drag rehearsal, audio-device test, small-phone layout, local practitioner review and newcomer learning study remain outstanding. Small phones scale the fixed diorama; text/target size is a known limitation.

## Final manager cross-check

After the lead completed its work, a separate read-only verification opened the shared board in a fresh independent browser context without replaying source or loading a snapshot. It found 759 shapes, 12 frames and 3 pages. This resolves the earlier remote-persistence uncertainty for the shared link. Evidence: `../04-table-chorus/shared-board-persistence.json`; board.json now records the verified result. The original snapshot and its hash are unchanged.
