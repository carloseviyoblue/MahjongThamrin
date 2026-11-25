import { ALL_TILES, FLOWER_CODES, SEASON_CODES } from "./tiles";

export type LocalScanResult = {
  tiles: string[];
  flowers: string[];
  confidence: number;
  message: string;
};

type Box = { x: number; y: number; w: number; h: number; score: number; code: string; conf: number };

const TEMPLATE_W = 40;
const TEMPLATE_H = 56;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawToData(img: CanvasImageSource, width: number, height: number, w: number, h: number, x = 0, y = 0): Float32Array {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, x, y, width, height, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const a = new Float32Array(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) a[j] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  const stdev = Math.sqrt(a.reduce((s, v) => s + (v - mean) * (v - mean), 0) / a.length) || 1;
  for (let i = 0; i < a.length; i++) a[i] = (a[i] - mean) / stdev;
  return a;
}

function corr(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s / a.length; // both normalized to stddev 1
}

async function templates() {
  const out = new Map<string, Float32Array>();
  for (const code of ALL_TILES) {
    const img = await loadImage(`/tiles/${code}.svg`);
    // Crop away the back edge by keeping the face's center ratio like tiles.
    const innerW = Math.round(img.width * 0.84);
    const innerH = Math.round(img.height * 0.82);
    const innerX = Math.round(img.width * 0.08);
    const innerY = Math.round(img.height * 0.05);
    out.set(code, drawToData(img, innerW, innerH, TEMPLATE_W, TEMPLATE_H, innerX, innerY));
  }
  return out;
}

function detectBoxes(dataUrl: string): Promise<Box[]> {
  return (async () => {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const w = Math.max(240, Math.round(img.width * scale));
    const h = Math.max(240, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const src = ctx.getImageData(0, 0, w, h).data;

    const luma = new Uint8Array(w * h);
    let sum = 0;
    for (let i = 0, j = 0; j < luma.length; i += 4, j++) {
      const p = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
      luma[j] = p;
      sum += p;
    }
    const mean = sum / luma.length;

    // Bright tile faces pop from felt/background.
    const mask = new Uint8Array(w * h);
    const minL = Math.max(96, mean + 38);
    let on = 0;
    for (let i = 0; i < luma.length; i++) if (luma[i] >= minL) { mask[i] = 1; on++; }
    if (on < luma.length * 0.002) return [];

    // Remove tiny noise and connect tile faces; template matching fills details.
    const boxW = Math.max(6, Math.floor(w / 100));
    const boxH = Math.max(8, Math.floor(h / 100));
    const visited = new Uint8Array(w * h);
    const boxes: Box[] = [];
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        const i0 = sy * w + sx;
        if (!mask[i0] || visited[i0]) continue;
        let qi = 0, qh = 1;
        qx[0] = sx;
        qy[0] = sy;
        visited[i0] = 1;
        let minX = sx, maxX = sx, minY = sy, maxY = sy, area = 0;
        while (qi < qh) {
          const x = qx[qi], y = qy[qi++];
          area++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            if (!mask[ni] || visited[ni]) continue;
            visited[ni] = 1;
            qx[qh] = nx; qy[qh] = ny; qh++;
          }
        }
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const ratio = bw / bh;
        // Mahjong tile face is roughly portrait; avoid hairlines and huge background masks.
        if (area < boxW * boxH) continue;
        if (ratio < 0.42 || ratio > 0.92) continue;
        if (bw > w * 0.35 || bh > h * 0.35) continue;
        boxes.push({ x: minX, y: minY, w: bw, h: bh, score: area, code: "", conf: 0 });
      }
    }

    // Sort into table-like rows: top line first, then left-to-right in each row.
    boxes.sort((a, b) => (Math.abs(a.y - b.y) > Math.max(a.h, b.h) * 0.55 ? a.y - b.y : a.x - b.x));
    return boxes;
  })();
}

async function bestTile(crop: ImageData, refs: Map<string, Float32Array>): Promise<[string, number]> {
  const candidate = drawToImageData(crop, TEMPLATE_W, TEMPLATE_H);
  let best = -1;
  let code = "";
  for (const [c, ref] of refs) {
    const score = corr(candidate.norm, ref);
    if (score > best) {
      best = score;
      code = c;
    }
  }
  return [code, best];
}

function drawToImageData(src: ImageData, w: number, h: number): { norm: Float32Array } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const tmp = document.createElement("canvas");
  tmp.width = src.width;
  tmp.height = src.height;
  tmp.getContext("2d")!.putImageData(src, 0, 0);
  ctx.drawImage(tmp, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) out[j] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  const st = Math.sqrt(out.reduce((a, b) => a + (b - mean) * (b - mean), 0) / out.length) || 1;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - mean) / st;
  return { norm: out };
}

/**
 * Pure-local photo scan. It does not upload the image or call a network service.
 * Built specifically for HK tile faces already available under /public/tiles.
 */
export async function recognizeHandLocal(dataUrl: string): Promise<LocalScanResult> {
  const [refs, boxes] = await Promise.all([templates(), detectBoxes(dataUrl)]);
  if (!boxes.length) {
    return { tiles: [], flowers: [], confidence: 0, message: "Ubin tidak terdeteksi. Ambil foto lebih tegak, terang, dan rapat." };
  }

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const scaleBack = 1 / scale;
  const base = document.createElement("canvas");
  base.width = img.width;
  base.height = img.height;
  const ctx = base.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const found: { code: string; conf: number }[] = [];
  for (const b of boxes.slice(0, 20)) {
    const pad = Math.round(Math.min(b.w, b.h) * 0.04);
    const x = Math.max(0, Math.round((b.x + pad) * scaleBack));
    const y = Math.max(0, Math.round((b.y + pad * 4) * scaleBack));
    const w = Math.min(img.width - x, Math.round((b.w - pad * 2) * scaleBack));
    const h = Math.min(img.height - y, Math.round((b.h - pad * 2) * scaleBack));
    if (w <= 8 || h <= 10) continue;
    const crop = ctx.getImageData(x, y, w, h);
    const [code, conf] = await bestTile(crop, refs);
    if (conf > 0.16) found.push({ code, conf });
  }

  if (!found.length) {
    return { tiles: [], flowers: [], confidence: 0, message: "Ubin tertangkap tetapi masih sulit dikenali. Ambil foto lebih dekat dan terang." };
  }

  // Keep only the strongest scores; a real hand has at most 18 physical tiles.
  const tiles = found.map((f) => f.code);
  const flowers: string[] = [];
  const sorted: string[] = [];
  for (const code of tiles) {
    if (FLOWER_CODES.includes(code) || SEASON_CODES.includes(code)) flowers.push(code);
    else sorted.push(code);
    if (sorted.length + flowers.length >= 18) break;
  }
  const meanConf = found.reduce((a, b) => a + b.conf, 0) / found.length;
  return {
    tiles: sorted,
    flowers: [...new Set(flowers)],
    confidence: meanConf,
    message: `Terbaca ${found.length} ubin secara lokal (akurasi ${Math.round(meanConf * 100)}%). Periksa sebelum disimpan.`,
  };
}
