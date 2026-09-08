# Elektrolehre

Elektrotechnik von null an – eine kostenlose Lernseite für die Ausbildung zum
**Elektroniker / zur Elektronikerin für Energie- und Gebäudetechnik**.
Acht Sprachen (de · en · tr · ru · ar · fa · ka · sq), deutsche Fachbegriffe bleiben
in jeder Sprache erhalten.

Live: https://ministeraskol.github.io/elektrolehre/

## Entwicklung

```bash
npm install
npm run dev              # http://localhost:4321/elektrolehre/
npm run build && npm test   # baut nach dist/ und prüft das HTML (scripts/check-site.mjs)
```

## Inhalt

- Quelle ist immer Deutsch: `src/content/docs/de/**`
- Übersetzungen: `src/content/docs/<sprache>/**` – fehlt eine Seite, zeigt Starlight die
  deutsche Version mit Hinweis.
- Front matter: `translated: source | machine | reviewed`, `sources: [{ title, url }]`,
  optional `lernfeld`, `stufe`.
- Interne Links relativ schreiben (`./anleitungen/unterverteilung/`), damit sie mit und
  ohne `base` funktionieren.

## Sicherheit

Arbeiten an elektrischen Anlagen dürfen nur Elektrofachkräfte ausführen. Die Inhalte
begleiten die Ausbildung und ersetzen sie nicht.

Lizenz: folgt.
