# ZY Reklam — Geliştirme Kuralları

Bu kurallar depodaki tüm işlere uygulanır. Kullanıcının açık yeni talimatı önceliklidir; yeni talimat planı değiştiriyorsa belgeler de aynı işte güncellenir.

## Her kullanıcı talimatından önce

1. Depodaki bu dosyayı, `ARCHITECTURE.md` ve `ROADMAP.md` dosyalarının **güncel tamamını** oku. Önceki sohbet özeti veya bellek okumayı ikame etmez. Alt klasörde başka `AGENTS.md` varsa kapsamına giren değişikliklerde onu da oku.
2. Git çalışma ağacını, dalı ve mevcut değişiklikleri kontrol et. Kullanıcıya ait değişiklikleri silme. Uzak depoyla karşılaştırma mümkün değilse bu sınırı kaydet; mümkünse uzak durumu doğrula.
3. Talimatı ilgili `P<n>` aşaması ve somut iş maddesiyle eşleştir. İşin bağımlılıklarını, kabul ölçütlerini ve mimari sınırlarını kontrol et.
4. Kısa ilerleme mesajında ilgili aşamayı ve yapılacak işi belirt. Önceki aşamalar tamamlanmamışsa bağımsız düzeltmeler yapılabilir; engelli bir özelliği tamamlanmış gösterme.
5. Talimat mevcut plana uyuyorsa uygula. Kullanıcı açıkça yön değiştiriyorsa ilgili mimari kararını ve yol haritasını aynı değişiklikte revize et. Kullanıcının talimatı rutin bir revizyon için yeterli yetkidir. Kritik tercih mevcut bilgiyle çözülemiyorsa yalnızca o eksik bilgi için açıklama iste; bağımsız işi sürdür.

## Uygulama sırasında

- Aşama sırasını ve bağımlılıkları koru. Yeni kapsamı sessizce ekleme, kapsamı sessizce çıkarma.
- Değişiklikleri mimarideki modül sınırları içinde yap; tek dosyada tüm uygulamayı toplama.
- Özgün ZY amblemi, doğrulanmış iletişim bilgileri ve gerçek proje içerikleri kullan. Logo yerine harflerle oluşturulmuş yaklaşık bir işaret koyma.
- Başlık: **“Projenize özel çözümler üretiyoruz.”** Citadel of Blackrose ve masaüstü 45 pt başlangıç tasarım şartıdır; font dosyası ve kullanım hakkı P1’de doğrulanır. Mobil ölçü uyarlanır.
- Mevcut SEO, adresler, domain yönlendirmeleri ve iletişim akışlarını envantere göre koru. Planla çelişen bir yayınlama yöntemi seçme.
- 3D ve animasyon arızaları teklif akışını engelleyemez. Hareket azaltma tercihini ve klavye erişimini koru.
- WhatsApp bağlantısının metin hazırladığını; dosya eklemediğini, mesajı otomatik göndermediğini unutma. Gerçek dosya yükleme P7’nin sunucu sözleşmesini gerektirir.
- Gizli anahtarları, yüklenen müşteri dosyalarını ve kişisel verileri Git’e ekleme.
- Teknik değişikliğe uygun doğrulamayı yap. Sonuç üretmeyen, yalnızca implementasyonu tekrar eden testler ekleme.
- Kullanıcının yetkilendirdiği kayıtları tamamla. Canlı yayın yetkisini yapılan isteğin bağlamından değerlendir; sadece belge yazma talimatını canlı yayın yetkisi sayma.

## Her işin sonunda

1. `ROADMAP.md` içindeki ilgili iş durumunu ve ilerleme günlüğünü güncelle. Kabul ölçütleri karşılanmadan kutu işaretleme. Kısmi çalışma için `devam ediyor`, bağımlılık için `engelli` kullan.
2. Mimari veya veri sözleşmesi değiştiyse `ARCHITECTURE.md` karar kaydını da güncelle. Değişmediyse raporda mevcut sürüme uyulduğunu belirt; gereksiz sürüm değişikliği yapma.
3. Tam final raporunu proje kökündeki `LAST_REPORT.md` dosyasına UTF-8 olarak yaz; önceki raporun üzerine yaz. Aynı raporu terminalde de göster. `LAST_REPORT.md` gizli veri veya erişim anahtarı içeremez.
4. Raporda talimatın karşılığı, aşama/iş kimliği, değişen dosyalar, doğrulama sonucu, varsa engeller ve sıradaki tek iş bulunur. Gerçek commit SHA yalnızca oluştuğunda raporlanır; raporun kendi commit SHA’sını yazmak için döngüsel commit üretme.
5. Kaydetme/push istendiyse uzak depoda ilgili commit veya dosyaları yeniden okuyarak doğrula. Yerel dosya veya oluşturulmuş Git nesnesi tek başına başarılı uzak kayıt değildir.
6. Son kullanıcı yanıtında sonucu, önemli sınırı ve sıradaki aşamayı kısa biçimde bildir.

## Tamamlanma kuralı

Bir aşama ancak tüm kabul ölçütlerinin kanıtları ilerleme günlüğünde yer aldığında tamamlanır. Üretilen kod, görüntü veya belge varlığı tek başına işlevin çalıştığını kanıtlamaz. Yapılmayan kontrol `çalıştırılmadı` olarak yazılır.
