import { useEffect, useMemo, useState } from "react";
import type { GameEntry } from "../games/registry";
import { seededShuffle } from "../lib/feed/ordering";

const SEED_KEY = "pd_seed";

const randomSeed = () => 1 + Math.floor(Math.random() * 0xffffffff);

/**
 * One shuffle per browsing session, remembered in sessionStorage.
 *
 * Reloading keeps the deck you were looking at — a fresh order on every
 * refresh made the feed feel like it had lost your place. Opening the app in
 * a new tab, or coming back later, deals a new one.
 */
function sessionSeed(): number {
	try {
		const saved = Number(sessionStorage.getItem(SEED_KEY));
		if (saved) return saved;
		const seed = randomSeed();
		sessionStorage.setItem(SEED_KEY, String(seed));
		return seed;
	} catch {
		// private mode — a per-mount shuffle is the best we can do
		return randomSeed();
	}
}

/**
 * Randomises the feed order.
 *
 * Seed 0 (canonical order) is used for the server render and the first client
 * paint so hydration matches; the session's real seed is applied right after
 * mount. `settled` says which of the two you are looking at, so the feed can
 * hold its splash until the final order is known.
 */
export function useShuffledGames(games: Array<GameEntry>): {
	games: Array<GameEntry>;
	settled: boolean;
} {
	const [seed, setSeed] = useState(0);

	useEffect(() => {
		setSeed(sessionSeed());
	}, []);

	const shuffled = useMemo(() => seededShuffle(games, seed), [games, seed]);
	return { games: shuffled, settled: seed !== 0 };
}
