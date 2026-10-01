# ZY Reklam — Yol Haritası

**Sürüm:** 1.2 · **Başlangıç:** 2026-10-01

**Kaynak:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Zorunlu kontrol:** [AGENTS.md](AGENTS.md)

## 1. Güncel durum

**Son tamamlanan aşama:** P2 — Ön yüz ve içerik temeli.

**Aktif aşama:** P3 — Gerçek 3D açılış uygulandı; performans kapanışı devam ediyor.

P1 kaynak, logo, font ve iletişim incelemesi yapıldı; gerçek proje bilgileri/fotoğrafları doğrulanmadığı için P1.5 açık kalır. Planın engel yönetimi uyarınca bağımsız P2 temeli tamamlandı. Vite/TypeScript sayfası, statik SVG poster, mobil menü, hareket tercihi ve temel WhatsApp iletişim akışı çalışıyor. Gerçek 3D açılış şimdi uygulanmıştır. Üretim animasyonları, galeri, stüdyo ve upload henüz uygulanmadı.

Durumlar: `bekliyor`, `devam ediyor`, `engelli`, `tamamlandı`. İş kutuları yalnızca kabul kanıtı üretildikten sonra işaretlenir. Bu dosya her kullanıcı talimatından önce okunur ve iş bitiminde güncellenir.

## 2. Aşamalar ve sıra

| Aşama | Çıktı | Bağımlılık | Durum |
| --- | --- | --- | --- |
| P0 | Mimari, roadmap ve çalışma kuralları | Kullanıcının tasarım yönü | Tamamlandı |
| P1 | Mevcut site, varlık, SEO ve yayın envanteri | P0 | Devam ediyor |
| P2 | Ön yüz temeli, mobil düzen, içerik ve güvenli yedek | P1 geliştirme kaynakları; P1.5 proje içeriği açık | Tamamlandı |
| P3 | Özgün ZY ile 3D açılış | P2 + doğrulanmış logo | Devam ediyor; fiziksel GPU kabulü açık |
| P4 | Üretim anlatımı ve hizmet etkileşimleri | P3 | Bekliyor |
| P5 | Gerçek proje galerisi | P2 + gerçek görseller; teslim sırası P4 sonrası | Bekliyor |
| P6 | Mini stüdyo ve WhatsApp teklif metni | P3, P5 + doğrulanmış iletişim | Bekliyor |
| P7 | Güvenli görsel yükleme ve teklif bağlantısı | P6 + sağlayıcı/veri politikası kararı | Bekliyor |
| P8 | Uçtan uca kabul, mobil/performance/SEO | P2–P7 | Bekliyor |
| P9 | Yetkilendirilmiş canlı geçiş ve geri dönüş kontrolü | P8 + mevcut hosting erişimi/yayın yetkisi | Bekliyor |

İşler bağımlılıkları karşılanmadan tamamlanamaz. Galeri içeriği gibi bağımsız hazırlıklar öne alınabilir; aşama teslim sırası korunur. Kullanıcının hata düzeltme/öncelik değiştirme talimatları belgelenerek uygulanır.

Süreler takvim taahhüdü değildir. P1 sonrası logo kalitesi, gerçek görsel sayısı, mevcut kod ve upload sağlayıcısına göre efor tahmini yapılır. Erişim/varlık bekleme süreleri çalışma süresinden ayrı tutulur.

## 3. P0 — Planlama ve kalıcı çalışma disiplini

- [x] P0.1 Mimari ve kapsam `ARCHITECTURE.md` içinde kaydedildi.
- [x] P0.2 Aşamalar, bağımlılıklar ve kabul ölçütleri bu dosyada kaydedildi.
- [x] P0.3 Her talimatta plan kontrolü `AGENTS.md` ile tanımlandı.
- [x] P0.4 Belgeler GitHub `main` dalında yeniden okunarak doğrulandı.

**Kabul:** Belgeler birbirine bağlanır, uygulanan/plandaki işler ayrıdır, mevcut canlı site veya kod değişmez. Uzak kaydın kanıtı bulunur.

## 4. P1 — Mevcut site ve varlık envanteri

- [x] P1.1 Mevcut site kaynaklarını depoya al veya doğrulanmış erişilebilir kaynağı kaydet; çalışma ağacını ve başlangıç commit’ini koru.
- [x] P1.2 Logo, PDF/vektör kaynak, fontlar ve görselleri `docs/ASSET_INVENTORY.md` içine dosya/kaynak/kullanım hakkı/eksik durumu ile yaz.
- [x] P1.2a Kullanıcının gönderdiği tam yazı logosunu değişmeden referans olarak kaydet; özelliklerini envantere yaz. Kaynak dosyaları ve eksikler envantere kaydedildi.
- [x] P1.3 ZY ambleminin onaylı vektörünü ve statik posterini hazırla; kaynakla oran/kontur karşılaştırmasını kaydet.
- [x] P1.4 Citadel of Blackrose fontunun Türkçe glifleri ve kullanım koşullarını denetle; 45 pt masaüstü başlık şartını kaydet.
- [ ] P1.5 Gerçek hizmetler, WhatsApp numarası, iletişim, sosyal bağlantılar ve proje bilgilerini doğrula. **Kısmi:** hizmet/iletişim doğrulandı; gerçek proje fotoğrafları ve proje bilgileri bekliyor.
- [x] P1.6 Mevcut URL/SEO/favicon/domain-www/hosting/build durumunu `docs/BASELINE.md` içine kaydet.
- [x] P1.7 Ön yüz stack’i, mevcut yapıyı koruma/geçiş yöntemi, upload sağlayıcısı adayları ve ortam gereksinimlerini karar kaydına yaz.

**Kabul:** Geliştirme için gerekli kaynaklar bulunur; eksikler görünürdür. Logo/font/iletişim tahmin edilmez. P2 için çalıştırma ve build yöntemi seçilmiştir. Hosting sağlayıcısı doğrulanmadan yayın komutu yazılmaz.

**Engel yönetimi:** Eksik proje fotoğrafı içerik hazırlığını engelleyebilir; temel layout hazırlanabilir. Eksik logo P3’ü, doğrulanmamış iletişim P6’nın gerçek WhatsApp kabulünü, eksik upload erişimi P7’yi engeller. Uydurma varlıkla bu engeller kapatılmaz.

## 5. P2 — Ön yüz ve içerik temeli

- [x] P2.1 P1 stack kararına göre yapı, paket/lockfile, TypeScript ve build düzenini kur.
- [x] P2.2 Tema tokenlarını, yerel fontları, responsive layout ve semantik bölümleri oluştur.
- [x] P2.3 Navbar, slogan, CTA, gerçek hizmet/iletişim içeriği ve zümrüt footer’ı uygula.
- [x] P2.4 Statik amblem/poster, 3D yükleme yedeği, hareket azaltma tercihi ve mobil etkileşim temelini kur.
- [x] P2.5 SEO metadata/favicon/canonical/robots/sitemap başlangıcını envantere göre koru veya hazırla.
- [x] P2.6 Değişikliğe uygun test/CI kontrollerini ekle; sırlar, build, bağımlılık ve upload dosyalarını Git dışında tut.

**Kabul:** 360, 768 ve 1440 px genişliklerde yatay taşma yoktur. Başlık masaüstünde 45 pt, mobilde okunaklıdır. CTA ve temel iletişim 3D’den bağımsız çalışır. Klavye odakları görünür; build ve seçilen statik analiz kontrolleri geçer. CI mevcut değilse başarı iddia edilmez; kurulan kontrollerin gerçek çıktısı kaydedilir.

## 6. P3 — 3D ZY açılış

- [x] P3.1 Onaylı özgün amblemi katmanlı tabela geometrisine dönüştür.
- [x] P3.2 Beyaz ışıklı pleksi, altın metal, çevre ışığı ve gölgeyi oluştur.
- [x] P3.3 Masaüstü sınırlı fare dönüşünü ve mobil sürüklemeyi uygula; dikey scroll’u koru.
- [x] P3.4 Ertelenmiş 3D yükleme, kalite düşürme, görünmezken durma ve kaynak temizliğini uygula.
- [x] P3.5 WebGL yokluğu, context kaybı ve hareket azaltma yollarını doğrula.
- [ ] P3.6 Aşama kabulündeki fiziksel masaüstü/orta seviye mobil FPS hedeflerini ölç; gerekiyorsa sonraki aşamadan önce optimize et. Yazılımsal emülasyon ölçümü tek başına bu kabulü kapatmaz.

**Kabul:** Amblem özgün kaynakla eşleşir; yaklaşık yazı logosu kullanılmaz. İlk içerik 3D’yi beklemez. CTA üzerine canvas binmez. Model/texture/env başlangıç 3 MB hedefinde ölçülür. Tanımlı masaüstü ve mobil cihazlarda kare hızı kaydedilir; bütçe aşılıyorsa sonraki aşamadan önce optimize edilir veya hedef revizyonu gerekçelendirilir.

## 7. P4 — Üretim sahnesi ve hizmetler

- [ ] P4.1 Örnek tabela katmanlarının ayrılıp birleşmesini scroll ilerlemesine bağla.
- [ ] P4.2 Katmanları anlaşılır DOM açıklamalarıyla eşleştir.
- [ ] P4.3 Lazer kesim ve baskı için kısa, sınırlı maliyetli görsel anlatımları ekle.
- [ ] P4.4 Doğrulanmış hizmetlerin her birinden uygun teklif türüne geçişi ekle.
- [ ] P4.5 Tek aktif renderer, sahne geçişi ve mobil/sade sürümü kontrol et.

**Kabul:** Kaydırma sıkışmaz, zorunlu uzun bekleme yoktur. Hareket azaltıldığında tüm açıklamalar ve CTA’lar okunur. Katmanlar örnek üretim olarak tanımlanır. Tek aktif renderer hedefi ve sahneden çıkışta durma doğrulanır.

## 8. P5 — Gerçek proje galerisi

- [ ] P5.1 Doğrulanmış fotoğraf ve proje bilgilerini yapılandırılmış içerik olarak ekle.
- [ ] P5.2 Hizmet filtrelerini, büyük proje görünümünü ve mobil galeriyi oluştur.
- [ ] P5.3 Gerçek çifti olan işlerde önce/sonra karşılaştırması ekle.
- [ ] P5.4 Uygun boyut/format, alternatif metin ve lazy loading uygula.

**Kabul:** Filtreler doğru işleri gösterir; boş kategori doğru açıklanır. Önce/sonra eşleşmesi doğrulanmıştır veya kontrol gösterilmez. Klavye ile görsel açma/kapatma ve odak geri dönüşü çalışır. Sahte referans veya geçici görsel tamamlanmış müşteri işi olarak yayınlanmaz.

## 9. P6 — Mini Tasarım Stüdyosu ve teklif metni

- [ ] P6.1 İşletme adı, desteklenen font, zemin, renk ve ışıklı/ışıksız kontrollerini oluştur.
- [ ] P6.2 Seçimlerle eşleşen temsili 3D önizleme ve statik yedek oluştur.
- [ ] P6.3 “Bu tasarım için teklif al” ile tasarım durumunu forma aktar; geri düzenlemede koru.
- [ ] P6.4 İş türü, yaklaşık ölçü/ölçüyü bilmiyorum, adet, şehir ve açıklamayı doğrula.
- [ ] P6.5 Okunabilir WhatsApp mesajını doğrulanmış numarayla hazırla; kopyalama ve alternatif iletişim ekle.
- [ ] P6.6 Dosya seçimi varsa yalnızca yerel önizleme olduğunu ve WhatsApp’a elle ekleme gerektiğini açıkla; P7 olmadan otomatik aktarım iddia etme.

**Kabul:** Türkçe karakter, `&`, satır sonu, uzun işletme adı, geçersiz adet ve ondalık virgül durumları doğrulanır. Girdi HTML olarak çalışmaz. Tasarım özeti seçilen değerlerle eşleşir. WhatsApp açılırken metin doğru kodlanır; gerçek mesaj otomatik gönderilmez. “Gönderildi” şeklinde yanlış başarı bildirimi yoktur. P6 bitmesi P7 görsel yükleme özelliğinin bittiği anlamına gelmez.

## 10. P7 — Gerçek görsel yükleme

- [ ] P7.1 P1 adaylarından sağlayıcıyı seç; erişim, maliyet sınırı, veri saklama süresi ve kullanıcı açıklamasını kesinleştir; mimari karar kaydını güncelle.
- [ ] P7.2 Mimari API sözleşmesine uygun yükleme/silme/görüntüleme uçlarını ve özel depoyu kur.
- [ ] P7.3 Sunucuda tür/decode/boyut/piksel sınırı, yeniden kodlama ve metadata temizlemeyi uygula.
- [ ] P7.4 Hız sınırı, kota, izinli origin, süreli link ve gerçek süre sonu temizliği kur.
- [ ] P7.5 Ön yüzde açık yükleme eylemi, ilerleme, hata/tekrar deneme ve kaldırma kontrollerini bağla.
- [ ] P7.6 Başarılı görsel linkini teklif mesajına ekle; hatada yerel formu koru ve manuel ekleme yolunu göster.

**Kabul:** Geçerli görsel yüklenir; sahte uzantılı/bozuk/aşırı büyük dosyalar sunucuda reddedilir. Ön yüzde anahtar yoktur. Yetkisiz silme/depo listeleme çalışmaz. Süresi dolan link açılmaz ve saklama sonu temizliği doğrulanır. WhatsApp metninde yalnızca uygun süreli görüntüleme linki bulunur; silme tokenı bulunmaz. Sağlayıcı erişimi yoksa aşama `engelli` kalır; tam görsel yükleme tamamlandı denmez.

## 11. P8 — Kabul ve optimizasyon

- [ ] P8.1 Kritik davranış testlerini ve uçtan uca ziyaretçi akışını çalıştır.
- [ ] P8.2 Masaüstü/mobil, klavye, hareket azaltma, WebGL kapalı ve context kaybı kontrollerini yap.
- [ ] P8.3 Üç sabit profilli mobil Lighthouse koşusu; transfer bütçesi; tanımlı cihazlarda FPS ölçümü kaydet.
- [ ] P8.4 Başlık/font/logo/favicon/footer, fotoğraflar ve tüm form durumları için görsel kontrol yap.
- [ ] P8.5 Mevcut SEO/URL haritası, canonical, metadata, gerçek işletme verileri ve kırık bağlantıları kontrol et.
- [ ] P8.6 Upload güvenliği/temizliği ve kişisel veri içermeyen raporlama davranışını doğrula.

**Kabul:** ARCHITECTURE.md §8 hedefleri tanımlı koşullarda karşılanır veya açık gerekçeli, kullanıcı talimatıyla uyumlu revizyon kaydedilir. Kullanıcı akışında kritik hata, mobil taşma veya erişilemeyen kontrol yoktur. Laboratuvar raporu gerçek saha verisi diye sunulmaz. Ölçülmemiş hedefler başarı sayılmaz.

## 12. P9 — Canlı geçiş

- [ ] P9.1 Mevcut hostingde yayın/geri dönüş yöntemi ve önceki çalışan sürümü doğrula.
- [ ] P9.2 P8 kanıtlarıyla gözden geçirilebilir final önizleme, değişiklik özeti ve yayın paketi hazırla.
- [ ] P9.3 Kullanıcının geçerli yayın yetkisi kapsamında statik ön yüz ve gerekiyorsa upload API’sini yayınla.
- [ ] P9.4 HTTPS, ana domain/www, içerik, favicon, 3D yedek, form ve görsel linkini canlıda kontrol et.
- [ ] P9.5 Geri dönüş adımları, yayın commit’i, tarih ve kontrol sonuçlarını kaydet.

**Kabul:** Canlı sitede gerçek iletişim/teklif akışı çalışır; domain/SEO korunur. Yetki/hosting erişimi yoksa paketin hazırlanması tamamlanabilir ama yayın `engelli` olarak kalır. Belge kaydetme talimatı tek başına canlı yayın yetkisi değildir.

## 13. Her talimat için kayıt şablonu

İlgili talimat tamamlandığında aşağıdaki biçimde yeni kayıt eklenir; eski kayıtlar silinmez. Son rapor ayrıca `LAST_REPORT.md` üzerine yazılır ve terminalde gösterilir.

```text
Tarih:
Talimat / yapılan iş:
Aşama ve iş kimlikleri:
Başta okunan mimari / roadmap sürümü:
Değişen dosyalar:
Kabul kanıtı ve doğrulama:
Durum / varsa engel:
Mimari veya kapsam revizyonu:
Sıradaki tek iş:
```

## 14. İlerleme günlüğü

### 2026-10-01 — İlk mimari ve yol haritası

- Talimat: dijital üretim atölyesi tasarımının mimarisini ve yol haritasını hazırlama; her talimatta kontrol kuralı koyma; `akinarslan/zy_reklam` deposuna kaydetme.
- Aşama: P0.1–P0.4.
- Başlangıç: GitHub bağlantısı depo erişimini doğruladı; contents API depo boş yanıtı, branches API boş liste verdi.
- Belgeler: mimari v1.0, roadmap v1.0, `AGENTS.md`, `README.md`, `LAST_REPORT.md`.
- Kabul kanıtı: plan commit’i `012491bdc8f3bfa57c5bc8afb301769293dcbb67` `main` dalına kaydedildi; beş dosya GitHub’dan yeniden okundu ve hazırlanan içerikle birebir karşılaştırıldı. UTF-8, belge bağlantıları ve P0–P9 kapsamı kontrol edildi.
- Durum: P0 tamamlandı. Uygulama testi/build çalıştırılmadı; uygulama kodu henüz yok. Bu kayıt doğrulama sonrası durum güncellemesidir.
- Mimari sınırı: mevcut site ve varlıklar görülmeden uygulanmış teknoloji veya çalışan 3D iddiası yok.
- Sıradaki tek iş: P1 — mevcut site kaynaklarını ve özgün varlıkları envantere alma.

### 2026-10-01 — Kullanıcının logo referansı

- Talimat: “logo bu”; eklenen PNG projenin logo referansıdır.
- Başta okunan belgeler: AGENTS.md, mimari v1.0 ve roadmap v1.0; GitHub main commit’i `14d6e29a0c32e3e663cf2a1a5e143205a1c01e50` doğrulandı. Yerel dosyalar önceki kaydın çalışma kopyalarıdır; yerel Git ağacında başlangıç commit’i yoktur, uzak kayıt GitHub araçlarıyla yönetilir.
- Aşama/iş: P1.2a tamamlandı; P1.2 kısmi, P1.3 bekliyor; P1 devam ediyor.
- Dosyalar: `public/assets/brand/zy-reklam-reference.png`, `docs/ASSET_INVENTORY.md`, ARCHITECTURE.md, ROADMAP.md, README.md, LAST_REPORT.md.
- Kanıt: dosya açıldı; beyaz ZY, altın REKLAM, koyu zümrüt–siyah zemin görüldü. PNG 266 × 72 px, RGBA, 14.832 bayt; kaynak kopyası byte düzeyinde korunmuştur. SHA-256 envanterde kayıtlıdır.
- Mimari revizyonu: v1.1 / A05; tam yatay logo ve materyal eşlemesi netleştirildi. Aşama sırası ve kapsam korunuyor.
- Sınır: raster referans vektör/3D üretim kabulü değildir; uygulama kodu yok, build/test çalıştırılmadı.
- Sıradaki tek iş: P1.1 — mevcut site kaynaklarını envantere almak; vektör logo kaynağı P1.3’te ayrıca doğrulanacak.

### 2026-10-01 — Kaynak incelemesi ve P2 temeli

- Talimat: “devam et”; P1.1–P1.7 incelemesi ve bağımsız P2.1–P2.6 uygulaması.
- Başta okunan belgeler: güncel AGENTS.md, mimari v1.1 ve roadmap v1.0. Uzak main başlangıcı `d066a2afc095367608d3932a75e62064c2755819`; yerel Git ağacı commit içermiyor, uzak kayıt GitHub bağlayıcısıyla yönetiliyor. Kullanıcı dosyaları silinmedi.
- Kaynak: `akinarslan/adex-reklam-demo` / `497677a411e8e229333152b7474a1d5f34eb6152`; 32 dosya legacy altında değişmeden alındı; dosya kimlikleri manifestte.
- Dosyalar: legacy snapshot, SVG/PDF/font/SEO varlıkları; index.html, package/lockfile, tsconfig, src modülleri, tests/browser.test.mjs, doğrulama workflow’u ve proje belgeleri.
- Kanıt: `npm run build` TypeScript ve Vite kontrollerini geçti. Yerel Chromium 153 ile altı Playwright testi geçti; 360/768/1440 px taşma yok, görseller yüklendi, JS hatası yok; masaüstü başlık 60 px = 45 pt. Menü/Escape/odak, hareket tercihi, Türkçe ve özel karakterli WhatsApp metni, boş girdi ve JavaScript kapalı iletişim yolu doğrulandı. Testler mesaj göndermedi.
- Görsel kontrol: üç tam sayfa ekran görüntüsü üretildi; masaüstü ve mobil görüntüler incelendi. Yapılandırılmış kanıt: docs/evidence/P2_VERIFICATION.json. Ekran görüntüleri Git dışında; CI çalışma çıktısında üretilir.
- Uzak kayıt kanıtı: main commit’i `00e642bcdc9e2517892ea6406deea796952f1a2d`; 62 değişen dosyanın blob kimliği ve beş ana dosyanın tam metni GitHub’dan yeniden okunup eşleştirildi. AGENTS.md ve kaynak PNG korundu.
- Ortam: Playwright CDN ZIP indirmesi başarısız oldu; aynı test paketi `ZY_CHROMIUM_PATH` ile gerçek yerel Chromium üzerinden 6/6 geçti. CI tanımlandı; uzak çalışma sonucu bu yerel kanıtın yerine iddia edilmez.
- Durum: P2 tamamlandı. P1.5 gerçek proje içeriği bekliyor; P1 bütünü tamamlanmadı. P3–P9 kutuları açık. Mevcut hero statik SVG tabela posteridir; 3D değildir.
- Mimari revizyonu: v1.2 / A04 ve A05; framework eklemeden Vite/TypeScript, onaylı SVG konturları ve font/glif sınırları kaydedildi.
- Sıradaki tek iş: P3.1 — özgün yatay SVG konturlarını katmanlı tabela geometrisine dönüştürmek.

### 2026-10-01 — Özgün 3D tabela ve güvenli sahne yolları

- Talimat: “devam et”; P3.1–P3.5 uygulandı/test edildi, P3.6 performans kapanışı açık.
- Başta okunan belgeler: güncel AGENTS.md, mimari v1.2 ve roadmap v1.1. Uzak main `86173e1b45bb93c89dc81828f00a49288c956ed2`; yerel kopyanın belge blobları uzakla aynı. Yerel Git hâlâ commit içermiyor; kayıt GitHub bağlayıcısıyla yönetilir. Kullanıcı dosyaları silinmedi.
- Önceki teslimin CI kanıtı: GitHub Actions 36857500110 / Verify başarılı tamamlandı.
- Dosyalar: dört src/scene modülü, src/main.ts, CSS, index.html, package/lockfile, tests/scene.test.mjs, P3 kanıtları/önizlemeler ve proje belgeleri. Logo/PDF/font/legacy kaynakları değiştirilmedi.
- Kanıt: TypeScript/build başarılı. Altı P2 regresyon + dokuz P3 test olmak üzere **15/15** yerel test geçti. P3 testleri production preview kullanır. Sekiz path/two hole geometri, gerçek WebGL çizimi, ±18°/±10° sınırları, CTA, yatay dokunma/dikey scroll, idle/offscreen durma, yükleme/hareket yarışı, azaltılmış harekette hiç 3D indirmeme ve kaynak temizliği doğrulandı.
- Hata yolları: WebGL2 yokluğu, renderer paket hatası ve gerçek WEBGL_lose_context ile poster/form korunması geçti. Sekme/BFCache geçiş kontrolü kontrollü event simülasyonudur; fiziksel tarayıcı BFCache saha ölçümü değildir.
- Grafik ortamı: ilk yerel denemede Vulkan loader eksik olduğu için WebGL açılamadı. Chromium paketinin kendi loader/SwiftShader dosyaları çalışma alanı dışındaki QA klasöründe doğru yerleştirildi; gerçek WebGL testleri geçti. Normal kullanıcı/CI kurulumu bu geçici QA dosyalarına bağlı değildir.
- Bütçe: SVG 8.340 bayt, harici GLB/texture/HDR transferi 0; 3 MB sahne varlık hedefi altında. Ertelenen renderer JS ham 604.835 / Node gzip 154.582 bayt; ana JS ham 7.235 bayt. Vite’ın 500 KB chunk uyarısı var; ertelenmiş paket maliyeti gizlenmedi.
- Görsel kontrol: gerçek renderer ekran görüntülerinin masaüstü ve mobil JPEG’leri incelendi; docs/evidence altında kaydedildi.
- FPS: ANGLE SwiftShader ile 4,5 saniye masaüstü ~37,3; CPU4 mobil görünüm ~51,4. Örneklemenin kaydedilmesi test başarısıdır, hedef başarısı değildir. Fiziksel cihaz ölçümü yok; masaüstü yazılımsal örnek yaklaşık 60 FPS hedefinin altında. P3 tamamlandı işaretlenmez ve P4 başlatılmaz.
- Mimari: v1.3, A02/A03 uygulama durumu ve yaşam döngüsü ayrıntıları; kapsam/hedefler korunur. Roadmap v1.2 / P3.6 mevcut kabulün açık iş maddesidir, yeni kapsam değildir.
- Sıradaki tek iş: P3.6 — fiziksel cihaz profillerinde kare hızını doğrulayıp performans kabulünü kapatmak.
