# Elektrolehre — 8 dilli Elektrotechnik öğreti sitesi

**Bu faz şu olduğunda kapanır (Faz 2):** `scripts/translate.py` çalışıyor, 1 makale × 7 dil ölçümü
yapılmış ve kalite notu ROADMAP'te, `glossar.json` 80 terim × 8 dil + `Glossar.astro` canlıda.

Son güncelleme: 11 Eyl 2026 — **Faz 1 BİTTİ** (lokal build + 44 test), deploy push'la tetiklendi; canlı kanıt tablosu aşağıda.
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
- **Alan adı (11 Eyl 2026): `stromcoach.de`** (Kadir'in son kararı; DENIC'te boş). Kayıt INWX (~4,30 €/yıl),
  DNS isteğe bağlı Cloudflare Free (Registrar .de satmıyor). Sonra `BASE = ''`, `public/CNAME`, HTTPS.
  Site başlığı şimdilik "Elektrolehre" (ayrı karar). Elenen: wattwas (önce seçildi, vazgeçildi), zumstrom,
  zumelektronik, elektro1x1 / stromgeselle (yedek).

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

### Faz 1 — Almanca içerik ✅ (11 Eyl 2026, tek oturum)
- [x] Beruf: `beruf/berufsbild`, `beruf/lernfelder`, `beruf/weiterbildung`; sidebar 4 grup (Beruf, Grundlagen, Anleitungen, Rechtliches), 8 dilde etiket
- [x] Grundlagen: `strom-spannung-widerstand`, `netz-und-leiterfarben`, `schutzorgane`, `sicherheitsregeln`
- [x] Anleitungen: `zaehlerplatz` (+ `ZaehlerplatzSchema`), `wechselschaltung-steckdose` (+ `WechselschaltungSchema`)
- [x] Her sayfa: `sources` (resmî: ElekAusbV, KMK PDF, BIBB, BBiG, HwO, NAV, DIN VDE, VDE-AR-N 4100, BG ETEM, DGUV V3), 5 soru quiz; `Bild.astro` + ilk Commons görseli (CC0) Schutzorgane'de
- [x] Rechtliches: `haftungsausschluss` (impressum/datenschutz Faz 3)
- [x] `starlight-links-validator` 0.26 (göreli link ve fallback izinli); Startseite kartları `LinkCard`
- [x] `check-site.mjs` 44 kontrol (Faz 1 sayfaları, şemalar, Bild lisansı, sidebar grupları)

**Faz 1 kaynak doğrulaması (11 Eyl 2026):** BIBB PM 13.10.2025 Mindestvergütung 2026 = 724/854/977/1.014 € ✓ ·
IG Metall BW Elektrohandwerk ab 1.3.2026 = 1.140/1.190/1.290/1.390 € ✓ · ElekAusbV §2 3,5 yıl, §6 Teil 1 4. Halbjahr,
§15 ağırlıklar 30/36/12/12/10 ✓ · KMK Rahmenlehrplan 18.12.2020: 13 Lernfeld, 1020 Std (320/280/280/140) ✓ (PDF pdftotext) ·
HwO §51 Abs. 2 „Bachelor Professional" ✓ · KMK 06.03.2009 Hochschulzugang ✓.
**Yazılmayan:** Ausbildungsanfänger Schulabschluss yüzdeleri (resmî BIBB Datenblatt bulunamadı; ticari sitelerden alınmadı).

### Faz 2 — Çeviri hattı (1-2 oturum + gece)
- [ ] `scripts/translate.py` (LM Studio, terim kilidi, `translated: machine`)
- [ ] Ölçüm: 1 makale × 7 dil → kalite notu (özellikle ka, sq, fa)
- [ ] `glossar.json` 80 terim × 8 dil (Claude) + `Glossar.astro`
- [ ] Tüm sayfalar 7 dile; makine notu görünür

### Faz 3 — Google'a açılış (1 oturum, Kadir'in bilgisi gerekir)
- [ ] Impressum (ad + adres), Datenschutzerklärung (server-log, cookie yok)
- [ ] `NOINDEX = false`, Google Search Console'a sitemap
- [ ] Özel alan adı **stromcoach.de**: Kadir kaydeder + DNS (CNAME `www`→`ministeraskol.github.io`, apex A kayıtları 185.199.108-111.153) → `BASE = ''`, `site: 'https://stromcoach.de'`, `public/CNAME`, Pages'te "Enforce HTTPS"; `check-site.mjs` base testleri güncellenir

### Faz 4 — Sürekli
- [ ] Kreuzschaltung, Herdanschluss, Messen/Prüfen, Fehlersuche
- [ ] Lernfeld bazlı görünüm, Karteikarten

## Sıradaki somut adım
Faz 2, ilk iş: `scripts/translate.py` — LM Studio (27B) ile `de/grundlagen/strom-spannung-widerstand.mdx`'i
7 dile çevir (terim kilidi: Almanca Fachbegriff parantezle; front matter `translated: machine`; MDX import/bileşen
satırlarına dokunma). Sonra ka/sq/fa çıktısını Claude okuyup kalite notu ROADMAP'e. `tr/index.mdx` ve `ar/index.mdx`
kartları `LinkCard`'a çevrilir (de ile aynı).

## Kadir'den beklenen karar / eylem
1. **Faz 3 öncesi:** Impressum için ad + adres (kamuya açık Almanca site şartı, §18 MStV).
2. ~~Özel alan adı~~ → **stromcoach.de** seçildi; Kadir'in kaydetmesi bekleniyor (~10 €/yıl).
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
- **Faz 1 dersi:** `python - <<'EOF'` (tırnaklı EOF) heredoc'u bu ortamda çalıştı; kırılan düz `cat <<EOF`. Çoklu dosya yaması için python heredoc güvenli.
- **Faz 1 dersi:** Rakamlar için PDF kaynak (KMK) WebFetch'te okunamıyor → `curl` + `pdftotext -layout` (mingw'de var). gesetze-im-internet'te tam metin `BJNR…html` 404 verebiliyor; `__N.html` paragraf sayfaları çalışıyor.
- **Faz 1 dersi:** Starlight `LinkCard` göreli `href`'i olduğu gibi basar (`./beruf/…`), tarayıcı çözer; test göreli değeri aramalı.
