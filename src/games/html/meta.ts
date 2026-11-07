import type { GameMeta } from "../kit.ts";

/**
 * Metadata for a plug-and-play HTML game, read from `<meta>` tags in its
 * head:
 *
 *   <meta name="playdeck:title" content="Neon Tap" />
 *   <meta name="playdeck:emoji" content="💥" />
 *   <meta name="playdeck:desc" content="One-liner for the card." />
 *   <meta name="playdeck:order" content="40" />
 *   <meta name="playdeck:accent" content="#ff5cd0" />
 *   <meta name="playdeck:instructions" content="How to play." />
 *
 * Pure and DOM-free: it runs inside the Vite plugin at build time, so the
 * feed gets every title without downloading a single game.
 */

const META_TAG = /<meta\b[^>]*>/gi;
const ATTR = /([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

const ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&quot;": '"',
	"&#39;": "'",
	"&apos;": "'",
	"&lt;": "<",
	"&gt;": ">",
};

const decode = (s: string) =>
	s.replace(/&(amp|quot|#39|apos|lt|gt);/g, (m) => ENTITIES[m] ?? m);

/** every `playdeck:*` meta tag as a plain key → value map */
export function readPlaydeckTags(html: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [tag] of html.matchAll(META_TAG)) {
		const attrs: Record<string, string> = {};
		for (const m of tag.matchAll(ATTR)) {
			attrs[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? "");
		}
		const name = attrs.name ?? "";
		if (name.startsWith("playdeck:") && "content" in attrs) {
			out[name.slice("playdeck:".length)] = attrs.content;
		}
	}
	return out;
}

/**
 * Build a `GameMeta` from an HTML game's source. Throws with the file name
 * when a required tag is missing, so a broken game fails the build loudly
 * instead of shipping a blank card.
 */
export function parseHtmlMeta(html: string, file = "game"): GameMeta {
	const tags = readPlaydeckTags(html);
	const title = tags.title?.trim();
	if (!title) {
		throw new Error(
			`${file}: missing <meta name="playdeck:title" content="…"> in the head`,
		);
	}
	const order = Number(tags.order);
	return {
		title,
		emoji: tags.emoji?.trim() || "🕹️",
		desc: tags.desc?.trim() ?? "",
		order: Number.isFinite(order) ? order : 999,
		accent: tags.accent?.trim() || undefined,
		instructions: tags.instructions?.trim() || "Tap play to start.",
	};
}
