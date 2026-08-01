# Architecture

The guiding rule: **behaviour lives in pure modules and hooks, components
only render.** Anything with real logic — the scroll engine, scoring,
ordering, unlocks — has no React and no DOM in it, so it can be unit-tested
directly instead of through a rendered tree.

## Layout

```
src/
  routes/          one file per feed tab, cross-faded on navigation
  components/
    feed/          GameFeed · FeedHeader · FeedTabs · FeedStats
                   GameCard · CardRail · CardStates · NavArrows …
    game/          GameChrome · GameOverlay · GameTopBar · Chip
  hooks/           useInfiniteFeed · useRunRecorder · useShuffledGames
  lib/
    feed/          wheel · loop · ordering · progression   (pure)
    daily · storage · sfx · share · celebrate · theme
  games/           *.game.tsx — one self-contained game each
```

`GameFeed` is ~135 lines of composition; it owns no scroll maths, no scoring
rules and no ordering logic.

## The feed

### Infinite loop

The visible list is rendered three times back to back. The player always sits
in the middle copy, so there is a full list of runway in both directions.
Once scrolling settles in an outer copy, [`rebase`](../src/lib/feed/loop.ts)
jumps by exactly one list-length — visually identical, because the card at
that offset is the same card — and the runway is restored.

The jump is an instant `scrollTop` assignment 120 ms after the last scroll
event, so it never lands mid-animation and is never visible.

### Wheel paging

[`WheelPager`](../src/lib/feed/wheel.ts) converts a stream of wheel events
into discrete page steps. This is subtler than it looks, because trackpads
keep emitting inertial events for up to a second after your fingers leave the
pad:

- A **one-page-per-gesture latch** never releases during that tail. Combined
  with `preventDefault()`, which stops native scrolling from taking over, the
  feed goes completely dead. (This was a real bug.)
- A **plain time cooldown** lets the inertia tail page by itself, so one flick
  travels several cards.

So the pager arms on *intent* rather than on time. It arms when input begins
after a quiet gap, or when the delta jumps sharply — inertia only ever
decays, so a sudden increase means the user pushed again. A sustained-input
escape hatch re-arms after 600 ms of continuous above-floor scrolling, which
means there is no state in which it can latch.

Touch swiping is left entirely to native CSS scroll snapping.

### Input ownership

While a run is live the feed freezes: the scroller switches to
`overflow-hidden`, and the wheel and key handlers read a **ref** rather than
React state, so a game never loses the keystroke that starts it to a stale
render.

Games claim keys in the capture phase via `useGameKeys`, so correctness does
not depend on the freeze winning a race.

## Progression

Two orderings, deliberately separate:

- **Display order** is reshuffled every visit
  ([`useShuffledGames`](../src/hooks/useShuffledGames.ts)). Seed `0` — the
  canonical order — is used for the server render and first paint so
  hydration matches, then a real seed is drawn on mount.
- **Unlock rank** is each game's `meta.order`, which never changes. Eight
  games are free and every 250 points unlocks a wave of four.

Keeping them apart is what lets the feed feel fresh without making
progression random.

The daily challenge picks three games from a PRNG seeded with the date, so
every player gets the same set, and it ignores unlock gates — the daily can
hand you a game you have not earned yet.

## Scoring

[`useRunRecorder`](../src/hooks/useRunRecorder.ts) owns everything that
happens when a run ends: the combo multiplier, persistence, the daily
challenge, and the sound/confetti/toast feedback.

Consecutive wins raise a multiplier by 0.25 each, capped at ×3; a loss resets
it. The multiplied score is what reaches the global total and the per-game
best.

Its per-game callbacks are built once per game list and **never change
identity**. A feed re-render must not hand a running game a new `onEnd`, or
the effect holding its animation loop would tear down mid-run.

## Persistence

Everything lives in one `localStorage` key behind a
[`useSyncExternalStore`](../src/lib/storage.ts) store: favourites, per-game
levels and bests, plays, the global total, daily completions and the streak.
The store exposes intent-shaped methods (`recordEnd`, `recordDailyWin`,
`toggleFavorite`) rather than a setter, so the reducer logic stays in one
place.

## Testing

The pure modules are covered directly — 48 tests, no DOM, no rendering:

| Suite         | Covers                                                     |
| ------------- | ----------------------------------------------------------- |
| `wheel`       | Paging, inertia rejection, and the never-latch guarantee     |
| `loop`        | Wrap arithmetic and that a wrap keeps the same card visible  |
| `progression` | Unlock waves and thresholds agreeing with each other         |
| `ordering`    | Seeded shuffle determinism and per-tab list selection        |
| `daily`       | Date keys, and that a date always yields the same set        |

Tests sit in `__tests__` folders next to the code they cover. Two real bugs
came out of writing them: the daily picker returned a short set when the game
list was smaller than the challenge, and the wheel pager's first design let
the inertia tail page by itself.

```bash
npm test
```
