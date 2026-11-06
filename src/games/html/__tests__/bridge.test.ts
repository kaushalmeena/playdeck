import { describe, expect, it } from "vitest";

import { GAME_TAG, injectSdk, readGameMessage } from "../bridge";

describe("injectSdk", () => {
	it("goes right after <head> so the SDK runs before game scripts", () => {
		const out = injectSdk(
			"<!doctype html><html><head><script>game()</script></head></html>",
		);
		expect(out.indexOf("window.playdeck")).toBeLessThan(out.indexOf("game()"));
		expect(out.startsWith("<!doctype html><html><head>")).toBe(true);
	});

	it("never lands before the doctype", () => {
		const out = injectSdk("<!DOCTYPE html><body>hi</body>");
		expect(out.startsWith("<!DOCTYPE html>")).toBe(true);
		expect(out).toContain("window.playdeck");
	});

	it("handles a bare fragment", () => {
		expect(injectSdk("<canvas></canvas>")).toMatch(
			/window\.playdeck[\s\S]*<canvas>/,
		);
	});
});

const msg = (m: object) => ({ source: GAME_TAG, ...m });

describe("readGameMessage", () => {
	it("ignores messages without the game tag", () => {
		expect(readGameMessage({ type: "end", won: true, score: 5 })).toBeNull();
		expect(readGameMessage("end")).toBeNull();
		expect(readGameMessage(null)).toBeNull();
	});

	it("clamps and rounds the score, and only a literal true wins", () => {
		expect(
			readGameMessage(msg({ type: "end", won: "yes", score: -4.2 })),
		).toEqual({
			type: "end",
			won: false,
			score: 0,
			note: undefined,
		});
		expect(
			readGameMessage(msg({ type: "end", won: true, score: 12.6 })),
		).toMatchObject({
			won: true,
			score: 13,
		});
	});

	it("caps hud chips and clamps progress", () => {
		const m = readGameMessage(
			msg({ type: "hud", chips: ["a", "b", "c", "d"], progress: 4 }),
		);
		expect(m).toEqual({ type: "hud", chips: ["a", "b", "c"], progress: 1 });
	});

	it("rejects unknown types", () => {
		expect(readGameMessage(msg({ type: "eval", code: "x" }))).toBeNull();
	});
});
