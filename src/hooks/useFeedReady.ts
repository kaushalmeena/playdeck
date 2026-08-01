import { useEffect, useState } from "react";
import type { GameEntry } from "../games/registry";

/** the splash stays up at least this long, so it reads as a screen, not a blink */
export const MIN_SPLASH_MS = 800;

type Options = {
	/** has the session's shuffle been applied? */
	settled: boolean;
	/** the card the feed will open on, if there is one */
	first?: GameEntry;
};

/**
 * Decides when the feed is allowed to appear.
 *
 * Three things have to line up for the first paint: the deck is shuffled, the
 * first card's chunk has arrived, and the splash has been up long enough not
 * to flash.
 *
 * After that it latches on. Switching tabs changes which card is first, and
 * without the latch that would drop the player back to a splash they have
 * already sat through.
 */
export function useFeedReady({ settled, first }: Options): boolean {
	const [chunkFor, setChunkFor] = useState<string | null>(null);
	const [minElapsed, setMinElapsed] = useState(false);
	const [latched, setLatched] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (!settled || !first) return;
		let alive = true;
		first.load().finally(() => {
			if (alive) setChunkFor(first.id);
		});
		return () => {
			alive = false;
		};
	}, [settled, first]);

	const ready =
		latched || (settled && minElapsed && (!first || chunkFor === first.id));

	useEffect(() => {
		if (ready) setLatched(true);
	}, [ready]);

	return ready;
}
