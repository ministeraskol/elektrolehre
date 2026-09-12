// Route-Middleware (Starlight 0.42): Stufen-Badge je Seitenleisten-Link aus dem Frontmatter `stufe` der deutschen Quelle ableiten.
// Spec §3.2 verlangt „Badge muss zur Stufe passen“ – hier per Konstruktion, kein doppelter Eintrag im Frontmatter (Abweichung dokumentiert).
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import ui from './data/startseite-ui.json';

type Stufe = 'einstieg' | 'azubi' | 'profi';
let stufen: Map<string, Stufe> | undefined;

async function ladeStufen(): Promise<Map<string, Stufe>> {
  if (!stufen) {
    stufen = new Map();
    for (const e of await getCollection('docs')) {
      if (e.id.startsWith('de/') && e.data.stufe) stufen.set(e.id.slice(3), e.data.stufe as Stufe);
    }
  }
  return stufen;
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const { starlightRoute } = context.locals;
  const locale = starlightRoute.locale ?? 'de';
  const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
  const karte = await ladeStufen();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const slugVon = (href: string) => href.replace(base, '').replace(/^\/[a-z]+\//, '').replace(/\/$/, '');
  const markiere = (eintraege: typeof starlightRoute.sidebar) => {
    for (const e of eintraege) {
      if (e.type === 'group') { markiere(e.entries); continue; }
      const stufe = karte.get(slugVon(e.href));
      if (stufe) e.badge = { text: t.stufen[stufe], variant: 'default', class: `ww-stufe stufe-${stufe}` };
    }
  };
  markiere(starlightRoute.sidebar);
});
