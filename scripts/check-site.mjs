// dist/ üzerinde HTML doğrulamaları. Kullanım: npm run build && npm test
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const page = (p) => join(dist, p, 'index.html');
const read = (p) => readFileSync(page(p), 'utf8');
const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? htmlFiles(f) : n.endsWith('.html') ? [f] : [];
  });

// Starlight-Hinweis auf Fallback-Seiten (i18n.untranslatedContent) je Locale aus src/content/i18n/<lang>.json.
// Starlight sucht die Datei über das BCP-47-lang der Locale: leicht → de-x-leicht.json. Seit Aufräumen 14.09. hat jede
// Nicht-de-Locale eine eigene Datei (vorher nur ka/sq; die übrigen zeigten Starlights eingebaute Texte).
const I18N_DATEI = { leicht: 'de-x-leicht', tr: 'tr', en: 'en', ru: 'ru', ar: 'ar', fa: 'fa', ka: 'ka', sq: 'sq' };
const bandVon = (l) => {
  const f = fileURLToPath(new URL(`../src/content/i18n/${I18N_DATEI[l]}.json`, import.meta.url));
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8'))['i18n.untranslatedContent'] : undefined;
};
const BAND = Object.fromEntries(Object.keys(I18N_DATEI).map((l) => [l, bandVon(l)]));
const kaBand = BAND.ka;
const sqBand = BAND.sq;
// Starlights eingebauter deutscher Text – stand bis 14.09. auf den /leicht/-Fallbacks, darf nirgends mehr erscheinen.
const DE_BAND = 'Dieser Inhalt ist noch nicht in deiner Sprache verfügbar.';

const ARTIKEL = 'themen/energie-und-gebaeudetechnik/unterverteilung';
const EGT = 'themen/energie-und-gebaeudetechnik';
// Faz 1: 12 Almanca içerik sayfası (index + 11) — hepsi quiz + kaynak listesi taşımalı (haftungsausschluss hariç)
const FAZ1_SEITEN = [
  `${EGT}/berufsbild`, `${EGT}/lernfelder`, `${EGT}/weiterbildung`,
  'grundlagen/strom-spannung-widerstand', 'grundlagen/netz-und-leiterfarben', 'grundlagen/schutzorgane', 'grundlagen/sicherheitsregeln',
  `${EGT}/unterverteilung`, `${EGT}/zaehlerplatz`, `${EGT}/wechselschaltung-steckdose`,
  'elektrowerkzeuge/grundausstattung-azubi', 'blog/fehler-des-tages-1-rcd-gruppen',
];

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
const srcFiles = (dir) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? srcFiles(f) : /\.(astro|css|ts|mjs)$/.test(n) ? [f] : []; });
const uiJson = JSON.parse(readFileSync(join(src, 'data/startseite-ui.json'), 'utf8'));
const uiPfade = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? uiPfade(v, `${p}${k}.`) : [`${p}${k}`]);
const WB_N = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege.length; // Stand Task 1: 89

// Go-Live-Audit (14.09.): interne Links aus dist/**/*.html gegen die Dateien in dist prüfen.
// Absolut (/…) ab dist-Wurzel, relativ ab der Seiten-URL; Verzeichnis-URL → index.html; #Fragment und ?Query zählen nicht.
// Skript-Inhalte werden übersprungen (das src des <script>-Tags selbst wird geprüft); die 404-Seite hat keine feste URL.
let linkBefund;
const interneLinks = () => {
  if (linkBefund) return linkBefund;
  const loestAuf = (pfad) => {
    let p = pfad;
    try { p = decodeURIComponent(pfad); } catch { /* roh prüfen */ }
    const f = join(dist, p);
    if (p.endsWith('/')) return existsSync(join(f, 'index.html'));
    return (existsSync(f) && statSync(f).isFile()) || existsSync(join(f, 'index.html'));
  };
  linkBefund = { absolut: [], relativ: [], nAbsolut: 0, nRelativ: 0 };
  for (const datei of htmlFiles(dist)) {
    const rp = relative(dist, datei).split(sep).join('/');
    const seitenUrl = `/${rp.replace(/(^|\/)index\.html$/, '$1')}`;
    const html = readFileSync(datei, 'utf8').replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2');
    for (const m of html.matchAll(/<[a-z][^>]*?\s(?:href|src)=(["'])(.*?)\1/gi)) {
      const roh = m[2].replace(/&amp;/g, '&').trim();
      if (!roh || roh.startsWith('#') || roh.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(roh)) continue;
      const absolut = roh.startsWith('/');
      if (!absolut && rp === '404.html') continue;
      const { pathname } = new URL(roh, `https://wattwas.invalid${seitenUrl}`);
      linkBefund[absolut ? 'nAbsolut' : 'nRelativ']++;
      if (!loestAuf(pathname)) linkBefund[absolut ? 'absolut' : 'relativ'].push(`${rp} → ${roh}`);
    }
  }
  return linkBefund;
};
const meldeKaputt = (liste) => {
  liste.slice(0, 25).forEach((l) => console.log(`     ↳ kaputt: ${l}`));
  if (liste.length > 25) console.log(`     ↳ … und ${liste.length - 25} weitere`);
  return liste.length === 0;
};
const LOCALES_9 = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'];
const kapitelKarten = (l) => [...read(`${l}/grundlagen`).matchAll(/<a\b[^>]*\bclass="kapitel-karte\b[^"]*"[^>]*>/g)].map((m) => m[0].match(/\shref="([^"]*)"/)?.[1] ?? '');

export const checks = [
  ['dist var', () => existsSync(dist)],
  ['de Startseite üretildi', () => existsSync(page('de'))],
  ['de Unterverteilung üretildi', () => existsSync(page(`de/${ARTIKEL}`))],
  ['de sayfa lang="de"', () => /<html[^>]*lang="de"/.test(read(`de/${ARTIKEL}`))],
  ['ar sayfa dir="rtl"', () => /<html[^>]*dir="rtl"/.test(read(`ar/${ARTIKEL}`))],
  ['fa sayfa dir="rtl"', () => /<html[^>]*dir="rtl"/.test(read(`fa/${ARTIKEL}`))],
  ['ka Unterverteilung sayfası üretildi', () => existsSync(page(`ka/${ARTIKEL}`))],
  ['ka Unterverteilung çevrildi (band yok)', () => !read(`ka/${ARTIKEL}`).includes(kaBand)],
  ['hreflang >= 8 (de makale)', () => (read(`de/${ARTIKEL}`).match(/hreflang="/g) || []).length >= 8],
  // Dil seçici masaüstü başlıkta ve mobil menüde iki kez basılır → 16 seçenek
  ['dil seçici >= 8 dil', () => (read(`de/${ARTIKEL}`).match(/<option[^>]*value="\/[a-z]{2}\//g) || []).length >= 8],
  ['base kök (/) — eski /elektrolehre/ yolu kalmadı', () => !read('de').includes('/elektrolehre/')],
  ['kök / → /de/ yönlendirmesi', () =>
    existsSync(join(dist, 'index.html')) && /url=\/de\//.test(readFileSync(join(dist, 'index.html'), 'utf8'))],
  ['CNAME dosyası dist içinde: wattwas.de', () => existsSync(join(dist, 'CNAME')) && readFileSync(join(dist, 'CNAME'), 'utf8').trim() === 'wattwas.de'],
  ['canonical/hreflang https://wattwas.de', () => read(`de/${ARTIKEL}`).includes('https://wattwas.de/de/')],
  // Kök index.html Astro'nun yönlendirme sayfasıdır, orada noindex doğru; içerik sayfalarında olmamalı.
  // Aufräumen 14.09. – SEO: 404.html trägt jetzt bewusst noindex (eigene Prüfung im SEO-Block) → hier ausgenommen.
  ['noindex hiçbir içerik sayfasında yok (Google açık)', () =>
    htmlFiles(dist).filter((f) => relative(dist, f) !== '404.html').map((f) => readFileSync(f, 'utf8')).filter((h) => !/http-equiv="refresh"/.test(h)).every((h) => !/name="robots"[^>]*content="noindex/.test(h))],
  ['Impressum sayfası: ad + Badenweiler', () => existsSync(page('de/rechtliches/impressum')) && read('de/rechtliches/impressum').includes('79410 Badenweiler')],
  // Aufräumen 14.09. – Recht: Fotos selbst gehostet → kein Wikimedia-Abschnitt mehr; sessionStorage + Rechtsgrundlage TDDDG ergänzt
  ['Datenschutz sayfası: GitHub Pages + sessionStorage (sl-sidebar-state) + § 25 Abs. 2 Nr. 2 TDDDG, kein Wikimedia-Abschnitt', () => { const h = existsSync(page('de/rechtliches/datenschutz')) ? read('de/rechtliches/datenschutz') : ''; return h.includes('GitHub Pages') && h.includes('sessionStorage') && [...h.matchAll(/<code\b[^>]*>([^<]*)<\/code>/g)].some((m) => m[1] === 'sl-sidebar-state') && h.includes('§ 25 Abs. 2 Nr. 2 TDDDG') && !/Wikimedia/i.test(h); }],
  ['Impressum her sayfanın sidebar menüsünde', () => read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/')],
  // Faz 2: çeviri + glossar
  ...['tr','en','ru','ar','fa','ka','sq'].map((l) => [`${l}/grundlagen/strom-spannung-widerstand çevrildi (band yok, çeviri notu YOK, quiz 5)`, () =>
    existsSync(page(`${l}/grundlagen/strom-spannung-widerstand`)) &&
    !read(`${l}/grundlagen/strom-spannung-widerstand`).includes(BAND[l]) &&
    !read(`${l}/grundlagen/strom-spannung-widerstand`).includes('uebersetzungshinweis') &&
    (read(`${l}/grundlagen/strom-spannung-widerstand`).match(/class="frage[" ]/g) || []).length === 5]),
  ['de/glossar >= 80 terim', () => existsSync(page('de/glossar')) && (read('de/glossar').match(/<th scope="row"/g) || []).length >= 80],
  ['Glossar sidebar linki her dilde (tr → /tr/glossar/)', () => read('tr/grundlagen/strom-spannung-widerstand').includes('/tr/glossar/')],
  ['robots.txt: Sitemap satırı + KI-Crawler (GPTBot, ClaudeBot, CCBot) Disallow, * Allow', () => existsSync(join(dist, 'robots.txt')) && ['Sitemap: https://wattwas.de/sitemap-index.xml', 'User-agent: GPTBot', 'User-agent: ClaudeBot', 'User-agent: CCBot', 'User-agent: *\nAllow: /'].every((s) => readFileSync(join(dist, 'robots.txt'), 'utf8').includes(s))],
  // Task 2: bileşenler
  ['Sicherheit bloğu makalede', () => read(`de/${ARTIKEL}`).includes('class="sicherheit')],
  ['Quiz bileşeni makalede', () => read(`de/${ARTIKEL}`).includes('<el-quiz')],
  ['Quellen listesi makalede', () => read(`de/${ARTIKEL}`).includes('class="quellen')],
  ['de makalede çeviri notu YOK', () => !read(`de/${ARTIKEL}`).includes('uebersetzungshinweis')],
  // Task 3: tam makale
  ['de makalede >= 6 H2 başlık', () => (read(`de/${ARTIKEL}`).match(/<h2/g) || []).length >= 6],
  ['de makalede şema SVG', () => read(`de/${ARTIKEL}`).includes('class="schema')],
  ['de makalede Erstprüfung geçiyor', () => read(`de/${ARTIKEL}`).includes('Erstprüfung')],
  ['de makalede >= 5 quiz sorusu', () => (read(`de/${ARTIKEL}`).match(/class="frage[" ]/g) || []).length >= 5],
  // Task 4: çeviriler ve ka/sq UI dizgileri
  ['tr makale çevrildi (fallback bandı yok)', () => !read(`tr/${ARTIKEL}`).includes(BAND.tr) && /<html[^>]*lang="tr"/.test(read(`tr/${ARTIKEL}`))],
  ['tr makalede çeviri notu YOK (Rückmeldung 13.09 R1)', () => !read(`tr/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['ar makale çevrildi, RTL, çeviri notu YOK', () =>
    /<html[^>]*dir="rtl"/.test(read(`ar/${ARTIKEL}`)) && !read(`ar/${ARTIKEL}`).includes('uebersetzungshinweis') && !read(`ar/${ARTIKEL}`).includes(BAND.ar)],
  ['ar şema LTR sarmalayıcıda', () => /<figure[^>]*dir="ltr"/.test(read(`ar/${ARTIKEL}`))],
  ['sq Unterverteilung çevrildi (Arnavutça band yok, çeviri notu YOK)', () => !read(`sq/${ARTIKEL}`).includes(sqBand) && !read(`sq/${ARTIKEL}`).includes(DE_BAND) && !read(`sq/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['dil seçicide ქართული ve Shqip', () => read('de').includes('ქართული') && read('de').includes('Shqip')],
  // Faz 1: içerik sayfaları
  ...FAZ1_SEITEN.map((p) => [`de/${p} üretildi, quiz (>=5) + Quellen`, () =>
    existsSync(page(`de/${p}`)) &&
    (read(`de/${p}`).match(/class="frage[" ]/g) || []).length >= 5 &&
    read(`de/${p}`).includes('class="quellen')]),
  ['de/rechtliches/haftungsausschluss üretildi', () => existsSync(page('de/rechtliches/haftungsausschluss'))],
  ['Anleitungen Sicherheit bloğuyla başlıyor', () => ['zaehlerplatz', 'wechselschaltung-steckdose'].every((a) => read(`de/${EGT}/${a}`).includes('class="sicherheit'))],
  ['Zählerplatz ve Wechselschaltung şeması var', () => read(`de/${EGT}/zaehlerplatz`).includes('class="schema') && read(`de/${EGT}/wechselschaltung-steckdose`).includes('class="schema')],
  ['Bild bileşeni (Commons, lisans) Schutzorgane sayfasında', () => read('de/grundlagen/schutzorgane').includes('class="bild') && read('de/grundlagen/schutzorgane').includes('creativecommons.org')],
  // TP1 · Task 5: Seitenleiste, PageFrame
  ['Seitenleiste: Gruppen Grundlagen · Energie- und Gebäudetechnik · Werkzeug · Blog · Mehr (mit Rechtliches)', () => ['Grundlagen', 'Energie- und Gebäudetechnik', 'Werkzeug', 'Blog', 'Mehr', 'Rechtliches'].every((g) => read(`de/${EGT}/berufsbild`).includes(`${g}</span>`)) && read(`tr/${EGT}/berufsbild`).includes('Daha fazla</span>')],
  ['Seitenleiste: Stufen-Badge an jedem Inhaltslink (12), passend zur Stufe; kein Badge an Hubs/Impressum', () => { const h = read(`de/${ARTIKEL}`); return (h.match(/class="sl-badge default small ww-stufe stufe-/g) || []).length === 12 && /href="\/de\/grundlagen\/schutzorgane\/"[^>]*>[\s\S]{0,300}?stufe-azubi/.test(h) && /href="\/de\/grundlagen\/sicherheitsregeln\/"[^>]*>[\s\S]{0,300}?stufe-einstieg/.test(h) && !/href="\/de\/rechtliches\/impressum\/"[^>]*>[\s\S]{0,200}?sl-badge/.test(h) && !/href="\/de\/grundlagen\/"[^>]*>[\s\S]{0,200}?sl-badge/.test(h); }],
  ['Seitenleiste (tr): Badge-Text lokalisiert (Başlangıç)', () => /href="\/tr\/grundlagen\/sicherheitsregeln\/"[^>]*>[\s\S]{0,300}?stufe-einstieg[^>]*>Başlangıç</.test(read(`tr/${ARTIKEL}`))],
  ['Geselle-Kasten unten in der Seitenleiste (Artikel), nicht auf Rechtliches', () => /class="ww-geselle(?: astro-[\w-]+)?"/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes('Geselle Watt') && !/class="ww-geselle(?: astro-[\w-]+)?"/.test(read('de/rechtliches/impressum')) && /class="ww-geselle(?: astro-[\w-]+)?"/.test(read('de/entdecken'))],
  ['Stufen-Leiste unter dem Header (Artikel, Hub), nicht auf der Startseite', () => read(`de/${ARTIKEL}`).includes('<ww-stufen-leiste') && read('de/grundlagen').includes('<ww-stufen-leiste') && !read('de').includes('<ww-stufen-leiste')],
  ['Mobil: Drawer (starlight__sidebar) mit Tabs auch auf der Startseite; Startseite ohne data-has-sidebar', () => read('de').includes('id="starlight__sidebar"') && /class="ww-tabs-mobil md:sl-hidden(?: astro-[\w-]+)?"/.test(read('de')) && !/<html[^>]*data-has-sidebar/.test(read('de')) && /<html[^>]*data-has-sidebar/.test(read(`de/${ARTIKEL}`))],
  ['ka berufsbild çevrildi (Gürcüce band yok, çeviri notu YOK)', () => existsSync(page(`ka/${EGT}/berufsbild`)) && !read(`ka/${EGT}/berufsbild`).includes(kaBand) && !read(`ka/${EGT}/berufsbild`).includes('uebersetzungshinweis')],
  // Redesign (12 Eyl 2026): şematik tema
  ['Site adı wattwas (Elektrolehre kalmadı)', () => /<title>[^<]*wattwas/.test(read(`de/${ARTIKEL}`)) && !read('de').includes('Elektrolehre') && !read(`de/${EGT}/lernfelder`).includes('Elektrolehre')],
  ['Yeni bölümler: themen, grundlagen (Lernpfad), elektrowerkzeuge, blog, ueber', () =>
    existsSync(page('de/themen')) && read('de/themen').includes('class="beruf ') &&
    existsSync(page('de/grundlagen')) && read('de/grundlagen').includes('ww-lernpfad') &&
    existsSync(page('de/elektrowerkzeuge')) && (read('de/elektrowerkzeuge').match(/class="produkt /g) || []).length >= 8 && read('de/elektrowerkzeuge').includes('class="vergleich') &&
    existsSync(page('de/blog')) && read('de/blog').includes('class="post ') &&
    existsSync(page('de/ueber')) && read('de/ueber').includes('class="kanaele-bald')],
  ['Eski URL yönlendirmeleri (beruf/, anleitungen/ → themen/…)', () =>
    /url=\/de\/themen\/energie-und-gebaeudetechnik\/berufsbild\//.test(read('de/beruf/berufsbild')) &&
    /url=\/tr\/themen\/energie-und-gebaeudetechnik\/unterverteilung\//.test(read('tr/anleitungen/unterverteilung'))],
  ['Stufe rozeti: Artikel (azubi) + Blog-Liste; nicht auf Impressum/Startseite/Glossar/Über/Hubs', () => /class="stufe stufe-azubi/.test(read(`de/${ARTIKEL}`)) && /class="stufe stufe-einstieg/.test(read('de/grundlagen/strom-spannung-widerstand')) && /class="stufe stufe-/.test(read('de/blog')) && ['de/rechtliches/impressum', 'de', 'de/glossar', 'de/ueber', 'de/grundlagen', 'de/themen'].every((p) => !/class="stufe stufe-/.test(read(p)))],
  // TP1 · Task 6
  ['Stufen-Hinweis auf Inhaltsseiten (2 Varianten, Link zu Entdecken), nicht auf Impressum/Hub', () => { const h = read('de/grundlagen/schutzorgane'); return (h.match(/class="stufen-hinweis-text[^"]*"/g) || []).length === 2 && h.includes('data-seite-stufe="azubi"') && h.includes('data-fuer="einstieg"') && h.includes('href="/de/entdecken/"') && h.includes('Diese Seite ist für Azubi.') && !read('de/rechtliches/impressum').includes('stufen-hinweis') && !read('de/grundlagen').includes('stufen-hinweis'); }],
  ['Stufen-Hinweis (tr): lokalisiert, deutscher Stufenname mit lang="de" (Aufräumen 14.09. – UI)', () => read('tr/grundlagen/schutzorgane').includes('Bu sayfa <span lang="de">Azubi</span> için.')],
  ['Veri i18n: tr Werkzeug/Themen/Video başlıkları Türkçe (Almanca fallback değil)', () =>
    read('tr/elektrowerkzeuge').includes('gerilim kontrol') && read('tr/themen').includes('Enerji ve bina tekniği') && read('tr/themen').includes('Başlangıç')],
  ['Mitgliedschaft: /mitglied/ sayfası (3 Vorteil, form kapalı → „bald“), footer + sidebar linki', () =>
    existsSync(page('de/mitglied')) && (read('de/mitglied').match(/class="vorteil[" ]/g) || []).length === 3 && read('de/mitglied').includes('class="bald') && !read('de/mitglied').includes('<form') &&
    read(`de/${ARTIKEL}`).includes('/de/mitglied/') && read('tr/mitglied').includes('Üye ol')],
  ['„Kostenlos und bleiben es“ hiçbir dilde yok', () => ['de','leicht','tr','en','ru','ar','fa','ka','sq'].every((l) => !/bleiben es|bleibt es|bleibt so|stay free|öyle kalacak|останутся такими|وسيبقى|رایگان می‌ماند|ასეც დარჩება|mbetet falas/.test(read(l)))],
  ['Datenschutz: Mitgliedschaft (Double-Opt-in) bölümü', () => read('de/rechtliches/datenschutz').includes('Double-Opt-in')],
  ['Werkzeug: affiliate kapalıyken "Zum Angebot" yok, hinweis var', () => !read('de/elektrowerkzeuge').includes('rel="sponsored') && read('de/elektrowerkzeuge').includes('affiliate-hinweis')],
  ['Footer: dil + Impressum + Über bağlantıları, ücretsiz notu, kanallar', () => read(`de/${ARTIKEL}`).includes('class="ww-fuss') && read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/') && read(`de/${ARTIKEL}`).includes('/de/ueber/') && read(`de/${ARTIKEL}`).includes('CC BY-SA 4.0') && !read(`de/${ARTIKEL}`).includes('kanal-')],
  ['Fachbegriff işareti: de + tr makalede dfn.fachbegriff → glossar anker', () => ['de', 'tr'].every((l) => (read(`${l}/${ARTIKEL}`).match(/<dfn class="fachbegriff"/g) || []).length >= 5 && read(`${l}/${ARTIKEL}`).includes(`/${l}/glossar/#begriff-`))],
  ['Fachbegriff başlıklarda değil', () => !/<h[1-6][^>]*>[^<]*<a class="fachbegriff-link"/.test(read(`de/${ARTIKEL}`))],
  ['Glossar satırlarında id (begriff-…)', () => (read('de/glossar').match(/<th scope="row"[^>]*id="begriff-/g) || []).length >= 80],
  ['Datenschutz: Lesefortschritt localStorage notu', () => read('de/rechtliches/datenschutz').includes('Lesefortschritt')],
  // TP1 · Task 2: D1-Tokens, nur Inter
  ['D1-Tokens im gebauten CSS (Akzent #4DA3FF, Graphit #121417), kein Bernstein #F59E0B', () => { const css = readdirSync(join(dist, '_astro')).filter((n) => n.endsWith('.css')).map((n) => readFileSync(join(dist, '_astro', n), 'utf8')).join('\n'); return /#4da3ff/i.test(css) && /#121417/i.test(css) && !/#f59e0b|#f97316|#22d3ee/i.test(css); }],
  ['Fontlar: nur Inter self-hosted, kein Space Grotesk, kein Google Fonts', () => htmlFiles(dist).every((f) => !readFileSync(f, 'utf8').includes('fonts.googleapis.com')) && readdirSync(join(dist, '_astro')).some((n) => /inter.*\.woff2$/i.test(n)) && !readdirSync(join(dist, '_astro')).some((n) => /space-grotesk/i.test(n))],
  // TP1 · Task 1: Stufen
  ['Stufe je Inhaltsseite = Spec Anhang A (de)', () => Object.entries(STUFEN_SOLL).every(([s, st]) => stufeVon('de', s) === st)],
  ['Stufe in allen 8 Locales gleich wie de', () => Object.keys(STUFEN_SOLL).every((s) => INHALT_LOCALES.every((l) => stufeVon(l, s) === stufeVon('de', s)))],
  ['Nur einstieg|azubi|profi im Quelltext (kein geselle/meister)', () => mdxFiles(join(src, 'content/docs')).every((f) => !/^stufe: (?!einstieg$|azubi$|profi$)/m.test(frontmatter(readFileSync(f, 'utf8'))))],
  ['Hubs, Rechtliches, Glossar, Über, Mitglied, index ohne stufe', () => OHNE_STUFE.every((s) => stufeVon('de', s) === undefined)],
  // TP1 · Task 3: UI-Strings
  ['UI-Strings: alle 9 Locales haben dieselben Schlüssel wie de', () => { const soll = uiPfade(uiJson.de).sort().join('|'); return ['leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => uiPfade(uiJson[l]).sort().join('|') === soll); }],
  ['UI-Strings: stufen = einstieg/azubi/profi (Start/Azubi/Profi), kein Block „stufe“, keine Kanal-Sätze bei mitglied.bald', () => Object.values(uiJson).every((t) => Object.keys(t.stufen).join() === 'einstieg,azubi,profi' && !t.stufe && !/YouTube|Kanal|channel|kanal|канал|قنوات|کانال|არხ/i.test(t.mitglied.bald)) && uiJson.de.stufen.einstieg === 'Start' && uiJson.de.tabs.entdecken === 'Entdecken'],
  // TP1 · Task 4: Header
  ['Header: 6 Tabs (Entdecken, Lernen, Werkzeug, Marken, Glossar, Blog)', () => { const h = read(`de/${ARTIKEL}`); return (h.match(/class="ww-tab(?: astro-[\w-]+)?"/g) || []).length === 6 && ['/de/entdecken/', '/de/lernen/', '/de/elektrowerkzeuge/', '/de/elektrowerkzeuge/marken/', '/de/glossar/', '/de/blog/'].every((p) => new RegExp(`class="ww-tab(?: astro-[\\w-]+)?"[^>]*href="${p}"`).test(h)); }],
  ['Header: aktiver Tab „Lernen“ auf Grundlagen-Seite, „Werkzeug“ auf Werkzeug-Seite (aria-current)', () => /<a[^>]*class="ww-tab(?: astro-[\w-]+)?"[^>]*href="\/de\/lernen\/"[^>]*aria-current="page"/.test(read('de/grundlagen/schutzorgane')) && /<a[^>]*class="ww-tab(?: astro-[\w-]+)?"[^>]*href="\/de\/elektrowerkzeuge\/"[^>]*aria-current="page"/.test(read('de/elektrowerkzeuge'))],
  ['Header: Suche mit Strg K (de) / Ctrl K (tr), Stufen-Chip mit 3 Optionen, Theme-Icon, Sprachwahl', () => read(`de/${ARTIKEL}`).includes('<site-search') && /<kbd[^>]*>Strg<\/kbd>/.test(read(`de/${ARTIKEL}`)) && /<kbd[^>]*>Ctrl<\/kbd>/.test(read(`tr/${ARTIKEL}`)) && (read(`de/${ARTIKEL}`).match(/class="ww-stufe-option ist-/g) || []).length === 3 && /class="ww-theme-knopf(?: astro-[\w-]+)?"/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes('<starlight-lang-select')],
  // TP1 · Task 5: Der mobile Drawer (mit Starlights MobileMenuFooter: Theme/Sprache + Social-Icons-Container) erscheint jetzt auch
  // auf der Startseite – gewollt (Sidebar.astro). Die Prüfung „keine Social-Icons“ bleibt auf den Header selbst begrenzt.
  ['Header: Wortmarke watt<b>was</b>, keine Social-Icons', () => { const kopf = read('de').match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? ''; return /class="ww-marke(?: astro-[\w-]+)?"[^>]*>watt<b[^>]*>was<\/b>/.test(kopf) && !kopf.includes('social-icons'); }],
  ['Theme + Stufe vor dem Rendern: Inline-Script setzt data-theme (dunkel Standard) und data-stufe aus localStorage', () => /dataset\.theme = gespeichert === 'light' \? 'light' : 'dark'/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes("lies('ww-stufe')")],
  // TP1 · Task 7: Startseite
  ['Startseite (de): Wortmarke-H1, Claim, Stufenwahl (3), 9 Sprachen, Button → /de/entdecken/', () => { const h = read('de'); return /<h1[^>]*id="_top"[^>]*class="ww-start-name[^"]*"/.test(h) && /class="ww-start-claim[^"]*"/.test(h) && (h.match(/class="lvl lvl-/g) || []).length === 3 && (h.match(/class="ww-sprachen[^"]*"[\s\S]*?<\/nav>/)?.[0].match(/hreflang="/g) || []).length === 9 && /class="ww-btn ww-btn-fill ww-start-cta[^"]*" href="\/de\/entdecken\/"/.test(h); }],
  ['Startseite in allen 9 Locales: Stufenwahl + Entdecken-Link; leicht: lang="de-x-leicht", „Strom verstehen“', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => (read(l).match(/class="lvl lvl-/g) || []).length === 3 && read(l).includes(`href="/${l}/entdecken/"`)) && /<html[^>]*lang="de-x-leicht"/.test(read('leicht')) && read('leicht').includes('Strom verstehen')],
  ['Startseite: kein Video, keine Kanäle, kein Formular, kein Lernpfad, keine Themen-Karten (Spec: vorerst leer)', () => ['de', 'tr', 'ar'].every((l) => !/class="video|class="[^"]*\bkanal-|ww-lernpfad|<form|mitglied kompakt|class="thema[ "]|hero-schaltkreis/.test(read(l)))],
  ['Startseite: description ohne Kanal-Nennung, lastUpdated aus', () => !/YouTube|TikTok|Instagram/.test(read('de').match(/<meta name="description"[^>]*>/)?.[0] ?? '') && !read('de').includes('Zuletzt bearbeitet')],
  // TP1 · Task 8: Sichtbarkeit (Spec §10)
  ['Sichtbarkeit: kein Kanal-Link (YouTube/TikTok/Instagram) auf Startseite, Artikel, Über, Mitglied, Footer; Über + Mitglied „in Vorbereitung“', () => ['de', `de/${ARTIKEL}`, 'de/ueber', 'de/mitglied', 'tr/ueber'].every((p) => !/youtube\.com\/@|tiktok\.com\/@|instagram\.com\/wattwas|class="kanal |social-icons[^"]*">\s*<a/.test(read(p))) && read('de/ueber').includes('class="kanaele-bald') && read('de/mitglied').includes('class="kanaele-bald') && !read(`de/${ARTIKEL}`).includes('kanaele-bald')],
  ['Sichtbarkeit: social.json ohne url (bis Kadir Kanäle anlegt); videos.json ohne status live', () => JSON.parse(readFileSync(join(src, 'data/social.json'), 'utf8')).kanaele.every((k) => !k.url) && JSON.parse(readFileSync(join(src, 'data/videos.json'), 'utf8')).videos.every((v) => !(v.status === 'live' && v.url))],
  ['Über/EGT/Blog: keine Sätze mehr über Kurzvideos oder Kanäle (8 Locales)', () => INHALT_LOCALES.every((l) => !/YouTube/.test(mdx(l, 'ueber')) && !/YouTube/.test(mdx(l, `${EGT}/index`)) && !/Kurzvideo|short video|kısa video|коротк\S* видео|فيديو|ویدیو|ვიდეო|video të shkurt/i.test(mdx(l, 'blog/index')))],
  // TP1 · Task 9: Entdecken
  ['Entdecken: 9 Locales, Katalog-Klasse, Filter-Seitenleiste, Geselle-Kasten, kein Inhaltsverzeichnis, kein „Zuletzt bearbeitet“', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/entdecken`))) && /class="page sl-flex ww-katalog(?: astro-[\w-]+)?"/.test(read('de/entdecken')) && read('de/entdecken').includes('<ww-entdecken-filter') && /class="ww-geselle(?: astro-[\w-]+)?"/.test(read('de/entdecken')) && !read('de/entdecken').includes('starlight-toc') && !read('de/entdecken').includes('Zuletzt bearbeitet')],
  ['Entdecken: Banner ×3, Empfohlen ×3 (je Stufe, Karten ≥ 4/4/4), Themen ≥ 5 Bereiche, Werkzeug 4 Karten, Marken-Block, kein Video', () => { const h = read('de/entdecken'); return (h.match(/class="banner(?: astro-[\w-]+)?"/g) || []).length === 3 && ['einstieg', 'azubi', 'profi'].every((s) => new RegExp(`data-block="empfohlen" data-fuer="${s}"`).test(h)) && (h.match(/class="ww-karte karte"/g) || []).length >= 26 && (h.match(/class="ww-karte bereich(?: astro-[\w-]+)?"/g) || []).length >= 5 && (h.match(/class="ww-karte werkzeug-karte(?: astro-[\w-]+)?"/g) || []).length === 4 && !h.includes('data-block="neu"') && !h.includes('class="video'); }],
  ['Entdecken: Karte mit data-stufe/data-bereich, Stufen-Pill, Lernfeld-Tag, Lesezeit + Quiz; Ergebnisse-Block versteckt', () => { const h = read('de/entdecken'); return /class="ww-karte karte" href="\/de\/grundlagen\/schutzorgane\/" data-slug="grundlagen\/schutzorgane" data-stufe="azubi" data-bereich="grundlagen"/.test(h) && /data-slug="grundlagen\/schutzorgane"[\s\S]{0,900}?ww-pill ww-pill-azubi[\s\S]{0,600}?Lernfeld 2[\s\S]{0,300}?Min\. · Quiz 5/.test(h) && /<section class="block ergebnisse(?: astro-[\w-]+)?" data-block="ergebnisse"[^>]*hidden/.test(h); }],
  ['Entdecken (tr/ar): Sprache der Seite, deutsche Slugs, RTL', () => read('tr/entdecken').includes('href="/tr/grundlagen/schutzorgane/"') && read('tr/entdecken').includes('Schutzorgane – LS, RCD, SLS ve') && read('tr/entdecken').includes('<span lang="de">Azubi</span> için öneriler') && /<html[^>]*dir="rtl"/.test(read('ar/entdecken'))],
  ['Entdecken: Filter-Seitenleiste mit Stufen-Zählern (Start 7, Azubi 5, Profi 0), Bereichen, Werkzeug-Links; mobil Filter-Chip', () => { const h = read('de/entdecken'); return /data-filter="stufe:einstieg"[^<]*<small[^>]*>7</.test(h) && /data-filter="stufe:azubi"[^<]*<small[^>]*>5</.test(h) && /data-filter="stufe:profi"[^<]*<small[^>]*>0</.test(h) && h.includes('data-filter="bereich:anleitungen"') && h.includes('data-filter="zuletzt"') && /popovertarget="starlight__sidebar"[^>]*class="ww-chip md:sl-hidden(?: astro-[\w-]+)?"|class="ww-chip md:sl-hidden(?: astro-[\w-]+)?"[^>]*popovertarget="starlight__sidebar"/.test(h); }],
  ['Entdecken: jede Inhaltsseite genau einmal in bereiche (entdecken.json)', () => { const e = JSON.parse(readFileSync(join(src, 'data/entdecken.json'), 'utf8')); const alle = e.bereiche.flatMap((b) => b.seiten); return Object.keys(STUFEN_SOLL).every((s) => alle.filter((x) => x === s).length === 1) && alle.length === Object.keys(STUFEN_SOLL).length; }],
  // TP1 · Task 10: Lernen
  ['Lernen: 9 Locales, 4 Karten (Grundlagen, Sicherheit, EGT, Anleitungen) mit Unterlisten, Nav-Seitenleiste mit Badges + Geselle', () => { const h = read('de/lernen'); return ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/lernen`))) && (h.match(/class="ww-karte lernen-karte(?: astro-[\w-]+)?"/g) || []).length === 4 && h.includes('data-bereich="anleitungen"') && h.includes(`href="/de/${EGT}/unterverteilung/"`) && h.includes('href="/de/grundlagen/sicherheitsregeln/"') && /class="ww-geselle(?: astro-[\w-]+)?"/.test(h) && h.includes('sl-badge default small ww-stufe') && read('tr/lernen').includes('Kılavuzlar'); }],
  // TP1 · Task 11: keine alten Tokens, keine Reveal/Magnet-Effekte
  ['Quelltext ohne alte Tokens (amber/cyan/grad/orange/grid-line/font-heading/begriff) und ohne reveal/magnet', () => { const dateien = [...srcFiles(join(src, 'components')), join(src, 'styles/wattwas.css'), join(src, '..', 'astro.config.mjs')]; return dateien.every((f) => !/ww-amber|ww-cyan|ww-grad|ww-orange|ww-grid-line|ww-font-heading|ww-begriff|space-grotesk|\breveal\b|\bmagnet\b|#f59e0b|#f97316|#22d3ee|#0f172a/i.test(readFileSync(f, 'utf8'))); }],
  // TP1 · Task 11b: Locale-Auflösung
  ['Quelltext ohne Astro.currentLocale (starlightRoute.locale statt BCP-47-Code)', () => [...srcFiles(join(src, 'components')), ...srcFiles(join(src, 'scripts')), join(src, 'routeData.ts')].filter((f) => existsSync(f)).every((f) => !readFileSync(f, 'utf8').includes('Astro.currentLocale'))],
  ['Leichte Sprache: /leicht/ nutzt ui.leicht (Theme-Label „Dunkel“, Tab „Fach-Wörter“), nicht ui.de', () => { const h = read('leicht'); return !h.includes('Dunkles Design') && h.includes('Fach-Wörter'); }],
  // TP1 · Task 12
  ['Datenschutz: Stufe (ww-stufe) und Lesefortschritt als localStorage genannt', () => { const h = read('de/rechtliches/datenschutz'); return /<code[^>]*>ww-stufe<\/code>/.test(h) && h.includes('Stufen-Hinweis ausgeblendet') && h.includes('Lesefortschritt'); }],
  ['UI-Strings: keine toten Startseiten-Schlüssel mehr (kicker, folgeTitel, community…, videos)', () => Object.values(uiJson).every((t) => ['kicker', 'ctaSocialTitel', 'heroBildLabel', 'saeulenTitel', 'folgeEyebrow', 'folgeTitel', 'folgeUntertitel', 'themenEyebrow', 'themenTitel', 'themenUntertitel', 'themenAlle', 'themen', 'lernpfadEyebrow', 'lernpfadTitel', 'lernpfadUntertitel', 'anleitungenEyebrow', 'anleitungenTitel', 'anleitungenUntertitel', 'werkzeugEyebrow', 'werkzeugTitel', 'werkzeugUntertitel', 'werkzeugCta', 'unterstuetzenTitel', 'unterstuetzenText', 'communityEyebrow', 'communityTitel', 'communityText', 'communityPlatzhalter', 'communityCta', 'communityBald', 'communityDatenschutz', 'kanalCta', 'stufeLabel'].every((k) => !(k in t)))],
  // Final-Fix-Welle (2026-09-12): F1 Entdecken-Filter blendet Karten wirklich aus
  ['wattwas.css: .ww-karte[hidden] { display: none } (schlägt Author-Origin .ww-karte { display: flex })', () => /\.ww-karte\[hidden\]\s*\{[^}]*display:\s*none/.test(readFileSync(join(src, 'styles/wattwas.css'), 'utf8'))],
  // Final-Fix-Welle: F2 md:sl-hidden wirkt ab 50rem nicht (Starlight @layer verliert gegen unlayered wattwas.css) — eigene Media-Query
  ['wattwas.css: @media (min-width: 50rem) blendet .ww-tabs-mobil, .entdecken/.woerterbuch/.marken-kat Filter-Chip aus', () => { const css = readFileSync(join(src, 'styles/wattwas.css'), 'utf8'); return [...css.matchAll(/@media \(min-width:\s*50rem\)\s*\{([^}]*)\}/g)].some((m) => /\.ww-tabs-mobil/.test(m[1]) && /\.woerterbuch > \.wb-werkzeug > \.ww-chip/.test(m[1]) && /\.marken-kat > \.mk-kopf > \.ww-chip/.test(m[1]) && /display:\s*none/.test(m[1])); }],
  // Final-Fix-Welle: F3 alte Stufennamen Geselle/Meister raus aus Prosa (datenschutz.mdx + 8× mitglied.mdx)
  ['Kein „Geselle oder Meister“/„Geselle/Meister“/„Einstieg/Geselle“ mehr in datenschutz.mdx + mitglied.mdx (9 Dateien)', () => [join(src, 'content/docs/de/rechtliches/datenschutz.mdx'), ...['de', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'].map((l) => join(src, 'content/docs', l, 'mitglied.mdx'))].every((f) => !/Geselle oder Meister|Geselle\/Meister|Einstieg\/Geselle/.test(readFileSync(f, 'utf8')))],
  // TP2 · Task 1: Wörterbuch-Daten
  ['Wörterbuch: JSON gültig, 5 Kategorien, ≥ 80 Einträge, ids eindeutig/kebab-case', () => { const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const ids = w.eintraege.map((e) => e.id); return w.kategorien.join() === 'handwerkzeug,messen,material,psa,maschinen' && w.eintraege.length >= 80 && new Set(ids).size === ids.length && ids.every((i) => /^[a-z0-9-]+$/.test(i)) && w.eintraege.every((e) => w.kategorien.includes(e.kategorie)); }],
  ['Wörterbuch: jeder Eintrag de {artikel, singular, plural}, wofuer.de + wofuer.leicht (≤ 160 Zeichen), grundausstattung boolean', () => JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege.every((e) => ['der', 'die', 'das'].includes(e.de.artikel) && e.de.singular && e.de.plural && e.wofuer.de.length > 10 && e.wofuer.de.length <= 160 && e.wofuer.leicht.length > 10 && e.wofuer.leicht.length <= 160 && typeof e.grundausstattung === 'boolean')],
  ['Wörterbuch: Grundausstattung ≥ 15 Begriffe, jede Kategorie ≥ 8, Umgangssprache ≥ 8 (Flex, Engländer, Lügenstift …)', () => { const e = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege; return e.filter((x) => x.grundausstattung).length >= 15 && ['handwerkzeug', 'messen', 'material', 'psa', 'maschinen'].every((k) => e.filter((x) => x.kategorie === k).length >= 8) && e.filter((x) => x.de.umgangssprache).length >= 8; }],
  // TP2 · Task 2: Wörterbuch-Übersetzungen
  ['Wörterbuch: alle 7 Sprachen je Eintrag (i18n.begriff + wofuer), _stand je Sprache', () => { const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const L = ['en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return L.every((l) => /^\d{4}-\d{2}$/.test(w._stand[l] ?? '')) && w.eintraege.every((e) => L.every((l) => (e.i18n[l]?.begriff ?? '').trim().length > 0 && (e.wofuer[l] ?? '').trim().length > 10 && e.wofuer[l].length <= 220)); }],
  ['Wörterbuch: Schriftsystem passt (ar/fa arabisch, ka georgisch, ru kyrillisch ≥ 90 %), Begriff ≠ deutsches Wort (tr/en ≥ 80 %), keine Fremdschrift (CJK/Hangul), Hinweis nie bloßes Umgangswort, Markennamen lateinisch in allen 7 Sprachen, kein fremdes Rahmenwort, Lehnwort erfordert Hinweis, keine Schriftmischung im Wort', () => { const e = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')).eintraege; const L = ['en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; const anteil = (l, re) => e.filter((x) => re.test(x.i18n[l].begriff + x.wofuer[l])).length / e.length; const anders = (l) => e.filter((x) => x.i18n[l].begriff.toLowerCase() !== x.de.singular.toLowerCase()).length / e.length; const fremd = /[぀-ヿ㐀-䶿一-鿿가-힯]/; const MARKEN = ['Duspol', 'Wago', 'Knipex', 'Wiha', 'Wera', 'Bosch', 'Hilti', 'Makita', 'Fluke', 'Benning']; const RAHMEN = { en: 'colloquially', tr: 'Halk arasında', ru: 'в просторечии', ar: 'تُسمى أيضاً', fa: 'در محاوره', ka: 'სასაუბროდ', sq: 'në zhargon' }; const LATEIN = /[A-Za-zÄÖÜäöüß]/; const ZIELSCHRIFT = { ka: /[Ⴀ-ჿ]/, ru: /[Ѐ-ӿ]/, ar: /[؀-ۿ]/, fa: /[؀-ۿ]/ }; const SATZZEICHEN = '.,;:!?()«»"\'”“،؛؟…'; const quelle = (x) => `${x.wofuer.de} ${x.de.singular} ${x.de.umgangssprache ?? ''}`; const ziel = (x, l) => `${x.i18n[l].begriff} ${x.i18n[l].hinweis ?? ''} ${x.wofuer[l]}`; const bloss = (x, l) => { const h = x.i18n[l].hinweis; if (!h) return false; const hh = h.trim().toLowerCase(); const kandidaten = new Set([x.de.singular.trim().toLowerCase()]); const u = (x.de.umgangssprache ?? '').trim().toLowerCase(); if (u) { kandidaten.add(u); u.split(',').forEach((t) => kandidaten.add(t.trim())); } return kandidaten.has(hh); }; const fremdesRahmen = (x, l) => { const h = (x.i18n[l].hinweis ?? '').toLowerCase(); return Object.entries(RAHMEN).some(([y, w]) => y !== l && h.includes(w.toLowerCase())); }; const lehnwortOk = (x, l) => { const b = x.i18n[l].begriff.toLowerCase(); const quellen = new Set([x.de.singular.toLowerCase()]); if (x.de.umgangssprache) { quellen.add(x.de.umgangssprache.toLowerCase()); x.de.umgangssprache.split(',').forEach((t) => quellen.add(t.trim().toLowerCase())); } return !quellen.has(b) || Boolean(x.i18n[l].hinweis); }; const trimTok = (s) => { let a = 0, b = s.length; while (a < b && SATZZEICHEN.includes(s[a])) a++; while (b > a && SATZZEICHEN.includes(s[b - 1])) b--; return s.slice(a, b); }; const schriftmischung = (l, text) => { const zs = ZIELSCHRIFT[l]; if (!zs) return false; return text.split(/\s+/).some((tok) => { const k = trimTok(tok); return !k.includes('-') && LATEIN.test(k) && zs.test(k); }); }; return anteil('ar', /[؀-ۿ]/) >= 0.9 && anteil('fa', /[؀-ۿ]/) >= 0.9 && anteil('ka', /[Ⴀ-ჿ]/) >= 0.9 && anteil('ru', /[Ѐ-ӿ]/) >= 0.9 && anders('tr') >= 0.8 && anders('en') >= 0.8 && e.every((x) => L.every((l) => !fremd.test(ziel(x, l)))) && e.every((x) => L.every((l) => !bloss(x, l))) && e.every((x) => MARKEN.every((m) => !quelle(x).toLowerCase().includes(m.toLowerCase()) || L.every((l) => ziel(x, l).toLowerCase().includes(m.toLowerCase())))) && e.every((x) => L.every((l) => !fremdesRahmen(x, l))) && e.every((x) => L.every((l) => lehnwortOk(x, l))) && e.every((x) => L.every((l) => !schriftmischung(l, x.i18n[l].begriff) && !schriftmischung(l, x.i18n[l].hinweis ?? '') && !schriftmischung(l, x.wofuer[l]))); }],
  // TP2 · Task 3: UI-Strings
  ['UI-Strings: Blöcke woerterbuch/marken in 9 Locales, tr/ar lokalisiert, Kategorienamen vollständig', () => { const K = ['handwerkzeug', 'messen', 'material', 'psa', 'maschinen']; return Object.values(uiJson).every((t) => t.woerterbuch && t.marken && K.every((k) => t.woerterbuch.kategorien[k]) && t.marken.filterGruppen.budget) && uiJson.tr.woerterbuch.titel !== uiJson.de.woerterbuch.titel && /[؀-ۿ]/.test(uiJson.ar.marken.hinweis) && uiJson.leicht.marken.hinweis.length < uiJson.de.marken.hinweis.length + 40; }],
  // TP2 · Task 4: Wörterbuch-Seite
  ['Wörterbuch: 9 Locales, Katalog-Layout, Filter-Seitenleiste, Geselle-Kasten, alle Zeilen (WB_N), Suche, 3 Chips, kein TOC', () => ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => existsSync(page(`${l}/elektrowerkzeuge/woerterbuch`))) && (() => { const h = read('de/elektrowerkzeuge/woerterbuch'); return /class="page sl-flex ww-katalog(?: astro-[\w-]+)?"/.test(h) && h.includes('<ww-woerterbuch-filter') && /class="ww-geselle(?: astro-[\w-]+)?"/.test(h) && (h.match(/class="wb-zeile(?: astro-[\w-]+)?"/g) || []).length === WB_N && h.includes('type="search"') && (h.match(/class="ww-chip[^"]*"[^>]*data-(sort|grund)/g) || []).length === 3 && !h.includes('starlight-toc'); })()],
  ['Wörterbuch (de): Zielspalte Englisch, Begriff lang=de translate=no, Duspol/Flex/Engländer, Grundausstattung-Pill ≥ 15, Foto-folgt-Platzhalter', () => { const h = read('de/elektrowerkzeuge/woerterbuch'); return /<th scope="col"[^>]*>Englisch</.test(h) && /id="zweipoliger-spannungspruefer"[^>]*>[\s\S]{0,400}?lang="de" translate="no"/.test(h) && ['Duspol', 'Flex', 'Engländer'].every((w) => h.includes(w)) && (h.match(/ww-pill ww-pill-tag(?: astro-[\w-]+)?">Grundausstattung</g) || []).length >= 15 && (h.match(/Foto folgt/g) || []).length === WB_N; }],
  ['Wörterbuch (tr): türkische Köpfe + Begriffe, deutsche Begriffe bleiben; (ar) RTL; (leicht) keine Zielspalte, Leichte-Sprache-Wofür', () => { const tr = read('tr/elektrowerkzeuge/woerterbuch'), le = read('leicht/elektrowerkzeuge/woerterbuch'); return tr.includes('Winkelschleifer') && tr.includes('Alet Sözlüğü') && /class="wb-ziel(?: astro-[\w-]+)?"[^>]*lang="tr"/.test(tr) && !/<th scope="col"[^>]*>Englisch</.test(tr) && /<html[^>]*dir="rtl"/.test(read('ar/elektrowerkzeuge/woerterbuch')) && !/class="wb-ziel/.test(le) && le.includes('Erst prüfen, dann arbeiten.'); }],
  ['Wörterbuch: Filter-Seitenleiste 5 Kategorien mit Zählern (Summe WB_N), mobiler Filter-Chip, data-such/data-sort je Zeile', () => { const h = read('de/elektrowerkzeuge/woerterbuch'); const z = [...h.matchAll(/data-filter="kat:[a-z]+"[^<]*<small[^>]*>(\d+)</g)].map((m) => Number(m[1])); return z.length === 5 && z.reduce((a, b) => a + b, 0) === WB_N && /popovertarget="starlight__sidebar"[^>]*class="ww-chip md:sl-hidden|class="ww-chip md:sl-hidden[^"]*"[^>]*popovertarget="starlight__sidebar"/.test(h) && (h.match(/data-such="[^"]+"/g) || []).length === WB_N && (h.match(/<tr class="wb-zeile(?: astro-[\w-]+)?"[^>]*data-sort="[^"]+"/g) || []).length === WB_N; }],
  ['Wörterbuch in Seitenleiste (Gruppe Werkzeug, Reihenfolge Guide · Grundausstattung · Wörterbuch) und Entdecken: 4 Werkzeug-Karten', () => { const h = read(`de/${ARTIKEL}`); const i = (p) => h.indexOf(`href="/de/elektrowerkzeuge/${p}"`); return i('') > -1 && i('') < i('grundausstattung-azubi/') && i('grundausstattung-azubi/') < i('woerterbuch/') && (read('de/entdecken').match(/class="ww-karte werkzeug-karte(?: astro-[\w-]+)?"/g) || []).length === 4; }],
  // TP2 · Task 5: Marken-Daten
  ['Marken: JSON gültig, 10 Kategorien in Spec-Reihenfolge, name/kurz in 9 Locales, affiliateAktiv false', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return m.affiliateAktiv === false && m.kategorien.map((k) => k.id).join() === 'spannungspruefer,multimeter,installationstester,akkuschrauber,zangen,schraubendreher,abisolierwerkzeug,kabelfinder,bohrhammer,psa' && m.kategorien.every((k) => L.every((l) => k.name[l] && k.kurz[l]) && Array.isArray(k.woerterbuch)); }],
  ['Marken: ≥ 30 Modelle, je Kategorie 3–6, ids eindeutig, Pflichtfelder, specs 3–8, quelle/datenblatt https, stand JJJJ-MM, kurz 9 Locales ≤ 160', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; const ids = m.modelle.map((x) => x.id); const kats = m.kategorien.map((k) => k.id); return m.modelle.length >= 30 && new Set(ids).size === ids.length && kats.every((k) => { const n = m.modelle.filter((x) => x.kategorie === k).length; return n >= 3 && n <= 6; }) && m.modelle.every((x) => /^[a-z0-9-]+$/.test(x.id) && x.marke && x.modell && kats.includes(x.kategorie) && ['einstieg', 'azubi', 'profi'].includes(x.stufe) && [1, 2, 3].includes(x.budget) && typeof x.verbreitet === 'boolean' && L.every((l) => x.kurz[l] && x.kurz[l].length <= 160) && x.specs.length >= 3 && x.specs.length <= 8 && x.specs.every((s) => s.k && s.v) && /^https:\/\//.test(x.quelle) && (!x.datenblatt || /^https:\/\//.test(x.datenblatt)) && /^\d{4}-\d{2}$/.test(x.stand) && !('affiliate' in x && x.affiliate && !x.affiliate.url)); }],
  ['Marken: Änderungsprotokoll gültig (datum, modell existiert, text 9 Locales), ≥ 1 Eintrag; Wörterbuch → Modelle: alle ids existieren, ≥ 10 Begriffe verknüpft', () => { const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8')); const c = JSON.parse(readFileSync(join(src, 'data/marken-changelog.json'), 'utf8')); const w = JSON.parse(readFileSync(join(src, 'data/woerterbuch.json'), 'utf8')); const ids = new Set(m.modelle.map((x) => x.id)); const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq']; return c.eintraege.length >= 1 && c.eintraege.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.datum) && ids.has(e.modell) && L.every((l) => e.text[l])) && w.eintraege.every((e) => (e.marken ?? []).every((id) => ids.has(id))) && w.eintraege.filter((e) => (e.marken ?? []).length > 0).length >= 10 && m.kategorien.every((k) => k.woerterbuch.every((id) => w.eintraege.some((e) => e.id === id))); }],
  // TP2 · Task 6: Marken-Seiten
  ['Marken: Übersicht + 10 Kategorieseiten in 9 Locales (99), Katalog-Layout, Filter-Seitenleiste, Hinweis, Protokoll', () => { const K = ['spannungspruefer', 'multimeter', 'installationstester', 'akkuschrauber', 'zangen', 'schraubendreher', 'abisolierwerkzeug', 'kabelfinder', 'bohrhammer', 'psa']; const L = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq']; const h = read('de/elektrowerkzeuge/marken'); return L.every((l) => existsSync(page(`${l}/elektrowerkzeuge/marken`)) && K.every((k) => existsSync(page(`${l}/elektrowerkzeuge/marken/${k}`)))) && /class="page sl-flex ww-katalog(?: astro-[\w-]+)?"/.test(h) && h.includes('<ww-marken-filter') && (h.match(/class="ww-karte marken-kat(?: astro-[\w-]+)?"/g) || []).length === 10 && h.includes('Keine Kaufempfehlung') && /class="mk-log(?: astro-[\w-]+)?"/.test(h); }],
  ['Marken (de/zangen): ≥ 3 Modell-Karten mit data-stufe/data-budget, Name lang=de translate=no, Kennwerte, Hersteller-Link noopener, Vergleichstabelle, Stufen-Pill, Karten-Ergebnis versteckt', () => { const h = read('de/elektrowerkzeuge/marken/zangen'); return h.includes('<ww-marken') && (h.match(/class="ww-karte modell(?: astro-[\w-]+)?" id="[a-z0-9-]+" data-stufe="(einstieg|azubi|profi)" data-budget="[123]"/g) || []).length >= 3 && /class="karte-titel(?: astro-[\w-]+)?" lang="de" translate="no">Knipex /.test(h) && /class="mk-specs(?: astro-[\w-]+)?"><dt/.test(h) && /<a class="ww-link[^"]*" href="https:\/\/[^"]+" rel="noopener" target="_blank"/.test(h) && /class="mk-vergleich(?: astro-[\w-]+)?"/.test(h) && /ww-pill ww-pill-(einstieg|azubi|profi)/.test(h) && /class="mk-keine(?: astro-[\w-]+)?" hidden/.test(h); }],
  // Final-Fix-Welle (14.09.): I3 RTL-Werte – Kennwert-Werte bleiben in ar/fa als <bdi dir="ltr"> ungedreht
  ['Marken (ar/multimeter): jeder Kennwert-Wert (Karte <dd> + Vergleichstabelle <td>) in <bdi dir="ltr" lang="de" translate="no">', () => {
    const h = read('ar/elektrowerkzeuge/marken/multimeter');
    const ddGesamt = (h.match(/<dd(?: class="[^"]*")?>/g) || []).length;
    const ddBdi = (h.match(/<dd(?: class="[^"]*")?><bdi dir="ltr" lang="de" translate="no"(?: class="[^"]*")?>[^<]*<\/bdi><\/dd>/g) || []).length;
    const tdGesamt = (h.match(/<td(?: class="[^"]*")?>/g) || []).length;
    const tdBdi = (h.match(/<td(?: class="[^"]*")?><bdi dir="ltr" lang="de" translate="no"(?: class="[^"]*")?>/g) || []).length;
    return ddGesamt > 0 && ddGesamt === ddBdi && tdGesamt > 0 && tdGesamt === tdBdi;
  }],
  ['Marken: Filter-Seitenleiste – 10 Kategorie-Links mit Zählern, aria-current auf der Kategorie, Stufe/Budget/Verbreitung nur auf Kategorieseiten; Kategorieseiten nicht in der Starlight-Seitenleiste, Übersicht schon', () => { const u = read('de/elektrowerkzeuge/marken'), k = read('de/elektrowerkzeuge/marken/zangen'), a = read(`de/${ARTIKEL}`); return (u.match(/href="\/de\/elektrowerkzeuge\/marken\/[a-z]+\/"[^>]*>[^<]*<small/g) || []).length === 10 && !u.includes('data-filter="stufe:') && /href="\/de\/elektrowerkzeuge\/marken\/zangen\/" aria-current="page"/.test(k) && ['stufe:einstieg', 'budget:2', 'verbreitet', 'reset'].every((f) => k.includes(`data-filter="${f}"`)) && a.includes('href="/de/elektrowerkzeuge/marken/"') && !a.includes('href="/de/elektrowerkzeuge/marken/zangen/"'); }],
  ['Marken (tr/ar): Kategorie-Name lokalisiert, Modellnamen unverändert, RTL; Wörterbuch → Modelle ≥ 10 Links; Entdecken: Marken-Block ≤ 4 Karten mit Kategorienamen + 4 Werkzeug-Karten', () => { const tr = read('tr/elektrowerkzeuge/marken/zangen'); const e = read('de/entdecken'); const block = e.match(/data-block="marken"[\s\S]*?<\/section>/)?.[0] ?? ''; return tr.includes('Knipex') && !tr.includes('<title>Zangen') && /<html[^>]*dir="rtl"/.test(read('ar/elektrowerkzeuge/marken')) && (read('de/elektrowerkzeuge/woerterbuch').match(/class="wb-marken(?: astro-[\w-]+)?"[^>]*><a /g) || []).length >= 10 && block !== '' && (block.match(/class="ww-karte(?: astro-[\w-]+)?" href/g) || []).length <= 4 && (e.match(/class="ww-karte werkzeug-karte(?: astro-[\w-]+)?"/g) || []).length === 4 && !/karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>[a-z]+</.test(block); }],
  ['Marken: Generator-Check – node scripts/marken-seiten.mjs --check meldet keine Abweichung (schreibt nichts)', () => { execSync('node scripts/marken-seiten.mjs --check', { cwd: join(src, '..') }); return true; }],
  // TP2 · Task 6, Fix-Runde 1: Seitenleiste ohne verschachtelten „marken“-Ordnerknoten (Spec §3.2: flache Liste je Gruppe)
  ['Seitenleiste (de/en): Werkzeug-Gruppe flach – Link auf Marken-Übersicht da, keine aufklappbare Untergruppe „marken“', () => ['de', 'en'].every((l) => { const h = read(`${l}/${ARTIKEL}`); return h.includes(`href="/${l}/elektrowerkzeuge/marken/"`) && !(h.match(/<summary[\s\S]*?<\/summary>/gi) || []).some((s) => /marken/i.test(s)); })],
  // TP2 · Task 7: Tab, Kicker, Hub
  ['Marken-Tab aktiv: 6 Tabs im Header (de, tr), Marken-Tab aria-current auf /marken/zangen/, Werkzeug-Tab dort nicht aktuell', () => { const z = read('de/elektrowerkzeuge/marken/zangen'); const kopf = (h) => h.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''; return ['entdecken', 'lernen', 'elektrowerkzeuge', 'elektrowerkzeuge/marken', 'glossar', 'blog'].every((p) => kopf(read('de')).includes(`href="/de/${p}/"`)) && kopf(read('tr')).includes('href="/tr/elektrowerkzeuge/marken/"') && /href="\/de\/elektrowerkzeuge\/marken\/"[^>]*aria-current="page"/.test(kopf(z)) && !/href="\/de\/elektrowerkzeuge\/"[^>]*aria-current="page"/.test(kopf(z)); }],
  ['Werkzeug-Hub: Karten zu Wörterbuch und Marken (de, tr), Entdecken-Marken-Kicker zeigt Kategorienamen', () => { const h = read('de/elektrowerkzeuge'); const block = read('de/entdecken').match(/data-block="marken"[\s\S]*?<\/section>/)?.[0] ?? ''; const kicks = [...block.matchAll(/karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>([^<]+)</g)].map((m) => m[1]); return /class="wz-mehr(?: astro-[\w-]+)?"/.test(h) && h.includes('href="/de/elektrowerkzeuge/woerterbuch/"') && h.includes('href="/de/elektrowerkzeuge/marken/"') && read('tr/elektrowerkzeuge').includes('href="/tr/elektrowerkzeuge/woerterbuch/"') && block !== '' && /karte-kick(?: astro-[\w-]+)?"><span(?: class="[^"]*")?>[A-ZÄÖÜ]/.test(block) && kicks.length > 0 && new Set(kicks).size === kicks.length; }],
  // TP2 · Task 9 (Nachtrag 14.09., A): Kennwert-Namen in 9 Sprachen
  ['Marken: kennwerte für alle 42 specs-Schlüssel, 9 Locales gefüllt (je ≤ 40 Zeichen), de/leicht = Schlüssel selbst', () => {
    const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8'));
    const L = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'];
    const keys = [...new Set(m.modelle.flatMap((x) => x.specs.map((s) => s.k)))];
    return keys.length === 42 && keys.every((k) => {
      const kw = m.kennwerte?.[k];
      return Boolean(kw) && kw.de === k && kw.leicht === k && L.every((l) => typeof kw[l] === 'string' && kw[l].trim().length > 0 && kw[l].length <= 40);
    });
  }],
  ['Marken: Kennwert-Namen lokalisiert – tr/spannungspruefer + ar/multimeter zeigen „Spannungsbereich“ im Vergleich-thead nur im title (nicht als Text); de/spannungspruefer weiter als sichtbarer Text', () => {
    const thead = (p) => read(p).match(/<thead[^>]*>[\s\S]*?<\/thead>/)?.[0] ?? '';
    const tr = thead('tr/elektrowerkzeuge/marken/spannungspruefer');
    const ar = thead('ar/elektrowerkzeuge/marken/multimeter');
    const de = thead('de/elektrowerkzeuge/marken/spannungspruefer');
    const KEY = 'Spannungsbereich';
    const alsText = (h) => new RegExp(`>${KEY}<`).test(h);
    const alsTitel = (h) => h.includes(`title="${KEY}"`);
    return !alsText(tr) && alsTitel(tr) && !alsText(ar) && alsTitel(ar) && alsText(de) && !alsTitel(de);
  }],
  // TP2 · Task 9 (Nachtrag 14.09., B): Stufe „Profi“ → „Fachkraft“ (Rückmeldung R2), Code-Schlüssel profi bleibt
  ['Stufe „Fachkraft“ (R2, 14.09.): stufen.profi je Locale (de Fachkraft, leicht Fach-Kraft, en Skilled worker, tr/ru/ar/fa/ka/sq deutsch Fachkraft), Code-Schlüssel profi unverändert', () => {
    const SOLL = { de: 'Fachkraft', leicht: 'Fach-Kraft', en: 'Skilled worker', tr: 'Fachkraft', ru: 'Fachkraft', ar: 'Fachkraft', fa: 'Fachkraft', ka: 'Fachkraft', sq: 'Fachkraft' };
    return Object.entries(SOLL).every(([l, soll]) => uiJson[l].stufen.profi === soll) && Object.values(uiJson).every((t) => Object.keys(t.stufen).join() === 'einstieg,azubi,profi');
  }],
  ['Stufe „Fachkraft“: kein stufeLegende nennt „Profi“ oder „Pro“ mehr als Stufenname', () => Object.values(uiJson).every((t) => !/\bProfi\b/.test(t.stufeLegende) && !/\bPro\b/.test(t.stufeLegende))],
  // Final-Fix-Welle (14.09., nach Review): Merge neuaufbau – Stufenname in mitglied.mdx auf Fachkraft/Skilled worker vereinheitlicht
  ['Merge neuaufbau: mitglied.mdx (de/en/tr/ru/ar/fa/ka/sq) enthält stufen.profi der Locale, keine mehr „Profi“/„Pro“/„Профи“/„Uzman“ als Stufenname', () => ['de', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => {
    const t = mdx(l, 'mitglied');
    return t.includes(uiJson[l].stufen.profi) && !/\bProfi\b/.test(t) && !/\bPro\b/.test(t) && !/Профи/.test(t) && !/Uzman/.test(t);
  })],
  // Go-Live-Audit (14.09.): keine toten internen Links in dist (vorher 72 relative 404: Lernpfad-Karten, Über/Mitglied → Rechtliches)
  ['Interne Links: jedes href/src mit „/“ in dist/**/*.html löst auf eine Datei in dist auf (Verzeichnis → index.html)', () => meldeKaputt(interneLinks().absolut) && interneLinks().nAbsolut > 1000],
  ['Interne Links: jedes relative href/src löst ab seiner Seiten-URL auf eine Datei in dist auf', () => meldeKaputt(interneLinks().relativ)],
  ['Lernpfad /<locale>/grundlagen/ (9 Locales): 4 Kapitel-Karten mit absolutem Pfad /<locale>/grundlagen/<kapitel>/, Ziel existiert', () => LOCALES_9.every((l) => {
    const hrefs = kapitelKarten(l);
    return hrefs.length === 4 && hrefs.every((h) => new RegExp(`^/${l}/grundlagen/[a-z-]+/$`).test(h) && existsSync(join(dist, h, 'index.html')));
  })],
  ['Über + Mitglied (8 Locales): Links auf Rechtliches/Mitglied sind absolute Locale-Pfade, kein „](./“ mehr', () => INHALT_LOCALES.every((l) =>
    !/\]\(\.\//.test(mdx(l, 'ueber')) && !/\]\(\.\//.test(mdx(l, 'mitglied')) &&
    mdx(l, 'ueber').includes(`](/${l}/rechtliches/impressum/)`) && mdx(l, 'ueber').includes(`](/${l}/mitglied/)`) && mdx(l, 'mitglied').includes(`](/${l}/rechtliches/datenschutz/)`))],
  // Aufräumen 14.09. – CI
  // Workflows: jede uses: SHA-gepinnt, deploy.yml testet vor dem Upload, minimale Rechte, Node aus .nvmrc; Dependabot nur Actions (monatlich).
  ...(() => {
    const repo = join(src, '..');
    const lesen = (p) => readFileSync(join(repo, p), 'utf8').replace(/\r\n/g, '\n');
    const wf = (n) => lesen(`.github/workflows/${n}`);
    // Zeilen nach der (exakten) Kopfzeile, solange leer oder tiefer als `einzug` Leerzeichen eingerückt; null, wenn die Kopfzeile fehlt
    const block = (text, kopf, einzug) => {
      const z = text.split('\n');
      const i = z.indexOf(kopf);
      if (i < 0) return null;
      const rest = z.slice(i + 1);
      const ende = rest.findIndex((l) => l.trim() !== '' && l.length - l.trimStart().length <= einzug);
      return (ende < 0 ? rest : rest.slice(0, ende)).join('\n').trimEnd();
    };
    // ein Schritt ab „uses: <action>@“ bis zum nächsten „- “-Listeneintrag
    const schritt = (text, action) => { const i = text.indexOf(`uses: ${action}@`); if (i < 0) return ''; const rest = text.slice(i); const j = rest.search(/\n\s*- /); return j < 0 ? rest : rest.slice(0, j); };
    const eintraege = (b) => (b ?? '').split('\n').map((l) => l.replace(/\s+#.*$/, '').trim()).filter(Boolean).sort().join('|');
    const zeile = (cmd) => new RegExp(`^\\s+(?:- )?run: ${cmd}\\s*$`, 'm');
    const PIN = /^\s*(?:- )?uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+\s*$/;
    return [
      ['CI: jede uses: in .github/workflows/*.yml ist auf eine volle 40-stellige Commit-SHA gepinnt, mit Versionskommentar „# vX.Y.Z“', () => {
        const namen = readdirSync(join(repo, '.github/workflows')).filter((n) => /\.ya?ml$/.test(n));
        const uses = namen.flatMap((n) => wf(n).split('\n')).filter((l) => /\buses:/.test(l.replace(/(^|\s)#.*$/, '')));
        return namen.length > 0 && uses.length > 0 && uses.every((l) => PIN.test(l));
      }],
      ['CI: deploy.yml Job build – npm ci → npm run build → npm test → actions/upload-pages-artifact (path: dist), ohne if:/continue-on-error (Test-Fehler stoppt den Upload); kein withastro/action mehr', () => {
        const t = wf('deploy.yml');
        const build = block(t, '  build:', 2) ?? '';
        const pos = [zeile('npm ci'), zeile('npm run build'), zeile('npm test'), /^\s+(?:- )?uses: actions\/upload-pages-artifact@/m].map((r) => build.search(r));
        return pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])) && /^\s+path: dist\/?\s*$/m.test(schritt(build, 'actions/upload-pages-artifact')) && !/^\s+(?:- )?(?:if|continue-on-error):/m.test(build) && !t.includes('withastro/action');
      }],
      ['CI: deploy.yml Rechte minimal – global nur contents: read; pages: write + id-token: write nur im deploy-Job, build ohne eigene permissions', () => {
        const t = wf('deploy.yml');
        const build = block(t, '  build:', 2);
        const deploy = block(t, '  deploy:', 2);
        return eintraege(block(t, 'permissions:', 0)) === 'contents: read' && deploy !== null && eintraege(block(deploy, '    permissions:', 4)) === 'id-token: write|pages: write' && build !== null && !/^\s*permissions:/m.test(build) && (t.match(/^\s*(?:pages|id-token):\s*write\b/gm) || []).length === 2;
      }],
      ['CI: Trigger und concurrency unverändert – push auf main + workflow_dispatch; deploy.yml group pages (cancel false), deploy-cloudflare.yml group cloudflare-pages (cancel true)', () => {
        const TRIGGER = '  push:\n    branches: [main]\n  workflow_dispatch:';
        const t1 = wf('deploy.yml');
        const t2 = wf('deploy-cloudflare.yml');
        return block(t1, 'on:', 0) === TRIGGER && block(t2, 'on:', 0) === TRIGGER && block(t1, 'concurrency:', 0) === '  group: pages\n  cancel-in-progress: false' && block(t2, 'concurrency:', 0) === '  group: cloudflare-pages\n  cancel-in-progress: true';
      }],
      ['Node: .nvmrc = 24 und package.json engines.node = ">=24 <25" (gleicher Major wie .nvmrc)', () => {
        const nvmrc = lesen('.nvmrc').trim();
        return nvmrc === '24' && JSON.parse(lesen('package.json')).engines?.node === `>=${nvmrc} <${Number(nvmrc) + 1}`;
      }],
      ['CI: deploy.yml + deploy-cloudflare.yml – checkout mit fetch-depth: 0, setup-node mit node-version-file: .nvmrc und cache: npm, kein node-version-Literal', () => ['deploy.yml', 'deploy-cloudflare.yml'].every((n) => {
        const t = wf(n);
        const node = schritt(t, 'actions/setup-node');
        return /^\s+fetch-depth: 0(?:\s|$)/m.test(schritt(t, 'actions/checkout')) && /^\s+node-version-file: \.nvmrc\s*$/m.test(node) && /^\s+cache: npm\s*$/m.test(node) && !/node-version:/.test(t);
      })],
      ["CI: deploy-cloudflare.yml Logik unverändert – if vars.CLOUDFLARE_PAGES == 'on', Secrets CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID, pages deploy dist --project-name=wattwas --branch=main, npm test vor dem Publish", () => {
        const t = wf('deploy-cloudflare.yml');
        const test = t.search(zeile('npm test'));
        return t.includes("if: ${{ vars.CLOUDFLARE_PAGES == 'on' }}") && t.includes('apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}') && t.includes('accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}') && t.includes('command: pages deploy dist --project-name=wattwas --branch=main') && test >= 0 && test < t.indexOf('uses: cloudflare/wrangler-action@');
      }],
      ['Dependabot: nur package-ecosystem github-actions, directory "/", schedule monthly – kein npm-Eintrag', () => {
        const t = lesen('.github/dependabot.yml');
        const eco = [...t.matchAll(/^\s*-\s+package-ecosystem:\s*"?([\w-]+)"?\s*$/gm)].map((m) => m[1]);
        return /^version: 2\s*$/m.test(t) && eco.join() === 'github-actions' && /^\s+directory:\s*"?\/"?\s*$/m.test(t) && /^\s+interval:\s*"?monthly"?\s*$/m.test(t) && !/interval:\s*"?(?:daily|weekly)/.test(t);
      }],
      ['_headers: https://wattwas.pages.dev/* und https://:version.wattwas.pages.dev/* setzen X-Robots-Tag: noindex (public/_headers, unverändert in dist/_headers)', () => {
        const pub = lesen('public/_headers');
        const bloecke = pub.split(/\n[ \t]*\n/).map((b) => b.split('\n').filter((l) => l.trim() !== '' && !/^\s*#/.test(l)));
        const regel = (url) => bloecke.some((b) => b[0] === url && b.slice(1).some((l) => /^\s+X-Robots-Tag:\s*noindex\s*$/.test(l)));
        return regel('https://wattwas.pages.dev/*') && regel('https://:version.wattwas.pages.dev/*') && readFileSync(join(dist, '_headers'), 'utf8').replace(/\r\n/g, '\n') === pub;
      }],
    ];
  })(),

  // Aufräumen 14.09. – Recht: Schutzorgane-Foto selbst gehostet (src/assets, Astro-Bildoptimierung), CSP img-src ohne Wikimedia,
  // Datenschutz nennt alle Browser-Speicher-Schlüssel, Impressum mit § 18 Abs. 2 MStV und ohne EU-OS-Plattform (eingestellt 20.07.2025).
  ...(() => {
    const dateien = (dir, re) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? dateien(f, re) : re.test(n) ? [f] : []; });
    const rel = (f) => relative(dist, f).split(sep).join('/');
    const FREMD = /(?:^|[\s,])(?:https?:)?\/\//i;
    const CSS_URL_FREMD = /url\(\s*["']?((?:https?:)?\/\/[^)"'\s]*)/gi;
    const alsText = (s) => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').split('\n').map((z) => z.trim()).filter(Boolean).join('\n');
    return [
      ['Keine externen Bilder in dist: kein <img>/<source> src/srcset und kein CSS-url() (HTML + CSS-Dateien) mit fremdem Host – also auch kein upload/thumb/commons.wikimedia.org', () => {
        const funde = [];
        for (const f of htmlFiles(dist)) {
          const h = readFileSync(f, 'utf8');
          for (const [tag] of h.matchAll(/<(?:img|source)\b[^>]*>/gi))
            for (const a of tag.matchAll(/\s(?:src|srcset)=(["'])(.*?)\1/gi)) if (FREMD.test(a[2])) funde.push(`${rel(f)}: ${a[2]}`);
          for (const m of h.matchAll(CSS_URL_FREMD)) funde.push(`${rel(f)}: url(${m[1]})`);
        }
        for (const f of dateien(dist, /\.css$/)) for (const m of readFileSync(f, 'utf8').matchAll(CSS_URL_FREMD)) funde.push(`${rel(f)}: url(${m[1]})`);
        return meldeKaputt(funde);
      }],
      ['Schutzorgane (9 Locales): Foto lokal aus /_astro/ (WebP, srcset 480/960/1280w) mit Bildnachweis – Pittigrilli → Commons-Dateiseite, Trenner „ · “, CC0 → Lizenztext', () => LOCALES_9.every((l) => {
        const fig = read(`${l}/grundlagen/schutzorgane`).match(/<figure class="bild(?: astro-[\w-]+)?">[\s\S]*?<\/figure>/)?.[0] ?? '';
        const img = fig.match(/<img\b[^>]*>/)?.[0] ?? '';
        const set = (img.match(/\ssrcset="([^"]*)"/)?.[1] ?? '').split(',').map((e) => e.trim());
        const nachweis = fig.match(/<span class="bild-quelle(?: astro-[\w-]+)?">([\s\S]*?)<\/span>/)?.[1] ?? '';
        return /\ssrc="\/_astro\/[^"]+\.webp"/.test(img) && /\salt="[^"]+"/.test(img) &&
          set.length === 3 && set.every((e) => /^\/_astro\/\S+\.webp \d+w$/.test(e)) && ['480w', '960w', '1280w'].every((w) => set.some((e) => e.endsWith(` ${w}`))) &&
          /<a href="https:\/\/commons\.wikimedia\.org\/wiki\/File:ABB_230V_16A_fuses_in_fuse_box_in_German_shop,_2024\.jpg"[^>]*>Pittigrilli<\/a>/.test(nachweis) &&
          /Pittigrilli<\/a> · \S/.test(nachweis) && /<a href="https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/"[^>]*>CC0<\/a>/.test(nachweis);
      })],
      ['Schutzorgane-MDX (8 Locales): Bild aus src/assets/bilder/ls-schalter-b16-hutschiene.jpg importiert, kein Wikimedia-Bildhost (upload/thumb) im Quelltext', () =>
        existsSync(join(src, 'assets/bilder/ls-schalter-b16-hutschiene.jpg')) && INHALT_LOCALES.every((l) => {
          const t = mdx(l, 'grundlagen/schutzorgane');
          return t.includes("import lsSchalterFoto from '../../../../assets/bilder/ls-schalter-b16-hutschiene.jpg';") && t.includes('src={lsSchalterFoto}') && !/(?:upload|thumb)\.wikimedia\.org/.test(t);
        })],
      ["_headers (public + dist): CSP img-src genau 'self' data:, „wikimedia“ kommt nirgends mehr vor", () => [join(src, '../public/_headers'), join(dist, '_headers')].every((f) => {
        const hd = readFileSync(f, 'utf8');
        return hd.match(/^\s*Content-Security-Policy:.*?\bimg-src ([^;\n]*)/m)?.[1].trim() === "'self' data:" && !/wikimedia/i.test(hd);
      })],
      ['Datenschutz nennt jeden Browser-Speicher-Schlüssel (local-/sessionStorage) aus dist als <code>…</code>', () => {
        const soll = new Set(['starlight-theme', 'wattwas.gelesen', 'ww-stufe', 'ww-stufe-hinweis', 'sl-sidebar-state']);
        for (const f of [...htmlFiles(dist), ...dateien(dist, /\.js$/)])
          for (const m of readFileSync(f, 'utf8').matchAll(/(?:local|session)Storage\.(?:get|set)Item\(\s*[`'"]([^`'"]+)[`'"]/g)) soll.add(m[1]);
        const codes = new Set([...read('de/rechtliches/datenschutz').matchAll(/<code\b[^>]*>([^<]*)<\/code>/g)].map((m) => m[1]));
        const fehlt = [...soll].filter((k) => !codes.has(k));
        fehlt.forEach((k) => console.log(`     ↳ fehlt in Datenschutz: ${k}`));
        return fehlt.length === 0;
      }],
      ['Impressum: „Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:“ mit Name + Anschrift genau wie in den Angaben nach § 5 DDG; kein ec.europa.eu/consumers/odr, keine OS-Plattform; VSBG-Satz bleibt', () => {
        const h = read('de/rechtliches/impressum');
        const anbieter = alsText(h.match(/<h2 id="angaben[^"]*">[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] ?? '');
        const mstv = alsText(h.match(/<p>Verantwortlich für den Inhalt nach § 18 Abs\. 2 MStV:([\s\S]*?)<\/p>/)?.[1] ?? '');
        return anbieter.includes('Abdülkadir Tekin') && anbieter.includes('79410 Badenweiler') && mstv === anbieter &&
          !h.includes('ec.europa.eu/consumers/odr') && !/Online-Streitbeilegung/.test(h) && h.includes('Verbraucherschlichtungsstelle');
      }],
    ];
  })(),

  // Aufräumen 14.09. – SEO
  // Fallback-Seite = Seite gibt es in de, aber nicht in <locale> (Starlight zeigt dort den deutschen Text mit Hinweisband). Sie trägt
  // canonical + og:url auf das deutsche Original und fehlt in der Sitemap; hreflang überall nur für echte Übersetzungen (+ x-default → de),
  // gibt es eine Seite nur in einer Sprache, gar keine. Die Menge wird hier unabhängig vom Build aus src/content/docs gezählt
  // (Stand 14.09.: 44 = 23 unter /leicht/ + 3 Rechtsseiten × 7 Sprachen).
  // 404: noindex, ohne canonical/og:url/hreflang/Sprachwahl, Header und Footer bleiben; Wortmarke verlinkt /<locale>/ mit Schluss-Slash.
  ...(() => {
    const docs = join(src, 'content/docs');
    const slugsVon = (l) => new Set(mdxFiles(join(docs, l)).map((f) => relative(join(docs, l), f).split(sep).join('/').replace(/\.mdx$/, '').replace(/(^|\/)index$/, '')));
    const ECHT = Object.fromEntries(LOCALES_9.map((l) => [l, slugsVon(l)]));
    const FALLBACKS = LOCALES_9.filter((l) => l !== 'de').flatMap((l) => [...ECHT.de].filter((s) => !ECHT[l].has(s)).map((s) => [l, s]));
    const ECHTE_SEITEN = LOCALES_9.flatMap((l) => [...ECHT[l]].map((s) => [l, s]));
    const url = (l, s) => `https://wattwas.de/${l}/${s ? `${s}/` : ''}`;
    const LANG = (l) => (l === 'leicht' ? 'de-x-leicht' : l);
    const cache = new Map();
    const html = (l, s) => { const p = s ? `${l}/${s}` : l; if (!cache.has(p)) cache.set(p, read(p)); return cache.get(p); };
    const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    const kopfTags = (h, name) => [...(h.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? '').matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attrs(m[0]));
    const canonicals = (h) => kopfTags(h, 'link').filter((a) => a.rel === 'canonical').map((a) => a.href);
    const ogUrls = (h) => kopfTags(h, 'meta').filter((a) => a.property === 'og:url').map((a) => a.content);
    const alternates = (h) => kopfTags(h, 'link').filter((a) => a.rel === 'alternate' && a.hreflang).map((a) => `${a.hreflang} ${a.href}`).sort();
    const sprachenVon = (s) => LOCALES_9.filter((l) => ECHT[l].has(s));
    const sollAlternates = (s) => (sprachenVon(s).length < 2 ? [] : [...sprachenVon(s).map((l) => `${LANG(l)} ${url(l, s)}`), `x-default ${url('de', s)}`].sort());
    const gleich = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const sitemapEintraege = () => [...readFileSync(join(dist, 'sitemap-0.xml'), 'utf8').matchAll(/<url><loc>([^<]*)<\/loc>([\s\S]*?)<\/url>/g)]
      .map((m) => ({ loc: m[1], links: [...m[2].matchAll(/<xhtml:link rel="alternate" hreflang="([^"]*)" href="([^"]*)"\/>/g)].map((x) => `${x[1]} ${x[2]}`).sort() }));
    const slugAus = (loc) => new URL(loc).pathname.replace(/^\/[^/]+\/?/, '').replace(/\/$/, '');
    const seite404 = () => readFileSync(join(dist, '404.html'), 'utf8');
    const wortmarke = (h) => { const tag = h.match(/<a\b[^>]*\bclass="ww-marke\b[^"]*"[^>]*>/)?.[0]; return tag ? attrs(tag).href : undefined; };
    return [
      ['SEO (a): jede Fallback-Seite (aus src/content/docs: in de, nicht in <locale>) liegt in dist; canonical + og:url = deutsches Original, kein robots-Meta', () =>
        FALLBACKS.length > 0 && FALLBACKS.every(([l, s]) => { const h = html(l, s); return gleich(canonicals(h), [url('de', s)]) && gleich(ogUrls(h), [url('de', s)]) && kopfTags(h, 'meta').every((a) => a.name !== 'robots'); })],
      ['SEO (a): echte Seiten (alle 9 Locales) behalten canonical + og:url auf sich selbst', () =>
        ECHTE_SEITEN.every(([l, s]) => { const h = html(l, s); return gleich(canonicals(h), [url(l, s)]) && gleich(ogUrls(h), [url(l, s)]); })],
      ['SEO (b): Sitemap = genau die echten Seiten, keine Fallback-URL; Stichprobe tr + ka: Übersetzungen drin, Rechtliches-Fallbacks nicht', () => {
        const locs = sitemapEintraege().map((e) => e.loc).sort();
        return gleich(locs, ECHTE_SEITEN.map(([l, s]) => url(l, s)).sort()) && FALLBACKS.every(([l, s]) => !locs.includes(url(l, s))) &&
          [url('tr', 'grundlagen/schutzorgane'), url('tr', ARTIKEL), url('ka', `${EGT}/berufsbild`), url('ka', 'elektrowerkzeuge/marken/zangen')].every((u) => locs.includes(u)) &&
          [url('tr', 'rechtliches/impressum'), url('ka', 'rechtliches/datenschutz'), url('leicht', 'grundlagen/schutzorgane')].every((u) => !locs.includes(u));
      }],
      ['SEO (b): Sitemap-hreflang (xhtml:link) je URL = echte Übersetzungen der Seite; Seiten mit nur einer Sprache ohne', () => {
        const e = sitemapEintraege();
        return e.length > 0 && e.every((x) => gleich(x.links, sollAlternates(slugAus(x.loc)).filter((a) => !a.startsWith('x-default ')))) && e.some((x) => x.links.length === 9);
      }],
      ['SEO (c): hreflang – de/rechtliches/impressum und tr-Fallback ohne Alternates; elektrowerkzeuge/marken/zangen in 9 Locales mit 9 Sprachen + x-default → de; leicht-Fallback ohne de-x-leicht', () =>
        alternates(html('de', 'rechtliches/impressum')).length === 0 && alternates(html('tr', 'rechtliches/impressum')).length === 0 &&
        LOCALES_9.every((l) => { const a = alternates(html(l, 'elektrowerkzeuge/marken/zangen')); return a.length === 10 && LOCALES_9.every((x) => a.includes(`${LANG(x)} ${url(x, 'elektrowerkzeuge/marken/zangen')}`)) && a.includes(`x-default ${url('de', 'elektrowerkzeuge/marken/zangen')}`); }) &&
        alternates(html('leicht', 'grundlagen/schutzorgane')).length === 9 && !alternates(html('leicht', 'grundlagen/schutzorgane')).some((a) => a.startsWith('de-x-leicht '))],
      ['SEO (c): hreflang auf jeder echten und jeder Fallback-Seite = echte Übersetzungen der Seite + x-default → de (bei nur einer Sprache keine)', () =>
        [...ECHTE_SEITEN, ...FALLBACKS].every(([l, s]) => gleich(alternates(html(l, s)), sollAlternates(s)))],
      ['SEO (d): 404.html – robots noindex, kein canonical/og:url, keine hreflang-Alternates, kein Sprachwähler; Header (Wortmarke → /de/, Tabs) und Footer bleiben', () => {
        const h = seite404();
        return gleich(kopfTags(h, 'meta').filter((a) => a.name === 'robots').map((a) => a.content), ['noindex']) && canonicals(h).length === 0 && ogUrls(h).length === 0 &&
          kopfTags(h, 'link').every((a) => a.rel !== 'alternate') && !h.includes('<starlight-lang-select') && !/<option[^>]*value="[^"]*\/404\/"/.test(h) &&
          wortmarke(h) === '/de/' && /<header[\s\S]*?class="ww-tab(?: astro-[\w-]+)?"[\s\S]*?<\/header>/.test(h) && /class="ww-fuss[ "]/.test(h);
      }],
      ['SEO (e): Wortmarke verlinkt /<locale>/ mit Schluss-Slash (Startseite + Marken-Seite in 9 Locales, 404)', () =>
        LOCALES_9.every((l) => wortmarke(html(l, '')) === `/${l}/` && wortmarke(html(l, 'elektrowerkzeuge/marken/zangen')) === `/${l}/`) && wortmarke(seite404()) === '/de/'],
    ];
  })(),

  // Aufräumen 14.09. – Texte
  ...(() => {
    // (1) Fallback-Hinweis, Soll sinngemäß „Diese Seite gibt es noch nicht in deiner Sprache. Du siehst die deutsche Fassung.“
    const HINWEIS_SOLL = {
      leicht: 'Diese Seite gibt es noch nicht in Leichter Sprache. Du siehst die Seite in schwerer Sprache.',
      tr: 'Bu sayfa henüz senin dilinde yok. Almanca sürümünü görüyorsun.',
      en: 'This page is not available in your language yet. You are seeing the German version.',
      ru: 'Этой страницы пока нет на твоём языке. Ты видишь немецкую версию.',
      ar: 'هذه الصفحة غير متوفرة بلغتك بعد. أنت ترى النسخة الألمانية.',
      fa: 'این صفحه هنوز به زبان تو وجود ندارد. نسخهٔ آلمانی را می‌بینی.',
      ka: 'ეს გვერდი შენს ენაზე ჯერ არ არსებობს. ხედავ გერმანულ ვერსიას.',
      sq: 'Kjo faqe nuk ekziston ende në gjuhën tënde. Po sheh versionin gjerman.',
    };
    // Starlights ContentNotice steht direkt nach der H1: <p class="sl-flex"><svg …></svg><span>Text</span></p>
    const hinweisIn = (h) => h.match(/<h1 id="_top"[^>]*>[\s\S]*?<\/h1><p class="sl-flex(?: astro-[\w-]+)?"><svg\b[^>]*>[\s\S]*?<\/svg><span(?: class="[^"]*")?>([^<]*)<\/span><\/p>/)?.[1] ?? null;
    const ohneHinweis = (h) => Object.values(HINWEIS_SOLL).every((t) => !h.includes(t));
    // Vorher sichtbare Texte: Starlights eingebaute (de → leicht, en/tr/ru/ar/fa) und die alten eigenen ka/sq-Texte
    const starlightText = (lang) => readFileSync(join(src, '..', 'node_modules/@astrojs/starlight/dist/translations', `${lang}.js`), 'utf8').match(/"i18n\.untranslatedContent":\s*"([^"]*)"/)?.[1];
    const ALT = [...['de', 'en', 'tr', 'ru', 'ar', 'fa'].map(starlightText), 'ეს შიგთავსი თქვენს ენაზე ჯერ არ არის ხელმისაწვდომი. ნაჩვენებია გერმანული ვერსია.', 'Kjo përmbajtje nuk është ende e disponueshme në gjuhën tuaj. Shfaqet versioni gjermanisht.'];
    return [
      ['Fallback-Hinweis: jede Nicht-de-Locale hat src/content/i18n/<lang>.json (leicht → de-x-leicht.json) mit dem Soll-Wortlaut (leicht in Leichter Sprache, fa mit ZWNJ)', () =>
        Object.entries(HINWEIS_SOLL).every(([l, soll]) => BAND[l] === soll) && BAND.fa.includes('‌')],
      ['Fallback-Hinweis erscheint auf einer Fallback-Seite je Locale (rechtliches/impressum, 8 Locales) mit dem Soll-Wortlaut; nicht auf de-Impressum, leicht/entdecken und der übersetzten Unterverteilung (7 Locales)', () =>
        Object.entries(HINWEIS_SOLL).every(([l, soll]) => hinweisIn(read(`${l}/rechtliches/impressum`)) === soll) &&
        hinweisIn(read('de/rechtliches/impressum')) === null && ohneHinweis(read('de/rechtliches/impressum')) && ohneHinweis(read('leicht/entdecken')) &&
        ['tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => ohneHinweis(read(`${l}/${ARTIKEL}`)))],
      ['Fallback-Hinweis: Starlights eingebaute Texte (de/en/tr/ru/ar/fa) und die alten ka/sq-Texte stehen in keiner HTML-Datei mehr', () =>
        ALT.length === 8 && ALT.every(Boolean) && ALT.includes(DE_BAND) && htmlFiles(dist).every((f) => { const h = readFileSync(f, 'utf8'); return ALT.every((a) => !h.includes(a)); })],
      // (2) Stufe heißt sichtbar „Fachkraft“ (Code-Schlüssel profi) – „Profi“ nicht mehr als Wort/Präfix in sichtbaren Texten
      ['Marken: kein „Profi“ in kurz.* aller Modelle (9 Locales); PROFiTEST MF XTRA: Kurztext ohne professional/profesyonel/…, de „Installationstester nach IEC 60364-6 …“, Modellname unverändert, Kategorieseite zeigt den neuen Text', () => {
        const m = JSON.parse(readFileSync(join(src, 'data/marken.json'), 'utf8'));
        const g = m.modelle.find((x) => x.id === 'gossen-metrawatt-profitest-mf-xtra');
        const h = read('de/elektrowerkzeuge/marken/installationstester');
        return m.modelle.every((x) => Object.values(x.kurz).every((t) => !/Profi/.test(t))) &&
          Object.values(g.kurz).every((t) => !/professional|profesyonel|профессион|احتراف|حرفه|პროფესიონ|profesional/i.test(t)) &&
          g.modell === 'PROFiTEST MF XTRA' && g.kurz.de.startsWith('Installationstester nach IEC 60364-6') &&
          h.includes('Installationstester nach IEC 60364-6 mit Speicher') && !h.includes('Profi-Installationstester') && h.includes('PROFiTEST MF XTRA');
      }],
      ['Kein „Profi“/„Profis“ als Wort oder Präfix (Profi-…) in src/data/*.json und src/content/docs/**/*.mdx (Markenname PROFiTEST bleibt)', () =>
        [...readdirSync(join(src, 'data')).filter((n) => n.endsWith('.json')).map((n) => join(src, 'data', n)), ...mdxFiles(join(src, 'content/docs'))].every((f) => !/\bProfis?\b/.test(readFileSync(f, 'utf8')))],
      ...(() => {
        // (3) Fallback-Seiten: Inhaltslinks bleiben in der Locale (MarkdownContent.astro schreibt <a href="/de/…"> um)
        // Inhaltsbereich = .sl-markdown-content bis zum <footer> (Footer-Sprachliste mit /de/ ist gewollt und bleibt außen vor)
        const inhaltVon = (h) => { const a = h.indexOf('class="sl-markdown-content"'); const e = h.indexOf('<footer', a); return a < 0 || e < 0 ? null : h.slice(a, e); };
        const hrefs = (teil) => [...teil.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
        const intern = (href) => !href.startsWith('#') && !href.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(href);
        const ziel = (seite, href) => new URL(href, `https://wattwas.invalid/${seite}/`);
        // Ziel (Verzeichnis → index.html) und ggf. Anker id="…" müssen in dist existieren
        const zielDa = (u) => { const f = join(dist, decodeURIComponent(u.pathname), 'index.html'); return existsSync(f) && (!u.hash || readFileSync(f, 'utf8').includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)); };
        const inLocale = (seite, l) => { const teil = inhaltVon(read(seite)); return teil !== null && !/href="\/de\//.test(teil) && hrefs(teil).filter(intern).every((x) => { const u = ziel(seite, x); return u.pathname.startsWith(`/${l}/`) && zielDa(u); }); };
        // Fallback-Seiten je Locale, erkannt am eigenen Hinweis
        const fallbacks = (l) => htmlFiles(join(dist, l)).filter((f) => f.endsWith(`${sep}index.html`)).map((f) => relative(dist, f).split(sep).join('/').replace(/\/?index\.html$/, '')).filter((p) => hinweisIn(read(p)) === HINWEIS_SOLL[l]);
        return [
          ['Fallback-Links: /leicht/ueber/ – kein href="/de/…" im Inhalt; Mitglied, Impressum, Haftungsausschluss, Glossar-Anker zeigen auf /leicht/… (Ziel + Anker existieren)', () => {
            const teil = inhaltVon(read('leicht/ueber')) ?? '';
            return inLocale('leicht/ueber', 'leicht') && ['/leicht/mitglied/', '/leicht/rechtliches/impressum/', '/leicht/rechtliches/haftungsausschluss/', '/leicht/glossar/#begriff-ausbildung'].every((x) => teil.includes(`href="${x}"`));
          }],
          ['Fallback-Links: /tr/rechtliches/impressum/ – kein href="/de/…" im Inhalt; Links auf Haftungsausschluss und Datenschutz lösen auf /tr/rechtliches/… auf', () => {
            const links = hrefs(inhaltVon(read('tr/rechtliches/impressum')) ?? '').filter(intern).map((x) => ziel('tr/rechtliches/impressum', x).pathname);
            return inLocale('tr/rechtliches/impressum', 'tr') && ['haftungsausschluss', 'datenschutz'].every((s) => links.includes(`/tr/rechtliches/${s}/`));
          }],
          ['Fallback-Links: alle Fallback-Seiten der 8 Locales (erkannt am Hinweis; leicht ≥ 20, sonst ≥ 3) – kein href="/de/…" im Inhalt, jeder interne Inhaltslink bleibt in der Locale und löst auf (Ziel + Anker)', () =>
            Object.keys(HINWEIS_SOLL).every((l) => { const seiten = fallbacks(l); return seiten.length >= (l === 'leicht' ? 20 : 3) && seiten.every((p) => inLocale(p, l)); })],
          ['Fallback-Links: deutsche Seiten unverändert – /de/ueber/ verlinkt im Inhalt weiter /de/mitglied/, /de/rechtliches/…, /de/glossar/#begriff-ausbildung', () => {
            const teil = inhaltVon(read('de/ueber')) ?? '';
            return ['/de/mitglied/', '/de/rechtliches/impressum/', '/de/rechtliches/haftungsausschluss/', '/de/glossar/#begriff-ausbildung'].every((x) => teil.includes(`href="${x}"`));
          }],
        ];
      })(),
    ];
  })(),
  // Aufräumen 14.09. – UI
  // 1 · Marken-Budget: zugänglicher Name je Stufe (sichtbar bleibt €), Modellkarten lesen den Namen statt „Euro Euro“
  ['UI · Budget: marken.budgetStufen 1–3 in 9 Locales, je drei verschiedene Namen ohne €, außer de/leicht anders als de', () => LOCALES_9.every((l) => {
    const b = uiJson[l].marken.budgetStufen ?? {};
    const namen = ['1', '2', '3'].map((k) => b[k] ?? '');
    return Object.keys(b).join() === '1,2,3' && namen.every((n) => n.trim().length > 0 && !n.includes('€')) && new Set(namen).size === 3 && (['de', 'leicht'].includes(l) || namen.every((n, i) => n !== uiJson.de.marken.budgetStufen[String(i + 1)]));
  })],
  ['UI · Budget (tr/kabelfinder, de/zangen): Budget-Knöpfe zeigen €/€€/€€€, zugänglicher Name aria-label = Stufenname (tr „Bütçe: düşük/orta/yüksek“, de „Budget: günstig/mittel/hoch“)', () => {
    const SOLL = { tr: ['Bütçe: düşük', 'Bütçe: orta', 'Bütçe: yüksek'], de: ['Budget: günstig', 'Budget: mittel', 'Budget: hoch'] };
    return Object.entries({ tr: 'tr/elektrowerkzeuge/marken/kabelfinder', de: 'de/elektrowerkzeuge/marken/zangen' }).every(([l, p]) => {
      const h = read(p);
      return [1, 2, 3].every((b) => {
        const k = [...h.matchAll(new RegExp(`<button[^>]* data-filter="budget:${b}"[^>]*>([^<]*)</button>`, 'g'))];
        return k.length >= 1 && k.every((m) => m[1] === '€'.repeat(b) && m[0].includes(` aria-label="${SOLL[l][b - 1]}"`));
      });
    });
  }],
  ['UI · Budget (tr/kabelfinder): jede Modellkarte nennt die Budgetstufe als Text (sr-only „Bütçe: …“ passend zu data-budget, auch als title), €-Zeichen aria-hidden, kein nacktes „Bütçe: “ mehr', () => {
    const h = read('tr/elektrowerkzeuge/marken/kabelfinder');
    const NAME = uiJson.tr.marken.budgetStufen;
    const karten = [...h.matchAll(/<article class="ww-karte modell[^"]*" id="[a-z0-9-]+" data-stufe="[a-z]+" data-budget="([123])"[\s\S]*?<\/article>/g)];
    return karten.length === 4 && karten.every((m) => {
      const b = Number(m[1]);
      return new RegExp(`<span class="mk-budget[^"]*" title="${NAME[m[1]]}"[^>]*><span class="sr-only[^"]*">${NAME[m[1]]}</span><span aria-hidden="true"[^>]*>${'€'.repeat(b)}${'·'.repeat(3 - b)}</span></span>`).test(m[0]);
    }) && !h.includes(`>${uiJson.tr.marken.budget}: </span>`);
  }],
  // 3 · Stufen-Labels: deutsch gebliebene Labels (Azubi/Fachkraft in tr/ru/ar/fa/ka/sq) tragen lang="de" – Regel zentral in src/lib/stufe-lang.mjs
  ...(await import('../src/lib/stufe-lang.mjs').then(({ stufeLang }) => [
    ['UI · Stufen: stufeLang – tr/ru/ar/fa/ka/sq: azubi/profi → "de", einstieg (übersetzt) → undefined; de/leicht/en nie (en „Start“ ist Englisch)', () =>
      ['tr', 'ru', 'ar', 'fa', 'ka', 'sq'].every((l) => stufeLang(l, 'azubi') === 'de' && stufeLang(l, 'profi') === 'de' && stufeLang(l, 'einstieg') === undefined) &&
      ['de', 'leicht', 'en'].every((l) => ['einstieg', 'azubi', 'profi'].every((st) => stufeLang(l, st) === undefined))],
  ], () => [['UI · Stufen: src/lib/stufe-lang.mjs lässt sich laden', () => false]])),
  ['UI · Stufen (Quelltext): jede .astro-Komponente, die t.stufen[…] rendert (≥ 11, u. a. Mitglied-Auswahl), setzt lang über stufeLang; Sätze mit {stufe} nur über StufenText', () => {
    const astro = srcFiles(join(src, 'components')).filter((f) => f.endsWith('.astro')).map((f) => readFileSync(f, 'utf8'));
    const rendernd = astro.filter((t) => /\.stufen(?: as [^)]*\))?\[/.test(t));
    return rendernd.length >= 11 && rendernd.every((t) => t.includes('stufeLang(')) && astro.every((t) => !/replace\('\{stufe\}', t\.stufen/.test(t));
  }],
  ['UI · Stufen (tr/ar kabelfinder): Pills Azubi/Fachkraft lang="de"; Filter-Knöpfe stufe:azubi/profi lang="de", übersetzter Start-Knopf ohne lang', () => ['tr', 'ar'].every((l) => {
    const h = read(`${l}/elektrowerkzeuge/marken/kabelfinder`);
    const pills = (st) => [...h.matchAll(new RegExp(`<span class="ww-pill ww-pill-${st}[^"]*"([^>]*)>([^<]*)</span>`, 'g'))];
    const knopf = (st) => h.match(new RegExp(`<button[^>]* data-filter="stufe:${st}"[^>]*>([^<]*)</button>`)) ?? ['', ''];
    return pills('azubi').length === 3 && pills('profi').length === 1 && pills('azubi').every((m) => m[1].includes(' lang="de"') && m[2] === 'Azubi') && pills('profi').every((m) => m[1].includes(' lang="de"') && m[2] === 'Fachkraft') &&
      knopf('azubi')[0].includes(' lang="de"') && knopf('azubi')[1] === 'Azubi' && knopf('profi')[0].includes(' lang="de"') && knopf('profi')[1] === 'Fachkraft' &&
      knopf('einstieg')[1] === uiJson[l].stufen.einstieg && !knopf('einstieg')[0].includes(' lang=');
  })],
  ['UI · Stufen (en/kabelfinder): übersetzte Labels ohne lang – Pills Apprentice/Skilled worker, Filter-Knöpfe Start/Apprentice/Skilled worker', () => {
    const h = read('en/elektrowerkzeuge/marken/kabelfinder');
    const pills = [...h.matchAll(/<span class="ww-pill ww-pill-(azubi|profi)[^"]*"([^>]*)>([^<]*)<\/span>/g)];
    const knoepfe = [...h.matchAll(/<button[^>]* data-filter="stufe:[a-z]+"[^>]*>([^<]*)<\/button>/g)];
    return pills.length === 4 && pills.every((m) => !m[2].includes('lang=') && m[3] === (m[1] === 'azubi' ? 'Apprentice' : 'Skilled worker')) && knoepfe.map((m) => m[1]).join('|') === 'Start|Apprentice|Skilled worker' && knoepfe.every((m) => !m[0].includes(' lang='));
  }],
  ['UI · Stufen (tr): Header-Chip (Text + Optionen), Stufen-Leiste, Startseiten-Wahl, Artikel-Pill – Azubi/Fachkraft lang="de", Başlangıç ohne', () => {
    const a = read(`tr/${ARTIKEL}`), start = read('tr');
    const DE = { azubi: 'Azubi', profi: 'Fachkraft' };
    const chip = (st) => a.match(new RegExp(`<span class="ww-chip-text[^"]*" data-s="${st}"([^>]*)>([^<]*)<`));
    const option = (st) => a.match(new RegExp(`class="ww-stufe-option ist-${st}[^"]*" data-stufe="${st}"[^>]*><b([^>]*)>([^<]*)</b>`));
    const leiste = (st) => a.match(new RegExp(`<button type="button" class="ww-pill ww-pill-${st}[^"]*" data-stufe="${st}"([^>]*)>([^<]*)</button>`));
    const wahl = (st) => start.match(new RegExp(`class="lvl lvl-${st}[^"]*" data-stufe="${st}"[^>]*><b([^>]*)>([^<]*)</b>`));
    const ok = (m, st) => Boolean(m) && (st === 'einstieg' ? m[2] === 'Başlangıç' && !m[1].includes('lang=') : m[2] === DE[st] && m[1].includes(' lang="de"'));
    return ['einstieg', 'azubi', 'profi'].every((st) => ok(chip(st), st) && ok(option(st), st) && ok(leiste(st), st) && ok(wahl(st), st)) && /<span class="stufe stufe-azubi[^"]*"[^>]* lang="de"[^>]*>Azubi</.test(a);
  }],
  ['UI · Stufen (tr): Entdecken (Karten-Pills, Filter-Knöpfe, „Empfohlen“-Überschriften), Stufen-Hinweis, Themen-Legende – Azubi/Fachkraft lang="de", Başlangıç ohne', () => {
    const e = read('tr/entdecken'), hinweis = read('tr/grundlagen/schutzorgane'), themen = read('tr/themen');
    const karten = [...e.matchAll(/<span class="ww-pill ww-pill-(einstieg|azubi|profi)[^"]*"([^>]*)>([^<]*)<\/span>/g)];
    const knopf = (st) => e.match(new RegExp(`<button[^>]* data-filter="stufe:${st}"([^>]*)>([^<]*)<small`)) ?? ['', '', ''];
    const h2 = (st) => e.match(new RegExp(`<h2 id="empfohlen-${st}"[^>]*>(.*?)</h2>`))?.[1] ?? '';
    return karten.some((m) => m[1] === 'azubi') && karten.every((m) => (m[1] === 'einstieg') !== m[2].includes(' lang="de"')) &&
      knopf('azubi')[0].includes(' lang="de"') && knopf('profi')[0].includes(' lang="de"') && knopf('einstieg')[2] === 'Başlangıç ' && !knopf('einstieg')[0].includes(' lang=') &&
      h2('azubi').includes('<span lang="de">Azubi</span>') && h2('profi').includes('<span lang="de">Fachkraft</span>') && h2('einstieg').includes('Başlangıç') && !h2('einstieg').includes('lang=') &&
      hinweis.includes('Bu sayfa <span lang="de">Azubi</span> için.') &&
      /<span class="stufe-pill stufe-azubi[^"]*" lang="de"[^>]*>Azubi</.test(themen) && /<span class="stufe-pill stufe-profi[^"]*" lang="de"[^>]*>Fachkraft</.test(themen) && /<span class="stufe-pill stufe-einstieg[^"]*">Başlangıç</.test(themen);
  }],
  ['UI · Stufen (de/leicht): kein lang an Stufen-Labels (Seite ist selbst Deutsch) – Marken-Pills de, Header-Chip + Startseiten-Wahl leicht', () => {
    const k = read('de/elektrowerkzeuge/marken/kabelfinder'), le = read('leicht');
    return /<span class="ww-pill ww-pill-azubi/.test(k) && !/<span class="ww-pill ww-pill-(azubi|profi)[^"]*"[^>]* lang=/.test(k) && /<span class="ww-chip-text[^"]*" data-s="azubi"/.test(le) && !/<span class="ww-chip-text[^"]*" data-s="[a-z]+" lang=/.test(le) && !/class="lvl lvl-[a-z]+[^"]*" data-stufe="[a-z]+"[^>]*><b lang=/.test(le);
  }],
  // 2 · Wörterbuch-Suche: gemeinsame Normalisierung (src/lib/suchnorm.mjs) für Suchtext (Build) und Eingabe (Client-Skript)
  ...(await import('../src/lib/suchnorm.mjs').then(({ findet, suchText, nadeln }) => [
    ['UI · Suche (de): „aeusserer“, „äußerer“, „ausserer“ finden „äußerer“; „Schlussel“ findet „Schlüssel“; beide Richtungen (Heuhaufen „Schluessel“/„ausserer“ ← Umlaut-Eingabe); „Schlossel“ nicht', () =>
      ['aeusserer', 'äußerer', 'ausserer', 'ÄUSSERER'].every((q) => findet('äußerer', q, 'de')) && findet('Schlüssel', 'Schlussel', 'de') && findet('Rollgabelschlüssel', 'schluessel', 'de') &&
      findet('Schluessel', 'Schlüssel', 'de') && findet('ausserer', 'äußerer', 'de') && !findet('Schlüssel', 'Schlossel', 'de')],
    ['UI · Suche (tr): Kleinschreibung in der Seitensprache, I/İ/ı/i tolerant – „ISOLIER“/„ısolier“/„İsolier“ finden „Isolierzange“, „anahtari“/„ANAHTARI“/„ANAHTARİ“ finden „alyan anahtarı“, „inbus“ ↔ „İnbus“', () =>
      ['isolier', 'ISOLIER', 'ısolier', 'İsolier'].every((q) => findet('Isolierzange', q, 'tr')) && ['anahtarı', 'anahtari', 'ANAHTARI', 'ANAHTARİ'].every((q) => findet('alyan anahtarı', q, 'tr')) &&
      findet('İnbus', 'inbus', 'tr') && findet('inbus', 'İnbus', 'tr') && findet('Tık tak seti', 'TIK', 'tr') && findet('İnbus', 'inbus', 'de') && !findet('alyan anahtarı', 'anahtaru', 'tr')],
    ['UI · Suche (fa/ar): ZWNJ, ZWSP, ZWJ, BOM und weiches Trennzeichen zählen nicht; ي = ی und ك = ک in beide Richtungen', () =>
      findet('کلید حلقه\u200Cای', 'حلقهای', 'fa') && findet('کلید حلقهای', 'حلقه\u200Cای', 'fa') && findet('کلید', 'ک\u200Bل\u200Dی\uFEFFد\u00AD', 'fa') &&
      findet('کلید', 'كليد', 'fa') && findet('كليد', 'کلید', 'fa') && findet('مفتاح سداسي داخلي', 'داخلی', 'ar') && findet('مفتاح سداسي داخلی', 'داخلي', 'ar')],
    ['UI · Suche: Unicode NFKC (Vollbreite „ＶＤＥ“ findet „VDE“, Präsentationsform ﻙ findet ک); leere/unsichtbare Eingabe filtert nicht; Suchtext = Faltungen je Zeile', () =>
      findet('VDE-Spannungsprüfer', 'ＶＤＥ', 'de') && findet('کلید', '\uFED9لید', 'fa') && nadeln('', 'de').length === 0 && nadeln(' \u200C ', 'fa').length === 0 &&
      suchText(['Schlüssel'], 'de').split('\n').join('|') === 'schlüssel|schluessel|schlussel'],
  ], () => [['UI · Suche: src/lib/suchnorm.mjs lässt sich laden', () => false]])),
  ['UI · Suche (Quelltext): Woerterbuch.astro nutzt suchnorm für Suchtext (Build, Seitensprache) und Eingabe (Client-Skript, documentElement.lang), kein eigenes toLowerCase für die Suche', () => {
    const w = readFileSync(join(src, 'components/Woerterbuch.astro'), 'utf8');
    const [, fm = '', skript = ''] = w.match(/^---([\s\S]*?)---[\s\S]*<script>([\s\S]*?)<\/script>/) ?? [];
    return /import \{ suchText \} from '\.\.\/lib\/suchnorm\.mjs'/.test(fm) && /suchText\(\[[^\n]*\], seitenSprache\)/.test(fm) && fm.includes('starlightRoute.lang') && !/toLowerCase/.test(fm.replace(/const sortKey[^\n]*/, '')) &&
      /import \{ nadeln, trifft \} from '\.\.\/lib\/suchnorm\.mjs'/.test(skript) && /nadeln\(input\.value, sprache\)/.test(skript) && /trifft\(z\.dataset\.such/.test(skript) && skript.includes('document.documentElement.lang') && !/toLowerCase/.test(skript);
  }],
  ['UI · Suche (dist): data-such = Faltungen je Zeile – de Rollgabelschlüssel (…schlüssel/…schluessel/…schlussel, engländer/englaender), tr Innensechskantschlüssel in tr-Faltung (innensechskant…, inbus, alyan anahtari, kein ı)', () => {
    const such = (h, id) => h.match(new RegExp(`<tr class="wb-zeile[^"]*" id="${id}"[^>]*data-such="([^"]*)"`))?.[1] ?? '';
    const de = such(read('de/elektrowerkzeuge/woerterbuch'), 'rollgabelschluessel'), tr = such(read('tr/elektrowerkzeuge/woerterbuch'), 'innensechskantschluessel');
    return de.split('\n').length === 3 && ['rollgabelschlüssel', 'rollgabelschluessel', 'rollgabelschlussel', 'engländer', 'englaender'].every((w) => de.includes(w)) &&
      ['innensechskantschlüssel', 'innensechskantschlussel', 'inbus', 'alyan anahtari'].every((w) => tr.includes(w)) && !tr.includes('ı');
  }],
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
