import { describe, expect, it } from "vitest";
import type { GameEntry } from "../../games/registry";
import { DAILY_SIZE, dailyGames, dateKey } from "../daily";

const GAMES = Array.from({ length: 32 }, (_, i) => ({
	id: `g${i}`,
})) as Array<GameEntry>;
const ids = (list: Array<GameEntry>) => list.map((g) => g.id);

describe("dateKey", () => {
	it("formats as YYYY-MM-DD in local time", () => {
		expect(dateKey(new Date(2026, 7, 1, 23, 30))).toBe("2026-08-01");
	});

	it("pads single-digit months and days", () => {
		expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("dailyGames", () => {
	it("picks DAILY_SIZE games", () => {
		expect(dailyGames(GAMES, "2026-08-01")).toHaveLength(DAILY_SIZE);
	});

	it("is the same set for everyone on a given date", () => {
		expect(ids(dailyGames(GAMES, "2026-08-01"))).toEqual(
			ids(dailyGames(GAMES, "2026-08-01")),
		);
	});

	it("changes from day to day", () => {
		const week = ["01", "02", "03", "04", "05", "06", "07"].map((d) =>
			ids(dailyGames(GAMES, `2026-08-${d}`)).join(),
		);
		expect(new Set(week).size).toBeGreaterThan(1);
	});

	it("never repeats a game within a day", () => {
		const picked = ids(dailyGames(GAMES, "2026-08-01"));
		expect(new Set(picked).size).toBe(picked.length);
	});

	it("copes with fewer games than the daily size", () => {
		expect(dailyGames(GAMES.slice(0, 2), "2026-08-01")).toHaveLength(2);
	});
});
