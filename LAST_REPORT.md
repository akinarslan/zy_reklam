# ZY Reklam — 3D Vitrin kayıt ve önizleme raporu

Tarih: 2026-10-18
Talimat: Hazır P3.7g değişikliğinin commit/PR/Verify/Preview sürecine devam et.
Aşama/iş: P3.7g; mimari v1.22/A22 ve A20 korunur.
Dal/çalışma alanı: feat/3d-vitrin-page; .worktrees/3d-vitrin-page.
Başlangıç uzak main: f378dd128c2b76faaadb3f45666603a56cc1badd.

İki tabela ve asimetrik totem /3d-vitrin/ sayfasında, ortak menü/footer/iletişim, canonical ve sitemap ile hazır. Ana sayfa hero 3D, showroom geometri/renderer/controller, admin, Worker ve Wrangler korunur.
Doğrulama: npm.cmd run build PASS (TypeScript dahil); npm.cmd test tek seri koşuda 44/44 PASS. Yedi viewport, üç ürün ışıkları, klavye/touch, idle/offscreen, reduced-motion, module/context fallback, JS kapalı iletişim ve yerel Worker route HTTP200 PASS. Mevcut 599.52kB SVGLoader uyarısı sürer.
Değişen kaynaklar: index.html, package.json, vite.config.ts; scripts/generate-showroom.mjs, generate-projects.mjs, generate-promotions.mjs; src/vitrine.ts, src/showroom/page.html, src/styles/showroom.css; tests/vitrine-page.test.mjs, showroom.test.mjs, admin-worker.test.mjs; ARCHITECTURE.md, ROADMAP.md, LAST_REPORT.md. Generated/evidence/screenshot/yerel araç farkları commit dışındadır ve korunur.
Uzak kayıt: commit/push/PR ve Verify/Cloudflare Preview henüz bekleniyor; başarı önceden iddia edilmez. Main merge/production deploy yapılmadı.
Sınır: P3.6 fiziksel cihaz kabulü durdurulmuş durumda; fiziksel/USB/ADB/telefon testi yapılmadı. Genel P3/P7/P8 açık.
Engel: yerel kabulde yok; uzak kontroller bekleniyor.
Sıradaki tek iş: commit/push/PR ve uzak Verify/izole Preview kabulünü tamamlamak.
