import React from 'react';
import { GKQuestion, CardStats } from '../types/question';
import { CardDesignConfig } from '../types/design';
import {
  Plus,
  Layers,
  LayoutTemplate,
  Bookmark,
  Sparkles,
  ArrowRight,
  Download,
  Edit3,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

interface DashboardViewProps {
  stats: CardStats;
  savedQuestions?: GKQuestion[];
  recentQuestions?: GKQuestion[];
  designConfig: CardDesignConfig;
  onNavigate?: (tab: 'editor' | 'saved' | 'batch' | 'settings' | 'templates') => void;
  onNewCard?: () => void;
  onCreateNewCard?: () => void;
  onEditCard?: (q: GKQuestion) => void;
  onEditQuestion?: (q: GKQuestion) => void;
  onOpenEditor?: () => void;
  onOpenSaved?: () => void;
  onOpenBatch?: () => void;
  onOpenTemplates?: () => void;
  onOpenAiGenerator?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  savedQuestions = [],
  recentQuestions = [],
  designConfig,
  onNavigate,
  onNewCard,
  onCreateNewCard,
  onEditCard,
  onEditQuestion,
  onOpenEditor,
  onOpenSaved,
  onOpenBatch,
  onOpenTemplates,
  onOpenAiGenerator,
}) => {
  const allQuestions = savedQuestions.length > 0 ? savedQuestions : recentQuestions;
  const recentCards = allQuestions.slice(0, 4);
  const templatesCount = designConfig?.useTemplateImage && designConfig?.templateImage ? 2 : 1;

  const handleNewCard = onNewCard || onCreateNewCard || onOpenEditor || (() => onNavigate?.('editor'));
  const handleEdit = onEditCard || onEditQuestion || (() => onNavigate?.('editor'));
  const handleGoTo = (tab: 'editor' | 'saved' | 'batch' | 'settings' | 'templates') => {
    if (tab === 'editor' && onOpenEditor) return onOpenEditor();
    if (tab === 'saved' && onOpenSaved) return onOpenSaved();
    if (tab === 'batch' && onOpenBatch) return onOpenBatch();
    if (tab === 'templates' && onOpenTemplates) return onOpenTemplates();
    if (onNavigate) return onNavigate(tab);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-8">
      {/* Ultra Minimal Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage your card templates and library.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAiGenerator && (
            <button
              type="button"
              onClick={onOpenAiGenerator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Gen</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNewCard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* Quick Stats & Navigation - Minimal Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {/* Editor */}
        <button
          type="button"
          onClick={() => handleGoTo('editor')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 hover:border-slate-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Editor</div>
            <div className="text-xs text-slate-500">Design tool</div>
          </div>
        </button>

        {/* Batch */}
        <button
          type="button"
          onClick={() => handleGoTo('batch')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 hover:border-slate-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Batch</div>
            <div className="text-xs text-slate-500">Auto generate</div>
          </div>
        </button>

        {/* Templates */}
        <button
          type="button"
          onClick={() => handleGoTo('templates')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 hover:border-slate-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Templates</div>
            <div className="text-xs text-slate-500">{templatesCount} active</div>
          </div>
        </button>

        {/* Library */}
        <button
          type="button"
          onClick={() => handleGoTo('saved')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 hover:border-slate-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Library
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                {stats.totalSaved}
              </span>
            </div>
            <div className="text-xs text-slate-500">Saved cards</div>
          </div>
        </button>
      </div>

      {/* Recent Cards Preview - Minimal Grid */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Cards</h2>
          {recentCards.length > 0 && (
            <button
              type="button"
              onClick={() => handleGoTo('saved')}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {recentCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentCards.map((q) => (
              <div
                key={q.id}
                onClick={() => handleEdit(q)}
                className="group p-4 rounded-2xl bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between h-32"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {String(q.questionNumber).padStart(2, '0')}
                  </span>
                  <p className="font-medium text-sm text-slate-800 line-clamp-2 leading-relaxed">
                    {q.question || 'Untitled'}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 text-xs font-medium text-slate-500">
                  <span className="truncate max-w-[120px]">A: {q.correctAnswer || '-'}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-900">
                    <Edit3 className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-600 font-medium">No cards yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Create your first question card.</p>
            <button
              type="button"
              onClick={handleNewCard}
              className="text-sm font-medium text-slate-900 hover:underline"
            >
              Create new card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
