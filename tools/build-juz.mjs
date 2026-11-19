// Builds Juz, Hizb, and Madani Mushaf page metadata.
// Boundary source: https://tanzil.net/res/text/metadata/quran-data.js
// Source license: Creative Commons Attribution 3.0 (header in the downloaded file).
// Quran text and translations are read from the repository's existing SEO data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const source = path.join(here, ".cache", "quran-data.js");
const out = path.join(repo, "seo-data", "juz");
const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const counts = new Map();
for (const row of rows) counts.set(Number(row.surah), Math.max(counts.get(Number(row.surah)) || 0, Number(row.ayah)));

const sourceText = fs.readFileSync(source, "utf8");
function startsFor(name) {
  const match = sourceText.match(new RegExp(`QuranData\\.${name}\\s*=\\s*\\[([\\s\\S]*?)\\n\\];`));
  if (!match) throw new Error(`Missing ${name} in Tanzil metadata`);
  return [...match[1].matchAll(/\[\s*(\d+)\s*,\s*(\d+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

function key(s, a) { return `${s}:${a}`; }
function nextRef(s, a) {
  const n = counts.get(s);
  return a < n ? [s, a + 1] : [s + 1, 1];
}
function previousRef(s, a) {
  if (s === 115) return [114, counts.get(114)];
  if (a > 1) return [s, a - 1];
  return [s - 1, counts.get(s - 1)];
}
function compare(a, b) { return a[0] - b[0] || a[1] - b[1]; }
function segment(start, end) {
  const refs = [];
  let cur = start;
  while (compare(cur, end) <= 0) {
    refs.push(key(cur[0], cur[1]));
    cur = nextRef(cur[0], cur[1]);
  }
  const surahs = [...new Set(refs.map((r) => Number(r.split(":")[0])))];
  const first = rows.find((r) => Number(r.surah) === start[0] && Number(r.ayah) === start[1]);
  const name = first ? first.text_ar.split(/\s+/).slice(0, 4).join(" ") : "";
  return { start: key(...start), end: key(...end), count: refs.length, surahs, name, refs };
}
function makeSegments(starts, expected, label) {
  if (starts.length !== expected + 1) throw new Error(`${label}: expected ${expected + 1} boundaries, got ${starts.length}`);
  return starts.slice(0, -1).map((start, i) => {
    const end = previousRef(...starts[i + 1]);
    return segment(start, end);
  });
}

const juz = makeSegments(startsFor("Juz"), 30, "Juz");
const quarters = startsFor("HizbQaurter");
const hizb = Array.from({ length: 60 }, (_, i) => {
  const start = quarters[1 + i * 4];
  const endBoundary = quarters[Math.min(1 + (i + 1) * 4, quarters.length - 1)];
  const end = previousRef(...endBoundary);
  return segment(start, end);
});
const page = makeSegments(startsFor("Page"), 604, "Page");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const writeLines = (name, values) => fs.writeFileSync(path.join(out, name), values.map((v) => JSON.stringify(v)).join("\n") + "\n");
writeLines("juz.txt", juz);
writeLines("hizb.txt", hizb);
writeLines("page.txt", page);
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify({
  source: "Tanzil Quran Metadata, CC BY 3.0",
  sourceUrl: "https://tanzil.net/res/text/metadata/quran-data.js",
  counts: { juz: juz.length, hizb: hizb.length, page: page.length },
}));
console.log(`juz=${juz.length} hizb=${hizb.length} page=${page.length}`);
