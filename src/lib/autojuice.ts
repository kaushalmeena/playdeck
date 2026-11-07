import type { JuiceEvent } from "./juice";
import type { GameCue } from "./sfx";
import type { Streak } from "./streak";
import { calloutFor, hit, miss } from "./streak";

/**
 * Auto-juice: turn the sound cues every game already plays into visuals, so
 * all games get particles, streaks and shakes without each one wiring them.
 *
 * A burst lands where the player last touched, but only if that touch was a
 * moment ago — a `collect` in a swipe-steered game has nothing to do with
 * where the finger went down three seconds earlier.
 */

export type Pointer = { x: number; y: number; t: number };

export const POINTER_FRESH_MS = 350;

const POSITIVE: Partial<Record<GameCue, number>> = {
	good: 14,
	pop: 10,
	hit: 9,
	collect: 9,
	merge: 12,
};

export type CueReaction = {
	streak: Streak;
	effects: Array<JuiceEvent>;
	/** a streak milestone was reached — play its sound */
	milestone?: number;
};

export function reactToCue(
	cue: GameCue,
	pointer: Pointer | null,
	now: number,
	streak: Streak,
	accent: string,
): CueReaction {
	const fresh = pointer && now - pointer.t <= POINTER_FRESH_MS ? pointer : null;
	const particles = POSITIVE[cue];

	if (particles !== undefined) {
		const next = hit(streak, now);
		const effects: Array<JuiceEvent> = [];
		if (fresh) {
			effects.push({
				kind: "burst",
				x: fresh.x,
				y: fresh.y,
				color: accent,
				count: particles,
			});
			if (next.count >= 3) {
				effects.push({
					kind: "pop",
					x: fresh.x,
					y: fresh.y - 24,
					text: `×${next.count}`,
					color: accent,
				});
			}
		}
		const callout = calloutFor(next.count);
		if (callout) {
			effects.push({
				kind: "callout",
				text: callout.text,
				color: callout.color,
			});
			effects.push({ kind: "flash", color: callout.color });
		}
		return { streak: next, effects, milestone: callout?.tier };
	}

	if (cue === "bad") {
		return {
			streak: miss(),
			effects: [
				{ kind: "shake", strength: 1 },
				{ kind: "flash", color: "#ff4d6d" },
			],
		};
	}

	if (cue === "boom") {
		const effects: Array<JuiceEvent> = [
			{ kind: "shake", strength: 3 },
			{ kind: "flash", color: "#ff4d6d" },
		];
		if (fresh) {
			effects.push({
				kind: "burst",
				x: fresh.x,
				y: fresh.y,
				color: "#ff4d6d",
				count: 24,
			});
		}
		return { streak: miss(), effects };
	}

	// step, bounce, flap: fire many times a second — sound is enough
	return { streak, effects: [] };
}
