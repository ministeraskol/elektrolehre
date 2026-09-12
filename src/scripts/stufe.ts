// Stufe wählen (Spec §3.3): localStorage „ww-stufe“, <html data-stufe> sofort, Stufen-Leiste aus. Kein Konto, kein Tracking.
export type Stufe = 'einstieg' | 'azubi' | 'profi';

export function setzeStufe(stufe: string): void {
  const s: Stufe = stufe === 'azubi' || stufe === 'profi' ? stufe : 'einstieg';
  const html = document.documentElement;
  html.dataset.stufe = s;
  html.dataset.stufeGewaehlt = '';
  try { localStorage.setItem('ww-stufe', s); } catch { /* privater Modus o. ä. */ }
  document.dispatchEvent(new CustomEvent<Stufe>('ww-stufe', { detail: s }));
}

export function hinweisAus(): void {
  document.documentElement.dataset.stufeHinweis = 'aus';
  try { localStorage.setItem('ww-stufe-hinweis', '1'); } catch { /* privater Modus o. ä. */ }
}
