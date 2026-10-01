# Promosyon görselleri ve kategori eşlemesi

**Tarih:** 2026-10-01 · **Kapsam:** P2.7 / kullanıcının gönderdiği 14 katalog görseli.

Görseller dosya adından bağımsız olarak açılıp incelendi. Her görselin bir ana kategorisi vardır; bez çanta/keseler tekstilde, termos/kupa içeren bazı setler yaşam kategorisinde de gösterilir. Ana kategori eşlemesi ve kaynak SHA-256 değerleri src/content/promotions.json içinde kayıtlıdır.

## Sayfalar

| Kategori | Ayrı statik sayfa |
| --- | --- |
| Tekstil ve Giyim Ürünleri | `/promosyonlar/tekstil-giyim/` |
| Ofis ve Kırtasiye Malzemeleri | `/promosyonlar/ofis-kirtasiye/` |
| Yaşam, Mutfak ve Seyahat Gereçleri | `/promosyonlar/yasam-mutfak-seyahat/` |
| VIP ve Doğa Dostu (Ekolojik) Özel Setler | `/promosyonlar/vip-ekolojik-setler/` |

## Dosya eşlemesi

| Gönderilen dosya | Görseldeki ürün | Ana kategori | Ek gösterim |
| --- | --- | --- | --- |
| 8562_3.png | Siyah ajanda ve kalem seti | Ofis ve Kırtasiye Malzemeleri | — |
| indir (1).jpg | Yeşil ajanda ve kalem seti | Ofis ve Kırtasiye Malzemeleri | — |
| indir.jpg | Mavi organizer | Ofis ve Kırtasiye Malzemeleri | — |
| toptan-ajanda-defter-ve-kalem-seti.jpg | Kutulu ajanda ve kalem | Ofis ve Kırtasiye Malzemeleri | — |
| ham-bez-canta2.jpg | Bez çantalar | VIP ve Doğa Dostu (Ekolojik) Özel Setler | Tekstil ve Giyim Ürünleri |
| kese2.jpg | Baskılı bez keseler | VIP ve Doğa Dostu (Ekolojik) Özel Setler | Tekstil ve Giyim Ürünleri |
| promosyon_tekstil.jpg | Polo tişört ve şapka | Tekstil ve Giyim Ürünleri | — |
| kisiye-ozel-vip-set.png | Kişiye özel VIP set | VIP ve Doğa Dostu (Ekolojik) Özel Setler | — |
| vip-hediyelik-set-34411-48242.jpg | Termoslu VIP set | VIP ve Doğa Dostu (Ekolojik) Özel Setler | Yaşam, Mutfak ve Seyahat Gereçleri |
| asdka.jpg | Teknoloji hediye seti | VIP ve Doğa Dostu (Ekolojik) Özel Setler | — |
| hediyelik-set-34403-67661.jpg | Kurumsal hediye seti | VIP ve Doğa Dostu (Ekolojik) Özel Setler | — |
| kisiye-ozel-cuzdan-termos-anahtarlik-seti.jpg | Kişiye özel termoslu set | VIP ve Doğa Dostu (Ekolojik) Özel Setler | Yaşam, Mutfak ve Seyahat Gereçleri |
| kisiye-ozel-premium-hediye-kutusu-dereceli-termos-kupa-bardak-ayicik-anahtarlik-seti-kcm61056645-d88411f5-f555-47ab-ac3e-b04e6fa679b1.jpg | Kişiye özel kupa | Yaşam, Mutfak ve Seyahat Gereçleri | — |
| isme-ozel-premium-tasarim-dereceli-celik-termos-kupa-bardak-defter-kalem-anahtarlik-erkek-kadin-hediye-seti-kcm63451941-ae87b43a-5516-44e9-8970-5856b9daa1cc.jpeg | Premium hediye seti | VIP ve Doğa Dostu (Ekolojik) Özel Setler | Yaşam, Mutfak ve Seyahat Gereçleri |

Uzun adı “kisiye-ozel-premium-hediye-kutusu...” ile başlayan görsel yalnızca beyaz, çiçek/isim baskılı kupa gösterir; “Yaşam, Mutfak ve Seyahat” kategorisine alındı. “indir.jpg” dosyası telefon/kart bölmeli mavi organizer gösterir. “asdka.jpg” kutulu termos ve teknoloji aksesuarları setidir. VIP/Ekolojik sayfasında altı VIP set ve iki bez ürün ayrı bölümlerdedir.

Gönderilen görseller katalog örnekleridir; tamamlanmış ZY müşteri projesi, doğrulanmış stok/fiyat veya sertifika olarak etiketlenmez. “Ekolojik” kullanıcı tarafından verilen kategori adıdır; içerikte bez çanta/kese gösterilir, organik içerik veya çevre sertifikası iddiası eklenmedi. Gerçek proje galerisi için P1.5/P5 kabulü açık kalır.

## Varlık işleme

Kaynaklar yerinde değiştirilmedi. Site için 480 ve en çok 960 piksel genişlikte WebP türevleri hazırlandı (Pillow LANCZOS, quality 84 / method 6); küçük kaynaklar büyütülmedi. Dosya başına gerçek genişlik/yükseklik/bayt ve SHA-256 içerik kaydındadır. 28 WebP toplamı 1.061.356 bayttır; hepsi başlangıçta indirilmez. responsive srcset/sizes, açık en/boy ve alt metin, menü/galeride lazy load kullanılır. CSS object-fit:contain kaynak görsellerin ürün/yazılarını kesmez.

Orijinal dosyaların hash ve boyutları içerik kaydından kontrol edilebilir. Kullanıcı bu görselleri promosyon sayfaları için sağladı; P7 müşteri dosyası yükleme akışı bu varlık envanterinin dışındadır.

## İçerik bakımı

src/content/promotions.json kategori/fotoğraf eşleşmesinin kaynağıdır. `npm run generate:promotions` ana sayfa menüsü ve kategori kartları ile dört statik HTML sayfasını ve sitemap’i üretir. `npm run dev` ve `npm run build` önce bu üretimi çalıştırır. Kategori sayfaları promosyonlar/<kategori>/index.html dosyalarıdır; ortak header/footer ana sayfadan alınır. HTML elle düzenlenecekse ortak bölüm index.html’de, kategori içeriği JSON’da değiştirilir.
