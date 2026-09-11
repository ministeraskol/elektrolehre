import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// 11 Eyl 2026: Impressum + Datenschutz yayında → indekslenebilir. Geri kapatmak için true.
const NOINDEX = false;
// Özel alan adı wattwas.de (11 Eyl 2026): kökte yayın. GitHub alt yoluna dönülürse '/elektrolehre'.
const BASE = '';

export default defineConfig({
  site: 'https://wattwas.de',
  base: BASE,
  // Kök adres varsayılan dile gider. Starlight kök yönlendirmesi üretmiyor; Astro redirects base'i kendisi eklemiyor.
  redirects: { '/': `${BASE}/de/` },
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
          label: 'Glossar',
          link: '/glossar/',
          translations: { en: 'Glossary', tr: 'Sözlük', ru: 'Глоссарий', ar: 'المسرد', fa: 'واژه‌نامه', ka: 'ლექსიკონი', sq: 'Fjalorth' },
        },
        {
          label: 'Beruf',
          translations: { en: 'Profession', tr: 'Meslek', ru: 'Профессия', ar: 'المهنة', fa: 'حرفه', ka: 'პროფესია', sq: 'Profesioni' },
          items: [{ autogenerate: { directory: 'beruf' } }],
        },
        {
          label: 'Grundlagen',
          translations: { en: 'Basics', tr: 'Temeller', ru: 'Основы', ar: 'الأساسيات', fa: 'مبانی', ka: 'საფუძვლები', sq: 'Bazat' },
          items: [{ autogenerate: { directory: 'grundlagen' } }],
        },
        {
          label: 'Anleitungen',
          translations: {
            en: 'Guides',
            tr: 'Uygulama rehberleri',
            ru: 'Инструкции',
            ar: 'إرشادات عملية',
            fa: 'راهنماهای عملی',
            ka: 'ინსტრუქციები',
            sq: 'Udhëzime',
          },
          items: [{ autogenerate: { directory: 'anleitungen' } }],
        },
        {
          label: 'Rechtliches',
          translations: { en: 'Legal', tr: 'Yasal', ru: 'Правовая информация', ar: 'معلومات قانونية', fa: 'اطلاعات حقوقی', ka: 'სამართლებრივი', sq: 'Ligjore' },
          items: [{ autogenerate: { directory: 'rechtliches' } }],
        },
      ],
      // Kırık iç link build'i kırar. Göreli linkler ve Almanca fallback sayfaları kasıtlı → hata değil.
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          errorOnFallbackPages: false,
          errorOnInconsistentLocale: false,
        }),
      ],
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
      head: NOINDEX
        ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }]
        : [],
      lastUpdated: true,
    }),
  ],
});
