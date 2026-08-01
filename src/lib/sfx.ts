/** Tiny WebAudio sound effects + haptics — no assets, safe everywhere. */

let ac: AudioContext | null = null;

function blip(
	freq: number,
	dur: number,
	type: OscillatorType = "square",
	gain = 0.07,
	delay = 0,
) {
	try {
		ac = ac ?? new AudioContext();
		const t0 = ac.currentTime + delay;
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.type = type;
		o.frequency.value = freq;
		g.gain.setValueAtTime(gain, t0);
		g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
		o.connect(g);
		g.connect(ac.destination);
		o.start(t0);
		o.stop(t0 + dur);
	} catch {
		// audio blocked — stay silent
	}
}

function buzz(pattern: number | Array<number>) {
	try {
		navigator.vibrate?.(pattern);
	} catch {
		// no haptics
	}
}

export const sfx = {
	tap() {
		blip(620, 0.05, "square", 0.04);
	},
	win() {
		[523, 659, 784, 1047].forEach((f, i) =>
			blip(f, 0.14, "triangle", 0.09, i * 0.09),
		);
		buzz([25, 40, 25]);
	},
	lose() {
		[392, 311, 233].forEach((f, i) =>
			blip(f, 0.18, "sawtooth", 0.05, i * 0.13),
		);
		buzz(60);
	},
	levelUp() {
		[523, 784, 1047, 1319, 1568].forEach((f, i) =>
			blip(f, 0.16, "triangle", 0.09, i * 0.08),
		);
		buzz([30, 50, 30, 50, 60]);
	},
	daily() {
		[659, 784, 988, 1319, 1568, 2093].forEach((f, i) =>
			blip(f, 0.18, "triangle", 0.09, i * 0.1),
		);
		buzz([40, 60, 40, 60, 100]);
	},
};
