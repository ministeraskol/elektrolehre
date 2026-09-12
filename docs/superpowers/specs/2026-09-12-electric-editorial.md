# wattwas – „Electric Editorial“ + neue Struktur (12. Sep 2026, zweiter Umbau am selben Tag)

Kadirs Vorgaben: Site heißt **wattwas**; Gen-Z-Medienmarke (16–28, Azubis, viele mit Migrationshintergrund, DE+TR);
Kanäle YouTube/TikTok/Instagram starten jetzt; Affiliate für Werkzeug; Struktur `/ themen/ grundlagen/ elektrowerkzeuge/ blog/ ueber/`;
Sprachen Deutsch · Leichte Sprache · Türkçe · + 6.

## Entscheidungen
| Thema | Entscheidung | Warum |
|---|---|---|
| Name | `title: 'wattwas'`, alle „Elektrolehre“-Stellen ersetzt (Impressum/Datenschutz/Haftung, lernfelder ×8, README) | Domain = Marke. Repo-Name bleibt `elektrolehre` (URLs, Actions). |
| URL-Struktur | `beruf/*` + `anleitungen/*` → `themen/energie-und-gebaeudetechnik/*` (8 Sprachen, `git mv`), Astro-`redirects` für alle alten URLs × 9 Locales | Google hat die alten URLs seit 11. Sep; 301 via Meta-Refresh-Seiten (GitHub Pages kann keine Server-301). |
| Neue Seiten (DE, Rest Fallback) | `themen/` (9 Fachrichtungen, nur EGT verlinkt, Rest „In Arbeit“), `themen/egt/` Hub, `grundlagen/` Lernpfad-Hub, `elektrowerkzeuge/` + `grundausstattung-azubi`, `blog/` + „Fehler des Tages #1“, `ueber`, `leicht/` Startseite | Keine Dünnseiten: nur Themen mit echtem Inhalt sind Links. |
| Leichte Sprache | Locale `leicht`, `lang: 'de-x-leicht'`; Startseite + UI-Strings in Leichter Sprache, Inhalte Fallback DE | Eigener Pfad für hreflang/Sitemap; Screenreader lesen „de“. |
| Technik | Weiter Starlight + eigenes CSS/JS. Kein Tailwind/Framer/GSAP | Scroll-Reveal (IO), Magnet-Buttons, Cursor-Glow, Funken, Stromlinie: zusammen < 3 kB JS. GSAP/Framer wären 60–120 kB für denselben Effekt. |
| Dark-first | `ThemeProvider` + `ThemeSelect` überschrieben: „Auto“ = dunkel, hell nur explizit | Markenlook; Starlight folgt sonst dem System. |
| Palette | #0F172A / #1E293B, Verlauf #F59E0B→#F97316, Cyan #22D3EE. Hell: Bernstein-Text #B45309, Orange #C2410C, Cyan #0E7490 | AA-Kontrast; Verlauf nur als Fläche/Verlaufstext auf Dunkel. |
| Social | `src/data/social.json`: `@wattwas` auf YouTube/TikTok/Instagram; Header-Icons (Starlight `social`), Hero-Buttons, „Folge uns“, „Unterstütze uns“, Footer | Handles laut Kadir; Links zeigen ins Leere, bis die Kanäle existieren. |
| Video-Feed | `src/data/videos.json`: 6 geplante Shorts als 9:16-Karten mit SVG-Poster, Link auf den Kanal; **kein Embed** | YouTube/TikTok-iframes setzen Cookies → Einwilligungsbanner nötig. Sobald ein Video live ist: `url` + `status: live`. |
| Werkzeug-Guide | `src/data/werkzeuge.json`: 9 Kategorien, Badge Pflicht/Empfehlung/Nice, „Am besten für“, Pro/Contra, Budget €·€€·€€€, `url: null` → „Link folgt“; `affiliateAktiv: false` | Keine Sternebewertungen ohne eigenen Test (wären erfunden). § 14 BBiG vorangestellt. Affiliate braucht: Partnerprogramm, Datenschutz-Absatz, *-Kennzeichnung, Impressum „kommerziell“. |
| Newsletter | `newsletterAction: null` → „startet bald“; Formular erscheint, sobald ein Anbieter eingetragen ist | GitHub Pages hat kein Backend; Anbieter (Buttondown/Listmonk/…) ist Kadirs Entscheidung, Datenschutz-Absatz nötig. |
| Fachbegriffe | rehype-Plugin bleibt; Glossar-Anker | – |

## Offen (Kadir)
1. Kanäle `@wattwas` anlegen (YouTube, TikTok, Instagram) – Links sind schon gesetzt.
2. Newsletter-Anbieter wählen → `social.json` `newsletterAction` + Datenschutz.
3. Affiliate-Programm (Amazon PartnerNet o. ä.) → `werkzeuge.json` URLs, `affiliateAktiv: true`, Datenschutz + Impressum.
4. Search Console (weiterhin offen).

## Offen (Joseph)
- Übersetzung der neuen DE-Seiten (themen, grundlagen/index, elektrowerkzeuge/*, blog/*, ueber) mit `translate.py`.
- Erste 3 Shorts produzieren; `videos.json` pflegen.
- Automatisierung / Kfz-Elektrik / Messen & Prüfen: erste echte Seiten, dann Karten verlinken.
