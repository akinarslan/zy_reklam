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

## Güncel durum

P2 temeli tamamlandı: responsive sayfa, özgün SVG logo, Citadel başlık (masaüstü 45 pt), zümrüt footer, mobil menü, hareket azaltma tercihi ve temel WhatsApp formu. TypeScript/build ve altı gerçek tarayıcı testi geçti. Mevcut hero statik SVG posteridir; gerçek 3D sahne sıradaki P3 işidir.

P1.5 için gerçek proje fotoğrafları ve bilgilerinin doğrulanması bekliyor. Galeri, üretim animasyonları, tasarım stüdyosu ve görsel yükleme henüz uygulanmadı. WhatsApp formu mesajı hazırlar; ziyaretçi WhatsApp içinde kendisi gönderir.

## Proje belgeleri

- [ARCHITECTURE.md](ARCHITECTURE.md): hedef mimari, teknik kararlar ve uygulama sınırları.
- [ROADMAP.md](ROADMAP.md): aşamalar, bağımlılıklar ve kabul kanıtları.
- [AGENTS.md](AGENTS.md): her talimatta mimari ve plan kontrolü.
- [LAST_REPORT.md](LAST_REPORT.md): son işin tam raporu.
- [Başlangıç envanteri](docs/BASELINE.md) ve [varlık envanteri](docs/ASSET_INVENTORY.md).
- [Kaynak manifesti](docs/sources/source-manifest.json): legacy dosyalarının kaynağı ve bütünlüğü.
- [P2 test kanıtı](docs/evidence/P2_VERIFICATION.json).

`legacy/` eski kaynakların değişmeden alınan arşividir; yeni uygulamanın giriş noktası kökteki index.html'dir. Fontun kaynak kullanım koşulları varlık envanterinde kayıtlıdır. Mevcut DNS ve hosting bu çalışmada değiştirilmedi; canlı geçiş P9 kapsamındadır.
