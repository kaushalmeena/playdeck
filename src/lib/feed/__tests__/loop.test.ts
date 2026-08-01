import { describe, expect, it } from "vitest";
import {
	COPIES,
	extentCount,
	isLooping,
	listIndex,
	rebase,
	startIndex,
} from "../loop";

describe("feed loop", () => {
	it("does not loop a list that cannot scroll", () => {
		expect(isLooping(0)).toBe(false);
		expect(isLooping(1)).toBe(false);
		expect(isLooping(2)).toBe(true);
	});

	it("renders the list COPIES times when looping", () => {
		expect(extentCount(32)).toBe(32 * COPIES);
		expect(extentCount(1)).toBe(1);
	});

	it("opens in the middle copy", () => {
		expect(startIndex(32)).toBe(32);
		expect(startIndex(1)).toBe(0);
	});

	it("leaves indices inside the middle copy alone", () => {
		expect(rebase(32, 32)).toBeNull();
		expect(rebase(63, 32)).toBeNull();
	});

	it("wraps forward off the end of the middle copy", () => {
		expect(rebase(64, 32)).toBe(32);
		expect(rebase(95, 32)).toBe(63);
	});

	it("wraps backward off the start of the middle copy", () => {
		expect(rebase(31, 32)).toBe(63);
		expect(rebase(0, 32)).toBe(32);
	});

	it("keeps the same card visible across a wrap", () => {
		const len = 32;
		for (const idx of [0, 5, 31, 64, 80, 95]) {
			const next = rebase(idx, len);
			if (next !== null) {
				expect(listIndex(next, len)).toBe(listIndex(idx, len));
			}
		}
	});

	it("never rebases when looping is off", () => {
		expect(rebase(0, 1)).toBeNull();
	});

	it("maps extended indices onto the list", () => {
		expect(listIndex(0, 32)).toBe(0);
		expect(listIndex(32, 32)).toBe(0);
		expect(listIndex(65, 32)).toBe(1);
		expect(listIndex(0, 0)).toBe(0);
	});
});
