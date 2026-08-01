import { describe, expect, it } from "vitest";
import {
	type Board,
	canMove,
	move,
	slideLine,
	spawn,
	targetFor,
} from "../merge.game";

/** build a 4×4 board from rows, for readability */
const b = (...rows: Array<Array<number>>): Board => rows.flat();

describe("slideLine", () => {
	it("packs tiles towards the front", () => {
		expect(slideLine([0, 2, 0, 4]).line).toEqual([2, 4, 0, 0]);
	});

	it("merges an equal pair and scores the sum", () => {
		const { line, gained } = slideLine([2, 2, 0, 0]);
		expect(line).toEqual([4, 0, 0, 0]);
		expect(gained).toBe(4);
	});

	it("merges two separate pairs in one pass", () => {
		const { line, gained } = slideLine([2, 2, 4, 4]);
		expect(line).toEqual([4, 8, 0, 0]);
		expect(gained).toBe(12);
	});

	it("never merges the same tile twice in one move", () => {
		// the classic 2048 rule: 2,2,2,2 makes two 4s, not one 8
		expect(slideLine([2, 2, 2, 2]).line).toEqual([4, 4, 0, 0]);
		expect(slideLine([4, 4, 8, 0]).line).toEqual([8, 8, 0, 0]);
	});

	it("merges the leading pair when three match", () => {
		expect(slideLine([2, 2, 2, 0]).line).toEqual([4, 2, 0, 0]);
	});

	it("leaves an unmergeable line alone", () => {
		expect(slideLine([2, 4, 8, 16]).line).toEqual([2, 4, 8, 16]);
		expect(slideLine([2, 4, 8, 16]).gained).toBe(0);
	});

	it("keeps the line length", () => {
		expect(slideLine([0, 0, 0, 0]).line).toHaveLength(4);
	});
});

describe("move", () => {
	const board = b([2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);

	it("slides left", () => {
		expect(move(board, "left").board.slice(0, 4)).toEqual([4, 0, 0, 0]);
	});

	it("slides right", () => {
		expect(move(board, "right").board.slice(0, 4)).toEqual([0, 0, 0, 4]);
	});

	it("slides up", () => {
		const col = b([2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
		const out = move(col, "up").board;
		expect([out[0], out[4]]).toEqual([4, 0]);
	});

	it("slides down", () => {
		const col = b([2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
		const out = move(col, "down").board;
		expect([out[0], out[12]]).toEqual([0, 4]);
	});

	it("reports when nothing shifted", () => {
		const packed = b([2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]);
		expect(move(packed, "left").moved).toBe(false);
		expect(move(packed, "up").moved).toBe(false);
	});

	it("does not mutate the board it was given", () => {
		const original = [...board];
		move(board, "left");
		expect(board).toEqual(original);
	});

	it("sums the points from every line", () => {
		const two = b([2, 2, 0, 0], [4, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
		expect(move(two, "left").gained).toBe(12);
	});
});

describe("canMove", () => {
	it("is true while an empty cell remains", () => {
		expect(
			canMove(b([2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0])),
		).toBe(true);
	});

	it("is true on a full board that still has a merge", () => {
		expect(
			canMove(b([2, 2, 4, 8], [4, 8, 16, 32], [2, 4, 8, 16], [4, 8, 16, 32])),
		).toBe(true);
	});

	it("is false on a jammed board", () => {
		expect(
			canMove(b([2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2])),
		).toBe(false);
	});
});

describe("spawn", () => {
	it("fills exactly one empty cell", () => {
		const before = b([2, 4, 8, 16], [2, 4, 8, 16], [2, 4, 8, 16], [2, 4, 8, 0]);
		const after = spawn(before);
		expect(after.filter((v) => v === 0)).toHaveLength(0);
		expect([2, 4]).toContain(after[15]);
	});

	it("leaves a full board untouched", () => {
		const full = b([2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]);
		expect(spawn(full)).toEqual(full);
	});
});

describe("targetFor", () => {
	it("starts at 32 and doubles per level", () => {
		expect(targetFor(1)).toBe(32);
		expect(targetFor(2)).toBe(64);
		expect(targetFor(3)).toBe(128);
	});

	it("caps so high levels stay finishable", () => {
		expect(targetFor(20)).toBe(targetFor(5));
	});
});
