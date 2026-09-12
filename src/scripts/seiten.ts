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
