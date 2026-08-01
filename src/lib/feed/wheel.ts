/**
 * Turns a stream of wheel events into discrete page steps.
 *
 * Trackpads keep emitting inertial "momentum" events for up to a second
 * after the user's fingers leave the pad. Two naive approaches both fail:
 * a one-page-per-gesture latch never releases during that tail (the feed
 * goes dead), and a plain time cooldown lets the tail itself page.
 *
 * So the pager arms on *intent* instead of on time:
 *
 *  - a gesture arms when input starts after a quiet gap, or when the delta
 *    accelerates sharply — inertia only ever decays, so a jump in force
 *    means the user pushed again
 *  - once armed, delta accumulates and pages at `threshold`, then disarms
 *  - as a safety net, sustained above-floor input re-arms every
 *    `sustainRearm` ms so continuous scrolling can never stall
 *
 * Pure and time-injected — see wheel.test.ts.
 */
export type PagerOptions = {
	/** accumulated |delta| needed to page once */
	threshold: number;
	/** quiet period that starts a fresh gesture (ms) */
	idleReset: number;
	/** smallest |delta| that may count as a new flick */
	flickDelta: number;
	/** |delta| must exceed the previous one by this factor to count as a push */
	accelRatio: number;
	/** re-arm after this long of sustained input (ms) */
	sustainRearm: number;
	/** sustained input below this |delta| is treated as inertia, never re-arms */
	sustainFloor: number;
};

export const DEFAULT_PAGER: PagerOptions = {
	threshold: 60,
	idleReset: 200,
	flickDelta: 25,
	accelRatio: 1.5,
	sustainRearm: 600,
	sustainFloor: 12,
};

/** -1 = page up, 1 = page down, 0 = no step */
export type Step = -1 | 0 | 1;

export class WheelPager {
	private acc = 0;
	private armed = true;
	private lastAt = Number.NEGATIVE_INFINITY;
	private lastMag = 0;
	private pagedAt = Number.NEGATIVE_INFINITY;

	constructor(private readonly opts: PagerOptions = DEFAULT_PAGER) {}

	feed(delta: number, now: number): Step {
		const mag = Math.abs(delta);

		// a quiet gap always means a brand new gesture
		if (now - this.lastAt > this.opts.idleReset) {
			this.acc = 0;
			this.lastMag = 0;
			this.armed = true;
		}

		// inertia decays; a sharp jump in force is the user pushing again
		const pushedAgain =
			mag >= this.opts.flickDelta && mag > this.lastMag * this.opts.accelRatio;

		// escape hatch: never stall under long, steady input
		const stalled =
			mag >= this.opts.sustainFloor &&
			now - this.pagedAt > this.opts.sustainRearm;

		if (pushedAgain || stalled) this.armed = true;

		this.lastAt = now;
		this.lastMag = mag;

		if (!this.armed) return 0;

		this.acc += delta;
		if (Math.abs(this.acc) < this.opts.threshold) return 0;

		const dir: Step = this.acc > 0 ? 1 : -1;
		this.acc = 0;
		this.armed = false;
		this.pagedAt = now;
		return dir;
	}

	reset() {
		this.acc = 0;
		this.armed = true;
		this.lastAt = Number.NEGATIVE_INFINITY;
		this.lastMag = 0;
		this.pagedAt = Number.NEGATIVE_INFINITY;
	}
}
