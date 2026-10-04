# P3.7b — Lightbox ve 360° araç vitrini

## Sonuç
Lightbox ve araç kaplama örneği eklendi. NOVA Coffee bu vitrine özel temsili marka konseptidir. Yeşil, krem ve bakır görsel kimliği iki üründe ortak kullanılır. Araç yatay sürükleme, dokunma, klavye okları ve düğmelerle 360° döner. Lightbox ışığı açılıp kapanır.

## Koruma ve yapı
Hero ve mevcut tabela/totem modelleri korunur. Yeni src/showcase modülü tek renderer ile iki ürünü çizer. Lazy yükleme, olay başına render, idle/offscreen/hidden duruş, context/yükleme yedeği, responsive WebP ve kaynak temizliği vardır. Domain, SEO, iletişim, WhatsApp ve menü uygulaması değiştirilmedi. Mimari v1.12 A13; roadmap P3.7b.

## Değişen dosyalar
index.html; src/main.ts; src/styles/main.css; src/styles/showcase.css; src/showcase/controller.ts, models.ts, renderer.ts; public/assets/showcase/preview.webp ve preview-mobile.webp; tests/showcase.test.mjs, showroom.test.mjs, browser.test.mjs, services.test.mjs; docs/evidence/P3_7B_SHOWCASE.json; ARCHITECTURE.md; ROADMAP.md; LAST_REPORT.md.

## Doğrulama
- npm run build: TypeScript ve üretim build başarılı. Ortak Three.js ertelenmiş paketi için mevcut 500 KB uyarısı sürüyor.
- Yeni iki test: başarılı. 360/1440 px sürükleme, klavye, ışık, reset, taşma, idle/offscreen ve reduced-motion/context yedeği.
- Tam regresyon: 34 test, 31 başarılı / 3 eski beklenti hatası. Başlangıç sürümü aynı hataları doğruladı. Eski #hizmetler nav linki, JSON-LD script sayımı ve HTML-escape başlık beklentileri güncellendi. İlgili 9 test yeniden çalıştırıldı: 9 başarılı, 0 hata. Tüm 34 davranış için başarılı kontrol vardır; tek koşuda 34/34 sonucu iddia edilmez.
- Yeni bölüm masaüstü ve mobil ekranları görsel olarak incelendi. Hero/model dosyalarının Git diff'i boş.
- Test ortamı Chromium / ANGLE SwiftShader ve mobil viewport emülasyonu. Fiziksel GPU/FPS kabulü yapılmadı; P3.6 açık.

## Kayıt ve yayın
GitHub main uygulama commit’i: 44ec239ef9a88555b45d9662f888711ddd27105c. 17 dosyanın uzak Git blob kimliği yeniden okunarak doğrulandı. Cloudflare Workers Builds başarılı. Canlı HTTPS sayfasında yeni bölüm bulundu; canlı origin yanıtlarını ileten yerel HTTP köprüsü üzerinden Chromium gerçek WebGL, araç dönüşü ve ışık düğmesi test edildi: angle 0.0735987755982988, light false, JavaScript hatası yok. Bu köprü fiziksel cihaz ölçümü değildir. GitHub Verify son kontrolde devam ediyordu.

## Sıradaki tek iş
P3.6 kapsamında fiziksel masaüstü ve orta seviye mobil performans kabulünü tamamlamak.
