import { Clip, TransitionType } from '../types';

export interface TransitionModifier {
  alphaMultiplier: number;
  offsetX: number;
  offsetY: number;
  scaleMultiplier: number;
  blurAmount: number;
  wipePercent: number; // 0 to 1
}

export function computeTransitionModifier(
  clip: Clip,
  clipRelativeTime: number,
  canvasWidth: number,
  canvasHeight: number
): TransitionModifier {
  const mod: TransitionModifier = {
    alphaMultiplier: 1,
    offsetX: 0,
    offsetY: 0,
    scaleMultiplier: 1,
    blurAmount: 0,
    wipePercent: 1,
  };

  // In-Transition
  if (clip.inTransition && clip.inTransition.type !== 'none' && clip.inTransition.duration > 0) {
    const dur = clip.inTransition.duration;
    if (clipRelativeTime < dur) {
      const p = Math.max(0, Math.min(1, clipRelativeTime / dur));
      applyTransitionEffect(clip.inTransition.type, p, true, mod, canvasWidth, canvasHeight);
    }
  }

  // Out-Transition
  if (clip.outTransition && clip.outTransition.type !== 'none' && clip.outTransition.duration > 0) {
    const dur = clip.outTransition.duration;
    const timeLeft = clip.duration - clipRelativeTime;
    if (timeLeft < dur && timeLeft >= 0) {
      const p = Math.max(0, Math.min(1, timeLeft / dur));
      applyTransitionEffect(clip.outTransition.type, p, false, mod, canvasWidth, canvasHeight);
    }
  }

  return mod;
}

function applyTransitionEffect(
  type: TransitionType,
  progress: number, // 0 = start of in-transition (or end of out), 1 = fully transitioned
  isIn: boolean,
  mod: TransitionModifier,
  canvasWidth: number,
  canvasHeight: number
) {
  switch (type) {
    case 'fade':
    case 'dissolve':
      mod.alphaMultiplier *= progress;
      break;
    case 'slideLeft':
      mod.offsetX += (1 - progress) * (isIn ? canvasWidth * 0.5 : -canvasWidth * 0.5);
      mod.alphaMultiplier *= Math.min(1, progress * 1.5);
      break;
    case 'slideRight':
      mod.offsetX += (1 - progress) * (isIn ? -canvasWidth * 0.5 : canvasWidth * 0.5);
      mod.alphaMultiplier *= Math.min(1, progress * 1.5);
      break;
    case 'slideUp':
      mod.offsetY += (1 - progress) * (isIn ? canvasHeight * 0.5 : -canvasHeight * 0.5);
      mod.alphaMultiplier *= Math.min(1, progress * 1.5);
      break;
    case 'slideDown':
      mod.offsetY += (1 - progress) * (isIn ? -canvasHeight * 0.5 : canvasHeight * 0.5);
      mod.alphaMultiplier *= Math.min(1, progress * 1.5);
      break;
    case 'zoom':
      mod.scaleMultiplier *= 0.5 + progress * 0.5;
      mod.alphaMultiplier *= progress;
      break;
    case 'push':
      mod.offsetX += (1 - progress) * (isIn ? canvasWidth * 0.8 : -canvasWidth * 0.8);
      break;
    case 'wipe':
      mod.wipePercent = progress;
      break;
    case 'blur':
      mod.blurAmount += (1 - progress) * 20;
      mod.alphaMultiplier *= progress;
      break;
    case 'flip3d':
      // 3D Flip scale perspective effect
      mod.scaleMultiplier *= Math.abs(Math.cos((1 - progress) * Math.PI * 0.5));
      mod.alphaMultiplier *= Math.min(1, progress * 1.8);
      break;
    case 'flashWhite':
      mod.alphaMultiplier *= progress;
      mod.blurAmount += (1 - progress) * 10;
      break;
    case 'glitchCut':
      mod.offsetX += (Math.random() - 0.5) * (1 - progress) * 60;
      mod.alphaMultiplier *= progress > 0.3 ? 1 : 0.4;
      break;
    default:
      break;
  }
}
