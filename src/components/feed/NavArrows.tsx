type Props = {
	onPage: (dir: number) => void;
};

export function NavArrows({ onPage }: Props) {
	return (
		<div className="absolute top-1/2 right-3 z-40 flex -translate-y-1/2 flex-col gap-2">
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
						onPage(dir);
					}}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md"
				>
					{glyph}
				</button>
			))}
		</div>
	);
}
