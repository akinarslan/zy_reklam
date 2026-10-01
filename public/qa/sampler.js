/** QA only: measures renderer counters, never claims presented GPU frames. */
export function measureScene(stage, durationMs, signal) {
  const win = stage.ownerDocument.defaultView;
  const canvas = stage.querySelector('canvas');
  if (!canvas) return Promise.reject(new Error('Sahne çizim alanı bulunamadı.'));
  return new Promise((resolve, reject) => {
    let raf = 0;
    const start = win.performance.now();
    const initialFrames = Number(stage.dataset.renderCount);
    const initialShadows = Number(stage.dataset.shadowCount || 0);
    let windowStart = start, windowFrames = initialFrames;
    const windows = [], qualityTransitions = [];
    let lastQuality;
    const cleanup = () => {
      win.cancelAnimationFrame(raf);
      signal.removeEventListener('abort', aborted);
      // Restore the production mouse-leave behavior; do not leave a perpetual loop.
      canvas.dispatchEvent(new win.PointerEvent('pointerleave', { pointerType: 'mouse' }));
    };
    const aborted = () => { cleanup(); reject(signal.reason || new Error('Ölçüm durduruldu.')); };
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) { aborted(); return; }
    const tick = now => {
      if (stage.dataset.sceneState !== 'ready' || !canvas.isConnected) {
        cleanup(); reject(new Error(`Sahne ölçüm sırasında ${stage.dataset.sceneState} durumuna geçti (${stage.dataset.sceneReason || 'neden belirtilmedi'}).`)); return;
      }
      const elapsed = now - start;
      const frames = Number(stage.dataset.renderCount);
      if (stage.dataset.quality !== lastQuality) {
        lastQuality = stage.dataset.quality;
        qualityTransitions.push({ elapsedMs: elapsed, quality: lastQuality });
      }
      if (now - windowStart >= 1000 || elapsed >= durationMs) {
        const ms = now - windowStart;
        windows.push({ elapsedMs: elapsed, durationMs: ms, frames: frames - windowFrames, fps: (frames - windowFrames) * 1000 / ms, quality: lastQuality });
        windowStart = now; windowFrames = frames;
      }
      if (elapsed >= durationMs) {
        cleanup();
        resolve({ elapsedMs: elapsed, renderedFrames: frames - initialFrames, shadowUpdates: Number(stage.dataset.shadowCount || 0) - initialShadows, averageFPS: (frames - initialFrames) * 1000 / elapsed, windows, qualityTransitions, finalState: stage.dataset.sceneState });
        return;
      }
      const bounds = stage.getBoundingClientRect();
      canvas.dispatchEvent(new win.PointerEvent('pointermove', {
        pointerType: 'mouse', isPrimary: true,
        clientX: bounds.x + bounds.width * (.5 + .4 * Math.sin(elapsed / 180)),
        clientY: bounds.y + bounds.height / 2,
      }));
      raf = win.requestAnimationFrame(tick);
    };
    raf = win.requestAnimationFrame(tick);
  });
}
