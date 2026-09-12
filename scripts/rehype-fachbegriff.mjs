// rehype-Plugin: markiert in jedem Inhaltsartikel das erste Vorkommen jedes Glossar-Begriffs
// als <a href="…/glossar/#begriff-…"><dfn class="fachbegriff">Begriff</dfn></a>.
// Nur Fließtext (keine Überschriften, Links, Code). Inhalte bleiben unverändert – reine Darstellung.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { begriffSlug, begriffVarianten } from '../src/data/begriff-slug.mjs';

const glossar = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/glossar.json', import.meta.url)), 'utf8'));
const SKIP = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dfn', 'script', 'style', 'svg', 'kbd', 'button', 'figcaption']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Längere Begriffe zuerst, damit „Leitungsschutzschalter“ vor „Schalter“-ähnlichen Treffern greift.
const muster = glossar
  .flatMap((e) => begriffVarianten(e.de).map((v) => ({ v, slug: begriffSlug(e.de), de: e.de })))
  .sort((a, b) => b.v.length - a.v.length)
  .map(({ v, slug, de }) => ({
    slug,
    de,
    re: new RegExp(`(?<![\\p{L}\\p{N}-])(${esc(v)}${/\p{L}$/u.test(v) ? '(?:es|en|er|e|n|s)?' : ''})(?![\\p{L}\\p{N}-])`, 'u'),
  }));

export default function rehypeFachbegriff({ base = '' } = {}) {
  return (tree, file) => {
    const pfad = String(file.path ?? file.history?.[0] ?? '').replace(/\\/g, '/');
    const m = pfad.match(/\/content\/docs\/([a-z]{2})\//);
    if (!m || /\/index\.mdx$/.test(pfad) || /\/rechtliches\//.test(pfad)) return;
    const lang = m[1];
    const gesehen = new Set();

    const teile = (text) => {
      const out = [];
      let rest = text;
      for (;;) {
        let best = null;
        for (const p of muster) {
          if (gesehen.has(p.slug)) continue;
          const mm = p.re.exec(rest);
          if (mm && (best === null || mm.index < best.index)) best = { index: mm.index, wort: mm[1], p };
        }
        if (!best) break;
        gesehen.add(best.p.slug);
        if (best.index > 0) out.push({ type: 'text', value: rest.slice(0, best.index) });
        out.push({
          type: 'element',
          tagName: 'a',
          properties: { href: `${base}/${lang}/glossar/#${best.p.slug}`, className: ['fachbegriff-link'], title: best.p.de },
          children: [{ type: 'element', tagName: 'dfn', properties: { className: ['fachbegriff'], lang: 'de', translate: 'no' }, children: [{ type: 'text', value: best.wort }] }],
        });
        rest = rest.slice(best.index + best.wort.length);
      }
      if (out.length === 0) return null;
      if (rest) out.push({ type: 'text', value: rest });
      return out;
    };

    const walk = (node) => {
      if (!node.children) return;
      if (node.type === 'element' && SKIP.has(node.tagName)) return;
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') return;
      for (let i = 0; i < node.children.length; i++) {
        const kind = node.children[i];
        if (kind.type === 'text') {
          const neu = teile(kind.value);
          if (neu) {
            node.children.splice(i, 1, ...neu);
            i += neu.length - 1;
          }
        } else walk(kind);
      }
    };
    walk(tree);
  };
}
