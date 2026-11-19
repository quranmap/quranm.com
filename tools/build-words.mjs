// Builds Quran root pages from Quranic Arabic Corpus morphology.
//
// Source: https://github.com/mustafa0x/quran-morphology (quran-morphology.txt),
// a maintained Arabic-script fork of Quranic Arabic Corpus Morphology v0.4.
// The original Quranic Arabic Corpus morphology data is GPL; attribution is
// displayed on every generated page. Raw source downloads belong in .cache/.
//
// Root slugs use an explicit, collision-free ASCII mapping: each Arabic root
// letter becomes its English letter-name (e.g. رحم -> rah-haa-miim), joined by
// hyphens. Diacritics are removed before mapping; unknown characters fail.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const cache = path.join(here, ".cache");
const morphFile = path.join(cache, "quran-morphology.txt");
const out = path.join(repo, "seo-data", "words");
const supported = ["en", "de", "tr", "ur", "id", "fr", "es", "ar"];
if (!fs.existsSync(morphFile)) throw new Error(`Missing ${morphFile}; download the source into tools/.cache/ first.`);

const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const wordData = JSON.parse(fs.readFileSync(path.join(repo, "quran_worddata_de_en_audio.json"), "utf8"));
const textByRef = new Map(rows.map((r) => [r.ref, r.text_ar]));
const translit = new Map(Object.entries({
  "ء": "hamza", "ا": "alif", "أ": "alif-hamza", "إ": "alif-hamza-below", "آ": "alif-madda", "ؤ": "waw-hamza", "ئ": "yaa-hamza",
  "ب": "ba", "ت": "ta", "ث": "tha", "ج": "jiim", "ح": "haa", "خ": "khaa", "د": "daal", "ذ": "dhaal", "ر": "ra", "ز": "zaay",
  "س": "siin", "ش": "shiin", "ص": "saad", "ض": "daad", "ط": "taa", "ظ": "thaa", "ع": "ayn", "غ": "ghayn", "ف": "fa",
  "ق": "qaaf", "ك": "kaaf", "ل": "laam", "م": "miim", "ن": "nuun", "ه": "ha", "و": "waaw", "ى": "alif-maqsura", "ي": "yaa",
}));
const stripMarks = (s) => String(s).normalize("NFC").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0671]/g, "");
function slugFor(root) {
  const parts = [...stripMarks(root)].map((c) => translit.get(c));
  if (parts.some((x) => !x)) throw new Error(`Unmapped root character in ${root}`);
  return parts.join("-");
}
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const lineFile = (file, n) => {
  const lines = fs.readFileSync(file, "utf8").trimEnd().split("\n");
  return lines[n] == null ? null : JSON.parse(lines[n]);
};

const roots = new Map();
for (const raw of fs.readFileSync(morphFile, "utf8").split(/\r?\n/)) {
  if (!raw.trim()) continue;
  const [loc, form, _pos, tags = ""] = raw.split("\t");
  const [s, a, w] = loc.split(":").map(Number);
  const root = tags.match(/(?:^|\|)ROOT:([^|]+)/)?.[1];
  const lemma = tags.match(/(?:^|\|)LEM:([^|]+)/)?.[1];
  if (!root || !lemma || !s || !a || !w) continue;
  const ref = `${s}:${a}`;
  if (!textByRef.has(ref)) continue;
  const slug = slugFor(root);
  let r = roots.get(root);
  if (!r) roots.set(root, r = { root, slug, occurrences: new Map(), lemmas: new Map() });
  const key = `${ref}:${w}`;
  if (!r.occurrences.has(key)) r.occurrences.set(key, { s, a, w, lemma, form });
  const wbw = (wordData[ref] || []).filter((x) => x.audioUrl || !/^\(\d+\)$/.test(String(x.en || "").trim()))[w - 1];
  const gloss = String(wbw?.en || "").trim();
  r.lemmas.set(`${lemma}\u0000${gloss}`, { lemma, gloss });
}

const sorted = [...roots.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const slugs = new Set();
for (const r of sorted) { if (slugs.has(r.slug)) throw new Error(`Duplicate root slug ${r.slug}`); slugs.add(r.slug); }
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const index = sorted.map((r) => {
  const ayahCount = new Set([...r.occurrences.keys()].map((key) => key.split(":").slice(0, 2).join(":"))).size;
  return { root: r.root, slug: r.slug, count: r.occurrences.size, ayahs: ayahCount, pages: Math.ceil(ayahCount / 100) };
});
write(path.join(out, "index.json"), JSON.stringify(index));
const metaPath = path.join(repo, "seo-data", "meta.json");
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
meta.words = index;
write(metaPath, JSON.stringify(meta));

const translationLines = new Map();
for (const lang of supported.filter((x) => x !== "ar")) {
  const perSurah = new Map();
  for (let s = 1; s <= 114; s++) perSurah.set(s, fs.readFileSync(path.join(repo, "seo-data", "t", lang, `${s}.txt`), "utf8").trimEnd().split("\n").map(JSON.parse));
  translationLines.set(lang, perSurah);
}
const langLines = Object.fromEntries(supported.map((lang) => [lang, []]));
for (const r of sorted) {
  const ayahs = new Map();
  for (const o of r.occurrences.values()) {
    const ref = `${o.s}:${o.a}`;
    const ayah = ayahs.get(ref) || { s: o.s, a: o.a, words: [] };
    if (!ayah.words.includes(o.w)) ayah.words.push(o.w);
    ayahs.set(ref, ayah);
  }
  const occurrences = [...ayahs.values()].sort((x, y) => x.s - y.s || x.a - y.a);
  const occurrenceCount = [...r.occurrences.values()].length;
  const offsets = {};
  for (const lang of supported) {
    offsets[lang] = langLines[lang].length;
    for (let from = 0; from < occurrences.length; from += 100) {
      const page = occurrences.slice(from, from + 100).map((o) => {
        const ref = `${o.s}:${o.a}`;
        if (lang === "ar") return { s: o.s, a: o.a, w: o.words, tokens: textByRef.get(ref).split(/\s+/).filter(Boolean) };
        return { s: o.s, a: o.a, translation: translationLines.get(lang).get(o.s)[o.a]?.[0] || "" };
      });
      langLines[lang].push(JSON.stringify(page));
    }
  }
  write(path.join(out, "roots", `${r.slug}.json`), JSON.stringify({ root: r.root, slug: r.slug, count: occurrenceCount, ayahs: occurrences.length, lemmas: [...r.lemmas.values()].sort((a, b) => a.lemma.localeCompare(b.lemma)), pages: Math.ceil(occurrences.length / 100), offsets }));
}
for (const lang of supported) write(path.join(out, `${lang}.txt`), langLines[lang].join("\n") + "\n");
console.log(`roots=${sorted.length} occurrences=${sorted.reduce((n, r) => n + r.occurrences.size, 0)} ayahs=${index.reduce((n, r) => n + r.ayahs, 0)} pages=${index.reduce((n, r) => n + r.pages, 0)}`);
