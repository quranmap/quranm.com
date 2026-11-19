const UI = {
  en: { indexTitle: "Quran facts and answers | quranm", indexH1: "Quran facts", indexDesc: "Factual questions about the Quran answered from its text and structured data.", evidence: "Evidence", read: "Read ayah", info: "Surah information", verses: "verses", meccan: "Meccan", medinan: "Medinan", translation: "English translation", deTranslation: "German translation", quran: "Quran", facts: "facts", back: "All facts", source: "This answer is computed from the Quran text and metadata in quranm.", surahs: "surahs", words: "words", ayahs: "ayahs" },
  de: { indexTitle: "Fakten und Antworten zum Quran | quranm", indexH1: "Quran-Fakten", indexDesc: "Faktische Fragen zum Quran, beantwortet anhand seines Textes und strukturierter Daten.", evidence: "Belege", read: "Vers lesen", info: "Informationen zur Sure", verses: "Verse", meccan: "mekkanisch", medinan: "medinensisch", translation: "Englische Übersetzung", deTranslation: "Deutsche Übersetzung", quran: "Quran", facts: "Fakten", back: "Alle Fakten", source: "Diese Antwort wird aus Qurantext und Metadaten von quranm berechnet.", surahs: "Suren", words: "Wörter", ayahs: "Verse" },
};
const t = (code, key) => (UI[code] || UI.en)[key] || UI.en[key];
const text = (code, en, de) => code === "de" ? de : en;
const factPath = (c, slug) => `/${c}/facts/${slug}/`;
const slugify = (s) => String(s).toLowerCase().replace(/[’'']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PROPHETS = ["Adam", "Idris", "Nuh", "Salih", "Ibrahim", "Lut", "Ismail", "Ishaq", "Yaqub", "Yusuf", "Ayyub", "Shuayb", "Musa", "Harun", "Dhul-Kifl", "Dawud", "Sulayman", "Ilyas", "Al-Yasa", "Yunus", "Zakariya", "Yahya", "Isa", "Muhammad"];
const titleFor = (f, code) => `${f.question} | quranm`;
const displayName = (H, m, c, s) => H.surahName(m, c, s);
const faq = (f) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } }] });
function localizedFact(fact, code, name, s) {
  if (code === "de") {
    if (fact.type === "ayah-count") return { ...fact, question: `Wie viele Verse hat die Sure ${name}?`, answer: `${name} hat ${s.ayahs} Verse.` };
    if (fact.type === "revelation-place") return { ...fact, question: `Ist die Sure ${name} mekkanisch oder medinensisch?`, answer: `${name} ist ${fact.place === "M" ? "mekkanisch" : "medinensisch"}.` };
    if (fact.type === "named-ayah") return { ...fact, question: `In welcher Sure und in welchem Vers steht ${fact.name}?`, answer: `${fact.name} steht im Quran ${fact.ref}.` };
    if (fact.type === "prophet") return { ...fact, question: `Wo wird ${fact.name} im Quran erwähnt?`, answer: `${fact.name} wird im Quran namentlich ${fact.occurrences}-mal in ${fact.ayahs} Versen erwähnt.` };
    if (fact.type === "quran-count") return { ...fact, question: "Wie viele Suren, Verse und Wörter hat der Quran?", answer: `Der Quran hat ${fact.surahs} Suren, ${fact.verses} Verse und ${fact.words} durch Leerzeichen getrennte Wörter in den arabischen Textdaten des Repositoriums.` };
  }
  if (fact.s) {
    if (fact.type === "ayah-count") return { ...fact, question: `How many verses are in Surah ${name}?`, answer: `${name} has ${s.ayahs} verses.` };
    if (fact.type === "revelation-place") return { ...fact, question: `Is Surah ${name} Meccan or Medinan?`, answer: `${name} is ${fact.place === "M" ? "Meccan" : "Medinan"}.` };
  }
  return fact;
}

function cards(m, c, facts) {
  return facts.map((f) => `<li><a href="${factPath(c, f.slug)}"><b>${HIDDEN.escape(f.question)}</b><small>${HIDDEN.escape(f.answer)}</small></a></li>`).join("");
}
let HIDDEN = { escape: (s) => String(s).replace(/[&<>"']/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x]) };

async function renderFact({ ctx, m, lang, L, fact, H }) {
  const c = lang.code, ui = UI[c] || UI.en;
  const s = fact.s ? m.surahs[fact.s - 1] : null;
  const name = s ? displayName(H, m, c, s) : fact.name;
  const view = localizedFact(fact, c, name, s);
  let evidence = "";
  if (fact.evidence) evidence = `<section><h2>${H.esc(ui.evidence)}</h2>${fact.evidence.map((e) => `<article class="ay"><a class="ref" href="${H.P.ayah(c, e.surah, e.ayah)}">${H.esc(nameForRef(H, m, c, e.surah))} ${e.ref}</a><p class="ar" lang="ar" dir="rtl">${H.esc(e.ar)}</p><p class="tr" dir="ltr">${H.esc(c === "de" ? e.de : e.en)}</p><p class="note"><a href="${H.P.ayah(c, e.surah, e.ayah)}">${H.esc(ui.read)}</a></p></article>`).join("")}</section>`;
  if (s) evidence = `<section><h2>${H.esc(ui.info)}</h2><dl class="info"><div><dt>${H.esc(L.number)}</dt><dd>${s.n}</dd></div><div><dt>${H.esc(L.ayahs)}</dt><dd>${s.ayahs}</dd></div>${fact.place ? `<div><dt>${H.esc(L.revelation)}</dt><dd>${H.esc(fact.place === "M" ? ui.meccan : ui.medinan)}</dd></div>` : ""}</dl><p class="actions"><a class="btn primary" href="${H.P.surah(c, s)}">${H.esc(L.readSurah)}</a></p></section>`;
  if (fact.type === "quran-count") evidence = `<section><h2>${H.esc(ui.evidence)}</h2><dl class="info"><div><dt>${H.esc(ui.quran)}</dt><dd>${fact.surahs} ${H.esc(ui.surahs)}, ${fact.verses} ${H.esc(ui.ayahs)}, ${fact.words} ${H.esc(ui.words)}</dd></div></dl></section>`;
  const body = `<h1>${H.esc(view.question)}</h1><p class="lead">${H.esc(view.answer)}</p>${evidence}<p class="note">${H.esc(ui.source)}</p><p class="actions"><a class="btn" href="/${c}/facts/">${H.esc(ui.back)}</a></p>`;
  return H.layout({ m, lang, L, body, title: titleFor(view, c), desc: view.answer, path: factPath(c, fact.slug), altPath: (x) => factPath(x, fact.slug), crumbs: [["quranm", "/"], [lang.native, H.P.hub(c)], [ui.facts, `/${c}/facts/`], [view.question, factPath(c, fact.slug)]], jsonld: [faq(view)], ogType: "article" });
}
function nameForRef(H, m, c, s) { return displayName(H, m, c, m.surahs[s - 1]); }

export default {
  name: "facts",
  async route({ ctx, m, lang, L, seg, H }) {
    if (seg[1] !== "facts" || (seg.length !== 2 && seg.length !== 3)) return null;
    const indexText = await H.fetchAsset(ctx, "/seo-data/facts/index.json");
    if (!indexText) return null;
    const index = JSON.parse(indexText);
    if (seg.length === 2) {
      const ui = UI[lang.code] || UI.en;
      const body = `<h1>${H.esc(ui.indexH1)}</h1><p class="lead">${H.esc(ui.indexDesc)}</p><ul class="surahs">${cards(m, lang.code, index.facts)}</ul>`;
      return H.layout({ m, lang, L, body, title: ui.indexTitle, desc: ui.indexDesc, path: `/${lang.code}/facts/`, altPath: (x) => `/${x}/facts/`, crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [ui.facts, `/${lang.code}/facts/`]] });
    }
    const slug = seg[2];
    if (!index.facts.some((f) => f.slug === slug)) return null;
    const factText = await H.fetchAsset(ctx, `/seo-data/facts/${slug}.json`);
    return factText ? await renderFact({ ctx, m, lang, L, fact: JSON.parse(factText), H }) : null;
  },
  urls(m, l) {
    const c = l.code;
    const urls = [`/${c}/facts/`];
    for (const s of m.surahs) {
      urls.push(factPath(c, `how-many-verses-${s.slug}`));
      if (s.place === "M" || s.place === "D") urls.push(factPath(c, `is-surah-${s.slug}-meccan-or-medinan`));
    }
    for (const names of Object.values(m.ayahNames)) urls.push(factPath(c, `where-is-${slugify(names[0])}`));
    for (const name of PROPHETS) urls.push(factPath(c, `where-is-${slugify(name)}-mentioned`));
    urls.push(factPath(c, "how-many-surahs-verses-words-in-quran"));
    return urls;
  },
};
