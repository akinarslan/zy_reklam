# CI policy: functional gates and GPU diagnostics

Production runtime baseline: `13dfebc6666b7dcfcf880228aab5a93ea928396e`.
Intentional main HTML edits 1151f75 (CTA removal) and 76a4b7d (redundant caption removal) are preserved; the current main HTML blob is guarded separately. Contact tests use the existing header/WhatsApp links. PR #10 is excluded. No Matrix/Hero tuning from that branch is carried here.

`npm test` is the blocking suite. It requires actual WebGL and keeps mouse,
native touch, keyboard, front/back rotation, rear hardware, canvas/context
identity, reduced motion, context loss/fallback, lifecycle/BFCache and normal
functional assertions. All eleven responsive widths, including 3840, retain
real-WebGL initial geometry bounds, layout and overflow assertions. Animated
front/back/front sweeps run at the eight normal widths through 1920; the
original eleven-width sweeps and all original PNG captures remain in the stress
group. No application animation, geometry or quality threshold is changed.
Legacy first-fold and responsive Home PNG captures at 2560/3440/3840 are also
retained in the diagnostic group. Their layout/overflow assertions still run
at every original width in the blocking group. Static reduced-motion navigation
and admin screenshots are ordinary UI evidence, not animated GPU stress.

`node tests/run-gpu-diagnostics.mjs` runs the separate GPU group, including the
original full-resolution Hero/Matrix PNG captures, high-resolution idle waits,
two emulated FPS profiles and the three-sample physical-measurement tool test.
Their assertions and 20/30/45-second limits remain. Diagnostics use the original
GPU/compositor profile. This is not a physical-device acceptance report.

The `gpu-diagnostics` job runs independently from `verify`, also supports manual
and weekly scheduled execution, and always uploads a separate artifact. It does
not use blanket `continue-on-error`. The child tests still fail assertions and
their original exit code, TAP and per-test results are preserved. Only these
identified failures may produce an advisory warning:

- A timeout during a 2560+ Hero idle or PNG readback operation, or a timed-out
  hardware measurement, with an independently inspected healthy WebGL scene.
- The scene must still be ready with one non-lost WebGL canvas, stable identity,
  no overflow and no observed page/console/network/crash error.

Assertion failures, incorrect angles/bounds, context loss, missing/replaced
canvas, crashes, pageerrors, navigation failures, unknown errors, missing
evidence and runner aborts remain failures. These make the GPU job and the
overall Verify workflow RED. A timing warning never means performance PASS.
`live-smoke` still depends on the blocking `verify` job.

`tests/runtime-freeze.test.mjs` enforces unchanged committed runtime, assets,
build inputs and configuration against approved main 13dfebc, plus unchanged working
runtime sources. A future intentional runtime task must explicitly revise this
release guard and its baseline. This CI-only task cannot silently tune runtime.

The runtime source tree and deployed Hero/Matrix chunks are compared again after
merge. Deployment revision metadata may change; runtime behavior must remain the
baseline behavior. No real admin publish is part of this task.

Approved runtime baseline: 13dfebc6666b7dcfcf880228aab5a93ea928396e. The user confirmed CTA/caption/hint removals and CSS line removals are intentional. This CI-only release preserves all runtime/build inputs from that main. The user explicitly approved the Matrix speed 2 and rear plate opacity 0.6 changes and froze this new main. Exact 272d843 equality is superseded. PR #10 remains excluded.

Later main HTML content edits are inherited and preserved. The guard checks that the CI-only commit/merge does not change index.html relative to its main parent; src/Worker/build/config/assets remain frozen at13dfebc. PR file readback separately rejects application/HTML changes. The local full61 run covers the frozen engine; targeted browser/fold/navigation/static-content checks cover subsequent main HTML edits, and feature/PR/main CI run the full suite on their exact commits.
