import type { GameEntry } from "../../games/registry";
import type { PlayerState } from "../storage";

export type Tab = "all" | "foryou" | "favorites" | "daily";

/** deterministic PRNG so a given seed always produces the same order */
function mulberry32(seed: number) {
	let a = seed || 1;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fisher–Yates with a seeded PRNG. seed 0 keeps the input order. */
export function seededShuffle<T>(
	items: ReadonlyArray<T>,
	seed: number,
): Array<T> {
	const out = [...items];
	if (!seed) return out;
	const rnd = mulberry32(seed);
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** how strongly the "For You" tab should surface a game */
export function forYouWeight(game: GameEntry, player: PlayerState): number {
	return (
		(player.plays[game.id] ?? 0) * 2 +
		(player.favorites.includes(game.id) ? 8 : 0) +
		(player.best[game.id] ?? 0) / 50
	);
}

export type SelectArgs = {
	tab: Tab;
	/** games in the (shuffled) display order */
	games: Array<GameEntry>;
	daily: Array<GameEntry>;
	player: PlayerState;
	/** true when the game is playable at the current score */
	unlocked: (id: string) => boolean;
};

/** the cards a tab shows, in the order it shows them */
export function selectList({
	tab,
	games,
	daily,
	player,
	unlocked,
}: SelectArgs): Array<GameEntry> {
	switch (tab) {
		case "daily":
			return daily;
		case "favorites":
			return games.filter((g) => player.favorites.includes(g.id));
		case "foryou":
			return games
				.filter((g) => unlocked(g.id))
				.sort((a, b) => forYouWeight(b, player) - forYouWeight(a, player));
		default:
			return games;
	}
}
