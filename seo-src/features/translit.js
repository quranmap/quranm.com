const UI = {
  en: { indexTitle: "Quran transliteration – read in English letters | quranm", indexH1: "Quran transliteration", intro: "Read all 114 surahs in English letters, with Arabic text and a translation.", title: "Surah {name} transliteration – read in English letters | quranm", h1: "Surah {name} transliteration", translit: "Transliteration", translation: "Translation", source: "Transliteration source: English Transliteration by Tanzil. Used under Tanzil's non-commercial terms; see the source and latest updates at Tanzil.", sourceLink: "Tanzil translation download", unavailable: "No translation is available in this language.", browse: "Browse transliteration" },
  de: { indexTitle: "Koran-Transliteration – in lateinischen Buchstaben lesen | quranm", indexH1: "Koran-Transliteration", intro: "Lies alle 114 Suren in lateinischen Buchstaben mit arabischem Text und Übersetzung.", title: "Sure {name} Transliteration – in lateinischen Buchstaben lesen | quranm", h1: "Transliteration von Sure {name}", translit: "Transliteration", translation: "Übersetzung", source: "Quelle der Transliteration: English Transliteration von Tanzil. Verwendung gemäß den nicht-kommerziellen Bedingungen von Tanzil; Quelle und Updates bei Tanzil.", sourceLink: "Tanzil-Übersetzungsdownload", unavailable: "Für diese Sprache ist keine Übersetzung verfügbar.", browse: "Transliteration öffnen" },
  ar: { indexTitle: "نقل لفظي للقرآن بالحروف اللاتينية | quranm", indexH1: "النقل اللفظي للقرآن", intro: "اقرأ السور الـ114 بالحروف اللاتينية مع النص العربي.", title: "النقل اللفظي لسورة {name} بالحروف اللاتينية | quranm", h1: "النقل اللفظي لسورة {name}", translit: "النقل اللفظي", translation: "الترجمة", source: "مصدر النقل اللفظي: English Transliteration من Tanzil. راجع المصدر والتحديثات في Tanzil.", sourceLink: "تنزيل ترجمات Tanzil", unavailable: "لا تتوفر ترجمة بهذه اللغة.", browse: "فتح النقل اللفظي" },
  ur: { indexTitle: "قرآن کا تلفظی متن – انگریزی حروف میں پڑھیں | quranm", indexH1: "قرآن کا تلفظی متن", intro: "تمام 114 سورتیں انگریزی حروف، عربی متن اور ترجمے کے ساتھ پڑھیں۔", title: "سورۃ {name} کا تلفظی متن – انگریزی حروف میں | quranm", h1: "سورۃ {name} کا تلفظی متن", translit: "تلفظی متن", translation: "ترجمہ", source: "تلفظی متن کا ماخذ: Tanzil کا English Transliteration۔ ماخذ اور تازہ معلومات Tanzil پر دیکھیں۔", sourceLink: "Tanzil ترجمہ ڈاؤن لوڈ", unavailable: "اس زبان میں ترجمہ دستیاب نہیں ہے۔", browse: "تلفظی متن کھولیں" },
  tr: { indexTitle: "Kuran transkripsiyonu – Latin harfleriyle okuyun | quranm", indexH1: "Kuran transkripsiyonu", intro: "114 surenin tamamını Arapça metin ve çeviriyle Latin harfleriyle okuyun.", title: "{name} Suresi transkripsiyonu – Latin harfleriyle okuyun | quranm", h1: "{name} Suresi transkripsiyonu", translit: "Transkripsiyon", translation: "Çeviri", source: "Transkripsiyon kaynağı: Tanzil English Transliteration. Kaynak ve güncellemeler için Tanzil'e bakın.", sourceLink: "Tanzil çeviri indirme", unavailable: "Bu dilde çeviri bulunmuyor.", browse: "Transkripsiyonu aç" },
};
const ui = (code) => UI[code] || UI.en;
const pathFor = (c, s) => `/${c}/surah/${s.n}-${s.slug}/transliteration/`;
const indexFor = (c) => `/${c}/transliteration/`;
const translation = async (H, ctx, lang, s, a) => {
  if (!lang.tr.length) return null;
  const row = await H.line(ctx, `/seo-data/t/${lang.code}/${s.n}.txt`, a);
  return row?.[0] || null;
};

async function pageIndex({ m, lang, L, H }) {
  const T = ui(lang.code);
  const links = m.surahs.map((s) => `<li><a href="${pathFor(lang.code, s)}"><span class="no">${s.n}</span><span class="nm"><b>${H.esc(H.surahName(m, lang.code, s))}</b><small>${H.esc(T.browse)}</small></span><span class="arn" lang="ar" dir="rtl">${H.esc(s.ar)}</span></a></li>`).join("");
  const body = `<h1>${H.esc(T.indexH1)}</h1><p class="lead">${H.esc(T.intro)}</p><ol class="surahs">${links}</ol><p class="note">${H.esc(T.source)} <a href="https://tanzil.net/trans/" rel="nofollow">${H.esc(T.sourceLink)}</a></p>`;
  return H.layout({ m, lang, L, body, hasArabic: true, title: T.indexTitle, desc: T.intro, path: indexFor(lang.code), altPath: indexFor, crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [T.indexH1, indexFor(lang.code)]] });
}

async function pageSurah({ ctx, m, lang, L, H, s }) {
  const T = ui(lang.code);
  const [ar, translitLines] = await Promise.all([H.line(ctx, `/seo-data/q/${s.n}.txt`, 0), H.lines(ctx, `/seo-data/translit/${s.n}.txt`)]);
  if (!ar || !translitLines || translitLines.length < s.ayahs) return null;
  const translit = translitLines.slice(0, s.ayahs).map((line) => JSON.parse(line));
  const rows = await Promise.all(translit.map(async (v, i) => ({ v, tr: await translation(H, ctx, lang, s, i + 1), a: i + 1 })));
  const trDir = lang.tr[0]?.d || lang.dir;
  const items = rows.map(({ v, tr, a }) => `<article class="ay" id="a${a}"><a class="ref" href="${H.P.ayah(lang.code, s.n, a)}">${s.n}:${a}</a><p class="ar" lang="ar" dir="rtl">${H.esc(ar[a - 1])} <span class="end">۝${a}﴾</span></p><p class="tr" lang="en" dir="ltr"><b>${H.esc(T.translit)}:</b> ${H.esc(v)}</p>${tr ? `<p class="tr" dir="${trDir}"><b>${H.esc(T.translation)}:</b> ${H.esc(tr)}</p>` : ""}</article>`).join("");
  const name = H.surahName(m, lang.code, s);
  const body = `<h1>${H.esc(H.fmt(T.h1, { name }))}</h1><p class="actions">${H.readerBtn(L, s.n, 1)} <a class="btn" href="${H.P.surah(lang.code, s)}">${H.esc(L.readSurah)}</a></p><div class="ayahs">${items}</div><p class="note">${H.esc(T.source)} <a href="https://tanzil.net/trans/" rel="nofollow">${H.esc(T.sourceLink)}</a>${!lang.tr.length ? ` ${H.esc(T.unavailable)}` : ""}</p>`;
  return H.layout({ m, lang, L, body, title: H.fmt(T.title, { name }), desc: T.intro, ogType: "article", path: pathFor(lang.code, s), altPath: (c) => pathFor(c, s), crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [`${L.surah} ${name}`, H.P.surah(lang.code, s)], [T.translit, pathFor(lang.code, s)]] });
}

export default {
  name: "translit",
  async route(args) {
    const { m, lang, seg, H } = args;
    if (seg.length === 2 && seg[1] === "transliteration") return { body: await pageIndex({ ...args, H }) };
    if (seg.length !== 4 || seg[1] !== "surah" || seg[3] !== "transliteration") return null;
    const match = seg[2].match(/^(\d{1,3})(?:-([a-z0-9-]+))?$/);
    const s = match && m.surahs[Number(match[1]) - 1];
    if (!s || String(s.n) !== match[1]) return null;
    if (match[2] !== s.slug) return { redirect: pathFor(lang.code, s) };
    return { body: await pageSurah({ ...args, H, s }) };
  },
  urls(m, lang) {
    return [indexFor(lang.code), ...m.surahs.map((s) => pathFor(lang.code, s))];
  },
};
