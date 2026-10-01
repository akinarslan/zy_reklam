# P3.6 — Fiziksel cihaz ölçüm yöntemi

**Durum:** Araç hazır; gerçek cihaz kabulü henüz yapılmadı.

## Açma

Cloudflare önizlemesinin adresine `/qa/scene-performance.html` ekleyin. Yerelde `npm run build && npm run preview` sonrasında aynı yolu açabilirsiniz. Bu bağımsız QA sayfası ana menüde ve sitemap'te yer almaz; `noindex, nofollow` içerir. Ana sayfa QA JavaScript'ini indirmez.

## Aynı yöntemle ölçüm

1. Gerçek bilgisayar veya telefonda sayfayı açın. Tarayıcı emülasyonunu ve CPU throttling'i kapatın; cihaz modeli, işletim sistemi sürümü, tarayıcı sürümü ve güç koşulunu kaydedin. Mobilde klavyeyi kapatın; ekranı aynı yönde tutun.
2. Cihaz türünü ve çalışma ortamını doğru seçin. “Gerçek cihaz” seçimi kullanıcı beyanıdır; araç fiziksel donanımı kendiliğinden doğrulamaz. Model ve işletim sistemi alanlarını doldurun.
3. Kabul örnekleri için **3 × 10 saniye** seçin. Her örnek öncesindeki 1 saniyelik ısınma kayda dahil edilmez. **3 × 3 saniye** yalnızca hızlı araç kontrolüdür; fiziksel aşama kabulüne tek başına yetmez.
4. “Ölçümü başlat” düğmesine basın. Ana sitenin gerçek üretim sayfası, tam pencere boyutunda aynı origin iframe'inde açılır; ayrı bir model veya ikinci WebGL renderer kurulmaz. Üç örnekte aynı sentetik fare hareketi kullanılır. Hareket azaltma etkinse ölçüm yapılmaz; ayrı açık kullanıcı düğmesiyle hareket açılabilir.
5. Ölçüm bitince JSON raporunu indirin. Dosya kendiliğinden sunucuya yüklenmez; kullanıcı paylaşır. Raporu cihaz modeli ve manuel kontrol notlarıyla birlikte inceleyin.

Sekme gizlenmesi, ekran boyutu/yön değişimi, kullanıcı iptali ve WebGL/context/fallback hatası başarılı sonuç üretmez. Aynı koşullarda yeniden başlatın. Araç mevcut kalite azaltma politikasına müdahale etmez; kalite geçişleri her örnekte kayıtlıdır.

## Kaydın anlamı

Rapor `schemaVersion`, tarih, origin, build script yolları, kullanıcı cihaz/güç beyanı, user-agent, mevcutsa GPU renderer, viewport/DPR, sahne boyutu, üç ham örnek, yaklaşık bir saniyelik FPS pencereleri, kalite geçişleri ve üç ortalama değerin ortancasını içerir.

FPS `data-render-count` farkından hesaplanan **render çağrısı hızıdır**. Ekranda sunulan GPU karelerini veya gerçek kullanıcı deneyimini tek başına kanıtlamaz. Ortalama/ortanca sayıyla takılmalar gizlenmez: ham pencereleri ve kalite geçişlerini inceleyin. Araç CPU throttling uygulamaz. Donanım GPU yerine software renderer kullanıyorsa bu koşulu ayrıca belirtin.

## Fiziksel kabul kaydı

| Kontrol | Masaüstü | Orta seviye mobil |
| --- | --- | --- |
| Cihaz modeli / CPU / GPU / OS / tarayıcı sürümü | Bekliyor | Bekliyor |
| Viewport / DPR / güç ve hızlandırma koşulu | Bekliyor | Bekliyor |
| Üç adet 10 saniyelik ham örnek / kalite pencereleri | Bekliyor | Bekliyor |
| Hedef: tanımlı masaüstü yaklaşık 60, mobil ≥30 FPS | Ölçülmedi | Ölçülmedi |
| Gerçek fare / yatay dokunma / dikey scroll / görsel gölge kontrolü | Bekliyor | Bekliyor |
| Hareket azaltma ve güvenli poster kontrolü | Bekliyor | Bekliyor |

JSON içindeki `acceptance` otomatik PASS değildir. Donanım profili, örnek süresi, kalite değişimi ve manuel kontroller incelenmeden P3.6 kutusu işaretlenmez. P4 kabulü bu kayıt kapanana kadar bekler.

## Geliştirme kanıtı

Üretim build'inde headless Chromium/SwiftShader ile mobil 360 px/DPR2 üç hızlı örnek ve JSON indirme doğrulandı. İptal, resize, kontrollü gizli sekme olayı, azaltılmış hareket/açık kullanıcı tercihi ve gerçek WEBGL_lose_context kontrolleri başarılıdır. Örnek kayıt `docs/evidence/P3_DEVICE_TOOL_SAMPLE.json` yazılımsal QA ortamındandır; fiziksel cihaz raporu değildir.

Cloudflare Pages için depo `akinarslan/zy_reklam`, dal `main`, build `npm run build`, çıktı `dist`, Node `24.19.0` ayarları kullanılır. Önizleme adresi henüz depodaki erişilebilir durum kayıtlarından doğrulanmadı; kullanıcı bağlantısıyla ayrıca kontrol edilir. Ana domain yayını P9 kabulü değildir.
