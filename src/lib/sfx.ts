import { useSyncExternalStore } from "react";

/**
 * Tiny WebAudio sound effects + haptics — no assets, nothing to download.
 *
 * Every sound is a short synthesized blip or frequency sweep, so the whole
 * palette costs a few hundred bytes instead of a folder of samples. Sounds
 * only ever fire from a user gesture, which is what keeps the browser's
 * autoplay policy happy.
 */

const KEY = "pd_sound";

let enabled: boolean | null = null;
const listeners = new Set<() => void>();

function soundOn(): boolean {
	if (enabled === null) {
		try {
			enabled = localStorage.getItem(KEY) !== "off";
		} catch {
			enabled = true;
		}
	}
	return enabled;
}

/** Mute preference, shared with the header toggle. */
export function useSoundPref() {
	const on = useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		soundOn,
		() => true,
	);

	const toggle = () => {
		enabled = !soundOn();
		try {
			localStorage.setItem(KEY, enabled ? "on" : "off");
		} catch {
			// private mode — the choice just won't persist
		}
		for (const l of listeners) l();
		if (enabled) sfx.toggle(true);
	};

	return { on, toggle };
}

let ac: AudioContext | null = null;

/** shared context, resumed lazily — the first call is always inside a gesture */
function ctx(): AudioContext | null {
	if (!soundOn()) return null;
	try {
		ac ??= new AudioContext();
		if (ac.state === "suspended") void ac.resume();
		return ac;
	} catch {
		return null;
	}
}

type Tone = {
	/** starting frequency in Hz */
	freq: number;
	/** length in seconds */
	dur: number;
	/** slide to this frequency across the note */
	to?: number;
	type?: OscillatorType;
	gain?: number;
	/** seconds to wait before playing */
	delay?: number;
};

function play({
	freq,
	dur,
	to,
	type = "square",
	gain = 0.06,
	delay = 0,
}: Tone) {
	const audio = ctx();
	if (!audio) return;
	try {
		const t0 = audio.currentTime + delay;
		const osc = audio.createOscillator();
		const amp = audio.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t0);
		if (to !== undefined) {
			osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
		}
		amp.gain.setValueAtTime(gain, t0);
		amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		osc.connect(amp);
		amp.connect(audio.destination);
		osc.start(t0);
		osc.stop(t0 + dur);
	} catch {
		// audio unavailable — stay silent
	}
}

/** play a run of notes as an arpeggio */
function melody(freqs: Array<number>, tone: Omit<Tone, "freq">, step: number) {
	freqs.forEach((freq, i) => {
		play({ ...tone, freq, delay: (tone.delay ?? 0) + i * step });
	});
}

function buzz(pattern: number | Array<number>) {
	if (!soundOn()) return;
	try {
		navigator.vibrate?.(pattern);
	} catch {
		// no haptics on this device
	}
}

export const sfx = {
	// ---- interface ----
	/** any chrome button or link */
	press() {
		play({ freq: 520, dur: 0.03, type: "square", gain: 0.025 });
	},
	/** a switch turning on or off (favourite, theme, sound) */
	toggle(on: boolean) {
		play({
			freq: on ? 620 : 520,
			to: on ? 900 : 380,
			dur: 0.08,
			type: "triangle",
			gain: 0.05,
		});
		buzz(12);
	},
	/** paging the feed */
	swipe(dir: number) {
		play({
			freq: dir > 0 ? 340 : 700,
			to: dir > 0 ? 780 : 320,
			dur: 0.1,
			type: "sine",
			gain: 0.035,
		});
	},
	/** a run begins */
	start() {
		melody([523, 784], { dur: 0.09, type: "triangle", gain: 0.06 }, 0.07);
		buzz(15);
	},
	/** a run is abandoned */
	quit() {
		melody([420, 300], { dur: 0.1, type: "triangle", gain: 0.045 }, 0.07);
	},

	// ---- in-game actions ----
	/** a right answer, a matched pair, a cleared wave */
	good() {
		melody([880, 1245], { dur: 0.07, type: "triangle", gain: 0.055 }, 0.055);
		buzz(12);
	},
	/** a wrong answer or a fumble that does not end the run */
	bad() {
		melody([260, 190], { dur: 0.13, type: "sawtooth", gain: 0.04 }, 0.08);
		buzz(35);
	},
	/** a light positional move: tile flip, lane change, grid step */
	step() {
		play({ freq: 440, dur: 0.025, type: "square", gain: 0.03 });
	},
	/** bubble pop */
	pop() {
		play({ freq: 900, to: 320, dur: 0.07, type: "sine", gain: 0.05 });
		buzz(10);
	},
	/** landing a hit on a target */
	hit() {
		play({ freq: 320, to: 140, dur: 0.06, type: "square", gain: 0.055 });
		buzz(14);
	},
	/** something exploded */
	boom() {
		play({ freq: 160, to: 50, dur: 0.28, type: "sawtooth", gain: 0.07 });
		buzz([50, 30, 60]);
	},
	/** ball or paddle bounce */
	bounce() {
		play({ freq: 560, dur: 0.035, type: "square", gain: 0.04 });
	},
	/** snake eating an orb, basket catching a star */
	collect() {
		play({ freq: 660, to: 1050, dur: 0.07, type: "triangle", gain: 0.05 });
		buzz(10);
	},
	/** thrust or jump */
	flap() {
		play({ freq: 190, to: 420, dur: 0.06, type: "triangle", gain: 0.045 });
	},
	/** two tiles combining — pitch rises with the resulting value */
	merge(value: number) {
		const steps = Math.min(Math.log2(Math.max(value, 2)) - 1, 9);
		play({
			freq: 300 + steps * 90,
			to: 420 + steps * 120,
			dur: 0.09,
			type: "triangle",
			gain: 0.055,
		});
		buzz(12);
	},

	// ---- outcomes ----
	win() {
		melody(
			[523, 659, 784, 1047],
			{ dur: 0.14, type: "triangle", gain: 0.08 },
			0.09,
		);
		buzz([25, 40, 25]);
	},
	lose() {
		melody([392, 311, 233], { dur: 0.18, type: "sawtooth", gain: 0.05 }, 0.13);
		buzz(60);
	},
	levelUp() {
		melody(
			[523, 784, 1047, 1319, 1568],
			{ dur: 0.16, type: "triangle", gain: 0.08 },
			0.08,
		);
		buzz([30, 50, 30, 50, 60]);
	},
	daily() {
		melody(
			[659, 784, 988, 1319, 1568, 2093],
			{ dur: 0.18, type: "triangle", gain: 0.08 },
			0.1,
		);
		buzz([40, 60, 40, 60, 100]);
	},
};
