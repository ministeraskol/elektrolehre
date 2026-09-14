// Route-Middleware (Starlight 0.42): Stufen-Badge je Seitenleisten-Link aus dem Frontmatter `stufe` der deutschen Quelle ableiten.
// Spec §3.2 verlangt „Badge muss zur Stufe passen“ – hier per Konstruktion, kein doppelter Eintrag im Frontmatter (Abweichung dokumentiert).
// Aufräumen 14.09. – SEO: <head> je Seite nachziehen (canonical und hreflang, siehe seo()).
import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import ui from './data/startseite-ui.json';
import { QUELLSPRACHE, echteSprachen, slugAusId, sprachKarte } from './scripts/uebersetzungen.mjs';

type Stufe = 'einstieg' | 'azubi' | 'profi';
type KopfTag = StarlightRouteData['head'][number];
let stufen: Map<string, Stufe> | undefined;
let sprachen: Map<string, Set<string>> | undefined;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

async function ladeStufen(): Promise<Map<string, Stufe>> {
  if (!stufen) {
    stufen = new Map();
    for (const e of await getCollection('docs')) {
      if (e.id.startsWith('de/') && e.data.stufe) stufen.set(e.id.slice(3), e.data.stufe as Stufe);
    }
  }
  return stufen;
}

// Sprachen je Seite aus src/scripts/uebersetzungen.mjs – dieselbe Rechnung wie der Sitemap-Filter in astro.config.mjs.
// Seitenauswahl wie Starlights Routen: Entwürfe zählen im Produktions-Build nicht.
async function ladeSprachen(): Promise<Map<string, Set<string>>> {
  sprachen ??= sprachKarte((await getCollection('docs', ({ data }) => import.meta.env.MODE !== 'production' || data.draft === false)).map((e) => e.id));
  return sprachen;
}

const istLink = (t: KopfTag, rel: string) => t.tag === 'link' && t.attrs?.rel === rel;
const istMeta = (t: KopfTag, attr: 'name' | 'property', wert: string) => t.tag === 'meta' && t.attrs?.[attr] === wert;
const localeAusHref = (href: string) => new URL(href).pathname.slice(base.length).split('/')[1];

function seo(route: StarlightRouteData, karte: Map<string, Set<string>>) {
  // Fallback-Seite (in dieser Locale nicht übersetzt, Starlight zeigt die deutsche Fassung mit Hinweisband): canonical und og:url
  // zeigen auf das deutsche Original. Kein noindex daneben – ein Signal, nicht zwei widersprüchliche.
  if (route.isFallback && route.locale) {
    const vorher = `${base}/${route.locale}/`;
    for (const t of route.head) {
      const feld = istLink(t, 'canonical') ? 'href' : istMeta(t, 'property', 'og:url') ? 'content' : undefined;
      const attrs = t.attrs;
      if (!feld || !attrs || typeof attrs[feld] !== 'string') continue;
      const url = new URL(attrs[feld] as string);
      if (url.pathname.startsWith(vorher)) url.pathname = `${base}/${QUELLSPRACHE}/${url.pathname.slice(vorher.length)}`;
      attrs[feld] = url.href;
    }
  }
  // hreflang: nur Locales, in denen es die Seite als eigene Datei gibt (eine Fallback-Seite trägt dieselbe Gruppe wie ihr Original);
  // x-default (→ de) bleibt wie bei Starlight. Gibt es die Seite nur in einer Sprache (Rechtliches), entfallen alle Alternates:
  // eine Sprachgruppe aus einer einzigen Seite sagt nichts aus.
  const echt = echteSprachen(karte, slugAusId(route.id));
  route.head = route.head.filter((t) => {
    if (!istLink(t, 'alternate') || !t.attrs?.hreflang) return true;
    if (echt.size < 2) return false;
    return t.attrs.hreflang === 'x-default' || echt.has(localeAusHref(String(t.attrs.href)));
  });
}

export const onRequest = defineRouteMiddleware(async (context) => {
  const { starlightRoute } = context.locals;
  const locale = starlightRoute.locale ?? 'de';
  const t = (ui as Record<string, typeof ui.de>)[locale] ?? ui.de;
  const karte = await ladeStufen();
  const slugVon = (href: string) => href.replace(base, '').replace(/^\/[a-z]+\//, '').replace(/\/$/, '');
  const markiere = (eintraege: typeof starlightRoute.sidebar) => {
    for (const e of eintraege) {
      if (e.type === 'group') { markiere(e.entries); continue; }
      const stufe = karte.get(slugVon(e.href));
      if (stufe) e.badge = { text: t.stufen[stufe], variant: 'default', class: `ww-stufe stufe-${stufe}` };
    }
  };
  markiere(starlightRoute.sidebar);
  seo(starlightRoute, await ladeSprachen());
});
