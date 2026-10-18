# P7.0-live — Statik içerik için canlı güncelleme planı

Tarih: 2026-10-18. Durum: kullanıcı tarafından onaylandı; A/B yerel ve Preview alt kabulü tamamlandı. Mimari v1.25/A25. Production yayını yapılmadı. Bu belge yayın, secret kurulumu veya main değişikliği yapmaz.

## 1. Mevcut yayın akışı

Admin oturum/CSRF denetiminden sonra taslağı KV'den okur. `worker/github.ts`, site/services/projects/promotions/seo JSON'ları, R2 staging medyaları ve silinecek yolları tek GitHub tree/commit'inde toplar. `main` ref'i tekrar okunur; yarış varsa 409, güncelleme fast-forward olarak yapılır. `worker/index.ts` başarılı GitHub commit'ini yayın geçmişine kaydeder ve taslağı temizler. Bu cevap Cloudflare dağıtımının başarılı olduğunu doğrulamaz.

Cloudflare Workers Builds commit'ten build alır. `generate:pages` hizmet/proje/promosyon/vitrin statik HTML'lerini üretir; Vite çok sayfalı çıktıyı derler. Public tarayıcıya bugün ayrı içerik JSON akışı sunulmuyor. `site.json` ile `src/config/brand.ts` ve HTML'deki iletişim/metin alanları ayrıca eşlenmeli: yalnız JSON fetch eklemek mevcut metinleri kendiliğinden güncellemez. Sabit ana slogan korunacak; adminin düzenleyemediği bir hero başlık alanı varmış gibi davranılmayacak.

## 2. Sürümün konumu ve yayın zamanı

Build sırasında `dist/content-version.json` ve yalnız izinli public alanları içeren `dist/content/<section>.<sha256>.json` üretilecek. Manifest: `schemaVersion`, yayın commit SHA'sından türeyen `revision`, her bölümün hash'i ve aynı-origin JSON yolu. Aynı revision statik HTML'e küçük başlangıç metadatası olarak gömülecek. Özel admin taslağı, kullanıcı adı, upload staging bilgisi ve kimlik doğrulama verileri bu dosyalara girmeyecek.

Her başarılı içerik publish commit'i yeni revision üretir; içerik değişmemişse bölüm hash'leri aynı kalır. Manifest **başarılı deployment ile birlikte** görünür olur. GitHub yazıldığı anda KV'de public version değiştirmek önerilmez: bu, henüz yayınlanmamış JSON/medyayı işaret edebilir. Publish→build→deployment süresi, ardından en çok yaklaşık 45 saniyelik kontrol aralığı beklenir; aktif kullanıcı etkileşimi ek erteleme yaratabilir. Build commit bilgisi bulunamazsa sessizce uydurma revision yerine doğrulama/build hatası verilecek.

## 3. Public checker ve güvenli uygulama

`src/content/live/` altında checker, şema doğrulama, etkileşim koruması ve bölüme özel DOM adaptörleri ayrılacak. İlk statik HTML her zaman kullanılabilir. Production'da görünür sekmede 45 saniyelik tek zamanlayıcı; üst üste istek yok, timeout/AbortController ve hata sonrası sınırlı geri çekilme. Gizli sekmede polling durur; görünür olduğunda tek kontrol yapılır. Vite development HMR yolunda production polling açılmaz.

Manifest değişmediyse içerik indirilmez. Yalnız bu sayfanın kullandığı ve hash'i değişen bölümler alınır; header menüleri nedeniyle kategori bilgileri ortak bağımlılık olabilir. JSON tipi, şeması, boyutu, hash'i ve izinli URL'leri doğrulanır. Gerekli bütün parçalar hazırlanıp birlikte uygulanmadan aktif revision ilerletilmez. Arada ikinci yayın gelirse son snapshot seçilir; eski geç yanıt yeni içeriği geri alamaz.

Formda odak/son yazma, açık mobil veya mega menü, açık dialog, 3D pointer/klavye etkileşimi ve oynayan video güncellemeyi erteler. Koruma mevcut DOM/controller durumunu okur; ek sürekli RAF eklemez. Güvenli duruma geçişte bekleyen en son snapshot uygulanır. Form node'ları ve değerleri hiçbir koşulda değiştirilmez; bütün header, main veya sahne wrapper'ı `innerHTML` ile yenilenmez. Metinler `textContent`, kartlar güvenli DOM düğümleri ve olay delegasyonu ile güncellenir. Odak, seçili ürün ve aynı canvas nesnesi korunur.

Görünür bölümlerin ölçüsü değişecekse kararlı bir görünür DOM anahtarının ekrandaki konumu korunur; üstteki yükseklik farkı kadar scroll telafisi yapılır. Kullanıcının hareketi sırasında uygulanmaz. ScrollY'nin birebir sabit kalması, önceden ayrılmış kart/görsel boyutlarında ayrıca test edilir; yüksekliği değişen içerikte öncelik okuyucunun baktığı içeriğin yerini korumaktır.

## 4. İlk sürümde canlı güncellenecek alanlar

| Kaynak | DOM kapsamı |
| --- | --- |
| site | Görünen telefon/adres/Instagram/footer metni, telefon ve sosyal hedefler; teklif gönderme numarasının okunur ortak config'e bağlanması |
| services | Ortak hizmet menüsü, hizmet başlığı/açıklaması ve ilgili kategori hizmet/galeri kartları |
| projects | Ortak proje menüsü, ana sayfa kategori kartları, kategori başlık/açıklama/örnek notu ve fotoğraf kartları |
| promotions | Ortak promosyon menüsü, ana sayfa kategori kartları, kategori başlık/açıklama ve ürün kartları |
| seo | Geçerli sayfanın title/description ve yapılandırılmış verisinin aynı public kaynakla build'de eşlenmesi; statik canonical/sitemap gerçek URL kaynağı olarak korunur |

Vitrin ürün geometrisi, hero renderer, sabit ana slogan, form alanları ve yayınlanmış JS/CSS bu içerik protokolünün kapsamı dışındadır. Vitrinde ortak menü/iletişim güncellenebilir. Yeni/silinen kategori URL'leri build ve sitemap ile gelir; açık olan kaldırılmış sayfa zorla yönlendirilmez, mevcut içeriği koruyup durum bildirir. Oynayan video node'u yenilenmez; medya güncellemesi oynatma bitene kadar bekler. İlk HTML de aynı eşlemelerden üretilecek; JS kapalı SEO/iletişim gerilemeyecek.

## 5. Cache ve güvenlik

Manifest yanıtına `Cache-Control: no-store`, istemci fetch'e `cache: no-store` uygulanacak. Yalnız manifest yolu için hedefli header kuralı seçilecek ve yerel Worker'da doğrulanacak. Hash'li JSON adresleri değişmez içerik olarak cache edilebilir; yeni sürüm yeni URL'dir. Genel CSS/JS/font/görsel cache politikası değiştirilmez. Güncellenen aynı-yol medya için de içerik sürümü taşıyan URL kullanılacak; query/hash davranışı gerçek preview cache kabulünde doğrulanacak.

Bir deployment geçişinde eski manifestin JSON'u bulunamazsa veya HTML fallback dönerse schema/Content-Type/hash denetimi bunu reddeder; mevcut DOM korunur ve güncel manifest tekrar okunur. Başarısız indirmede yarım sürüm gösterilmez. Public yalnız aynı-origin GET/HEAD yapar; admin API, GitHub veya KV/R2 credential'ına erişmez. İzinli protokol/yol listesi, metin olarak render ve JSON boyut sınırı içerik enjeksiyonunu önler. Kaynak dosya adları ve admin'e özel metadata public projeksiyona alınmaz.

## 6. Test ve kabul

- Deterministik fixture/clock ile A→B: manifest farkı görülür, yalnız ilgili JSON fetch edilir, doğru section değişir; navigation/reload sayısı artmaz.
- Aynı revision/hash: büyük JSON isteği yok. Gizli sekme: polling yok; görünür olunca tek kontrol. Çakışan istek ve timer sızıntısı yok.
- Forma Türkçe metin yaz, caret/odak ve değerleri kaydet; güncelleme sırasında form DOM kimliği ve değerler değişmesin. Menü/dialog/3D/video sırasında B beklesin; güvenli anda uygulansın.
- Canvası nesne kimliğiyle, 3D seçimi/renderer başlatma sayısını ölçerek koru. Scroll ve görünür anchor konumunu ölç; dokunma kaydırmasını kesme.
- Bozuk şema, HTML fallback, 404, timeout, offline, hash uyumsuzluğu, B ardından C ve eski yanıt yarışı: mevcut içerik ve form korunsun; retry toparlasın.
- Yerel Worker ile manifest header/JSON public okuma; build snapshot tutarlılığı ve JS kapalı ilk HTML. Güvenli preview'da gerçek cache/medya ve mobil/tablet regresyon kabulü.

Gerçek admin production publish ve canlı dağıtım testi bu önerinin yerel/mock testleriyle tamamlanmış sayılmayacak. Mevcut production secret/live publish kabulü P7.0'da açık; P3.6 fiziksel cihaz testleri kullanıcı talimatıyla durdurulmuş durumda.

## 7. Riskler ve uygulama sırası

Başlıca riskler publish/deployment zaman farkı, build ve browser şablonlarının ayrışması, eski tarayıcının yeni schema'yı anlamaması, yükseklik değişimiyle scroll kayması ve medya cache'idir. Ortak public veri projeksiyonu, şema sürümü, DOM'a atomik uygulama ve hata halinde mevcut içeriği koruma ile sınırlandırılacak. Uyumsuz şema için otomatik reload yapılmayacak.

Sıra: planın kullanıcı tarafından değerlendirilmesi → ortak veri eşlemesi ve statik build çıktıları → checker/koruma ve bölüm adaptörleri → mock A/B ve regresyon kabulü → ayrıca yetkilendirilmiş uzak kayıt/preview ve production kabulü. Bu tur yalnız plan sunulur; canlı içerik kodu, endpoint veya cache yapılandırması değiştirilmez.
