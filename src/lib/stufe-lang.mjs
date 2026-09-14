// Sprache eines Stufen-Labels (Aufräumen 14.09. – UI). Regel-Treue 14.09.: Azubi/Fachkraft bleiben in tr/ru/ar/fa/ka/sq deutsche Wörter.
// Wo t.stufen[s] gerendert wird, bekommt das Element dann lang="de" – Screenreader sprechen das Wort deutsch aus.
// Regel: Locale ist nicht de/leicht (beide selbst Deutsch) und das Label gleicht dem deutschen – außer das Label ist in der Locale ein
// eigenes Wort, das nur gleich geschrieben wird (en „Start“ ist Englisch, kein deutsches Wort auf einer englischen Seite).
// Nicht erreichbar: Seitenleisten-Badges (routeData.ts) – Starlights SidebarSublist reicht nur text/variant/class an <Badge> weiter.
import ui from '../data/startseite-ui.json' with { type: 'json' };

const SELBST_DEUTSCH = new Set(['de', 'leicht']);
const EIGENES_WORT = { en: new Set(['Start']) };

/**
 * @param {string} locale Starlight-Locale-Schlüssel (de, leicht, tr, en, …)
 * @param {'einstieg' | 'azubi' | 'profi'} stufe
 * @returns {'de' | undefined}
 */
export function stufeLang(locale, stufe) {
  if (SELBST_DEUTSCH.has(locale)) return undefined;
  const label = ui[locale]?.stufen?.[stufe];
  if (label === undefined || label !== ui.de.stufen[stufe]) return undefined;
  return EIGENES_WORT[locale]?.has(label) ? undefined : 'de';
}
