export interface MatrixStats {
  mode: string; seed: string; palette: string; density: number; speed: number;
  cameraX: number; cameraY: number; focal: number; quality: number; baseQuality: number; foregroundBudget: boolean; frameMs: number;
  workMs: number; dpr: number; bloom: boolean; p3: boolean; kana: boolean;
  fingerprint: string; glyphs: string; messageStrands: number;
  glyphCount: number; glowCount: number; width: number; height: number; monoSize: number; monoSqueeze: number;
}
export interface MatrixRenderer {
  draw(time: number): void; resize(): void; steer(x: number, y: number): void;
  leave(): void; speed(value: number): void; resetClock(): void;
  stats(): MatrixStats; destroy(): void;
}
export function createRenderer(host: HTMLElement, canvas: HTMLCanvasElement, bloom: HTMLCanvasElement,
  fx: HTMLElement, options: URLSearchParams, reduced: boolean, foregroundActive?: () => boolean): MatrixRenderer;
