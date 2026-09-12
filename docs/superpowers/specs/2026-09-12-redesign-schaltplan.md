# Redesign „technischer Schaltplan“ — 12. Sep 2026

Ziel: wattwas.de wirkt wie ein lebendiges Fachbuch — präzise, sicher, freundlich; motiviert Azubis 16–25.
Inhalte und Struktur unverändert; nur Darstellung, Layout, Interaktion.

## Entscheidungen
| Thema | Entscheidung | Warum |
|---|---|---|
| Technik | Starlight `customCss` + Astro-Overrides (`Hero`, `Footer`), kein Tailwind, kein Framer Motion | Framer Motion bräuchte eine React-Insel (~45 kB JS) für 3 Fade-ins; IntersectionObserver macht das in 15 Zeilen. Tailwind kollidiert mit Starlights Layer-System ohne Nutzen. Seite bleibt 0 kB Framework-JS. |
| Schriften | `@fontsource-variable/inter` + `@fontsource-variable/space-grotesk`, selbst gehostet | Google-Fonts-Hotlink = IP-Übertragung in die USA (LG München I, 3 O 17493/20). Datenschutzerklärung bleibt wahr. |
| Farben | Schiefer `#1E293B`, Weiß, Bernstein `#F59E0B`. Auf Weiß Bernstein-Text als `#B45309` (5,0:1) | WCAG AA: `#F59E0B` auf Weiß nur 2,1:1 → nur als Fläche/Rahmen oder auf Schiefer (8,3:1). |
| Kopfzeile | Beide Themes Schiefer; Starlight-Variablen lokal in `header.header` umgebogen | „Handbuch-Umschlag“ bleibt konstant, Inhalt hell/dunkel nach Nutzerwahl. |
| Sicherheitsbox | Bernstein statt Starlight-Rosa | Warngelb der Elektrotechnik; hält die 3-Farben-Palette. |
| Fachbegriffe | rehype-Plugin markiert pro Seite das erste Vorkommen jedes Glossar-Begriffs (89 Einträge, Varianten + Flexion) als `<a><dfn class="fachbegriff">` mit Anker ins Glossar | Kein Eingriff in Inhalte; 96 Seiten × 8 Sprachen automatisch; Mono + Bernstein-Hintergrund. Überschriften, Links, Code ausgenommen. |
| Startseite | Hero (Titel/Tagline aus Frontmatter, CTA, 8 Sprach-Pills, animierter Stromkreis) → 3 Bauteil-Karten (K1–K3) → Lernpfad (4 Kapitel, Lesezeit, Lernfeld-Tags, Lesefortschritt) → Anleitungs-Karten (Stufe-Badge, Lesezeit) | Kartentexte bleiben im jeweiligen `index.mdx`; Kapitel/Anleitungen aus der Sammlung (Titel pro Sprache, Fallback de). |
| Lesefortschritt | `localStorage['wattwas.gelesen']`, gesetzt in `MarkdownContent`, gelesen in `Startseite` | Motivation ohne Konto/Server; in Datenschutzerklärung ergänzt. |
| Bewegung | CSS-Keyframes (Stromfluss, Impulspunkt via `offset-path`), Scroll-Reveal via IO + 1,5-s-Fallback, `prefers-reduced-motion` respektiert | Leicht, abschaltbar, kein JS-Framework. |
| Link-Validator | `exclude: ['/*/glossar/#begriff-*']` | Anker entstehen in `Glossar.astro`, nicht aus Markdown-Überschriften. |
| Markdown-Prozessor | `@astrojs/markdown-remark` `unified({ rehypePlugins })` | Astro 7 nutzt Sätteri; rehype braucht unified. |

## Dateien
`src/styles/wattwas.css` · `src/components/{Hero,Footer,Startseite,SchemaIcon}.astro` · `src/components/schemata/HeroSchaltkreis.astro` ·
`src/data/{startseite-ui.json,begriff-slug.mjs}` · `scripts/rehype-fachbegriff.mjs` · 8× `index.mdx` (hero.title + `<Startseite saeulen>`) ·
`check-site.mjs` 70 Kontrollen.

## Offen
- Echte 400-px-Prüfung im Gerät (headless Chrome erzwingt ~500 px Mindestbreite; Layout ist mobile-first, aber ungesehen).
- Dunkles Theme nur per CSS-Variablen geprüft, kein Screenshot.
- Georgisch/Arabisch/Persisch fallen auf Systemschriften zurück (Inter/Space Grotesk decken die Schriftsysteme nicht ab).
