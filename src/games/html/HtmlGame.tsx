import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GameChrome } from "../../components/game/GameChrome";
import { juice } from "../../lib/juice";
import { useTheme } from "../../lib/theme";
import type { GameMeta, GameProps } from "../kit";
import { sfx, themeColor, useRun } from "../kit";
import type { GameMessage, HostPayload, Theme } from "./bridge";
import { HOST_TAG, injectSdk, readGameMessage } from "./bridge";

const TOKENS = [
	"bg",
	"surface",
	"card",
	"line",
	"text",
	"muted",
	"accent",
	"accent2",
	"danger",
	"good",
	"stage",
] as const;

const readTheme = (): Theme =>
	Object.fromEntries(TOKENS.map((t) => [t, themeColor(t)]));

/** the in-game sounds a frame may trigger — never the chrome or outcome cues */
const GAME_SFX: Record<string, (arg?: number) => void> = {
	good: sfx.good,
	bad: sfx.bad,
	step: sfx.step,
	pop: sfx.pop,
	hit: sfx.hit,
	boom: sfx.boom,
	bounce: sfx.bounce,
	collect: sfx.collect,
	flap: sfx.flap,
	merge: (v) => sfx.merge(v ?? 2),
};

type Hud = { chips?: Array<string>; progress?: number };

type Props = GameProps & { meta: GameMeta; html: string };

/**
 * Hosts a plug-and-play HTML game: a sandboxed iframe under the shared
 * chrome. The frame owns gameplay; the feed keeps the run lifecycle, the
 * overlay, scoring and sound — so an HTML game looks and scores exactly like
 * a React one.
 */
function HtmlGame({
	meta,
	html,
	level,
	active,
	onEnd,
	onPlayingChange,
	onNext,
}: Props) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { theme } = useTheme();
	const frame = useRef<HTMLIFrameElement>(null);
	const ready = useRef(false);
	const pendingStart = useRef(false);
	const playingRef = useRef(false);
	playingRef.current = playing;
	const [hud, setHud] = useState<Hud>({});

	const srcDoc = useMemo(() => injectSdk(html), [html]);

	const post = useCallback((message: HostPayload) => {
		frame.current?.contentWindow?.postMessage(
			{ ...message, source: HOST_TAG },
			"*",
		);
	}, []);

	const sendStart = useCallback(() => {
		post({ type: "start", level, theme: readTheme() });
		frame.current?.focus();
	}, [post, level]);

	const handleMessage = useCallback(
		(message: GameMessage) => {
			switch (message.type) {
				case "ready":
					ready.current = true;
					post({ type: "theme", theme: readTheme() });
					if (pendingStart.current) {
						pendingStart.current = false;
						sendStart();
					}
					break;
				case "end":
					// exactly one result per run, and only while one is live
					if (playingRef.current) {
						playingRef.current = false;
						finish(message.won, message.score, message.note);
					}
					break;
				case "hud":
					if (playingRef.current) setHud(message);
					break;
				case "sfx":
					if (playingRef.current) GAME_SFX[message.name]?.(message.arg);
					break;
				case "tone":
					// through the app's audio, so the mute toggle applies
					if (playingRef.current) sfx.note(message.freq, message.dur);
					break;
				case "pop":
				case "burst": {
					if (!playingRef.current) break;
					// frame coordinates → viewport coordinates for the juice bus
					const rect = frame.current?.getBoundingClientRect();
					const x = message.x + (rect?.left ?? 0);
					const y = message.y + (rect?.top ?? 0);
					if (message.type === "pop")
						juice.pop(x, y, message.text, message.color);
					else juice.burst(x, y, message.color, message.count);
					break;
				}
				case "shake":
					if (playingRef.current) juice.shake(message.strength);
					break;
				case "flash":
					if (playingRef.current) juice.flash(message.color);
					break;
				default:
					break;
			}
		},
		[post, sendStart, finish],
	);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			// only this card's frame — every HTML card listens on the same window
			if (!frame.current || e.source !== frame.current.contentWindow) return;
			const message = readGameMessage(e.data);
			if (message) handleMessage(message);
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [handleMessage]);

	// keep the frame's colours in step with the app theme
	useEffect(() => {
		if (ready.current) post({ type: "theme", theme: readTheme() });
	}, [theme, post]);

	const stop = useCallback(() => {
		pendingStart.current = false;
		post({ type: "stop" });
		cancel();
	}, [post, cancel]);

	useEffect(() => {
		if (!active && playing) stop();
	}, [active, playing, stop]);

	const handlePlay = () => {
		setHud({});
		begin();
		if (ready.current) sendStart();
		else pendingStart.current = true;
	};

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={hud.chips}
			progress={hud.progress}
			onPlay={handlePlay}
			onNext={onNext}
			onQuit={stop}
			onPlayingChange={onPlayingChange}
		>
			<iframe
				ref={frame}
				title={meta.title}
				srcDoc={srcDoc}
				// scripts only: no same-origin, so the game cannot reach the
				// app's storage, cookies or DOM
				sandbox="allow-scripts"
				className="absolute inset-0 size-full border-0 bg-transparent"
				style={{ pointerEvents: playing ? "auto" : "none" }}
			/>
		</GameChrome>
	);
}

/** bind an HTML source to a component with the standard game props */
export function createHtmlGame(
	meta: GameMeta,
	html: string,
): ComponentType<GameProps> {
	function BoundHtmlGame(props: GameProps) {
		return <HtmlGame {...props} meta={meta} html={html} />;
	}
	BoundHtmlGame.displayName = `HtmlGame(${meta.title})`;
	return BoundHtmlGame;
}
