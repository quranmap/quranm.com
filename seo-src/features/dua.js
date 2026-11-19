const UI = {
  en: { indexTitle: "Quranic duas", indexDesc: "A curated collection of supplications that appear in the Quran.", indexIntro: "Read Quranic supplications in Arabic with the translation available for each language.", detailPrefix: "Quranic dua", from: "From", speaker: "Speaker", references: "Quran references", translations: "Translation", readAyah: "Read ayah", openReader: "Open in reader", home: "Quranic duas" },
  de: { indexTitle: "Quranische Bittgebete", indexDesc: "Eine kuratierte Sammlung von Bittgebeten aus dem Quran.", indexIntro: "Lies Bittgebete aus dem Quran auf Arabisch mit der verfügbaren Übersetzung.", detailPrefix: "Quranisches Bittgebet", from: "Aus", speaker: "Sprecher", references: "Quranstellen", translations: "Übersetzung", readAyah: "Vers lesen", openReader: "Im Reader öffnen", home: "Quranische Bittgebete" },
};

const ui = (code) => UI[code] || UI.en;
const slugPath = (c, slug) => `/${c}/dua/${slug}/`;
const indexPath = (c) => `/${c}/dua/`;

function entryTitle(code, item) { return (code === "de" ? item.title.de : item.title.en); }
function refsLabel(item) { return item.refs.map((x) => x.ref).join(", "); }

function card(c, item, text, H) {
  const refs = item.refs.map((x) => `<span class="ref">${H.esc(x.ref)}</span>`).join(" · ");
  return `<article class="card"><h2><a href="${slugPath(c, item.slug)}">${H.esc(entryTitle(c, item))}</a></h2><p>${refs}</p>${item.speaker ? `<p class="note">${H.esc(text.speaker)}: ${H.esc(item.speaker)}</p>` : ""}</article>`;
}

export default {
  name: "dua",
  async route({ ctx, m, lang, L, c, seg, H }) {
    if (seg[1] !== "dua" || (seg.length !== 2 && seg.length !== 3)) return null;
    const text = ui(c);
    const data = await H.lines(ctx, "/seo-data/dua/index.txt");
    if (!data) return null;
    const items = data.filter(Boolean).map((line) => JSON.parse(line));
    if (seg.length === 2) {
      const body = `<h1>${H.esc(text.indexTitle)}</h1><p class="lead">${H.esc(text.indexIntro)}</p><div class="cards">${items.map((item) => card(c, item, text, H)).join("")}</div>`;
      return H.layout({ m, lang, L, body, title: `${text.indexTitle} | quranm`, desc: text.indexDesc, path: indexPath(c), altPath: (code) => indexPath(code), crumbs: [["quranm", "/"], [lang.native, H.P.hub(c)], [text.home, indexPath(c)]], jsonld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: text.indexTitle, url: `${H.SITE}${indexPath(c)}` }] });
    }
    const item = items.find((x) => x.slug === seg[2]);
    if (!item) return null;
    const surah = m.surahs[item.refs[0].s - 1];
    const arAll = await H.line(ctx, `/seo-data/q/${item.refs[0].s}.txt`, 0);
    if (!arAll) return null;
    const trLines = lang.tr.length ? await H.lines(ctx, `/seo-data/t/${c}/${item.refs[0].s}.txt`) : null;
    const trInfo = lang.tr || [];
    const trHtml = trLines ? trLines.flatMap((line, i) => {
      if (!item.refs.some((x) => x.a === i) || !line) return [];
      const values = JSON.parse(line);
      return (values || []).map((value, j) => value ? `<figure class="trn"><blockquote dir="${trInfo[j]?.d || lang.dir}">${H.esc(value)}</blockquote><figcaption>— ${H.esc(trInfo[j]?.n || "")}</figcaption></figure>` : "");
    }).join("") : "";
    const ayahs = item.refs.map((x) => {
      const ar = x.s === item.refs[0].s ? arAll[x.a - 1] : null;
      return `<article class="ay" id="a${x.s}-${x.a}"><a class="ref" href="${H.P.ayah(c, x.s, x.a)}">${H.esc(x.ref)}</a><p class="ar big" lang="ar" dir="rtl">${H.esc(ar || x.ar)}</p><p class="actions"><a class="btn" href="${H.P.ayah(c, x.s, x.a)}">${H.esc(text.readAyah)}</a> ${H.readerBtn(L, x.s, x.a)}</p></article>`;
    }).join("");
    const title = entryTitle(c, item);
    const meta = `${text.from}: ${refsLabel(item)}${item.speaker ? ` · ${text.speaker}: ${item.speaker}` : ""}`;
    const body = `<h1>${H.esc(title)}</h1><p class="lead">${H.esc(meta)}</p>${ayahs}${trHtml ? `<section><h2>${H.esc(text.translations)}</h2>${trHtml}</section>` : ""}`;
    return H.layout({ m, lang, L, body, title: `${title} | quranm`, desc: `${title} — ${refsLabel(item)}`, ogType: "article", path: slugPath(c, item.slug), altPath: (code) => slugPath(code, item.slug), crumbs: [["quranm", "/"], [lang.native, H.P.hub(c)], [text.home, indexPath(c)], [title, slugPath(c, item.slug)]], jsonld: [{ "@context": "https://schema.org", "@type": "Article", name: title, inLanguage: lang.hreflang || lang.code, url: `${H.SITE}${slugPath(c, item.slug)}` }] });
  },
  urls(m, l) {
    const rows = [];
    rows.push(indexPath(l.code));
    for (const slug of SLUGS) rows.push(slugPath(l.code, slug));
    return rows;
  },
};

const SLUGS = [
  "guide-us-to-the-straight-path", "safety-and-provision-for-makkah", "acceptance-of-our-worship", "good-in-this-world-and-the-hereafter", "steadfastness-in-battle", "mercy-and-forgiveness", "firmness-of-heart", "faith-and-forgiveness", "all-authority-is-yours", "accept-our-belief", "forgiveness-and-no-wasted-deeds", "reflection-on-creation", "rescue-the-oppressed", "a-table-from-heaven", "our-wrongdoing", "patience-and-death-in-submission", "forgive-me-and-my-brother", "our-lord-do-not-burden-us", "trust-in-allah", "do-not-place-us-with-wrongdoers", "save-me-from-what-they-call-me-to", "purity-and-shelter", "let-me-die-in-submission", "safety-for-makkah-and-family", "make-us-and-our-descendants-devoted", "mercy-for-parents", "honest-entry-and-exit", "mercy-in-the-cave", "increase-me-in-knowledge", "ease-my-task", "a-sign-for-zakariya", "a-righteous-heir", "refuge-from-the-whisperings", "do-not-leave-me-alone", "remove-the-harm", "you-are-glorified-i-was-wrong", "protect-us-from-the-fire", "my-lord-forgive-and-have-mercy", "protect-us-from-hell", "comfort-in-our-families", "wisdom-and-righteous-company", "make-me-among-the-heirs-of-paradise", "gratitude-for-blessings", "forgive-me-for-my-wrongdoing", "safety-from-wrongdoing-people", "in-need-of-your-good", "help-me-against-deniers", "grant-me-a-righteous-child", "grant-me-a-kingdom", "our-lord-you-encompass-all-things", "protect-me-from-their-deception", "righteousness-for-parents-and-family", "forgive-us-and-our-brothers", "do-not-make-us-a-trial", "complete-our-light", "pharaohs-wife-asks-for-a-home", "do-not-leave-any-disbeliever", "decide-between-us-and-our-people", "give-us-time-to-return", "judge-in-truth", "do-not-put-us-with-wrongdoers", "save-me-and-my-family", "creator-of-the-heavens-and-earth", "glory-to-the-one-who-subjected-this", "i-am-overcome-so-help-me"
];
