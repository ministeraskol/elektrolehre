// Abmeldung von der wattwas-Mailliste.
//
// GET zeigt eine Seite mit einem Knopf, POST trägt aus. Getrennt, weil
// Mail-Scanner und Vorschaufunktionen Links im Hintergrund abrufen: ein
// Abmelden per GET würde Leute austragen, die nie geklickt haben.

import { brevo, Env, EMAIL_MUSTER, istSprache, pruefen, seite } from './_gemeinsam';
import texte from './_mail-texte.json';

const ABMELDE_TEXTE = texte.abmelden as Record<string, { frage: string; knopf: string; weg: string; fehler: string }>;

const spracheVon = (u: URL) => {
  const l = u.searchParams.get('l') ?? 'de';
  return istSprache(l) ? l : 'de';
};

const rtl = (s: string) => (s === 'ar' || s === 'fa' ? ' dir="rtl"' : '');

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const u = new URL(request.url);
  const sprache = spracheVon(u);
  const email = (u.searchParams.get('e') ?? '').toLowerCase();
  const sig = u.searchParams.get('s') ?? '';
  const t = ABMELDE_TEXTE[sprache];

  if (!EMAIL_MUSTER.test(email) || !env.ABMELDE_SECRET || !(await pruefen(email, sig, env.ABMELDE_SECRET))) {
    return seite(400, sprache, 'wattwas', t.fehler, `/${sprache}/`);
  }

  return new Response(
    `<!doctype html><html lang="${sprache}"${rtl(sprache)}>` +
      `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>wattwas</title>` +
      `<body style="margin:0;background:#F4F2ED;color:#16181C;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">` +
      `<div style="max-width:32rem;margin:0 auto;padding:18vh 1.5rem">` +
      `<p style="font-size:1.5rem;font-weight:600;margin:0 0 1.25rem">${t.frage}</p>` +
      `<form method="post">` +
      `<input type="hidden" name="e" value="${email}"><input type="hidden" name="s" value="${sig}">` +
      `<input type="hidden" name="l" value="${sprache}">` +
      `<button type="submit" style="background:#0B63CE;color:#fff;border:0;border-radius:9px;padding:15px 26px;font:600 16px/1 inherit;cursor:pointer">${t.knopf}</button>` +
      `</form>` +
      `<p style="margin:1.5rem 0 0"><a href="/${sprache}/" style="color:#5C6169">wattwas.de</a></p></div>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return seite(400, 'de', 'wattwas', ABMELDE_TEXTE.de.fehler, '/');
  }

  const email = String(daten.get('e') ?? '').toLowerCase();
  const sig = String(daten.get('s') ?? '');
  const l = String(daten.get('l') ?? 'de');
  const sprache = istSprache(l) ? l : 'de';
  const t = ABMELDE_TEXTE[sprache];

  if (!EMAIL_MUSTER.test(email) || !env.ABMELDE_SECRET || !(await pruefen(email, sig, env.ABMELDE_SECRET))) {
    return seite(400, sprache, 'wattwas', t.fehler, `/${sprache}/`);
  }

  // emailBlacklisted statt Löschen: so bleibt nachweisbar, dass die Adresse
  // ausgetragen ist, und eine spätere Anmeldung trägt sie nicht stillschweigend
  // wieder ein.
  const antwort = await brevo(env, `/contacts/${encodeURIComponent(email)}`, 'PUT', {
    emailBlacklisted: true,
    unlinkListIds: [Number(env.BREVO_LIST_ID)],
  }).catch((e) => {
    console.error('unsubscribe failed:', String(e));
    return undefined;
  });

  if (!antwort || (!antwort.ok && antwort.status !== 204)) {
    if (antwort) console.error('unsubscribe rejected:', antwort.status, (await antwort.text().catch(() => '')).slice(0, 200));
    return seite(502, sprache, 'wattwas', t.fehler, `/${sprache}/`);
  }

  return seite(200, sprache, t.weg, '', `/${sprache}/`);
};
