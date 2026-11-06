import { useEffect } from "react";

import type { Pointer } from "../lib/autojuice";
import { reactToCue } from "../lib/autojuice";
import { juice } from "../lib/juice";
import { onCue, sfx } from "../lib/sfx";
import type { Streak } from "../lib/streak";
import { EMPTY_STREAK } from "../lib/streak";

/**
 * While a run is live, turn its sound cues into particles, streak callouts
 * and shakes (see `lib/autojuice`). The streak resets with every run.
 */
export function useAutoJuice(live: boolean, accent: string) {
	useEffect(() => {
		if (!live) return;
		let pointer: Pointer | null = null;
		let streak: Streak = EMPTY_STREAK;

		const onPointer = (e: PointerEvent) => {
			pointer = { x: e.clientX, y: e.clientY, t: performance.now() };
		};
		const offCue = onCue((cue) => {
			const reaction = reactToCue(
				cue,
				pointer,
				performance.now(),
				streak,
				accent,
			);
			streak = reaction.streak;
			for (const effect of reaction.effects) {
				switch (effect.kind) {
					case "burst":
						juice.burst(effect.x, effect.y, effect.color, effect.count);
						break;
					case "pop":
						juice.pop(effect.x, effect.y, effect.text, effect.color);
						break;
					case "shake":
						juice.shake(effect.strength);
						break;
					case "flash":
						juice.flash(effect.color);
						break;
					case "callout":
						juice.callout(effect.text, effect.color);
						break;
				}
			}
			if (reaction.milestone) sfx.streak(reaction.milestone);
		});

		window.addEventListener("pointerdown", onPointer, { capture: true });
		return () => {
			offCue();
			window.removeEventListener("pointerdown", onPointer, { capture: true });
		};
	}, [live, accent]);
}
