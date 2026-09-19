import { EffectConfig } from '../types';

export interface PostEffectModifiers {
  shakeOffsetX: number;
  shakeOffsetY: number;
  flashAlpha: number;
  glitchActive: boolean;
  rgbSplitOffset: number;
  vignetteActive: boolean;
  vignetteIntensity: number;
  zoomScale: number;
}

export function buildCanvasFilterString(effects: EffectConfig[]): string {
  if (!effects || effects.length === 0) return 'none';

  const filters: string[] = [];

  for (const eff of effects) {
    const val = Math.max(0, Math.min(1, eff.intensity));
    switch (eff.type) {
      case 'blur':
        filters.push(`blur(${val * 24}px)`);
        break;
      case 'brightness':
        // 0..1 maps to 50%..200%
        filters.push(`brightness(${Math.round(50 + val * 150)}%)`);
        break;
      case 'contrast':
        filters.push(`contrast(${Math.round(60 + val * 140)}%)`);
        break;
      case 'saturation':
        filters.push(`saturate(${Math.round(val * 250)}%)`);
        break;
      case 'grayscale':
        filters.push(`grayscale(${Math.round(val * 100)}%)`);
        break;
      default:
        break;
    }
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

export function evaluateDynamicEffects(
  effects: EffectConfig[],
  currentTime: number
): PostEffectModifiers {
  const result: PostEffectModifiers = {
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    flashAlpha: 0,
    glitchActive: false,
    rgbSplitOffset: 0,
    vignetteActive: false,
    vignetteIntensity: 0,
    zoomScale: 1,
  };

  if (!effects) return result;

  for (const eff of effects) {
    const val = eff.intensity;
    switch (eff.type) {
      case 'shake': {
        const freq = 18;
        const sX = Math.sin(currentTime * freq * 1.3) * val * 16;
        const sY = Math.cos(currentTime * freq) * val * 14;
        result.shakeOffsetX += sX;
        result.shakeOffsetY += sY;
        break;
      }
      case 'flash': {
        // Periodic flash beat
        const beat = Math.abs(Math.sin(currentTime * 4));
        if (beat > 0.82) {
          result.flashAlpha = Math.max(result.flashAlpha, (beat - 0.82) * 4 * val);
        }
        break;
      }
      case 'glitch': {
        // Occasional glitch twitch
        const glitchCycle = Math.sin(currentTime * 9.7);
        if (glitchCycle > 0.85) {
          result.glitchActive = true;
          result.shakeOffsetX += (Math.random() - 0.5) * val * 25;
        }
        break;
      }
      case 'rgbSplit': {
        result.rgbSplitOffset = val * 12;
        break;
      }
      case 'vignette': {
        result.vignetteActive = true;
        result.vignetteIntensity = Math.max(result.vignetteIntensity, val);
        break;
      }
      case 'zoom': {
        result.zoomScale *= 1 + val * 0.35;
        break;
      }
      default:
        break;
    }
  }

  return result;
}

export function renderPostEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  modifiers: PostEffectModifiers
) {
  // 1. Flash Overlay
  if (modifiers.flashAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, modifiers.flashAlpha)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 2. Vignette Radial Gradient
  if (modifiers.vignetteActive && modifiers.vignetteIntensity > 0) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${modifiers.vignetteIntensity * 0.85})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Glitch Slices
  if (modifiers.glitchActive) {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
    const sliceY = (Math.random() * height * 0.8);
    const sliceH = 20 + Math.random() * 40;
    ctx.fillRect(0, sliceY, width, sliceH);
    ctx.restore();
  }
}
