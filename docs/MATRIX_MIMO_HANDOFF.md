# Matrix hero — Mimo inceleme kapsamı

Bu görev yalnız yerel geliştirme/kabul içindir. Codex commit, push, PR, merge veya
deployment yapmaz. En güncel sonuç ve test sayısı [LAST_REPORT.md](../LAST_REPORT.md)
içindedir; bu belge tek başına PASS kanıtı değildir.

- Base: `7559b3e98082fd29cf9388f09b46be51d3aa5400` (PR #8 merge).
- Local branch: `feat/hero-matrix-rain`; worktree: `.worktrees/hero-matrix-rain`.
- Local production-build preview: http://127.0.0.1:4207/ ; Vitrin: http://127.0.0.1:4207/3d-vitrin/ .
- Uzak feature dalı/PR/deployment bu görevde oluşturulmadı. HEAD hâlâ base SHA’dır;
  local manifest revision’ın base SHA olması yeni Matrix kaydının kanıtı değildir.
- Main Verify: [39166173042](https://github.com/akinarslan/zy_reklam/actions/runs/39166173042),
  completed/success,53/53; bağlı smoke success. Kanıt: `docs/evidence/matrix/main-ci.json`.

## İncelenecek kaynaklar

Değişen: `src/main.ts`; `tests/helpers/hero-rotation.mjs`,
`tests/helpers/live-content.mjs`, `tests/scene.test.mjs`, `tests/showroom.test.mjs`;
`ARCHITECTURE.md`, `ROADMAP.md`, `LAST_REPORT.md`.

Yeni: `src/matrix/setup.ts`, `controller.ts`, `input.ts`, `controls.ts`, `state.ts`,
`renderer.js`, `renderer.d.ts`, `matrix.css`; `tests/matrix.test.mjs`;
`docs/THIRD_PARTY.md`, `docs/licenses/matrix-rain.txt`, bu handoff belgesi.
Silinen kaynak dosya yoktur. Bağımlılık/lock/config/Worker/admin/scene/showroom/live
runtime kaynağı değişmez. Testlerde renderer/dialog seçicileri ayrı sahiplerine
daraltılır; önceki assertions/testler kaldırılmaz. Matrix ve WebGL kimliği birlikte
kontrol edilir.

Generated `index.html` kategori header/footer çıktıları, kategori HTML/sitemap,
`docs/evidence/**`, screenshot/log, `.matrix-*.mjs` yerel yardımcılar ve `dist/`
kaynak kapsamı değildir. Mevcut dirty kullanıcı/worktree dosyaları korunur; toplu
`git add .`, reset/clean veya restore kullanılmamalıdır. Kaynak diff’i dosya bazında
incelenmelidir. İnceleme/commit/push Mimo’nun sonraki görevidir.

## Mimari / kabul kapıları

A27/v1.27: home guard sonrası ayrı dinamik Canvas2D motor. Var olan tek WebGL hero
ve canvas, 360/back hardware, shadow/QualityMonitor/idle/fallback aynı modüllerdir.
DOM’da Matrix sahne canvas’ı ve yardımcı bloom canvas’ı ayrıdır; ek WebGL yoktur.
State `mx*` query kullanır, anchor/hash’e yazmaz. Native form/modifier/Space,
3D pointer ve sayfa scroll önceliklidir. H yalnız Matrix HUD’u gizler. Hidden /
offscreen tek Matrix RAF’ını durdurur; dispose tüm kaynakları bırakır. Canlı patch
iki canvas’ı da korur. No-JS ilk HTML tam içeriklidir.

`npm.cmd run check`, `npm.cmd run build`,
`npm.cmd test -- --test-concurrency=1` ve tüm görsel/yerel Preview kabulü PASS
olmadan hazır denmez. Kaynak veya davranış değişirse ilgili kabul tekrar gerekir.
Main Verify GREEN şartı bağımsızdır. Son koşu `.matrix-tests-final.log`, Matrix
`docs/evidence/matrix/local/acceptance.json`; hero/live/fold/nav/showroom kanıtları
kendi klasörlerindedir. Testler mock admin fixture kullanır; gerçek login/publish yok.

## Yayın öncesi sınırlar

[THIRD_PARTY.md](THIRD_PARTY.md) ve orijinal lisans zorunludur. Kaynak
hematteo/matrix-rain `3752d0b75fd87911a92682313a02e6520ad88d02`, Matteo He,
CC BY-NC-SA4.0’dır. Ticari kullanım izni doğrulanmamıştır; teknik yerel kabul ticari
yayın yetkisi değildir. İzin durumu ticari yayın değerlendirmesinden önce çözülmeli.

Display-P3 desteklenmezse sRGB. İlk canvas context’i sRGB açılmışsa runtime P3 isteği
aynı canvas kimliğini koruyarak sRGB fallback kullanır; P3 başlangıç parametresi
destekleyen tarayıcıda context’i P3 açabilir. Native fullscreen/clipboard/PNG izin ve
API desteğine bağlıdır; reddedilen işlem Türkçe hata bildirir. Clipboard success
testi kontrollü API fixture’ıdır; kullanıcı panosu değiştirilmez. Chromium/SwiftShader
ve CDP dokunma fiziksel cihaz/GPU/performance kabulü değildir; P3.6 durdurulmuş kalır.

İlk tamamlanan tam koşu58/59: yalnız scene.test ready() içinde15sn WebGL hazır olma
timeout’u. Aynı hedefli test kod/test/süre/assertion değişmeden tekrar PASS oldu.
Cold-start timeout’un kesin nedeni belirlenmedi. İlk log `.matrix-tests-first-full.log`,
hedefli tekrar `.matrix-scene-retry.log` ve `docs/evidence/matrix/first-full.json`
korunur; son tam koşu sonucu LAST_REPORT.md içinde ayrıca değerlendirilir.
