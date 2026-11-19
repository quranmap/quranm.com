// Builds the small reciter index used by the SEO reciter pages.
// Source: the RECITER_OPTIONS list in app.js (repo data, no external download).
// Audio source: https://audio.quranm.com/reciter/<folder>/<SSS>/<SSSAAA>.mp3
// The audio files are served by quranm.com; no separately downloaded data is used.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const out = path.join(repo, "seo-data", "reciter");

const reciters = [
  ["alafasy", "Mishari Rashid al Afasy", "Mishari Rashid al Afasy"],
  ["abdulbaset_abdulsamad_murattal", "Abdulbaset Abdulsamad (Murattal)", "Abdulbaset Abdulsamad Murattal"],
  ["abdulbaset_abdulsamad_mujawwad", "Abdulbaset Abdulsamad (Mujawwad)", "Abdulbaset Abdulsamad Mujawwad"],
  ["abdur_rahman_as_sudais", "Abdur Rahman as Sudais", "Abdur Rahman as Sudais"],
  ["abu_bakr_al_shatri", "Abu Bakr al Shatri", "Abu Bakr al Shatri"],
  ["hani_ar_rifai", "Hani ar Rifai", "Hani ar Rifai"],
  ["mohamed_siddiq_al_minshawi_mujawwad", "Mohamed Siddiq al Minshawi (Mujawwad)", "Mohamed Siddiq al Minshawi Mujawwad"],
  ["mohamed_siddiq_al_minshawi_murattal", "Mohamed Siddiq al Minshawi (Murattal)", "Mohamed Siddiq al Minshawi Murattal"],
  ["saud_ash_shuraym", "Saud ash Shuraym", "Saud ash Shuraym"],
].map(([slug, name, folder]) => ({
  slug,
  name,
  folder,
  style: /\((Murattal|Mujawwad)\)$/.exec(name)?.[1] || "",
}));

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "reciters.json"), JSON.stringify(reciters) + "\n");
console.log(`reciters=${reciters.length}`);
