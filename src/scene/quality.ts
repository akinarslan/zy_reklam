export type Quality = 'high' | 'low';

/** Sustained slow animation degrades once, then returns to the static poster. */
export class QualityMonitor {
  private start = 0;
  private frames = 0;
  private slowWindows = 0;
  private last = 0;
  quality: Quality = 'high';
  reset(): void { this.start = 0; this.frames = 0; this.slowWindows = 0; this.last = 0; }
  sample(now: number): 'lower' | 'poster' | null {
    if (this.last && now - this.last > 500) this.reset(); // Hidden tabs must not look like slow GPUs.
    this.last = now;
    if (!this.start) this.start = now;
    this.frames++;
    if (now - this.start < 2000) return null;
    const fps = this.frames * 1000 / (now - this.start);
    this.start = now;
    this.frames = 0;
    this.slowWindows = fps < 24 ? this.slowWindows + 1 : 0;
    if (this.slowWindows < 2) return null;
    this.slowWindows = 0;
    if (this.quality === 'high') { this.quality = 'low'; return 'lower'; }
    return 'poster';
  }
}
