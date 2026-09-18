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
    Seiteninterne Linkziele müssen bis auf das Locale-Präfix identisch zur Quelle sein, und vom Repo
    verbotene deutsche Wörter (Profi/Profis/Profi-) dürfen nicht auftauchen. Bei
    Abweichung -> UNGÜLTIG (Grund).
  - Vorher: gerade Apostrophe zwischen zwei Wortzeichen in <Quiz>-Blöcken -> ’ (U+2019), sonst beendet
    z. B. tr „RCD'lerden“ den JS-String und bricht den Build. Buchstaben aus Schriften, die in der
    Zielsprache nichts verloren haben (Hebräisch, Thai, Khmer, CJK …; Kyrillisch außer ru, Georgisch
    außer ka, Arabisch außer ar/fa) -> UNGÜLTIG. Ebenso: ka/ru-Wörter, die lateinische und eigene Buchstaben
    ohne Trenner mischen (ka „სprints“), und Quizfragen, die byte-gleich aus der deutschen Quelle stehen
    geblieben sind. Und: mehr deutsche Funktionswörter (und, der, nicht …) im Fließtext ohne Tabellen als
    max(8, 6 % der Quelle) =
    unübersetzte Passagen (Runde 1–3 enthielten eine fast unübersetzte tr-Seite, 199 von 207).
  - Bei --schreiben: Zieldatei überschreiben (UTF-8, LF).

Idempotent: ein zweiter Lauf erzeugt byte-identische Ausgaben (keine Zeitstempel, keine Zufallswerte).
"""
from __future__ import annotations

import argparse
import json
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
# Deutsche Funktionswörter – in einer Übersetzung höchstens vereinzelt (zitierte Regeln, Fachbegriffe in Anführung).
DEUTSCH_STOP = {"und", "der", "die", "das", "ist", "mit", "für", "nicht", "ein", "eine", "einen", "einem", "wird",
                "werden", "auf", "bei", "oder", "auch", "sich", "dem", "des", "vom", "zum", "zur", "wenn", "dann",
                "nur", "noch", "sind", "haben", "kann", "muss", "soll", "darf", "immer", "wie", "aus", "nach",
                "über", "unter", "zwischen", "weil", "damit", "dass", "diese", "dieser", "dieses", "keine", "kein",
                "sondern", "aber"}
WORT_DE_RE = re.compile(r"[A-Za-zÄÖÜäöüß]+")
CODEBLOCK_RE = re.compile(r"^```.*?^```", re.S | re.M)
# Satzgrenze: Satzzeichen, danach optional schließende Auszeichnung (**fett.** „…“) und Leerraum.
SATZ_TRENN_RE = re.compile(r"(?<=[.!?:;])[^\w\s]*\s+|\n+")
# Ab drei Funktionswörtern in einem Satz ist es kein amtlicher Name mehr, sondern unübersetzter Satzbau.
SATZ_SCHWELLE = 3


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


# Seiteninterne Ziele: alles in `](…)`, was keine externe URL und keine Mailadresse ist —
# `/de/rechtliches/`, `../unterverteilung/`, `#begriff-rcd`, `/img/logo.svg`.
INTERN_ZIEL_RE = re.compile(r"\]\((?!https?://|mailto:)([^)\s]+)\)")
# Das Repo verbietet „Profi“ als Wort und als Präfix (Stufennamen kommen aus `stufen.profi` der
# Locale); der Produktname PROFiTEST bleibt erlaubt und fällt durch die Groß-/Kleinschreibung heraus.
VERBOTEN_RE = re.compile(r"(?<![A-Za-z])Profis?(?:-[A-Za-zÄÖÜäöüß]+)?(?![A-Za-z])")


def interne_links(lang: str, de_body: str, pa_body: str) -> list[str]:
    """Seiteninterne Linkziele müssen bis auf das Locale-Präfix identisch zur Quelle sein.

    18.09.: `check_body` zählt nur `](http` und vergleicht nur `https?://`-URLs — seiteninterne
    Pfade waren der blinde Fleck. ar/en/tr-mitglied und -ueber machten aus `](/de/rechtliches/
    datenschutz/)` ein `](./rechtliches/datenschutz/)`; relativ zu `/tr/mitglied/` zeigt das auf
    `/tr/mitglied/rechtliches/datenschutz/` und damit ins Leere. Der Repo-Test „Interne Links“
    fand es erst nach der Übernahme — also prüft das Tor es jetzt davor.

    Verglichen wird als Multimenge (Reihenfolge egal, Anzahl nicht): jedes `/de/x/` der Quelle muss
    in der Übersetzung als `/<lang>/x/` stehen, Anker und Bildpfade unverändert.
    """
    def ziele(body: str, locale: str) -> Counter:
        c: Counter = Counter()
        for ziel in INTERN_ZIEL_RE.findall(body):
            if ziel.startswith(f"/{locale}/"):
                ziel = ziel[len(locale) + 1:]     # "/de/rechtliches/" -> "/rechtliches/"
            c[ziel] += 1
        return c

    dm, pm = ziele(de_body, "de"), ziele(pa_body, lang)
    if dm == pm:
        return []
    fehlt = sorted((dm - pm).elements())
    neu = sorted((pm - dm).elements())
    teile = []
    if fehlt:
        teile.append(f"fehlt/verfälscht: {fehlt}")
    if neu:
        teile.append(f"neu: {neu}")
    return [f"interne Links weichen von der Quelle ab ({'; '.join(teile)})"]


def verbotene_begriffe(pa_body: str) -> list[str]:
    """Deutsche Wörter, die das Repo verbietet, auch wenn sie in der Quelle gar nicht stehen.

    18.09.: ar/ka/sq-mitglied übersetzten die Stufe `Fachkraft` mit dem deutschen Wort `Profi` —
    ein erfundenes deutsches Wort, das die Deutschanteil-Messung (die pro Satz misst) nicht sieht.
    Der Repo-Test „Kein Profi/Profis als Wort oder Präfix“ lehnt es ab; das Tor tut es jetzt vorher.
    """
    treffer = sorted(set(VERBOTEN_RE.findall(pa_body)))
    return [f"verbotenes deutsches Wort (Repo-Test): {treffer}"] if treffer else []

# Die Stufennamen (`stufen.azubi`/`stufen.profi`) sind UI-Text, kein Übersetzungsgegenstand: welcher
# Wert in welcher Locale steht, entscheidet startseite-ui.json. In tr/ar/fa/ka/sq ist das das deutsche
# `Fachkraft`, in en `Skilled worker` — eine reine "bleibt deutsch"-Regel greift also nicht.
UI_JSON = ROOT / "src" / "data" / "startseite-ui.json"
# Nur mitglied nennt die Stufen im Fliesstext; der Repo-Test "Merge neuaufbau: mitglied.mdx" prueft genau das.
UI_STUFEN_SEITEN = ("mitglied",)


def ui_stufen(lang: str, slug: str, pa_body: str) -> list[str]:
    """Auf mitglied.mdx muessen die Stufennamen woertlich aus startseite-ui.json stehen.

    18.09.: tr machte aus `Fachkraft` ein „Uzman“, in ar/fa/ka/sq verschwand das Wort ganz — der
    Repo-Test fiel erst nach der Uebernahme. Fehlt die Datei oder die Locale, wird nicht geprueft
    (keine erfundenen Ablehnungen).
    """
    if slug not in UI_STUFEN_SEITEN or not UI_JSON.exists():
        return []
    try:
        ui = json.loads(UI_JSON.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    stufen = (ui.get(lang) or {}).get("stufen") or {}
    fehlt = [f"{ad}={wert!r}" for ad, wert in sorted(stufen.items())
             if ad in ("azubi", "profi") and wert and wert not in pa_body]
    return [f"Stufenname aus startseite-ui.json fehlt im Text ({', '.join(fehlt)})"] if fehlt else []

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


def deutsch_zaehlen(body: str) -> int:
    """Deutsche Funktionswörter aus unübersetzten Sätzen – ohne Code-Blöcke, import-Zeilen und Tabellenzeilen
    (Tabellen tragen oft amtliche deutsche Namen, die bewusst deutsch bleiben, z. B. die 13 Lernfelder).

    Gezählt wird satzweise, denn nicht jedes deutsche Wort ist ein Fehler: die Übersetzungsregeln verlangen,
    dass amtliche Namen deutsch im Zielsatz stehen („Fachrichtung Energie- und Gebäudetechnik“, „Lernfeld 3 –
    Steuerungen und Regelungen“). Solche Namen bringen ein bis zwei Funktionswörter in einen sonst
    zielsprachlichen Satz; ein wirklich unübersetzter Satz bringt drei und mehr. Nur Sätze ab dieser Schwelle
    zählen (Palace-Lauf 18.09.: tr-lernfelder 15 -> 0, sauber und nur amtliche Namen; sq-berufsbild bleibt
    weit über der Grenze, Körper deutsch geblieben; die deutsche Quelle gegen sich selbst fällt weiter durch)."""
    body = CODEBLOCK_RE.sub("", body)
    body = "\n".join(z for z in body.splitlines() if not z.lstrip().startswith(("import ", "|")))
    summe = 0
    for satz in SATZ_TRENN_RE.split(body):
        treffer = sum(1 for w in WORT_DE_RE.findall(satz) if w.lower() in DEUTSCH_STOP)
        if treffer >= SATZ_SCHWELLE:
            summe += treffer
    return summe


def deutscher_rest(de_body: str, pa_body: str) -> list[str]:
    """Mehr deutsche Funktionswörter als max(8, 6 % der Quelle) -> unübersetzte Passagen."""
    rest, quelle = deutsch_zaehlen(pa_body), deutsch_zaehlen(de_body)
    grenze = max(8, round(0.06 * quelle))
    return [f"deutscher Rest: {rest} Funktionswörter (Grenze {grenze}, Quelle {quelle})"] if rest > grenze else []


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
               + quiz_unuebersetzt(de_body, pa_body) + deutscher_rest(de_body, pa_body)
               + interne_links(lang, de_body, pa_body) + verbotene_begriffe(pa_body)
               + ui_stufen(lang, slug, pa_body))
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
