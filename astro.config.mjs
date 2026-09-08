import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Impressum + Datenschutz yayınlanınca false yapılır (Faz 3). Başka yerde tekrar etme.
const NOINDEX = true;
// GitHub Pages alt yolu. Özel alan adına geçilirse '' yapılır.
const BASE = '/elektrolehre';

export default defineConfig({
  site: 'https://ministeraskol.github.io',
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
