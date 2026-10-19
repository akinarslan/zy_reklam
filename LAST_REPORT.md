# ZY REKLAM MATRIX RAIN — MIMO HANDOFF RAPORU

Tarih: 2026-10-19 · Son kontrol: 2026-10-18T22:00:55.920Z
Talimat: Hematteo Matrix Rain tam özellikli hero uyarlaması; yalnız yerel kod/test/Preview ve Mimo handoff. Codex commit/push/PR/merge/main/deployment YASAK.
Aşama/iş: P3.7j yerel yazılım ve görsel alt kabulü TAMAMLANDI. Genel P3/P7/P8/P9 açık; P3.6 fiziksel kabulü durdurulmuş kalır.
Mimari: v1.27/A27; A20–A26, statik-first/SEO, public içerik sözleşmesi ve mevcut 3D modül sınırları korunur.

Base main: 7559b3e98082fd29cf9388f09b46be51d3aa5400
Çalışma alanı: .worktrees/hero-matrix-rain
Branch: feat/hero-matrix-rain (yalnız yerel; HEAD base ile aynı; yeni commit yok)
Upstream: https://github.com/hematteo/matrix-rain
Upstream revision: 3752d0b75fd87911a92682313a02e6520ad88d02
Atıf: Matteo He / hematteo · CC BY-NC-SA4.0 · Modified for ZY Reklam Matrix hero experiment.

Fly: PASS
Classic: PASS
Mouse steering: PASS
W/S: PASS
Wheel: PASS
Page scroll: PASS
Warp: PASS (geçici hız/renk/lens boost, sonra normal hız)
Palettes: PASS (green/amber/ice/magenta/blood/gold/seed/auto)
Seed: PASS
Density: PASS (40–900)
Custom glyphs: PASS
Hidden message: PASS
Bloom: PASS
Halo: PASS
Ramp: PASS
Vignette/scanlines: PASS
P3: FALLBACK (sRGB ve zorlanan destek-yok yolu testli; P3 API desteğine bağlı)
Idle camera: PASS
Reduced motion: PASS (OS/site classic + sabit kamera/azaltılmış flash; Matrix özel override)
Touch: PASS (gerçek CDP)
Mobile scroll: PASS
Help: PASS
HUD: PASS (H yalnız Matrix UI; uzun basma geri getirir)
Fullscreen: PASS (Chromium hero fullscreen/exit; unsupported hata yolu ayrıca PASS)
PNG: PASS (gerçek browser download; unsupported hata yolu ayrıca PASS)
Share link: PASS (başarı/denied/unsupported kontrollü clipboard fixture)
Share restore: PASS (yeni browser context, tüm mx* seçenekler)
Anchor navigation: PASS (#projeler/#iletisim/#hizmetler/#hakkinda korunur)
Hero 360: PASS
Live content: PASS
First fold: PASS
Canvas identity: PASS (mevcut WebGL ve Matrix ayrı, aynı DOM instance)
Check: PASS
Build: PASS
Tests: 59/59 PASS,0fail,0cancelled,0skipped — son kaynaklarla tek seri tam koşu
Main Verify: GREEN — https://github.com/akinarslan/zy_reklam/actions/runs/39166173042
Ready for Mimo commit: YES (teknik yerel kabul; ticari yayın izni anlamına gelmez)
Codex commit: NO
Codex push: NO
PR: NO
Merge: NO
Production: NO
Uzak Preview/deployment: NO

UYGULAMA

README/LICENSE/index.html gerçek upstream revizyonundan okundu. Iframe veya harici runtime/font yok; ilave paket/Three renderer yok. Upstream seed/strand/font probing, mirrored katakana/Latin, derinlik/parallax/dolly zoom, parlak head/pale neck/uzun trail, phosphor palet, bloom/halo ve kalite algoritmaları src/matrix/renderer.js içinde uyarlanır; tip sözleşmesi renderer.d.ts, sahiplik TypeScript state/input/controls/controller/setup modüllerindedir. CSS yalnız Matrix host altında scope edilir.

Yalnız home guard sonrası dinamik import. Katman hero sınırlarında clipped/pointer-events:none; özgün başlık/CTA/tabela/header/ikinci bölüm akışı korunur. DOM’da1 Matrix scene canvas +1 küçük bloom canvas + mevcut1 WebGL hero canvas vardır; yardımcı tamponlar DOM dışında. Matrix’in tek RAF’ı offscreen/hidden durur, resume tek döngüdür. RO/IO/input/visibility/fullscreen/motion/timer/RAF ve UI cleanup doğrulandı; pagehide sonrası yeniden doğma yok. Upstream EMA/render scale/far-cull, mobil DPR1.5 ve bloom degrade korunur; ağır draw CPU süresi de kalite düşüşünü tetikler.

Pasif hero wheel/touch normal scroll’u korur; sign pointer ve native button/link Space önceliklidir. Form/editable/select/textarea/input/role textbox ve Ctrl/Meta/Alt kısayolları korunur. mx* query state anchor/hash’e yazmaz, reload yapmaz. Türkçe native kontroller/help dialog/advanced ayarlar, local-only debug, kısa toast ve keyboard focus vardır. Advanced density/seed/message/glyph/palette/bloom/halo/ramp/P3/idle/motion seçenekleri sınırlanır; DOM metinleri textContent ile yazılır. PNG yalnız Matrix katmanıdır. Clipboard başarı bildirimi promise sonrası; denied/unsupported API’ler Türkçe hata gösterir.

DOĞRULAMA / KANIT

Son check/build ve npm.cmd test -- --test-concurrency=1:59/59 PASS. Önceki53 test kaldırılmadı;6 Matrix testi eklendi. Genel canvas/dialog seçicileri ilgili WebGL/test dialog’una daraltıldı; mevcut kimlik/context/sayım/assertion korunur. Live fixture Matrix canvas’ını da gerçekten bekler ve non-null/same-instance doğrular.

Main Verify39166173042 completed/success,53/53; bağlı live-smoke ve bağımsız39166173033 success. Artifact12151286742. Kanıt docs/evidence/matrix/main-ci.json. Son HEAD base ile aynı; korunan kaynakların diff’i boş. source-integrity.json kaynak hash’leri ve index boşluğu kanıtıdır. Yeni Matrix build’i commit edilmediğinden yerel manifest revision base SHA’dır; uzak Matrix sürümü iddia edilmez.

Matrix core/advanced/state/capability/cleanup, gerçek CDP1/2parmak/scroll/doubletap/pad/longpress, font ve P3 fallback testleri PASS.11 viewport:390×844,412×915,768×1024,820×1180,1024×768 landscape,1366×768,1440×900,1920×1080,2560×1440,3440×1440,3840×2160. Her ölçüde katman hero ile aynı rect, sign/başlık/CTA görünür, kontrol çakışması/yatay taşma yok; diğer sayfalarda Matrix DOM/modül isteği yok. JS kapalı ilk HTML/SEO korunur.

Mevcut hero36011viewport front/back/front/mouse/touch/key/snap/backhardware/idle/context/BFCache; live22senaryo ve iki canvas kimliği;18first-fold/ikinci bölüm normal akış,28navbar,16showroom,32social,96header ve admin login/editor regresyonları son tam koşuda PASS. Gerçek admin login/publish yok; admin/Worker testleri izole mock/local kaynak kullanır.

15 istenen screenshot docs/evidence/matrix/local içinde: fly/classic390/768/1366/1920/2560/3840; help/palette/warp1920. Görsel inceleme visual-review.json içinde. Acceptance: aynı klasörde acceptance.json; son tam log .matrix-tests-final.log; önceki hedefli loglar korunur. Yerel Preview http://127.0.0.1:4207/ ve /3d-vitrin/; beklenmeyen pageerror/requestfailed listeleri boş. Tek Matrix RAF, sign idle sonrası toplam1 pendingRAF ve cleanup sonrası0 testle doğrulandı.

Son normal Preview kontrolü: Home/Vitrin HTTP200; console.error/pageerror/requestfailed/HTTP4xx–5xx sayıları0. Home1Matrix+1bloom+1hero, Vitrin0Matrix+0hero+1showroom; taşma/duplicate yok. Kanıt docs/evidence/matrix/local-preview.json.

Ara sonuçlar gizlenmez: ilk Matrix3/4 koşusunda yanlış kategori fixture URL’i Vite home fallback’e döndü; gerçek yollarla düzeltildi. Dar fine-pointer hint/hero-bottom çakışması1100px altında kısa pad ile giderildi. İlk birleşik9test7PASS/2FAIL: generic dialog seçicisi yeni Matrix help’i seçti; fixture kendi ID’sine daraltıldı. HUD clearance testi boş parent rect’ini engel sayıyordu; gerçek kontrol/başlık/stage/sosyal rect’leri ölçülür. Kaynak motion-mode etiketi düzeltmesi için bir tam koşu durduruldu ve başarı sayılmadı. Son kaynakların tam59/59 sonucu yukarıdadır; testler silinmedi veya kabul koşulları azaltılmadı.

İlk tamamlanan tam koşu58/59 idi: scene.test ready() içinde15sn WebGL hazır olma timeout’u. Fare/CTA assertion’larına ulaşılmadı. Kod/test/süre/assertion değiştirilmeden aynı hedefli test PASS; ardından aynı kaynaklarla son tam koşu59/59 PASS. İlk hata logu .matrix-tests-first-full.log, hedefli tekrar .matrix-scene-retry.log ve first-full.json içinde korunur. Tek cold-start timeout’un kesin nedeni belirlenmedi; son yeşil koşu bu ara sonucu gizlemez ve fiziksel performans kabulü değildir.

DOSYALAR / MIMO

Değişen kaynak/test: src/main.ts; tests/helpers/hero-rotation.mjs,live-content.mjs; tests/scene.test.mjs,showroom.test.mjs.
Yeni: src/matrix/{setup.ts,controller.ts,input.ts,controls.ts,state.ts,renderer.js,renderer.d.ts,matrix.css}; tests/matrix.test.mjs; docs/THIRD_PARTY.md,docs/licenses/matrix-rain.txt,docs/MATRIX_MIMO_HANDOFF.md.
Belgeler: ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md (kök kayıtları da güncellendi). Silinen kaynak:YOK. package/lock/Worker/auth/KV/R2/Wrangler/secrets/admin/scene/showroom/live runtime kaynakları değişmedi.
Generated HTML/sitemap, eski/yeni evidence, screenshot/log/dist ve yerel yardımcılar kaynak commit kapsamı değildir; kullanıcı dosyaları reset/clean edilmedi. Mimo dosya bazında diff incelemeli, toplu add/restore yapmamalı. Ayrıntılı kapsam docs/MATRIX_MIMO_HANDOFF.md.

SINIR / SIRADAKİ TEK İŞ

Upstream CC BY-NC-SA4.0 ticari kullanımı dışlar; ticari yayın için ek izin doğrulanmadı. Yerel teknik kabul bu iznin veya production yayın yetkisinin yerine geçmez. Atıf ve orijinal LICENSE korundu. P3 context başlangıçta sRGB açılmışsa runtime P3 isteği canvas kimliğini koruyarak sRGB fallback kullanır; destekleyen ortamda P3 başlangıç parametresi kullanılabilir. Native API izinleri tarayıcıya bağlıdır. Clipboard başarı testi fixture’dır; kullanıcı panosu değiştirilmedi.

Chromium/SwiftShader/CDP kabulü fiziksel telefon/iPad/GPU/FPS kabulü değildir. Genel performans/P3.6 ve P7 gerçek publish açık; mevcut SVGLoader601.18kB/gzip154.17kB uyarısı sürer. Yerel Matrix chunk boyutu build logundadır. Uzak Matrix Verify/Preview, ticari izin ve production kabulü çalıştırılmadı; herhangi bir deployment yok.
Sıradaki tek iş: Mimo’nun kaynak diff’ini ve bu teknik kabulü inceleyip ayrı görevinde commit/push kararını vermesi; ticari yayın lisans durumu ayrıca çözülmelidir.
