import { useEffect, useRef, useState } from "react";

const DELAY_MS = 2500;

/**
 * Show the swipe hint only to someone who has not moved yet. The baseline
 * card is taken once the hint is due, not on mount: the feed jumps to its
 * middle copy while opening, and that is not the player moving.
 * Hidden for good once they page or start a run.
 */
export function useSwipeHint(index: number, busy: boolean): boolean {
	const baseline = useRef<number | null>(null);
	const [due, setDue] = useState(false);
	const [done, setDone] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setDue(true), DELAY_MS);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (!due || done) return;
		if (baseline.current === null) baseline.current = index;
		else if (index !== baseline.current) setDone(true);
	}, [due, done, index]);

	useEffect(() => {
		if (busy) setDone(true);
	}, [busy]);

	return due && !done;
}
