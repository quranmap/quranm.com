# quranm.com – rules for coding agents

Static Quran reader SPA (`index.html`, `app.js`, `app.css`, `portrait.css`) plus server-rendered SEO pages
(Cloudflare Pages Functions: `functions/[[path]].js` → `seo-src/handler.js`). Push to `main` = live. Never push.

## SEO pages – how to add a page type
- Put ALL code of a new page type in ONE new file `seo-src/features/<name>.js` (default export
  `{ name, route(args), urls(m, l, H) }`, see `seo-src/features/index.js`) and add ONE import line + array entry
  in `seo-src/features/index.js`. Do NOT edit `seo-src/handler.js`, `i18n.js`, `style.js` (other agents work in
  parallel). Use helpers from `H` (layout, esc, fmt, strings, P, line/lines/fetchAsset, surahName, ...).
- Read `seo-src/handler.js` once to copy patterns: `layout({...})` gives head, canonical, hreflang, breadcrumbs,
  JSON-LD; `line(ctx, path, i)` reads one line of a data file; unknown/invalid → return `null` (= real 404),
  non-canonical slug → `{ redirect }`.
- UI strings for your feature: keep a small map inside your feature file `{ en: {...}, de: {...}, ... }` with
  English fallback. No new keys in `i18n.js`.
- Data: precompute small files under `seo-data/<name>/` with a Node script `tools/build-<name>.mjs`
  (read repo JSON, never parse multi-MB files per request). Keep every request to 1–3 small file reads.
- URLs: lowercase, hyphens, trailing slash, language prefix `/<lang>/...` for every language in
  `seo-data/meta.json` (`langs`). If a new top-level prefix is needed, it is already covered (`/<lang>/*`).
- Paths must not collide with existing ones: `/<lang>/`, `/<lang>/surah/<n>-<slug>/`, `/<lang>/<s>/<a>/`,
  `/<lang>/topic/<slug>/`.
- Pages must be useful and unique (real data on every page), light (inline CSS from `H.CSS`, no JS needed),
  mobile-first, `dir=rtl` handled by `layout`. No keyword stuffing, no near-duplicate pages.

## Religious content – hard rules
- Quran text and translations only from repo/R2 data. Never generate, paraphrase or "fix" Quran text or a translation.
- No hadith, no "virtues/benefits of surah X", no rulings (fatwa), no invented facts. Only facts derivable from the data.
- No god-mode/"god" wording in code or UI. No images of people, faces, idols.

## Test before you finish
- `npx wrangler pages dev . --port <free port 8920-8990> --compatibility-date=2026-06-01` (background), then
  `node tools/check-seo.mjs http://127.0.0.1:<port>`, plus curl 5+ URLs of your feature in en, de, ar, ur, tr:
  200 + correct `<title>`, unknown ids → 404, sitemap `/sitemaps/en-1.xml` contains your URLs.
- `node --check` every changed JS file. Stop the dev server you started (only your own PID).
- Commit on your branch with a clear message. Report: files, URL count per language, test results, open issues.
