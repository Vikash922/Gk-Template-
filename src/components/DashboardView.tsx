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
      {/* ─── Hero Banner (Minimalist, Calm, Premium) ─── */}
      <div className="rounded-2xl p-6 sm:p-7 bg-[#121216] border border-[#222228] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GK Studio Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Create Question Cards & Video Shorts
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Professional card generator with multi-track timeline video editor, automated countdown timer, and Hindi voiceover.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('video')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Open Video Studio</span>
          </button>

          <button
            type="button"
            onClick={handleNewCard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Metrics (Clean & Minimalist) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#121216] border border-[#222228] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Total Cards</p>
            <p className="text-xl font-bold text-zinc-100 mt-0.5">{stats.totalQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 text-zinc-300 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-[#222228] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Saved in Library</p>
            <p className="text-xl font-bold text-zinc-100 mt-0.5">{stats.savedQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 text-zinc-300 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-[#222228] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Exports Created</p>
            <p className="text-xl font-bold text-zinc-100 mt-0.5">{stats.generatedCards || 18}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 text-zinc-300 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121216] border border-[#222228] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400">Video Studio</p>
            <p className="text-xl font-bold text-blue-400 mt-0.5">Shorts Ready</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Film className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── Workspaces Hub ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate?.('video')}
          className="p-5 rounded-2xl bg-[#121216] border border-[#262630] hover:border-blue-500/50 cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              Video Studio (Shorts/Reels)
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">CapCut Style</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Multi-track timeline with countdown timer, red dashed options focus, Hindi voiceover script, and 1080p export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mt-5 pt-3 border-t border-[#1e1e24]">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={handleNewCard}
          className="p-5 rounded-2xl bg-[#121216] border border-[#222228] hover:border-zinc-600 cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-zinc-200 transition-colors">
              Single Card Studio
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Design individual high-resolution 16:9 cards with custom typography, layout nudge controls, and Devanagari styling.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 mt-5 pt-3 border-t border-[#1e1e24]">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('batch')}
          className="p-5 rounded-2xl bg-[#121216] border border-[#222228] hover:border-zinc-600 cursor-pointer flex flex-col justify-between group transition-all"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-100 group-hover:text-zinc-200 transition-colors">
              Batch Generator
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste raw questions text in bulk. Smart parser automatically creates cards and enables 1-click bulk ZIP export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 mt-5 pt-3 border-t border-[#1e1e24]">
            <span>Open Batch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Question Cards List ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Saved Cards</h2>
            <p className="text-xs text-zinc-400">Click any card to edit in Single Studio or add to Video Timeline</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121216] border border-[#262630] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => handleEdit(q)}
                className="p-4 rounded-xl bg-[#121216] border border-[#222228] hover:border-zinc-700 hover:bg-[#16161b] cursor-pointer flex flex-col justify-between group transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      #{String(q.questionNumber || idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      Answer: <strong className="text-emerald-400">{q.correctAnswer || 'A'}</strong>
                    </span>
                  </div>

                  <p className="font-medium text-xs text-zinc-200 line-clamp-2 leading-relaxed group-hover:text-white">
                    {q.question || 'Untitled Question'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1e1e24] flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate max-w-[160px]">Opt A: {q.optionA || '—'}</span>
                  <span className="inline-flex items-center gap-1 text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <Edit3 className="w-3 h-3" /> Edit
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-[#121216] border border-[#222228] text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-200">No cards found</p>
            <p className="text-xs text-zinc-400">Adjust your search query or create a new card to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
