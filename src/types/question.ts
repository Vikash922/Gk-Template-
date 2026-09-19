import { CardDesignConfig } from './design';

export interface GKQuestion {
  id: string;
  questionNumber: number | string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | string;
  image?: string;
  imageTopic?: string;
  imageMode?: 'ai' | 'library' | 'upload' | 'none';
  createdAt: number;
  updatedAt: number;
  customDesign?: Partial<CardDesignConfig>; // Per-card layout & design overrides
  voiceoverScript?: string; // Spoken text for audio voiceover track
  voiceoverSpeed?: number; // TTS speed multiplier (e.g. 1.0)
  readDuration?: number; // Reading hold seconds
  optionDuration?: number; // Duration per option highlight
  timerDuration?: number; // Countdown seconds (e.g. 5)
  revealDuration?: number; // Hold seconds for green answer reveal
}

export type OptionKey = 'optionA' | 'optionB' | 'optionC' | 'optionD';

export interface CardStats {
  totalQuestions: number;
  generatedCards: number;
  savedQuestions: number;
}
