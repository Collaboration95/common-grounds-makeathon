# Reproduce checks

The preview needs no dependencies. These optional QA scripts use Playwright and the installed macOS Google Chrome executable. From `ideas/02-living-tape/`:

```sh
npm install --prefix .qa-runtime playwright --no-audit --no-fund
node qa/interaction-check.cjs
node qa/final-check.cjs
node qa/board-check.cjs
```

The board check mutates only this idea’s shapes on its own live board, then exports and verifies reload. Preview checks use `file://`; the final check asserts keyboard completion, unique IDs, system reduced motion and mobile bounds. `qa-results.json` also records the earlier complete pointer/state exercise. Chrome on another OS requires changing `executablePath`.
