// Welche Seite gibt es in welcher Sprache wirklich? (Aufräumen 14.09. – SEO)
// Starlight baut für jede Seite, die es nur auf Deutsch gibt, in jeder anderen Locale eine Fallback-Seite (deutscher Text + Hinweisband).
// Die Sprachen je Seite werden NUR hier berechnet und an zwei Stellen genutzt:
//   – astro.config.mjs: Sitemap-Filter (Fallback-URLs raus); Seiten-Ids über docsIds() direkt aus src/content/docs,
//   – src/routeData.ts: canonical (Fallback → deutsches Original) und hreflang (nur echte Übersetzungen); Seiten-Ids aus
//     getCollection('docs') – dieselben Dateien, gelesen von Starlights docsLoader.
// Seiten-Id wie bei Starlight: '<locale>/<slug>', index ohne '/index' (de/index.mdx → 'de', de/grundlagen/index.mdx → 'de/grundlagen').
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Quellsprache: jede Seite entsteht zuerst auf Deutsch; fehlt sie in einer Locale, zeigt Starlight dort die deutsche Fassung. */
export const QUELLSPRACHE = 'de';

/** 'tr/grundlagen/schutzorgane' → 'tr' */
export const localeAusId = (id) => id.split('/')[0];
/** 'tr/grundlagen/schutzorgane' → 'grundlagen/schutzorgane'; 'tr' (Startseite) → '' */
export const slugAusId = (id) => (id.includes('/') ? id.slice(id.indexOf('/') + 1) : '');

/**
 * Slug → Locales, in denen die Seite als eigene Datei existiert (de eingeschlossen).
 * @param {Iterable<string>} ids Seiten-Ids ('<locale>/<slug>')
 * @returns {Map<string, Set<string>>}
 */
export function sprachKarte(ids) {
  const karte = new Map();
  for (const id of ids) {
    const slug = slugAusId(id);
    if (!karte.has(slug)) karte.set(slug, new Set());
    karte.get(slug).add(localeAusId(id));
  }
  return karte;
}

/**
 * Locales mit echter Fassung der Seite (leer, wenn der Slug unbekannt ist).
 * @param {Map<string, Set<string>>} karte
 * @param {string} slug
 * @returns {Set<string>}
 */
export const echteSprachen = (karte, slug) => karte.get(slug) ?? new Set();

/**
 * Fallback-Seite: die Seite gibt es auf Deutsch, in `locale` aber nicht → Starlight erzeugt dort eine Kopie mit Hinweisband.
 * @param {Map<string, Set<string>>} karte
 * @param {string} locale
 * @param {string} slug
 */
export const istFallback = (karte, locale, slug) => {
  const echt = echteSprachen(karte, slug);
  return locale !== QUELLSPRACHE && echt.has(QUELLSPRACHE) && !echt.has(locale);
};

/**
 * URL-Pfad (ohne base) → Locale und Slug: '/tr/rechtliches/impressum/' → { locale: 'tr', slug: 'rechtliches/impressum' }.
 * @param {string} pfad
 */
export const zerlegePfad = (pfad) => {
  const id = pfad.replace(/^\/+|\/+$/g, '');
  return { locale: localeAusId(id), slug: slugAusId(id) };
};

// Wie Starlights docsLoader (astro/loaders glob, Muster **/[^_]*.{markdown,mdown,mkdn,mkd,mdwn,md,mdx}).
const ENDUNG = /\.(markdown|mdown|mkdn|mkd|mdwn|md|mdx)$/;

/**
 * Seiten-Ids aus dem Dateisystem – für astro.config.mjs, wo getCollection noch nicht zur Verfügung steht.
 * Entwürfe (draft: true) fehlen wie im Produktions-Build. Astro bildet Ids mit github-slugger; für kebab-case-Namen ist das
 * die Identität. Andere Dateinamen oder ein eigener `slug` im Frontmatter brechen den Build ab, statt still falsch zu zählen.
 * @param {string} docsDir absoluter Pfad zu src/content/docs
 * @returns {string[]}
 */
export function docsIds(docsDir) {
  const ids = [];
  const lauf = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const pfad = join(dir, name);
      if (statSync(pfad).isDirectory()) {
        lauf(pfad);
        continue;
      }
      if (name.startsWith('_') || !ENDUNG.test(name)) continue;
      const kopf = readFileSync(pfad, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      if (/^draft:\s*true\s*$/m.test(kopf)) continue;
      const teile = relative(docsDir, pfad).replace(ENDUNG, '').split(sep);
      if (/^slug:/m.test(kopf) || !teile.every((t) => /^[a-z0-9_-]+$/.test(t))) {
        throw new Error(`uebersetzungen.mjs: ${relative(docsDir, pfad)} – eigener slug oder Dateiname außerhalb [a-z0-9_-] wird nicht unterstützt`);
      }
      ids.push(teile.join('/').replace(/\/index$/, ''));
    }
  };
  lauf(docsDir);
  return ids;
}
