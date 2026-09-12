# wattwas – Neuaufbau: Katalog-Layout, Stufen, Werkzeug-Wörterbuch, Marken & Modelle, Geselle Watt, Assistent

Stand: 12. September 2026 · Status: **Design, von Kadir freigegeben (Screens 1–7)** · Nächster Schritt: Implementierungspläne je Teilprojekt

Mockups (verbindlich für Layout, Farben, Bausteine): `docs/superpowers/specs/mockups/2026-09-12-neuaufbau/`
(`D1-katalog-dunkel`, `D2-katalog-hell`, `1-startseite`, `2-artikel`, `3-woerterbuch`, `4-marken`, `5-assistent`, jeweils 1440×900, Startseite und Artikel auch 390×844).

## 1. Auftrag (Kadir, 12. Sep 2026, per Diktat)

Kadir gefällt weder Farbpalette noch Stil der laufenden Seite („Electric Editorial“, dunkel/amber) noch der Zwischenstand „Homepage minimal“ (Branch `homepage-minimal`, nicht gemergt, bleibt liegen). Gewünscht ist eine **wirklich umfassende, nutzerfreundliche Seite**:

1. Neue Palette, neuer Stil. Vorbild: **build.nvidia.com**, aber mit Farben, die zum Thema Elektro passen und die Augen nicht ermüden.
2. Die Startseite ist zu voll. Inhaltslisten in die Seitenleiste. Startseite vorerst leer, Kadir entscheidet nach dem Umbau.
3. Struktur nach **Stufen: Einsteiger, Azubi, Profi**. Stufenwahl beim ersten Besuch, merkbar, jederzeit änderbar.
4. Social-Media-Konten sind noch nicht angelegt, Videos noch nicht produziert: **nichts davon anzeigen, bis es echt ist**.
5. Ein **Werkzeug-Wörterbuch**: deutsche Namen von Werkzeug und Material, übersetzt in die gewählte Sprache.
6. Die **Suche** an einen sinnvollen Platz.
7. Ein Bereich **Marken & Modelle**, in dem die in der Branche verwendeten Geräte vorgestellt und laufend aktualisiert werden.
8. Ein **KI-Assistent nur für die Seite**, Vorbild Check24-Assistent: beantwortet alles Relevante, zeigt die passenden Seiten, handelt nicht, alle Sprachen. Nicht außerhalb der Seite nutzbar.
9. Eine Figur: **ein Geselle**, der die Nutzer wie ein Ausbilder durch die Seite begleitet.

## 2. Entscheidungen (mit Kadir abgestimmt)

| Thema | Entscheidung | Warum |
|---|---|---|
| Technischer Weg | **Weiter Astro 7 + Starlight 0.42**, Layout über Component-Overrides (Header, Sidebar, PageFrame, Search, ThemeSelect) und globales CSS. Kein Tailwind, kein Framework-Wechsel. | i18n (9 Locales, RTL, Fallback-Banner, hreflang), Pagefind-Suche, 217 Seiten und 83 Tests bleiben. Ein Neubau ohne Starlight hätte Wochen gekostet. |
| Stil | **D1**: Katalog-Layout wie build.nvidia.com (Top-Tabs, Suche rechts oben mit Strg K, Filter-Seitenleiste, Kartenraster, kleine Pills). **Dunkel als Standard**, hell wählbar. | Kadirs Wahl nach Screens A/B/C/D1/D2. |
| Palette | Graphit statt Schwarz, weiches Weiß statt Reinweiß, **Elektro-Blau** als einzige Akzentfarbe. Stufenfarben Grün/Blau/Violett, Sicherheit Rot nur als Rahmen. | „Zum Thema Elektro passend, nicht ermüdend.“ Kein Amber mehr. |
| Stufen | `stufe: einstieg \| azubi \| profi` in jedem Inhalts-Frontmatter (Pflicht, Test). Wahl beim ersten Besuch (Geselle-Karte), `localStorage`, Chip im Header. **Nichts wird versteckt, nur sortiert und empfohlen.** | Kadir: „Girişte seviye seçimi“. Verstecken würde SEO und Verlinkung brechen. |
| Startseite | Vorerst nur Wortmarke, ein Satz, Stufenwahl, Sprachen, Button „Entdecken“. Endgültiger Inhalt nach dem Umbau. | Kadir: „şimdilik boş bırak“. |
| Katalog | Neue Seite `/entdecken/` je Locale übernimmt, was bisher die Startseite tat: Empfehlungen nach Stufe, Themen, Werkzeug, „Marken & Modelle · zuletzt aktualisiert“. | Entspricht „Explore“ bei NVIDIA. |
| Social/Video | Kanal-Icons nur, wenn `url` gesetzt; Videos nur mit `status: "live"` und `url`. Heute also **keine** Icons, **kein** Video-Bereich, **kein** „Folge uns“. Tests prüfen die Abwesenheit. | Kadir: „şimdiden eklemek saçma“. |
| Suche | Rechts oben im Header, Tastenkürzel Strg K, weiter Pagefind. Mobil ein Icon. | Wie im Vorbild; Kadir: alter Platz „saçma“. |
| Werkzeug-Wörterbuch | Eigene Seite unter Werkzeug, Datenquelle `src/data/woerterbuch.json`, Tabelle Deutsch → UI-Sprache, Kategorie-Filter, Suche, Bildplatz. | Punkt 5 des Auftrags. |
| Marken & Modelle | Eigener Top-Tab, Datenquelle `src/data/marken.json` + Änderungsprotokoll, Kategorieseiten mit Karten und Vergleichstabelle, „Stand MM/JJJJ“. Kein Affiliate, keine Sterne. | Punkt 7 des Auftrags; Regeln aus der Electric-Editorial-Spec bleiben. |
| Assistent | **Cloudflare Worker → Anbieter direkt** (OpenAI-kompatible API, kostenloser Tarif; Anbieter wird im Plan nach gemessenen Limits gewählt). Kein Tunnel zu OmniRoute, keine Abhängigkeit vom Heim-PC. | Kadirs Wahl: „Worker → sağlayıcı doğrudan“. |
| Geselle | Figur **„Watt“, Geselle** Energie- und Gebäudetechnik. Flache Strichfigur, per KI (Higgs) als konsistentes Character-Sheet. Gesicht des Assistenten, Hinweiskästen, Onboarding. | Kadirs Wahl: „Çizgi karakter, AI ile“. |
| Schrift | Nur **Inter** (Fließtext 400, Überschriften 600/700). Space Grotesk fällt weg. | Ein Schnitt weniger, ruhigeres Bild, wie NVIDIA Sans. |

## 3. Informationsarchitektur

### 3.1 Top-Tabs (jede Locale, Reihenfolge fix)

| Tab | Route | Inhalt |
|---|---|---|
| Entdecken | `/<locale>/entdecken/` | Katalog (siehe 5) |
| Lernen | `/<locale>/lernen/` | Hub: Grundlagen, Sicherheit, Themen (Energie- und Gebäudetechnik), Anleitungen; ersetzt die bisherigen Hubs `/grundlagen/` und `/themen/` **nicht**, sondern verlinkt sie |
| Werkzeug | `/<locale>/elektrowerkzeuge/` | Bestehender Hub + Grundausstattung + Wörterbuch |
| Marken & Modelle | `/<locale>/elektrowerkzeuge/marken/` | Übersicht + Kategorieseiten |
| Glossar | `/<locale>/glossar/` | Bestehend |
| Blog | `/<locale>/blog/` | Bestehend |

Über wattwas, Mitglied werden, Rechtliches: nur im Footer und in der Seitenleiste-Gruppe „Mehr“. Bestehende URLs bleiben alle gültig; neue Seiten kommen hinzu, es wird nichts verschoben (keine neuen Redirects nötig).

### 3.2 Seitenleiste

- **Auf Inhaltsseiten:** Starlight-Sidebar, neu gruppiert: Grundlagen · Energie- und Gebäudetechnik · Werkzeug (Grundausstattung, Wörterbuch, Marken & Modelle) · Blog · Mehr (Über, Mitglied, Glossar, Rechtliches). Jede Seite trägt rechts ihre **Stufen-Pill** (Starlight `sidebar.badge` aus dem Frontmatter, muss zu `stufe` passen; Test).
- **Auf Entdecken, Wörterbuch, Marken:** Filter-Seitenleiste (Gruppen: Für dich, Stufe, Themen, Werkzeug bzw. Kategorie), aktiver Eintrag mit blauem Balken links.
- **Unten immer:** Geselle-Kasten (Bild, Name, ein Satz Kontext; Text pro Seite aus Frontmatter `geselle` oder Standard je Bereich).
- Mobil: Seitenleiste als Drawer über das Menü-Icon; Filter als „Filter“-Chip über dem Raster.

### 3.3 Stufen

- Werte: `einstieg` (Label: Start), `azubi` (Azubi), `profi` (Profi). Labels je Locale in `startseite-ui.json` → neuer Block `stufen`.
- Frontmatter jeder Inhaltsseite (alle Locales): `stufe` **Pflicht**; Übersetzungen erben den Wert der deutschen Quelle (Test: gleiche Datei, gleicher Wert in allen Locales). Heute tragen alle 12 Seiten `einstieg`; im Teilprojekt 1 wird die Stufe je Seite neu vergeben (Vorschlag in Anhang A).
- Speicherung: `localStorage["ww-stufe"]`; bis zur Wahl gilt `einstieg`. `<html data-stufe="…">` wird per Inline-Script vor dem Rendern gesetzt (kein Flackern).
- Wirkung: Reihenfolge der Blöcke auf Entdecken („Empfohlen für Start“ zuerst), Hinweis oben auf Inhaltsseiten („Diese Seite ist für Azubi. Für den Einstieg: …“, nur wenn Stufe der Seite ≠ gewählte Stufe), Systemprompt des Assistenten (Tonlage, Tiefe).
- Onboarding: Karte auf der Startseite (Screen 1). Auf anderen Seiten, wenn noch keine Wahl: einzeilige Leiste unter dem Header, einmal wegklickbar (`localStorage["ww-stufe-hinweis"]`).
- Kein Verstecken, kein Login, kein Tracking.

## 4. Design-System D1

### 4.1 Tokens

| Token | Dunkel (Standard) | Hell |
|---|---|---|
| `--ww-bg` | `#121417` | `#F4F6F8` |
| `--ww-surface` | `#191C21` | `#FFFFFF` |
| `--ww-surface-2` | `#1F242B` | `#EEF2F6` |
| `--ww-line` | `#2A2F36` | `#DCE2E8` |
| `--ww-text` | `#E3E7EB` | `#1C2430` |
| `--ww-muted` | `#8F98A3` | `#5D6B7A` |
| `--ww-accent` | `#4DA3FF` | `#1F6FEB` |
| `--ww-accent-soft` | `rgba(77,163,255,.14)` | `rgba(31,111,235,.10)` |
| `--ww-stufe-einstieg` | `#5CC98A` | `#1F9D55` |
| `--ww-stufe-azubi` | `#4DA3FF` | `#1F6FEB` |
| `--ww-stufe-profi` | `#C084FC` | `#7C3AED` |
| `--ww-sicherheit` | `#FF7B7B` | `#D64545` |

Regeln: Akzent für Links, aktive Tabs, Balken, Rahmen bei Hover/Fokus und den einen gefüllten Button pro Ansicht. Keine Verläufe, keine Glows, keine Schatten außer dem Assistenten-Drawer. Alle Text/Hintergrund-Paare AA (Muted auf Surface ≥ 4,5:1, geprüft im Plan). Starlight-Variablen (`--sl-color-*`) werden auf diese Tokens gemappt; die alten `--ww-amber`, `--ww-cyan`, `--ww-grad`, `--ww-grid-line` fallen weg (Suche nach Resten im Plan).

Theme: `ThemeProvider`/`ThemeSelect` bleiben überschrieben: Standard dunkel, hell nur bei ausdrücklicher Wahl, Umschalter im Header (Icon).

### 4.2 Typografie und Maße

Inter (self-hosted, bestehend). Fließtext 15–16 px / 1,55. H1 28 px/700, H2 20 px/600, H3 17 px/600, Kartentitel 17 px/600, Pills 11 px/600, Gruppenlabels 11 px Versalien mit Laufweite. Inhaltsbreite Artikel 680 px + Inhaltsverzeichnis 220 px. Radius 4 px (Controls), 8 px (Karten, Banner), 999 px (Pills, Assistent). Header 52 px, Seitenleiste 250 px.

### 4.3 Bausteine (alle in Screens sichtbar)

Top-Nav mit Tabs · Suche (Strg K) · Stufen-Chip · Sprach-Chip · Theme-Icon · Filter-Seitenleiste · Geselle-Kasten · Banner (Geselle + Text + Button) · Karte (Kicker, Titel, Text, Fußzeile mit Pills) · Pills (Stufe, Tag, Sicherheit) · Sicherheitskasten (roter Balken links) · „Der Geselle sagt“-Kasten (blau getönt) · Abbildungsrahmen · Quiz-Kasten · Vorher/Danach-Karten · Inhaltsverzeichnis rechts · Tabelle (Wörterbuch, Vergleich) · Notiz-Kasten · Assistenten-Pill und Drawer · Stufenwahl-Karte · Sprachreihe.

### 4.4 Responsiv, RTL, Barrierefreiheit

- < 760 px: Tabs im Drawer, Suche als Icon, Seitenleiste als Drawer, Raster einspaltig, Inhaltsverzeichnis weg, Assistent-Drawer vollflächig.
- `ar`/`fa`: logische CSS-Eigenschaften überall (Balken links → `inset-inline-start`), Pills und Tabellen spiegeln; Schemata bleiben LTR wie heute.
- Fokusringe in Akzent, `prefers-reduced-motion` schaltet Übergänge ab, Pills nie als einzige Informationsträger (Text bleibt).

## 5. Entdecken (`/entdecken/`)

Blöcke in dieser Reihenfolge, nach gewählter Stufe umsortiert (JS, ohne Layout-Sprung, da alle Blöcke gerendert sind):

1. Banner: Geselle begrüßt, ein Satz je Stufe, Button zum ersten empfohlenen Inhalt.
2. „Empfohlen für <Stufe>“: 4–6 Karten aus `src/data/entdecken.json` (je Locale und Stufe eine geordnete Liste von Slugs; Karteninhalt aus dem Frontmatter der Zielseite: Bereich, Titel, `description`, Stufe, Tags, Lesezeit, Quizanzahl).
3. „Themen“: Karten je Bereich (Grundlagen, Sicherheit, Energie- und Gebäudetechnik, Anleitungen, Prüfen & Messen), mit Seitenzahl.
4. „Werkzeug“: 3 Karten (Grundausstattung, Wörterbuch, Marken & Modelle).
5. „Marken & Modelle · zuletzt aktualisiert“: die 2–4 zuletzt geänderten Modelle aus `marken.json`.

Filter-Seitenleiste: Für dich (Empfohlen, Zuletzt gelesen aus dem bestehenden Lesefortschritt), Stufe (Zähler), Themen, Werkzeug. Filter wirken client-seitig auf die Karten (Attribute `data-stufe`, `data-bereich`).

## 6. Werkzeug-Wörterbuch (`/elektrowerkzeuge/woerterbuch/`)

- Daten `src/data/woerterbuch.json`: `{ id, kategorie, de: { artikel, singular, plural, umgangssprache?, kuerzel? }, wofuer: { de, leicht, en, tr, ru, ar, fa, ka, sq }, i18n: { tr: { begriff, hinweis? }, en: …, ru, ar, fa, ka, sq }, bild?: "img/werkzeug/<id>.webp", marken?: ["modell-id"] }`.
- Kategorien: Handwerkzeug, Messen & Prüfen, Material, PSA, Maschinen.
- Startumfang: 80–100 Begriffe (Quellen: Glossar, `werkzeuge.json`, Grundausstattungsliste, Anleitungen). Übersetzung wie bisher (Claude für Kurzes, LM Studio für Masse), Kennzeichnung „maschinell übersetzt, wird geprüft“ bis zur Freigabe je Sprache.
- Seite: Suchfeld (client-seitig, deutsch und Zielsprache), Chips „Deutsch → <UI-Sprache>“, „A–Z“, „Nur Grundausstattung“; Tabelle (Bild · Deutsch mit Artikel/Plural · Zielsprache mit Hinweis · Wofür · Marken & Modelle-Link). Mobil: Karten statt Tabelle. Ohne Bild: gestrichelter Platzhalter „Foto folgt“ (kein Icon-Ersatz).
- Auf `de` zeigt die Spalte „Zielsprache“ Englisch; auf `leicht` die Leichte-Sprache-Erklärung.

## 7. Marken & Modelle (`/elektrowerkzeuge/marken/`, `/elektrowerkzeuge/marken/<kategorie>/`)

- Daten `src/data/marken.json`: `kategorien[] { id, name: {…9 Sprachen}, kurz: {…} }`, `modelle[] { id, marke, modell, kategorie, stufe, budget: 1|2|3, verbreitet: boolean, kurz: {…9 Sprachen}, specs: [{ k, v }], datenblatt?: url, stand: "JJJJ-MM", quelle: string }`. Änderungsprotokoll `src/data/marken-changelog.json`: `[{ datum, modell, text }]`.
- Startkategorien: Spannungsprüfer, Multimeter, Installationstester, Akkuschrauber, Zangen, Schraubendreher, Abisolierwerkzeug, Kabelfinder & Ortung, Bohrhammer, PSA. Je Kategorie 3–6 Modelle zum Start, Daten aus Herstellerdatenblättern (Quelle im Datensatz).
- Übersicht: Kategorie-Karten mit Modellzahl und „Stand“. Kategorieseite: Filter-Seitenleiste (Kategorien, Stufe, Budget, „im Betrieb verbreitet“), Karten (Logo-Platzhalter bis Kadir Logos freigibt oder Marken als Text), Vergleichstabelle, Änderungsprotokoll, Notiz „keine Kaufempfehlung, keine Partner-Links“.
- Pflege: monatlicher Durchgang durch Joseph (Datenblätter, Nachfolgemodelle, Preise nur als Budgetstufe), Eintrag ins Protokoll, „Stand“ hochsetzen. Affiliate bleibt aus (`affiliateAktiv: false`), Datenblatt-Links nur zum Hersteller mit `rel="noopener"`.
- Marken- und Modellnamen werden nie übersetzt.

## 8. Geselle Watt

- Identität: Watt, Geselle Energie- und Gebäudetechnik, Anfang zwanzig, ruhig, genau, freundlich, sicherheitsbewusst, duzt. Sagt nie „kostenlos“/„jetzt“, keine Ausrufezeichen, ein Gedanke pro Satz. Spricht die UI-Sprache.
- Bild: flache Strichfigur, wenig Farben (Helm Gelb `#F2B705`, Kleidung Graphit, Haut warm), transparenter Hintergrund, funktioniert auf Dunkel und Hell. Erzeugung: Higgs (Character-Sheet-Workflow) mit festem Referenzbild; Posen: Winken, Zeigen, Warnen (Hand hoch), Denken, Daumen hoch, Werkzeug halten, Lesen, Schulterzucken (für „weiß ich nicht“). Export WebP (≤ 40 kB je Pose) + eine SVG-Kopf-Variante für 24–44 px.
- Einsatz: Stufenwahl-Karte, Seitenleisten-Kasten, MDX-Komponente `<Geselle>…</Geselle>` („Der Geselle sagt“), Assistent (Avatar, Drawer-Kopf), leere Zustände, 404. **Nicht** auf Impressum/Datenschutz/Haftung.
- Lizenz/Recht: KI-Bilder ohne Fremdmarken, kein Ähnlichkeitsbezug zu realen Personen, Hinweis in „Über wattwas“.

## 9. Assistent „Frag den Gesellen“

### 9.1 Architektur

```
Browser (Drawer, lädt erst bei Klick)
   → POST https://assist.wattwas.de/v1/ask  { frage, locale, stufe, seite }
Cloudflare Worker (Origin-Check, Rate-Limit, Prompt, Retrieval)
   → Anbieter-API (OpenAI-kompatibel, kostenloser Tarif; Auswahl im Plan)
   ← { antwort, quellen[{titel,url,bereich}], vorschlaege[] }
```

- Retrieval ohne Embeddings: beim Build entsteht je Locale `dist/assist/index-<locale>.json` (Chunks: Seitentitel, URL, Überschrift, ~500 Zeichen Text, Stufe, Bereich). Der Worker lädt den Index beim Deploy in KV und rankt mit BM25 (MiniSearch); Top-6 Chunks gehen in den Prompt. Kein externer Vektordienst.
- Systemprompt: Rolle (Watt), **nur wattwas-Inhalte** als Wissensquelle, Antwort in `locale`, Tiefe nach `stufe`, jede Antwort mit Quellen-URLs aus dem Kontext, keine Handlungen, keine Kaufempfehlung, Sicherheitshinweis bei Arbeiten an Anlagen, höfliche Ablehnung bei Themen außerhalb (Vorschlag: Glossar/Suche). Leichte Sprache: kurze Sätze.
- Missbrauchsschutz: Origin/Referer-Allowlist (`wattwas.de`, Vorschau-Domain), CORS nur dafür, Rate-Limit je IP-Hash (20 Anfragen / 10 Min, KV mit TTL), Eingabe ≤ 1000 Zeichen, Ausgabe ≤ 600 Tokens, Tages-Obergrenze global (Circuit-Breaker → „Der Geselle macht gerade Pause“), Kill-Switch per Env-Variable, optional Turnstile bei Missbrauch.
- Kosten: nur kostenlose Tarife; Worker Free-Plan (100 000 Anfragen/Tag). Anbieterwahl im Plan anhand gemessener Limits und Nutzungsbedingungen (Kandidaten: Groq, Google Gemini API, NVIDIA API). Abstraktion über eine Funktion `frageModell()`, damit der Anbieter austauschbar bleibt.

### 9.2 Oberfläche (Screen 5)

Pill rechts unten → Drawer rechts (420 px, mobil vollflächig): Kopf mit Watt, Untertitel „Antwortet nur aus wattwas-Inhalten · <Sprache>“, Verlauf (sessionStorage), Antworten mit Quellen-Karten (Link auf die Seite, Bereich), Vorschlags-Chips, Eingabe, Hinweiszeile (nur Seiteninhalt, handelt nicht, kann irren, Elektrofachkraft, Datenschutz-Link). Kein Streaming in der ersten Version.

### 9.3 Datenschutz

Neuer Abschnitt in der Datenschutzerklärung (9 Sprachen): Zweck, übermittelte Daten (Frage, Sprache, Stufe, aktuelle Seite; kein Name, kein Konto), Anbieter mit Sitz/Land, IP nur gehasht für 10 Minuten zum Rate-Limit, keine Cookies, keine Speicherung der Fragen über die Sitzung hinaus. Drawer lädt keinen Fremdcode vor dem ersten Klick; bis dahin keine Anfrage an Dritte.

## 10. Sichtbarkeitsregeln Social und Video

- `social.json`: Kanal ohne `url` → kein Icon im Header, Footer, Über-Seite; Mitglied-Seite nennt Kanäle nur als Text „in Vorbereitung“.
- `videos.json`: nur `status: "live"` mit `url` wird gerendert (Entdecken-Block „Neu“, später Video-Seite). Heute: kein Block, keine Platzhalter, kein „Bald online“.
- Tests: Header ohne `youtube.com/@`, Startseite/Entdecken ohne `class="video`.

## 11. Nicht-Ziele (bewusst weggelassen)

Kein Login/Konto, keine Kommentare, kein Newsletter-Backend, keine Video-Embeds, kein Affiliate, keine Sternebewertungen, keine Gamification über Stufe und bestehenden Lesefortschritt hinaus, kein Verstecken von Inhalten nach Stufe, kein Streaming im Assistenten (v1), keine Bildgenerierung für Werkzeugfotos (nur echte Fotos, sonst Platzhalter).

## 12. Teilprojekte und Reihenfolge

| Nr | Teilprojekt | Umfang | Abhängigkeit |
|---|---|---|---|
| **TP1 Fundament** | Design-System D1, Overrides (Header, Sidebar, PageFrame, Search, Theme), Stufen (Frontmatter, Wahl, Chip, Hinweis), Startseite-Platzhalter, `/entdecken/`, `/lernen/`, Sichtbarkeitsregeln, Sidebar-Badges, Tests, Screenshots de/tr/ar/leicht, Rückbau alter Startseiten-Komponenten (Startseite, Hero, HeroLinie, Kanaele-Pills, Lernpfad-Startseite) | keine |
| **TP2 Werkzeug** | `woerterbuch.json` (80–100 Begriffe, 9 Sprachen), Wörterbuch-Seite, `marken.json` + Protokoll, Marken-Übersicht und Kategorieseiten, Übersetzungen, Tests | TP1 (Layout) |
| **TP3 Geselle** | Identität, Character-Sheet via Higgs, Export, `<Geselle>`-Komponente, Einbau in TP1-Stellen | parallel zu TP1 möglich; TP1 nutzt bis dahin die SVG-Kopfvariante |
| **TP4 Assistent** | Index-Build, Worker (Repo-Ordner `worker/`), Anbieterwahl, Drawer, Datenschutz-Abschnitt, Tests, Missbrauchsschutz, Deploy | TP1, Cloudflare-Konto, Anbieter-Schlüssel |

Jedes Teilprojekt: eigener Plan (`docs/superpowers/plans/`), eigener Branch von `neuaufbau`, deutsche Commits, Tests nie unter dem aktuellen Stand (83), Screenshots vor dem Merge, kein Push ohne Kadirs Wort. Die Live-Seite bleibt unverändert, bis TP1 als Ganzes live geht.

## 13. Offene Punkte

**Kadir:** endgültiger Inhalt der Startseite (nach TP1) · Cloudflare-Konto und Subdomain `assist.wattwas.de` · Anbieter-Schlüssel für den Worker · Freigabe des Geselle-Character-Sheets · Startliste der Marken-Kategorien (Vorschlag in Abschnitt 7) · Kanäle anlegen, dann `url` setzen.

**Joseph:** Stufenvergabe je Seite (Anhang A) · Begriffsliste Wörterbuch · Recherche Marken/Modelle mit Quellen · Anbietertest (Limits, Nutzungsbedingungen) · Kontrastprüfung der Tokens.

## Anhang A · Vorschlag Stufen je bestehender Seite

| Seite | Stufe |
|---|---|
| grundlagen/strom-spannung-widerstand, netz-und-leiterfarben, sicherheitsregeln | einstieg |
| grundlagen/schutzorgane | azubi |
| themen/…/berufsbild, lernfelder | einstieg |
| themen/…/weiterbildung | azubi |
| themen/…/wechselschaltung-steckdose | einstieg |
| themen/…/unterverteilung, zaehlerplatz | azubi |
| elektrowerkzeuge/grundausstattung-azubi | einstieg |
| blog/fehler-des-tages-1-rcd-gruppen | azubi |

Profi-Inhalte gibt es noch nicht; erste Kandidaten: Erstprüfung nach DIN VDE 0100-600, Messen & Prüfen, Fehlersuche. Sie entstehen nach TP2 als eigener Inhaltsplan.
