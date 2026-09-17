import React, { useState } from 'react';
import { GKQuestion } from '../types/question';
import { OptionInput } from './OptionInput';
import { INITIAL_QUESTIONS } from '../constants/sampleQuestions';
import { autoGenerateImageForQuestion } from '../services/imageGenerator';
import { useToast } from './Toast';
import {
  HelpCircle,
  Hash,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react';

interface QuestionFormProps {
  question: GKQuestion;
  onChange: (updated: GKQuestion) => void;
  onOpenAiModal?: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onChange,
  onOpenAiModal,
}) => {
  const { showToast } = useToast();
  const [showQuickSamples, setShowQuickSamples] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  const handleChangeField = <K extends keyof GKQuestion>(field: K, value: GKQuestion[K]) => {
    onChange({
      ...question,
      [field]: value,
      updatedAt: Date.now(),
    });
  };

  const handleQuickAutoImage = async () => {
    if (!question.question?.trim()) {
      showToast('Please type a question statement first', 'error');
      return;
    }
    setIsGeneratingImage(true);
    try {
      showToast('✨ Generating unique image with background removed...', 'info', 4500);
      const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);
      const result = await autoGenerateImageForQuestion({
        question: question.question,
        options,
        correctAnswer: question.correctAnswer,
        autoRemoveBg: true,
      });

      onChange({
        ...question,
        image: result.imageUrl,
        imageTopic: result.subjectTitle,
        imageMode: 'ai',
        updatedAt: Date.now(),
      });
      showToast(`✨ Generated cutout: ${result.subjectTitle}`, 'success');
    } catch (err) {
      showToast('Image generation failed. Try again or use Card Image tab.', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleLoadSample = (sample: GKQuestion) => {
    onChange({
      ...sample,
      id: question.id,
      createdAt: question.createdAt,
      updatedAt: Date.now(),
    });
    setShowQuickSamples(false);
  };

  return (
    <div className="bg-transparent flex flex-col gap-3.5">
      {/* 1. Header Bar: Question Number + Title + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200/70">
            <Hash className="w-3.5 h-3.5 text-red-500" />
            <input
              type="number"
              min="1"
              max="9999"
              value={question.questionNumber}
              onChange={(e) => handleChangeField('questionNumber', parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-transparent font-bold text-center text-red-700 text-xs focus:outline-none"
              title="Question Number displayed in red badge"
            />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Question & Options
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowQuickSamples(!showQuickSamples)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 border border-slate-200/70"
          >
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>Samples</span>
            {showQuickSamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onOpenAiModal && (
            <button
              type="button"
              onClick={onOpenAiModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/70 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>AI Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Samples Dropdown */}
      {showQuickSamples && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar bg-slate-50 p-2 rounded-xl border border-slate-200/60">
          <span className="text-slate-500 shrink-0 text-[10px] font-semibold">Load Sample:</span>
          {INITIAL_QUESTIONS.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => handleLoadSample(s)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[11px] font-medium whitespace-nowrap border border-slate-200/70 transition-colors cursor-pointer shadow-2xs"
            >
              #{s.questionNumber} {s.question.slice(0, 16)}...
            </button>
          ))}
        </div>
      )}

      {/* 2. Question Text Input + Quick Auto Image Button */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-700 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-emerald-600" />
            <span>Question Statement</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickAutoImage}
              disabled={isGeneratingImage || !question.question?.trim()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-[11px] border border-indigo-200/70 transition-all cursor-pointer shadow-2xs"
              title="Automatically generate a unique cutout related to this question with transparent background"
            >
              <Wand2 className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
              <span>{isGeneratingImage ? 'Generating...' : '✨ Auto Cutout Image'}</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              {question.question?.length || 0} chars
            </span>
          </div>
        </div>

        <textarea
          rows={2}
          value={question.question}
          onChange={(e) => handleChangeField('question', e.target.value)}
          placeholder="e.g. Which country is known as the Land of the Rising Sun?"
          className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm leading-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs resize-y bg-white"
        />

        {question.image && (
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
            <img
              src={question.image}
              alt="Active Cutout"
              className="w-5 h-5 object-contain rounded bg-white border border-slate-200"
            />
            <span className="truncate flex-1">
              Active Cutout: <strong className="text-slate-800">{question.imageTopic || 'Educational Cutout'}</strong> (Transparent BG)
            </span>
            <span className="text-[10px] text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded font-medium shrink-0">
              Attached to Card
            </span>
          </div>
        )}
      </div>

      {/* 3. Options Grid: 2x2 on sm screens */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs pb-1">
          <span className="font-semibold text-slate-700">
            Options A, B, C, D
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Click [A]-[D] letter badge to mark correct answer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OptionInput
            letter="A"
            value={question.optionA}
            onChange={(val) => handleChangeField('optionA', val)}
            placeholder="Option A (e.g., Japan)"
            isCorrect={question.correctAnswer === 'A'}
            onMarkCorrect={() => handleChangeField('correctAnswer', 'A')}
          />

          <OptionInput
            letter="B"
            value={question.optionB}
            onChange={(val) => handleChangeField('optionB', val)}
            placeholder="Option B (e.g., Norway)"
            isCorrect={question.correctAnswer === 'B'}
            onMarkCorrect={() => handleChangeField('correctAnswer', 'B')}
          />

          <OptionInput
            letter="C"
            value={question.optionC}
            onChange={(val) => handleChangeField('optionC', val)}
            placeholder="Option C (e.g., New Zealand)"
            isCorrect={question.correctAnswer === 'C'}
            onMarkCorrect={() => handleChangeField('correctAnswer', 'C')}
          />

          <OptionInput
            letter="D"
            value={question.optionD}
            onChange={(val) => handleChangeField('optionD', val)}
            placeholder="Option D (e.g., Australia)"
            isCorrect={question.correctAnswer === 'D'}
            onMarkCorrect={() => handleChangeField('correctAnswer', 'D')}
          />
        </div>
      </div>

      {/* 4. Correct Answer Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-700">Correct Answer:</span>
          <div className="flex items-center gap-1 ml-1">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleChangeField('correctAnswer', question.correctAnswer === opt ? '' : opt)}
                className={`w-6 h-6 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                  question.correctAnswer === opt
                    ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                {opt}
              </button>
            ))}
            {question.correctAnswer && (
              <button
                type="button"
                onClick={() => handleChangeField('correctAnswer', '')}
                className="text-[10px] text-slate-400 hover:text-red-600 px-1.5 py-0.5 cursor-pointer font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <span className="text-[10px] text-slate-400 italic">
          (Stored for quizzes; not printed on card)
        </span>
      </div>
    </div>
  );
};
