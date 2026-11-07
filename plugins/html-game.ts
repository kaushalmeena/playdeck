import { readFile } from "node:fs/promises";

import type { Plugin } from "vite";

import { parseHtmlMeta } from "../src/games/html/meta.ts";

const QUERY = "?playdeck-meta";

/**
 * Lets the registry read an HTML game's metadata without bundling the game.
 *
 * `import meta from "./x.game.html?playdeck-meta"` resolves to a tiny JS
 * module holding only the parsed `<meta name="playdeck:*">` tags. The game
 * itself is imported separately with `?raw` and lazily, so it stays out of
 * the main bundle until its card nears the screen.
 */
export function htmlGame(): Plugin {
	return {
		name: "playdeck:html-game",
		enforce: "pre",
		async load(id) {
			if (!id.endsWith(QUERY)) return null;
			const file = id.slice(0, -QUERY.length);
			this.addWatchFile(file);
			const html = await readFile(file, "utf8");
			const meta = parseHtmlMeta(html, file);
			return `export default ${JSON.stringify(meta)};`;
		},
	};
}
