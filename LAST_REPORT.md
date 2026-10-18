# ZY REKLAM HERO 360° + CHECKPOINT RAPORU

Tarih: 2026-10-18
Talimat: P2.10/P7.0-live kaynak checkpoint ve Verify kapısını doğrula; ardından mevcut hero renderer/canvas ile tam yatay dönüş ve gerçek arka montaj ekle; ayrı commit/push ve izole Preview. Yeni PR/merge/production/main yazımı yok.
Aşama/iş: P3.7i yerel kabul TAMAMLANDI; uzak kayıt/Verify/Preview bekleniyor. Genel P3/P7/P8/P9 açık. Mimari: v1.26/A26; A20–A25 korunur.
Çalışma alanı: .worktrees/3d-vitrin-page. Ana kirli kullanıcı ağacı, generated/evidence ve yerel yardımcı farkları korundu; reset/clean yok.

CHECKPOINT

Remote branch: origin/feat/3d-vitrin-page
Expected checkpoint: 3802981273641cf63e5498d7233c5f388ad722a1 — fetch sonrası birebir doğrulandı.
Header:1395e6f63e944a27e233424fbfe79cd70ee7a22b; A:a4ebd8c18bc046cc98ca6530788df45d69f22a3e; B:e37b394d05086c31e8434243735f0691809f4199; normalizasyon:3802981.
Verify 39154971646: GREEN/SUCCESS. CI log51/51 PASS,0fail; npm ci/build/browser install/test/artifact SUCCESS. Artifact12147231563,84.68MB.
Cloudflare Preview: SUCCESS — buildae9114b4-d5c3-4aba-8704-7bf289611a90, https://d312592c-zy-reklam.akinarslanceng.workers.dev . Authenticated metadata yalnız ASSETS, secrets[].
Source working tree: CLEAN (yeni 360° kaynak düzenlemesinden ÖNCE).
Uncommitted source changes: YOK (checkpoint anında). Önceki final belge kayıtları, generated/evidence/screenshot/log/yardımcı farkları vardı; uygulama kaynak farkı yoktu. Kapılar doğrulanmadan yeni kaynak düzenlenmedi.
Harici main587c703e666f34aca2766cb525193ed4badbac79 Delete party gözlendi; bu görev main yazmadı.

HERO ROTATION

Commit: fedb3b3e74df990dff5ebf1860a2445d1e4104d6 — feat: add full rotation to hero 3d sign; aynı dala push/fetch doğrulandı.
Initial front: PASS
Mouse 180: PASS
Mouse 360: PASS
Touch 180: PASS
Touch vertical scroll: PASS (gerçek CDP touch, pan-y)
Keyboard: PASS (odaklanabilir stage, gold focus, ArrowLeft/Right180°)
Back face: PASS (koyu yeşil metal plaka; ters wordmark yok)
Mounting details: PASS (iki metal ray, dört altıgen cıvata/vida yuvası)
Snap front: PASS
Snap back: PASS
Reduced motion: PASS (mevcut politika: başlangıçta Three indirilmez; açık sahne dispose/poster. OS azaltma altında açıkça etkinleştirilen 3D'de smoothing doğrudan)
Render idle: PASS
Canvas identity: SAME
Duplicate canvas: YOK
Duplicate renderer: YOK (aynı tek WebGL context ve mevcut tek renderer; ek RAF yok)
Context fallback: PASS
Live-content regression: PASS (22senaryo; hero drag sırasında erteleme/sonrasında aynı canvas dahil)
First-fold regression: PASS (18ölçü; ikinci bölüm DOM/normal akış/scroll görünümü korunur)
Horizontal overflow: YOK

Normal hover ±18° yaw/±10° pitch; drag yatayda sınırsız, stage genişliği360°. Bırakma en yakın180° katına kısa yumuşak snap. Pointer capture/release/cancel/lostcapture/blur/pagehide temizliği; dikey scroll korunur. Özgün ön logo konturu/materyalleri ve aynı tabela grubu korunur. Üç instanced arka detay batch'i168 üçgen ekler:4882→5050 ana-pass; draw-call üst sınırı13→16. Gölge20Hz/final poz, QualityMonitor, DPR, idle/offscreen/visibility/context/dispose korunur.

RESPONSIVE

390×844: PASS
412×915: PASS
768×1024: PASS
820×1180: PASS
1024×768 landscape: PASS
1366×768: PASS
1440×900: PASS
1920×1080: PASS
2560×1440: PASS
3440×1440: PASS
3840×2160: PASS
Her ölçüde front/back/front projected Box3 köşeleri/depth [-1,1] içinde; tek canvas/context, stage içinde tabela, taşma yok ve ilk ekran/ikinci bölüm korunur. İstenen12 hero-front/back-390/768/1366/1920/2560/3840.png üretildi ve görsel incelendi. Özellikle2560 arka yüz temiz metal montaj dili ve okunur ışıkla PASS.

CI

Check: PASS — npm.cmd run check
Build: PASS — npm.cmd run build (TypeScript dahil)
Tests: 52/52 PASS,0fail — npm.cmd test -- --test-concurrency=1 son tek seri koşu.
İlk Verify: RED — https://github.com/akinarslan/zy_reklam/actions/runs/39158168932 —51/52 PASS; header-sign transition ölçüm yarışı. Header uygulaması değişmeden test tamamlanmayı bekler; hedefli1/1 PASS. Yeni Verify bekleniyor.
Cloudflare Preview: Build SUCCESS — 78cad27d-33de-4714-b37e-1469c181e52a; https://eaecd36a-zy-reklam.akinarslanceng.workers.dev . Tarayıcı kabulü sürüyor; ASSETS-only/secrets[].
Uzak feature SHA ve35blob fetch ile doğrulandı. Yeni HEAD ile build ve snapshot1/1 PASS. Preview manifest revision/dört hash/cache doğrulandı; tarayıcı kabulü ve CI testi sürüyor.
New PR: NO
Merge: NO
Production: NO

DOĞRULAMA NOTLARI / SINIR

Hiçbir mevcut test kaldırılmadı. Eski sınırlı mobil drag beklentisi yeni180° snap sözleşmesine, geometri bütçesi168 ek arka detay üçgenine göre güncellendi; normal hover sınır testi korunur. İlk yeni testte reload sonrası canvas referansı yeniden kurulmalıydı. Live hero testinde pointer'ın stage'e kalıcı odak vererek patch'i uzatması bulundu; ilk testteki elle blur geçici kontrolü kaldırıldı. Pointerdown default focus aktarımı önlendi, native pan-y ve Tab/ok erişimi korundu; son hedefli2/2 PASS. Ara tam koşu bu kaynak düzeltmesi için durduruldu, başarı sayılmadı. Ayrı sahne koşusunda QA context ölçüm ekranı30sn timeout verdi; başarı sayılmadı. Son tam seri52/52 koşu tüm QA/context/regresyon kontrollerini geçer.
Mevcut header96kombinasyon,18fold,28navbar,16showroom,32Instagram,live A/B/cache/güvenlik ve vitrin etkileşim/fallback testleri son tam koşuda PASS. Admin/Worker/auth/KV/R2/Wrangler ve live checker/protokol/patch kaynakları, showroom model/renderer/controller değişmedi. JS kapalı ilk HTML/SEO ve teklif akışı korunur. Preview live A→B yanıtları intercept/mock sürüm kullanır; gerçek admin publish veya production canlı güncellemesi yapılmadı.
SVGLoader ortak chunk601.18kB/gzip154.17kB (önceki599.52kB); mevcut500kB uyarısı sürer, eşik yükseltilmedi. Hero renderer chunk10.50kB/gzip4.48kB; dinamik import korunur. Tarayıcı/SwiftShader/CDP viewport kabulü fiziksel cihaz/GPU kabulü değildir; P3.6 durdurulmuş, USB/ADB/telefon/iPad testi çalıştırılmadı. Secrets Git'e/rapora eklenmedi.

DEĞİŞEN DOSYALAR / KANIT

src/scene/hero.ts,renderer.ts ve yeni back.ts,rotation.ts; src/styles/main.css; tests/scene.test.mjs,helpers/live-content.mjs ve yeni hero-rotation.test.mjs,helpers/hero-rotation.mjs; ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md. Önceki live-plan sonuç kaydı docs/LIVE_CONTENT_PLAN.md korunur/kaydedilir. Generated HTML/sitemap,eski kanıtlar,screenshot/log/yerel araçlar kaynak commit'ine alınmaz.
Kanıt:docs/evidence/hero-rotation/checkpoint.json,checkpoint-ci.json,local/acceptance.json; .hero-tests-final.log; live-content,hero-fold,public-navigation,showroom-stage kabul dosyaları. Sonuç raporu/günlük commit sonrasında yerelde güncellenir; rapor SHA'sı için döngüsel commit/deploy oluşturulmaz.
Sıradaki tek iş: Yeni Verify39158168932 ve izole Preview tarayıcı kabulünü tamamlamak.

Yerel uygulama tamamlandı; uzak kayıt ve kabul bekleniyor.

CI TEST DÜZELTMESİ

360° kaynak commit fedb3b3 ayrı korunur. İlk CI51/52: mevcut header-sign testinin180ms sabit CSS transform ölçümü; diğer51 test PASS. Aynı assertions kaldırılmadan bounded CSS transition-completion beklemesi eklendi. Son hedefli header testi1/1 PASS,96sayfa/viewport + gerçek touch/klavye/reduced/JS kapalı. Yeni PR/merge/production yok. Sıradaki tek iş ayrı test düzeltmesi commit/push, son tam test/Verify ve yeni Preview kabulüdür.
