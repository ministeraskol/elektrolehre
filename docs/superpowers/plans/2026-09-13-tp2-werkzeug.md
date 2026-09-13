# wattwas Neuaufbau · TP2 Werkzeug — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Werkzeug-Wörterbuch (`/elektrowerkzeuge/woerterbuch/`, 85 Begriffe, 9 Sprachen, Suche + Filter) ve Marken & Modelle (`/elektrowerkzeuge/marken/` + 10 Kategorieseiten, Datenblatt-Quellen, Änderungsprotokoll) — Marken-Tab açılır, Entdecken'de Werkzeug 4 kart + Marken bloğu görünür; affiliate alanı hazır ama kapalı.

**Architecture:** Veri = iki JSON (`woerterbuch.json`, `marken.json` + `marken-changelog.json`), sayfalar = ince MDX (9 locale) + Astro bileşenleri (`Woerterbuch`, `WoerterbuchFilter`, `Marken`, `MarkenKategorie`, `MarkenFilter`). Filtre/arama yalnız client-side custom element (`<ww-woerterbuch>`, `<ww-marken>`), her şey render edilir, JS sadece `hidden` yazar (TP1 Entdecken kalıbı). Kategori sayfaları `scripts/marken-seiten.mjs` ile `marken.json`'dan üretilir (99 dosya elle yazılmaz). Çeviriler: kısa UI dizgileri uygulayıcı tarafından, Wörterbuch kütlesi `scripts/translate_woerterbuch.py` (worker, `translate_glossar.py` kalıbı).

**Tech Stack:** Node 26, Astro 7.3.2, @astrojs/starlight 0.42.0, Python 3 (`~/.claude/skills/worker/scripts/worker.py`, rol `omni`), Playwright (npx cache, `scratch/screens.cjs`).

**Spec:** `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` §3.1–3.2, §5 (4–5), **§6, §7**, §12, §14; Kadir'in geri bildirimi `docs/superpowers/specs/2026-09-13-rueckmeldung-tp1.md` (R1: hiçbir "maschinell übersetzt" kutusu yok; R6: affiliate alanı hazır, kapalı).

## Global Constraints

- Repo `C:\Users\kadir\Projects\Elektrolehre`. Branch **`tp2-werkzeug`**, `neuaufbau` üzerinden, worktree `.worktrees/tp2-werkzeug` (uygulayıcı **yalnız worktree içinde** çalışır; `npm ci` orada). **Push YOK.** Commit mesajları Almanca, `git commit -F <dosya>`, sonunda `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Locale'ler: `de` (kaynak), `leicht`, `tr`, `en`, `ru`, `ar` (rtl), `fa` (rtl), `ka`, `sq`. `leicht` için de yeni sayfalar yazılır (Wörterbuch `wofuer.leicht` taşır); Marken kategori sayfalarında `leicht` = de metni.
- Locale çözümü her yeni bileşende: `const locale = Astro.locals.starlightRoute.locale ?? 'de';` (asla `Astro.currentLocale`).
- UI metinleri `src/data/startseite-ui.json` → yeni bloklar `woerterbuch`, `marken`; 9 locale'de aynı anahtarlar (mevcut parite testi 159. satır otomatik kapsar).
- **Fachbegriff kuralı:** Almanca terim, marka ve model adları hiçbir dilde çevrilmez (`lang="de" translate="no"`). Hiçbir sayfada "maschinelle Übersetzung" kutusu yok (R1); veri kalitesi `_hinweis` alanında not edilir.
- **Affiliate:** `werkzeuge.json.affiliateAktiv` ve `marken.json.affiliateAktiv` `false` kalır; `modelle[].affiliate?: { anbieter, url }` şemada var, render edilmez (R6, Kadir hesap açınca ayrı görev). Datenblatt linkleri yalnız üreticiye, `rel="noopener"`, `target="_blank"`.
- D1 tokenları ve ortak sınıflar TP1'den (`.ww-karte`, `.ww-pill`, `.ww-chip`, `.ww-grp`, `.ww-side`, `.ww-side-a`, `.ww-sec`, `.ww-sub`, `.raster`). Radius yalnız `var(--ww-radius)` (8), `var(--ww-radius-s)` (4), 999px pill. Yeni renk yok. Mantıksal CSS özellikleri (`padding-inline`, `inset-inline-start`, `text-align: start`).
- Katalog düzeni (72rem) `istKatalog()` ile otomatik: `elektrowerkzeuge/woerterbuch` ve `elektrowerkzeuge/marken(/…)` zaten `'woerterbuch' | 'marken'` döner (`src/scripts/seiten.ts`).
- Testler: `npm run build && npm test` → tümü geçmeli; başlangıç 116, plan sonunda ≈ 136. Kaynak testleri build gerektirmez (`node scripts/check-site.mjs` FAIL satırlarını grep ile süz).
- Windows/Bash: heredoc kırılır → çok satırlı dosyalar **Write** aracıyla; tek satır `node -e`/`python -c` Bash'te. Build ≈ 15 s, `npm test` ≈ 5 s.
- Astro scoped class: `class="x astro-XXXX"` → testler `class="[^"]*\bx\b` / `(?: astro-[\w-]+)?` ile gevşetilir (TP1 ruling).

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `src/data/woerterbuch.json` | 85 Begriff: id, kategorie, grundausstattung, de {artikel, singular, plural, umgangssprache?, kuerzel?}, wofuer {de, leicht, 7 dil}, i18n {7 dil: begriff, hinweis?}, bild?, marken? |
| `scripts/translate_woerterbuch.py` | worker ile `wofuer` + `begriff/hinweis` çevirisi, doğrulama, JSON'a merge |
| `src/data/marken.json`, `src/data/marken-changelog.json` | 10 Kategorie (name/kurz 9 dil), 30–60 Modell (specs, datenblatt, stand, quelle), affiliateAktiv:false; protokol |
| `scripts/marken-seiten.mjs` | `marken.json` → `src/content/docs/<locale>/elektrowerkzeuge/marken/<kategorie>.mdx` (99 dosya, idempotent) |
| `src/data/startseite-ui.json` | bloklar `woerterbuch`, `marken` (9 locale) |
| `src/data/tabs.json` | `marken.aktiv: true` |
| `src/components/Woerterbuch.astro`, `WoerterbuchFilter.astro` | tablo/kart, arama, chip'ler, kategori filtresi (custom element `<ww-woerterbuch>`) |
| `src/components/Marken.astro`, `MarkenKategorie.astro`, `MarkenFilter.astro` | übersicht kartları + protokol; kategori kartları + karşılaştırma tablosu + filtre (custom element `<ww-marken>`) |
| `src/components/Sidebar.astro` | `katalog === 'woerterbuch'` → `<WoerterbuchFilter/>`, `'marken'` → `<MarkenFilter/>` |
| `src/components/Entdecken.astro` | Marken kartı kicker: kategori adı (id yerine) |
| `src/content/docs/<9>/elektrowerkzeuge/woerterbuch.mdx`, `…/marken/index.mdx`, `…/marken/<10>.mdx` | ince MDX |
| `scripts/check-site.mjs` | yeni testler; TP1'de "vor TP2" varsayan 2 test güncellenir |
| `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` §15 | TP2 sapmaları |

---

### Task 1: Worktree, Wörterbuch-Datenmodell, 85 deutsche Begriffe, Quelltests

**Files:**
- Create: `src/data/woerterbuch.json`
- Test: `scripts/check-site.mjs` (kaynak testleri, build gerekmez)

**Interfaces:**
- Produces: `woerterbuch.json` → `{ _hinweis, kategorien: string[], eintraege: Eintrag[] }`; `Eintrag = { id, kategorie: 'handwerkzeug'|'messen'|'material'|'psa'|'maschinen', grundausstattung: boolean, de: { artikel: 'der'|'die'|'das', singular, plural, umgangssprache?: string, kuerzel?: string }, wofuer: { de, leicht, en?, tr?, ru?, ar?, fa?, ka?, sq? }, i18n: { [lang]: { begriff, hinweis? } }, bild?: string, marken?: string[] }`. Task 2 `wofuer.<lang>` ve `i18n` doldurur; Task 4 render eder; Task 5 `marken[]` model id'lerine bağlar.

- [ ] **Step 1: Worktree + branch**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git worktree add .worktrees/tp2-werkzeug -b tp2-werkzeug neuaufbau && cd .worktrees/tp2-werkzeug && npm ci && git log --oneline -1
```

- [ ] **Step 2: Kaynak testleri (check-site.mjs, `// TP1 · Task 12` bloğundan sonra, dizinin sonuna)**

```js
  // TP2 · Task 1: Wörterbuch-Daten
  ['Wörterbuch: JSON gültig, 5 Kategorien, ≥ 80 Einträge, ids eindeutig/kebab-case', () => { const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const ids = w.eintraege.map((e) => e.id); return w.kategorien.join() === 'handwerkzeug,messen,material,psa,maschinen' && w.eintraege.length >= 80 && new Set(ids).size === ids.length && ids.every((i) => /^[a-z0-9-]+$/.test(i)) && w.eintraege.every((e) => w.kategorien.includes(e.kategorie)); }],
  ['Wörterbuch: jeder Eintrag de {artikel, singular, plural}, wofuer.de + wofuer.leicht (≤ 160 Zeichen), grundausstattung boolean', () => JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege.every((e) => ['der', 'die', 'das'].includes(e.de.artikel) && e.de.singular && e.de.plural && e.wofuer.de.length > 10 && e.wofuer.de.length <= 160 && e.wofuer.leicht.length > 10 && e.wofuer.leicht.length <= 160 && typeof e.grundausstattung === 'boolean')],
  ['Wörterbuch: Grundausstattung ≥ 15 Begriffe, jede Kategorie ≥ 8, Umgangssprache ≥ 8 (Flex, Engländer, Lügenstift …)', () => { const e = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege; return e.filter((x) => x.grundausstattung).length >= 15 && ['handwerkzeug', 'messen', 'material', 'psa', 'maschinen'].every((k) => e.filter((x) => x.kategorie === k).length >= 8) && e.filter((x) => x.de.umgangssprache).length >= 8; }],
```

- [ ] **Step 3: Test → FAIL**

```bash
cd /c/Users/kadir/Projects/Elektrolehre/.worktrees/tp2-werkzeug && node scripts/check-site.mjs 2>&1 | grep -E "^FAIL.*Wörterbuch"
```
Beklenen: 3 FAIL (dosya yok).

- [ ] **Step 4: `src/data/woerterbuch.json` — yapı ve 3 tam örnek**

```json
{
  "_hinweis": "Werkzeug-Wörterbuch (Spec §6). Begriff bleibt deutsch (lang=de). wofuer.de/leicht von Hand; wofuer.<lang> und i18n.<lang> per scripts/translate_woerterbuch.py (worker), Stand siehe _stand. bild: img/werkzeug/<id>.webp, fehlt → Platzhalter „Foto folgt“. marken: Modell-ids aus marken.json (TP2 Task 5).",
  "_stand": { "de": "2026-09", "leicht": "2026-09" },
  "kategorien": ["handwerkzeug", "messen", "material", "psa", "maschinen"],
  "eintraege": [
    { "id": "zweipoliger-spannungspruefer", "kategorie": "messen", "grundausstattung": true,
      "de": { "artikel": "der", "singular": "Zweipolige Spannungsprüfer", "plural": "Zweipolige Spannungsprüfer", "umgangssprache": "Duspol" },
      "wofuer": { "de": "Spannungsfreiheit feststellen (Sicherheitsregel 3) – zeigt Spannung zwischen zwei Punkten ohne Messbereichswahl.", "leicht": "Damit prüfst du: Ist Strom auf der Leitung? Erst prüfen, dann arbeiten." },
      "i18n": {}, "marken": [] },
    { "id": "winkelschleifer", "kategorie": "maschinen", "grundausstattung": false,
      "de": { "artikel": "der", "singular": "Winkelschleifer", "plural": "Winkelschleifer", "umgangssprache": "Flex" },
      "wofuer": { "de": "Metall und Stein trennen oder schleifen – z. B. Hutschienen und Kabelkanäle kürzen, Schlitze nacharbeiten.", "leicht": "Eine Maschine zum Schneiden und Schleifen. Schutzbrille ist Pflicht." },
      "i18n": {}, "marken": [] },
    { "id": "aderendhuelse", "kategorie": "material", "grundausstattung": true,
      "de": { "artikel": "die", "singular": "Aderendhülse", "plural": "Aderendhülsen" },
      "wofuer": { "de": "Feindrähtige Leiter vor dem Klemmen bündeln – verhindert abstehende Drähte und schlechte Kontakte.", "leicht": "Eine kleine Hülse für das Ende einer weichen Leitung. Dann hält die Klemme gut." },
      "i18n": {}, "marken": [] }
  ]
}
```

- [ ] **Step 5: Kalan 82 Begriff (id · Artikel Singular / Plural · Umgangssprache · Grundausstattung ✓)**

Her satır bir Eintrag; `wofuer.de` (1 cümle, ≤ 160) ve `wofuer.leicht` (Leichte Sprache: kısa ana cümleler, "du", ≤ 160) uygulayıcı yazar; kaynaklar: `src/content/docs/de/elektrowerkzeuge/grundausstattung-azubi.mdx`, `werkzeuge.json`, `glossar.json`.

**handwerkzeug (28):** schlitzschraubendreher · der Schlitzschraubendreher/-dreher ✓ · kreuzschlitzschraubendreher · der Kreuzschlitzschraubendreher · kuerzel "PH/PZ" ✓ · vde-schraubendreher · der VDE-Schraubendreher · "isolierter Schraubendreher" ✓ · kombizange · die Kombizange · "Kombi" ✓ · seitenschneider · der Seitenschneider ✓ · flachrundzange · die Flachrundzange · "Storchschnabelzange" ✓ · abisolierzange · die Abisolierzange ✓ · kabelmesser · das Kabelmesser ✓ · kabelschere · die Kabelschere ✓ · crimpzange · die Crimpzange · "Presszange" ✓ · aderendhuelsenzange · die Aderendhülsenzange ✓ · wasserpumpenzange · die Wasserpumpenzange · "Pumpenzange" · rollgabelschluessel · der Rollgabelschlüssel · "Engländer" · maulschluessel · der Maulschlüssel · ringschluessel · der Ringschlüssel · steckschluesselsatz · der Steckschlüsselsatz · "Knarrenkasten" · innensechskantschluessel · der Innensechskantschlüssel · "Inbus" · schlosserhammer · der Schlosserhammer ✓ · faeustel · der Fäustel · flachmeissel · der Flachmeißel · cuttermesser · das Cuttermesser · "Teppichmesser" ✓ · metallsaege · die Metallsäge · "Bügelsäge" · feile · die Feile · wasserwaage · die Wasserwaage ✓ · gliedermassstab · der Gliedermaßstab · "Zollstock" ✓ · bandmass · das Bandmaß ✓ · zimmermannsbleistift · der Zimmermannsbleistift ✓ · koerner · der Körner · einziehband · das Einziehband · "Zugfeder, Kabeleinziehfeder" · stufenbohrer · der Stufenbohrer · lochsaege · die Lochsäge · "Dosenbohrer".

**messen (12):** einpoliger-spannungspruefer · der Einpolige Spannungsprüfer · "Lügenstift, Phasenprüfer" · multimeter · das Multimeter · stromzange · die Stromzange · "Zangenamperemeter" · installationstester · der Installationstester · "Prüfkoffer" · durchgangspruefer · der Durchgangsprüfer · isolationsmessgeraet · das Isolationsmessgerät · leitungssucher · der Leitungssucher · "Kabelsuchgerät" · ortungsgeraet · das Ortungsgerät · "Leitungsfinder" · drehfeldmessgeraet · das Drehfeldmessgerät · "Drehfeldprüfer" · steckdosentester · der Steckdosentester · erdungsmessgeraet · das Erdungsmessgerät · messleitung · die Messleitung / Messleitungen · "Prüfspitzen".

**material (24):** ader · die Ader / Adern · mantelleitung · die Mantelleitung · kuerzel "NYM-J" · erdkabel · das Erdkabel · kuerzel "NYY-J" · aderleitung · die Aderleitung · kuerzel "H07V-U/-K" · flexible-leitung · die Flexible Leitung · kuerzel "H05VV-F" · verbindungsklemme · die Verbindungsklemme · "Wago" ✓ · luesterklemme · die Lüsterklemme · reihenklemme · die Reihenklemme · abzweigdose · die Abzweigdose · geraetedose · die Gerätedose · "Schalterdose, UP-Dose" · hohlwanddose · die Hohlwanddose · aufputzdose · die Aufputzdose · "AP-Dose" · kabelkanal · der Kabelkanal · installationsrohr · das Installationsrohr · "Leerrohr" · wellrohr · das Wellrohr · "Flexrohr" · nagelschelle · die Nagelschelle · kabelbinder · der Kabelbinder ✓ · duebel · der Dübel · isolierband · das Isolierband ✓ · schrumpfschlauch · der Schrumpfschlauch · hutschiene · die Hutschiene · "Tragschiene" · phasenschiene · die Phasenschiene · "Kammschiene" · leitungsschutzschalter · der Leitungsschutzschalter · kuerzel "LS" · "Sicherungsautomat" · fehlerstromschutzschalter · der Fehlerstromschutzschalter · kuerzel "RCD, FI" · "FI-Schalter" · elektrikergips · der Elektrikergips.

**psa (8):** sicherheitsschuhe · die Sicherheitsschuhe (Plural) · kuerzel "S3" ✓ · schutzbrille · die Schutzbrille ✓ · schutzhelm · der Schutzhelm ✓ · arbeitshandschuhe · die Arbeitshandschuhe (Plural) ✓ · gehoerschutz · der Gehörschutz · knieschoner · die Knieschoner (Plural) · warnweste · die Warnweste · atemschutzmaske · die Atemschutzmaske · kuerzel "FFP2".

**maschinen (10):** akkuschrauber · der Akkuschrauber · "Akkubohrschrauber" ✓ · schlagbohrmaschine · die Schlagbohrmaschine · bohrhammer · der Bohrhammer · stichsaege · die Stichsäge · saebelsaege · die Säbelsäge · "Tigersäge" · mauernutfraese · die Mauernutfräse · "Schlitzfräse" · bausauger · der Bausauger · "Industriesauger" · heissluftgeblaese · das Heißluftgebläse · "Heißluftföhn" · kernbohrgeraet · das Kernbohrgerät · baustrahler · der Baustrahler.

Toplam: 3 + 28 + 12 + 24 + 8 + 10 = **85**. Grundausstattung ✓ = 20.

- [ ] **Step 6: Test → PASS**

```bash
node scripts/check-site.mjs 2>&1 | grep -E "Wörterbuch|geçti|başarısız"
```
Beklenen: 3 Wörterbuch testi OK, `Hepsi geçti (119)`.

- [ ] **Step 7: Commit**

```bash
git add src/data/woerterbuch.json scripts/check-site.mjs && git commit -F .superpowers/msg.txt
```
Mesaj: `feat(woerterbuch): Datenmodell und 85 deutsche Begriffe in 5 Kategorien (Artikel, Plural, Umgangssprache, Wofür + Leichte Sprache), Quelltests`

### Task 2: `scripts/translate_woerterbuch.py` — 7 Sprachen per Worker, Validierung, Merge

**Files:**
- Create: `scripts/translate_woerterbuch.py`
- Modify: `src/data/woerterbuch.json` (Script-Output: `wofuer.<lang>`, `i18n.<lang>`, `_stand.<lang>`)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `woerterbuch.json` (Task 1), `~/.claude/skills/worker/scripts/worker.py` (Aufruf wie `scripts/translate_glossar.py`: `--role`, `--prompt-file`, `--out`, `--dir`, `--timeout`).
- Produces: je Eintrag `i18n[lang] = { begriff, hinweis? }`, `wofuer[lang]`; `_stand[lang] = "JJJJ-MM"`. Task 4 liest genau diese Felder.

- [ ] **Step 1: Quelltests**

```js
  // TP2 · Task 2: Wörterbuch-Übersetzungen
  ['Wörterbuch: alle 7 Sprachen je Eintrag (i18n.begriff + wofuer), _stand je Sprache', () => { const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const L = ['en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return L.every((l) => /^\d{4}-\d{2}$/.test(w._stand[l] ?? '')) && w.eintraege.every((e) => L.every((l) => (e.i18n[l]?.begriff ?? '').trim().length > 0 && (e.wofuer[l] ?? '').trim().length > 10 && e.wofuer[l].length <= 220)); }],
  ['Wörterbuch: Schriftsystem passt (ar/fa arabisch, ka georgisch, ru kyrillisch ≥ 90 %), Begriff ≠ deutsches Wort (tr/en ≥ 80 %)', () => { const e = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege; const anteil = (l, re) => e.filter((x) => re.test(x.i18n[l].begriff + x.wofuer[l])).length / e.length; const anders = (l) => e.filter((x) => x.i18n[l].begriff.toLowerCase() !== x.de.singular.toLowerCase()).length / e.length; return anteil('ar', /[؀-ۿ]/) >= 0.9 && anteil('fa', /[؀-ۿ]/) >= 0.9 && anteil('ka', /[Ⴀ-ჿ]/) >= 0.9 && anteil('ru', /[Ѐ-ӿ]/) >= 0.9 && anders('tr') >= 0.8 && anders('en') >= 0.8; }],
```

- [ ] **Step 2: Test → FAIL** — `node scripts/check-site.mjs 2>&1 | grep -E "^FAIL.*Wörterbuch"` → 2 FAIL.

- [ ] **Step 3: Script (Write-Tool, UTF-8)**

```python
"""woerterbuch.json: Begriff + Hinweis + Wofür in die Zielsprachen übersetzen → zurück in dieselbe Datei.
Aufruf (Repo-Wurzel): python scripts/translate_woerterbuch.py            (alle 7)
                       python scripts/translate_woerterbuch.py tr ar     (nur diese)
                       python scripts/translate_woerterbuch.py --nur-fehlende tr
Deutscher Begriff wird NIE verändert. Chunks à 30 Einträge, 2 Versuche je Chunk, Validierung vor dem Schreiben.
"""
from __future__ import annotations
import json, subprocess, sys, time, re
from datetime import date
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DATEI = ROOT / "src" / "data" / "woerterbuch.json"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"
LANGS = {"en": "English", "tr": "Türkçe", "ru": "Русский", "ar": "Modern Standard Arabic", "fa": "Persian (Farsi)", "ka": "Georgian", "sq": "Albanian (standard)"}
ROLLEN = ["omni", "worker"]  # erste Rolle, die antwortet, gewinnt (omni = kostenlose OmniRoute-Anbieter)
BRIEF = """You are a professional technical translator for a German electrical-apprenticeship learning site (wattwas.de).
Below is a JSON array of tool/material dictionary entries. Each has "id", the German term ("artikel", "singular", "plural",
optional "umgangssprache" = site-slang, optional "kuerzel"), and "wofuer_de" (one German sentence: what it is used for).
Translate into {lang}. RULES:
- Output ONE JSON object: keys = the exact "id" values (unchanged), values = {{"begriff": "...", "hinweis": "...", "wofuer": "..."}}.
- "begriff": the everyday {lang} name of this tool/material as an electrician would say it (with the usual article/particle
  if the language uses one). Never leave it German unless the German word is genuinely used in {lang} (then say so in "hinweis").
- "hinweis": optional, max 60 characters – e.g. a common second name, or "German loanword". Omit the key if nothing to add.
- "wofuer": translate "wofuer_de" naturally, same length (one sentence, max 200 characters). German technical terms that
  appear INSIDE the sentence (Sicherheitsregel, Hutschiene, Klemme, RCD, LS, VDE …) stay German, add the {lang} meaning
  in parentheses only if it helps.
- Keep numbers, units, norm names unchanged. Valid JSON only: no code fences, no comments, no preface, escape quotes.
=== ENTRIES ===
{entries}
"""

def lade() -> dict:
    return json.loads(DATEI.read_text(encoding="utf-8"))

def speichere(daten: dict) -> None:
    DATEI.write_text(json.dumps(daten, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def frage(lang: str, chunk: list[dict], tmp: Path, nr: int) -> dict | None:
    bfile, ofile = tmp / f"brief-{lang}-{nr}.md", tmp / f"out-{lang}-{nr}.json"
    bfile.write_text(BRIEF.format(lang=LANGS[lang], entries=json.dumps(chunk, ensure_ascii=False, indent=1)), encoding="utf-8")
    for rolle in ROLLEN:
        for versuch in range(2):
            t0 = time.time()
            r = subprocess.run([sys.executable, str(WORKER), "--role", rolle, "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", "900"], capture_output=True, text=True, encoding="utf-8")
            if r.returncode != 0 or not ofile.exists():
                print(f"  [{lang}#{nr}] {rolle} Versuch {versuch + 1} fehlgeschlagen ({time.time() - t0:.0f}s): {r.stderr[-200:]}"); continue
            roh = ofile.read_text(encoding="utf-8").strip()
            roh = re.sub(r"^```(?:json)?\s*|\s*```$", "", roh)
            try:
                obj = json.loads(roh[roh.index("{"): roh.rindex("}") + 1])
            except (ValueError, json.JSONDecodeError) as e:
                print(f"  [{lang}#{nr}] JSON kaputt: {e}"); continue
            fehler = pruefe(chunk, obj)
            if fehler:
                print(f"  [{lang}#{nr}] Validierung: {fehler[:3]}"); continue
            print(f"  [{lang}#{nr}] ok via {rolle} ({time.time() - t0:.0f}s)")
            return obj
    return None

def pruefe(chunk: list[dict], obj: dict) -> list[str]:
    f = []
    for e in chunk:
        v = obj.get(e["id"])
        if not isinstance(v, dict): f.append(f'{e["id"]}: fehlt'); continue
        if not str(v.get("begriff", "")).strip(): f.append(f'{e["id"]}: begriff leer')
        w = str(v.get("wofuer", "")).strip()
        if len(w) < 10 or len(w) > 220: f.append(f'{e["id"]}: wofuer {len(w)} Zeichen')
        if "hinweis" in v and len(str(v["hinweis"])) > 80: f.append(f'{e["id"]}: hinweis zu lang')
    return f

def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    nur_fehlende = "--nur-fehlende" in sys.argv
    langs = args or list(LANGS)
    daten = lade()
    tmp = ROOT / "scratch" / "woerterbuch-tmp"; tmp.mkdir(parents=True, exist_ok=True)
    gesamt_fehler = 0
    for lang in langs:
        eintraege = [e for e in daten["eintraege"] if not (nur_fehlende and e.get("i18n", {}).get(lang, {}).get("begriff") and e["wofuer"].get(lang))]
        print(f"== {lang}: {len(eintraege)} Einträge")
        for nr, start in enumerate(range(0, len(eintraege), 30)):
            chunk = [{"id": e["id"], "artikel": e["de"]["artikel"], "singular": e["de"]["singular"], "plural": e["de"]["plural"],
                      **({"umgangssprache": e["de"]["umgangssprache"]} if e["de"].get("umgangssprache") else {}),
                      **({"kuerzel": e["de"]["kuerzel"]} if e["de"].get("kuerzel") else {}), "wofuer_de": e["wofuer"]["de"]} for e in eintraege[start:start + 30]]
            obj = frage(lang, chunk, tmp, nr)
            if obj is None: gesamt_fehler += 1; print(f"  [{lang}#{nr}] AUFGEGEBEN – nichts geschrieben"); continue
            for e in eintraege[start:start + 30]:
                v = obj[e["id"]]
                e.setdefault("i18n", {})[lang] = {"begriff": str(v["begriff"]).strip(), **({"hinweis": str(v["hinweis"]).strip()} if v.get("hinweis") else {})}
                e["wofuer"][lang] = str(v["wofuer"]).strip()
            daten.setdefault("_stand", {})[lang] = date.today().strftime("%Y-%m")
            speichere(daten)  # nach jedem Chunk sichern
    print("FEHLER:", gesamt_fehler)
    return 1 if gesamt_fehler else 0

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Probelauf 1 Sprache, dann alle**

```bash
cd /c/Users/kadir/Projects/Elektrolehre/.worktrees/tp2-werkzeug && python scripts/translate_woerterbuch.py tr && node scripts/check-site.mjs 2>&1 | grep -E "Wörterbuch"
```
tr sauber (Stichprobe 5 Einträge lesen: `python -c "import json;d=json.load(open('src/data/woerterbuch.json',encoding='utf-8'));[print(e['id'],e['i18n']['tr'],e['wofuer']['tr']) for e in d['eintraege'][:5]]"`) → `python scripts/translate_woerterbuch.py en ru ar fa ka sq`. Laufzeit ≈ 3 Chunks × 7 Sprachen × 20–90 s. Bricht ein Chunk zweimal ab: `--nur-fehlende <lang>` erneut; bleibt er kaputt → im Bericht nennen, nicht von Hand erfinden.

- [ ] **Step 5: Test → PASS** — `node scripts/check-site.mjs 2>&1 | grep -E "Wörterbuch|geçti"` → `Hepsi geçti (121)`.

- [ ] **Step 6: Commit** (`scratch/woerterbuch-tmp/` ist nicht Teil des Commits; `scratch/` steht in `.gitignore` — prüfen mit `git status --short`)

```bash
git add scripts/translate_woerterbuch.py src/data/woerterbuch.json scripts/check-site.mjs && git commit -F .superpowers/msg.txt
```
Mesaj: `feat(woerterbuch): Übersetzungsskript (Worker, Chunks, Validierung) und 7 Sprachen für 85 Begriffe – Begriff, Hinweis, Wofür`

---

### Task 3: UI-Strings `woerterbuch` + `marken` (9 Locales)

**Files:**
- Modify: `src/data/startseite-ui.json` (jeder Locale-Block: neue Schlüssel `woerterbuch`, `marken`)
- Test: `scripts/check-site.mjs` (Paritätstest Zeile 159 greift automatisch; + 1 Inhaltstest)

**Interfaces:**
- Produces: `t.woerterbuch.{titel, untertitel, suche, chips.{kategorie,az,grund}, spalten.{bild,deutsch,ziel,wofuer,marken}, zielDe, plural, umgangssprache, kuerzel, fotoFolgt, grund, keineTreffer, treffer, kategorien.{handwerkzeug,messen,material,psa,maschinen}, filterGruppen.{kategorie,anzeige}, alle, zuMarken}` und `t.marken.{titel, untertitel, hinweis, modelle, stand, datenblatt, budget, verbreitet, specs, vergleich, protokoll, protokollLeer, filterGruppen.{kategorie,stufe,budget,verbreitung}, alle, nurVerbreitet, zuruecksetzen, keineTreffer, zurUebersicht, zumWoerterbuch, quelle}`. Tasks 4–6 lesen genau diese Namen.

- [ ] **Step 1: Test**

```js
  // TP2 · Task 3: UI-Strings
  ['UI-Strings: Blöcke woerterbuch/marken in 9 Locales, tr/ar lokalisiert, Kategorienamen vollständig', () => { const K = ['handwerkzeug', 'messen', 'material', 'psa', 'maschinen']; return Object.values(uiJson).every((t) => t.woerterbuch && t.marken && K.every((k) => t.woerterbuch.kategorien[k]) && t.marken.filterGruppen.budget) && uiJson.tr.woerterbuch.titel !== uiJson.de.woerterbuch.titel && /[؀-ۿ]/.test(uiJson.ar.marken.hinweis) && uiJson.leicht.marken.hinweis.length < uiJson.de.marken.hinweis.length + 40; }],
```

- [ ] **Step 2: Test → FAIL** (Paritätstest und der neue Test).

- [ ] **Step 3: Block `de` (nach `"entdecken"`, vor `"bereiche"` einfügen)**

```json
    "woerterbuch": {
      "titel": "Werkzeug-Wörterbuch",
      "untertitel": "Deutsche Namen von Werkzeug und Material – mit Artikel, Plural und dem Wort, das auf der Baustelle fällt.",
      "suche": "Begriff suchen – Deutsch oder deine Sprache",
      "chips": { "kategorie": "Nach Kategorie", "az": "A–Z", "grund": "Nur Grundausstattung" },
      "spalten": { "bild": "Bild", "deutsch": "Deutsch", "ziel": "In deiner Sprache", "wofuer": "Wofür", "marken": "Marken & Modelle" },
      "zielDe": "Englisch",
      "plural": "Plural:", "umgangssprache": "Baustelle:", "kuerzel": "Kurz:",
      "fotoFolgt": "Foto folgt", "grund": "Grundausstattung",
      "keineTreffer": "Kein Begriff gefunden. Versuch es mit dem deutschen Wort.", "treffer": "Begriffe",
      "kategorien": { "handwerkzeug": "Handwerkzeug", "messen": "Messen & Prüfen", "material": "Material", "psa": "PSA – Schutzausrüstung", "maschinen": "Maschinen" },
      "filterGruppen": { "kategorie": "Kategorie", "anzeige": "Anzeige" },
      "alle": "Alle Begriffe", "zuMarken": "Modelle ansehen"
    },
    "marken": {
      "titel": "Marken & Modelle",
      "untertitel": "Was auf der Baustelle wirklich benutzt wird – aus Herstellerdatenblättern, ohne Sterne, ohne Partner-Links.",
      "hinweis": "Keine Kaufempfehlung. Preise nur als Budgetstufe (€ · €€ · €€€). Jedes Modell trägt Stand und Quelle.",
      "modelle": "Modelle", "stand": "Stand", "datenblatt": "Datenblatt beim Hersteller", "budget": "Budget", "verbreitet": "im Betrieb verbreitet",
      "specs": "Technische Daten", "vergleich": "Vergleich", "protokoll": "Änderungsprotokoll", "protokollLeer": "Noch keine Änderungen.", "quelle": "Quelle",
      "filterGruppen": { "kategorie": "Kategorie", "stufe": "Stufe", "budget": "Budget", "verbreitung": "Verbreitung" },
      "alle": "Alle Kategorien", "nurVerbreitet": "Nur verbreitete Modelle", "zuruecksetzen": "Filter zurücksetzen", "keineTreffer": "Kein Modell passt zu diesem Filter.",
      "zurUebersicht": "Zur Übersicht", "zumWoerterbuch": "Begriff im Wörterbuch"
    },
```

- [ ] **Step 4: Die 8 anderen Locales** — gleiche Schlüssel, Stil wie der bestehende Block `entdecken` derselben Locale. `leicht`: einfaches Deutsch, kurze Hauptsätze („Hier stehen die deutschen Namen von Werkzeug. Mit Artikel und Mehrzahl."), keine Gedankenstriche. `tr` Beispiel: `"titel": "Alet Sözlüğü"`, `"suche": "Terim ara – Almanca ya da kendi dilinde"`, `"chips": { "kategorie": "Kategoriye göre", "az": "A–Z", "grund": "Yalnız temel donanım" }`, `"zielDe": "İngilizce"`, `"kategorien": { "handwerkzeug": "El aletleri", "messen": "Ölçme ve test", "material": "Malzeme", "psa": "KKD – koruyucu donanım", "maschinen": "Makineler" }`, `marken.hinweis`: `"Satın alma tavsiyesi değildir. Fiyatlar yalnız bütçe kademesi (€ · €€ · €€€). Her modelde tarih ve kaynak var."`. `en`: `"zielDe": "English"` bleibt (auf en zeigt die Zielspalte die englische Übersetzung, Kopf „In your language“ → hier `"ziel": "English"`). ar/fa: RTL-Text, Zahlen/€ lateinisch.

- [ ] **Step 5: Test → PASS** — `node scripts/check-site.mjs 2>&1 | grep -E "UI-Strings|geçti"` → `Hepsi geçti (122)`.

- [ ] **Step 6: Commit** — `i18n(ui): Blöcke woerterbuch und marken in 9 Sprachen (Suche, Chips, Spalten, Kategorien, Filter, Hinweise)`

### Task 4: `/elektrowerkzeuge/woerterbuch/` — Tabelle, Suche, Chips, Filter-Seitenleiste, 9 Locales

**Files:**
- Create: `src/components/Woerterbuch.astro`, `src/components/WoerterbuchFilter.astro`, `src/content/docs/<9 locale>/elektrowerkzeuge/woerterbuch.mdx`
- Modify: `src/components/Sidebar.astro` (Filter-Slot), `scripts/check-site.mjs` (TP1-Test „Werkzeug 2 Karten vor TP2“ → 3)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `woerterbuch.json` (Task 1–2), `t.woerterbuch` (Task 3), `istKatalog()` → `'woerterbuch'` (vorhanden), `.ww-katalog`-Breite über PageFrame (vorhanden), Klassen `.ww-chip .ist-aktiv .ww-grp .ww-side .ww-side-a .ww-sec .ww-sub .ww-pill .ww-pill-tag .ww-link`, `begriffSlug` nicht nötig (ids sind Slugs), `marken.json` per `import.meta.glob` (fehlt bis Task 5 → keine Links).
- Produces: DOM `<ww-woerterbuch class="woerterbuch not-content">` · `section.wb-kat[data-kat]` ×5 · `tr.wb-zeile#<id>[data-kat][data-grund?][data-such][data-sort]` ×85 · `td.wb-marken` (Task 6 verlinkt) · `<ww-woerterbuch-filter>` mit `button[data-filter="reset"|"kat:<id>"]` · Event `ww-filter` (detail `'reset' | 'kat:<id>'`, gleiche Konvention wie Entdecken).

- [ ] **Step 1: Tests (dist)**

```js
  // TP2 · Task 4: Wörterbuch-Seite
  ['Wörterbuch: 9 Locales, Katalog-Layout, Filter-Seitenleiste, Geselle-Kasten, 85 Zeilen, Suche, 3 Chips, kein TOC', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/elektrowerkzeuge/woerterbuch`))) && (() => { const h = read('de/elektrowerkzeuge/woerterbuch'); return /class="page sl-flex ww-katalog"/.test(h) && h.includes('<ww-woerterbuch-filter') && /class="ww-geselle(?: astro-[\w-]+)?"/.test(h) && (h.match(/class="wb-zeile(?: astro-[\w-]+)?"/g) || []).length === 85 && h.includes('type="search"') && (h.match(/class="ww-chip[^"]*"[^>]*data-(sort|grund)/g) || []).length === 3 && !h.includes('starlight-toc'); })()],
  ['Wörterbuch (de): Zielspalte Englisch, Begriff lang=de translate=no, Duspol/Flex/Engländer, Grundausstattung-Pill ≥ 15, Foto-folgt-Platzhalter', () => { const h = read('de/elektrowerkzeuge/woerterbuch'); return /<th scope="col"[^>]*>Englisch</.test(h) && /id="zweipoliger-spannungspruefer"[\s\S]{0,400}?lang="de" translate="no"/.test(h) && ['Duspol', 'Flex', 'Engländer'].every((w) => h.includes(w)) && (h.match(/ww-pill ww-pill-tag(?: astro-[\w-]+)?">Grundausstattung</g) || []).length >= 15 && (h.match(/Foto folgt/g) || []).length === 85; }],
  ['Wörterbuch (tr): türkische Köpfe + Begriffe, deutsche Begriffe bleiben; (ar) RTL; (leicht) keine Zielspalte, Leichte-Sprache-Wofür', () => { const tr = read('tr/elektrowerkzeuge/woerterbuch'), le = read('leicht/elektrowerkzeuge/woerterbuch'); return tr.includes('Winkelschleifer') && tr.includes('Alet Sözlüğü') && /class="wb-ziel(?: astro-[\w-]+)?"[^>]*lang="tr"/.test(tr) && !/<th scope="col"[^>]*>Englisch</.test(tr) && /<html[^>]*dir="rtl"/.test(read('ar/elektrowerkzeuge/woerterbuch')) && !/class="wb-ziel/.test(le) && le.includes('Erst prüfen, dann arbeiten.'); }],
  ['Wörterbuch: Filter-Seitenleiste 5 Kategorien mit Zählern (Summe 85), mobiler Filter-Chip, data-such/data-sort je Zeile', () => { const h = read('de/elektrowerkzeuge/woerterbuch'); const z = [...h.matchAll(/data-filter="kat:[a-z]+"[^<]*<small[^>]*>(\d+)</g)].map((m) => Number(m[1])); return z.length === 5 && z.reduce((a, b) => a + b, 0) === 85 && /popovertarget="starlight__sidebar"[^>]*class="ww-chip md:sl-hidden|class="ww-chip md:sl-hidden[^"]*"[^>]*popovertarget="starlight__sidebar"/.test(h) && (h.match(/data-such="[^"]+"/g) || []).length === 85 && (h.match(/data-sort="[^"]+"/g) || []).length === 85; }],
  ['Wörterbuch in Seitenleiste (Gruppe Werkzeug, Reihenfolge Guide · Grundausstattung · Wörterbuch) und Entdecken: 3 Werkzeug-Karten', () => { const h = read(`de/${ARTIKEL}`); const i = (p) => h.indexOf(`href="/de/elektrowerkzeuge/${p}"`); return i('') > -1 && i('') < i('grundausstattung-azubi/') && i('grundausstattung-azubi/') < i('woerterbuch/') && (read('de/entdecken').match(/class="ww-karte werkzeug-karte(?: astro-[\w-]+)?"/g) || []).length === 3; }],
```
TP1-Test `'Entdecken: Banner ×3, …, Werkzeug 2 Karten vor TP2, …'`: `=== 2` → `=== 3`, Name „Werkzeug 3 Karten (Wörterbuch da, Marken erst Task 6)“.

- [ ] **Step 2: Build + Test → FAIL** — `npm run build 2>&1 | tail -2 && node scripts/check-site.mjs 2>&1 | grep -E "^FAIL"` → 5 neue + 1 geänderter Test rot.

- [ ] **Step 3: `src/components/WoerterbuchFilter.astro`**

```astro
---
// Filter-Seitenleiste Wörterbuch (Spec §3.2): Kategorie mit Zähler. Ein Filter, Event „ww-filter“ (detail 'reset' | 'kat:<id>') an Woerterbuch.astro.
import daten from '../data/woerterbuch.json';
import ui from '../data/startseite-ui.json';
const locale = Astro.locals.starlightRoute.locale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).woerterbuch;
const kats = daten.kategorien as (keyof typeof t.kategorien)[];
const zahl = (k: string) => daten.eintraege.filter((e) => e.kategorie === k).length;
---
<ww-woerterbuch-filter class="ww-filter">
  <p class="ww-grp">{t.filterGruppen.kategorie}</p>
  <div class="ww-side">
    <button type="button" class="ww-side-a ist-aktiv" data-filter="reset">{t.alle} <small>{daten.eintraege.length}</small></button>
    {kats.map((k) => <button type="button" class="ww-side-a" data-filter={`kat:${k}`}>{t.kategorien[k]} <small>{zahl(k)}</small></button>)}
  </div>
</ww-woerterbuch-filter>

<script>
  class WwWoerterbuchFilter extends HTMLElement {
    connectedCallback() {
      const knoepfe = [...this.querySelectorAll<HTMLButtonElement>('[data-filter]')];
      for (const k of knoepfe) k.addEventListener('click', () => {
        knoepfe.forEach((x) => x.classList.toggle('ist-aktiv', x === k));
        document.dispatchEvent(new CustomEvent('ww-filter', { detail: k.dataset.filter }));
        document.getElementById('starlight__sidebar')?.hidePopover?.();
      });
    }
  }
  customElements.define('ww-woerterbuch-filter', WwWoerterbuchFilter);
</script>
```

- [ ] **Step 4: `src/components/Woerterbuch.astro`**

```astro
---
// Werkzeug-Wörterbuch (Spec §6): Tabelle je Kategorie (mobil Karten), Begriff bleibt deutsch (lang=de), Zielspalte = Seitensprache
// (auf de: Englisch; auf leicht: keine Zielspalte, „Wofür“ in Leichter Sprache). Suche, Chips und Kategorie-Filter client-seitig in
// <ww-woerterbuch>: alle Zeilen sind gerendert, JS setzt nur `hidden` und sortiert innerhalb der Kategorie (A–Z). Marken-Link nur,
// wenn marken.json (TP2 Task 5) das Modell kennt – vorher „–“. Kein Tracking, kein Speicher.
import daten from '../data/woerterbuch.json';
import ui from '../data/startseite-ui.json';

type Lang = 'en' | 'tr' | 'ru' | 'ar' | 'fa' | 'ka' | 'sq';
type Eintrag = { id: string; kategorie: string; grundausstattung: boolean; de: { artikel: string; singular: string; plural: string; umgangssprache?: string; kuerzel?: string }; wofuer: Record<string, string | undefined>; i18n: Partial<Record<Lang, { begriff: string; hinweis?: string }>>; bild?: string; marken?: string[] };
const locale = Astro.locals.starlightRoute.locale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).woerterbuch;
const root = import.meta.env.BASE_URL.replace(/\/$/, '');
const base = `${root}/${locale}/`;
const ziel: Lang | null = locale === 'leicht' ? null : locale === 'de' ? 'en' : (locale as Lang);
const markenMod = import.meta.glob('../data/marken.json', { eager: true }) as Record<string, { default: { modelle?: { id: string; kategorie: string }[] } }>;
const modellKat = new Map((Object.values(markenMod)[0]?.default.modelle ?? []).map((m) => [m.id, m.kategorie]));
const eintraege = daten.eintraege as Eintrag[];
const kats = daten.kategorien as (keyof typeof t.kategorien)[];
const such = (e: Eintrag) => [e.de.singular, e.de.plural, e.de.umgangssprache, e.de.kuerzel, ziel && e.i18n[ziel]?.begriff].filter(Boolean).join(' ').toLowerCase();
const sortKey = (e: Eintrag) => e.de.singular.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
const wofuer = (e: Eintrag) => (locale === 'leicht' ? e.wofuer.leicht : e.wofuer[locale]) ?? e.wofuer.de ?? '';
const markenLink = (e: Eintrag) => { const id = e.marken?.find((m) => modellKat.has(m)); return id ? `${base}elektrowerkzeuge/marken/${modellKat.get(id)}/#${id}` : null; };
const zielKopf = locale === 'de' ? t.zielDe : t.spalten.ziel;
---
<ww-woerterbuch class="woerterbuch not-content">
  <p class="ww-sub">{t.untertitel}</p>
  <div class="wb-werkzeug">
    <button type="button" class="ww-chip md:sl-hidden" popovertarget="starlight__sidebar">{t.filterGruppen.kategorie}</button>
    <label class="wb-suche"><span class="sr-only">{t.suche}</span><input type="search" placeholder={t.suche} autocomplete="off" /></label>
    <div class="wb-chips" role="group" aria-label={t.filterGruppen.anzeige}>
      <button type="button" class="ww-chip ist-aktiv" data-sort="kategorie" aria-pressed="true">{t.chips.kategorie}</button>
      <button type="button" class="ww-chip" data-sort="az" aria-pressed="false">{t.chips.az}</button>
      <button type="button" class="ww-chip" data-grund aria-pressed="false">{t.chips.grund}</button>
    </div>
    <p class="wb-zahl" aria-live="polite"><output>{eintraege.length}</output> {t.treffer}</p>
  </div>

  {kats.map((k) => (
    <section class="wb-kat" data-kat={k} aria-labelledby={`wb-${k}`}>
      <div class="ww-sec"><h2 id={`wb-${k}`}>{t.kategorien[k]}</h2></div>
      <table class="wb-tabelle">
        <thead><tr><th scope="col">{t.spalten.bild}</th><th scope="col">{t.spalten.deutsch}</th>{ziel && <th scope="col">{zielKopf}</th>}<th scope="col">{t.spalten.wofuer}</th><th scope="col">{t.spalten.marken}</th></tr></thead>
        <tbody>
          {eintraege.filter((e) => e.kategorie === k).map((e) => (
            <tr class="wb-zeile" id={e.id} data-kat={k} data-grund={e.grundausstattung ? '' : undefined} data-such={such(e)} data-sort={sortKey(e)}>
              <td class="wb-bild" data-label={t.spalten.bild}>{e.bild ? <img src={`${root}/${e.bild}`} alt="" loading="lazy" width="96" height="72" /> : <span class="wb-foto-folgt">{t.fotoFolgt}</span>}</td>
              <th scope="row" class="wb-de" lang="de" translate="no" data-label={t.spalten.deutsch}>
                <span class="wb-begriff"><span class="wb-artikel">{e.de.artikel}</span> {e.de.singular}</span>
                <span class="wb-meta">{t.plural} {e.de.plural}{e.de.umgangssprache && <Fragment> · {t.umgangssprache} <em>{e.de.umgangssprache}</em></Fragment>}{e.de.kuerzel && <Fragment> · {t.kuerzel} {e.de.kuerzel}</Fragment>}</span>
                {e.grundausstattung && <span class="ww-pill ww-pill-tag">{t.grund}</span>}
              </th>
              {ziel && <td class="wb-ziel" data-label={zielKopf} lang={e.i18n[ziel] ? ziel : 'de'}>{e.i18n[ziel]?.begriff ?? e.de.singular}{e.i18n[ziel]?.hinweis && <span class="wb-hinweis">{e.i18n[ziel]?.hinweis}</span>}</td>}
              <td class="wb-wofuer" data-label={t.spalten.wofuer}>{wofuer(e)}</td>
              <td class="wb-marken" data-label={t.spalten.marken}>{markenLink(e) ? <a class="ww-link" href={markenLink(e)!}>{t.zuMarken} →</a> : <span aria-hidden="true">–</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  ))}
  <p class="wb-keine" hidden>{t.keineTreffer}</p>
</ww-woerterbuch>

<style>
  .woerterbuch { display: grid; gap: 1.5rem; }
  .wb-werkzeug { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
  .wb-suche { flex: 1 1 18rem; }
  .wb-suche input { width: 100%; padding: 0.55rem 0.8rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius-s); background: var(--ww-surface); color: var(--ww-text); font: inherit; }
  .wb-suche input:focus-visible { outline: 2px solid var(--ww-accent); outline-offset: 1px; }
  .wb-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .wb-zahl { margin: 0; margin-inline-start: auto; color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .wb-kat[hidden], .wb-zeile[hidden], .wb-keine[hidden] { display: none; }
  .wb-tabelle { width: 100%; border-collapse: collapse; }
  .wb-tabelle th, .wb-tabelle td { padding: 0.6rem 0.5rem; border-block-end: 1px solid var(--ww-line); vertical-align: top; text-align: start; }
  .wb-tabelle thead th { font-size: var(--sl-text-xs); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ww-muted); }
  .wb-bild { width: 6rem; }
  .wb-bild img { display: block; width: 6rem; height: 4.5rem; object-fit: cover; border-radius: var(--ww-radius-s); }
  .wb-foto-folgt { display: grid; place-items: center; width: 6rem; height: 4.5rem; border: 1px dashed var(--ww-line); border-radius: var(--ww-radius-s); color: var(--ww-muted); font-size: var(--sl-text-xs); text-align: center; }
  .wb-de { font-weight: 400; }
  .wb-begriff { display: block; font-weight: 600; color: var(--ww-text); }
  .wb-artikel { color: var(--ww-muted); font-weight: 400; }
  .wb-meta { display: block; margin-block-start: 0.15rem; color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .wb-meta em { font-style: normal; color: var(--ww-text); }
  .wb-de .ww-pill { margin-block-start: 0.35rem; }
  .wb-ziel { font-weight: 600; }
  .wb-hinweis { display: block; font-weight: 400; color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .wb-keine { color: var(--ww-muted); }
  @media (max-width: 50rem) {
    .wb-tabelle thead { display: none; }
    .wb-tabelle, .wb-tabelle tbody { display: block; }
    .wb-zeile { display: grid; grid-template-columns: 6rem 1fr; gap: 0.25rem 0.75rem; padding-block: 0.75rem; border-block-end: 1px solid var(--ww-line); }
    .wb-zeile td, .wb-zeile th { display: block; padding: 0; border: 0; }
    .wb-bild { grid-row: 1 / span 4; }
    .wb-ziel::before, .wb-wofuer::before { content: attr(data-label) ': '; color: var(--ww-muted); font-weight: 400; font-size: var(--sl-text-xs); }
    .wb-marken span[aria-hidden] { display: none; }
  }
</style>

<script>
  class WwWoerterbuch extends HTMLElement {
    connectedCallback() {
      const input = this.querySelector<HTMLInputElement>('input[type=search]')!;
      const zeilen = [...this.querySelectorAll<HTMLTableRowElement>('tr.wb-zeile')];
      const kats = [...this.querySelectorAll<HTMLElement>('section.wb-kat')];
      const zahl = this.querySelector<HTMLOutputElement>('.wb-zahl output')!;
      const keine = this.querySelector<HTMLElement>('.wb-keine')!;
      const chips = [...this.querySelectorAll<HTMLButtonElement>('.wb-chips button')];
      let kat = 'alle', grund = false, sort: 'kategorie' | 'az' = 'kategorie', q = '';
      zeilen.forEach((z, i) => (z.dataset.i = String(i)));
      const anwenden = () => {
        let n = 0;
        for (const z of zeilen) {
          const ok = (kat === 'alle' || z.dataset.kat === kat) && (!grund || 'grund' in z.dataset) && (!q || (z.dataset.such ?? '').includes(q));
          z.hidden = !ok; if (ok) n++;
        }
        for (const s of kats) s.hidden = ![...s.querySelectorAll<HTMLElement>('tr.wb-zeile')].some((z) => !z.hidden);
        zahl.value = String(n); keine.hidden = n > 0;
      };
      const sortieren = () => {
        for (const s of kats) {
          const tbody = s.querySelector('tbody')!;
          const rows = [...tbody.querySelectorAll<HTMLTableRowElement>('tr.wb-zeile')];
          rows.sort((a, b) => (sort === 'az' ? (a.dataset.sort ?? '').localeCompare(b.dataset.sort ?? '', 'de') : Number(a.dataset.i) - Number(b.dataset.i)));
          rows.forEach((r) => tbody.appendChild(r));
        }
      };
      input.addEventListener('input', () => { q = input.value.trim().toLowerCase(); anwenden(); });
      for (const c of chips) c.addEventListener('click', () => {
        if (c.dataset.sort) {
          sort = c.dataset.sort as 'kategorie' | 'az';
          chips.filter((x) => x.dataset.sort).forEach((x) => { x.classList.toggle('ist-aktiv', x === c); x.setAttribute('aria-pressed', String(x === c)); });
          sortieren();
        } else { grund = !grund; c.classList.toggle('ist-aktiv', grund); c.setAttribute('aria-pressed', String(grund)); anwenden(); }
      });
      document.addEventListener('ww-filter', (ev) => { const d = (ev as CustomEvent<string>).detail; kat = d === 'reset' ? 'alle' : d.replace(/^kat:/, ''); anwenden(); });
    }
  }
  customElements.define('ww-woerterbuch', WwWoerterbuch);
</script>
```
Prüfen, ob `--ww-radius-s`, `--ww-line`, `--ww-surface`, `--ww-muted`, `--ww-text`, `--ww-accent` in `wattwas.css` genau so heißen (`grep -n -- '--ww-' src/styles/wattwas.css | head -30`); abweichende Namen übernehmen, keine neuen Tokens anlegen.

- [ ] **Step 5: `Sidebar.astro`** — Import `WoerterbuchFilter`, Verzweigung:

```astro
{katalog === 'entdecken' ? (
  <EntdeckenFilter />
) : katalog === 'woerterbuch' ? (
  <WoerterbuchFilter />
) : (
  <SidebarPersister><SidebarSublist sublist={sidebar} /></SidebarPersister>
)}
```

- [ ] **Step 6: MDX ×9** — `src/content/docs/de/elektrowerkzeuge/woerterbuch.mdx`:

```mdx
---
title: Werkzeug-Wörterbuch
description: Deutsche Namen von Werkzeug und Material – mit Artikel, Plural und Baustellenwort, übersetzt in deine Sprache. 85 Begriffe.
sidebar:
  order: 2
  label: Wörterbuch
tableOfContents: false
lastUpdated: false
translated: source
geselle: Der deutsche Name zählt – auf der Baustelle, in der Berufsschule, in der Prüfung.
---
import Woerterbuch from '../../../../components/Woerterbuch.astro';

<Woerterbuch />
```
Andere Locales: `title`/`description`/`sidebar.label`/`geselle` in der Locale (tr: `Alet Sözlüğü` · `Sözlük`; en: `Tool dictionary` · `Dictionary`; leicht: `Wörterbuch für Werkzeug` · Beschreibung in Leichter Sprache), `translated: machine` (Metadatum, kein Hinweis auf der Seite – R1). Prüfen: `grundausstattung-azubi.mdx` hat `sidebar.order` 1 (sonst setzen), Guide `index.mdx` 0.

- [ ] **Step 7: Build + Test → PASS** — `npm run build 2>&1 | grep -E "error|built" && npm test 2>&1 | tail -1` → `Hepsi geçti (127)`.

- [ ] **Step 8: Commit** — `feat(woerterbuch): Seite /elektrowerkzeuge/woerterbuch/ – Tabelle je Kategorie, Suche, A–Z, Grundausstattung, Filter-Seitenleiste, mobil Karten (9 Locales)`

### Task 5: `marken.json` + `marken-changelog.json` — 10 Kategorien, ≥ 30 Modelle mit Datenblatt-Quelle, Übersetzung, Wörterbuch-Verknüpfung

**Files:**
- Create: `src/data/marken.json`, `src/data/marken-changelog.json`, `scripts/translate_marken.py`
- Modify: `src/data/woerterbuch.json` (`marken: [...]` bei passenden Begriffen)
- Test: `scripts/check-site.mjs` (Quelltests)

**Interfaces:**
- Produces: `marken.json = { _hinweis, affiliateAktiv: false, kategorien: Kategorie[], modelle: Modell[] }`; `Kategorie = { id, name: Record<Locale9, string>, kurz: Record<Locale9, string>, woerterbuch: string[] }`; `Modell = { id, marke, modell, kategorie, stufe: 'einstieg'|'azubi'|'profi', budget: 1|2|3, verbreitet: boolean, kurz: Record<Locale9, string>, specs: { k: string, v: string }[], datenblatt?: string, stand: 'JJJJ-MM', quelle: string, affiliate?: { anbieter: string, url: string } }`; `marken-changelog.json = { eintraege: { datum: 'JJJJ-MM-TT', modell: string, text: Record<Locale9, string> }[] }`. Task 6 rendert; Entdecken (TP1) liest `modelle[].{id, marke, modell, kategorie, stand, kurz}` bereits; Woerterbuch.astro (Task 4) liest `modelle[].{id, kategorie}`.
- Locale9 = `de, leicht, en, tr, ru, ar, fa, ka, sq`.

- [ ] **Step 1: Quelltests**

```js
  // TP2 · Task 5: Marken-Daten
  ['Marken: JSON gültig, 10 Kategorien in Spec-Reihenfolge, name/kurz in 9 Locales, affiliateAktiv false', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return m.affiliateAktiv === false && m.kategorien.map((k) => k.id).join() === 'spannungspruefer,multimeter,installationstester,akkuschrauber,zangen,schraubendreher,abisolierwerkzeug,kabelfinder,bohrhammer,psa' && m.kategorien.every((k) => L.every((l) => k.name[l] && k.kurz[l]) && Array.isArray(k.woerterbuch)); }],
  ['Marken: ≥ 30 Modelle, je Kategorie 3–6, ids eindeutig, Pflichtfelder, specs 3–8, quelle/datenblatt https, stand JJJJ-MM, kurz 9 Locales ≤ 160', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; const ids = m.modelle.map((x) => x.id); const kats = m.kategorien.map((k) => k.id); return m.modelle.length >= 30 && new Set(ids).size === ids.length && kats.every((k) => { const n = m.modelle.filter((x) => x.kategorie === k).length; return n >= 3 && n <= 6; }) && m.modelle.every((x) => /^[a-z0-9-]+$/.test(x.id) && x.marke && x.modell && kats.includes(x.kategorie) && ['einstieg', 'azubi', 'profi'].includes(x.stufe) && [1, 2, 3].includes(x.budget) && typeof x.verbreitet === 'boolean' && L.every((l) => x.kurz[l] && x.kurz[l].length <= 160) && x.specs.length >= 3 && x.specs.length <= 8 && x.specs.every((s) => s.k && s.v) && /^https:\/\//.test(x.quelle) && (!x.datenblatt || /^https:\/\//.test(x.datenblatt)) && /^\d{4}-\d{2}$/.test(x.stand) && !('affiliate' in x && x.affiliate && !x.affiliate.url)); }],
  ['Marken: Änderungsprotokoll gültig (datum, modell existiert, text 9 Locales), ≥ 1 Eintrag; Wörterbuch → Modelle: alle ids existieren, ≥ 10 Begriffe verknüpft', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const c = JSON.parse(readFileSync(join(src, 'data/marken-changelog.json'), 'utf8')); const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const ids = new Set(m.modelle.map((x) => x.id)); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return c.eintraege.length >= 1 && c.eintraege.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.datum) && ids.has(e.modell) && L.every((l) => e.text[l])) && w.eintraege.every((e) => (e.marken ?? []).every((id) => ids.has(id))) && w.eintraege.filter((e) => (e.marken ?? []).length > 0).length >= 10 && m.kategorien.every((k) => k.woerterbuch.every((id) => w.eintraege.some((e) => e.id === id))); }],
```

- [ ] **Step 2: Test → FAIL** — 3 FAIL.

- [ ] **Step 3: Recherche-Regel (vor dem Schreiben)**

Je Modell: Herstellerseite oder Datenblatt aufrufen (WebFetch/Scrapling), 3–8 Kennwerte abschreiben (`specs`), URL als `quelle` (Produktseite) und – wenn ein PDF/Datenblatt existiert – `datenblatt`. **Nicht erreichbar oder Modell abgekündigt → Modell weglassen** (nicht raten); dann Nachfolger oder anderer Kandidat. Preise nie als Zahl, nur `budget` 1–3 (1 ≈ unter 50 €, 2 ≈ 50–200 €, 3 ≈ über 200 €; Installationstester: 1 < 800 €, 2 < 1 500 €, 3 darüber). `verbreitet: true` nur für Modelle, die in deutschen Elektrobetrieben allgemein üblich sind (Knipex, Wiha, Wera, Benning, Fluke, Gossen Metrawatt, Bosch blau, Makita, Hilti, Milwaukee). `stand: "2026-09"`. Marken- und Modellnamen exakt wie beim Hersteller (nie übersetzt).

**Kandidatenliste (Start; mind. 3 je Kategorie behalten):**
- **spannungspruefer** (stufe einstieg): Benning DUSPOL digital · Benning DUSPOL expert · Fluke T150 · Beha-Amprobe 2100-Beta · Testboy Profi III LCD
- **multimeter** (azubi): Fluke 117 · Fluke 175 · Benning MM 7-1 · Gossen Metrawatt METRAHIT ETECH · Beha-Amprobe AM-520-EUR · PeakTech 3443
- **installationstester** (profi): Benning IT 130 · Gossen Metrawatt PROFITEST MF XTRA · Fluke 1664 FC · Megger MFT1741+ · Metrel MI 3152 EurotestXC · Beha-Amprobe ProInstall-200-D
- **akkuschrauber** (azubi): Bosch GSR 12V-35 FC Professional · Bosch GSR 18V-55 Professional · Makita DDF485 · Makita DF333D · Milwaukee M12 FDD2 · Hilti SF 4-A22 · Metabo BS 18 LT BL
- **zangen** (einstieg): Knipex 09 02 240 (Kraft-Kombizange VDE) · Knipex 70 06 160 (Seitenschneider VDE) · Knipex 26 16 200 (Storchschnabelzange VDE) · Knipex 87 01 250 (Cobra) · NWS 109-69-VDE-180 · Wiha Professional electric 26708
- **schraubendreher** (einstieg): Wiha SlimFix VDE Set · Wera Kraftform Kompakt VDE 60 i · Wiha slimVario electric · Knipex 00 20 12 V01 (VDE-Set) · Felo Ergonic VDE · PB Swiss Tools 5539
- **abisolierwerkzeug** (azubi): Knipex 12 62 180 (selbsteinstellende Abisolierzange) · Knipex 16 20 28 SB (Abmantelungswerkzeug 8–28 mm) · Jokari Secura No. 15 · Jokari Super 4 Plus · Weidmüller Stripax 16 · Knipex 12 12 12 PreciStrip16
- **kabelfinder** (azubi): Fluke 2042 · Fluke 2062 · Testboy 26 · Beha-Amprobe AT-6020-EUR · Bosch D-tect 120 Professional · Hilti PS 38
- **bohrhammer** (azubi): Bosch GBH 2-26 F Professional · Bosch GBH 18V-26 Professional · Hilti TE 2-A22 · Makita HR2470 · Makita DHR243 · Metabo KH 18 LTX BL 24
- **psa** (einstieg): uvex 1 sport S3 (Sicherheitsschuh) · Elten MADDOX BOA black-red Low S3 · uvex i-works (Schutzbrille) · uvex pheos B-WR (Schutzhelm) · uvex phynomic lite (Handschuh) · 3M Peltor X4A (Gehörschutz)

`kategorien[].woerterbuch` (Verknüpfung, ids aus Task 1): spannungspruefer → `zweipoliger-spannungspruefer, einpoliger-spannungspruefer` · multimeter → `multimeter, stromzange, messleitung` · installationstester → `installationstester, isolationsmessgeraet, erdungsmessgeraet, drehfeldmessgeraet` · akkuschrauber → `akkuschrauber` · zangen → `kombizange, seitenschneider, flachrundzange, wasserpumpenzange` · schraubendreher → `vde-schraubendreher, schlitzschraubendreher, kreuzschlitzschraubendreher` · abisolierwerkzeug → `abisolierzange, kabelmesser, aderendhuelsenzange` · kabelfinder → `leitungssucher, ortungsgeraet` · bohrhammer → `bohrhammer, schlagbohrmaschine` · psa → `sicherheitsschuhe, schutzbrille, schutzhelm, arbeitshandschuhe, gehoerschutz`.
Umgekehrt in `woerterbuch.json` bei diesen ≥ 10 Begriffen `marken: ["<modell-id>", …]` (z. B. `zweipoliger-spannungspruefer` → `["benning-duspol-digital", "fluke-t150"]`).

- [ ] **Step 4: `src/data/marken.json` — Gerüst + 1 Kategorie + 1 Modell vollständig (Rest nach demselben Muster)**

```json
{
  "_hinweis": "Marken & Modelle (Spec §7). Namen nie übersetzen. Preise nur als budget 1–3. quelle = Herstellerseite, datenblatt = PDF wenn vorhanden. affiliateAktiv bleibt false, bis Kadir ein Partnerprogramm freigibt (Rückmeldung 13.09 R6): dann affiliate.url je Modell, Kennzeichnung und Datenschutz-Absatz. kurz.<lang> per scripts/translate_marken.py.",
  "affiliateAktiv": false,
  "kategorien": [
    { "id": "spannungspruefer",
      "name": { "de": "Spannungsprüfer", "leicht": "Spannungsprüfer", "en": "Voltage testers", "tr": "Voltaj test cihazları", "ru": "Указатели напряжения", "ar": "أجهزة فحص الجهد", "fa": "فازمترهای دوقطبی", "ka": "ძაბვის ტესტერები", "sq": "Testues tensioni" },
      "kurz": { "de": "Zweipolig, nach DIN EN 61243-3 – das Gerät für Sicherheitsregel 3.", "leicht": "Damit prüfst du: Ist die Leitung ohne Strom?", "en": "", "tr": "", "ru": "", "ar": "", "fa": "", "ka": "", "sq": "" },
      "woerterbuch": ["zweipoliger-spannungspruefer", "einpoliger-spannungspruefer"] }
  ],
  "modelle": [
    { "id": "benning-duspol-digital", "marke": "Benning", "modell": "DUSPOL digital", "kategorie": "spannungspruefer", "stufe": "einstieg", "budget": 2, "verbreitet": true,
      "kurz": { "de": "Der Standard in vielen Betrieben: LC-Anzeige, LED-Grundfunktion ohne Batterie, Drehfeld- und Durchgangsprüfung.", "leicht": "Sehr häufig im Betrieb. Zeigt Spannung auch ohne Batterie.", "en": "", "tr": "", "ru": "", "ar": "", "fa": "", "ka": "", "sq": "" },
      "specs": [ { "k": "Spannungsbereich", "v": "1 … 1000 V AC/DC" }, { "k": "Norm", "v": "DIN EN 61243-3 (VDE 0682-401)" }, { "k": "Messkategorie", "v": "CAT IV 600 V / CAT III 1000 V" }, { "k": "Anzeige", "v": "LCD + LED, Vibrationsalarm" }, { "k": "Schutzart", "v": "IP 64" } ],
      "datenblatt": "https://www.benning.de/…/duspol-digital.pdf", "stand": "2026-09", "quelle": "https://www.benning.de/produkte-de/pruef-und-messtechnik/spannungspruefer/duspol-digital.html" }
  ]
}
```
Die beiden URLs sind Muster – beim Schreiben durch die tatsächlich aufgerufene URL ersetzen (Test verlangt nur `https://`, die Review prüft Stichproben per Fetch).

- [ ] **Step 5: `src/data/marken-changelog.json`**

```json
{ "_hinweis": "Änderungsprotokoll (Spec §7): jede Aufnahme, Nachfolge oder Korrektur ein Eintrag; monatlicher Durchgang.",
  "eintraege": [
    { "datum": "2026-09-13", "modell": "benning-duspol-digital", "text": { "de": "Aufgenommen (Startbestand TP2).", "leicht": "Neu aufgenommen.", "en": "", "tr": "", "ru": "", "ar": "", "fa": "", "ka": "", "sq": "" } }
  ] }
```
Ein Eintrag je aufgenommenem Modell (gleicher Text, `modell` wechselt) – so ist das Protokoll ab Tag 1 ehrlich.

- [ ] **Step 6: `scripts/translate_marken.py`** — übersetzt alle leeren `kurz.<lang>`, `name.<lang>` (nur wenn leer) und `changelog.text.<lang>` in einem Lauf je Sprache; gleiche Worker-Konvention wie Task 2.

```python
"""marken.json + marken-changelog.json: leere Übersetzungsfelder (kurz, name, text) je Sprache füllen.
Aufruf: python scripts/translate_marken.py [tr ar …]   (leer = 7 Sprachen). Marken-/Modellnamen bleiben unverändert.
"""
from __future__ import annotations
import json, subprocess, sys, time, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
MARKEN, PROTO = ROOT / "src" / "data" / "marken.json", ROOT / "src" / "data" / "marken-changelog.json"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"
LANGS = {"en": "English", "tr": "Türkçe", "ru": "Русский", "ar": "Modern Standard Arabic", "fa": "Persian (Farsi)", "ka": "Georgian", "sq": "Albanian (standard)"}
BRIEF = """Translate the German texts below into {lang} for an electrician-apprentice website. Each item has "key" and "de".
Brand and model names (Benning, DUSPOL, Knipex, Fluke …) and norm names (DIN EN …, VDE …, CAT III) stay exactly as written.
Keep each text one short sentence, max 150 characters, natural {lang}. Output ONE JSON object {{"<key>": "<translation>", …}}
with every key present. Valid JSON only – no code fences, no comments, no preface.
=== ITEMS ===
{items}
"""

def lade(p: Path) -> dict: return json.loads(p.read_text(encoding="utf-8"))
def speichere(p: Path, d: dict) -> None: p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def offene(m: dict, c: dict, lang: str) -> list[tuple[str, str, dict]]:
    """(key, deutscher Text, Zielobjekt) für alle leeren Felder dieser Sprache."""
    o = []
    for k in m["kategorien"]:
        for feld in ("name", "kurz"):
            if not k[feld].get(lang): o.append((f"kat:{k['id']}:{feld}", k[feld]["de"], k[feld]))
    for x in m["modelle"]:
        if not x["kurz"].get(lang): o.append((f"mod:{x['id']}", x["kurz"]["de"], x["kurz"]))
    for i, e in enumerate(c["eintraege"]):
        if not e["text"].get(lang): o.append((f"log:{i}", e["text"]["de"], e["text"]))
    return o

def frage(lang: str, items: list[tuple[str, str, dict]], tmp: Path) -> dict | None:
    bfile, ofile = tmp / f"marken-{lang}.md", tmp / f"marken-{lang}.json"
    bfile.write_text(BRIEF.format(lang=LANGS[lang], items=json.dumps([{"key": k, "de": de} for k, de, _ in items], ensure_ascii=False, indent=1)), encoding="utf-8")
    for rolle in ("omni", "worker"):
        for _ in range(2):
            r = subprocess.run([sys.executable, str(WORKER), "--role", rolle, "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", "900"], capture_output=True, text=True, encoding="utf-8")
            if r.returncode != 0 or not ofile.exists(): print(f"  [{lang}] {rolle} fehlgeschlagen: {r.stderr[-200:]}"); continue
            roh = re.sub(r"^```(?:json)?\s*|\s*```$", "", ofile.read_text(encoding="utf-8").strip())
            try: obj = json.loads(roh[roh.index("{"): roh.rindex("}") + 1])
            except (ValueError, json.JSONDecodeError) as e: print(f"  [{lang}] JSON kaputt: {e}"); continue
            fehlt = [k for k, _, _ in items if not str(obj.get(k, "")).strip() or len(str(obj[k])) > 160]
            if fehlt: print(f"  [{lang}] unvollständig: {fehlt[:3]}"); continue
            return obj
    return None

def main() -> int:
    langs = [a for a in sys.argv[1:] if not a.startswith("--")] or list(LANGS)
    m, c = lade(MARKEN), lade(PROTO)
    tmp = ROOT / "scratch" / "marken-tmp"; tmp.mkdir(parents=True, exist_ok=True)
    fehler = 0
    for lang in langs:
        items = offene(m, c, lang)
        print(f"== {lang}: {len(items)} Felder")
        if not items: continue
        for start in range(0, len(items), 40):
            teil = items[start:start + 40]
            obj = frage(lang, teil, tmp)
            if obj is None: fehler += 1; print(f"  [{lang}] AUFGEGEBEN ab {start}"); continue
            for k, _, ziel in teil: ziel[lang] = str(obj[k]).strip()
            speichere(MARKEN, m); speichere(PROTO, c)
    print("FEHLER:", fehler)
    return 1 if fehler else 0

if __name__ == "__main__": sys.exit(main())
```

- [ ] **Step 7: Lauf + Test → PASS**

```bash
python scripts/translate_marken.py && node scripts/check-site.mjs 2>&1 | grep -E "Marken|Wörterbuch|geçti"
```
→ `Hepsi geçti (130)`. Stichprobe tr/en lesen (3 Modelle), Markennamen unverändert.

- [ ] **Step 8: Commit** — `feat(marken): Datenmodell marken.json + Änderungsprotokoll, 10 Kategorien, <N> Modelle mit Herstellerquelle und Kennwerten, Übersetzungsskript, Wörterbuch-Verknüpfung` (N eintragen).

### Task 6: `/elektrowerkzeuge/marken/` + 10 Kategorieseiten — Übersicht, Modell-Karten, Vergleich, Protokoll, Filter, Generator

**Files:**
- Create: `scripts/marken-seiten.mjs`, `src/components/Marken.astro`, `src/components/MarkenKategorie.astro`, `src/components/MarkenFilter.astro`, generiert: `src/content/docs/<9>/elektrowerkzeuge/marken/index.mdx` + `<10 kategorie>.mdx` (99 Dateien)
- Modify: `src/components/Sidebar.astro` (Slot `marken`), `scripts/check-site.mjs` (Task-4-Test „3 Werkzeug-Karten“ → 4; TP1-Test „kein Marken-Block“ entfernen; `import { execSync } from 'node:child_process';` oben ergänzen)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `marken.json`, `marken-changelog.json` (Task 5), `t.marken`, `t.stufen` (Task 3/TP1), `ohneLocale()` aus `src/scripts/seiten.ts`, `istKatalog()` → `'marken'`, Klassen wie Task 4 plus `.raster`, `.karte-body/.karte-kick/.karte-titel/.karte-text/.karte-fuss/.karte-meta` (TP1 Karte).
- Produces: DOM Übersicht `div.marken` · `a.ww-karte.marken-kat[data-kat]` ×10 · `ul.mk-log`; Kategorie `<ww-marken data-kat>` · `article.ww-karte.modell#<id>[data-stufe][data-budget][data-verbreitet?]` · `dl.mk-specs` · `table.mk-vergleich tr[data-modell]` · `<ww-marken-filter>` mit `a[href][aria-current]` ×11 und `button[data-filter="stufe:<s>"|"budget:<n>"|"verbreitet"|"reset"]`; Event `ww-filter` (detail wie Buttons). Kategorieseiten `sidebar.hidden: true` (nicht in der Starlight-Seitenleiste; Marken-Übersicht `order: 3` in Gruppe Werkzeug).

- [ ] **Step 1: Tests (dist)**

```js
  // TP2 · Task 6: Marken-Seiten
  ['Marken: Übersicht + 10 Kategorieseiten in 9 Locales (99), Katalog-Layout, Filter-Seitenleiste, Hinweis, Protokoll', () => { const K = ['spannungspruefer', 'multimeter', 'installationstester', 'akkuschrauber', 'zangen', 'schraubendreher', 'abisolierwerkzeug', 'kabelfinder', 'bohrhammer', 'psa']; const L = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq']; const h = read('de/elektrowerkzeuge/marken'); return L.every((l) => existsSync(page(`${l}/elektrowerkzeuge/marken`)) && K.every((k) => existsSync(page(`${l}/elektrowerkzeuge/marken/${k}`)))) && /class="page sl-flex ww-katalog"/.test(h) && h.includes('<ww-marken-filter') && (h.match(/class="ww-karte marken-kat(?: astro-[\w-]+)?"/g) || []).length === 10 && h.includes('Keine Kaufempfehlung') && /class="mk-log(?: astro-[\w-]+)?"/.test(h); }],
  ['Marken (de/zangen): ≥ 3 Modell-Karten mit data-stufe/data-budget, Name lang=de translate=no, Kennwerte, Hersteller-Link noopener, Vergleichstabelle, Stufen-Pill, Karten-Ergebnis versteckt', () => { const h = read('de/elektrowerkzeuge/marken/zangen'); return h.includes('<ww-marken') && (h.match(/class="ww-karte modell(?: astro-[\w-]+)?" id="[a-z0-9-]+" data-stufe="(einstieg|azubi|profi)" data-budget="[123]"/g) || []).length >= 3 && /class="karte-titel(?: astro-[\w-]+)?" lang="de" translate="no">Knipex /.test(h) && /class="mk-specs(?: astro-[\w-]+)?"><dt/.test(h) && /<a class="ww-link[^"]*" href="https:\/\/[^"]+" rel="noopener" target="_blank"/.test(h) && /class="mk-vergleich(?: astro-[\w-]+)?"/.test(h) && /ww-pill ww-pill-(einstieg|azubi|profi)/.test(h) && /class="mk-keine(?: astro-[\w-]+)?" hidden/.test(h); }],
  ['Marken: Filter-Seitenleiste – 10 Kategorie-Links mit Zählern, aria-current auf der Kategorie, Stufe/Budget/Verbreitung nur auf Kategorieseiten; Kategorieseiten nicht in der Starlight-Seitenleiste, Übersicht schon', () => { const u = read('de/elektrowerkzeuge/marken'), k = read('de/elektrowerkzeuge/marken/zangen'), a = read(`de/${ARTIKEL}`); return (u.match(/href="\/de\/elektrowerkzeuge\/marken\/[a-z]+\/"[^>]*>[^<]*<small/g) || []).length === 10 && !u.includes('data-filter="stufe:') && /href="\/de\/elektrowerkzeuge\/marken\/zangen\/" aria-current="page"/.test(k) && ['stufe:einstieg', 'budget:2', 'verbreitet', 'reset'].every((f) => k.includes(`data-filter="${f}"`)) && a.includes('href="/de/elektrowerkzeuge/marken/"') && !a.includes('href="/de/elektrowerkzeuge/marken/zangen/"'); }],
  ['Marken (tr/ar): Kategorie-Name lokalisiert, Modellnamen unverändert, RTL; Wörterbuch → Modelle ≥ 10 Links; Entdecken: Marken-Block ≤ 4 Karten mit Kategorienamen + 4 Werkzeug-Karten', () => { const tr = read('tr/elektrowerkzeuge/marken/zangen'); const e = read('de/entdecken'); const block = e.match(/data-block="marken"[\s\S]*?<\/section>/)?.[0] ?? ''; return tr.includes('Knipex') && !tr.includes('<title>Zangen') && /<html[^>]*dir="rtl"/.test(read('ar/elektrowerkzeuge/marken')) && (read('de/elektrowerkzeuge/woerterbuch').match(/class="wb-marken(?: astro-[\w-]+)?"[^>]*><a /g) || []).length >= 10 && block !== '' && (block.match(/class="ww-karte(?: astro-[\w-]+)?" href/g) || []).length <= 4 && !/karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>[a-z]+</.test(block) && (e.match(/class="ww-karte werkzeug-karte(?: astro-[\w-]+)?"/g) || []).length === 4; }],
  ['Marken: Generator idempotent – node scripts/marken-seiten.mjs ändert keine Datei', () => { execSync('node scripts/marken-seiten.mjs', { cwd: join(src, '..') }); return execSync('git status --porcelain -- src/content/docs', { cwd: join(src, '..') }).toString().trim() === ''; }],
```
Task-4-Test „… und Entdecken: 3 Werkzeug-Karten“ → `=== 4`; TP1-Test „Werkzeug 3 Karten (Wörterbuch da, Marken erst Task 6)“ → `=== 4` und `!h.includes('data-block="marken"')` streichen (Name anpassen). Der Entdecken-Kicker-Teil (`!/karte-kick…><span>[a-z]+</`) wird erst in Task 7 grün – hier in Task 6 den Teilausdruck noch **weglassen** und in Task 7 ergänzen.

- [ ] **Step 2: Build + Test → FAIL.**

- [ ] **Step 3: `scripts/marken-seiten.mjs`**

```js
// Erzeugt Marken-Übersicht + Kategorieseiten für alle 9 Locales aus marken.json + startseite-ui.json. Idempotent (überschreibt).
// Aufruf: node scripts/marken-seiten.mjs   – danach npm run build. Neue Kategorie = Eintrag in marken.json + erneut ausführen.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const marken = JSON.parse(readFileSync(join(root, 'src/data/marken.json'), 'utf8'));
const ui = JSON.parse(readFileSync(join(root, 'src/data/startseite-ui.json'), 'utf8'));
const LOCALES = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'];
const y = (s) => JSON.stringify(String(s)); // YAML-sicherer String
const KOMP = '../../../../../components/';
let n = 0;
for (const l of LOCALES) {
  const t = (ui[l] ?? ui.de).marken;
  const dir = join(root, 'src/content/docs', l, 'elektrowerkzeuge/marken');
  mkdirSync(dir, { recursive: true });
  const translated = l === 'de' ? 'source' : 'machine';
  writeFileSync(join(dir, 'index.mdx'), `---\ntitle: ${y(t.titel)}\ndescription: ${y(t.untertitel)}\nsidebar:\n  order: 3\n  label: ${y(t.titel)}\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport Marken from '${KOMP}Marken.astro';\n\n<Marken />\n`);
  n++;
  for (const k of marken.kategorien) {
    writeFileSync(join(dir, `${k.id}.mdx`), `---\ntitle: ${y(k.name[l] ?? k.name.de)}\ndescription: ${y(k.kurz[l] ?? k.kurz.de)}\nsidebar:\n  hidden: true\ntableOfContents: false\nlastUpdated: false\ntranslated: ${translated}\n---\nimport MarkenKategorie from '${KOMP}MarkenKategorie.astro';\n\n<MarkenKategorie id=${y(k.id)} />\n`);
    n++;
  }
}
console.log(`${n} Seiten geschrieben`);
```
Ausführen: `node scripts/marken-seiten.mjs` → `99 Seiten geschrieben`.

- [ ] **Step 4: `src/components/Marken.astro` (Übersicht)**

```astro
---
// Marken & Modelle – Übersicht (Spec §7): Kategorie-Karten mit Modellzahl und Stand, Hinweis (keine Kaufempfehlung, keine Partner-Links),
// Änderungsprotokoll (letzte 8). Namen aus marken.json (9 Sprachen), Marken-/Modellnamen nie übersetzt.
import marken from '../data/marken.json';
import protokoll from '../data/marken-changelog.json';
import ui from '../data/startseite-ui.json';
const locale = Astro.locals.starlightRoute.locale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).marken;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/elektrowerkzeuge/marken/`;
const L = (o: Record<string, string>) => o[locale] ?? o.de;
const kats = marken.kategorien.map((k) => { const m = marken.modelle.filter((x) => x.kategorie === k.id); return { ...k, anzahl: m.length, stand: [...m.map((x) => x.stand)].sort().at(-1) ?? '' }; });
const name = new Map(marken.modelle.map((m) => [m.id, `${m.marke} ${m.modell}`]));
const log = [...protokoll.eintraege].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 8);
---
<div class="marken not-content">
  <p class="ww-sub">{t.untertitel}</p>
  <p class="mk-hinweis" role="note">{t.hinweis}</p>
  <div class="raster">
    {kats.map((k) => (
      <a class="ww-karte marken-kat" href={`${base}${k.id}/`} data-kat={k.id}>
        <span class="karte-body">
          <span class="karte-kick"><span>{t.filterGruppen.kategorie}</span><span class="ww-pill ww-pill-tag">{k.anzahl} {t.modelle}</span></span>
          <span class="karte-titel">{L(k.name)}</span>
          <span class="karte-text">{L(k.kurz)}</span>
        </span>
        <span class="karte-fuss"><span class="karte-meta">{t.stand} {k.stand}</span></span>
      </a>
    ))}
  </div>
  <section class="mk-protokoll" aria-labelledby="mk-log-h">
    <div class="ww-sec"><h2 id="mk-log-h">{t.protokoll}</h2></div>
    {log.length === 0 ? <p class="ww-sub">{t.protokollLeer}</p> : (
      <ul class="mk-log">{log.map((e) => <li><time datetime={e.datum}>{e.datum}</time> · <span lang="de" translate="no">{name.get(e.modell)}</span> – {L(e.text)}</li>)}</ul>
    )}
  </section>
</div>

<style>
  .marken { display: grid; gap: 1.5rem; }
  .mk-hinweis { margin: 0; padding-inline-start: 0.75rem; border-inline-start: 3px solid var(--ww-accent); color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .mk-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; font-size: var(--sl-text-sm); }
  .mk-log time { color: var(--ww-muted); font-variant-numeric: tabular-nums; }
</style>
```

- [ ] **Step 5: `src/components/MarkenKategorie.astro`**

```astro
---
// Kategorieseite (Spec §7): Modell-Karten (Stufe, Budget, verbreitet, Kennwerte, Datenblatt/Quelle), Vergleichstabelle, Protokoll der Kategorie.
// Filter aus MarkenFilter.astro (Event „ww-filter“) wirken client-seitig in <ww-marken>: alles gerendert, JS setzt nur `hidden`.
import marken from '../data/marken.json';
import protokoll from '../data/marken-changelog.json';
import ui from '../data/startseite-ui.json';
interface Props { id: string }
const { id } = Astro.props;
const locale = Astro.locals.starlightRoute.locale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const tm = t.marken;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/`;
const L = (o: Record<string, string>) => o[locale] ?? o.de;
const kat = marken.kategorien.find((k) => k.id === id);
if (!kat) throw new Error(`marken.json: Kategorie „${id}“ fehlt`);
type Stufe = 'einstieg' | 'azubi' | 'profi';
type Modell = (typeof marken.modelle)[number] & { datenblatt?: string; stufe: Stufe };
const modelle = (marken.modelle as Modell[]).filter((m) => m.kategorie === id).sort((a, b) => Number(b.verbreitet) - Number(a.verbreitet) || a.marke.localeCompare(b.marke, 'de'));
const keys = [...new Set(modelle.flatMap((m) => m.specs.map((s) => s.k)))];
const budget = (n: number) => '€'.repeat(n) + '·'.repeat(3 - n);
const name = new Map(modelle.map((m) => [m.id, `${m.marke} ${m.modell}`]));
const log = protokoll.eintraege.filter((e) => name.has(e.modell)).sort((a, b) => b.datum.localeCompare(a.datum));
---
<ww-marken class="marken-kat not-content" data-kat={id}>
  <p class="ww-sub">{L(kat.kurz)}</p>
  <div class="mk-kopf">
    <button type="button" class="ww-chip md:sl-hidden" popovertarget="starlight__sidebar">{tm.filterGruppen.kategorie}</button>
    <a class="ww-link" href={`${base}elektrowerkzeuge/marken/`}>← {tm.zurUebersicht}</a>
    {kat.woerterbuch.length > 0 && <a class="ww-link" href={`${base}elektrowerkzeuge/woerterbuch/#${kat.woerterbuch[0]}`}>{tm.zumWoerterbuch} →</a>}
    <p class="mk-zahl" aria-live="polite"><output>{modelle.length}</output> {tm.modelle}</p>
  </div>
  <p class="mk-hinweis" role="note">{tm.hinweis}</p>
  <div class="raster">
    {modelle.map((m) => (
      <article class="ww-karte modell" id={m.id} data-stufe={m.stufe} data-budget={m.budget} data-verbreitet={m.verbreitet ? '' : undefined}>
        <div class="karte-body">
          <span class="karte-kick">
            <span class:list={['ww-pill', `ww-pill-${m.stufe}`]}>{t.stufen[m.stufe]}</span>
            <span class="mk-budget" title={tm.budget}><span class="sr-only">{tm.budget}: </span>{budget(m.budget)}</span>
            {m.verbreitet && <span class="ww-pill ww-pill-tag">{tm.verbreitet}</span>}
          </span>
          <h3 class="karte-titel" lang="de" translate="no">{m.marke} {m.modell}</h3>
          <p class="karte-text">{L(m.kurz)}</p>
          <dl class="mk-specs">{m.specs.map((s) => <Fragment><dt>{s.k}</dt><dd>{s.v}</dd></Fragment>)}</dl>
        </div>
        <div class="karte-fuss">
          <a class="ww-link" href={m.datenblatt ?? m.quelle} rel="noopener" target="_blank">{m.datenblatt ? tm.datenblatt : tm.quelle} ↗</a>
          <span class="karte-meta">{tm.stand} {m.stand}</span>
        </div>
      </article>
    ))}
  </div>
  <p class="mk-keine" hidden>{tm.keineTreffer}</p>
  <section class="mk-vergleich-sec" aria-labelledby="mk-vergleich-h">
    <div class="ww-sec"><h2 id="mk-vergleich-h">{tm.vergleich}</h2></div>
    <div class="mk-scroll">
      <table class="mk-vergleich">
        <thead><tr><th scope="col">{tm.modelle}</th>{keys.map((k) => <th scope="col">{k}</th>)}</tr></thead>
        <tbody>{modelle.map((m) => <tr data-modell={m.id}><th scope="row" lang="de" translate="no">{m.marke} {m.modell}</th>{keys.map((k) => <td>{m.specs.find((s) => s.k === k)?.v ?? '–'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>
  <section class="mk-protokoll" aria-labelledby="mk-log-h">
    <div class="ww-sec"><h2 id="mk-log-h">{tm.protokoll}</h2></div>
    {log.length === 0 ? <p class="ww-sub">{tm.protokollLeer}</p> : <ul class="mk-log">{log.map((e) => <li><time datetime={e.datum}>{e.datum}</time> · <span lang="de" translate="no">{name.get(e.modell)}</span> – {L(e.text)}</li>)}</ul>}
  </section>
</ww-marken>

<style>
  .marken-kat { display: grid; gap: 1.5rem; }
  .mk-kopf { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
  .mk-zahl { margin: 0; margin-inline-start: auto; color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .mk-hinweis { margin: 0; padding-inline-start: 0.75rem; border-inline-start: 3px solid var(--ww-accent); color: var(--ww-muted); font-size: var(--sl-text-sm); }
  .modell { display: flex; flex-direction: column; }
  .modell[hidden], .mk-keine[hidden], tr[hidden] { display: none; }
  .modell .karte-titel { margin: 0; font-size: var(--sl-text-lg); }
  .mk-budget { color: var(--ww-muted); font-variant-numeric: tabular-nums; letter-spacing: 0.05em; }
  .mk-specs { display: grid; grid-template-columns: max-content 1fr; gap: 0.2rem 0.75rem; margin: 0.5rem 0 0; font-size: var(--sl-text-sm); }
  .mk-specs dt { color: var(--ww-muted); }
  .mk-specs dd { margin: 0; }
  .karte-fuss { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
  .mk-scroll { overflow-x: auto; }
  .mk-vergleich { width: 100%; border-collapse: collapse; font-size: var(--sl-text-sm); }
  .mk-vergleich th, .mk-vergleich td { padding: 0.45rem 0.5rem; border-block-end: 1px solid var(--ww-line); text-align: start; vertical-align: top; white-space: nowrap; }
  .mk-vergleich thead th { font-size: var(--sl-text-xs); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ww-muted); }
  .mk-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; font-size: var(--sl-text-sm); }
  .mk-log time { color: var(--ww-muted); font-variant-numeric: tabular-nums; }
</style>

<script>
  class WwMarken extends HTMLElement {
    connectedCallback() {
      const karten = [...this.querySelectorAll<HTMLElement>('article.modell')];
      const zeilen = [...this.querySelectorAll<HTMLTableRowElement>('tr[data-modell]')];
      const zahl = this.querySelector<HTMLOutputElement>('.mk-zahl output')!;
      const keine = this.querySelector<HTMLElement>('.mk-keine')!;
      const f = { stufe: '', budget: '', verbreitet: false };
      const anwenden = () => {
        let n = 0;
        for (const k of karten) {
          const ok = (!f.stufe || k.dataset.stufe === f.stufe) && (!f.budget || k.dataset.budget === f.budget) && (!f.verbreitet || 'verbreitet' in k.dataset);
          k.hidden = !ok; if (ok) n++;
        }
        for (const z of zeilen) z.hidden = karten.find((k) => k.id === z.dataset.modell)?.hidden ?? false;
        zahl.value = String(n); keine.hidden = n > 0;
      };
      document.addEventListener('ww-filter', (ev) => {
        const d = (ev as CustomEvent<string>).detail;
        if (d === 'reset') { f.stufe = ''; f.budget = ''; f.verbreitet = false; }
        else if (d.startsWith('stufe:')) f.stufe = f.stufe === d.slice(6) ? '' : d.slice(6);
        else if (d.startsWith('budget:')) f.budget = f.budget === d.slice(7) ? '' : d.slice(7);
        else if (d === 'verbreitet') f.verbreitet = !f.verbreitet;
        anwenden();
      });
    }
  }
  customElements.define('ww-marken', WwMarken);
</script>
```

- [ ] **Step 6: `src/components/MarkenFilter.astro`**

```astro
---
// Filter-Seitenleiste Marken (Spec §7): Kategorien als echte Links (aktuelle mit aria-current) · Stufe · Budget · Verbreitung als Umschalter.
// Event „ww-filter“ (detail 'reset' | 'stufe:<s>' | 'budget:<1|2|3>' | 'verbreitet') an MarkenKategorie.astro; auf der Übersicht nur Kategorien.
import marken from '../data/marken.json';
import ui from '../data/startseite-ui.json';
import { ohneLocale } from '../scripts/seiten';
const locale = Astro.locals.starlightRoute.locale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const tm = t.marken;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/elektrowerkzeuge/marken/`;
const aktuell = ohneLocale(Astro.locals.starlightRoute.entry.id).replace(/^elektrowerkzeuge\/marken\/?/, '');
const L = (o: Record<string, string>) => o[locale] ?? o.de;
const zahl = (k: string) => marken.modelle.filter((m) => m.kategorie === k).length;
const aufKategorie = aktuell !== '';
---
<ww-marken-filter class="ww-filter">
  <p class="ww-grp">{tm.filterGruppen.kategorie}</p>
  <div class="ww-side">
    <a class:list={['ww-side-a', { 'ist-aktiv': !aufKategorie }]} href={base} aria-current={!aufKategorie ? 'page' : undefined}>{tm.alle}</a>
    {marken.kategorien.map((k) => <a class:list={['ww-side-a', { 'ist-aktiv': aktuell === k.id }]} href={`${base}${k.id}/`} aria-current={aktuell === k.id ? 'page' : undefined}>{L(k.name)} <small>{zahl(k.id)}</small></a>)}
  </div>
  {aufKategorie && (
    <Fragment>
      <p class="ww-grp">{tm.filterGruppen.stufe}</p>
      <div class="ww-side">{(['einstieg', 'azubi', 'profi'] as const).map((s) => <button type="button" class="ww-side-a" data-filter={`stufe:${s}`} aria-pressed="false">{t.stufen[s]}</button>)}</div>
      <p class="ww-grp">{tm.filterGruppen.budget}</p>
      <div class="ww-side">{[1, 2, 3].map((b) => <button type="button" class="ww-side-a" data-filter={`budget:${b}`} aria-pressed="false">{'€'.repeat(b)}</button>)}</div>
      <p class="ww-grp">{tm.filterGruppen.verbreitung}</p>
      <div class="ww-side">
        <button type="button" class="ww-side-a" data-filter="verbreitet" aria-pressed="false">{tm.nurVerbreitet}</button>
        <button type="button" class="ww-side-a" data-filter="reset">{tm.zuruecksetzen}</button>
      </div>
    </Fragment>
  )}
</ww-marken-filter>

<script>
  class WwMarkenFilter extends HTMLElement {
    connectedCallback() {
      const knoepfe = [...this.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
      const gruppe = (k: HTMLButtonElement) => (k.dataset.filter ?? '').split(':')[0];
      const aus = (x: HTMLButtonElement) => { x.classList.remove('ist-aktiv'); x.setAttribute('aria-pressed', 'false'); };
      for (const k of knoepfe) k.addEventListener('click', () => {
        if (k.dataset.filter === 'reset') knoepfe.forEach(aus);
        else {
          const an = !k.classList.contains('ist-aktiv');
          knoepfe.filter((x) => x !== k && gruppe(x) === gruppe(k)).forEach(aus);
          k.classList.toggle('ist-aktiv', an); k.setAttribute('aria-pressed', String(an));
        }
        document.dispatchEvent(new CustomEvent('ww-filter', { detail: k.dataset.filter }));
      });
    }
  }
  customElements.define('ww-marken-filter', WwMarkenFilter);
</script>
```
`ww-side-a` ist in TP1 für `<button>` und `<a>` gestylt (prüfen: `grep -n 'ww-side-a' src/styles/wattwas.css`); falls nur `button`, Selektor in `wattwas.css` um `a.ww-side-a` erweitern (eine Zeile, im Bericht nennen).

- [ ] **Step 7: `Sidebar.astro`** — Import `MarkenFilter`, Verzweigung um `: katalog === 'marken' ? (<MarkenFilter />)` ergänzen (vor dem Starlight-Zweig).

- [ ] **Step 8: Build + Test → PASS** — `node scripts/marken-seiten.mjs && npm run build 2>&1 | grep -E "error|built" && npm test 2>&1 | tail -1` → `Hepsi geçti (135)`. Mit `git status --short | wc -l` prüfen, dass genau die erwarteten Dateien neu sind (99 MDX + 4 Komponenten/Skripte + Sidebar + Tests).

- [ ] **Step 9: Commit** — `feat(marken): Übersicht und 10 Kategorieseiten (9 Locales, generiert) – Modell-Karten mit Kennwerten und Herstellerquelle, Vergleichstabelle, Änderungsprotokoll, Filter-Seitenleiste`

### Task 7: Marken-Tab aktiv, Entdecken-Kicker, Werkzeug-Hub verlinkt Wörterbuch + Marken

**Files:**
- Modify: `src/data/tabs.json` (`marken.aktiv: true`), `src/components/Entdecken.astro` (Kicker = Kategoriename), `src/components/Werkzeuge.astro` (Zeile „Mehr“ mit 2 Karten), `scripts/check-site.mjs` (TP1-Tests, die „Marken-Tab nicht gerendert“ annehmen: `grep -n -i 'marken' scripts/check-site.mjs`)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `tabs.json` + `t.tabs.marken` (TP1 Header rendert Tabs mit `aktiv`, „längster Treffer gewinnt“), `marken.json.kategorien[].name` (Task 5), `t.entdecken.werkzeugKarten.{woerterbuch,marken}` (TP1).
- Produces: Header-Tab `a[href="/<l>/elektrowerkzeuge/marken/"]` in allen Locales; auf Marken-Seiten `aria-current="page"` am Marken-Tab, nicht am Werkzeug-Tab; Entdecken-Marken-Karte Kicker „Zangen“ statt „zangen“; `/elektrowerkzeuge/` Hub: `nav.wz-mehr` mit 2 `a.ww-karte`.

- [ ] **Step 1: Tests**

```js
  // TP2 · Task 7: Tab, Kicker, Hub
  ['Marken-Tab aktiv: 6 Tabs im Header (de, tr), Marken-Tab aria-current auf /marken/zangen/, Werkzeug-Tab dort nicht aktuell', () => { const z = read('de/elektrowerkzeuge/marken/zangen'); const kopf = (h) => h.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''; return ['entdecken', 'lernen', 'elektrowerkzeuge', 'elektrowerkzeuge/marken', 'glossar', 'blog'].every((p) => kopf(read('de')).includes(`href="/de/${p}/"`)) && kopf(read('tr')).includes('href="/tr/elektrowerkzeuge/marken/"') && /href="\/de\/elektrowerkzeuge\/marken\/"[^>]*aria-current="page"/.test(kopf(z)) && !/href="\/de\/elektrowerkzeuge\/"[^>]*aria-current="page"/.test(kopf(z)); }],
  ['Werkzeug-Hub: Karten zu Wörterbuch und Marken (de, tr), Entdecken-Marken-Kicker zeigt Kategorienamen', () => { const h = read('de/elektrowerkzeuge'); const block = read('de/entdecken').match(/data-block="marken"[\s\S]*?<\/section>/)?.[0] ?? ''; return /class="wz-mehr(?: astro-[\w-]+)?"/.test(h) && h.includes('href="/de/elektrowerkzeuge/woerterbuch/"') && h.includes('href="/de/elektrowerkzeuge/marken/"') && read('tr/elektrowerkzeuge').includes('href="/tr/elektrowerkzeuge/woerterbuch/"') && block !== '' && /karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>[A-ZÄÖÜ]/.test(block); }],
```
Task-6-Test 4 („Marken (tr/ar) …“): den in Task 6 ausgelassenen Teilausdruck `&& !/karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>[a-z]+</.test(block)` jetzt ergänzen. Vorher prüfen, wie `Header.astro` den aktuellen Tab markiert (`grep -n 'aria-current\|ist-aktiv' src/components/Header.astro`); ist es nicht `aria-current="page"`, den Test auf das tatsächliche Attribut umstellen (Absicht bleibt: Marken-Tab aktuell, Werkzeug-Tab nicht). TP1-Tests, die 5 Tabs oder „kein Marken-Tab“ prüfen, auf 6 Tabs umstellen (Namen anpassen, Absicht behalten).

- [ ] **Step 2: Build + Test → FAIL.**

- [ ] **Step 3: `tabs.json`** — `{ "id": "marken", …, "aktiv": true }`; `_hinweis`: „TP2 setzt marken auf true“ → „marken seit TP2 aktiv“.

- [ ] **Step 4: `Entdecken.astro`** — Zeile 38/39 (Glob-Typ und `marken`) erweitern:

```ts
const markenMod = import.meta.glob('../data/marken.json', { eager: true }) as Record<string, { default: { kategorien?: { id: string; name: Record<string, string> }[]; modelle?: { id: string; marke: string; modell: string; kategorie: string; stand: string; kurz: Record<string, string> }[] } }>;
const markenDaten = Object.values(markenMod)[0]?.default;
const katName = (id: string) => { const k = markenDaten?.kategorien?.find((x) => x.id === id); return k ? (k.name[locale] ?? k.name.de) : id; };
const marken = (markenDaten?.modelle ?? []).sort((a, b) => b.stand.localeCompare(a.stand)).slice(0, 4);
```
und im Markup (Zeile 76) `<span>{m.kategorie}</span>` → `<span>{katName(m.kategorie)}</span>`.

- [ ] **Step 5: `Werkzeuge.astro`** — nach `<p class="filter" …>` einfügen (Texte aus `ui.entdecken.werkzeugKarten`, bereits 9 Sprachen):

```astro
  <nav class="wz-mehr" aria-label={te.werkzeug}>
    {(['woerterbuch', 'marken'] as const).map((id) => (
      <a class="ww-karte" href={`${base}elektrowerkzeuge/${id}/`}><span class="karte-body"><span class="karte-titel">{wk[id].titel}</span><span class="karte-text">{wk[id].text}</span></span></a>
    ))}
  </nav>
```
Frontmatter dazu: `const te = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).entdecken; const wk = te.werkzeugKarten as Record<string, { titel: string; text: string }>; const base = \`${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/\`;` — Style: `.wz-mehr { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 0.75rem; margin-block: 0 1.5rem; }`.

- [ ] **Step 6: Build + Test → PASS** — `Hepsi geçti (137)`.

- [ ] **Step 7: Commit** — `feat(navigation): Tab „Marken & Modelle“ aktiv, Werkzeug-Hub verlinkt Wörterbuch und Marken, Entdecken zeigt Kategorienamen`

---

### Task 8: Doku, Rückmeldung R6, Screenshots, Kadirs Blick

**Files:**
- Modify: `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` (neuer Abschnitt „15. Abweichungen im Plan TP2“), `docs/superpowers/specs/2026-09-13-rueckmeldung-tp1.md` (R6 Status), `ROADMAP.md` („Son güncelleme“ 1 Zeile + TP2-Zeile)
- Create: `docs/superpowers/specs/screens/2026-09-13-tp2/*.png`

- [ ] **Step 1: Spec §15 (Abweichungen TP2) — genau diese Punkte, je 1–2 Sätze, Almanca**

1. **Kein Übersetzungshinweis** (§6 „Kennzeichnung maschinell übersetzt, wird geprüft“): nach Rückmeldung R1 (13.09.) gibt es keine sichtbare Kennzeichnung mehr; der Stand je Sprache steht nur in `woerterbuch.json._stand`.
2. **A–Z sortiert innerhalb der Kategorie**, nicht seitenweit (Kategorieabschnitte bleiben stehen).
3. **Leichte Sprache:** Wörterbuch ohne Zielspalte, „Wofür“ aus `wofuer.leicht`; Marken-Seiten in `leicht` mit den deutschen `kurz.leicht`-Texten.
4. **Kategorieseiten nicht in der Starlight-Seitenleiste** (`sidebar.hidden`), erreichbar über Marken-Übersicht, Filter-Seitenleiste und Wörterbuch-Links; 99 MDX werden von `scripts/marken-seiten.mjs` erzeugt.
5. **Bilder:** Start ohne Fotos, alle 85 Zeilen zeigen „Foto folgt“ (Platzhalter laut §6); Fotos kommen mit eigenem Inhaltsplan.
6. **Affiliate:** Feld `affiliate` je Modell und `affiliateAktiv:false` vorhanden, nichts gerendert (R6). Aktivierung = eigene Aufgabe: Kennzeichnung „Anzeige“, `rel="sponsored"`, Datenschutz-Absatz.
7. **Filter kombinierbar** (Stufe × Budget × Verbreitung) statt „ein Filter gleichzeitig“ wie auf Entdecken.
8. **Vergleichstabelle** = Vereinigung der Kennwert-Schlüssel je Kategorie; fehlender Wert „–“.

- [ ] **Step 2: Rückmeldung R6** — in `2026-09-13-rueckmeldung-tp1.md` Tabelle 3, Spalte Umsetzung: „✅ Datenmodell in TP2 (marken.json `affiliate`, `affiliateAktiv:false`); Aktivierung wartet auf Kadirs Konto.“

- [ ] **Step 3: ROADMAP** — Zeile unter TP1: `TP2 Werkzeug ✅ <Datum> – Wörterbuch 85 Begriffe/9 Sprachen, Marken & Modelle 10 Kategorien/<N> Modelle, Tab aktiv; Fotos + Affiliate offen`.

- [ ] **Step 4: Screenshots** — Server `cd dist && python -m http.server 8767 --bind 127.0.0.1` (Hintergrund), `node scratch/screens.cjs` mit JOBS (siehe TP1 Task 13 Report `C:\Users\kadir\Projects\Elektrolehre\.superpowers\sdd\2026-09-12-tp1-fundament\task-13-report.md` für Aufrufform): `de/elektrowerkzeuge/woerterbuch` 1440×900 + 390×844 · `de/elektrowerkzeuge/marken` 1440×900 · `de/elektrowerkzeuge/marken/zangen` 1440×900 + 390×844 · `tr/elektrowerkzeuge/woerterbuch` 1440×900 · `ar/elektrowerkzeuge/marken/multimeter` 1440×900 · `de/entdecken` 1440×900 (Marken-Block). Ablage `docs/superpowers/specs/screens/2026-09-13-tp2/`. Jede PNG ansehen: Zeilen vollständig, RTL korrekt, keine abgeschnittenen Chips, Vergleichstabelle scrollt statt zu überlaufen. Sichtbare Fehler → hier fixen (eigener Commit), erneut schießen.

- [ ] **Step 5: Test + Commit** — `npm test` → alle grün (≈ 137). Commit: `docs(tp2): Spec §15 Abweichungen, Rückmeldung R6, ROADMAP, Screenshots Wörterbuch/Marken (de/tr/ar, Desktop + mobil)`

- [ ] **Step 6: Kadir** — PNGs senden (SendUserFile), 5 Zeilen Zusammenfassung (Zahlen: Begriffe, Modelle, Tests), offene Punkte (Fotos, Affiliate, Profi-Name R2). Merge-Entscheidung liegt bei Kadir; kein Push.

---

## Selbstprüfung (beim Schreiben des Plans)

**Spec-Abdeckung:** §6 Datei/Felder → T1–T2 · §6 Kategorien → T1 · §6 Startumfang 80–100 → T1 (85) · §6 Übersetzung → T2 (Worker, kein LM Studio mehr) · §6 Seite (Suche, Chips, Tabelle, mobil Karten, Platzhalter, de→en, leicht) → T4 · §7 Datei/Felder/Protokoll → T5 · §7 Startkategorien 10, 3–6 Modelle, Datenblätter → T5 · §7 Übersicht/Kategorieseite/Filter/Vergleich/Protokoll/Notiz → T6 · §7 Pflege → Protokoll + `stand` (Prozess: Joseph monatlich, ROADMAP) · §7 Affiliate aus → T5/T8 · §7 Namen nie übersetzt → T5 Tests + `lang="de" translate="no"` (T4/T6) · §3.1 Marken-Tab → T7 · §3.2 Filter-Seitenleisten Wörterbuch/Marken → T4/T6 · §3.2 Werkzeug-Gruppe (Grundausstattung, Wörterbuch, Marken) → T4/T6 (`sidebar.order` 1/2/3) · §5 (4) 3 Werkzeug-Karten → Entdecken zeigt 4 (Guide, Grundausstattung, Wörterbuch, Marken; TP1-Daten) · §5 (5) Marken zuletzt aktualisiert → T7 · §12 Screenshots vor dem Merge, kein Push → T8 · §14 (4) Tab erst mit TP2 → T7 · R1 → T4/T8 · R6 → T5/T8.
**Lücken (bewusst, in §15):** Fotos (T8 Punkt 5); Kennzeichnung „maschinell übersetzt“ entfällt (R1).
**Platzhalter-Scan:** Muster-URLs in T5 Step 4 sind als Muster markiert und werden durch die geprüfte URL ersetzt; keine „TBD“.
**Typkonsistenz:** `t.woerterbuch.*`/`t.marken.*` (T3) ↔ T4/T6/T7; `Eintrag`-Felder (T1) ↔ T2 Script ↔ T4; `Modell`/`Kategorie` (T5) ↔ T6/T7 (`name`, `kurz`, `woerterbuch`, `specs[].k/v`, `datenblatt`, `quelle`, `stand`); Event `ww-filter` detail-Werte T4 (`reset|kat:`) und T6 (`reset|stufe:|budget:|verbreitet`) ↔ Filter-Komponenten; `execSync`-Import in check-site.mjs (T6 Files).
