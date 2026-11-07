import { useEffect, useState } from "react";

/**
 * Tick a number up from 0 to `target` with an ease-out, restarting whenever
 * `target` or `key` changes — the score reveal on the result screen.
 */
export function useCountUp(target: number, key: unknown, ms = 650): number {
	const [value, setValue] = useState(target);

	useEffect(() => {
		if (target <= 0) {
			setValue(target);
			return;
		}
		const started = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const t = Math.min((now - started) / ms, 1);
			setValue(Math.round(target * (1 - (1 - t) ** 3)));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		setValue(0);
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, key, ms]);

	return value;
}
