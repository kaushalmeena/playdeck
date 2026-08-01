import { sfx } from "../../lib/sfx";
import { Chip } from "./Chip";

type Props = {
	level: number;
	chips?: Array<string>;
	onQuit?: () => void;
};

/** in-run HUD: level, per-game stats and the quit button */
export function GameTopBar({ level, chips, onQuit }: Props) {
	return (
		<>
			<div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center gap-2">
				<Chip>LV {level}</Chip>
				{chips?.map((chip) => (
					<Chip key={chip}>{chip}</Chip>
				))}
			</div>

			{onQuit && (
				<button
					type="button"
					aria-label="Quit game"
					onClick={(e) => {
						e.currentTarget.blur();
						sfx.quit();
						onQuit();
					}}
					className="absolute top-16 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card/85 text-sm text-muted backdrop-blur-md"
				>
					✕
				</button>
			)}
		</>
	);
}
