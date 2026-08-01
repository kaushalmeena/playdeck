import { describe, expect, it } from "vitest";
import type { GameEntry } from "../../../games/registry";
import type { PlayerState } from "../../storage";
import { forYouWeight, seededShuffle, selectList } from "../ordering";

const game = (id: string, order: number): GameEntry =>
	({
		id,
		order,
		title: id,
		emoji: "🎮",
		desc: "",
		instructions: "",
		Component: (() => null) as unknown as GameEntry["Component"],
	}) as GameEntry;

const GAMES = ["a", "b", "c", "d", "e"].map((id, i) => game(id, i));

const player = (over: Partial<PlayerState> = {}): PlayerState => ({
	favorites: [],
	levels: {},
	best: {},
	total: 0,
	plays: {},
	daily: {},
	streak: { count: 0, last: "" },
	...over,
});

const ids = (list: Array<GameEntry>) => list.map((g) => g.id);

describe("seededShuffle", () => {
	it("keeps the original order for seed 0 (SSR / first paint)", () => {
		expect(ids(seededShuffle(GAMES, 0))).toEqual(["a", "b", "c", "d", "e"]);
	});

	it("is deterministic for a given seed", () => {
		expect(ids(seededShuffle(GAMES, 123))).toEqual(
			ids(seededShuffle(GAMES, 123)),
		);
	});

	it("produces a different order for a different seed", () => {
		const seeds = [1, 2, 3, 4, 5, 6].map((s) =>
			ids(seededShuffle(GAMES, s)).join(),
		);
		expect(new Set(seeds).size).toBeGreaterThan(1);
	});

	it("keeps every item exactly once", () => {
		expect([...ids(seededShuffle(GAMES, 99))].sort()).toEqual([
			"a",
			"b",
			"c",
			"d",
			"e",
		]);
	});

	it("does not mutate the input", () => {
		const input = [...GAMES];
		seededShuffle(input, 7);
		expect(ids(input)).toEqual(["a", "b", "c", "d", "e"]);
	});
});

describe("forYouWeight", () => {
	it("ranks favourites above unplayed games", () => {
		const p = player({ favorites: ["a"] });
		expect(forYouWeight(GAMES[0], p)).toBeGreaterThan(
			forYouWeight(GAMES[1], p),
		);
	});

	it("counts plays and best scores", () => {
		const p = player({ plays: { a: 5 }, best: { b: 100 } });
		expect(forYouWeight(GAMES[0], p)).toBe(10);
		expect(forYouWeight(GAMES[1], p)).toBe(2);
	});
});

describe("selectList", () => {
	const base = {
		games: GAMES,
		daily: [GAMES[3], GAMES[4]],
		unlocked: () => true,
	};

	it("shows every game on the all tab, in feed order", () => {
		expect(ids(selectList({ ...base, tab: "all", player: player() }))).toEqual([
			"a",
			"b",
			"c",
			"d",
			"e",
		]);
	});

	it("shows only favourites on the favorites tab", () => {
		const p = player({ favorites: ["c", "a"] });
		expect(ids(selectList({ ...base, tab: "favorites", player: p }))).toEqual([
			"a",
			"c",
		]);
	});

	it("opens the all tab on a playable game, keeping locked ones as teasers", () => {
		const list = selectList({
			...base,
			tab: "all",
			player: player(),
			unlocked: (id) => id === "d",
		});
		// every game is still there, but the unlocked one leads
		expect(ids(list)).toEqual(["d", "a", "b", "c", "e"]);
	});

	it("keeps locked favourites visible, after the playable ones", () => {
		const p = player({ favorites: ["a", "d"] });
		const list = selectList({
			...base,
			tab: "favorites",
			player: p,
			unlocked: (id) => id === "d",
		});
		expect(ids(list)).toEqual(["d", "a"]);
	});

	it("orders the for-you tab by weight", () => {
		const p = player({ plays: { e: 9 }, favorites: ["c"] });
		const list = selectList({ ...base, tab: "foryou", player: p });
		expect(ids(list).slice(0, 2)).toEqual(["e", "c"]);
	});

	it("hides locked games from the for-you tab", () => {
		const list = selectList({
			...base,
			tab: "foryou",
			player: player(),
			unlocked: (id) => id === "a" || id === "b",
		});
		expect(ids(list)).toEqual(["a", "b"]);
	});

	it("shows the daily set regardless of locks", () => {
		const list = selectList({
			...base,
			tab: "daily",
			player: player(),
			unlocked: () => false,
		});
		expect(ids(list)).toEqual(["d", "e"]);
	});
});
