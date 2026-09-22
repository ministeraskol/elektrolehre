// Startseite (22.09.2026): Stufenwechsel, Hero-Fahrt, Sprachmenü, Standanzeige, Anmeldung.
// Die Stufe ist dieselbe wie im Rest der Seite (localStorage „ww-stufe“, <html data-stufe>) –
// wer hier Azubi wählt, sieht auch in den Artikeln die Azubi-Sortierung.
import { setzeStufe, type Stufe } from './stufe';

type Text = { titel: string; text: string };
type Modell = { marke: string; modell: string; preis: string };
type Stueck = { kat: string; kurz: string };
type Daten = {
  stufen: Stufe[];
  reihenfolge: Record<string, string[]>;
  werkzeugModelle: Record<string, Modell[]>;
  seiten: Record<string, Record<string, Text>>;
  werkzeug: Record<string, Stueck[]>;
  werkzeugNotiz: Record<string, string>;
  hero: Record<string, { zeile1: string; zeile2: string; unterzeile: string }>;
  namen: Record<string, string>;
  bereiche: Record<string, string>;
  bereichVon: Record<string, string>;
  hrefVon: Record<string, string>;
  ansageStufe: string;
};

const wurzel = document.querySelector<HTMLElement>('.ww-neu');
const datenEl = document.getElementById('ww-start-daten');
if (wurzel && datenEl?.textContent) {
  const D: Daten = JSON.parse(datenEl.textContent);
  const $ = <T extends Element>(s: string, el: ParentNode = wurzel) => el.querySelector<T>(s);
  const $$ = <T extends Element>(s: string, el: ParentNode = wurzel) => [...el.querySelectorAll<T>(s)];
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  // ── Textwechsel: die alte Zeile geht nach oben aus der Maske, die neue steigt von unten ──
  function tausche(huelle: Element | null, neu: string, verzug = 0, sofort = false) {
    if (!huelle) return;
    const alt = huelle.querySelector<HTMLElement>('.t:not(.geht)');
    if (alt && alt.textContent === neu) return;
    if (sofort || ruhig.matches || !alt) {
      huelle.textContent = '';
      const t = document.createElement('span');
      t.className = 't';
      t.textContent = neu;
      huelle.appendChild(t);
      return;
    }
    const el = document.createElement('span');
    el.className = 't kommt';
    el.textContent = neu;
    alt.style.transitionDelay = verzug + 'ms';
    el.style.transitionDelay = verzug + (huelle.classList.contains('tausch--blende') ? 300 : 0) + 'ms';
    alt.classList.add('geht');
    alt.setAttribute('aria-hidden', 'true');
    setTimeout(() => alt.remove(), 1100 + verzug);
    huelle.appendChild(el);
    el.getBoundingClientRect(); // ausspülen, damit der Startzustand gemalt ist, bevor er losgelassen wird
    el.classList.remove('kommt');
  }

  // ── Liste: zwölf feste Plätze wie eine Abfahrtstafel. Nummern und Haarlinien bleiben,
  //    die Seite auf jedem Platz rollt durch, von oben nach unten. ──
  const liste = $<HTMLOListElement>('#ww-liste')!;
  const plaetze = D.reihenfolge[D.stufen[0]].map((_, i) => {
    const li = document.createElement('li');
    li.className = 'eintrag';
    li.innerHTML = `<a class="eintrag__link" href="#">
      <h3 class="eintrag__titel"><span class="tausch" data-teil="titel"></span></h3>
      <span class="eintrag__rang">${String(i + 1).padStart(2, '0')}</span>
      <p class="eintrag__meta klein"><span class="tausch" data-teil="bereich"></span></p>
      <p class="eintrag__text"><span class="tausch tausch--blende" data-teil="text"></span></p></a>`;
    liste.appendChild(li);
    return li;
  });

  function ordne(stufe: Stufe, sofort: boolean) {
    const r = liste.getBoundingClientRect();
    const still = sofort || r.bottom < 0 || r.top > innerHeight; // keiner schaut hin: keine Vorstellung
    D.reihenfolge[stufe].forEach((slug, i) => {
      const li = plaetze[i], s = D.seiten[slug][stufe], v = i * 55;
      $<HTMLAnchorElement>('a', li)!.href = D.hrefVon[slug];
      tausche($('[data-teil="titel"]', li), s.titel, v, still);
      tausche($('[data-teil="bereich"]', li), D.bereiche[D.bereichVon[slug]] ?? '', v + 60, still);
      tausche($('[data-teil="text"]', li), s.text, v + 110, still);
    });
  }

  // ── Werkzeug: feste Zeilen, der Inhalt dreht sich. Zeilen wegfliegen zu lassen hat
  //    schon in der Liste Chaos gemacht (zwei Spalten, Text auf Text). ──
  const stuecke = $('#ww-stuecke')!;
  const werkzeugPlaetze = [0, 1, 2].map((i) => {
    const d = document.createElement('div');
    d.className = 'stueck';
    d.innerHTML = `<span class="stueck__nr klein">${String(i + 1).padStart(2, '0')}</span>
      <span class="stueck__mitte">
        <span class="stueck__name"><em class="stueck__marke" data-teil="marke"></em> <span class="tausch" data-teil="modell"></span></span>
        <span class="stueck__kurz"><span class="tausch tausch--blende" data-teil="kurz"></span></span>
      </span>
      <span class="stueck__preis klein" data-teil="preis"></span>`;
    stuecke.appendChild(d);
    return d;
  });

  function zeigeWerkzeug(stufe: Stufe, sofort: boolean) {
    const modelle = D.werkzeugModelle[stufe] ?? [];
    const texte = D.werkzeug[stufe] ?? [];
    werkzeugPlaetze.forEach((platz, i) => {
      const m = modelle[i], s = texte[i];
      if (!m || !s) { platz.hidden = true; return; }
      platz.hidden = false;
      $('[data-teil="marke"]', platz)!.textContent = m.marke;
      tausche($('[data-teil="modell"]', platz), m.modell, i * 70, sofort);
      tausche($('[data-teil="kurz"]', platz), s.kat + ' · ' + s.kurz, 140 + i * 70, sofort);
      $('[data-teil="preis"]', platz)!.textContent = m.preis;
    });
  }

  // ── Stufe ──
  let aktuell: Stufe | null = null;
  const ansage = $('#ww-ansage')!;

  function zeige(stufe: Stufe, sofort = false) {
    if (!D.stufen.includes(stufe) || stufe === aktuell) return;
    aktuell = stufe;
    const h = D.hero[stufe];
    $$<HTMLButtonElement>('.stufen button').forEach((b) => {
      const an = b.dataset.stufe === stufe;
      b.setAttribute('aria-checked', String(an));
      b.tabIndex = an ? 0 : -1;
    });
    $$<HTMLImageElement>('.hero__bild').forEach((b) => {
      const an = b.dataset.stufe === stufe;
      b.classList.toggle('is-an', an);
      if (an && b.parentElement) {
        b.parentElement.style.setProperty('--fx', b.dataset.fx!);
        b.parentElement.style.setProperty('--fy', b.dataset.fy!);
      }
    });
    tausche($('[data-feld="zeile1"]'), h.zeile1, 0, sofort);
    tausche($('[data-feld="zeile2"]'), h.zeile2, 90, sofort);
    tausche($('[data-feld="unterzeile"]'), h.unterzeile, 200, sofort);
    $$('[data-feld="stufenname"]').forEach((el) => tausche(el, D.namen[stufe], 0, sofort));
    tausche($('[data-feld="werkzeugnotiz"]'), D.werkzeugNotiz[stufe], 120, sofort);
    const feld = $<HTMLInputElement>('input[name="LEVEL"]');
    if (feld) feld.value = stufe;
    zeigeWerkzeug(stufe, sofort);
    ordne(stufe, sofort);
    if (!sofort) ansage.textContent = D.ansageStufe + ' ' + D.namen[stufe];
  }

  // Klick und Pfeiltasten setzen die Stufe seitenweit; das Event bringt sie zurück hierher.
  $$('.stufen').forEach((gruppe) => {
    gruppe.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button[data-stufe]');
      if (b?.dataset.stufe) setzeStufe(b.dataset.stufe);
    });
    gruppe.addEventListener('keydown', (e) => {
      const schritt = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[(e as KeyboardEvent).key];
      if (!schritt || !aktuell) return;
      e.preventDefault();
      const ziel = D.stufen[(D.stufen.indexOf(aktuell) + schritt + D.stufen.length) % D.stufen.length];
      setzeStufe(ziel);
      $<HTMLButtonElement>(`button[data-stufe="${ziel}"]`, gruppe)?.focus();
    });
  });
  document.addEventListener('ww-stufe', (e) => zeige((e as CustomEvent<Stufe>).detail));

  // ── Sprache: ein Knopf, die Liste fällt darunter auf ──
  const sprache = $('#ww-sprache')!;
  const spracheKnopf = $<HTMLButtonElement>('.sprache__knopf', sprache)!;
  const spracheZu = () => { sprache.classList.remove('offen'); spracheKnopf.setAttribute('aria-expanded', 'false'); };
  spracheKnopf.addEventListener('click', (e) => {
    e.stopPropagation();
    spracheKnopf.setAttribute('aria-expanded', String(sprache.classList.toggle('offen')));
  });
  document.addEventListener('click', (e) => { if (!sprache.contains(e.target as Node)) spracheZu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') spracheZu(); });

  // ── Standanzeige: erscheint erst nach dem Hero; auf dem ersten Bild soll nichts stören ──
  const standLinks = $$<HTMLAnchorElement>('#ww-stand a');
  const abschnitte = standLinks.map((a) => $(a.hash));
  const beobachter = new IntersectionObserver((eintraege) => {
    eintraege.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = abschnitte.indexOf(e.target);
      standLinks.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  abschnitte.forEach((el) => el && beobachter.observe(el));

  // ── Hero: Scroll-Fortschritt → --p (Fenster → volle Breite), Schlagzeile kurz vor dem Ende frei ──
  const hero = $('#hero')!;
  const nav = $<HTMLElement>('#ww-nav')!;
  const stand = $('#ww-stand')!;
  let offen: boolean | null = null, wartet = false;

  function bild() {
    wartet = false;
    const r = hero.getBoundingClientRect(), vh = innerHeight;
    const weg = Math.min(Math.max(-r.top, 0), Math.max(r.height - vh, 1));
    const p = ruhig.matches ? 1 : Math.min(weg / (vh * 0.85), 1);
    (hero as HTMLElement).style.setProperty('--p', p.toFixed(4));
    if ((p >= 0.8) !== offen) { offen = p >= 0.8; hero.classList.toggle('is-offen', offen); }
    const vorbei = r.bottom <= nav.offsetHeight + 6;
    nav.classList.toggle('is-ueber-bild', p > 0.66 && !vorbei);
    nav.classList.toggle('is-fest', vorbei);
    stand.classList.toggle('is-da', vorbei);
  }
  const ruf = () => { if (!wartet) { wartet = true; requestAnimationFrame(bild); } };
  addEventListener('scroll', ruf, { passive: true });
  addEventListener('resize', ruf);
  ruhig.addEventListener('change', ruf);

  // ── Anmeldung: dieselbe Pages Function wie auf /mitglied/ ──
  const form = $<HTMLFormElement>('#ww-mitglied-form');
  if (form) {
    const texte = JSON.parse($('#ww-mitglied-texte')!.textContent!) as Record<string, string>;
    const stufeAnzeige = $<HTMLElement>('[data-mitglied-stand]', form)!;
    const knopf = $<HTMLButtonElement>('button[type=submit]', form)!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      knopf.disabled = true;
      stufeAnzeige.removeAttribute('data-art');
      stufeAnzeige.textContent = texte.laeuft;
      try {
        const antwort = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const ergebnis = await antwort.json().catch(() => ({}));
        const art = antwort.ok ? 'ok' : ergebnis.grund === 'doppelt' ? 'doppelt' : 'fehler';
        stufeAnzeige.dataset.art = art === 'fehler' ? 'fehler' : 'ok';
        stufeAnzeige.textContent = texte[art] ?? texte.fehler;
        if (antwort.ok) form.reset();
      } catch {
        stufeAnzeige.dataset.art = 'fehler';
        stufeAnzeige.textContent = texte.fehler;
      } finally {
        knopf.disabled = false;
      }
    });
  }

  // ── Start ──
  const gemerkt = document.documentElement.dataset.stufe as Stufe | undefined;
  zeige(gemerkt && D.stufen.includes(gemerkt) ? gemerkt : D.stufen[0], true);
  bild();
}
