// Feature-Liste für Zusatz-Seiten. Jedes Feature ist ein Modul in diesem Ordner:
//   export default {
//     name: "juz",
//     // seg = Pfad-Teile ohne Sprache-Präfix-Prüfung, z. B. ["en","juz","30"]
//     async route({ ctx, m, lang, L, c, seg, path, H }) { return null | {redirect} | "<html>" | {body} },
//     urls(m, l, H) { return ["/en/juz/1/", ...] },   // für die Sitemap
//   };
// Neue Features NUR hier unten importieren und anhängen (je eine Zeile).
import widget from "./widget.js";
import reciter from "./reciter.js";
import juz from "./juz.js";
export const FEATURES = [widget, reciter, juz];
