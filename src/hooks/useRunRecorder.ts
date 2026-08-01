import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameEntry } from "../games/registry";
import { celebrateDaily, celebrateLevelUp } from "../lib/celebrate";
import { DAILY_BONUS } from "../lib/daily";
import { sfx } from "../lib/sfx";
import { store } from "../lib/storage";

/** consecutive wins multiply the score, capped so it stays sane */
export const COMBO_STEP = 0.25;
export const COMBO_CAP = 8;
export const comboMultiplier = (combo: number): number =>
	1 + COMBO_STEP * Math.min(Math.max(combo, 0), COMBO_CAP);

export type GameHandlers = {
	end: (won: boolean, score: number) => void;
	playing: (playing: boolean) => void;
};

/**
 * Records finished runs: combo scoring, persistence, the daily challenge and
 * all the celebration feedback. Also tracks which game (if any) currently
 * owns the screen.
 *
 * The per-game callbacks are built once per game list and never change
 * identity — a feed re-render must not restart a running canvas game loop.
 */
export function useRunRecorder(
	games: Array<GameEntry>,
	dailyIds: Array<string>,
	today: string,
) {
	const [combo, setCombo] = useState(0);
	const [playingId, setPlayingId] = useState<string | null>(null);
	const comboRef = useRef(0);

	// latest logic behind a stable ref so handler identity can stay frozen
	const record = useRef<(id: string, won: boolean, raw: number) => void>(
		() => {},
	);
	record.current = (id, won, raw) => {
		const mult = comboMultiplier(comboRef.current);
		const points = Math.round(raw * mult);
		const level = store.recordEnd(id, won, points);

		comboRef.current = won ? comboRef.current + 1 : 0;
		setCombo(comboRef.current);

		if (won) {
			sfx.levelUp();
			celebrateLevelUp();
			const bonus = mult > 1 ? ` (×${mult.toFixed(2)})` : "";
			toast.success(`⬆ Level ${level} unlocked · +${points} pts${bonus}`);
		} else {
			sfx.lose();
			if (points > 0) toast(`+${points} pts`);
		}

		if (
			won &&
			dailyIds.includes(id) &&
			store.recordDailyWin(today, id, dailyIds)
		) {
			store.addBonus(DAILY_BONUS);
			sfx.daily();
			celebrateDaily();
			toast.success(`📅 Daily challenge complete! +${DAILY_BONUS} bonus pts`);
		}
	};

	const handlers = useMemo(() => {
		const map = new Map<string, GameHandlers>();
		for (const game of games) {
			map.set(game.id, {
				end: (won, score) => record.current(game.id, won, score),
				playing: (isPlaying) =>
					setPlayingId((cur) =>
						isPlaying ? game.id : cur === game.id ? null : cur,
					),
			});
		}
		return map;
	}, [games]);

	const handlersFor = useCallback(
		(id: string): GameHandlers =>
			handlers.get(id) ?? { end: () => {}, playing: () => {} },
		[handlers],
	);

	return { combo, playingId, handlersFor };
}
