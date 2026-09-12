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
  ['robots.txt: Sitemap satırı', () => existsSync(join(dist, 'robots.txt')) && readFileSync(join(dist, 'robots.txt'), 'utf8').includes('Sitemap: https://wattwas.de/sitemap-index.xml')],
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
  ['sidebar grupları (Themen, Grundlagen, Elektrowerkzeuge, Blog, Rechtliches)', () => ['Themen', 'Grundlagen', 'Elektrowerkzeuge', 'Blog', 'Rechtliches'].every((g) => read(`de/${EGT}/berufsbild`).includes(`>${g}<`) || read(`de/${EGT}/berufsbild`).includes(`${g}</span>`))],
  ['ka berufsbild çevrildi (Gürcüce band yok)', () => existsSync(page(`ka/${EGT}/berufsbild`)) && !read(`ka/${EGT}/berufsbild`).includes(kaBand) && read(`ka/${EGT}/berufsbild`).includes('uebersetzungshinweis')],
  ['Startseite: Grundlagen, EGT, Werkzeug, Themen linkleri', () => ['./grundlagen/', './themen/energie-und-gebaeudetechnik/', './elektrowerkzeuge/', './themen/'].every((h) => read('de').includes(h))],
  // Redesign (12 Eyl 2026): şematik tema
  ['Startseite hero: "Elektrotechnik." + "Einfach erklärt." + animasyonlu devre + Funken', () => read('de').includes('Elektrotechnik.') && read('de').includes('Einfach erklärt.') && read('de').includes('hero-schaltkreis') && (read('de').match(/class="funke[" ]/g) || []).length >= 10],
  ['Startseite hero: 8 dil bağlantısı', () => (read('de').match(/class="ww-sprachen[^"]*"[\s\S]*?<\/nav>/)?.[0].match(/hreflang="/g) || []).length === 9],
  ['Startseite: 6 video kartı, 6 Themen kartı, 4 Lernpfad bölümü, 3 Anleitung kartı', () =>
    (read('de').match(/class="video farbe-/g) || []).length === 6 &&
    (read('de').match(/class="thema[ "]/g) || []).length === 6 &&
    (read('de').match(/class="kapitel reveal[" ]/g) || []).length === 4 &&
    (read('de').match(/class="karte anleitung[" ]/g) || []).length === 3 && read('de').includes('badge-azubi')],
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
  ['Werkzeug: affiliate kapalıyken "Zum Angebot" yok, hinweis var', () => !read('de/elektrowerkzeuge').includes('rel="sponsored') && read('de/elektrowerkzeuge').includes('affiliate-hinweis')],
  ['Footer: dil + Impressum + Über bağlantıları, ücretsiz notu, kanallar', () => read(`de/${ARTIKEL}`).includes('class="ww-fuss') && read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/') && read(`de/${ARTIKEL}`).includes('/de/ueber/') && read(`de/${ARTIKEL}`).includes('CC BY-SA 4.0') && read(`de/${ARTIKEL}`).includes('kanal-tiktok')],
  ['Fontlar self-hosted (Google Fonts çağrısı yok)', () => htmlFiles(dist).every((f) => !readFileSync(f, 'utf8').includes('fonts.googleapis.com')) && readdirSync(join(dist, '_astro')).some((n) => /inter.*\.woff2$/i.test(n)) && readdirSync(join(dist, '_astro')).some((n) => /space-grotesk.*\.woff2$/i.test(n))],
  ['Fachbegriff işareti: de + tr makalede dfn.fachbegriff → glossar anker', () => ['de', 'tr'].every((l) => (read(`${l}/${ARTIKEL}`).match(/<dfn class="fachbegriff"/g) || []).length >= 5 && read(`${l}/${ARTIKEL}`).includes(`/${l}/glossar/#begriff-`))],
  ['Fachbegriff başlıklarda değil', () => !/<h[1-6][^>]*>[^<]*<a class="fachbegriff-link"/.test(read(`de/${ARTIKEL}`))],
  ['Glossar satırlarında id (begriff-…)', () => (read('de/glossar').match(/<th scope="row"[^>]*id="begriff-/g) || []).length >= 80],
  ['Datenschutz: Lesefortschritt localStorage notu', () => read('de/rechtliches/datenschutz').includes('Lesefortschritt')],
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
