// Builds Tanzil English transliteration line files for the SEO transliteration pages.
//
// Source: https://tanzil.net/trans/?transID=en.transliteration&type=txt
// License/terms: Tanzil's translation terms permit non-commercial website use and
// require a link back to https://tanzil.net/trans/ when used in a website/application.
// The raw download is kept in tools/.cache/ (gitignored), not in the repository.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const cacheFile = path.join(here, ".cache", "en.transliteration.txt");
const outDir = path.join(repo, "seo-data", "translit");
const sourceUrl = "https://tanzil.net/trans/?transID=en.transliteration&type=txt";

fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size < 1000) {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Tanzil download failed: HTTP ${response.status}`);
  fs.writeFileSync(cacheFile, Buffer.from(await response.arrayBuffer()));
}

const raw = fs.readFileSync(cacheFile, "utf8").replace(/^\uFEFF/, "");
const sourceLines = raw.split(/\r?\n/);
const ayahs = sourceLines.slice(0, 6236);
if (ayahs.length !== 6236 || ayahs.some((line) => !line.trim())) {
  throw new Error(`Expected 6236 non-empty ayah lines, got ${ayahs.length}`);
}
const clean = (line) => line.replace(/<[^>]+>/g, "").replace(/[ \t]+/g, " ").trim();
const translit = ayahs.map(clean);

const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const counts = new Map();
for (const row of rows) counts.set(Number(row.surah), Math.max(counts.get(Number(row.surah)) || 0, Number(row.ayah)));
if (counts.size !== 114 || [...counts.values()].reduce((a, b) => a + b, 0) !== translit.length) {
  throw new Error("Quran source ayah counts do not match the 6236-line transliteration source");
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let offset = 0;
for (let s = 1; s <= 114; s++) {
  const count = counts.get(s);
  const lines = translit.slice(offset, offset + count).map((line) => JSON.stringify(line));
  if (lines.length !== count) throw new Error(`Surah ${s}: expected ${count}, got ${lines.length}`);
  fs.writeFileSync(path.join(outDir, `${s}.txt`), `${lines.join("\n")}\n`);
  offset += count;
}
console.log(`wrote ${outDir}: 114 files, ${offset} ayahs`);
