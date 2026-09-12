# wattwas Neuaufbau · TP1 Fundament — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** wattwas.de'yi D1 katalog düzenine (build.nvidia.com tarzı, grafit + Elektro-Blau, koyu varsayılan) taşımak: yeni tokenlar, Header/Sidebar/PageFrame override'ları, Stufen (einstieg/azubi/profi) seçimi ve rozetleri, boş Startseite, `/entdecken/` ve `/lernen/`, sosyal/video görünürlük kuralı, eski Startseite bileşenlerinin sökümü — 9 locale, testler ≥ 83, ekran görüntüleri.

**Architecture:** Astro 7.3 + Starlight 0.42 kalır. Görünüm = `src/styles/wattwas.css` (D1 tokenları → `--sl-color-*` eşlemesi, katmansız CSS Starlight'ın `@layer`'larını ezer) + component override'ları (`Header`, `SiteTitle`, `ThemeProvider`, `ThemeSelect`, `Sidebar`, `PageFrame`, `Hero`, `MarkdownContent`, `Footer`). Stufe: `localStorage["ww-stufe"]` → `<html data-stufe>` head'deki inline script ile (flicker yok); Stufe'ye bağlı görünürlük CSS ile (`:root[data-stufe=…]`), JS yalnız yazma. Seitenleiste rozetleri Starlight route-middleware'i ile `stufe` frontmatter'ından türetilir. Yeni sayfalar ince MDX (9 locale) + bileşen; metinler `src/data/startseite-ui.json` (9 locale, anahtar paritesi testli). Test katmanı: `scripts/check-site.mjs` (`dist/` HTML + kaynak dosya kontrolleri).

**Tech Stack:** Node 26, Astro 7.3.2, @astrojs/starlight 0.42.0, @fontsource-variable/inter, Pagefind (Starlight içi), Playwright (npx cache, `scratch/screens.cjs`).

**Spec:** `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` (Almanca; mockup'lar `docs/superpowers/specs/mockups/2026-09-12-neuaufbau/`, bağlayıcı: `d1.css`, `d-katalog.html`, `d1-home.html`, `d1-artikel.html`).

## Global Constraints

- Repo: `C:\Users\kadir\Projects\Elektrolehre`. Branch **`tp1-fundament`**, `neuaufbau` (5ae3949) üzerinden. **Push YOK** (Kadir'in sözü olmadan). Commit mesajları Almanca, sonunda `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Locale'ler: `de` (kaynak), `leicht`, `tr`, `en`, `ru`, `ar` (rtl), `fa` (rtl), `ka`, `sq`. Hepsi ön ekli, `root` yok. `leicht` yalnız `index.mdx` taşır, gerisi de fallback.
- Tokenlar (Spec §4.1, plan düzeltmeleriyle — bkz. "Abweichungen"): koyu `--ww-bg #121417 · surface #191C21 · surface-2 #1F242B · line #2A2F36 · text #E3E7EB · muted #8F98A3 · accent #4DA3FF · accent-soft rgba(77,163,255,.14) · stufe-einstieg #5CC98A · azubi #4DA3FF · profi #C084FC · sicherheit #FF7B7B`; açık `bg #F4F6F8 · surface #FFFFFF · surface-2 #EEF2F6 · line #DCE2E8 · text #1C2430 · muted #5D6B7A · accent #1A5FD0 · accent-soft rgba(26,95,208,.10) · einstieg #15803D · azubi #1A5FD0 · profi #7C3AED · sicherheit #C43C3C`. Dolgulu buton metni: koyu temada `#121417`, açıkta `#FFFFFF`. Verlauf/Glow/Schatten YOK. Yalnız Inter (Space Grotesk kalkar).
- Ölçüler: header 52 px (`--sl-nav-height: 3.25rem`), sidebar 250 px, makale içerik 680 px (`--sl-content-width: 42.5rem`), katalog sayfalarında 72rem. Radius 4 px (controls) / 8 px (kartlar) / 999 px (pill).
- Stufen: `stufe: einstieg | azubi | profi` — şemada **default yok, opsiyonel**; 12 içerik sayfasında zorunlu ve 8 locale'de de ile aynı (test). Hub/Rechtliches/Glossar/Über/Mitglied/index'te yok. Etiketler `startseite-ui.json → stufen` (de: Start / Azubi / Profi).
- Görünürlük (Spec §10): `social.json` içinde `url` olmayan kanal hiçbir yerde ikon/link olarak görünmez; `videos.json` yalnız `status:"live"` + `url` ile render edilir. Bugün: hiçbiri.
- Marken & Modelle sekmesi TP2'ye kadar **render edilmez** (`tabs.json → aktiv:false`); Wörterbuch/Marken kartları yalnız hedef sayfa varsa.
- Her sayfa: `lang`, `dir` (ar/fa rtl), hreflang ×9 korunur; mevcut URL'ler değişmez; `astro.config.mjs` redirect'leri kalır.
- Testler: `npm run build && npm test` → tümü geçmeli, sayı asla 83'ün altına düşmez (bu plan sonunda ≈ 100). Test adı Türkçe/Almanca karışık olabilir (mevcut stil).
- Mantıksal CSS özellikleri (`inset-inline-start`, `margin-inline-end`, `padding-inline`); RTL'de şemalar LTR kalır (mevcut).
- Windows/Bash notu: heredoc kırılır → çok satırlı dosyaları **Write** aracıyla oluştur; tek satır node komutları Bash'te çalışır. Build ~1–2 dk.

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `src/styles/wattwas.css` | D1 tokenları, Starlight eşlemesi, ortak D1 parçaları (`.ww-pill`, `.ww-karte`, `.ww-btn`, `.ww-grp`, `.ww-sec`, `.ww-sub`, `.ww-side-a`), header/sidebar/search global stilleri |
| `src/content.config.ts` | `stufe` enum (opsiyonel), `geselle` (opsiyonel) |
| `src/data/startseite-ui.json` | tüm UI metinleri, 9 locale (yeni bloklar: `stufen`, `stufenKurz`, `stufenWahl`, `stufenHinweis`, `tabs`, `theme`, `start`, `geselle`, `entdecken`, `bereiche`, `lernen`, `kanaeleBald`) |
| `src/data/tabs.json` | Top-Tabs (sıra sabit, `aktiv`) |
| `src/data/entdecken.json` | Empfohlen slug listeleri, Bereiche, Werkzeug kartları |
| `src/data/social.json` | kanallar `url: null` |
| `src/routeData.ts` | route middleware: sidebar link rozetleri (`stufe`) |
| `src/scripts/stufe.ts`, `src/scripts/seiten.ts` | Stufe yazma; sayfa tipi yardımcıları |
| `src/components/{Header,SiteTitle,ThemeProvider,ThemeSelect,Sidebar,PageFrame,Hero,MarkdownContent,Footer}.astro` | Starlight override'ları |
| `src/components/{StufenChip,StufenLeiste,StufenWahl,StufenHinweis,Stufe,GeselleKopf,GeselleKasten,TabsMobil,Karte,Entdecken,EntdeckenFilter,Lernen,Startseite,Kanaele}.astro` | D1 parçaları |
| `src/content/docs/<locale>/{index,entdecken,lernen}.mdx` | ince sayfalar ×9 |
| `scripts/check-site.mjs` | testler |
| Silinir: `src/components/schemata/HeroSchaltkreis.astro`; `Startseite.astro` yeniden yazılır; `Hero.astro` yeniden yazılır |

---

### Task 1: Branch, Schema, Stufen-Vergabe, Quelltests

**Files:**
- Modify: `src/content.config.ts:15-16`
- Create: `scratch/stufen-setzen.mjs` (tek seferlik, gitignored)
- Modify: `src/content/docs/{de,en,tr,ru,ar,fa,ka,sq}/…` 12 içerik sayfası × 8 locale (`stufe:` satırı)
- Test: `scripts/check-site.mjs` (kaynak testleri)

**Interfaces:**
- Produces: `entry.data.stufe?: 'einstieg'|'azubi'|'profi'` (hub sayfalarında `undefined`), `entry.data.geselle?: string`. Sonraki tüm görevler `data.stufe` varlığını "içerik sayfası" ölçütü olarak kullanır.

- [ ] **Step 1: Branch aç, ağacın temiz olduğunu doğrula**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git status --short && git switch -c tp1-fundament neuaufbau && git log --oneline -1
```
Beklenen: boş status, `5ae3949 docs: Design-Spec Neuaufbau …`.

- [ ] **Step 2: Kaynak testlerini yaz (önce başarısız olacak)**

`scripts/check-site.mjs` içinde `const FAZ1_SEITEN = […]` bloğundan hemen sonra ekle:

```js
// TP1 (Neuaufbau): Kaynak dosya kontrolleri — build gerekmez.
const src = fileURLToPath(new URL('../src/', import.meta.url));
const mdx = (l, slug) => readFileSync(join(src, 'content/docs', l, `${slug}.mdx`), 'utf8');
const frontmatter = (text) => text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
const stufeVon = (l, slug) => frontmatter(mdx(l, slug)).match(/^stufe: ([a-z]+)/m)?.[1];
const mdxFiles = (dir) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? mdxFiles(f) : n.endsWith('.mdx') ? [f] : []; });
const INHALT_LOCALES = ['de', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'];
// Spec Anhang A
const STUFEN_SOLL = {
  'grundlagen/strom-spannung-widerstand': 'einstieg', 'grundlagen/netz-und-leiterfarben': 'einstieg', 'grundlagen/sicherheitsregeln': 'einstieg', 'grundlagen/schutzorgane': 'azubi',
  [`${EGT}/berufsbild`]: 'einstieg', [`${EGT}/lernfelder`]: 'einstieg', [`${EGT}/weiterbildung`]: 'azubi',
  [`${EGT}/wechselschaltung-steckdose`]: 'einstieg', [`${EGT}/unterverteilung`]: 'azubi', [`${EGT}/zaehlerplatz`]: 'azubi',
  'elektrowerkzeuge/grundausstattung-azubi': 'einstieg', 'blog/fehler-des-tages-1-rcd-gruppen': 'azubi',
};
const OHNE_STUFE = ['index', 'glossar', 'ueber', 'mitglied', 'themen/index', 'grundlagen/index', 'elektrowerkzeuge/index', 'blog/index', `${EGT}/index`, 'rechtliches/impressum', 'rechtliches/datenschutz', 'rechtliches/haftungsausschluss'];
```

`export const checks = [` dizisinin **sonuna** (son `];` öncesi) ekle:

```js
  // TP1 · Task 1: Stufen
  ['Stufe je Inhaltsseite = Spec Anhang A (de)', () => Object.entries(STUFEN_SOLL).every(([s, st]) => stufeVon('de', s) === st)],
  ['Stufe in allen 8 Locales gleich wie de', () => Object.keys(STUFEN_SOLL).every((s) => INHALT_LOCALES.every((l) => stufeVon(l, s) === stufeVon('de', s)))],
  ['Nur einstieg|azubi|profi im Quelltext (kein geselle/meister)', () => mdxFiles(join(src, 'content/docs')).every((f) => !/^stufe: (?!einstieg$|azubi$|profi$)/m.test(frontmatter(readFileSync(f, 'utf8'))))],
  ['Hubs, Rechtliches, Glossar, Über, Mitglied, index ohne stufe', () => OHNE_STUFE.every((s) => stufeVon('de', s) === undefined)],
```

- [ ] **Step 3: Testi çalıştır, başarısızlığı gör**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "Stufe je|Locales gleich|geselle/meister|ohne stufe"
```
Beklenen: `FAIL Stufe je Inhaltsseite = Spec Anhang A (de)` (schutzorgane vb. hâlâ `einstieg`), diğer üçü OK.

- [ ] **Step 4: Şemayı güncelle**

`src/content.config.ts` satır 15–16'yı şununla değiştir:

```ts
        // Stufen (Spec Neuaufbau §3.3): einstieg = Start · azubi = Ausbildung · profi = Geselle/Meistervorbereitung/Praxis.
        // Kein Default: Hubs, Rechtliches, Glossar, Über tragen keine Stufe; Inhaltsseiten müssen eine tragen (Test).
        stufe: z.enum(['einstieg', 'azubi', 'profi']).optional(),
        // Geselle-Kasten in der Seitenleiste: ein Satz je Seite (optional, sonst Standard je Bereich)
        geselle: z.string().max(140).optional(),
```

- [ ] **Step 5: Stufen'i tüm locale'lerde ata**

`scratch/stufen-setzen.mjs` (Write ile):

```js
// Einmalig (TP1 Task 1): Stufe je Inhaltsseite nach Spec Anhang A in allen Locales setzen. Aufruf: node scratch/stufen-setzen.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const EGT = 'themen/energie-und-gebaeudetechnik';
const STUFEN = {
  'grundlagen/strom-spannung-widerstand': 'einstieg', 'grundlagen/netz-und-leiterfarben': 'einstieg', 'grundlagen/sicherheitsregeln': 'einstieg', 'grundlagen/schutzorgane': 'azubi',
  [`${EGT}/berufsbild`]: 'einstieg', [`${EGT}/lernfelder`]: 'einstieg', [`${EGT}/weiterbildung`]: 'azubi',
  [`${EGT}/wechselschaltung-steckdose`]: 'einstieg', [`${EGT}/unterverteilung`]: 'azubi', [`${EGT}/zaehlerplatz`]: 'azubi',
  'elektrowerkzeuge/grundausstattung-azubi': 'einstieg', 'blog/fehler-des-tages-1-rcd-gruppen': 'azubi',
};
let n = 0, fehlt = [];
for (const [slug, stufe] of Object.entries(STUFEN)) for (const l of ['de', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']) {
  const f = `src/content/docs/${l}/${slug}.mdx`;
  if (!existsSync(f)) { fehlt.push(f); continue; }
  const alt = readFileSync(f, 'utf8');
  if (!/^stufe: [a-z]+/m.test(alt)) { fehlt.push(f + ' (keine stufe-Zeile)'); continue; }
  const neu = alt.replace(/^(stufe: )[a-z]+/m, `$1${stufe}`);
  if (neu !== alt) { writeFileSync(f, neu); n++; }
}
console.log(`${n} Dateien geändert`, fehlt.length ? `\nFEHLT:\n${fehlt.join('\n')}` : '');
```

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scratch/stufen-setzen.mjs && git diff --stat | tail -1
```
Beklenen: `40 Dateien geändert` (5 azubi sayfası × 8 locale), FEHLT boş.

- [ ] **Step 6: Testleri tekrar çalıştır**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "Stufe je|Locales gleich|geselle/meister|ohne stufe"
```
Beklenen: 4 × OK.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/content.config.ts src/content/docs scripts/check-site.mjs && git commit -q -m "feat(stufen): Schema einstieg|azubi|profi ohne Default, Stufen je Seite nach Spec Anhang A (8 Locales), Quelltests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 2: Design-System D1 — Tokenlar, Starlight eşlemesi, yalnız Inter

**Files:**
- Rewrite: `src/styles/wattwas.css`
- Modify: `astro.config.mjs:104` (customCss), `package.json` (space-grotesk kaldır)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Produces: CSS özel özellikleri `--ww-bg, --ww-surface, --ww-surface-2, --ww-line, --ww-text, --ww-muted, --ww-accent, --ww-accent-soft, --ww-on-accent, --ww-stufe-einstieg, --ww-stufe-azubi, --ww-stufe-profi, --ww-sicherheit, --ww-helm, --ww-radius, --ww-radius-sm`; global sınıflar `.ww-pill`, `.ww-pill-einstieg|azubi|profi|tag|sicher`, `.ww-karte`, `.karte-body`, `.karte-kick`, `.karte-titel`, `.karte-text`, `.karte-fuss`, `.karte-meta`, `.ww-btn`, `.ww-btn-fill`, `.ww-link`, `.ww-grp`, `.ww-sec`, `.ww-sub`, `.ww-side`, `.ww-side-a`, `.ist-aktiv`, `.raster`, `.raster-3`, `.ww-chip`. Geçiş takma adları (`--ww-amber` vb. → D1) Task 11'de silinir.

- [ ] **Step 1: Test ekle (dist CSS + fontlar)**

`checks` sonuna:

```js
  // TP1 · Task 2: D1-Tokens, nur Inter
  ['D1-Tokens im gebauten CSS (Akzent #4DA3FF, Graphit #121417), kein Bernstein #F59E0B', () => { const css = readdirSync(join(dist, '_astro')).filter((n) => n.endsWith('.css')).map((n) => readFileSync(join(dist, '_astro', n), 'utf8')).join('\n'); return /#4da3ff/i.test(css) && /#121417/i.test(css) && !/#f59e0b|#f97316|#22d3ee/i.test(css); }],
  ['Fontlar: nur Inter self-hosted, kein Space Grotesk, kein Google Fonts', () => htmlFiles(dist).every((f) => !readFileSync(f, 'utf8').includes('fonts.googleapis.com')) && readdirSync(join(dist, '_astro')).some((n) => /inter.*\.woff2$/i.test(n)) && !readdirSync(join(dist, '_astro')).some((n) => /space-grotesk/i.test(n))],
```

Eski testi değiştir: `['Fontlar self-hosted (Google Fonts çağrısı yok)', …]` satırını (space-grotesk bekleyen) **sil**.

- [ ] **Step 2: Space Grotesk'i kaldır, customCss'i güncelle**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm uninstall @fontsource-variable/space-grotesk --silent && grep -c "space-grotesk" package.json
```
Beklenen: `0`.

`astro.config.mjs` satır 104:
```js
      customCss: ['@fontsource-variable/inter', './src/styles/wattwas.css'],
```

- [ ] **Step 3: `src/styles/wattwas.css` dosyasını tamamen yeniden yaz (Write)**

```css
/*
  wattwas.de – Design-System D1 (Spec 2026-09-12 Neuaufbau §4). Vorbild build.nvidia.com: Katalog-Layout, ruhige Flächen,
  eine Akzentfarbe. Graphit statt Schwarz, weiches Weiß statt Reinweiß, Elektro-Blau als einziger Akzent. Nur Inter.
  Dunkel ist Standard, hell nur bei ausdrücklicher Wahl (ThemeProvider/ThemeSelect).
  Kontrast (WCAG AA, gemessen 12. Sep 2026): dunkel Muted/Surface 5,85:1, Akzent/Surface 6,51:1, Stufen ≥ 6,4:1, Bg/Akzent 7,0:1.
  Hell: Muted/Surface 5,46:1, Akzent #1A5FD0/Weiß 5,85:1 (Spec-Wert #1F6FEB lag bei 4,63/4,12 auf Surface-2), Einstieg #15803D 5,0:1
  (Spec #1F9D55 nur 3,5:1), Sicherheit #C43C3C 5,2:1 (Spec #D64545 4,4:1), Profi 5,7:1. Text auf gefülltem Button: dunkel #121417, hell #fff.
  Keine Verläufe, keine Glows, keine Schatten außer dem Assistenten-Drawer (TP4). Diese Datei ist unlayered und schlägt Starlights @layer.
*/

:root {
  --ww-bg: #121417;
  --ww-surface: #191c21;
  --ww-surface-2: #1f242b;
  --ww-line: #2a2f36;
  --ww-text: #e3e7eb;
  --ww-muted: #8f98a3;
  --ww-accent: #4da3ff;
  --ww-accent-soft: rgba(77, 163, 255, 0.14);
  --ww-on-accent: #121417;
  --ww-stufe-einstieg: #5cc98a;
  --ww-stufe-azubi: #4da3ff;
  --ww-stufe-profi: #c084fc;
  --ww-sicherheit: #ff7b7b;
  --ww-helm: #f2b705;
  --ww-radius: 8px;
  --ww-radius-sm: 4px;

  --sl-font: 'Inter Variable', 'Inter', 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Georgian', sans-serif;
  --sl-line-height: 1.55;
  --sl-line-height-headings: 1.2;
  --sl-text-h1: 1.75rem;
  --sl-text-h2: 1.25rem;
  --sl-text-h3: 1.0625rem;
  --sl-text-h4: 1rem;
  --sl-text-body: 0.9375rem;
  --sl-nav-height: 3.25rem;
  --sl-nav-pad-y: 0.625rem;
  --sl-nav-pad-x: 1.25rem;
  --sl-sidebar-width: 15.625rem;
  --sl-sidebar-pad-x: 0;
  --sl-content-width: 42.5rem;
  --sl-content-pad-x: 1.5rem;

  --sl-color-white: var(--ww-text);
  --sl-color-gray-1: #cfd5db;
  --sl-color-gray-2: #b5bcc4;
  --sl-color-gray-3: var(--ww-muted);
  --sl-color-gray-4: #4b535d;
  --sl-color-gray-5: var(--ww-line);
  --sl-color-gray-6: var(--ww-surface-2);
  --sl-color-gray-7: var(--ww-surface);
  --sl-color-black: var(--ww-bg);
  --sl-color-text: var(--ww-text);
  --sl-color-bg: var(--ww-bg);
  --sl-color-bg-nav: var(--ww-bg);
  --sl-color-bg-sidebar: var(--ww-bg);
  --sl-color-bg-inline-code: var(--ww-surface-2);
  --sl-color-hairline-light: var(--ww-line);
  --sl-color-hairline: var(--ww-line);
  --sl-color-hairline-shade: var(--ww-line);
  --sl-color-accent-low: #10243a;
  --sl-color-accent: var(--ww-accent);
  --sl-color-accent-high: #a8d1ff;
  --sl-color-text-accent: var(--ww-accent);
  --sl-color-text-invert: var(--ww-bg);
  --sl-color-red: var(--ww-sicherheit);
  --sl-color-red-low: rgba(255, 123, 123, 0.1);
  --sl-color-red-high: #ffb3b3;
  --sl-color-green: var(--ww-stufe-einstieg);
  --sl-color-green-low: rgba(92, 201, 138, 0.12);
  --sl-color-green-high: #a7e8c3;
  --sl-color-blue: var(--ww-accent);
  --sl-color-blue-low: var(--ww-accent-soft);
  --sl-color-blue-high: #a8d1ff;
  --sl-color-orange: var(--ww-sicherheit);
  --sl-color-orange-low: rgba(255, 123, 123, 0.1);
  --sl-color-orange-high: #ffb3b3;
  --sl-color-purple: var(--ww-stufe-profi);
  --sl-color-purple-low: rgba(192, 132, 252, 0.12);
  --sl-color-purple-high: #e2c9ff;
  --sl-shadow-sm: none;
  --sl-shadow-md: none;
  --sl-shadow-lg: none;
}

:root[data-theme='light'] {
  --ww-bg: #f4f6f8;
  --ww-surface: #ffffff;
  --ww-surface-2: #eef2f6;
  --ww-line: #dce2e8;
  --ww-text: #1c2430;
  --ww-muted: #5d6b7a;
  --ww-accent: #1a5fd0;
  --ww-accent-soft: rgba(26, 95, 208, 0.1);
  --ww-on-accent: #ffffff;
  --ww-stufe-einstieg: #15803d;
  --ww-stufe-azubi: #1a5fd0;
  --ww-stufe-profi: #7c3aed;
  --ww-sicherheit: #c43c3c;
  --sl-color-gray-1: #2b3441;
  --sl-color-gray-2: #3f4a57;
  --sl-color-gray-4: #b8c1cb;
  --sl-color-accent-low: #dbe8ff;
  --sl-color-accent-high: #143f8a;
  --sl-color-text-invert: #ffffff;
  --sl-color-red-low: rgba(196, 60, 60, 0.08);
  --sl-color-red-high: #8a2a2a;
  --sl-color-green-low: rgba(21, 128, 61, 0.1);
  --sl-color-green-high: #0f5c2c;
  --sl-color-blue-high: #143f8a;
  --sl-color-orange-low: rgba(196, 60, 60, 0.08);
  --sl-color-orange-high: #8a2a2a;
  --sl-color-purple-low: rgba(124, 58, 237, 0.1);
  --sl-color-purple-high: #4c1d95;
}

/* Grundfläche */
body { background: var(--ww-bg); color: var(--ww-text); font-feature-settings: 'cv11', 'ss01'; }
h1, h2, h3, h4, .sl-markdown-content :is(h1, h2, h3, h4) { font-weight: 600; letter-spacing: -0.01em; color: var(--ww-text); }
h1, .sl-markdown-content h1 { font-weight: 700; }
.sl-markdown-content p, .sl-markdown-content li { max-width: 68ch; }
.sl-markdown-content :is(table) { border: 1px solid var(--ww-line); border-radius: var(--ww-radius); overflow: hidden; background: var(--ww-surface); }
.sl-markdown-content :is(th, td) { border: 0; border-bottom: 1px solid var(--ww-line); }
.sl-markdown-content thead th { background: var(--ww-surface-2); font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ww-muted); }
.sl-markdown-content tr:last-child :is(td, th) { border-bottom: 0; }
.sl-markdown-content :is(.starlight-aside, .sicherheit, .quiz, .uebersetzungshinweis, .bild, .schema-wrap, .card, .sl-link-card) { border-radius: var(--ww-radius); }
.sl-markdown-content .schema-wrap { border: 1px solid var(--ww-line); padding: 1rem; background: var(--ww-surface); }
.sl-markdown-content .quiz { background: var(--ww-surface); border-color: var(--ww-line); }
.sl-markdown-content aside.sicherheit { border-color: var(--ww-line); border-inline-start: 3px solid var(--ww-sicherheit); background: var(--ww-surface); }
.sl-markdown-content aside.sicherheit .sicherheit-titel { color: var(--ww-sicherheit); }
.sl-markdown-content .sl-link-card:hover { border-color: var(--ww-accent); }
.sl-markdown-content a:not(:where(.not-content *)) { color: var(--ww-accent); text-underline-offset: 0.2em; text-decoration-thickness: 1px; }

/* Fachbegriffe: Akzent, gepunktet, keine Fläche */
dfn.fachbegriff, .sl-markdown-content dfn { font-style: normal; color: var(--ww-accent); border-bottom: 1px dotted currentColor; }
a:has(> dfn.fachbegriff) { text-decoration: none; }
a:hover > dfn.fachbegriff { border-bottom-style: solid; }

/* Pills (Spec §4.3: 11 px/600, Text bleibt) */
.ww-pill { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.6875rem; font-weight: 600; line-height: 1.4; padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--ww-line); color: var(--ww-muted); white-space: nowrap; background: transparent; font-family: inherit; }
.ww-pill-einstieg { color: var(--ww-stufe-einstieg); border-color: var(--ww-stufe-einstieg); }
.ww-pill-azubi { color: var(--ww-stufe-azubi); border-color: var(--ww-stufe-azubi); }
.ww-pill-profi { color: var(--ww-stufe-profi); border-color: var(--ww-stufe-profi); }
.ww-pill-sicher { color: var(--ww-sicherheit); border-color: var(--ww-sicherheit); }
.ww-pill-tag { color: var(--ww-muted); border-color: var(--ww-line); }
button.ww-pill { cursor: pointer; }
button.ww-pill:hover { border-color: var(--ww-accent); color: var(--ww-text); }

/* Karten */
.ww-karte { display: flex; flex-direction: column; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); color: inherit; text-decoration: none; min-width: 0; }
a.ww-karte:hover, a.ww-karte:focus-visible, .ww-karte:has(> a:hover) { border-color: var(--ww-accent); }
.karte-body { display: flex; flex-direction: column; gap: 0.375rem; padding: 1rem 1.125rem 0.875rem; flex: 1; color: inherit; text-decoration: none; }
.karte-kick { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--ww-muted); }
.karte-titel, .ww-karte h2, .ww-karte h3 { font-size: 1.0625rem; font-weight: 600; margin: 0; color: var(--ww-text); line-height: 1.3; }
.karte-text, .ww-karte p { margin: 0; color: var(--ww-muted); font-size: 0.875rem; line-height: 1.5; }
.karte-fuss { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.625rem 1.125rem; border-top: 1px solid var(--ww-line); font-size: 0.75rem; color: var(--ww-muted); }
.karte-meta { margin-inline-start: auto; white-space: nowrap; }
.raster { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 40rem) { .raster { grid-template-columns: 1fr 1fr; } .raster-3 { grid-template-columns: repeat(3, 1fr); } }

/* Buttons: ein gefüllter Button je Ansicht */
.ww-btn { display: inline-flex; align-items: center; gap: 0.375rem; height: 2.25rem; padding: 0 1rem; border-radius: var(--ww-radius-sm); border: 1px solid var(--ww-accent); color: var(--ww-accent); font-weight: 600; font-size: 0.875rem; text-decoration: none; background: transparent; font-family: inherit; cursor: pointer; white-space: nowrap; }
.ww-btn:hover, .ww-btn:focus-visible { background: var(--ww-accent-soft); }
.ww-btn-fill { background: var(--ww-accent); color: var(--ww-on-accent); }
.ww-btn-fill:hover, .ww-btn-fill:focus-visible { background: var(--ww-accent); filter: brightness(1.08); }
.ww-link { border: 0; background: none; padding: 0; color: var(--ww-accent); font: inherit; font-size: 0.875rem; cursor: pointer; text-decoration: none; }
.ww-link:hover { text-decoration: underline; text-underline-offset: 0.2em; }
.ww-chip { display: inline-flex; align-items: center; gap: 0.375rem; height: 2rem; padding: 0 0.625rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); background: var(--ww-surface); color: var(--ww-text); font-size: 0.8125rem; font-family: inherit; cursor: pointer; white-space: nowrap; }
.ww-chip:hover { border-color: var(--ww-accent); }

/* Gruppenlabel, Abschnittskopf */
.ww-grp { font-size: 0.6875rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ww-muted); margin: 1.125rem 0 0.5rem; padding: 0 1.5rem; }
.ww-sec { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin: 0 0 0.375rem; }
.ww-sec h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
.ww-sub { color: var(--ww-muted); margin: 0 0 1rem; font-size: 0.9375rem; }

/* Filter-/Seitenleisten-Einträge: aktiver Eintrag mit Balken an der Startkante */
.ww-side { display: flex; flex-direction: column; }
.ww-side-a { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.5rem 1.5rem; font-size: 0.875rem; color: var(--ww-muted); text-decoration: none; position: relative; border: 0; background: none; text-align: start; font-family: inherit; cursor: pointer; width: 100%; }
.ww-side-a small { font-size: 0.6875rem; color: var(--ww-muted); }
.ww-side-a:hover { color: var(--ww-text); }
.ww-side-a.ist-aktiv { color: var(--ww-text); background: var(--ww-accent-soft); }
.ww-side-a.ist-aktiv::before { content: ''; position: absolute; inset-inline-start: 0; top: 0; bottom: 0; width: 3px; background: var(--ww-accent); }

/* Starlight-Seitenleiste (Navigation) im D1-Look */
.sidebar-content { padding-top: 1rem; }
.sidebar-content ul { --sl-sidebar-item-padding-inline: 1.5rem; }
.sidebar-content ul ul li { margin-inline-start: 0; border: 0; padding-inline-start: 0; }
.sidebar-content .top-level > li + li { margin-top: 1rem; }
.sidebar-content summary { padding: 0 1.5rem 0.25rem; }
.sidebar-content .group-label .large { font-size: 0.6875rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ww-muted); font-weight: 600; }
.sidebar-content summary .caret { display: none; }
.sidebar-content a { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.5rem 1.5rem; border-radius: 0; font-size: 0.875rem; color: var(--ww-muted); position: relative; }
.sidebar-content a:hover { color: var(--ww-text); }
.sidebar-content a[aria-current='page'], .sidebar-content a[aria-current='page']:hover { color: var(--ww-text); background: var(--ww-accent-soft); font-weight: 500; }
.sidebar-content a[aria-current='page']::before { content: ''; position: absolute; inset-inline-start: 0; top: 0; bottom: 0; width: 3px; background: var(--ww-accent); }
.sidebar-content a > span:first-child { min-width: 0; }
.sl-badge.ww-stufe { font-size: 0.6875rem; font-weight: 600; padding: 0.0625rem 0.5rem; border-radius: 999px; background: transparent; border: 1px solid var(--ww-line); color: var(--ww-muted); flex: none; }
.sl-badge.ww-stufe.stufe-einstieg { color: var(--ww-stufe-einstieg); border-color: var(--ww-stufe-einstieg); }
.sl-badge.ww-stufe.stufe-azubi { color: var(--ww-stufe-azubi); border-color: var(--ww-stufe-azubi); }
.sl-badge.ww-stufe.stufe-profi { color: var(--ww-stufe-profi); border-color: var(--ww-stufe-profi); }
.sidebar-content .mobile-preferences { padding-inline: 1.5rem; }

/* Suche (Starlight/Pagefind) rechts oben, 230 px, Strg K */
site-search > button { border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); background: var(--ww-surface); color: var(--ww-muted); height: 2rem; font-size: 0.8125rem; padding-inline: 0.625rem; gap: 0.5rem; }
site-search > button:hover { border-color: var(--ww-accent); color: var(--ww-text); }
site-search > button > kbd { background: transparent; border: 1px solid var(--ww-line); border-radius: 3px; padding: 0 0.25rem; font-size: 0.6875rem; color: var(--ww-muted); }
@media (min-width: 50rem) { site-search > button { width: 14.375rem; justify-content: space-between; } }
site-search dialog { background: var(--ww-surface); border: 1px solid var(--ww-line); box-shadow: none; }

/* Sprachwahl als Chip */
starlight-lang-select label { border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); height: 2rem; padding-inline: 0.5rem; background: var(--ww-surface); color: var(--ww-text); font-size: 0.8125rem; }
starlight-lang-select label:hover { border-color: var(--ww-accent); }

/* Stufen-Chip: Text je gewählter Stufe (CSS, kein JS) */
.ww-chip-text { display: none; }
:root:not([data-stufe]) .ww-chip-text[data-s='einstieg'], :root[data-stufe='einstieg'] .ww-chip-text[data-s='einstieg'], :root[data-stufe='azubi'] .ww-chip-text[data-s='azubi'], :root[data-stufe='profi'] .ww-chip-text[data-s='profi'] { display: inline; }
:root:not([data-stufe]) .ww-stufe-chip, :root[data-stufe='einstieg'] .ww-stufe-chip { --ww-stufe-farbe: var(--ww-stufe-einstieg); }
:root[data-stufe='azubi'] .ww-stufe-chip { --ww-stufe-farbe: var(--ww-stufe-azubi); }
:root[data-stufe='profi'] .ww-stufe-chip { --ww-stufe-farbe: var(--ww-stufe-profi); }

/* Entdecken: Banner und Empfohlen-Block je gewählter Stufe */
.entdecken [data-fuer] { display: none; }
:root:not([data-stufe]) .entdecken [data-fuer='einstieg'], :root[data-stufe='einstieg'] .entdecken [data-fuer='einstieg'], :root[data-stufe='azubi'] .entdecken [data-fuer='azubi'], :root[data-stufe='profi'] .entdecken [data-fuer='profi'] { display: block; }
:root:not([data-stufe]) .entdecken .banner[data-fuer='einstieg'], :root[data-stufe='einstieg'] .entdecken .banner[data-fuer='einstieg'], :root[data-stufe='azubi'] .entdecken .banner[data-fuer='azubi'], :root[data-stufe='profi'] .entdecken .banner[data-fuer='profi'] { display: flex; }

/* Startseite: zentrierter Block */
[data-has-hero] main { min-height: calc(100vh - var(--sl-nav-height)); }
[data-has-hero] .sl-container { max-width: 45rem; }

/* Fokus, Bewegung, Druck */
:focus-visible { outline: 2px solid var(--ww-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
@media print { body { background: #fff; color: #000; } }

/* ÜBERGANG – Aliase für noch nicht umgestellte Komponenten; wird in TP1 Task 11 gelöscht */
:root { --ww-amber: var(--ww-accent); --ww-amber-hell: var(--ww-accent); --ww-orange: var(--ww-sicherheit); --ww-cyan: var(--ww-accent); --ww-grad: var(--ww-accent); --ww-grad-diag: var(--ww-accent); --ww-grid-line: transparent; --ww-begriff: var(--ww-accent); --ww-begriff-bg: transparent; --ww-font-heading: inherit; --ww-grid: 1.5rem; }
```

- [ ] **Step 4: Build + test**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -3 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `FAIL` yalnız eski Startseite/Kanal testlerinde OLMAMALI — bu aşamada eski bileşenler hâlâ duruyor; beklenen FAIL sayısı 0, çünkü aliaslar sayesinde HTML değişmedi. `Hepsi geçti (88)`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/styles/wattwas.css astro.config.mjs package.json package-lock.json scripts/check-site.mjs && git commit -q -m "style(d1): Design-System D1 – Tokens (Graphit, Elektro-Blau, Stufenfarben), Starlight-Mapping, nur Inter; Übergangs-Aliase bis zum Umbau der Komponenten

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---
### Task 3: UI-Strings (9 Locale) — Stufen, Tabs, Startseite, Geselle, Entdecken, Lernen

**Files:**
- Create: `scratch/ui-neu.mjs` (tek seferlik birleştirme scripti)
- Modify: `src/data/startseite-ui.json` (9 locale), `src/components/Stufe.astro:12`, `src/components/Themen.astro:18`, `src/components/Mitglied.astro:50`, `src/components/MarkdownContent.astro:11`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Produces (her locale `t = ui[locale]`): `t.stufen.{einstieg,azubi,profi}`, `t.stufenKurz.{…}`, `t.stufenWahl.{frage,hinweis,leiste,schliessen,chip,aktuell}`, `t.stufenHinweis.{seite,dafuer}` (`{stufe}` yer tutucu), `t.stufeLegende`, `t.tabs.{entdecken,lernen,werkzeug,marken,glossar,blog,menue}`, `t.theme.{dunkel,hell}`, `t.start.{claim,entdecken}`, `t.geselle.{name,standard,grundlagen,egt,werkzeug,blog,entdecken}`, `t.entdecken.{titel,bannerTitel{3},bannerText{3},bannerButton,empfohlen,empfohlenText{3},themen,themenText,werkzeug,werkzeugText,werkzeugKarten{guide,grundausstattung,woerterbuch,marken}→{titel,text},markenNeu,alle,ergebnisse,keine,seiten,filter,filterGruppen{fuerDich,stufe,themen,werkzeug},empfohlenKurz,zuletzt,zuruecksetzen}`, `t.bereiche.{grundlagen,sicherheit,beruf,anleitungen,werkzeug,blog}`, `t.lernen.{titel,text,karten[4]{id,titel,text,href}}`, `t.kanaeleBald`, `t.mitglied.bald` (kanal cümlesi yok). Eski `t.stufe` bloğu **silinir**. Mevcut `t.lesezeit` ("Min."), `t.quiz`, `t.lernfeld`, `t.sprachenLabel` yeniden kullanılır.

- [ ] **Step 1: Testleri ekle**

`checks` sonuna:

```js
  // TP1 · Task 3: UI-Strings
  ['UI-Strings: alle 9 Locales haben dieselben Schlüssel wie de', () => { const soll = uiPfade(uiJson.de).sort().join('|'); return ['leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => uiPfade(uiJson[l]).sort().join('|') === soll); }],
  ['UI-Strings: stufen = einstieg/azubi/profi (Start/Azubi/Profi), kein Block „stufe“, keine Kanal-Sätze bei mitglied.bald', () => Object.values(uiJson).every((t) => Object.keys(t.stufen).join() === 'einstieg,azubi,profi' && !t.stufe && !/YouTube|Kanal|channel|kanal|канал|قنوات|کانال|არხ/i.test(t.mitglied.bald)) && uiJson.de.stufen.einstieg === 'Start' && uiJson.de.tabs.entdecken === 'Entdecken'],
```

ve `const OHNE_STUFE = […]` satırından sonra:

```js
const uiJson = JSON.parse(readFileSync(join(src, 'data/startseite-ui.json'), 'utf8'));
const uiPfade = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? uiPfade(v, `${p}${k}.`) : [`${p}${k}`]);
```

- [ ] **Step 2: Testi çalıştır → ikinci test FAIL (henüz `stufen` yok)**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep "UI-Strings"
```

- [ ] **Step 3: `scratch/ui-neu.mjs` yaz (Write) ve çalıştır**

```js
// Einmalig (TP1 Task 3): neue UI-Blöcke in alle 9 Locales von startseite-ui.json mischen. Aufruf: node scratch/ui-neu.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const F = 'src/data/startseite-ui.json';
const ui = JSON.parse(readFileSync(F, 'utf8'));
const S = ['einstieg', 'azubi', 'profi'];
const KARTEN = [['grundlagen', 'grundlagen/'], ['sicherheit', 'grundlagen/sicherheitsregeln/'], ['beruf', 'themen/energie-und-gebaeudetechnik/'], ['anleitungen', 'themen/energie-und-gebaeudetechnik/']];
const WK = ['guide', 'grundausstattung', 'woerterbuch', 'marken'];
const obj = (arr) => Object.fromEntries(S.map((s, i) => [s, arr[i]]));
// Kompakte Form je Locale: [stufen, stufenKurz, stufenWahl(6), stufenHinweis(2), stufeLegende, tabs(7), theme(2), start(2), geselle(7),
//   entdecken: [titel, bannerTitel(3), bannerText(3), bannerButton, empfohlen, empfohlenText(3), themen, themenText, werkzeug, werkzeugText,
//   werkzeugKarten(4×[titel,text]), markenNeu, alle, ergebnisse, keine, seiten, filter, filterGruppen(4), empfohlenKurz, zuletzt, zuruecksetzen],
//   bereiche(6), lernen: [titel, text, karten(4×[titel,text])], kanaeleBald, mitgliedBald]
const D = {
  de: [['Start', 'Azubi', 'Profi'], ['Ich interessiere mich für den Beruf oder fange gerade an.', 'Ich bin in der Ausbildung, 1. bis 3. Lehrjahr.', 'Geselle, Meistervorbereitung oder Praxis auf der Baustelle.'],
    ['Hallo, ich bin Watt, Geselle. Wo stehst du?', 'Du kannst das jederzeit oben rechts ändern. Nichts wird versteckt, nur sortiert.', 'Wo stehst du? Wähle deine Stufe. Nichts wird versteckt, nur sortiert.', 'Hinweis ausblenden', 'Stufe wählen', 'Deine Stufe'],
    ['Diese Seite ist für {stufe}.', 'Für {stufe}: Empfehlungen unter Entdecken.'],
    'Jede Seite hat eine Stufe: Start für Neugierige und den Anfang, Azubi für das 1. bis 3. Lehrjahr, Profi für Gesellen, Meistervorbereitung und Praxis.',
    ['Entdecken', 'Lernen', 'Werkzeug', 'Marken & Modelle', 'Glossar', 'Blog', 'Menü'], ['Dunkles Design', 'Helles Design'],
    ['Elektrotechnik, verstehen. In neun Sprachen, Fachbegriffe auf Deutsch.', 'Entdecken'],
    ['Geselle Watt', 'Ich begleite dich durch die Seite. Fachbegriffe bleiben Deutsch.', 'Vier Kapitel von null an. Danach die fünf Sicherheitsregeln.', 'Hausinstallation Schritt für Schritt. Immer unter Aufsicht einer Elektrofachkraft.', 'Was der Betrieb stellen muss und was sich privat lohnt.', 'Kurz, mit Schema, mit Quelle.', 'Heute: mit den Grundlagen anfangen.'],
    ['Entdecken', ['Neu hier? Starte mit den Grundlagen.', 'Mitten in der Ausbildung? Dann Schutzorgane und Unterverteilung.', 'Profi-Inhalte entstehen gerade.'],
      ['Vier Kapitel von null an, danach die fünf Sicherheitsregeln. Der Geselle begleitet dich Schritt für Schritt.', 'Anleitungen mit Schaltplan und Prüfschritten nach DIN VDE 0100-600, dazu der Fehler des Tages.', 'Erstprüfung, Messen und Prüfen, Fehlersuche kommen als Nächstes. Bis dahin: die Azubi-Seiten mit Prüfschritten.'],
      'Starten', 'Empfohlen für {stufe}', ['Die ersten Schritte in der Elektrotechnik, in deiner Sprache. Fachbegriffe bleiben Deutsch.', 'Was in Berufsschule und Betrieb jetzt dran ist.', 'Die anspruchsvollsten Seiten, die es heute gibt.'],
      'Themen', 'Alle Bereiche der Seite, mit Seitenzahl.', 'Werkzeug', 'Guide, Grundausstattung, Wörterbuch, Marken und Modelle.',
      [['Werkzeug-Guide', 'Pflicht, Empfehlung, Nice-to-have – ehrlich sortiert.'], ['Grundausstattung Azubi', 'Was am ersten Tag in die Tasche gehört und was der Betrieb stellt.'], ['Werkzeug-Wörterbuch', 'Deutsche Namen von Werkzeug und Material, übersetzt in deine Sprache.'], ['Marken & Modelle', 'Was auf der Baustelle wirklich benutzt wird. Kein Affiliate, keine Sterne.']],
      'Marken & Modelle · zuletzt aktualisiert', 'Alle ansehen', 'Ergebnisse', 'Nichts gefunden. Wähle eine andere Stufe oder ein anderes Thema.', 'Seiten', 'Filter', ['Für dich', 'Stufe', 'Themen', 'Werkzeug'], 'Empfohlen', 'Zuletzt gelesen', 'Filter zurücksetzen'],
    ['Grundlagen', 'Sicherheit', 'Energie- und Gebäudetechnik', 'Anleitungen', 'Werkzeug', 'Blog'],
    ['Lernen', 'Vier Wege durch die Elektrotechnik. Fang oben an oder spring dorthin, wo du gerade stehst.', [['Grundlagen', 'Strom, Spannung, Widerstand, Netzformen, Schutzorgane. Vier Kapitel, jedes mit Quiz.'], ['Sicherheit', 'Die fünf Sicherheitsregeln nach DIN VDE 0105-100. Jeden Tag, jede Anlage.'], ['Energie- und Gebäudetechnik', 'Berufsbild, Lernfelder, Weiterbildung: der Elektroberuf im Handwerk.'], ['Anleitungen', 'Unterverteilung, Zählerplatz, Wechselschaltung. Schritt für Schritt, mit Schema.']]],
    'Kanäle auf YouTube, TikTok und Instagram sind in Vorbereitung.', 'Die Anmeldung öffnet in Kürze.'],
  leicht: [['Anfang', 'Azubi', 'Profi'], ['Ich will den Beruf kennen-lernen. Oder ich fange gerade an.', 'Ich mache die Ausbildung. Lehr-Jahr 1 bis 3.', 'Ich bin Geselle. Oder ich mache den Meister.'],
    ['Hallo. Ich bin Watt. Ich bin Geselle. Wo stehst du?', 'Du kannst das später ändern. Oben rechts. Nichts wird versteckt.', 'Wo stehst du? Wähle deine Stufe. Nichts wird versteckt.', 'Hinweis schließen', 'Stufe wählen', 'Deine Stufe'],
    ['Diese Seite ist für: {stufe}.', 'Für {stufe}: Schau bei Entdecken.'],
    'Jede Seite hat eine Stufe: Anfang, Azubi oder Profi.',
    ['Entdecken', 'Lernen', 'Werkzeug', 'Marken und Modelle', 'Fach-Wörter', 'Blog', 'Menü'], ['Dunkel', 'Hell'],
    ['Strom verstehen. Ganz einfach. In kurzen Sätzen.', 'Entdecken'],
    ['Geselle Watt', 'Ich helfe dir auf der Seite. Fach-Wörter bleiben Deutsch.', 'Vier Kapitel. Von Anfang an. Danach: die 5 Sicherheits-Regeln.', 'Strom im Haus. Schritt für Schritt. Immer mit einer Fach-Kraft.', 'Was der Betrieb bezahlt. Und was du selbst kaufen kannst.', 'Kurz. Mit Bild. Mit Quelle.', 'Heute: Fang mit den Grundlagen an.'],
    ['Entdecken', ['Neu hier? Fang mit den Grundlagen an.', 'Du bist in der Ausbildung? Dann: Schutz-Organe und Unter-Verteilung.', 'Profi-Seiten kommen bald.'],
      ['Vier Kapitel. Dann die 5 Sicherheits-Regeln. Watt hilft dir.', 'Anleitungen mit Schalt-Plan. Und mit Prüf-Schritten.', 'Bis dahin: die Azubi-Seiten mit Prüf-Schritten.'],
      'Starten', 'Empfohlen für {stufe}', ['Die ersten Schritte. In einfacher Sprache. Fach-Wörter bleiben Deutsch.', 'Das brauchst du jetzt in der Schule und im Betrieb.', 'Die schwersten Seiten, die es heute gibt.'],
      'Themen', 'Alle Bereiche. Mit Anzahl der Seiten.', 'Werkzeug', 'Guide, Grund-Ausstattung, Wörter-Buch, Marken und Modelle.',
      [['Werkzeug-Guide', 'Pflicht. Empfehlung. Extra. Ehrlich sortiert.'], ['Grund-Ausstattung Azubi', 'Was am ersten Tag in die Tasche gehört.'], ['Werkzeug-Wörter-Buch', 'Deutsche Namen für Werkzeug. Übersetzt.'], ['Marken und Modelle', 'Was auf der Baustelle benutzt wird.']],
      'Marken und Modelle: neu', 'Alle zeigen', 'Ergebnisse', 'Nichts gefunden. Wähle eine andere Stufe. Oder ein anderes Thema.', 'Seiten', 'Filter', ['Für dich', 'Stufe', 'Themen', 'Werkzeug'], 'Empfohlen', 'Zuletzt gelesen', 'Filter löschen'],
    ['Grund-Wissen', 'Sicherheit', 'Strom im Haus', 'Anleitungen', 'Werkzeug', 'Blog'],
    ['Lernen', 'Vier Wege. Fang oben an. Oder spring dorthin, wo du stehst.', [['Grund-Wissen', 'Strom, Spannung, Widerstand, Schutz-Organe. Vier Kapitel. Mit Quiz.'], ['Sicherheit', 'Die 5 Sicherheits-Regeln. Jeden Tag.'], ['Strom im Haus', 'Der Beruf. Die Lern-Felder. Die Weiter-Bildung.'], ['Anleitungen', 'Unter-Verteilung, Zähler-Platz, Wechsel-Schaltung. Schritt für Schritt.']]],
    'Die Kanäle auf YouTube, TikTok und Instagram kommen noch.', 'Die Anmeldung kommt bald.'],
  en: [['Start', 'Apprentice', 'Pro'], ["I'm curious about the trade or just getting started.", "I'm in training (Ausbildung), year 1 to 3.", 'Journeyman (Geselle), preparing for the Meister, or working on site.'],
    ["Hi, I'm Watt, journeyman (Geselle). Where are you right now?", 'You can change this any time at the top right. Nothing is hidden, only sorted.', 'Where are you right now? Pick your level. Nothing is hidden, only sorted.', 'Hide this note', 'Choose level', 'Your level'],
    ['This page is for {stufe}.', 'For {stufe}: see recommendations under Explore.'],
    'Every page has a level: Start for the curious and the very beginning, Apprentice for training years 1 to 3, Pro for journeymen, Meister preparation and site practice.',
    ['Explore', 'Learn', 'Tools', 'Brands & models', 'Glossary', 'Blog', 'Menu'], ['Dark theme', 'Light theme'],
    ['Electrical engineering, understood. In nine languages, technical terms in German.', 'Explore'],
    ['Watt, journeyman', "I'll guide you through the site. Technical terms stay German.", 'Four chapters from zero. Then the five safety rules.', 'House wiring step by step. Always supervised by a qualified electrician.', 'What the company has to provide and what is worth buying yourself.', 'Short, with a diagram, with a source.', 'Today: start with the basics.'],
    ['Explore', ['New here? Start with the basics.', 'In the middle of training? Then protective devices and the sub-distribution board.', 'Pro content is in the making.'],
      ['Four chapters from zero, then the five safety rules. Watt walks you through step by step.', 'Guides with wiring diagram and test steps to DIN VDE 0100-600, plus the mistake of the day.', 'Initial verification, measuring and testing, fault finding come next. Until then: the apprentice pages with test steps.'],
      'Start', 'Recommended for {stufe}', ['Your first steps in electrical engineering, in your language. Technical terms stay German.', "What's up now at vocational school and in the company.", 'The most demanding pages available today.'],
      'Topics', 'All areas of the site, with page count.', 'Tools', 'Guide, starter kit, dictionary, brands and models.',
      [['Tool guide', 'Must-have, recommended, nice-to-have – sorted honestly.'], ['Apprentice starter kit', 'What belongs in the bag on day one and what the company provides.'], ['Tool dictionary', 'German names of tools and materials, translated into your language.'], ['Brands & models', 'What is really used on site. No affiliate links, no star ratings.']],
      'Brands & models · recently updated', 'See all', 'Results', 'Nothing found. Pick another level or topic.', 'pages', 'Filter', ['For you', 'Level', 'Topics', 'Tools'], 'Recommended', 'Recently read', 'Reset filter'],
    ['Basics', 'Safety', 'Energy and building technology', 'Guides', 'Tools', 'Blog'],
    ['Learn', 'Four paths through electrical engineering. Start at the top or jump to where you are.', [['Basics', 'Current, voltage, resistance, grid types, protective devices. Four chapters, each with a quiz.'], ['Safety', 'The five safety rules to DIN VDE 0105-100. Every day, every installation.'], ['Energy and building technology', 'Job profile, learning fields, further training: the electrical trade in crafts.'], ['Guides', 'Sub-distribution board, meter board, two-way switch. Step by step, with diagram.']]],
    'Channels on YouTube, TikTok and Instagram are in preparation.', 'Sign-up opens shortly.'],
  tr: [['Başlangıç', 'Azubi', 'Profi'], ['Mesleği merak ediyorum ya da yeni başlıyorum.', "Ausbildung'dayım, 1. ile 3. yıl arası.", "Geselle'yim, Meister'e hazırlanıyorum ya da şantiyede çalışıyorum."],
    ['Merhaba, ben Watt, Geselle. Sen neredesin?', 'Bunu istediğin zaman sağ üstten değiştirebilirsin. Hiçbir şey gizlenmez, yalnız sıralanır.', 'Sen neredesin? Seviyeni seç. Hiçbir şey gizlenmez, yalnız sıralanır.', 'Notu gizle', 'Seviye seç', 'Seviyen'],
    ['Bu sayfa {stufe} için.', "{stufe} için: önerilere Keşfet'ten bak."],
    'Her sayfanın bir seviyesi var: Başlangıç meraklılar ve ilk adım için, Azubi 1.–3. yıl için, Profi Geselle, Meister hazırlığı ve şantiye pratiği için.',
    ['Keşfet', 'Öğren', 'Alet', 'Markalar ve modeller', 'Sözlük', 'Blog', 'Menü'], ['Koyu tema', 'Açık tema'],
    ["Elektrotekniği anla. Dokuz dilde, Fachbegriff'ler Almanca.", 'Keşfet'],
    ['Geselle Watt', "Sitede sana eşlik ederim. Fachbegriff'ler Almanca kalır.", 'Sıfırdan dört bölüm. Sonra beş güvenlik kuralı.', 'Ev tesisatı adım adım. Her zaman bir Elektrofachkraft gözetiminde.', 'İşletmenin vermesi gerekenler ve kendin almaya değenler.', 'Kısa, şemalı, kaynaklı.', 'Bugün: temellerle başla.'],
    ['Keşfet', ['Yeni misin? Temellerle başla.', "Ausbildung'un ortasında mısın? O zaman Schutzorgane ve Unterverteilung.", 'Profi içerikleri hazırlanıyor.'],
      ['Sıfırdan dört bölüm, sonra beş güvenlik kuralı. Watt adım adım eşlik eder.', "Şema ve DIN VDE 0100-600'e göre test adımlarıyla kılavuzlar, artı günün hatası.", 'Erstprüfung, ölçme ve test, arıza arama sırada. O zamana kadar: test adımlı Azubi sayfaları.'],
      'Başla', '{stufe} için öneriler', ["Elektroteknikte ilk adımlar, kendi dilinde. Fachbegriff'ler Almanca kalır.", "Berufsschule'de ve işletmede şu an sırada olanlar.", 'Bugün var olan en zorlu sayfalar.'],
      'Konular', 'Sitenin tüm alanları, sayfa sayısıyla.', 'Alet', 'Rehber, temel donanım, sözlük, markalar ve modeller.',
      [['Alet rehberi', 'Zorunlu, tavsiye, olsa iyi olur – dürüstçe sıralanmış.'], ['Azubi temel donanımı', 'İlk gün çantada ne olmalı, işletme ne verir.'], ['Alet sözlüğü', 'Alet ve malzemenin Almanca adları, kendi diline çevrilmiş.'], ['Markalar ve modeller', 'Şantiyede gerçekten kullanılanlar. Affiliate yok, yıldız yok.']],
      'Markalar ve modeller · son güncellenenler', 'Tümünü gör', 'Sonuçlar', 'Bir şey bulunamadı. Başka bir seviye ya da konu seç.', 'sayfa', 'Filtre', ['Senin için', 'Seviye', 'Konular', 'Alet'], 'Öneriler', 'Son okunanlar', 'Filtreyi sıfırla'],
    ['Temeller', 'Güvenlik', 'Enerji ve bina tekniği', 'Kılavuzlar', 'Alet', 'Blog'],
    ['Öğren', 'Elektroteknikte dört yol. Baştan başla ya da bulunduğun yere atla.', [['Temeller', "Akım, gerilim, direnç, şebeke biçimleri, Schutzorgane. Dört bölüm, her biri quiz'li."], ['Güvenlik', "DIN VDE 0105-100'e göre beş güvenlik kuralı. Her gün, her tesis."], ['Enerji ve bina tekniği', "Meslek profili, Lernfeld'ler, ileri eğitim: zanaatta elektrik mesleği."], ['Kılavuzlar', 'Unterverteilung, Zählerplatz, Wechselschaltung. Adım adım, şemalı.']]],
    'YouTube, TikTok ve Instagram kanalları hazırlanıyor.', 'Kayıt yakında açılıyor.'],
  ru: [['Старт', 'Azubi', 'Profi'], ['Мне интересна профессия, или я только начинаю.', 'Я в обучении (Ausbildung), 1–3 год.', 'Подмастерье (Geselle), подготовка к Meister или практика на объекте.'],
    ['Привет, я Watt, подмастерье (Geselle). Где ты сейчас?', 'Это можно изменить в любой момент справа вверху. Ничего не скрывается, только сортируется.', 'Где ты сейчас? Выбери уровень. Ничего не скрывается, только сортируется.', 'Скрыть подсказку', 'Выбрать уровень', 'Твой уровень'],
    ['Эта страница для уровня {stufe}.', 'Для {stufe}: рекомендации в разделе Обзор.'],
    'У каждой страницы есть уровень: Старт для любопытных и самого начала, Azubi для 1–3 года обучения, Profi для подмастерьев, подготовки к Meister и практики.',
    ['Обзор', 'Учиться', 'Инструмент', 'Марки и модели', 'Глоссарий', 'Блог', 'Меню'], ['Тёмная тема', 'Светлая тема'],
    ['Понять электротехнику. На девяти языках, термины на немецком.', 'Обзор'],
    ['Подмастерье Watt', 'Я проведу тебя по сайту. Термины остаются немецкими.', 'Четыре главы с нуля. Затем пять правил безопасности.', 'Электромонтаж в доме шаг за шагом. Всегда под надзором Elektrofachkraft.', 'Что обязан выдать работодатель и что стоит купить самому.', 'Коротко, со схемой, с источником.', 'Сегодня: начни с основ.'],
    ['Обзор', ['Новичок? Начни с основ.', 'В середине обучения? Тогда Schutzorgane и Unterverteilung.', 'Материалы для Profi готовятся.'],
      ['Четыре главы с нуля, затем пять правил безопасности. Watt проведёт шаг за шагом.', 'Инструкции со схемой и шагами проверки по DIN VDE 0100-600, плюс ошибка дня.', 'Erstprüfung, измерения и проверка, поиск неисправностей – следующие. Пока: страницы Azubi с шагами проверки.'],
      'Начать', 'Рекомендуем для {stufe}', ['Первые шаги в электротехнике на твоём языке. Термины остаются немецкими.', 'Что сейчас проходят в Berufsschule и на предприятии.', 'Самые сложные страницы на сегодня.'],
      'Темы', 'Все разделы сайта с числом страниц.', 'Инструмент', 'Гид, базовый набор, словарь, марки и модели.',
      [['Гид по инструменту', 'Обязательно, рекомендуется, приятно иметь – честно отсортировано.'], ['Базовый набор Azubi', 'Что должно быть в сумке в первый день и что выдаёт предприятие.'], ['Словарь инструмента', 'Немецкие названия инструмента и материалов с переводом на твой язык.'], ['Марки и модели', 'Что действительно используют на объекте. Без партнёрских ссылок, без звёзд.']],
      'Марки и модели · недавно обновлено', 'Показать все', 'Результаты', 'Ничего не найдено. Выбери другой уровень или тему.', 'стр.', 'Фильтр', ['Для тебя', 'Уровень', 'Темы', 'Инструмент'], 'Рекомендуем', 'Недавно прочитано', 'Сбросить фильтр'],
    ['Основы', 'Безопасность', 'Энергетика и техника зданий', 'Инструкции', 'Инструмент', 'Блог'],
    ['Учиться', 'Четыре пути через электротехнику. Начни сверху или перейди туда, где ты сейчас.', [['Основы', 'Ток, напряжение, сопротивление, типы сетей, Schutzorgane. Четыре главы, каждая с тестом.'], ['Безопасность', 'Пять правил безопасности по DIN VDE 0105-100. Каждый день, каждая установка.'], ['Энергетика и техника зданий', 'Профессия, Lernfelder, повышение квалификации: электрик в ремесле.'], ['Инструкции', 'Unterverteilung, Zählerplatz, Wechselschaltung. Шаг за шагом, со схемой.']]],
    'Каналы на YouTube, TikTok и Instagram готовятся.', 'Регистрация скоро откроется.'],
  ar: [['البداية', 'Azubi', 'Profi'], ['أهتم بالمهنة أو بدأت للتو.', 'أنا في التدريب المهني (Ausbildung)، السنة 1 إلى 3.', 'صانع (Geselle)، أحضّر للـ Meister أو أعمل في الموقع.'],
    ['مرحباً، أنا Watt، صانع (Geselle). أين أنت الآن؟', 'يمكنك تغيير ذلك في أي وقت من أعلى الصفحة. لا شيء يُخفى، فقط يُرتَّب.', 'أين أنت الآن؟ اختر مستواك. لا شيء يُخفى، فقط يُرتَّب.', 'إخفاء التنبيه', 'اختيار المستوى', 'مستواك'],
    ['هذه الصفحة لمستوى {stufe}.', 'لمستوى {stufe}: التوصيات في قسم استكشف.'],
    'لكل صفحة مستوى: البداية للفضوليين وللخطوة الأولى، Azubi لسنوات التدريب 1 إلى 3، Profi للصنّاع والتحضير للـ Meister والممارسة في الموقع.',
    ['استكشف', 'تعلّم', 'الأدوات', 'الماركات والموديلات', 'المسرد', 'المدوّنة', 'القائمة'], ['المظهر الداكن', 'المظهر الفاتح'],
    ['افهم الكهروتقنية. بتسع لغات، والمصطلحات بالألمانية.', 'استكشف'],
    ['الصانع Watt', 'أرافقك عبر الموقع. المصطلحات تبقى ألمانية.', 'أربعة فصول من الصفر. ثم قواعد السلامة الخمس.', 'تمديدات المنزل خطوة بخطوة. دائماً تحت إشراف Elektrofachkraft.', 'ما يجب أن توفره الشركة وما يستحق الشراء بنفسك.', 'قصير، مع مخطط، مع مصدر.', 'اليوم: ابدأ بالأساسيات.'],
    ['استكشف', ['جديد هنا؟ ابدأ بالأساسيات.', 'في منتصف التدريب؟ إذاً Schutzorgane وUnterverteilung.', 'محتوى Profi قيد الإعداد.'],
      ['أربعة فصول من الصفر، ثم قواعد السلامة الخمس. Watt يرافقك خطوة بخطوة.', 'إرشادات مع مخطط وخطوات فحص وفق DIN VDE 0100-600، إضافة إلى خطأ اليوم.', 'Erstprüfung والقياس والفحص وتحديد الأعطال هي التالية. حتى ذلك الحين: صفحات Azubi مع خطوات الفحص.'],
      'ابدأ', 'موصى به لمستوى {stufe}', ['الخطوات الأولى في الكهروتقنية بلغتك. المصطلحات تبقى ألمانية.', 'ما يُدرَّس الآن في Berufsschule وفي الشركة.', 'أصعب الصفحات المتاحة اليوم.'],
      'المواضيع', 'كل أقسام الموقع مع عدد الصفحات.', 'الأدوات', 'الدليل، العدة الأساسية، القاموس، الماركات والموديلات.',
      [['دليل الأدوات', 'إلزامي، موصى به، إضافي – مرتّب بصدق.'], ['العدة الأساسية للـ Azubi', 'ما يجب أن يكون في الحقيبة في اليوم الأول وما توفره الشركة.'], ['قاموس الأدوات', 'الأسماء الألمانية للأدوات والمواد مترجمة إلى لغتك.'], ['الماركات والموديلات', 'ما يُستخدم فعلاً في الموقع. بلا روابط تسويقية، بلا نجوم.']],
      'الماركات والموديلات · آخر التحديثات', 'عرض الكل', 'النتائج', 'لا نتائج. اختر مستوى أو موضوعاً آخر.', 'صفحات', 'تصفية', ['لك', 'المستوى', 'المواضيع', 'الأدوات'], 'موصى به', 'قُرئ مؤخراً', 'إعادة ضبط التصفية'],
    ['الأساسيات', 'السلامة', 'تقنيات الطاقة والمباني', 'الإرشادات', 'الأدوات', 'المدوّنة'],
    ['تعلّم', 'أربعة مسارات عبر الكهروتقنية. ابدأ من الأعلى أو انتقل إلى حيث أنت.', [['الأساسيات', 'التيار والجهد والمقاومة وأنواع الشبكات وSchutzorgane. أربعة فصول، كل منها مع اختبار.'], ['السلامة', 'قواعد السلامة الخمس وفق DIN VDE 0105-100. كل يوم، كل منشأة.'], ['تقنيات الطاقة والمباني', 'ملف المهنة، Lernfelder، التأهيل المستمر: مهنة الكهرباء في الحرف.'], ['الإرشادات', 'Unterverteilung وZählerplatz وWechselschaltung. خطوة بخطوة، مع مخطط.']]],
    'قنوات YouTube وTikTok وInstagram قيد الإعداد.', 'التسجيل يفتح قريباً.'],
  fa: [['شروع', 'Azubi', 'Profi'], ['به این حرفه علاقه دارم یا تازه شروع کرده‌ام.', 'در کارآموزی (Ausbildung) هستم، سال ۱ تا ۳.', 'کارگر ماهر (Geselle) هستم، برای Meister آماده می‌شوم یا در کارگاه کار می‌کنم.'],
    ['سلام، من Watt هستم، کارگر ماهر (Geselle). الان کجا هستی؟', 'هر وقت بخواهی می‌توانی این را در بالای صفحه تغییر دهی. چیزی پنهان نمی‌شود، فقط مرتب می‌شود.', 'الان کجا هستی؟ سطح خودت را انتخاب کن. چیزی پنهان نمی‌شود، فقط مرتب می‌شود.', 'پنهان کردن یادداشت', 'انتخاب سطح', 'سطح تو'],
    ['این صفحه برای سطح {stufe} است.', 'برای {stufe}: پیشنهادها در بخش کاوش.'],
    'هر صفحه یک سطح دارد: شروع برای کنجکاوها و اولین قدم، Azubi برای سال ۱ تا ۳ کارآموزی، Profi برای کارگران ماهر، آمادگی Meister و کار عملی.',
    ['کاوش', 'یادگیری', 'ابزار', 'برندها و مدل‌ها', 'واژه‌نامه', 'وبلاگ', 'منو'], ['پوستهٔ تیره', 'پوستهٔ روشن'],
    ['برق را بفهم. به نه زبان، اصطلاحات به آلمانی.', 'کاوش'],
    ['Watt، کارگر ماهر', 'من تو را در سایت همراهی می‌کنم. اصطلاحات آلمانی می‌مانند.', 'چهار فصل از صفر. بعد پنج قانون ایمنی.', 'سیم‌کشی خانه قدم به قدم. همیشه زیر نظر Elektrofachkraft.', 'چیزی که شرکت باید بدهد و چیزی که خریدنش می‌ارزد.', 'کوتاه، با نقشه، با منبع.', 'امروز: با مبانی شروع کن.'],
    ['کاوش', ['تازه‌واردی؟ با مبانی شروع کن.', 'وسط کارآموزی هستی؟ پس Schutzorgane و Unterverteilung.', 'محتوای Profi در حال آماده‌سازی است.'],
      ['چهار فصل از صفر، بعد پنج قانون ایمنی. Watt قدم به قدم همراهت است.', 'راهنماها با نقشهٔ مدار و مراحل آزمون طبق DIN VDE 0100-600، به‌علاوهٔ خطای روز.', 'Erstprüfung، اندازه‌گیری و آزمون، عیب‌یابی در نوبت بعدی‌اند. تا آن زمان: صفحه‌های Azubi با مراحل آزمون.'],
      'شروع', 'پیشنهاد برای {stufe}', ['اولین قدم‌ها در برق، به زبان خودت. اصطلاحات آلمانی می‌مانند.', 'چیزی که الان در Berufsschule و شرکت مطرح است.', 'سخت‌ترین صفحه‌هایی که امروز وجود دارند.'],
      'موضوع‌ها', 'همهٔ بخش‌های سایت با تعداد صفحه‌ها.', 'ابزار', 'راهنما، تجهیزات پایه، واژه‌نامه، برندها و مدل‌ها.',
      [['راهنمای ابزار', 'الزامی، پیشنهادی، اختیاری – صادقانه مرتب‌شده.'], ['تجهیزات پایهٔ Azubi', 'روز اول چه چیزی باید در کیف باشد و شرکت چه چیزی می‌دهد.'], ['واژه‌نامهٔ ابزار', 'نام‌های آلمانی ابزار و مواد، ترجمه‌شده به زبان تو.'], ['برندها و مدل‌ها', 'چیزی که واقعاً در کارگاه استفاده می‌شود. بدون لینک همکاری، بدون ستاره.']],
      'برندها و مدل‌ها · به‌روزشده‌های اخیر', 'نمایش همه', 'نتایج', 'چیزی پیدا نشد. سطح یا موضوع دیگری انتخاب کن.', 'صفحه', 'فیلتر', ['برای تو', 'سطح', 'موضوع‌ها', 'ابزار'], 'پیشنهادی', 'اخیراً خوانده‌شده', 'بازنشانی فیلتر'],
    ['مبانی', 'ایمنی', 'فناوری انرژی و ساختمان', 'راهنماها', 'ابزار', 'وبلاگ'],
    ['یادگیری', 'چهار مسیر در برق. از بالا شروع کن یا به جایی برو که الان هستی.', [['مبانی', 'جریان، ولتاژ، مقاومت، انواع شبکه، Schutzorgane. چهار فصل، هر کدام با آزمون.'], ['ایمنی', 'پنج قانون ایمنی طبق DIN VDE 0105-100. هر روز، هر تأسیسات.'], ['فناوری انرژی و ساختمان', 'شرح شغل، Lernfelder، آموزش تکمیلی: حرفهٔ برق در صنایع دستی.'], ['راهنماها', 'Unterverteilung، Zählerplatz، Wechselschaltung. قدم به قدم، با نقشه.']]],
    'کانال‌های YouTube، TikTok و Instagram در حال آماده‌سازی‌اند.', 'ثبت‌نام به‌زودی باز می‌شود.'],
  ka: [['დასაწყისი', 'Azubi', 'Profi'], ['პროფესია მაინტერესებს ან ახლა ვიწყებ.', 'პროფესიულ სწავლებაში (Ausbildung) ვარ, 1-დან 3 წლამდე.', 'ოსტატის თანაშემწე (Geselle) ვარ, Meister-ისთვის ვემზადები ან ობიექტზე ვმუშაობ.'],
    ['გამარჯობა, მე Watt ვარ, ოსტატის თანაშემწე (Geselle). სად ხარ ახლა?', 'ამის შეცვლა ნებისმიერ დროს შეგიძლია ზემოთ მარჯვნივ. არაფერი იმალება, მხოლოდ ლაგდება.', 'სად ხარ ახლა? აირჩიე შენი დონე. არაფერი იმალება, მხოლოდ ლაგდება.', 'შენიშვნის დამალვა', 'დონის არჩევა', 'შენი დონე'],
    ['ეს გვერდი {stufe} დონისთვისაა.', '{stufe} დონისთვის: რეკომენდაციები განყოფილებაში აღმოაჩინე.'],
    'ყველა გვერდს აქვს დონე: დასაწყისი ცნობისმოყვარეებისა და პირველი ნაბიჯისთვის, Azubi სწავლების 1–3 წლისთვის, Profi ოსტატის თანაშემწეებისთვის, Meister-ისთვის მომზადებისა და პრაქტიკისთვის.',
    ['აღმოაჩინე', 'ისწავლე', 'ხელსაწყო', 'ბრენდები და მოდელები', 'ლექსიკონი', 'ბლოგი', 'მენიუ'], ['მუქი თემა', 'ღია თემა'],
    ['გაიგე ელექტროტექნიკა. ცხრა ენაზე, ტერმინები გერმანულად.', 'აღმოაჩინე'],
    ['თანაშემწე Watt', 'საიტზე გაგიძღვები. ტერმინები გერმანული რჩება.', 'ოთხი თავი ნულიდან. შემდეგ უსაფრთხოების ხუთი წესი.', 'სახლის ელგაყვანილობა ნაბიჯ-ნაბიჯ. ყოველთვის Elektrofachkraft-ის ზედამხედველობით.', 'რა უნდა მოგცეს საწარმომ და რისი ყიდვა ღირს თავად.', 'მოკლედ, სქემით, წყაროთი.', 'დღეს: დაიწყე საფუძვლებით.'],
    ['აღმოაჩინე', ['ახალი ხარ? დაიწყე საფუძვლებით.', 'სწავლების შუაში ხარ? მაშინ Schutzorgane და Unterverteilung.', 'Profi მასალები მზადდება.'],
      ['ოთხი თავი ნულიდან, შემდეგ უსაფრთხოების ხუთი წესი. Watt ნაბიჯ-ნაბიჯ გაგიძღვება.', 'ინსტრუქციები სქემით და შემოწმების ნაბიჯებით DIN VDE 0100-600-ის მიხედვით, პლუს დღის შეცდომა.', 'Erstprüfung, გაზომვა და შემოწმება, ხარვეზის ძიება შემდეგია. მანამდე: Azubi გვერდები შემოწმების ნაბიჯებით.'],
      'დაწყება', 'რეკომენდებულია {stufe} დონისთვის', ['პირველი ნაბიჯები ელექტროტექნიკაში, შენს ენაზე. ტერმინები გერმანული რჩება.', 'რაც ახლა Berufsschule-სა და საწარმოშია.', 'დღეს არსებული ყველაზე რთული გვერდები.'],
      'თემები', 'საიტის ყველა განყოფილება გვერდების რაოდენობით.', 'ხელსაწყო', 'გზამკვლევი, საბაზისო აღჭურვილობა, ლექსიკონი, ბრენდები და მოდელები.',
      [['ხელსაწყოების გზამკვლევი', 'სავალდებულო, რეკომენდებული, სასურველი – გულწრფელად დალაგებული.'], ['Azubi საბაზისო აღჭურვილობა', 'რა უნდა იყოს ჩანთაში პირველ დღეს და რას იძლევა საწარმო.'], ['ხელსაწყოების ლექსიკონი', 'ხელსაწყოებისა და მასალების გერმანული სახელები შენს ენაზე თარგმნილი.'], ['ბრენდები და მოდელები', 'რას იყენებენ სინამდვილეში ობიექტზე. პარტნიორული ბმულებისა და ვარსკვლავების გარეშე.']],
      'ბრენდები და მოდელები · ბოლოს განახლებული', 'ყველას ნახვა', 'შედეგები', 'ვერაფერი მოიძებნა. აირჩიე სხვა დონე ან თემა.', 'გვერდი', 'ფილტრი', ['შენთვის', 'დონე', 'თემები', 'ხელსაწყო'], 'რეკომენდებული', 'ბოლოს წაკითხული', 'ფილტრის გასუფთავება'],
    ['საფუძვლები', 'უსაფრთხოება', 'ენერგეტიკა და შენობის ტექნიკა', 'ინსტრუქციები', 'ხელსაწყო', 'ბლოგი'],
    ['ისწავლე', 'ოთხი გზა ელექტროტექნიკაში. დაიწყე ზემოდან ან გადადი იქ, სადაც ახლა ხარ.', [['საფუძვლები', 'დენი, ძაბვა, წინაღობა, ქსელის ტიპები, Schutzorgane. ოთხი თავი, თითოეული ქვიზით.'], ['უსაფრთხოება', 'უსაფრთხოების ხუთი წესი DIN VDE 0105-100-ის მიხედვით. ყოველდღე, ყველა დანადგარზე.'], ['ენერგეტიკა და შენობის ტექნიკა', 'პროფესიის აღწერა, Lernfelder, კვალიფიკაციის ამაღლება: ელექტრიკოსის პროფესია ხელობაში.'], ['ინსტრუქციები', 'Unterverteilung, Zählerplatz, Wechselschaltung. ნაბიჯ-ნაბიჯ, სქემით.']]],
    'YouTube-ის, TikTok-ისა და Instagram-ის არხები მზადდება.', 'რეგისტრაცია მალე გაიხსნება.'],
  sq: [['Fillim', 'Azubi', 'Profi'], ['Më intereson profesioni ose sapo kam filluar.', 'Jam në formim profesional (Ausbildung), viti 1 deri 3.', 'Kalfë (Geselle), përgatitje për Meister ose praktikë në kantier.'],
    ['Përshëndetje, unë jam Watt, kalfë (Geselle). Ku je tani?', 'Mund ta ndryshosh në çdo kohë lart djathtas. Asgjë nuk fshihet, vetëm renditet.', 'Ku je tani? Zgjidh nivelin tënd. Asgjë nuk fshihet, vetëm renditet.', 'Fshih shënimin', 'Zgjidh nivelin', 'Niveli yt'],
    ['Kjo faqe është për {stufe}.', 'Për {stufe}: rekomandimet te Zbulo.'],
    'Çdo faqe ka një nivel: Fillim për kureshtarët dhe hapin e parë, Azubi për vitin 1 deri 3 të formimit, Profi për kalfët, përgatitjen për Meister dhe praktikën.',
    ['Zbulo', 'Mëso', 'Vegla', 'Marka dhe modele', 'Fjalorth', 'Blog', 'Menyja'], ['Tema e errët', 'Tema e çelët'],
    ['Kupto elektroteknikën. Në nëntë gjuhë, termat në gjermanisht.', 'Zbulo'],
    ['Kalfa Watt', 'Të shoqëroj nëpër faqe. Termat mbeten gjermanisht.', 'Katër kapituj nga zero. Pastaj pesë rregullat e sigurisë.', 'Instalimi i shtëpisë hap pas hapi. Gjithmonë nën mbikëqyrjen e një Elektrofachkraft.', 'Çfarë duhet të japë firma dhe çfarë ia vlen ta blesh vetë.', 'Shkurt, me skemë, me burim.', 'Sot: fillo me bazat.'],
    ['Zbulo', ['I ri këtu? Fillo me bazat.', 'Në mes të formimit? Atëherë Schutzorgane dhe Unterverteilung.', 'Përmbajtja për Profi është duke u përgatitur.'],
      ['Katër kapituj nga zero, pastaj pesë rregullat e sigurisë. Watt të shoqëron hap pas hapi.', 'Udhëzues me skemë dhe hapa kontrolli sipas DIN VDE 0100-600, plus gabimi i ditës.', 'Erstprüfung, matja dhe kontrolli, kërkimi i defekteve vijnë më pas. Deri atëherë: faqet Azubi me hapa kontrolli.'],
      'Fillo', 'Rekomanduar për {stufe}', ['Hapat e parë në elektroteknikë, në gjuhën tënde. Termat mbeten gjermanisht.', 'Çfarë është në radhë tani në Berufsschule dhe në firmë.', 'Faqet më kërkuese që ekzistojnë sot.'],
      'Temat', 'Të gjitha fushat e faqes, me numrin e faqeve.', 'Vegla', 'Udhëzuesi, pajisja bazë, fjalori, markat dhe modelet.',
      [['Udhëzuesi i veglave', 'Detyrim, rekomandim, mirë-të-kesh – renditur me ndershmëri.'], ['Pajisja bazë për Azubi', 'Çfarë duhet në çantë ditën e parë dhe çfarë jep firma.'], ['Fjalori i veglave', 'Emrat gjermanë të veglave dhe materialeve, të përkthyer në gjuhën tënde.'], ['Marka dhe modele', 'Çfarë përdoret vërtet në kantier. Pa lidhje partnere, pa yje.']],
      'Marka dhe modele · përditësuar së fundmi', 'Shiko të gjitha', 'Rezultatet', 'Asgjë nuk u gjet. Zgjidh një nivel ose temë tjetër.', 'faqe', 'Filtri', ['Për ty', 'Niveli', 'Temat', 'Vegla'], 'Rekomanduar', 'Lexuar së fundmi', 'Rivendos filtrin'],
    ['Bazat', 'Siguria', 'Energjia dhe teknika e ndërtesave', 'Udhëzuesit', 'Vegla', 'Blog'],
    ['Mëso', 'Katër rrugë nëpër elektroteknikë. Fillo nga lart ose kërce atje ku je tani.', [['Bazat', 'Rryma, tensioni, rezistenca, llojet e rrjetit, Schutzorgane. Katër kapituj, secili me kuiz.'], ['Siguria', 'Pesë rregullat e sigurisë sipas DIN VDE 0105-100. Çdo ditë, çdo instalim.'], ['Energjia dhe teknika e ndërtesave', 'Profili i profesionit, Lernfelder, kualifikimi i mëtejshëm: profesioni elektrik në zejtari.'], ['Udhëzuesit', 'Unterverteilung, Zählerplatz, Wechselschaltung. Hap pas hapi, me skemë.']]],
    'Kanalet në YouTube, TikTok dhe Instagram janë në përgatitje.', 'Regjistrimi hapet së shpejti.'],
};
for (const [l, d] of Object.entries(D)) {
  const t = ui[l];
  const [stufen, kurz, wahl, hinweis, legende, tabs, theme, start, geselle, e, bereiche, lernen, kanaeleBald, mitgliedBald] = d;
  t.stufen = obj(stufen);
  t.stufenKurz = obj(kurz);
  t.stufenWahl = { frage: wahl[0], hinweis: wahl[1], leiste: wahl[2], schliessen: wahl[3], chip: wahl[4], aktuell: wahl[5] };
  t.stufenHinweis = { seite: hinweis[0], dafuer: hinweis[1] };
  t.stufeLegende = legende;
  t.tabs = { entdecken: tabs[0], lernen: tabs[1], werkzeug: tabs[2], marken: tabs[3], glossar: tabs[4], blog: tabs[5], menue: tabs[6] };
  t.theme = { dunkel: theme[0], hell: theme[1] };
  t.start = { claim: start[0], entdecken: start[1] };
  t.geselle = { name: geselle[0], standard: geselle[1], grundlagen: geselle[2], egt: geselle[3], werkzeug: geselle[4], blog: geselle[5], entdecken: geselle[6] };
  t.entdecken = { titel: e[0], bannerTitel: obj(e[1]), bannerText: obj(e[2]), bannerButton: e[3], empfohlen: e[4], empfohlenText: obj(e[5]), themen: e[6], themenText: e[7], werkzeug: e[8], werkzeugText: e[9],
    werkzeugKarten: Object.fromEntries(WK.map((k, i) => [k, { titel: e[10][i][0], text: e[10][i][1] }])), markenNeu: e[11], alle: e[12], ergebnisse: e[13], keine: e[14], seiten: e[15], filter: e[16],
    filterGruppen: { fuerDich: e[17][0], stufe: e[17][1], themen: e[17][2], werkzeug: e[17][3] }, empfohlenKurz: e[18], zuletzt: e[19], zuruecksetzen: e[20] };
  t.bereiche = { grundlagen: bereiche[0], sicherheit: bereiche[1], beruf: bereiche[2], anleitungen: bereiche[3], werkzeug: bereiche[4], blog: bereiche[5] };
  t.lernen = { titel: lernen[0], text: lernen[1], karten: KARTEN.map(([id, href], i) => ({ id, titel: lernen[2][i][0], text: lernen[2][i][1], href })) };
  t.kanaeleBald = kanaeleBald;
  t.mitglied.bald = mitgliedBald;
  delete t.stufe;
}
writeFileSync(F, JSON.stringify(ui, null, 2) + '\n');
console.log('ok', Object.keys(D).length, 'Locales');
```

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scratch/ui-neu.mjs && node scripts/check-site.mjs | grep "UI-Strings"
```
Beklenen: `ok 9 Locales`, 2 × OK.

- [ ] **Step 4: Eski `t.stufe` kullanan bileşenleri yeni anahtara geçir (build kırılmasın)**

- `src/components/Stufe.astro:12`: `{(t.stufe as Record<string, string>)[stufe]}` → `{(t.stufen as Record<string, string>)[stufe]}`; satır 4 ve satır 5'teki tipleri `'einstieg' | 'azubi' | 'profi'` yap; satır 20–22 CSS'i şununla değiştir: `.stufe-einstieg { --stufe-farbe: var(--ww-stufe-einstieg); } .stufe-azubi { --stufe-farbe: var(--ww-stufe-azubi); } .stufe-profi { --stufe-farbe: var(--ww-stufe-profi); }` (Task 6'da tamamen yeniden yazılacak).
- `src/components/Themen.astro:18`: `(['einstieg', 'geselle', 'meister'] as const)` → `(['einstieg', 'azubi', 'profi'] as const)` ve `t.stufe` → `t.stufen`; satır 49–51: `.stufe-einstieg { --stufe-farbe: var(--ww-stufe-einstieg); } .stufe-azubi { --stufe-farbe: var(--ww-stufe-azubi); } .stufe-profi { --stufe-farbe: var(--ww-stufe-profi); }`.
- `src/components/Mitglied.astro:50`: aynı dizi + `t.stufen`.
- `src/components/MarkdownContent.astro:11`: `stufe?: 'einstieg' | 'azubi' | 'profi';`

```bash
cd /c/Users/kadir/Projects/Elektrolehre && grep -rn "geselle'\|meister'\|t\.stufe\b" src/components && echo "REST GEFUNDEN" || echo "sauber"
```
Beklenen: `sauber`.

- [ ] **Step 5: Build + test, commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (90)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/data/startseite-ui.json src/components scripts/check-site.mjs && git commit -q -m "i18n(ui): Stufen Start/Azubi/Profi, Tabs, Startseite, Geselle Watt, Entdecken, Lernen – 9 Sprachen; Block „stufe“ (geselle/meister) entfernt, Schlüssel-Parität getestet

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 4: Header D1 — Wortmarke, Tabs, Suche rechts, Stufen-Chip, Theme-Icon, Sprach-Chip

**Files:**
- Create: `src/data/tabs.json`, `src/scripts/stufe.ts`, `src/components/GeselleKopf.astro`, `src/components/StufenChip.astro`, `src/components/SiteTitle.astro`, `src/components/Header.astro`
- Rewrite: `src/components/ThemeProvider.astro`, `src/components/ThemeSelect.astro`
- Modify: `astro.config.mjs:95-102` (components)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `t.tabs`, `t.stufen`, `t.stufenKurz`, `t.stufenWahl`, `t.theme` (Task 3); CSS `.ww-chip`, `.ww-stufe-chip`, `.ww-chip-text` (Task 2).
- Produces: `<html data-theme="dark|light" data-stufe="einstieg|azubi|profi" [data-stufe-gewaehlt] [data-stufe-hinweis="aus"]>` head'de inline set edilir; `setzeStufe(stufe: string): void` ve `hinweisAus(): void` (`src/scripts/stufe.ts`), `document` üzerinde `ww-stufe` CustomEvent (detail = stufe); `tabs.json` `{ id, pfad, aktuell: string[], aktiv }[]`; `<GeselleKopf size={n} class? />`.

- [ ] **Step 1: Testleri ekle**

```js
  // TP1 · Task 4: Header
  ['Header: 5 Tabs (Entdecken, Lernen, Werkzeug, Glossar, Blog), kein Marken-Tab vor TP2', () => { const h = read(`de/${ARTIKEL}`); return (h.match(/class="ww-tab"/g) || []).length === 5 && ['/de/entdecken/', '/de/lernen/', '/de/elektrowerkzeuge/', '/de/glossar/', '/de/blog/'].every((p) => new RegExp(`class="ww-tab"[^>]*href="${p}"`).test(h)) && !h.includes('/de/elektrowerkzeuge/marken/'); }],
  ['Header: aktiver Tab „Lernen“ auf Grundlagen-Seite, „Werkzeug“ auf Werkzeug-Seite (aria-current)', () => /<a[^>]*class="ww-tab"[^>]*href="\/de\/lernen\/"[^>]*aria-current="page"/.test(read('de/grundlagen/schutzorgane')) && /<a[^>]*class="ww-tab"[^>]*href="\/de\/elektrowerkzeuge\/"[^>]*aria-current="page"/.test(read('de/elektrowerkzeuge'))],
  ['Header: Suche mit Strg K (de) / Ctrl K (tr), Stufen-Chip mit 3 Optionen, Theme-Icon, Sprachwahl', () => read(`de/${ARTIKEL}`).includes('<site-search') && read(`de/${ARTIKEL}`).includes('<kbd>Strg</kbd>') && read(`tr/${ARTIKEL}`).includes('<kbd>Ctrl</kbd>') && (read(`de/${ARTIKEL}`).match(/class="ww-stufe-option ist-/g) || []).length === 3 && read(`de/${ARTIKEL}`).includes('class="ww-theme-knopf"') && read(`de/${ARTIKEL}`).includes('<starlight-lang-select')],
  ['Header: Wortmarke watt<b>was</b>, keine Social-Icons', () => /class="ww-marke"[^>]*>watt<b[^>]*>was<\/b>/.test(read('de')) && !read('de').includes('social-icons')],
  ['Theme + Stufe vor dem Rendern: Inline-Script setzt data-theme (dunkel Standard) und data-stufe aus localStorage', () => /dataset\.theme = gespeichert === 'light' \? 'light' : 'dark'/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes("lies('ww-stufe')")],
```

- [ ] **Step 2: Test → FAIL (Header henüz yok)**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*(Header|Theme \+)"
```

- [ ] **Step 3: Veri + script dosyaları**

`src/data/tabs.json`:
```json
{
  "_hinweis": "Top-Tabs (Spec §3.1, Reihenfolge fix). aktiv: false → Tab wird nicht gerendert, bis die Zielseite existiert (TP2 setzt marken auf true). aktuell: Pfad-Präfixe ohne Locale; der längste Treffer gewinnt.",
  "tabs": [
    { "id": "entdecken", "pfad": "entdecken/", "aktuell": ["entdecken/"], "aktiv": true },
    { "id": "lernen", "pfad": "lernen/", "aktuell": ["lernen/", "grundlagen/", "themen/"], "aktiv": true },
    { "id": "werkzeug", "pfad": "elektrowerkzeuge/", "aktuell": ["elektrowerkzeuge/"], "aktiv": true },
    { "id": "marken", "pfad": "elektrowerkzeuge/marken/", "aktuell": ["elektrowerkzeuge/marken/"], "aktiv": false },
    { "id": "glossar", "pfad": "glossar/", "aktuell": ["glossar/"], "aktiv": true },
    { "id": "blog", "pfad": "blog/", "aktuell": ["blog/"], "aktiv": true }
  ]
}
```

`src/scripts/stufe.ts`:
```ts
// Stufe wählen (Spec §3.3): localStorage „ww-stufe“, <html data-stufe> sofort, Stufen-Leiste aus. Kein Konto, kein Tracking.
export type Stufe = 'einstieg' | 'azubi' | 'profi';

export function setzeStufe(stufe: string): void {
  const s: Stufe = stufe === 'azubi' || stufe === 'profi' ? stufe : 'einstieg';
  const html = document.documentElement;
  html.dataset.stufe = s;
  html.dataset.stufeGewaehlt = '';
  try { localStorage.setItem('ww-stufe', s); } catch { /* privater Modus o. ä. */ }
  document.dispatchEvent(new CustomEvent<Stufe>('ww-stufe', { detail: s }));
}

export function hinweisAus(): void {
  document.documentElement.dataset.stufeHinweis = 'aus';
  try { localStorage.setItem('ww-stufe-hinweis', '1'); } catch { /* privater Modus o. ä. */ }
}
```

`src/components/GeselleKopf.astro`:
```astro
---
// Watt, Geselle – Kopf als Inline-SVG (Platzhalter, bis TP3 das Character-Sheet liefert). Helm Gelb #F2B705, Haut warm.
interface Props { size?: number; class?: string }
const { size = 36, class: className } = Astro.props;
---
<svg class:list={['ww-watt', className]} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
  <path d="M6 20a14 14 0 0 1 28 0v2H6z" fill="#F2B705" />
  <circle cx="20" cy="26" r="10" fill="#F5D0B5" />
  <circle cx="16" cy="25" r="1.5" fill="#1C2430" />
  <circle cx="24" cy="25" r="1.5" fill="#1C2430" />
  <path d="M16 30q4 3 8 0" stroke="#1C2430" fill="none" stroke-width="1.5" stroke-linecap="round" />
</svg>
```

- [ ] **Step 4: ThemeProvider + ThemeSelect override'larını yeniden yaz**

`src/components/ThemeProvider.astro`:
```astro
---
// Dark-first (Spec D1): ohne gespeicherte Wahl dunkel. Zusätzlich Stufe („ww-stufe“) und Hinweis-Status vor dem Rendern auf
// <html> setzen, damit Chip, Entdecken-Blöcke und Stufen-Leiste ohne Flackern stimmen. Absichtlich inline (FOUC).
---
<script is:inline>
  window.StarlightThemeProvider = (() => {
    const lies = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
    const html = document.documentElement;
    const gespeichert = lies('starlight-theme');
    html.dataset.theme = gespeichert === 'light' ? 'light' : 'dark';
    const stufe = lies('ww-stufe');
    html.dataset.stufe = stufe === 'azubi' || stufe === 'profi' ? stufe : 'einstieg';
    if (stufe) html.dataset.stufeGewaehlt = '';
    if (lies('ww-stufe-hinweis')) html.dataset.stufeHinweis = 'aus';
    return { updatePickers() {} };
  })();
</script>
```

`src/components/ThemeSelect.astro`:
```astro
---
// Theme-Umschalter als Icon (Spec §4.1): dunkel Standard, hell nur bei ausdrücklicher Wahl. Ersetzt das Starlight-Select.
import { Icon } from '@astrojs/starlight/components';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).theme;
---
<starlight-theme-select>
  <button type="button" class="ww-theme-knopf" data-hell={t.hell} data-dunkel={t.dunkel} aria-label={t.hell}>
    <Icon name="sun" class="ww-theme-sonne" />
    <Icon name="moon" class="ww-theme-mond" />
  </button>
</starlight-theme-select>

<script>
  class WwThemeSelect extends HTMLElement {
    connectedCallback() {
      const knopf = this.querySelector('button');
      if (!knopf) return;
      const html = document.documentElement;
      const label = () => knopf.setAttribute('aria-label', (html.dataset.theme === 'light' ? knopf.dataset.dunkel : knopf.dataset.hell) ?? '');
      label();
      knopf.addEventListener('click', () => {
        const neu = html.dataset.theme === 'light' ? 'dark' : 'light';
        html.dataset.theme = neu;
        try { localStorage.setItem('starlight-theme', neu); } catch { /* privater Modus */ }
        label();
      });
    }
  }
  if (!customElements.get('starlight-theme-select')) customElements.define('starlight-theme-select', WwThemeSelect);
</script>

<style>
  .ww-theme-knopf { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; padding: 0; border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); background: var(--ww-surface); color: var(--ww-muted); cursor: pointer; }
  .ww-theme-knopf:hover { color: var(--ww-text); border-color: var(--ww-accent); }
  .ww-theme-mond { display: none; }
  :global(:root[data-theme='light']) .ww-theme-sonne { display: none; }
  :global(:root[data-theme='light']) .ww-theme-mond { display: inline-block; }
</style>
```

- [ ] **Step 5: StufenChip, SiteTitle, Header**

`src/components/StufenChip.astro`:
```astro
---
// Stufen-Chip im Header (Spec §3.3): zeigt die gewählte Stufe (CSS über <html data-stufe>), Klick öffnet die Wahl.
// Speicherung localStorage „ww-stufe“; nichts wird versteckt, nur sortiert.
import GeselleKopf from './GeselleKopf.astro';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const STUFEN = ['einstieg', 'azubi', 'profi'] as const;
---
<ww-stufen-chip class="ww-stufe-chip">
  <details class="ww-chip-details">
    <summary class="ww-chip" aria-label={t.stufenWahl.chip}>
      <span class="ww-chip-punkt" aria-hidden="true"></span>
      {STUFEN.map((s) => <span class="ww-chip-text" data-s={s}>{t.stufen[s]}</span>)}
    </summary>
    <div class="ww-chip-menue" role="group" aria-label={t.stufenWahl.aktuell}>
      <p class="ww-chip-frage"><GeselleKopf size={28} /> {t.stufenWahl.frage}</p>
      {STUFEN.map((s) => <button type="button" class:list={['ww-stufe-option', `ist-${s}`]} data-stufe={s}><b>{t.stufen[s]}</b><span>{t.stufenKurz[s]}</span></button>)}
      <p class="ww-chip-hinweis">{t.stufenWahl.hinweis}</p>
    </div>
  </details>
</ww-stufen-chip>

<script>
  import { setzeStufe } from '../scripts/stufe';
  class WwStufenChip extends HTMLElement {
    connectedCallback() {
      const details = this.querySelector('details');
      this.querySelectorAll<HTMLButtonElement>('[data-stufe]').forEach((b) => b.addEventListener('click', () => { setzeStufe(b.dataset.stufe ?? 'einstieg'); details?.removeAttribute('open'); }));
      document.addEventListener('click', (e) => { if (details?.open && !this.contains(e.target as Node)) details.removeAttribute('open'); });
    }
  }
  if (!customElements.get('ww-stufen-chip')) customElements.define('ww-stufen-chip', WwStufenChip);
</script>

<style>
  .ww-chip-details { position: relative; }
  .ww-chip-details > summary { list-style: none; border-color: var(--ww-stufe-farbe, var(--ww-line)); color: var(--ww-stufe-farbe, var(--ww-text)); font-weight: 600; }
  .ww-chip-details > summary::-webkit-details-marker { display: none; }
  .ww-chip-punkt { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: currentColor; }
  .ww-chip-menue { position: absolute; inset-inline-end: 0; top: calc(100% + 0.375rem); width: 20rem; max-width: calc(100vw - 2rem); padding: 0.875rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); display: grid; gap: 0.5rem; z-index: 20; }
  .ww-chip-frage { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.25rem; font-size: 0.875rem; font-weight: 600; color: var(--ww-text); }
  .ww-stufe-option { display: grid; gap: 0.125rem; text-align: start; padding: 0.625rem 0.75rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); background: var(--ww-bg); color: var(--ww-text); font: inherit; cursor: pointer; }
  .ww-stufe-option:hover { border-color: var(--ww-accent); }
  .ww-stufe-option span { font-size: 0.75rem; color: var(--ww-muted); }
  .ist-einstieg b { color: var(--ww-stufe-einstieg); } .ist-azubi b { color: var(--ww-stufe-azubi); } .ist-profi b { color: var(--ww-stufe-profi); }
  :global(:root[data-stufe='einstieg']) .ist-einstieg, :global(:root[data-stufe='azubi']) .ist-azubi, :global(:root[data-stufe='profi']) .ist-profi { border-color: var(--ww-accent); background: var(--ww-accent-soft); }
  .ww-chip-hinweis { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--ww-muted); }
</style>
```

`src/components/SiteTitle.astro`:
```astro
---
// Wortmarke: „watt“ in Textfarbe, „was“ im Akzent (Mockup D1). Link auf die Startseite der Locale.
const { siteTitleHref } = Astro.locals.starlightRoute;
---
<a href={siteTitleHref} class="ww-marke">watt<b>was</b></a>
<style>
  .ww-marke { font-weight: 800; font-size: 1.1875rem; letter-spacing: -0.02em; color: var(--ww-text); text-decoration: none; white-space: nowrap; }
  .ww-marke b { color: var(--ww-accent); font-weight: 800; }
</style>
```

`src/components/Header.astro`:
```astro
---
// Header D1 (Spec §4.3, Mockup D1): Wortmarke · Top-Tabs · Suche (Strg K) rechts · Stufen-Chip · Theme-Icon · Sprach-Chip.
// Mobil: Tabs und Sprach-/Theme-Wahl im Drawer (Sidebar.astro), Suche als Icon, Stufen-Chip bleibt. Keine Social-Icons (Spec §10).
import config from 'virtual:starlight/user-config';
import LanguageSelect from 'virtual:starlight/components/LanguageSelect';
import Search from 'virtual:starlight/components/Search';
import SiteTitle from 'virtual:starlight/components/SiteTitle';
import ThemeSelect from 'virtual:starlight/components/ThemeSelect';
import StufenChip from './StufenChip.astro';
import tabsDaten from '../data/tabs.json';
import ui from '../data/startseite-ui.json';

const locale = Astro.currentLocale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).tabs;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const pfad = Astro.url.pathname;
const shouldRenderSearch = config.pagefind || config.components.Search !== '@astrojs/starlight/components/Search.astro';
const tabs = tabsDaten.tabs.filter((tab) => tab.aktiv);
// Der längste passende Präfix bestimmt den aktiven Tab (elektrowerkzeuge/marken/ schlägt elektrowerkzeuge/).
const aktiv = tabs.flatMap((tab) => tab.aktuell.filter((p) => pfad.startsWith(`${base}/${locale}/${p}`)).map((p) => ({ id: tab.id, n: p.length }))).sort((a, b) => b.n - a.n)[0]?.id;
---
<div class="ww-header">
  <SiteTitle />
  <nav class="ww-tabs" aria-label={t.menue}>
    {tabs.map((tab) => <a class="ww-tab" href={`${base}/${locale}/${tab.pfad}`} aria-current={tab.id === aktiv ? 'page' : undefined}>{(t as Record<string, string>)[tab.id]}</a>)}
  </nav>
  <div class="ww-header-rechts">
    {shouldRenderSearch && <Search />}
    <StufenChip />
    <div class="ww-header-wahl"><ThemeSelect /><LanguageSelect /></div>
  </div>
</div>

<style>
  .ww-header { display: flex; align-items: center; gap: 0.5rem; height: 100%; }
  .ww-tabs { display: none; }
  .ww-header-rechts { display: flex; align-items: center; gap: 0.5rem; margin-inline-start: auto; }
  .ww-header-wahl { display: none; align-items: center; gap: 0.5rem; }
  @media (min-width: 50rem) {
    .ww-tabs { display: flex; align-self: stretch; margin-inline-start: 1.375rem; }
    .ww-tab { display: flex; align-items: center; padding: 0 0.75rem; font-size: 0.875rem; color: var(--ww-muted); text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .ww-tab:hover { color: var(--ww-text); }
    .ww-tab[aria-current='page'] { color: var(--ww-text); border-bottom-color: var(--ww-accent); }
    .ww-header-wahl { display: flex; }
  }
</style>
```

- [ ] **Step 6: astro.config components**

`astro.config.mjs` `components:` bloğunu şununla değiştir:
```js
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
        Hero: './src/components/Hero.astro',
        Footer: './src/components/Footer.astro',
        // D1 (Neuaufbau TP1): Header mit Tabs/Suche/Stufen-Chip, Wortmarke, dunkel als Standard, Theme als Icon
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
```

- [ ] **Step 7: Build + test**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: FAIL yalnız `Footer: … kanal-tiktok` **değil** (footer değişmedi) — beklenen: `Hepsi geçti (95)`. `.header` Starlight'ın `--sl-nav-height` dahil kendi grid'ini kullanmıyor artık (override'da flex). Header'ın 52 px olduğunu tarayıcıda görmek Task 13'te.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add astro.config.mjs src/data/tabs.json src/scripts/stufe.ts src/components/GeselleKopf.astro src/components/StufenChip.astro src/components/SiteTitle.astro src/components/Header.astro src/components/ThemeProvider.astro src/components/ThemeSelect.astro scripts/check-site.mjs && git commit -q -m "feat(header): D1-Header – Wortmarke, Top-Tabs (Marken erst mit TP2), Suche rechts mit Strg K, Stufen-Chip, Theme-Icon, Sprach-Chip; Stufe und Theme vor dem Rendern auf <html>

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---
### Task 5: Seitenleiste — Gruppen, Stufen-Badges (Route-Middleware), Geselle-Kasten, PageFrame, Stufen-Leiste

**Files:**
- Create: `src/routeData.ts`, `src/scripts/seiten.ts`, `src/components/GeselleKasten.astro`, `src/components/TabsMobil.astro`, `src/components/StufenLeiste.astro`, `src/components/Sidebar.astro`, `src/components/PageFrame.astro`
- Modify: `astro.config.mjs` (sidebar, routeMiddleware, components)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `entry.data.stufe`, `entry.data.geselle` (Task 1), `t.stufen`, `t.geselle`, `t.tabs`, `t.stufenWahl` (Task 3), `setzeStufe`/`hinweisAus`, `tabs.json`, `<GeselleKopf>` (Task 4).
- Produces: `src/scripts/seiten.ts` → `ohneLocale(id)`, `istKatalog(id): 'entdecken'|'woerterbuch'|'marken'|null`, `istRechtliches(id)`; sidebar link'lerinde `<span class="sl-badge default ww-stufe stufe-<stufe>">`; `.page` üzerinde `ww-katalog` sınıfı (katalog sayfaları, `--sl-content-width: 72rem`) ve `ww-start`; `<sl-sidebar-pane id="starlight__sidebar">` her sayfada (splash dahil, masaüstünde gizli); `<ww-stufen-leiste>` startseite dışında her sayfada. Sidebar override'ı Task 9'da `EntdeckenFilter` slotunu kullanır: `istKatalog(id) === 'entdecken'` → `<EntdeckenFilter />` (Task 9'a kadar geçici olarak nav gösterir).

- [ ] **Step 1: Testler**

```js
  // TP1 · Task 5: Seitenleiste, PageFrame
  ['Seitenleiste: Gruppen Grundlagen · Energie- und Gebäudetechnik · Werkzeug · Blog · Mehr (mit Rechtliches)', () => ['Grundlagen', 'Energie- und Gebäudetechnik', 'Werkzeug', 'Blog', 'Mehr', 'Rechtliches'].every((g) => read(`de/${EGT}/berufsbild`).includes(`${g}</span>`)) && read(`tr/${EGT}/berufsbild`).includes('Daha fazla</span>')],
  ['Seitenleiste: Stufen-Badge an jedem Inhaltslink (12), passend zur Stufe; kein Badge an Hubs/Impressum', () => { const h = read(`de/${ARTIKEL}`); return (h.match(/class="sl-badge default ww-stufe stufe-/g) || []).length === 12 && /href="\/de\/grundlagen\/schutzorgane\/"[^>]*>[\s\S]{0,300}?stufe-azubi/.test(h) && /href="\/de\/grundlagen\/sicherheitsregeln\/"[^>]*>[\s\S]{0,300}?stufe-einstieg/.test(h) && !/href="\/de\/rechtliches\/impressum\/"[^>]*>[\s\S]{0,200}?sl-badge/.test(h) && !/href="\/de\/grundlagen\/"[^>]*>[\s\S]{0,200}?sl-badge/.test(h); }],
  ['Seitenleiste (tr): Badge-Text lokalisiert (Başlangıç)', () => /href="\/tr\/grundlagen\/sicherheitsregeln\/"[^>]*>[\s\S]{0,300}?stufe-einstieg[^>]*>Başlangıç</.test(read(`tr/${ARTIKEL}`))],
  ['Geselle-Kasten unten in der Seitenleiste (Artikel), nicht auf Rechtliches', () => read(`de/${ARTIKEL}`).includes('class="ww-geselle"') && read(`de/${ARTIKEL}`).includes('Geselle Watt') && !read('de/rechtliches/impressum').includes('class="ww-geselle"')],
  ['Stufen-Leiste unter dem Header (Artikel, Hub), nicht auf der Startseite', () => read(`de/${ARTIKEL}`).includes('<ww-stufen-leiste') && read('de/grundlagen').includes('<ww-stufen-leiste') && !read('de').includes('<ww-stufen-leiste')],
  ['Mobil: Drawer (starlight__sidebar) mit Tabs auch auf der Startseite; Startseite ohne data-has-sidebar', () => read('de').includes('id="starlight__sidebar"') && read('de').includes('class="ww-tabs-mobil md:sl-hidden"') && !/<html[^>]*data-has-sidebar/.test(read('de')) && /<html[^>]*data-has-sidebar/.test(read(`de/${ARTIKEL}`))],
```

- [ ] **Step 2: Test → FAIL (6 test)**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*(Seitenleiste|Geselle-Kasten|Stufen-Leiste|Mobil)"
```

- [ ] **Step 3: `src/scripts/seiten.ts` + `src/routeData.ts`**

`src/scripts/seiten.ts`:
```ts
// Seitentyp aus der Starlight-Route-ID („de“ = Startseite, „de/entdecken“, „tr/rechtliches/impressum“; „index“ wird von Astro gestrichen).
export const ohneLocale = (id: string): string => (id.includes('/') ? id.replace(/^[a-z]+\//, '') : '');
export const istKatalog = (id: string): 'entdecken' | 'woerterbuch' | 'marken' | null => {
  const s = ohneLocale(id);
  if (s === 'entdecken') return 'entdecken';
  if (s === 'elektrowerkzeuge/woerterbuch') return 'woerterbuch';
  if (/^elektrowerkzeuge\/marken(\/|$)/.test(s)) return 'marken';
  return null;
};
export const istRechtliches = (id: string): boolean => ohneLocale(id).startsWith('rechtliches/');
```

`src/routeData.ts`:
```ts
// Route-Middleware (Starlight 0.42): Stufen-Badge je Seitenleisten-Link aus dem Frontmatter `stufe` der deutschen Quelle ableiten.
// Spec §3.2 verlangt „Badge muss zur Stufe passen“ – hier per Konstruktion, kein doppelter Eintrag im Frontmatter (Abweichung dokumentiert).
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import ui from './data/startseite-ui.json';

type Stufe = 'einstieg' | 'azubi' | 'profi';
let stufen: Map<string, Stufe> | undefined;

async function ladeStufen(): Promise<Map<string, Stufe>> {
  if (!stufen) {
    stufen = new Map();
    for (const e of await getCollection('docs')) {
      if (e.id.startsWith('de/') && e.data.stufe) stufen.set(e.id.slice(3), e.data.stufe as Stufe);
    }
  }
  return stufen;
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const { starlightRoute } = context.locals;
  const locale = starlightRoute.locale ?? 'de';
  const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
  const karte = await ladeStufen();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const slugVon = (href: string) => href.replace(base, '').replace(/^\/[a-z]+\//, '').replace(/\/$/, '');
  const markiere = (eintraege: typeof starlightRoute.sidebar) => {
    for (const e of eintraege) {
      if (e.type === 'group') { markiere(e.entries); continue; }
      const stufe = karte.get(slugVon(e.href));
      if (stufe) e.badge = { text: t.stufen[stufe], variant: 'default', class: `ww-stufe stufe-${stufe}` };
    }
  };
  markiere(starlightRoute.sidebar);
});
```

- [ ] **Step 4: Bileşenler**

`src/components/GeselleKasten.astro`:
```astro
---
// Geselle-Kasten unten in der Seitenleiste (Spec §3.2/§8): Kopf (SVG bis TP3), Name, ein Satz aus Frontmatter `geselle` oder Standard je Bereich.
import GeselleKopf from './GeselleKopf.astro';
import ui from '../data/startseite-ui.json';
import { ohneLocale } from '../scripts/seiten';
const { entry } = Astro.locals.starlightRoute;
const locale = Astro.currentLocale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).geselle;
const s = ohneLocale(entry.id);
const bereich = s === 'entdecken' ? 'entdecken' : s.startsWith('grundlagen') ? 'grundlagen' : s.startsWith('themen') ? 'egt' : s.startsWith('elektrowerkzeuge') ? 'werkzeug' : s.startsWith('blog') ? 'blog' : 'standard';
const text = (entry.data as { geselle?: string }).geselle ?? (t as Record<string, string>)[bereich] ?? t.standard;
---
<aside class="ww-geselle" aria-label={t.name}>
  <GeselleKopf size={36} />
  <p><b>{t.name}</b>{text}</p>
</aside>
<style>
  .ww-geselle { display: flex; gap: 0.625rem; align-items: center; margin: 1.5rem 1.25rem 0; padding: 0.75rem; border: 1px solid var(--ww-line); border-radius: 6px; background: var(--ww-surface); font-size: 0.75rem; color: var(--ww-muted); line-height: 1.4; }
  .ww-geselle :global(svg) { flex: none; }
  .ww-geselle p { margin: 0; }
  .ww-geselle b { display: block; color: var(--ww-text); font-size: 0.8125rem; font-weight: 600; }
</style>
```

`src/components/TabsMobil.astro`:
```astro
---
// Top-Tabs im mobilen Drawer (Spec §4.4: unter 760 px liegen die Tabs im Drawer). Gleiche Daten wie Header.astro.
import tabsDaten from '../data/tabs.json';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).tabs;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<nav class="ww-tabs-mobil md:sl-hidden" aria-label={t.menue}>
  {tabsDaten.tabs.filter((tab) => tab.aktiv).map((tab) => <a href={`${base}/${locale}/${tab.pfad}`}>{(t as Record<string, string>)[tab.id]}</a>)}
</nav>
<style>
  .ww-tabs-mobil { display: grid; padding: 0 0 0.75rem; border-bottom: 1px solid var(--ww-line); margin-bottom: 0.5rem; }
  .ww-tabs-mobil a { padding: 0.625rem 1.5rem; font-size: 0.9375rem; font-weight: 600; color: var(--ww-text); text-decoration: none; }
</style>
```

`src/components/StufenLeiste.astro`:
```astro
---
// Einzeilige Stufen-Leiste unter dem Header (Spec §3.3): nur solange keine Stufe gewählt und nicht weggeklickt – CSS über <html>-Attribute.
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const STUFEN = ['einstieg', 'azubi', 'profi'] as const;
---
<ww-stufen-leiste class="ww-stufen-leiste" role="region" aria-label={t.stufenWahl.aktuell}>
  <p>{t.stufenWahl.leiste}</p>
  <div class="ww-leiste-knoepfe">
    {STUFEN.map((s) => <button type="button" class:list={['ww-pill', `ww-pill-${s}`]} data-stufe={s}>{t.stufen[s]}</button>)}
  </div>
  <button type="button" class="ww-leiste-zu" data-zu aria-label={t.stufenWahl.schliessen}>×</button>
</ww-stufen-leiste>

<script>
  import { setzeStufe, hinweisAus } from '../scripts/stufe';
  class WwStufenLeiste extends HTMLElement {
    connectedCallback() {
      this.querySelectorAll<HTMLButtonElement>('[data-stufe]').forEach((b) => b.addEventListener('click', () => setzeStufe(b.dataset.stufe ?? 'einstieg')));
      this.querySelector('[data-zu]')?.addEventListener('click', () => hinweisAus());
    }
  }
  if (!customElements.get('ww-stufen-leiste')) customElements.define('ww-stufen-leiste', WwStufenLeiste);
</script>

<style>
  .ww-stufen-leiste { display: none; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.5rem var(--sl-content-pad-x); border-bottom: 1px solid var(--ww-line); background: var(--ww-surface); font-size: 0.8125rem; color: var(--ww-muted); }
  :global(html:not([data-stufe-gewaehlt]):not([data-stufe-hinweis])) .ww-stufen-leiste { display: flex; }
  .ww-stufen-leiste p { margin: 0; }
  .ww-leiste-knoepfe { display: flex; gap: 0.375rem; }
  .ww-leiste-zu { margin-inline-start: auto; border: 0; background: none; color: var(--ww-muted); font-size: 1.125rem; line-height: 1; cursor: pointer; padding: 0.25rem 0.5rem; }
  .ww-leiste-zu:hover { color: var(--ww-text); }
</style>
```

`src/components/Sidebar.astro`:
```astro
---
// Seitenleiste D1 (Spec §3.2): mobil zuerst die Top-Tabs; dann Starlight-Navigation (Badges aus routeData.ts) oder – auf Entdecken –
// die Filter-Seitenleiste (Task 9); unten der Geselle-Kasten (nicht auf Rechtliches); mobil zum Schluss Theme/Sprache.
import MobileMenuFooter from 'virtual:starlight/components/MobileMenuFooter';
import SidebarPersister from '@astrojs/starlight/components/SidebarPersister.astro';
import SidebarSublist from '@astrojs/starlight/components/SidebarSublist.astro';
import GeselleKasten from './GeselleKasten.astro';
import TabsMobil from './TabsMobil.astro';
import { istKatalog, istRechtliches } from '../scripts/seiten';
const { sidebar, entry } = Astro.locals.starlightRoute;
const katalog = istKatalog(entry.id);
---
<TabsMobil />
{katalog === 'entdecken' ? (
  <slot name="filter"><SidebarPersister><SidebarSublist sublist={sidebar} /></SidebarPersister></slot>
) : (
  <SidebarPersister><SidebarSublist sublist={sidebar} /></SidebarPersister>
)}
{!istRechtliches(entry.id) && <GeselleKasten />}
<div class="md:sl-hidden"><MobileMenuFooter /></div>
```
(Task 9 `<slot name="filter">` yerine `<EntdeckenFilter />` koyar.)

`src/components/PageFrame.astro`:
```astro
---
// PageFrame D1: Drawer + Menü-Knopf auch auf der Startseite (splash, nur mobil), Katalog-Klasse (breiter Inhalt), Stufen-Leiste unter dem Header.
// Layout-Styles wie Starlight (layer starlight.core), damit wattwas.css weiter gewinnt.
import MobileMenuToggle from 'virtual:starlight/components/MobileMenuToggle';
import Sidebar from 'virtual:starlight/components/Sidebar';
import StufenLeiste from './StufenLeiste.astro';
import { istKatalog } from '../scripts/seiten';
const { hasSidebar, entry } = Astro.locals.starlightRoute;
const katalog = istKatalog(entry.id);
const startseite = entry.data.template === 'splash';
---
<div class:list={['page', 'sl-flex', { 'ww-katalog': Boolean(katalog), 'ww-start': startseite }]} data-katalog={katalog ?? undefined}>
  <header class="header"><slot name="header" /></header>
  <nav class:list={['sidebar', 'print:hidden', { 'nur-mobil': !hasSidebar }]} aria-label={Astro.locals.t('sidebarNav.accessibleLabel')}>
    <MobileMenuToggle />
    <script>
      // Wie Starlight: Popover-Drawer, Fokusfalle solange offen, schließen beim Wechsel mobil/desktop.
      class StarlightSidebarPane extends HTMLElement {
        constructor() {
          super();
          matchMedia('(min-width: 50em)').addEventListener('change', () => this.hidePopover());
          this.addEventListener('toggle', ({ newState }) => this.trapFocus(newState === 'open'));
        }
        trapFocus(shouldTrap: boolean) {
          document.querySelectorAll<HTMLElement>('.main-frame, .sl-skip-link').forEach((el) => el.toggleAttribute('inert', shouldTrap));
        }
      }
      customElements.define('sl-sidebar-pane', StarlightSidebarPane);
    </script>
    <sl-sidebar-pane popover="" id="starlight__sidebar" class="sidebar-pane">
      <div class="sidebar-content sl-flex">
        {hasSidebar ? <slot name="sidebar" /> : <Sidebar />}
      </div>
    </sl-sidebar-pane>
  </nav>
  <div class="main-frame">
    {!startseite && <StufenLeiste />}
    <slot />
  </div>
</div>

<style>
  @layer starlight.core {
    .page { flex-direction: column; min-height: 100vh; }
    .header { z-index: var(--sl-z-index-navbar); position: fixed; inset-inline-start: 0; inset-block-start: 0; width: 100%; height: var(--sl-nav-height); border-bottom: 1px solid var(--sl-color-hairline-shade); padding: var(--sl-nav-pad-y) var(--sl-nav-pad-x); padding-inline-end: calc(var(--sl-nav-gap) + var(--sl-nav-pad-x) + var(--sl-menu-button-size)); background-color: var(--sl-color-bg-nav); }
    .sidebar-pane { border: unset; padding: unset; height: unset; color: unset; position: fixed; z-index: var(--sl-z-index-menu); inset-block: var(--sl-nav-height) 0; inset-inline-start: 0; width: 100%; background-color: var(--sl-color-black); overflow-y: auto; scrollbar-gutter: stable; }
    .sidebar-content { height: 100%; min-height: max-content; padding: 1rem var(--sl-sidebar-pad-x) 0; flex-direction: column; gap: 1rem; }
    .main-frame { padding-top: calc(var(--sl-nav-height) + var(--sl-mobile-toc-height)); padding-inline-start: var(--sl-content-inline-start); }
    .ww-katalog { --sl-content-width: 72rem; }
    @media (min-width: 50rem) {
      .header { padding-inline-end: var(--sl-nav-pad-x); }
      .nur-mobil { display: none; }
      .sidebar-content::after { content: ''; padding-bottom: 1px; }
      .sidebar-pane { display: block; width: var(--sl-sidebar-width); background-color: var(--sl-color-bg-sidebar); border-inline-end: 1px solid var(--sl-color-hairline-shade); }
    }
  }
</style>
```

- [ ] **Step 5: astro.config — sidebar grupları, routeMiddleware, components**

`sidebar: [ … ]` bloğunu (satır 51–84) şununla değiştir:
```js
      sidebar: [
        { ...T('Grundlagen', tr8('Basics', 'Temeller', 'Основы', 'الأساسيات', 'مبانی', 'საფუძვლები', 'Bazat', 'Grund-Wissen')), items: [{ autogenerate: { directory: 'grundlagen' } }] },
        {
          ...T('Energie- und Gebäudetechnik', tr8('Energy and building technology', 'Enerji ve bina tekniği', 'Энергетика и техника зданий', 'تقنيات الطاقة والمباني', 'فناوری انرژی و ساختمان', 'ენერგეტიკა და შენობის ტექნიკა', 'Energjia dhe teknika e ndërtesave', 'Strom im Haus')),
          items: [{ autogenerate: { directory: 'themen/energie-und-gebaeudetechnik' } }],
        },
        // Werkzeug: Guide + Grundausstattung; TP2 ergänzt Wörterbuch und Marken automatisch (gleiches Verzeichnis)
        { ...T('Werkzeug', tr8('Tools', 'Alet', 'Инструмент', 'الأدوات', 'ابزار', 'ხელსაწყო', 'Vegla', 'Werkzeug')), items: [{ autogenerate: { directory: 'elektrowerkzeuge' } }] },
        { ...T('Blog', tr8('Blog', 'Blog', 'Блог', 'المدوّنة', 'وبلاگ', 'ბლოგი', 'Blog')), items: [{ autogenerate: { directory: 'blog' } }] },
        {
          ...T('Mehr', tr8('More', 'Daha fazla', 'Ещё', 'المزيد', 'بیشتر', 'მეტი', 'Më shumë', 'Mehr')),
          items: [
            { ...T('Alle Themen', tr8('All topics', 'Tüm konular', 'Все темы', 'كل المواضيع', 'همهٔ موضوع‌ها', 'ყველა თემა', 'Të gjitha temat', 'Alle Themen')), link: '/themen/' },
            { ...T('Über wattwas', tr8('About', 'Hakkında', 'О проекте', 'عن الموقع', 'درباره', 'პროექტის შესახებ', 'Rreth nesh', 'Über uns')), link: '/ueber/' },
            { ...T('Mitglied werden', tr8('Join', 'Üye ol', 'Стать участником', 'كن عضواً', 'عضو شو', 'გახდი წევრი', 'Bëhu anëtar', 'Mitglied werden')), link: '/mitglied/' },
            { ...T('Glossar', tr8('Glossary', 'Sözlük', 'Глоссарий', 'المسرد', 'واژه‌نامه', 'ლექსიკონი', 'Fjalorth', 'Fach-Wörter')), link: '/glossar/' },
            { ...T('Rechtliches', tr8('Legal', 'Yasal', 'Правовая информация', 'معلومات قانونية', 'اطلاعات حقوقی', 'სამართლებრივი', 'Ligjore')), items: [{ autogenerate: { directory: 'rechtliches' } }] },
          ],
        },
      ],
      // Stufen-Badges in der Seitenleiste aus dem Frontmatter ableiten (TP1)
      routeMiddleware: './src/routeData.ts',
```
`components:` bloğuna ekle:
```js
        Sidebar: './src/components/Sidebar.astro',
        PageFrame: './src/components/PageFrame.astro',
```
Eski testi güncelle: `['sidebar grupları (Themen, Grundlagen, Elektrowerkzeuge, Blog, Rechtliches)', …]` satırını **sil** (yeni test kapsıyor).

- [ ] **Step 6: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (100)`. Middleware'de `getCollection` hata verirse (Astro sürüm farkı): `ladeStufen` içinde `import.meta.glob('./content/docs/de/**/*.mdx', { eager: true })` ile frontmatter okumaya geç (`mod.frontmatter.stufe`) — aynı Map, aynı test.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add astro.config.mjs src/routeData.ts src/scripts/seiten.ts src/components/GeselleKasten.astro src/components/TabsMobil.astro src/components/StufenLeiste.astro src/components/Sidebar.astro src/components/PageFrame.astro scripts/check-site.mjs && git commit -q -m "feat(sidebar): Gruppen Grundlagen/EGT/Werkzeug/Blog/Mehr, Stufen-Badges per Route-Middleware, Geselle-Kasten, Drawer mit Tabs auch auf der Startseite, Stufen-Leiste unter dem Header

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 6: Inhaltsseiten — Stufen-Pill, Stufen-Hinweis, MarkdownContent

**Files:**
- Create: `src/components/StufenHinweis.astro`
- Rewrite: `src/components/Stufe.astro`, `src/components/MarkdownContent.astro`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `data.stufe` (Task 1), `t.stufenHinweis`, `t.stufen`, `t.stufeLegende` (Task 3), `.ww-pill*` (Task 2).
- Produces: `<Stufe stufe />` → `<span class="stufe stufe-<s> ww-pill ww-pill-<s>">Label</span>` (BlogListe kullanır); `<StufenHinweis stufe />` → `.stufen-hinweis[data-seite-stufe]` + 2 × `.stufen-hinweis-text[data-fuer]`.

- [ ] **Step 1: Testler** (eski `'Stufe rozeti: …'` testini aşağıdakiyle **değiştir**)

```js
  ['Stufe rozeti: Artikel (azubi) + Blog-Liste; nicht auf Impressum/Startseite/Glossar/Über/Hubs', () => /class="stufe stufe-azubi/.test(read(`de/${ARTIKEL}`)) && /class="stufe stufe-einstieg/.test(read('de/grundlagen/strom-spannung-widerstand')) && /class="stufe stufe-/.test(read('de/blog')) && ['de/rechtliches/impressum', 'de', 'de/glossar', 'de/ueber', 'de/grundlagen', 'de/themen'].every((p) => !/class="stufe stufe-/.test(read(p)))],
  // TP1 · Task 6
  ['Stufen-Hinweis auf Inhaltsseiten (2 Varianten, Link zu Entdecken), nicht auf Impressum/Hub', () => { const h = read('de/grundlagen/schutzorgane'); return (h.match(/class="stufen-hinweis-text"/g) || []).length === 2 && h.includes('data-seite-stufe="azubi"') && h.includes('data-fuer="einstieg"') && h.includes('href="/de/entdecken/"') && h.includes('Diese Seite ist für Azubi.') && !read('de/rechtliches/impressum').includes('stufen-hinweis') && !read('de/grundlagen').includes('stufen-hinweis'); }],
  ['Stufen-Hinweis (tr): lokalisiert', () => read('tr/grundlagen/schutzorgane').includes('Bu sayfa Azubi için.')],
```

- [ ] **Step 2: Test → FAIL**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*(Stufe rozeti|Stufen-Hinweis)"
```

- [ ] **Step 3: Bileşenler**

`src/components/Stufe.astro`:
```astro
---
// Stufen-Pill (Spec §4.3): einstieg = Start · azubi · profi. Farbe je Stufe, Text bleibt (Pills nie einziger Informationsträger).
import ui from '../data/startseite-ui.json';
interface Props { stufe?: 'einstieg' | 'azubi' | 'profi'; class?: string }
const { stufe = 'einstieg', class: className } = Astro.props;
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
---
<span class:list={['stufe', `stufe-${stufe}`, 'ww-pill', `ww-pill-${stufe}`, className]} title={t.stufeLegende}>{t.stufen[stufe]}</span>
```

`src/components/StufenHinweis.astro`:
```astro
---
// Hinweis oben auf Inhaltsseiten (Spec §3.3): nur wenn Stufe der Seite ≠ gewählte Stufe. Beide anderen Varianten werden gerendert,
// CSS zeigt anhand von <html data-stufe> höchstens eine – kein Flackern, kein JS.
import ui from '../data/startseite-ui.json';
interface Props { stufe: 'einstieg' | 'azubi' | 'profi' }
const { stufe } = Astro.props;
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const andere = (['einstieg', 'azubi', 'profi'] as const).filter((s) => s !== stufe);
---
<div class="stufen-hinweis not-content" data-seite-stufe={stufe}>
  {andere.map((s) => (
    <p class="stufen-hinweis-text" data-fuer={s}>
      {t.stufenHinweis.seite.replace('{stufe}', t.stufen[stufe])} <a href={`${base}/${locale}/entdecken/`}>{t.stufenHinweis.dafuer.replace('{stufe}', t.stufen[s])}</a>
    </p>
  ))}
</div>
<style>
  .stufen-hinweis-text { display: none; margin: 0 0 1rem; padding: 0.5rem 0.75rem; border: 1px solid var(--ww-line); border-inline-start: 3px solid var(--ww-accent); border-radius: var(--ww-radius-sm); background: var(--ww-surface); font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .stufen-hinweis-text a { color: var(--ww-accent); }
  :global(html:not([data-stufe])) .stufen-hinweis-text[data-fuer='einstieg'], :global(html[data-stufe='einstieg']) .stufen-hinweis-text[data-fuer='einstieg'], :global(html[data-stufe='azubi']) .stufen-hinweis-text[data-fuer='azubi'], :global(html[data-stufe='profi']) .stufen-hinweis-text[data-fuer='profi'] { display: block; }
</style>
```
`src/components/MarkdownContent.astro` (tamamı):
```astro
---
import Default from '@astrojs/starlight/components/MarkdownContent.astro';
import Quellen from './Quellen.astro';
import Uebersetzungshinweis from './Uebersetzungshinweis.astro';
import Stufe from './Stufe.astro';
import StufenHinweis from './StufenHinweis.astro';

const { entry } = Astro.locals.starlightRoute;
const data = entry.data as { translated?: string; sources?: { title: string; url: string }[]; stufe?: 'einstieg' | 'azubi' | 'profi' };
const quellen = data.sources ?? [];
// Stufen-Pill + Hinweis nur auf Inhaltsseiten: die tragen `stufe` im Frontmatter (Hubs, Rechtliches, Glossar, Über nicht).
---

<Default {...Astro.props}>
  {data.stufe && <StufenHinweis stufe={data.stufe} />}
  {(data.stufe || data.translated === 'machine') && (
    <p class="seiten-meta">
      {data.stufe && <Stufe stufe={data.stufe} />}
      {data.translated === 'machine' && <Uebersetzungshinweis />}
    </p>
  )}
  <slot />
  {quellen.length > 0 && <Quellen quellen={quellen} />}
</Default>

<style>
  .seiten-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin: 0 0 1rem; }
  .seiten-meta :global(.uebersetzungshinweis) { margin: 0; }
</style>

<script>
  // Lesefortschritt (Entdecken „Zuletzt gelesen“, Lernpfad): besuchte Inhaltsseiten ohne Sprachpräfix lokal merken.
  // Nur localStorage, keine Übertragung – siehe Datenschutzerklärung.
  try {
    const teile = location.pathname.split('/').filter(Boolean);
    if (teile.length >= 3 && /^[a-z]{2,6}$/.test(teile[0])) {
      const slug = teile.slice(1).join('/');
      const key = 'wattwas.gelesen';
      const alt: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      if (!alt.includes(slug)) localStorage.setItem(key, JSON.stringify([...alt, slug]));
    }
  } catch { /* privater Modus o. ä. */ }
</script>
```

- [ ] **Step 4: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (102)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/components/Stufe.astro src/components/StufenHinweis.astro src/components/MarkdownContent.astro scripts/check-site.mjs && git commit -q -m "feat(stufen): Stufen-Pill D1 und Stufen-Hinweis auf Inhaltsseiten (nur wenn Seitenstufe ≠ gewählte Stufe, CSS über data-stufe)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 7: Startseite-Platzhalter — Wortmarke, Satz, Stufenwahl, Sprachen, „Entdecken“

**Files:**
- Create: `src/components/StufenWahl.astro`
- Rewrite: `src/components/Startseite.astro`, `src/components/Hero.astro`
- Rewrite: `src/content/docs/{de,leicht,en,tr,ru,ar,fa,ka,sq}/index.mdx`
- Delete: `src/components/schemata/HeroSchaltkreis.astro`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `t.start`, `t.stufenWahl`, `t.stufen`, `t.stufenKurz`, `t.sprachenLabel` (Task 3), `setzeStufe`, `<GeselleKopf>` (Task 4), `.ww-btn-fill` (Task 2).
- Produces: Startseite DOM: `h1#_top.ww-start-name` (Hero override), `.ww-start-claim`, `<ww-stufen-wahl class="stufenwahl">` + 3 × `button.lvl.lvl-<s>[data-stufe]`, `nav.ww-sprachen` (9 link, `hreflang`), `a.ww-btn.ww-btn-fill.ww-start-cta[href=/<locale>/entdecken/]`.

- [ ] **Step 1: Eski Startseite testlerini kaldır, yenilerini ekle**

**Sil:** `'tr/ar Startseite: Themen-Grid + Lernpfad'`, `'Startseite: Grundlagen, EGT, Werkzeug, Themen linkleri'`, `'Startseite hero: "Elektrotechnik." …'`, `'Startseite hero: 8 dil bağlantısı'`, `'Startseite: 6 video kartı, …'`, `'Startseite: sosyal butonlar …'`, `'Startseite her dilde (leicht + 7 çeviri): …'`, `'Leichte Sprache: /leicht/ …'`.
**Değiştir:** `'Veri i18n: …'` → `read('tr').includes('30 saniyede 5 güvenlik kuralı') &&` parçasını sil. `'Mitgliedschaft: …'` → `/class="[^"]*\bmitglied kompakt/.test(read('de')) &&` parçasını sil.

**Ekle:**
```js
  // TP1 · Task 7: Startseite
  ['Startseite (de): Wortmarke-H1, Claim, Stufenwahl (3), 9 Sprachen, Button → /de/entdecken/', () => { const h = read('de'); return /<h1[^>]*id="_top"[^>]*class="ww-start-name"/.test(h) && h.includes('class="ww-start-claim"') && (h.match(/class="lvl lvl-/g) || []).length === 3 && (h.match(/class="ww-sprachen"[\s\S]*?<\/nav>/)?.[0].match(/hreflang="/g) || []).length === 9 && /class="ww-btn ww-btn-fill ww-start-cta" href="\/de\/entdecken\/"/.test(h); }],
  ['Startseite in allen 9 Locales: Stufenwahl + Entdecken-Link; leicht: lang="de-x-leicht", „Strom verstehen“', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => (read(l).match(/class="lvl lvl-/g) || []).length === 3 && read(l).includes(`href="/${l}/entdecken/"`)) && /<html[^>]*lang="de-x-leicht"/.test(read('leicht')) && read('leicht').includes('Strom verstehen')],
  ['Startseite: kein Video, keine Kanäle, kein Formular, kein Lernpfad, keine Themen-Karten (Spec: vorerst leer)', () => ['de', 'tr', 'ar'].every((l) => !/class="video|kanal-|ww-lernpfad|<form|mitglied kompakt|class="thema[ "]|hero-schaltkreis/.test(read(l)))],
  ['Startseite: description ohne Kanal-Nennung, lastUpdated aus', () => !/YouTube|TikTok|Instagram/.test(read('de').match(/<meta name="description"[^>]*>/)?.[0] ?? '') && !read('de').includes('Zuletzt bearbeitet')],
```

- [ ] **Step 2: Test → FAIL**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*Startseite"
```

- [ ] **Step 3: Bileşenler**

`src/components/StufenWahl.astro`:
```astro
---
// Stufenwahl-Karte auf der Startseite (Spec §3.3, Mockup 1): Watt fragt, drei Karten, Wahl wird gespeichert (Chip oben rechts).
import GeselleKopf from './GeselleKopf.astro';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const STUFEN = ['einstieg', 'azubi', 'profi'] as const;
---
<ww-stufen-wahl class="stufenwahl">
  <div class="stufenwahl-kopf">
    <GeselleKopf size={44} />
    <p><b>{t.stufenWahl.frage}</b><small>{t.stufenWahl.hinweis}</small></p>
  </div>
  <div class="stufenwahl-karten" role="group" aria-label={t.stufenWahl.aktuell}>
    {STUFEN.map((s) => (
      <button type="button" class:list={['lvl', `lvl-${s}`]} data-stufe={s}><b>{t.stufen[s]}</b><span>{t.stufenKurz[s]}</span></button>
    ))}
  </div>
</ww-stufen-wahl>

<script>
  import { setzeStufe } from '../scripts/stufe';
  class WwStufenWahl extends HTMLElement {
    connectedCallback() {
      this.querySelectorAll<HTMLButtonElement>('[data-stufe]').forEach((b) => b.addEventListener('click', () => setzeStufe(b.dataset.stufe ?? 'einstieg')));
    }
  }
  if (!customElements.get('ww-stufen-wahl')) customElements.define('ww-stufen-wahl', WwStufenWahl);
</script>

<style>
  .stufenwahl { display: block; text-align: start; border: 1px solid var(--ww-line); border-radius: 10px; background: var(--ww-surface); padding: 1.375rem; }
  .stufenwahl-kopf { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
  .stufenwahl-kopf :global(svg) { flex: none; }
  .stufenwahl-kopf p { margin: 0; }
  .stufenwahl-kopf b { font-size: 1rem; }
  .stufenwahl-kopf small { display: block; color: var(--ww-muted); font-size: 0.8125rem; }
  .stufenwahl-karten { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
  .lvl { text-align: start; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); padding: 0.875rem; background: var(--ww-bg); color: var(--ww-text); font: inherit; cursor: pointer; }
  .lvl:hover, .lvl:focus-visible { border-color: var(--ww-accent); }
  .lvl b { display: block; margin-bottom: 0.25rem; }
  .lvl span { font-size: 0.8125rem; color: var(--ww-muted); line-height: 1.4; }
  .lvl-einstieg b { color: var(--ww-stufe-einstieg); } .lvl-azubi b { color: var(--ww-stufe-azubi); } .lvl-profi b { color: var(--ww-stufe-profi); }
  :global(html[data-stufe-gewaehlt][data-stufe='einstieg']) .lvl-einstieg, :global(html[data-stufe-gewaehlt][data-stufe='azubi']) .lvl-azubi, :global(html[data-stufe-gewaehlt][data-stufe='profi']) .lvl-profi { border-color: var(--ww-accent); background: var(--ww-accent-soft); }
  @media (max-width: 47.5rem) { .stufenwahl-karten { grid-template-columns: 1fr; } }
</style>
```

`src/components/Hero.astro` (yeniden):
```astro
---
// Hero-Override nur für die Startseite (template splash + hero): Wortmarke als H1. Alles Weitere rendert Startseite.astro.
const PAGE_TITLE_ID = '_top';
---
<h1 id={PAGE_TITLE_ID} data-page-title class="ww-start-name">watt<b>was</b></h1>
<style>
  .ww-start-name { margin: clamp(1.5rem, 10vh, 5rem) 0 0; font-size: 2.75rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; text-align: center; color: var(--ww-text); }
  .ww-start-name b { color: var(--ww-accent); font-weight: 800; }
  @media (max-width: 47.5rem) { .ww-start-name { font-size: 2.125rem; } }
</style>
```

`src/components/Startseite.astro` (yeniden):
```astro
---
// Startseite (Spec §2 „Startseite“, Mockup 1): ein Satz, Stufenwahl-Karte (Geselle Watt), Sprachreihe, Button „Entdecken“.
// Endgültiger Inhalt kommt nach TP1 (Kadirs Entscheidung). Kein Video, keine Kanäle, kein Formular, kein Lernpfad.
import config from 'virtual:starlight/user-config';
import StufenWahl from './StufenWahl.astro';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const sprachen = Object.entries(config.locales ?? {}).map(([code, l]) => ({ code, label: l!.label, href: `${base}/${code}/` }));
---
<section class="ww-start not-content">
  <p class="ww-start-claim">{t.start.claim}</p>
  <StufenWahl />
  <nav class="ww-sprachen" aria-label={t.sprachenLabel}>
    <ul>
      {sprachen.map((s) => <li><a href={s.href} lang={s.code === 'leicht' ? 'de' : s.code} hreflang={s.code === 'leicht' ? 'de-x-leicht' : s.code} aria-current={s.code === locale ? 'page' : undefined}>{s.label}</a></li>)}
    </ul>
  </nav>
  <p class="ww-start-aktion"><a class="ww-btn ww-btn-fill ww-start-cta" href={`${base}/${locale}/entdecken/`}>{t.start.entdecken} <span aria-hidden="true">→</span></a></p>
</section>

<style>
  .ww-start { display: grid; gap: 1.5rem; text-align: center; margin-top: 0.625rem; }
  .ww-start-claim { margin: 0; font-size: 1.1875rem; color: var(--ww-muted); }
  .ww-sprachen ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
  .ww-sprachen a { display: inline-block; padding: 0.3rem 0.75rem; border: 1px solid var(--ww-line); border-radius: 999px; color: var(--ww-muted); font-size: 0.8125rem; text-decoration: none; }
  .ww-sprachen a:hover { border-color: var(--ww-accent); color: var(--ww-text); }
  .ww-sprachen a[aria-current='page'] { border-color: var(--ww-accent); color: var(--ww-text); }
  .ww-start-aktion { margin: 0; }
  .ww-start-cta { height: 2.5rem; padding: 0 1.25rem; font-size: 0.9375rem; }
</style>
```

- [ ] **Step 4: 9 × `index.mdx`** — hepsi aynı gövde, frontmatter locale'e göre. Şablon (de):

```mdx
---
title: wattwas
description: Elektrotechnik, verstehen. In neun Sprachen, Fachbegriffe auf Deutsch. Grundlagen, Anleitungen, Werkzeug – für Start, Azubi und Profi.
template: splash
hero:
  title: wattwas
translated: source
lastUpdated: false
---
import Startseite from '../../../components/Startseite.astro';

<Startseite />
```

Diğer locale'lerde `translated: machine` (leicht: `source`) ve `description`:
- leicht: `Strom verstehen. Ganz einfach. wattwas erklärt Elektro-Technik in Leichter Sprache. Für Anfang, Azubi und Profi.`
- en: `Electrical engineering, understood. In nine languages, technical terms in German. Basics, guides, tools – for Start, Apprentice and Pro.`
- tr: `Elektrotekniği anla. Dokuz dilde, Fachbegriff'ler Almanca. Temeller, kılavuzlar, alet – Başlangıç, Azubi ve Profi için.`
- ru: `Понять электротехнику. На девяти языках, термины на немецком. Основы, инструкции, инструмент – для Старт, Azubi и Profi.`
- ar: `افهم الكهروتقنية. بتسع لغات، والمصطلحات بالألمانية. الأساسيات والإرشادات والأدوات – للبداية وAzubi وProfi.`
- fa: `برق را بفهم. به نه زبان، اصطلاحات به آلمانی. مبانی، راهنماها، ابزار – برای شروع، Azubi و Profi.`
- ka: `გაიგე ელექტროტექნიკა. ცხრა ენაზე, ტერმინები გერმანულად. საფუძვლები, ინსტრუქციები, ხელსაწყო – დასაწყისი, Azubi და Profi.`
- sq: `Kupto elektroteknikën. Në nëntë gjuhë, termat në gjermanisht. Bazat, udhëzuesit, veglat – për Fillim, Azubi dhe Profi.`

`leicht/index.mdx`'teki `saeulen` prop'u kalkar (`<Startseite />`).

- [ ] **Step 5: HeroSchaltkreis'i sil, build + test**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git rm -q src/components/schemata/HeroSchaltkreis.astro && grep -rn "HeroSchaltkreis\|saeulen" src | grep -v "^src/content/docs/leicht" ; npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: grep boş; `Hepsi geçti (98)` (8 eski test gitti, 4 yeni geldi).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add -A src/components/Startseite.astro src/components/Hero.astro src/components/StufenWahl.astro src/components/schemata src/content/docs/*/index.mdx scripts/check-site.mjs && git commit -q -m "feat(startseite): Platzhalter nach Spec – Wortmarke, ein Satz, Stufenwahl mit Watt, Sprachreihe, Entdecken; Hero/Schaltkreis/Video/Kanäle/Formular entfernt (9 Locales)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---
### Task 8: Sichtbarkeit Social/Video — nichts zeigen, bis es echt ist

**Files:**
- Modify: `src/data/social.json` (url null), `src/components/Kanaele.astro` (yeniden), `src/components/Footer.astro:29`, `src/components/Mitglied.astro:66`
- Create: `scratch/sichtbarkeit.mjs` (tek seferlik)
- Modify: `src/content/docs/{de,en,tr,ru,ar,fa,ka,sq}/ueber.mdx`, `…/themen/energie-und-gebaeudetechnik/index.mdx`, `…/blog/index.mdx`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `t.kanaeleBald` (Task 3).
- Produces: `<Kanaele />` → url'li kanal yoksa hiçbir şey; `<Kanaele bald />` → `<p class="kanaele-bald">…</p>`; url'li kanal varsa `ul.kanaele > a.kanal.kanal-<id>` (ileride). `astro.config.mjs` `social:` zaten `url` filtreli → Starlight ikonları da yok.

- [ ] **Step 1: Testler** (eski `'Footer: …'` ve `'Yeni bölümler: …'` testlerini değiştir)

`'Footer: dil + Impressum + Über bağlantıları, ücretsiz notu, kanallar'` → sonundaki `&& read(`de/${ARTIKEL}`).includes('kanal-tiktok')` parçasını `&& !read(`de/${ARTIKEL}`).includes('kanal-')` yap.
`'Yeni bölümler: …'` → `read('de/ueber').includes('youtube.com/@wattwas')` parçasını `read('de/ueber').includes('class="kanaele-bald')` yap.

Ekle:
```js
  // TP1 · Task 8: Sichtbarkeit (Spec §10)
  ['Sichtbarkeit: kein Kanal-Link (YouTube/TikTok/Instagram) auf Startseite, Artikel, Über, Mitglied, Footer; Über + Mitglied „in Vorbereitung“', () => ['de', `de/${ARTIKEL}`, 'de/ueber', 'de/mitglied', 'tr/ueber'].every((p) => !/youtube\.com\/@|tiktok\.com\/@|instagram\.com\/wattwas|class="kanal |social-icons/.test(read(p))) && read('de/ueber').includes('class="kanaele-bald') && read('de/mitglied').includes('class="kanaele-bald') && !read(`de/${ARTIKEL}`).includes('kanaele-bald')],
  ['Sichtbarkeit: social.json ohne url (bis Kadir Kanäle anlegt); videos.json ohne status live', () => JSON.parse(readFileSync(join(src, 'data/social.json'), 'utf8')).kanaele.every((k) => !k.url) && JSON.parse(readFileSync(join(src, 'data/videos.json'), 'utf8')).videos.every((v) => !(v.status === 'live' && v.url))],
  ['Über/EGT/Blog: keine Sätze mehr über Kurzvideos oder Kanäle (8 Locales)', () => INHALT_LOCALES.every((l) => !/YouTube/.test(mdx(l, 'ueber')) && !/YouTube/.test(mdx(l, `${EGT}/index`)) && !/Kurzvideo|short video|kısa video|коротк|فيديو|ویدیو|ვიდეო|video të shkurt/i.test(mdx(l, 'blog/index')))],
```

- [ ] **Step 2: Test → FAIL (3 yeni + 2 değişen)**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*(Sichtbarkeit|Über/EGT|Footer|Yeni bölümler)"
```

- [ ] **Step 3: `social.json`** — üç kanalda `"url": "https://…"` → `"url": null`; `_hinweis` ekle (dosyanın en üstüne, `"handle"` öncesi):
```json
  "_hinweis": "Spec §10: Kanal ohne url → kein Icon, kein Link, nirgends. Sobald ein Kanal wirklich existiert: url eintragen, sonst nichts ändern.",
```

- [ ] **Step 4: `Kanaele.astro` (yeniden)**

```astro
---
// Kanäle (Spec §10): nur Kanäle mit url. Ohne einen einzigen Kanal: nichts – oder mit `bald` ein Satz „in Vorbereitung“ (Über, Mitglied).
import { Icon } from '@astrojs/starlight/components';
import social from '../data/social.json';
import ui from '../data/startseite-ui.json';
interface Props { gross?: boolean; bald?: boolean; class?: string }
const { gross = false, bald = false, class: className } = Astro.props;
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const kanaele = social.kanaele.filter((k) => k.url);
---
{kanaele.length === 0 ? (bald && <p class:list={['kanaele-bald', className]}>{t.kanaeleBald}</p>) : (
  <ul class:list={['kanaele', { gross }, className]} aria-label={t.fussKanaele}>
    {kanaele.map((k) => (
      <li>
        <a class:list={['kanal', `kanal-${k.id}`]} href={k.url as string} rel="me noopener" target="_blank">
          <span class="kanal-icon"><Icon name={k.icon as 'youtube'} size="1.25em" /></span>
          <span class="kanal-name">{k.label}</span>
        </a>
      </li>
    ))}
  </ul>
)}
<style>
  .kanaele-bald { margin: 0; font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .kanaele { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .kanal { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem 0.375rem 0.625rem; border-radius: 999px; border: 1px solid var(--ww-line); background: var(--ww-surface); color: var(--ww-text); font-weight: 600; font-size: var(--sl-text-sm); text-decoration: none; }
  .kanal:hover, .kanal:focus-visible { border-color: var(--ww-accent); }
  .kanal-icon { display: inline-flex; color: var(--ww-muted); }
  .gross .kanal { padding: 0.75rem 1.25rem 0.75rem 1rem; border-radius: var(--ww-radius); }
</style>
```

`Footer.astro:29` `<Kanaele class="ww-fuss-kanaele" />` satırını **sil** (footer'da url yoksa hiçbir şey; url gelince Task 11'deki yeni footer `<Kanaele />` ile geri gelir — Task 11 footer'ı yeniden yazar).
`Mitglied.astro:66` `<Kanaele />` → `<Kanaele bald />`.

- [ ] **Step 5: Prosa temizliği scripti** `scratch/sichtbarkeit.mjs` (Write):

```js
// Einmalig (TP1 Task 8, Spec §10): Sätze über Kurzvideos/Kanäle aus Über, EGT-Übersicht und Blog-Index entfernen (8 Locales).
import { readFileSync, writeFileSync } from 'node:fs';
const LOC = ['de', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'];
const BLOG = {
  de: ['Fehler des Tages, Azubi-Fakten, Quiz – kurz, mit Schema, mit Quelle.', 'Kurze Beiträge zum Nachlesen, Nachschlagen, Weiterschicken. Kurz, mit Schema, mit Quelle.'],
  en: ['Mistake of the day, apprentice facts, quizzes – short, with a diagram, with a source.', 'Short posts to read up, look up, pass along. Short, with a diagram, with a source.'],
  tr: ['Günün hatası, Azubi bilgileri, quiz – kısa, şemalı, kaynaklı.', 'Okumak, bakmak, paylaşmak için kısa yazılar. Kısa, şemalı, kaynaklı.'],
  ru: ['Ошибка дня, факты для учеников, тесты – коротко, со схемой, с источником.', 'Короткие заметки, чтобы перечитать, найти, переслать. Коротко, со схемой, с источником.'],
  ar: ['خطأ اليوم، حقائق المتدرب، اختبارات – باختصار، مع مخطط، مع مصدر.', 'مقالات قصيرة للقراءة والمراجعة والمشاركة. قصيرة، مع مخطط، مع مصدر.'],
  fa: ['خطای روز، واقعیت‌های کارآموزی، آزمون – کوتاه، با نقشه، با منبع.', 'نوشته‌های کوتاه برای خواندن، مرور و فرستادن. کوتاه، با نقشه، با منبع.'],
  ka: ['დღის შეცდომა, შეგირდის ფაქტები, ქვიზი – მოკლედ, სქემით, წყაროთი.', 'მოკლე ჩანაწერები წასაკითხად, მოსაძებნად, გასაზიარებლად. მოკლედ, სქემით, წყაროთი.'],
  sq: ['Gabimi i ditës, fakte për Azubi, kuiz – shkurt, me skemë, me burim.', 'Postime të shkurtra për t’i lexuar, kërkuar, dërguar më tej. Shkurt, me skemë, me burim.'],
};
const KANAL_BULLET = { de: 'Kanäle', en: 'Channels', tr: 'Kanallar', ru: 'Каналы', ar: 'القنوات', fa: 'کانال', ka: 'არხები', sq: 'Kanalet' };
let n = 0;
const bearbeite = (f, fn) => { const alt = readFileSync(f, 'utf8'); const neu = fn(alt); if (neu !== alt) { writeFileSync(f, neu); n++; } else console.log('unverändert:', f); };
for (const l of LOC) {
  const d = `src/content/docs/${l}`;
  // Über: Satz vor <Kanaele gross /> weg, Komponente mit `bald`; Bullet „Kanäle: …“ in der Finanzierungs-Liste weg
  bearbeite(`${d}/ueber.mdx`, (s) => s.replace(/\n[^\n<#]+\n\n<Kanaele gross \/>/, '\n<Kanaele gross bald />').replace(new RegExp(`\\n- \\*\\*${KANAL_BULLET[l]}[^\\n]*`), ''));
  // EGT-Übersicht: Absatz mit YouTube weg
  bearbeite(`${d}/themen/energie-und-gebaeudetechnik/index.mdx`, (s) => s.replace(/\n[^\n]*YouTube[^\n]*\n/, '\n'));
  // Blog-Index: description + Intro ohne Kurzvideo-Bezug
  bearbeite(`${d}/blog/index.mdx`, (s) => s.replace(/^description: .*$/m, `description: ${BLOG[l][0]}`).replace(/(import BlogListe[^\n]*\n)[\s\S]*?(<BlogListe \/>)/, `$1\n${BLOG[l][1]}\n\n$2`));
}
console.log(`${n} Dateien geändert (erwartet 24)`);
```

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scratch/sichtbarkeit.mjs && grep -rn "YouTube" src/content/docs/*/ueber.mdx src/content/docs/*/themen/energie-und-gebaeudetechnik/index.mdx | grep -v "^src/content/docs/leicht" | head
```
Beklenen: `24 Dateien geändert`, grep boş. `unverändert:` satırı çıkarsa o dosyayı elle aç ve ilgili cümleyi sil (regex uymadı).

- [ ] **Step 6: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (101)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/data/social.json src/components/Kanaele.astro src/components/Footer.astro src/components/Mitglied.astro src/content/docs scripts/check-site.mjs && git commit -q -m "feat(sichtbarkeit): Kanäle ohne url nirgends sichtbar (Header, Footer, Über, Mitglied), „in Vorbereitung“ als Text; Kurzvideo-Sätze aus Über/EGT/Blog entfernt (8 Locales)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 9: `/entdecken/` — Katalog mit Banner, Empfohlen, Themen, Werkzeug, Filter-Seitenleiste

**Files:**
- Create: `src/data/entdecken.json`, `src/components/Karte.astro`, `src/components/Entdecken.astro`, `src/components/EntdeckenFilter.astro`, `src/content/docs/<9 locale>/entdecken.mdx`
- Modify: `src/components/Sidebar.astro` (filter slot → `<EntdeckenFilter />`)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `t.entdecken`, `t.bereiche`, `t.stufen`, `t.lernfeld`, `t.lesezeit`, `t.quiz` (Task 3), `istKatalog` (Task 5), `.ww-karte/.raster/.ww-sec/.ww-sub/.ww-side-a` (Task 2), `wattwas.gelesen` (Task 6), `videos.json`.
- Produces: `entdecken.json` → `{ empfohlen: Record<Stufe, slug[]>, bereiche: { id, href, seiten: slug[] }[], werkzeug: { id, href, seite? }[] }` (Task 10 `bereiche`'yi kullanır); `<Karte …/>` props `{ slug, href, titel, text, stufe, bereich, bereichTitel, lernfeld: number[], minuten, quiz }`; DOM: `<ww-entdecken class="entdecken not-content">`, `.banner[data-fuer]`, `section.block[data-block=empfohlen][data-fuer]` ×3, `[data-block=themen|werkzeug|marken|neu|ergebnisse]`, `a.ww-karte.karte[data-slug][data-stufe][data-bereich]`; `document` olayı `ww-filter` (detail: `'reset' | 'zuletzt' | 'stufe:<s>' | 'bereich:<id>'`).

- [ ] **Step 1: Testler**

```js
  // TP1 · Task 9: Entdecken
  ['Entdecken: 9 Locales, Katalog-Klasse, Filter-Seitenleiste, Geselle-Kasten, kein Inhaltsverzeichnis, kein „Zuletzt bearbeitet“', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/entdecken`))) && /class="page sl-flex ww-katalog"/.test(read('de/entdecken')) && read('de/entdecken').includes('<ww-entdecken-filter') && read('de/entdecken').includes('class="ww-geselle"') && !read('de/entdecken').includes('starlight-toc') && !read('de/entdecken').includes('Zuletzt bearbeitet')],
  ['Entdecken: Banner ×3, Empfohlen ×3 (je Stufe, Karten ≥ 4/4/4), Themen ≥ 5 Bereiche, Werkzeug 2 Karten vor TP2, kein Marken-Block, kein Video', () => { const h = read('de/entdecken'); return (h.match(/class="banner"/g) || []).length === 3 && ['einstieg', 'azubi', 'profi'].every((s) => new RegExp(`data-block="empfohlen" data-fuer="${s}"`).test(h)) && (h.match(/class="ww-karte karte"/g) || []).length >= 26 && (h.match(/class="ww-karte bereich"/g) || []).length >= 5 && (h.match(/class="ww-karte werkzeug-karte"/g) || []).length === 2 && !h.includes('data-block="marken"') && !h.includes('data-block="neu"') && !h.includes('class="video'); }],
  ['Entdecken: Karte mit data-stufe/data-bereich, Stufen-Pill, Lernfeld-Tag, Lesezeit + Quiz; Ergebnisse-Block versteckt', () => { const h = read('de/entdecken'); return /class="ww-karte karte" href="\/de\/grundlagen\/schutzorgane\/" data-slug="grundlagen\/schutzorgane" data-stufe="azubi" data-bereich="grundlagen"/.test(h) && /data-slug="grundlagen\/schutzorgane"[\s\S]{0,900}?ww-pill ww-pill-azubi[\s\S]{0,600}?Lernfeld 2[\s\S]{0,300}?Min\. · Quiz 5/.test(h) && /<section class="block ergebnisse" data-block="ergebnisse"[^>]*hidden/.test(h); }],
  ['Entdecken (tr/ar): Sprache der Seite, deutsche Slugs, RTL', () => read('tr/entdecken').includes('href="/tr/grundlagen/schutzorgane/"') && read('tr/entdecken').includes('Schutzorgane – LS, RCD, SLS ve') && read('tr/entdecken').includes('Azubi için öneriler') && /<html[^>]*dir="rtl"/.test(read('ar/entdecken'))],
  ['Entdecken: Filter-Seitenleiste mit Stufen-Zählern (Start 7, Azubi 5, Profi 0), Bereichen, Werkzeug-Links; mobil Filter-Chip', () => { const h = read('de/entdecken'); return /data-filter="stufe:einstieg"[^<]*<small[^>]*>7</.test(h) && /data-filter="stufe:azubi"[^<]*<small[^>]*>5</.test(h) && /data-filter="stufe:profi"[^<]*<small[^>]*>0</.test(h) && h.includes('data-filter="bereich:anleitungen"') && h.includes('data-filter="zuletzt"') && /popovertarget="starlight__sidebar"[^>]*class="ww-chip md:sl-hidden"|class="ww-chip md:sl-hidden"[^>]*popovertarget="starlight__sidebar"/.test(h); }],
  ['Entdecken: jede Inhaltsseite genau einmal in bereiche (entdecken.json)', () => { const e = JSON.parse(readFileSync(join(src, 'data/entdecken.json'), 'utf8')); const alle = e.bereiche.flatMap((b) => b.seiten); return Object.keys(STUFEN_SOLL).every((s) => alle.filter((x) => x === s).length === 1) && alle.length === Object.keys(STUFEN_SOLL).length; }],
```
Task 5'teki `'Geselle-Kasten …'` testine `&& read('de/entdecken').includes('class="ww-geselle"')` ekle.

- [ ] **Step 2: Test → FAIL**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scripts/check-site.mjs | grep -E "^FAIL.*Entdecken"
```

- [ ] **Step 3: `src/data/entdecken.json`**

```json
{
  "_hinweis": "Entdecken (Spec §5). empfohlen: geordnete Slugs je Stufe – Karteninhalt kommt aus dem Frontmatter der Zielseite in der Sprache der Seite (Fallback Deutsch), Stufe/Lernfeld aus der deutschen Quelle. bereiche: jede Inhaltsseite genau einmal (Test). Profi hat noch keine eigenen Inhalte → die Azubi-Seiten mit Prüfschritten. werkzeug: Karten mit `seite` erscheinen erst, wenn die Seite existiert (TP2).",
  "empfohlen": {
    "einstieg": ["grundlagen/strom-spannung-widerstand", "grundlagen/sicherheitsregeln", "grundlagen/netz-und-leiterfarben", "themen/energie-und-gebaeudetechnik/berufsbild", "elektrowerkzeuge/grundausstattung-azubi", "themen/energie-und-gebaeudetechnik/wechselschaltung-steckdose"],
    "azubi": ["grundlagen/schutzorgane", "themen/energie-und-gebaeudetechnik/unterverteilung", "themen/energie-und-gebaeudetechnik/zaehlerplatz", "blog/fehler-des-tages-1-rcd-gruppen", "themen/energie-und-gebaeudetechnik/lernfelder", "grundlagen/sicherheitsregeln"],
    "profi": ["themen/energie-und-gebaeudetechnik/unterverteilung", "themen/energie-und-gebaeudetechnik/zaehlerplatz", "grundlagen/schutzorgane", "themen/energie-und-gebaeudetechnik/weiterbildung"]
  },
  "bereiche": [
    { "id": "grundlagen", "href": "grundlagen/", "seiten": ["grundlagen/strom-spannung-widerstand", "grundlagen/netz-und-leiterfarben", "grundlagen/schutzorgane"] },
    { "id": "sicherheit", "href": "grundlagen/sicherheitsregeln/", "seiten": ["grundlagen/sicherheitsregeln"] },
    { "id": "beruf", "href": "themen/energie-und-gebaeudetechnik/", "seiten": ["themen/energie-und-gebaeudetechnik/berufsbild", "themen/energie-und-gebaeudetechnik/lernfelder", "themen/energie-und-gebaeudetechnik/weiterbildung"] },
    { "id": "anleitungen", "href": "themen/energie-und-gebaeudetechnik/", "seiten": ["themen/energie-und-gebaeudetechnik/unterverteilung", "themen/energie-und-gebaeudetechnik/zaehlerplatz", "themen/energie-und-gebaeudetechnik/wechselschaltung-steckdose"] },
    { "id": "werkzeug", "href": "elektrowerkzeuge/", "seiten": ["elektrowerkzeuge/grundausstattung-azubi"] },
    { "id": "blog", "href": "blog/", "seiten": ["blog/fehler-des-tages-1-rcd-gruppen"] }
  ],
  "werkzeug": [
    { "id": "guide", "href": "elektrowerkzeuge/" },
    { "id": "grundausstattung", "href": "elektrowerkzeuge/grundausstattung-azubi/" },
    { "id": "woerterbuch", "href": "elektrowerkzeuge/woerterbuch/", "seite": "elektrowerkzeuge/woerterbuch" },
    { "id": "marken", "href": "elektrowerkzeuge/marken/", "seite": "elektrowerkzeuge/marken" }
  ]
}
```

- [ ] **Step 4: `Karte.astro`**

```astro
---
// Inhaltskarte (Mockup D1): Kicker (Bereich + Stufen-Pill), Titel, Text, Fußzeile (Lernfeld-Tags, Lesezeit, Quizanzahl). Wird von Entdecken.astro gerendert.
import ui from '../data/startseite-ui.json';
interface Props { slug: string; href: string; titel: string; text: string; stufe: 'einstieg' | 'azubi' | 'profi'; bereich: string; bereichTitel: string; lernfeld: number[]; minuten: number; quiz: number }
const { slug, href, titel, text, stufe, bereich, bereichTitel, lernfeld, minuten, quiz } = Astro.props;
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
---
<a class="ww-karte karte" href={href} data-slug={slug} data-stufe={stufe} data-bereich={bereich}>
  <span class="karte-body">
    <span class="karte-kick"><span>{bereichTitel}</span><span class:list={['ww-pill', `ww-pill-${stufe}`]}>{t.stufen[stufe]}</span></span>
    <span class="karte-titel">{titel}</span>
    <span class="karte-text">{text}</span>
  </span>
  <span class="karte-fuss">
    {lernfeld.map((lf) => <span class="ww-pill ww-pill-tag">{t.lernfeld} {lf}</span>)}
    <span class="karte-meta">{minuten} {t.lesezeit}{quiz > 0 ? ` · ${t.quiz} ${quiz}` : ''}</span>
  </span>
</a>
```

- [ ] **Step 5: `EntdeckenFilter.astro`**

```astro
---
// Filter-Seitenleiste für Entdecken (Spec §5): Für dich · Stufe (Zähler) · Themen · Werkzeug. Ein Filter gleichzeitig; Zustand als
// Event „ww-filter“ an Entdecken.astro. Aktiver Eintrag mit blauem Balken (.ist-aktiv, wattwas.css).
import { getCollection } from 'astro:content';
import daten from '../data/entdecken.json';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/`;
const alle = await getCollection('docs');
const gibtEs = (slug: string) => alle.some((e) => e.id === `de/${slug}`);
const stufeVon = (slug: string) => alle.find((e) => e.id === `de/${slug}`)?.data.stufe;
const seiten = daten.bereiche.flatMap((b) => b.seiten).filter(gibtEs);
const zahl = (s: string) => seiten.filter((slug) => stufeVon(slug) === s).length;
const bereiche = daten.bereiche.map((b) => ({ ...b, anzahl: b.seiten.filter(gibtEs).length })).filter((b) => b.anzahl > 0);
const werkzeug = daten.werkzeug.filter((w) => !('seite' in w) || gibtEs((w as { seite: string }).seite));
const g = t.entdecken.filterGruppen;
const wk = t.entdecken.werkzeugKarten as Record<string, { titel: string; text: string }>;
---
<ww-entdecken-filter class="ww-filter">
  <p class="ww-grp">{g.fuerDich}</p>
  <div class="ww-side">
    <button type="button" class="ww-side-a ist-aktiv" data-filter="reset">{t.entdecken.empfohlenKurz}</button>
    <button type="button" class="ww-side-a" data-filter="zuletzt">{t.entdecken.zuletzt}</button>
  </div>
  <p class="ww-grp">{g.stufe}</p>
  <div class="ww-side">
    {(['einstieg', 'azubi', 'profi'] as const).map((s) => <button type="button" class="ww-side-a" data-filter={`stufe:${s}`}>{t.stufen[s]} <small>{zahl(s)}</small></button>)}
  </div>
  <p class="ww-grp">{g.themen}</p>
  <div class="ww-side">
    {bereiche.map((b) => <button type="button" class="ww-side-a" data-filter={`bereich:${b.id}`}>{(t.bereiche as Record<string, string>)[b.id]} <small>{b.anzahl}</small></button>)}
  </div>
  <p class="ww-grp">{g.werkzeug}</p>
  <div class="ww-side">
    {werkzeug.map((w) => <a class="ww-side-a" href={`${base}${w.href}`}>{wk[w.id].titel}</a>)}
  </div>
</ww-entdecken-filter>

<script>
  class WwEntdeckenFilter extends HTMLElement {
    connectedCallback() {
      const knoepfe = Array.from(this.querySelectorAll<HTMLButtonElement>('button[data-filter]'));
      const markiere = (filter: string) => knoepfe.forEach((b) => b.classList.toggle('ist-aktiv', b.dataset.filter === filter));
      knoepfe.forEach((k) => k.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent<string>('ww-filter', { detail: k.dataset.filter ?? 'reset' }));
        const drawer = document.getElementById('starlight__sidebar');
        if (drawer?.matches(':popover-open')) drawer.hidePopover();
      }));
      document.addEventListener('ww-filter', (e) => markiere((e as CustomEvent<string>).detail));
    }
  }
  if (!customElements.get('ww-entdecken-filter')) customElements.define('ww-entdecken-filter', WwEntdeckenFilter);
</script>
```

- [ ] **Step 6: `Entdecken.astro`**

```astro
---
// Entdecken (Spec §5, Mockup D1): Banner je Stufe, „Empfohlen für <Stufe>“ (drei Blöcke, CSS zeigt den der gewählten Stufe), Themen,
// Werkzeug, Marken (erst mit src/data/marken.json, TP2), „Neu“ nur mit Video status live + url. Filter (Seitenleiste) wirken client-seitig
// auf den versteckten Ergebnisse-Block mit allen Inhaltskarten; „Zuletzt gelesen“ aus localStorage „wattwas.gelesen“.
import { getCollection } from 'astro:content';
import GeselleKopf from './GeselleKopf.astro';
import Karte from './Karte.astro';
import daten from '../data/entdecken.json';
import videosDaten from '../data/videos.json';
import ui from '../data/startseite-ui.json';

type Stufe = 'einstieg' | 'azubi' | 'profi';
const STUFEN: Stufe[] = ['einstieg', 'azubi', 'profi'];
const locale = Astro.currentLocale ?? 'de';
const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
const te = t.entdecken;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/`;

const alle = await getCollection('docs');
const de = (slug: string) => alle.find((e) => e.id === `de/${slug}`);
const lokal = (slug: string) => alle.find((e) => e.id === `${locale}/${slug}`) ?? de(slug);
const woerter = (body: string) => body.replace(/^import .*$/gm, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const bereichVon = (slug: string) => daten.bereiche.find((b) => b.seiten.includes(slug))?.id ?? 'grundlagen';
const bereichTitel = (id: string) => (t.bereiche as Record<string, string>)[id] ?? id;
type KarteDaten = { slug: string; href: string; titel: string; text: string; stufe: Stufe; bereich: string; bereichTitel: string; lernfeld: number[]; minuten: number; quiz: number };
const karte = (slug: string): KarteDaten | undefined => {
  const q = de(slug); const e = lokal(slug);
  if (!q || !e) return undefined;
  const bereich = bereichVon(slug);
  return { slug, href: `${base}${slug}/`, titel: e.data.title, text: e.data.description ?? '', stufe: (q.data.stufe ?? 'einstieg') as Stufe, bereich, bereichTitel: bereichTitel(bereich), lernfeld: q.data.lernfeld ?? [], minuten: Math.max(2, Math.round(woerter(e.body ?? '') / 180)), quiz: (e.body?.match(/\{\s*f:/g) ?? []).length };
};
const empfohlen = Object.fromEntries(STUFEN.map((s) => [s, daten.empfohlen[s].map(karte).filter((k): k is KarteDaten => Boolean(k))])) as Record<Stufe, KarteDaten[]>;
const alleKarten = daten.bereiche.flatMap((b) => b.seiten).map(karte).filter((k): k is KarteDaten => Boolean(k));
const bereiche = daten.bereiche.map((b) => ({ id: b.id, titel: bereichTitel(b.id), anzahl: b.seiten.filter(de).length, href: `${base}${b.href}` })).filter((b) => b.anzahl > 0);
const wk = te.werkzeugKarten as Record<string, { titel: string; text: string }>;
const werkzeug = daten.werkzeug.filter((w) => !('seite' in w) || de((w as { seite: string }).seite)).map((w) => ({ id: w.id, href: `${base}${w.href}`, ...wk[w.id] }));
// Marken & Modelle erst mit TP2 (Datei fehlt → leeres Glob-Objekt, kein Block)
const markenMod = import.meta.glob('../data/marken.json', { eager: true }) as Record<string, { default: { modelle?: { id: string; marke: string; modell: string; kategorie: string; stand: string; kurz: Record<string, string> }[] } }>;
const marken = (Object.values(markenMod)[0]?.default.modelle ?? []).sort((a, b) => b.stand.localeCompare(a.stand)).slice(0, 4);
const liveVideos = videosDaten.videos.filter((v) => v.status === 'live' && v.url);
---
<ww-entdecken class="entdecken not-content">
  <button type="button" class="ww-chip md:sl-hidden" popovertarget="starlight__sidebar">{te.filter}</button>
  {STUFEN.map((s) => (
    <div class="banner" data-fuer={s}>
      <GeselleKopf size={52} />
      <div class="banner-text"><b>{te.bannerTitel[s]}</b><p>{te.bannerText[s]}</p></div>
      {empfohlen[s][0] && <a class="ww-btn ww-btn-fill" href={empfohlen[s][0].href}>{te.bannerButton}</a>}
    </div>
  ))}
  <div class="bloecke">
    {STUFEN.map((s) => (
      <section class="block" data-block="empfohlen" data-fuer={s} aria-labelledby={`empfohlen-${s}`}>
        <div class="ww-sec"><h2 id={`empfohlen-${s}`}>{te.empfohlen.replace('{stufe}', t.stufen[s])}</h2><button type="button" class="ww-link" data-filter={`stufe:${s}`}>{te.alle} →</button></div>
        <p class="ww-sub">{te.empfohlenText[s]}</p>
        <div class="raster">{empfohlen[s].map((k) => <Karte {...k} />)}</div>
      </section>
    ))}
    <section class="block" data-block="themen" aria-labelledby="themen-h">
      <div class="ww-sec"><h2 id="themen-h">{te.themen}</h2></div>
      <p class="ww-sub">{te.themenText}</p>
      <div class="raster raster-3">
        {bereiche.map((b) => <a class="ww-karte bereich" href={b.href} data-bereich={b.id}><span class="karte-body"><span class="karte-titel">{b.titel}</span><span class="karte-text">{b.anzahl} {te.seiten}</span></span></a>)}
      </div>
    </section>
    <section class="block" data-block="werkzeug" aria-labelledby="werkzeug-h">
      <div class="ww-sec"><h2 id="werkzeug-h">{te.werkzeug}</h2></div>
      <p class="ww-sub">{te.werkzeugText}</p>
      <div class="raster raster-3">
        {werkzeug.map((w) => <a class="ww-karte werkzeug-karte" href={w.href}><span class="karte-body"><span class="karte-titel">{w.titel}</span><span class="karte-text">{w.text}</span></span></a>)}
      </div>
    </section>
    {marken.length > 0 && (
      <section class="block" data-block="marken" aria-labelledby="marken-h">
        <div class="ww-sec"><h2 id="marken-h">{te.markenNeu}</h2><a class="ww-link" href={`${base}elektrowerkzeuge/marken/`}>{te.alle} →</a></div>
        <div class="raster">{marken.map((m) => <a class="ww-karte" href={`${base}elektrowerkzeuge/marken/${m.kategorie}/#${m.id}`}><span class="karte-body"><span class="karte-kick"><span>{m.kategorie}</span><span class="ww-pill ww-pill-tag">{m.stand}</span></span><span class="karte-titel">{m.marke} {m.modell}</span><span class="karte-text">{m.kurz[locale] ?? m.kurz.de}</span></span></a>)}</div>
      </section>
    )}
    {liveVideos.length > 0 && (
      <section class="block" data-block="neu" aria-labelledby="neu-h">
        <div class="ww-sec"><h2 id="neu-h">{t.live}</h2></div>
        <div class="raster raster-3">{liveVideos.map((v) => <a class="ww-karte video" href={v.url as string} rel="noopener" target="_blank"><span class="karte-body"><span class="karte-kick"><span>{v.serie}</span><span class="ww-pill ww-pill-tag">{v.dauer}</span></span><span class="karte-titel">{(v.i18n as Record<string, string>)[locale] ?? v.titel}</span></span></a>)}</div>
      </section>
    )}
  </div>
  <section class="block ergebnisse" data-block="ergebnisse" aria-labelledby="ergebnisse-h" hidden>
    <div class="ww-sec"><h2 id="ergebnisse-h">{te.ergebnisse} <span class="anzahl"></span></h2><button type="button" class="ww-link" data-filter="reset">{te.zuruecksetzen}</button></div>
    <div class="raster">{alleKarten.map((k) => <Karte {...k} />)}</div>
    <p class="keine ww-sub" hidden>{te.keine}</p>
  </section>
</ww-entdecken>

<script>
  class WwEntdecken extends HTMLElement {
    connectedCallback() {
      const bloecke = this.querySelector<HTMLElement>('.bloecke');
      const ergebnisse = this.querySelector<HTMLElement>('.ergebnisse');
      const karten = Array.from(this.querySelectorAll<HTMLElement>('.ergebnisse .karte'));
      const anzahl = this.querySelector<HTMLElement>('.anzahl');
      const keine = this.querySelector<HTMLElement>('.keine');
      let gelesen: string[] = [];
      try { gelesen = JSON.parse(localStorage.getItem('wattwas.gelesen') ?? '[]'); } catch { gelesen = []; }
      const wende = (filter: string) => {
        if (filter === 'reset') { bloecke?.removeAttribute('hidden'); ergebnisse?.setAttribute('hidden', ''); return; }
        const [typ, wert] = filter.split(':');
        let n = 0;
        karten.forEach((k) => {
          const ok = typ === 'zuletzt' ? gelesen.includes(k.dataset.slug ?? '') : typ === 'stufe' ? k.dataset.stufe === wert : k.dataset.bereich === wert;
          k.hidden = !ok;
          if (ok) n++;
        });
        if (anzahl) anzahl.textContent = String(n);
        if (keine) keine.hidden = n > 0;
        bloecke?.setAttribute('hidden', '');
        ergebnisse?.removeAttribute('hidden');
      };
      document.addEventListener('ww-filter', (e) => wende((e as CustomEvent<string>).detail));
      this.querySelectorAll<HTMLButtonElement>('button[data-filter]').forEach((b) => b.addEventListener('click', () => document.dispatchEvent(new CustomEvent<string>('ww-filter', { detail: b.dataset.filter ?? 'reset' }))));
    }
  }
  if (!customElements.get('ww-entdecken')) customElements.define('ww-entdecken', WwEntdecken);
</script>

<style>
  .entdecken { display: block; }
  .entdecken > .ww-chip { margin-bottom: 0.875rem; }
  .banner { align-items: center; gap: 1.25rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); padding: 1.125rem 1.375rem; background: var(--ww-surface); margin-bottom: 2rem; }
  .banner :global(svg) { flex: none; }
  .banner-text { flex: 1; }
  .banner-text b { display: block; font-size: 1.0625rem; margin-bottom: 0.25rem; }
  .banner-text p { margin: 0; color: var(--ww-muted); }
  .block { margin-bottom: 2rem; }
  .block[hidden], .bloecke[hidden] { display: none; }
  .anzahl { color: var(--ww-muted); font-weight: 400; }
  @media (max-width: 47.5rem) { .banner { flex-direction: column; align-items: flex-start; } }
</style>
```

- [ ] **Step 7: Sidebar'da filter slotunu bağla**

`src/components/Sidebar.astro`: `import EntdeckenFilter from './EntdeckenFilter.astro';` ekle; `katalog === 'entdecken' ? (…)` dalını `<EntdeckenFilter />` ile değiştir (slot kaldır).

- [ ] **Step 8: 9 × `entdecken.mdx`** — şablon (de), diğerlerinde `title`/`description` = `t.entdecken.titel` + aşağıdaki description, `translated: machine` (leicht `source`):

```mdx
---
title: Entdecken
description: Empfehlungen für deine Stufe, alle Themen, Werkzeug – der Katalog von wattwas.
tableOfContents: false
pagefind: false
lastUpdated: false
translated: source
---
import Entdecken from '../../../components/Entdecken.astro';

<Entdecken />
```
Descriptions: leicht `Empfehlungen für deine Stufe. Alle Themen. Werkzeug.` · en `Recommendations for your level, all topics, tools – the wattwas catalogue.` · tr `Seviyene göre öneriler, tüm konular, alet – wattwas kataloğu.` · ru `Рекомендации для твоего уровня, все темы, инструмент – каталог wattwas.` · ar `توصيات لمستواك، كل المواضيع، الأدوات – فهرس wattwas.` · fa `پیشنهادها برای سطح تو، همهٔ موضوع‌ها، ابزار – فهرست wattwas.` · ka `რეკომენდაციები შენი დონისთვის, ყველა თემა, ხელსაწყო – wattwas-ის კატალოგი.` · sq `Rekomandime për nivelin tënd, të gjitha temat, veglat – katalogu i wattwas.`
Titles: leicht `Entdecken` · en `Explore` · tr `Keşfet` · ru `Обзор` · ar `استكشف` · fa `کاوش` · ka `აღმოაჩინე` · sq `Zbulo`.

- [ ] **Step 9: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (107)`. Kart sayısı testi düşerse `data-astro-cid` özniteliği `class`'tan önce geliyordur → regex'i `/class="ww-karte karte"/` yerine `/ww-karte karte"/` yap.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/data/entdecken.json src/components/Karte.astro src/components/Entdecken.astro src/components/EntdeckenFilter.astro src/components/Sidebar.astro src/content/docs/*/entdecken.mdx scripts/check-site.mjs && git commit -q -m "feat(entdecken): Katalogseite – Banner und Empfehlungen je Stufe, Themen, Werkzeug, Filter-Seitenleiste (Stufe, Thema, zuletzt gelesen); Marken/Video-Blöcke nur mit Daten (9 Locales)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 10: `/lernen/` — Hub mit vier Wegen

**Files:**
- Create: `src/components/Lernen.astro`, `src/content/docs/<9 locale>/lernen.mdx`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `t.lernen` (Task 3), `entdecken.json → bereiche` (Task 9), `.ww-karte` (Task 2).
- Produces: `div.lernen > .raster > div.ww-karte.lernen-karte[data-bereich]` ×4, her kartta `ol.karte-liste` (Bereich sayfaları).

- [ ] **Step 1: Test**

```js
  // TP1 · Task 10: Lernen
  ['Lernen: 9 Locales, 4 Karten (Grundlagen, Sicherheit, EGT, Anleitungen) mit Unterlisten, Nav-Seitenleiste mit Badges + Geselle', () => { const h = read('de/lernen'); return ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/lernen`))) && (h.match(/class="ww-karte lernen-karte"/g) || []).length === 4 && h.includes('data-bereich="anleitungen"') && h.includes(`href="/de/${EGT}/unterverteilung/"`) && h.includes('href="/de/grundlagen/sicherheitsregeln/"') && h.includes('class="ww-geselle"') && h.includes('sl-badge default ww-stufe') && read('tr/lernen').includes('Kılavuzlar'); }],
```

- [ ] **Step 2: Test → FAIL; dann `Lernen.astro`**

```astro
---
// Lernen-Hub (Spec §3.1): vier Wege – Grundlagen, Sicherheit, Energie- und Gebäudetechnik, Anleitungen. Ersetzt keine Hubs, verlinkt sie.
// Unterlisten aus entdecken.json → bereiche (Titel in der Sprache der Seite, Fallback Deutsch).
import { getCollection } from 'astro:content';
import daten from '../data/entdecken.json';
import ui from '../data/startseite-ui.json';
const locale = Astro.currentLocale ?? 'de';
const t = ((ui as Record<string, typeof ui.de>)[locale] ?? ui.de).lernen;
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${locale}/`;
const alle = await getCollection('docs');
const titel = (slug: string) => (alle.find((e) => e.id === `${locale}/${slug}`) ?? alle.find((e) => e.id === `de/${slug}`))?.data.title ?? slug;
const seitenVon = (id: string) => (daten.bereiche.find((b) => b.id === id)?.seiten ?? []).filter((s) => alle.some((e) => e.id === `de/${s}`));
const karten = t.karten.map((k) => ({ ...k, href: `${base}${k.href}`, seiten: seitenVon(k.id).map((s) => ({ href: `${base}${s}/`, titel: titel(s) })) }));
---
<div class="lernen not-content">
  <p class="ww-sub">{t.text}</p>
  <div class="raster">
    {karten.map((k, i) => (
      <div class="ww-karte lernen-karte" data-bereich={k.id}>
        <a class="karte-body" href={k.href}>
          <span class="karte-kick"><span>{String(i + 1).padStart(2, '0')}</span></span>
          <span class="karte-titel">{k.titel}</span>
          <span class="karte-text">{k.text}</span>
        </a>
        {k.seiten.length > 0 && <ol class="karte-liste">{k.seiten.map((s) => <li><a href={s.href}>{s.titel}</a></li>)}</ol>}
      </div>
    ))}
  </div>
</div>
<style>
  .lernen { display: block; margin-top: 0.5rem; }
  .karte-liste { margin: 0; padding: 0.5rem 1.125rem 0.875rem 2.25rem; border-top: 1px solid var(--ww-line); font-size: 0.875rem; color: var(--ww-muted); display: grid; gap: 0.25rem; }
  .karte-liste a { color: var(--ww-text); text-decoration: none; }
  .karte-liste a:hover { color: var(--ww-accent); }
</style>
```

- [ ] **Step 3: 9 × `lernen.mdx`** — şablon (de); `title` = `t.lernen.titel`, `translated: machine` (leicht `source`):

```mdx
---
title: Lernen
description: Grundlagen, Sicherheit, Energie- und Gebäudetechnik, Anleitungen – vier Wege durch die Elektrotechnik.
tableOfContents: false
lastUpdated: false
translated: source
---
import Lernen from '../../../components/Lernen.astro';

<Lernen />
```
Titles: leicht `Lernen` · en `Learn` · tr `Öğren` · ru `Учиться` · ar `تعلّم` · fa `یادگیری` · ka `ისწავლე` · sq `Mëso`. Descriptions: leicht `Grund-Wissen, Sicherheit, Strom im Haus, Anleitungen. Vier Wege.` · en `Basics, safety, energy and building technology, guides – four paths through electrical engineering.` · tr `Temeller, güvenlik, enerji ve bina tekniği, kılavuzlar – elektroteknikte dört yol.` · ru `Основы, безопасность, энергетика и техника зданий, инструкции – четыре пути через электротехнику.` · ar `الأساسيات، السلامة، تقنيات الطاقة والمباني، الإرشادات – أربعة مسارات عبر الكهروتقنية.` · fa `مبانی، ایمنی، فناوری انرژی و ساختمان، راهنماها – چهار مسیر در برق.` · ka `საფუძვლები, უსაფრთხოება, ენერგეტიკა და შენობის ტექნიკა, ინსტრუქციები – ოთხი გზა ელექტროტექნიკაში.` · sq `Bazat, siguria, energjia dhe teknika e ndërtesave, udhëzuesit – katër rrugë nëpër elektroteknikë.`

- [ ] **Step 4: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (108)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/components/Lernen.astro src/content/docs/*/lernen.mdx scripts/check-site.mjs && git commit -q -m "feat(lernen): Hub mit vier Wegen (Grundlagen, Sicherheit, EGT, Anleitungen) und Unterlisten, 9 Locales

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---
### Task 11: Restliche Komponenten auf D1 — Lernpfad, Themen, Werkzeuge, BlogListe, Mitglied, Footer; Übergangs-Aliase löschen

**Files:**
- Modify (nur `<style>` + kleine Markup-Änderungen): `src/components/Lernpfad.astro`, `src/components/Themen.astro`, `src/components/Werkzeuge.astro`, `src/components/BlogListe.astro`, `src/components/Mitglied.astro`, `src/components/Footer.astro`
- Modify: `src/styles/wattwas.css` (Übergangsblock löschen)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `.ww-pill*`, `.ww-karte`, `.ww-btn*`, `.raster` (Task 2), `<Stufe>` (Task 6), `<Kanaele bald>` (Task 8).
- Produces: Quelltext ohne `--ww-amber|--ww-cyan|--ww-grad|--ww-orange|--ww-grid-line|--ww-font-heading|--ww-begriff|reveal|magnet`. Mevcut testlerin beklediği sınıflar KALIR: `ww-lernpfad`, `class="kapitel`, `class="beruf `, `class="produkt `, `class="vergleich`, `class="post `, `class="vorteil`, `class="bald`, `affiliate-hinweis`, `class="ww-fuss`, `class="stufe stufe-`.

- [ ] **Step 1: Test**

```js
  // TP1 · Task 11: keine alten Tokens, keine Reveal/Magnet-Effekte
  ['Quelltext ohne alte Tokens (amber/cyan/grad/orange/grid-line/font-heading/begriff) und ohne reveal/magnet', () => { const dateien = [...srcFiles(join(src, 'components')), join(src, 'styles/wattwas.css'), join(src, '..', 'astro.config.mjs')]; return dateien.every((f) => !/ww-amber|ww-cyan|ww-grad|ww-orange|ww-grid-line|ww-font-heading|ww-begriff|space-grotesk|\breveal\b|\bmagnet\b|#f59e0b|#f97316|#22d3ee|#0f172a/i.test(readFileSync(f, 'utf8'))); }],
```
`OHNE_STUFE` satırından sonra: `const srcFiles = (dir) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? srcFiles(f) : /\.(astro|css|ts|mjs)$/.test(n) ? [f] : []; });`

- [ ] **Step 2: Test → FAIL; sonra bileşenler**

**`Lernpfad.astro`:** `.level` öğesini (satır 29: `<span class="level">…</span>`) ve script'teki `level` satırlarını (`const level = …`, `if (level) …`) sil; `class="kapitel reveal"` → `class="kapitel"`; `style={`--d:…`}` kaldır; `magnet-soft` sınıfını kaldır. `<style>` bloğunu şununla değiştir:
```css
<style>
  .lernpfad { display: block; }
  .fortschritt { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .fortschritt-leiste { flex: 1; height: 0.375rem; border-radius: 999px; background: var(--ww-surface-2); overflow: hidden; }
  .fortschritt-wert { display: block; height: 100%; width: calc(var(--p) * 100%); background: var(--ww-accent); border-radius: 999px; transition: width 0.4s ease; }
  .fortschritt-text b { color: var(--ww-text); }
  .kapitel-liste { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
  .kapitel-karte { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.125rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); color: inherit; text-decoration: none; }
  .kapitel-karte:hover, .kapitel-karte:focus-visible { border-color: var(--ww-accent); }
  .kapitel-nr { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  .kapitel-zahl { font-weight: 700; font-size: 1.125rem; color: var(--ww-muted); }
  .kapitel-punkt { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 1px solid var(--ww-line); background: var(--ww-bg); color: var(--ww-on-accent); }
  .kapitel-haken { width: 0.875rem; height: 0.875rem; opacity: 0; }
  .ist-gelesen .kapitel-punkt { background: var(--ww-accent); border-color: var(--ww-accent); }
  .ist-gelesen .kapitel-haken { opacity: 1; }
  .ist-gelesen .kapitel-zahl { color: var(--ww-accent); }
  .kapitel-inhalt { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; flex: 1; }
  .kapitel-label { font-size: 0.75rem; color: var(--ww-muted); }
  .kapitel-titel { font-weight: 600; font-size: 1.0625rem; color: var(--ww-text); line-height: 1.3; }
  .kapitel-text { color: var(--ww-muted); font-size: var(--sl-text-sm); line-height: 1.5; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.25rem; }
  .tag { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--ww-line); color: var(--ww-muted); }
  .tag-quiz { border-color: var(--ww-accent); color: var(--ww-accent); }
  .kapitel-icon { color: var(--ww-muted); flex-shrink: 0; }
  @media (max-width: 40rem) { .kapitel-icon { display: none; } }
</style>
```

**`Themen.astro`:** `<style>` bloğunu şununla değiştir (Markup aynı; `farbe-*` sınıfları kalır ama tek akzent):
```css
<style>
  .stufen-legende { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 1rem 0 1.5rem; font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .stufe-pill { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--stufe-farbe); color: var(--stufe-farbe); }
  .stufe-einstieg { --stufe-farbe: var(--ww-stufe-einstieg); } .stufe-azubi { --stufe-farbe: var(--ww-stufe-azubi); } .stufe-profi { --stufe-farbe: var(--ww-stufe-profi); }
  .stufen-text { flex-basis: 100%; line-height: 1.5; }
  .berufe { list-style: none; margin: 1.5rem 0 2rem; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
  .beruf-karte { display: flex; flex-direction: column; gap: 0.375rem; height: 100%; padding: 1.125rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); color: inherit; text-decoration: none; position: relative; }
  a.beruf-karte:hover, a.beruf-karte:focus-visible { border-color: var(--ww-accent); }
  .beruf-icon { width: 2.5rem; height: 2.5rem; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--ww-radius-sm); background: var(--ww-accent-soft); color: var(--ww-accent); margin-bottom: 0.25rem; }
  .beruf-bereich { font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ww-muted); }
  .beruf-titel { font-weight: 600; font-size: 1.0625rem; color: var(--ww-text); line-height: 1.3; }
  .beruf-text { font-size: var(--sl-text-sm); color: var(--ww-muted); line-height: 1.5; }
  .beruf-cta { margin-top: auto; padding-top: 0.5rem; font-weight: 600; font-size: var(--sl-text-sm); color: var(--ww-accent); }
  .beruf-bald { color: var(--ww-muted); font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; }
  .bald .beruf-karte { opacity: 0.8; }
</style>
```

**`Werkzeuge.astro`:** `class="reveal"` ve `style={`--d:…`}` (satır 26) kaldır; `.cta magnet` → `.cta`; `<style>`:
```css
<style>
  .werkzeuge { display: grid; gap: 2.5rem; margin-block: 1.5rem 2rem; }
  .filter { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; }
  .badge { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--ww-line); color: var(--ww-muted); white-space: nowrap; }
  .badge-pflicht { border-color: var(--ww-accent); color: var(--ww-accent); }
  .badge-empfehlung { border-color: var(--ww-stufe-einstieg); color: var(--ww-stufe-einstieg); }
  .produkte { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
  .produkt { display: flex; flex-direction: column; gap: 0.5rem; height: 100%; padding: 1.125rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); position: relative; }
  .produkt:hover { border-color: var(--ww-accent); }
  .produkt-bild { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 16 / 9; border-radius: var(--ww-radius-sm); background: var(--ww-surface-2); border: 1px dashed var(--ww-line); }
  .produkt-icon { width: 3.5rem; height: 3.5rem; color: var(--ww-muted); }
  .produkt-nr { position: absolute; top: 0.5rem; inset-inline-end: 0.7rem; font-size: 0.6875rem; color: var(--ww-muted); letter-spacing: 0.08em; }
  .produkt-kopf { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .budget { color: var(--ww-muted); letter-spacing: 0.1em; }
  .produkt-name { margin: 0; font-size: 1.0625rem; font-weight: 600; line-height: 1.3; color: var(--ww-text); }
  .best { margin: 0; font-size: var(--sl-text-sm); color: var(--ww-text); }
  .best-label { display: block; font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ww-muted); }
  .kurz { margin: 0; font-size: var(--sl-text-sm); color: var(--ww-muted); line-height: 1.5; }
  .pro-contra { display: grid; gap: 0.5rem; grid-template-columns: 1fr 1fr; font-size: var(--sl-text-xs); }
  .pro-contra ul { list-style: none; margin: 0; padding: 0.5rem 0.625rem; border-radius: var(--ww-radius-sm); display: grid; gap: 0.25rem; align-content: start; border: 1px solid var(--ww-line); }
  .pro li::before { content: '+ '; color: var(--ww-stufe-einstieg); font-weight: 700; }
  .contra li::before { content: '− '; color: var(--ww-sicherheit); font-weight: 700; }
  .cta { margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; height: 2.25rem; padding: 0 1rem; border-radius: var(--ww-radius-sm); font-weight: 600; font-size: var(--sl-text-sm); text-decoration: none; background: var(--ww-accent); color: var(--ww-on-accent); }
  .cta-aus { background: transparent; border: 1px dashed var(--ww-line); color: var(--ww-muted); font-weight: 500; }
  .vergleich h2, .artikel h2 { font-size: 1.25rem; font-weight: 600; margin: 0 0 1rem; color: var(--ww-text); }
  .vergleich table { width: 100%; border-collapse: collapse; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); overflow: hidden; background: var(--ww-surface); font-size: var(--sl-text-sm); }
  .vergleich th, .vergleich td { padding: 0.625rem 0.875rem; text-align: start; border-bottom: 1px solid var(--ww-line); vertical-align: top; }
  .vergleich thead th { background: var(--ww-surface-2); font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ww-muted); }
  .vergleich tbody th { color: var(--ww-text); font-weight: 600; }
  .vergleich tr:last-child :is(td, th) { border-bottom: 0; }
  .mono { letter-spacing: 0.1em; }
  @media (max-width: 40rem) {
    .vergleich thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .vergleich tr { display: block; padding: 0.5rem 0; border-bottom: 1px solid var(--ww-line); }
    .vergleich th, .vergleich td { display: flex; gap: 0.75rem; border: 0; padding: 0.3rem 0.875rem; }
    .vergleich :is(th, td)::before { content: attr(data-label); flex: 0 0 5.5rem; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ww-muted); }
    .pro-contra { grid-template-columns: 1fr; }
  }
  .artikel ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
  .artikel li { padding: 0.75rem 1rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius-sm); background: var(--ww-surface); }
  .artikel a { color: var(--ww-text); font-weight: 600; text-decoration: none; }
  .artikel a:hover { color: var(--ww-accent); }
  .artikel .bald { opacity: 0.7; }
  .bald-tag { font-style: normal; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ww-muted); margin-inline-start: 0.5rem; }
  .affiliate-hinweis { margin: 0; font-size: var(--sl-text-xs); color: var(--ww-muted); border-top: 1px dashed var(--ww-line); padding-top: 1rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
```

**`BlogListe.astro`:** `<li class="reveal" style=…>` → `<li>`; `<style>`:
```css
<style>
  .blogliste { list-style: none; margin: 1.5rem 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
  .post { display: flex; flex-direction: column; gap: 0.5rem; height: 100%; padding: 1.125rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); color: inherit; text-decoration: none; }
  .post:hover, .post:focus-visible { border-color: var(--ww-accent); }
  .post-kopf { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .serie { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--ww-accent); color: var(--ww-accent); }
  .meta { font-size: 0.75rem; color: var(--ww-muted); }
  .post-titel { font-weight: 600; font-size: 1.0625rem; line-height: 1.3; color: var(--ww-text); }
  .post-text { font-size: var(--sl-text-sm); color: var(--ww-muted); line-height: 1.5; }
  .post-fuss { margin-top: auto; padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .post-cta { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600; font-size: var(--sl-text-sm); color: var(--ww-accent); }
  .play { width: 1rem; height: 1rem; }
</style>
```

**`Mitglied.astro`:** `kompakt` prop'unu ve tüm `.kompakt` kurallarını sil (`interface Props {}` → prop yok; `<div class="mitglied">`); `class="vorteil reveal"` → `class="vorteil"`, `style` kaldır; `btn-primary magnet` → `ww-btn ww-btn-fill`; `<style>`:
```css
<style>
  .mitglied { display: grid; gap: 1.5rem; }
  .vorteile { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
  .vorteil { display: flex; flex-direction: column; gap: 0.375rem; padding: 1.125rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); }
  .vorteil-icon { width: 2.25rem; height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--ww-radius-sm); background: var(--ww-accent-soft); color: var(--ww-accent); margin-bottom: 0.25rem; }
  .vorteil-icon :global(svg) { width: 1.25rem; height: 1.25rem; }
  .vorteil-titel { font-weight: 600; font-size: 1.0625rem; color: var(--ww-text); }
  .vorteil-text { font-size: var(--sl-text-sm); color: var(--ww-muted); line-height: 1.5; }
  .formular { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--ww-line); border-radius: var(--ww-radius); background: var(--ww-surface); }
  .reihe { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }
  .feld { display: grid; gap: 0.3rem; font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .feld input, .feld select { padding: 0.625rem 0.75rem; border-radius: var(--ww-radius-sm); border: 1px solid var(--ww-line); background: var(--ww-bg); color: var(--ww-text); font: inherit; }
  .feld input:focus, .feld select:focus { outline: 2px solid var(--ww-accent); outline-offset: 2px; }
  .einwilligung { display: flex; gap: 0.6rem; align-items: flex-start; font-size: var(--sl-text-xs); color: var(--ww-muted); line-height: 1.5; }
  .einwilligung input { margin-top: 0.2rem; accent-color: var(--ww-accent); }
  .einwilligung a { color: var(--ww-accent); }
  .aktion { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
  .doi { font-size: var(--sl-text-xs); color: var(--ww-muted); max-width: 36ch; }
  .bald { display: grid; gap: 0.75rem; padding: 1.125rem; border: 1px dashed var(--ww-line); border-radius: var(--ww-radius); }
  .bald p { margin: 0; color: var(--ww-muted); line-height: 1.5; }
</style>
```

**`Footer.astro`:** `import Kanaele` satırını sil; `<script>` (Reveal) bloğunu tamamen sil; `.ww-fuss-name` içindeki `<span class="ww-fuss-logo" …></span>` kaldır ve `wattwas` → `watt<b>was</b>`; `<style>`:
```css
<style>
  .ww-fuss { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--ww-line); font-size: var(--sl-text-sm); color: var(--ww-muted); }
  .ww-fuss-raster { display: grid; gap: 2rem; grid-template-columns: 1fr; }
  @media (min-width: 50rem) { .ww-fuss-raster { grid-template-columns: 2fr 1fr 1fr; } }
  .ww-fuss-name { margin: 0; font-weight: 800; color: var(--ww-text); font-size: 1.1875rem; letter-spacing: -0.02em; }
  .ww-fuss-name b { color: var(--ww-accent); }
  .ww-fuss-claim { margin: 0.375rem 0 0; color: var(--ww-text); font-weight: 500; }
  .ww-fuss-kostenlos { margin: 0.375rem 0 0.75rem; max-width: 44ch; line-height: 1.5; }
  .ww-fuss-titel { margin: 0 0 0.5rem; font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ww-muted); }
  .ww-fuss ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.375rem 0.875rem; }
  .ww-fuss ul.spalte { flex-direction: column; gap: 0.3rem; }
  .ww-fuss a { color: var(--ww-muted); text-decoration: none; }
  .ww-fuss a:hover { color: var(--ww-accent); }
  .ww-fuss a[aria-current='page'] { color: var(--ww-text); font-weight: 600; }
  .ww-fuss-hinweis { margin: 2rem 0 0; padding: 0.75rem 1rem; border: 1px dashed var(--ww-line); border-radius: var(--ww-radius-sm); font-size: var(--sl-text-xs); line-height: 1.5; }
</style>
```

- [ ] **Step 3: Übergangs-Aliase löschen** — `wattwas.css` sonundaki `/* ÜBERGANG … */` yorumu ve altındaki `:root { --ww-amber: … }` satırını sil.

- [ ] **Step 4: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && grep -rn "reveal\|magnet\|ww-amber\|ww-grad\|ww-cyan\|ww-orange\|kompakt" src/components src/styles astro.config.mjs | head; npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: grep boş, `Hepsi geçti (109)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/components src/styles/wattwas.css scripts/check-site.mjs && git commit -q -m "style(d1): Lernpfad, Themen, Werkzeuge, Blog-Liste, Mitglied, Footer auf D1-Tokens; Reveal/Magnet-Effekte und Level-Zähler entfernt; Übergangs-Aliase gelöscht

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 12: Rückbau, Datenschutz, Doku

**Files:**
- Create: `scratch/ui-aufraeumen.mjs`
- Modify: `src/data/startseite-ui.json`, `src/content/docs/de/rechtliches/datenschutz.mdx:21`, `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` (Abschnitt 14), `ROADMAP.md:6`
- Test: `scripts/check-site.mjs`

- [ ] **Step 1: Testler**

```js
  // TP1 · Task 12
  ['Datenschutz: Stufe (ww-stufe) und Lesefortschritt als localStorage genannt', () => read('de/rechtliches/datenschutz').includes('ww-stufe') && read('de/rechtliches/datenschutz').includes('Lesefortschritt')],
  ['UI-Strings: keine toten Startseiten-Schlüssel mehr (kicker, folgeTitel, community…, videos)', () => Object.values(uiJson).every((t) => ['kicker', 'ctaSocialTitel', 'heroBildLabel', 'saeulenTitel', 'folgeEyebrow', 'folgeTitel', 'folgeUntertitel', 'bald', 'themenEyebrow', 'themenTitel', 'themenUntertitel', 'themenAlle', 'themen', 'lernpfadEyebrow', 'lernpfadTitel', 'lernpfadUntertitel', 'anleitungenEyebrow', 'anleitungenTitel', 'anleitungenUntertitel', 'werkzeugEyebrow', 'werkzeugTitel', 'werkzeugUntertitel', 'werkzeugCta', 'unterstuetzenTitel', 'unterstuetzenText', 'communityEyebrow', 'communityTitel', 'communityText', 'communityPlatzhalter', 'communityCta', 'communityBald', 'communityDatenschutz', 'kanalCta', 'stufeLabel'].every((k) => !(k in t)))],
```

- [ ] **Step 2: `scratch/ui-aufraeumen.mjs`** (Write) + çalıştır

```js
// Einmalig (TP1 Task 12): tote UI-Schlüssel der alten Startseite aus allen Locales entfernen. Vorher prüfen, dass keine Komponente sie nutzt.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const TOT = ['kicker', 'ctaSocialTitel', 'heroBildLabel', 'saeulenTitel', 'folgeEyebrow', 'folgeTitel', 'folgeUntertitel', 'bald', 'themenEyebrow', 'themenTitel', 'themenUntertitel', 'themenAlle', 'themen', 'lernpfadEyebrow', 'lernpfadTitel', 'lernpfadUntertitel', 'anleitungenEyebrow', 'anleitungenTitel', 'anleitungenUntertitel', 'werkzeugEyebrow', 'werkzeugTitel', 'werkzeugUntertitel', 'werkzeugCta', 'unterstuetzenTitel', 'unterstuetzenText', 'communityEyebrow', 'communityTitel', 'communityText', 'communityPlatzhalter', 'communityCta', 'communityBald', 'communityDatenschutz', 'kanalCta', 'stufeLabel'];
const quell = readdirSync('src/components').filter((n) => n.endsWith('.astro')).map((n) => readFileSync(`src/components/${n}`, 'utf8')).join('\n');
const benutzt = TOT.filter((k) => new RegExp(`\\bt\\.${k}\\b`).test(quell));
if (benutzt.length) { console.error('Noch benutzt:', benutzt.join(', ')); process.exit(1); }
const F = 'src/data/startseite-ui.json';
const ui = JSON.parse(readFileSync(F, 'utf8'));
for (const t of Object.values(ui)) for (const k of TOT) delete t[k];
writeFileSync(F, JSON.stringify(ui, null, 2) + '\n');
console.log('ok');
```

```bash
cd /c/Users/kadir/Projects/Elektrolehre && node scratch/ui-aufraeumen.mjs
```
`Noch benutzt:` çıkarsa o anahtarı listeden çıkar (bileşen gerçekten kullanıyor) ve testteki listeyi de aynı şekilde küçült.

- [ ] **Step 3: Datenschutz (de)** — satır 21'i şununla değiştir:
```md
- Ebenso lokal im **localStorage**: welche Seiten du bereits geöffnet hast (Lesefortschritt, „Zuletzt gelesen“ unter Entdecken), deine gewählte Stufe (`ww-stufe`) und ob du den Stufen-Hinweis ausgeblendet hast (`ww-stufe-hinweis`). Keine Übertragung, jederzeit über die Browserdaten löschbar.
```

- [ ] **Step 4: Spec-Anhang** — `docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md` sonuna ekle:
```md

## 14. Abweichungen im Plan TP1 (12. Sep 2026)

1. **Stufen-Badges** in der Seitenleiste werden per Route-Middleware (`src/routeData.ts`) aus `stufe` abgeleitet, nicht doppelt als `sidebar.badge` im Frontmatter gepflegt – gleiche Wirkung, kein Drift möglich (Test: 12 Badges, Klasse = Stufe).
2. **Helle Tokens korrigiert** (WCAG AA gemessen): Akzent `#1A5FD0` statt `#1F6FEB`, Einstieg `#15803D` statt `#1F9D55`, Sicherheit `#C43C3C` statt `#D64545`; Text auf gefülltem Button dunkel `#121417`, hell `#FFFFFF`.
3. **Entdecken „Empfohlen“**: es wird nur der Block der gewählten Stufe gezeigt (CSS), die anderen sind über den Filter „Stufe“ erreichbar – statt Umsortierung aller drei Blöcke (Mockup D1 zeigt einen Block).
4. **Marken & Modelle-Tab** erst mit TP2 (`tabs.json → aktiv`), Wörterbuch-/Marken-Karten nur, wenn die Seite existiert.
5. **Chip-Labels** Azubi/Profi bleiben in allen Sprachen deutsch (Fachbegriff-Regel), nur „Start“ wird übersetzt; die Legende erklärt alles in der jeweiligen Sprache.
6. **Lernpfad**: „LVL“-Zähler entfernt (Nicht-Ziel: keine Gamification über Lesefortschritt hinaus); Reveal-/Magnet-Effekte entfernt (ruhiges Bild, reduced-motion).
7. **Sichtbarkeit** auch für Prosa: Sätze über Kurzvideos/Kanäle in Über, EGT-Übersicht und Blog-Index entfernt (8 Locales); Mitglied-Texte („Videos zuerst“) bleiben als Zukunftsversprechen.
8. **Startseite-H1** ist die Wortmarke (Hero-Override), Claim/Stufenwahl/Sprachen/Button in `Startseite.astro`.
9. **Lernen**: Karte „Anleitungen“ verlinkt die EGT-Übersicht und listet die drei Anleitungen direkt (kein Anker, da Überschriften je Locale anders heißen).
10. **Stufen-Wahl** im Header als `<details>`-Popover (funktioniert ohne JS zum Öffnen); Hinweis-Leiste, Chip, Karte teilen `src/scripts/stufe.ts`.
```

- [ ] **Step 5: ROADMAP** — satır 6'nın başındaki `Son güncelleme: …` cümlesinin önüne ekle (aynı satırda):
`Son güncelleme: 12 Eyl 2026 akşam — **TP1 Fundament (Neuaufbau, branch tp1-fundament) kodlandı, push yok**: D1 katalog düzeni (grafit + Elektro-Blau, koyu varsayılan, yalnız Inter), Header (tabs, Strg K, Stufen-Chip), Sidebar rozetleri, Stufen einstieg/azubi/profi, boş Startseite, /entdecken/ + /lernen/ (9 dil), sosyal/video gizli; ≈ 111 test. Kadir'in görsel onayı bekleniyor (Task 13). Önceki: ` (mevcut metin devam eder).

- [ ] **Step 6: Build + test + commit**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && npm run build --silent 2>&1 | tail -2 && node scripts/check-site.mjs | grep -E "^FAIL|Hepsi|başarısız"
```
Beklenen: `Hepsi geçti (111)`.

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add src/data/startseite-ui.json src/content/docs/de/rechtliches/datenschutz.mdx docs/superpowers/specs/2026-09-12-wattwas-neuaufbau-design.md ROADMAP.md scripts/check-site.mjs && git commit -q -m "chore(tp1): tote UI-Schlüssel entfernt, Datenschutz (Stufe im localStorage), Spec-Abschnitt 14 Abweichungen, ROADMAP

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -1
```

---

### Task 13: Screenshots de/tr/ar/leicht + Kadirs Blick

**Files:**
- Modify: `scratch/screens.cjs` (THEME/STUFE env)
- Create: `docs/superpowers/specs/screens/2026-09-12-tp1/*.png` (≤ 10 PNG, committed)

- [ ] **Step 1: `scratch/screens.cjs`** — `launchPersistentContext` satırından sonra ekle:
```js
  // THEME=light → helles Design; STUFE=azubi|profi → gewählte Stufe (localStorage vor dem Laden)
  const theme = process.env.THEME, stufe = process.env.STUFE;
  if (theme || stufe) await ctx.addInitScript(({ theme, stufe }) => { if (theme) localStorage.setItem('starlight-theme', theme); if (stufe) { localStorage.setItem('ww-stufe', stufe); } }, { theme, stufe });
```

- [ ] **Step 2: Sunucu + görüntüler**

```bash
cd /c/Users/kadir/Projects/Elektrolehre/dist && (python -m http.server 8766 --bind 127.0.0.1 > /dev/null 2>&1 &) && sleep 1 && cd .. && OUT=docs/superpowers/specs/screens/2026-09-12-tp1 UDD="$TEMP/ww-udd" JOBS='[{"url":"/de/","name":"1-start-de","sizes":[[1440,900],[390,844]],"full":false},{"url":"/de/entdecken/","name":"2-entdecken-de","sizes":[[1440,900],[390,844]],"full":false},{"url":"/de/grundlagen/schutzorgane/","name":"3-artikel-de","sizes":[[1440,900]],"full":false},{"url":"/tr/entdecken/","name":"4-entdecken-tr","sizes":[[1440,900]],"full":false},{"url":"/ar/entdecken/","name":"5-entdecken-ar","sizes":[[1440,900]],"full":false},{"url":"/leicht/","name":"6-start-leicht","sizes":[[1440,900]],"full":false}]' node scratch/screens.cjs && OUT=docs/superpowers/specs/screens/2026-09-12-tp1 UDD="$TEMP/ww-udd-hell" THEME=light STUFE=azubi JOBS='[{"url":"/de/entdecken/","name":"7-entdecken-hell-azubi","sizes":[[1440,900]],"full":false},{"url":"/de/grundlagen/schutzorgane/","name":"8-artikel-hell-azubi","sizes":[[1440,900]],"full":false}]' node scratch/screens.cjs && ls docs/superpowers/specs/screens/2026-09-12-tp1
```
Beklenen: 10 PNG. (Playwright CLI `--user-data-dir` ile asılır; kütüphane yolu `scratch/screens.cjs` içinde sabit — npx cache silinmişse `npx playwright --version` ile yeniden doldur.)

- [ ] **Step 3: Görüntüleri incele (Read ile PNG aç), açık kusurları düzelt**

Kontrol listesi: header 52 px, tabs + arama sağda + chip; sidebar 250 px, aktif satırda mavi çubuk, rozetler sağda; Entdecken banner + 2 sütun kart; mobilde tek sütun, Filter chip, hamburger; ar'da çubuk sağda (`inset-inline-start`); açık temada kontrast; Startseite ortalanmış. Küçük CSS düzeltmelerini `wattwas.css`'e ekle, build + test + yeniden görüntü.

- [ ] **Step 4: Commit + Kadir**

```bash
cd /c/Users/kadir/Projects/Elektrolehre && git add docs/superpowers/specs/screens/2026-09-12-tp1 scratch/screens.cjs 2>/dev/null; git add docs/superpowers/specs/screens/2026-09-12-tp1 && git commit -q -m "docs(tp1): Screenshots D1 – Startseite, Entdecken, Artikel (de/tr/ar/leicht, dunkel + hell)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git log --oneline -3
```
(`scratch/` gitignored → yalnız PNG'ler commit'lenir.)

Ana oturum: PNG'leri `SendUserFile` ile Kadir'e gönder, 3 satırlık özet yaz (ne değişti, ne bekleniyor: „ok“ → `neuaufbau`'ya merge, push için ayrıca söz). Push YOK.

---

## Self-Review (yazarın kontrolü, 12 Eyl 2026)

- **Spec kapsamı (TP1 satırı §12):** D1 tokens → T2 · Overrides Header/Sidebar/PageFrame/Search(CSS)/Theme → T4, T5, T2 · Stufen (Frontmatter T1, Wahl T7, Chip T4, Hinweis T6, Leiste T5) · Startseite-Platzhalter T7 · `/entdecken/` T9 · `/lernen/` T10 · Sichtbarkeitsregeln T8 · Sidebar-Badges T5 · Tests her görevde · Screenshots T13 · Rückbau (Startseite/Hero/HeroLinie/Kanaele-Pills/Lernpfad-Startseite) T7, T8, T11, T12 · §3.2 Geselle-Kasten T5 · §4.2 tipografi/ölçüler T2 · §4.4 responsive/RTL/a11y T2+T4+T5 (mantıksal özellikler), T13 kontrol · §9.3 Datenschutz TP4'e ait, TP1 yalnız localStorage notu (T12).
- **Placeholder taraması:** "TBD/TODO/später" yok; her adımda kod var. Çeviriler inline (T3), mockup'a bağlı görsel düzeltmeler T13'te açık liste.
- **Tip/isim tutarlılığı:** `setzeStufe`/`hinweisAus` (T4) ↔ StufenLeiste/StufenWahl (T5/T7); `istKatalog`/`istRechtliches`/`ohneLocale` (T5) ↔ GeselleKasten/PageFrame/Sidebar; `t.stufen`, `t.entdecken.*`, `t.lernen.karten[].id` (T3) ↔ T4–T10; `entdecken.json → bereiche` (T9) ↔ Lernen (T10); `class="ww-karte karte"` (Karte, T9) ↔ testler; `.sl-badge default ww-stufe stufe-<s>` (T5) ↔ CSS (T2) ↔ test T10; `data-stufe-gewaehlt` (T4 ThemeProvider + stufe.ts) ↔ CSS (T5 Leiste, T7 Wahl).
- **Test sayısı:** 83 → T1 +4 (87) → T2 +2 −1 (88) → T3 +2 (90) → T4 +5 (95) → T5 +6 −1 (100) → T6 +3 −1 (102) → T7 +4 −8 (98) → T8 +3 (101) → T9 +6 (107) → T10 +1 (108) → T11 +1 (109) → T12 +2 (111). Beklenen sayılar adımlarda; sapma olursa nedenini yaz, sayıyı düzelt, 83'ün altına inme.
