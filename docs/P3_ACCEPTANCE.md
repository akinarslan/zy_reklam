# P3 — 3D Açılış Kabul Kaydı

**Tarih:** 2026-10-01 · **Durum:** İşlevler doğrulandı; performans kapanışı açık.

Özgün sekiz SVG konturu gerçek ekstrüzyondur; ZY beyaz pleksi/LED/kasa, REKLAM altın metal. R ve A içindeki iki boşluk korunur. Sahne görünürken yüklenir, dönüş yerleşince render durur. Formlar canvas dışında kalır.

15 yerel test başarılıdır; P3 testleri production build preview kullanır. WebGL kapalı/paket hatası/context kaybı, azaltılmış harekette paket indirmeme, yükleme/tercih yarışı, yatay dokunma/dikey scroll ve temizleme denetlendi. BFCache/sekme olayları kontrollü simülasyonla denetlendi.

## Ölçüm profilleri

| Profil | Ortam | Etkileşim örneği | Sonuç |
| --- | --- | --- | --- |
| Masaüstü yazılımsal | Chromium 153 / SwiftShader; 1440 × 900, DPR1, CPU1 | ~4,5 sn / 168 gerçek çizim | ~37,3 FPS; yaklaşık 60 hedefinin altında |
| Mobil emülasyon | Aynı tarayıcı; 360 × 900, DPR2, CPU4 | ~4,5 sn / 232 gerçek çizim | ~51,4 FPS; fiziksel telefon sonucu değildir |
| Fiziksel masaüstü | Model/CPU/GPU profili henüz yok | Çalıştırılmadı | Açık |
| Fiziksel orta seviye mobil | Model/OS/tarayıcı profili henüz yok | Çalıştırılmadı | Açık |

Ham çıktılar P3_VERIFICATION.json içindedir. FPS örneğinin kaydedilmesi test başarısıdır; performans hedefinin kabulü değildir. P3.6 tamamlanmadan P4 teslimine geçilmez. Lighthouse ve tüm site P8 kabulü yapılmadı.

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

SVG 8.340 bayt; geometri ve çevre cihazda üretilir. Harici model/texture/env transferi yoktur. Ertelenen renderer JS 604.835 bayt ham / 154.582 bayt Node gzip ölçümü; ana JS 7.235 bayt hamdır. 3 MB sahne varlık hedefi altında olmak JS çalıştırma maliyetini veya fiziksel FPS hedefini otomatik karşılamaz. Vite 500 KB chunk uyarısı kaydedilmiştir.
