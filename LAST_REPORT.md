# MATRIX CI — ORTAK RENDER BÜTÇESİ / YAYIN KAPISI

Tarih: 2026-10-19T06:16:44.035Z
Aşama/iş: P3.7j/P9 devam ediyor; production kabulü henüz verilmedi.
Mimari: v1.27/A27; mevcut modül/veri/API/yayın sınırları korunur.
Dal/worktree: feat/hero-matrix-rain; .worktrees/hero-matrix-rain. User/generated/evidence farkları korundu.
Initial SHA:42e84faab8271065d241bb385adddc4bb83ec840.
Initial Verify39197877724:56/59 PASS,3timeout FAIL.
İlk fix commit / uzak feature:678bd862d60ee3938eb8ffd21d5f34b8b0e81591; sekizblob fetch sonrası eşit.
İlk fix yerel: üç ardışık3/3 ve full59/59/check/build PASS.
Yeni Verify39205618914:58/59 PASS,1FAIL. Live-content ve /admin/ timeout'ları PASS; QA'nın gerçek slow-device fallback'i11.6sn'de görünür oldu.

KÖK NEDENLER
1. Tamamlanmış live fixture sayfaları Matrix/WebGL çizimlerini biriktiriyordu; her kabul sonrası kapanır. Active scene ready/terminal durum,tek görünür canvas,gerçek render sayacı ve asıl identity assertions korunur.
2.4K sayfa ardından admin global load beklemesi: taze context + HTTP200/DOMContentLoaded ve gerçek login/showroom/kategori hazır durumu.11viewport ve no-Matrix/controller kabulü korunur.
3. Timer/RAF başarı-only wait gerçek hatayı gizliyordu. Yeni tanı360×800/DPR2,görünür/full-motion,ağ/JS hatası yokken Matrix0.5/320particle/running ve hero slow-device gösterdi. Yerel3×CPU aynı hatayı yeniden üretti: yaklaşık2300glyph,25–40ms MatrixCPU,50–72ms frame. Piksel çözünürlüğü küçülüyor fakat fillText yükü yeterince azalmıyordu.

SON ADAY (henüz commit edilmedi)
Yalnız src/matrix/renderer.js governor:1.5/(quality²) far-glyph culling ve0.375 ek LOD. Tüm parçacık simülasyonu,seed/density/mod/etkileşimler,tekRAF korunur. SabitFPScap,CI özel kapatma,hero kalite/fallback eşiği değişikliği yok.
Aynı3×CPU senaryosunda final aday iki kez üç gerçek ölçümü tamamladı; hero ready/high kaldı,Matrix görünür/running/320particle. Yaklaşık128–492glyph ve2–15ms MatrixCPU örnekleri görüldü; fiziksel cihazFPS kabulü değildir. Basınç screenshot'ı görsel incelendi.
Cihaz testi üç örnek/indirilenJSON/elapsed/renderCount assertions yanında Matrix ve WebGL tekcanvas,Matrixrunning/frames/density320 doğrular. Test sayısı59; skip/assertion azaltma/timeout artırımı yok.
Son kaynaklarla üç ardışık hedefli koşu3/3+3/3+3/3 PASS,0fail/cancelled/skipped (114780.8359/128166.4848/133368.2919ms). Check/build PASS; son adayın tek seri full paketi59/59 PASS,0fail/cancelled/skipped,868092.7158ms. Matrix15screenshot görsel kabulü PASS. Yeni commit/push/Verify kapısı bekliyor; önceki adayın sonucu bu aday yerine sayılmadı. Kanıt ci-release/local-budget.json,local-visual-review.json ve .matrix-budget-{check,build,full}.log.

Cloudflare mevcut Preview: https://6246745c-zy-reklam.akinarslanceng.workers.dev —678bd862,ASSETS-only/secrets[]; yeni render bütçesi henüz bu sürümde değil.
Main/production son doğrulanan:7559b3e98082fd29cf9388f09b46be51d3aa5400.
Yeni PR:NO. Merge:NO. Production:NO. Doğrudan mainpush/admin publish/manualdeploy:NO.
Upstream3752d0b/CC BY-NC-SA4.0 attribution/license korunur; kullanıcı ek ticari izin alındığını bildirdi.
Kanıt: docs/evidence/matrix/ci-release/{39197877724,39205618914,local,remote,pressure-comparison,pressure-baseline,pressure-final-shared-budget,pressure-final-shared-visual}.json ve log/screenshotlar.
Değişen ikinci fix adayı: src/matrix/renderer.js,tests/scene.test.mjs,ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md. Hero/showroom/live/admin/Worker/config korunur.
Sınır: physicalP3.6 durdurulmuş,genelP3/P7/P8/P9 açık;SVGLoader500kB uyarısı sürer. CI artifact indirmesi ağ timeout verdi; artifact üretimi başarılı, gerekli diagnostic tam CI logundadır.
Sıradaki tek iş: son adayın üç ardışık hedefli + full59/59 kapısını bitirmek; ardından yeni Verify/Preview/PR/production zincirini sürdürmek.
