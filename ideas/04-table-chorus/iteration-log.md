# Two critique / refinement passes

## Pass 1 — make the social cause visible

Inspected the opening through own T3 preview tab `tab_8`; preserved `iteration-01-start.png`. Created the board in own T3 board tab `tab_d` after discovering tldraw tools. MCP `open_board` returned opening, but MCP exec reported “That board is not open.” T3 `window.editor` successfully created all 12 frames. T3 then lost its automation host; no further retry loop was used. Inspected the actual remote board in an independent headless browser, saving and opening `board-01.png` / `board-02.png` as images.

Critique: the connecting wave was visible before a neighbour existed; that erased the meaning of invitation. The board's face used a white rectangle to mask a full ellipse and read as a box over a face. The question arrow pointed too close to the saucer. Taps only revealed a complete smile after the third tap, so the trace explanation lacked evidence. A narrow-screen ending card could obscure the rings.

Concrete refinements: explicitly hide unconnected wave; accumulate the smile stroke in thirds; throttle drag audio; replace ellipse mask with one editable bent arrow without arrowheads; point the question arrow to the empty chair; put ending note below the table on narrow screens. Retained the explicit question and invitation before guest arrival. Replayed source on the live board and exported the updated document. Board count changed from 301 to 300 as the two-piece smile mask became one curve.

## Pass 2 — preserve the reveal and recovery

Inspected the revised live Core board screenshot and desktop/mobile ending screenshots. The revised board smile is readable. The mobile paper note has its own space. The ending screenshot still showed a guest cup and tissue after clearing: their `.shown` class overrode `.hidden`. The cup could also move apart during tapping without disabling the paired interaction.

Concrete refinements: all ending and reset visibility now uses one helper that removes the opposite class and sets `aria-hidden`; remove hidden-object keyboard focus at ending; give the interactive SVG a group role; stop active dragging on reset. Moving cups apart returns to the proximity gesture and preserves existing taps; moving nearer resumes. The image is genuinely made of traces after clearing. Rechecked the complete ending, not just the state variable.

Final evidence: `preview-ending.png`, `preview-mobile-ending.png`, all three `board-*.png`, and `qa-results.json`. Opened the final images and inspected them visually. The table is one scene; the paper note is the ending. Current live board survives reload with **300 shapes, 3 pages, 12 frames**. A separate fresh browser session also read 300 shapes before any replay, confirming remote persistence beyond one editor's memory.

## Checks and honest limits

- Real pointer drag outside table clamps guest cup to x=755; phase remains proximity selection.
- Keyboard slide and saucer Enter/Space finish the encounter and produce the face.
- Move apart after one tap: phase returns to proximity, tap count stays one; move back: tap phase resumes with one.
- Reset restores phase 0, cup x=690 and zero taps.
- Native reduced-motion preference reaches the same ending.
- Forced Web Audio constructor failure shows “Sound unavailable” and still completes.
- Download produced `sample-keepsake.svg` locally.
- Tested via `file://`; no dependency fetches or server needed for play. At 390px width, no horizontal overflow.
- No uncaught JavaScript errors in the tested preview route. Screenshots check laptop/mobile presentation; these are not human usability or screen-reader sessions.
- Board source replay is limited to `shape:tc04-*`; no unrelated shapes are deleted. Snapshot and three portable SVG pages are preserved.

`qa.cjs` is an optional machine-local verification runner using the preinstalled Playwright package. Its absolute runner/browser paths are specific to this workstation; `preview.html` itself is dependency free. T3 disconnected after its first opening screenshot and board write, so final remote inspection and screenshot export used the isolated headless browser. MCP did not acquire the browser editor. Human cultural review and a listening rehearsal remain open.

No child agent was spawned: tool discovery exposed no child/spawn capability. Child agent id: **none**. All writes are in `ideas/04-table-chorus/`; no commit.
