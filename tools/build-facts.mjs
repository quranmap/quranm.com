// Builds factual Q&A pages from repository data only.
// Sources: quran_full_with_overrides.json, tools/seo-surahs.mjs, and the
// already-built English/German translation line files under seo-data/t/.
// No external downloads or third-party data are used.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AYAH_NAMES, SURAH_INFO } from "./seo-surahs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const out = path.join(repo, "seo-data", "facts");
const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(repo, "seo-data", "meta.json"), "utf8"));
const slugify = (s) => String(s).toLowerCase().replace(/[’'']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value) + "\n");
const readTranslation = (code, s) => {
  const lines = fs.readFileSync(path.join(repo, "seo-data", "t", code, `${s}.txt`), "utf8").trimEnd().split("\n");
  const first = JSON.parse(lines[0]);
  return Array.isArray(first) ? first : lines.slice(1).map((line) => JSON.parse(line)[0]);
};
const stripMarks = (s) => String(s).normalize("NFC")
  .replace(/[\u0610-\u061a\u064b-\u065f\u06d6-\u06ed]/g, "").replace(/\u0670/g, "\u0627")
  .replace(/[\u0622\u0623\u0625\u0671ء]/g, "ا").replace(/ى/g, "ي").replace(/ـ/g, "").replace(/\s+/g, " ").trim();

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const byRef = new Map();
const bySurah = new Map();
for (const r of rows) {
  const item = { ref: r.ref, surah: Number(r.surah), ayah: Number(r.ayah), ar: r.text_ar };
  byRef.set(r.ref, item);
  (bySurah.get(item.surah) || bySurah.set(item.surah, []).get(item.surah)).push(item);
}
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

const prophets = [
  ["Adam", ["ادم"]], ["Idris", ["ادريس"]], ["Nuh", ["نوح"]], ["Hud", ["هود"]], ["Salih", ["صالح"]],
  ["Ibrahim", ["ابراهيم"]], ["Lut", ["لوط"]], ["Ismail", ["اسماعيل"]], ["Ishaq", ["اسحاق"]], ["Yaqub", ["يعقوب"]],
  ["Yusuf", ["يوسف"]], ["Ayyub", ["ايوب"]], ["Shuayb", ["شعيب"]], ["Musa", ["موسي"]], ["Harun", ["هارون"]],
  ["Dhul-Kifl", ["ذو الكفل", "ذا الكفل"]], ["Dawud", ["داود"]], ["Sulayman", ["سليمان"]], ["Ilyas", ["الياس"]],
  ["Al-Yasa", ["اليسع", "يسع"]], ["Yunus", ["يونس"]], ["Zakariya", ["زكريا"]], ["Yahya", ["يحيي"]],
  ["Isa", ["عيسي"]], ["Muhammad", ["محمد"]],
];
const fixedNorm = (s) => String(s).normalize("NFC")
  .replace(/[\u0610-\u061a\u064b-\u065f\u06d6-\u06ed]/g, "").replace(/\u0670/g, "\u0627")
  .replace(/[\u0622\u0623\u0625\u0671\u0621]/g, "\u0627").replace(/\u0649/g, "\u064a").replace(/\u0640/g, "")
  .replace(/\u0627\u0627/g, "\u0627").replace(/[^\u0621-\u063A\u0641-\u064A ]/g, "").replace(/\s+/g, " ").trim();
const prophetVariants = new Map([
  ["Adam", ["\u0627\u062f\u0645"]], ["Idris", ["\u0627\u062f\u0631\u064a\u0633"]], ["Nuh", ["\u0646\u0648\u062d"]], ["Hud", ["\u0647\u0648\u062f"]], ["Salih", ["\u0635\u0627\u0644\u062d"]],
  ["Ibrahim", ["\u0627\u0628\u0631\u0627\u0647\u064a\u0645"]], ["Lut", ["\u0644\u0648\u0637"]], ["Ismail", ["\u0627\u0633\u0645\u0627\u0639\u064a\u0644"]], ["Ishaq", ["\u0627\u0633\u062d\u0627\u0642"]], ["Yaqub", ["\u064a\u0639\u0642\u0648\u0628"]],
  ["Yusuf", ["\u064a\u0648\u0633\u0641"]], ["Ayyub", ["\u0627\u064a\u0648\u0628"]], ["Shuayb", ["\u0634\u0639\u064a\u0628"]], ["Musa", ["\u0645\u0648\u0633\u064a"]], ["Harun", ["\u0647\u0627\u0631\u0648\u0646"]],
  ["Dhul-Kifl", ["\u0630\u0648 \u0627\u0644\u0643\u0641\u0644", "\u0630\u0627 \u0627\u0644\u0643\u0641\u0644"]], ["Dawud", ["\u062f\u0627\u0648\u062f"]], ["Sulayman", ["\u0633\u0644\u064a\u0645\u0627\u0646"]], ["Ilyas", ["\u0627\u0644\u064a\u0627\u0633"]],
  ["Al-Yasa", ["\u0627\u0644\u064a\u0633\u0639", "\u064a\u0633\u0639"]], ["Yunus", ["\u064a\u0648\u0646\u0633"]], ["Zakariya", ["\u0632\u0643\u0631\u064a\u0627"]], ["Yahya", ["\u064a\u062d\u064a\u064a"]], ["Isa", ["\u0639\u064a\u0633\u064a"]], ["Muhammad", ["\u0645\u062d\u0645\u062f"]],
]);
const norm = fixedNorm;
const prophetStats = [];
for (const [name, rawVariants] of prophetVariants) {
  const variants = rawVariants.map(norm);
  // Method 1: scan each ayah as a normalized string and use phrase matching.
  const method1 = rows.filter((r) => {
    const tokens = norm(r.text_ar).split(" ").filter(Boolean);
    return variants.some((v) => v.includes(" ") ? tokens.join(" ").includes(v) : tokens.some((token) => token === v || token.startsWith(v)));
  }).map((r) => r.ref);
  // Method 2: tokenize independently, matching single-word names or adjacent tokens.
  const method2 = [];
  for (const r of rows) {
    const tokens = norm(r.text_ar).split(" ").filter(Boolean);
    if (variants.some((v) => v.includes(" ") ? tokens.join(" ").includes(v) : new RegExp(`(?:^| )${v}[^ ]*(?= |$)`).test(norm(r.text_ar)))) method2.push(r.ref);
  }
  const same = method1.length === method2.length && method1.every((v, i) => v === method2[i]);
  if (!same) { console.warn(`prophet mismatch ${name}: method1=${method1.length} method2=${method2.length}`); continue; }
  const refs = method1;
  prophetStats.push({ name, count: refs.length });
  add("prophet", `where-is-${slugify(name)}-mentioned`, `Where is ${name} mentioned in the Quran?`, `${name} is mentioned in ${refs.length} ayahs of the Quran.`, { name, count: refs.length, evidence: evidence(refs) });
}

const verseCount = rows.length;
const wordCount = rows.reduce((n, r) => n + r.text_ar.split(/\s+/).filter(Boolean).length, 0);
add("quran-count", "how-many-surahs-verses-words-in-quran", "How many surahs, verses and words are in the Quran?", `The Quran has ${meta.surahs.length} surahs, ${verseCount} verses and ${wordCount} whitespace-separated words in the repository's Arabic text data.`, { surahs: meta.surahs.length, verses: verseCount, words: wordCount });

const index = facts.map(({ type, slug, question, answer, s, name, count, place, ref }) => ({ type, slug, question, answer, s, name, count, place, ref }));
write(path.join(out, "index.json"), { facts: index, prophets: prophetStats, stats: { surahs: meta.surahs.length, verses: verseCount, words: wordCount } });
for (const fact of facts) write(path.join(out, `${fact.slug}.json`), fact);
console.log(`facts=${facts.length} surahCount=${meta.surahs.length} verseCount=${verseCount} wordCount=${wordCount}`);
console.log(`prophets=${prophetStats.length} ${prophetStats.map((p) => `${p.name}:${p.count}`).join(" ")}`);
