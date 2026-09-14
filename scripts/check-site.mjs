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
  ['noindex hiçbir içerik sayfasında yok (Google açık)', () =>
    htmlFiles(dist).map((f) => readFileSync(f, 'utf8')).filter((h) => !/http-equiv="refresh"/.test(h)).every((h) => !/name="robots"[^>]*content="noindex/.test(h))],
  ['Impressum sayfası: ad + Badenweiler', () => existsSync(page('de/rechtliches/impressum')) && read('de/rechtliches/impressum').includes('79410 Badenweiler')],
  ['Datenschutz sayfası: GitHub Pages + Wikimedia', () => existsSync(page('de/rechtliches/datenschutz')) && read('de/rechtliches/datenschutz').includes('GitHub Pages') && read('de/rechtliches/datenschutz').includes('Wikimedia')],
  ['Impressum her sayfanın sidebar menüsünde', () => read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/')],
  // Faz 2: çeviri + glossar
  ...['tr','en','ru','ar','fa','ka','sq'].map((l) => [`${l}/grundlagen/strom-spannung-widerstand çevrildi (band yok, çeviri notu YOK, quiz 5)`, () =>
    existsSync(page(`${l}/grundlagen/strom-spannung-widerstand`)) &&
    !read(`${l}/grundlagen/strom-spannung-widerstand`).includes(DE_BAND) &&
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
  ['tr makale çevrildi (fallback bandı yok)', () => !read(`tr/${ARTIKEL}`).includes(DE_BAND) && /<html[^>]*lang="tr"/.test(read(`tr/${ARTIKEL}`))],
  ['tr makalede çeviri notu YOK (Rückmeldung 13.09 R1)', () => !read(`tr/${ARTIKEL}`).includes('uebersetzungshinweis')],
  ['ar makale çevrildi, RTL, çeviri notu YOK', () =>
    /<html[^>]*dir="rtl"/.test(read(`ar/${ARTIKEL}`)) && !read(`ar/${ARTIKEL}`).includes('uebersetzungshinweis') && !read(`ar/${ARTIKEL}`).includes(DE_BAND)],
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
  ['Stufen-Hinweis (tr): lokalisiert', () => read('tr/grundlagen/schutzorgane').includes('Bu sayfa Azubi için.')],
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
  ['Entdecken (tr/ar): Sprache der Seite, deutsche Slugs, RTL', () => read('tr/entdecken').includes('href="/tr/grundlagen/schutzorgane/"') && read('tr/entdecken').includes('Schutzorgane – LS, RCD, SLS ve') && read('tr/entdecken').includes('Azubi için öneriler') && /<html[^>]*dir="rtl"/.test(read('ar/entdecken'))],
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
  ['Wörterbuch (de): Zielspalte Englisch, Begriff lang=de translate=no, Duspol/Flex/Engländer, Grundausstattung-Pill ≥ 15, Foto-folgt-Platzhalter', () => { const h = read('de/elektrowerkzeuge/woerterbuch'); return /<th scope="col"[^>]*>Englisch</.test(h) && /id="zweipoliger-spannungspruefer"[\s\S]{0,400}?lang="de" translate="no"/.test(h) && ['Duspol', 'Flex', 'Engländer'].every((w) => h.includes(w)) && (h.match(/ww-pill ww-pill-tag(?: astro-[\w-]+)?">Grundausstattung</g) || []).length >= 15 && (h.match(/Foto folgt/g) || []).length === WB_N; }],
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
