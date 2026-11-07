import { sfx } from "../../lib/sfx";

type Props = {
	onPage: (dir: number) => void;
};

export function NavArrows({ onPage }: Props) {
	return (
		<div // touch screens swipe; the arrows are for mouse and trackpad users
			className="absolute top-1/2 right-3 z-40 hidden -translate-y-1/2 flex-col gap-2 pointer-fine:flex"
		>
			{[
				{ dir: -1, glyph: "▲", label: "Previous game" },
				{ dir: 1, glyph: "▼", label: "Next game" },
			].map(({ dir, glyph, label }) => (
				<button
					key={label}
					type="button"
					aria-label={label}
					onClick={(e) => {
						e.currentTarget.blur();
						sfx.press();
						onPage(dir);
					}}
					className="flex size-10 items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md"
				>
					{glyph}
				</button>
			))}
		</div>
	);
}
