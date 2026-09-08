# Elektrolehre — 8 dilli Elektrotechnik öğreti sitesi

**Bu faz şu olduğunda kapanır (Faz 1):** 12 Almanca içerik sayfasının tümü canlıda, her
sayfada quiz + kaynak listesi, `npm test` yeşil.

Son güncelleme: 8 Eyl 2026 — **Faz 0 BİTTİ**, site canlıda (noindex).
Canlı: https://ministeraskol.github.io/elektrolehre/ · Repo: https://github.com/ministeraskol/elektrolehre
Tasarım: `docs/superpowers/specs/2026-09-08-elektrolehre-design.md` · Faz 0 planı: `docs/superpowers/plans/2026-09-08-faz0-iskelet.md`

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
- Yayın: Faz 0 sonunda, `noindex` ile (Impressum yazılınca Google'a açılır). Repo public. ✅ yapıldı.
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

## Faz 0 kanıtı (8 Eyl 2026, canlı URL'de curl ile)
| Kontrol | Sonuç |
|---|---|
| `/de/anleitungen/unterverteilung/` | 200 |
| `/` → `/elektrolehre/de/` yönlendirme | çalışıyor |
| `/ar/...` `dir="rtl"` | evet |
| `/ka/...` Almanca içerik + Gürcüce "henüz çevrilmedi" bandı | evet |
| `/sq/...` Arnavutça band | evet |
| `/tr/...` çeviri + "makine çevirisi" notu | evet |
| `noindex` meta, hreflang (8 dil + x-default), sitemap | evet |
| `npm test` | 27/27 |

## Mimari (özet)
Astro 7.3 + Starlight 0.42 · içerik `src/content/docs/<dil>/*.mdx` · Almanca kaynak, eksik çeviri →
Almanca fallback + band · bileşenler: `Sicherheit`, `Quiz`, `Quellen`, `Uebersetzungshinweis`,
`MarkdownContent` override (çeviri notu + kaynak listesini otomatik ekler), `schemata/UnterverteilungSchema`
(SVG, currentColor) · `scripts/check-site.mjs` dist doğrulaması (`npm test`) · GitHub Actions → Pages.
Ayrıntı tasarım belgesinde.

## Alt görevler
### Faz 0 — İskelet + kanıt ✅ (8 Eyl 2026)
- [x] Astro + Starlight kurulumu, 8 dil, `/de/` varsayılan, RTL (ar, fa)
- [x] `ka.json`, `sq.json` UI dizgileri (Claude; anadil kontrolü bekliyor)
- [x] Bileşenler: Sicherheit, Quiz, Quellen, Übersetzungshinweis (Bild → Faz 1, görsel henüz yok)
- [x] `anleitungen/unterverteilung` DE tam makale + 5 soru quiz + SVG şema, 6 kaynak
- [x] Aynı makale TR ve AR (Claude, `translated: machine`); ka/sq/en/ru/fa fallback
- [x] Splash sayfası DE/TR/AR, `noindex` bayrağı
- [x] GitHub repo `ministeraskol/elektrolehre` (public), Actions workflow, Pages açık, ilk deploy başarılı
- [x] Kanıt: canlı curl tablosu yukarıda

### Faz 1 — Almanca içerik (2-3 oturum)
- [ ] Beruf: `beruf/berufsbild`, `beruf/lernfelder`, `beruf/weiterbildung` (sidebar'a Beruf grubu eklenir)
- [ ] Grundlagen: `strom-spannung-widerstand`, `netz-und-leiterfarben`, `schutzorgane`, `sicherheitsregeln`
- [ ] Anleitungen: `zaehlerplatz`, `wechselschaltung-steckdose`
- [ ] Her sayfa: `sources` listesi, quiz, gerekli SVG şemalar; `Bild.astro` ilk dış görselle
- [ ] Rechtliches: `haftungsausschluss` (impressum/datenschutz Faz 3)
- [ ] `starlight-links-validator` ekle (kırık iç link build'i kırsın)

### Faz 2 — Çeviri hattı (1-2 oturum + gece)
- [ ] `scripts/translate.py` (LM Studio, terim kilidi, `translated: machine`)
- [ ] Ölçüm: 1 makale × 7 dil → kalite notu (özellikle ka, sq, fa)
- [ ] `glossar.json` 80 terim × 8 dil (Claude) + `Glossar.astro`
- [ ] Tüm sayfalar 7 dile; makine notu görünür

### Faz 3 — Google'a açılış (1 oturum, Kadir'in bilgisi gerekir)
- [ ] Impressum (ad + adres), Datenschutzerklärung (server-log, cookie yok)
- [ ] `NOINDEX = false`, Google Search Console'a sitemap
- [ ] (ops.) özel alan adı → `BASE = ''`, `public/CNAME`

### Faz 4 — Sürekli
- [ ] Kreuzschaltung, Herdanschluss, Messen/Prüfen, Fehlersuche
- [ ] Lernfeld bazlı görünüm, Karteikarten

## Sıradaki somut adım
Faz 1, ilk sayfa: `src/content/docs/de/beruf/berufsbild.mdx` — ElekAusbV 2021, 3,5 yıl, gestreckte
Prüfung, Voraussetzungen, Vergütung 2026 (Mindest 724/854/977/1.014 €; Tarif BW 1.140–1.390 €),
kaynak linkleri araştırma raporunda. Sidebar'a `Beruf` grubu eklenir.

## Kadir'den beklenen karar / eylem
1. **Faz 3 öncesi:** Impressum için ad + adres (kamuya açık Almanca site şartı, §18 MStV).
2. Özel alan adı istiyor mu (~10 €/yıl, tek ücretli kalem).
3. Faz 2 ölçümünden sonra: ka/sq/fa makine çevirisi yetersizse Claude'a düşülsün mü.
4. İsteğe bağlı: `/tr/anleitungen/unterverteilung/` sayfasını okuyup onaylarsa `translated: reviewed` yapılır.

## Belirsizlikler
- Lokal 27B modelin Gürcüce/Arnavutça/Farsça kalitesi — Faz 2'de 1 makaleyle ölçülecek.
- Headless Chrome/Edge ekran görüntüsü bu makinede dosya yazmadı (açık tarayıcı oturumu devralıyor olabilir); kanıt curl ile alındı.
- Astro 7 çok yeni; remark eklentisi gerekirse `@astrojs/markdown-remark`.

## Dersler
- **Ne işe yaradı:** `scripts/check-site.mjs` dist doğrulaması — Starlight'ın üç sürprizini (sidebar şekli, base'siz hero linki, kök yönlendirme yok) ilk build'de yakaladı; tarayıcıya bakmadan 27 kontrol.
- **Neyi bir daha yapma:** içerikte mutlak `/de/...` link yazma — Starlight hero/markdown linklerine `base` eklemiyor; göreli link (`./anleitungen/...`) her iki durumda çalışır.
- **Kural:** Starlight 0.39+ sidebar grubu `items: [{ autogenerate }]` ister; Astro `redirects` hedefe `base` eklemez → `${BASE}/de/`; UI JSON'u olmayan dilde fallback bandı **varsayılan dilin** (de) metniyle çıkar, İngilizce değil.
- Kimlik: git kimliği global değil, repoya lokal (`git config user.*`); Bash heredoc bu ortamda kırılıyor → dosyaları Write ile yaz.
