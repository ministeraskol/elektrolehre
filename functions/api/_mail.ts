// Aufbau der Willkommens-Mail. Ein Layout, neun Sprachen, heller Grund.
//
// E-Mail-Clients sind kein Browser: Outlook rendert mit Word, Gmail wirft
// <style> teilweise weg. Deshalb Tabellen statt Flexbox und Stile am Element,
// nicht in einer Klasse.

export type Sprache = 'de' | 'leicht' | 'en' | 'tr' | 'ru' | 'ar' | 'fa' | 'ka' | 'sq';

export interface MailText {
  betreff: string;
  titel: string;
  text: string;
  punkt1: string;
  punkt2: string;
  punkt3: string;
  stufe: string;
  knopf: string;
  fuss: string;
  abmelden: string;
}

const RTL: Sprache[] = ['ar', 'fa'];

// Eine Farbe trägt die Mail, der Rest ist Papier und Tinte.
const F = {
  papier: '#F4F2ED', // warmes Off-White, kein kaltes Grau
  karte: '#FFFFFF',
  tinte: '#16181C',
  leise: '#5C6169',
  linie: '#E3DFD6',
  akzent: '#0B63CE', // dunkler als das Blau der Seite: auf Weiß muss es 4.5:1 halten
  akzentTinte: '#FFFFFF',
};

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function willkommensMail(o: {
  sprache: Sprache;
  text: MailText;
  stufeName: string;
  seiteUrl: string;
  abmeldeUrl: string;
}): string {
  const { text: t, sprache } = o;
  const rtl = RTL.includes(sprache);
  const dir = rtl ? 'rtl' : 'ltr';
  const seite = rtl ? 'right' : 'left';

  const punkt = (s: string) => `
              <tr>
                <td style="padding:0 0 12px 0;vertical-align:top;width:20px">
                  <div style="width:6px;height:6px;border-radius:3px;background:${F.akzent};margin-top:9px"></div>
                </td>
                <td style="padding:0 0 12px 0;font-size:15px;line-height:1.6;color:${F.tinte}">${escape(s)}</td>
              </tr>`;

  return `<!doctype html>
<html lang="${sprache}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(t.betreff)}</title>
</head>
<body style="margin:0;padding:0;background:${F.papier}">
<div style="display:none;font-size:1px;color:${F.papier};max-height:0;overflow:hidden">${escape(t.text)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${F.papier}">
  <tr>
    <td align="center" style="padding:40px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%" dir="${dir}">

        <tr>
          <td style="padding:0 0 20px 0;text-align:${seite}">
            <span style="font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:${F.leise}">wattwas</span>
          </td>
        </tr>

        <tr>
          <td style="background:${F.karte};border:1px solid ${F.linie};border-radius:14px;padding:36px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}">

              <tr><td style="text-align:${seite};font:600 28px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${F.tinte};padding:0 0 14px 0">${escape(t.titel)}</td></tr>

              <tr><td style="text-align:${seite};font:400 16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${F.leise};padding:0 0 26px 0">${escape(t.text)}</td></tr>

              <tr>
                <td style="padding:0 0 26px 0">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:${seite}">
${punkt(t.punkt1)}${punkt(t.punkt2)}${punkt(t.punkt3)}
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 0 28px 0;border-top:1px solid ${F.linie}">
                  <div style="padding-top:18px;text-align:${seite};font:400 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${F.leise};letter-spacing:0.06em;text-transform:uppercase">${escape(t.stufe)}</div>
                  <div style="padding-top:2px;text-align:${seite};font:600 17px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${F.tinte}">${escape(o.stufeName)}</div>
                </td>
              </tr>

              <tr>
                <td style="text-align:${seite}">
                  <a href="${escape(o.seiteUrl)}" style="display:inline-block;background:${F.akzent};color:${F.akzentTinte};text-decoration:none;font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:15px 26px;border-radius:9px">${escape(t.knopf)}</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:22px 4px 0 4px;text-align:${seite};font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${F.leise}">
            ${escape(t.fuss)}<br>
            <a href="${escape(o.abmeldeUrl)}" style="color:${F.leise};text-decoration:underline">${escape(t.abmelden)}</a>
            &nbsp;·&nbsp;
            <a href="${escape(o.seiteUrl)}" style="color:${F.leise};text-decoration:underline">wattwas.de</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
