# Playdeck

32 small games in an endless vertical feed. The guiding rule is **behaviour
lives in pure modules and hooks; components only render** — the scroll engine,
scoring, ordering and unlocks contain no React and no DOM, so they are unit
tested directly rather than through a rendered tree.

## Done means the checks pass

```bash
npm run check   # biome: lint + format
npm run test    # vitest, 48 tests
```

`npm run generate-routes` regenerates TanStack Router's route tree; run it after
adding or moving a route file.

## Reading the codebase

| Working on                                  | Read                                          |
| ------------------------------------------- | --------------------------------------------- |
| Adding a game                               | [adding-a-game.md](docs/adding-a-game.md)     |
| Feed, scroll engine, scoring, persistence   | [architecture.md](docs/architecture.md)       |
| What each of the 32 games is                | [games.md](docs/games.md)                     |

## Conventions

**A game is one file.** Drop it in and it appears in the feed; delete it and it
is gone. There is no manifest to edit and no app code to touch — if adding a
game requires changing app code, the contract has been broken. See
[adding-a-game.md](docs/adding-a-game.md) for the contract and the checklist.

**Logic stays out of components.** Anything with real behaviour goes in a pure
module or hook so it can be tested without rendering. A component that grows a
scoring rule is the smell this rule exists to catch.

**Persistence goes through the store, not `localStorage` directly.** Everything
— favourites, per-game levels and bests, plays, the global total, daily
completions, the streak — lives behind one `useSyncExternalStore` store in
`src/lib/storage.ts`. It exposes intent-shaped methods (`recordEnd`,
`recordDailyWin`, `toggleFavorite`) rather than a setter, so the reducer logic
stays in one place. Add a method rather than writing the key from a component.

**Tests sit in `__tests__` folders** next to the code they cover.

## Gotchas

- Canonical game order is also unlock order, but the feed shuffles the display
  order on every visit — do not assume the two agree.
- The daily picker must return a full set even when the game list is shorter
  than the challenge, and the wheel pager must never latch. Both are covered by
  tests because both were real bugs.
