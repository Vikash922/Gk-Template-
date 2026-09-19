import React, { useState } from 'react';
import { GKQuestion, CardStats } from '../types/question';
import { CardDesignConfig } from '../types/design';
import {
  Plus,
  Layers,
  LayoutTemplate,
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
      {/* ─── Hero Banner: CapCut Dark Studio Style (High Contrast, 0 Lag) ─── */}
      <div className="rounded-2xl p-6 sm:p-7 bg-[#141419] border border-[#242430] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            <Video className="w-3.5 h-3.5" />
            <span>CapCut & VN Style Quiz Editor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create GK Cards & Animated Shorts Videos
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Professional video editor with split circular countdown timer, red dashed option focus, vibrant green reveal, and multi-track timeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('video')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs shadow-md shadow-cyan-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4 fill-black" />
            <span>Open Video Studio</span>
          </button>

          <button
            type="button"
            onClick={handleNewCard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e26] hover:bg-[#282834] border border-[#2e2e3e] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Metrics ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#141419] border border-[#22222a] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Total Cards</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.totalQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-[#22222a] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Library Saved</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.savedQuestions || allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-[#22222a] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Generated Exports</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.generatedCards || 18}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141419] border border-[#22222a] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Video Studio</p>
            <p className="text-xl font-black text-cyan-400 mt-0.5">CapCut Engine</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Film className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── Workspaces Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate?.('video')}
          className="p-5 rounded-2xl bg-[#141419] border-2 border-cyan-500/30 hover:border-cyan-500/60 cursor-pointer flex flex-col justify-between group transition-colors shadow-sm"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              Video Studio (Shorts/Reels)
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-black">New</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full multi-track video editor. Add timers, red dashed options focus, audio effects, and 1-click 1080p video export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mt-5 pt-3 border-t border-[#22222d]">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={handleNewCard}
          className="p-5 rounded-2xl bg-[#141419] border border-[#22222d] hover:border-[#383848] cursor-pointer flex flex-col justify-between group transition-colors"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              Single Card Studio
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Design individual high-resolution 16:9 cards with custom typography, nudge controls, and authentic Devanagari styling.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-5 pt-3 border-t border-[#22222d]">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('batch')}
          className="p-5 rounded-2xl bg-[#141419] border border-[#22222d] hover:border-[#383848] cursor-pointer flex flex-col justify-between group transition-colors"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              Batch Generator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste dozens of questions at once. Smart parser automatically creates cards and enables 1-click bulk PNG/ZIP export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mt-5 pt-3 border-t border-[#22222d]">
            <span>Open Batch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Cards Library List ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Your Question Cards</h2>
            <p className="text-xs text-slate-400">Click any card to open in editor or video timeline</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141419] border border-[#252532] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => handleEdit(q)}
                className="p-4 rounded-xl bg-[#141419] border border-[#22222a] hover:border-[#3a3a4a] hover:bg-[#181820] cursor-pointer flex flex-col justify-between group transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-cyan-400 border border-[#262635]">
                      #{String(q.questionNumber || idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Answer: <strong className="text-green-400">{q.correctAnswer || 'A'}</strong>
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-200 line-clamp-2 leading-relaxed group-hover:text-white">
                    {q.question || 'Untitled Question'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22222a] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[160px]">Opt A: {q.optionA || '—'}</span>
                  <span className="inline-flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    <Edit3 className="w-3 h-3" /> Edit
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-[#141419] border border-[#22222a] text-center space-y-2">
            <p className="text-sm font-bold text-white">No questions found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or create a new card.</p>
          </div>
        )}
      </div>
    </div>
  );
};
