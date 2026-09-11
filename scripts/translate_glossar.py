"""glossar.json'daki Almanca açıklamaları hedef dillere çevirir → src/data/glossar.<lang>.json ({de-terim: açıklama}).

Kullanım: python scripts/translate_glossar.py tr ru ...   (boş = 7 dil)
Terim (de) hiçbir zaman çevrilmez; yalnız açıklama. Çıktı JSON doğrulanır: tüm anahtarlar mevcut, boş değer yok.
"""
from __future__ import annotations
import json, subprocess, sys, time, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"
LANGS = {"en": "English", "tr": "Türkçe", "ru": "Русский", "ar": "Modern Standard Arabic", "fa": "Persian (Farsi)", "ka": "Georgian", "sq": "Albanian (standard)"}

BRIEF = """You are a professional technical translator for a German electrical-apprenticeship learning site.
Below is a JSON array of glossary entries. Each has "de" (the German technical term – NEVER translate it) and
"def" (a short German explanation). Translate ONLY the "def" text into {lang}.

RULES:
- Output a single JSON object: keys = the exact "de" strings (unchanged, byte-for-byte), values = the {lang} explanation.
- Inside the explanations, German technical terms that appear (e.g. Elektrofachkraft, RCD, Zähler, Außenleiter, LS-Schalter,
  Handwerkskammer, Hausanschluss) STAY IN GERMAN; add the {lang} meaning in parentheses if helpful.
- Keep numbers, units, norm names (DIN VDE …, § 13 NAV, ElekAusbV), colours and formulas unchanged.
- One explanation per term, same length as the German (one or two sentences). Natural, clear {lang} for an apprentice.
- Output ONLY the JSON object. No code fences, no comments, no preface. Valid JSON: escape quotes inside strings.

{extra}

=== ENTRIES ===
{entries}
=== END ===
"""
EXTRA = {"ar": "Arabic: Modern Standard Arabic; Latin-script German terms stay as-is.", "fa": "Persian: Latin-script German terms stay as-is.",
         "ka": "Georgian: Mkhedruli script; Latin-script German terms stay as-is.", "sq": "Albanian: gjuha standarde; Latin-script German terms stay as-is.",
         "ru": "Russian; Latin-script German terms stay as-is.", "tr": "Turkish; German terms stay as-is.", "en": "English; German terms stay as-is."}


def main() -> None:
    langs = [l for l in sys.argv[1:] if l in LANGS] or list(LANGS)
    entries = json.loads((DATA / "glossar.json").read_text(encoding="utf-8"))
    keys = [e["de"] for e in entries]
    tmp = ROOT / "scratch"; tmp.mkdir(exist_ok=True)
    fails = 0
    for lang in langs:
        brief = BRIEF.format(lang=LANGS[lang], extra=EXTRA.get(lang, ""),
                             entries=json.dumps([{"de": e["de"], "def": e["def"]} for e in entries], ensure_ascii=False, indent=0))
        bfile = tmp / f"brief-glossar-{lang}.md"; ofile = tmp / f"out-glossar-{lang}.json"
        bfile.write_text(brief, encoding="utf-8")
        t0 = time.time()
        r = subprocess.run([sys.executable, str(WORKER), "--role", "worker", "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", "900"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        dt = time.time() - t0
        if r.returncode != 0 or not ofile.exists():
            print(f"WORKER HATA [{lang}] ({dt:.0f}s): {r.stderr[-300:]}"); fails += 1; continue
        raw = ofile.read_text(encoding="utf-8").strip()
        raw = re.sub(r"^```[a-z]*\n", "", raw); raw = re.sub(r"\n```$", "", raw)
        m = re.search(r"\{.*\}", raw, re.S)
        try:
            obj = json.loads(m.group(0) if m else raw)
        except json.JSONDecodeError as e:
            print(f"JSON HATA [{lang}] ({dt:.0f}s): {e}; ham: {ofile}"); fails += 1; continue
        missing = [k for k in keys if not obj.get(k)]
        extra = [k for k in obj if k not in keys]
        if missing or extra:
            print(f"ANAHTAR HATA [{lang}]: eksik {len(missing)} {missing[:3]}, fazla {len(extra)} {extra[:3]}; ham: {ofile}"); fails += 1; continue
        out = {k: obj[k].strip() for k in keys}
        (DATA / f"glossar.{lang}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"OK [{lang}] glossar.{lang}.json ({dt:.0f}s, {len(out)} terim)")
    print(f"\nbitti: {len(langs)} dil, {fails} hata")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
