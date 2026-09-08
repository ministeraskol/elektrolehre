# Elektrolehre Faz 0 — İskelet ve Kanıt: Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Astro 7 + Starlight ile 8 dilli iskeleti kurmak, bir tam Almanca makaleyi (Unterverteilung) TR ve AR çevirisiyle yayınlamak ve GitHub Pages'te `noindex` ile canlıya almak.

**Architecture:** Statik site; içerik `src/content/docs/<dil>/*.mdx`, Almanca kaynak, eksik çeviri Starlight fallback'iyle Almanca + band. Özel bileşenler (Sicherheit, Quiz, Quellen, Übersetzungshinweis, şema SVG) MDX içinden veya `MarkdownContent` override'ı ile gelir. Build sonrası `scripts/check-site.mjs` `dist/` üzerinde HTML doğrulamaları yapar (test katmanı).

**Tech Stack:** Node 26, Astro 7.3.x, @astrojs/starlight 0.42.x, sharp, GitHub Actions (withastro/action@v6, actions/deploy-pages@v5), gh CLI.

**Spec:** `docs/superpowers/specs/2026-09-08-elektrolehre-design.md`

## Global Constraints

- Diller ve kodlar: `de` (kaynak, defaultLocale), `en`, `tr`, `ru`, `ar` (rtl), `fa` (rtl), `ka`, `sq`. Tümü ön ekli (`/de/...`), `root` locale YOK.
- Almanca Fachbegriff çeviride Almanca kalır; yerel karşılık yanına yazılır.
- `site: 'https://ministeraskol.github.io'`, `base: '/elektrolehre'`.
- `noindex, nofollow` meta her sayfada; config'te tek sabit `NOINDEX = true`.
- Front matter şeması: `translated: 'source' | 'machine' | 'reviewed'` (default `source`), `sources: {title, url}[]` (default `[]`), `lernfeld?: number[]`, `stufe?: 'einstieg' | 'azubi'`.
- Zod importu `astro/zod` (Starlight dokümanı, 8 Eyl 2026).
- 0 €: ücretli paket, servis, alan adı yok.
- Commit mesajları sonunda: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- Proje klasörü: `C:\Users\kadir\Projects\Elektrolehre` (ROADMAP.md ve docs/ zaten var).

---

### Task 1: Proje iskeleti, 8 dil, test betiği

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `public/favicon.svg`
- Create: `src/content.config.ts`
- Create: `src/content/docs/de/index.mdx`, `src/content/docs/de/anleitungen/unterverteilung.mdx` (geçici kısa içerik)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Produces: `npm run build` → `dist/`; `npm test` → `dist/` doğrulaması. Front matter alanları `translated`, `sources`, `lernfeld`, `stufe` (Task 2 bileşenleri bunları okur).

- [ ] **Step 1: Test betiğini yaz (önce başarısız olacak)**

`scripts/check-site.mjs`:

```js
// dist/ üzerinde HTML doğrulamaları. Kullanım: npm run build && npm test
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const page = (p) => join(dist, p, 'index.html');
const read = (p) => readFileSync(page(p), 'utf8');
const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? htmlFiles(f) : n.endsWith('.html') ? [f] : [];
  });

const kaJson = fileURLToPath(new URL('../src/content/i18n/ka.json', import.meta.url));
const kaBand = existsSync(kaJson)
  ? JSON.parse(readFileSync(kaJson, 'utf8'))['i18n.untranslatedContent']
  : 'This content is not available in your language yet.';

const ARTIKEL = 'anleitungen/unterverteilung';

export const checks = [
  ['dist var', () => existsSync(dist)],
  ['de Startseite üretildi', () => existsSync(page('de'))],
  ['de Unterverteilung üretildi', () => existsSync(page(`de/${ARTIKEL}`))],
  ['de sayfa lang="de"', () => /<html[^>]*lang="de"/.test(read(`de/${ARTIKEL}`))],
  ['ar sayfa dir="rtl"', () => /<html[^>]*dir="rtl"/.test(read(`ar/${ARTIKEL}`))],
  ['fa sayfa dir="rtl"', () => /<html[^>]*dir="rtl"/.test(read(`fa/${ARTIKEL}`))],
  ['ka fallback sayfası üretildi', () => existsSync(page(`ka/${ARTIKEL}`))],
  ['ka fallback bandı görünüyor', () => read(`ka/${ARTIKEL}`).includes(kaBand)],
  ['hreflang >= 8 (de makale)', () => (read(`de/${ARTIKEL}`).match(/hreflang="/g) || []).length >= 8],
  ['dil seçici >= 8 seçenek', () => (read(`de/${ARTIKEL}`).match(/<option/g) || []).length >= 8],
  ['base yolu /elektrolehre/ kullanılıyor', () => read('de').includes('/elektrolehre/')],
  ['kök / → /elektrolehre/de/ yönlendirmesi', () =>
    existsSync(join(dist, 'index.html')) && readFileSync(join(dist, 'index.html'), 'utf8').includes('/elektrolehre/de/')],
  ['noindex her sayfada', () =>
    htmlFiles(dist).every((f) => /name="robots"[^>]*content="noindex/.test(readFileSync(f, 'utf8')))],
];

let fail = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try { ok = Boolean(fn()); } catch { ok = false; }
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
  if (!ok) fail++;
}
console.log(fail === 0 ? `\nHepsi geçti (${checks.length}).` : `\n${fail} kontrol başarısız.`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd ~/Projects/Elektrolehre && node scripts/check-site.mjs`
Expected: `FAIL dist var` ve diğerleri FAIL; exit 1.

- [ ] **Step 3: package.json, tsconfig, .gitignore, favicon**

`package.json`:
```json
{
  "name": "elektrolehre",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "node scripts/check-site.mjs"
  }
}
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.env
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0f4c81"/><path d="M18 3 8 18h7l-1 11 10-15h-7z" fill="#ffd23f"/></svg>
```

Run: `cd ~/Projects/Elektrolehre && npm install astro@latest @astrojs/starlight@latest sharp@latest`
Expected: `node_modules/` oluşur, `package.json` dependencies dolar, hata yok.

- [ ] **Step 4: astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Impressum + Datenschutz yayınlanınca false yapılır (Faz 3). Başka yerde tekrar etme.
const NOINDEX = true;

export default defineConfig({
  site: 'https://ministeraskol.github.io',
  base: '/elektrolehre',
  integrations: [
    starlight({
      title: 'Elektrolehre',
      description: 'Elektrotechnik von null an – für die Ausbildung zum Elektroniker.',
      defaultLocale: 'de',
      locales: {
        de: { label: 'Deutsch', lang: 'de' },
        en: { label: 'English', lang: 'en' },
        tr: { label: 'Türkçe', lang: 'tr' },
        ru: { label: 'Русский', lang: 'ru' },
        ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
        fa: { label: 'فارسی', lang: 'fa', dir: 'rtl' },
        ka: { label: 'ქართული', lang: 'ka' },
        sq: { label: 'Shqip', lang: 'sq' },
      },
      sidebar: [
        {
          label: 'Anleitungen',
          translations: {
            en: 'Guides', tr: 'Uygulama rehberleri', ru: 'Инструкции', ar: 'إرشادات عملية',
            fa: 'راهنماهای عملی', ka: 'ინსტრუქციები', sq: 'Udhëzime',
          },
          autogenerate: { directory: 'anleitungen' },
        },
      ],
      head: NOINDEX
        ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }]
        : [],
      lastUpdated: true,
    }),
  ],
});
```

- [ ] **Step 5: src/content.config.ts (genişletilmiş şema + i18n koleksiyonu)**

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // source: Almanca kaynak · machine: AI/makine çevirisi · reviewed: anadil kontrolünden geçti
        translated: z.enum(['source', 'machine', 'reviewed']).default('source'),
        sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
        lernfeld: z.array(z.number().int().min(1).max(13)).optional(),
        stufe: z.enum(['einstieg', 'azubi']).optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
```

- [ ] **Step 6: Geçici Almanca sayfalar**

`src/content/docs/de/index.mdx`:
```mdx
---
title: Elektrolehre
description: Elektrotechnik von null an lernen – für Azubis, Einsteiger und Neugierige. Kostenlos, in acht Sprachen, immer mit den deutschen Fachbegriffen.
template: splash
hero:
  tagline: Elektrotechnik von null an – für die Ausbildung zum Elektroniker für Energie- und Gebäudetechnik. Kostenlos, in acht Sprachen, immer mit den deutschen Fachbegriffen.
  actions:
    - text: Erste Anleitung lesen
      link: /de/anleitungen/unterverteilung/
      icon: right-arrow
---
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid stagger>
  <Card title="Beruf" icon="open-book">Ausbildung, Lernfelder, Vergütung, Weiterbildung – was dich als Elektroniker erwartet.</Card>
  <Card title="Grundlagen" icon="information">Strom, Spannung, Widerstand, Netzformen, Schutzorgane, die fünf Sicherheitsregeln.</Card>
  <Card title="Anleitungen" icon="setting">Schritt für Schritt: Unterverteilung, Zählerplatz, Wechselschaltung.</Card>
</CardGrid>
```

`src/content/docs/de/anleitungen/unterverteilung.mdx` (Task 3'te tam içerikle değişir):
```mdx
---
title: Unterverteilung aufbauen
description: Stromkreisverteiler planen, aufbauen, verdrahten und prüfen – Schritt für Schritt.
translated: source
sources:
  - { title: "DIN VDE 0100-410:2018-10 – Schutz gegen elektrischen Schlag", url: "https://www.vde-verlag.de/standards/0100481/din-vde-0100-410-vde-0100-410-2018-10.html" }
lernfeld: [2, 5]
stufe: azubi
---

Inhalt folgt.
```

- [ ] **Step 7: Build + test**

Run: `cd ~/Projects/Elektrolehre && npm run build && npm test`
Expected: build hatasız; tüm kontroller `OK` (ka fallback bandı İngilizce varsayılan metinle). Başarısız olan varsa:
- `dir="rtl"` yoksa → `locales.ar.dir` yazımını kontrol et.
- kök yönlendirme yoksa → `dist/index.html` içeriğine bak; Starlight kök sayfayı `/elektrolehre/de/`'ye yönlendirmeli.
- Hero `href` değerini kontrol et: `grep -o 'href="[^"]*unterverteilung[^"]*"' dist/de/index.html`. `/elektrolehre/de/...` bekleniyor. `/de/...` çıkarsa link'i `/elektrolehre/de/anleitungen/unterverteilung/` yap; `/elektrolehre/elektrolehre/...` çıkarsa link'i `/de/...` bırak (zaten öyle).

- [ ] **Step 8: Git başlat ve commit**

```bash
cd ~/Projects/Elektrolehre && git init -b main && git add -A && git commit -m "feat: Astro+Starlight iskeleti, 8 dil, noindex, dist doğrulama betiği

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Bileşenler — Sicherheit, Quiz, Quellen, Übersetzungshinweis, MarkdownContent override

**Files:**
- Create: `src/components/Sicherheit.astro`, `src/components/Quiz.astro`, `src/components/Quellen.astro`, `src/components/Uebersetzungshinweis.astro`, `src/components/MarkdownContent.astro`
- Modify: `astro.config.mjs` (components override)
- Modify: `src/content/docs/de/anleitungen/unterverteilung.mdx` (bileşenleri kullan)
- Test: `scripts/check-site.mjs` (yeni kontroller)

**Interfaces:**
- Consumes: front matter `translated`, `sources` (Task 1 şeması); `Astro.currentLocale`.
- Produces: `<Sicherheit />` (prop yok), `<Quiz fragen={[{ f: string, a: string[], r: number, e?: string }]} />`, `<Quellen quellen={{title,url}[]} />`, `<Uebersetzungshinweis />`. HTML sınıfları: `.sicherheit`, `el-quiz.quiz`, `.quellen`, `.uebersetzungshinweis`.

- [ ] **Step 1: Test kontrollerini ekle**

`scripts/check-site.mjs` içinde `checks` dizisine ekle:
```js
  ['Sicherheit bloğu makalede', () => read(`de/${ARTIKEL}`).includes('class="sicherheit')],
  ['Quiz bileşeni makalede', () => read(`de/${ARTIKEL}`).includes('<el-quiz')],
  ['Quellen listesi makalede', () => read(`de/${ARTIKEL}`).includes('class="quellen')],
  ['de makalede çeviri notu YOK', () => !read(`de/${ARTIKEL}`).includes('uebersetzungshinweis')],
```

- [ ] **Step 2: Çalıştır, yeni kontrollerin FAIL olduğunu gör**

Run: `npm run build && npm test` → 4 yeni kontrol FAIL.

- [ ] **Step 3: Sicherheit.astro**

```astro
---
// 5 Sicherheitsregeln (DIN VDE 0105-100) + yasal not. Her Anleitung'un başına konur.
// Almanca terimler her dilde Almanca kalır; yerel karşılık yanında.
const texte: Record<string, { titel: string; intro: string; regeln: string[]; recht: string }> = {
  de: {
    titel: 'Sicherheit zuerst',
    intro: 'An elektrischen Anlagen dürfen nur Elektrofachkräfte selbstständig arbeiten (DGUV Vorschrift 3). In der Ausbildung arbeitest du immer unter Aufsicht. Vor jeder Arbeit gelten die fünf Sicherheitsregeln:',
    regeln: ['Freischalten', 'Gegen Wiedereinschalten sichern', 'Spannungsfreiheit feststellen', 'Erden und Kurzschließen', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken'],
    recht: 'Arbeiten am Hausanschluss und an der Messeinrichtung (Zähler) darf nur ein im Installateurverzeichnis des Netzbetreibers eingetragener Betrieb ausführen (§ 13 NAV). Diese Seite ersetzt keine Ausbildung.',
  },
  en: {
    titel: 'Safety first',
    intro: 'Only qualified electricians (Elektrofachkraft) may work on electrical installations independently (DGUV Vorschrift 3). As an apprentice you always work under supervision. Before any work, the five safety rules (fünf Sicherheitsregeln) apply:',
    regeln: ['Freischalten – disconnect completely', 'Gegen Wiedereinschalten sichern – secure against re-connection', 'Spannungsfreiheit feststellen – verify absence of voltage', 'Erden und Kurzschließen – earth and short-circuit', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken – cover or screen off adjacent live parts'],
    recht: 'Work on the service connection (Hausanschluss) and the meter (Zähler) may only be carried out by a company registered in the grid operator\'s installer directory (§ 13 NAV). This page does not replace training.',
  },
  tr: {
    titel: 'Önce güvenlik',
    intro: 'Elektrik tesisatlarında yalnız Elektrofachkraft (yetkili elektrik uzmanı) bağımsız çalışabilir (DGUV Vorschrift 3). Ausbildung boyunca her zaman gözetim altında çalışırsın. Her işten önce beş güvenlik kuralı (fünf Sicherheitsregeln) geçerlidir:',
    regeln: ['Freischalten – devreyi tamamen ayır', 'Gegen Wiedereinschalten sichern – yeniden açılmaya karşı emniyete al', 'Spannungsfreiheit feststellen – gerilim olmadığını ölçerek doğrula', 'Erden und Kurzschließen – toprakla ve kısa devre yap', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken – komşu gerilimli parçaları ört veya bariyerle ayır'],
    recht: 'Hausanschluss (bina bağlantısı) ve Zähler (sayaç) üzerindeki işleri yalnız şebeke işletmecisinin Installateurverzeichnis kaydındaki firma yapabilir (§ 13 NAV). Bu sayfa eğitimin yerini tutmaz.',
  },
  ar: {
    titel: 'السلامة أولاً',
    intro: 'لا يجوز العمل على المنشآت الكهربائية بشكل مستقل إلا للكهربائي المؤهل (Elektrofachkraft) وفق DGUV Vorschrift 3. خلال التدريب المهني (Ausbildung) تعمل دائماً تحت الإشراف. قبل أي عمل تُطبَّق قواعد السلامة الخمس (fünf Sicherheitsregeln):',
    regeln: ['Freischalten – افصل الدائرة كلياً', 'Gegen Wiedereinschalten sichern – أمِّن ضد إعادة التشغيل', 'Spannungsfreiheit feststellen – تأكد بالقياس من انعدام الجهد', 'Erden und Kurzschließen – أرِّض وقصِّر الدائرة', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken – غطِّ الأجزاء المجاورة الحية أو اعزلها بحاجز'],
    recht: 'العمل على وصلة المبنى (Hausanschluss) وعلى العداد (Zähler) مسموح فقط لشركة مسجَّلة في سجل المنفذين لدى مشغّل الشبكة (§ 13 NAV). هذه الصفحة لا تحل محل التدريب المهني.',
  },
};
const locale = Astro.currentLocale ?? 'de';
const t = texte[locale] ?? texte.de;
---
<aside class="sicherheit" aria-label={t.titel}>
  <p class="sicherheit-titel">⚠️ {t.titel}</p>
  <p>{t.intro}</p>
  <ol>{t.regeln.map((r) => <li>{r}</li>)}</ol>
  <p class="sicherheit-recht">{t.recht}</p>
</aside>
<style>
  .sicherheit { border: 1px solid var(--sl-color-red); border-inline-start-width: 5px; background: var(--sl-color-red-low); padding: 1rem 1.25rem; border-radius: 0.5rem; }
  .sicherheit-titel { font-weight: 700; color: var(--sl-color-red-high); margin: 0 0 0.5rem; }
  .sicherheit ol { margin: 0.5rem 0; padding-inline-start: 1.5rem; }
  .sicherheit p { margin: 0.5rem 0; }
  .sicherheit-recht { font-size: var(--sl-text-sm); color: var(--sl-color-gray-2); }
</style>
```

- [ ] **Step 4: Quiz.astro**

```astro
---
interface Frage { f: string; a: string[]; r: number; e?: string }
interface Props { fragen: Frage[] }
const { fragen } = Astro.props;
const ui: Record<string, { titel: string; richtig: string; falsch: string; loesung: string }> = {
  de: { titel: 'Teste dich', richtig: 'Richtig!', falsch: 'Leider falsch.', loesung: 'Richtige Antwort:' },
  en: { titel: 'Test yourself', richtig: 'Correct!', falsch: 'Not quite.', loesung: 'Correct answer:' },
  tr: { titel: 'Kendini test et', richtig: 'Doğru!', falsch: 'Yanlış.', loesung: 'Doğru cevap:' },
  ru: { titel: 'Проверь себя', richtig: 'Верно!', falsch: 'Неверно.', loesung: 'Правильный ответ:' },
  ar: { titel: 'اختبر نفسك', richtig: 'صحيح!', falsch: 'خطأ.', loesung: 'الإجابة الصحيحة:' },
  fa: { titel: 'خودت را بسنج', richtig: 'درست!', falsch: 'نادرست.', loesung: 'پاسخ درست:' },
  ka: { titel: 'გამოცადე თავი', richtig: 'სწორია!', falsch: 'არასწორია.', loesung: 'სწორი პასუხი:' },
  sq: { titel: 'Testo veten', richtig: 'Saktë!', falsch: 'Gabim.', loesung: 'Përgjigjja e saktë:' },
};
const locale = Astro.currentLocale ?? 'de';
const t = ui[locale] ?? ui.de;
---
<el-quiz class="quiz" data-richtig={t.richtig} data-falsch={t.falsch} data-loesung={t.loesung}>
  <p class="quiz-titel">🧠 {t.titel}</p>
  {fragen.map((q, i) => (
    <fieldset class="frage" data-r={q.r}>
      <legend>{i + 1}. {q.f}</legend>
      <div class="antworten">
        {q.a.map((a, j) => <button type="button" data-j={j}>{a}</button>)}
      </div>
      <p class="feedback" hidden></p>
      {q.e && <p class="erklaerung" hidden>{q.e}</p>}
    </fieldset>
  ))}
</el-quiz>

<script>
  class ElQuiz extends HTMLElement {
    connectedCallback() {
      const { richtig = '', falsch = '', loesung = '' } = this.dataset;
      this.querySelectorAll<HTMLFieldSetElement>('.frage').forEach((frage) => {
        const r = Number(frage.dataset.r);
        const buttons = Array.from(frage.querySelectorAll<HTMLButtonElement>('button'));
        const feedback = frage.querySelector<HTMLElement>('.feedback');
        const erkl = frage.querySelector<HTMLElement>('.erklaerung');
        buttons.forEach((btn) => {
          btn.addEventListener('click', () => {
            const ok = Number(btn.dataset.j) === r;
            buttons.forEach((b) => {
              b.disabled = true;
              if (Number(b.dataset.j) === r) b.classList.add('ist-richtig');
            });
            btn.classList.add(ok ? 'gewaehlt-richtig' : 'gewaehlt-falsch');
            if (feedback) {
              feedback.textContent = ok ? richtig : `${falsch} ${loesung} ${buttons[r]?.textContent ?? ''}`;
              feedback.hidden = false;
            }
            if (erkl) erkl.hidden = false;
          });
        });
      });
    }
  }
  if (!customElements.get('el-quiz')) customElements.define('el-quiz', ElQuiz);
</script>

<style>
  .quiz { display: block; border: 1px solid var(--sl-color-gray-5); border-radius: 0.5rem; padding: 1rem 1.25rem; }
  .quiz-titel { font-weight: 700; margin: 0 0 0.75rem; }
  .frage { border: 0; padding: 0; margin: 0 0 1.25rem; }
  .frage legend { font-weight: 600; margin-bottom: 0.5rem; }
  .antworten { display: grid; gap: 0.5rem; }
  .antworten button { text-align: start; padding: 0.6rem 0.9rem; border: 1px solid var(--sl-color-gray-4); border-radius: 0.4rem; background: var(--sl-color-gray-6); color: var(--sl-color-white); font: inherit; cursor: pointer; }
  .antworten button:hover:not(:disabled) { border-color: var(--sl-color-accent); }
  .antworten button:disabled { cursor: default; opacity: 0.85; }
  .antworten button.ist-richtig { border-color: var(--sl-color-green); background: var(--sl-color-green-low); }
  .antworten button.gewaehlt-falsch { border-color: var(--sl-color-red); background: var(--sl-color-red-low); }
  .feedback { margin: 0.5rem 0 0; font-weight: 600; }
  .erklaerung { margin: 0.25rem 0 0; color: var(--sl-color-gray-2); font-size: var(--sl-text-sm); }
</style>
```

- [ ] **Step 5: Quellen.astro ve Uebersetzungshinweis.astro**

`src/components/Quellen.astro`:
```astro
---
interface Props { quellen: { title: string; url: string }[] }
const { quellen } = Astro.props;
const titel: Record<string, string> = {
  de: 'Quellen', en: 'Sources', tr: 'Kaynaklar', ru: 'Источники', ar: 'المصادر', fa: 'منابع', ka: 'წყაროები', sq: 'Burimet',
};
const locale = Astro.currentLocale ?? 'de';
---
<section class="quellen">
  <h2 id="quellen">{titel[locale] ?? titel.de}</h2>
  <ul>
    {quellen.map((q) => <li><a href={q.url} rel="noopener" target="_blank">{q.title}</a></li>)}
  </ul>
</section>
<style>
  .quellen { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--sl-color-gray-5); font-size: var(--sl-text-sm); }
  .quellen h2 { font-size: var(--sl-text-lg); }
</style>
```

`src/components/Uebersetzungshinweis.astro`:
```astro
---
const text: Record<string, string> = {
  en: 'Machine-translated page. The German version is authoritative.',
  tr: 'Bu sayfa makine çevirisidir. Almanca sürüm bağlayıcıdır.',
  ru: 'Страница переведена автоматически. Немецкая версия является основной.',
  ar: 'هذه الصفحة مترجمة آلياً. النسخة الألمانية هي المرجع.',
  fa: 'این صفحه ترجمهٴ ماشینی است. نسخهٴ آلمانی مرجع است.',
  ka: 'ეს გვერდი მანქანურად არის ნათარგმნი. გერმანული ვერსია ავტორიტეტულია.',
  sq: 'Kjo faqe është përkthyer automatikisht. Versioni gjermanisht është përcaktues.',
};
const locale = Astro.currentLocale ?? 'de';
const t = text[locale];
---
{t && <p class="uebersetzungshinweis">🌐 {t}</p>}
<style>
  .uebersetzungshinweis { font-size: var(--sl-text-sm); color: var(--sl-color-gray-2); border: 1px dashed var(--sl-color-gray-4); border-radius: 0.4rem; padding: 0.4rem 0.75rem; }
</style>
```

- [ ] **Step 6: MarkdownContent.astro override + config**

`src/components/MarkdownContent.astro`:
```astro
---
import Default from '@astrojs/starlight/components/MarkdownContent.astro';
import Quellen from './Quellen.astro';
import Uebersetzungshinweis from './Uebersetzungshinweis.astro';
const data = Astro.locals.starlightRoute.entry.data as { translated?: string; sources?: { title: string; url: string }[] };
const quellen = data.sources ?? [];
---
<Default {...Astro.props}>
  {data.translated === 'machine' && <Uebersetzungshinweis />}
  <slot />
  {quellen.length > 0 && <Quellen quellen={quellen} />}
</Default>
```

`astro.config.mjs` → `starlight({ ... })` içine ekle:
```js
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
```

- [ ] **Step 7: Geçici makaleye bileşenleri koy**

`src/content/docs/de/anleitungen/unterverteilung.mdx` gövdesini şununla değiştir (front matter kalır):
```mdx
import Sicherheit from '../../../../components/Sicherheit.astro';
import Quiz from '../../../../components/Quiz.astro';

<Sicherheit />

## Was ist eine Unterverteilung?

Inhalt folgt.

<Quiz fragen={[
  { f: 'Welche Regel ist die erste der fünf Sicherheitsregeln?', a: ['Spannungsfreiheit feststellen', 'Freischalten', 'Erden und Kurzschließen'], r: 1, e: 'Reihenfolge: Freischalten, gegen Wiedereinschalten sichern, Spannungsfreiheit feststellen, erden und kurzschließen, benachbarte Teile abdecken.' },
]} />
```

- [ ] **Step 8: Build + test**

Run: `npm run build && npm test` → tüm kontroller OK. `Astro.currentLocale` `undefined` dönüyorsa (Sicherheit hep Almanca çıkarsa) bileşenlerde `Astro.currentLocale ?? Astro.locals.starlightRoute.locale ?? 'de'` kullan.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: Sicherheit, Quiz, Quellen, Übersetzungshinweis bileşenleri ve MarkdownContent override

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Almanca makale — Unterverteilung aufbauen + SVG şema

**Files:**
- Create: `src/components/schemata/UnterverteilungSchema.astro`
- Modify: `src/content/docs/de/anleitungen/unterverteilung.mdx` (tam içerik)
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `<Sicherheit />`, `<Quiz />` (Task 2).
- Produces: `<UnterverteilungSchema />` (prop yok; `<svg class="schema">`, `currentColor` ile tema uyumlu). Bu MDX dosyası TR/AR çevirilerinin kaynağı (Task 4).

- [ ] **Step 1: Test kontrolleri**

`checks` dizisine ekle:
```js
  ['de makalede >= 6 H2 başlık', () => (read(`de/${ARTIKEL}`).match(/<h2/g) || []).length >= 6],
  ['de makalede şema SVG', () => read(`de/${ARTIKEL}`).includes('class="schema')],
  ['de makalede Erstprüfung geçiyor', () => read(`de/${ARTIKEL}`).includes('Erstprüfung')],
  ['de makalede >= 5 quiz sorusu', () => (read(`de/${ARTIKEL}`).match(/class="frage"/g) || []).length >= 5],
```
Run: `npm run build && npm test` → 4 yeni FAIL.

- [ ] **Step 2: Şema bileşeni**

`src/components/schemata/UnterverteilungSchema.astro` — tek hat şeması (vereinfacht). Kutular `stroke="currentColor" fill="none"`, metin `fill="currentColor"`, `font-family: var(--sl-font-system)`. Yapı, yukarıdan aşağı:

```
Zuleitung vom Zählerschrank (Vorsicherung SLS 35 A)
        │
[Hauptschalter 4-polig 63 A]
        │
[Überspannungsschutz SPD Typ 2]
        │
   ┌────┴─────────────────────┐
[RCD 1 · 40 A / 30 mA · Typ A] [RCD 2 · 40 A / 30 mA · Typ A]
 ├ LS B16 Steckd. Küche        ├ LS B16 Steckd. Schlafen
 ├ LS B16 Steckd. Wohnen       ├ LS B10 Licht Wohnen
 ├ LS B10 Licht Bad/Flur       ├ LS B16 Spülmasch.
 └ LS B16 Waschmasch.          └ LS B16 3-pol. Herd
N-Leiter jeder RCD-Gruppe getrennt · PE auf gemeinsame PE-Klemme
Schema stark vereinfacht – Auswahl und Querschnitte immer nach Planung und Norm.
```

Kod (viewBox 0 0 800 420; RCD1 LS merkezleri x = 70, 160, 250, 340; RCD2 x = 460, 550, 640, 730; LS kutusu 84×44, y = 252; RCD kutuları 180×40, y = 182; Hauptschalter/SPD 200×36, x = 300, y = 50 / 106; bus y = 162 ve 242):

```astro
---
// Vereinfachtes Übersichtsschema einer Unterverteilung. Fachbegriffe bleiben in allen Sprachen deutsch.
const ls1 = [['70', 'LS B16', 'Steckd. Küche'], ['160', 'LS B16', 'Steckd. Wohnen'], ['250', 'LS B10', 'Licht Bad/Flur'], ['340', 'LS B16', 'Waschmasch.']];
const ls2 = [['460', 'LS B16', 'Steckd. Schlafen'], ['550', 'LS B10', 'Licht Wohnen'], ['640', 'LS B16', 'Spülmasch.'], ['730', 'LS B16', '3-pol. Herd']];
---
<figure class="schema-wrap" dir="ltr">
  <svg class="schema" viewBox="0 0 800 420" role="img" aria-labelledby="uv-title" xmlns="http://www.w3.org/2000/svg">
    <title id="uv-title">Übersichtsschema Unterverteilung: Zuleitung, Hauptschalter, SPD, zwei RCD-Gruppen mit je vier Leitungsschutzschaltern</title>
    <g fill="none" stroke="currentColor" stroke-width="2">
      <line x1="400" y1="30" x2="400" y2="50" />
      <rect x="300" y="50" width="200" height="36" rx="4" />
      <line x1="400" y1="86" x2="400" y2="106" />
      <rect x="300" y="106" width="200" height="36" rx="4" />
      <line x1="400" y1="142" x2="400" y2="162" />
      <line x1="200" y1="162" x2="600" y2="162" />
      <line x1="200" y1="162" x2="200" y2="182" />
      <line x1="600" y1="162" x2="600" y2="182" />
      <rect x="110" y="182" width="180" height="40" rx="4" />
      <rect x="510" y="182" width="180" height="40" rx="4" />
      <line x1="200" y1="222" x2="200" y2="242" />
      <line x1="600" y1="222" x2="600" y2="242" />
      <line x1="70" y1="242" x2="340" y2="242" />
      <line x1="460" y1="242" x2="730" y2="242" />
      {[...ls1, ...ls2].map(([x]) => (
        <g>
          <line x1={x} y1="242" x2={x} y2="252" />
          <rect x={Number(x) - 42} y="252" width="84" height="44" rx="4" />
        </g>
      ))}
    </g>
    <g fill="currentColor" font-size="12" text-anchor="middle" font-family="var(--sl-font-system)">
      <text x="400" y="22">Zuleitung vom Zählerschrank (Vorsicherung SLS 35 A)</text>
      <text x="400" y="73">Hauptschalter 4-polig 63 A</text>
      <text x="400" y="129">Überspannungsschutz SPD Typ 2</text>
      <text x="200" y="198">RCD 1 (FI) 4-polig</text>
      <text x="200" y="214" font-size="11">40 A / 30 mA · Typ A</text>
      <text x="600" y="198">RCD 2 (FI) 4-polig</text>
      <text x="600" y="214" font-size="11">40 A / 30 mA · Typ A</text>
      {[...ls1, ...ls2].map(([x, a, b]) => (
        <g>
          <text x={x} y="270" font-size="11" font-weight="600">{a}</text>
          <text x={x} y="286" font-size="10">{b}</text>
        </g>
      ))}
      <text x="400" y="340" font-size="12">N-Leiter jeder RCD-Gruppe getrennt führen · PE auf gemeinsame PE-Klemme</text>
      <text x="400" y="372" font-size="11" opacity="0.75">Schema stark vereinfacht – Auswahl und Querschnitte immer nach Planung und Norm</text>
    </g>
  </svg>
</figure>
<style>
  .schema-wrap { margin: 1.5rem 0; }
  .schema { width: 100%; height: auto; color: var(--sl-color-text); }
</style>
```

- [ ] **Step 3: Tam makale (Almanca, kaynak)**

`src/content/docs/de/anleitungen/unterverteilung.mdx`. Front matter:
```yaml
---
title: Unterverteilung aufbauen
description: Stromkreisverteiler planen, aufbauen, verdrahten und prüfen – Schritt für Schritt, wie in der Ausbildung.
translated: source
sources:
  - { title: "DIN VDE 0100-410:2018-10 – Schutz gegen elektrischen Schlag (RCD 30 mA)", url: "https://www.vde-verlag.de/standards/0100481/din-vde-0100-410-vde-0100-410-2018-10.html" }
  - { title: "DIN VDE 0100-600:2017-06 – Prüfungen (Erstprüfung)", url: "https://www.vde-verlag.de/p/normen/din-vde-0100-600-vde-0100-600-2017-06/0100382-DE-PR" }
  - { title: "DIN 18015 – Elektrische Anlagen in Wohngebäuden (Überblick Elektro+)", url: "https://www.elektro-plus.com/sicherheit/elektroinstallation-in-wohngebaeuden/normen-richtlinien-und-vorgaben" }
  - { title: "VDE-AR-N 4100:2026-04 – Technische Anschlussregel Niederspannung (Zählerplatz, SLS)", url: "https://www.vde-verlag.de/standards/0100932/vde-ar-n-4100-anwendungsregel-2026-04.html" }
  - { title: "Die fünf Sicherheitsregeln (BG ETEM, DIN VDE 0105-100)", url: "https://www.bgetem.de/arbeitssicherheit-gesundheitsschutz/praeventionskampagnen/5-sicherheitsregeln/die-5-sicherheitsregeln" }
  - { title: "§ 13 NAV – Elektrische Anlage (Installateurverzeichnis)", url: "https://www.gesetze-im-internet.de/nav/__13.html" }
lernfeld: [2, 5]
stufe: azubi
---
```
İmportlar: `Sicherheit`, `Quiz`, `UnterverteilungSchema` (`../../../../components/schemata/UnterverteilungSchema.astro`), Starlight `Steps` (`import { Steps } from '@astrojs/starlight/components';`).

Gövde yapısı ve içerik gerekleri (H2 başlıkları birebir):
1. `<Sicherheit />`
2. **## Was ist eine Unterverteilung?** — Stromkreisverteiler; Zählerschrank'tan (Zählerplatz, SLS) gelen Zuleitung'u Endstromkreisen'e böler; Wohnung/Etage başına; Unterschied Zählerschrank ↔ Unterverteilung; DIN 18015 çerçevesi.
3. **## Die Bauteile im Überblick** — Tablo: Bauteil | Aufgabe | Typische Auswahl. Satırlar: Hauptschalter · Überspannungsschutz (SPD Typ 2) · RCD/FI (Typ A, 30 mA, 40/63 A) · LS-Schalter (B16 Steckdosen, B10 Licht, B16 3-polig Herd) · Phasenschiene/Kammschiene · N- und PE-Klemmen/Reihenklemmen · Hutschiene 35 mm · Berührungsschutz-Abdeckung · Beschriftungsstreifen.
4. **## Planung: Stromkreise und Gruppen** — Stromkreise zählen (DIN 18015-2: eigene Stromkreise z. B. Herd, Waschmaschine, Spülmaschine, Trockner); Reserve (Faustregel 20–30 % freie Teilungseinheiten); RCD-Pflicht: DIN VDE 0100-410 → Steckdosen ≤ 32 A und Beleuchtung in Wohnungen mit RCD IΔn ≤ 30 mA; Gruppen bilden: Licht und Steckdosen eines Raums auf verschiedene RCDs, damit bei Fehler nicht alles dunkel ist; Außenleiter L1/L2/L3 gleichmäßig verteilen; Vorsicherung/Selektivität (SLS 35 A → RCD 40 A).
5. **## Das Übersichtsschema** — `<UnterverteilungSchema />` + 2-3 satır okuma yardımı.
6. **## Aufbau Schritt für Schritt** — `<Steps>` içinde 10 adım: (1) fünf Sicherheitsregeln anwenden · (2) Verteiler montieren (Höhe, Zugänglichkeit, Umgebung) · (3) Zuleitung einführen, abmanteln, Aderendhülsen bei feindrähtig; Querschnitt nach Strom, Länge, Verlegeart (Beispiel: NYM-J 5×10 mm² bei 35 A ist üblich, aber immer rechnen) · (4) Hauptschalter und SPD setzen · (5) RCDs setzen, Außenleiter zuführen · (6) LS-Schalter mit Kammschiene je RCD-Gruppe · (7) Abgänge klemmen: L auf LS-Abgang, N auf die N-Klemme **derselben** RCD-Gruppe, PE auf PE-Klemme; Leiterfarben L1 braun, L2 schwarz, L3 grau, N blau, PE grün-gelb · (8) Drehmoment nach Herstellerangabe, Zugprobe · (9) Beschriften: Stromkreisverzeichnis am Verteiler · (10) Erstprüfung (nächster Abschnitt).
7. **## Erstprüfung nach DIN VDE 0100-600** — Besichtigen · Erproben · Messen: Durchgängigkeit Schutzleiter; Isolationswiderstand ≥ 1 MΩ bei 500 V DC; Schleifenimpedanz/Kurzschlussstrom (Abschaltbedingung LS); RCD: Auslösung bei IΔn ≤ 300 ms (typisch deutlich schneller), Prüftaste; Drehfeld rechtsdrehend; Prüfprotokoll und Übergabe.
8. **## Häufige Fehler** — Liste: N-Leiter zweier RCD-Gruppen verbunden → RCD löst aus · PE vergessen/lose · falsche Charakteristik oder Nennstrom zum Querschnitt · Kammschiene falsch abgelängt, blanke Enden · Klemmen nicht angezogen · keine Beschriftung, kein Protokoll.
9. **## Teste dich** — `<Quiz fragen={[...]} />`, 5 soru (birebir):
   - `f: 'Welcher Fehlerstrom-Schutzschalter ist für Steckdosenstromkreise in Wohnungen vorgeschrieben?', a: ['RCD mit IΔn ≤ 300 mA', 'RCD mit IΔn ≤ 30 mA', 'Kein RCD, ein LS reicht'], r: 1, e: 'DIN VDE 0100-410 fordert für Steckdosen bis 32 A einen RCD mit höchstens 30 mA Bemessungsdifferenzstrom.'`
   - `f: 'Warum dürfen die N-Leiter zweier RCD-Gruppen nicht verbunden werden?', a: ['Weil sonst die Sicherung durchbrennt', 'Weil der RCD dann bei Last fälschlich auslöst', 'Das ist erlaubt'], r: 1, e: 'Der RCD vergleicht hin- und rückfließenden Strom. Fließt Strom über den N einer anderen Gruppe zurück, erkennt er eine Differenz und löst aus.'`
   - `f: 'Welche Regel ist die erste der fünf Sicherheitsregeln?', a: ['Spannungsfreiheit feststellen', 'Freischalten', 'Erden und Kurzschließen'], r: 1, e: 'Reihenfolge: Freischalten, gegen Wiedereinschalten sichern, Spannungsfreiheit feststellen, erden und kurzschließen, benachbarte Teile abdecken.'`
   - `f: 'Welcher Leitungsschutzschalter ist für Steckdosenstromkreise in Wohnungen üblich?', a: ['B16', 'C32', 'D6'], r: 0, e: 'B-Charakteristik, 16 A: passt zu 2,5 mm² Leitung und Haushaltsgeräten.'`
   - `f: 'Was gehört zur Erstprüfung nach DIN VDE 0100-600?', a: ['Nur eine Sichtkontrolle', 'Besichtigen, Erproben und Messen', 'Nur die Prüftaste des RCD drücken'], r: 1, e: 'Besichtigen, Erproben, Messen – z. B. Durchgängigkeit PE, Isolationswiderstand, Schleifenimpedanz, RCD-Auslösung – mit Prüfprotokoll.'`

Uzunluk hedefi: 900–1200 kelime. Ton: du-Form, kısa cümleler, her Fachbegriff ilk geçişte kalın.

- [ ] **Step 4: Build + test**

Run: `npm run build && npm test` → tüm kontroller OK. Ayrıca gözle: `npm run preview` → `http://localhost:4321/elektrolehre/de/anleitungen/unterverteilung/` quiz tıklanabilir, şema koyu temada görünür.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(de): Anleitung 'Unterverteilung aufbauen' mit Schema, Steps und Quiz

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: TR ve AR çevirileri, ka/sq UI dizgileri

**Files:**
- Create: `src/content/docs/tr/index.mdx`, `src/content/docs/tr/anleitungen/unterverteilung.mdx`
- Create: `src/content/docs/ar/index.mdx`, `src/content/docs/ar/anleitungen/unterverteilung.mdx`
- Create: `src/content/i18n/ka.json`, `src/content/i18n/sq.json`
- Test: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: Task 3 Almanca MDX (kaynak), Task 2 bileşenleri (`translated: machine` → not).
- Produces: `/tr/`, `/ar/` tam sayfalar; `/ka/`, `/sq/` fallback + kendi dilinde band.

- [ ] **Step 1: Test kontrolleri**

```js
  ['tr makale çevrildi (fallback bandı yok)', () => !read(`tr/${ARTIKEL}`).includes('This content is not available') && !read(`tr/${ARTIKEL}`).includes('Bu içerik henüz')],
  ['tr makalede çeviri notu var', () => read(`tr/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['ar makale çevrildi ve RTL', () => /dir="rtl"/.test(read(`ar/${ARTIKEL}`)) && read(`ar/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['sq fallback bandı Arnavutça', () => read(`sq/${ARTIKEL}`).includes(JSON.parse(readFileSync(fileURLToPath(new URL('../src/content/i18n/sq.json', import.meta.url)), 'utf8'))['i18n.untranslatedContent'])],
  ['dil seçicide ქართული ve Shqip', () => read('de').includes('ქართული') && read('de').includes('Shqip')],
```
Run → yeni kontroller FAIL.

- [ ] **Step 2: ka.json ve sq.json**

`src/content/i18n/ka.json`:
```json
{
  "skipLink.label": "გადასვლა შიგთავსზე",
  "search.label": "ძიება",
  "search.ctrlKey": "Ctrl",
  "search.cancelLabel": "გაუქმება",
  "search.devWarning": "ძიება მუშაობს მხოლოდ production რეჟიმში. ჯერ ააწყვეთ საიტი.",
  "themeSelect.accessibleLabel": "თემის არჩევა",
  "themeSelect.dark": "მუქი",
  "themeSelect.light": "ნათელი",
  "themeSelect.auto": "ავტომატური",
  "languageSelect.accessibleLabel": "ენის არჩევა",
  "menuButton.accessibleLabel": "მენიუ",
  "sidebarNav.accessibleLabel": "მთავარი ნავიგაცია",
  "tableOfContents.onThisPage": "ამ გვერდზე",
  "tableOfContents.overview": "მიმოხილვა",
  "i18n.untranslatedContent": "ეს შიგთავსი თქვენს ენაზე ჯერ არ არის ხელმისაწვდომი. ნაჩვენებია გერმანული ვერსია.",
  "page.editLink": "გვერდის რედაქტირება",
  "page.lastUpdated": "ბოლო განახლება:",
  "page.previousLink": "წინა",
  "page.nextLink": "შემდეგი",
  "page.draft": "ეს შიგთავსი მონახაზია და production-ში არ გამოქვეყნდება.",
  "404.text": "გვერდი ვერ მოიძებნა. შეამოწმეთ URL ან გამოიყენეთ ძიება.",
  "aside.note": "შენიშვნა",
  "aside.tip": "რჩევა",
  "aside.caution": "ყურადღება",
  "aside.danger": "საფრთხე",
  "fileTree.directory": "საქაღალდე",
  "builtWithStarlight.label": "შექმნილია Starlight-ით",
  "heading.anchorLabel": "სექცია სათაურით „{{title}}“"
}
```

`src/content/i18n/sq.json`:
```json
{
  "skipLink.label": "Kalo te përmbajtja",
  "search.label": "Kërko",
  "search.ctrlKey": "Ctrl",
  "search.cancelLabel": "Anulo",
  "search.devWarning": "Kërkimi funksionon vetëm në modalitetin production. Ndërto faqen së pari.",
  "themeSelect.accessibleLabel": "Zgjidh temën",
  "themeSelect.dark": "E errët",
  "themeSelect.light": "E çelët",
  "themeSelect.auto": "Automatike",
  "languageSelect.accessibleLabel": "Zgjidh gjuhën",
  "menuButton.accessibleLabel": "Menyja",
  "sidebarNav.accessibleLabel": "Navigimi kryesor",
  "tableOfContents.onThisPage": "Në këtë faqe",
  "tableOfContents.overview": "Përmbledhje",
  "i18n.untranslatedContent": "Kjo përmbajtje nuk është ende e disponueshme në gjuhën tuaj. Shfaqet versioni gjermanisht.",
  "page.editLink": "Ndrysho faqen",
  "page.lastUpdated": "Përditësimi i fundit:",
  "page.previousLink": "E mëparshme",
  "page.nextLink": "Tjetra",
  "page.draft": "Kjo përmbajtje është draft dhe nuk publikohet në production.",
  "404.text": "Faqja nuk u gjet. Kontrollo URL-në ose përdor kërkimin.",
  "aside.note": "Shënim",
  "aside.tip": "Këshillë",
  "aside.caution": "Kujdes",
  "aside.danger": "Rrezik",
  "fileTree.directory": "Dosje",
  "builtWithStarlight.label": "Ndërtuar me Starlight",
  "heading.anchorLabel": "Seksioni me titull „{{title}}“"
}
```

- [ ] **Step 3: TR çevirisi**

`src/content/docs/tr/anleitungen/unterverteilung.mdx`: Task 3 makalesinin Türkçe çevirisi. Kurallar:
- Front matter: `title: Unterverteilung kurmak (Unterverteilung aufbauen)`, `description` Türkçe, `translated: machine`, `sources` Almanca listeyle aynı (title'lar Almanca kalır), `lernfeld`, `stufe` aynı.
- Aynı importlar, aynı bileşen çağrıları; `<UnterverteilungSchema />` aynen.
- Her Almanca Fachbegriff ilk geçişte **Almanca** kalın + parantez içinde Türkçe: **Unterverteilung** (alt dağıtım panosu), **RCD/FI-Schutzschalter** (kaçak akım rölesi), **LS-Schalter** (otomatik sigorta), **Kammschiene** (bara tarağı), **Erstprüfung** (ilk kontrol ölçümleri), **Zählerschrank** (sayaç panosu), **SLS**, **Aderendhülse** (yüksük), **Stromkreisverzeichnis** (devre listesi).
- Quiz soruları Türkçe, cevap şıklarındaki teknik terimler Almanca (ör. `'IΔn ≤ 30 mA olan RCD'`).
- H2 başlıkları: `## Unterverteilung nedir?` · `## Bileşenlere genel bakış` · `## Planlama: devreler ve gruplar` · `## Genel şema` · `## Adım adım kurulum` · `## DIN VDE 0100-600'e göre Erstprüfung` · `## Sık yapılan hatalar` · `## Kendini test et`.

`src/content/docs/tr/index.mdx`: splash; `title: Elektrolehre`, tagline Türkçe: "Sıfırdan elektrotekniği – Elektroniker für Energie- und Gebäudetechnik Ausbildung'u için. Ücretsiz, sekiz dilde, her zaman Almanca Fachbegriff'lerle." Action: `text: İlk rehberi oku`, `link: /tr/anleitungen/unterverteilung/` (Task 1 Step 7'de bulunan base davranışına göre). Kartlar: Beruf (Meslek) · Grundlagen (Temeller) · Anleitungen (Uygulama rehberleri), açıklamalar Türkçe.

- [ ] **Step 4: AR çevirisi**

`src/content/docs/ar/anleitungen/unterverteilung.mdx` ve `src/content/docs/ar/index.mdx`: aynı kurallar, Arapça. Fachbegriff Almanca kalır (Latin harfle, kalın), Arapça açıklama parantezde. `<UnterverteilungSchema />` `dir="ltr"` sarmalayıcısı sayesinde yönü korur. Action link `/ar/anleitungen/unterverteilung/`.

- [ ] **Step 5: Build + test + göz kontrolü**

Run: `npm run build && npm test` → tüm kontroller OK. `npm run preview`: `/elektrolehre/ar/anleitungen/unterverteilung/` sağdan sola, şema soldan sağa; `/elektrolehre/ka/anleitungen/unterverteilung/` Almanca içerik + Gürcüce band; dil seçicide 8 dil.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(i18n): TR ve AR çevirileri, ka/sq UI dizgileri

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: GitHub repo, Actions workflow, Pages yayını, kanıt

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`
- Modify: `ROADMAP.md` (Faz 0 durumu, dersler)

**Interfaces:**
- Consumes: Task 1-4 çıktısı (build geçiyor).
- Produces: `https://ministeraskol.github.io/elektrolehre/` canlı.

- [ ] **Step 1: Workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Install, build, upload
        uses: withastro/action@v6
        with:
          node-version: 24

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

`README.md` (kısa, Almanca): proje adı, ne olduğu, `npm install` / `npm run dev` / `npm run build && npm test`, içerik yolu `src/content/docs/<dil>/`, lisans notu (içerik CC BY-SA 4.0 önerisi — Kadir kararı; şimdilik "Lizenz: folgt").

- [ ] **Step 2: Commit, repo oluştur, push**

```bash
git add -A && git commit -m "ci: GitHub Pages workflow ve README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create ministeraskol/elektrolehre --public --description "Elektrotechnik von null an – Lernseite für die Ausbildung zum Elektroniker (8 Sprachen)" --source . --remote origin --push
```
Expected: repo URL yazdırılır, `main` push edilir.

- [ ] **Step 3: Pages'i Actions kaynağıyla aç, workflow'u izle**

```bash
gh api -X POST repos/ministeraskol/elektrolehre/pages -f build_type=workflow
gh run list --repo ministeraskol/elektrolehre --limit 1
gh run watch --repo ministeraskol/elektrolehre --exit-status $(gh run list --repo ministeraskol/elektrolehre --limit 1 --json databaseId -q '.[0].databaseId')
```
Expected: run `completed success`. Pages POST 409 "already exists" dönerse sorun yok. İlk push Pages açılmadan önce koştuysa: `gh workflow run deploy.yml --repo ministeraskol/elektrolehre` ile yeniden tetikle.

- [ ] **Step 4: Canlı kanıt**

```bash
B=https://ministeraskol.github.io/elektrolehre
curl -s -o /dev/null -w "de %{http_code}\n" $B/de/anleitungen/unterverteilung/
curl -s $B/ar/anleitungen/unterverteilung/ | grep -c 'dir="rtl"'
curl -s $B/ka/anleitungen/unterverteilung/ | grep -c 'ჯერ არ არის'
curl -s $B/de/ | grep -c 'noindex'
curl -s -o /dev/null -w "root %{http_code}\n" $B/
```
Expected: `de 200`, rtl ≥ 1, Gürcüce band ≥ 1, noindex ≥ 1, root 200.

- [ ] **Step 5: ROADMAP güncelle ve commit**

`ROADMAP.md`: Faz 0 maddelerini `[x]` yap, "Son güncelleme" satırını, "Sıradaki somut adım"ı Faz 1'in ilk sayfasına (`beruf/berufsbild`) çevir, canlı URL'yi Hedef altına ekle, "Dersler" bölümüne üç satır (ne işe yaradı · neyi bir daha yapma · kural).

```bash
git add ROADMAP.md && git commit -m "docs: Faz 0 kapanış, ROADMAP güncel

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git push
```

---

## Self-Review

- **Spec coverage (Faz 0):** 8 dil + RTL (T1), fallback + band (T1/T4), şema genişletme (T1), noindex (T1), bileşenler Sicherheit/Quiz/Quellen/not (T2), Bild bileşeni → Faz 0'da görsel kullanılmıyor, Faz 1'e bırakıldı (spec'te "Faz 0: Bileşenler: Sicherheit, Quiz, Bild" yazıyordu; YAGNI, ROADMAP'e not düşülür), tam makale + SVG (T3), TR/AR + ka/sq UI (T4), workflow/repo/Pages/canlı kanıt (T5). Glossar, translate.py → Faz 2 (spec'e uygun).
- **Placeholder scan:** Task 3 gövdesi prose olduğu için ana hatlar + birebir quiz soruları verildi; kod blokları tam. "Inhalt folgt." yalnız Task 1/2'nin geçici sayfasında ve Task 3'te silinir.
- **Type consistency:** `Quiz` prop adı `fragen`, alanlar `f/a/r/e` (T2 ↔ T3). `Quellen` prop adı `quellen` (T2 bileşen ↔ T2 override). `translated` değerleri `source|machine|reviewed` (T1 şema ↔ T2 override ↔ T4 front matter). Şema bileşeni yolu `src/components/schemata/UnterverteilungSchema.astro` (T3 ↔ T4). `ARTIKEL` sabiti tüm kontrollerde aynı.
