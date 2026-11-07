import { describe, expect, it } from "vitest";

import {
	calloutFor,
	EMPTY_STREAK,
	hit,
	miss,
	STREAK_WINDOW_MS,
} from "../streak";

describe("streak", () => {
	it("grows on quick consecutive hits", () => {
		let s = EMPTY_STREAK;
		s = hit(s, 1000);
		s = hit(s, 1500);
		s = hit(s, 2000);
		expect(s.count).toBe(3);
	});

	it("restarts at 1 after a pause longer than the window", () => {
		const s = hit(hit(EMPTY_STREAK, 0), STREAK_WINDOW_MS + 1);
		expect(s.count).toBe(1);
	});

	it("breaks on a miss", () => {
		expect(miss().count).toBe(0);
	});
});

describe("calloutFor", () => {
	it("fires on tier thresholds only", () => {
		expect(calloutFor(4)).toBeNull();
		expect(calloutFor(5)?.text).toBe("NICE ×5");
		expect(calloutFor(6)).toBeNull();
		expect(calloutFor(15)?.text).toBe("ON FIRE ×15");
	});

	it("keeps firing every 10 past the top tier", () => {
		expect(calloutFor(50)?.text).toBe("GODLIKE ×50");
		expect(calloutFor(55)).toBeNull();
	});
});
