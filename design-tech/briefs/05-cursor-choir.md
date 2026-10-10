# Cursor Choir — catch your past hand

**One-sentence explanation:** Draw a short gesture, release a looping ghost of your hand, then cross its moving ribbon to make it rebound; tug time until three versions of you answer each other.

**Three beats**
1. Hold and draw a sideways arc for two seconds. Release: your numbered ghost repeats it immediately.
2. Draw downward through its bright tail. The earlier ribbon bows and carries its ghost sideways, then springs back. Release your second hand.
3. Tug the second ribbon’s “time knot” until its ghost catches the first again. Add a third gesture yourself, or invite someone to contribute it; frame the trio as a motion postcard.

**Target experience and Design × Tech:** “My earlier hand is still here, and I can play with it.” Aim for a smile within ten seconds. Three colours, numbered cursors and bright moving tails inhabit one quiet canvas. Your input’s timing is the material: identical paths meet or miss depending on when they happen. Pocket Stage manipulates a scene; Page Orchestra uses page content. Here, your earlier hand becomes your partner.

**Refined core:** Record-and-replay alone risks becoming attractive trails. Choose **conditional plucking**: crossing another ghost’s bright, trailing 0.8 seconds produces a response; crossing its faded path does nothing. Live strokes and replayed ghosts can pluck other ribbons, excluding self-crossings. The receiving ribbon bows for 250 ms, displacing its ghost, then recovers. Feedback never changes collision geometry.

Each take repeats every four seconds: preserve captured speed and pauses, then wait at the endpoint. Release starts replay immediately. Fade at wrap; exclude the reset jump from crossings. Tug a fixed origin knot horizontally to scrub phase across the lap; release retains the offset. This changes encounters without redrawing; omit speed stretching.

**Demo MVP — six MUST requirements**
- Capture held pointer gestures up to four seconds as position/time samples; release creates a ghost while recording the next remains possible.
- Support three numbered takes, each with a faint path, bright tail and visible ghost; preserve slow sections rather than constant-speed path traversal.
- Detect crossings of moving segments against another take’s active tail, with one response per encounter and a short debounce to prevent contact chatter.
- Make the receiving ribbon and ghost visibly rebound at contact; provide one labelled time knot per take with immediate phase preview.
- Offer undo-last, restart, and safe recovery from pointer cancellation; never leave recording stuck.
- “Frame it” presents the repeating four-second trio inside a postcard border, with discreet Replay/Restart. This on-canvas performance is the ending.

**Three explicit cuts**
- No extension, external websites, click replay, accounts, camera or model; ghosts are rendered data inside this dedicated canvas.
- No timeline editor, arbitrary layer count, physical string simulation, variable loop lengths or speed controls.
- No audio, GIF/video export, cloud sharing or simultaneous multiplayer; an audience member uses the same pointer for take three.

**Directed 90-second demo**
- **0–10:** “Can your hand collaborate with its past?” Draw and release the arc.
- **10–25:** Follow the bright tail with a crossing stroke; show the receiving ghost rebound. Release take two.
- **25–45:** Show the ghosts miss, then tug one time knot until the same paths pluck each other. Say, “I changed when, not what.”
- **45–65:** Invite one audience gesture through the bright meeting area; presenter adds it if participation takes too long.
- **65–80:** Let all three answer for several laps, then frame the motion postcard.
- **80–90:** Replay it: “Past gestures, still answering.” Five hours and 90 seconds are planning assumptions, not published allowances.

**Five-hour build/cut plan**
- **Hour 1:** Prove one recording, immediate replay and one live pluck. If causality is unclear, widen tails before adding features.
- **Hour 2:** Finish three takes, shared timestamp-based playback and wrap handling.
- **Hour 3:** Add replay-to-replay plucks and phase knots; drop stretching permanently.
- **Hour 4:** Tune rebound, readable ghost labels, cancellation and undo; retain the postcard ending.
- **Hour 5:** Rehearse the arc/cross/tug sequence on the presentation laptop; add no capabilities.

**Minimum stack and fallback:** Browser JavaScript, SVG, Pointer Events/capture, relative timestamps, one animation loop; mouse/trackpad, three colours, no assets or network. Swept segments prevent skipped crossings. If encounters feel too precise, widen tails to 1.4 seconds and rehearse a central arc/cross. Preserve conditional response; trails alone fail the concept.

**Three observable checks:** First input becomes a ghost within ten seconds. Bright-tail crossings rebound; faded-path crossings do not. One phase tug changes a miss into a pluck without changing paths; the postcard repeats three laps without wrap-triggered responses.

**Hardest uncertainty:** Can viewers distinguish an encounter from incidental overlap? Three loops can become visual noise. Prove that distinction before polishing.

**Researched sources: observed capability → design inference**
- [W3C Pointer Events](https://www.w3.org/TR/pointerevents3/): capture redirects subsequent pointer events and cancellation ends streams → reliable held gestures need explicit cancellation recovery.
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): timestamp-based callbacks follow display refresh; background tabs commonly pause → use elapsed time, and pause/rebase the performance when hidden.
- [Davis, K-Sketch, UC Berkeley](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/EECS-2008-171.html): pen input demonstrates animation motion → demonstrated motion already has precedent; conditional temporal encounters are this proposal’s design inference, not a novelty claim.

**Verdict:** Recommend a five-hour demo if the first-hour pluck reads clearly. Sharpen the seed by making faded-path crossings inert: time must determine whether your past hand answers.
