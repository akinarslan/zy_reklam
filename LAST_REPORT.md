# ZY REKLAM — MATRIX CI VE YAYIN İLERLEME RAPORU

Tarih: 2026-10-19T10:07:20.127Z
Aşama/iş: P3.7j/P9 devam ediyor. Mimari v1.27/A27; genel P3/P7/P8/P9 açık.
Talimat: üç CI timeout'unu çöz; hedefli tekrarlar ve full59 ardından tüm GREEN kapılarıyla Preview/PR/merge/otomatik production ve gerçek domain kabulüne devam et.
Dal: feat/hero-matrix-rain; .worktrees/hero-matrix-rain. Kullanıcı/generated/evidence farkları korundu; reset/clean yok.
Kaydedilmiş HEAD: 003a3f3b813af335e29471e8452bc2750ba32940
Son test-driver: henüz commit edilmedi; bu kayıt için ek commit/deployment üretilmez.

Initial SHA: 42e84faab8271065d241bb385adddc4bb83ec840
Initial Verify: 39197877724 — 56/59 PASS, üç timeout.
Root cause1: tamamlanan live fixture sayfaları açık kalıyordu; temizlenir, tek görünür gerçek WebGL canvas/render sayacı ve terminal state beklenir.
Root cause2: 4K sayfa sonrası ortak context/global load bekleniyordu; ayrı route context ve HTTP200/DOMContentLoaded/gerçek app readiness kullanılır.
Root cause3: başarı-only RAF beklemesi QA'nın slow-device terminal hatasını gizliyordu; timer polling ve tanı kaydı gerçek ortak render bütçesini açığa çıkardı. Fly ve Classic adaptif glyph/column LOD ile CPU işi azaltıldı; hero eşikleri/320 simülasyon/mesajlar/quality1 korunur.
Ek artifact sorunu: Chromium GPU compositing + SwiftShader ile sürekli güncellenen 4K yüzey snapshot readback'i. Software compositor karşılaştırması 6339→1354ms; Canvas2D enabled, WebGL enabled_readback ve gerçek scene ready. Uygulama/FPS/Matrix kapatma yok.

Fixler: 678bd862 (semantic waits/cleanup); 98fbeb839 (Fly bütçesi); ea4aeb2 (aktif kayıpsız PNG); 003a3f3 (Classic bütçesi/semantic idle). Son aday yalnız tests/matrix.test.mjs ve görev belgeleridir.
Ara Verify: 39205618914 58/59; 39210909043 58/59; 39218168700 57/59; 39227692509 58/59. İlk üç/idle son koşuda geçti; kalan 4K PNG çözümü ayrıca doğrulanıyor. RED veya durdurulan koşular başarı sayılmaz.

YEREL SON KAYNAK
Altı Matrix preflight: 6/6 PASS.
Üç ardışık hedefli: 4/4 PASS + 4/4 PASS + 4/4 PASS.
Check/build: PASS.
Full: 59/59 PASS; 0 fail/cancelled/skipped; 846544.2547ms.
20/30/45sn sınırları, 11 viewport, tam DPR/PNG, gerçek Matrix/WebGL, aynı canvas/frame ve tüm assertions korunur. Test skip/silme yok. Son adayın görsel/uzak kabulü tamamlanmadan production kabulü verilmez.

UZAK KAPILAR
Feature Verify: 39227692509 / failure.
Son Preview: https://fe724a0d-zy-reklam.akinarslanceng.workers.dev; build metadata ASSETS-only/secrets[].
VPN kullanıcı tarafından açıldı; TLS erişimi düzeldi. 003a3f3 manifest HTTP200/revision eşleşmesi doğrulandı. Bu erişim tanısı tam Preview kabulü değildir.
PR: YOK; PR Verify: çalıştırılmadı.
Merge: YOK; production build/main Verify/live/production Home/Matrix/hero/Vitrin/admin: son kaynak için ÇALIŞTIRILMADI.
Main son doğrulanan: 7559b3e98082fd29cf9388f09b46be51d3aa5400. Doğrudan main commit/push, manuel production deploy ve gerçek admin publish yok.

DOSYALAR / KANIT / SINIR
Son değişiklikler: tests/matrix.test.mjs; ARCHITECTURE.md, ROADMAP.md, LAST_REPORT.md. Runtime003a3f3 ile aynıdır; hero/showroom/live/admin/Worker/config kaynakları korunur.
Kanıt: docs/evidence/matrix/ci-release; compositor-probe.json, classic-budget-comparison.json, local-compositor.json ve CI JSON/logları; .matrix-compositor-*.log. Bu tur eklenen terminal kaynaklı bozuk Türkçe belge satırları UTF-8 olarak düzeltildi.
Chromium/SwiftShader fiziksel cihaz/GPU kabulü değildir; P3.6 durdurulmuş kalır. SVGLoader500kB uyarısı sürer. Upstream3752d0b/CC BY-NC-SA4.0 atıf/lisans korunur; kullanıcı ek ticari izin alındığını bildirdi, belge bağımsız incelenmedi.
Sıradaki tek iş: son test-driver için yerel kabulü tamamla; commit/push → feature Verify GREEN → gerçek Preview kabulü → PR/PR Verify GREEN → merge → otomatik production/main Verify/live ve gerçek domain kabulü.
Final: DEVAM EDİYOR (local-pass); PRODUCTION ACCEPTED değildir.
