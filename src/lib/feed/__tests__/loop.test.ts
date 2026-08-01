import { describe, expect, it } from "vitest";
import { listIndex, startIndex, VIRTUAL_COUNT, virtualCount } from "../loop";

const DECK = 32;

describe("virtualCount", () => {
	it("renders a long virtual list for a deck that can loop", () => {
		expect(virtualCount(DECK)).toBe(VIRTUAL_COUNT);
	});

	it("does not loop a deck with nothing to scroll to", () => {
		expect(virtualCount(0)).toBe(0);
		expect(virtualCount(1)).toBe(1);
	});

	it("stays clear of the browser scroll-height ceiling", () => {
		// every card is one viewport tall; Chrome caps scroll height near 33m px
		const tallestSaneViewport = 1200;
		expect(VIRTUAL_COUNT * tallestSaneViewport).toBeLessThan(33_000_000);
	});
});

describe("startIndex", () => {
	it("opens in the middle so there is runway both ways", () => {
		const start = startIndex(DECK);
		expect(start).toBeGreaterThan(VIRTUAL_COUNT / 4);
		expect(start).toBeLessThan((VIRTUAL_COUNT * 3) / 4);
	});

	it("opens on the deck's first card", () => {
		for (const len of [2, 3, 5, 7, 32]) {
			expect(listIndex(startIndex(len), len)).toBe(0);
		}
	});

	it("opens at 0 when the deck cannot loop", () => {
		expect(startIndex(0)).toBe(0);
		expect(startIndex(1)).toBe(0);
	});
});

describe("listIndex", () => {
	it("wraps forward onto the deck", () => {
		expect(listIndex(0, DECK)).toBe(0);
		expect(listIndex(DECK, DECK)).toBe(0);
		expect(listIndex(DECK + 1, DECK)).toBe(1);
	});

	it("wraps backward onto the deck", () => {
		expect(listIndex(-1, DECK)).toBe(DECK - 1);
		expect(listIndex(-DECK, DECK)).toBe(0);
	});

	it("keeps neighbouring indices on neighbouring cards", () => {
		const start = startIndex(DECK);
		expect([-1, 0, 1].map((d) => listIndex(start + d, DECK))).toEqual([
			DECK - 1,
			0,
			1,
		]);
	});

	it("survives an empty deck", () => {
		expect(listIndex(5, 0)).toBe(0);
	});
});
