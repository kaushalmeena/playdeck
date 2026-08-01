import type { ComponentType } from "react";
import type { GameMeta, GameProps } from "./kit";

/**
 * Games are auto-discovered: every `src/games/*.game.tsx` file becomes a
 * card in the feed (files starting with `_` are ignored). A game module
 * exports `meta` (title, emoji, …) and a default React component.
 * Add a game = add one file. Remove it = delete the file.
 *
 * Metadata is loaded eagerly (it's tiny); the component itself is a separate
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
	/** download this game's component, or hand back the cached one */
	load: () => Promise<ComponentType<GameProps>>;
	/**
	 * The component if it is already in memory, otherwise undefined.
	 *
	 * This is why the registry resolves components itself instead of using
	 * `React.lazy`: lazy suspends on its first render even when the chunk is
	 * already downloaded, which paints the fallback for a frame. Reading the
	 * cache synchronously lets a preloaded card render on its first frame.
	 */
	loaded: () => ComponentType<GameProps> | undefined;
};

const idOf = (path: string) =>
	path.replace(/^\.\//, "").replace(/\.game\.tsx$/, "");

const resolved = new Map<string, ComponentType<GameProps>>();

export const GAMES: Array<GameEntry> = Object.entries(metas)
	.map(([path, meta]) => {
		const id = idOf(path);
		return {
			...meta,
			id,
			loaded: () => resolved.get(id),
			load: async () => {
				const cached = resolved.get(id);
				if (cached) return cached;
				// import() dedupes, so concurrent callers share one request
				const Component = await loaders[path]();
				resolved.set(id, Component);
				return Component;
			},
		};
	})
	.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
