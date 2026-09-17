import { GKQuestion } from '../types/question';

export interface GenerateGKOptions {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
  language: 'Hindi' | 'English' | 'Hinglish';
}

const CURATED_BANK: Record<string, Partial<GKQuestion>[]> = {
  Animals: [
    {
      question: 'Which magnificent feline is recognized as the National Animal of India?',
      optionA: 'Royal Bengal Tiger',
      optionB: 'Asiatic Lion',
      optionC: 'Indian Elephant',
      optionD: 'Snow Leopard',
      correctAnswer: 'A',
      imageTopic: 'bengal tiger',
    },
    {
      question: 'Which is the fastest land animal in the world over short distances?',
      optionA: 'Cheetah',
      optionB: 'Pronghorn Antelope',
      optionC: 'Lion',
      optionD: 'Quarter Horse',
      correctAnswer: 'A',
      imageTopic: 'bengal tiger',
    },
    {
      question: 'Which mammal is known to possess the largest ears relative to body proportions?',
      optionA: 'African Elephant',
      optionB: 'Fennec Fox',
      optionC: 'Brown Long-eared Bat',
      optionD: 'Jackrabbit',
      correctAnswer: 'A',
      imageTopic: 'desert camel',
    },
  ],
  'Human Body': [
    {
      question: 'How many total bones make up the adult human skeletal framework?',
      optionA: '206 Bones',
      optionB: '208 Bones',
      optionC: '300 Bones',
      optionD: '212 Bones',
      correctAnswer: 'A',
      imageTopic: 'human skeleton',
    },
    {
      question: 'Which vital organ in the human body is primarily responsible for filtering blood waste?',
      optionA: 'Kidney',
      optionB: 'Lungs',
      optionC: 'Stomach',
      optionD: 'Pancreas',
      correctAnswer: 'A',
      imageTopic: 'water drinking',
    },
    {
      question: 'What is the largest internal organ and gland in the human body?',
      optionA: 'Liver',
      optionB: 'Thyroid',
      optionC: 'Pancreas',
      optionD: 'Pituitary Gland',
      correctAnswer: 'A',
      imageTopic: 'human skeleton',
    },
  ],
  India: [
    {
      question: 'Which city serves as the official national capital of India?',
      optionA: 'New Delhi',
      optionB: 'Mumbai',
      optionC: 'Kolkata',
      optionD: 'Bengaluru',
      correctAnswer: 'A',
      imageTopic: 'india gate',
    },
    {
      question: 'Which flower holds the distinction of being the National Flower of India?',
      optionA: 'Lotus',
      optionB: 'Rose',
      optionC: 'Marigold',
      optionD: 'Sunflower',
      correctAnswer: 'A',
      imageTopic: 'lotus flower',
    },
    {
      question: 'Who is widely revered as the Chief Architect of the Constitution of India?',
      optionA: 'Dr. B. R. Ambedkar',
      optionB: 'Mahatma Gandhi',
      optionC: 'Dr. Rajendra Prasad',
      optionD: 'Jawaharlal Nehru',
      correctAnswer: 'A',
      imageTopic: 'india gate',
    },
  ],
  Science: [
    {
      question: 'Which planet in our solar system is both the hottest and the brightest in the night sky?',
      optionA: 'Venus',
      optionB: 'Mercury',
      optionC: 'Mars',
      optionD: 'Jupiter',
      correctAnswer: 'A',
      imageTopic: 'solar system',
    },
    {
      question: 'A light-year is a scientific unit of measurement used to quantify which parameter?',
      optionA: 'Astronomical Distance',
      optionB: 'Time Duration',
      optionC: 'Speed of Light',
      optionD: 'Gravitational Mass',
      correctAnswer: 'A',
      imageTopic: 'isro rocket',
    },
    {
      question: 'What is the standard chemical formula for pure water?',
      optionA: 'H2O',
      optionB: 'CO2',
      optionC: 'NaCl',
      optionD: 'O2',
      correctAnswer: 'A',
      imageTopic: 'water drinking',
    },
  ],
};

import { generateQuestionsBrowser } from './aiService';

export async function generateGKQuestions(
  options: GenerateGKOptions,
  startQuestionNumber: number = 1
): Promise<GKQuestion[]> {
  try {
    const data = await generateQuestionsBrowser(options.topic, options.difficulty, options.count, options.language);
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions.map((q: Partial<GKQuestion>, idx: number) => ({
        id: `gen_${Date.now()}_${idx}`,
        questionNumber: startQuestionNumber + idx,
        question: q.question || '',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctAnswer: q.correctAnswer || 'A',
        imageTopic: q.imageTopic || '',
        imageMode: 'library',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    }
  } catch (err) {
    console.warn('API question generator fallback:', err);
  }

  // Curated Fallback
  const categoryBank = CURATED_BANK[options.topic] || CURATED_BANK['India'] || CURATED_BANK['Animals'];
  const results: GKQuestion[] = [];

  for (let i = 0; i < options.count; i++) {
    const template = categoryBank[i % categoryBank.length];
    results.push({
      id: `gen_curated_${Date.now()}_${i}`,
      questionNumber: startQuestionNumber + i,
      question: template.question || 'General Knowledge Question',
      optionA: template.optionA || 'Option A',
      optionB: template.optionB || 'Option B',
      optionC: template.optionC || 'Option C',
      optionD: template.optionD || 'Option D',
      correctAnswer: template.correctAnswer || 'A',
      imageTopic: template.imageTopic || '',
      imageMode: 'library',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return results;
}
