const LANGS = new Set(["en", "de", "tr", "ur", "id", "fr", "es", "ar"]);
const UI = {
  en: { roots: "Quran roots", rootsIntro: "Arabic roots found in the Quran, with their derived lemmas and ayahs.", root: "Root", occurrences: "Occurrences", lemmas: "Derived lemmas", ayahs: "Ayahs", page: "Page", prev: "Previous page", next: "Next page", source: "Morphology source: Quranic Arabic Corpus Morphology v0.4, Arabic-script fork by mustafa0x; GPL.", gloss: "English gloss", translation: "Translation", rootTitle: "Quran root {root} – {count} occurrences | quranm", rootDesc: "Arabic root {root} occurs {count} times in the Quran, with derived lemmas and ayahs.", indexTitle: "Quran roots – Arabic roots and ayahs | quranm" },
  de: { roots: "Quran-Wurzeln", rootsIntro: "Arabische Wurzeln im Quran mit ihren abgeleiteten Lemmata und Versen.", root: "Wurzel", occurrences: "Vorkommen", lemmas: "Abgeleitete Lemmata", ayahs: "Verse", page: "Seite", prev: "Vorherige Seite", next: "Nächste Seite", source: "Morphologiequelle: Quranic Arabic Corpus Morphology v0.4, arabischsprachige Fassung von mustafa0x; GPL.", gloss: "Englische Bedeutung", translation: "Übersetzung", rootTitle: "Quran-Wurzel {root} – {count} Vorkommen | quranm", rootDesc: "Die arabische Wurzel {root} kommt {count}-mal im Quran vor, mit Lemmata und Versen.", indexTitle: "Quran-Wurzeln – arabische Wurzeln und Verse | quranm" },
  tr: { roots: "Kur’an kökleri", rootsIntro: "Kur’an’da bulunan Arapça kökler, türemiş kelimeler ve ayetlerle.", root: "Kök", occurrences: "Kullanım", lemmas: "Türemiş kelimeler", ayahs: "Ayetler", page: "Sayfa", prev: "Önceki sayfa", next: "Sonraki sayfa", source: "Morfoloji kaynağı: Quranic Arabic Corpus Morphology v0.4, mustafa0x Arapça sürümü; GPL.", gloss: "İngilizce anlam", translation: "Meal", rootTitle: "Kur’an kökü {root} – {count} kullanım | quranm", rootDesc: "Arapça {root} kökü Kur’an’da {count} kez geçer; türemiş kelimeler ve ayetler.", indexTitle: "Kur’an kökleri – Arapça kökler ve ayetler | quranm" },
  ar: { roots: "جذور القرآن", rootsIntro: "الجذور العربية الواردة في القرآن مع مشتقاتها وآياتها.", root: "الجذر", occurrences: "المواضع", lemmas: "المفردات المشتقة", ayahs: "الآيات", page: "صفحة", prev: "الصفحة السابقة", next: "الصفحة التالية", source: "مصدر الصرف: Quranic Arabic Corpus Morphology v0.4، النسخة العربية من mustafa0x؛ GPL.", gloss: "المعنى بالإنجليزية", translation: "الترجمة", rootTitle: "جذر القرآن {root} – {count} موضعًا | quranm", rootDesc: "يرد الجذر العربي {root} في القرآن {count} مرة مع مشتقاته وآياته.", indexTitle: "جذور القرآن – الجذور العربية والآيات | quranm" },
};
for (const c of ["ur", "id", "fr", "es"]) UI[c] = UI.en;
const pageUrl = (c, slug, p = 1) => `/${c}/root/${slug}/${p > 1 ? `${p}/` : ""}`;
const indexUrl = (c) => `/${c}/roots/`;
const t = (c, key) => (UI[c] || UI.en)[key] || UI.en[key];
const fmt = (s, values) => String(s).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
export default {
  name: "words",
  async route({ ctx, m, lang, c, seg, H }) {
    if (!LANGS.has(c)) return null;
    const index = await H.fetchAsset(ctx, "/seo-data/words/index.json");
    if (!index) return null;
    const roots = JSON.parse(index);
    if (seg.length === 2 && seg[1] === "roots") {
      const items = roots.map((r) => `<li><a href="${pageUrl(c, r.slug)}"><span lang="ar" dir="rtl">${H.esc(r.root)}</span><small>${r.count} ${H.esc(t(c, "occurrences"))}</small></a></li>`).join("");
      const body = `<h1>${H.esc(t(c, "roots"))}</h1><p class="lead">${H.esc(t(c, "rootsIntro"))}</p><ol class="surahs">${items}</ol>`;
      return H.layout({ m, lang, L: H.strings(c), body, title: t(c, "indexTitle"), desc: t(c, "rootsIntro"), path: indexUrl(c), altPath: indexUrl, crumbs: [["quranm", "/"], [lang.native, `/${c}/`], [t(c, "roots"), indexUrl(c)]], hasArabic: true });
    }
    if (seg[1] !== "root" || (seg.length !== 3 && seg.length !== 4)) return null;
    const slug = seg[2];
    const rootText = await H.fetchAsset(ctx, `/seo-data/words/roots/${slug}.json`);
    if (!rootText) return null;
    const root = JSON.parse(rootText);
    if (slug !== root.slug) return { redirect: pageUrl(c, root.slug) };
    if (seg.length === 4 && !/^[1-9]\d*$/.test(seg[3])) return null;
    const p = seg.length === 4 ? Number(seg[3]) : 1;
    if (p < 1 || p > root.pages) return null;
    if (p === 1 && seg.length === 4) return { redirect: pageUrl(c, slug) };
    const [arabicPage, languagePage] = await Promise.all([
      H.line(ctx, "/seo-data/words/ar.txt", root.offsets.ar + p - 1),
      c === "ar" ? null : H.line(ctx, `/seo-data/words/${c}.txt`, root.offsets[c] + p - 1),
    ]);
    if (!arabicPage || (c !== "ar" && !languagePage)) return null;
    const items = arabicPage.map((x, i) => {
      const tr = c === "ar" ? "" : languagePage[i].translation;
      const marked = new Set(x.w);
      return `<article class="ay"><a class="ref" href="/${c}/${x.s}/${x.a}/">${x.s}:${x.a}</a><p class="ar" lang="ar" dir="rtl">${x.tokens.map((word, wi) => marked.has(wi + 1) ? `<b>${H.esc(word)}</b>` : H.esc(word)).join(" ")}</p>${tr ? `<p class="tr">${H.esc(tr)}</p>` : ""}</article>`;
    }).join("");
    const pager = root.pages > 1 ? `<nav class="pager"><span>${p > 1 ? `<a rel="prev" href="${pageUrl(c, slug, p - 1)}">‹ ${H.esc(t(c, "prev"))}</a>` : ""}</span><span>${p < root.pages ? `<a rel="next" href="${pageUrl(c, slug, p + 1)}">${H.esc(t(c, "next"))} ›</a>` : ""}</span></nav>` : "";
    const lemmas = root.lemmas.map((l) => `<li lang="ar" dir="rtl"><b>${H.esc(l.lemma)}</b>${l.gloss ? ` <span dir="ltr">— ${H.esc(l.gloss)}</span>` : ""}</li>`).join("");
    const body = `<h1>${H.esc(t(c, "root"))} <span class="h1ar" lang="ar" dir="rtl">${H.esc(root.root)}</span></h1><dl class="info"><div><dt>${H.esc(t(c, "occurrences"))}</dt><dd>${root.count}</dd></div><div><dt>${H.esc(t(c, "page"))}</dt><dd>${p} / ${root.pages}</dd></div></dl><section><h2>${H.esc(t(c, "lemmas"))}</h2><ul>${lemmas}</ul></section><section><h2>${H.esc(t(c, "ayahs"))}</h2>${items}</section>${pager}<p class="note">${H.esc(t(c, "source"))}</p>`;
    return H.layout({ m, lang, L: H.strings(c), body, title: fmt(t(c, "rootTitle"), { root: root.root, count: root.count }), desc: fmt(t(c, "rootDesc"), { root: root.root, count: root.count }), ogType: "article", path: pageUrl(c, slug, p), altPath: (code) => LANGS.has(code) ? pageUrl(code, slug, p) : pageUrl("en", slug, p), crumbs: [["quranm", "/"], [lang.native, `/${c}/`], [t(c, "roots"), indexUrl(c)], [root.root, pageUrl(c, slug)]], hasArabic: true });
  },
  urls(m, l) {
    if (!LANGS.has(l.code)) return [];
    return [indexUrl(l.code), ...(m.words || []).flatMap((r) => [pageUrl(l.code, r.slug), ...Array.from({ length: r.pages - 1 }, (_, i) => pageUrl(l.code, r.slug, i + 2))])];
  },
};
