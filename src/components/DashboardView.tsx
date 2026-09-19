import React, { useState } from 'react';
import { GKQuestion, CardStats } from '../types/question';
import { CardDesignConfig } from '../types/design';
import {
  Plus,
  Layers,
  Bookmark,
  Sparkles,
  ArrowRight,
  Film,
  Search,
  Wand2,
  Edit3,
  TrendingUp,
  Video,
} from 'lucide-react';

interface DashboardViewProps {
  stats: CardStats;
  savedQuestions?: GKQuestion[];
  recentQuestions?: GKQuestion[];
  designConfig: CardDesignConfig;
  onNavigate?: (tab: 'editor' | 'saved' | 'batch' | 'settings' | 'templates' | 'video') => void;
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = allQuestions.filter((q) =>
    (q.question || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.optionA || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewCard = onNewCard || onCreateNewCard || onOpenEditor || (() => onNavigate?.('editor'));
  const handleEdit = onEditCard || onEditQuestion || (() => onNavigate?.('editor'));

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-5 px-3 sm:px-4">
      {/* ─── Hero Banner (Clean, Bright, User-Friendly) ─── */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>GK Card & Shorts Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Create Engaging Question Cards & Animated Shorts
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Simple, user-friendly editor with multi-track timeline, circular countdown timer, and Hindi voiceover.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('video')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Open Video Studio</span>
          </button>

          <button
            type="button"
            onClick={handleNewCard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Metrics (Clean White Cards) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Cards</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Saved in Library</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.savedQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Generated Exports</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.generatedCards || 18}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Video Studio</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">Shorts Ready</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Film className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── Workspaces Hub ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate?.('video')}
          className="p-5 rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-sm cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              Video Studio (Shorts/Reels)
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">New</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-track timeline with countdown timer, red dashed options focus, Hindi voiceover script, and 1-click 1080p video export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-5 pt-3 border-t border-slate-100">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={handleNewCard}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
              Single Card Studio
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Design individual high-resolution 16:9 cards with custom typography, layout nudge controls, and Devanagari styling.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 group-hover:text-slate-900 mt-5 pt-3 border-t border-slate-100">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('batch')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
              Batch Generator
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste raw questions in bulk. Smart parser automatically creates cards and enables 1-click bulk ZIP export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 group-hover:text-slate-900 mt-5 pt-3 border-t border-slate-100">
            <span>Open Batch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Question Cards List ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Saved Cards</h2>
            <p className="text-xs text-slate-500">Click any card to edit or open in video timeline</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => handleEdit(q)}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs cursor-pointer flex flex-col justify-between group transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      #{String(q.questionNumber || idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      Answer: <strong className="text-emerald-600">{q.correctAnswer || 'A'}</strong>
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-800 line-clamp-2 leading-relaxed group-hover:text-blue-600 transition-colors">
                    {q.question || 'Untitled Question'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[160px]">Opt A: {q.optionA || '—'}</span>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <Edit3 className="w-3 h-3" /> Edit
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No cards found</p>
            <p className="text-xs text-slate-500">Adjust your search query or create a new card to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
