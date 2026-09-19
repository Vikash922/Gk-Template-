export type TrackType =
  | 'video'
  | 'text'
  | 'image'
  | 'sticker'
  | 'audio'
  | 'voiceover'
  | 'captions'
  | 'effects';

export type KeyframeProperty = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur' | 'volume';

export interface Keyframe {
  id: string;
  time: number; // seconds relative to clip start
  property: KeyframeProperty;
  value: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoom'
  | 'push'
  | 'wipe'
  | 'blur'
  | 'flip3d'
  | 'flashWhite'
  | 'glitchCut';

export interface Transition {
  type: TransitionType;
  duration: number; // in seconds
}

export type EffectType =
  | 'none'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'grayscale'
  | 'sharpen'
  | 'vignette'
  | 'zoom'
  | 'shake'
  | 'flash'
  | 'glitch'
  | 'rgbSplit'
  | 'sepia'
  | 'invert';

export interface EffectConfig {
  type: EffectType;
  intensity: number; // 0 to 1
}

export type TextAnimationType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'pop'
  | 'zoom'
  | 'bounce'
  | 'typewriter'
  | 'wipe'
  | 'scale'
  | 'blur'
  | 'flip'
  | 'glowPulse'
  | 'shake';

export interface TextElement {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  gradient?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
  alignment: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineSpacing?: number;
  inAnimation?: TextAnimationType;
  outAnimation?: TextAnimationType;
  animationDuration?: number;
}

export interface ChromaKeyConfig {
  enabled: boolean;
  keyColor: string; // Hex color e.g. '#00ff00'
  similarity: number; // 0 to 1 (tolerance threshold)
  smoothness: number; // 0 to 1 (edge feathering)
  spill: number; // 0 to 1 (green spill suppression)
}

export interface ImageElement {
  src: string;
  topic?: string;
  crop?: { x: number; y: number; width: number; height: number };
  mask?: 'none' | 'circle' | 'rounded' | 'heart' | 'star';
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
  chromaKey?: ChromaKeyConfig;
  blendMode?: string;
}

export type SfxType =
  | 'clockTick'
  | 'correctDing'
  | 'timeoutBuzzer'
  | 'pop'
  | 'whoosh'
  | 'tadaFanfare'
  | 'drumroll'
  | 'laser';

export interface AudioElement {
  src?: string;
  audioBuffer?: AudioBuffer;
  volume: number; // 0 to 1
  fadeInDuration?: number;
  fadeOutDuration?: number;
  speed?: number; // 0.5 to 2.0
  pitch?: number;
  synthText?: string; // Hindi/English TTS speech synthesis
  synthLang?: string;
  synthRate?: number;
  isSfx?: boolean;
  sfxType?: SfxType;
}

export interface VideoElement {
  src?: string;
  speed?: number;
  volume: number;
  crop?: { x: number; y: number; width: number; height: number };
  filters?: EffectConfig[];
  chromaKey?: ChromaKeyConfig;
}

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  name: string;
  startTime: number; // seconds
  duration: number; // seconds
  trimStart?: number;
  trimEnd?: number;

  // Transform coordinates (normalized canvas 0..1080, 0..1920)
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur?: number;
  blendMode?: string;

  // Element specific data
  text?: TextElement;
  image?: ImageElement;
  audio?: AudioElement;
  video?: VideoElement;

  // Keyframes
  keyframes: Keyframe[];

  // Transitions
  inTransition?: Transition;
  outTransition?: Transition;

  // Effects
  effects: EffectConfig[];

  // GK reference animation flags
  activeDashed?: boolean; // Red dashed outline around option
  isAnswerHighlight?: boolean; // Green answer highlight
  dashedActiveStart?: number; // Timeline second when red dashed border activates
  dashedActiveEnd?: number; // Timeline second when red dashed border deactivates
  revealStart?: number; // Timeline second when correct option turns green
  isCorrectOption?: boolean; // True if this option is the correct answer

  // GK specific metadata
  gkQuestionId?: string;
  gkRole?:
    | 'question'
    | 'optionA'
    | 'optionB'
    | 'optionC'
    | 'optionD'
    | 'timer'
    | 'timeout'
    | 'correctReveal'
    | 'background';
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  order: number;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  clips: Clip[];
}

export interface VideoProject {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  fps: number;
  duration: number;
  backgroundColor: string;
  backgroundImage?: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: '9:16' | '16:9';
  backgroundColor: string;
  questionStyle: Partial<TextElement>;
  optionStyle: Partial<TextElement>;
  correctOptionStyle: Partial<TextElement>;
  timerStyle: {
    type: 'circle' | 'bar';
    duration: number;
    leftArcColor: string;
    rightArcColor: string;
    numberColor: string;
  };
  timing: {
    questionReadTime: number;
    optionIntervalTime: number;
    timerCountdownTime: number;
    answerRevealTime: number;
  };
  bgMusicUrl?: string;
  enableTts: boolean;
  ttsRate: number;
  enableSfx: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  dataUrl: string;
  duration?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: number;
}

export interface SelectionState {
  clipId: string | null;
  trackId: string | null;
  keyframeId: string | null;
}
