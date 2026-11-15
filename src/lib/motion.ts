










export interface MotionOptions {

  enterThreshold?: number;

  settleThreshold?: number;

  settleTicks?: number;

  cooldownMs?: number;

  fps?: number;
}

const W = 32;
const H = 24;

export class MotionWatcher {
  private raf = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private prev: Float32Array | null = null;
  private armed = false;
  private calm = 0;
  private cooling = false;
  private running = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
  }

  start(video: HTMLVideoElement, onPresent: () => void, opts: MotionOptions = {}) {
    const enter = opts.enterThreshold ?? 0.06;
    const settle = opts.settleThreshold ?? 0.025;
    const settleTicks = opts.settleTicks ?? 3;
    const cooldownMs = opts.cooldownMs ?? 4000;
    const interval = 1000 / (opts.fps ?? 6);
    this.running = true;

    const tick = () => {
      if (!this.running) return;
      const diff = this.sample(video);
      if (diff !== null && !this.cooling) {
        if (diff > enter) {
          this.armed = true;
          this.calm = 0;
        } else if (this.armed && diff < settle) {
          this.calm += 1;
          if (this.calm >= settleTicks) {
            this.armed = false;
            this.calm = 0;
            this.cooling = true;
            setTimeout(() => (this.cooling = false), cooldownMs);
            try {
              onPresent();
            } catch {

            }
          }
        }
      }
      this.timer = setTimeout(() => {
        this.raf = requestAnimationFrame(tick);
      }, interval);
    };
    this.raf = requestAnimationFrame(tick);
  }


  private sample(video: HTMLVideoElement): number | null {
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    try {
      this.ctx.drawImage(video, 0, 0, W, H);
    } catch {
      return null;
    }
    const { data } = this.ctx.getImageData(0, 0, W, H);
    const gray = new Float32Array(W * H);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    }
    if (!this.prev) {
      this.prev = gray;
      return null;
    }
    let sum = 0;
    for (let i = 0; i < gray.length; i++) sum += Math.abs(gray[i] - this.prev[i]);
    this.prev = gray;
    return sum / gray.length;
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    this.prev = null;
    this.armed = false;
    this.calm = 0;
    this.cooling = false;
  }
}


export function grabFrame(video: HTMLVideoElement, maxEdge = 640, quality = 0.7): string | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null;
  const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
