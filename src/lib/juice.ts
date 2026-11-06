/**
 * "Juice" — the particles, floating score text, shakes and flashes that make
 * a tap feel good. A tiny event bus: games (or the auto-juice wiring in the
 * chrome) emit, and the `JuiceLayer` of whichever game is live renders.
 *
 * Only one run can own the screen at a time, so a single global bus is
 * enough; a layer subscribes only while its own run is live.
 *
 * Coordinates are viewport (client) coordinates — exactly what a pointer
 * event hands you — and the layer maps them into its stage.
 */

export type JuiceEvent =
	| { kind: "pop"; x: number; y: number; text: string; color?: string }
	| { kind: "burst"; x: number; y: number; color?: string; count?: number }
	| { kind: "shake"; strength: number }
	| { kind: "flash"; color?: string }
	| { kind: "callout"; text: string; color?: string };

type Listener = (event: JuiceEvent) => void;

const listeners = new Set<Listener>();

const emit = (event: JuiceEvent) => {
	for (const l of listeners) l(event);
};

export const juice = {
	/** floating text ("+10", "PERFECT") rising from a point */
	pop(x: number, y: number, text: string, color?: string) {
		emit({ kind: "pop", x, y, text, color });
	},
	/** a spray of particles from a point */
	burst(x: number, y: number, color?: string, count?: number) {
		emit({ kind: "burst", x, y, color, count });
	},
	/** shake the stage — 1 is a nudge, 3 is an explosion */
	shake(strength = 1) {
		emit({ kind: "shake", strength });
	},
	/** a brief full-stage tint */
	flash(color?: string) {
		emit({ kind: "flash", color });
	},
	/** a big centred word ("ON FIRE ×10") */
	callout(text: string, color?: string) {
		emit({ kind: "callout", text, color });
	},
	subscribe(listener: Listener): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};

export type Particle = {
	/** travel in px */
	dx: number;
	dy: number;
	size: number;
	/** seconds */
	dur: number;
};

/**
 * Particle trajectories for a burst. Evenly spread around the circle with a
 * little jitter so it reads as an explosion rather than a ring. `rand` is
 * injectable so tests are deterministic.
 */
export function burstParticles(
	count: number,
	rand: () => number = Math.random,
): Array<Particle> {
	const n = Math.min(Math.max(Math.round(count), 1), 40);
	return Array.from({ length: n }, (_, i) => {
		const angle = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.6;
		const dist = 36 + rand() * 54;
		return {
			dx: Math.cos(angle) * dist,
			dy: Math.sin(angle) * dist,
			size: 4 + rand() * 5,
			dur: 0.45 + rand() * 0.3,
		};
	});
}
