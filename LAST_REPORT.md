# ZY Reklam — P3.7 Son Rapor

Tarih: 2026-10-01
Depo: akinarslan/zy_reklam · hedef dal: main
Sonuç: Bağımsız 3D Vitrin / Showroom tamamlandı; üretim build’i ve 29 test başarılı.

## Yerleşim ve ürünler

Yeni `#vitrin` bölümü mevcut hero’nun hemen ardından ve `#hizmetler` bölümünden önce yer alır. Hero’nun bir parçası değildir. Koyu zümrüt atmosfer, masaüstünde solda iki tabela ve sağda totem; dar ekranda okunaklı üst üste ürün düzeni.

- Üst tabela tam `ZY REKLAM`: tok modern karakter, fildişi ZY ön yüzü, şampanya REKLAM ön yüzü, altın/bronz yan yüz ve çerçeve; zümrüt/antrasit taşıyıcı.
- Alt tabela tam `DAHA İLERİYE`: farklı ve dar Nimbus Sans Narrow karakteri; füme taşıyıcı, gümüş/alüminyum çerçeve ve ön yüz, şampanya yan yüz. Metal çizgiler, roughness ve çevre yansımaları.
- Totem: kırıklı/asimetrik antrasit gövde, bronz/amber kanal, gerçek kalınlık ve taban. Üst blok `ZY REKLAM`; dışarı taşan dört fiziksel kutuda `FİKİR`, `TASARIM`, `ÜRETİM`, `GELİŞTİRME`.

Harfler font gliflerinin SVG konturlarından bevel/extrusion ile üretilir; yazı görseli yapıştırılan düzlem kullanılmadı. Panel, gövde, çerçeve, yan yüz ve gölgeler gerçek geometridir. Sahne ana geçişinde 34.374 üçgen doğrulandı. Ürünler temsili tasarım olarak belirtilir; müşteri işi/sahiplik iddiası yapılmaz. Kullanıcının sözünü ettiği NORTHFESTIA referansının dosyası bu çalışma ortamında mevcut değildi; yazılı form ve ışık tarifine göre özgün model üretildi.

## Etkileşim, erişilebilirlik ve kaynak yönetimi

Normal durumda üç obje tamamen sabittir; float/sallanma yoktur. Raycast ve küçük yaklaşma alanı yalnız ilgili ürünün sınırlı tilt, öne gelme, metal highlight ve yumuşak ışık tepkisini çalıştırır. Alt tabela daha kontrollü tepki verir. Totem seçildiğinde amber kanal, ana başlık ve dört panel birlikte aydınlanır; çevre metalinde hafif sıcak yansıma oluşur. Mouse ayrılınca başlangıç durumuna döner.

Dokunma doğrudan canvas üzerinde desteklenir; tepki 900 ms sonra söner. Parmağın kalkması kısa tepkiyi kesmez; dikey sayfa kaydırma korunur. Üç erişilebilir düğme klavyeyle ürün seçimini sağlar. Reduced motion’da 3D görüntü ve ışık korunur, tilt/poz hareketi uygulanmaz.

IntersectionObserver 180 px yaklaşınca dinamik renderer ve harf konturları yüklenir. Idle, görünmeyen bölüm, gizli sekme ve pagehide durumlarında RAF durur. Mobil DPR sınırlanır; sürdürülen yavaş karelerde DPR/gölge kalitesi azaltılır. Temizleme olayları geometri, malzeme, environment, shadow ve WebGL kaynaklarını bırakır.

Mevcut hero koduna dokunmadan bağımsız renderer kullanıldı. Hero ürün sahnesi görünürken showroom RAF çalışmaz. İki context bellekte bulunabilir; mimarinin önceki tek-renderer hedefinin kullanıcı kapsamına özel bu revizyonu A12’de açıkça kaydedildi.

Three.js/modül yüklemesi, WebGL veya context kaybı başarısız olursa aynı gerçek sahneden alınmış responsive masaüstü/mobil WebP statik yedeği görünür. JavaScript kapalıyken de ürünler ve metin erişilebilirdir.

## Korunan alanlar

Başlangıç main: `72d2dcb0cf15ad670f2bb132410b5dbf87ec30dc`. Yeni showroom bloğu çıkarıldığında index.html başlangıç içeriğiyle birebir aynıdır. Hero HTML’i ve bütün src/scene dosyaları değişmedi. Navigation, teklif/iletişim kodu, promosyon/proje stilleri, WhatsApp stili ve wrangler.jsonc SHA-256 eşleşmeleri başarılıdır. Projeler/Promosyonlar mega menüleri, WhatsApp, domain ve Cloudflare yapılandırmasına dokunulmadı. CSS’de yalnız yeni bağımsız stylesheet import’u; main.ts’de yalnız yeni bağımsız adapter bağlantısı eklendi.

## Doğrulama

- `npm run build`: başarılı; TypeScript hatası yok.
- `ZY_CHROMIUM_PATH=/workspace/scratch/b50044a63eb5/qa-tools/chromium npm test`: 29/29 başarılı; mevcut 26 test ve yeni 3 showroom testi.
- Masaüstü/mobil 360, 768 ve 1440 px: yatay taşma ve sayfa hatası yok. Vitrin 360/1440 px görüntüleri görsel olarak incelendi.
- Üç ürünün bağımsız seçimi, gerçek mouse/touch, idle/offscreen duruşu, reduced-motion sabit pozu, lazy yükleme, modül hatası ve context-loss statik yedeği geçti.
- Mevcut hero geometrisi, özgün konturlar, menüler, kategori URL’leri, videolar, WhatsApp ve cihaz ölçüm testleri geçti.

Kanıtlar: `docs/evidence/P3_7_PRESERVATION.json`, `P3_7_SHOWROOM_VERIFICATION.json`; `p3-7-showroom-1440.jpg`, `p3-7-showroom-360.jpg` ve iki ışıklı görünüm. Test tarayıcısı Chromium/ANGLE SwiftShader’dır; mobil viewport emülasyonu fiziksel GPU ölçümü değildir. P3.6 fiziksel kabulü açık kalır.

Vite ortak Three/SVGLoader dosyası yaklaşık 600 KB (gzip 154 KB) için chunk boyut uyarısı verir. Bu hata değildir; Three dinamik yüklenir ve sahneler aynı ortak chunk’ı paylaşır. Yeni npm bağımlılığı eklenmedi.

## Belgeler, varlıklar ve kayıt

Mimari v1.10/A12, roadmap v1.9/P3.7 ve varlık envanteri güncellendi. Yeni src/showroom modülleri, scoped stylesheet, font konturları/lisans bildirimleri, statik yedekler, isteğe bağlı fontTools üretim script’i ve tarayıcı testi eklendi. Normal npm build için Python/font kurulumu gerekmez; konturlar sürümlenmiştir.

Bu rapor proje kökündeki LAST_REPORT.md dosyasının önceki içeriğinin üzerine yazıldı; aynı içerik terminalde gösterildi. Değişiklikler mevcut uzak ağacı koruyarak GitHub main’e kaydedilir; commit kimliği kayıt doğrulamasından sonra son yanıtta verilir. Cloudflare/domain ayarları değiştirilmedi ve canlı yayın başarısı bu raporda iddia edilmez. Sonraki tek iş: canlı yayında yeni bağımsız vitrin bölümünü doğrulamak.
