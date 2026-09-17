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
}

export type OptionKey = 'optionA' | 'optionB' | 'optionC' | 'optionD';

export interface CardStats {
  totalQuestions: number;
  generatedCards: number;
  savedQuestions: number;
}
