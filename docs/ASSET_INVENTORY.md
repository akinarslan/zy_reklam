# ZY Reklam — Varlık Envanteri

**Tarih:** 2026-10-01 · **Aşama:** P1.2 — envanter kaydı tamamlandı; gerçek proje varlıkları bekliyor

| Alan | Değer |
| --- | --- |
| Kaynak | Kullanıcının “logo bu” talimatıyla eklediği `Ekran görüntüsü 2026-10-01 111754.png` |
| Depo yolu | [zy-reklam-reference.png](../public/assets/brand/zy-reklam-reference.png) |
| Format / boyut | PNG, 266 × 72 px, RGBA, 14.832 bayt |
| Görsel kimlik | Beyaz ZY, altın REKLAM; koyu zümrüt–siyah zemin; yatay tam yazı logosu |
| Kaynak bütünlüğü | Yeniden kodlanmadan ve görsel değiştirilmeden kopyalandı |
| SHA-256 | `22655b453807bcb1c35c60f1d62304af4e78092199e4ada6dc59b00286715d8b` |
| Git blob SHA | `afa6085892b1a68432ebdb914584218737da332e` |
| Kullanım talimatı | Kullanıcı bunu projenin logosu olarak belirledi; lisans/sahiplik belgesi ayrıca sunulmadı |
| Kullanım durumu | Görsel referans; büyük hero/3D üretim varlığı olarak hazır sayılmaz |

3D materyal eşlemesi: beyaz ZY ışıklı pleksi; altın REKLAM metal. Harfler benzer fontla yeniden yazılmaz; kaynak konturları korunur. Zeminin kaldırılması, kontur çıkarımı veya yeni görsel üretimi bu işte yapılmadı.

## Varlık durumları

| Varlık | Durum | İş |
| --- | --- | --- |
| Mevcut site kaynakları | 32 dosya legacy altında; manifest doğrulandı | P1.1 tamamlandı |
| Vektör ve PDF logo | Kaynak SVG ve kullanıcı PDF’si incelendi | P1.3 tamamlandı |
| Statik poster / 3D kontur girdisi | Özgün SVG hazır; P3 gerçek ekstrüzyon geometrisi bu konturlardan üretilir | P1.3/P3.1 tamamlandı |
| Citadel of Blackrose | WOFF, lisans metni ve glif kontrolü kaydedildi | P1.4 tamamlandı; ödeme belgesi yok |
| Gerçek proje fotoğrafları | Müşteri işi oldukları doğrulanmadı | P1.5 / P5 bekliyor |

P1.2 envanter çalışması tamamlandı; eksik proje içeriği varmış gibi gösterilmez. P1 bütünü P1.5 nedeniyle açık kalır.

## 2026-10-01 — Kaynak varlıklar ve font incelemesi

| Varlık | Kaynak ve durum |
| --- | --- |
| Mevcut site | `legacy/` altında sabit commit’ten alınan 32 dosya; manifest ile doğrulandı |
| Vektör tam yazı logosu | `public/assets/brand/zy-reklam-wordmark.svg`; mevcut repo SVG’si, 8 path, viewBox 197 373 629 88; beyaz ZY/altın REKLAM konturları görsel olarak referansla eşleşiyor |
| Statik logo gösterimi | Aynı SVG poster olarak CSS zemin üzerinde kullanılır; ayrı raster büyütme yapılmaz |
| PDF kaynak | `docs/sources/zy-logo-source.pdf`; önceki kullanıcı PDF’si değişmeden alındı; 1 sayfa, 17 vektör çizimi, 0 raster görüntü; render incelendi |
| Citadel WOFF | `public/assets/fonts/citadel-of-blackrose.woff`; mevcut kaynak deposundan değişmeden alındı |
| Font kullanım metni | `public/assets/fonts/citadel-of-blackrose-license.txt`; arşiv ve font metadata’sı tek proje için €2 ödeme koşulunu belirtiyor; ödeme belgesi bu envanterde yok |
| Türkçe destek | Başlığın tüm glifleri mevcut; genel Türkçe sette Ğ, ğ, İ, Ş, ş eksik. Gövde/formlar Türkçe destekli sistem fontu kullanır; font sessizce değiştirilmedi |
| Gerçek proje fotoğrafları | Henüz doğrulanmadı; legacy demo görselleri gerçek müşteri işi olarak yeni galeride kullanılmaz |
| Sosyal / Apple ikon | Mevcut kaynak varlıkları public alana alındı; source SVG’den siyah zeminli tam yazı favicon’u hazırlandı |

Kaynak PDF, ekran görüntüsündeki yatay yazıya ek olarak geometrik amblem içerir. Son verilen referans gereği yatay tam yazı logosu ana kimliktir; PDF’nin ek amblemi zorunlu açılış sahnesi olarak eklenmedi.

Fontun ticari kullanım koşulu kaydedilmiştir; kaynakta mevcut kullanımı ve kullanıcının font talimatı geliştirme kararıdır. Bu envanter bir satın alma belgesi veya hak onayı üretmez.

P3 kaynak bütünlüğü: özgün SVG değişmedi; sekiz path ve iki iç boşluk renderer geometrisinde doğrulandı. Harici GLB/HDR/texture eklenmedi. docs/evidence/P3_BUDGET.json kimlik ve boyut kanıtını içerir.

## 2026-10-01 — Promosyon katalog görselleri

Kullanıcının sağladığı 14 görsel açılıp dört ana kategoriye ayrıldı; 28 responsive WebP türevi hazırlandı. Dosya/fotoğraf eşlemesi ve içerik sınırı [PROMOTION_ASSETS.md](PROMOTION_ASSETS.md), kaynak SHA-256 ve gerçek türev ölçüleri src/content/promotions.json içindedir. Bunlar P2.7 katalog varlıklarıdır; P1.5/P5 gerçek müşteri projesi kabulünü kapatmaz. Kaynak logo/font/legacy varlıkları korundu.

## 2026-10-01 — Proje örnekleri

19 fotoğraf ve bir video kullanıcı tarafından örnek kategoriler için sağlandı. Görsel inceleme/eşleme docs/PROJECT_ASSETS.md, kaynak hash ve ölçüler src/content/projects.json içinde. Üçüncü taraf marka/filigran içerikleri müşteri referansı olarak sunulmaz; mevcut işaretler silinmedi. 38 WebP ve video/poster public/assets/project-examples altında; kaynak dosyalar değiştirilmedi.

## 2026-10-01 — Ek proje medyası

Altı fotoğraf (ilk beş Tabela, sonuncu Totem) ve yazili_su.mp4 (Özel Üretim) kullanıcı talimatıyla eklendi. Dosya eşleşmeleri docs/PROJECT_ASSETS.md; kaynak SHA-256 ve türev ölçüleri src/content/projects.json içinde. 12 WebP ve video/poster; kaynaklar değişmedi, sahiplik/gerçek ZY müşteri referansı doğrulaması yapılmadı.

## 2026-10-01 — Bağımsız 3D Vitrin

P3.7 modelleri bu proje için kodla üretildi; fotoğraf yapıştırılan düzlem veya üçüncü taraf müşteri referansı kullanılmadı. `public/assets/showroom/letter-outlines.json` gerçek font konturlarından türetilmiş SVG yollarıdır; SVGLoader + bevel/extrusion ile fiziksel ön/yan yüzler üretir. ZY REKLAM/totem için DejaVu Sans Bold; DAHA İLERİYE için Nimbus Sans Narrow Regular kullanıldı. Türkçe İ/Ü/Ş dahil kaynak glifler doğrulandı. Font yazılımları dağıtılmadı; türetilmiş konturlar ve ilgili DejaVu/URW lisans bildirimleri `FONT_NOTICES.txt` ile kaydedildi. Hero’nun özgün logo/font varlıkları aynı kaldı.

`static-desktop.webp` ve `static-mobile.webp` yeni gerçek WebGL sahnesinin hareketsiz ekran görüntüleridir; Three.js yüklenemediğinde veya context kaybında aynı ürün düzenini gösterir. Her üç ürün temsili ürün tasarımı olarak etiketlenir; gerçek üretim/müşteri sahipliği kabulü değildir.

## 2026-10-01 — P3.7a harf revizyonu

Yeni ekran görüntüsü açılıp geometrik/yuvarlatılmış özgün ZY wordmark stili doğrulandı. letter-outlines.json artık DejaVu/Nimbus fontlarını kullanmaz: özgün SVG’den Z/Y/R/E/K/L/A/M konturları ve aynı dilde kodla oluşturulan ek glifler. Hero wordmark dosyası değişmedi. Python fontTools yalnız isteğe bağlı kontur üretim script’i içindir; npm build sürümlenmiş JSON’u kullanır. Önceki FONT_NOTICES.txt önceki varlıkların tarihsel bildirimi olarak tutulur. Masaüstü/mobil WebP yedekler yeni gerçek krom kasalı 3D görünümden yenilendi.
