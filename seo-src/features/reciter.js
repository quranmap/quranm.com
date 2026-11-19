const RECITER_ROOT = "/reciter/";

const UI = {
  en: {
    reciter: "Reciter", reciters: "Reciters", listen: "Listen", listenTo: "Listen to {name}",
    hubTitle: "{name} Quran recitation – all surahs | quranm",
    hubDesc: "Listen to all 114 Quran surahs recited by {name}{style}.",
    hubIntro: "{name}{style}. Listen to all 114 surahs with Arabic text and translation.",
    pageTitle: "Surah {name} ({n}) recited by {reciter} – listen online | quranm",
    pageDesc: "Listen to Surah {name} ({n}) recited by {reciter}, with Arabic text and {lang} translation.",
    other: "This surah by other reciters", surah: "Surah", reader: "Open in Quran reader",
  },
  de: {
    reciter: "Rezitator", reciters: "Rezitatoren", listen: "Anhören", listenTo: "{name} anhören",
    hubTitle: "Quran-Rezitation von {name} – alle Suren | quranm",
    hubDesc: "Alle 114 Suren des Qurans, rezitiert von {name}{style}.",
    hubIntro: "{name}{style}. Alle 114 Suren mit arabischem Text und Übersetzung anhören.",
    pageTitle: "Sure {name} ({n}), rezitiert von {reciter} – online anhören | quranm",
    pageDesc: "Sure {name} ({n}), rezitiert von {reciter}, mit arabischem Text und deutscher Übersetzung.",
    other: "Diese Sure mit anderen Rezitatoren", surah: "Sure", reader: "Im Quran-Reader öffnen",
  },
  ar: {
    reciter: "القارئ", reciters: "القراء", listen: "استمع", listenTo: "استمع إلى {name}",
    hubTitle: "تلاوة القرآن بصوت {name} – جميع السور | quranm",
    hubDesc: "استمع إلى جميع سور القرآن البالغ عددها 114 بصوت {name}{style}.",
    hubIntro: "{name}{style}. استمع إلى جميع السور مع النص العربي والترجمة.",
    pageTitle: "سورة {name} ({n}) بصوت {reciter} – استمع عبر الإنترنت | quranm",
    pageDesc: "استمع إلى سورة {name} ({n}) بصوت {reciter} مع النص العربي والترجمة.",
    other: "هذه السورة بصوت قراء آخرين", surah: "سورة", reader: "افتح في قارئ القرآن",
  },
  ur: {
    reciter: "قاری", reciters: "قراء", listen: "سنیں", listenTo: "{name} سنیں",
    hubTitle: "{name} کی قرآن تلاوت – تمام سورتیں | quranm",
    hubDesc: "{name}{style} کی آواز میں قرآن کی تمام 114 سورتیں سنیں۔",
    hubIntro: "{name}{style}۔ عربی متن اور ترجمے کے ساتھ تمام 114 سورتیں سنیں۔",
    pageTitle: "سورۃ {name} ({n})، {reciter} کی تلاوت – آن لائن سنیں | quranm",
    pageDesc: "سورۃ {name} ({n})، {reciter} کی تلاوت، عربی متن اور اردو ترجمے کے ساتھ۔",
    other: "یہ سورۃ دیگر قراء کی آواز میں", surah: "سورۃ", reader: "قرآن ریڈر میں کھولیں",
  },
  tr: {
    reciter: "Kâri", reciters: "Kâriler", listen: "Dinle", listenTo: "{name} dinle",
    hubTitle: "{name} Kur'an tilaveti – tüm sureler | quranm",
    hubDesc: "{name}{style} tarafından okunan 114 Kur'an suresini dinleyin.",
    hubIntro: "{name}{style}. Arapça metin ve meal ile 114 surenin tamamını dinleyin.",
    pageTitle: "{name} Suresi ({n}), {reciter} tarafından okundu – çevrim içi dinle | quranm",
    pageDesc: "{name} Suresi'ni ({n}) {reciter} tilavetiyle, Arapça metin ve Türkçe meal ile dinleyin.",
    other: "Bu sureyi diğer kârilerden dinleyin", surah: "Sure", reader: "Kuran okuyucuda aç",
  },
};

const text = (code, key) => (UI[code] || UI.en)[key] || UI.en[key];
const fmt = (template, vars) => template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
const pad3 = (n) => String(n).padStart(3, "0");
const pathHub = (c, r) => `/${c}${RECITER_ROOT}${r.slug}/`;
const pathPage = (c, r, s) => `/${c}${RECITER_ROOT}${r.slug}/${s.n}-${s.slug}/`;
const audioUrl = (H, r, s, a) => {
  const index = s.n === 1 ? a - 1 : a;
  return `${H.AUDIO}${RECITER_ROOT}${encodeURIComponent(r.folder)}/${pad3(s.n)}/${pad3(s.n)}${pad3(index)}.mp3`;
};

async function reciterData(ctx, H) {
  const raw = await H.fetchAsset(ctx, "/seo-data/reciter/reciters.json");
  return raw ? JSON.parse(raw) : null;
}

async function defaultTranslation(ctx, H, code, s) {
  const rows = await H.lines(ctx, `/seo-data/t/${code}/${s.n}.txt`);
  if (!rows) return null;
  const first = JSON.parse(rows[0]);
  if (Array.isArray(first)) return first;
  return Array.from({ length: s.ayahs }, (_, i) => JSON.parse(rows[i + 1])[0]);
}

function styleText(r) {
  // The display name copied from app.js already includes the parenthesized style.
  return "";
}

function reciterLabel(r, H) {
  const base = String(r.name).split(" (")[0];
  return r.style ? `${base} (${r.style})` : base;
}

async function hub({ ctx, m, lang, L, H, r, all }) {
  const style = styleText(r);
  const rows = m.surahs.map((s) => `<li><a href="${pathPage(lang.code, r, s)}"><span class="no">${s.n}</span><span class="nm"><b>${H.esc(H.surahName(m, lang.code, s))}</b><small>${H.esc(H.fmt(L.ayahCount, { n: s.ayahs }))}</small></span><span class="arn" lang="ar" dir="rtl">${H.esc(s.ar)}</span></a></li>`).join("");
  const name = reciterLabel(r, H);
  const body = `<h1>${H.esc(name)}</h1><p class="lead">${H.esc(fmt(text(lang.code, "hubIntro"), { name: r.name, style }))}</p><ol class="surahs">${rows}</ol>`;
  return H.layout({
    m, lang, L, body, hasArabic: false,
    title: fmt(text(lang.code, "hubTitle"), { name }),
    desc: fmt(text(lang.code, "hubDesc"), { name: r.name, style }),
    path: pathHub(lang.code, r), altPath: (c) => pathHub(c, r),
    crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [name, pathHub(lang.code, r)]],
  });
}

async function page({ ctx, m, lang, L, H, r, s, all }) {
  const [ar, tr] = await Promise.all([
    H.line(ctx, `/seo-data/q/${s.n}.txt`, 0),
    lang.tr.length ? defaultTranslation(ctx, H, lang.code, s) : null,
  ]);
  if (!ar) return null;
  const name = H.surahName(m, lang.code, s);
  const reciter = reciterLabel(r, H);
  const trDir = lang.tr[0]?.d || lang.dir;
  const items = ar.map((t, i) => {
    const a = i + 1;
    return `<article class="ay" id="a${a}"><a class="ref" href="${H.P.ayah(lang.code, s.n, a)}">${s.n}:${a}</a><p class="ar" lang="ar" dir="rtl">${H.esc(t)} <span class="end">۝${String(a)}۞</span></p><audio controls preload="none" src="${audioUrl(H, r, s, a)}" aria-label="${H.esc(fmt(text(lang.code, "listenTo"), { name: reciter }))}"></audio>${tr && tr[i] ? `<p class="tr" dir="${trDir}">${H.esc(tr[i])}</p>` : ""}</article>`;
  }).join("");
  const other = all.filter((x) => x.slug !== r.slug).map((x) => `<a class="chip" href="${pathPage(lang.code, x, s)}">${H.esc(reciterLabel(x, H))}</a>`).join("");
  const body = `<h1>${H.esc(fmt(text(lang.code, "pageTitle"), { name, n: s.n, reciter }).replace(/\s–.*$/, ""))}</h1><p class="lead">${H.esc(fmt(text(lang.code, "listenTo"), { name: reciter }))}</p><p class="actions"><a class="btn primary" href="${H.P.surah(lang.code, s)}">${H.esc(fmt(text(lang.code, "surah"), {}))}</a> ${H.readerBtn(L, s.n, 1)}</p><div class="ayahs">${items}</div><section><h2>${H.esc(text(lang.code, "other"))}</h2><div class="chips">${other}</div></section>`;
  return H.layout({
    m, lang, L, body, ogType: "article",
    title: fmt(text(lang.code, "pageTitle"), { name, n: s.n, reciter }),
    desc: fmt(text(lang.code, "pageDesc"), { name, n: s.n, reciter, lang: H.langLabel(L, lang) }),
    path: pathPage(lang.code, r, s), altPath: (c) => pathPage(c, r, s),
    crumbs: [["quranm", "/"], [lang.native, H.P.hub(lang.code)], [reciter, pathHub(lang.code, r)], [`${text(lang.code, "surah")} ${name}`, pathPage(lang.code, r, s)]],
    jsonld: [{ "@context": "https://schema.org", "@type": "AudioObject", name: `${text(lang.code, "surah")} ${name} – ${reciter}`, inLanguage: lang.code, url: H.SITE + pathPage(lang.code, r, s) }],
  });
}

export default {
  name: "reciter",
  async route({ ctx, m, lang, L, seg, H }) {
    if (seg[1] !== "reciter" || (seg.length !== 3 && seg.length !== 4)) return null;
    const all = await reciterData(ctx, H);
    const r = all?.find((x) => x.slug === seg[2]);
    if (!r) return null;
    if (seg.length === 3) return hub({ ctx, m, lang, L, H, r, all });
    const match = seg[3].match(/^(\d{1,3})-([a-z0-9-]+)$/);
    const s = match && m.surahs[Number(match[1]) - 1];
    if (!s || String(s.n) !== match[1]) return null;
    if (match[2] !== s.slug) return { redirect: pathPage(lang.code, r, s) };
    return page({ ctx, m, lang, L, H, r, s, all });
  },
  urls(m, l) {
    const all = [
      ["alafasy", "Mishari Rashid al Afasy", "Mishari Rashid al Afasy"],
      ["abdulbaset_abdulsamad_murattal", "Abdulbaset Abdulsamad (Murattal)", "Abdulbaset Abdulsamad Murattal"],
      ["abdulbaset_abdulsamad_mujawwad", "Abdulbaset Abdulsamad (Mujawwad)", "Abdulbaset Abdulsamad Mujawwad"],
      ["abdur_rahman_as_sudais", "Abdur Rahman as Sudais", "Abdur Rahman as Sudais"],
      ["abu_bakr_al_shatri", "Abu Bakr al Shatri", "Abu Bakr al Shatri"],
      ["hani_ar_rifai", "Hani ar Rifai", "Hani ar Rifai"],
      ["mohamed_siddiq_al_minshawi_mujawwad", "Mohamed Siddiq al Minshawi (Mujawwad)", "Mohamed Siddiq al Minshawi Mujawwad"],
      ["mohamed_siddiq_al_minshawi_murattal", "Mohamed Siddiq al Minshawi (Murattal)", "Mohamed Siddiq al Minshawi Murattal"],
      ["saud_ash_shuraym", "Saud ash Shuraym", "Saud ash Shuraym"],
    ].map(([slug, name, folder]) => ({ slug, name, folder }));
    return all.flatMap((r) => [pathHub(l.code, r), ...m.surahs.map((s) => pathPage(l.code, r, s))]);
  },
};
