// Erzeugt Marken-Übersicht + Kategorieseiten für alle 9 Locales aus marken.json + startseite-ui.json. Idempotent (überschreibt).
// Aufruf: node scripts/marken-seiten.mjs   – danach npm run build. Neue Kategorie = Eintrag in marken.json + erneut ausführen.
// Prüf-Modus: node scripts/marken-seiten.mjs --check – rendert alles im Speicher, vergleicht nur src/content/docs/*/elektrowerkzeuge/marken/**,
// schreibt nichts, Exit-Code 1 + Liste der abweichenden Dateien bei Abweichung.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const marken = JSON.parse(readFileSync(join(root, 'src/data/marken.json'), 'utf8'));
const ui = JSON.parse(readFileSync(join(root, 'src/data/startseite-ui.json'), 'utf8'));
const LOCALES = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'];
const y = (s) => JSON.stringify(String(s)); // YAML-sicherer String
const KOMP = '../../../../../components/';
const GENERIERT_HINWEIS = '# generiert von scripts/marken-seiten.mjs – nicht von Hand ändern\n';

function seiten() {
  const dateien = []; // { pfad (absolut), inhalt }
  for (const l of LOCALES) {
    const t = (ui[l] ?? ui.de).marken;
    const dir = join(root, 'src/content/docs', l, 'elektrowerkzeuge/marken');
    const translated = l === 'de' || l === 'leicht' ? 'source' : 'machine';
    dateien.push({
      pfad: join(dir, 'index.mdx'),
      inhalt: `---\n${GENERIERT_HINWEIS}title: ${y(t.titel)}\ndescription: ${y(t.untertitel)}\nsidebar:\n  order: 3\n  label: ${y(t.titel)}\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport Marken from '${KOMP}Marken.astro';\n\n<Marken />\n`,
    });
    for (const k of marken.kategorien) {
      dateien.push({
        pfad: join(dir, `${k.id}.mdx`),
        inhalt: `---\n${GENERIERT_HINWEIS}title: ${y(k.name[l] ?? k.name.de)}\ndescription: ${y(k.kurz[l] ?? k.kurz.de)}\nsidebar:\n  hidden: true\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport MarkenKategorie from '${KOMP}MarkenKategorie.astro';\n\n<MarkenKategorie id=${y(k.id)} />\n`,
      });
    }
  }
  return dateien;
}

const check = process.argv.includes('--check');
const dateien = seiten();

if (check) {
  const abweichend = dateien.filter(({ pfad, inhalt }) => !existsSync(pfad) || readFileSync(pfad, 'utf8') !== inhalt);
  if (abweichend.length > 0) {
    console.log(`${abweichend.length} Datei(en) weichen vom Generator ab:`);
    for (const { pfad } of abweichend) console.log(`  ${relative(root, pfad)}`);
    process.exit(1);
  }
  console.log(`${dateien.length} Seiten geprüft, keine Abweichung.`);
  process.exit(0);
}

for (const { pfad, inhalt } of dateien) {
  mkdirSync(join(pfad, '..'), { recursive: true });
  writeFileSync(pfad, inhalt);
}
console.log(`${dateien.length} Seiten geschrieben`);
