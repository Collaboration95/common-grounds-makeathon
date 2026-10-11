# WW: Wes Waldo

Home for everything specific to the Waldo idea: plans, code and assets. Branch `wes-waldo`.

## The idea (from the user's tldraw sketch, as described)

Front page → an always-changing wall of posts → click one and you're dropped straight into a simple find-the-character game. From there: play other people's games, or create your own (your own scene and story).

## Constraints

- Makeathon MVP: at most 3 build hours, short demo. Polish only what's on screen.
- Modular: background scene and guest sprite are separate files, cached so they can be served and swapped later.
- Generation uses OpenAI only (one API key): a prompt generator (text model writes the image prompts) and a pixel generator (image model makes the art).

## Run it

```sh
cd WW
cp .env.example .env        # paste your OpenAI API key
npm start                   # http://localhost:5173
npm run seed -- 0           # paint one seed game (test); `npm run seed` paints all of seeds.json
npm run placeholder         # placeholder worlds for UI work without a key
```

## Status

- The full loop works with real generated worlds: wall → zoom into a world → hover reactions → clue → find → caption → create.
- 3 draft worlds exist: a test stadium (the Baker), Gollum at Bilbo's party, and Paddington in the cantina.
- `npm run rehide -- <gameId>` moves a game's characters to new spots without repainting anything.
- Scope decisions and build order are in `PLAN.md`. `context/` has the full design brief, the event reference and the prize slide.
