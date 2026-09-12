// Anker-ID eines Glossar-Begriffs (in Glossar.astro und im rehype-Plugin identisch).
export function begriffSlug(de) {
  return (
    'begriff-' +
    de
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

/** Suchvarianten eines Glossar-Eintrags: "RCD / FI-Schutzschalter" → ["RCD", "FI-Schutzschalter"], "Handwerkskammer (HWK)" → beide. */
export function begriffVarianten(de) {
  const klammern = [...de.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  const ohne = de.replace(/\([^)]*\)/g, '');
  const teile = ohne.split(/\s*\/\s*/).map((s) => s.trim());
  const alle = [...teile, ...klammern].filter(
    (v) => v.length >= 3 && !v.includes(',') && /^[\p{L}§]/u.test(v) && v !== 'gestreckt'
  );
  return [...new Set(alle)];
}
