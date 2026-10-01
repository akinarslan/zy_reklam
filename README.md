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

## Güncel durum

P2 temeli tamamlandı: responsive sayfa, özgün SVG logo, Citadel başlık (masaüstü 45 pt), zümrüt footer, mobil menü, hareket azaltma tercihi ve temel WhatsApp formu. TypeScript/build ve 16 test geçti. Hero, özgün SVG konturlarından gerçek 3D tabela gösterir; masaüstü fare dönüşü ve mobil yatay sürükleme desteklenir. WebGL/yükleme/context hatasında ve hareket azaltma tercihinde statik poster kullanılır. P3 fiziksel cihaz performans kabulü henüz kapanmadı.

P1.5 için gerçek proje fotoğrafları ve bilgilerinin doğrulanması bekliyor. Galeri, üretim animasyonları, tasarım stüdyosu ve görsel yükleme henüz uygulanmadı. WhatsApp formu mesajı hazırlar; ziyaretçi WhatsApp içinde kendisi gönderir.

## Proje belgeleri

- [ARCHITECTURE.md](ARCHITECTURE.md): hedef mimari, teknik kararlar ve uygulama sınırları.
- [ROADMAP.md](ROADMAP.md): aşamalar, bağımlılıklar ve kabul kanıtları.
- [AGENTS.md](AGENTS.md): her talimatta mimari ve plan kontrolü.
- [LAST_REPORT.md](LAST_REPORT.md): son işin tam raporu.
- [Başlangıç envanteri](docs/BASELINE.md) ve [varlık envanteri](docs/ASSET_INVENTORY.md).
- [Kaynak manifesti](docs/sources/source-manifest.json): legacy dosyalarının kaynağı ve bütünlüğü.
- [P2 test kanıtı](docs/evidence/P2_VERIFICATION.json), [P3 test kanıtı](docs/evidence/P3_VERIFICATION.json) ve [P3 kaynak bütçesi](docs/evidence/P3_BUDGET.json).
- [P3 performans karşılaştırması](docs/evidence/P3_PERFORMANCE_COMPARISON.json) ve [kabul kaydı](docs/P3_ACCEPTANCE.md).
- [Masaüstü 3D önizlemesi](docs/evidence/p3-hero-1440.jpg) ve [mobil önizleme](docs/evidence/p3-hero-360.jpg).

`legacy/` eski kaynakların değişmeden alınan arşividir; yeni uygulamanın giriş noktası kökteki index.html'dir. Fontun kaynak kullanım koşulları varlık envanterinde kayıtlıdır. Mevcut DNS ve hosting bu çalışmada değiştirilmedi; canlı geçiş P9 kapsamındadır.
