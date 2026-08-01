# 🎮 GameShorts

A YouTube-Shorts-style feed of micro-games. Swipe vertically, play a quick
run, rack up points, level up, keep scrolling.

Built with **TanStack Start** + **TypeScript** + **Tailwind CSS**, linted
and formatted with **Biome**. Light & dark mode included.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run check` (Biome lint + format).

## How it works

- **Feed** — [GameFeed.tsx](src/components/GameFeed.tsx) renders a
  vertical snap-scroll feed. One wheel gesture = one card. While a run is
  live the feed locks so game input never scrolls you away.
- **Games are independent units** — every game is one file in
  [src/games/](src/games/) matching `*.game.tsx`, auto-discovered with
  `import.meta.glob` ([registry.ts](src/games/registry.ts)).
  **Adding a game = dropping in one file. Removing it = deleting the
  file.** No manifest to edit.
- **Loaded dynamically in scroll** — each game is its own lazy chunk;
  only the active card ±1 is mounted, so a game's code downloads the
  moment its card scrolls near, and far-away cards unmount again.
- **Levels** — each game has a per-player level (starts at 1). Clear a
  run and the level goes up; games scale difficulty from the `level`
  prop, so the more you play, the harder it gets.
- **Scoring** — every run reports a score via `onEnd(won, score)`. It's
  added to your global 🏆 total (header) and tracked as the per-game
  best (★) on each card.
- **Favorites** — tap ♥ on a card; the Favorites tab shows only those.
- **Theme** — 🌙/☀️ toggle in the header; defaults to your system
  preference, applied before first paint (no flash).

All progress lives in `localStorage` ([storage.ts](src/lib/storage.ts)).

## Game contract

A game module exports `meta` and a default component:

```tsx
export const meta: GameMeta = {
  title: "My Game",
  emoji: "🕹️",
  desc: "One-liner for the card.",
  order: 7,
  accent: "#7c5cff",
  instructions: "Shown on the start overlay.",
};

export default function MyGame({ level, active, onEnd, onPlayingChange }: GameProps) {
  const { playing, result, begin, finish, cancel } = useRun(onEnd);
  // begin() on play, finish(won, score) when the run ends,
  // cancel() when `active` goes false (user scrolled away)
}
```

Wrap your game in [`<GameChrome>`](src/components/GameChrome.tsx) — it
provides the shared stage background, the in-run topbar chips and the
start/result overlay so every game looks like one product.

## Adding a game

1. Copy [src/games/_template.game.tsx](src/games/_template.game.tsx) to
   `src/games/<name>.game.tsx` (files starting with `_` are ignored).
2. Fill in `meta`, write your game, scale difficulty from `level`, call
   `finish(won, score)` when the run ends. Done — it's in the feed.

## Current lineup

| game | | difficulty curve |
|---|---|---|
| ⚡ Reflex Rush | tap when it turns green | reaction window shrinks |
| 🐍 Neon Snake | classic snake, win by quota | faster, bigger quota |
| 🧠 Mind Match | pair matching | more pairs, less time |
| 🚀 Glow Flap | flappy gates | narrower gaps, faster |
| 🎵 Echo Pads | simon-says pads | longer sequences, faster playback |
| 🤖 Zap Bot | whack-a-mole with bombs | shorter uptime, higher quota |
