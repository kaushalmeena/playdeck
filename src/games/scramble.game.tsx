import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { pick, sfx, shuffle, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Word Jumble",
	emoji: "📝",
	desc: "Unscramble the letters before the clock melts.",
	order: 21,
	accent: "#d637a4",
	instructions:
		"The letters are scrambled — tap the real word among the decoys. Words get longer with your level.",
};

const WORDS: Record<number, Array<string>> = {
	4: [
		"GAME",
		"STAR",
		"MOON",
		"FIRE",
		"SNOW",
		"JUMP",
		"BLUE",
		"FISH",
		"ROCK",
		"WIND",
	],
	5: [
		"APPLE",
		"BRAIN",
		"CLOUD",
		"DANCE",
		"EARTH",
		"FLAME",
		"GHOST",
		"HEART",
		"LIGHT",
		"MUSIC",
	],
	6: [
		"ROCKET",
		"PLANET",
		"GARDEN",
		"SILVER",
		"WINTER",
		"ORANGE",
		"FRIEND",
		"CASTLE",
		"BRIDGE",
		"JUNGLE",
	],
	7: [
		"DIAMOND",
		"THUNDER",
		"RAINBOW",
		"MYSTERY",
		"CRYSTAL",
		"JOURNEY",
		"VOLCANO",
		"PENGUIN",
	],
};

const ROUNDS = 4;

type Round = { scrambled: string; options: Array<string>; word: string };

function genRound(len: number): Round {
	const list = WORDS[len];
	const word = pick(list);
	let scrambled = word;
	for (let i = 0; i < 10 && scrambled === word; i++) {
		scrambled = shuffle(word.split("")).join("");
	}
	const options = shuffle([
		word,
		...shuffle(list.filter((w) => w !== word)).slice(0, 3),
	]);
	return { scrambled, options, word };
}

export default function WordJumble({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const len = 4 + Math.min(Math.floor(level / 2), 3);
	const total = ROUNDS * Math.max(8 - level * 0.3, 4);
	const timeLeft = useCountdown(playing, total);

	const [round, setRound] = useState<Round>(() => genRound(len));
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(false, done.current * 15, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setRound(genRound(len));
		begin();
	};

	const answer = (w: string) => {
		if (!playing) return;
		if (w !== round.word) {
			finish(false, done.current * 15, `It was ${round.word}`);
			return;
		}
		sfx.good();
		done.current += 1;
		setDoneCount(done.current);
		if (done.current >= ROUNDS) {
			finish(true, ROUNDS * 15 + Math.ceil(timeLeft) * 2);
			return;
		}
		setRound(genRound(len));
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
			chips={[`${doneCount}/${ROUNDS}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-9 px-6">
				<div className="text-4xl font-black tracking-[0.35em] text-accent2">
					{round.scrambled}
				</div>
				<div className="grid w-full max-w-sm grid-cols-2 gap-3">
					{round.options.map((w) => (
						<button
							key={w}
							type="button"
							onPointerDown={() => answer(w)}
							className="rounded-2xl border border-line bg-card py-4 text-lg font-extrabold tracking-widest"
						>
							{w}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
