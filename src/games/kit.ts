import { useCallback, useState } from "react";

/** Static metadata every game module exports as `meta`. */
export type GameMeta = {
	title: string;
	emoji: string;
	/** one-liner shown on the feed card */
	desc: string;
	/** feed position (ascending) */
	order: number;
	/** accent color for this game's chrome */
	accent?: string;
	/** how-to-play text shown on the start overlay */
	instructions: string;
};

/** Props the feed passes to every game component. */
export type GameProps = {
	/** current level for this game — scale your difficulty from it */
	level: number;
	/** false when the card is scrolled away; cancel any running game */
	active: boolean;
	/** call exactly once per run — score adds to the global total, a win bumps the level */
	onEnd: (won: boolean, score: number) => void;
	/** lets the feed lock scrolling while a run is live */
	onPlayingChange?: (playing: boolean) => void;
};

export type GameResult = {
	won: boolean;
	score: number;
	/** optional flavor text ("Crashed", "Too early…") shown instead of the default */
	note?: string;
} | null;

/**
 * Run lifecycle shared by all games:
 * menu → begin() → playing → finish(won, score) → result overlay → begin() …
 * cancel() aborts silently (used when the card scrolls away).
 */
export function useRun(onEnd: GameProps["onEnd"]) {
	const [playing, setPlaying] = useState(false);
	const [result, setResult] = useState<GameResult>(null);

	const begin = useCallback(() => setPlaying(true), []);
	const cancel = useCallback(() => setPlaying(false), []);
	const finish = useCallback(
		(won: boolean, score: number, note?: string) => {
			setPlaying(false);
			setResult({ won, score, note });
			onEnd(won, score);
		},
		[onEnd],
	);

	return { playing, result, begin, finish, cancel };
}
