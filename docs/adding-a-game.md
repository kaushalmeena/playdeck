# Adding a Game

A game is one file. Drop it in and it appears in the feed; delete it and it
is gone. There is no manifest to edit and no app code to touch.

## The quickest path

1. Copy [`src/games/_template.game.tsx`](../src/games/_template.game.tsx) to
   `src/games/<your-game>.game.tsx`. Files starting with `_` are ignored by
   the registry, which is why the template itself never shows up.
2. Fill in `meta`.
3. Replace the demo body with your game.

That is the whole workflow — the dev server picks the file up immediately.

## How discovery works

[`src/games/registry.ts`](../src/games/registry.ts) globs `./*.game.tsx` with
`import.meta.glob`. Metadata is loaded eagerly, because it is tiny and the
feed needs every title up front; the component itself is a lazy chunk that
only downloads when its card scrolls near the viewport.

## The contract

Every module exports a `meta` object and a default component.

```tsx
export const meta: GameMeta = {
  title: "My Game",
  emoji: "🕹️",
  desc: "One-liner shown on the card.",
  order: 33,
  accent: "#7c5cff",
  instructions: "Shown on the start overlay.",
};

export default function MyGame({ level, active, onEnd, onPlayingChange }: GameProps) {
  const { playing, result, begin, finish, cancel } = useRun(onEnd);
  ...
}
```

### `meta`

| Field          | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `title`        | Shown on the card and the start overlay                      |
| `emoji`        | Card icon                                                    |
| `desc`         | One line under the title on the card                         |
| `order`        | Canonical position — drives unlock rank, not display order   |
| `accent`       | Tints the overlay, progress bar and level chip               |
| `instructions` | How to play, shown before the first run                      |

`order` is the game's rank for [progression
unlocks](./architecture.md#progression). The feed itself is shuffled every
visit, so `order` does not decide where the card appears — only when it
becomes playable.

### Props

| Prop              | Meaning                                                        |
| ----------------- | -------------------------------------------------------------- |
| `level`           | This player's level for your game — scale difficulty from it    |
| `active`          | `false` once the card scrolls away; abandon any live run        |
| `onEnd`           | Report a finished run                                           |
| `onPlayingChange` | Tell the feed whether a run owns the screen                     |

You rarely call the last two directly — `useRun` and `GameChrome` do it.

## The run lifecycle

[`useRun`](../src/games/kit.ts) models the only state machine a game needs:

```
menu ──begin()──► playing ──finish(won, score)──► result ──begin()──► …
                     └────────cancel()───────────► menu
```

- `begin()` starts a run.
- `finish(won, score, note?)` ends one. The score is added to the player's
  global total (after the combo multiplier) and a win raises the level. The
  optional `note` replaces the default result line, e.g. `"Crashed"`.
- `cancel()` abandons a run silently — no score, no level change. Call it
  when `active` goes false.

Wire the last part up in every game:

```tsx
useEffect(() => {
  if (!active && playing) cancel();
}, [active, playing, cancel]);
```

## Chrome

Wrap your play area in [`GameChrome`](../src/components/game/GameChrome.tsx).
It draws the stage background, the in-run HUD chips, the optional progress
bar, the quit button and the start/result overlay — which is what makes 33
independently written games look like one product.

```tsx
<GameChrome
  emoji={meta.emoji}
  title={meta.title}
  accent={meta.accent}
  level={level}
  instructions={meta.instructions}
  playing={playing}
  result={result}
  chips={[`🍏 ${eaten}/${goal}`, `${score} PTS`]}
  progress={timeLeft / total}
  onPlay={start}
  onQuit={cancel}
  onPlayingChange={onPlayingChange}
>
  {/* your play area */}
</GameChrome>
```

Pass `progress` only if your game is timed; omit it and the bar disappears.

## Kit helpers

From [`src/games/kit.ts`](../src/games/kit.ts):

| Helper                        | Use                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `useRun(onEnd)`               | The run lifecycle above                                     |
| `useCountdown(playing, secs)` | A timer that restarts with each run; watch for `0`           |
| `useTimers()`                 | `setTimeout`s that clear themselves on unmount               |
| `useGameKeys(active, map)`    | Keyboard controls that beat the feed's paging                |
| `sfx`                         | Sound cues for your game's actions                           |
| `randInt` `shuffle` `pick`    | Small random helpers                                         |

### Sound

Call `sfx` from the kit when something happens. Starting, quitting, winning
and losing already make noise through the chrome and the scorer — what a game
adds is feedback for its own actions:

```tsx
sfx.good();        // a right answer, a matched pair, a cleared wave
sfx.bad();         // a fumble that does not end the run
sfx.step();        // a light move: tile flip, lane change, grid step
sfx.collect();     // picking something up
sfx.hit();         // landing a hit
sfx.pop();         // a bubble popping
sfx.boom();        // an explosion
sfx.bounce();      // ball or paddle
sfx.flap();        // thrust or jump
sfx.merge(value);  // tiles combining — pitch rises with the value
```

Every sound is synthesized, so there is nothing to download, and all of them
respect the player's mute toggle. Prefer `step()` for anything that fires many
times a second — a chime on every tap gets tiring fast.

### Keyboard games

The feed pages on `↑`, `↓` and `Space`. A game that wants those keys must use
`useGameKeys`, which listens in the capture phase and stops handled keys from
propagating — so the game always wins, with no dependence on the feed
noticing that a run started.

```tsx
useGameKeys(playing, {
  ArrowLeft: () => turn(-1, 0),
  ArrowRight: () => turn(1, 0),
  Space: flap,
});
```

Keys are matched against both `event.key` (`"ArrowUp"`, `"w"`) and
`event.code` (`"Space"`).

## Difficulty

Scale everything off `level`, and floor it so high levels stay playable
rather than impossible:

```ts
const goal = 5 + level;                          // more to do
const windowMs = Math.max(900 - level * 70, 250); // less time to do it
```

A win raises the level by one, so a game should stay winnable indefinitely —
clamp your curve rather than letting it run away.

## Checklist

- [ ] File is `src/games/<name>.game.tsx`, no leading underscore
- [ ] Exports `meta` and a default component
- [ ] Difficulty scales from `level` and is clamped
- [ ] `finish(won, score)` fires exactly once per run
- [ ] `cancel()` runs when `active` goes false
- [ ] Keyboard controls go through `useGameKeys`
- [ ] Wrapped in `GameChrome`
