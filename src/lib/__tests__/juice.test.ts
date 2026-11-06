import { describe, expect, it, vi } from "vitest";

import { burstParticles, juice } from "../juice";

describe("burstParticles", () => {
	it("clamps the count", () => {
		expect(burstParticles(0)).toHaveLength(1);
		expect(burstParticles(500)).toHaveLength(40);
	});

	it("spreads particles all the way round", () => {
		const ps = burstParticles(8, () => 0.5);
		const right = ps.filter((p) => p.dx > 0).length;
		const left = ps.filter((p) => p.dx < 0).length;
		expect(right).toBeGreaterThan(0);
		expect(left).toBeGreaterThan(0);
	});
});

describe("juice bus", () => {
	it("delivers events to subscribers until they unsubscribe", () => {
		const seen = vi.fn<(event: unknown) => void>();
		const off = juice.subscribe(seen);
		juice.shake(2);
		off();
		juice.shake(1);
		expect(seen).toHaveBeenCalledTimes(1);
		expect(seen).toHaveBeenCalledWith({ kind: "shake", strength: 2 });
	});
});
