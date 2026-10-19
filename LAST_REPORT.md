# ZY REKLAM — CI-ONLY POLİTİKA RAPORU

Tarih: 2026-10-19T20:04:39.579Z
Aşama: P8.8/P9, devam ediyor. Mimari v1.28/A28; genel aşamalar ve fiziksel P3.6 açık.
Dal: ci/functional-gpu-policy; .worktrees/ci-functional-policy. HEAD: 756aa4984a04e14adcea1e86dc2c16e612097041
Frozen runtime: 13dfebc6666b7dcfcf880228aab5a93ea928396e. Kullanıcı Matrix hız2 ve Hero opacity0.6 değişikliklerini bilinçli olarak onaylayıp yeni main'i dondurdu. Eski272d843 eşitliği bu açık talimatla değişti. Metin/CSS/CTA sunumu da korunur. Runtime tuning ve PR10 merge yok; yeni runtime kaynağı eklenmedi.

### 2026-10-19 — P8.8/P9 CI-only policy

- User confirmed intentional main runtime edits and froze 13dfebc. Previous 272d843 engine equality is superseded; PR10/runtime tuning remains excluded. Branch ci/functional-gpu-policy was fast-forwarded from current main with all user/generated/evidence files preserved.
- A28: blocking functional suite and separate GPU diagnostics; original assertions/raw failures/artifacts preserved, only verified hardware timing advisory, critical errors remain RED. Whole runtime/build source guard uses frozen13dfebc.
- Prior ed514ad acceptance: blocking61/61, diagnostic5/5, guard4/4; first vitrine60/61 timeout is preserved. Same30s semantic readiness with terminal fallback/one visible canvas/real frames and diagnostics passed targeted3/3 then full61/61. These are historical results, not new13dfebc acceptance.
- Latest inherited main HTML: 756aa49 contains only content/presentation edits; engine/build sources remain13dfebc. The CI-only commit must not change index.html relative to its main parent. Extra HTML acceptance: in progress.
- Frozen motor baseline local acceptance: blocking 61/61; GPU 5/5; policy exit 0. Build/guards and full suite run on the new frozen baseline. No runtime code authored. Matrix test defaults follow speed2 while preserving exact ±2 key deltas and +3.6 two-finger delta.
- Next: complete local acceptance, commit/push, feature Verify GREEN, narrow CI-only PR/PR GREEN, merge, main Verify/two smokes/automatic production and deployed runtime equality. General P3/P7/P8/P9 and stopped physical P3.6 remain open.

Değişen dosyalar: .github/workflows/verify.yml; tests ve yardımcıları; docs/CI_GPU_POLICY.md; ARCHITECTURE.md, ROADMAP.md, LAST_REPORT.md. Generated HTML/sitemap, evidence, screenshot/log ve kullanıcı farkları korunur; kaynak commit'ine alınmaz.

Kabul kapsamı: normal işlevsel tests blocking; GPU/4K stress assertionları ayrı diagnostic grubunda korunur. Yalnız sağlıklı hardware timing advisory; kritik hata/unknown/eksikkanıt FAIL. Kaynak/runtime koruma testi yeni baseline'ı denetler.

Kanıt: docs/evidence/ci-policy ve gpu-diagnostics; son yerel loglar. Eski RED ve ed514ad sonuçları arşivlendi.
Sıradaki tek iş: yeni sabit baseline yerel kabulünden sonra yetkili feature/PR/main/live yayın kapılarını tamamlamak. Final release kabulü henüz verilmedi.
