import { describe, expect, it } from "vitest";

import { parseHtmlMeta, readPlaydeckTags } from "../meta";

const page = (head: string) =>
	`<!doctype html><html><head>${head}</head><body></body></html>`;

describe("readPlaydeckTags", () => {
	it("reads playdeck tags in either attribute order and ignores others", () => {
		const tags = readPlaydeckTags(
			page(`
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width">
				<meta name="playdeck:title" content="Neon Tap">
				<meta content='💥' name='playdeck:emoji' />
			`),
		);
		expect(tags).toEqual({ title: "Neon Tap", emoji: "💥" });
	});

	it("decodes html entities", () => {
		const tags = readPlaydeckTags(
			page(
				`<meta name="playdeck:desc" content="Tap &amp; hold &quot;fast&quot;">`,
			),
		);
		expect(tags.desc).toBe('Tap & hold "fast"');
	});
});

describe("parseHtmlMeta", () => {
	it("fills defaults for optional tags", () => {
		const meta = parseHtmlMeta(
			page(`<meta name="playdeck:title" content="X">`),
		);
		expect(meta).toEqual({
			title: "X",
			emoji: "🕹️",
			desc: "",
			order: 999,
			accent: undefined,
			instructions: "Tap play to start.",
		});
	});

	it("parses the order as a number", () => {
		const meta = parseHtmlMeta(
			page(
				`<meta name="playdeck:title" content="X"><meta name="playdeck:order" content="41">`,
			),
		);
		expect(meta.order).toBe(41);
	});

	it("fails loudly, naming the file, when the title is missing", () => {
		expect(() => parseHtmlMeta(page(""), "broken.game.html")).toThrow(
			/broken\.game\.html/,
		);
	});
});
