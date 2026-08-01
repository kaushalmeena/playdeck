import confetti from "canvas-confetti";

const COLORS = ["#7c5cff", "#00e5ff", "#ff5cd0", "#3dffa0", "#ffd24d"];

export function celebrateLevelUp() {
	confetti({
		particleCount: 90,
		spread: 75,
		startVelocity: 38,
		origin: { y: 0.22 },
		colors: COLORS,
		disableForReducedMotion: true,
	});
}

export function celebrateDaily() {
	for (const x of [0.2, 0.8]) {
		confetti({
			particleCount: 140,
			spread: 100,
			startVelocity: 45,
			origin: { x, y: 0.3 },
			colors: COLORS,
			disableForReducedMotion: true,
		});
	}
}
