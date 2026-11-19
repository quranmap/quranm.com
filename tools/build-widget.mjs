// Builds the curated verse-of-the-day catalog from repository Quran data.
// Source: existing quranm repository data files (generated seo-data/q + seo-data/t); no external download.
// License: no new external data license applies; output reuses the repository's existing data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const meta = JSON.parse(fs.readFileSync(path.join(repo, "seo-data/meta.json"), "utf8"));
const outDir = path.join(repo, "seo-data/widget");
const languages = ["en", "de", "tr", "ur", "fr", "id"];
const curatedSurahs = [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 28, 29, 30, 31, 32, 33, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

const priority = [
  "1:1", "1:2", "1:5", "1:6", "1:7", "2:21", "2:45", "2:152", "2:153", "2:155", "2:156", "2:157", "2:165", "2:186", "2:216", "2:255", "2:256", "2:261", "2:263", "2:286",
  "3:8", "3:26", "3:27", "3:31", "3:92", "3:102", "3:133", "3:134", "3:159", "3:190", "3:191", "4:36", "4:58", "4:135", "5:8", "5:32", "5:48", "6:162", "7:23", "7:31", "7:56", "7:199", "9:51", "9:71", "10:57", "10:62", "10:63", "10:64", "10:109", "12:86", "12:87", "13:11", "13:28", "14:7", "14:40", "14:41", "16:18", "16:90", "16:97", "16:125", "17:23", "17:24", "17:70", "17:80", "18:10", "18:24", "18:46", "18:110", "20:25", "20:26", "20:27", "20:28", "20:114", "21:83", "21:87", "21:89", "21:90", "22:77", "23:1", "23:2", "23:3", "23:8", "23:9", "23:10", "23:11", "24:35", "24:58", "25:63", "25:64", "25:65", "25:67", "25:70", "25:74", "25:75", "25:76", "26:80", "26:83", "27:19", "28:24", "28:77", "29:69", "30:21", "30:60", "31:12", "31:13", "31:14", "31:17", "31:18", "31:19", "33:35", "33:41", "33:56", "35:29", "36:58", "39:10", "39:53", "39:54", "40:60", "41:30", "41:31", "41:32", "41:34", "42:36", "42:38", "42:43", "43:36", "44:38", "45:15", "46:13", "47:7", "48:4", "49:10", "49:11", "49:12", "49:13", "50:16", "51:56", "51:57", "51:58", "53:39", "53:40", "55:1", "55:2", "55:3", "55:4", "55:5", "55:6", "55:7", "55:8", "55:9", "55:10", "55:11", "55:12", "55:13", "57:4", "57:20", "57:22", "57:23", "58:11", "59:18", "59:19", "59:20", "59:21", "59:22", "59:23", "59:24", "60:4", "60:7", "60:8", "61:2", "61:10", "61:11", "62:9", "62:10", "63:9", "64:16", "65:2", "65:3", "66:6", "67:1", "67:2", "67:3", "67:4", "67:5", "68:4", "69:19", "70:19", "70:20", "70:21", "70:22", "71:28", "72:13", "73:8", "73:10", "74:38", "75:36", "76:8", "76:9", "76:24", "77:20", "78:31", "79:40", "80:17", "81:26", "82:6", "83:18", "84:25", "85:11", "86:17", "87:14", "87:15", "88:17", "89:27", "89:28", "89:29", "89:30", "90:4", "90:8", "90:10", "91:7", "92:5", "92:7", "93:3", "93:4", "93:5", "93:6", "93:7", "93:8", "93:9", "93:10", "93:11", "94:1", "94:2", "94:3", "94:4", "94:5", "94:6", "94:7", "94:8", "95:4", "95:5", "95:6", "95:7", "95:8", "96:1", "96:3", "96:5", "97:1", "97:2", "97:3", "97:4", "97:5", "98:5", "98:7", "99:7", "99:8", "100:6", "103:1", "103:2", "103:3", "107:1", "107:2", "107:3", "107:4", "107:5", "107:6", "107:7", "108:1", "108:2", "108:3", "109:1", "109:2", "109:3", "110:1", "110:2", "110:3", "112:1", "112:2", "112:3", "112:4", "113:1", "113:2", "113:3", "113:4", "113:5", "114:1", "114:2", "114:3", "114:4", "114:5", "114:6",
];

const readLine = (file, index) => {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  return lines[index] ? JSON.parse(lines[index]) : null;
};
const words = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;
const rows = new Map();
for (const code of languages) {
  for (const s of curatedSurahs) {
    const file = path.join(repo, "seo-data", "t", code, `${s}.txt`);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (let a = 1; a < lines.length; a++) {
      const value = lines[a] ? JSON.parse(lines[a]) : null;
      const text = Array.isArray(value) ? String(value[0] || "") : "";
      if (text) {
        const row = rows.get(`${s}:${a}`) || { translations: {} };
        row.translations[code] = text;
        rows.set(`${s}:${a}`, row);
      }
    }
  }
}

const candidates = [];
for (const s of curatedSurahs) {
  const arabic = readLine(path.join(repo, "seo-data", "q", `${s}.txt`), 0);
  for (let a = 1; a < arabic.length; a++) {
    const ref = `${s}:${a}`;
    const row = rows.get(ref);
    if (!row || languages.some((code) => !row.translations[code] || words(row.translations[code]) > 40)) continue;
    candidates.push({ ref, s, a, arabic: arabic[a], translations: row.translations });
  }
}
const byRef = new Map(candidates.map((x) => [x.ref, x]));
const selected = [];
const used = new Set();
for (const ref of priority) if (byRef.has(ref) && !used.has(ref)) { selected.push(byRef.get(ref)); used.add(ref); }
for (const row of candidates) if (selected.length < 365 && !used.has(row.ref)) { selected.push(row); used.add(row.ref); }
if (selected.length < 365) throw new Error(`Only ${selected.length} qualifying verses found`);

const surahNames = new Map(meta.surahs.map((s) => [s.n, s.tr]));
const days = selected.slice(0, 365).map(({ ref, s, a, arabic, translations }) => ({ ref, surah: surahNames.get(s), s, a, arabic, translations: { ar: arabic, ...translations } }));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "days.json"), JSON.stringify(days) + "\n");
console.log(`widget days=${days.length} languages=${languages.join(",")}`);
