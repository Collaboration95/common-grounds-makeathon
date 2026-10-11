# Pocket Stage — critique and refinement

Two required passes completed, followed by targeted final QA. All writing stayed in `ideas/05-pocket-stage/`; no commit. No child agent was spawned: tool discovery exposed no child-agent capability.

## Pass 1 — make the action legible

**Inspected:** live T3 tldraw tab `tab_7` and playable preview tab `tab_e`. Initial preview showed a strong plum/amber paper composition but an already-open hand before “Open hand”, and hidden malformed SVG paths emitted rendering errors. Initial board had 12 editable frames, but silhouette primitives used tldraw's white solid fill, weakening the shadow reading. The desktop stage also pushed controls too far down.

**Changes:** added separate original fist and open-hand cutouts; opening changes the foreground silhouette as well as revealing the moth. Removed malformed hidden paths. Narrowed the composition from 1120 to 1010px to keep controls closer to the stage. Changed tldraw silhouette fills to coloured fills and retained editable ellipses/finger shapes. Made the hero camera show all four frames rather than just the first row. Deleted only the empty default page on this newly created board; no unrelated shapes were removed.

**Result:** a live board screenshot showed black fist → open hand → moth progression with orange light and blue movement arrows. The revised preview showed the authored hand/moth transformation and reachable controls. This was visual inspection, not evidence of user delight.

## Pass 2 — protect the story and recovery

**Inspected:** revised desktop preview, all four hero frames, then final headless exports of core and recovery pages and the 390px preview. Opening the first hand initially triggered the flower immediately because the default shadow was already inside its neighbourhood. A CSS transform origin displaced the blossom when it expanded. The moth at the assisted target overlapped the flower too much.

**Changes:** moved the initial light to x=380 so opening reveals the moth without ending the story. Removed the conflicting blossom transform origin. Reduced the moth scale and moved the assisted lamp to x=225, y=480, putting the moth beside the flower rather than directly on top. Guide moves only the light; hand opening remains explicit. Added / preserved native labelled ranges, a persistent caption, 44px buttons, Still mode with OS preference detection, sound off by default and no keyboard double-toggle on focused controls. The recovery page draws assistance, pointer-leave, quiet/still and reset states as the same stage.

**Result:** final preview has a separate release and greeting, visible flower geometry and a mobile layout with no horizontal overflow. All 17 automated checks passed, including reduced-motion completion and guide-before-open. No runtime or SVG errors remained. A final focused-control check made arrow keys and R work after clicking the hand button while preserving native range keys and single Space activation.

## Board recovery and final evidence

The tldraw connector created the board but its MCP view did not connect. Drawing was executed in our own T3 browser tab using `window.editor` and a local rich-text helper. The browser automation host disconnected during resize; it explicitly instructed not to retry, so there was no T3 retry loop.

A new isolated headless browser opened the actual board URL and found **493 existing shapes**, **12 frame containers** and **three storyboard pages** before drawing anything. The same count survived reload. A second fresh browser context independently opened the board and found all 493 shapes and pages. This establishes remote persistence, not merely browser-local reload persistence. Replaying the source preserved the shape count.

Saved actual editable SDK snapshot: `storyboard.snapshot.json`. Saved standalone exports: `board-hero.svg`, `board-core.svg`, `board-recovery.svg`, and corresponding PNGs. Saved final preview views: `preview-desktop.png`, `preview-mobile.png`. `qa-report.json` contains the exact state checks and remote counts. `board.json` records the board URL and visual verification.

**Limits:** headless Chromium tests do not establish Safari compatibility, actual touch ergonomics, projector contrast, camera tracking or user delight. Physical shadow optics are deliberately stylised. No live sensing or runtime AI exists. Sound is a local optional chime, with unsupported audio leaving the toy playable.
