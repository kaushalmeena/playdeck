import type { ComponentType } from "react";

import type { GameMeta, GameProps } from "./kit";

/**
 * Games are auto-discovered from `src/games/` — files starting with `_` are
 * ignored. Two formats plug in, side by side:
 *
 * - `*.game.tsx`  — a React module exporting `meta` and a default component.
 * - `*.game.html` — a self-contained HTML page with `<meta name="playdeck:*">`
 *                   tags, run in a sandboxed iframe (see `html/bridge.ts`).
 *
 * Add a game = add one file. Remove it = delete the file.
 *
 * Metadata is loaded eagerly (it's tiny); the game itself is a separate
 * chunk that only downloads when its card scrolls near the viewport.
 */
const reactMetas = import.meta.glob(["./*.game.tsx", "!./_*.game.tsx"], {
	import: "meta",
	eager: true,
}) as Record<string, GameMeta>;

const reactLoaders = import.meta.glob(["./*.game.tsx", "!./_*.game.tsx"], {
	import: "default",
}) as Record<string, () => Promise<ComponentType<GameProps>>>;

/** parsed at build time by plugins/html-game.ts — no game code included */
const htmlMetas = import.meta.glob(["./*.game.html", "!./_*.game.html"], {
	query: "?playdeck-meta",
	import: "default",
	eager: true,
}) as Record<string, GameMeta>;

const htmlSources = import.meta.glob(["./*.game.html", "!./_*.game.html"], {
	query: "?raw",
	import: "default",
}) as Record<string, () => Promise<string>>;

const htmlLoader = (path: string) => async () => {
	const [{ createHtmlGame }, html] = await Promise.all([
		import("./html/HtmlGame"),
		htmlSources[path](),
	]);
	return createHtmlGame(htmlMetas[path], html);
};

type Source = {
	meta: GameMeta;
	loader: () => Promise<ComponentType<GameProps>>;
};

const sources: Record<string, Source> = {};
for (const [path, meta] of Object.entries(reactMetas)) {
	sources[path] = { meta, loader: reactLoaders[path] };
}
for (const [path, meta] of Object.entries(htmlMetas)) {
	sources[path] = { meta, loader: htmlLoader(path) };
}

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
	path.replace(/^\.\//, "").replace(/\.game\.(tsx|html)$/, "");

const resolved = new Map<string, ComponentType<GameProps>>();
const pending = new Map<string, Promise<ComponentType<GameProps>>>();

export const GAMES: Array<GameEntry> = Object.entries(sources)
	.map(([path, { meta, loader }]) => {
		const id = idOf(path);
		const load = () => {
			const cached = resolved.get(id);
			if (cached) return Promise.resolve(cached);
			// one request (and one bound component) however many cards ask
			let inflight = pending.get(id);
			if (!inflight) {
				inflight = loader().then((Component) => {
					resolved.set(id, Component);
					return Component;
				});
				pending.set(id, inflight);
			}
			return inflight;
		};
		return { ...meta, id, load, loaded: () => resolved.get(id) };
	})
	.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
