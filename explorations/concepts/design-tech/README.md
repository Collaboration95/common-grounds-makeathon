# Five Design × Tech directions

**My recommendation: Dot, if you want to pursue the browser companion. Cursor Choir, if you want the most playful departure.** Peel is the strongest alternative for changing how a website feels. These are editorial judgments about the brief, not predictions of the judges.

[Open the illustrated comparison](index.html) · [Dots, Gmail and reservations: feasibility](FEASIBILITY.md) · [Earlier playable concepts](../index.html)

The goal is a new feeling of agency, a memorable gesture and a short performance. Commercial viability is not a selection criterion. Common Ground explicitly invites unusual ways of creating and interacting, with no prescribed medium. Its detailed judging rubric remains unpublished. [Organiser brief](https://luma.com/yjffwqr2)

| Idea | Simple explanation | Smallest convincing demo | What we target |
| --- | --- | --- | --- |
| **[Dot — the living footnote](briefs/01-dot.md)** | Put a tiny character onto something you are curious about. It travels to the passage that answers you. | Drag/context selection, two page-question intents, source landing, one saved note, a Book-link handoff. Three disclosed test pages cover different policy cases. | Shared attention and a companion whose movements mean something. |
| **[Peel](briefs/02-peel.md)** | Pull back a website's corner and lift the useful controls out from underneath. | One reversible fold, two intents, three sourced pieces, native-field handoff; two prepared layouts. | A website feels like an object you can manipulate. |
| **[Web Magnets — Caption Split](briefs/03-web-magnets.md)** | Take words from one page and a photo from another. Drag the words through the photo to make a tiny poster. | Five clippings, one snap rule, pull apart/recombine, source tags. Owned assets and prepared pages. | The pleasure of making meaning by putting things together. |
| **[Page Orchestra — Margin Sweep](briefs/04-page-orchestra.md)** | Conduct a page: headings make bass notes, punctuation makes taps, whitespace makes rests. | Two contrasting pages, one gesture, one deterministic sound mapping, mute and restore. | Rediscovering a familiar visual layout through another sense. |
| **[Cursor Choir](briefs/05-cursor-choir.md)** | Your earlier gestures keep playing. Your new hand can collide and interact with your past hands. | Three four-second loops, visible plucks, one phase-adjustment knot, reset and framed ending. | Surprise and playful collaboration with yourself. |

## The best version of your dots idea

**Make its body the interface.** Drop it on a photo to establish context. Ask a short question. Watch it carry your attention to the actual sentence. Leave it behind as a note. When the page lacks evidence, it comes back rather than confidently guessing.

For the restaurant example, a useful demo has three outcomes: a stated smoking policy with its qualifications; no policy found; and a visible handoff to the original booking link. The page's actual style can remain intact. A short stretch/squash animation and careful landing could give this a personality without building a pet simulation.

I would spend the first hour making one question-to-evidence journey feel good. Limit the next pass to one particular website or a clearly disclosed set of controlled pages; the agent's brief chooses controlled fixtures for reliability. Test a real public page only after that scene works. A fixed fixture demonstration proves the interaction, not arbitrary website comprehension.

Gmail is an optional integration spike after this core. A single authorised testing account is plausible; public mailbox integration is a larger undertaking. The linked feasibility note separates those cases and cites current platform documentation. None of these briefs require reading or sending anyone's actual email.

## What earns each alternative its place

**Peel:** the physical pull and attached origins are the idea. Do not turn it into a generic stripped-down page or a chat panel. The demo should show the same website intact before and after the gesture.

**Web Magnets:** use one funny juxtaposition. KEEP MOVING across a snail photograph becomes an instant visual joke; TAKE YOUR TIME changes its voice. The user authors the meaning. A new composition rule is more interesting here than model-generated captions.

**Page Orchestra:** make the second page audibly different under the exact same rules. That is the evidence that layout is the instrument. Audition the sound on the actual speakers early.

**Cursor Choir:** a faint old path alone is not the result. A moving ghost must visibly answer another gesture, and shifting its timing must change whether they meet. If that does not read clearly in the first hour, simplify to one live hand and one ghost before adding a third.

## Scope and delivery status

Five GPT-6.1 Sol agents ran in parallel at **xhigh** reasoning. The tool did not expose a per-call “fast” tier switch; bounded research and briefs kept this round focused. Each brief includes a simple explanation, target experience, mandatory MVP features, explicit cuts, a 90-second demo, five-hour build plan, fallback, three acceptance checks and primary-source references. Those time budgets are internal assumptions.

**This round delivered briefs, not five new working prototypes.** The browser comparison has illustrative vector diagrams and expandable details. No extension was installed, no Gmail account connected and no booking performed. The earlier gallery's playable sketches remain available separately.

All files live in the existing isolated concept worktree. `agents.json` records the assignments. `tools/build-design-tech.py` regenerates this comparison from the five JSON briefs. The local gallery server serves it at http://127.0.0.1:8879/design-tech/.
