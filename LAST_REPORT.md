# MATRIX CI — AKTİF 4K PNG CAPTURE / YAYIN KAPISI

Tarih:2026-10-19T07:17:14.211Z
Aşama/iş:P3.7j/P9 devam ediyor; mimari v1.27/A27 korunur.
Dal:feat/hero-matrix-rain; worktree:.worktrees/hero-matrix-rain. Main/production son doğrulanan7559b3e.
Initial SHA:42e84faab8271065d241bb385adddc4bb83ec840; Verify39197877724:56/59,3timeout.
Fix1:678bd862d60ee3938eb8ffd21d5f34b8b0e81591 — fixture cleanup/semantic ready. Verify39205618914:58/59; live/admin PASS,QA gerçek slow-device gösterdi.
Fix2/uzak HEAD:98fbeb839c90312c564beb63f995d8b2c9a0b261 — Matrix shared glyph budget. Yerel üç ardışık3/3 ve full59/59/check/build/15görsel PASS; kaynakSHA/beşblob uzakla eşit.
Verify39210909043:58/59. Gerçek üç örnekli Matrix+WebGL ölçümü Linux'ta PASS14.35sn. Yeni tekFAIL:3840×2160Classic PNGartifact çekimi30sn. Fonts loaded; hero ready/high/idle; Matrix320/quality0.375/running;console/pageerror/requestfailed boş. Bu RED korunur, GREEN sayılmaz.

KÖK NEDENLER / SON CAPTURE ADAYI
Live fixture birikimi ve admin global load beklemesi fix1 ile giderildi. QA timeout'u gerçek kaynak paylaşımı hatasını gizliyordu;3×CPU tekrarında2300glyph/25–40ms MatrixCPU hero fallback yaptı. Fix2 quality² far-culling+0.375 LOD ile aynı320 parçacık simülasyonunu koruyup üç ölçümü iki kez ready/high tamamladı. Hero24FPS koruması/sabitFPScap/CI özel kapatma yok. Basınç görseli ve15normal Matrix görseli incelendi.
Son değişiklik yalnız test yardımcıları ve Matrix testindedir: Chromium Page.captureScreenshot optimizeForSpeed ile kayıpsızPNG/tamDPR boyutları korunur. Fonts loaded/scene ready/Matrixrunning; yeni gerçek frame çekim öncesi ve frame ilerlemesi çekim sonrası beklenir. PNGIHDRgenişlik/yükseklik ve aynı Matrix/WebGL node'ları assert edilir.12capture timing/frame/bytes kaydı üretilir.30sn bütçe artmadı;viewport/DPRküçültme,retry,skip,pause/disable/virtualclock yok.
İlk hedefli11viewport denemesi PASS1/1; son fresh-frame koşuluyla nihai üç ardışık koşu3/3+3/3+3/3 PASS,0fail/cancelled/skipped (135993.2381/123533.3465/120824.2939ms). Check/build ardından yeni full59 testlik seri paket sürüyor. Önceki adayların sonuçları bu aday yerine sayılmaz. Son capture adayı henüz commit edilmedi.

Mevcut Preview:https://291456c7-zy-reklam.akinarslanceng.workers.dev —98fbeb839,Build79e1d370SUCCESS,ASSETS-only/secrets[]. Son test-capture değişikliği henüz uzakta değil.
Yeni PR:NO. Merge:NO. Production:NO. Main doğrudanpush/admin publish/manualdeploy:NO.
Capture commit kapsamı:tests/helpers/browser-ready.mjs,tests/matrix.test.mjs,ROADMAP.md,LAST_REPORT.md. Runtime98fbeb839 ile aynı;Worker/config/hero/showroom/admin/live korunur. User/generated/evidence/screenshot/log farkları tutulur,commit dışı kalır.
Kanıt:docs/evidence/matrix/ci-release/{39197877724,39205618914,39210909043,local-budget,remote-budget,pressure-comparison,local-visual-review}.json; ilgiliCIlogları ve .matrix-capture-*.log.
Sınır:Chromium/SwiftShader fiziksel cihaz kabulü değildir;P3.6/genelP3/P7/P8/P9 açık;SVGLoader500kB uyarısı sürer. Upstream3752d0b/CC BY-NC-SA4.0 korunur;kullanıcı ek ticari izin bildirdi.
Sıradaki tek iş: son capture adayı için üç ardışık hedefli ve full59/59; ardından commit/push/VerifyGREEN/Preview/PR/PRVerify/merge/automaticproduction/mainVerify/live/domain kabulü.
