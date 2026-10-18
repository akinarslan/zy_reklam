# ZY Reklam — P7.0-live A/B uygulama ve kabul raporu

Tarih: 2026-10-18
Talimat: Header mini tabelasını ayrı temiz commit'e al; onaylı canlı içerik planını A(manifest/snapshot) ve B(checker/keyed patch) olarak uygula; yerel ve Preview kabulü. Yeni PR/merge/production deploy YASAK.
Aşama/iş: P2.10 kayıt tamamlandı; P7.0-live-A yerel kabul tamamlandı; P7.0-live-B yerel kabul tamamlandı, Preview bekleniyor. Genel P7 açık.
Mimari: v1.25/A25; A20–A24 ve statik-first/SEO/3D sınırları korunur.
Dal/çalışma alanı: feat/3d-vitrin-page; .worktrees/3d-vitrin-page. Ana kullanıcı/generated farkları korundu; reset/clean yapılmadı.
Header commit:1395e6f63e944a27e233424fbfe79cd70ee7a22b — yalnız5kaynak/test dosyası.
A commit:a4ebd8c — build manifest/public snapshot ve protokol/cache/test/belge altyapısı.
Bu kayıt anında B kaynakları henüz commit edilmedi; mevcut HEAD:a4ebd8c18bc046cc98ca6530788df45d69f22a3e.
Uzak B kaydı ve Preview henüz doğrulanmadı.
PR:YENİ PR YOK. Merge:YOK. Production deploy:YOK. Main:03fc90d6522f8eaa26195b6985738cf99c981ba5.
Preview:bekleniyor.

A — VERSION / PUBLIC SNAPSHOT
Build son statik HTML'in yalnız izinli hizmet/proje/promosyon bölgelerini JSON DOM ağaçlarına projekte eder; site yalnız phone/address/instagram/footerText public alanlarıdır. Build-only linkedom kullanılır; public bundle'a HTML parser/engine eklenmez. Tek ortak statik HTML kaynağı, tarayıcıda ikinci katalog template'i oluşmasını önler. Ana sayfa hizmet kartları aynı services.json gruplarına eşlenir; contact/footer aynı site.json eşlemesini build ve canlı patch'te paylaşır.
Manifest:/content-version.json; schemaVersion1,git HEAD revision,dört section hash/url. Snapshot:/live-content/<section>.<SHA256>.json. Canonical anahtar sıralı JSON ve SHA256 deterministiktir; aynı public içerik aynı hash'i üretir. Manifest ve JSON'lar aynı dist/deployment içindedir. Admin publish anında KV/manifest değiştirilmez; GitHub commit→başarılı Cloudflare deployment→görünür yeni manifest sırası korunur.
Yalnız hedefli _headers: manifest no-store,max-age0,must-revalidate; hash'li JSON public,max-age31536000,immutable. Diğer CSS/JS/font/görsel cache kuralları değiştirilmedi. Gerçek local Worker yanıtları test edildi.

B — PUBLIC CHECKER / KEYED PATCH
Yalnız production build/public sayfalar;45sn tek timer. Hidden'da timer ve istek iptal edilir; visible'da hemen tek kontrol. Aynı revision/hash içerik indirmez; yalnız hash'i değişmiş section JSON'u indirilir. Timeout10sn,manifest16KB/snapshot2MB sınırı,Content-Type/status/schema/hash/tag/attribute/URL allowlist doğrulaması. Admin API veya credential istemez; read-only fetch credentials:omit. Hatalı snapshot mevcut içeriği silmez veya sayfayı yenilemez.
Patch yalnız services/projects/promotions menü/kart/metin bölgeleri, kategori başlık/açıklamaları ve contact phone/address/social/footer alanlarına uygulanır. Sabit hero sloganı ve3D geometri/model kapsam dışı. Parent innerHTML replacement ve location.reload yok; kararlı anahtarlarla mevcut kartlar korunur.
Form focus/dirty,3D pointer/touch/keyboard,açık mobil/mega menü/dialog ve oynayan video güncellemeyi erteler. Bekleyen en son snapshot güvenli durumda uygulanır. Dirty form blur sonrası da korunur; açık reset/submit dirty kilidini bırakır, focus ayrıca korunur. Form input/caret,scroll,gerçek WebGL canvas ve video kimliği/zamanı kabulü geçti. WhatsApp submit numarası güncel public config'i okur; form node'u/değerleri yenilenmez.
Metinler text node olarak üretilir. İzinli tag/attribute/protokol ve public yol listesi dışı veri reddedilir; javascript:,data:,başka origin,admin/API yolu ve inline event attribute snapshot'a alınmaz. Gizli admin taslağı/staging/token verileri public projeksiyona girmez. İlk HTML h1/katalog/iletişim/canonical içeriğini JS kapalıyken de taşır. Vite development HMR,production polling'den ayrı kalır.

DOĞRULAMA
npm.cmd run build(check/TypeScript dahil):PASS. Son tek seri npm.cmd test -- --test-concurrency=1:51/51 PASS,0fail. Önce A'nın build/hash/schema/statik HTML testi ve gerçek Worker cache kabulü; sonra B'nin geniş tarayıcı kabulü yapıldı.
B senaryoları:A→B,aynı sürüm,tek-section fetch,offline,manifest404/bozukJSON,JSON404/bozukJSON,unsupported schema,hash/unsafe URL reddi,stale B→C yarışı,hidden/visible,dirty form/focus/caret,scroll,kart kimliği,mobil menü,dialog,gerçek WebGL canvas pointer erteleme ve kimliği,kategori text sanitasyonu,site/WhatsApp hedefi,oynayan video erteleme/kimlik/currentTime ve JS kapalı SEO.
Önceki mini tabela96kombinasyon,18homefold,28navbar,16showroom stage,32Instagram ve vitrin ışık/klavye/touch/reduced/context/module/JS-kapalı regresyonları son tam koşuda PASS. Hiçbir mevcut test kaldırılmadı.
İlk B testinde clock kurulumu sayfa yükünden önceye alınarak timer kontrol edildi. HTML entity ayrı text node'ları fixture değişiminin oluşmasını engelliyordu; snapshot komşu text node'larını deterministik birleştirir. Düzeltme sonrası hedefli ve son tam koşu başarılıdır. İlk npm registry sertifika erişimi system CA ile çözüldü; TLS doğrulaması kapatılmadı. İlk check'te ImportMeta.env tipi eksikti; vite/client tip referansı eklendi.
Preview kabulü henüz çalıştırılmadı; başarı iddiası yok.
Yeni uzak CI sonucu henüz yok.
Kanıtlar:docs/evidence/live-content/{local,preview}/acceptance.json; preview/remote.json; .live-tests-final.log; header-sign,hero-fold,public-navigation,showroom-stage,vitrine-page kanıtları. 

DEĞİŞEN DOSYALAR
Header ayrı commit:index.html,src/sections/navigation.ts,src/styles/main.css,src/styles/header-sign.css,tests/header-sign.test.mjs.
A/B:package.json/lock,vite.config.ts,public/_headers,scripts/live-snapshot.mjs; src/content/live/{protocol.js,protocol.d.ts,site.js,site.d.ts,checker.ts,guard.ts,patch.ts}; src/main.ts,src/vite-env.d.ts,src/quote/contact.ts; tests/live-snapshot.test.mjs,live-content.test.mjs,helpers/live-content.mjs ve admin-worker.test.mjs cache kabulü; ARCHITECTURE.md,ROADMAP.md,LAST_REPORT.md,docs/LIVE_CONTENT_PLAN.md.
Generated HTML/sitemap,eski test kanıtları,screenshotlar ve yerel araç/log farkları korunur; kaynak commit'ine alınmaz. Hero/showroom model/renderer/controller,admin,Worker/auth/KV/R2/Wrangler/secrets değişmedi.

SINIR / SIRADAKİ TEK İŞ
Gerçek admin production publish ve production canlı kabulü ÇALIŞTIRILMADI. P3.6 fiziksel cihaz kabulü durdurulmuş; USB/ADB/telefon/iPad/GPU testi yapılmadı. Mevcut SVGLoader599.52kB chunk uyarısı sürer. Genel P3/P7/P8/P9 kapanmadı.

Sıradaki tek iş:Aynı feature dalında B kaynak kaydı ve izole Preview kabulünü tamamlamak.
