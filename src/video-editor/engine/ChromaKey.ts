import { ChromaKeyConfig } from '../types';

interface ChromaCacheEntry {
  canvas: HTMLCanvasElement;
  key: string;
}

const chromaCanvasCache = new Map<string, ChromaCacheEntry>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export function applyChromaKey(
  source: HTMLImageElement | HTMLCanvasElement,
  config: ChromaKeyConfig,
  cacheKey?: string
): HTMLCanvasElement {
  const cacheId = cacheKey
    ? `${cacheKey}_${config.keyColor}_${config.similarity}_${config.smoothness}_${config.spill}`
    : null;

  if (cacheId && chromaCanvasCache.has(cacheId)) {
    return chromaCanvasCache.get(cacheId)!.canvas;
  }

  const width = source.width || 500;
  const height = source.height || 500;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) return offscreen;

  ctx.drawImage(source, 0, 0, width, height);

  if (!config.enabled) {
    if (cacheId) chromaCanvasCache.set(cacheId, { canvas: offscreen, key: cacheId });
    return offscreen;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const [kr, kg, kb] = hexToRgb(config.keyColor || '#00ff00');
  const similarity = Math.max(0.01, config.similarity ?? 0.4);
  const smoothness = Math.max(0.001, config.smoothness ?? 0.1);
  const spill = config.spill ?? 0.1;

  // Max color distance = sqrt(255^2 * 3) ≈ 441.67
  const maxDist = 441.67;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const dr = r - kr;
    const dg = g - kg;
    const db = b - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db) / maxDist;

    if (dist < similarity) {
      // Color matches key color inside threshold -> completely transparent
      data[i + 3] = 0;
    } else if (dist < similarity + smoothness) {
      // Edge feathering / smooth falloff
      const factor = (dist - similarity) / smoothness;
      data[i + 3] = Math.round(a * factor);

      // Spill suppression on edges
      if (spill > 0) {
        if (kg > kr && kg > kb) {
          // Green screen spill: reduce green to max of red & blue
          data[i + 1] = Math.min(g, Math.max(r, b));
        } else if (kb > kr && kb > kg) {
          // Blue screen spill: reduce blue
          data[i + 2] = Math.min(b, Math.max(r, g));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (cacheId) {
    // Limit cache size
    if (chromaCanvasCache.size > 50) {
      const firstKey = chromaCanvasCache.keys().next().value;
      if (firstKey) chromaCanvasCache.delete(firstKey);
    }
    chromaCanvasCache.set(cacheId, { canvas: offscreen, key: cacheId });
  }

  return offscreen;
}
