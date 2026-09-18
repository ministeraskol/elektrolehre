"""Tests für palace_aktar.py — Deutschanteil-Messung.

Aufruf (repo-kökünden):  python -m unittest scripts.test_palace_aktar -v
                   oder:  python scripts/test_palace_aktar.py

Hintergrund (18.09.): Der Zähler zählte jedes deutsche Funktionswort im Fließtext. In einer guten
Übersetzung stehen aber amtliche deutsche Namen bewusst im Satz — „Fachrichtung Energie- und
Gebäudetechnik“, „Lernfeld 3 – Steuerungen und Regelungen“ —, und deren „und/für/der“ galt als
unübersetzte Passage. Gemessen am Palace-Lauf vom 18.09.: tr-lernfelder 15 Treffer bei Grenze 8
(abgelehnt, obwohl sauber übersetzt), sq-berufsbild 188 (zu Recht abgelehnt, Körper komplett deutsch).

Der Unterschied ist die Dichte pro Satz, nicht die Gesamtzahl: ein amtlicher Name bringt 1–2 Funktions-
wörter in einen sonst zielsprachlichen Satz, ein unübersetzter Satz bringt drei und mehr.

Die Testdaten in testdata/ sind unveränderte Palace-Ausgaben dieses Laufs, die deutschen Quellen kommen
aus dem Repo — damit messen die Tests dieselben Größenverhältnisse wie der Ernstfall.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import palace_aktar as pa  # noqa: E402

TESTDATA = HERE / "testdata"
DE_THEMEN = pa.DOCS_DE / "themen" / "energie-und-gebaeudetechnik"


def koerper(pfad: Path) -> str:
    """Alles nach dem zweiten `---` — genau das, was palace_aktar prüft."""
    m = pa.FM_RE.match(pfad.read_text(encoding="utf-8"))
    assert m, f"kein Frontmatter in {pfad}"
    return m.group(2)


class DeutschZaehlen(unittest.TestCase):
    def test_amtlicher_name_im_zielsprachlichen_satz_zaehlt_nicht(self):
        """„Energie- und Gebäudetechnik“ in einem türkischen Satz ist ein bewusst deutscher Fachbegriff."""
        satz = ("Ders saati olarak tahmini süreler. **EG** = Fachrichtung Energie- und Gebäudetechnik "
                "(Enerji ve Bina Teknolojisi uzmanlık dalı).")
        self.assertEqual(pa.deutsch_zaehlen(satz), 0)

    def test_zwei_amtliche_namen_in_einem_satz_zaehlen_nicht(self):
        """Auch zwei Namen im selben Satz bleiben unter der Satzschwelle."""
        satz = ("İkinci bir uzmanlık alanı daha vardır: **Automatisierungs- und Systemtechnik**. Bu sayfa "
                "sadece **Energie- und Gebäudetechnik**'i ele almaktadır.")
        self.assertEqual(pa.deutsch_zaehlen(satz), 0)

    def test_deutscher_satz_zaehlt_voll(self):
        """Ein durchgehend deutscher Satz ist eine unübersetzte Passage und zählt jedes Funktionswort."""
        satz = "Ausgebildet wird im Betrieb und in der Berufsschule, zuständig für Prüfungen ist die Handwerkskammer."
        self.assertGreaterEqual(pa.deutsch_zaehlen(satz), 5)

    def test_tabellen_und_codebloecke_bleiben_ausgenommen(self):
        """Tabellen tragen die amtlichen Lernfeld-Namen; sie waren schon vorher ausgenommen und bleiben es."""
        tabelle = "| 3 | Steuerungen und Regelungen analysieren und realisieren | 1 | 80 |"
        self.assertEqual(pa.deutsch_zaehlen(tabelle), 0)


class DeutscherRest(unittest.TestCase):
    """Ganze Palace-Ausgaben gegen ihre deutsche Quelle — dieselben Größen wie im Ernstfall."""

    def test_saubere_uebersetzung_mit_amtlichen_namen_ist_gueltig(self):
        """tr-lernfelder: 15 Funktionswörter, alle in amtlichen Namen — darf nicht abgelehnt werden."""
        befund = pa.deutscher_rest(koerper(DE_THEMEN / "lernfelder.mdx"),
                                   koerper(TESTDATA / "palace-tr-lernfelder.md"))
        self.assertEqual(befund, [], "sauber übersetzte Seite abgelehnt — das Tor misst das Falsche")

    def test_unuebersetzter_koerper_bleibt_ungueltig(self):
        """sq-berufsbild: deutscher Körper mit albanischen Klammern — muss weiterhin durchfallen."""
        befund = pa.deutscher_rest(koerper(DE_THEMEN / "berufsbild.mdx"),
                                   koerper(TESTDATA / "palace-sq-berufsbild.md"))
        self.assertTrue(befund, "unübersetzter Körper wurde durchgelassen — das Tor ist zu locker")
        self.assertIn("deutscher Rest", befund[0])

    def test_quelle_gegen_sich_selbst_faellt_durch(self):
        """Härtefall: wird die deutsche Quelle unverändert eingereicht, muss sie abgelehnt werden."""
        de = koerper(DE_THEMEN / "berufsbild.mdx")
        self.assertTrue(pa.deutscher_rest(de, de), "die Quelle selbst kam durch — das Tor misst nicht mehr")

class InterneLinks(unittest.TestCase):
    """Seiteninterne Links (`](/de/…)`) waren der blinde Fleck des Tors.

    18.09.: `URL_RE` fängt nur `https?://`, und `links` zählt nur `](http`. Ein Modell, das aus
    `](/de/rechtliches/datenschutz/)` ein `](./rechtliches/datenschutz/)` macht, kam damit durch —
    im Build lösen die relativen Pfade von `/tr/mitglied/` aus auf `/tr/mitglied/rechtliches/…` auf,
    also ins Leere. Genau das hat der Repo-Test „Interne Links“ nach der Übernahme gemeldet.
    """

    def test_relativer_pfad_faellt_durch(self):
        """tr-mitglied (echte Palace-Ausgabe): `](./rechtliches/…)` statt `](/tr/rechtliches/…)`."""
        befund = pa.interne_links("tr", koerper(pa.DOCS_DE / "mitglied.mdx"),
                                  koerper(TESTDATA / "palace-tr-mitglied.md"))
        self.assertTrue(befund, "relativer Link kam durch — das Tor sieht interne Links nicht")
        self.assertIn("interne Links", befund[0])

    def test_richtiger_locale_pfad_ist_gueltig(self):
        """Dieselbe Ausgabe mit `/tr/` statt `./` muss sauber durchgehen."""
        pa_body = koerper(TESTDATA / "palace-tr-mitglied.md").replace("](./", "](/tr/")
        befund = pa.interne_links("tr", koerper(pa.DOCS_DE / "mitglied.mdx"), pa_body)
        self.assertEqual(befund, [], f"korrekter Link abgelehnt: {befund}")

    def test_fehlender_link_faellt_durch(self):
        """Wird der Link ganz weggelassen, fehlt ein Pfad — auch das ist ein Strukturfehler."""
        pa_body = koerper(TESTDATA / "palace-tr-mitglied.md").replace("](./rechtliches/datenschutz/)", ")")
        befund = pa.interne_links("tr", koerper(pa.DOCS_DE / "mitglied.mdx"), pa_body)
        self.assertTrue(befund, "fehlender interner Link kam durch")

    def test_deutsche_quelle_hat_keine_eigenen_befunde(self):
        """Kontrolle gegen Fehlalarm: die Quelle gegen sich selbst, nur mit getauschtem Locale-Präfix."""
        de = koerper(pa.DOCS_DE / "mitglied.mdx")
        self.assertEqual(pa.interne_links("tr", de, de.replace("](/de/", "](/tr/")), [])


class ErfundeneDeutscheWoerter(unittest.TestCase):
    """`Fachkraft` → `Profi`: ein deutsches Wort, das in der Quelle gar nicht vorkommt.

    18.09.: ar/ka/sq-mitglied übersetzten die Stufe `Fachkraft` mit dem deutschen Wort `Profi`.
    Die Deutschanteil-Messung sieht das nicht (ein Wort, kein Satz), und das Repo verbietet `Profi`
    ausdrücklich (Test „Kein Profi/Profis als Wort oder Präfix“) — die Stufennamen kommen aus
    `stufen.profi` der jeweiligen Locale. Der Markenname `PROFiTEST` bleibt erlaubt.
    """

    def test_profi_faellt_durch(self):
        """ar-mitglied (echte Palace-Ausgabe): „Azubi أو Profi“."""
        befund = pa.verbotene_begriffe(koerper(TESTDATA / "palace-ar-mitglied.md"))
        self.assertTrue(befund, "„Profi“ kam durch — das Repo verbietet das Wort")
        self.assertIn("Profi", befund[0])

    def test_markenname_profitest_bleibt_gueltig(self):
        """PROFiTEST MF XTRA ist ein Produktname, kein Stufenname."""
        self.assertEqual(pa.verbotene_begriffe("Der PROFiTEST MF XTRA misst nach IEC 60364-6."), [])

    def test_saubere_seite_hat_keine_befunde(self):
        self.assertEqual(pa.verbotene_begriffe(koerper(TESTDATA / "palace-tr-lernfelder.md")), [])

if __name__ == "__main__":
    unittest.main(verbosity=2)
