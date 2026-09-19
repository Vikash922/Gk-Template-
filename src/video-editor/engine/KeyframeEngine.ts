import { Clip, Keyframe, KeyframeProperty } from '../types';

export function easeProgress(t: number, easing?: Keyframe['easing']): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'easeIn':
      return clamped * clamped;
    case 'easeOut':
      return clamped * (2 - clamped);
    case 'easeInOut':
      return clamped < 0.5 ? 2 * clamped * clamped : -1 + (4 - 2 * clamped) * clamped;
    case 'linear':
    default:
      return clamped;
  }
}

export function evaluateProperty(
  keyframes: Keyframe[],
  property: KeyframeProperty,
  clipRelativeTime: number,
  defaultValue: number
): number {
  if (!keyframes || keyframes.length === 0) return defaultValue;

  const propFrames = keyframes
    .filter((k) => k.property === property)
    .sort((a, b) => a.time - b.time);

  if (propFrames.length === 0) return defaultValue;
  if (clipRelativeTime <= propFrames[0].time) return propFrames[0].value;
  if (clipRelativeTime >= propFrames[propFrames.length - 1].time) {
    return propFrames[propFrames.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < propFrames.length - 1; i++) {
    const k1 = propFrames[i];
    const k2 = propFrames[i + 1];
    if (clipRelativeTime >= k1.time && clipRelativeTime <= k2.time) {
      const span = k2.time - k1.time;
      if (span <= 0.0001) return k1.value;
      const progress = (clipRelativeTime - k1.time) / span;
      const eased = easeProgress(progress, k2.easing || k1.easing);
      return k1.value + (k2.value - k1.value) * eased;
    }
  }

  return defaultValue;
}

export function evaluateClipTransforms(
  clip: Clip,
  clipRelativeTime: number
): {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  volume: number;
} {
  const x = evaluateProperty(clip.keyframes, 'x', clipRelativeTime, clip.x);
  const y = evaluateProperty(clip.keyframes, 'y', clipRelativeTime, clip.y);
  const scale = evaluateProperty(clip.keyframes, 'scale', clipRelativeTime, clip.scale);
  const rotation = evaluateProperty(clip.keyframes, 'rotation', clipRelativeTime, clip.rotation);
  const opacity = evaluateProperty(clip.keyframes, 'opacity', clipRelativeTime, clip.opacity);
  const blur = evaluateProperty(clip.keyframes, 'blur', clipRelativeTime, clip.blur ?? 0);
  const volume = evaluateProperty(
    clip.keyframes,
    'volume',
    clipRelativeTime,
    clip.audio?.volume ?? 1
  );

  return { x, y, scale, rotation, opacity, blur, volume };
}

export function addOrUpdateKeyframe(
  clip: Clip,
  property: KeyframeProperty,
  time: number,
  value: number,
  easing: Keyframe['easing'] = 'easeInOut'
): Clip {
  const existingIdx = clip.keyframes.findIndex(
    (k) => k.property === property && Math.abs(k.time - time) < 0.05
  );

  let newFrames: Keyframe[];
  if (existingIdx >= 0) {
    newFrames = [...clip.keyframes];
    newFrames[existingIdx] = {
      ...newFrames[existingIdx],
      value,
      easing,
    };
  } else {
    const newK: Keyframe = {
      id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time,
      property,
      value,
      easing,
    };
    newFrames = [...clip.keyframes, newK].sort((a, b) => a.time - b.time);
  }

  return { ...clip, keyframes: newFrames };
}

export function removeKeyframe(clip: Clip, keyframeId: string): Clip {
  return {
    ...clip,
    keyframes: clip.keyframes.filter((k) => k.id !== keyframeId),
  };
}
