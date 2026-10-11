# Pocket Stage storyboard

12 states of **one scene**. Fixed frontal composition; one light, original paper hand / moth silhouette, one flower. No camera permission or new product page. Exact visible copy is quoted. The tldraw source uses editable geometry, frame containers, movement arrows and production notes below each stage.

## Page 1 — Hero

| Frame | Actually on screen / exact UI | Input | Motion / sound | Next state |
| --- | --- | --- | --- | --- |
| 01 · Invitation | Plum curtains, amber screen, fist shadow, closed rose paper hand, one flower bud. “Move the light. The shadow follows.” **Open hand · Space** | Pointer sweep, arrow keys or labelled ranges | Warm lamp and shadow change together; silent | 02; hand may be opened at any time |
| 02 · Find the light | Same stage. Lamp shifts right; fist shadow sits left of its previous position. Same caption | Move right / → | Inverse shadow translation; height changes scale | 03; positions remain wherever player leaves them |
| 03 · Open the paper hand | Rose fist unfolds at the front lip; shadow begins changing. **Open hand · Space** is activated | Click hand button / Space | Short authored crossfade; optional chime only with sound on | 04; closed/open state is explicit |
| 04 · A shadow lives | Original moth silhouette with visible wings replaces the hand shadow. **Close hand · Space**. “Your hand has become a moth. Bring it to the flower.” | Hand-open toggle completes | Gentle decorative wing breath; still mode shows a fixed moth | 05; no timeout or camera recognition |

## Page 2 — Core

| Frame | Actually on screen / exact UI | Input | Motion / sound | Next state |
| --- | --- | --- | --- | --- |
| 05 · Light choreography | Moth shadow and right-hand flower share the screen. Visible lamp remains the control | Move lamp left / ← | Moth moves right toward the flower; screen layers hold | 06 or 07 if close enough |
| 06 · A little depth | Moth changes scale against fixed translucent paper layers. Same instruction caption | ↑ ↓ / **LIGHT HEIGHT** range | Smooth scale and wash changes; no 3D camera move | 07; transform updates independent of animation |
| 07 · The greeting | Five dark petals open around the single flower's gold centre. “A small hello. The flower opens for your shadow.” | Open moth within generous flower neighbourhood | Petals unfold; optional short local chime | 08; payoff persists |
| 08 · Keep performing | Same stage, open flower, player-controlled shadow. **Close hand · Space** | Move light or close/open hand | Hand and moth remain reversible; flower stays open | Free play, recovery or 12; ending stays in-scene |

## Page 3 — Recovery and replay

| Frame | Actually on screen / exact UI | Input | Motion / sound | Next state |
| --- | --- | --- | --- | --- |
| 09 · Direction ambiguity | Current stage remains. **Guide to flower** below screen; instructions: “Guide to flower moves the light for you.” | Click guide | Lamp and shadow move to known authored coordinates; guide does not open the hand | 07 after explicit hand opening; no false gesture inference |
| 10 · Pointer leaves | Lamp and shadow hold at last coordinates. Both **LIGHT POSITION** and **LIGHT HEIGHT** remain available | Leave stage, use keyboard or ranges | No drift or failure animation. Captions and controls persist | Same current state; resume without restarting |
| 11 · Quiet / still | **Still mode on**, **Sound off**. Open moth remains fixed; flower and greeting caption stay readable | Toggle still; optional sound toggle | Wing loop stops; state changes still happen. OS reduced motion starts still | 07 uses same condition; no animation callback gate |
| 12 · Replay | Flower returns to bud; closed hand and default lamp return. “Move the light. The shadow follows.” **Open hand · Space** | **Reset · R** | Immediate deterministic reset. Sound and still preferences persist | 01 |

Camera failure is excluded from the core because no camera is requested. Unsupported audio changes the sound label and leaves all interactions playable. Ambiguity is about light direction, not a fabricated confidence result. The scene contains no timers, scores or hidden progression gates. Frame 03 is a transition state, not a separate screen.
