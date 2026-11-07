/**
 * The stage backdrop behind every game, tinted with the game's accent so
 * each card has its own identity while you scroll — and still themed, since
 * the tint is mixed into the theme's own stage and background tokens.
 */
export function stageFor(accent?: string): string {
	if (!accent) {
		return "radial-gradient(120% 80% at 50% -10%, var(--t-stage) 0%, var(--t-bg) 60%)";
	}
	return [
		`radial-gradient(90% 55% at 50% 108%, color-mix(in srgb, ${accent} 26%, transparent) 0%, transparent 70%)`,
		`radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, ${accent} 34%, var(--t-stage)) 0%, var(--t-bg) 62%)`,
	].join(", ");
}
