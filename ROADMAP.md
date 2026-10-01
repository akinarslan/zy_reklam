# ZY Reklam — Yol Haritası

**Sürüm:** 1.0 · **Başlangıç:** 2026-10-01

**Kaynak:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Zorunlu kontrol:** [AGENTS.md](AGENTS.md)

## 1. Güncel durum

**Aktif aşama:** P0 — Planlama belgelerinin kaydı.

**Sıradaki uygulama aşaması:** P1 — Mevcut site ve varlık envanteri.

Depo başlangıçta boştur. Kod, 3D model, logo/font dosyaları ve canlı yayın henüz bu yol haritasıyla teslim edilmemiştir. Belge hazırlama, uygulama geliştirmesinin başlaması anlamına gelmez.

Durumlar: `bekliyor`, `devam ediyor`, `engelli`, `tamamlandı`. İş kutuları yalnızca kabul kanıtı üretildikten sonra işaretlenir. Bu dosya her kullanıcı talimatından önce okunur ve iş bitiminde güncellenir.

## 2. Aşamalar ve sıra

| Aşama | Çıktı | Bağımlılık | Durum |
| --- | --- | --- | --- |
| P0 | Mimari, roadmap ve çalışma kuralları | Kullanıcının tasarım yönü | Devam ediyor |
| P1 | Mevcut site, varlık, SEO ve yayın envanteri | P0 | Bekliyor |
| P2 | Ön yüz temeli, mobil düzen, içerik ve güvenli yedek | P1 | Bekliyor |
| P3 | Özgün ZY ile 3D açılış | P2 + doğrulanmış logo | Bekliyor |
| P4 | Üretim anlatımı ve hizmet etkileşimleri | P3 | Bekliyor |
| P5 | Gerçek proje galerisi | P2 + gerçek görseller; teslim sırası P4 sonrası | Bekliyor |
| P6 | Mini stüdyo ve WhatsApp teklif metni | P3, P5 + doğrulanmış iletişim | Bekliyor |
| P7 | Güvenli görsel yükleme ve teklif bağlantısı | P6 + sağlayıcı/veri politikası kararı | Bekliyor |
| P8 | Uçtan uca kabul, mobil/performance/SEO | P2–P7 | Bekliyor |
| P9 | Yetkilendirilmiş canlı geçiş ve geri dönüş kontrolü | P8 + mevcut hosting erişimi/yayın yetkisi | Bekliyor |

İşler bağımlılıkları karşılanmadan tamamlanamaz. Galeri içeriği gibi bağımsız hazırlıklar öne alınabilir; aşama teslim sırası korunur. Kullanıcının hata düzeltme/öncelik değiştirme talimatları belgelenerek uygulanır.

Süreler takvim taahhüdü değildir. P1 sonrası logo kalitesi, gerçek görsel sayısı, mevcut kod ve upload sağlayıcısına göre efor tahmini yapılır. Erişim/varlık bekleme süreleri çalışma süresinden ayrı tutulur.

## 3. P0 — Planlama ve kalıcı çalışma disiplini

- [ ] P0.1 Mimari ve kapsam `ARCHITECTURE.md` içinde kaydedildi.
- [ ] P0.2 Aşamalar, bağımlılıklar ve kabul ölçütleri bu dosyada kaydedildi.
- [ ] P0.3 Her talimatta plan kontrolü `AGENTS.md` ile tanımlandı.
- [ ] P0.4 Belgeler GitHub `main` dalında yeniden okunarak doğrulandı.

**Kabul:** Belgeler birbirine bağlanır, uygulanan/plandaki işler ayrıdır, mevcut canlı site veya kod değişmez. Uzak kaydın kanıtı bulunur.

## 4. P1 — Mevcut site ve varlık envanteri

- [ ] P1.1 Mevcut site kaynaklarını depoya al veya doğrulanmış erişilebilir kaynağı kaydet; çalışma ağacını ve başlangıç commit’ini koru.
- [ ] P1.2 Logo, PDF/vektör kaynak, fontlar ve görselleri `docs/ASSET_INVENTORY.md` içine dosya/kaynak/kullanım hakkı/eksik durumu ile yaz.
- [ ] P1.3 ZY ambleminin onaylı vektörünü ve statik posterini hazırla; kaynakla oran/kontur karşılaştırmasını kaydet.
- [ ] P1.4 Citadel of Blackrose fontunun Türkçe glifleri ve kullanım koşullarını denetle; 45 pt masaüstü başlık şartını kaydet.
- [ ] P1.5 Gerçek hizmetler, WhatsApp numarası, iletişim, sosyal bağlantılar ve proje bilgilerini doğrula.
- [ ] P1.6 Mevcut URL/SEO/favicon/domain-www/hosting/build durumunu `docs/BASELINE.md` içine kaydet.
- [ ] P1.7 Ön yüz stack’i, mevcut yapıyı koruma/geçiş yöntemi, upload sağlayıcısı adayları ve ortam gereksinimlerini karar kaydına yaz.

**Kabul:** Geliştirme için gerekli kaynaklar bulunur; eksikler görünürdür. Logo/font/iletişim tahmin edilmez. P2 için çalıştırma ve build yöntemi seçilmiştir. Hosting sağlayıcısı doğrulanmadan yayın komutu yazılmaz.

**Engel yönetimi:** Eksik proje fotoğrafı içerik hazırlığını engelleyebilir; temel layout hazırlanabilir. Eksik logo P3’ü, doğrulanmamış iletişim P6’nın gerçek WhatsApp kabulünü, eksik upload erişimi P7’yi engeller. Uydurma varlıkla bu engeller kapatılmaz.

## 5. P2 — Ön yüz ve içerik temeli

- [ ] P2.1 P1 stack kararına göre yapı, paket/lockfile, TypeScript ve build düzenini kur.
- [ ] P2.2 Tema tokenlarını, yerel fontları, responsive layout ve semantik bölümleri oluştur.
- [ ] P2.3 Navbar, slogan, CTA, gerçek hizmet/iletişim içeriği ve zümrüt footer’ı uygula.
- [ ] P2.4 Statik amblem/poster, 3D yükleme yedeği, hareket azaltma tercihi ve mobil etkileşim temelini kur.
- [ ] P2.5 SEO metadata/favicon/canonical/robots/sitemap başlangıcını envantere göre koru veya hazırla.
- [ ] P2.6 Değişikliğe uygun test/CI kontrollerini ekle; sırlar, build, bağımlılık ve upload dosyalarını Git dışında tut.

**Kabul:** 360, 768 ve 1440 px genişliklerde yatay taşma yoktur. Başlık masaüstünde 45 pt, mobilde okunaklıdır. CTA ve temel iletişim 3D’den bağımsız çalışır. Klavye odakları görünür; build ve seçilen statik analiz kontrolleri geçer. CI mevcut değilse başarı iddia edilmez; kurulan kontrollerin gerçek çıktısı kaydedilir.

## 6. P3 — 3D ZY açılış

- [ ] P3.1 Onaylı özgün amblemi katmanlı tabela geometrisine dönüştür.
- [ ] P3.2 Beyaz ışıklı pleksi, altın metal, çevre ışığı ve gölgeyi oluştur.
- [ ] P3.3 Masaüstü sınırlı fare dönüşünü ve mobil sürüklemeyi uygula; dikey scroll’u koru.
- [ ] P3.4 Ertelenmiş 3D yükleme, kalite düşürme, görünmezken durma ve kaynak temizliğini uygula.
- [ ] P3.5 WebGL yokluğu, context kaybı ve hareket azaltma yollarını doğrula.

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
- Durum: belgeler hazırlanıyor; uzak kayıt sonrası P0 güncellenecek.
- Mimari sınırı: mevcut site ve varlıklar görülmeden uygulanmış teknoloji veya çalışan 3D iddiası yok.
- Sıradaki tek iş: P1 — mevcut site kaynaklarını ve özgün varlıkları envantere alma.
