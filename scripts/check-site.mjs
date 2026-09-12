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

const ARTIKEL = 'anleitungen/unterverteilung';
// Faz 1: 12 Almanca içerik sayfası (index + 11) — hepsi quiz + kaynak listesi taşımalı (haftungsausschluss hariç)
const FAZ1_SEITEN = [
  'beruf/berufsbild', 'beruf/lernfelder', 'beruf/weiterbildung',
  'grundlagen/strom-spannung-widerstand', 'grundlagen/netz-und-leiterfarben', 'grundlagen/schutzorgane', 'grundlagen/sicherheitsregeln',
  'anleitungen/unterverteilung', 'anleitungen/zaehlerplatz', 'anleitungen/wechselschaltung-steckdose',
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
    htmlFiles(dist).filter((f) => f !== join(dist, 'index.html')).every((f) => !/name="robots"[^>]*content="noindex/.test(readFileSync(f, 'utf8')))],
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
  ['tr/ar Startseite LinkCard', () => read('tr').includes('./beruf/berufsbild/') && read('ar').includes('./beruf/berufsbild/')],
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
  ['Anleitungen Sicherheit bloğuyla başlıyor', () => ['zaehlerplatz', 'wechselschaltung-steckdose'].every((a) => read(`de/anleitungen/${a}`).includes('class="sicherheit'))],
  ['Zählerplatz ve Wechselschaltung şeması var', () => read('de/anleitungen/zaehlerplatz').includes('class="schema') && read('de/anleitungen/wechselschaltung-steckdose').includes('class="schema')],
  ['Bild bileşeni (Commons, lisans) Schutzorgane sayfasında', () => read('de/grundlagen/schutzorgane').includes('class="bild') && read('de/grundlagen/schutzorgane').includes('creativecommons.org')],
  ['sidebar 4 grup (Beruf, Grundlagen, Anleitungen, Rechtliches)', () => ['Beruf', 'Grundlagen', 'Anleitungen', 'Rechtliches'].every((g) => read('de/beruf/berufsbild').includes(`>${g}<`) || read('de/beruf/berufsbild').includes(`${g}</span>`))],
  ['ka berufsbild çevrildi (Gürcüce band yok)', () => existsSync(page('ka/beruf/berufsbild')) && !read('ka/beruf/berufsbild').includes(kaBand) && read('ka/beruf/berufsbild').includes('uebersetzungshinweis')],
  ['Startseite LinkCard 3 bölüme link (göreli)', () => ['./beruf/berufsbild/', './grundlagen/strom-spannung-widerstand/', './anleitungen/unterverteilung/'].every((h) => read('de').includes(h))],
  // Redesign (12 Eyl 2026): şematik tema
  ['Startseite hero: başlık "Elektrotechnik von null an" + animasyonlu devre', () => read('de').includes('Elektrotechnik von null an') && read('de').includes('hero-schaltkreis')],
  ['Startseite hero: 8 dil bağlantısı', () => (read('de').match(/class="ww-sprachen[^"]*"[\s\S]*?<\/nav>/)?.[0].match(/hreflang="/g) || []).length === 8],
  ['Startseite: 3 sütun kartı, 4 Lernpfad bölümü, 3 Anleitung kartı (rozet + okuma süresi)', () =>
    (read('de').match(/class="karte saeule[" ]/g) || []).length === 3 &&
    (read('de').match(/class="kapitel reveal[" ]/g) || []).length === 4 &&
    (read('de').match(/class="karte anleitung[" ]/g) || []).length === 3 &&
    read('de').includes('badge-azubi') && read('de').includes('Min. Lesezeit')],
  ['Startseite her dilde Startseite bileşeni (ar RTL dahil)', () => ['tr','en','ru','ar','fa','ka','sq'].every((l) => /class="karte saeule[" ]/.test(read(l)) && read(l).includes('ww-lernpfad'))],
  ['Footer: dil + Impressum bağlantıları, ücretsiz notu', () => read(`de/${ARTIKEL}`).includes('class="ww-fuss') && read(`de/${ARTIKEL}`).includes('/de/rechtliches/impressum/') && read(`de/${ARTIKEL}`).includes('CC BY-SA 4.0')],
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
