// Server-side rendered SEO pages for quranm.com (Cloudflare Pages Functions).
// Routes (all lowercase, trailing slash):
//   /<lang>/                      language hub (114 surahs + topics)
//   /<lang>/surah/<n>-<slug>/      full surah
//   /<lang>/<s>/<a>/               single ayah
//   /<lang>/topic/<slug>/[<p>/]    ruqyah topic (paginated)
//   /sitemap.xml, /sitemaps/<lang>-1.xml
import { strings, fmt, ARABIC_SCRIPT_UI } from "./i18n.js";
import { CSS } from "./style.js";
import { FEATURES } from "./features/index.js";

const SITE = "https://quranm.com";
const CODE_VERSION = "7";
const AUDIO = "https://audio.quranm.com";
const RECITER = "Mishari%20Rashid%20al%20Afasy";
const TOPIC_PAGE = 50;
const HTML_CACHE = "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400";

// ---------------------------------------------------------------- data
let META = null; // parsed meta + indices
const LINES = new Map(); // path -> string[] (LRU)
let LINES_CHARS = 0;
const LINES_MAX_CHARS = 24_000_000;

async function fetchAsset(ctx, path) {
  const res = await ctx.env.ASSETS.fetch(new Request(new URL(path, ctx.request.url)));
  if (!res.ok) return null;
  const text = await res.text();
  // Pages falls back to index.html (SPA) for missing files -> treat HTML as "missing".
  if (text.startsWith("<")) return null;
  return text;
}

async function meta(ctx) {
  if (META) return META;
  const text = await fetchAsset(ctx, "/seo-data/meta.json");
  if (!text) throw new Error("seo-data/meta.json missing");
  const m = JSON.parse(text);
  m.langByCode = new Map(m.langs.map((l) => [l.code, l]));
  m.themeBySlug = new Map(m.themes.map((t, i) => [t.slug, i]));
  m.themePos = m.themes.map((t) => new Map(t.refs.map((r, i) => [r, i])));
  META = m;
  return m;
}

async function lines(ctx, path) {
  const hit = LINES.get(path);
  if (hit) { LINES.delete(path); LINES.set(path, hit); return hit; }
  const text = await fetchAsset(ctx, path);
  if (text == null) return null;
  const arr = text.split("\n");
  LINES.set(path, arr);
  LINES_CHARS += text.length;
  while (LINES_CHARS > LINES_MAX_CHARS && LINES.size > 1) {
    const [k, v] = LINES.entries().next().value;
    LINES.delete(k);
    LINES_CHARS -= v.reduce((n, s) => n + s.length + 1, 0);
  }
  return arr;
}

async function line(ctx, path, i) {
  const arr = await lines(ctx, path);
  if (!arr || arr[i] == null || arr[i] === "") return null;
  return JSON.parse(arr[i]);
}

// Default translation for every ayah of a surah (line 0, or derived from ayah lines).
async function surahDefault(ctx, code, s, count) {
  const arr = await lines(ctx, `/seo-data/t/${code}/${s}.txt`);
  if (!arr) return null;
  const first = JSON.parse(arr[0]);
  if (Array.isArray(first)) return first;
  const out = [];
  for (let a = 1; a <= count; a++) out.push(JSON.parse(arr[a])[0]);
  return out;
}

// ---------------------------------------------------------------- helpers
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const arNum = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
const pad3 = (n) => String(n).padStart(3, "0");
const ayahAudio = (s, a) => `${AUDIO}/reciter/${RECITER}/${pad3(s)}/${pad3(s)}${pad3(s === 1 ? a - 1 : a)}.mp3`;
const snippet = (t, n = 155) => {
  t = String(t || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), n - 20)).replace(/[\s,;:.–-]+$/, "") + "…";
};

const P = {
  hub: (c) => `/${c}/`,
  surah: (c, s) => `/${c}/surah/${s.n}-${s.slug}/`,
  ayah: (c, s, a) => `/${c}/${s}/${a}/`,
  topic: (c, t, p = 1) => `/${c}/topic/${t.slug}/${p > 1 ? p + "/" : ""}`,
};

function surahName(m, code, s) {
  return ARABIC_SCRIPT_UI.has(code) ? s.ar : s.tr;
}
function surahMeaning(code, s) {
  return s.meanings?.[code] || (code === "en" ? s.en : code === "de" ? s.de : "");
}
function themeTitle(code, t) {
  return t.titles?.[code] || (code === "en" ? t.en : code === "de" ? t.de : `${strings(code).topics} · ${code}`);
}
function langLabel(L, lang) {
  return L.langName || lang.name;
}
const topicPages = (t) => Math.ceil(t.refs.length / TOPIC_PAGE);

// ---------------------------------------------------------------- layout
function layout({ m, lang, L, title, desc, path, altPath, crumbs, body, jsonld = [], prev, next, ogType = "website", hasArabic = true }) {
  const canonical = SITE + path;
  const alts = m.langs
    .filter((l) => l.hreflang)
    .map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${SITE}${altPath(l.code)}">`)
    .join("");
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: SITE + c[1] })),
  };
  const ld = [crumbLd, ...jsonld].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("");
  const crumbHtml = crumbs
    .map((c, i) => (i === crumbs.length - 1 ? `<span aria-current="page">${esc(c[0])}</span>` : `<a href="${c[1]}">${esc(c[0])}</a>`))
    .join(`<span class="sep" aria-hidden="true">›</span>`);
  const langLinks = m.langs
    .map((l) => `<a href="${altPath(l.code)}" hreflang="${l.hreflang || l.code}" lang="${l.code}"${l.code === lang.code ? ' aria-current="true"' : ""}>${esc(l.native)}</a>`)
    .join("");
  return `<!doctype html>
<html lang="${lang.code}" dir="${lang.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${alts}<link rel="alternate" hreflang="x-default" href="${SITE}${altPath("en")}">
${prev ? `<link rel="prev" href="${SITE}${prev}">` : ""}${next ? `<link rel="next" href="${SITE}${next}">` : ""}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="quranm">
<meta property="og:title" content="${esc(title.replace(/ \| quranm$/, ""))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0C1626" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F6F8FC" media="(prefers-color-scheme: light)">
${hasArabic ? `<link rel="preload" href="/Uthmani.woff2" as="font" type="font/woff2" crossorigin>` : ""}
<style>${CSS}</style>
${ld}
</head>
<body>
<header class="top"><a class="brand" href="/${lang.code}/">quranm</a><a class="reader" href="/">${esc(L.openReader)}</a></header>
<nav class="crumbs" aria-label="Breadcrumb">${crumbHtml}</nav>
<main>
${body}
</main>
<footer>
<details class="langs"><summary>${esc(L.languages)} · ${esc(lang.native)}</summary><div class="langlist">${langLinks}</div></details>
<p><a href="/${lang.code}/">${esc(L.allSurahs)}</a> · <a href="/">quranm.com</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/${lang.code}/widget/">Widget</a> · <a href="/impressum/" rel="nofollow">Impressum</a> · <a href="/datenschutz/" rel="nofollow">Datenschutz</a></p>
</footer>
</body>
</html>`;
}

function readerBtn(L, s, a) {
  return `<a class="btn primary" href="/#/${s}:${a}">${esc(L.openReader)}</a>`;
}

// ---------------------------------------------------------------- pages
async function pageHub(ctx, m, lang, L) {
  const lname = langLabel(L, lang);
  const rows = m.surahs
    .map((s) => {
      const meaning = surahMeaning(lang.code, s);
      return `<li><a href="${P.surah(lang.code, s)}"><span class="no">${s.n}</span><span class="nm"><b>${esc(ARABIC_SCRIPT_UI.has(lang.code) ? s.ar : s.tr)}</b>${meaning ? `<small>${esc(meaning)}</small>` : ""}<small>${esc(fmt(L.ayahCount, { n: s.ayahs }))} · ${esc(s.place === "D" ? L.medinan : L.meccan)}</small></span><span class="arn" lang="ar" dir="rtl">${esc(s.ar)}</span></a></li>`;
    })
    .join("");
  const topics = m.themes.map((t) => `<a class="chip" href="${P.topic(lang.code, t)}">${esc(themeTitle(lang.code, t))}</a>`).join("");
  const body = `<h1>${esc(fmt(L.hubH1, { lang: lname }))}</h1>
<p class="lead">${esc(fmt(L.hubIntro, { lang: lname }))}</p>
<ol class="surahs">${rows}</ol>
<section><h2>${esc(L.topics)}</h2><div class="chips">${topics}</div></section>`;
  return layout({
    m, lang, L, body, hasArabic: false,
    title: fmt(L.hubTitle, { lang: lname }),
    desc: fmt(L.hubDesc, { lang: lname }),
    path: P.hub(lang.code),
    altPath: (c) => P.hub(c),
    crumbs: [["quranm", "/"], [lang.native, P.hub(lang.code)]],
  });
}

async function pageSurah(ctx, m, lang, L, s) {
  const lname = langLabel(L, lang);
  const ar = await line(ctx, `/seo-data/q/${s.n}.txt`, 0);
  const tr = lang.tr.length ? await surahDefault(ctx, lang.code, s.n, s.ayahs) : null;
  if (!ar) return null;
  const name = surahName(m, lang.code, s);
  const meaning = surahMeaning(lang.code, s);
  const place = s.place === "D" ? L.medinan : L.meccan;
  const trDir = lang.tr[0]?.d || lang.dir;
  const items = ar
    .map((t, i) => {
      const a = i + 1;
      return `<article class="ay" id="a${a}"><a class="ref" href="${P.ayah(lang.code, s.n, a)}">${s.n}:${a}</a><p class="ar" lang="ar" dir="rtl">${esc(t)} <span class="end">﴿${arNum(a)}﴾</span></p>${tr && tr[i] ? `<p class="tr" dir="${trDir}">${esc(tr[i])}</p>` : ""}</article>`;
    })
    .join("");
  const prevS = m.surahs[s.n - 2], nextS = m.surahs[s.n];
  const basmala = s.n !== 1 && s.n !== 9 ? `<p class="basmala" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>` : "";
  const body = `<h1>${esc(L.surah)} ${esc(name)}${name !== s.ar ? ` <span class="h1ar" lang="ar" dir="rtl">${esc(s.ar)}</span>` : ""}</h1>
<dl class="info">
<div><dt>${esc(L.number)}</dt><dd>${s.n}</dd></div>
${meaning ? `<div><dt>${esc(L.meaning)}</dt><dd>${esc(meaning)}</dd></div>` : ""}
<div><dt>${esc(L.revelation)}</dt><dd>${esc(place)}</dd></div>
<div><dt>${esc(L.ayahs)}</dt><dd>${s.ayahs}</dd></div>
${tr ? `<div><dt>${esc(L.translation)}</dt><dd>${esc(lang.tr[0].n)}</dd></div>` : ""}
</dl>
<p class="actions">${readerBtn(L, s.n, 1)}</p>
${basmala}
<div class="ayahs">${items}</div>
<nav class="pn">${prevS ? `<a rel="prev" href="${P.surah(lang.code, prevS)}">‹ ${esc(L.prevSurah)}: ${esc(surahName(m, lang.code, prevS))}</a>` : "<span></span>"}${nextS ? `<a rel="next" href="${P.surah(lang.code, nextS)}">${esc(L.nextSurah)}: ${esc(surahName(m, lang.code, nextS))} ›</a>` : ""}</nav>`;
  const desc = fmt(L.surahDesc, { name, n: s.n, count: s.ayahs, place, lang: lname });
  const title = fmt(L.surahTitle, { name, n: s.n, lang: lname });
  return layout({
    m, lang, L, body, title, desc, ogType: "article",
    path: P.surah(lang.code, s),
    altPath: (c) => P.surah(c, s),
    crumbs: [["quranm", "/"], [lang.native, P.hub(lang.code)], [`${L.surah} ${name}`, P.surah(lang.code, s)]],
    jsonld: [{
      "@context": "https://schema.org", "@type": "Chapter", name: `${L.surah} ${name}`, alternateName: s.ar,
      position: s.n, inLanguage: lang.code, url: SITE + P.surah(lang.code, s),
      isPartOf: { "@type": "Book", name: "The Holy Quran", alternateName: "القرآن الكريم" },
    }],
  });
}

async function pageAyah(ctx, m, lang, L, s, a) {
  const lname = langLabel(L, lang);
  const [arAll, words, trs] = await Promise.all([
    line(ctx, `/seo-data/q/${s.n}.txt`, 0),
    lang.code === "en" || lang.code === "de" ? line(ctx, `/seo-data/q/${s.n}.txt`, a) : null,
    lang.tr.length ? line(ctx, `/seo-data/t/${lang.code}/${s.n}.txt`, a) : null,
  ]);
  if (!arAll) return null;
  const arText = arAll[a - 1];
  const ref = `${s.n}:${a}`;
  const name = surahName(m, lang.code, s);
  const famous = m.ayahNames[ref];
  const famousName = famous ? (ARABIC_SCRIPT_UI.has(lang.code) ? famous[1] : famous[0]) : "";
  const translations = (trs || []).map((t, i) => [t, lang.tr[i]]).filter(([t]) => t);
  const trHtml = translations
    .map(([t, info]) => `<figure class="trn"><blockquote dir="${info.d}">${esc(t)}</blockquote><figcaption>— ${esc(info.n)}</figcaption></figure>`)
    .join("");
  const wbw = words && words.length
    ? `<section><h2>${esc(L.wbw)}</h2><p class="note">${esc(L.wbwNote)}</p><table class="wbw"><thead><tr><th>#</th><th>${esc(L.arabic)}</th><th>${esc(L.meaning)}</th></tr></thead><tbody>${words
        .map((w, i) => `<tr><td>${i + 1}</td><td class="ar" lang="ar" dir="rtl">${esc(w[0])}</td><td lang="en" dir="ltr">${esc(w[1])}</td></tr>`)
        .join("")}</tbody></table></section>`
    : "";
  const themeIdx = m.ayahThemes[ref] || [];
  const topics = themeIdx.length
    ? `<section><h2>${esc(L.ayahTopics)}</h2><div class="chips">${themeIdx
        .map((ti) => {
          const t = m.themes[ti];
          const pos = m.themePos[ti].get(ref);
          const p = Math.floor(pos / TOPIC_PAGE) + 1;
          return `<a class="chip" href="${P.topic(lang.code, t, p)}#a${s.n}-${a}">${esc(themeTitle(lang.code, t))}</a>`;
        })
        .join("")}</div></section>`
    : "";
  const prev = a > 1 ? [s.n, a - 1] : s.n > 1 ? [s.n - 1, m.surahs[s.n - 2].ayahs] : null;
  const next = a < s.ayahs ? [s.n, a + 1] : s.n < 114 ? [s.n + 1, 1] : null;
  const h1 = `${L.surah} ${name} ${ref}${famousName ? ` – ${famousName}` : ""}`;
  const body = `<h1>${esc(h1)}</h1>
<div class="ayahbox">
<p class="ar big" lang="ar" dir="rtl">${esc(arText)} <span class="end">﴿${arNum(a)}﴾</span></p>
<audio controls preload="none" src="${ayahAudio(s.n, a)}" aria-label="${esc(L.listen)}"></audio>
<p class="note">${esc(L.listen)}</p>
</div>
${trHtml ? `<section><h2>${esc(translations.length > 1 ? L.translations : L.translation)}</h2>${trHtml}</section>` : ""}
${wbw}
${topics}
<p class="actions">${readerBtn(L, s.n, a)} <a class="btn" href="${P.surah(lang.code, s)}#a${a}">${esc(L.readSurah)}</a></p>
<nav class="pn">${prev ? `<a rel="prev" href="${P.ayah(lang.code, prev[0], prev[1])}">‹ ${esc(L.prevAyah)} ${prev[0]}:${prev[1]}</a>` : "<span></span>"}${next ? `<a rel="next" href="${P.ayah(lang.code, next[0], next[1])}">${esc(L.nextAyah)} ${next[0]}:${next[1]} ›</a>` : ""}</nav>`;
  const title = fmt(L.ayahTitle, { name, ref, extra: famousName ? ` (${famousName})` : "", lang: lname });
  const desc = snippet(translations[0]?.[0] || arText);
  return layout({
    m, lang, L, body, title, desc, ogType: "article",
    path: P.ayah(lang.code, s.n, a),
    altPath: (c) => P.ayah(c, s.n, a),
    crumbs: [["quranm", "/"], [lang.native, P.hub(lang.code)], [`${L.surah} ${name}`, P.surah(lang.code, s)], [ref, P.ayah(lang.code, s.n, a)]],
    jsonld: [{
      "@context": "https://schema.org", "@type": "Quotation",
      name: h1, text: arText, inLanguage: "ar", url: SITE + P.ayah(lang.code, s.n, a),
      isPartOf: { "@type": "Chapter", name: `${L.surah} ${name}`, position: s.n, url: SITE + P.surah(lang.code, s),
        isPartOf: { "@type": "Book", name: "The Holy Quran", alternateName: "القرآن الكريم" } },
      ...(translations.length ? { workTranslation: translations.map(([t, info]) => ({ "@type": "CreativeWork", text: t, inLanguage: lang.hreflang || lang.code, translator: { "@type": "Person", name: info.n } })) } : {}),
    }],
  });
}

async function pageTopic(ctx, m, lang, L, ti, p) {
  const t = m.themes[ti];
  const pages = topicPages(t);
  if (p < 1 || p > pages) return null;
  const lname = langLabel(L, lang);
  const [arList, trList] = await Promise.all([
    line(ctx, "/seo-data/topic/ar.txt", ti),
    lang.tr.length ? line(ctx, `/seo-data/topic/${lang.code}.txt`, ti) : null,
  ]);
  if (!arList) return null;
  const topic = themeTitle(lang.code, t);
  const trDir = lang.tr[0]?.d || lang.dir;
  const from = (p - 1) * TOPIC_PAGE, to = Math.min(t.refs.length, from + TOPIC_PAGE);
  let items = "";
  for (let i = from; i < to; i++) {
    const [sn, an] = t.refs[i].split(":").map(Number);
    const s = m.surahs[sn - 1];
    items += `<article class="ay" id="a${sn}-${an}"><a class="ref" href="${P.ayah(lang.code, sn, an)}">${esc(surahName(m, lang.code, s))} ${sn}:${an}</a><p class="ar" lang="ar" dir="rtl">${esc(arList[i])} <span class="end">﴿${arNum(an)}﴾</span></p>${trList && trList[i] ? `<p class="tr" dir="${trDir}">${esc(trList[i])}</p>` : ""}</article>`;
  }
  const pTxt = p > 1 ? ` – ${L.page} ${p}` : "";
  const prev = p > 1 ? P.topic(lang.code, t, p - 1) : null;
  const next = p < pages ? P.topic(lang.code, t, p + 1) : null;
  const pager = pages > 1
    ? `<nav class="pager" aria-label="${esc(L.page)}">${Array.from({ length: pages }, (_, i) => i + 1)
        .map((k) => (k === p ? `<span aria-current="page">${k}</span>` : `<a href="${P.topic(lang.code, t, k)}">${k}</a>`))
        .join("")}</nav>`
    : "";
  const body = `<h1>${esc(topic)}${p > 1 ? ` <small>(${esc(L.page)} ${p})</small>` : ""}</h1>
<p class="lead">${esc(fmt(L.topicIntro, { count: t.refs.length, topic, lang: lname }))}</p>
${pager}
<div class="ayahs">${items}</div>
${pager}
<section><h2>${esc(L.topics)}</h2><div class="chips">${m.themes
    .filter((x) => x !== t)
    .map((x) => `<a class="chip" href="${P.topic(lang.code, x)}">${esc(themeTitle(lang.code, x))}</a>`)
    .join("")}</div></section>`;
  return layout({
    m, lang, L, body, prev, next,
    title: fmt(L.topicTitle, { topic, lang: lname, p: pTxt }),
    desc: fmt(L.topicDesc, { count: t.refs.length, topic, lang: lname }) + (p > 1 ? ` (${L.page} ${p})` : ""),
    path: P.topic(lang.code, t, p),
    altPath: (c) => P.topic(c, t, p),
    crumbs: [["quranm", "/"], [lang.native, P.hub(lang.code)], [topic, P.topic(lang.code, t)], ...(p > 1 ? [[`${L.page} ${p}`, P.topic(lang.code, t, p)]] : [])],
    jsonld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: topic, inLanguage: lang.hreflang || lang.code, url: SITE + P.topic(lang.code, t, p) }],
  });
}

function page404(m, lang) {
  const L = strings(lang?.code || "en");
  const code = lang?.code || "en";
  const l = lang || m?.langByCode.get("en") || { code: "en", dir: "ltr", native: "English" };
  return `<!doctype html><html lang="${code}" dir="${l.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(L.notFound)} | quranm</title><style>${CSS}</style></head><body><header class="top"><a class="brand" href="/${code}/">quranm</a></header><main><h1>404 – ${esc(L.notFound)}</h1><p class="lead">${esc(L.notFoundText)}</p><p class="actions"><a class="btn primary" href="/${code}/">${esc(L.backHome)}</a> <a class="btn" href="/">quranm.com</a></p></main></body></html>`;
}

// ---------------------------------------------------------------- sitemaps
// Only these languages are listed in /sitemap.xml so Google spends its crawl budget on them first
// (new domain: 78 langs x ~8.7k URLs = 680k URLs were "discovered, not indexed").
// /sitemaps/<lang>-1.xml still works for every language; add more codes here once these are indexed.
const SITEMAP_LANGS = ["ar", "en", "de", "tr", "ur", "id", "fr", "es"];
function sitemapIndex(m) {
  const items = m.langs.filter((l) => SITEMAP_LANGS.includes(l.code)).map((l) => `<sitemap><loc>${SITE}/sitemaps/${l.code}-1.xml</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>\n`;
}
export function sitemapUrls(m, l) {
  const c = l.code;
  const urls = [P.hub(c)];
  for (const s of m.surahs) urls.push(P.surah(c, s));
  for (const t of m.themes) for (let p = 1; p <= topicPages(t); p++) urls.push(P.topic(c, t, p));
  for (const s of m.surahs) for (let a = 1; a <= s.ayahs; a++) urls.push(P.ayah(c, s.n, a));
  for (const f of FEATURES) if (f.urls) for (const u of f.urls(m, l, H)) urls.push(u);
  return urls;
}
function sitemapLang(m, l) {
  const body = sitemapUrls(m, l).map((u) => `<url><loc>${SITE}${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// ---------------------------------------------------------------- router
async function route(ctx, m, path) {
  // returns {status, body, type} or {redirect}
  if (path === "/sitemap.xml") return { body: sitemapIndex(m), type: "application/xml; charset=utf-8" };
  let mm = path.match(/^\/sitemaps\/([a-z-]+)-1\.xml$/);
  if (mm) {
    const l = m.langByCode.get(mm[1]);
    return l ? { body: sitemapLang(m, l), type: "application/xml; charset=utf-8" } : null;
  }
  const seg = path.split("/").filter(Boolean);
  const lang = m.langByCode.get(seg[0]);
  if (!lang) return null;
  if (!path.endsWith("/")) return { redirect: path + "/" };
  const L = strings(lang.code);
  const c = lang.code;
  const html = (b) => (b ? { body: b, type: "text/html; charset=utf-8" } : null);
  if (seg.length === 1) return html(await pageHub(ctx, m, lang, L));
  if (seg[1] === "surah" && seg.length === 3) {
    const x = seg[2].match(/^(\d{1,3})(?:-([a-z0-9-]+))?$/);
    const s = x && m.surahs[Number(x[1]) - 1];
    if (!s || String(s.n) !== x[1]) return null;
    if (x[2] !== s.slug) return { redirect: P.surah(c, s) };
    return html(await pageSurah(ctx, m, lang, L, s));
  }
  if (seg[1] === "topic" && (seg.length === 3 || seg.length === 4)) {
    const ti = m.themeBySlug.get(seg[2]);
    if (ti == null) return null;
    if (seg.length === 4 && !/^[1-9]\d*$/.test(seg[3])) return null;
    const p = seg.length === 4 ? Number(seg[3]) : 1;
    if (seg.length === 4 && p === 1) return { redirect: P.topic(c, m.themes[ti]) };
    return html(await pageTopic(ctx, m, lang, L, ti, p));
  }
  if (seg.length === 3 && /^[1-9]\d{0,2}$/.test(seg[1]) && /^[1-9]\d{0,2}$/.test(seg[2])) {
    const s = m.surahs[Number(seg[1]) - 1];
    const a = Number(seg[2]);
    if (!s || a > s.ayahs) return null;
    return html(await pageAyah(ctx, m, lang, L, s, a));
  }
  // Zusatz-Seiten (seo-src/features/*.js): erstes Feature, das etwas liefert, gewinnt
  for (const f of FEATURES) {
    const r = await f.route({ ctx, m, lang, L, c, seg, path, H });
    if (r) return r.redirect ? r : html(r.body ?? r);
  }
  return null;
}

// Helfer für Features (nur lesen, nicht ändern)
export const H = {
  SITE, AUDIO, RECITER, P, esc, fmt, strings, CSS, layout, readerBtn,
  surahName, surahMeaning, themeTitle, langLabel, fetchAsset, lines, line,
};

export async function handle(ctx) {
  const req = ctx.request;
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const url = new URL(req.url);
  const path = url.pathname;
  const noindex = /\.pages\.dev$/.test(url.hostname) || /^(localhost|127\.0\.0\.1)$/.test(url.hostname);

  // lowercase redirect for mixed-case URLs
  if (path !== path.toLowerCase()) return Response.redirect(url.origin + path.toLowerCase(), 301);

  const m = await meta(ctx);
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(`${url.origin}${path}?__v=${m.v}.${CODE_VERSION}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return req.method === "HEAD" ? new Response(null, hit) : hit;
  }

  const r = await route(ctx, m, path);
  if (r?.redirect) return Response.redirect(url.origin + r.redirect, 301);
  const headers = { "content-type": r?.type || "text/html; charset=utf-8" };
  if (noindex) headers["x-robots-tag"] = "noindex";
  if (!r) {
    const seg = path.split("/").filter(Boolean);
    return new Response(page404(m, m.langByCode.get(seg[0])), { status: 404, headers: { ...headers, "cache-control": "public, max-age=600" } });
  }
  headers["cache-control"] = r.type.includes("xml") ? "public, max-age=86400" : HTML_CACHE;
  const res = new Response(r.body, { status: 200, headers });
  if (cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return req.method === "HEAD" ? new Response(null, res) : res;
}
