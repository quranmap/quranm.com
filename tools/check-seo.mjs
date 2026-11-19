// Smoke test for the SEO pages against a running `npx wrangler pages dev . --port 8911`.
// Usage: node tools/check-seo.mjs [baseUrl] [samplesPerLang]
const BASE = process.argv[2] || "http://127.0.0.1:8911";
const N = Number(process.argv[3] || 6);
const SITE = "https://quranm.com";

const get = async (p) => {
  const t0 = performance.now();
  const r = await fetch(BASE + p, { redirect: "manual" });
  const body = await r.text();
  return { status: r.status, body, ms: performance.now() - t0, loc: r.headers.get("location") };
};

const idx = await get("/sitemap.xml");
const maps = [...idx.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
const counts = { hub: 0, surah: 0, ayah: 0, topic: 0 };
let total = 0, maxPerFile = 0;
const samples = [];
for (const sm of maps) {
  const r = await get(sm);
  if (r.status !== 200 || !r.body.startsWith("<?xml") || !r.body.includes("</urlset>")) throw new Error("bad sitemap " + sm);
  const urls = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
  maxPerFile = Math.max(maxPerFile, urls.length);
  total += urls.length;
  for (const u of urls) {
    if (/^\/[a-z-]+\/$/.test(u)) counts.hub++;
    else if (u.includes("/surah/")) counts.surah++;
    else if (u.includes("/topic/")) counts.topic++;
    else counts.ayah++;
  }
  for (let i = 0; i < N; i++) samples.push(urls[Math.floor(Math.random() * urls.length)]);
}
console.log(`sitemaps=${maps.length} totalUrls=${total} maxPerFile=${maxPerFile}`, counts);

let bad = 0;
const times = [];
for (const u of samples) {
  const r = await get(u);
  times.push(r.ms);
  const ok = r.status === 200 && r.body.includes(`<link rel="canonical" href="${SITE}${u}">`) && r.body.includes('hreflang="x-default"');
  if (!ok) { bad++; console.log("FAIL", r.status, u); }
}
times.sort((a, b) => a - b);
console.log(`sampled=${samples.length} failed=${bad} p50=${times[times.length >> 1].toFixed(0)}ms p95=${times[Math.floor(times.length * 0.95)].toFixed(0)}ms max=${times.at(-1).toFixed(0)}ms`);

for (const u of ["/en/2/287/", "/en/0/1/", "/en/115/1/", "/en/surah/115-x/", "/en/topic/nope/", "/en/topic/patience/9/", "/zz-1.xml", "/sitemaps/xx-1.xml", "/en/foo/"]) {
  const r = await get(u);
  console.log(r.status === 404 ? "404 ok " : `EXPECTED 404 got ${r.status} `, u);
}
for (const u of ["/en/2/255", "/en/surah/2/", "/en/surah/2-wrong/", "/en/topic/patience/1/"]) {
  const r = await get(u);
  console.log(r.status, u, "->", r.loc);
}
