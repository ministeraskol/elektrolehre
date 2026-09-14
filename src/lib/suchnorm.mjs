// Such-Normalisierung (Aufräumen 14.09. – UI): Wörterbuch-Suchtext (beim Build → data-such) und Sucheingabe (im Browser) laufen
// durch dieselbe Faltung – ein Modul, zwei Aufrufer (Woerterbuch.astro: Frontmatter + Client-Skript), Modultest in scripts/check-site.mjs.
// Grundfaltung: Unicode NFKC · unsichtbare Zeichen raus (weiches Trennzeichen U+00AD, ZWSP/ZWNJ/ZWJ U+200B–U+200D, LRM/RLM,
// Wortverbinder U+2060, BOM U+FEFF) · Kleinschreibung in der Seitensprache (tr: I → ı, İ → i) · I/İ/ı/i gleich · ß → ss ·
// arabisch ي/ك = persisch ی/ک · Leerraum zusammengefasst.
// Beide Richtungen: Heuhaufen UND Eingabe werden in drei Formen gefaltet (Grundform · ä/ö/ü → ae/oe/ue · ohne Akzente). Treffer, sobald
// eine Form der Eingabe in einer Form des Heuhaufens steckt – „aeusserer“, „äußerer“, „ausserer“ finden „äußerer“ und umgekehrt.

const UNSICHTBAR = /[\u00AD\u200B-\u200F\u2060\uFEFF]/g;
// Trenner zwischen den Formen im Suchtext: die Eingabe enthält nach der Faltung nie einen Zeilenumbruch (Leerraum → ein Leerzeichen).
const TRENNER = '\n';
const UMSCHRIFT = { '\u00E4': 'ae', '\u00F6': 'oe', '\u00FC': 'ue' };

const klein = (s, lang) => {
  try {
    return s.toLocaleLowerCase(lang || undefined);
  } catch {
    return s.toLowerCase();
  }
};
// ي (U+064A) → ی (U+06CC), ك (U+0643) → ک (U+06A9)
const buchstaben = (s) => s.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9');

/**
 * Grundfaltung (eine Form).
 * @param {unknown} text
 * @param {string} [lang] Seitensprache (BCP 47, z. B. „tr“, „de-x-leicht“)
 * @returns {string}
 */
export function falte(text, lang) {
  const s = klein(String(text ?? '').normalize('NFKC').replace(UNSICHTBAR, ''), lang)
    .replace(/i\u0307/g, 'i') // İ außerhalb von tr → i + U+0307
    .replace(/\u0131/g, 'i') // ı → i (tr-Kleinschreibung macht aus I ein ı)
    .replace(/\u00DF/g, 'ss');
  return buchstaben(s).normalize('NFKC').replace(/\s+/g, ' ').trim();
}

/**
 * Alle Formen eines Textes: Grundform, Umschrift ä/ö/ü → ae/oe/ue, ohne Akzente/Diakritika (ohne Dubletten).
 * @param {unknown} text
 * @param {string} [lang]
 * @returns {string[]}
 */
export function faltungen(text, lang) {
  const f = falte(text, lang);
  const umschrift = f.replace(/[\u00E4\u00F6\u00FC]/g, (c) => UMSCHRIFT[c]);
  const ohne = buchstaben(f.normalize('NFD').replace(/\p{M}/gu, '')).normalize('NFC');
  return [...new Set([f, umschrift, ohne])];
}

/**
 * Suchtext (Heuhaufen) für data-such: alle Formen, getrennt durch TRENNER.
 * @param {unknown[] | unknown} teile Textteile (leere werden übersprungen)
 * @param {string} [lang]
 * @returns {string}
 */
export function suchText(teile, lang) {
  const text = Array.isArray(teile) ? teile.filter(Boolean).join(' ') : String(teile ?? '');
  return faltungen(text, lang).join(TRENNER);
}

/**
 * Formen der Eingabe; leere Eingabe → [] (= kein Suchfilter).
 * @param {unknown} eingabe
 * @param {string} [lang]
 * @returns {string[]}
 */
export function nadeln(eingabe, lang) {
  return faltungen(eingabe, lang).filter(Boolean);
}

/**
 * Trifft die Eingabe (Formen aus nadeln()) den Suchtext (aus suchText())?
 * @param {string} suchtext
 * @param {string[]} formen
 * @returns {boolean}
 */
export function trifft(suchtext, formen) {
  return formen.length === 0 || formen.some((n) => suchtext.includes(n));
}

/**
 * Kurzform (Tests): findet die Eingabe den Heuhaufen?
 * @param {unknown[] | unknown} heuhaufen
 * @param {unknown} eingabe
 * @param {string} [lang]
 * @returns {boolean}
 */
export function findet(heuhaufen, eingabe, lang) {
  return trifft(suchText(heuhaufen, lang), nadeln(eingabe, lang));
}
