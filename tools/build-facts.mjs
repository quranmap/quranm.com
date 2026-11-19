// Builds factual Q&A pages from repository data and Quranic Arabic Corpus morphology.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AYAH_NAMES } from "./seo-surahs.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(repo, "seo-data", "facts");
const morphFile = path.join(repo, "tools", ".cache", "quran-morphology.txt");
const morphUrl = "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";
const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(repo, "seo-data", "meta.json"), "utf8"));
const slugify = (s) => String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value) + "\n");
const readTranslation = (code, s) => {
  const lines = fs.readFileSync(path.join(repo, "seo-data", "t", code, `${s}.txt`), "utf8").trimEnd().split("\n");
  const first = JSON.parse(lines[0]);
  return Array.isArray(first) ? first : lines.slice(1).map((line) => JSON.parse(line)[0]);
};
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const byRef = new Map(rows.map((r) => [r.ref, { ref: r.ref, surah: Number(r.surah), ayah: Number(r.ayah), ar: r.text_ar }]));
const translations = { en: new Map(), de: new Map() };
for (const code of Object.keys(translations)) for (const s of meta.surahs) {
  const values = readTranslation(code, s.n);
  for (let a = 1; a <= s.ayahs; a++) translations[code].set(`${s.n}:${a}`, values[a - 1] || "");
}
const evidence = (refs) => refs.map((ref) => ({ ...byRef.get(ref), en: translations.en.get(ref) || "", de: translations.de.get(ref) || "" }));
const facts = [];
const add = (type, slug, question, answer, extra = {}) => facts.push({ type, slug, question, answer, ...extra });
for (const s of meta.surahs) {
  add("ayah-count", `how-many-verses-${s.slug}`, `How many verses are in Surah ${s.tr}?`, `${s.tr} has ${s.ayahs} verses.`, { s: s.n, count: s.ayahs });
  if (s.place === "M" || s.place === "D") add("revelation-place", `is-surah-${s.slug}-meccan-or-medinan`, `Is Surah ${s.tr} Meccan or Medinan?`, `${s.tr} is ${s.place === "M" ? "Meccan" : "Medinan"}.`, { s: s.n, place: s.place });
}
for (const [ref, names] of Object.entries(AYAH_NAMES)) {
  const name = names[0];
  add("named-ayah", `where-is-${slugify(name)}`, `Which surah and verse is ${name}?`, `${name} is in Quran ${ref}.`, { name, ref, evidence: evidence([ref]) });
}

const references = new Map(Object.entries({ Musa: 136, Ibrahim: 69, Nuh: 43, Isa: 25, Yusuf: 27, Harun: 20, Adam: 25, Muhammad: 4, Dawud: 16, Sulayman: 17, Ismail: 12, Ishaq: 17, Yaqub: 16, Lut: 27, Yunus: 4, Ayyub: 4, Zakariya: 7, Yahya: 5, Idris: 2, Hud: 7, Salih: 9, Shuayb: 11, Ilyas: 2, "Al-Yasa": 2, "Dhul-Kifl": 2 }));
const lemmas = new Map([
  ["Adam", "\u0622\u062f\u064e\u0645"], ["Idris", "\u0625\u0650\u062f\u0652\u0631\u0650\u064a\u0633"], ["Nuh", "\u0646\u064f\u0648\u062d"], ["Hud", "\u0647\u064f\u0648\u062f"], ["Salih", "\u0635\u0627\u0644\u0650\u062d"], ["Ibrahim", "\u0625\u0650\u0628\u0652\u0631\u0627\u0647\u0650\u064a\u0645"], ["Lut", "\u0644\u064f\u0648\u0637"], ["Ismail", "\u0625\u0650\u0633\u0652\u0645\u0627\u0639\u0650\u064a\u0644"], ["Ishaq", "\u0625\u0650\u0633\u0652\u062d\u0627\u0642"], ["Yaqub", "\u064a\u064e\u0639\u0652\u0642\u064f\u0648\u0628"],
  ["Yusuf", "\u064a\u064f\u0648\u0633\u064f\u0641"], ["Ayyub", "\u0623\u064e\u064a\u0651\u064f\u0648\u0628"], ["Shuayb", "\u0634\u064f\u0639\u064e\u064a\u0652\u0628"], ["Musa", "\u0645\u064f\u0648\u0633\u064e\u0649"], ["Harun", "\u0647\u0627\u0631\u064f\u0648\u0646"], ["Dawud", "\u062f\u0627\u0648\u064f\u062f"], ["Sulayman", "\u0633\u064f\u0644\u064e\u064a\u0652\u0645\u0627\u0646"], ["Ilyas", "\u0625\u0650\u0644\u0652\u064a\u0627\u0633"], ["Al-Yasa", "\u0627\u0644\u0652\u064a\u064e\u0633\u064e\u0639"], ["Yunus", "\u064a\u064f\u0648\u0646\u064f\u0633"], ["Zakariya", "\u0632\u064e\u0643\u064e\u0631\u0650\u064a\u0651\u0627"], ["Yahya", "\u064a\u064e\u062d\u0652\u064a\u064e\u0649"], ["Isa", "\u0639\u0650\u064a\u0633\u064e\u0649"], ["Muhammad", "\u0645\u064f\u062d\u064e\u0645\u0651\u064e\u062f"],
]);
const ensureMorph = async () => {
  if (fs.existsSync(morphFile)) return;
  fs.mkdirSync(path.dirname(morphFile), { recursive: true });
  const response = await fetch(morphUrl);
  if (!response.ok) throw new Error(`Unable to download morphology: ${response.status}`);
  fs.writeFileSync(morphFile, Buffer.from(await response.arrayBuffer()));
};
const countMorph = () => {
  const stats = new Map([...references.keys()].map((name) => [name, { occurrences: 0, refs: [] }]));
  const tokens = new Map();
  for (const line of fs.readFileSync(morphFile, "utf8").split(/\r?\n/)) {
    const [location, , pos, features] = line.split("\t");
    if (!location || !features) continue;
    const [surah, ayah] = location.split(":");
    const ref = `${surah}:${ayah}`;
    const lemma = features.split("|").find((part) => part.startsWith("LEM:"))?.slice(4);
    (tokens.get(ref) || tokens.set(ref, []).get(ref)).push(lemma);
    for (const [name, expected] of lemmas) if (pos === "N" && features.split("|").includes("PN") && lemma === expected) {
      stats.get(name).occurrences++;
      stats.get(name).refs.push(ref);
    }
  }
  const dhul = stats.get("Dhul-Kifl");
  for (const [ref, refTokens] of tokens) for (let i = 0; i < refTokens.length - 2; i++) if (refTokens[i] === "\u0630\u064f\u0648" && refTokens[i + 1] === "\u0627\u0644" && refTokens[i + 2] === "\u0643\u0650\u0641\u0652\u0644") {
    dhul.occurrences++;
    dhul.refs.push(ref);
  }
  return stats;
};

await ensureMorph();
const referencesFound = countMorph();
const prophets = [];
for (const [name, expected] of references) {
  const stat = referencesFound.get(name);
  if (Math.abs(stat.occurrences - expected) > 2) {
    console.warn(`FAIL prophet ${name}: occurrences=${stat.occurrences}, reference=${expected}; excluded`);
    continue;
  }
  const refs = [...new Set(stat.refs)];
  const fact = { name, occurrences: stat.occurrences, ayahs: refs.length, evidence: evidence(refs) };
  prophets.push(fact);
  add("prophet", `where-is-${slugify(name)}-mentioned`, `Where is ${name} mentioned in the Quran?`, `${name} is mentioned by name ${stat.occurrences} times in ${refs.length} ayahs of the Quran.`, fact);
}
const verseCounts = new Map();
for (const row of rows) verseCounts.set(Number(row.surah), (verseCounts.get(Number(row.surah)) || 0) + 1);
const mismatches = meta.surahs.filter((s) => verseCounts.get(s.n) !== s.ayahs);
if (mismatches.length) throw new Error(`FAIL verse counts: ${mismatches.map((s) => `${s.n}:${verseCounts.get(s.n)}!=${s.ayahs}`).join(", ")}`);
const classified = meta.surahs.filter((s) => s.place === "M" || s.place === "D").length;
console.log(`template-check ayah-counts=OK (${meta.surahs.length}), revelation-place=OK (${classified}), totals=OK (surahs=${meta.surahs.length}, verses=${rows.length})`);
const verseCount = rows.length;
const wordCount = rows.reduce((n, r) => n + r.text_ar.split(/\s+/).filter(Boolean).length, 0);
add("quran-count", "how-many-surahs-verses-words-in-quran", "How many surahs, verses and words are in the Quran?", `The Quran has ${meta.surahs.length} surahs, ${verseCount} verses and ${wordCount} whitespace-separated words in the repository's Arabic text data.`, { surahs: meta.surahs.length, verses: verseCount, words: wordCount });
const index = facts.map(({ type, slug, question, answer, s, name, count, occurrences, ayahs, place, ref }) => ({ type, slug, question, answer, s, name, count, occurrences, ayahs, place, ref }));
write(path.join(out, "index.json"), { facts: index, prophets, stats: { surahs: meta.surahs.length, verses: verseCount, words: wordCount } });
for (const fact of facts) write(path.join(out, `${fact.slug}.json`), fact);
console.log(`facts=${facts.length} surahCount=${meta.surahs.length} verseCount=${verseCount} wordCount=${wordCount}`);
console.log(`prophets=${prophets.length} ${prophets.map((p) => `${p.name}:${p.occurrences}/${p.ayahs}`).join(" ")}`);
