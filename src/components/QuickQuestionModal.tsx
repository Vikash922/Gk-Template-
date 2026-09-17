import React, { useState } from 'react';
import { GKQuestion } from '../types/question';
import { generateGKQuestions } from '../services/questionGenerator';
import { Wand2, X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface QuickQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: GKQuestion) => void;
  onAppendAll: (questions: GKQuestion[]) => void;
  currentCount: number;
}

const TOPICS = [
  'India',
  'Animals',
  'Human Body',
  'Science',
  'Geography',
  'History',
  'Solar System',
  'Technology',
  'Sports',
  'World GK',
];

export const QuickQuestionModal: React.FC<QuickQuestionModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
  onAppendAll,
  currentCount,
}) => {
  const [topic, setTopic] = useState<string>('India');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [count, setCount] = useState<number>(3);
  const [language, setLanguage] = useState<'Hindi' | 'English' | 'Hinglish'>('English');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<GKQuestion[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const results = await generateGKQuestions(
        { topic, difficulty, count, language },
        currentCount + 1
      );
      setGeneratedDrafts(results);
    } catch (err) {
      alert('Failed to generate questions. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quick Question Generator</h3>
              <p className="text-xs text-slate-600">Draft GK questions for cards</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
          {/* Topic selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Topic</label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    topic === t
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Count</label>
              <select
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white cursor-pointer"
              >
                <option value="1">1 Question</option>
                <option value="3">3 Questions</option>
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Drafting Questions...' : `Generate ${count} GK Question(s)`}</span>
          </button>

          {/* Results List */}
          {generatedDrafts.length > 0 && (
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Generated Drafts ({generatedDrafts.length}):</span>
                <button
                  type="button"
                  onClick={() => {
                    onAppendAll(generatedDrafts);
                    onClose();
                  }}
                  className="text-purple-600 hover:underline cursor-pointer"
                >
                  Save All to Library
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {generatedDrafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/50 flex flex-col gap-1.5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 line-clamp-2">
                        #{d.questionNumber} {d.question}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuestion(d);
                          onClose();
                        }}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-semibold hover:bg-purple-700 cursor-pointer"
                      >
                        Load <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      <span>A. {d.optionA}</span>
                      <span>B. {d.optionB}</span>
                      <span>C. {d.optionC}</span>
                      <span>D. {d.optionD}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
