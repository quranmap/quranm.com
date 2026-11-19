// Downloads all translation JSONs from R2 into tools/.cache/translations (gitignored).
// Usage: node tools/fetch-translations.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = "https://audio.quranm.com/translate/FINAL";
const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, ".cache", "translations");
fs.mkdirSync(CACHE, { recursive: true });

const idx = await (await fetch(`${ROOT}/translations_index.json`)).json();
fs.writeFileSync(path.join(CACHE, "translations_index.json"), JSON.stringify(idx));

const jobs = [];
for (const l of idx.languages) for (const it of l.items) jobs.push(it.file);

let done = 0;
async function worker() {
  while (jobs.length) {
    const file = jobs.shift();
    const out = path.join(CACHE, file);
    if (fs.existsSync(out) && fs.statSync(out).size > 1000) { done++; continue; }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const url = `${ROOT}/${file.split("/").map(encodeURIComponent).join("/")}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
        break;
      } catch (e) {
        if (attempt === 2) console.error("FAIL", file, e.message);
      }
    }
    done++;
    if (done % 10 === 0) console.log(`${done} files`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log("done", done);
