import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { unified } from '@astrojs/markdown-remark';
import rehypeFachbegriff from './scripts/rehype-fachbegriff.mjs';
import social from './src/data/social.json' with { type: 'json' };

// 11 Eyl 2026: Impressum + Datenschutz yayında → indekslenebilir. Geri kapatmak için true.
const NOINDEX = false;
// Özel alan adı wattwas.de (11 Eyl 2026): kökte yayın. GitHub alt yoluna dönülürse '/elektrolehre'.
const BASE = '';

// 12 Eyl 2026: Beruf + Anleitungen → themen/energie-und-gebaeudetechnik. Eski URL'ler (Google'da) yönlendirilir.
const LOCALES = ['de', 'leicht', 'tr', 'en', 'ru', 'ar', 'fa', 'ka', 'sq'];
const ALT = { beruf: ['berufsbild', 'lernfelder', 'weiterbildung'], anleitungen: ['unterverteilung', 'zaehlerplatz', 'wechselschaltung-steckdose'] };
const redirects = { '/': `${BASE}/de/` };
for (const l of LOCALES) {
  for (const [dir, seiten] of Object.entries(ALT)) {
    redirects[`/${l}/${dir}/`] = `${BASE}/${l}/themen/energie-und-gebaeudetechnik/`;
    for (const s of seiten) redirects[`/${l}/${dir}/${s}/`] = `${BASE}/${l}/themen/energie-und-gebaeudetechnik/${s}/`;
  }
}

const T = (de, rest) => ({ label: de, translations: rest });
const tr8 = (en, tr, ru, ar, fa, ka, sq, leicht = undefined) => ({ en, tr, ru, ar, fa, ka, sq, ...(leicht ? { leicht } : {}) });

export default defineConfig({
  site: 'https://wattwas.de',
  base: BASE,
  redirects,
  // Fachbegriffe aus dem Glossar werden im Fließtext automatisch markiert (erstes Vorkommen pro Seite).
  markdown: { processor: unified({ rehypePlugins: [[rehypeFachbegriff, { base: BASE }]] }) },
  integrations: [
    starlight({
      title: 'wattwas',
      description: 'Elektrotechnik. Einfach erklärt. Ausbildung, Grundlagen, Werkzeug – kurz, klar, in deiner Sprache.',
      defaultLocale: 'de',
      locales: {
        de: { label: 'Deutsch', lang: 'de' },
        // Leichte Sprache: eigener Sprachpfad, HTML-lang bleibt Deutsch (private-use subtag nach BCP 47).
        leicht: { label: 'Leichte Sprache', lang: 'de-x-leicht' },
        tr: { label: 'Türkçe', lang: 'tr' },
        en: { label: 'English', lang: 'en' },
        ru: { label: 'Русский', lang: 'ru' },
        ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
        fa: { label: 'فارسی', lang: 'fa', dir: 'rtl' },
        ka: { label: 'ქართული', lang: 'ka' },
        sq: { label: 'Shqip', lang: 'sq' },
      },
      social: social.kanaele.filter((k) => k.url).map((k) => ({ icon: k.icon, label: k.label, href: k.url })),
      sidebar: [
        {
          ...T('Themen', tr8('Topics', 'Konular', 'Темы', 'المواضيع', 'موضوع‌ها', 'თემები', 'Temat', 'Themen')),
          items: [
            { ...T('Alle Themen', tr8('All topics', 'Tüm konular', 'Все темы', 'كل المواضيع', 'همهٔ موضوع‌ها', 'ყველა თემა', 'Të gjitha temat', 'Alle Themen')), link: '/themen/' },
            {
              ...T('Energie- und Gebäudetechnik', tr8('Energy and building technology', 'Enerji ve bina tekniği', 'Энергетика и техника зданий', 'تقنيات الطاقة والمباني', 'فناوری انرژی و ساختمان', 'ენერგეტიკა და შენობის ტექნიკა', 'Energjia dhe teknika e ndërtesave', 'Strom im Haus')),
              items: [{ autogenerate: { directory: 'themen/energie-und-gebaeudetechnik' } }],
            },
          ],
        },
        {
          ...T('Grundlagen', tr8('Basics', 'Temeller', 'Основы', 'الأساسيات', 'مبانی', 'საფუძვლები', 'Bazat', 'Grund-Wissen')),
          items: [{ autogenerate: { directory: 'grundlagen' } }],
        },
        {
          ...T('Elektrowerkzeuge', tr8('Tools', 'Elektrikçi aletleri', 'Инструменты', 'أدوات الكهربائي', 'ابزارها', 'ხელსაწყოები', 'Veglat', 'Werkzeug')),
          items: [{ autogenerate: { directory: 'elektrowerkzeuge' } }],
        },
        {
          ...T('Blog', tr8('Blog', 'Blog', 'Блог', 'المدوّنة', 'وبلاگ', 'ბლოგი', 'Blog')),
          items: [{ autogenerate: { directory: 'blog' } }],
        },
        { ...T('Mitglied werden', tr8('Join', 'Üye ol', 'Стать участником', 'كن عضواً', 'عضو شو', 'გახდი წევრი', 'Bëhu anëtar', 'Mitglied werden')), link: '/mitglied/' },
        { ...T('Über wattwas', tr8('About', 'Hakkında', 'О проекте', 'عن الموقع', 'درباره', 'პროექტის შესახებ', 'Rreth nesh', 'Über uns')), link: '/ueber/' },
        {
          ...T('Glossar', tr8('Glossary', 'Sözlük', 'Глоссарий', 'المسرد', 'واژه‌نامه', 'ლექსიკონი', 'Fjalorth', 'Wörter-Buch')),
          link: '/glossar/',
        },
        {
          ...T('Rechtliches', tr8('Legal', 'Yasal', 'Правовая информация', 'معلومات قانونية', 'اطلاعات حقوقی', 'სამართლებრივი', 'Ligjore')),
          items: [{ autogenerate: { directory: 'rechtliches' } }],
        },
      ],
      // Kırık iç link build'i kırar. Göreli linkler ve Almanca fallback sayfaları kasıtlı → hata değil.
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          errorOnFallbackPages: false,
          errorOnInconsistentLocale: false,
          // Glossar-Anker (#begriff-…) entstehen in Glossar.astro, nicht aus Markdown-Überschriften → nicht prüfbar.
          exclude: ['/*/glossar/#begriff-*'],
        }),
      ],
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
      // Schriften selbst gehostet (@fontsource) – kein Abruf bei Google Fonts (DSGVO, LG München I 3 O 17493/20).
      customCss: ['@fontsource-variable/inter', './src/styles/wattwas.css'],
      head: NOINDEX
        ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }]
        : [],
      lastUpdated: true,
    }),
  ],
});
