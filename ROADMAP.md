# ZY Reklam — Yol Haritası

**Sürüm:** 1.13 · **Başlangıç:** 2026-10-01

**Kaynak:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Zorunlu kontrol:** [AGENTS.md](AGENTS.md)

## 1. Güncel durum

**Son tamamlanan aşama:** P2 — Ön yüz ve içerik temeli.

**Aktif aşama:** P3 — Gerçek 3D açılış uygulandı; performans kapanışı devam ediyor.

**Kullanıcı önceliği:** P3.7d — Lightbox ve yalnızca araç fotoğrafı. Kullanıcının açık önceliği fiziksel P3.6 kapanışı beklenirken uygulanır; diğer aşamalar tamamlanmış sayılmaz.

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

- [x] P2.7 Kullanıcının dört promosyon kategorisini fotoğraflı mega menü ve ayrı statik sayfalara bağla; görsel eşleşmesi, mobil/klavye/JS kapalı gezinme ve doğrudan URL kabulünü doğrula.

- [x] P2.8 Beş proje kategorisini fotoğraflı mega menüye ve ayrı örnek sayfalarına bağla; gönderilen fotoğraf/video içeriklerini sınıflandır, erişim ve video oynatmayı doğrula.

- [x] P2.9 Ana sayfanın sağ altında erişilebilir, JS kapalıyken de çalışan WhatsApp butonu; hazır bilgi alma mesajı, güvenli yeni sekme ve mobil güvenli boşluk.

**Kabul:** 360, 768 ve 1440 px genişliklerde yatay taşma yoktur. Başlık masaüstünde 45 pt, mobilde okunaklıdır. CTA ve temel iletişim 3D’den bağımsız çalışır. Klavye odakları görünür; build ve seçilen statik analiz kontrolleri geçer. CI mevcut değilse başarı iddia edilmez; kurulan kontrollerin gerçek çıktısı kaydedilir.

## 6. P3 — 3D ZY açılış

- [x] P3.1 Onaylı özgün amblemi katmanlı tabela geometrisine dönüştür.
- [x] P3.2 Beyaz ışıklı pleksi, altın metal, çevre ışığı ve gölgeyi oluştur.
- [x] P3.3 Masaüstü sınırlı fare dönüşünü ve mobil sürüklemeyi uygula; dikey scroll’u koru.
- [x] P3.4 Ertelenmiş 3D yükleme, kalite düşürme, görünmezken durma ve kaynak temizliğini uygula.
- [x] P3.5 WebGL yokluğu, context kaybı ve hareket azaltma yollarını doğrula.
- [x] P3.6a Fiziksel cihazda kullanılabilecek ayrı ölçüm aracını, ham JSON çıktısını ve iptal/hata kontrollerini hazırla. Bu, fiziksel kabulü kapatmaz.
- [x] P3.6b Aynı malzeme/derinlikteki logo katmanlarını birleştir; görünümü ve gerçek çizim çağrısı azalmasını doğrula. Fiziksel kabul ayrı kalır.
- [ ] P3.6 Aşama kabulündeki fiziksel masaüstü/orta seviye mobil FPS hedeflerini ölç; gerekiyorsa sonraki aşamadan önce optimize et. Yazılımsal emülasyon ölçümü tek başına bu kabulü kapatmaz.

- [x] P3.7 Bağımsız 3D Vitrin: iki farklı kutu harf tabela/asimetrik totem; obje bazlı etkileşim, lazy/reduced/mobile/fallback ve korunan hero kanıtı. **Tamamlandı; fiziksel GPU kabulü P3.6 kapsamında açık.**

**Kabul:** Amblem özgün kaynakla eşleşir; yaklaşık yazı logosu kullanılmaz. İlk içerik 3D’yi beklemez. CTA üzerine canvas binmez. Model/texture/env başlangıç 3 MB hedefinde ölçülür. Tanımlı masaüstü ve mobil cihazlarda kare hızı kaydedilir; bütçe aşılıyorsa sonraki aşamadan önce optimize edilir veya hedef revizyonu gerekçelendirilir.

- [x] P3.7a Referanstaki geometrik harf stili; krom çevre, beş kontrollü ışık rengi; eşit yön yazıları ve büyük ZY REKLAM. **Tamamlandı.**

- [x] P3.7b Lightbox ve 360° araç: özgün temsili kaplama/görsel, sürükleme/klavye/ışık kontrolü, mobil ve context yedeği. **Tamamlandı; fiziksel cihaz kabulü P3.6 kapsamında açık.**

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
- Kanıt: TypeScript/build başarılı. Altı P2 regresyon + dokuz P3 test olmak üzere **15/15** yerel test geçti. P3 testleri production preview kullanır. Sekiz path/iki iç boşluk geometri, gerçek WebGL çizimi, ±18°/±10° sınırları, CTA, yatay dokunma/dikey scroll, idle/offscreen durma, yükleme/hareket yarışı, azaltılmış harekette hiç 3D indirmeme ve kaynak temizliği doğrulandı.
- Hata yolları: WebGL2 yokluğu, renderer paket hatası ve gerçek WEBGL_lose_context ile poster/form korunması geçti. Sekme/BFCache geçiş kontrolü kontrollü event simülasyonudur; fiziksel tarayıcı BFCache saha ölçümü değildir.
- Grafik ortamı: ilk yerel denemede Vulkan loader eksik olduğu için WebGL açılamadı. Chromium paketinin kendi loader/SwiftShader dosyaları çalışma alanı dışındaki QA klasöründe doğru yerleştirildi; gerçek WebGL testleri geçti. Normal kullanıcı/CI kurulumu bu geçici QA dosyalarına bağlı değildir.
- Bütçe: SVG 8.340 bayt, harici GLB/texture/HDR transferi 0; 3 MB sahne varlık hedefi altında. Ertelenen renderer JS ham 604.835 / Node gzip 154.582 bayt; ana JS ham 7.235 bayt. Vite’ın 500 KB chunk uyarısı var; ertelenmiş paket maliyeti gizlenmedi.
- Görsel kontrol: gerçek renderer ekran görüntülerinin masaüstü ve mobil JPEG’leri incelendi; docs/evidence altında kaydedildi.
- FPS: ANGLE SwiftShader ile 4,5 saniye masaüstü ~37,3; CPU4 mobil görünüm ~51,4. Örneklemenin kaydedilmesi test başarısıdır, hedef başarısı değildir. Fiziksel cihaz ölçümü yok; masaüstü yazılımsal örnek yaklaşık 60 FPS hedefinin altında. P3 tamamlandı işaretlenmez ve P4 başlatılmaz.
- Mimari: v1.3, A02/A03 uygulama durumu ve yaşam döngüsü ayrıntıları; kapsam/hedefler korunur. Roadmap v1.2 / P3.6 mevcut kabulün açık iş maddesidir, yeni kapsam değildir.
- Uzak CI kanıtı: GitHub Actions 36859463847 / job 110359813173 başarıyla tamamlandı; npm ci, build, Playwright kurulumu ve 15/15 test geçti. Kanıt: docs/evidence/P3_CI_VERIFICATION.json.
- Uzak kayıt kanıtı: main `21f8599ab48c3825176072b95999cc93ca9f171d`; 21 dosyanın Git blob kimliği doğrulandı. Mimari, roadmap, rapor, renderer ve test dosyası tekrar okunup tam içerik eşleştirildi. Özgün SVG/PNG blobları değişmedi.
- Sıradaki tek iş: P3.6 — fiziksel cihaz profillerinde kare hızını doğrulayıp performans kabulünü kapatmak.

### 2026-10-01 — P3.6 gölge maliyetini azaltma

- Talimat: “devam et”; güncel AGENTS.md, mimari v1.3 ve roadmap v1.2 kontrol edildi. Uzak main başlangıcı 1153c07bb58ef9ee7b641cea9eb5d278de2d16d1 doğrulandı; yerel Git commit içermez, uzak kayıt bağlayıcı üzerinden yönetilir.
- Değişiklik: gölge haritası hareket sırasında 20 Hz ile sınırlandı; son poz zorunlu güncellenir. Ana sahnenin kare hızı, logo konturları ve materyaller korundu.
- Kanıt: TypeScript/build ve 16/16 yerel test başarılı. Yeni gerçek production WebGL testinde 26 çizimin 10'unda gölge güncellendi; son poz ve idle durma kontrolü geçti. Masaüstü/mobil viewport görüntüleri incelendi.
- Üç dönüşümlü önce/sonra ölçümü: masaüstü yazılımsal ortanca 36,6 → 38,2 FPS; mobil emülasyon 51,2 → 52,3 FPS. Sonuç aralıkları örtüşür; fiziksel GPU başarısı iddia edilmez. Ham örnekler ve yöntem P3_PERFORMANCE_COMPARISON.json içinde; tekrar ölçüm aracı scripts/compare-scene.mjs.
- Mimari v1.4, roadmap v1.3 ve kaynak bütçesi güncellendi. Logo/font/legacy, yayın ve iletişim bilgileri değiştirilmedi. Vite ertelenen paket için 500 KB uyarısı sürüyor.
- P3.6 ve P3 kabulü açık; P4 başlatılmadı. Sıradaki tek iş: fiziksel masaüstü ve orta seviye mobil ölçümünü tamamlayıp P3 kabulünü kapatmak.

- Uzak kayıt: 410f4dfc6215ef1308839ad6063bc5a997a47ed3 main üzerinde yeniden okundu; 12 dosyanın Git blob kimliği ve altı ana dosyanın tam içeriği eşleşti. Özgün SVG blobu korundu. GitHub Actions 36861229725 / job 110365655795 başarılı; loglarda 16 test / 16 pass / 0 fail doğrulandı. CI kanıtı P3_PERFORMANCE_CI_VERIFICATION.json içinde.

### 2026-10-01 — P3.6a cihaz ölçüm ekranı

- Talimat: “tamamdır sen projeye devam et istersen”; güncel AGENTS.md, mimari v1.4 ve roadmap v1.3 tamamen okundu. Uzak main başlangıcı b9cd730e0825b17187806de6dee1c95e15c07463; yerel Git commit içermez. Ana belgeler uzakla eşleşti; önceki teslimin GitHub Verify kontrolü başarılıdır.
- Cloudflare: erişilebilir commit status/check kayıtlarında önizleme URL'si yok. Deployment uç noktası bağlayıcı tarafından desteklenmedi; yayın tamamlandı iddiası yapılmadı.
- P3.6a: bağımsız /qa/scene-performance.html aracı, üç aktif örnek, 1 saniye atılan ısınma, FPS pencereleri, kalite/geometri/build/cihaz bağlamı ve açık JSON indirme eklendi. Ana sayfa paketleri değişmedi; araç menü/sitemap dışındadır.
- Kanıt: TypeScript/build, QA JS sözdizimi ve 19/19 test başarılı (18 tarayıcı, bir kalite politikası kontrolü). Mobil üç örnek/JSON, hiçbir rapor upload'ı olmaması, 360/1440 px araç düzeni, hareket tercihi/açık kullanıcı tercihi, iptal/resize/gizli sekme ve gerçek context kaybında başarılı rapor üretmeme doğrulandı. Ekran görüntüleri incelendi.
- Dosyalar: public/qa dört dosya, tests/scene.test.mjs, docs/P3_DEVICE_MEASUREMENT.md ve kanıt/plan belgeleri. Kaynak logo/font/legacy ve müşteri akışı korundu.
- Mimari v1.5, roadmap v1.4; P3.6a hazır, P3.6 fiziksel ölçüm bekliyor. Yazılımsal QA JSON'u fiziksel sonuç değildir. P4 başlamadı. Sıradaki tek iş: Cloudflare önizlemesinde tanımlı fiziksel bilgisayar ve orta seviye mobil için üç 10 saniyelik örneği/manual kontrolleri kaydedip P3 kabulünü kapatmak.

- Uzak kayıt: fabf49aa43c3c59879010e4c530e81e8812e2cb9 main üzerinde yeniden okundu; 15 dosyanın blob kimliği ve altı ana dosyanın tam içeriği eşleşti. Özgün SVG korundu. GitHub Actions 36863650753 / job 110373703375 başarılı; loglar 19 test / 19 pass / 0 fail ve üç yeni araç kontrolünü doğruladı. CI kanıtı: P3_DEVICE_TOOL_CI_VERIFICATION.json.

### 2026-10-01 — P3.6b ortak logo katmanları

- Talimat: “devam et”; güncel AGENTS.md, mimari v1.5 ve roadmap v1.4 tamamen okundu. Uzak main başlangıcı a02713a2526270382175780361ca5828ef7a1be3; son Verify başarılı. Yerel Git commit içermez; uzak kayıt GitHub bağlayıcısıyla yönetilir.
- Değişiklik: 12 logo mesh’i dört aynı malzeme/derinlik katmanında birleştirildi; materyal grupları birleştirildi. Ana sahne çizim çağrısı 27 → 13 (%51,9 azalma); gölge yenilemesi başına ek çağrı 22 → 8 (%63,6 azalma). Bu ayrıştırma, gerçek WebGL2 çağrı toplamı ile render/gölge sayaçlarından hesaplandı ve 12 örneğin tamamında birebir doğrulandı.
- Görsel/geometri kanıtı: Aynı başlangıç açısındaki masaüstü ve mobil canvas PNG’leri RGBA piksel düzeyinde önceki build ile aynıdır; görüntüler ayrıca incelendi. Özgün sekiz kontur, R/A içindeki iki boşluk, katman derinlikleri, malzemeler ve 4.882 ana sahne üçgeni korundu. Gölge yenilenen render’da sayaç 9.714 üçgen ve 21 toplam çağrı gösterebilir; bu ana sahne ile gölge işinin toplamıdır.
- Kanıt: TypeScript/production build, karşılaştırma aracı sözdizimi ve 19/19 yerel test başarılı. Sayaç ayrıştırması ve eski sayaçsız baseline için güvenli dönüş ayrıca doğrulandı. Yeni kanıt P3_BATCH_COMPARISON.json ve P3_BATCH_VISUAL_VERIFICATION.json; eski gölge karşılaştırması korunur.
- Üç dönüşümlü önce/sonra çifti/profil: Masaüstü yazılımsal ortanca 38,6 → 35,5 FPS; mobil emülasyon 48,9 → 49,3 FPS. Aralıklar örtüşür; bu çalışma tutarlı FPS artışı göstermedi. Fiziksel cihaz performans kabulü açık kalır.
- Bütçe: ertelenen renderer 606.055 ham / 155.041 Node gzip bayt; +967 / +337 bayt. Ana JS 7.235 bayt. Mimari v1.6, roadmap v1.5, kaynak bütçesi ve kabul kaydı güncellendi.
- Cloudflare: erişilebilir commit status/check kayıtlarında önizleme URL’si yok; yayın başarı iddiası yok. P3.6b tamamlandı, P3.6 fiziksel kabulü ve P4 açık kalır. Sıradaki tek iş: fiziksel masaüstü/orta seviye mobil üç 10 saniyelik ölçüm ve gerçek dokunma/scroll/görsel kontrolüyle P3 kabulünü kapatmak.

- Uzak kayıt 179f83131fb7124e1c1db3daf03ccefce35426f0 main üzerinde tekrar doğrulandı: 16 dosyanın Git blob kimliği ve altı ana dosyanın tam içeriği eşleşti; özgün SVG ve AGENTS blobları korundu. GitHub Actions 36868279358 / job 110389203272 başarıyla tamamlandı. Loglar yeniden okundu: npm ci/build/tarayıcı kurulumu ve 19/19 test başarılı, 0 fail; yeni üçgen/çizim bütçesi kontrolü geçti. Artifact 11166510096 kaydedildi. Kanıt: docs/evidence/P3_BATCH_CI_VERIFICATION.json.

### 2026-10-01 — P2.7 promosyon mega menüsü ve kategori sayfaları

- Talimat: dört promosyon kategorisini Promosyonlar mega menüsüne koy; her birini ayrı sayfaya bağla ve gönderilen görselleri sınıflandır. Güncel AGENTS.md, mimari v1.6 ve roadmap v1.5 tamamen okundu. Uzak main başlangıcı 99ab6c45d5085bcd6cf7619bb21484104d235a9b; yedi ana yerel dosya uzak bloblarla eşleşti. Yerel Git commit içermez; kayıt GitHub bağlayıcısıyla yönetilir.
- Kapsam revizyonu: kullanıcının açık yeni önceliği P2.7 bağımsız DOM/gezinti/katalog işidir. P3 fiziksel GPU kabulü ve P4–P9 aşama sırası korunur; ürün katalog görselleri P1.5/P5 gerçek müşteri projesi kabulü değildir.
- İçerik: 14 görsel açılıp fotoğraf içeriğine göre dört ana kategoriye ayrıldı. Bez çanta/kese ve termoslu setlerin ilgili ikinci kategoride de görünmesi kaydedildi. Uzun hediye-seti dosya adına sahip görsel yalnızca kupa olduğundan yaşam kategorisine alındı. VIP sayfasında altı özel set ve iki bez ürün ayrı bölümdür. Eşleşme: docs/PROMOTION_ASSETS.md.
- Uygulama: native details/summary, dört fotoğraflı mega menü kartı ve dört ayrı /promosyonlar/<kategori>/ statik sayfası. Fare hover, dokunma, klavye/ArrowDown, Escape odak sırası, dış tıklama ve JS kapalı gezinme desteklenir. Ana sayfa promosyon bölümüne aynı kategori kartları eklenir.
- Yapı: JSON içerik kaynağı ve build/dev öncesi ortak HTML üretimi; Vite beş HTML girişini derler. Canonical/metadata/sitemap, breadcrumb, diğer kategorilere ve doğrulanmış WhatsApp numarasına ürün bilgisi bağlantıları hazırdır. Kategori sayfaları 3D paketi indirmez.
- Varlıklar: 28 WebP / 1.061.356 bayt; kaynaklar değiştirilmedi. Gerçek en/boy, alt, responsive srcset/sizes ve lazy load uygulanır; contain ürünleri kesmez.
- Kanıt: TypeScript/production build ve 23/23 yerel test başarılı (22 tarayıcı kontrolü, bir kalite politikası). Dört yeni kabul kontrolü: masaüstü hover/klavye/Escape/dış tıklama/link, mobil dokunma/kategori/Escape, 360/768/1440 px dört doğrudan sayfa/SEO/tüm fotoğraflar/3D indirmeme ve JS kapalı gezinme/WhatsApp/sitemap. Menü ile ofis/VIP sayfasının masaüstü/mobil görüntüleri incelendi. Kanıt: P2_PROMOTIONS_VERIFICATION.json.
- Düzeltme: native odak aktarımı sırasında erken microtask kapanması dokunma/Tab hedefini gizliyordu; kontrol sonraki macrotask’e alındı ve regresyon testinde geçti. Ana nav stilleri breadcrumb’dan ayrılır; alt bölüm lazy görselleri ilk viewport testiyle karıştırılmaz.
- Mimari v1.7 / A10, roadmap v1.6. P2.7 tamamlandı; P3.6 fiziksel kabulü açık. Main JS 8.162 bayt, Node gzip 3.377; renderer öncekiyle aynı 606.055 / 155.041. Vite 500 KB uyarısı sürer. Canlı DNS/hosting değiştirilmedi.
- Sıradaki tek plan işi: tanımlı fiziksel masaüstü ve orta seviye mobil ölçümü/manual kontrollerle P3.6 kabulünü kapatmak.

- Uzak kayıt 740e8c6c2b54155d99cf113f6331cfe9221b1ee5 main üzerinde yeniden okundu: 55 dosyanın blob kimliği ve yedi ana dosyanın tam içeriği eşleşti; diğer 73 dosya değişmedi. GitHub Actions 36871098814 / job 110398761411 başarılı tamamlandı. Loglar tekrar okundu: npm ci, beş HTML sayfası üretimi/build, tarayıcı kurulumu ve 23 test / 23 pass / 0 fail; dört yeni promosyon kontrolü doğrulandı. Artifact 11166564298 kaydedildi. Kanıt: docs/evidence/P2_PROMOTIONS_CI_VERIFICATION.json.

### 2026-10-01 — P2.7 menü görünürlüğü / yayın teşhisi

- Talimat: Kullanıcı Promosyonlar mega menüsünü baktığı sayfada göremiyor. Güncel AGENTS.md, mimari v1.7 ve roadmap v1.6 kontrol edildi. Uzak main 11b099f9d506b853f851385e1aa72244f0c7941f; index.html yeniden okundu ve data-promo-menu / dört kategori bağlantısı doğrulandı.
- P2.7 uygulaması ile canlı görünürlük ayrı kabul edilir. Güncel production build üzerinde dört promosyon tarayıcı testi tekrar geçti: hover/klavye, mobil dokunma, dört doğrudan kategori sayfası ve JavaScript kapalı gezinme. Masaüstü mega menü ekranı yeniden incelendi. Uygulama kodunda yeni değişiklik gerektiren hata bulunmadı.
- https://zyreklamdijital.com.tr/ sayfasının bu tarihte alınan web içeriğinde eski hero/CTA/promosyon başlıkları bulunuyor; proje kaynaklarındaki yeni içerikle eşleşmiyor. Bu fark yayın sürümünün eşleşmediğine işaret eder. Kullanıcının baktığı tam URL henüz bilinmiyor; o adresin canlı DOM kontrolü yapılmadı.
- Main commit status kaydında yayımlama/Cloudflare önizleme bağlantısı yok (statuses=[]); bu tek başına hosting bulunmadığını kanıtlamaz. Önceki GitHub kayıt ve test başarısı canlı yayın başarısı olarak sunulmaz.
- Mimari değişmedi; v1.7 / A10 korundu. P3.6 fiziksel kabulü ve sonraki aşamaların kapıları korunur. Kullanıcı önceliği: önce baktığı URL ve ona bağlı yayın hedefini belirleyip P2.7 canlı görünürlüğünü doğrulamak. DNS/hosting değişikliği yapılmadı.

### 2026-10-01 — P2.7 Workers adresinde yayın farkının doğrulanması

- Kullanıcı önizleme hedefini verdi: https://zy-reklam.akinarslanceng.workers.dev/#promosyonlar. AGENTS.md, mimari v1.7 ve roadmap v1.6 okundu; main 86bd58bbafcaa11d5e12d4a266db378ff96b9328 doğrulandı. Yerel Git commit içermez.
- Cloud Browser’da hedef açıldı ve Promosyonlar bağlantısına basıldı. Canlı #main-nav içinde yalnızca <a href="#promosyonlar">Promosyonlar</a> var; dört kategorili disclosure yok. Promosyon bölümü eski üç maddeli içerik gösteriyor. Canlı JS /assets/index-BxE0oBOY.js, CSS /assets/index-Dq4TeZOt.css. GitHub güncel index.html mega menüsünden farklı sürüm sunuluyor.
- Güncel GitHub main kontrolünde yalnızca GitHub Actions verify success bulundu; Cloudflare check/status kaydı yok. Bu, entegrasyonun kapalı olduğunun kesin kanıtı değildir. Doğru repo/dal, otomatik build tetikleyicisi, son build ve aktif deployment bilgisi Cloudflare panelinde görülmeden neden kesinleştirilemez.
- Web aracı hedefi açamadı; shell isteği 403 verdi. Canlı tarayıcı gözlemi başarılıdır; shell 403 sitesi kapalı/bot engeli diye yorumlanmadı.
- Cloudflare resmi Workers Builds belgeleri repo bağlantısı, production branch, build ve deploy adımlarını doğruluyor. Hesap/panel erişimi mevcut değil; ayar veya DNS değiştirilmedi. Uygulama/mimari değişmedi; P3.6 ve aşama kapıları korunur.
- Sıradaki tek iş: zy-reklam Worker’ın Settings > Builds ekranında bağlı repo/dal ve son build/deployment commit’ini kontrol edip otomatik yayın eşleşmesini düzeltmek.

### 2026-10-01 — P2.8 projeler mega menüsü / örnek koleksiyonu

- Talimat: Kullanıcı promosyon yayınının düzeldiğini bildirdi; beş kategorili Projeler mega menüsü, ayrı bağlantılar ve yüklenen fotoğraf/video sınıflandırması istedi. AGENTS.md, mimari v1.7, roadmap v1.6 tamamen okundu; uzak main 0be8bf7b3ff802c6130d321e34e13becf06403bd. Yerel Git commit içermez.
- Kullanıcı önceliği bağımsız P2.8; P3 fiziksel kabulü ve P4–P9 teslim kapıları korunur. 19 fotoğraf, bir 14,72 sn dijital totem videosu görsel olarak incelendi. Kategori dağılımı Tabela 2, Totem 2+video, Lazer Kesim 5, Dijital Baskı 5, Özel Üretim 5. Tam eşleme docs/PROJECT_ASSETS.md.
- Uygulama: fotoğraflı beş kart, beş /projeler/<kategori>/ sayfası, ana sayfa kategori kartları, büyük görsel bağlantıları, diğer kategoriler, ortak gezinme ve sitemap. Video kullanıcı başlatmalı controls/playsinline/preload=none; ilk yükte MP4 isteği yok. Referans içerik başka markaları içerir; ZY müşteri projesi olarak sunulmaz.
- Kanıt: TypeScript/production build başarılı; 26/26 yerel test, 0 fail. Önceki 23 regresyon ve üç yeni proje kontrolü geçti: 360/768/1440 menü/klavye/dokunma/karşılıklı kapanma; beş doğrudan URL/görseller/SEO/taşma/3D indirmeme/video gerçekten oynatma; JS kapalı iki koleksiyon geçişi. Masaüstü ve mobil menü görüntüleri incelendi.
- İlk kontrolde bir WebP türevi boş bulundu; yeniden kodlandı, tüm 38 WebP decode ile doğrulandı, temiz test tekrarı başarılı. 38 WebP + video/poster toplam 4.480.675 bayt; her şey ilk yükte indirilmez. Kaynak fotoğraflar değiştirilmedi.
- Mimari v1.8 / A11 ve roadmap v1.7. P2.8 tamamlandı. P1.5/P5 gerçek müşteri sahipliği/bilgisi ve P3.6 fiziksel ölçüm açık. Canlı Cloudflare otomatik dağıtım sonucu GitHub kayıt sonrası ayrıca kontrol edilecek; başarı önceden iddia edilmez.
- Sıradaki tek iş: yeni Projeler menüsünün Workers önizlemesinde yayınlandığını ve beş kategori bağlantısının çalıştığını doğrulamak.

- Uzak kayıt: uygulama commit’i f1b63733417776c17fff32118e6e1e5a4913b0dc; 71 değişen blob ve yedi ana dosyanın tam içeriği yeniden okunup eşleştirildi. GitHub Actions 36878091598 / job 110422601064: npm ci/build başarılı, son kontrolde test devam ediyor; CI başarı iddiası yok.
- Canlı kontrol: Workers adresi yeni kayıttan sonra açıldı ve bir kez yeniden yüklendi. Promosyon menüsü mevcut; Projeler eski #projeler bağlantısı. P2.8 yeni canlı yayını doğrulanmadı; en güncel commit için Cloudflare build/Retry kontrolü gerekir.

### 2026-10-01 — P2.8 ek tabela/totem/fıskiye medyası

- Kullanıcı Projeler mega menüsünün canlıya ulaştığını bildirdi. İlk beş yeni görsel Tabela, son fotoğraf Totem, yazili_su.mp4 Özel Üretim kategorisine eklendi.
- Başta AGENTS.md, mimari v1.8 ve roadmap v1.7 tamamen okundu. Uzak main d3c1cbc9534b8076f73fd63b4b4248efb19ecc5a; uzak ek workflow/Wrangler değişiklikleri korunur.
- Altı görsel ve video karesi incelendi. Kaynaklar değişmeden tutuldu; 12 responsive WebP, 540×960 H.264/14,51 sn sessiz faststart video ve poster üretildi. Yeni görseller galeri başında. Tabela toplam 7, Totem 3 fotoğraf+1 video; Özel Üretim 5 fotoğraf+1 video.
- TypeScript/production build ve üç proje tarayıcı testi geçti; 360/1440 px tüm kategori görselleri decode, menüler/SEO/JS kapalı gezinme, iki videonun ilk yükte indirilmemesi ve gerçek oynatılması doğrulandı. P2_PROJECTS_VERIFICATION.json güncellendi. Tüm 26 test bu işte yeniden çalıştırılmadı.
- Video açıklaması kategoriye göre JSON’dan üretilebilir; mimari v1.9. P3 fiziksel performans, P1.5/P5 sahiplik kabulü ve aşama kapıları değişmedi.
- GitHub kaydı sonrası yeni içeriklerin canlı yayını ayrıca doğrulanır. Sıradaki tek iş: Workers önizlemesinde yeni medya yayınının kontrolü.

- Uzak kayıt doğrulandı: 4542806f8c9ae88ac2626f8a9bd972747501f8ea; 26 değişen dosyanın blob kimliği ve beş uygulama dosyasının tam içeriği eşleşti. GitHub Verify npm ci/build başarılı, tarayıcı kurulumu sürüyor; tam CI başarı iddiası yok. Canlı Worker ilk kontrolde eski Tabela (2 görsel) ve Özel Üretim (video yok) sürümünü sunuyordu; bir yenilemede de yeni medya henüz görünmedi. GitHub mega menü smoke sonucu bu yeni medya için yayın kanıtı sayılmadı.

### 2026-10-01 — P2.9 sabit WhatsApp butonu

- Talimat: Ana sayfanın altında floating WhatsApp ikonu; hazır metin “Merhaba ZY Reklam, bilgi almak istiyorum.”
- AGENTS.md, mimari v1.9 ve roadmap v1.7 tamamen okundu; uzak main 6e702bebb7c74b8b5e1fcb60a142d2f2de3c5628. index/CSS/mimari/roadmap uzak içerikleri yerelle eşleşti. Yerel commit yok; kullanıcı/başka oturum değişiklikleri korunur.
- Ana sayfanın footer sonrasında doğrudan wa.me/905464494849 bağlantısı; URL kodlu metin, target=_blank/noopener/noreferrer ve erişilebilir ad. 56/58 px sağ alt sabit ikon, safe-area ve klavye odak görünümü. Footer altında boşluk imza/telif içeriğinin örtülmesini önler. Alt kategori sayfalarına ikon eklenmedi.
- Mimari değişmedi; v1.9/A06 ile uyumlu. JS, yeni bağımlılık, otomatik gönderim veya sohbet API’si eklenmedi. Roadmap v1.8; P3 fiziksel kabulü ve P4–P9 kapıları korunur.
- Kabul: TypeScript/production build ve altı mevcut P2 testi başarılı. Üretim preview’da 360/768/1440 px × JS açık/kapalı altı ek kontrol geçti: doğru numara/metin, güvenli yeni sekme, gerçek link aktivasyonu (QA cevabına yönlendirilmiş, gerçek mesaj gönderilmedi), klavye odak, kaydırmada sabit konum, yatay taşma/ikon örtüşmesi yok ve footer imzası görünür. Mobil ekran incelendi. Kanıt P2_WHATSAPP_VERIFICATION.json. Tam test paketi bu işte tekrar çalıştırılmadı.
- Dosyalar: index.html, src/styles/main.css, yeni whatsapp.css, P2/P2_WHATSAPP kanıt JSON’ları, ROADMAP.md, LAST_REPORT.md.
- Canlı yayın sonucu kayıt sonrası ayrıca kontrol edilir; önceden başarı iddia edilmez. Sıradaki tek iş: canlı ana sayfada WhatsApp butonu ve bağlantısını doğrulamak.

- Uzak kayıt dfd04686bd6c22ea46713f592f8ee47bf8c43e77 doğrulandı: yedi dosyanın blob kimliği ve tam içerikleri eşleşti. Canlı https://zyreklamdijital.com.tr/ açıldı ve bir kez yenilendi; yeni .whatsapp-float henüz yok. Kod/kayıt tamamlandı, Cloudflare yayın görünürlüğü bekliyor. GitHub Verify sürüyor; mega menü smoke başarısı WhatsApp yayın kanıtı sayılmaz.

### 2026-10-01 — P3.7 bağımsız 3D Vitrin / Showroom

- Kullanıcı hero ve ilk 3D tabelanın aynen korunmasını istedi. Yeni bölüm hero’nun hemen ardından, hizmetlerden önce eklendi. Korunan dosyaların SHA-256 kimlikleri ve showroom bloğu çıkarıldığında ana sayfanın birebir aynı kaldığı P3_7_PRESERVATION.json ile doğrulandı.
- Gerçek bevel/extrusion harfler: DejaVu Sans Bold ile ZY REKLAM, Nimbus Sans Narrow ile DAHA İLERİYE. Üç boyutlu panel/çerçeve, metal ön/yan yüzler ve gölgeler. Asimetrik totem; dört fiziksel yönlendirme kutusu ve sıcak amber kanal.
- Ürün başına raycast + 18 px yaklaşma alanı; sınırlı tilt/öne gelme ve ışık. Idle float yok; idle/offscreen/hidden RAF durur. Dokunma 900 ms, klavye düğmeleri, reduced-motion sabit 3D; lazy import 180 px yaklaşma alanıyla. Hero ürün sahnesi görünürken showroom döngüsü durur; kaynaklara bağımsız sahiplik mimari A12’de açıklandı.
- Yükleme/WebGL/context kaybında aynı gerçek sahnenin masaüstü/mobil WebP yedeği. Yeni bağımlılık yok. Ürünler temsili olarak etiketlendi; P1.5/P5 müşteri sahipliği kabulü kapanmadı.
- npm run build / TypeScript ve mevcut 26 + yeni 3 = 29 test başarılı. 360/768/1440 px yatay taşma yok; vitrin 360/1440 görüntüleri incelendi. P3_7_SHOWROOM_VERIFICATION.json ve dört ekran görüntüsü. Yazılım GPU/emülasyon fiziksel mobil performans kabulü değildir.
- Vite ortak Three/SVGLoader chunk’ı ~600 KB / gzip ~154 KB için boyut uyarısı verir; dinamik yükleme korunur. Domain/Cloudflare, menüler ve WhatsApp değişmedi. LAST_REPORT.md üzerine yazıldı ve terminalde gösterildi.
- Kayıt hedefi GitHub main. Canlı Cloudflare yayını bu yerel/üretim preview kabulünün parçası değildir; sonraki tek iş canlı yeni bölümün görünürlüğünü doğrulamaktır.

### 2026-10-01 — P3.7a geometrik harf/krom/renkli ışık revizyonu

- Yeni görsel açıldı: özgün wordmark’ın yuvarlatılmış/geometrik harf dili. Vitrindeki ZY REKLAM için özgün SVG konturları, diğer yazılar için aynı harfler ve uyumlu ek glifler. Önceki farklı-font şartı kullanıcının açık yeni talimatıyla revize edildi; hero kaynağı değişmedi.
- Her harf gerçek ekstrüzyon krom kasa + ayrı iç ön yüz. Mouse/touch/klavye ile cam göbeği/kırmızı/mavi/turuncu/beyaz kontrollü ışık; idle kapalı. Totem amber tepkisini korur. FİKİR/TASARIM/ÜRETİM/GELİŞTİRME cap-height 0,345; ZY REKLAM 0,4372, yaklaşık %27 büyük. Uzun kelime küçültülmedi, kutular genişletildi.
- Geometri 71.014 üçgen; ilk krom prototipindeki 167.318 üçgen bevel/curve bütçesiyle azaltıldı. Dinamik yükleme, idle/offscreen duruşu, mobil DPR/kalite düşürme ve reduced-motion sabit poz korunur. Fiziksel GPU kabulü hâlâ P3.6 kapsamında açık.
- npm run build / TypeScript ve tüm 29 test başarılı, 0 fail. Yeni kabul stil/krom/beş renk, eşit harf yüksekliği/büyük başlık ile genişletildi. 360/1440 vitrin ekranları ve iki tabela ışıklı görünümü incelendi; 360/768/1440 genel taşma kontrolleri geçti.
- P3_7_STYLE_PRESERVATION.json: index/main/CSS, hero modülleri, navigation, WhatsApp ve Wrangler aynı. Modeller/renderer, kontur üretici/JSON, responsive yedekler, showroom testi, envanter/plan/rapor ve kabul kanıtları değişti. Mimari v1.11/A12; roadmap v1.10. LAST_REPORT.md üzerine yazıldı ve terminalde gösterildi.
- GitHub main kayıt hedefidir; canlı Cloudflare yayını bu yerel kabulden çıkarılmaz. Sıradaki tek iş: canlı vitrinde yeni krom/renkli harflerin yayınlandığını doğrulamak.

### 2026-10-04 — P3.7b lightbox ve 360° araç vitrini

- Talimat: yeni tabela eklemeden kaliteli lightbox görseli ve çekici marka kaplamalı, döndürülebilen araç. Başlangıç main d0711029ebf1ce932e8fa860bef60f4d40a2f7eb; çalışma ağacı temizdi. AGENTS.md, mimari v1.11 ve roadmap v1.10 okundu.
- Uygulama: mevcut vitrinin ardından lightbox ve teslimat aracı; özgün CanvasTexture NOVA Coffee konsepti, gerçek Three.js geometri, tam yatay dönüş, mouse/touch/klavye, reset ve ışık anahtarı. Sürekli hareket yok; lazy yükleme, idle/offscreen/hidden duruş, kaynak temizliği ve responsive WebP yedeği.
- Kanıt: TypeScript/production build başarılı; yeni iki davranış testi geçti, 360/1440 gerçek WebGL ekranları incelendi. Tam pakette 34 test: 31 pass / 3 fail. Üç hata başlangıç sürümünde de var: eski hizmet menüsü linki, JSON-LD'nin script sayılması, HTML-escape başlık beklentisi. Bu test beklentileri düzeltildi; ilgili 9/9 test tekrar geçti. Böylece 34 testin tüm davranışları başarılı kontrollere sahip; tek koşuda 34/34 iddiası yok. P3.7b ve eski üç showroom testi tam koşuda geçti.
- Koruma: hero ve önceki showroom modelleri/renderer/controller/CSS değişmedi. Menü, SEO, domain ve WhatsApp uygulaması değişmedi. Üretilen kategori/sitemap farkları bu commit'e dahil edilmedi.
- Mimari v1.12 / A13: iki model bir yeni renderer paylaşır; olay başına çizim ve ek context açık kapsam revizyonudur. NOVA Coffee temsili konsept; müşteri işi iddiası yok. P3.6 fiziksel GPU kabulü ve P4–P9 aşamaları açık.
- Sıradaki tek iş: canlı yayında yeni vitrinin görünürlüğünü ve sürükleme/ışık düğmelerini doğrulamak.

- Uzak uygulama kaydı 44ec239ef9a88555b45d9662f888711ddd27105c main üzerinde doğrulandı; 17 blob eşleşti. Cloudflare Workers Builds başarılı. Canlı HTTPS içeriğinde yeni bölüm var. Chromium'da tüm yanıtları canlı origin'den ileten yerel HTTP köprüsüyle gerçek 3D, dönüş ve ışık düğmesi başarılı; JS hatası yok. GitHub Verify son kontrolde sürüyordu. Canlı yayın kontrolü tamamlandı; sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.

### 2026-10-04 — P3.7c gerçek lightbox / Nissan (devam ediyor)

- Kullanıcının sağladığı iki görsel özgün dosya olarak eklendi. Lightbox gerçek fotoğraf, belirgin hover/klavye ışığı ve sabitleme düğmesiyle hazır.
- Araç gerçek Nissan fotoğrafıyla referans olarak gösterildi. Kesintisiz 360° engelli: gerçek model dosyası eksik; fotoğraf geçişi veya eski prosedürel araç kabul yerine kullanılmadı.
- Production build başarılı; masaüstü/mobil, klavye, reduced-motion ve JS kapalı durumlarını içeren showcase testleri 2/2 geçti. 1440 ve 360 ekranları incelendi. Kanıt: docs/evidence/P3_7C_REAL_REFERENCES.json. Tam test paketi bu revizyonda çalıştırılmadı.
- Mevcut hero/showroom korundu. Taslak wip/realistic-lightbox-nissan dalında; canlı yayın yapılmadı.
- Sıradaki tek iş: kullanıcının Nissan model ZIP/GLB/glTF dosyasını sağlaması, ardından gerçek kaplamalı 360° araç uygulaması.

### 2026-10-04 — P3.7c gerçek GLB dönüşü (uygulandı)

- Model kullanıcı tarafından sağlandı; önceki indirme engeli kalktı. Gerçek Nissan T32, uyarlanmış kırmızı/beyaz/siyah buyHome kaplaması, cam/metal/far/kauçuk materyalleri ve gerçek lightbox fotoğrafı birlikte gösterilir.
- 360° görünümü aç düğmesi 4.110.300 bayt modeli açık kullanıcı eyleminde yükler. Meshopt sadeleştirme/sıkıştırma, dört tekerlek konumu, kaynak/CC BY atfı. Otomatik sürekli dönüş yok; kullanıcı yönettiği tam 360° var.
- Build/TypeScript başarılı. Showcase davranış testleri 4/4; genel sayfa ve önceki showroom testleri 9/9 geçti. Mouse/touch, tam turdan fazla dönüş, klavye/reset, idle/offscreen duruş, context kaybı, model HTTP hatası, reduced-motion/JS kapalı ve 360/1440 px kontrolleri. Tam test paketi çalıştırılmadı; fiziksel GPU kabulü açık.
- Mimari v1.13 / A14. Uygulama main için hazırlanır; canlı yayın sonucu kayıt sonrasında ayrıca doğrulanır.
- Sıradaki tek iş: canlı yeni lightbox ve Nissan viewer yayınının doğrulanması.

- Uzak uygulama commit'i bf717d52cc4e2be2639c4870679ff020ffa92f08 main üzerinde 13 blob ile doğrulandı. Cloudflare Workers Builds ve live check başarılı. Canlı HTTPS origin'den bütün yanıtları ileten Chromium köprüsünde lightbox lit=true, Nissan başlangıç 2,6 → 3,1236 rad; JS hatası yok. Kanıt P3_7C_LIVE.json. GitHub verify son kontrolde sürüyordu; CI tam paket başarısı iddia edilmez. Sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.

### 2026-10-04 — P3.7c 360° görünümü kapatma düzeltmesi

- Kullanıcı kapatma düğmesinin eksik olduğunu bildirdi. Açma düğmesi model hazırken görünür ve etkin kalır; 360° görünümü kapat etiketine ve aria-expanded=true durumuna geçer. Kapatmada renderer/kaynaklar dispose edilir, fotoğraf geri gelir, yön düğmeleri devre dışı kalır; tekrar açılabilir.
- Production build/TypeScript ve showcase 4/4 test başarılı. 360/1440 px kapat/klavyeyle tekrar aç/canvas temizliği ve mevcut dönüş/ışık/hata yolları geçti. Mimari v1.13/A14 sınırlarına uyuldu; modül/veri sözleşmesi değişmedi. Tam test paketi çalıştırılmadı.
- Kayıt/yayın sonucu ayrıca doğrulanır. Sıradaki tek iş: canlıda kapatma düğmesini kontrol etmek.

- 360° kapatma canlı doğrulaması: 2226c7e2934b40a3d38b7babd64eea1cc801d664 Cloudflare başarılı. Canlı Chromium aç/döndür/kapat geçti; poster, sıfır canvas ve JS hatası yok. Kanıt docs/evidence/P3_7C_CLOSE_LIVE.json. P3.6 fiziksel kabulü açık.

### 2026-10-04 — P3.7d araç 3D iptali

- Kullanıcı araçta yalnızca beğendiği fotoğrafın kalmasını istedi. Araç modeli/viewer ve eski kullanılmayan showcase 3D modülleri, tüm dönüş kontrolleri ve 360° açıklamaları kaldırıldı. Referans fotoğrafı/kırpma ve lightbox ışığı korundu.
- Başta AGENTS, mimari v1.13 ve roadmap v1.12 okundu; mimari v1.14/A15 kullanıcı kapsam revizyonunu kaydeder. Hero, önceki showroom ve eşzamanlı hizmet içerikleri korunur.
- Kabul: production build/TypeScript ve fotoğraf/lightbox tarayıcı testleri 2/2 geçti; 360/1440 px, klavye/hover, JS kapalı ve reduced-motion kontrol edildi. P3.6 fiziksel GPU kabulü açık.
- Sıradaki tek iş: sadeleştirilmiş vitrini canlı yayında doğrulamak.

- Uzak uygulama d664d44248c9be9ba5e771926fbfad59af420745 blobları/silmeleri yeniden doğrulandı. Cloudflare ve live kontrolleri başarılı. Canlı Chromium: fotoğraf decode, sıfır araç kontrolü/canvas, 360 metni yok, lightbox lit=true; JS hatası yok. Kanıt P3_7D_PHOTO_ONLY_LIVE.json. GitHub verify sürüyor; tam CI başarı iddiası yok. Sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.

### 2026-10-04 — P2 hizmet görsellerinin devralınması

- Kullanıcı diğer sohbetten yüklediği hizmet fotoğraflarını burada yayınlamayı istedi. ZIP içindeki 20 WebP mevcut services.json galeri yollarına değişmeden eklendi; 19 tabela/yönlendirme ve bir araç giydirme. Başlık/açıklama altında masaüstünde iki sütun, mobilde tek sütun düzen korunur.
- Başta AGENTS, mimari v1.14 ve roadmap v1.13 tamamen okundu. Mevcut mimariye uyuldu; hizmet, showroom, SEO ve domain kodu değişmedi. P3.6 açık.
- Production build/TypeScript ve üç hizmet testi başarılı; 20 dosya decode ve görsel eşleme kontrol edildi. Kanıt docs/evidence/P2_SERVICE_IMAGES.json. Tam paket yeniden çalıştırılmadı.
- Sıradaki tek iş: canlı hizmet galerisi fotoğraflarını kontrol etmek.

- Canlı Cloudflare yayını başarılı; canlı HTTPS origin Chromium kontrolünde 20 hizmet fotoğrafı decode edildi, JavaScript hatası yok. İki sütunlu ışıklı tabela ekranı incelendi. Kanıt P2_SERVICE_IMAGES_LIVE.json. Sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.

### 2026-10-04 — P2 hizmet listesi / Totem ve LED-Neon

- Talimat: Fabrika & İş Güvenliği Levhaları, Kutu Harf Tabela, Tabela İmalatı, Tabela Montajı, Pleksi Kutu Harf başlıkları ve ilgili görsel blokları kaldırıldı. İlk üç yüklenen fotoğraf Totem Tabela, son üç LED / Neon Tabela galerisine eklendi. Paylaşılan proje varlıkları diğer sayfalarda kullanıldığı için kaynakları korunur.
- Başta AGENTS, mimari v1.14 ve roadmap v1.13 tamamen okundu; mevcut içerik mimarisine uyuldu. Hizmet JSON, altı WebP ve rapor/kanıt kayıtları değişir.
- Production build/TypeScript ve üç hizmet testi başarılı. 1440/360 px fotoğraf decode, silinen blokların yokluğu ve taşma kontrolü geçti. Diğer aşamalar ve P3.6 açık.
- Sıradaki tek iş: canlı hizmet revizyonunu doğrulamak.

- Canlı Cloudflare yayın kontrolü başarılı. Chromium canlı origin: altı yeni fotoğraf decode, kaldırılan beş blok 0 adet, JS hatası yok. Tam fotoğraf için Totem/LED-Neon galerilerine contain stili eklendi; masaüstü/mobil yeniden kontrol edildi. Kanıt P2_TOTEM_NEON_LIVE.json. Sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.

### 2026-10-04 — P2 Işıklı Tabela / Lightbox / Çatı görselleri

- Kullanıcı sırası: 1 Işıklı Tabela Rahat Villa yerine; 2–4 Lightbox eski görsel yerine; 5 Çatı Tabelası eski görsel yerine. Beş optimize WebP eklendi; eski Rahat Villa türevi kaldırıldı. Paylaşılan proje kaynakları korunur.
- AGENTS, mimari v1.14 ve roadmap v1.13 tamamen okundu; içerik mimarisi değişmedi. Lightbox contain stiliyle tam görünür.
- Production build/TypeScript ve üç hizmet testi geçti. 1440/360 px galeri decode ve taşma kontrolü başarılı. Tam paket çalıştırılmadı; P3.6 açık.
- Sıradaki tek iş: yeni beş fotoğrafın canlı yayınını doğrulamak.

- Uzak uygulama faa08b0f2019bf1141dc226fb1c78135920d11b7: tüm değişen bloblar ve silme doğrulandı. Cloudflare başarılı. Canlı origin Chromium: Işıklı Tabela yeni Rahat Villa yolu, Lightbox yeni üç görsel ve toplam yedi galeri fotoğrafı decode; JS hatası yok. Kanıt P2_LIGHTBOX_ROOF_LIVE.json. Sıradaki tek plan işi P3.6 fiziksel cihaz kabulüdür.
