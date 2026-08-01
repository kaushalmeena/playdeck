import { useId } from "react";

/** d-pad body: long arms spanning 64–448 on both axes, 152 thick */
const BODY =
	"M204 64h104a24 24 0 0 1 24 24v92h92a24 24 0 0 1 24 24v104a24 24 0 0 1-24 24h-92v92a24 24 0 0 1-24 24H204a24 24 0 0 1-24-24v-92H88a24 24 0 0 1-24-24V204a24 24 0 0 1 24-24h92V88a24 24 0 0 1 24-24z";

/** the four direction arrows, cut out near the arm tips */
const ARROWS = [
	"M256 104l34 56h-68z",
	"M256 408l-34-56h68z",
	"M104 256l56-34v68z",
	"M408 256l-56-34v68z",
];

/**
 * The Playdeck mark, drawn as paths rather than an emoji so it looks the
 * same on every platform. The arrows and hub are masked out instead of filled
 * with a background colour, so the mark sits on any surface.
 *
 * `public/icon.svg` is the same artwork on a dark tile, for the favicon and
 * the installed app.
 */
export function Logo({
	size = 20,
	className,
}: {
	size?: number;
	className?: string;
}) {
	const id = useId();
	const gradient = `${id}-gradient`;
	const cutout = `${id}-cutout`;

	return (
		<svg
			width={size}
			height={size}
			viewBox="56 56 400 400"
			className={className}
			role="img"
			aria-label="Playdeck"
		>
			<defs>
				<linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#7c5cff" />
					<stop offset="1" stopColor="#00e5ff" />
				</linearGradient>
				<mask id={cutout}>
					<path d={BODY} fill="#fff" />
					{ARROWS.map((d) => (
						<path key={d} d={d} fill="#000" />
					))}
					<circle cx="256" cy="256" r="40" fill="#000" />
				</mask>
			</defs>
			<rect
				x="56"
				y="56"
				width="400"
				height="400"
				fill={`url(#${gradient})`}
				mask={`url(#${cutout})`}
			/>
		</svg>
	);
}
