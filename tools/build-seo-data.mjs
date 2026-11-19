// Builds the small, pre-split data files used by the SEO Pages Functions (functions/).
//
//   node tools/fetch-translations.mjs   # once: downloads translations from R2 into tools/.cache
//   node tools/build-seo-data.mjs       # writes seo-data/
//
// File format ("line files", *.txt): one JSON value per line.
//   line 0      = surah-level value (e.g. all ayahs of the default translation)
//   line 1..n   = per-ayah value (ayah n)
// The function only JSON.parses the single line it needs, which keeps CPU time per request tiny.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANGS } from "./seo-langs.mjs";
import { SURAH_INFO, AYAH_NAMES, THEMES, SURAH_MEANINGS, THEME_TITLES } from "./seo-surahs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..");
const CACHE = path.join(here, ".cache", "translations");
const OUT = path.join(REPO, "seo-data");

// Preferred default translator per language (shown on surah + topic pages, first on ayah pages).
const DEFAULT_TR = {
  en: "Saheeh International",
  de: "Frank Bubenheim and Nadeem",
  tr: "Turkish Translation(Diyanet)",
  ur: "Fatah Muhammad Jalandhari",
  id: "Indonesian Islamic Affairs Ministry",
  fr: "Muhammad Hamidullah",
  ru: "Elmir Kuliev",
  es: "Sheikh Isa Garcia",
  bn: "Taisirul Quran",
};

const RTL_RE = /[֐-ࣿހ-޿יִ-﷿ﹰ-﻿]/g;
const isRtlText = (s) => {
  const letters = (s.match(/\p{L}/gu) || []).length || 1;
  return (s.match(RTL_RE) || []).length / letters > 0.5;
};

function clean(text) {
  return String(text ?? "")
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}

const slugify = (s) =>
  s.toLowerCase().replace(/['’ʿ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const normAr = (s) =>
  String(s || "")
    .replace(/[ً-ٰٟۖ-ۭ]/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, "");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const writeLines = (file, lines) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
};

// ---------- Quran text + words ----------
const rows = JSON.parse(fs.readFileSync(path.join(REPO, "quran_full_with_overrides.json"), "utf8"));
const wordDict = JSON.parse(fs.readFileSync(path.join(REPO, "quran_worddata_de_en_audio.json"), "utf8"));
const surahs = [];
const arText = {}; // s -> [text]
for (const r of rows) {
  const s = Number(r.surah);
  if (!surahs[s]) {
    const [en, de, place] = SURAH_INFO[s];
    surahs[s] = { n: s, ar: r.surah_name_ar, tr: r.surah_name_translit, slug: slugify(r.surah_name_translit), ayahs: 0, en, de, meanings: {}, place };
    arText[s] = [];
  }
  surahs[s].ayahs++;
  arText[s][Number(r.ayah) - 1] = r.text_ar;
}
let misaligned = 0;
for (let s = 1; s <= 114; s++) {
  const lines = [arText[s]];
  for (let a = 1; a <= surahs[s].ayahs; a++) {
    const ws = (wordDict[`${s}:${a}`] || []).filter((w) => w.audioUrl || !/^\(\d+\)$/.test(String(w.en || "").trim()));
    const toks = arText[s][a - 1].split(/\s+/).filter(Boolean);
    const aligned = toks.length === ws.length;
    if (!aligned) misaligned++;
    lines.push(ws.map((w, i) => [aligned ? toks[i] : "", String(w.en || "").trim(), w.audioUrl ? 1 : 0]));
  }
  writeLines(path.join(OUT, "q", `${s}.txt`), lines);
}

// ---------- Themes ----------
const themeSrc = JSON.parse(fs.readFileSync(path.join(REPO, "ruqyah_themes_with_ayahs.json"), "utf8"));
const byArName = new Map(surahs.filter(Boolean).map((s) => [normAr(s.ar), s.n]));
const themes = [];
const ayahThemes = {};
let unresolved = 0;
for (const t of themeSrc.themes) {
  const def = THEMES[t.nr];
  if (!def) continue;
  const refs = [];
  const seen = new Set();
  for (const r of t.ayah_refs) {
    const s = r.surah_id || byArName.get(normAr(r.surah_ar));
    if (!s || !surahs[s]) { unresolved++; continue; }
    const a0 = Number(r.ayah_start), a1 = Number(r.ayah_end || r.ayah_start);
    for (let a = a0; a <= a1; a++) {
      if (a < 1 || a > surahs[s].ayahs) continue;
      const ref = `${s}:${a}`;
      if (seen.has(ref)) continue;
      seen.add(ref);
      refs.push(ref);
    }
  }
  if (!refs.length) continue;
  const idx = themes.length;
  themes.push({ slug: def[0], en: def[1], de: def[2], titles: {}, refs });
  for (const ref of refs) (ayahThemes[ref] ||= []).push(idx);
}
writeLines(path.join(OUT, "topic", "ar.txt"), themes.map((t) => t.refs.map((ref) => { const [s, a] = ref.split(":"); return arText[s][a - 1]; })));

// ---------- Translations ----------
const idx = JSON.parse(fs.readFileSync(path.join(CACHE, "translations_index.json"), "utf8"));
const byFolder = new Map(idx.languages.map((l) => [l.language, l.items]));
const langs = [];
const stats = [];
for (const [code, folders, name, native, hreflang] of LANGS) {
  let items = folders.flatMap((f) => byFolder.get(f) || []);
  if (folders.length && !items.length) { console.warn("no translations for", code); continue; }
  const pref = DEFAULT_TR[code];
  items = [...items].sort((a, b) => (b.label === pref) - (a.label === pref));
  const trs = [];
  const data = []; // translator -> s -> [text]
  for (const it of items) {
    const j = JSON.parse(fs.readFileSync(path.join(CACHE, it.file), "utf8"));
    const per = [];
    let sample = "";
    for (let s = 1; s <= 114; s++) {
      const ch = j.chapters?.[s] || [];
      // Skip chapters whose ayah count does not match (misaligned source data).
      per[s] = ch.length === surahs[s].ayahs ? ch.map((v) => clean(v.text)) : new Array(surahs[s].ayahs).fill("");
      if (!sample) sample = per[s].join(" ").slice(0, 2000);
    }
    trs.push({ n: it.label.trim(), d: isRtlText(sample) ? "rtl" : "ltr" });
    data.push(per);
  }
  for (let s = 1; s <= 114 && trs.length; s++) {
    // line 0 (default translation for the whole surah) only when there are several translators;
    // with a single translator the function derives it from the ayah lines (saves ~40% disk).
    const lines = [data.length > 1 ? data[0][s] : 0];
    for (let a = 0; a < surahs[s].ayahs; a++) lines.push(data.map((per) => per[s][a]));
    writeLines(path.join(OUT, "t", code, `${s}.txt`), lines);
  }
  if (trs.length) {
    writeLines(path.join(OUT, "topic", `${code}.txt`), themes.map((t) => t.refs.map((ref) => { const [s, a] = ref.split(":"); return data[0][s][a - 1]; })));
  }
  const uiRtl = ["ar", "ur", "fa", "fa-af", "ps", "sd", "ug", "dv", "he"].includes(code);
  langs.push({ code, name, native, hreflang, dir: uiRtl ? "rtl" : "ltr", tr: trs });
  stats.push(`${code}:${trs.length}`);
}

const meta = {
  v: new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6),
  surahs: surahs.filter(Boolean),
  langs,
  themes,
  ayahThemes,
  ayahNames: AYAH_NAMES,
};
for (const s of meta.surahs) Object.assign(s.meanings, SURAH_MEANINGS?.[s.n] || { en: s.en, de: s.de });
for (const t of meta.themes) Object.assign(t.titles, THEME_TITLES?.[t.slug] || { en: t.en, de: t.de });
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta));

const themeSizes = themes.map((t) => `${t.slug}:${t.refs.length}`).join(" ");
console.log(`surahs=${meta.surahs.length} langs=${langs.length} themes=${themes.length} misalignedWordAyahs=${misaligned} unresolvedThemeRefs=${unresolved}`);
console.log(stats.join(" "));
console.log(themeSizes);

// ---------- _routes.json: Functions run ONLY on SEO paths (max 100 rules) ----------
const include = ["/sitemap.xml", "/sitemaps/*", ...langs.map((l) => `/${l.code}/*`)];
if (include.length > 100) throw new Error("_routes.json exceeds 100 rules");
fs.writeFileSync(path.join(REPO, "_routes.json"), JSON.stringify({ version: 1, include, exclude: [] }, null, 2) + "\n");
console.log(`_routes.json: ${include.length} include rules`);
