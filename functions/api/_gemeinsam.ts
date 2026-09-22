// Gemeinsame Teile der beiden Endpunkte: Anmeldung und Abmeldung.

export interface Env {
  BREVO_API_KEY: string;
  BREVO_LIST_ID: string;
  ABMELDE_SECRET: string;
  /** Verifizierter Absender in Brevo. Wechselt, sobald wattwas.de sendet. */
  ABSENDER_EMAIL: string;
}

export const STUFEN = ['einstieg', 'azubi', 'profi'] as const;
export const SPRACHEN = ['de', 'leicht', 'en', 'tr', 'ru', 'ar', 'fa', 'ka', 'sq'] as const;
export type Stufe = (typeof STUFEN)[number];
export type Sprache = (typeof SPRACHEN)[number];

export const istStufe = (s: string): s is Stufe => (STUFEN as readonly string[]).includes(s);
export const istSprache = (s: string): s is Sprache => (SPRACHEN as readonly string[]).includes(s);

// Nur als Rückfall, wenn das Formular keine Sprache mitschickt. Die Sprache der
// gelesenen Seite ist das bessere Signal: sie ist eine Entscheidung, das Land
// ist eine Vermutung. Ein Türke in Deutschland hat eine deutsche IP.
const LAND_SPRACHE: Record<string, Sprache> = {
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  TR: 'tr', CY: 'tr',
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', UA: 'ru', MD: 'ru',
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', IQ: 'ar', SY: 'ar',
  JO: 'ar', LB: 'ar', LY: 'ar', YE: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', SD: 'ar',
  IR: 'fa', AF: 'fa',
  GE: 'ka',
  AL: 'sq', XK: 'sq', MK: 'sq',
};

export function spracheBestimmen(ausFormular: string, land: string | undefined): Sprache {
  if (istSprache(ausFormular)) return ausFormular;
  const l = (land ?? '').toUpperCase();
  return LAND_SPRACHE[l] ?? 'en';
}

// Der Abmeldelink muss ohne Login funktionieren und darf trotzdem nicht
// erlauben, fremde Adressen auszutragen. Also die Adresse signiert mitgeben.
const enc = new TextEncoder();

async function schluessel(geheim: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(geheim), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

const zuBase64Url = (b: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function signieren(email: string, geheim: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await schluessel(geheim), enc.encode(email));
  return zuBase64Url(sig);
}

export async function pruefen(email: string, signatur: string, geheim: string): Promise<boolean> {
  const erwartet = await signieren(email, geheim);
  if (erwartet.length !== signatur.length) return false;
  // Zeichenweiser Vergleich ohne frühen Abbruch, damit die Laufzeit nichts verrät.
  let gleich = 0;
  for (let i = 0; i < erwartet.length; i++) gleich |= erwartet.charCodeAt(i) ^ signatur.charCodeAt(i);
  return gleich === 0;
}

export const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function brevo(env: Env, pfad: string, methode: string, koerper?: unknown): Promise<Response> {
  return fetch(`https://api.brevo.com/v3${pfad}`, {
    method: methode,
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: koerper === undefined ? undefined : JSON.stringify(koerper),
  });
}

export const jsonAntwort = (status: number, körper: Record<string, unknown>) =>
  new Response(JSON.stringify(körper), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Schlichte Seite für alles, was ohne JavaScript im Browser landet.
export const seite = (status: number, sprache: string, titel: string, text: string, zurück: string) =>
  new Response(
    `<!doctype html><html lang="${sprache}"${sprache === 'ar' || sprache === 'fa' ? ' dir="rtl"' : ''}>` +
      `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>wattwas</title>` +
      `<body style="margin:0;background:#F4F2ED;color:#16181C;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">` +
      `<div style="max-width:32rem;margin:0 auto;padding:18vh 1.5rem">` +
      `<p style="font-size:1.5rem;font-weight:600;margin:0 0 0.75rem">${titel}</p>` +
      `<p style="margin:0 0 1.5rem;color:#5C6169">${text}</p>` +
      `<p style="margin:0"><a href="${zurück}" style="color:#0B63CE">wattwas.de</a></p></div>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
