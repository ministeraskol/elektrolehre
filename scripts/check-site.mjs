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
  : 'Dieser Inhalt ist noch nicht in deiner Sprache verfügbar.'; // ka.json yokken Starlight varsayılan dilin (de) dizgisine düşer

const sqJson = fileURLToPath(new URL('../src/content/i18n/sq.json', import.meta.url));
const sqBand = existsSync(sqJson)
  ? JSON.parse(readFileSync(sqJson, 'utf8'))['i18n.untranslatedContent']
  : 'Dieser Inhalt ist noch nicht in deiner Sprache verfügbar.';
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
const uiJson = JSON.parse(readFileSync(join(src, 'data/startseite-ui.json'), 'utf8'));
const uiPfade = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? uiPfade(v, `${p}${k}.`) : [`${p}${k}`]);

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
  ['noindex hiçbir içerik sayfasında yok (Google açık)', () =>
    htmlFiles(dist).map((f) => readFileSync(f, 'utf8')).filter((h) => !/http-equiv="refresh"/.test(h)).every((h) => !/name="robots"[^>]*content="noindex/.test(h))],
  ['Impressum sayfası: ad + Badenweiler', () => existsSync(page('de/rechtliches/impressum')) && read('de/rechtliches/impressum').includes('79410 Badenweiler')],
  ['Datenschutz sayfası: GitHub Pages + Wikimedia', () => existsSync(page('de/rechtliches/datenschutz')) && read('de/rechtliches/datenschutz').includes('GitHub Pages') && read('de/rechtliches/datenschutz').includes('Wikimedia')],
  ['Impressum her sayfanın sidebar menüsünde', () => read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/')],
  // Faz 2: çeviri + glossar
  ...['tr','en','ru','ar','fa','ka','sq'].map((l) => [`${l}/grundlagen/strom-spannung-widerstand çevrildi (band yok, çeviri notu var, quiz 5)`, () =>
    existsSync(page(`${l}/grundlagen/strom-spannung-widerstand`)) &&
    !read(`${l}/grundlagen/strom-spannung-widerstand`).includes(DE_BAND) &&
    read(`${l}/grundlagen/strom-spannung-widerstand`).includes('uebersetzungshinweis') &&
    (read(`${l}/grundlagen/strom-spannung-widerstand`).match(/class="frage[" ]/g) || []).length === 5]),
  ['de/glossar >= 80 terim', () => existsSync(page('de/glossar')) && (read('de/glossar').match(/<th scope="row"/g) || []).length >= 80],
  ['Glossar sidebar linki her dilde (tr → /tr/glossar/)', () => read('tr/grundlagen/strom-spannung-widerstand').includes('/tr/glossar/')],
  ['tr/ar Startseite: Themen-Grid + Lernpfad', () => ['tr','ar'].every((l) => read(l).includes('./themen/energie-und-gebaeudetechnik/') && read(l).includes('ww-lernpfad'))],
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
  ['tr makale çevrildi (fallback bandı yok)', () => !read(`tr/${ARTIKEL}`).includes(DE_BAND) && /<html[^>]*lang="tr"/.test(read(`tr/${ARTIKEL}`))],
  ['tr makalede çeviri notu var', () => read(`tr/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['ar makale çevrildi, RTL, çeviri notu var', () =>
    /<html[^>]*dir="rtl"/.test(read(`ar/${ARTIKEL}`)) && read(`ar/${ARTIKEL}`).includes('uebersetzungshinweis') && !read(`ar/${ARTIKEL}`).includes(DE_BAND)],
  ['ar şema LTR sarmalayıcıda', () => /<figure[^>]*dir="ltr"/.test(read(`ar/${ARTIKEL}`))],
  ['sq Unterverteilung çevrildi (Arnavutça band yok, çeviri notu var)', () => !read(`sq/${ARTIKEL}`).includes(sqBand) && !read(`sq/${ARTIKEL}`).includes(DE_BAND) && read(`sq/${ARTIKEL}`).includes('uebersetzungshinweis')],
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
  ['Geselle-Kasten unten in der Seitenleiste (Artikel), nicht auf Rechtliches', () => /class="ww-geselle(?: astro-[\w-]+)?"/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes('Geselle Watt') && !/class="ww-geselle(?: astro-[\w-]+)?"/.test(read('de/rechtliches/impressum'))],
  ['Stufen-Leiste unter dem Header (Artikel, Hub), nicht auf der Startseite', () => read(`de/${ARTIKEL}`).includes('<ww-stufen-leiste') && read('de/grundlagen').includes('<ww-stufen-leiste') && !read('de').includes('<ww-stufen-leiste')],
  ['Mobil: Drawer (starlight__sidebar) mit Tabs auch auf der Startseite; Startseite ohne data-has-sidebar', () => read('de').includes('id="starlight__sidebar"') && /class="ww-tabs-mobil md:sl-hidden(?: astro-[\w-]+)?"/.test(read('de')) && !/<html[^>]*data-has-sidebar/.test(read('de')) && /<html[^>]*data-has-sidebar/.test(read(`de/${ARTIKEL}`))],
  ['ka berufsbild çevrildi (Gürcüce band yok)', () => existsSync(page(`ka/${EGT}/berufsbild`)) && !read(`ka/${EGT}/berufsbild`).includes(kaBand) && read(`ka/${EGT}/berufsbild`).includes('uebersetzungshinweis')],
  ['Startseite: Grundlagen, EGT, Werkzeug, Themen linkleri', () => ['./grundlagen/', './themen/energie-und-gebaeudetechnik/', './elektrowerkzeuge/', './themen/'].every((h) => read('de').includes(h))],
  // Redesign (12 Eyl 2026): şematik tema
  ['Startseite hero: "Elektrotechnik." + "Einfach erklärt." + animasyonlu devre + Funken', () => read('de').includes('Elektrotechnik.') && read('de').includes('Einfach erklärt.') && read('de').includes('hero-schaltkreis') && (read('de').match(/class="funke[" ]/g) || []).length >= 10],
  ['Startseite hero: 8 dil bağlantısı', () => (read('de').match(/class="ww-sprachen[^"]*"[\s\S]*?<\/nav>/)?.[0].match(/hreflang="/g) || []).length === 9],
  ['Startseite: 6 video kartı, 6 Themen kartı, 4 Lernpfad bölümü, 3 Anleitung kartı', () =>
    (read('de').match(/class="video farbe-/g) || []).length === 6 &&
    (read('de').match(/class="thema[ "]/g) || []).length === 6 &&
    (read('de').match(/class="kapitel reveal[" ]/g) || []).length === 4 &&
    (read('de').match(/class="karte anleitung[" ]/g) || []).length === 3 && read('de').includes('badge-einstieg')],
  ['Startseite: sosyal butonlar (YouTube/TikTok/Instagram) hero + footer, Unterstütze + Community', () =>
    (read('de').match(/kanal-youtube/g) || []).length >= 3 && read('de').includes('tiktok.com/@wattwas') && /class="[^"]*unterstuetzen/.test(read('de')) && /class="[^"]*community/.test(read('de'))],
  ['Startseite her dilde (leicht + 7 çeviri): Themen-Grid + Lernpfad', () => ['leicht','tr','en','ru','ar','fa','ka','sq'].every((l) => /class="thema[ "]/.test(read(l)) && read(l).includes('ww-lernpfad'))],
  ['Leichte Sprache: /leicht/ lang="de-x-leicht", "Strom verstehen"', () => /<html[^>]*lang="de-x-leicht"/.test(read('leicht')) && read('leicht').includes('Strom verstehen')],
  ['Site adı wattwas (Elektrolehre kalmadı)', () => /<title>[^<]*wattwas/.test(read(`de/${ARTIKEL}`)) && !read('de').includes('Elektrolehre') && !read(`de/${EGT}/lernfelder`).includes('Elektrolehre')],
  ['Yeni bölümler: themen, grundlagen (Lernpfad), elektrowerkzeuge, blog, ueber', () =>
    existsSync(page('de/themen')) && read('de/themen').includes('class="beruf ') &&
    existsSync(page('de/grundlagen')) && read('de/grundlagen').includes('ww-lernpfad') &&
    existsSync(page('de/elektrowerkzeuge')) && (read('de/elektrowerkzeuge').match(/class="produkt /g) || []).length >= 8 && read('de/elektrowerkzeuge').includes('class="vergleich') &&
    existsSync(page('de/blog')) && read('de/blog').includes('class="post ') &&
    existsSync(page('de/ueber')) && read('de/ueber').includes('youtube.com/@wattwas')],
  ['Eski URL yönlendirmeleri (beruf/, anleitungen/ → themen/…)', () =>
    /url=\/de\/themen\/energie-und-gebaeudetechnik\/berufsbild\//.test(read('de/beruf/berufsbild')) &&
    /url=\/tr\/themen\/energie-und-gebaeudetechnik\/unterverteilung\//.test(read('tr/anleitungen/unterverteilung'))],
  ['Stufe rozeti: makalede (Level) + blog listesinde; Impressum/Startseite/Glossar/Über yok', () =>
    /class="stufe stufe-azubi/.test(read(`de/${ARTIKEL}`)) && /class="stufe stufe-/.test(read('de/blog')) &&
    !/class="stufe stufe-/.test(read('de/rechtliches/impressum')) && !/class="stufe stufe-/.test(read('de')) && !/class="stufe stufe-/.test(read('de/glossar')) && !/class="stufe stufe-/.test(read('de/ueber'))],
  ['Veri i18n: tr Werkzeug/Themen/Video başlıkları Türkçe (Almanca fallback değil)', () =>
    read('tr/elektrowerkzeuge').includes('gerilim kontrol') && read('tr/themen').includes('Enerji ve bina tekniği') && read('tr').includes('30 saniyede 5 güvenlik kuralı') && read('tr/themen').includes('Başlangıç')],
  ['Mitgliedschaft: /mitglied/ sayfası (3 Vorteil, form kapalı → „bald“), Startseite kompakt, footer + sidebar linki', () =>
    existsSync(page('de/mitglied')) && (read('de/mitglied').match(/class="vorteil reveal/g) || []).length === 3 && read('de/mitglied').includes('class="bald') && !read('de/mitglied').includes('<form') &&
    /class="[^"]*\bmitglied kompakt/.test(read('de')) && read(`de/${ARTIKEL}`).includes('/de/mitglied/') && read('tr/mitglied').includes('Üye ol')],
  ['„Kostenlos und bleiben es“ hiçbir dilde yok', () => ['de','leicht','tr','en','ru','ar','fa','ka','sq'].every((l) => !/bleiben es|bleibt es|bleibt so|stay free|öyle kalacak|останутся такими|وسيبقى|رایگان می‌ماند|ასეც დარჩება|mbetet falas/.test(read(l)))],
  ['Datenschutz: Mitgliedschaft (Double-Opt-in) bölümü', () => read('de/rechtliches/datenschutz').includes('Double-Opt-in')],
  ['Werkzeug: affiliate kapalıyken "Zum Angebot" yok, hinweis var', () => !read('de/elektrowerkzeuge').includes('rel="sponsored') && read('de/elektrowerkzeuge').includes('affiliate-hinweis')],
  ['Footer: dil + Impressum + Über bağlantıları, ücretsiz notu, kanallar', () => read(`de/${ARTIKEL}`).includes('class="ww-fuss') && read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/') && read(`de/${ARTIKEL}`).includes('/de/ueber/') && read(`de/${ARTIKEL}`).includes('CC BY-SA 4.0') && read(`de/${ARTIKEL}`).includes('kanal-tiktok')],
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
  ['Header: 5 Tabs (Entdecken, Lernen, Werkzeug, Glossar, Blog), kein Marken-Tab vor TP2', () => { const h = read(`de/${ARTIKEL}`); return (h.match(/class="ww-tab(?: astro-[\w-]+)?"/g) || []).length === 5 && ['/de/entdecken/', '/de/lernen/', '/de/elektrowerkzeuge/', '/de/glossar/', '/de/blog/'].every((p) => new RegExp(`class="ww-tab(?: astro-[\\w-]+)?"[^>]*href="${p}"`).test(h)) && !h.includes('/de/elektrowerkzeuge/marken/'); }],
  ['Header: aktiver Tab „Lernen“ auf Grundlagen-Seite, „Werkzeug“ auf Werkzeug-Seite (aria-current)', () => /<a[^>]*class="ww-tab(?: astro-[\w-]+)?"[^>]*href="\/de\/lernen\/"[^>]*aria-current="page"/.test(read('de/grundlagen/schutzorgane')) && /<a[^>]*class="ww-tab(?: astro-[\w-]+)?"[^>]*href="\/de\/elektrowerkzeuge\/"[^>]*aria-current="page"/.test(read('de/elektrowerkzeuge'))],
  ['Header: Suche mit Strg K (de) / Ctrl K (tr), Stufen-Chip mit 3 Optionen, Theme-Icon, Sprachwahl', () => read(`de/${ARTIKEL}`).includes('<site-search') && /<kbd[^>]*>Strg<\/kbd>/.test(read(`de/${ARTIKEL}`)) && /<kbd[^>]*>Ctrl<\/kbd>/.test(read(`tr/${ARTIKEL}`)) && (read(`de/${ARTIKEL}`).match(/class="ww-stufe-option ist-/g) || []).length === 3 && /class="ww-theme-knopf(?: astro-[\w-]+)?"/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes('<starlight-lang-select')],
  // TP1 · Task 5: Der mobile Drawer (mit Starlights MobileMenuFooter: Theme/Sprache + Social-Icons-Container) erscheint jetzt auch
  // auf der Startseite – gewollt (Sidebar.astro). Die Prüfung „keine Social-Icons“ bleibt auf den Header selbst begrenzt.
  ['Header: Wortmarke watt<b>was</b>, keine Social-Icons', () => { const kopf = read('de').match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? ''; return /class="ww-marke(?: astro-[\w-]+)?"[^>]*>watt<b[^>]*>was<\/b>/.test(kopf) && !kopf.includes('social-icons'); }],
  ['Theme + Stufe vor dem Rendern: Inline-Script setzt data-theme (dunkel Standard) und data-stufe aus localStorage', () => /dataset\.theme = gespeichert === 'light' \? 'light' : 'dark'/.test(read(`de/${ARTIKEL}`)) && read(`de/${ARTIKEL}`).includes("lies('ww-stufe')")],
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
