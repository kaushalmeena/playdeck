import type { ComponentType } from "react";
import { lazy } from "react";
import type { GameMeta, GameProps } from "./kit";

/**
 * Games are auto-discovered: every `src/games/*.game.tsx` file becomes a
 * card in the feed (files starting with `_` are ignored). A game module
 * exports `meta` (title, emoji, …) and a default React component.
 * Add a game = add one file. Remove it = delete the file.
 *
 * Metadata is loaded eagerly (it's tiny); the component itself is a lazy
 * chunk that only downloads when its card scrolls near the viewport.
 */
const metas = import.meta.glob(["./*.game.tsx", "!./_*.game.tsx"], {
	import: "meta",
	eager: true,
}) as Record<string, GameMeta>;

const loaders = import.meta.glob(["./*.game.tsx", "!./_*.game.tsx"], {
	import: "default",
}) as Record<string, () => Promise<ComponentType<GameProps>>>;

export type GameEntry = GameMeta & {
	id: string;
	Component: ComponentType<GameProps>;
};

export const GAMES: Array<GameEntry> = Object.entries(metas)
	.map(([path, meta]) => ({
		...meta,
		id: path.replace(/^\.\//, "").replace(/\.game\.tsx$/, ""),
		Component: lazy(() => loaders[path]().then((C) => ({ default: C }))),
	}))
	.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
