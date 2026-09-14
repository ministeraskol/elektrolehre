"""marken.json + marken-changelog.json: leere Übersetzungsfelder (kurz, name, text) je Sprache füllen.

Zwei Phasen (Controller-Vorgabe: EIN Job je Sprache mit ALLEN offenen Feldern dieser Sprache, kein
40er-Chunking; 7 Sprachen parallel mit gestaffeltem Start – gleichzeitige scp-Starts zur Palace-VM
brechen ab):

  1. --holen <lang> [--delay SEK]   Holt die Übersetzung EINER Sprache (Rollenkette Palace, Palace,
                                    omni --patient --variant low, worker), validiert, schreibt
                                    scratch/marken-tmp/ergebnis-<lang>.json. Schreibt NICHT in
                                    marken.json/marken-changelog.json (keine Racebedingung bei
                                    parallelen Prozessen). --delay wartet zuerst N Sekunden – für den
                                    gestaffelten Start aus mehreren gleichzeitig gestarteten
                                    Hintergrund-Aufrufen (einer je Sprache).
  2. --merge [<lang> ...]           Liest die vorhandenen ergebnis-<lang>.json (Default: alle 7
                                    Sprachen), schreibt marken.json + marken-changelog.json EINMAL am
                                    Ende (sequentiell, keine Racebedingung). Fehlende/unvollständige
                                    Sprachen werden gemeldet, nicht abgebrochen.

Komfort ohne Parallelität (Einzelnachbesserung, z. B. nach einer Handkorrektur):
    python scripts/translate_marken.py [lang ...]     (Default: alle 7) – holen + merge je Sprache nacheinander.

Identische deutsche Texte (z. B. alle Änderungsprotokoll-Einträge "Aufgenommen (Startbestand TP2).")
werden EINMAL je Sprache übersetzt und auf alle Zielfelder verteilt (Controller-Vorgabe).
Marken-, Modell- und Normnamen werden NIE übersetzt (Prüfung siehe schuetzenswert()).
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKEN = ROOT / "src" / "data" / "marken.json"
PROTO = ROOT / "src" / "data" / "marken-changelog.json"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"
WORKER_LOG = Path.home() / "Projects" / "AI-Palace" / "products" / "worker-log.jsonl"
TMP = ROOT / "scratch" / "marken-tmp"

LANGS = {"en": "English", "tr": "Türkçe", "ru": "Русский", "ar": "Modern Standard Arabic",
         "fa": "Persian (Farsi)", "ka": "Georgian", "sq": "Albanian (standard)"}
# "&" in Kategorienamen (z. B. "Kabelfinder & Ortung") wird durch das Wort für "und" der Zielsprache ersetzt.
UND = {"en": "and", "tr": "ve", "ru": "и", "ar": "و", "fa": "و", "ka": "და", "sq": "dhe"}
# Controller-Rollenkette: Palace zweimal (Verbindung/Timeout/keine Tisch-Freigabe -> einmal wiederholen),
# danach omni --patient --variant low, danach worker.
ROLLENKETTE_STANDARD = [
    {"rolle": "palace", "timeout": 2400, "extra": []},
    {"rolle": "palace", "timeout": 2400, "extra": []},
    {"rolle": "omni", "timeout": 1200, "extra": ["--patient", "--variant", "low"]},
    {"rolle": "worker", "timeout": 1200, "extra": []},
]

FREMDSCHRIFT = re.compile("[぀-ヿ㐀-䶿一-鿿가-힯]")  # CJK/Hangul/Hiragana/Katakana – in keiner Zielsprache erlaubt
ZIELSCHRIFT = {"ka": re.compile("[Ⴀ-ჿ]"), "ru": re.compile("[Ѐ-ӿ]"), "ar": re.compile("[؀-ۿ]"), "fa": re.compile("[؀-ۿ]")}
# Begriffe, die trotz Groß-Kürzel-Form NICHT geschützt werden: "PSA" bekommt in jeder Sprache ihr eigenes
# Kürzel (en "PPE", tr "KKD", ru "СИЗ" …) statt das deutsche "PSA" zu behalten (Lehre aus Task 3, I-Fund).
AUSNAHME = {"PSA"}
# Schützenswerte Tokens aus dem deutschen Quelltext: Normnummern mit Bindestrich (61243-3), GROSS-Kürzel/
# Marken (VDE, DUSPOL, RCD, CAT, AC/DC …), CamelCase+Zahl (Produktlinien wie PreciStrip16), Zahl+Einheit
# (1000 V, 2,7 J). Nur eine Heuristik als erstes Sieb – die harte Prüfung ist die manuelle Stichprobe je
# Sprache (Task-Vorgabe), die dieses Skript nicht ersetzt.
_SCHUETZEN_RE = re.compile(
    r"\d+-\d+(?:-\d+)?"
    r"|[A-ZÄÖÜ]{2,}(?:/[A-ZÄÖÜ0-9]+)*"  # nur "/"-Fortsetzung (AC/DC) – "-" bleibt draußen, sonst reißt es
                                        # in normale Wortfugen hinein (z. B. "True-RMS-Multimeter" -> "RMS-M")
    r"|[A-ZÄÖÜ][a-zA-ZäöüßÄÖÜ]*\d[\w]*"
    r"|\d[\d.,]*\s?(?:V|A|W|Nm|J|kg|g|mm²|mm|m|Ω|°C|dB|min⁻¹|bpm|kΩ|MΩ|nF|µF|mF)\b"
    r"|\d+er\b"
)


def schuetzenswert(de_text: str) -> set[str]:
    ergebnis: set[str] = set()
    for tok in _SCHUETZEN_RE.findall(de_text):
        m = re.fullmatch(r"(\d+)er", tok)
        if m:
            tok = m.group(1)  # "170er" -> "170": das Suffix passt sich der Zielsprache an, die Zahl nicht
        if len(tok) >= 3 and tok not in AUSNAHME:
            ergebnis.add(tok)
    return ergebnis


def _dezimal_varianten(tok: str) -> set[str]:
    """Deutsche Dezimalzahlen (Komma, z. B. "2,5 J") dürfen im Ziel mit Punkt stehen (z. B. Englisch "2.5 J")
    und umgekehrt – beides ist eine korrekte lokale Schreibweise, keine verlorene Zahl."""
    varianten = {tok}
    if re.search(r"\d,\d", tok):
        varianten.add(re.sub(r"(?<=\d),(?=\d)", ".", tok))
    if re.search(r"\d\.\d", tok):
        varianten.add(re.sub(r"(?<=\d)\.(?=\d)", ",", tok))
    return varianten


FA_HINWEIS = ("- Persian only: use ZWNJ (zero-width non-joiner, U+200C) correctly in compounds and verb "
              "prefixes (e.g. می‌شود, دسته‌بندی, مدل‌ها) – never fuse them into one word without it.\n")
BRIEF = """You are a professional technical translator for a German electrician-apprentice learning site
(wattwas.de). Below is a JSON array of short website texts (category names/descriptions, one-sentence tool
descriptions, a changelog note). Each item has "key" and "de" (the German source). Translate every "de" into
{lang}. RULES:
- Output ONE JSON object: keys = the exact "key" values (unchanged), values = the {lang} translation as a
  plain string. Every key must be present.
- Brand names, model/product-line names and norm or standard codes (e.g. VDE, DIN EN 61243-3, CAT III,
  IP65, RCD, True RMS, Knipex, Bosch, DUSPOL, PreciStrip16 …) stay EXACTLY as written in the German source,
  in every language. Numbers stay as written (do not convert units).
- If the German source contains "&" (as in "Kabelfinder & Ortung"), replace it with the {lang} word for
  "and" ("{und}") – never keep the literal "&" symbol, never substitute the English word "and".
- The German abbreviation "PSA" (Persönliche Schutzausrüstung / personal protective equipment) is NOT a
  brand name: translate it to your language's own standard term or abbreviation for personal protective
  equipment (e.g. English "PPE", Turkish "KKD", Russian "СИЗ") – do not keep the German "PSA".
{fa_hinweis}- Keep every translation natural, idiomatic {lang}: one short sentence or phrase, MAX 150 CHARACTERS.
- Valid JSON only: no code fences, no comments, no preface, escape quotes.
=== ITEMS ===
{items}
"""


def lade(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def speichere(p: Path, d: dict) -> None:
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sammle_offene(m: dict, c: dict, lang: str) -> list[dict]:
    """Ein Eintrag je EINDEUTIGEM deutschen Text: Duplikate (z. B. alle Änderungsprotokoll-Einträge, die
    denselben Aufnahme-Satz tragen) werden zu einer Anfrage zusammengefasst und ihre Antwort später auf
    alle betroffenen Ziel-Dicts verteilt (Controller-Vorgabe: nur einmal übersetzen)."""
    gruppen: dict[str, dict] = {}

    def add(key: str, de: str, ziel: dict) -> None:
        if not de:
            return
        g = gruppen.setdefault(de, {"key": key, "de": de, "ziele": []})
        g["ziele"].append(ziel)

    for k in m["kategorien"]:
        for feld in ("name", "kurz"):
            if not k[feld].get(lang):
                add(f"kat:{k['id']}:{feld}", k[feld]["de"], k[feld])
    for x in m["modelle"]:
        if not x["kurz"].get(lang):
            add(f"mod:{x['id']}", x["kurz"]["de"], x["kurz"])
    for i, e in enumerate(c["eintraege"]):
        if not e["text"].get(lang):
            add(f"log:{i}", e["text"]["de"], e["text"])
    return list(gruppen.values())


# Der Tokenschutz (schuetzenswert) prüft auf exakte LATEINISCHE Teilstrings – zuverlässig nur für Zielsprachen,
# die selbst lateinische Schrift nutzen (en, tr, sq). Für ru/ar/fa/ka ist er FALSCH-POSITIV-anfällig: korrektes,
# idiomatisches Russisch/Arabisch/Persisch/Georgisch überträgt generische Einheiten/Kürzel ins eigene Alphabet
# oder Wort (z. B. de "LED" -> ru "светодиодная", de "Ω" -> ru "Ом", de "mm"/"V" -> ru "мм"/"В" mit kyrillischen
# statt lateinischen Buchstaben) – live an ru/roh-ru.json beobachtet (22 falsche Treffer, alles korrektes
# Russisch). Für diese 4 Sprachen bleibt die Namensprüfung Handarbeit (Task-Vorgabe, "Namen unverändert").
_LATEINISCHE_ZIELSPRACHEN = {"en", "tr", "sq"}


def pruefe(lang: str, gruppen: list[dict], obj: dict) -> list[str]:
    f: list[str] = []
    zs = ZIELSCHRIFT.get(lang)
    for g in gruppen:
        wert = obj.get(g["key"])
        if not isinstance(wert, str) or not wert.strip():
            f.append(f'{g["key"]}: fehlt/leer')
            continue
        wert = wert.strip()
        if len(wert) > 160:
            f.append(f'{g["key"]}: {len(wert)} Zeichen')
        if FREMDSCHRIFT.search(wert):
            f.append(f'{g["key"]}: Fremdschrift (CJK/Hangul)')
        if zs is not None and not zs.search(wert):
            f.append(f'{g["key"]}: keine Zielschrift')
        if lang in _LATEINISCHE_ZIELSPRACHEN:
            fehlend = [t for t in schuetzenswert(g["de"]) if not any(v in wert for v in _dezimal_varianten(t))]
            if fehlend:
                f.append(f'{g["key"]}: Tokens fehlen {fehlend}')
    return f


def _rufe_worker(rolle: str, timeout: int, extra: list[str], bfile: Path, ofile: Path) -> subprocess.CompletedProcess | None:
    cmd = [sys.executable, str(WORKER), "--role", rolle, "--prompt-file", str(bfile), "--out", str(ofile),
           "--dir", str(TMP), "--timeout", str(timeout), *extra]
    try:
        return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    except OSError as ex:
        print(f"  [{rolle}] OSError: {ex}")
        return None


def _log_modell(ofile: Path) -> str:
    """Letzte worker-log.jsonl-Zeile für diese --out-Datei -> 'model' (z. B. 'palace/5', 'omni/groq/...')."""
    if not WORKER_LOG.exists():
        return "?"
    treffer = None
    with WORKER_LOG.open(encoding="utf-8") as fh:
        for zeile in fh:
            try:
                d = json.loads(zeile)
            except json.JSONDecodeError:
                continue
            if d.get("out") == str(ofile):
                treffer = d
    return treffer.get("model", "?") if treffer else "?"


def hole(lang: str, delay: int, rollenkette: list[dict]) -> int:
    """--holen: EIN Job für `lang` (alle offenen Felder), Rollenkette bis Erfolg. Schreibt nur
    scratch/marken-tmp/ergebnis-<lang>.json + protokoll-<lang>.json, NIE marken.json/changelog."""
    if delay:
        print(f"[{lang}] warte {delay}s (gestaffelter Start) …")
        time.sleep(delay)
    m, c = lade(MARKEN), lade(PROTO)
    gruppen = sammle_offene(m, c, lang)
    TMP.mkdir(parents=True, exist_ok=True)
    print(f"== {lang}: {len(gruppen)} eindeutige Texte offen (Duplikate zusammengefasst)")
    protokoll: dict = {"lang": lang, "anzahl": len(gruppen), "versuche": []}
    if not gruppen:
        print(f"[{lang}] nichts zu tun")
        (TMP / f"protokoll-{lang}.json").write_text(json.dumps(protokoll, ensure_ascii=False, indent=2), encoding="utf-8")
        return 0
    bfile, ofile = TMP / f"brief-{lang}.md", TMP / f"roh-{lang}.json"
    items = json.dumps([{"key": g["key"], "de": g["de"]} for g in gruppen], ensure_ascii=False, indent=1)
    bfile.write_text(BRIEF.format(lang=LANGS[lang], und=UND[lang], fa_hinweis=FA_HINWEIS if lang == "fa" else "", items=items), encoding="utf-8")
    for schritt in rollenkette:
        rolle, timeout, extra = schritt["rolle"], schritt["timeout"], schritt["extra"]
        t0 = time.time()
        r = _rufe_worker(rolle, timeout, extra, bfile, ofile)
        dauer = round(time.time() - t0, 1)
        eintrag = {"rolle": rolle, "dauer_s": dauer}
        if r is None or r.returncode != 0 or not ofile.exists():
            fehlermeldung = (r.stderr.strip()[-300:] if r is not None else "OSError beim Aufruf")
            print(f"  [{lang}] {rolle} fehlgeschlagen ({dauer}s): {fehlermeldung}")
            eintrag.update(ok=False, fehler=fehlermeldung)
            protokoll["versuche"].append(eintrag)
            continue
        roh = re.sub(r"^```(?:json)?\s*|\s*```$", "", ofile.read_text(encoding="utf-8").strip())
        try:
            obj = json.loads(roh[roh.index("{"): roh.rindex("}") + 1])
        except (ValueError, json.JSONDecodeError) as e:
            print(f"  [{lang}] {rolle} JSON kaputt ({dauer}s): {e}")
            eintrag.update(ok=False, fehler=f"JSON kaputt: {e}")
            protokoll["versuche"].append(eintrag)
            continue
        fehler = pruefe(lang, gruppen, obj)
        if fehler:
            print(f"  [{lang}] {rolle} Validierung ({dauer}s), {len(fehler)} Treffer: {fehler[:5]}")
            eintrag.update(ok=False, fehler=fehler[:20])
            protokoll["versuche"].append(eintrag)
            continue
        modell = _log_modell(ofile)
        print(f"  [{lang}] ok via {rolle} ({modell}), {dauer}s, Versuch {len(protokoll['versuche']) + 1}/{len(rollenkette)}")
        eintrag.update(ok=True, modell=modell)
        protokoll["versuche"].append(eintrag)
        (TMP / f"protokoll-{lang}.json").write_text(json.dumps(protokoll, ensure_ascii=False, indent=2), encoding="utf-8")
        ergebnis = {g["key"]: str(obj[g["key"]]).strip() for g in gruppen}
        speichere(TMP / f"ergebnis-{lang}.json", ergebnis)
        return 0
    (TMP / f"protokoll-{lang}.json").write_text(json.dumps(protokoll, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{lang}] ALLE {len(rollenkette)} Rollen gescheitert – kein Ergebnis geschrieben")
    return 1


def fuehre_merge_aus(langs: list[str]) -> int:
    """--merge: liest ergebnis-<lang>.json je Sprache, schreibt marken.json + marken-changelog.json EINMAL
    am Ende (ein einziger Prozess, kein Race mit den parallelen --holen-Aufrufen, die diese Dateien nie
    anfassen)."""
    m, c = lade(MARKEN), lade(PROTO)
    fehler = 0
    for lang in langs:
        ofile = TMP / f"ergebnis-{lang}.json"
        if not ofile.exists():
            print(f"[{lang}] kein ergebnis-{lang}.json – übersprungen (siehe protokoll-{lang}.json)")
            fehler += 1
            continue
        ergebnis = lade(ofile)
        gruppen = sammle_offene(m, c, lang)
        fehlt = [g["key"] for g in gruppen if not ergebnis.get(g["key"])]
        if fehlt:
            print(f"[{lang}] unvollständig, fehlt: {fehlt}")
            fehler += 1
        n = 0
        for g in gruppen:
            wert = ergebnis.get(g["key"])
            if not wert:
                continue
            for ziel in g["ziele"]:
                ziel[lang] = wert
            n += 1
        print(f"[{lang}] {n}/{len(gruppen)} Texte gemergt")
    speichere(MARKEN, m)
    speichere(PROTO, c)
    return 1 if fehler else 0


def main() -> int:
    # Windows-Konsole ist sonst cp1252: Zielsprachen-Text im Log crasht sonst den Print.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--holen", metavar="LANG", help="EIN Job für diese Sprache holen (schreibt nur scratch/marken-tmp/ergebnis-<lang>.json)")
    ap.add_argument("--merge", action="store_true", help="vorhandene ergebnis-<lang>.json in marken.json/marken-changelog.json übernehmen")
    ap.add_argument("--delay", type=int, default=0, help="Sekunden warten vor --holen (gestaffelter Start)")
    ap.add_argument("langs", nargs="*", help="Sprachcodes (Default: alle 7); mit --merge: welche Ergebnisse übernehmen")
    args = ap.parse_args()

    if args.holen:
        return hole(args.holen, args.delay, ROLLENKETTE_STANDARD)
    if args.merge:
        return fuehre_merge_aus(args.langs or list(LANGS))

    # Komfort ohne Parallelität: je Sprache holen, danach einmal mergen.
    langs = args.langs or list(LANGS)
    fehler = sum(hole(lang, 0, ROLLENKETTE_STANDARD) for lang in langs)
    fehler += fuehre_merge_aus(langs)
    print("FEHLER:", fehler)
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
