import { describe, expect, it } from "vitest";
import { DEFAULT_PAGER, WheelPager } from "../wheel";

const { threshold, idleReset, sustainRearm } = DEFAULT_PAGER;

/** a sharp flick followed by a decaying inertia tail, as a trackpad sends it */
function flick(pager: WheelPager, from: number, peak = 120) {
	let steps = 0;
	let t = from;
	const feed = (d: number) => {
		if (pager.feed(d, t)) steps++;
		t += 16;
	};
	for (const d of [peak * 0.5, peak * 0.75, peak, peak * 0.85, peak * 0.7]) {
		feed(d);
	}
	for (let d = peak * 0.5; d > 0.5; d *= 0.9) feed(d); // ~1s of inertia
	return { steps, endedAt: t };
}

describe("WheelPager", () => {
	it("pages once the accumulated delta crosses the threshold", () => {
		const p = new WheelPager();
		expect(p.feed(threshold / 2, 0)).toBe(0);
		expect(p.feed(threshold / 2, 10)).toBe(1);
	});

	it("reports direction from the sign of the delta", () => {
		const p = new WheelPager();
		expect(p.feed(-threshold, 0)).toBe(-1);
	});

	it("ignores a single tiny nudge", () => {
		const p = new WheelPager();
		expect(p.feed(4, 0)).toBe(0);
	});

	it("pages exactly once for one flick, inertia included", () => {
		const p = new WheelPager();
		expect(flick(p, 0).steps).toBe(1);
	});

	it("recovers for a deliberate second flick during the inertia tail", () => {
		// the regression: a latch-based pager stays stuck here forever
		const p = new WheelPager();
		const first = flick(p, 0);
		expect(first.steps).toBe(1);
		// user flicks again while inertia from the first is still trailing off
		const second = flick(p, first.endedAt);
		expect(second.steps).toBe(1);
	});

	it("keeps paging across many back-to-back flicks", () => {
		const p = new WheelPager();
		let t = 0;
		let total = 0;
		for (let i = 0; i < 5; i++) {
			const r = flick(p, t);
			total += r.steps;
			t = r.endedAt;
		}
		expect(total).toBe(5);
	});

	it("never stalls under long, steady input", () => {
		const p = new WheelPager();
		let steps = 0;
		for (let t = 0; t < 2000; t += 16) {
			if (p.feed(40, t)) steps++;
		}
		expect(steps).toBeGreaterThanOrEqual(3);
		// but it still paces itself rather than firing every event
		expect(steps).toBeLessThan(10);
	});

	it("treats a low, steady trickle as inertia and does not page again", () => {
		const p = new WheelPager();
		expect(p.feed(120, 0)).toBe(1);
		let steps = 0;
		for (let t = 16; t < 2000; t += 16) {
			if (p.feed(6, t)) steps++;
		}
		expect(steps).toBe(0);
	});

	it("drops a stale accumulator after an idle gap", () => {
		const p = new WheelPager();
		p.feed(threshold - 10, 0);
		expect(p.feed(20, idleReset + 100)).toBe(0);
	});

	it("pages both directions across separate gestures", () => {
		const p = new WheelPager();
		expect(p.feed(120, 0)).toBe(1);
		expect(p.feed(-120, idleReset + 300)).toBe(-1);
	});

	it("resets cleanly", () => {
		const p = new WheelPager();
		p.feed(120, 0);
		p.reset();
		expect(p.feed(120, 1)).toBe(1);
	});

	it("exposes a sane sustained re-arm window", () => {
		expect(sustainRearm).toBeGreaterThan(idleReset);
	});
});
