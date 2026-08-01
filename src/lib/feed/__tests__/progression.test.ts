import { describe, expect, it } from "vitest";
import {
	FREE_GAMES,
	isUnlocked,
	unlockedCount,
	unlockThreshold,
	WAVE_COST,
	WAVE_SIZE,
} from "../progression";

const TOTAL_GAMES = 32;

describe("progression", () => {
	it("starts with the free set unlocked", () => {
		expect(unlockedCount(0, TOTAL_GAMES)).toBe(FREE_GAMES);
	});

	it("unlocks a wave per WAVE_COST points", () => {
		expect(unlockedCount(WAVE_COST, TOTAL_GAMES)).toBe(FREE_GAMES + WAVE_SIZE);
		expect(unlockedCount(WAVE_COST * 3, TOTAL_GAMES)).toBe(
			FREE_GAMES + WAVE_SIZE * 3,
		);
	});

	it("does not unlock partway through a wave", () => {
		expect(unlockedCount(WAVE_COST - 1, TOTAL_GAMES)).toBe(FREE_GAMES);
	});

	it("never exceeds the number of games", () => {
		expect(unlockedCount(1_000_000, TOTAL_GAMES)).toBe(TOTAL_GAMES);
	});

	it("tolerates a negative total", () => {
		expect(unlockedCount(-50, TOTAL_GAMES)).toBe(FREE_GAMES);
	});

	it("reports no threshold for free games", () => {
		expect(unlockThreshold(0)).toBe(0);
		expect(unlockThreshold(FREE_GAMES - 1)).toBe(0);
	});

	it("reports the threshold that actually unlocks a game", () => {
		for (let i = FREE_GAMES; i < TOTAL_GAMES; i++) {
			const needed = unlockThreshold(i);
			expect(isUnlocked(i, needed, TOTAL_GAMES)).toBe(true);
			expect(isUnlocked(i, needed - 1, TOTAL_GAMES)).toBe(false);
		}
	});

	it("keeps the whole wave on the same threshold", () => {
		const first = unlockThreshold(FREE_GAMES);
		for (let i = 0; i < WAVE_SIZE; i++) {
			expect(unlockThreshold(FREE_GAMES + i)).toBe(first);
		}
		expect(unlockThreshold(FREE_GAMES + WAVE_SIZE)).toBeGreaterThan(first);
	});
});
