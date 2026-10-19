# MATRIX CI SEMANTİK BEKLEME / YAYIN KAPISI RAPORU

Tarih: 2026-10-19
Talimat: Üç CI timeout'unu çöz; üç ardışık hedefli koşu ve tam59/59 ardından feature Verify/Preview, PR Verify, merge ve otomatik production/main Verify/live/domain kabulünü tamamla.
Aşama/iş: P3.7j/P9 devam ediyor; yerel kapı TAMAMLANDI, uzak/yayın kapıları bekliyor.
Mimari: v1.27/A27; runtime/veri/API sözleşmesi değişmedi. Kullanıcı yeni yayın zincirini yetkilendirdi; önceki local-only sınırı bu görev için revize edildi.
Dal: feat/hero-matrix-rain; .worktrees/hero-matrix-rain.
Başlangıç SHA: 42e84faab8271065d241bb385adddc4bb83ec840 (local/origin eşleşir).
Main: 7559b3e98082fd29cf9388f09b46be51d3aa5400; bu iş main'e doğrudan yazmaz.

İLK CI / DÜZELTME
Verify39197877724:56/59 PASS,3timeout FAIL; log ve artifact metadata yeniden okundu.
1. B/E kaynak birikimi ve hazır durum beklemesi: live-content tamamlanan fixture sayfalarını açık tutuyordu; hero WebGL öncesi altı Matrix ve bir showroom sayfası kalıyordu. Her bağımsız senaryo kabulden sonra kapatılır. Stage ready/terminal durum, tek görünür canvas ve gerçek render sayacı beklenir. Reduced/fallback aktif3D yerine kabul edilmez. Matrix/WebGL identity ve patch assertions korunur. CI stack helper135 HOME fixture'ıdır; önceki /3d-vitrin/ yorumu düzeltilmiştir.
2. D/E load stratejisi:11viewport/4K testinden sonra aynı sayfada /admin/ global load bekleniyordu. Responsive kabul korunur; 4K sayfası kapatılır, diğer route'lar taze context'te HTTP200/DOMContentLoaded ve gerçek login/showroom/kategori hazır durumuyla doğrulanır. Matrix/controller yokluğu assertions korunur.
3. B/C QA wait: yalnız sonuç görünürlüğünü parent RAF'ında beklemek tool'un terminal hata durumunu gizliyordu.100ms semantik polling running→result/error durumunu izler; hata mesajı anında FAIL verir. Üç gerçek örnek/indirilenJSON/elapsed/renderedFrames/window toplamı assertions değişmedi. İlk CI status/iframe tanısı kaydetmediğinden o koşunun tarihsel terminal sebebi kesinleştirilemez; runtime hata kanıtı olmadan runtime değiştirilmedi.
Failure-only tanı: URL/readyState/viewport/console/pageerror/requestfailed, canvas/stage/Matrix, visibility/motion ve QA progress/status.20/30/45sn timeout limitleri artırılmadı. Skip/test silme/assertion zayıflatma yok.

DOĞRULAMA
Üç ardışık hedefli koşu:3/3,3/3,3/3 PASS (100459/120820/113963ms);0fail/cancelled/skipped.
npm.cmd run check: PASS.
npm.cmd run build: PASS; mevcut SVGLoader500kB uyarısı sürer, eşik değiştirilmedi.
npm.cmd test -- --test-concurrency=1:59/59 PASS,0fail/cancelled/skipped;1114829.9942ms.
Matrix6test/11viewport; hero36011,live22,fold18,navbar28,showroom16,social32,header96 ve admin regresyonları PASS.
Kanıt: docs/evidence/matrix/ci-release/local.json,39197877724.json/.log ve .matrix-target-final-{1,2,3}.log/.matrix-release-{check,build,full}.log.

DEĞİŞEN DOSYALAR / SINIR
Test: tests/helpers/browser-ready.mjs,live-content.mjs; tests/matrix.test.mjs,scene.test.mjs.
Belge: ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md,docs/THIRD_PARTY.md.
Runtime Matrix/hero/showroom/live/admin/Worker/Wrangler/config kaynakları değişmedi. Generated HTML/sitemap, eski/yeni evidence,screenshot/log ve kullanıcı farkları korunur; kaynak commit'ine alınmaz.
Upstream hematteo/matrix-rain3752d0b, CC BY-NC-SA4.0 atıf/lisans korunur. Kullanıcı bu ticari site yayını için ek izin alındığını bildirdi; izin belgesi bağımsız incelenmiş değildir.
Yeni PR/merge/production/admin publish bu kayıt anında yapılmadı. Gerçek fiziksel cihaz/GPU kabulü değildir; P3.6 ve genelP3/P7/P8/P9 açık kalır.
Sıradaki tek iş: dar kapsamlı fix commit/push ve yeni feature Verify GREEN kapısı; ardından yetkilendirilmiş Preview→PR→production zinciri.
