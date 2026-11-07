import { describe, expect, it } from "vitest";

import { POINTER_FRESH_MS, reactToCue } from "../autojuice";
import type { Streak } from "../streak";
import { EMPTY_STREAK } from "../streak";

const ACCENT = "#7c5cff";

describe("reactToCue", () => {
	it("bursts at a fresh pointer on a positive cue", () => {
		const r = reactToCue(
			"pop",
			{ x: 10, y: 20, t: 1000 },
			1100,
			EMPTY_STREAK,
			ACCENT,
		);
		expect(r.effects).toContainEqual(
			expect.objectContaining({ kind: "burst", x: 10, y: 20 }),
		);
		expect(r.streak.count).toBe(1);
	});

	it("skips the burst when the touch is stale, but still counts the streak", () => {
		const r = reactToCue(
			"collect",
			{ x: 10, y: 20, t: 0 },
			POINTER_FRESH_MS + 1,
			EMPTY_STREAK,
			ACCENT,
		);
		expect(r.effects).toEqual([]);
		expect(r.streak.count).toBe(1);
	});

	it("shows the multiplier from the third hit", () => {
		const two: Streak = { count: 2, last: 900 };
		const r = reactToCue("good", { x: 0, y: 0, t: 1000 }, 1000, two, ACCENT);
		expect(r.effects).toContainEqual(
			expect.objectContaining({ kind: "pop", text: "×3" }),
		);
	});

	it("calls out a milestone and reports its tier", () => {
		const four: Streak = { count: 4, last: 900 };
		const r = reactToCue("good", null, 1000, four, ACCENT);
		expect(r.milestone).toBe(1);
		expect(r.effects).toContainEqual(
			expect.objectContaining({ kind: "callout" }),
		);
	});

	it("breaks the streak and shakes on a fumble", () => {
		const r = reactToCue("bad", null, 1000, { count: 9, last: 900 }, ACCENT);
		expect(r.streak.count).toBe(0);
		expect(r.effects).toContainEqual({ kind: "shake", strength: 1 });
	});

	it("ignores high-frequency cues", () => {
		const s: Streak = { count: 3, last: 900 };
		expect(reactToCue("step", null, 1000, s, ACCENT)).toEqual({
			streak: s,
			effects: [],
		});
	});
});
