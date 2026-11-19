const SITE = "https://quranm.com";
const LANGS = ["en", "de", "tr", "ur", "ar", "fr", "id"];
const T = {
  en: { title: "Free Quran verse of the day widget for your mosque or website", desc: "Add a free Quran verse of the day to your mosque, community or blog website. No tracking, cookies or ads.", intro: "Give visitors a small daily connection to the Quran with a fast, privacy-friendly embed.", demo: "Live demo", install: "Copy and paste", options: "Options", faq: "FAQ", freeQ: "Is it free?", freeA: "Yes. The widget and its daily Quran verse feed are free to use.", privacyQ: "Does it track visitors?", privacyA: "No. It uses no cookies, analytics or tracking.", platformQ: "Does it work on WordPress?", platformA: "Yes. Add the code to a Custom HTML block or widget.", worksQ: "What does it show?", worksA: "Arabic text, a translation, the reference and a link back to quranm.com." },
  de: { title: "Kostenloses Quran-Vers-des-Tages-Widget für Moschee oder Website", desc: "Füge deiner Moschee-, Gemeinde- oder Blog-Website kostenlos einen Quran-Vers des Tages hinzu.", intro: "Schenke Besuchern jeden Tag eine kurze Verbindung zum Quran – schnell und datenschutzfreundlich.", demo: "Live-Demo", install: "Kopieren und einfügen", options: "Optionen", faq: "FAQ", freeQ: "Ist es kostenlos?", freeA: "Ja. Widget und täglicher Quran-Vers sind kostenlos.", privacyQ: "Werden Besucher verfolgt?", privacyA: "Nein. Es gibt keine Cookies, Analyse oder Nachverfolgung.", platformQ: "Funktioniert es mit WordPress?", platformA: "Ja. Füge den Code in einen Custom-HTML-Block ein.", worksQ: "Was wird angezeigt?", worksA: "Arabischer Text, Übersetzung, Referenz und ein Link zu quranm.com." },
  tr: { title: "Caminiz veya web siteniz için ücretsiz günlük Kur'an ayeti bileşeni", desc: "Caminize, topluluğunuza veya blogunuza ücretsiz günlük Kur'an ayeti ekleyin.", intro: "Ziyaretçilerinize hızlı ve gizlilik dostu bir günlük Kur'an bağlantısı sunun.", demo: "Canlı demo", install: "Kopyala ve yapıştır", options: "Seçenekler", faq: "SSS", freeQ: "Ücretsiz mi?", freeA: "Evet. Bileşen ve günlük ayet akışı ücretsizdir.", privacyQ: "Takip yapıyor mu?", privacyA: "Hayır. Çerez, analiz veya takip kullanmaz.", platformQ: "WordPress'te çalışır mı?", platformA: "Evet. Kodu Özel HTML bloğuna ekleyin.", worksQ: "Ne gösterir?", worksA: "Arapça metin, çeviri, referans ve quranm.com bağlantısı." },
  ur: { title: "مسجد یا ویب سائٹ کے لیے مفت روزانہ قرآن آیت ویجیٹ", desc: "اپنی مسجد، کمیونٹی یا بلاگ ویب سائٹ پر مفت روزانہ قرآن کی آیت شامل کریں۔", intro: "زائرین کو روزانہ قرآن سے تیز اور رازداری پر مبنی تعلق دیں۔", demo: "لائیو ڈیمو", install: "کاپی اور پیسٹ", options: "اختیارات", faq: "اکثر سوالات", freeQ: "کیا یہ مفت ہے؟", freeA: "جی ہاں، ویجیٹ اور روزانہ آیت مفت ہیں۔", privacyQ: "کیا یہ ٹریک کرتا ہے؟", privacyA: "نہیں، کوکیز، تجزیہ یا ٹریکنگ نہیں ہے۔", platformQ: "کیا WordPress پر چلتا ہے؟", platformA: "جی ہاں، کوڈ Custom HTML بلاک میں شامل کریں۔", worksQ: "یہ کیا دکھاتا ہے؟", worksA: "عربی متن، ترجمہ، حوالہ اور quranm.com کا لنک۔" },
  ar: { title: "ودجت آية القرآن اليومية المجاني لمسجدك أو موقعك", desc: "أضف آية قرآنية يومية مجانية إلى موقع المسجد أو المدونة، بلا تتبع أو إعلانات.", intro: "امنح زوارك صلة يومية قصيرة بالقرآن بسرعة واحترام للخصوصية.", demo: "عرض مباشر", install: "انسخ والصق", options: "الخيارات", faq: "الأسئلة الشائعة", freeQ: "هل هو مجاني؟", freeA: "نعم، الودجت وخدمة الآية اليومية مجانيان.", privacyQ: "هل يتتبع الزوار؟", privacyA: "لا. لا يستخدم ملفات تعريف أو تحليلاً أو تتبعاً.", platformQ: "هل يعمل على WordPress؟", platformA: "نعم، أضف الكود إلى كتلة HTML مخصصة.", worksQ: "ماذا يعرض؟", worksA: "النص العربي والترجمة والمرجع ورابطاً إلى quranm.com." },
  fr: { title: "Widget gratuit du verset coranique du jour pour votre mosquée ou site", desc: "Ajoutez gratuitement un verset du Coran à votre site de mosquée, d’association ou de blog.", intro: "Offrez à vos visiteurs un rendez-vous quotidien avec le Coran, rapide et respectueux de la vie privée.", demo: "Démo en direct", install: "Copier-coller", options: "Options", faq: "FAQ", freeQ: "Est-ce gratuit ?", freeA: "Oui. Le widget et son flux quotidien sont gratuits.", privacyQ: "Suit-il les visiteurs ?", privacyA: "Non. Aucun cookie, outil d’analyse ou suivi.", platformQ: "Fonctionne-t-il avec WordPress ?", platformA: "Oui. Ajoutez le code dans un bloc HTML personnalisé.", worksQ: "Que montre-t-il ?", worksA: "Le texte arabe, une traduction, la référence et un lien vers quranm.com." },
  id: { title: "Widget ayat Al-Qur'an harian gratis untuk masjid atau situs Anda", desc: "Tambahkan ayat Al-Qur'an harian gratis ke situs masjid, komunitas, atau blog Anda.", intro: "Berikan pengunjung hubungan harian dengan Al-Qur'an secara cepat dan ramah privasi.", demo: "Demo langsung", install: "Salin dan tempel", options: "Pilihan", faq: "FAQ", freeQ: "Apakah gratis?", freeA: "Ya. Widget dan umpan ayat harian gratis digunakan.", privacyQ: "Apakah melacak pengunjung?", privacyA: "Tidak. Tanpa cookie, analitik, atau pelacakan.", platformQ: "Apakah berfungsi di WordPress?", platformA: "Ya. Tambahkan kode ke blok HTML Kustom.", worksQ: "Apa yang ditampilkan?", worksA: "Teks Arab, terjemahan, referensi, dan tautan ke quranm.com." },
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tr = (code) => T[code] || T.en;

export async function todayResponse(ctx, requestUrl) {
  const url = new URL(requestUrl);
  const lang = LANGS.includes(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "en";
  const text = await ctx.env.ASSETS.fetch(new Request(new URL("/seo-data/widget/days.json", requestUrl))).then((r) => r.ok ? r.text() : null);
  if (!text) return new Response("Widget data unavailable", { status: 503 });
  const days = JSON.parse(text);
  const start = Date.UTC(1970, 0, 1);
  const now = new Date();
  const utcDay = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000);
  const item = days[((utcDay % days.length) + days.length) % days.length];
  const nextUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const seconds = Math.max(60, Math.floor((nextUtcMidnight - now.getTime()) / 1000));
  return new Response(JSON.stringify({ ref: item.ref, surah: item.surah, s: item.s, a: item.a, arabic: item.arabic, translation: item.translations[lang] || item.translations.en, lang }), {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": `public, max-age=${seconds}, s-maxage=${seconds}` },
  });
}

export default {
  name: "widget",
  async route({ ctx, m, lang, path, H }) {
    if (path !== `/${lang.code}/widget/`) return null;
    const S = tr(lang.code);
    const raw = await H.fetchAsset(ctx, "/seo-data/widget/days.json");
    const item = raw ? JSON.parse(raw)[0] : null;
    if (!item) return null;
    const code = `<div class="quranm-ayah" data-lang="${lang.code}"></div>\n<script src="https://quranm.com/widget/ayah.js" async></script>`;
    const ref = `${item.surah} ${item.ref}`;
    const demoTranslation = item.translations[lang.code] || item.translations.en;
    const body = `<h1>${esc(S.title)}</h1><p class="lead">${esc(S.intro)}</p>
<section class="widget-demo"><h2>${esc(S.demo)}</h2><article class="ayahbox"><p class="ar big" lang="ar" dir="rtl">${esc(item.arabic)}</p><p class="tr">${esc(demoTranslation)}</p><a class="ref" href="/${lang.code}/${item.s}/${item.a}/">${esc(ref)}</a><p><a href="/${lang.code}/${item.s}/${item.a}/">Verse of the day by quranm.com</a></p></article></section>
<section><h2>${esc(S.install)}</h2><pre><code>${esc(code)}</code></pre><p>${esc(S.options)}: use <code>data-lang="en"</code>, <code>data-theme="light|dark|auto"</code>, and <code>data-width="320px"</code>.</p></section>
<section><h2>${esc(S.faq)}</h2><dl><dt>${esc(S.freeQ)}</dt><dd>${esc(S.freeA)}</dd><dt>${esc(S.privacyQ)}</dt><dd>${esc(S.privacyA)}</dd><dt>${esc(S.platformQ)}</dt><dd>${esc(S.platformA)}</dd><dt>${esc(S.worksQ)}</dt><dd>${esc(S.worksA)}</dd></dl></section>
<style>.widget-demo .ayahbox{max-width:640px}.widget-demo .tr{font-size:1.1rem}pre{overflow:auto;padding:1rem;border-radius:12px;background:#eef2f7}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}dt{font-weight:700;margin-top:1rem}dd{margin:.35rem 0 0}</style>`;
    return H.layout({ m, lang, L: tr(lang.code), body, title: S.title + " | quranm", desc: S.desc, path, altPath: (c) => `/${c}/widget/`, crumbs: [["quranm", "/"], [lang.native, `/${lang.code}/`], [S.title, path]], hasArabic: true });
  },
  urls(_m, l) { return [`/${l.code}/widget/`]; },
};
