import { useEffect, useMemo, useState } from "react";
import type { GameEntry } from "../games/registry";
import { seededShuffle } from "../lib/feed/ordering";

/**
 * Randomises the feed order once per visit.
 *
 * Seed 0 (canonical order) is used for the server render and the first client
 * paint so hydration matches; a real seed is picked right after mount, which
 * reshuffles the deck for the session. `settled` says which of the two you are
 * looking at, so the feed can hold a loader until the final order is known.
 */
export function useShuffledGames(games: Array<GameEntry>): {
	games: Array<GameEntry>;
	settled: boolean;
} {
	const [seed, setSeed] = useState(0);

	useEffect(() => {
		setSeed(1 + Math.floor(Math.random() * 0xffffffff));
	}, []);

	const shuffled = useMemo(() => seededShuffle(games, seed), [games, seed]);
	return { games: shuffled, settled: seed !== 0 };
}
