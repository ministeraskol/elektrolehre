// Cloudflare Pages Function: Anmeldung zur wattwas-Mailliste.
//
// Der Browser sieht den Brevo-Key nie. Das Formular sendet hierher, diese
// Funktion legt den Kontakt an und schickt die Willkommens-Mail.
//
// Kein Double-Opt-in (Entscheidung Kadir, 22.09.2026). Stattdessen: eine
// Checkbox mit den Nutzungsbedingungen im Formular, und in jeder Mail ein
// Abmeldelink, der ohne Rückfrage funktioniert.
//
// Nötige Umgebungsvariablen am Pages-Projekt:
//   BREVO_API_KEY    xkeysib-... (secret)
//   BREVO_LIST_ID    Nummer der Liste
//   ABMELDE_SECRET   zufälliges Geheimnis, signiert den Abmeldelink (secret)

import {
  brevo,
  EMAIL_MUSTER,
  Env,
  istStufe,
  jsonAntwort,
  seite,
  signieren,
  spracheBestimmen,
} from './_gemeinsam';
import { MailText, Sprache, willkommensMail } from './_mail';
import texte from './_mail-texte.json';

const STUFEN_NAMEN: Record<Sprache, Record<string, string>> = texte.stufen as never;
const MAIL_TEXTE = texte.mail as Record<Sprache, MailText>;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const willJson = (request.headers.get('accept') ?? '').includes('application/json');

  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return willJson ? jsonAntwort(400, { grund: 'ungueltig' }) : seite(400, 'de', 'Fehler', 'Fehlerhafte Anfrage.', '/');
  }

  const feld = (name: string) => String(daten.get(name) ?? '').trim();

  // Honeypot: ein echter Browser lässt das Feld leer. Antworten wie bei Erfolg.
  if (feld('firmenname')) return willJson ? jsonAntwort(200, { ok: true }) : seite(200, 'de', 'Danke', '', '/');

  const email = feld('EMAIL').toLowerCase();
  const stufe = feld('LEVEL');
  const land = (request as unknown as { cf?: { country?: string } }).cf?.country;
  const sprache = spracheBestimmen(feld('sprache'), land);
  const zurück = `/${sprache}/mitglied/`;
  const t = MAIL_TEXTE[sprache];

  if (!EMAIL_MUSTER.test(email) || email.length > 190) {
    return willJson ? jsonAntwort(400, { grund: 'email' }) : seite(400, sprache, 'wattwas', 'E-Mail?', zurück);
  }
  if (!istStufe(stufe)) {
    return willJson ? jsonAntwort(400, { grund: 'stufe' }) : seite(400, sprache, 'wattwas', 'Stufe?', zurück);
  }
  // Ohne Haken keine Anmeldung. Das ist der Nachweis, den wir führen können.
  if (feld('EINWILLIGUNG') !== 'ja') {
    return willJson ? jsonAntwort(400, { grund: 'einwilligung' }) : seite(400, sprache, 'wattwas', '', zurück);
  }
  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.ABMELDE_SECRET) {
    return willJson ? jsonAntwort(503, { grund: 'nicht-konfiguriert' }) : seite(503, sprache, 'wattwas', '', zurück);
  }

  const jetzt = new Date().toISOString();

  // 1. Kontakt anlegen oder ergänzen.
  let anlegen: Response;
  try {
    anlegen = await brevo(env, '/contacts', 'POST', {
      email,
      attributes: { LEVEL: stufe, SPRACHE: sprache, ANMELDUNG: jetzt, LAND: land ?? '' },
      listIds: [Number(env.BREVO_LIST_ID)],
      updateEnabled: true,
    });
  } catch (e) {
    console.error('brevo unreachable:', String(e));
    return willJson ? jsonAntwort(502, { grund: 'netz' }) : seite(502, sprache, 'wattwas', '', zurück);
  }

  if (!anlegen.ok && anlegen.status !== 204) {
    const roh = await anlegen.text().catch(() => '');
    console.error('brevo contact rejected:', anlegen.status, roh.slice(0, 300));
    let code = '';
    try {
      code = (JSON.parse(roh) as { code?: string }).code ?? '';
    } catch {
      /* Brevo antwortet bei Sperren mit HTML statt JSON */
    }
    if (code === 'duplicate_parameter') {
      return willJson ? jsonAntwort(409, { grund: 'doppelt' }) : seite(409, sprache, 'wattwas', '', zurück);
    }
    return willJson ? jsonAntwort(502, { grund: 'anbieter' }) : seite(502, sprache, 'wattwas', '', zurück);
  }

  // 2. Willkommens-Mail. Schlägt sie fehl, ist der Kontakt trotzdem drin,
  //    darum wird die Anmeldung nicht zurückgemeldet als Fehler.
  const wurzel = new URL(request.url).origin;
  const signatur = await signieren(email, env.ABMELDE_SECRET);
  const abmeldeUrl = `${wurzel}/api/abmelden?e=${encodeURIComponent(email)}&s=${signatur}&l=${sprache}`;

  const mail = await brevo(env, '/smtp/email', 'POST', {
    to: [{ email }],
    subject: t.betreff,
    htmlContent: willkommensMail({
      sprache,
      text: t,
      stufeName: STUFEN_NAMEN[sprache][stufe],
      seiteUrl: `${wurzel}/${sprache}/`,
      abmeldeUrl,
    }),
    headers: { 'List-Unsubscribe': `<${abmeldeUrl}>` },
  }).catch((e) => {
    console.error('welcome mail failed:', String(e));
    return undefined;
  });

  if (mail && !mail.ok) {
    console.error('welcome mail rejected:', mail.status, (await mail.text().catch(() => '')).slice(0, 300));
  }

  return willJson ? jsonAntwort(200, { ok: true }) : seite(200, sprache, t.titel, t.text, zurück);
};
