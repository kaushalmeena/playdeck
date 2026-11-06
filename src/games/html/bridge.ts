/**
 * The postMessage protocol between the feed and a plug-and-play HTML game.
 *
 * An HTML game runs in a sandboxed iframe (`allow-scripts`, no same-origin),
 * so it cannot touch the app, its storage or its cookies. The only channel
 * is `postMessage`, and both sides tag their messages so stray traffic from
 * extensions or other frames is ignored.
 *
 * Inside the frame, games never see this protocol — they get `window.playdeck`
 * from the SDK below, which is injected ahead of the game's own scripts.
 */

export const HOST_TAG = "playdeck-host";
export const GAME_TAG = "playdeck-game";

/** feed → game */
export type HostMessage =
	| { source: typeof HOST_TAG; type: "start"; level: number; theme: Theme }
	| { source: typeof HOST_TAG; type: "stop" }
	| { source: typeof HOST_TAG; type: "theme"; theme: Theme };

export type Theme = Record<string, string>;

/** a host message before it is tagged — distributes over the union */
export type HostPayload = HostMessage extends infer M
	? M extends HostMessage
		? Omit<M, "source">
		: never
	: never;

const num = (v: unknown, fallback = 0) =>
	typeof v === "number" && Number.isFinite(v) ? v : fallback;
const str = (v: unknown, max = 40) =>
	typeof v === "string" ? v.slice(0, max) : undefined;

/** game → feed */
export type GameMessage =
	| { type: "ready" }
	| { type: "end"; won: boolean; score: number; note?: string }
	| { type: "hud"; chips?: Array<string>; progress?: number }
	| { type: "sfx"; name: string; arg?: number }
	| { type: "tone"; freq: number; dur: number }
	| { type: "pop"; x: number; y: number; text: string; color?: string }
	| { type: "burst"; x: number; y: number; color?: string; count?: number }
	| { type: "shake"; strength?: number }
	| { type: "flash"; color?: string };

/**
 * Validate an incoming message from a game frame. Everything from inside the
 * sandbox is untrusted, so each field is type-checked and clamped here rather
 * than at every use.
 */
export function readGameMessage(data: unknown): GameMessage | null {
	if (!data || typeof data !== "object") return null;
	const m = data as Record<string, unknown>;
	if (m.source !== GAME_TAG) return null;

	switch (m.type) {
		case "ready":
			return { type: "ready" };
		case "end":
			return {
				type: "end",
				won: m.won === true,
				score: Math.max(0, Math.round(num(m.score))),
				note: str(m.note),
			};
		case "hud":
			return {
				type: "hud",
				chips: Array.isArray(m.chips)
					? m.chips
							.slice(0, 3)
							.map((c) => String(c).slice(0, 24))
							.filter(Boolean)
					: undefined,
				progress:
					m.progress === undefined || m.progress === null
						? undefined
						: Math.min(Math.max(num(m.progress), 0), 1),
			};
		case "sfx": {
			const name = str(m.name, 16);
			return name ? { type: "sfx", name, arg: num(m.arg) } : null;
		}
		case "tone":
			return {
				type: "tone",
				freq: Math.min(Math.max(num(m.freq, 440), 40), 4000),
				dur: Math.min(Math.max(num(m.dur, 0.2), 0.02), 1.5),
			};
		case "pop":
			return {
				type: "pop",
				x: num(m.x),
				y: num(m.y),
				text: str(m.text, 16) ?? "",
				color: str(m.color, 32),
			};
		case "burst":
			return {
				type: "burst",
				x: num(m.x),
				y: num(m.y),
				color: str(m.color, 32),
				count: Math.min(Math.max(num(m.count, 14), 1), 40),
			};
		case "shake":
			return { type: "shake", strength: Math.min(num(m.strength, 1), 3) };
		case "flash":
			return { type: "flash", color: str(m.color, 32) };
		default:
			return null;
	}
}

/**
 * The in-frame SDK. Plain ES5-ish JS so it runs in any game without a build
 * step. Exposes:
 *
 *   playdeck.onStart(({ level }) => …)   a run begins — reset and go
 *   playdeck.onStop(() => …)             the player quit or scrolled away
 *   playdeck.end(won, score, note?)      report the run — once per run
 *   playdeck.hud({ chips, progress })    HUD chips and the 0..1 timer bar
 *   playdeck.sfx(name, arg?)             "good" "bad" "pop" "hit" "collect" …
 *   playdeck.tone(freq, dur)             a musical note (Hz, seconds)
 *   playdeck.pop(x, y, text, color?)     floating "+10" at a point
 *   playdeck.burst(x, y, color?, count?) particle burst at a point
 *   playdeck.shake(strength?)            screen shake (0..3)
 *   playdeck.flash(color?)               full-stage flash
 *   playdeck.level                       the current level
 *
 * Theme tokens arrive as CSS variables (`--t-bg`, `--t-accent`, …) on the
 * frame's root element, so `var(--t-text)` just works.
 */
export const SDK_SOURCE = `(function(){
var starts=[],stops=[],level=1,running=false;
function send(type,data){var m=data||{};m.source=${JSON.stringify(GAME_TAG)};m.type=type;parent.postMessage(m,"*");}
function theme(t){if(!t)return;var r=document.documentElement;for(var k in t)r.style.setProperty("--t-"+k,t[k]);}
addEventListener("message",function(e){
if(e.source!==parent)return;var m=e.data;if(!m||m.source!==${JSON.stringify(HOST_TAG)})return;
theme(m.theme);
if(m.type==="start"){level=m.level;running=true;starts.forEach(function(f){f({level:level});});}
if(m.type==="stop"){running=false;stops.forEach(function(f){f();});}
});
window.playdeck={
get level(){return level;},
get running(){return running;},
onStart:function(f){starts.push(f);},
onStop:function(f){stops.push(f);},
end:function(won,score,note){if(!running)return;running=false;send("end",{won:!!won,score:+score||0,note:note});},
hud:function(h){send("hud",{chips:h&&h.chips,progress:h&&h.progress});},
sfx:function(name,arg){send("sfx",{name:name,arg:arg});},
tone:function(freq,dur){send("tone",{freq:freq,dur:dur});},
pop:function(x,y,text,color){send("pop",{x:x,y:y,text:String(text),color:color});},
burst:function(x,y,color,count){send("burst",{x:x,y:y,color:color,count:count});},
shake:function(s){send("shake",{strength:s});},
flash:function(c){send("flash",{color:c});}
};
if(document.readyState==="complete")send("ready");else addEventListener("load",function(){send("ready");});
})();`;

/**
 * Must match the app's own `color-scheme` meta: when the frame's colour
 * scheme differs from its embedder's, browsers paint an opaque backdrop
 * behind it instead of letting the stage show through.
 */
const BASE_STYLE =
	'<meta name="color-scheme" content="dark light">' +
	"<style>html,body{margin:0;height:100%;overflow:hidden;background:transparent;color:var(--t-text,#eaeaf2);font-family:ui-sans-serif,system-ui,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;touch-action:none}</style>";

/**
 * Put the SDK (and a transparent, full-bleed base style) ahead of the
 * game's own scripts, so `window.playdeck` exists by the time they run.
 */
export function injectSdk(html: string): string {
	const prelude = `${BASE_STYLE}<script>${SDK_SOURCE}</script>`;
	// after <head>, else after <html>, else after the doctype — never before
	// the doctype, which would drop the frame into quirks mode
	for (const anchor of [
		/<head\b[^>]*>/i,
		/<html\b[^>]*>/i,
		/<!doctype[^>]*>/i,
	]) {
		const hit = anchor.exec(html);
		if (hit) {
			const at = hit.index + hit[0].length;
			return html.slice(0, at) + prelude + html.slice(at);
		}
	}
	return prelude + html;
}
