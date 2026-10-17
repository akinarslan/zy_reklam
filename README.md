# ZY Reklam — Dijital Üretim Atölyesi

Özgün ZY kimliğiyle tabela ve dijital üretim hizmetlerini sunan web sitesi. Mevcut kaynak arşivlenmiştir; yeni ön yüz Vite ve TypeScript ile modüllere ayrılmıştır.

## Çalıştırma

Node.js 22.12 veya üzeri gerekir; geliştirmede Node 24.19.0 kullanıldı.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
npx playwright install chromium
npm test
```

Linux CI için `npx playwright install --with-deps chromium` kullanılır. Kurulu başka bir Chromium kullanılacaksa `ZY_CHROMIUM_PATH` yürütülebilir dosyanın tam yolunu alır. Build çıktısı `dist/` altındadır; bu klasör ve node_modules Git'e eklenmez.

P3 testleri derlenmiş `dist/` üzerinde çalışır; testten önce `npm run build` gerekir.

## Promosyon sayfaları

Promosyonlar menüsünde dört fotoğraflı kategori bulunur; her biri `/promosyonlar/<kategori>/` adresinde ayrı statik sayfadır. [Fotoğraf eşlemesi ve sayfa adresleri](docs/PROMOTION_ASSETS.md). İçerik kaynağı `src/content/promotions.json`; ortak HTML üretimi `npm run generate:promotions` ile yapılır ve dev/build öncesinde otomatik çalışır.

## Cihaz performans ölçümü

Önizleme adresinde `/qa/scene-performance.html` yolunu açın. Araç üç ölçüm yapar ve kullanıcı eylemiyle JSON raporu indirir. Cihaz modeli/OS/güç koşulunu doldurun; fiziksel kabul için üç adet 10 saniyelik örneği kullanın. [Ölçüm yöntemi ve kabul kaydı](docs/P3_DEVICE_MEASUREMENT.md). Bu araç fiziksel donanımı veya P3 kabulünü otomatik doğrulamaz.

## Güncel durum

P2 temeli tamamlandı: responsive sayfa, özgün SVG logo, Citadel başlık (masaüstü 45 pt), zümrüt footer, mobil menü, hareket azaltma tercihi ve temel WhatsApp formu. TypeScript/build ve 23 test geçti. Hero, özgün SVG konturlarından gerçek 3D tabela gösterir; masaüstü fare dönüşü ve mobil yatay sürükleme desteklenir. WebGL/yükleme/context hatasında ve hareket azaltma tercihinde statik poster kullanılır. Logo aynı görünümü koruyan dört ortak katmanda çizilir; ana sahne çizim çağrısı 27’den 13’e indi. P3 fiziksel cihaz performans kabulü henüz kapanmadı.

P1.5 için gerçek proje fotoğrafları ve bilgilerinin doğrulanması bekliyor. Galeri, üretim animasyonları, tasarım stüdyosu ve görsel yükleme henüz uygulanmadı. WhatsApp formu mesajı hazırlar; ziyaretçi WhatsApp içinde kendisi gönderir.

## Proje belgeleri

- [ARCHITECTURE.md](ARCHITECTURE.md): hedef mimari, teknik kararlar ve uygulama sınırları.
- [ROADMAP.md](ROADMAP.md): aşamalar, bağımlılıklar ve kabul kanıtları.
- [AGENTS.md](AGENTS.md): her talimatta mimari ve plan kontrolü.
- [LAST_REPORT.md](LAST_REPORT.md): son işin tam raporu.
- [Başlangıç envanteri](docs/BASELINE.md) ve [varlık envanteri](docs/ASSET_INVENTORY.md).
- [Kaynak manifesti](docs/sources/source-manifest.json): legacy dosyalarının kaynağı ve bütünlüğü.
- [P2 test kanıtı](docs/evidence/P2_VERIFICATION.json), [P3 test kanıtı](docs/evidence/P3_VERIFICATION.json) ve [P3 kaynak bütçesi](docs/evidence/P3_BUDGET.json).
- [P3 gölge karşılaştırması](docs/evidence/P3_PERFORMANCE_COMPARISON.json), [logo katmanı karşılaştırması](docs/evidence/P3_BATCH_COMPARISON.json), [görsel eşleşme](docs/evidence/P3_BATCH_VISUAL_VERIFICATION.json) ve [kabul kaydı](docs/P3_ACCEPTANCE.md).
- [Masaüstü 3D önizlemesi](docs/evidence/p3-hero-1440.jpg) ve [mobil önizleme](docs/evidence/p3-hero-360.jpg).

`legacy/` eski kaynakların değişmeden alınan arşividir; yeni uygulamanın giriş noktası kökteki index.html'dir. Fontun kaynak kullanım koşulları varlık envanterinde kayıtlıdır. Mevcut DNS ve hosting bu çalışmada değiştirilmedi; canlı geçiş P9 kapsamındadır.

## Projeler örnek koleksiyonu

Beş fotoğraflı Projeler kategorisi /projeler/tabela/, /projeler/totem/, /projeler/lazer-kesim/, /projeler/dijital-baski/ ve /projeler/ozel-uretim/ adreslerindedir. 19 görsel ve bir video kullanıcı tarafından sağlanan tasarım/uygulama örnekleridir; ZY müşteri referansı değildir. Eşleme docs/PROJECT_ASSETS.md; kaynak src/content/projects.json. `npm run generate:pages` iki mega menüyü ve dokuz kategori sayfasını birlikte üretir. Video otomatik oynatılmaz.

## Admin paneli

Admin paneli `/admin/` altında statik Vite sayfası ve Cloudflare Worker API'si olarak çalışır. Taslak içerik ve bekleyen medya kullanıcı adına göre KV/R2'de tutulur; tarayıcı depolaması kaynak değildir. Medya kütüphanesi public image/video envanterini ve R2 staging dosyalarını listeler. Silme kullanımdaki dosyaları reddeder. GitHub yayın eylemi içerik JSON'larını, eklenen medyayı ve silme işlemlerini tek bir `main` commit'inde birleştirir; panel Cloudflare Builds/deploy durumunu doğrulamaz.

Yerel doğrulama:

```sh
npm run build
npm run worker:dev
```

`.dev.vars.example` dosyasını `.dev.vars` olarak kopyalayıp yalnızca test değerleriyle doldurun; parola hash'i `npm run hash:admin -- "yerel-şifreniz"` komutuyla üretilebilir. Yerel testlerde `GITHUB_TOKEN` tanımlamayın; böylece GitHub `main` yayın ucu kapalı kalır. `.dev.vars` ve gerçek secret'lar Git'e eklenmemelidir.

## Cloudflare kaynakları ve yayın güvenliği

Mevcut `wrangler.jsonc`, `ADMIN_DRAFTS` için provision edilmiş Cloudflare KV namespace ID'sine bağlıdır. Başka bir Cloudflare hesabı/Worker kurulumu için kendi namespace'inizi oluşturup config'teki ID'yi onunla değiştirin. R2 kaynağı da gerçek deployment öncesi hesapta oluşturulmalıdır:

```sh
npx wrangler kv namespace create ADMIN_DRAFTS
npx wrangler r2 bucket create zy-reklam-admin-media-staging
```

R2 API'si hesabınızda etkin değilse Cloudflare Dashboard'dan etkinleştirip bucket oluşturmayı tekrar deneyin. Bucket adı config ile aynı olmalıdır. Worker secret'larını Cloudflare'de `wrangler secret put ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` ve `GITHUB_TOKEN` ile tanımlayın. `GITHUB_TOKEN` yalnız gerekli GitHub `contents` yazma yetkisiyle ve yayımlama yetkisi açıkça verilmiş ortamda eklenmelidir. Bu Worker `main` dalına commit oluşturur; bağlı Workers Builds bu commit üzerine deploy başlatabilir. Wrangler `--dry-run` config'i derler; gerçek kaynak, credential veya canlı deployment durumunu doğrulamaz.

Doğrulama, test Worker'ı ayrı geçici dizin, yerel KV/R2 emülasyonu ve geçici test credential'larıyla başlatır; çalışma alanındaki `.dev.vars` dosyasını kullanmaz.
