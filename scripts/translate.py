"""Almanca MDX makaleyi OpenCode worker modeliyle hedef dile çevirir.

Kullanım (repo kökünden):
  python scripts/translate.py de/grundlagen/strom-spannung-widerstand.mdx tr [ru ar ...]
  python scripts/translate.py --all tr          # tüm de/ sayfaları (rechtliches hariç)

Kurallar (brief içinde de yazılı):
- Almanca Fachbegriff kalır; ilk geçişte parantez içinde yerel karşılık.
- Front matter: title/description/sidebar.label çevrilir, translated: machine, kalanı aynen.
- import satırları, bileşen etiketleri (<Sicherheit />, <Steps>, <Quiz ... />, <Bild ...>), URL'ler değişmez.
- Çıktı doğrulanır (front matter, import'lar, sources URL'leri, quiz sayısı); hata → dosya yazılmaz.
"""
from __future__ import annotations
import argparse, re, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "src" / "content" / "docs"
WORKER = Path.home() / ".claude" / "skills" / "worker" / "scripts" / "worker.py"

LANGS = {
    "en": ("English", "Englisch"),
    "tr": ("Türkçe", "Türkisch"),
    "ru": ("Русский", "Russisch"),
    "ar": ("العربية (Modern Standard Arabic)", "Arabisch"),
    "fa": ("فارسی (Persian, Iran)", "Persisch"),
    "ka": ("ქართული (Georgian)", "Georgisch"),
    "sq": ("Shqip (Albanian)", "Albanisch"),
}

BRIEF = """You are a professional technical translator for an educational website about German electrical
apprenticeship (Ausbildung Elektroniker/-in Energie- und Gebäudetechnik). Translate the MDX document below
from German into {lang_name}.

HARD RULES — violating any of them makes the output unusable:
1. German technical terms (Fachbegriffe) STAY IN GERMAN, exactly as written, e.g. Unterverteilung, RCD,
   Leitungsschutzschalter, Außenleiter, Neutralleiter, Schutzleiter, Zählerplatz, Gesellenprüfung, Lernfeld,
   Ausbildung, Azubi, Elektrofachkraft, Handwerkskammer, Meister, Techniker, Erstprüfung, Wechselschaltung,
   Steckdose, Hauptschalter, SLS, Hutschiene, Kammschiene, DIN VDE …, VDE-AR-N 4100, § 13 NAV, ElekAusbV.
   On the FIRST occurrence of a Fachbegriff in the body text, add the {lang_name} meaning in parentheses,
   e.g. "Unterverteilung (alt dağıtım panosu)". Later occurrences: German term only.
   Do NOT translate product/standard names, law names, or abbreviations. Numbers, units and formulas unchanged.
2. Keep the structure byte-for-byte where it is not natural language:
   - The front matter (between the first two `---` lines): translate ONLY the values of `title`,
     `description` and `sidebar.label`. Change `translated: source` to `translated: machine`.
     Every other key (sources, lernfeld, stufe, sidebar.order, url values) stays EXACTLY the same.
   - All `import … from '…';` lines stay identical.
   - JSX components stay identical in name and props: `<Sicherheit />`, `<Steps>`, `</Steps>`, `<Bild … >…</Bild>`,
     `<…Schema />`, and `<Quiz fragen={{[ … ]}} />`. Inside Quiz, translate the string values of `f`, `a` and `e`
     only; keep `r` numbers and the JS syntax (quotes, brackets, commas) intact. Use the same quote style as the
     source (single quotes); escape a single quote inside a string as \\'.
   - Markdown tables keep the same number of columns and rows. Links keep their URLs; translate link text only.
   - Headings (##) are translated but keep the same order and count.
3. Write natural, clear {lang_name} for a 16–25-year-old apprentice. Keep the friendly "du" tone
   (informal second person) where the language has it. Sentences may be shorter than the German.
4. Output ONLY the translated MDX document, starting with `---`. No code fences, no explanations, no preface.

{extra}

=== GERMAN SOURCE (MDX) ===
{source}
=== END ===
"""

EXTRA = {
    "ar": "Arabic: write in Modern Standard Arabic; keep Latin-script German terms as-is inside the Arabic text. Numbers may stay Western Arabic digits.",
    "fa": "Persian: keep Latin-script German terms as-is inside the Persian text. Use Persian punctuation where natural.",
    "ka": "Georgian: use the Mkhedruli script; keep Latin-script German terms as-is.",
    "sq": "Albanian: standard (gjuha standarde), keep Latin-script German terms as-is.",
    "ru": "Russian: keep Latin-script German terms as-is; use 'ты' form.",
    "tr": "Turkish: keep German terms as-is; use 'sen' form. Alman meslek eğitimi terimlerini Türkçe açıklarken 'çıraklık eğitimi (Ausbildung)' gibi doğal karşılıklar kullan.",
    "en": "English: keep German terms as-is with the English gloss on first use.",
}


def fm_split(text: str) -> tuple[str, str]:
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise ValueError("front matter bulunamadı")
    return m.group(1), m.group(2)


def validate(src: str, out: str) -> list[str]:
    errs: list[str] = []
    out = out.strip()
    if out.startswith("```"):
        out = re.sub(r"^```[a-z]*\n", "", out)
        out = re.sub(r"\n```$", "", out)
    try:
        sfm, sbody = fm_split(src)
        ofm, obody = fm_split(out)
    except ValueError as e:
        return [str(e)]
    if "translated: machine" not in ofm:
        errs.append("translated: machine yok")
    s_urls = re.findall(r'url: "([^"]+)"', sfm)
    o_urls = re.findall(r'url: "([^"]+)"', ofm)
    if s_urls != o_urls:
        errs.append(f"sources URL listesi değişti ({len(s_urls)} → {len(o_urls)})")
    for key in ("lernfeld:", "stufe:", "order:"):
        sv = re.search(rf"^\s*{key}.*$", sfm, re.M)
        ov = re.search(rf"^\s*{key}.*$", ofm, re.M)
        if sv and (not ov or sv.group(0).strip() != ov.group(0).strip()):
            errs.append(f"front matter {key} değişti")
    s_imp = [l for l in sbody.splitlines() if l.startswith("import ")]
    o_imp = [l for l in obody.splitlines() if l.startswith("import ")]
    if s_imp != o_imp:
        errs.append("import satırları değişti")
    for tag in ("<Sicherheit />", "<Steps>", "</Steps>", "<Quiz fragen={[", "]} />"):
        if (tag in sbody) != (tag in obody):
            errs.append(f"bileşen eksik/fazla: {tag}")
    sq, oq = sbody.count("{ f: "), obody.count("{ f: ")
    if sq != oq:
        errs.append(f"quiz soru sayısı {sq} → {oq}")
    sh, oh = sbody.count("\n## "), obody.count("\n## ")
    if sh != oh:
        errs.append(f"H2 sayısı {sh} → {oh}")
    s_schema = re.findall(r"<(\w+Schema) />", sbody)
    o_schema = re.findall(r"<(\w+Schema) />", obody)
    if s_schema != o_schema:
        errs.append("şema bileşeni değişti")
    return errs


def clean(out: str) -> str:
    out = out.strip()
    if out.startswith("```"):
        out = re.sub(r"^```[a-z]*\n", "", out)
        out = re.sub(r"\n```$", "", out)
    return out + "\n"


def translate_one(rel: str, lang: str, role: str, timeout: int, force: bool) -> bool:
    src_path = DOCS / rel
    if not src_path.exists():
        print(f"KAYNAK YOK: {rel}"); return False
    dst_rel = rel.replace("de/", f"{lang}/", 1)
    dst_path = DOCS / dst_rel
    if dst_path.exists() and not force:
        existing = dst_path.read_text(encoding="utf-8")
        tag = "reviewed" if "translated: reviewed" in existing else "mevcut"
        print(f"ATLA ({tag}): {dst_rel}"); return True
    src = src_path.read_text(encoding="utf-8")
    lang_name = LANGS[lang][0]
    brief = BRIEF.format(lang_name=lang_name, extra=EXTRA.get(lang, ""), source=src)
    tmp = ROOT / "scratch"
    tmp.mkdir(exist_ok=True)
    bfile = tmp / f"brief-{lang}-{src_path.stem}.md"
    ofile = tmp / f"out-{lang}-{src_path.stem}.md"
    bfile.write_text(brief, encoding="utf-8")
    t0 = time.time()
    cmd = [sys.executable, str(WORKER), "--role", role, "--prompt-file", str(bfile), "--out", str(ofile), "--dir", str(tmp), "--timeout", str(timeout)]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    dt = time.time() - t0
    if r.returncode != 0 or not ofile.exists():
        print(f"WORKER HATA [{lang}] ({dt:.0f}s): {r.stderr[-300:]}"); return False
    out = ofile.read_text(encoding="utf-8")
    errs = validate(src, out)
    if errs:
        print(f"DOĞRULAMA HATASI [{lang}] {rel} ({dt:.0f}s): " + "; ".join(errs))
        print(f"  ham çıktı: {ofile}")
        return False
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    dst_path.write_text(clean(out), encoding="utf-8")
    print(f"OK [{lang}] {dst_rel} ({dt:.0f}s, {len(out)} karakter)")
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", nargs="?", help="de/… yolu (src/content/docs altında)")
    ap.add_argument("langs", nargs="*", help="hedef diller; boş = hepsi")
    ap.add_argument("--all", action="store_true", help="tüm de/ sayfaları (rechtliches hariç)")
    ap.add_argument("--role", default="worker")
    ap.add_argument("--timeout", type=int, default=900)
    ap.add_argument("--force", action="store_true", help="reviewed olanları da yeniden yaz")
    a = ap.parse_args()
    langs = [l for l in (a.langs or list(LANGS)) if l in LANGS] if a.source else list(LANGS)
    if a.all:
        langs = [a.source] + a.langs if a.source else list(LANGS)
        langs = [l for l in langs if l in LANGS] or list(LANGS)
        sources = sorted(p.relative_to(DOCS).as_posix() for p in (DOCS / "de").rglob("*.mdx") if "rechtliches" not in p.parts and p.name != "index.mdx")
    else:
        if not a.source:
            ap.error("kaynak dosya ver veya --all")
        sources = [a.source]
    fails = 0
    for s in sources:
        for l in langs:
            if not translate_one(s, l, a.role, a.timeout, a.force):
                fails += 1
    print(f"\nbitti: {len(sources)} sayfa × {len(langs)} dil, {fails} hata")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
