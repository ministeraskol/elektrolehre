# Rückmeldung Kadir zu TP1 – 13. September 2026

Stand: nach Screens `screens/2026-09-12-tp1/` und lokalem Rundgang (127.0.0.1:8766).
Status: **offen** – wird als „Feinschliff“-Runde zwischen TP1-Merge und TP2 abgearbeitet
(Begründung: TP2 baut Seiten auf demselben Layout; Layout danach zu ändern verdoppelt die Arbeit).

## 1. Sofort (klein, lokal)

| Nr | Punkt | Betrifft | Entscheidung |
|----|-------|----------|--------------|
| R1 | Hinweis „Diese Seite ist eine maschinelle Übersetzung. Die deutsche Fassung ist verbindlich.“ **entfernen** – nicht mehr anzeigen | `Uebersetzungshinweis.astro`, alle Nicht-de-Locales, Tests | entschieden |
| R2 | Stufenname **„Profi“** gefällt nicht („Profi ne demek?“). Kandidaten: *Geselle* (kollidiert mit der Figur), *Fachkraft*, *Meister* (ist ein Abschluss), *Experte*. Bis zur Entscheidung bleibt „Profi“ im Code (`stufe: profi`), nur das Label ändert sich | `ui.json` Block `stufen` (9 Sprachen), `mitglied.mdx`, Spec §3 | ✅ Fachkraft (Kadir 14.09.), en Skilled worker, leicht Fach-Kraft; Code-Schlüssel profi unverändert |

## 2. Feinschliff (Design-Runde vor TP2, mit Screens)

| Nr | Punkt | Richtung |
|----|-------|----------|
| R3 | Gesamtbild **zu dunkel, ohne Effekte** | Varianten zeigen: (a) helleres Dunkel (Navy statt Graphit, mehr Kontraststufen), (b) Hell als Standard, (c) Dunkel + Effekte (Verlauf im Header, Karten-Hover mit Glow, Stufenfarben als Akzentlinien). Entscheidung per Screenshot, nicht per Text |
| R4 | **Seitenleiste / Navigation zu komplex** | Vereinfachen: weniger Gruppen sichtbar, Stufen-Badges nur bei Hover/Filter, Geselle-Kasten kleiner oder nur auf der Startseite, Stufen-Leiste unter dem Header prüfen (doppelt mit Chip?) |
| R5 | **Geselle Watt zu schlicht** | Referenz von Kadir (13.09.): Sticker-Stil mit weißem Rand, gewölbter Schriftzug „GESELLE WATT“ (amber + blau), blauer Schutzhelm mit gelbem „W“, orange Warnweste mit Blitz-Abzeichen, blaues Arbeitshemd, Namensschild „Geselle Watt“, Werkzeuggürtel (Schraubendreher, Zange, Bandmaß), Rollgabelschlüssel in der Hand, freundliches Lächeln, kurzes dunkles Haar. Detailreicher Cartoon, nicht Strich-SVG. → Vorlage für den Higgs-Character-Sheet in TP3. Datei: `mockups/geselle-watt-referenz.png` (von Kadir abzulegen) |

## 3. Für TP2 vormerken

| Nr | Punkt | Umsetzung |
|----|-------|-----------|
| R6 | **Affiliate-Links** im Werkzeug-Ratgeber, sobald Kadir ein Affiliate-Konto eröffnet | ✅ Datenmodell in TP2 (marken.json `affiliate`, `affiliateAktiv:false`); Aktivierung wartet auf Kadirs Konto. |

## Reihenfolge

1. TP1 → `neuaufbau` (lokal, kein Push)
2. Feinschliff: R1 sofort · R3/R4 als Screens-Varianten → Kadir wählt · R2 nach Kadirs Wort
3. TP2 Werkzeug mit R6 im Datenmodell
4. TP3 Geselle mit R5 als Referenz
