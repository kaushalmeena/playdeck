# 🎮 GameShorts

A YouTube-Shorts-style feed of micro-games. Swipe vertically, play a quick
run, rack up points, level up, keep scrolling — forever (the feed loops).

Built with **TanStack Start** + **TypeScript** + **Tailwind CSS**, linted
and formatted with **Biome**. Installable as a **PWA** with offline
support. Light & dark mode included.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run check` (Biome lint + format),
`npm test` (Vitest).

## The feed

- **32 games** in a randomised, infinite snap-scroll loop — wheel (one
  card per flick), swipe, `↑/↓`, `Space` (next), or the ▲▼ buttons. The
  logo rewinds to the top.
- **Tabs are routes** — `/` all, `/you` (ordered by what you play),
  `/favorites`, `/daily` — cross-faded with the View Transitions API.
- The deck is **reshuffled every visit**. Unlocking still follows each
  game's canonical position, so a shuffle never changes what's available.
- While a run is live the feed locks and a ✕ button quits the run.
  Games claim their keys in the capture phase
  ([`useGameKeys`](src/games/kit.ts)), so arrows/space always reach the
  game rather than paging the feed.

## Progression

- **Levels** — every game has a per-player level; a win bumps it, and
  games scale difficulty from the `level` prop. The more you play, the
  harder it gets.
- **Scoring** — every run's score adds to the global 🏆 total. Best
  single-run score (★) is tracked per game.
- **Combo** — consecutive wins build a score multiplier (up to ×3),
  shown as ⚡ in the header. A loss resets it.
- **Unlock waves** — 8 games are free; every 250 total points unlocks 4
  more, up to all 32.
- **Daily challenge 📅** — 3 date-seeded games, the same for everyone.
  Clear all three for +100 bonus points, a 🔥 streak, and a shareable
  result card (`navigator.share`, canvas-rendered).
- Level-ups get confetti (canvas-confetti), WebAudio sfx and haptics;
  toasts via sonner. Everything persists in `localStorage`
  ([storage.ts](src/lib/storage.ts)).

## Layout

```
src/
  routes/          one file per feed tab (view-transitioned)
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

The scroll engine, scoring rules and ordering live in pure modules with
no React or DOM, so they're unit-tested directly
(`src/**/__tests__`, 48 tests). Components stay presentational and the
hooks hold the behaviour.

## Games are independent units

Every game is one file in [src/games/](src/games/) matching `*.game.tsx`,
auto-discovered with `import.meta.glob`
([registry.ts](src/games/registry.ts)). **Adding a game = dropping in one
file. Removing it = deleting the file.** Cards mount/unmount dynamically
as you scroll (active ±1 only).

A game module exports `meta` and a default component:

```tsx
export const meta: GameMeta = {
  title: "My Game",
  emoji: "🕹️",
  desc: "One-liner for the card.",
  order: 33,
  accent: "#7c5cff",
  instructions: "Shown on the start overlay.",
};

export default function MyGame({ level, active, onEnd, onPlayingChange }: GameProps) {
  const { playing, result, begin, finish, cancel } = useRun(onEnd);
  // begin() on play · finish(won, score) when the run ends
  // cancel() when `active` goes false (user scrolled away)
}
```

Wrap the game in [`<GameChrome>`](src/components/GameChrome.tsx) — shared
stage, topbar chips, progress bar, quit button and start/result overlay —
and use the [kit](src/games/kit.ts) helpers (`useCountdown`, `useTimers`,
`randInt`, `shuffle`, `pick`). Start from
[_template.game.tsx](src/games/_template.game.tsx); files starting with
`_` are ignored by the registry.

## The lineup (32)

Reflex Rush ⚡ · Neon Snake 🐍 · Mind Match 🧠 · Glow Flap 🚀 ·
Echo Pads 🎵 · Zap Bot 🤖 · Quick Math ➕ · Color Clash 🎨 ·
Tap Frenzy 👆 · Odd One Out 🔍 · Number Order 🔢 · Perfect Stop 🛑 ·
Dodge Rush 🏃 · Bubble Pop 🫧 · Higher Lower 🃏 · RPS React ✊ ·
Lights Out 💡 · Quick Shot 🏹 · Sky Stack 🏗️ · Digit Recall 🔐 ·
Word Jumble 📝 · Color Hunt 🌈 · Flash Count 👁️ · Fact Check ✅ ·
Pattern Echo 🧩 · Stop Watch ⏱️ · Star Catch 🧺 · Path Recall 🗺️ ·
Brick Break 🧱 · Keep Up 🏓 · Odd·Even ⚖️ · Orbit Dash 🪐
