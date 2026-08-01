import { useEffect, useMemo, useState } from "react";
import type { GameEntry } from "../games/registry";
import { seededShuffle } from "../lib/feed/ordering";

/**
 * Randomises the feed order once per visit.
 *
 * Seed 0 (canonical order) is used for the server render and the first
 * client paint so hydration matches; a real seed is picked right after
 * mount, which reshuffles the deck for the session.
 */
export function useShuffledGames(games: Array<GameEntry>): Array<GameEntry> {
	const [seed, setSeed] = useState(0);

	useEffect(() => {
		setSeed(1 + Math.floor(Math.random() * 0xffffffff));
	}, []);

	return useMemo(() => seededShuffle(games, seed), [games, seed]);
}
