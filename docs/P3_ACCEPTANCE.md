# P3 — 3D Açılış Kabul Kaydı

**Tarih:** 2026-10-01 · **Durum:** İşlevler doğrulandı; performans kapanışı açık.

Özgün sekiz SVG konturu gerçek ekstrüzyondur; ZY beyaz pleksi/LED/kasa, REKLAM altın metal. R ve A içindeki iki boşluk korunur. Sahne görünürken yüklenir, dönüş yerleşince render durur. Formlar canvas dışında kalır.

19 yerel test başarılıdır; P3 testleri production build preview kullanır. WebGL kapalı/paket hatası/context kaybı, azaltılmış harekette paket indirmeme, yükleme/tercih yarışı, yatay dokunma/dikey scroll ve temizleme denetlendi. BFCache/sekme olayları kontrollü simülasyonla denetlendi.

## Ölçüm profilleri

| Profil | Ortam | Etkileşim örneği | Sonuç |
| --- | --- | --- | --- |
| Masaüstü yazılımsal | Chromium 153 / SwiftShader; 1440 × 900, DPR1, CPU1 | ~4,5 sn / 168 gerçek çizim | ~37,3 FPS; yaklaşık 60 hedefinin altında |
| Mobil emülasyon | Aynı tarayıcı; 360 × 900, DPR2, CPU4 | ~4,5 sn / 232 gerçek çizim | ~51,4 FPS; fiziksel telefon sonucu değildir |
| Fiziksel masaüstü | Model/CPU/GPU profili henüz yok | Çalıştırılmadı | Açık |
| Fiziksel orta seviye mobil | Model/OS/tarayıcı profili henüz yok | Çalıştırılmadı | Açık |

İlk teslim ölçümleri yukarıda tarihsel olarak korunmuştur. Güncel işlev çıktıları P3_VERIFICATION.json, eşleşmiş performans örnekleri P3_PERFORMANCE_COMPARISON.json içindedir. FPS örneğinin kaydedilmesi test başarısıdır; performans hedefinin kabulü değildir. P3.6 tamamlanmadan P4 teslimine geçilmez. Lighthouse ve tüm site P8 kabulü yapılmadı.

## Tekrar doğrulama

```sh
npm ci
npm run build
npx playwright install chromium
npm test
```

Üretim preview için `npm run preview`. Sahneye fareyi gezdirin; telefon üzerinde yatay sürükleyin ve aynı alanda dikey sayfa kaydırmayı deneyin. Fiziksel cihaz kabul kaydında cihaz/OS/GPU/tarayıcı, viewport/DPR, güç modu, örnek süresi, aktif etkileşim FPS dağılımı ve kalite/poster durumunu belirtin. Idle durumda FPS 0 olması tasarlanan tasarruf davranışıdır; aktif etkileşimle karıştırılmamalıdır.

Yalnızca bu çalışma ortamında geçici Chromium paketinin Vulkan loader/SwiftShader dosyalarının executable yanında olması gerekti. Bunlar uygulamaya eklenmedi. Uzak CI standart Playwright browser kurulumu kullanır.

## Kaynak bütçesi

SVG 8.340 bayt; geometri ve çevre cihazda üretilir. Harici model/texture/env transferi yoktur. Ertelenen renderer JS 606.055 bayt ham / 155.041 bayt Node gzip ölçümü; ana JS 7.235 bayt hamdır. 3 MB sahne varlık hedefi altında olmak JS çalıştırma maliyetini veya fiziksel FPS hedefini otomatik karşılamaz. Vite 500 KB chunk uyarısı kaydedilmiştir.

## P3.6 optimizasyon karşılaştırması

Gölge güncellemesi hareket sırasında 20 Hz ile sınırlıdır; son poz güncellenir. Sahnenin kendi çizim döngüsü bu sınırla kısıtlanmaz. Yeni testte 26 çizim sırasında 10 gölge güncellemesi yapıldı; son açı eşleşmesi ve idle durma geçti.

Aynı Chromium 153/SwiftShader sürecinde her profilde üç dönüşümlü önce/sonra çifti, her örnekte 4,5 saniye aktif hareket kullanıldı.

| Profil | Önce ortanca (aralık) | Sonra ortanca (aralık) | Kabul |
| --- | --- | --- | --- |
| 1440 × 900 / DPR1 / CPU1 | 36,6 (30,9–37,0) FPS | 38,2 (35,7–38,8) FPS | Yaklaşık 60 hedefi doğrulanmadı |
| 360 × 900 / DPR2 / CPU4 | 51,2 (50,1–52,4) FPS | 52,3 (51,1–52,3) FPS | Fiziksel mobil ölçümü değildir |

Aralıklar örtüşür; küçük ortanca artışı cihazlar için garanti değildir. Karşılaştırma başlangıcı main 1153c07bb58ef9ee7b641cea9eb5d278de2d16d1. Yeni build bütçesi P3_BUDGET.json içinde kayıtlıdır. Özgün SVG değişmedi.

Tekrar ölçmek için eski build'in `dist` klasörünü ayrı yerde koruyun, güncel build'i üretin ve çalıştırın:

```sh
node scripts/compare-scene.mjs /absolute/path/to/baseline-dist BASELINE_COMMIT
```

Araç standart Playwright Chromium kullanır; gerekirse ZY_CHROMIUM_PATH ile kurulu tarayıcı seçilir. 4198 portunda yalnızca localhost üzerinden iki build'i sırayla sunar ve JSON kaydını günceller. Önce/sonra çiftleri aynı viewport/DPR/CPU profiliyle çalışır. Fiziksel cihaz kabulü ayrıca yukarıdaki cihaz bilgileriyle kaydedilmelidir.

## Cihaz ölçüm aracı

P3.6a aracı `/qa/scene-performance.html` yolunda hazırdır; kullanıcının cihazında üç aktif örneği ve kalite/FPS pencerelerini kaydeder, raporu yalnızca açık indirme eylemiyle verir. Varsayılan üç 10 saniyelik örnek ve cihaz/manual kontrol yöntemi docs/P3_DEVICE_MEASUREMENT.md içindedir. P3_DEVICE_TOOL_SAMPLE.json üç hızlı yazılımsal QA örneğidir; yukarıdaki fiziksel cihaz satırları hâlâ ölçülmedi.

## P3.6b ortak logo katmanı karşılaştırması

Ana sahne çizim çağrısı 27 → 13 (%51,9 azalma); gölge yenilemesi başına ek çağrı 22 → 8 (%63,6 azalma). Bu ayrıştırma, gerçek WebGL2 çağrı toplamı ile render/gölge sayaçlarından hesaplandı ve 12 örneğin tamamında birebir doğrulandı.

Aynı başlangıç açısındaki masaüstü ve mobil canvas PNG’leri RGBA piksel düzeyinde önceki build ile aynıdır; görüntüler ayrıca incelendi. Özgün sekiz kontur, R/A içindeki iki boşluk, katman derinlikleri, malzemeler ve 4.882 ana sahne üçgeni korundu. Gölge yenilenen render’da sayaç 9.714 üçgen ve 21 toplam çağrı gösterebilir; bu ana sahne ile gölge işinin toplamıdır.

| Profil | Önce ortanca (aralık), FPS | Sonra ortanca (aralık), FPS |
| --- | --- | --- |
| 1440 × 900 / DPR1 / CPU1 | 38,6 (32,9–40,7) | 35,5 (35,4–39,3) |
| 360 × 900 / DPR2 / CPU4 | 48,9 (48,8–59,5) | 49,3 (49,2–57,1) |

Masaüstü yazılımsal ortanca 38,6 → 35,5 FPS; mobil emülasyon 48,9 → 49,3 FPS. Aralıklar örtüşür; bu çalışma tutarlı FPS artışı göstermedi. Fiziksel cihaz performans kabulü açık kalır. Başlangıç commit’i a02713a2526270382175780361ca5828ef7a1be3; aynı Chromium 153/SwiftShader sürecinde her profilde üç dönüşümlü önce/sonra çifti, örnek başına 4,5 saniye hareket ve iki tarafta aynı WebGL çağrı sayacı kullanıldı. Örnekler, gölge/render/GL çağrıları ve ayrıştırma P3_BATCH_COMPARISON.json içindedir. 19/19 yerel test geçti.

Yeni build’in aynı konturları ve görünümü koruması P3_BATCH_VISUAL_VERIFICATION.json içinde kayıtlıdır; görsel karşılaştırma yalnızca başlangıç pozudur, hareket/dokunma ve hata yolları production tarayıcı testleriyle doğrulandı. Paket farkı +967 ham / +337 Node gzip bayt; 500 KB uyarısı korunur.

Eski gölge ölçümünü korumak için yeni çıktı adıyla çalıştırın:

```sh
node scripts/compare-scene.mjs /absolute/path/to/baseline-dist BASELINE_COMMIT P3_BATCH_COMPARISON.json
```

Son render sayacı gölge işini de içerebilir; ayrıştırılan ana sahne çizimi ile karıştırılmamalıdır. Eski build’de gölge sayacı yoksa ham GL toplamı/FPS yine kaydedilir, ayrıştırma yapılmaz.
