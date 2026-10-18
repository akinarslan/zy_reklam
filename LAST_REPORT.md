# ZY Reklam — navbar, tam ilk ekran ve 3D Vitrin son düzeltmeleri

Tarih: 2026-10-18
Talimat: Navbar + first fold + tablet/iPad + ayrı 3D Vitrin kabulü. Son kullanıcı seçimi: aynı dala commit/push; yeni PR ve yayın yapma.
Aşama/iş: P3.7g-fold — yerel kabul tamamlandı; uzak kayıt/Preview bekliyor. Production bu talimatın dışında.
Mimari: v1.23/A23; A22 sayfa ayrımı ve A20 Preview izolasyonu korundu. Veri/API sözleşmesi değişmedi.
Dal: feat/3d-vitrin-page; çalışma alanı .worktrees/3d-vitrin-page.
Commit: Henüz oluşmadı; hazır kaynaklar commit edilecek.
PR: https://github.com/akinarslan/zy_reklam/pull/6 önceki turda MERGED, merge 03fc90d6522f8eaa26195b6985738cf99c981ba5. Yeni PR açılmadı; yeni merge yok.
Preview: Yeni commit için henüz bekleniyor.

SONUÇ / DEĞİŞİKLİK
Hero min-height = 100svh - --public-header-height. Grid ile hero-bottom aynı bölümde kalan yüksekliği paylaşır. Kısa landscape ve dar mobil boşlukları/başlık/CTA/stage boyutları uyarlandı; içerik kırpılmadı. Hero overflow visible. WhatsApp ile hareket düğmesi için 76px yatay yer ayrıldı; çakışma testi eklendi.
“Markanız ışıkta. Markanız yolda.” bölümünün DOM ve tüm içeriği aynen korundu; silme veya display/visibility/opacity/height/overflow ile saklama yok. Ana sayfa index.html origin/main ile birebir aynı. Bütün alt bölümler normal akışta.
Ortak navbar tipografisi tek --public-nav-font-size değişkeninde: desktop17px/400, mobil-tablet19px/400. Atölye, Hizmetler, Projeler ve Promosyonlar computed font-size/weight/line-height/letter-spacing/padding/height eşit. 3D Vitrin vurgusu korundu.
Sticky header top0/z-index20, koyu zemin; 77/91/97/103px header offset, +20px anchor boşluğu; 1023px ve altında hamburger korundu. Başlangıç/orta/footer ve scrollY1000, üç mega menü, klavye/Escape/dokunma ve dört anchor kabulü geçti.

DEĞİŞEN DOSYALAR
src/styles/main.css; tests/responsive.test.mjs, tests/vitrine-page.test.mjs, tests/helpers/public-navigation.mjs; yeni tests/hero-fold.test.mjs ve tests/helpers/hero-fold.mjs; ARCHITECTURE.md, ROADMAP.md, LAST_REPORT.md (dokuz kaynak/belge).
Generated HTML/sitemap, eski test kanıt farkları, screenshot ve yerel araçlar commit kapsamı dışında korundu. Ana kullanıcı ağacına reset/clean uygulanmadı. Scene/showroom geometri-renderer-controller, src/main.ts, src/vitrine.ts, admin, Worker ve Wrangler değişmedi; secret veya müşteri verisi kaydedilmedi.

YEREL DOĞRULAMA
npm.cmd run check: PASS. npm.cmd run build (TypeScript dahil): PASS. npm.cmd test -- --test-concurrency=1: 46/46 PASS, 0 fail. İlk tam koşu görsel WhatsApp çakışması düzeltmesi için durduruldu; yukarıdaki sonuç son kaynaklarla tamamlanan tek seri koşudur. Hiçbir test kaldırılmadı; eski sabit grid üst sınırı yeni tam ilk ekran sözleşmesine uyarlandı, stage/font bütçeleri korundu.
18 ilk ekran: 360×800, 390×844, 412×915, 768×1024, 820×1180, 834×1194, 1024×768, 1024×1366, 1280×720, 1366×768, 1440×900, 1536×864, 1600×900, 1900×1000, 1920×1080, 2560×1440, 3440×1440, 3840×2160 — her biri PASS.
Her ölçüde ikinci bölüm DOM=true, display görünür, visibility=visible, opacity>0, height>0; ikinci bölüm top=viewport yüksekliği, hero.bottom=viewport yüksekliği. Scroll sonrası başlık ve gerçek lightbox/araç fotoğrafları görünür. Başlık, açıklama, CTA, not, tabela, caption ve bottom ilk ekran sınırlarında; yatay taşma ve WhatsApp/motion çakışması yok. Home hero canvas1/showroom0; gerçek WebGL ready.
Navbar: 14 viewport × Home/Vitrin =28 kombinasyon PASS. Vitrin: 390/768/820/1024/1366/1920/2560/3440/3840 genişlikleri9/9 PASS; tek gerçek WebGL canvas, iki tabela+asimetrik totem; ışıklar/fare/klavye/touch, reduced motion, idle/offscreen, context/module fallback ve JS kapalı poster/iletişim korunur.
İstenen11 home-first-fold screenshot (390,768,820,834,1024-landscape,1024-portrait,1366,1920,2560,3440,3840) üretildi ve görsel incelendi. Toplam18 ölçünün görüntüsü vardır. Ayrı referans görseli ekte bulunmadığından referans piksel karşılaştırması çalıştırılmadı; yazılı kriterler esas alındı.

UZAK KAYIT / CI / PREVIEW
Commit/push, uzak SHA/blob doğrulama, yeni Verify ve Preview sonucu henüz bekleniyor; başarı iddiası yok.
Yeni PR: oluşturulmadı. Main merge: yapılmadı. Production deploy: yapılmadı. Yeni sürüm için production/live smoke: çalıştırılmadı. Önceki PR #6 production sonucu bu değişikliğin yayını olarak sunulmaz.

KANITLAR / SINIRLAR
.worktrees/3d-vitrin-page/docs/evidence/hero-fold/local/acceptance.json ve bekleyen Preview kanıtı; public-navigation/local ve bekleyen Preview; vitrine-page yerel/preview acceptance.json ve screenshotlar. CI browser-evidence artifact'i workflow tarafından üretilir.
Mevcut SVGLoader599.52kB chunk uyarısı sürer. Chromium/SwiftShader viewport kabulü fiziksel iPad/telefon/GPU performans kabulü değildir. P3.6 durdurulmuş; USB/ADB/telefon testi yapılmadı. Genel P3/P7/P8/P9 açık kalır.
Sıradaki tek iş: kullanıcı isterse hazır aynı dal değişikliğinin yayın yolunu ayrıca belirlemek; şu anda yeni PR/yayın yapılmayacak.

Aşağıdaki sonuç feature/Preview sürümünü anlatır; production bu tur güncellenmedi.
Public navbar tüm çözünürlüklerde sticky hale getirildi; Atölye menü etiketi diğer ana menülerle eşitlendi; ana sayfa mobil, tablet, iPad, desktop, 2K ve ultrawide ekranlarda ilk açılışta yalnızca hero gösterecek şekilde düzenlendi. ‘Markanız ışıkta. Markanız yolda.’ bölümü silinmeden veya gizlenmeden viewport altına taşındı ve scroll sonrası normal şekilde korunuyor. Tam 3D Vitrin deneyimi ayrı /3d-vitrin/ sayfasında çalışmaya devam ediyor.
