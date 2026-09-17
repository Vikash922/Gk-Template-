import { GKQuestion, CardStats } from '../types/question';
import { INITIAL_QUESTIONS } from '../constants/sampleQuestions';

const STORAGE_KEY = 'gk_card_maker_questions_v2';
const STATS_KEY = 'gk_card_maker_stats_v2';

export function getStoredQuestions(): GKQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load questions from storage:', err);
    return INITIAL_QUESTIONS;
  }
}

export function saveQuestionToStorage(question: GKQuestion): GKQuestion[] {
  const existing = getStoredQuestions();
  const index = existing.findIndex((q) => q.id === question.id);
  const now = Date.now();

  let updated: GKQuestion[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = { ...question, updatedAt: now };
  } else {
    updated = [{ ...question, createdAt: now, updatedAt: now }, ...existing];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteQuestionFromStorage(id: string): GKQuestion[] {
  const existing = getStoredQuestions();
  const updated = existing.filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function saveAllQuestionsToStorage(questions: GKQuestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to save all questions:', err);
  }
}

export function duplicateQuestionInStorage(id: string): GKQuestion | null {
  const existing = getStoredQuestions();
  const item = existing.find((q) => q.id === id);
  if (!item) return null;

  const currentNum = typeof item.questionNumber === 'number' ? item.questionNumber : parseInt(String(item.questionNumber), 10) || 1;
  const newQuestion: GKQuestion = {
    ...item,
    id: 'q_' + Math.random().toString(36).substring(2, 9),
    questionNumber: currentNum + 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updated = [newQuestion, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newQuestion;
}

export function getCardStats(): CardStats {
  try {
    const questions = getStoredQuestions();
    const rawStats = localStorage.getItem(STATS_KEY);
    const parsed = rawStats ? JSON.parse(rawStats) : {};
    const generatedCards = typeof parsed.generatedCards === 'number' ? parsed.generatedCards : 18;

    return {
      totalQuestions: questions.length,
      savedQuestions: questions.length,
      generatedCards,
    };
  } catch {
    return {
      totalQuestions: 5,
      savedQuestions: 5,
      generatedCards: 18,
    };
  }
}

export function incrementGeneratedCardCount(): void {
  try {
    const rawStats = localStorage.getItem(STATS_KEY);
    const parsed = rawStats ? JSON.parse(rawStats) : {};
    const count = (parsed.generatedCards || 18) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify({ ...parsed, generatedCards: count }));
  } catch (err) {
    console.error('Failed to increment stats:', err);
  }
}

export function exportQuestionsToJson(): string {
  const questions = getStoredQuestions();
  return JSON.stringify(questions, null, 2);
}

export function importQuestionsFromJson(jsonStr: string): { count: number; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      return { count: 0, error: 'Imported JSON must be an array of questions.' };
    }

    const current = getStoredQuestions();
    const validated: GKQuestion[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.question && item.optionA && item.optionB && item.optionC && item.optionD) {
        validated.push({
          id: item.id || `imp_${Date.now()}_${i}`,
          questionNumber: item.questionNumber || current.length + i + 1,
          question: item.question,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correctAnswer: item.correctAnswer || 'A',
          image: item.image,
          imageTopic: item.imageTopic,
          imageMode: item.imageMode || 'library',
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (validated.length === 0) {
      return { count: 0, error: 'No valid questions found in the JSON file.' };
    }

    const merged = [...validated, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { count: validated.length };
  } catch (err) {
    return { count: 0, error: `Invalid JSON format: ${(err as Error).message}` };
  }
}
