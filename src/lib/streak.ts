/**
 * Hit streaks — the in-run combo counter behind the "×5 NICE" callouts.
 *
 * A streak grows with every positive cue (a right answer, a pop, a catch)
 * landed within `STREAK_WINDOW_MS` of the last one, and breaks on a fumble
 * or a pause. Pure: the caller owns the state and the clock.
 */

export const STREAK_WINDOW_MS = 2200;

export type Streak = { count: number; last: number };

export const EMPTY_STREAK: Streak = { count: 0, last: 0 };

export function hit(streak: Streak, now: number): Streak {
	const alive = streak.count > 0 && now - streak.last <= STREAK_WINDOW_MS;
	return { count: alive ? streak.count + 1 : 1, last: now };
}

export const miss = (): Streak => EMPTY_STREAK;

const TIERS: Array<{ at: number; word: string; color: string }> = [
	{ at: 5, word: "NICE", color: "#3dffa0" },
	{ at: 10, word: "GREAT", color: "#00e5ff" },
	{ at: 15, word: "ON FIRE", color: "#ffd24d" },
	{ at: 25, word: "UNSTOPPABLE", color: "#ff5cd0" },
	{ at: 40, word: "GODLIKE", color: "#ff4d6d" },
];

/**
 * The callout for reaching this streak count, if it is a milestone: each
 * tier's threshold, then every 10 past the top tier.
 */
export function calloutFor(
	count: number,
): { text: string; color: string; tier: number } | null {
	const top = TIERS[TIERS.length - 1];
	const exact = TIERS.findIndex((t) => t.at === count);
	if (exact >= 0) {
		const t = TIERS[exact];
		return { text: `${t.word} ×${count}`, color: t.color, tier: exact + 1 };
	}
	if (count > top.at && (count - top.at) % 10 === 0) {
		return {
			text: `${top.word} ×${count}`,
			color: top.color,
			tier: TIERS.length,
		};
	}
	return null;
}
