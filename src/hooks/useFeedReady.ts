import { useEffect, useState } from "react";
import type { GameEntry } from "../games/registry";

/** the splash stays up at least this long, so it reads as a screen, not a blink */
export const MIN_SPLASH_MS = 450;
/** how long the splash lingers on top of the feed while it fades out */
export const SPLASH_FADE_MS = 260;

type Options = {
	/** has the session's shuffle been applied? */
	settled: boolean;
	/** the card the feed will open on, if there is one */
	first?: GameEntry;
};

export type FeedReady = {
	/** the feed may render */
	ready: boolean;
	/** keep painting the splash — it is mid fade-out */
	splashUp: boolean;
};

/**
 * Decides when the feed is allowed to appear.
 *
 * Three things have to line up: the deck is shuffled, the first card's chunk
 * has arrived, and the splash has been visible long enough not to flash. The
 * splash then overlaps the feed for one fade so the swap never shows a gap.
 */
export function useFeedReady({ settled, first }: Options): FeedReady {
	const [chunkFor, setChunkFor] = useState<string | null>(null);
	const [minElapsed, setMinElapsed] = useState(false);
	const [splashUp, setSplashUp] = useState(true);

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

	const ready = settled && minElapsed && (!first || chunkFor === first.id);

	useEffect(() => {
		if (!ready) return;
		const t = setTimeout(() => setSplashUp(false), SPLASH_FADE_MS);
		return () => clearTimeout(t);
	}, [ready]);

	return { ready, splashUp };
}
