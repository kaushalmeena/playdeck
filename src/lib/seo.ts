/**
 * Page metadata. Every route builds its head through `seo()` so titles,
 * descriptions, canonicals and social cards stay consistent and unique.
 */

/** "/" locally, "/<repo>/" on GitHub Pages — always ends in a slash */
const BASE = import.meta.env.BASE_URL;

export const SITE = {
	name: "Playdeck",
	tagline: "Doomscrolling, except every card is a game you can win",
	/** override with VITE_SITE_URL when deploying somewhere else */
	origin: (
		import.meta.env.VITE_SITE_URL ?? "https://kaushalmeena.github.io"
	).replace(/\/$/, ""),
	description:
		"A deck of 32 bite-sized browser games dealt as an endless vertical feed. Swipe, play a thirty-second run, and level up — free, no sign-up, works offline.",
	keywords: [
		"browser games",
		"mini games",
		"free online games",
		"casual games",
		"html5 games",
		"no download games",
		"quick games",
		"daily challenge",
	],
	locale: "en_US",
	twitterCard: "summary",
} as const;

/** absolute URL for a route path such as "/" or "/daily" */
export const canonical = (path = "/"): string =>
	`${SITE.origin}${BASE}${path.replace(/^\//, "")}`;

export type PageMeta = {
	/** page-specific title; the site name is appended */
	title: string;
	description: string;
	/** route path, e.g. "/daily" */
	path?: string;
};

type MetaTag = Record<string, string>;

/**
 * Build the `meta`/`links` a route hands to TanStack Router's `head`.
 *
 * Open Graph and Twitter tags are duplicated deliberately — crawlers read one
 * or the other, not both.
 */
export function seo({ title, description, path = "/" }: PageMeta): {
	meta: Array<MetaTag>;
	links: Array<MetaTag>;
} {
	const fullTitle = `${title} · ${SITE.name}`;
	const url = canonical(path);
	const image = `${SITE.origin}${BASE}icon.svg`;

	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ name: "keywords", content: SITE.keywords.join(", ") },
			{ name: "robots", content: "index, follow" },
			{ name: "application-name", content: SITE.name },
			{ name: "apple-mobile-web-app-title", content: SITE.name },
			{ name: "apple-mobile-web-app-capable", content: "yes" },

			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: SITE.name },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:image", content: image },
			{ property: "og:locale", content: SITE.locale },

			{ name: "twitter:card", content: SITE.twitterCard },
			{ name: "twitter:title", content: fullTitle },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: image },
		],
		links: [{ rel: "canonical", href: url }],
	};
}

/**
 * Structured data so search engines can show this as a playable game rather
 * than a generic page.
 */
export const structuredData = (): string =>
	JSON.stringify({
		"@context": "https://schema.org",
		"@type": "VideoGame",
		name: SITE.name,
		url: canonical("/"),
		description: SITE.description,
		image: `${SITE.origin}${BASE}icon.svg`,
		applicationCategory: "GameApplication",
		gamePlatform: "Web browser",
		operatingSystem: "Any",
		playMode: "SinglePlayer",
		inLanguage: "en",
		isAccessibleForFree: true,
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
	});
