<div align="center">

<img src="public/icon.svg" alt="Playdeck logo" width="96" height="96" />

# Playdeck

[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639?logo=opensourceinitiative&logoColor=white)](LICENSE) [![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.x-4C6EF5?logo=tanstack&logoColor=white)](https://tanstack.com/start) [![React](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-0B7285?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Doomscrolling, except every card is a game you can win.**

32 small games in an endless vertical feed. Swipe, play a thirty-second run,
level up. No sign-up, works offline.

[**Try it live**](https://kaushalmeena.github.io/playdeck/)

</div>

---

## Features

- **Endless feed** — swipe, scroll, arrow keys or `Space`. One card per flick.
- **Levels** — every game remembers your level and gets harder as you win.
- **Combos** — win streaks multiply your score, up to ×3.
- **Unlocks** — 8 games free, 4 more every 250 points.
- **Daily challenge** — 3 games, the same for everyone, with a streak and a
  shareable card.
- **Offline** — installable PWA. Progress lives in your browser, not a server.

## How It Works

The feed renders the deck three times over and keeps you in the middle copy,
hopping back a copy once scrolling settles — so it never reaches an end.

Only the visible card and its neighbours are mounted, so at most three games
hold timers at once. Starting a run freezes the feed and hands the game your
keys and taps.

Games are single files in [`src/games`](src/games). Drop one in and it shows up;
delete it and it's gone.

## Tech Stack

| Area        | Tools                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| **App**     | [TanStack Start](https://tanstack.com/start) · [React](https://react.dev) · [TypeScript](https://www.typescriptlang.org)  |
| **Styling** | [Tailwind CSS](https://tailwindcss.com)                                                                                  |
| **Games**   | Canvas 2D · Web Audio                                                                                                    |
| **Testing** | [Vitest](https://vitest.dev)                                                                                             |
| **Tooling** | [Vite](https://vite.dev) · [Biome](https://biomejs.dev)                                                                  |

## Getting Started

These instructions will get you a copy of the project up and running on your
local machine for development purposes.

### Requirements

To install and run this project you need:

- [Node.js](https://nodejs.org/) `>=22`
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [git](https://git-scm.com/downloads) (only to clone this repository)

### Installation

To set up everything on your local machine, follow these steps:

1. Clone this repo and then change directory to the `playdeck` folder:

```bash
git clone https://github.com/kaushalmeena/playdeck.git
cd playdeck
```

2. Install project dependencies using npm:

```bash
npm install
```

### Running

To run the project simply run:

```bash
npm run dev
```

Your app should now be running on [localhost:5173](http://localhost:5173/).

### Testing

To run the unit tests:

```bash
npm test
```

To lint and format-check the project:

```bash
npm run check
```

### Building

To create a production build:

```bash
npm run build
```

Every route is prerendered to static HTML, so nothing needs a server. The
deployable site is `dist/client`.

## Deployment

Every push to `main` is tested, built and deployed to GitHub Pages by the
[deploy workflow](.github/workflows/deploy.yml). A project site is served from
`/<repo>/`, so the workflow builds with `BASE_PATH` set from the repository
name.

## Documentation

Full documentation is available in the [`/docs`](./docs) directory.

**Contributing a Game:**

- [Adding a Game](./docs/adding-a-game.md) — the one-file contract, the run
  lifecycle, and the kit helpers.
- [The Games](./docs/games.md) — all 32 games and how each one scales.

**Under the Hood:**

- [Architecture](./docs/architecture.md) — the feed, wheel paging, scoring, and
  what's unit-tested.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please
[open an issue](https://github.com/kaushalmeena/playdeck/issues/new/choose)
first to discuss it. For code changes, fork the repository, create a branch,
and open a pull request.

New games are especially welcome — see
[Adding a Game](./docs/adding-a-game.md).

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE)
file for details.
