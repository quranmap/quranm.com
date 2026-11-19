// Builds the curated Quranic dua index from repository Quran text only.
// Source: quran_full_with_overrides.json in this repository; no external data or license applies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const list = JSON.parse(fs.readFileSync(path.join(here, "dua-list.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync(path.join(repo, "quran_full_with_overrides.json"), "utf8"));
const byRef = new Map(rows.map((r) => [r.ref, r]));
const refRe = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/;
const all = [];
const seenSlugs = new Set();
for (const item of list) {
  if (!item.slug || seenSlugs.has(item.slug)) throw new Error(`duplicate or empty slug: ${item.slug}`);
  seenSlugs.add(item.slug);
  if (!item.title?.en || !item.title?.de) throw new Error(`missing titles: ${item.slug}`);
  const refs = [];
  for (const spec of item.refs || []) {
    const m = spec.match(refRe);
    if (!m) throw new Error(`bad reference ${spec} in ${item.slug}`);
    const s = Number(m[1]), start = Number(m[2]), end = Number(m[3] || m[2]);
    for (let a = start; a <= end; a++) {
      const ref = `${s}:${a}`;
      const row = byRef.get(ref);
      if (!row || !row.text_ar) throw new Error(`reference missing from Quran data: ${ref}`);
      refs.push({ ref, s, a, ar: row.text_ar });
    }
  }
  if (!refs.length) throw new Error(`no references in ${item.slug}`);
  all.push({ slug: item.slug, title: item.title, speaker: item.speaker || "", refs });
}

const out = path.join(repo, "seo-data", "dua");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.txt"), all.map((x) => JSON.stringify(x)).join("\n") + "\n");
console.log(`dua entries=${all.length} ayahs=${all.reduce((n, x) => n + x.refs.length, 0)} verified against quran_full_with_overrides.json`);
