# Elektrolehre — 8 dilli Elektrotechnik öğreti sitesi

**Bu faz şu olduğunda kapanır (Faz 0):** canlı URL'de `/de/`, `/tr/` (çeviri), `/ar/` (RTL) ve
çevirisi olmayan bir sayfa (Almanca + "henüz çevrilmedi" bandı) tarayıcıda görünüyor; site
GitHub Pages'te `noindex` ile yayında.

Son güncelleme: 8 Eyl 2026 — tasarım onaylandı, Faz 0 başladı.
Tasarım belgesi: `docs/superpowers/specs/2026-09-08-elektrolehre-design.md`

## Hedef
Almanca kaynaklı, ücretsiz, halka açık öğreti sitesi. Hedef kitle: Elektroniker/-in
Energie- und Gebäudetechnik Ausbildung'una başlayan, düşünen veya mesleğe sıfırdan ilgi duyanlar.
Üç bölüm: **Beruf** (rehber) · **Grundlagen** (sıfırdan temel) · **Anleitungen** (Unterverteilung,
Zählerplatz, Wechselschaltung). Artı 8 dilli Glossar ve her sayfada mini quiz.
Diller: de (kaynak), en, tr, ru, ar, fa, ka, sq. Almanca Fachbegriff hiçbir dilde kaybolmaz.

## Kadir'in kararları (8 Eyl 2026)
- Amaç: hem meslek rehberi hem öğreti; "Unterverteilung nasıl yapılır, Zähler nasıl bağlanır" gibi,
  mesleğe sıfır ve ilgi duyanlar için.
- Diller: Almanca, İngilizce, Türkçe, Gürcüce, Rusça, Arapça, Farsça, Arnavutça; kullanıcı seçer.
- Yol: Astro 7 + Starlight, GitHub Pages. İsim: **Elektrolehre** (çalışma adı, değişebilir).
- Yayın: Faz 0 sonunda, `noindex` ile (Impressum yazılınca Google'a açılır). Repo public.
- Çeviri: karma — Claude (glossar + UI dizgileri), lokal LM Studio 27B (makaleler); önce 1 makale ölçümü.

## Kanıt / örnekler (8 Eyl 2026 araştırması)
| Ne | Kanıt | Link |
|---|---|---|
| Konu talep görüyor | M1Molter "Unterverteiler mit FI und LS" 781k+ izlenme; ProofWood ~418k abone | https://www.youtube.com/playlist?list=PLjIab_J8lqW_ZFlJvvk0EHzRvLSrOlnZR |
| Rakipler tek dilli | elektrotechnik-fachwissen.de, ElektrikerWissen.de, simpleclub: hepsi yalnız Almanca | https://www.elektrotechnik-fachwissen.de/ |
| Teknik yol kanıtlı | docs.astro.build: Starlight, 15 dil, `ar` RTL, hreflang, fallback bandı | https://github.com/withastro/docs |
| Resmî içerik kaynağı | ElekAusbV 2021 (3,5 yıl), KMK Rahmenlehrplan 13 Lernfeld, BIBB Mindestvergütung 2026 | https://www.gesetze-im-internet.de/elekausbv_2021/ · https://www.kmk.org/fileadmin/Dateien/pdf/Bildung/BeruflicheBildung/rlp/Elektroniker-20-12-18-mEL.pdf · https://www.bibb.de/de/pressemitteilung_212952.php |
| Mevzuat çerçevesi | §13 NAV: Zähler/Hausanschluss yalnız kayıtlı Installateur; DIN VDE 0105-100 5 Sicherheitsregeln | https://www.gesetze-im-internet.de/nav/__13.html |
| Hukuk | §18 MStV: kamuya açık site → ad + adres; BayLDA: özel blog bile Datenschutzerklärung ister | https://www.lda.bayern.de/de/faq.html |
| Hosting 0 € | GitHub Pages public repo ücretsiz, 1 GB, 100 GB/ay | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |

## Mimari (özet)
Astro 7 + Starlight · içerik `src/content/docs/<dil>/*.mdx` · Almanca kaynak, eksik çeviri →
Almanca fallback + band · `glossar.json` tek kaynak · `<Quiz/>`, `<Sicherheit/>`, `<Glossar/>`,
`<Bild/>` bileşenleri · `scripts/translate.py` (LM Studio) · GitHub Actions → Pages.
Ayrıntı tasarım belgesinde.

## Alt görevler
### Faz 0 — İskelet + kanıt (bu oturum)
- [ ] Astro + Starlight kurulumu, 8 dil, `/de/` varsayılan, RTL (ar, fa)
- [ ] `ka.json`, `sq.json` UI dizgileri (Claude)
- [ ] Bileşenler: Sicherheit, Quiz, Bild (Glossar Faz 2)
- [ ] `anleitungen/unterverteilung` DE tam makale + quiz + 1 SVG şema
- [ ] Aynı makale TR ve AR (Claude), fallback kanıtı için KA boş
- [ ] Splash sayfası (DE), `noindex` bayrağı
- [ ] GitHub repo `ministeraskol/elektrolehre` (public), Actions workflow, Pages açık
- [ ] Kanıt: canlı URL ekran görüntüleri (de/tr/ar/fallback)

### Faz 1 — Almanca içerik (2-3 oturum)
- [ ] Beruf: berufsbild, lernfelder, weiterbildung
- [ ] Grundlagen: strom-spannung-widerstand, netz-und-leiterfarben, schutzorgane, sicherheitsregeln
- [ ] Anleitungen: zaehlerplatz, wechselschaltung-steckdose
- [ ] Her sayfa: `sources` listesi, quiz, gerekli SVG şemalar
- [ ] Rechtliches: haftungsausschluss (impressum/datenschutz Faz 3)

### Faz 2 — Çeviri hattı (1-2 oturum + gece)
- [ ] `scripts/translate.py` (LM Studio, terim kilidi, `translated: machine`)
- [ ] Ölçüm: 1 makale × 7 dil → kalite notu (özellikle ka, sq, fa)
- [ ] `glossar.json` 80 terim × 8 dil (Claude)
- [ ] Tüm sayfalar 7 dile; makine notu görünür

### Faz 3 — Google'a açılış (1 oturum, Kadir'in bilgisi gerekir)
- [ ] Impressum (ad + adres), Datenschutzerklärung (server-log, cookie yok)
- [ ] `noindex` kaldır, Google Search Console'a sitemap
- [ ] (ops.) özel alan adı

### Faz 4 — Sürekli
- [ ] Kreuzschaltung, Herdanschluss, Messen/Prüfen, Fehlersuche
- [ ] Lernfeld bazlı görünüm, Karteikarten

## Sıradaki somut adım
Faz 0: `npm create astro@latest -- --template starlight` ile iskelet, 8 dil konfigürasyonu.

## Kadir'den beklenen karar / eylem
1. **Faz 3 öncesi:** Impressum için ad + adres (kamuya açık Almanca site şartı, §18 MStV).
2. Özel alan adı istiyor mu (~10 €/yıl, tek ücretli kalem).
3. Faz 2 ölçümünden sonra: ka/sq/fa makine çevirisi yetersizse Claude'a düşülsün mü.

## Belirsizlikler
- Lokal 27B modelin Gürcüce/Arnavutça/Farsça kalitesi — Faz 2'de 1 makaleyle ölçülecek.
- Starlight'ta fa/ka/sq UI dizgilerinin yerleşik olup olmadığı — kurulumda doğrulanacak.
- Astro 7 çok yeni (Sätteri Markdown motoru); remark eklentisi gerekirse ek paket.

## Dersler
(henüz yok)
