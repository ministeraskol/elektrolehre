// Erzeugt Marken-Übersicht + Kategorieseiten für alle 9 Locales aus marken.json + startseite-ui.json. Idempotent (überschreibt).
// Aufruf: node scripts/marken-seiten.mjs   – danach npm run build. Neue Kategorie = Eintrag in marken.json + erneut ausführen.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const marken = JSON.parse(readFileSync(join(root, 'src/data/marken.json'), 'utf8'));
const ui = JSON.parse(readFileSync(join(root, 'src/data/startseite-ui.json'), 'utf8'));
const LOCALES = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'];
const y = (s) => JSON.stringify(String(s)); // YAML-sicherer String
const KOMP = '../../../../../components/';
let n = 0;
for (const l of LOCALES) {
  const t = (ui[l] ?? ui.de).marken;
  const dir = join(root, 'src/content/docs', l, 'elektrowerkzeuge/marken');
  mkdirSync(dir, { recursive: true });
  const translated = l === 'de' ? 'source' : 'machine';
  writeFileSync(join(dir, 'index.mdx'), `---\ntitle: ${y(t.titel)}\ndescription: ${y(t.untertitel)}\nsidebar:\n  order: 3\n  label: ${y(t.titel)}\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport Marken from '${KOMP}Marken.astro';\n\n<Marken />\n`);
  n++;
  for (const k of marken.kategorien) {
    writeFileSync(join(dir, `${k.id}.mdx`), `---\ntitle: ${y(k.name[l] ?? k.name.de)}\ndescription: ${y(k.kurz[l] ?? k.kurz.de)}\nsidebar:\n  hidden: true\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport MarkenKategorie from '${KOMP}MarkenKategorie.astro';\n\n<MarkenKategorie id=${y(k.id)} />\n`);
    n++;
  }
}
console.log(`${n} Seiten geschrieben`);
