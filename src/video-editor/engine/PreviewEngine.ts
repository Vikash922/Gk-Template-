import {
  VideoProject,
  Clip,
  TextElement,
  ImageElement,
  SelectionState,
} from '../types';
import { evaluateClipTransforms } from './KeyframeEngine';
import { computeTransitionModifier } from './TransitionEngine';
import {
  buildCanvasFilterString,
  evaluateDynamicEffects,
  renderPostEffects,
} from './EffectEngine';
import { applyChromaKey } from './ChromaKey';

// Image Cache to ensure 60fps rendering without re-fetching
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  let img = imageCache.get(src);
  if (img && img.complete) return img;

  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    imageCache.set(src, img);
  }
  return img.complete ? img : null;
}

export interface PreviewEngineOptions {
  showSafeGuides?: boolean;
  showSelectionHandles?: boolean;
}

export class PreviewEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
  }

  render(
    project: VideoProject,
    currentTime: number,
    selection?: SelectionState,
    options: PreviewEngineOptions = { showSafeGuides: true, showSelectionHandles: true }
  ) {
    const { width, height } = project;
    const ctx = this.ctx;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. Draw Project Background
    ctx.fillStyle = project.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (project.backgroundImage) {
      const bgImg = getCachedImage(project.backgroundImage);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      }
    }

    // Collect active dynamic effects across active clips
    const allActiveEffects: any[] = [];

    // 2. Sort tracks and draw clips
    const sortedTracks = [...project.tracks].sort((a, b) => a.order - b.order);

    for (const track of sortedTracks) {
      if (track.hidden) continue;

      for (const clip of track.clips) {
        if (currentTime < clip.startTime || currentTime >= clip.startTime + clip.duration) {
          continue;
        }

        const clipRelativeTime = currentTime - clip.startTime;

        // Keyframe transforms
        const transforms = evaluateClipTransforms(clip, clipRelativeTime);

        // Transition modifiers
        const transMod = computeTransitionModifier(clip, clipRelativeTime, width, height);

        const finalX = transforms.x + transMod.offsetX;
        const finalY = transforms.y + transMod.offsetY;
        const finalScale = transforms.scale * transMod.scaleMultiplier;
        const finalAlpha = Math.max(0, Math.min(1, transforms.opacity * transMod.alphaMultiplier));

        if (finalAlpha <= 0.001) continue;

        // Accumulate effects
        if (clip.effects && clip.effects.length > 0) {
          allActiveEffects.push(...clip.effects);
        }

        ctx.save();
        ctx.globalAlpha = finalAlpha;

        // Apply filters
        const filterStr = buildCanvasFilterString(clip.effects);
        if (filterStr !== 'none') {
          ctx.filter = filterStr;
        }

        // Apply transform origin: center of clip
        ctx.translate(finalX, finalY);
        if (transforms.rotation !== 0) {
          ctx.rotate((transforms.rotation * Math.PI) / 180);
        }
        if (finalScale !== 1) {
          ctx.scale(finalScale, finalScale);
        }

        // Wipe transition clip
        if (transMod.wipePercent < 0.999) {
          ctx.beginPath();
          ctx.rect(
            -clip.width / 2,
            -clip.height / 2,
            clip.width * transMod.wipePercent,
            clip.height
          );
          ctx.clip();
        }

        // Render clip content
        if (clip.type === 'text' && clip.text) {
          this.renderTextClip(ctx, clip, clipRelativeTime, currentTime);
        } else if ((clip.type === 'image' || clip.type === 'sticker') && clip.image) {
          this.renderImageClip(ctx, clip);
        } else if (clip.gkRole === 'timer') {
          this.renderTimerClip(ctx, clip, clipRelativeTime);
        }

        ctx.restore();
      }
    }

    // 3. Post Effects (Shake, Flash, Glitch, Vignette)
    if (allActiveEffects.length > 0) {
      const postMods = evaluateDynamicEffects(allActiveEffects, currentTime);
      renderPostEffects(ctx, width, height, postMods);
    }

    // 4. Safe Area Guides (9:16 Shorts/Reels bounds)
    if (options.showSafeGuides && project.aspectRatio === '9:16') {
      this.renderSafeGuides(ctx, width, height);
    }

    // 5. Selection Bounding Box & Handles
    if (options.showSelectionHandles && selection?.clipId) {
      this.renderSelectionOutline(ctx, project, selection.clipId, currentTime);
    }
  }

  private renderTextClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    clipRelativeTime: number,
    currentTime: number = 0
  ) {
    const text = clip.text!;
    let content = text.content || '';

    // In-animation
    let animScale = 1;
    let animAlpha = 1;
    let animOffsetY = 0;
    const animDur = text.animationDuration || 0.45;

    if (text.inAnimation && clipRelativeTime < animDur) {
      const p = clipRelativeTime / animDur;
      switch (text.inAnimation) {
        case 'typewriter': {
          const charCount = Math.floor(content.length * p);
          content = content.substring(0, charCount);
          if (p < 0.98) content += '▏';
          break;
        }
        case 'pop':
        case 'zoom':
          animScale = 0.2 + p * 0.8;
          animAlpha = p;
          break;
        case 'slide':
          animOffsetY = (1 - p) * 60;
          animAlpha = p;
          break;
        case 'bounce': {
          const bounce = Math.sin(p * Math.PI * 1.5) * (1 - p);
          animScale = 1 + bounce * 0.4;
          break;
        }
        case 'fade':
          animAlpha = p;
          break;
        case 'flip':
          animScale = Math.abs(Math.cos(p * Math.PI * 2));
          animAlpha = p;
          break;
        case 'shake':
          animOffsetY = (Math.random() - 0.5) * 12;
          break;
        default:
          break;
      }
    }

    ctx.save();
    ctx.globalAlpha *= animAlpha;
    if (animScale !== 1) ctx.scale(animScale, animScale);
    if (animOffsetY !== 0) ctx.translate(0, animOffsetY);

    if (text.inAnimation === 'glowPulse') {
      const pulse = (Math.sin(clipRelativeTime * 6) + 1) * 8;
      ctx.shadowColor = text.color || '#38bdf8';
      ctx.shadowBlur = (text.shadowBlur || 10) + pulse;
    }

    // Font setting
    const weight = text.fontWeight || '700';
    const size = text.fontSize || 54;
    const family = text.fontFamily || 'Noto Sans Devanagari, sans-serif';
    ctx.font = `${weight} ${size}px "${family}", sans-serif`;
    ctx.textAlign = text.alignment || 'center';
    ctx.textBaseline = 'middle';

    const lines = content.split('\n');
    const lineHeight = size * (text.lineSpacing || 1.3);
    const totalHeight = lines.length * lineHeight;

    // Draw background box if present or if answer highlight
    const isAnswer =
      Boolean(clip.isAnswerHighlight) ||
      Boolean(
        clip.isCorrectOption &&
        clip.revealStart !== undefined &&
        currentTime >= clip.revealStart
      );

    const isDashed =
      Boolean(clip.activeDashed) ||
      Boolean(
        clip.dashedActiveStart !== undefined &&
        clip.dashedActiveEnd !== undefined &&
        currentTime >= clip.dashedActiveStart &&
        currentTime < clip.dashedActiveEnd
      );

    const hasBg = text.backgroundColor || isAnswer;

    if (hasBg) {
      const pad = text.backgroundPadding || 20;
      const radius = text.backgroundRadius || 16;
      let maxLineWidth = 0;
      lines.forEach((l) => {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(l).width);
      });

      const boxW = Math.max(clip.width, maxLineWidth + pad * 2);
      const boxH = Math.max(clip.height, totalHeight + pad * 2);

      ctx.beginPath();
      const r = Math.min(radius, boxW / 2, boxH / 2);
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, r);
      ctx.fillStyle = isAnswer ? '#059669' : text.backgroundColor!;
      ctx.fill();

      if (isAnswer) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      // Red dashed border highlight (Reference video style: A, B, C, D sequential highlight)
      if (isDashed && !isAnswer) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.setLineDash([16, 8]);
        ctx.strokeRect(-boxW / 2 - 4, -boxH / 2 - 4, boxW + 8, boxH + 8);
        ctx.restore();
      }
    }

    // Shadow
    if (text.shadowColor) {
      ctx.shadowColor = text.shadowColor;
      ctx.shadowBlur = text.shadowBlur || 12;
      ctx.shadowOffsetX = text.shadowOffsetX || 0;
      ctx.shadowOffsetY = text.shadowOffsetY || 4;
    }

    // Fill & Stroke text
    const startY = -totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight;

      // Stroke
      if (text.strokeColor && (text.strokeWidth ?? 0) > 0) {
        ctx.lineWidth = text.strokeWidth!;
        ctx.strokeStyle = text.strokeColor;
        ctx.strokeText(line, 0, y);
      }

      // Fill / Gradient
      if (text.gradient && text.gradient.length >= 2) {
        const textWidth = ctx.measureText(line).width || 300;
        const grad = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
        text.gradient.forEach((color, i) => {
          grad.addColorStop(i / (text.gradient!.length - 1), color);
        });
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = text.color || '#ffffff';
      }

      ctx.fillText(line, 0, y);
    });

    ctx.restore();
  }

  private renderImageClip(ctx: CanvasRenderingContext2D, clip: Clip) {
    const imgData = clip.image!;
    if (!imgData.src) return;

    const img = getCachedImage(imgData.src);
    if (!img) return;

    const w = clip.width;
    const h = clip.height;

    ctx.save();

    // Mask
    if (imgData.mask === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (imgData.mask === 'rounded' || (imgData.borderRadius ?? 0) > 0) {
      const rad = imgData.borderRadius || 24;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, rad);
      ctx.clip();
    }

    // Shadow
    if (imgData.shadowColor) {
      ctx.shadowColor = imgData.shadowColor;
      ctx.shadowBlur = imgData.shadowBlur || 14;
    }

    // Blend Mode
    if (imgData.blendMode) {
      ctx.globalCompositeOperation = imgData.blendMode as GlobalCompositeOperation;
    }

    // Chroma Key support
    let renderSource: CanvasImageSource = img;
    if (imgData.chromaKey?.enabled) {
      renderSource = applyChromaKey(img, imgData.chromaKey, imgData.src);
    }

    // Compute aspect-ratio preserved rendering (prevents image distortion / weird stretching)
    const naturalW = (img as HTMLImageElement).naturalWidth || (renderSource as any).width || w;
    const naturalH = (img as HTMLImageElement).naturalHeight || (renderSource as any).height || h;
    const imgAspect = naturalW / (naturalH || 1);
    const boxAspect = w / (h || 1);

    let renderW = w;
    let renderH = h;
    if (imgData.fit === 'cover') {
      if (imgAspect > boxAspect) {
        renderW = h * imgAspect;
      } else {
        renderH = w / imgAspect;
      }
    } else if (imgData.fit === 'fill') {
      renderW = w;
      renderH = h;
    } else {
      // Default: contain (maintain pristine aspect ratio without distortion)
      if (imgAspect > boxAspect) {
        renderH = w / imgAspect;
      } else {
        renderW = h * imgAspect;
      }
    }

    ctx.drawImage(renderSource, -renderW / 2, -renderH / 2, renderW, renderH);

    // Border
    if (imgData.borderColor && (imgData.borderWidth ?? 0) > 0) {
      ctx.lineWidth = imgData.borderWidth!;
      ctx.strokeStyle = imgData.borderColor;
      if (imgData.mask === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, imgData.borderRadius || 0);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderTimerClip(ctx: CanvasRenderingContext2D, clip: Clip, clipRelativeTime: number) {
    const totalSec = Math.max(1, Math.round(clip.duration));
    const elapsed = Math.min(totalSec, Math.floor(clipRelativeTime));
    const remaining = Math.max(0, totalSec - elapsed);

    const radius = Math.min(clip.width, clip.height) / 2;

    ctx.save();
    // Inner white disc
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const ringThickness = 16;
    const outerR = radius - ringThickness / 2;

    // Left Arc: BLUE
    ctx.beginPath();
    ctx.arc(0, 0, outerR, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.lineWidth = ringThickness;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();

    // Right Arc: RED
    ctx.beginPath();
    ctx.arc(0, 0, outerR, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = ringThickness;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // Center digit or "TIME OUT"
    if (remaining > 0) {
      ctx.fillStyle = '#78350f';
      ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(remaining.toString(), 0, 4);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.font = `900 ${Math.round(radius * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TIME', 0, -radius * 0.2);
      ctx.fillText('OUT', 0, radius * 0.25);
    }

    ctx.restore();
  }

  private renderSafeGuides(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);

    // Top safe area (avoid status bar/notches)
    ctx.strokeRect(60, 140, width - 120, height - 380);

    // Center crosshair
    const cx = width / 2;
    const cy = height / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    ctx.restore();
  }

  private renderSelectionOutline(
    ctx: CanvasRenderingContext2D,
    project: VideoProject,
    selectedClipId: string,
    currentTime: number
  ) {
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip && currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
        const relTime = currentTime - clip.startTime;
        const transforms = evaluateClipTransforms(clip, relTime);

        ctx.save();
        ctx.translate(transforms.x, transforms.y);
        ctx.rotate((transforms.rotation * Math.PI) / 180);
        ctx.scale(transforms.scale, transforms.scale);

        const pad = 8;
        const w = clip.width + pad * 2;
        const h = clip.height + pad * 2;

        // Selection Box
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // 4 Corner Handles
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2;

        const handleSize = 14;
        const corners = [
          [-w / 2, -h / 2],
          [w / 2, -h / 2],
          [-w / 2, h / 2],
          [w / 2, h / 2],
        ];

        corners.forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Rotation Handle at Top Center
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, -h / 2 - 24);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -h / 2 - 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        break;
      }
    }
  }
}
