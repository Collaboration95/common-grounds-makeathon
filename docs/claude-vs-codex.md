# Claude vs Codex for The Commons

*Can Anthropic's Haiku 5.5 and Sonnet 5.5 do the text work behind a wish as well as the Codex models, and what does it cost? Measured on 13–14 Oct 2026.*

## The short version

- **Haiku 5.5 is the pick.** It matched or beat Sonnet 5.5 and the Codex models on every check, runs about 4× faster than Luna, and costs about **$0.001 per pet**.
- **Sonnet 5.5 is not worth it here.** It cost about 20× more than Haiku and scored no better.
- **Claude only covers two of the three steps.** It can screen a wish and write the creature's code. It cannot draw the sprite sheet. That was the slowest step (about 46 s through Codex on the ChatGPT login), so drawing now calls the OpenAI image API directly (`gpt-image-2.5-flare`, about 12 s). A whole pet goes live in 13–16 s on the box. Codex stays as the automatic fallback, and `draw codex` switches back. The image API's price is not measured.
- **$100 of API credit buys about 98,000 pets on Haiku** (about 3,300 a day for a month), or about 5,000 on Sonnet (about 170 a day).
- **A pet appears about 3× sooner once drawing moves to the image API.** With Codex drawing, the wait was the drawing (about 47 s total). With the image API it is about 15 s.

## What a wish goes through

| Step | What it does | Runs on today | Can Claude do it? |
|---|---|---|---|
| **Screen** | Allows or declines the wish, and writes the illustrator's prompt | Codex (Luna) | Yes |
| **Build** | Writes the creature's behaviour as a `thing.js`, checked by a simulator | Codex (Luna) | Yes |
| **Draw** | Makes a 12-frame pixel-art sprite sheet | OpenAI image API, `gpt-image-2.5-flare` (about 12 s; Codex image tool is the fallback, about 45 s) | No, Claude can't generate images |

## How it was tested

- **43 labelled wishes** in `eval/wishes.jsonl`: 29 should be allowed (plain, Singlish, weird, fantasy, wishes from another world such as space or ocean) and 14 should be declined (sexual, a real person, a brand, a crowd, hate, gore, rule-breaking).
- **Deterministic checks only, no model grading.** The same output always gets the same score. Screen checks cover: right verdict, every noun and colour kept in the sprite prompt, no style words, facing right, a short non-echoing decline message. Build checks cover: the simulator loads and runs it, it moves in depth, uses a spot, reacts to neighbours, has a poke reaction, speaks in 6 words or fewer, and has the right air or ground zone.
- **Same prompt rules for Claude and Codex.** Claude gets the same contract, samples and requirements as Luna, in one request. There is no shell. The server runs the same checker and sends back one repair turn if it fails.
- **Four wishes at a time** (concurrency 4), thinking switched off for Claude. Adaptive thinking was tried too and gave no useful gain.
- **Cost** comes from the token counts the API returns, priced at: Haiku 5.5 $0.10 in / $0.50 out per million tokens; Sonnet 5.5 $2 / $10; cache reads at a tenth of the input price.
- **Test spend: $2.62 of the $10 allowance**, with a hard-coded cap in the harness.

## Speed

Median times, in seconds.

| | Screen | Build |
|---|---|---|
| **Haiku 5.5** | **2.0** (p90 2.3) | **4.9** (p90 8.2) |
| **Sonnet 5.5** | 2.5 (p90 3.1) | 7.6 (p90 9.0) |
| Luna, fast tier | 5.0–5.4 (p90 6.0–6.6) | 17–19 (p90 28–54) |
| Luna, standard tier | 4.5 | 26–29 |
| Sol, fast tier | 7.3 | 33 |
| Sol, standard tier | 8.6 | 49 (p90 217) |

- **One at a time,** Haiku builds in 4.8 s and Sonnet in 7.9 s (8 wishes each).
- **Luna's build figures** come from 9 wishes per run, so they are rougher than Claude's (29 wishes).
- **Drawing,** for scale: Luna on the fast tier took a median of 69 s for 6 sheets at once. Live pets on the box took 41–48 s end to end, almost all of it drawing.

## Quality

**Screening** (43 wishes)

| | Right verdict | Every check passes |
|---|---|---|
| **Haiku 5.5** | 43/43 | 41/43 |
| **Sonnet 5.5** | 43/43 | 41/43 |
| Luna, fast tier | 42–43/43 | 42–43/43 |
| Luna, standard tier | 39/43 | 39/43 |
| Sol, fast tier | 41/43 | 41/43 |

- **Remaining Claude misses** were cosmetic: a decline message that repeated a word from the wish ("durian", "hawker"), and one miss on a polar bear's bleed label.
- **Nothing wrong was allowed** in the final run. A first Sonnet run let "a durian with a KL logo" through, and a later run did not, so it is borderline for Sonnet.
- **Haiku had a prompt bug.** It kept adding "paper-cutout style" to sprite prompts, which failed 14 of 29. One added sentence in the screen prompt fixed it. That sentence is now in the shared prompt, so Luna gets it too.

**Building** (the 29 wishes that should be allowed)

| | Runs in the simulator | Core checks, first try | Every check, incl. soft ones |
|---|---|---|---|
| **Haiku 5.5** | 29/29 | 27/29 | 22/29 |
| **Sonnet 5.5** | 29/29 | 27/29 | 21/29 |

- **Core checks** are every check except the two soft ones below.
- **Soft checks:** (1) the simulator warns that it "never occupied a spot", and (2) a colour or noun from the wish isn't mentioned in the code (for example "green" or "sunglasses").
- **Both Claude models** missed a wish noun about equally often, and one dragon-the-size-of-a-cat came out as ground when it should fly (Sonnet).

**Head to head on Luna's 9 wishes** (Luna was only run on these)

| | Core checks | Every check |
|---|---|---|
| **Haiku 5.5** | **9/9** | 6/9 |
| Sonnet 5.5 | 8/9 | 5/9 |
| Luna, fast tier, medium effort (3 runs) | 4–7/9 | 3–6/9 |
| Luna, standard tier | 7–8/9 | 4–6/9 |
| Sol (either tier) | 8/9 | 6/9 |

Luna's runs predate the shared-prompt change above, and 9 wishes is a small sample, so read this as "no worse", not "clearly better".

## Cost and capacity

| | Screen | Build | **Per pet** | Pets per $100 | Pets per day over a month |
|---|---|---|---|---|---|
| **Haiku 5.5** | $0.0002 | $0.0008 | **≈ $0.001** | ≈ 98,000 | ≈ 3,300 |
| **Sonnet 5.5** | $0.0046 | $0.0152 | **≈ $0.020** | ≈ 5,000 | ≈ 170 |

- **A cold prompt cache** (nothing built for 5 minutes) adds about $0.0006 on Haiku and $0.013 on Sonnet to the next build. Even at Sonnet's worst case that is about 3,000 pets a month.
- **Rate limits** on this key are 1,000 requests a minute and 400,000 output tokens a minute for both models, far above what a vote needs.
- **Drawing is not included.** It now runs on the OpenAI image API (OpenAI billing, not this $100), which I did not price. `draw codex` puts it back on the ChatGPT subscription.
- **Codex has no per-pet price** on the subscription, but it has a quota. That quota running out is the risk this work is meant to reduce.

## What I got wrong on the way

- **Concurrent calls were serialized.** Six simultaneous requests took six times as long as one, with the SDK's default Node fetch. That made my first full run show 18 s and 29 s build medians. At first I blamed API load. A clean re-run after the fix gave 4.9 s and 7.6 s. The fix is a plain HTTP/1.1 `undici` agent in `server/claude.mjs`. I have not checked whether the same slowdown happens on the Lightsail box, so check there after deploying.
- **Stale results leaked into my first reports.** The harness re-scored old files left in a result folder, so two of my early concurrency numbers were wrong. The scorer now reads only the wishes you asked for.

## Not tested

- **How the creatures look and move in the room.** The checks read the code and simulate it. Nobody watched the output, so a visual pass is still worth doing before putting this on the vote box.
- **The image API's price, and its quality over many wishes.** Timed on 11 sheets and checked by eye; no bill read, no rubric.
- **A busy day.** Everything ran at 4 wishes at a time from one laptop.

## Switching models on a running server

The server re-reads `commons-world/models.json` whenever the file changes, so models, effort, tier and the Claude spend cap switch **without a restart**. In-flight pets finish on the model they started with, and every run in `runs.jsonl` records the model that actually handled it. A missing file or key falls back to the `.env` defaults, and a broken file keeps the last good settings.

```
node tools/set-models.mjs haiku       # screen + build on Claude Haiku 5.5 (live on the box since 13 Oct)
node tools/set-models.mjs sonnet
node tools/set-models.mjs luna        # back to the Codex setup (needs the ChatGPT login)
node tools/set-models.mjs budget 80   # hard stop on Claude spend, in dollars
node tools/set-models.mjs show        # current file and spend so far
```

The file can also be edited by hand. It takes `screen`, `build` and `draw` (each `{ "model", "effort" }`), `tier` (`"fast"` or `""`) and `claudeBudgetUsd`. A Claude model under `draw` is ignored, because Claude can't draw. The spend log is `commons-world/claude-spend.jsonl`.

## Reproduce

```
uv run eval/run.py run screen haiku-v2 sonnet-v2 --conc 4
uv run eval/run.py run build  haiku-v2 sonnet-v2 --conc 4 --cat bleed,fantasy,local,local-edge,long,object,plain,weird
```

Results land in `eval/results/` (git-ignored) and the spend ledger in `eval/results/claude-spend.jsonl`.
