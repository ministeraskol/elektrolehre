"""woerterbuch.json: Begriff + Hinweis + Wofür in die Zielsprachen übersetzen → zurück in dieselbe Datei.
Aufruf (Repo-Wurzel): python scripts/translate_woerterbuch.py            (alle 7)
                       python scripts/translate_woerterbuch.py tr ar     (nur diese)
                       python scripts/translate_woerterbuch.py --nur-fehlende tr
                       python scripts/translate_woerterbuch.py --neu-pruefen tr             (bestehende Übersetzungen mit pruefe() neu prüfen, Verlierer löschen + neu übersetzen)
                       python scripts/translate_woerterbuch.py --ids gliedermassstab,duebel tr ru   (nur diese ids, + Prüf-Verlierer bei --neu-pruefen)
Deutscher Begriff wird NIE verändert. Chunks à 30 Einträge, 2 Versuche je Chunk, Validierung vor dem Schreiben.
_stand[lang] wird erst gesetzt, wenn nach dem Lauf ALLE Einträge diese Sprache vollständig haben (nicht nach jedem Chunk).
"""
from __future__ import annotations
import json, subprocess, sys, time, re
from datetime import date
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DATEI = ROOT / "src" / "data" / "woerterbuch.json"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"
LANGS = {"en": "English", "tr": "Türkçe", "ru": "Русский", "ar": "Modern Standard Arabic", "fa": "Persian (Farsi)", "ka": "Georgian", "sq": "Albanian (standard)"}
ROLLEN = ["omni", "worker"]  # erste Rolle, die antwortet, gewinnt (omni = kostenlose OmniRoute-Anbieter)
# Markennamen: müssen lateinisch und unverändert in jeder Zielsprache stehenbleiben (Fix-Runde 1, Befund Minor).
MARKEN = ["Duspol", "Wago", "Knipex", "Wiha", "Wera", "Bosch", "Hilti", "Makita", "Fluke", "Benning"]
# CJK/Hangul/Hiragana/Katakana – dürfen in keiner Zielsprache auftauchen (Fix-Runde 1, Befund I2).
FREMDSCHRIFT = re.compile("[぀-ヿ㐀-䶿一-鿿가-힯]")
# Rahmenwort je Sprache für einen deutschen Umgangsbegriff in "hinweis" (Fix-Runde 1b, Befund 1+2).
RAHMEN = {"en": "colloquially", "tr": "Halk arasında", "ru": "в просторечии", "ar": "تُسمى أيضاً", "fa": "در محاوره", "ka": "სასაუბროდ", "sq": "në zhargon"}
RAHMENTABELLE = " · ".join(f'{l} "{w}: Flex"' for l, w in RAHMEN.items())
BRIEF = """You are a professional technical translator for a German electrical-apprenticeship learning site (wattwas.de).
Below is a JSON array of tool/material dictionary entries. Each has "id", the German term ("artikel", "singular", "plural",
optional "umgangssprache" = site-slang, optional "kuerzel"), and "wofuer_de" (one German sentence: what it is used for).
Translate into {lang}. RULES:
- Output ONE JSON object: keys = the exact "id" values (unchanged), values = {{"begriff": "...", "hinweis": "...", "wofuer": "..."}}.
- "begriff": the everyday {lang} name of this tool/material as an electrician would say it (with the usual article/particle
  if the language uses one). Never leave it German unless the German word is genuinely used in {lang} (then say so in "hinweis").
  In English, "begriff" is a bare noun phrase without a leading article ("a"/"an").
- "hinweis": optional, max 60 characters – e.g. a common second name, or "German loanword". Omit the key if nothing to add.
  If you keep a German site-slang word in "hinweis", frame it using the FRAMING WORD OF YOUR TARGET LANGUAGE ONLY – never a
  framing word from a different language, never the bare German word alone. One example per language, use only the row for
  {lang}: {rahmentabelle}. Brand names (Duspol, Wago, Knipex, Wiha, Wera, Bosch, Hilti, Makita, Fluke, Benning) stay in Latin
  script exactly as written, in every language. If "begriff" is the German word itself (a loanword), "hinweis" is required
  and says so in {lang} (e.g. English: "German loanword").
- "wofuer": translate "wofuer_de" naturally, same length (one sentence, max 200 characters). German technical terms that
  appear INSIDE the sentence (Sicherheitsregel, Hutschiene, Klemme, RCD, LS, VDE …) stay German, add the {lang} meaning
  in parentheses only if it helps.
- Keep numbers, units, norm names unchanged. Valid JSON only: no code fences, no comments, no preface, escape quotes.
=== ENTRIES ===
{entries}
"""

def lade() -> dict:
    return json.loads(DATEI.read_text(encoding="utf-8"))

def speichere(daten: dict) -> None:
    DATEI.write_text(json.dumps(daten, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def eintrag_de(e: dict) -> dict:
    """De-Daten für einen Eintrag, wie sie an den Worker gehen UND an pruefe() (Markencheck braucht wofuer_de/singular/umgangssprache)."""
    return {"id": e["id"], "artikel": e["de"]["artikel"], "singular": e["de"]["singular"], "plural": e["de"]["plural"],
            **({"umgangssprache": e["de"]["umgangssprache"]} if e["de"].get("umgangssprache") else {}),
            **({"kuerzel": e["de"]["kuerzel"]} if e["de"].get("kuerzel") else {}), "wofuer_de": e["wofuer"]["de"]}

def frage(lang: str, chunk: list[dict], tmp: Path, nr: int) -> dict | None:
    bfile, ofile = tmp / f"brief-{lang}-{nr}.md", tmp / f"out-{lang}-{nr}.json"
    bfile.write_text(BRIEF.format(lang=LANGS[lang], rahmentabelle=RAHMENTABELLE, entries=json.dumps(chunk, ensure_ascii=False, indent=1)), encoding="utf-8")
    for rolle in ROLLEN:
        for versuch in range(2):
            t0 = time.time()
            try:
                r = subprocess.run([sys.executable, str(WORKER), "--role", rolle, "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", "900", "--patient", "--variant", "low"], capture_output=True, text=True, encoding="utf-8")
            except OSError as ex:
                print(f"  [{lang}#{nr}] {rolle} Versuch {versuch + 1} OSError ({time.time() - t0:.0f}s): {ex}"); continue
            if r.returncode != 0 or not ofile.exists():
                print(f"  [{lang}#{nr}] {rolle} Versuch {versuch + 1} fehlgeschlagen ({time.time() - t0:.0f}s): {r.stderr[-200:]}"); continue
            roh = ofile.read_text(encoding="utf-8").strip()
            roh = re.sub(r"^```(?:json)?\s*|\s*```$", "", roh)
            try:
                obj = json.loads(roh[roh.index("{"): roh.rindex("}") + 1])
            except (ValueError, json.JSONDecodeError) as e:
                print(f"  [{lang}#{nr}] JSON kaputt: {e}"); continue
            fehler = pruefe(lang, chunk, obj)
            if fehler:
                print(f"  [{lang}#{nr}] Validierung: {fehler[:3]}"); continue
            print(f"  [{lang}#{nr}] ok via {rolle} ({time.time() - t0:.0f}s)")
            return obj
    return None

def pruefe(lang: str, chunk: list[dict], obj: dict) -> list[str]:
    f = []
    for e in chunk:
        v = obj.get(e["id"])
        if not isinstance(v, dict): f.append(f'{e["id"]}: fehlt'); continue
        begriff, hinweis, wofuer = v.get("begriff"), v.get("hinweis"), v.get("wofuer")
        if not isinstance(begriff, str) or not isinstance(wofuer, str) or (hinweis is not None and not isinstance(hinweis, str)):
            f.append(f'{e["id"]}: kein String'); continue
        begriff, wofuer = begriff.strip(), wofuer.strip()
        hinweis = hinweis.strip() if hinweis else None
        if not begriff: f.append(f'{e["id"]}: begriff leer')
        if len(wofuer) < 10 or len(wofuer) > 220: f.append(f'{e["id"]}: wofuer {len(wofuer)} Zeichen')
        if hinweis is not None and len(hinweis) > 80: f.append(f'{e["id"]}: hinweis zu lang')
        # I2: keine Fremdschrift (CJK/Hangul/Hiragana/Katakana) in irgendeinem Feld.
        for feld, wert in (("begriff", begriff), ("hinweis", hinweis or ""), ("wofuer", wofuer)):
            if FREMDSCHRIFT.search(wert): f.append(f'{e["id"]}: {feld} Fremdschrift')
        # I1: hinweis darf nicht das bloße, ungerahmte deutsche Umgangswort sein – weder der ganze
        # umgangssprache-String (z. B. "Lügenstift, Phasenprüfer") noch einer seiner kommagetrennten Teile.
        if hinweis and e.get("umgangssprache"):
            u = e["umgangssprache"].strip().lower()
            teile = {t.strip().lower() for t in u.split(",")}
            if hinweis.lower() == u or hinweis.lower() in teile:
                f.append(f'{e["id"]}: hinweis ungerahmt ({hinweis})')
        # Minor: Markenname aus der Quelle (wofuer_de/singular/umgangssprache) muss lateinisch im Ziel auftauchen.
        quelle = " ".join(str(e.get(k) or "") for k in ("wofuer_de", "singular", "umgangssprache"))
        ziel = f"{begriff} {hinweis or ''} {wofuer}"
        for marke in MARKEN:
            if marke in quelle and marke not in ziel:
                f.append(f'{e["id"]}: Markenname {marke} fehlt')
        # (e) Fix-Runde 1b: hinweis darf kein Rahmenwort einer ANDEREN Sprache enthalten.
        if hinweis:
            hn = hinweis.lower()
            for andere, wort in RAHMEN.items():
                if andere != lang and wort.lower() in hn:
                    f.append(f'{e["id"]}: hinweis fremdes Rahmenwort ({andere}: {wort})')
        # (f) Fix-Runde 1b: Lehnwort (begriff == singular oder umgangssprache/-teil) erfordert hinweis.
        lehnwoerter = {str(e.get("singular") or "").strip().casefold()}
        if e.get("umgangssprache"):
            lehnwoerter.add(e["umgangssprache"].strip().casefold())
            lehnwoerter.update(t.strip().casefold() for t in e["umgangssprache"].split(","))
        if begriff.casefold() in lehnwoerter and not hinweis:
            f.append(f'{e["id"]}: Lehnwort ohne hinweis')
    return f

def pruefe_bestehende(alle: list[dict], lang: str) -> set[str]:
    """--neu-pruefen: alle vorhandenen Übersetzungen dieser Sprache durch pruefe() jagen, ids der Verlierer zurückgeben."""
    kandidaten = [e for e in alle if e.get("i18n", {}).get(lang, {}).get("begriff") and e["wofuer"].get(lang)]
    chunk = [eintrag_de(e) for e in kandidaten]
    obj = {e["id"]: {"begriff": e["i18n"][lang]["begriff"],
                      **({"hinweis": e["i18n"][lang]["hinweis"]} if e["i18n"][lang].get("hinweis") else {}),
                      "wofuer": e["wofuer"][lang]} for e in kandidaten}
    return {msg.split(":", 1)[0].strip() for msg in pruefe(lang, chunk, obj)}

def strip_en_artikel(daten: dict) -> int:
    """Minor: führendes 'a '/'an ' aus vorhandenen en-Begriffen entfernen (reine Textkorrektur, kein Worker-Aufruf nötig)."""
    n = 0
    for e in daten["eintraege"]:
        v = e.get("i18n", {}).get("en")
        if not v or not isinstance(v.get("begriff"), str):
            continue
        neu = re.sub(r"^(a|an)\s+", "", v["begriff"], flags=re.IGNORECASE)
        if neu != v["begriff"]:
            v["begriff"] = neu
            n += 1
    return n

def main() -> int:
    argv = sys.argv[1:]
    nur_fehlende = "--nur-fehlende" in argv
    neu_pruefen = "--neu-pruefen" in argv
    ids_filter: set[str] | None = None
    if "--ids" in argv:
        i = argv.index("--ids")
        wert = argv[i + 1] if i + 1 < len(argv) else ""
        ids_filter = {s.strip() for s in wert.split(",") if s.strip()}
        argv = argv[:i] + argv[i + 2:]
    langs = [a for a in argv if not a.startswith("--")] or list(LANGS)
    daten = lade()
    gestrippt = strip_en_artikel(daten)
    if gestrippt:
        speichere(daten)
        print(f"-- en: {gestrippt} führende Artikel ('a '/'an ') entfernt")
    tmp = ROOT / "scratch" / "woerterbuch-tmp"; tmp.mkdir(parents=True, exist_ok=True)
    gesamt_fehler = 0
    for lang in langs:
        alle = daten["eintraege"]

        def vorhanden(e: dict, l: str = lang) -> bool:
            return bool(e.get("i18n", {}).get(l, {}).get("begriff")) and bool(e["wofuer"].get(l))

        verlierer: set[str] = set()
        if neu_pruefen:
            verlierer = pruefe_bestehende(alle, lang)
            for e in alle:
                if e["id"] in verlierer:
                    e.get("i18n", {}).pop(lang, None)
                    e["wofuer"].pop(lang, None)
            print(f"  [{lang}] --neu-pruefen: {len(verlierer)} Verlierer gelöscht: {sorted(verlierer)}")
            speichere(daten)
        if ids_filter is not None:
            eintraege = [e for e in alle if e["id"] in (ids_filter | verlierer)]
        elif nur_fehlende or neu_pruefen:
            eintraege = [e for e in alle if not vorhanden(e)]
        else:
            eintraege = alle
        print(f"== {lang}: {len(eintraege)} Einträge")
        for nr, start in enumerate(range(0, len(eintraege), 30)):
            chunk = [eintrag_de(e) for e in eintraege[start:start + 30]]
            obj = frage(lang, chunk, tmp, nr)
            if obj is None: gesamt_fehler += 1; print(f"  [{lang}#{nr}] AUFGEGEBEN – nichts geschrieben"); continue
            for e in eintraege[start:start + 30]:
                v = obj[e["id"]]
                begriff = str(v["begriff"]).strip()
                if lang == "en":
                    begriff = re.sub(r"^(a|an)\s+", "", begriff, flags=re.IGNORECASE)
                e.setdefault("i18n", {})[lang] = {"begriff": begriff, **({"hinweis": str(v["hinweis"]).strip()} if v.get("hinweis") else {})}
                e["wofuer"][lang] = str(v["wofuer"]).strip()
            speichere(daten)  # nach jedem Chunk sichern – _stand erst danach, siehe I3
        vollstaendig = all(vorhanden(e) for e in daten["eintraege"])
        if vollstaendig:
            daten.setdefault("_stand", {})[lang] = date.today().strftime("%Y-%m")
            speichere(daten)
        else:
            fehlt = [e["id"] for e in daten["eintraege"] if not vorhanden(e)]
            print(f"  [{lang}] unvollständig – _stand NICHT gesetzt, fehlt ({len(fehlt)}): {fehlt[:10]}")
    print("FEHLER:", gesamt_fehler)
    return 1 if gesamt_fehler else 0

if __name__ == "__main__":
    sys.exit(main())
