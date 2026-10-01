# Mevcut Site Başlangıç Envanteri

**Tarih:** 2026-10-01 · **Aşama:** P1

## Kaynak ve korunacak sürüm

Kaynak depo: [akinarslan/adex-reklam-demo](https://github.com/akinarslan/adex-reklam-demo).

Sabitlenen commit: `497677a411e8e229333152b7474a1d5f34eb6152`.

32 kaynak dosyası değişmeden `legacy/` altına kopyalandı. `docs/sources/source-manifest.json` dosya bazında SHA-256 ve Git blob kimliklerini içerir. Thumbnail veritabanları, upstream README ve eski demo ekran görüntüsü alınmadı. MIT lisansının telif bildirimi `legacy/LICENSE` içinde korunuyor; bu yazılım lisansı tüm font/fotoğrafların haklarının doğrulandığı anlamına gelmez.

HTML, CSS ve JavaScript önceden build gerektirmeyen statik yapıdadır. Menü, slider, accordion ve WhatsApp iletişim formu mevcut davranışlardır. HTML’de 23 yerel varlık bağlantısının tamamı snapshot içinde mevcuttur.

Canlı site içerik okumasında aynı başlık, hizmetler, iletişim ve sosyal hesap görülmüştür. Bu karşılaştırma içerik düzeyindedir; canlı HTML’nin byte düzeyinde repo ile aynı olduğu iddia edilmez. Doğrudan HTTP istemcisi bu ortamdan 403 aldı; bu sonuç sitenin ziyaretçilere kapalı olduğunu kanıtlamaz. Web okuma aracı aynı sayfanın içeriğini başarıyla aldı.

## URL ve SEO

| Alan | Mevcut değer / korunacak davranış |
| --- | --- |
| Title | ZY REKLAM — Muş; HTML title: `ZY REKLAM | Muş` |
| Canonical | `https://zyreklamdijital.com.tr/` |
| Başlık | Projenize özel çözümler üretiyoruz |
| Anchor’lar | `#anasayfa`, `#hakkinda`, `#promosyonlar`, `#projeler`, `#iletisim` |
| Favicon | Mevcut SVG ikon siyah zeminli; yeni temel kullanıcı tarafından belirlenen tam yazı logosunu siyah zeminde kullanır |
| Sosyal görsel | `assets/images/zy-reklam-social.png`, source HTML’de 1200 × 630 tanımı |
| robots.txt | Allow `/`; sitemap bağlantısı ana domain |
| sitemap.xml | Tek kök URL |
| www | 1 Ekim web okumasında www isteği ana domaine yönlendi; HTTP yönlendirme kodu bu araçta ölçülmedi |

Yeni ön yüzde mevcut anchor’lar korunmuştur. Sosyal görsel ve Apple touch ikonu public alana alınmıştır. Temel içerik HTML’dedir; metadata 3D/JS yüklenmesini beklemez.

## Ticari içerik

| Alan | Doğrulama |
| --- | --- |
| Telefon / WhatsApp | `+90 546 449 48 49` / `905464494849`; kaynak HTML, script ve canlı metinde aynı |
| İletişim adı | Zafer YILDIZ |
| Adres | Zafer Mah. Erzurum Yolu. Üniversite Kavşağı. Ayyıldızlar Apt. No: 8, Muş, 49100, Türkiye |
| Instagram | `https://www.instagram.com/zy.reklam/` |
| İmza | `@yakinyazilim`; kaynakta bağlantı hedefi yok, metin olarak korunur |
| Hizmetler | İmalat, Tabela ve Montaj, Lazer Kesim, Dijital Baskı, Promosyonlar |
| CNC / UV | Kaynakta doğrulanmadı; gerçek hizmetmiş gibi yeni sayfaya eklenmedi |
| Projeler | Kaynakta tür örnekleri var; müşteri/proje adı, tarih ve gerçek iş fotoğrafı doğrulaması yok. P5 için bekliyor |

## Yayın ortamı ve açık noktalar

Geçmiş DNS ekranları Cloudflare kullanımını gösteriyor; kaynak HTML’de Cloudflare otomatik yayın notu var. Bunlar mevcut hosting projesinin erişimi, yayın komutu veya yeni deponun otomatik yayına bağlı olduğunu kanıtlamaz. Bu işte hosting/DNS ayarı değiştirilmedi; canlı sürüm yayınlanmadı.

P9’da mevcut deployment hedefi, erişim ve geri dönüş yöntemi doğrulanacak. P7 upload sağlayıcısı seçilmedi. Mevcut ortam uygunsa Cloudflare Worker + özel nesne deposu veya mevcut hostingde ayrı API değerlendirilebilir; maliyet/erişim görülmeden sağlayıcıya bağlanılmayacak.

## P2 teknoloji kararı

Mevcut DOM tabanlı yaklaşım korunur. Yeni kod Vite + TypeScript ile modüllere ayrılır; React veya başka arayüz framework’ü eklenmez. Three.js yalnızca P3’te ertelenen ürün sahnesi için eklenir. Bu, mevcut HTML/CSS mantığını koruyan build ve modül düzenlemesidir.

Doğrulanan ortam: Node 24.19.0. Sabit sürümler: Vite 8.3.2, TypeScript 7.0.2, Playwright 1.62.1. Paket sürümleri npm’den okundu; lockfile üretildi. Vite’ın [resmî başlangıç rehberi](https://vite.dev/guide/) ve TypeScript’ın [resmî dokümanı](https://www.typescriptlang.org/docs/handbook/intro.html) kontrol edildi.

Çalıştırma: `npm ci`, sonra `npm run dev`. Kontrol: `npm run build`. Tarayıcı testleri: `npx playwright install chromium`, sonra `npm test`. Bu ortamda Playwright’ın tarayıcı CDN aktarımı bozuk ZIP döndürdü; varsa alternatif yerel Chromium yolu `ZY_CHROMIUM_PATH` ile kullanılabilir. Bu kurulum hatası uygulama testi başarılı sonucu olarak değerlendirilmez.

## P2 doğrulama sonucu

`npm run build` geçti. Vite çıktısı: HTML 11,08 KB, CSS 13,95 KB, JS 3,89 KB (ham build boyutları; public font/görsel varlıkları bu sayılara dahil değildir). TypeScript kontrolü build içinde geçti.

Chromium 153.0.8010.0 ile `ZY_CHROMIUM_PATH=<yerel Chromium yolu> npm test` altı testte başarılı oldu. Kanıt `docs/evidence/P2_VERIFICATION.json` içindedir. CDN indirme hatası bu ortam için yerel Chromium ile aşıldı; alternatif tarayıcı paketi proje bağımlılığına eklenmedi. CI normal Playwright kurulumunu kullanır; bu rapor yerel sonucu kaydeder. Lighthouse, FPS ve P8 uçtan uca kabulü çalıştırılmadı.
