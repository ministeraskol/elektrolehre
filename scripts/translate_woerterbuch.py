"""woerterbuch.json: Begriff + Hinweis + Wofür in die Zielsprachen übersetzen → zurück in dieselbe Datei.
Aufruf (Repo-Wurzel): python scripts/translate_woerterbuch.py            (alle 7)
                       python scripts/translate_woerterbuch.py tr ar     (nur diese)
                       python scripts/translate_woerterbuch.py --nur-fehlende tr
Deutscher Begriff wird NIE verändert. Chunks à 30 Einträge, 2 Versuche je Chunk, Validierung vor dem Schreiben.
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
BRIEF = """You are a professional technical translator for a German electrical-apprenticeship learning site (wattwas.de).
Below is a JSON array of tool/material dictionary entries. Each has "id", the German term ("artikel", "singular", "plural",
optional "umgangssprache" = site-slang, optional "kuerzel"), and "wofuer_de" (one German sentence: what it is used for).
Translate into {lang}. RULES:
- Output ONE JSON object: keys = the exact "id" values (unchanged), values = {{"begriff": "...", "hinweis": "...", "wofuer": "..."}}.
- "begriff": the everyday {lang} name of this tool/material as an electrician would say it (with the usual article/particle
  if the language uses one). Never leave it German unless the German word is genuinely used in {lang} (then say so in "hinweis").
- "hinweis": optional, max 60 characters – e.g. a common second name, or "German loanword". Omit the key if nothing to add.
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

def frage(lang: str, chunk: list[dict], tmp: Path, nr: int) -> dict | None:
    bfile, ofile = tmp / f"brief-{lang}-{nr}.md", tmp / f"out-{lang}-{nr}.json"
    bfile.write_text(BRIEF.format(lang=LANGS[lang], entries=json.dumps(chunk, ensure_ascii=False, indent=1)), encoding="utf-8")
    for rolle in ROLLEN:
        for versuch in range(2):
            t0 = time.time()
            r = subprocess.run([sys.executable, str(WORKER), "--role", rolle, "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", "900", "--patient", "--variant", "low"], capture_output=True, text=True, encoding="utf-8")
            if r.returncode != 0 or not ofile.exists():
                print(f"  [{lang}#{nr}] {rolle} Versuch {versuch + 1} fehlgeschlagen ({time.time() - t0:.0f}s): {r.stderr[-200:]}"); continue
            roh = ofile.read_text(encoding="utf-8").strip()
            roh = re.sub(r"^```(?:json)?\s*|\s*```$", "", roh)
            try:
                obj = json.loads(roh[roh.index("{"): roh.rindex("}") + 1])
            except (ValueError, json.JSONDecodeError) as e:
                print(f"  [{lang}#{nr}] JSON kaputt: {e}"); continue
            fehler = pruefe(chunk, obj)
            if fehler:
                print(f"  [{lang}#{nr}] Validierung: {fehler[:3]}"); continue
            print(f"  [{lang}#{nr}] ok via {rolle} ({time.time() - t0:.0f}s)")
            return obj
    return None

def pruefe(chunk: list[dict], obj: dict) -> list[str]:
    f = []
    for e in chunk:
        v = obj.get(e["id"])
        if not isinstance(v, dict): f.append(f'{e["id"]}: fehlt'); continue
        if not str(v.get("begriff", "")).strip(): f.append(f'{e["id"]}: begriff leer')
        w = str(v.get("wofuer", "")).strip()
        if len(w) < 10 or len(w) > 220: f.append(f'{e["id"]}: wofuer {len(w)} Zeichen')
        if "hinweis" in v and len(str(v["hinweis"])) > 80: f.append(f'{e["id"]}: hinweis zu lang')
    return f

def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    nur_fehlende = "--nur-fehlende" in sys.argv
    langs = args or list(LANGS)
    daten = lade()
    tmp = ROOT / "scratch" / "woerterbuch-tmp"; tmp.mkdir(parents=True, exist_ok=True)
    gesamt_fehler = 0
    for lang in langs:
        eintraege = [e for e in daten["eintraege"] if not (nur_fehlende and e.get("i18n", {}).get(lang, {}).get("begriff") and e["wofuer"].get(lang))]
        print(f"== {lang}: {len(eintraege)} Einträge")
        for nr, start in enumerate(range(0, len(eintraege), 30)):
            chunk = [{"id": e["id"], "artikel": e["de"]["artikel"], "singular": e["de"]["singular"], "plural": e["de"]["plural"],
                      **({"umgangssprache": e["de"]["umgangssprache"]} if e["de"].get("umgangssprache") else {}),
                      **({"kuerzel": e["de"]["kuerzel"]} if e["de"].get("kuerzel") else {}), "wofuer_de": e["wofuer"]["de"]} for e in eintraege[start:start + 30]]
            obj = frage(lang, chunk, tmp, nr)
            if obj is None: gesamt_fehler += 1; print(f"  [{lang}#{nr}] AUFGEGEBEN – nichts geschrieben"); continue
            for e in eintraege[start:start + 30]:
                v = obj[e["id"]]
                e.setdefault("i18n", {})[lang] = {"begriff": str(v["begriff"]).strip(), **({"hinweis": str(v["hinweis"]).strip()} if v.get("hinweis") else {})}
                e["wofuer"][lang] = str(v["wofuer"]).strip()
            daten.setdefault("_stand", {})[lang] = date.today().strftime("%Y-%m")
            speichere(daten)  # nach jedem Chunk sichern
    print("FEHLER:", gesamt_fehler)
    return 1 if gesamt_fehler else 0

if __name__ == "__main__":
    sys.exit(main())
