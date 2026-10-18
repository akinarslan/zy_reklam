# ZY Reklam — Instagram küpü ve tam ekran 3D Vitrin raporu

Tarih:2026-10-18
Talimat: Mevcut dalda Instagram floating CSS küpü ekle; /3d-vitrin/ ilk ekranını tam sahneye dönüştür; metinleri silmeden aşağı taşı, ürün/etkileşimleri koru; commit/push ve Verify/Preview.
Aşama/iş:P3.7h. Mimari:v1.24/A24; A20/A22/A23 ve veri/API sözleşmeleri korunur.
Dal:feat/3d-vitrin-page; .worktrees/3d-vitrin-page.
Commit:Henüz oluşmadı; doğrulanmış kaynaklar commit edilecek.
PR:#6 önceki turda merged; merge03fc90d6522f8eaa26195b6985738cf99c981ba5. Yeni PR veya branch oluşturulmadı. Bu tur merge:NO; production:NO.
Durum:Yerel kabul tamamlandı; uzak kayıt/Preview bekliyor.
Preview:Yeni commit için henüz oluşmadı.

YAPILAN İŞ
Instagram: beyaz SVG glyph, pembe/mor/turuncu gradient ve yumuşak gölgeli rounded square; CSS perspektif,6sn/3px salınım,hover18/20derece ve1.05scale,tap. Masaüstü58px/tablet54px/mobil50px. WhatsApp58/56px ve konumu aynen korundu. Safe-area ve12–16px aralık. aria-label tam istenen metin; gold keyboard focus; target_blank/noopener/noreferrer. OS ve site hareket azaltma düğmesi animasyonu kapatır. Ek Three.js/RAF yok. Public generatorlar gerçek home sosyal linklerini paylaşır.
Vitrin: header sonrası wrapper=100svh-header. Canvas ve küçük pill controls ilk ekranda; bilgi başlığı/açıklaması ve temsili ürün notu aşağıdaki normal bilgi bölümünde. Metinler silinmedi/gizlenmedi. Üç ürünün gerçek3D Box3 köşeleri, derinlik ve frustum oranıyla camera fit; yüzde12 hover marjı. Desktop iki tabela solda/totem sağda; dar/dikey tablette dikey kompozisyon. Sadece resize composition/camera ve duruşta diagnostic bounds; modeller/materyaller/ışık/controller değişmedi. DPR,quality,cleanup,idle/offscreen,reduced/context fallback korundu.

INSTAGRAM KABULÜ
Desktop:PASS. Tablet:PASS. Mobile:PASS. Animation:PASS(6sn). Hover:PASS. Keyboard/focus-visible:PASS. Reduced motion:PASS(OS ve gerçek site düğmesi). Instagram link:PASS(https://www.instagram.com/zy.reklam/); gerçek click yeni sekme test fixture yanıtına gider, Instagram hesabında işlem yok. Target blank/rel:PASS. JS kapalı link:PASS. WhatsApp overlap:YOK. Horizontal overflow:YOK.32 Home/Vitrin kombinasyonu ve üç kategori temsili geçti. Hero caption için76px iç boşluk,1280×720 dahil tüm ekranlarda ikon/metin çakışması yok; ilk ekran korunur.

3D VİTRİN KABULÜ
360×800:PASS
390×844:PASS
412×915:PASS
768×1024:PASS
820×1180:PASS
834×1194:PASS
1024×768:PASS
1024×1366:PASS
1280×720:PASS
1366×768:PASS
1440×900:PASS
1600×900:PASS
1920×1080:PASS
2560×1440:PASS
3440×1440:PASS
3840×2160:PASS
ZY REKLAM:FULL. DAHA İLERİYE:FULL. Totem:FULL. Heading first viewport:YOK. Heading DOM:VAR; scroll sonrası görünür. Controls:PASS. Sticky header:PASS. Horizontal overflow:YOK. Mouse/hover üç ürün ve seçili durumda projected-bounds:PASS. Canvas touch-action:pan-y ve gerçek CDP dokunmayla dikey scroll:PASS. Klavye/touch ürün ışıkları,reduced motion,context/module fallback,JS kapalı poster/iletişim ve idle/offscreen:PASS(mevcut regresyonlar).
Her16viewport için viewportWidth/Height,headerHeight,stage/canvas rect,controls,sosyal rect ve her ürünün projected NDC/depth bounds ölçüldü. Ürün bounds köşeleri [-1,1] içinde; ürünler birbirine girmiyor,canvas header/controls/float ikonlarla çakışmıyor. Kanıt:docs/evidence/showroom-stage/local/acceptance.json.
İstenen3d-vitrin-390/768/820/1024-landscape/1366/1920/2560/3440/3840.png görüntüleri üretildi ve incelendi;16ölçünün tamamında screenshot var.2560×1440 yazılı kompozisyon kabulü PASS. Ek dosyada referans görüntüler yok; üçüncü referansla piksel karşılaştırması çalıştırılmadı.

HOME VE SINIRLAR
Özgün hero3D/scene kodu değişmedi. Home ilk ekran18/18,korunan ikinci bölümün DOM/visible/scroll kabulü PASS; navbar28kombinasyon PASS. Home hero canvas1/showroom0; bağımsız showroom yüklenmez. Admin kaynakları,Worker/auth/KV/R2/Wrangler,secrets,publish değişmedi. Kullanıcı/generated farkları korundu; reset/clean yok.

DOĞRULAMA / KAYIT
npm.cmd run check:PASS. npm.cmd run build:PASS. npm.cmd test -- --test-concurrency=1:48/48 PASS,0fail(son kaynaklarla tek seri koşu). Test kaldırılmadı; mevcut idle testi başlığı stage sonrasına taşındığı için odağı preventScroll ile wrapper'a verir. İlk hedefli manual-reduced testi media-event yarışı nedeniyle başarısız oldu; gerçek kullanıcı düğmesi ve state beklemesiyle düzeltildi. Ara hedefli koşu son caption-clearance değişikliği için durduruldu; başarı sayılmadı. İlk tam koşu46PASS/2FAIL:1280×720 caption çakışması ve süreli touch-state/idle örnekleme yarışı. Çakışma giderildi; transient seçimler tek tek açılış/kapanış/idle olarak ölçülür, controller süresi değişmez. İlgili hedefli testler ve son tam koşu PASS.
Uzak SHA/blob,Verify ve yeni Preview sonuçları bekliyor; başarı iddiası yok.
Merge:NO. Production Build:ÇALIŞTIRILMADI. Live test:ÇALIŞTIRILMADI. Yeni PR/yayın yapılmaması yönündeki son talimat korunur. Sonuç günlüğü/rapor commit sonrasında yerelde güncellenir; rapor SHA döngüsü için ek commit/deploy yapılmaz.

DEĞİŞEN DOSYALAR
index.html; scripts/generate-showroom.mjs,generate-services.mjs,generate-projects.mjs,generate-promotions.mjs ve yeni public-social-links.mjs; src/styles/main.css,showroom.css ve yeni instagram.css; src/showroom/page.html,renderer.ts ve yeni framing.ts; tests/vitrine-page.test.mjs ve yeni showroom-stage.test.mjs,helpers/showroom-stage.mjs; ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md(18dosya). Generated kategori HTML/sitemap,eski kanıt farkları,screenshotlar ve yerel araçlar commit dışında korundu.
Kanıtlar: .worktrees/3d-vitrin-page/docs/evidence/showroom-stage/{local,preview}; hero-fold ve public-navigation; vitrine-page kabul dosyaları. Mevcut SVGLoader599.52kB uyarısı sürer. Tarayıcı/SwiftShader kabulü fiziksel telefon/iPad/GPU kabulü değildir; P3.6 durdurulmuş ve USB/ADB testi yapılmadı. Genel P3/P7/P8/P9 açık.
Sıradaki tek iş:Aynı dala commit/push ve yeni Verify/izole Preview kabulü.
