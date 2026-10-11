# Peel — the useful side of a website

Peel lets you pull a website’s corner back to reveal existing reservation links, field entrances and policy text, tethered to their origins.

**Chosen version: the tethered corner.** One corner, two intents, a reversible fold. Watch a reservation label lift from the original navigation and settle beneath your finger, still attached to its source.

**Three beats**

1. On a lush fictional restaurant page, catch a raised corner and drag inward; a shaded flap follows your hand while the website remains visible.
2. Choose “Table for two.” The existing reservation link, guest-field entrance and adjacent booking condition gather underneath. Tap the field entrance: the fold closes and focuses the original selector; manually choose two.
3. Peel again and choose “Smoking policy.” An exact passage appears with its source tether. Push the corner back; everything returns. A second prepared page deliberately has no policy to reveal.

**Target experience and Design × Tech**

Feel curious, then relieved: “the useful bits were inside this object.” Give the fold resistance, shadow and an open detent. Follow the pointer continuously, including mid-drag reversal. Keep the restaurant’s visual identity around the crease.

A curl decorating a utility sidebar is too generic. Movement must communicate provenance: source outlines precede the projected pieces, tethers stay attached, and closing retracts them. Reader mode reformats articles; Peel brings an action within reach. “Table for two” expresses intent; it promises neither availability nor a completed reservation.

**MVP MUST requirements**

1. Exactly two local restaurant fixtures: **Linen**, with reservation link, native guest selector, booking condition and smoking text; **Roof**, with a different layout and no smoking passage. Label both as fiction. Read their DOM through declared selectors; disclose the prepared mapping.
2. One corner gesture with continuous reveal, latched open state and reverse drag/Escape closure. Provide keyboard open/close and reduced-motion equivalents.
3. Exactly two intent chips and at most three revealed items. Reservation mode includes the existing doorway, field entrance and original condition; policy mode displays literal sourced text or “No smoking policy found on this page.”
4. Every item has an origin label and “Show original.” Draw tethers to visible source outlines; use a labelled edge marker for offscreen sources. “Show original” closes the fold, scrolls to and highlights the actual node.
5. Links retain their source destination. Fields remain native: their projections are focus entrances, never duplicate editable widgets. Only the user edits the original field. No reservation submission.
6. The fold is an added overlay; never move or replace source nodes. Closing restores pre-open scroll and focus unless the user explicitly chose an origin handoff; preserve any native field edits.

**Three non-goals**

- Arbitrary website support, third-party booking-widget reconstruction, availability checks or booking automation.
- Summaries, chatbot replies, open-ended page questions or AI-generated policies.
- Persistent redesigns, blanket content stripping, accounts or saved page workspaces.

**90-second demo**

- **0–10:** Pull Linen’s corner; show the reservation label rise from its outlined origin.
- **10–30:** Choose “Table for two”; point to the tether and unchanged booking condition.
- **30–45:** Tap the guest entrance; manually set the original selector to two. Stop before submission.
- **45–65:** Reopen for smoking text; “Show original” reveals the matching passage.
- **65–80:** Switch to Roof; demonstrate the explicit missing-policy state.
- **80–90:** Reverse the fold and show the intact page. Say: “Same website, useful side.”

**Five-hour build/cut plan**

- **0–1:** Prove corner motion and a tethered link on Linen. If it feels like a sidebar, fix this before adding capabilities.
- **1–2:** Prepare Roof and both DOM maps; read literal content and destinations.
- **2–3:** Finish both intents, native-field handoff and source highlighting.
- **3–4:** Add absence state, restoration, keyboard control and reduced motion.
- **4–5:** Check both fixtures and rehearse. Cut sound, elaborate curl geometry and extra fields before cutting provenance or reversal.

**Minimum stack and fallback**

Local HTML/CSS/JavaScript, pointer events, CSS/SVG flap and tethers; two fixture pages with one guest field and short original text. No model, backend or installation is required for the demo. If curl geometry fails, use a triangular hinged flap with the same continuous drag and tethers. Keep the causal reveal; drop physical realism.

**Three observable acceptance checks**

1. Two of three unfamiliar viewers identify the revealed control’s origin within ten seconds without narration.
2. Both fixtures’ projected links match their source destinations; policy text matches exactly; field handoff reaches the correct native selector and preserves its edit.
3. Ten open/close cycles restore scroll/focus and leave source nodes intact; Roof consistently reports absence without inventing a rule.

**Hardest uncertainty and researched boundaries**

Convincing motion is achievable; faithfully projecting arbitrary interactive widgets is unproven. Keep native behavior at its source.

- [Chrome: Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts). **Observed:** scripts can inspect shared DOM while JavaScript environments remain isolated. **Inference:** a future extension can add projections; this does not establish that copied widgets retain behavior.
- [Apple: Safari Reader](https://support.apple.com/guide/safari/hide-distractions-when-reading-sfri32632/mac). **Observed:** Reader reformats supported articles without navigation distractions. **Inference:** Peel earns distinction through action, attachment and reversible movement.
- [Dishoom: Reservations](https://www.dishoom.com/reservations/). **Observed:** its page states time/group restrictions and includes an external SevenRooms booking link. **Inference:** reveal conditions with the doorway; extracting a link does not prove booking feasibility.

**Verdict:** A credible five-hour interaction demo with prepared mappings; broad site compatibility remains unproven. Sharpen the seed by making the tether the central invention: every useful piece must visibly remain part of the website it came from.
