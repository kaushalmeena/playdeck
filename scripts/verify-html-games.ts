/**
 * Sanity-check plug-and-play HTML games without a full build:
 * meta tags parse, every inline <script> is valid JS, and the game calls
 * the SDK basics. Run: node scripts/verify-html-games.ts [files…]
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { parseHtmlMeta } from "../src/games/html/meta.ts";

const dir = "src/games";
const files = process.argv.slice(2).length
	? process.argv.slice(2)
	: readdirSync(dir)
			.filter((f) => f.endsWith(".game.html") && !f.startsWith("_"))
			.map((f) => join(dir, f));

const tmp = mkdtempSync(join(tmpdir(), "pd-verify-"));
let failed = 0;

for (const file of files) {
	const html = readFileSync(file, "utf8");
	const problems: Array<string> = [];
	try {
		const meta = parseHtmlMeta(html, file);
		if (!meta.desc) problems.push("missing playdeck:desc");
		if (meta.order === 999) problems.push("missing playdeck:order");
	} catch (e) {
		problems.push((e as Error).message);
	}
	const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
		(m) => m[1],
	);
	scripts.forEach((src, i) => {
		const out = join(tmp, `${basename(file)}.${i}.js`);
		writeFileSync(out, src);
		try {
			execFileSync(process.execPath, ["--check", out], { stdio: "pipe" });
		} catch (e) {
			problems.push(
				`script ${i}: ${String((e as { stderr?: Buffer }).stderr ?? e)
					.split("\n")
					.slice(0, 4)
					.join(" ")}`,
			);
		}
	});
	const code = scripts.join("\n");
	for (const call of ["playdeck.onStart", "playdeck.onStop", "playdeck.end"]) {
		if (!code.includes(call)) problems.push(`never calls ${call}`);
	}
	if (/localStorage|sessionStorage|fetch\(|XMLHttpRequest/.test(code)) {
		problems.push("uses storage or network (unavailable in the sandbox)");
	}
	if (problems.length) {
		failed += 1;
		console.log(`✗ ${file}\n  - ${problems.join("\n  - ")}`);
	} else console.log(`✓ ${file}`);
}

process.exit(failed ? 1 : 0);
