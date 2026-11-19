const UI = {
  en: { juz: "Juz", hizb: "Hizb", page: "Mushaf page", index: "Juz index", range: "Range", surahs: "Surahs covered", reader: "Read from the start", from: "from", to: "to", prev: "Previous", next: "Next", arabic: "Arabic", translation: "Translation" },
  de: { juz: "Dschuz", hizb: "Hizb", page: "Mushaf-Seite", index: "Dschuz-Übersicht", range: "Bereich", surahs: "Enthaltene Suren", reader: "Ab hier lesen", from: "von", to: "bis", prev: "Zurück", next: "Weiter", arabic: "Arabisch", translation: "Übersetzung" },
  ar: { juz: "الجزء", hizb: "الحزب", page: "صفحة المصحف", index: "فهرس الأجزاء", range: "النطاق", surahs: "السور المشمولة", reader: "اقرأ من البداية", from: "من", to: "إلى", prev: "السابق", next: "التالي", arabic: "العربية", translation: "الترجمة" },
  tr: { juz: "Cüz", hizb: "Hizip", page: "Mushaf sayfası", index: "Cüz dizini", range: "Aralık", surahs: "Kapsanan sureler", reader: "Başlangıçtan oku", from: "", to: "", prev: "Önceki", next: "Sonraki", arabic: "Arapça", translation: "Çeviri" },
  ur: { juz: "پارہ", hizb: "حزب", page: "مصحف صفحہ", index: "پارہ فہرست", range: "حدود", surahs: "شامل سورتیں", reader: "ابتدا سے پڑھیں", from: "سے", to: "تک", prev: "پچھلا", next: "اگلا", arabic: "عربی", translation: "ترجمہ" },
};

const labels = (code) => UI[code] || UI.en;
const pathFor = (c, type, n = "") => `/${c}/${type}/${n ? `${n}/` : ""}`;
const parseRef = (ref) => ref.split(":").map(Number);

async function data(ctx, H, type, n) {
  return H.line(ctx, `/seo-data/juz/${type}.txt`, n - 1);
}
async function allText(ctx, H, refs, lang) {
  const bySurah = new Map();
  for (const ref of refs) {
    const [s] = parseRef(ref);
    if (!bySurah.has(s)) bySurah.set(s, { ar: await H.lines(ctx, `/seo-data/q/${s}.txt`), tr: lang.tr.length ? await H.lines(ctx, `/seo-data/t/${lang.code}/${s}.txt`) : null });
  }
  return refs.map((ref) => {
    const [s, a] = parseRef(ref);
    const files = bySurah.get(s);
    const ar = files.ar && JSON.parse(files.ar[0])[a - 1];
    let tr = null;
    if (files.tr) {
      const first = JSON.parse(files.tr[0]);
      const line = files.tr[a] && JSON.parse(files.tr[a]);
      tr = Array.isArray(first) ? first[a - 1] : line?.[0];
    }
    return { ref, ar, tr };
  });
}

function rangeText(seg, L) {
  return `${L.from} ${seg.start} ${L.to} ${seg.end}`.trim();
}
function surahList(m, lang, H, nums) {
  return nums.map((n) => {
    const s = m.surahs[n - 1];
    return `<a href="${H.P.surah(lang.code, s)}">${H.esc(H.surahName(m, lang.code, s))}</a>`;
  }).join(", ");
}
function pager(H, lang, type, n, max, L) {
  return `<nav class="pn" aria-label="${H.esc(L[type])}">${n > 1 ? `<a rel="prev" href="${pathFor(lang.code, type, n - 1)}">‹ ${H.esc(L.prev)}</a>` : "<span></span>"}${n < max ? `<a rel="next" href="${pathFor(lang.code, type, n + 1)}">${H.esc(L.next)} ›</a>` : ""}</nav>`;
}

async function detail({ ctx, m, lang, L, H, type, n, max }) {
  const seg = await data(ctx, H, type, n);
  if (!seg || n < 1 || n > max) return null;
  const [startS, startA] = parseRef(seg.start);
  const texts = await allText(ctx, H, seg.refs, lang);
  const tooLong = seg.count > 300;
  const trDir = lang.tr[0]?.d || lang.dir;
  const items = texts.map((v) => {
    const [s, a] = parseRef(v.ref);
    const link = `<a class="ref" href="${H.P.ayah(lang.code, s, a)}">${v.ref}</a>`;
    return `<article class="ay"><div>${link}</div><p class="ar" lang="ar" dir="rtl">${H.esc(v.ar || "")}</p>${!tooLong && v.tr ? `<p class="tr" dir="${trDir}">${H.esc(v.tr)}</p>` : ""}</article>`;
  }).join("");
  const s = m.surahs[startS - 1];
  const kind = L[type];
  const name = type === "juz" ? ` <span class="h1ar" lang="ar" dir="rtl">${H.esc(seg.name)}</span>` : "";
  const body = `<h1>${H.esc(kind)} ${n}${name}</h1><dl class="info"><div><dt>${H.esc(L.range)}</dt><dd>${H.esc(rangeText(seg, L))}</dd></div><div><dt>${H.esc(L.surahs)}</dt><dd>${surahList(m, lang, H, seg.surahs)}</dd></div><div><dt>${H.esc(L.arabic)}</dt><dd>${seg.count} ${H.esc(L.translation)}</dd></div></dl><p class="actions">${H.readerBtn(L, startS, startA)}</p>${tooLong ? `<p class="note">${H.esc(L.arabic)} · ${seg.count}</p>` : ""}<div class="ayahs">${items}</div>${pager(H, lang, type, n, max, L)}`;
  const path = pathFor(lang.code, type, n);
  return H.layout({ m, lang, L, body, title: `${kind} ${n} | quranm`, desc: `${kind} ${n}: ${rangeText(seg, L)}.`, path, altPath: (c) => pathFor(c, type, n), crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [kind, pathFor(lang.code, type)], [`${kind} ${n}`, path]] });
}

export default {
  name: "juz",
  async route({ ctx, m, lang, L, H, seg }) {
    const type = ["juz", "hizb", "page"].includes(seg[1]) ? seg[1] : null;
    if (!type) return null;
    const max = type === "juz" ? 30 : type === "hizb" ? 60 : 604;
    if (seg.length === 2 && type === "juz") {
      const rows = [];
      for (let n = 1; n <= 30; n++) { const d = await data(ctx, H, "juz", n); rows.push(`<li><a href="${pathFor(lang.code, "juz", n)}"><b>${n}</b> ${H.esc(d.start)}–${H.esc(d.end)}</a></li>`); }
      const x = labels(lang.code);
      const body = `<h1>${H.esc(x.index)}</h1><ol class="surahs">${rows.join("")}</ol>`;
      return H.layout({ m, lang, L, body, title: `${x.index} | quranm`, desc: `${x.index} 1–30.`, path: pathFor(lang.code, "juz"), altPath: (c) => pathFor(c, "juz"), crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [x.index, pathFor(lang.code, "juz")]] });
    }
    if (seg.length !== 3 || !/^\d+$/.test(seg[2])) return null;
    const n = Number(seg[2]);
    return detail({ ctx, m, lang, L: { ...labels(lang.code), ...L }, H, type, n, max });
  },
  urls(m, l) {
    const c = l.code;
    return [pathFor(c, "juz"), ...Array.from({ length: 30 }, (_, i) => pathFor(c, "juz", i + 1)), ...Array.from({ length: 60 }, (_, i) => pathFor(c, "hizb", i + 1)), ...Array.from({ length: 604 }, (_, i) => pathFor(c, "page", i + 1))];
  },
};
