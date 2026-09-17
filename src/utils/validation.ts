import { GKQuestion } from '../types/question';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateQuestion(question: Partial<GKQuestion>): ValidationResult {
  if (!question.question || question.question.trim().length === 0) {
    return {
      isValid: false,
      error: 'Please enter a question.',
    };
  }

  if (
    !question.optionA?.trim() ||
    !question.optionB?.trim() ||
    !question.optionC?.trim() ||
    !question.optionD?.trim()
  ) {
    return {
      isValid: false,
      error: 'Please enter all four options (A, B, C, and D).',
    };
  }

  return { isValid: true };
}
