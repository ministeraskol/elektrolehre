# Elektrolehre — Tasarım Belgesi

**Tarih:** 8 Eylül 2026 · **Durum:** Kadir onayladı (8 Eyl 2026, üç karar: tasarım + Astro/Starlight, Faz 0 sonunda noindex yayın, karma çeviri)

## 1. Amaç

Almanca kaynaklı, 8 dilli, ücretsiz ve halka açık öğreti sitesi. Hedef kitle: Almanya'da
**Elektroniker/-in Fachrichtung Energie- und Gebäudetechnik** Ausbildung'una başlayan, başlamayı
düşünen veya mesleğe sıfırdan ilgi duyan kişiler. Üç bölüm:

1. **Beruf** — meslek rehberi (Ausbildung, 13 Lernfeld, Vergütung, Weiterbildung).
2. **Grundlagen** — sıfırdan temel (Strom/Spannung/Widerstand, Netz, Schutzorgane, Sicherheitsregeln).
3. **Anleitungen** — adım adım uygulama (Unterverteilung aufbauen, Zählerplatz/Zähler anschließen, Wechselschaltung).

Artı: 8 dilli **Glossar** ve her içerik sayfasında **mini quiz**.

## 2. İlkeler

- **Almanca Fachbegriff sabittir.** Hiçbir dilde çevrilip kaybolmaz; terim Almanca kalır, açıklama
  seçilen dilde. Ausbildung ve sınav Almanca; öğrenci kelimeyi Almanca öğrenmeli.
- **Almanca kaynak dildir.** Diğer 7 dil çeviridir. Çevirisi olmayan sayfa aynı URL'de Almanca
  içerikle açılır, üstte "henüz çevrilmedi" bandı çıkar (Starlight fallback). 8 dil ilk günden gezilir.
- **Güvenlik çerçevesi.** Her Anleitung `5 Sicherheitsregeln` (DIN VDE 0105-100) ve yasal notla başlar:
  elektrik tesisatında yalnız Elektrofachkraft çalışır (DGUV V3); Zähler/Hausanschluss işini yalnız
  Netzbetreiber'in Installateurverzeichnis'ine kayıtlı işletme yapar (§13 NAV). İçerik "Ausbildung'da
  böyle öğrenirsin, gözetim altında böyle yaparsın" çerçevesinde; DIY talimatı değil.
- **Kaynaklı içerik.** Her sayfa front matter'da `sources` listesi taşır (norm, resmî kurum, yasa).
  Rakamlar (Vergütung, süre, Lernfeld saatleri) resmî kaynaktan; ezberden yazılmaz.
- **0 €.** Astro/Starlight (MIT), GitHub Pages (public repo), lokal LM Studio çeviri. Özel alan adı
  ayrı karar (~10 €/yıl).
- **MVP önce.** Ana işlev (gezinti, fallback, RTL, bir tam makale) çalışmadan süsleme yok.

## 3. Kapsam

**MVP (Faz 0-2), Almanca 12 içerik sayfası + 3 hukuk sayfası:**

| Bölüm | Slug (DE) | İçerik |
|---|---|---|
| Start | `index` | Splash: site nedir, 3 giriş yolu, dil seçici |
| Beruf | `beruf/berufsbild` | Unvan, ElekAusbV 2021, 3,5 yıl, gestreckte Prüfung, Voraussetzungen, Vergütung 2026 (Mindest 724/854/977/1.014 €; Tarif örn. BW 1.140–1.390 €) |
| Beruf | `beruf/lernfelder` | KMK Rahmenlehrplan 18.12.2020: 13 Lernfeld, saatleriyle |
| Beruf | `beruf/weiterbildung` | Meister, Staatl. gepr. Techniker, Studium; Ausbildungsplatz bulma (Arbeitsagentur, e-zubis) |
| Grundlagen | `grundlagen/strom-spannung-widerstand` | Ohmsches Gesetz, Leistung, ev örnekleri |
| Grundlagen | `grundlagen/netz-und-leiterfarben` | 230/400 V, L1 L2 L3 N PE, Leiterfarben, TN-Systeme temel |
| Grundlagen | `grundlagen/schutzorgane` | LS-Schalter, RCD/FI, SLS, Überspannungsschutz: ne yapar |
| Grundlagen | `grundlagen/sicherheitsregeln` | 5 Sicherheitsregeln; Elektrofachkraft, §13 NAV: kim ne yapabilir |
| Anleitungen | `anleitungen/unterverteilung` | Planung (DIN 18015), Aufbau, RCD-Gruppen, Verdrahtung, Beschriftung, Erstprüfung (DIN VDE 0100-600) |
| Anleitungen | `anleitungen/zaehlerplatz` | HAK → Hauptleitung → SLS → Zählerfeld (eHZ) → Verteilerfeld; VDE-AR-N 4100, TAB; Inbetriebsetzung/Verplombung Netzbetreiber |
| Anleitungen | `anleitungen/wechselschaltung-steckdose` | Ausschaltung, Wechselschaltung, Steckdose; Schaltplan + Verdrahtung + Prüfung |
| Glossar | `glossar` | ~80 Fachwort, 8 dil, tek veri dosyasından |
| Rechtliches | `rechtliches/impressum`, `datenschutz`, `haftungsausschluss` | Yayın öncesi Kadir'in bilgisiyle dolar |

**Kapsam dışı (şimdilik):** kullanıcı hesabı, yorum, ilerleme kaydı, video üretimi, ücretli içerik,
Elektroniker dışı meslekler.

## 4. Mimari

**Yığın:** Astro 7 + Starlight (0.42+), Node 26, GitHub Pages. Klasör `C:\Users\kadir\Projects\Elektrolehre`.

```
Elektrolehre/
  ROADMAP.md                      proje gerçeği (tek kaynak)
  astro.config.mjs                site, base, i18n, sidebar, head (noindex bayrağı)
  src/content.config.ts           docs şeması (genişletilmiş) + i18n koleksiyonu
  src/content/docs/de/**          KAYNAK içerik (Markdown/MDX)
  src/content/docs/{en,tr,ru,ar,fa,ka,sq}/**   çeviriler (eksikse fallback)
  src/content/i18n/ka.json, sq.json   Starlight UI dizgileri (yerleşik olmayan diller)
  src/data/glossar.json           [{de, en, tr, ru, ar, fa, ka, sq, hinweis}] tek kaynak
  src/components/Quiz.astro       MDX içinde <Quiz fragen={[...]}/>; vanilla JS, anında geri bildirim
  src/components/Sicherheit.astro 5 Sicherheitsregeln + yasal not (her Anleitung'un başı)
  src/components/Glossar.astro    glossar.json'u aktif dile göre tablo yapar
  src/components/Bild.astro       görsel + kaynak + lisans satırı (Commons atıf)
  src/assets/schemata/*.svg       kendi çizdiğimiz şemalar
  scripts/translate.py            LM Studio ile Markdown çeviri (terim kilidi)
  .github/workflows/deploy.yml    withastro/action → GitHub Pages
  docs/superpowers/specs|plans    tasarım ve plan belgeleri
```

**Diller ve yönlendirme:** `defaultLocale: 'de'`, tüm diller ön ekli (`/de/`, `/tr/` …). Kök `/`
→ `/de/` yönlendirmesi.

| Kod | Dil | Yön | Starlight UI dizgisi |
|---|---|---|---|
| de | Deutsch (kaynak) | ltr | yerleşik |
| en | English | ltr | yerleşik |
| tr | Türkçe | ltr | yerleşik |
| ru | Русский | ltr | yerleşik |
| ar | العربية | **rtl** | yerleşik |
| fa | فارسی | **rtl** | yerleşik (kurulumda doğrulanır) |
| ka | ქართული | ltr | yok → `ka.json` (~40 dizgi, Claude) |
| sq | Shqip | ltr | yok → `sq.json` (~40 dizgi, Claude) |

**İçerik şeması (docs front matter, Starlight şeması genişletilir):**

```yaml
title: Unterverteilung aufbauen
description: ...
translated: source | machine | reviewed   # de sayfalarında source
sources:
  - { title: "DIN VDE 0100-600", url: "https://..." }
lernfeld: [2, 5]          # isteğe bağlı
stufe: einstieg | azubi   # isteğe bağlı
```

`translated: machine` sayfalarda küçük not: "Makine çevirisi. Almanca sürüm bağlayıcıdır."

**Glossar:** tek `glossar.json`; `<Glossar/>` bileşeni aktif dile göre iki sütun (Almanca terim +
seçilen dilde karşılık/açıklama) çizer. 8 ayrı tablo yazılmaz; tek kaynak.

**Quiz:** MDX içinde `<Quiz fragen={[{ f: "...", a: ["..",".."], r: 1, e: "açıklama" }]} />`.
Sunucu yok; cevap yerelde kontrol edilir, doğru/yanlış + açıklama gösterilir. Quiz soruları
sayfa diliyle birlikte çevrilir (MDX içinde durur).

**Görseller:** Öncelik kendi SVG şemalarımız (`src/assets/schemata`). Dış görsel yalnız Wikimedia
Commons/Openclipart; CC BY-SA → `<Bild/>` yazar + lisans + link gösterir; CC0/PD serbest.
Shutterstock kaynaklı kurum broşürü görselleri kullanılmaz.

**Yayın:** repo `ministeraskol/elektrolehre` (public). Site `https://ministeraskol.github.io/elektrolehre/`,
`base: '/elektrolehre'`. Impressum/Datenschutz dolana kadar `<meta name="robots" content="noindex">`
(config'te tek bayrak). Özel alan adı gelirse `public/CNAME` + `base` kaldırılır.

## 5. Çeviri hattı (karma)

1. **Claude (oturum içi):** UI dizgileri (`ka.json`, `sq.json`), `glossar.json`'ın 7 dil sütunu,
   splash sayfası. Küçük hacim, yüksek etki.
2. **Lokal model (LM Studio, OpenAI-uyumlu uç):** uzun makaleler. `scripts/translate.py`:
   - Girdi: `src/content/docs/de/<yol>.mdx`; çıktı: `src/content/docs/<dil>/<yol>.mdx`.
   - Front matter korunur, `translated: machine` yazılır; `<Quiz>`/`<Sicherheit>` etiketleri korunur,
     yalnız metin alanları çevrilir.
   - **Terim kilidi:** `glossar.json`'daki Almanca terimler çeviride Almanca kalır (ilk geçişte
     parantez içinde yerel karşılık). Sistem promptu sabit (KV cache).
   - Önce **1 makale × 7 dil** ölçümü; ka/sq/fa kalitesi kabul edilemezse o diller için Claude'a
     düşülür (karar Kadir'in).
3. Eksik sayfa → Almanca fallback + band. Hiçbir dilde boş sayfa yok.

## 6. Hata ve sınır durumları

- Çeviri eksik → fallback (Starlight). Build kırılmaz.
- LM Studio kapalı → `translate.py` açık hata mesajı verir, dosya yazmaz.
- Kırık iç link → build'de `starlight-links-validator` (opsiyonel, Faz 1'de eklenir).
- RTL'de SVG şemalar yön değiştirmez (`dir="ltr"` sarmalayıcı); şemalar evrensel.
- `noindex` bayrağı yanlışlıkla kalkmasın: config'te tek sabit, ROADMAP'te açık madde.

## 7. Test / kanıt

- `npm run build` hatasız.
- Tarayıcıda: `/de/anleitungen/unterverteilung/` tam makale + quiz çalışıyor;
  `/tr/...` çevrilmiş sayfa; `/ar/...` `<html dir="rtl">`; çevirisi olmayan bir sayfa `/ka/...`
  Almanca + band; dil seçici 8 dil listeliyor; `view-source`'ta hreflang 8 satır ve `noindex`.
- Canlı URL açılıyor (Faz 0 sonu).

## 8. Fazlar ve bitti tanımları

| Faz | İş | Bitti tanımı |
|---|---|---|
| 0 | Kurulum, 8 dil, RTL, bileşenler, `unterverteilung` DE + TR + AR, workflow, repo, Pages (noindex) | Canlı URL'de /de/, /tr/, /ar/ ve bir fallback sayfası görünüyor |
| 1 | Kalan 11 Almanca sayfa + quiz + SVG şemalar + kaynak linkleri | Tüm DE sayfalar yayında, quiz çalışıyor |
| 2 | `translate.py`, 1 makale ölçümü, 7 dil tam çeviri, `ka.json`/`sq.json`, glossar 8 dil | Her dilde tam gezinti, makine notu görünür |
| 3 | Impressum + Datenschutz (Kadir'in bilgisiyle), `noindex` kaldır, sitemap gönder | Google'a açık |
| 4 | Yeni Anleitungen: Kreuzschaltung, Herdanschluss, Messen/Prüfen, Fehlersuche; Lernfeld bazlı görünüm | sürekli |

## 9. Açık kararlar (Kadir)

- Impressum içeriği: ad + adres (§18 MStV) — Faz 3 öncesi.
- Özel alan adı istenip istenmediği (~10 €/yıl).
- ka/sq/fa makine çevirisi kalitesi yetersiz çıkarsa: Claude'a düş mü, Almanca fallback'te kalsın mı.
