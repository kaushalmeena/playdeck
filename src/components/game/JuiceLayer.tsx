import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import type { JuiceEvent, Particle } from "../../lib/juice";
import { burstParticles, juice } from "../../lib/juice";

type Props = {
	/** subscribe only while this game's run is live */
	live: boolean;
	accent: string;
	/** the element to shake */
	stageRef: RefObject<HTMLDivElement | null>;
};

type Effect =
	| {
			id: number;
			kind: "pop";
			x: number;
			y: number;
			text: string;
			color: string;
	  }
	| {
			id: number;
			kind: "burst";
			x: number;
			y: number;
			color: string;
			particles: Array<Particle>;
	  }
	| { id: number; kind: "flash"; color: string }
	| { id: number; kind: "callout"; text: string; color: string };

/** how long each effect stays mounted, in ms — a touch longer than its animation */
const LIFETIME: Record<Effect["kind"], number> = {
	pop: 800,
	burst: 800,
	flash: 260,
	callout: 1100,
};

const MAX_EFFECTS = 40;

const reducedMotion = () =>
	typeof matchMedia !== "undefined" &&
	matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Renders the juice bus for one game stage: particle bursts, floating text,
 * flashes, streak callouts and screen shake. Pure presentation — what to
 * show and when is decided in `lib/juice` and `lib/autojuice`.
 */
export function JuiceLayer({ live, accent, stageRef }: Props) {
	const layer = useRef<HTMLDivElement>(null);
	const [effects, setEffects] = useState<Array<Effect>>([]);
	const nextId = useRef(0);

	useEffect(() => {
		if (!live) return;
		const timers = new Set<ReturnType<typeof setTimeout>>();
		const calm = reducedMotion();

		const add = (effect: Effect) => {
			setEffects((list) => [...list.slice(-(MAX_EFFECTS - 1)), effect]);
			const t = setTimeout(() => {
				timers.delete(t);
				setEffects((list) => list.filter((e) => e.id !== effect.id));
			}, LIFETIME[effect.kind]);
			timers.add(t);
		};

		const local = (x: number, y: number) => {
			const rect = layer.current?.getBoundingClientRect();
			return rect ? { x: x - rect.left, y: y - rect.top } : { x, y };
		};

		const off = juice.subscribe((event: JuiceEvent) => {
			nextId.current += 1;
			const id = nextId.current;
			switch (event.kind) {
				case "pop":
					add({
						id,
						kind: "pop",
						...local(event.x, event.y),
						text: event.text,
						color: event.color ?? accent,
					});
					break;
				case "burst":
					if (calm) break;
					add({
						id,
						kind: "burst",
						...local(event.x, event.y),
						color: event.color ?? accent,
						particles: burstParticles(event.count ?? 12),
					});
					break;
				case "flash":
					add({ id, kind: "flash", color: event.color ?? accent });
					break;
				case "callout":
					add({
						id,
						kind: "callout",
						text: event.text,
						color: event.color ?? accent,
					});
					break;
				case "shake": {
					if (calm) break;
					const px = 3 + event.strength * 3;
					stageRef.current?.animate(
						[
							{ transform: "translate(0, 0)" },
							{ transform: `translate(${-px}px, ${px / 2}px)` },
							{ transform: `translate(${px}px, ${-px / 2}px)` },
							{ transform: `translate(${-px / 2}px, ${-px}px)` },
							{ transform: "translate(0, 0)" },
						],
						{ duration: 180 + event.strength * 60, easing: "ease-out" },
					);
					break;
				}
			}
		});

		return () => {
			off();
			for (const t of timers) clearTimeout(t);
			setEffects([]);
		};
	}, [live, accent, stageRef]);

	return (
		<div
			ref={layer}
			className="pointer-events-none absolute inset-0 z-15 overflow-hidden"
		>
			{effects.map((effect) => (
				<EffectView key={effect.id} effect={effect} />
			))}
		</div>
	);
}

function EffectView({ effect }: { effect: Effect }) {
	switch (effect.kind) {
		case "pop":
			return (
				<span
					className="juice-pop absolute text-xl font-black"
					style={{ left: effect.x, top: effect.y, color: effect.color }}
				>
					{effect.text}
				</span>
			);
		case "burst":
			return (
				<span className="absolute" style={{ left: effect.x, top: effect.y }}>
					{effect.particles.map((p, i) => (
						<ParticleDot key={i} particle={p} color={effect.color} />
					))}
				</span>
			);
		case "flash":
			return (
				<span
					className="juice-flash absolute inset-0"
					style={{ background: effect.color }}
				/>
			);
		case "callout":
			return (
				<span
					className="juice-callout absolute top-1/3 left-1/2 text-4xl font-black tracking-widest whitespace-nowrap"
					style={{
						color: effect.color,
						textShadow: `0 0 24px ${effect.color}`,
					}}
				>
					{effect.text}
				</span>
			);
	}
}

function ParticleDot({
	particle,
	color,
}: {
	particle: Particle;
	color: string;
}) {
	const style = {
		width: particle.size,
		height: particle.size,
		background: color,
		boxShadow: `0 0 8px ${color}`,
		"--dx": `${particle.dx}px`,
		"--dy": `${particle.dy}px`,
		animationDuration: `${particle.dur}s`,
	} as CSSProperties;
	return (
		<span className="juice-particle absolute rounded-full" style={style} />
	);
}
