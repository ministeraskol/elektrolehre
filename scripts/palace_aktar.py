"""AI-Palace-Übersetzungen (en/tr/ru/ar/fa/ka/sq) strukturell prüfen und nach src/content/docs/<lang>/... übernehmen.

Python 3, keine Fremdpakete.

Aufruf (repo-kökünden):
  python scripts/palace_aktar.py <cikti-ordner>              # nur prüfen, Tabelle ausgeben
  python scripts/palace_aktar.py <cikti-ordner> --schreiben  # gültige Dateien schreiben

Für jede Datei `<lang>-<slug>.md` im cikti-Ordner (ohne ".red-" im Namen, das sind Fehlversuche):
  - Quelle finden: genau eine src/content/docs/de/**/<slug>.mdx. 0 oder >1 Treffer -> ÜBERSPRUNGEN
    (mehrdeutig). slug == "index" -> ÜBERSPRUNGEN (Startseite), ohne Suche.
  - Frontmatter neu bauen: komplettes Frontmatter der deutschen Quelle, darin nur title/description/
    sidebar.label durch die Palace-Werte ersetzt (wenn dort vorhanden und nicht leer), translated: machine
    gesetzt. Alles andere (sources, lernfeld, stufe, sidebar.order, serie, datum, ...) bleibt exakt wie
    in der deutschen Quelle.
  - Körper prüfen: Palace-Körper (alles nach dem zweiten "---") muss zur deutschen Quelle strukturell
    passen (import-Zeilen, Komponenten-Tag-Zähler, Quizfragen, Überschriften, Code-Zäune, Tabellenzeilen,
    Links/Bilder, URL-Menge als Teilmenge, kein deutscher Fallback-Text, Körperlänge 0.6x-1.6x). Bei
    Abweichung -> UNGÜLTIG (Grund).
  - Vorher: gerade Apostrophe zwischen zwei Wortzeichen in <Quiz>-Blöcken -> ’ (U+2019), sonst beendet
    z. B. tr „RCD'lerden“ den JS-String und bricht den Build. Buchstaben aus Schriften, die in der
    Zielsprache nichts verloren haben (Hebräisch, Thai, Khmer, CJK …; Kyrillisch außer ru, Georgisch
    außer ka, Arabisch außer ar/fa) -> UNGÜLTIG. Ebenso: ka/ru-Wörter, die lateinische und eigene Buchstaben
    ohne Trenner mischen (ka „სprints“), und Quizfragen, die byte-gleich aus der deutschen Quelle stehen
    geblieben sind.
  - Bei --schreiben: Zieldatei überschreiben (UTF-8, LF).

Idempotent: ein zweiter Lauf erzeugt byte-identische Ausgaben (keine Zeitstempel, keine Zufallswerte).
"""
from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DE = ROOT / "src" / "content" / "docs" / "de"
DOCS_ROOT = ROOT / "src" / "content" / "docs"

FALLBACK_TEXT = "Dieser Inhalt ist noch nicht in deiner Sprache verfügbar."

LANGS = ("en", "tr", "ru", "ar", "fa", "ka", "sq")

FM_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", re.S)
FILE_RE = re.compile(rf"^({'|'.join(LANGS)})-(.+)\.md$")

URL_RE = re.compile(r"https?://[^\s\"'<>\)\]]+")
TAG_RE = re.compile(r"<([A-Z][A-Za-z]+)")
H2_RE = re.compile(r"^##(?!#)[ \t].*$", re.M)
FENCE_RE = re.compile(r"^```.*$", re.M)
TABLE_ROW_RE = re.compile(r"^[ \t]*\|", re.M)
QUIZ_BLOCK_RE = re.compile(r"<Quiz.*?/>", re.S)
QUIZ_QUESTION_RE = re.compile(r"\{\s*f:")
# Gerades Apostroph zwischen zwei Wortzeichen (tr: RCD'lerden, en: don't) beendet sonst den einfach gequoteten
# JS-String im <Quiz>-Block (Runde 2 + 3: Build-Bruch). String-Grenzen stehen nie zwischen zwei Wortzeichen.
QUIZ_APOSTROPH_RE = re.compile(r"(?<=[^\W_])'(?=[^\W_])")
# Schriften, die in keiner Übersetzung vorkommen dürfen (Runde 3: ka mit Hebräisch/Khmer/Thai mitten im Wort).
FREMDE_SCHRIFTEN = {"HEBREW", "THAI", "KHMER", "LAO", "CJK", "HANGUL", "HIRAGANA", "KATAKANA", "DEVANAGARI",
                    "BENGALI", "TAMIL", "TELUGU", "KANNADA", "MALAYALAM", "GUJARATI", "GURMUKHI", "ORIYA",
                    "SINHALA", "MYANMAR", "TIBETAN", "ETHIOPIC", "ARMENIAN", "MONGOLIAN"}
EIGENE_SCHRIFT = {"ar": "ARABIC", "fa": "ARABIC", "ka": "GEORGIAN", "ru": "CYRILLIC"}
# Mischschrift im Wort nur für ka/ru prüfen: in ar/fa sind Formen wie „الـRCD“ oder „RCDها“ Schreibvarianten.
MISCH_SPRACHEN = ("ka", "ru")
WORT_RE = re.compile(r"[^\W\d_]+")
QUIZ_ITEM_RE = re.compile(r"\{[^{}]*\}")


# ---------------------------------------------------------------------------
# Frontmatter / Körper: parsen
# ---------------------------------------------------------------------------

def split_frontmatter(text: str) -> tuple[str, str] | tuple[None, None]:
    m = FM_RE.match(text)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def top_value(fm_lines: list[str], key: str) -> str | None:
    """Wert eines Top-Level-Schlüssels (Zeile beginnt bei Spalte 0 mit '<key>:')."""
    pat = re.compile(rf"^{re.escape(key)}:(.*)$")
    for line in fm_lines:
        m = pat.match(line)
        if m:
            v = m.group(1).strip()
            return v if v else None
    return None


def sidebar_label_value(fm_lines: list[str]) -> str | None:
    for i, line in enumerate(fm_lines):
        if line.strip() == "sidebar:":
            j = i + 1
            while j < len(fm_lines) and fm_lines[j][:1] in (" ", "\t"):
                m = re.match(r"^\s+label:(.*)$", fm_lines[j])
                if m:
                    v = m.group(1).strip()
                    return v if v else None
                j += 1
            return None
    return None


def set_top_value(fm_lines: list[str], key: str, new_value: str) -> bool:
    pat = re.compile(rf"^{re.escape(key)}:(.*)$")
    for i, line in enumerate(fm_lines):
        if pat.match(line):
            fm_lines[i] = f"{key}: {new_value}"
            return True
    return False


def set_sidebar_label(fm_lines: list[str], new_value: str) -> bool:
    for i, line in enumerate(fm_lines):
        if line.strip() == "sidebar:":
            j = i + 1
            while j < len(fm_lines) and fm_lines[j][:1] in (" ", "\t"):
                m = re.match(r"^(\s+)label:(.*)$", fm_lines[j])
                if m:
                    fm_lines[j] = f"{m.group(1)}label: {new_value}"
                    return True
                j += 1
            return False
    return False


def set_translated_machine(fm_lines: list[str]) -> None:
    for i, line in enumerate(fm_lines):
        if re.match(r"^translated:", line):
            fm_lines[i] = "translated: machine"
            return
    for i, line in enumerate(fm_lines):
        if re.match(r"^description:", line):
            fm_lines.insert(i + 1, "translated: machine")
            return
    fm_lines.insert(0, "translated: machine")


def build_frontmatter(de_fm_text: str, pa_fm_text: str) -> tuple[str, list[str], list[str]]:
    """Baut das neue Frontmatter (Basis: deutsche Quelle) und meldet, welche Felder
    aus der Palace-Datei übernommen wurden bzw. warum nicht."""
    de_lines = de_fm_text.split("\n")
    pa_lines = pa_fm_text.split("\n")
    taken: list[str] = []
    notes: list[str] = []

    pa_title = top_value(pa_lines, "title")
    if pa_title:
        if set_top_value(de_lines, "title", pa_title):
            taken.append("title")
        else:
            notes.append("title: kein title: in DE-Quelle gefunden (unerwartet)")
    else:
        notes.append("title: Palace-Wert fehlt/leer -> Deutsch beibehalten")

    pa_desc = top_value(pa_lines, "description")
    if pa_desc:
        if set_top_value(de_lines, "description", pa_desc):
            taken.append("description")
        else:
            notes.append("description: kein description: in DE-Quelle gefunden (unerwartet)")
    else:
        notes.append("description: Palace-Wert fehlt/leer -> Deutsch beibehalten")

    pa_label = sidebar_label_value(pa_lines)
    if pa_label:
        if set_sidebar_label(de_lines, pa_label):
            taken.append("sidebar.label")
        else:
            notes.append("sidebar.label: Palace-Wert vorhanden, DE-Quelle hat kein sidebar.label -> nicht gesetzt")
    elif sidebar_label_value(de_lines):
        notes.append("sidebar.label: Palace-Wert fehlt/leer -> Deutsch beibehalten")

    set_translated_machine(de_lines)
    taken.append("translated=machine")

    return "\n".join(de_lines), taken, notes


# ---------------------------------------------------------------------------
# Körper: strukturell vergleichen
# ---------------------------------------------------------------------------

def body_metrics(body: str) -> dict:
    imports = Counter(l for l in body.splitlines() if l.startswith("import "))
    tags = Counter(TAG_RE.findall(body))
    quiz_blocks = QUIZ_BLOCK_RE.findall(body)
    quiz_n = sum(len(QUIZ_QUESTION_RE.findall(b)) for b in quiz_blocks)
    return dict(
        imports=imports,
        tags=tags,
        quiz=quiz_n,
        h2=len(H2_RE.findall(body)),
        fences=len(FENCE_RE.findall(body)),
        tablerows=len(TABLE_ROW_RE.findall(body)),
        links=body.count("](http"),
        urls=set(URL_RE.findall(body)),
        fallback=FALLBACK_TEXT in body,
        length=len(body.strip()),
    )


def check_body(de_body: str, pa_body: str) -> list[str]:
    dm, pm = body_metrics(de_body), body_metrics(pa_body)
    reasons: list[str] = []

    if dm["imports"] != pm["imports"]:
        nur_de = list((dm["imports"] - pm["imports"]).elements())
        nur_pa = list((pm["imports"] - dm["imports"]).elements())
        reasons.append(f"import-Zeilen geändert (nur DE: {nur_de} | nur Palace: {nur_pa})")
    if dm["tags"] != pm["tags"]:
        reasons.append(f"Komponenten-Tags geändert (DE {dict(dm['tags'])} -> Palace {dict(pm['tags'])})")
    if dm["quiz"] != pm["quiz"]:
        reasons.append(f"Quizfragen {dm['quiz']} -> {pm['quiz']}")
    if dm["h2"] != pm["h2"]:
        reasons.append(f"H2-Überschriften {dm['h2']} -> {pm['h2']}")
    if dm["fences"] != pm["fences"]:
        reasons.append(f"Code-Zäune {dm['fences']} -> {pm['fences']}")
    if dm["tablerows"] != pm["tablerows"]:
        reasons.append(f"Tabellenzeilen {dm['tablerows']} -> {pm['tablerows']}")
    if dm["links"] != pm["links"]:
        reasons.append(f"Links/Bilder ](http {dm['links']} -> {pm['links']}")
    extra_urls = pm["urls"] - dm["urls"]
    if extra_urls:
        reasons.append(f"URL(s) nicht in Quelle (neu/verfälscht): {sorted(extra_urls)}")
    if pm["fallback"]:
        reasons.append("enthält deutschen Fallback-Text")
    if dm["length"] > 0:
        ratio = pm["length"] / dm["length"]
        if not (0.6 <= ratio <= 1.6):
            reasons.append(f"Körperlänge außerhalb 0.6x-1.6x (Verhältnis {ratio:.2f})")
    elif pm["length"] > 0:
        reasons.append("deutsche Quelle hat leeren Körper, Palace nicht")

    return reasons


# ---------------------------------------------------------------------------
# Hauptlauf
# ---------------------------------------------------------------------------

def find_de_source(slug: str) -> tuple[Path | None, int]:
    matches = sorted(DOCS_DE.rglob(f"{slug}.mdx"))
    if len(matches) == 1:
        return matches[0], 1
    return None, len(matches)


def quiz_apostrophe_normalisieren(body: str) -> tuple[str, int]:
    """Gerade Apostrophe zwischen zwei Wortzeichen in <Quiz …/>-Blöcken durch ’ ersetzen -> (Körper, Anzahl)."""
    anzahl = 0

    def ersetzen(m: re.Match) -> str:
        nonlocal anzahl
        neu, n = QUIZ_APOSTROPH_RE.subn("\u2019", m.group(0))
        anzahl += n
        return neu

    return QUIZ_BLOCK_RE.sub(ersetzen, body), anzahl


def fremde_schrift(lang: str, body: str) -> list[str]:
    """Buchstaben aus Schriften, die in dieser Sprache nichts verloren haben (Latein/Griechisch immer erlaubt)."""
    verboten = set(FREMDE_SCHRIFTEN)
    for schrift in EIGENE_SCHRIFT.values():
        if schrift != EIGENE_SCHRIFT.get(lang):
            verboten.add(schrift)
    funde: Counter = Counter()
    for zeichen in body:
        if zeichen.isalpha():
            schrift = unicodedata.name(zeichen, "").split(" ")[0]
            if schrift in verboten:
                funde[schrift] += 1
    return [f"fremde Schrift {s} ({n} Zeichen)" for s, n in sorted(funde.items())]


def mischschrift(lang: str, body: str) -> list[str]:
    """ka/ru: Wörter mit lateinischen UND eigenen Buchstaben ohne Trenner (Runde 3: ka „სprints“)."""
    if lang not in MISCH_SPRACHEN:
        return []
    eigen = EIGENE_SCHRIFT[lang]
    funde = [w for w in WORT_RE.findall(body)
             if {"LATIN", eigen} <= {unicodedata.name(z, "").split(" ")[0] for z in w}]
    if not funde:
        return []
    rest = f" (+{len(funde) - 3})" if len(funde) > 3 else ""
    return [f"Mischschrift im Wort: {', '.join(funde[:3])}{rest}"]


def quiz_unuebersetzt(de_body: str, pa_body: str) -> list[str]:
    """Quiz-Objekte { f: …, a: […], r: …, e: … }, die byte-gleich aus der deutschen Quelle übernommen wurden."""
    de_items = {i for b in QUIZ_BLOCK_RE.findall(de_body) for i in QUIZ_ITEM_RE.findall(b)}
    gleich = [i for b in QUIZ_BLOCK_RE.findall(pa_body) for i in QUIZ_ITEM_RE.findall(b) if i in de_items]
    return [f"{len(gleich)} Quizfrage(n) unübersetzt (byte-gleich mit der Quelle)"] if gleich else []


def process_one(cikti_dir: Path, fname: str, schreiben: bool) -> dict:
    m = FILE_RE.match(fname)
    lang, slug = m.group(1), m.group(2)
    row = dict(datei=fname, lang=lang, slug=slug, status=None, grund="", ziel="",
               alte_groesse="-", neue_groesse="-", felder="")

    if slug == "index":
        row["status"] = "ÜBERSPRUNGEN"
        row["grund"] = "Startseite (slug == index, nie übernehmen)"
        return row

    de_path, n = find_de_source(slug)
    if de_path is None:
        row["status"] = "ÜBERSPRUNGEN"
        row["grund"] = f"mehrdeutig ({n} Treffer für {slug}.mdx unter src/content/docs/de)"
        return row

    rel = de_path.relative_to(DOCS_DE)
    target_path = DOCS_ROOT / lang / rel
    row["ziel"] = str(target_path.relative_to(ROOT)).replace("\\", "/")

    de_text = de_path.read_text(encoding="utf-8")
    pa_text = (cikti_dir / fname).read_text(encoding="utf-8")
    de_fm, de_body = split_frontmatter(de_text)
    pa_fm, pa_body = split_frontmatter(pa_text)

    if de_fm is None:
        row["status"] = "UNGÜLTIG"
        row["grund"] = "deutsche Quelle: Frontmatter-Grenzen (---) nicht gefunden"
        return row
    if pa_fm is None:
        row["status"] = "UNGÜLTIG"
        row["grund"] = "Palace-Datei: Frontmatter-Grenzen (---) nicht gefunden"
        return row

    pa_body, apostrophe = quiz_apostrophe_normalisieren(pa_body)
    reasons = (check_body(de_body, pa_body) + fremde_schrift(lang, pa_body) + mischschrift(lang, pa_body)
               + quiz_unuebersetzt(de_body, pa_body))
    new_fm, taken, notes = build_frontmatter(de_fm, pa_fm)
    row["felder"] = ", ".join(taken) + (" | " + "; ".join(notes) if notes else "")
    if apostrophe:
        row["felder"] += f" | Quiz-Apostroph -> ’ ({apostrophe}x)"

    row["alte_groesse"] = str(target_path.stat().st_size) if target_path.exists() else "(neu)"

    if reasons:
        row["status"] = "UNGÜLTIG"
        row["grund"] = "; ".join(reasons)
        return row

    row["status"] = "OK"
    final_body = pa_body.rstrip("\n") + "\n"
    final_text = f"---\n{new_fm}\n---\n{final_body}"
    row["neue_groesse"] = str(len(final_text.encode("utf-8")))

    if schreiben:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(final_text)
        row["grund"] = "geschrieben"
    else:
        row["grund"] = "würde geschrieben (--schreiben fehlt)"

    return row


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows-Konsole: Umlaute korrekt ausgeben

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cikti_dir", help="Ordner mit <lang>-<slug>.md Dateien der AI-Palace-Kette")
    ap.add_argument("--schreiben", action="store_true", help="gültige Dateien tatsächlich schreiben")
    args = ap.parse_args()

    cikti_dir = Path(args.cikti_dir)
    if not cikti_dir.is_dir():
        print(f"FEHLER: {cikti_dir} ist kein Ordner", file=sys.stderr)
        return 2

    files = sorted(p.name for p in cikti_dir.iterdir() if p.is_file() and FILE_RE.match(p.name) and ".red-" not in p.name)

    rows = [process_one(cikti_dir, fname, args.schreiben) for fname in files]

    w_datei = max([len("Datei")] + [len(r["datei"]) for r in rows])
    w_status = max([len("Ergebnis")] + [len(r["status"]) for r in rows])
    header = f"{'Datei':<{w_datei}}  {'Ergebnis':<{w_status}}  Grund / Ziel / Größe / Felder"
    print(header)
    print("-" * len(header))
    for r in rows:
        detail = r["grund"]
        if r["status"] == "OK":
            detail += f" | {r['ziel']} | {r['alte_groesse']}->{r['neue_groesse']} Bytes | Felder: {r['felder']}"
        print(f"{r['datei']:<{w_datei}}  {r['status']:<{w_status}}  {detail}")

    n_ok = sum(1 for r in rows if r["status"] == "OK")
    n_bad = sum(1 for r in rows if r["status"] == "UNGÜLTIG")
    n_skip = sum(1 for r in rows if r["status"] == "ÜBERSPRUNGEN")
    print("-" * len(header))
    print(f"Gesamt: {len(rows)} | OK: {n_ok} | UNGÜLTIG: {n_bad} | ÜBERSPRUNGEN: {n_skip} | "
          f"{'geschrieben' if args.schreiben else 'NICHT geschrieben (--schreiben fehlt)'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
