# Common Ground — five one-screen wonders

**Start with [the interactive collection](index.html), then read [the recommendation](DECISION.md).**

**New exploration:** [Five Design × Tech briefs](design-tech/index.html), including the browser Dot concept and [Gmail feasibility](design-tech/FEASIBILITY.md).

This is a decision pack: five distinct directions, five small playable interaction sketches, researched references, and editable tldraw storyboards. It is not five finished hackathon submissions. Each proposed product uses one principal scene; its storyboard frames describe successive states and recovery branches.

Open `index.html` directly in a browser, or run `python3 -m http.server 8879 --bind 127.0.0.1` from this directory and visit http://127.0.0.1:8879. The sketches are self-contained and require no build step, credentials, or package installation. Sound is opt-in. The gallery's inline player and full-size links both work from the local file.

| Concept | Play | Brief | Frames |
| --- | --- | --- | --- |
| Kopi Shift | [Counter](ideas/01-kopi-shift/preview.html) | [Idea](ideas/01-kopi-shift/brief.md) | [Storyboard](ideas/01-kopi-shift/storyboard.md) |
| The Tape Can Hear You | [Television](ideas/02-living-tape/preview.html) | [Idea](ideas/02-living-tape/brief.md) | [Storyboard](ideas/02-living-tape/storyboard.md) |
| Can Lah! | [Phrase instrument](ideas/03-can-lah/preview.html) | [Idea](ideas/03-can-lah/brief.md) | [Storyboard](ideas/03-can-lah/storyboard.md) |
| Table Chorus | [Shared table](ideas/04-table-chorus/preview.html) | [Idea](ideas/04-table-chorus/brief.md) | [Storyboard](ideas/04-table-chorus/storyboard.md) |
| Pocket Stage | [Theatre](ideas/05-pocket-stage/preview.html) | [Idea](ideas/05-pocket-stage/brief.md) | [Storyboard](ideas/05-pocket-stage/storyboard.md) |

[Open the five-idea comparison board](https://www.tldraw.com/f/Ulim0f0KWaETvnqEu-O5a). Each concept's `board.json` records its own tldraw URL and verification. Its `storyboard.js` recreates editable frame containers, props, labels, and motion arrows. Local snapshots and SVG/PNG exports, when present, preserve the work independently of the hosted editor. The comparison has [an SVG](storyboards/overview.svg), [an editor snapshot](storyboards/overview.snapshot.json), and [replay source](storyboards/overview.js).

For snapshot recovery in a compatible tldraw editor, use `editor.loadSnapshot(data.snapshot ?? data)` on the parsed JSON (Kopi Shift includes a metadata wrapper). Replay scripts target idea-specific IDs and should be run in the indicated board. Keep the original snapshot as a backup before editing. The SDK snapshot JSON is not automatically a native `.tldr` file.

The new canonical labels are [Culture idea 1](culture-idea-1.md) and [Culture idea 2](culture-idea-2.md). Their earlier filenames used “Design idea” as a sequence label even though both selected Culture × Tech. The original second idea remains the preferred starting point. The culture documents preserve the earlier full specifications; the new concept briefs explore smaller alternatives.

All existing text briefs were read. The original inputs are preserved in `reference/source-snapshot/`, including the second idea that arrived while other agents were working. [The reference essay](reference/precedents.md) links ten precedents and explains the event's tone. Each concept adds its own sources and critique log.

Work is isolated on branch `codex/culture-five-concepts` in `/Users/speedpowermac/personal/common-grounds-makeathon-concepts`. The original shared checkout and its other agents' uncommitted work were not edited. `evidence/agents.json` records the five GPT-6.1 Sol concept leads. The bounded workflow was research → variants → drawing/playable sketch → inspection → revision.

The concept toys use authored content and real local pointer/keyboard interactions. They do not claim working runtime speech recognition, camera tracking, or AI inference. Those planned capabilities and their fallback paths are described in the briefs. Cultural wording and final performance still benefit from review by someone familiar with the represented practice. Event judging criteria and actual demo length remain unknown.

Run `python3 tools/build-gallery.py` after editing concept metadata to refresh `index.html` and `concepts.json`. Verification results are in `evidence/verification.md` and the individual iteration logs.
