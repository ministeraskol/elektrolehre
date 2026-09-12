# wattwas — Elektrotechnik. Einfach erklärt. (9 dil, medya markası)

**Bu faz şu olduğunda kapanır (Büyüme, ilk döngü):** `wattwas` hesapları açık, ilk 3 Shorts yayında, Search Console
doğrulanmış ve ilk 4 haftalık veri ROADMAP'te; Faz 4'ten 2 yeni sayfa 8 dilde canlıda.

Son güncelleme: 13 Eyl 2026 gece — **TP1 Fundament (Neuaufbau, branch tp1-fundament) kodlandı, push yok**: D1 katalog düzeni (grafit + Elektro-Blau, koyu varsayılan, yalnız Inter), Header (tabs, Strg K, Stufen-Chip), Sidebar rozetleri, Stufen einstieg/azubi/profi, boş Startseite, /entdecken/ + /lernen/ (9 dil), sosyal/video gizli + Locale-Fix (starlightRoute.locale, /leicht/ zeigt Leichte Sprache); ≈113 test. Kadir'in görsel onayı bekleniyor (Task 13). Önceki: 12 Eyl 2026 öğle — **wattwas markası + yeni yapı canlı** (dark-first "Electric Editorial", /themen /grundlagen /elektrowerkzeuge /blog /ueber, Leichte Sprache, sosyal kanallar önde, 208 sayfa, 78 test; kararlar `docs/superpowers/specs/2026-09-12-electric-editorial.md`). Sabah: **Redesign canlı** (şematik tema: slate/beyaz/amber, Space Grotesk + Inter self-hosted, Hero devre animasyonu, Lernpfad + okuma ilerlemesi, Fachbegriff otomatik işaretleme; karar tablosu `docs/superpowers/specs/2026-09-12-redesign-schaltplan.md`; 70 test). Önceki: 11 Eyl 2026 gece — **Faz 0–3 BİTTİ, MVP tam**: https://wattwas.de 12 sayfa × 8 dil + Glossar, Impressum, Google'a açık. Sırada Büyüme (video, Search Console, Faz 4 içerik).
Canlı: **https://wattwas.de/** (eski: ministeraskol.github.io/elektrolehre → yönlendirir) · Repo: https://github.com/ministeraskol/elektrolehre
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
- **Alan adı (11 Eyl 2026): `wattwas.de` — ALINDI** (INWX, Kadir). Stromcoach'a geçilmişti, kayıt yanlışlıkla
  wattwas'a yapıldı; wattwas kalıyor (ilk tercih, iyi ad). `stromcoach.de` boş; istenirse ~5 €/yıl ek alınıp
  wattwas'a yönlendirilir. DNS isteğe bağlı Cloudflare Free (Registrar .de satmıyor). Sonra `BASE = ''`,
  `public/CNAME`, HTTPS. Site başlığı şimdilik "Elektrolehre" (ayrı karar).

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

## wattwas.de kanıtı (11 Eyl 2026, curl)
| Kontrol | Sonuç |
|---|---|
| `http://wattwas.de/` | 301 → `https://wattwas.de/` |
| `https://wattwas.de/` → `/de/` | 200 |
| `https://wattwas.de/tr/anleitungen/unterverteilung/` | 200 |
| `https://wattwas.de/ar/beruf/berufsbild/` | 200, `dir="rtl"` |
| Eski `ministeraskol.github.io/elektrolehre/de/...` | 301 → `https://wattwas.de/de/...` |
| hreflang / sitemap | `https://wattwas.de/...` |
| Pages API | `cname=wattwas.de`, `https_enforced=true`, cert `approved` |
| `www.wattwas.de` | TLS OK, sertifika SAN: wattwas.de + www (bitiş 10 Ara 2026, otomatik yenilenir); http://www → 301 https://wattwas.de |
| `npm test` | 46/46 |

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

### Faz 2 — Çeviri hattı ✅ (11 Eyl 2026 gece, tek oturum)
- [x] `scripts/translate.py` — OpenCode worker (GLM 5.3 Flash, `--variant low`) ile; terim kilidi, front matter/import/quiz/
  kaynak doğrulaması, YAML tırnak onarımı; mevcut dosyayı atlar, `--force` ile yeniler
- [x] Ölçüm 1 makale × 7 dil: **hepsi kullanılabilir.** en/tr/ru/ar iyi; ka/sq iyi (sq'da "seksion kryq" kalkı → "prerje tërthore"
  elle); fa'da tek İngilizce sızıntı ("holds") elle. Kimi K3'e dokunulmadı (kota).
- [x] `glossar.json` 89 terim × 8 dil + `Glossar.astro` + sidebar linki; ka glossar'ı Claude yazdı (worker 2× boş döndü)
- [x] 12 sayfa × 8 dil = 96 içerik sayfası + 8 glossar + 8 splash; `rechtliches/*` kasıtlı Almanca fallback; 121 sayfa build, 60 test
- [x] Tüm çeviriler `translated: machine`, çeviri notu görünür; en/ru/fa/ka/sq splash sayfaları Claude

### Faz 3 — Google'a açılış ✅ (11 Eyl 2026, aynı akşam; Kadir trafik için Impressum'u onayladı)
- [x] Özel alan adı wattwas.de canlı, HTTPS zorunlu, eski URL yönlendiriyor
- [x] `rechtliches/impressum` (§ 5 DDG / § 18 MStV, ad + adres, iletişim GitHub Issues, CC BY-SA 4.0 lisans notu)
- [x] `rechtliches/datenschutz` (GitHub Pages logları, Wikimedia Commons hotlink, localStorage tema, cookie/analiz yok, LfDI BW)
- [x] `NOINDEX = false`; `public/robots.txt` + Sitemap satırı; `check-site.mjs` 50 kontrol (noindex yalnız kök yönlendirme sayfasında)
- [ ] **Google Search Console** (Kadir'in Google hesabı gerekir): wattwas.de eklenir, doğrulama HTML dosyası bana verilir →
  `public/`'e koyarım → sitemap `https://wattwas.de/sitemap-index.xml` gönderilir. Bing Webmaster aynı şekilde.
- Kişisel veri sınırı: ad + adres yalnız bu iki sayfada; e-posta hiçbir yerde; commit kimliği noreply (geçmiş temizlendi).
- [x] Özel alan adı **wattwas.de** canlı (11 Eyl 2026): DNS INWX API ile girildi (4×A GitHub Pages + CNAME www), `BASE = ''`,
  `site: 'https://wattwas.de'`, `public/CNAME`, Pages custom domain API ile set; `check-site.mjs` 46 kontrol. HTTPS: sertifika
  verildi, `https_enforced=true` (API). Kanıt tablosu aşağıda.

### Büyüme — site yönetimi Joseph'te (Kadir'in kararı, 11 Eyl 2026 gece)
Hedef: asgari yıllık masrafı (~4,30 €) çıkarmak; Kadir'in dileği 50k €/yıl (birikim). Reklamla değil ürün/B2B ile.
**Hukuki durum:** Kadir 11 Eyl 2026: "benim iznim var" (serbest çalışma / ürün satışı için). Joseph-Kiti ROADMAP'indeki
§ 61 AsylG bayrağı buna göre güncellenir. Kadir'den istenen tek şey: izin belgesinin (Ausländerbehörde yazısı, "selbstständige
Tätigkeit gestattet" ibaresi) bir kopyasını `Projects\AI-Plaza\downloads`'a koyması — gelir başlayınca Gewerbeanmeldung ve
Impressum güncellemesinde lazım. Gelir basamakları izin doğrultusunda açılabilir; Asylleistungen alınıyorsa her gelir beyana tabi.

| Basamak | Ne | Şart |
|---|---|---|
| 1 | Trafik + e-posta listesi (Azubi-Newsletter) | şimdi |
| 2 | Ausbildungsbetriebe ilanı (çok dilli aday kitlesi), 50–150 €/ay | izin + 1000 ziyaretçi/ay |
| 3 | Prüfungsvorbereitung ürünü (Karteikarten/PDF, 9–29 €) — izin öncesi hazır bekler | izin + 30+ sayfa |
| 4 | B2B lisans (Berufsschule, Bildungsträger) | izin + referans |
| 5 | YouTube/Shorts geliri | izin |

**Video planı (Kadir onayladı 11 Eyl):** kanal adı `wattwas` (TikTok/Instagram/YouTube, Kadir açar) · dikey Shorts
30–60 sn, yüzsüz: SVG şema + yazı + Almanca TTS (edge-tts), altyazılı TR/AR/RU sürümler · seriler: "Fehler des Tages",
"In 30 Sekunden", "Azubi-Fakten 2026", "Quiz" · haftada 3 · üretim Joseph (ffmpeg, 0 €), yükleme başta Kadir elle.
İlk 3 video: 5 Sicherheitsregeln · Leiterfarben · N zweier RCD-Gruppen.
**Haftalık rutin (Joseph):** 1–2 yeni sayfa + çeviri · Search Console verisi · 1 dağıtım eylemi · ROADMAP'e sayılar.

### Redesign — şematik tema ✅ (12 Eyl 2026)
- [x] `wattwas.css` tema (3 renk, WCAG AA: beyazda amber metin `#B45309`), kopfzeile her temada slate, Blaupause ızgarası
- [x] Hero override: başlık/tagline frontmatter'dan (metin korundu), CTA, 8 dil rozeti, `HeroSchaltkreis` (CSS `offset-path` akım impulsu)
- [x] Startseite: K1–K3 bauteil kartları, Lernpfad (4 bölüm, okuma süresi, Lernfeld etiketi, localStorage ilerleme), Anleitung kartları (Stufe rozeti)
- [x] Footer override: diller, Rechtliches, ücretsiz/CC BY-SA notu, uyarı
- [x] `rehype-fachbegriff`: 89 glossar terimi sayfa başına ilk geçişte `<dfn>` + glossar ankeri (başlık/link/kod hariç); Glossar satırlarına id
- [x] Fontlar `@fontsource-variable` (Google Fonts çağrısı yok — DSGVO); `@astrojs/markdown-remark` + `unified()` (Astro 7 Sätteri)
- [x] Datenschutz: localStorage okuma ilerlemesi notu · `check-site.mjs` 70 kontrol · ekran görüntüsü: headless Chrome **ayrı `--user-data-dir` ile çalışıyor**
- [ ] Gerçek telefonda 400 px kontrolü (headless Chrome ~500 px altına inmiyor) · koyu tema göz kontrolü

### Yeniden yapılanma — wattwas medya markası ✅ (12 Eyl 2026 öğle)
- [x] Site adı **wattwas** (config, Impressum/Datenschutz/Haftung, lernfelder ×8, README)
- [x] Yapı: `beruf/*` + `anleitungen/*` → `themen/energie-und-gebaeudetechnik/*` (8 dil, git mv, göreli linkler düzeltildi); eski URL'ler 9 locale × 8 yol yönlendiriyor
- [x] Yeni DE sayfalar: `themen/` (9 Fachrichtung, yalnız EGT linkli), EGT hub, `grundlagen/` Lernpfad hub, `elektrowerkzeuge/` (9 alet kategorisi, Pro/Contra, karşılaştırma tablosu) + `grundausstattung-azubi` (§ 14 BBiG), `blog/` + „Fehler des Tages #1“, `ueber`
- [x] **Leichte Sprache** locale (`leicht`, lang `de-x-leicht`): Startseite + tüm UI dizgileri; içerik DE fallback
- [x] Tema "Electric Editorial": dark-first (ThemeProvider/ThemeSelect override), amber→orange verlauf + cyan, Space Grotesk oversized, funken, stromlinie, cursor-glow, magnet buton, 9:16 video kartları (embed yok → çerez yok)
- [x] Sosyal: `social.json` @wattwas (YouTube/TikTok/Instagram) header + hero + „Folge uns“ + „Unterstütze uns“ + footer; newsletter formu `newsletterAction` girilince açılır
- [ ] **Kadir:** kanalları aç (@wattwas), newsletter sağlayıcı seç, affiliate programı (sonra `werkzeuge.json` URL + Datenschutz)
- [x] yeni DE sayfaların çevirisi: 8 sayfa × 7 dil, GLM 5.3 Flash, 56/56 doğrulama (worker.py düzeltildi: çok satırlı prompt her zaman `--file`)
- [ ] **Joseph:** ilk 3 Short, Automatisierung/Kfz/Messen ilk sayfalar

### Üç seviye — Einstieg · Geselle · Meister (Kadir'in fikri, 12 Eyl 2026 öğleden sonra) ✅ altyapı
- [x] Şema `stufe: einstieg | geselle | meister` (eski `azubi` → `einstieg`, 25 dosya); `Stufe.astro` rozeti her lernseite'nin başında + blog listesinde; /themen/ üstünde 9 dilli açıklama
- [x] Veri bileşenleri i18n: `werkzeuge.json`, `videos.json`, `berufe.json` 7 dilde (tr sayfalarında Almanca kalmıyor; Fachbegriff parantezle korunuyor)
- [ ] **İçerik planı Geselle (ilk 3):** Erstprüfung nach DIN VDE 0100-600 – Messprotokoll richtig lesen · Selektivität LS/RCD in der Praxis · Leitungsberechnung: Querschnitt, Spannungsfall, Häufung
- [ ] **İçerik planı Meister (ilk 3):** Anlagenplanung nach DIN 18015 – vom Grundriss zum Stromlaufplan · Prüfpflichten & Haftung (DGUV V3, VDE 0105-100 Abs. Verantwortung) · Kalkulation & Angebot einer Unterverteilung
- [ ] Filtre: /themen/ ve Startseite'de seviye seçici (içerik 3 seviyede olunca)

### Faz 4 — Sürekli
- [ ] Kreuzschaltung, Herdanschluss, Messen/Prüfen, Fehlersuche
- [ ] Lernfeld bazlı görünüm, Karteikarten

## Sıradaki somut adım
Faz 2, ilk iş: çeviri hattı — **OpenCode modelleri** (Kadir: LM Studio yerine; Kimi K3 kotası az → DeepSeek V4 Flash
veya Kimi K2.7) ile `de/grundlagen/strom-spannung-widerstand.mdx`'i 7 dile çevir (terim kilidi: Almanca Fachbegriff parantezle; front matter `translated: machine`; MDX import/bileşen
satırlarına dokunma). Sonra ka/sq/fa çıktısını Claude okuyup kalite notu ROADMAP'e. `tr/index.mdx` ve `ar/index.mdx`
kartları `LinkCard`'a çevrilir (de ile aynı).

## Kadir'den beklenen karar / eylem
1. **Google Search Console doğrulaması** — Kadir Google hesabıyla wattwas.de'yi ekler, HTML doğrulama dosyasının adını verir.
2. ~~Özel alan adı~~ → **wattwas.de canlı** (11 Eyl 2026).
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
- **Alan adı dersi (11 Eyl 2026):** INWX JSON-RPC (`api.domrobot.com/jsonrpc/`, `account.login` → `nameserver.info/deleteRecord/createRecord`)
  Python `urllib` + cookie jar ile sorunsuz; INWX yeni domain'e `*`, apex ve `www` için park A kaydı (185.181.104.242) koyar, üçü de silinmeli.
  GitHub Actions deploy'da `public/CNAME` tek başına custom domain'i AYARLAMAZ → `gh api -X PUT repos/…/pages -f cname=`. Cloudflare Registrar .de satmıyor.
- **Faz 2 dersi:** GLM 5.3 Flash Gürcüce/Arapça uzun işlerde bazen 32k token "düşünüp" boş dönüyor (reason=length) ya da
  araç çağrısına sapıyor → `opencode run --variant low` + "Do NOT use any tools" mesajı çözdü (677 s boş → 38 s OK). Windows'ta
  uzun prompt `--file` ile eklenir (mesaj `--file`'dan ÖNCE, yoksa dizi seçeneği mesajı yutar). 7 dili paralel süreç olarak
  koşturmak sıralıdan 10× hızlı. YAML: çevrilmiş title'da ':' → tırnak şart. Gürcüce glossar JSON'unu Claude yazdı.
- **Faz 1 dersi:** Starlight `LinkCard` göreli `href`'i olduğu gibi basar (`./beruf/…`), tarayıcı çözer; test göreli değeri aramalı.
