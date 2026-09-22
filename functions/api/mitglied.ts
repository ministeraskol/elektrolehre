// Cloudflare Pages Function: newsletter sign-up for wattwas.
//
// The browser never sees the Brevo key. The form posts here, this function calls
// Brevo's double-opt-in endpoint, and Brevo sends the confirmation mail. The
// contact is only stored after the visitor clicks the link in that mail.
//
// Required environment variables on the Pages project:
//   BREVO_API_KEY          xkeysib-... (secret)
//   BREVO_LIST_ID          numeric id of the target list
//   BREVO_DOI_TEMPLATE_ID  numeric id of the double-opt-in template

interface Env {
  BREVO_API_KEY: string;
  BREVO_LIST_ID: string;
  BREVO_DOI_TEMPLATE_ID: string;
}

const STUFEN = ['einstieg', 'azubi', 'profi'] as const;
const SPRACHEN = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'] as const;

const antwort = (status: number, körper: Record<string, unknown>) =>
  new Response(JSON.stringify(körper), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Visitors without JavaScript get a plain page instead of raw JSON.
const seite = (status: number, titel: string, zurück: string) =>
  new Response(
    `<!doctype html><html lang="de"><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>wattwas</title>` +
      `<body style="font:16px/1.6 system-ui;max-width:34rem;margin:15vh auto;padding:0 1.5rem">` +
      `<p>${titel}</p><p><a href="${zurück}">wattwas.de</a></p>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const willJson = (request.headers.get('accept') ?? '').includes('application/json');

  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return willJson ? antwort(400, { grund: 'ungueltig' }) : seite(400, 'Fehlerhafte Anfrage.', '/');
  }

  const feld = (name: string) => String(daten.get(name) ?? '').trim();

  // Honeypot: a real browser leaves this empty. Answer as if it worked.
  if (feld('firmenname')) return willJson ? antwort(200, { ok: true }) : seite(200, 'Danke.', '/');

  const email = feld('EMAIL').toLowerCase();
  const stufe = feld('LEVEL');
  const sprache = feld('sprache');

  const spracheOk = (SPRACHEN as readonly string[]).includes(sprache) ? sprache : 'de';
  const zurück = `/${spracheOk}/mitglied/`;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 190) {
    return willJson ? antwort(400, { grund: 'email' }) : seite(400, 'Bitte eine gültige E-Mail-Adresse angeben.', zurück);
  }
  if (!(STUFEN as readonly string[]).includes(stufe)) {
    return willJson ? antwort(400, { grund: 'stufe' }) : seite(400, 'Bitte eine Stufe wählen.', zurück);
  }
  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.BREVO_DOI_TEMPLATE_ID) {
    return willJson ? antwort(503, { grund: 'nicht-konfiguriert' }) : seite(503, 'Die Anmeldung ist noch nicht aktiv.', zurück);
  }

  const ziel = new URL(`${zurück}?bestaetigt=1`, request.url).toString();

  let brevo: Response;
  try {
    brevo = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: { LEVEL: stufe, SPRACHE: spracheOk },
        includeListIds: [Number(env.BREVO_LIST_ID)],
        templateId: Number(env.BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: ziel,
      }),
    });
  } catch (e) {
    console.error('brevo unreachable:', String(e));
    return willJson ? antwort(502, { grund: 'netz' }) : seite(502, 'Die Anmeldung ist gerade nicht erreichbar.', zurück);
  }

  if (brevo.ok || brevo.status === 204) {
    return willJson ? antwort(200, { ok: true }) : seite(200, 'Fast geschafft: bitte den Link in der E-Mail anklicken.', zurück);
  }

  const rohtext = await brevo.text().catch(() => '');
  console.error('brevo rejected:', brevo.status, rohtext.slice(0, 300));

  let fehler: { code?: string } = {};
  try {
    fehler = JSON.parse(rohtext);
  } catch {
    /* Brevo antwortet bei Sperren mit HTML statt JSON */
  }
  if (brevo.status === 400 && fehler.code === 'duplicate_parameter') {
    return willJson ? antwort(409, { grund: 'doppelt' }) : seite(409, 'Diese Adresse ist schon angemeldet.', zurück);
  }

  return willJson ? antwort(502, { grund: 'anbieter' }) : seite(502, 'Die Anmeldung hat nicht geklappt.', zurück);
};
