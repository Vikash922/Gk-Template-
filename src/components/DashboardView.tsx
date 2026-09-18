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
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  TrendingUp,
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
    <div className="flex flex-col gap-8 max-w-6xl mx-auto py-6 px-2 sm:px-4">
      {/* ─── Hero Banner with Glass Finish (Design Division) ─── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel border border-white/[0.12] shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Quiz Content Creator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Create Engaging Quiz Cards & Video Shorts in Seconds
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Design authentic 16:9 GK question cards, bulk batch generate with smart parsing, and export high-converting animated Shorts videos with countdown timers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleNewCard}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Card</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('video')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Video Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Metric Highlight Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Cards</p>
            <p className="text-2xl font-black text-white mt-1">{stats.totalQuestions || allQuestions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Saved Library</p>
            <p className="text-2xl font-black text-white mt-1">{stats.savedQuestions || allQuestions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Exports Generated</p>
            <p className="text-2xl font-black text-white mt-1">{stats.generatedCards || 18}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/[0.08] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Video Shorts</p>
            <p className="text-2xl font-black text-rose-400 mt-1">Ready</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Studio Workspaces Hub ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={handleNewCard}
          className="p-6 rounded-3xl glass-card border border-white/[0.08] hover:border-emerald-500/40 cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              Single Card Studio
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Design individual high-resolution 16:9 cards with custom typography, nudge controls, and authentic Devanagari styling.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-6 pt-4 border-t border-white/[0.06]">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('batch')}
          className="p-6 rounded-3xl glass-card border border-white/[0.08] hover:border-indigo-500/40 cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
              Batch Generator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste dozens of questions at once. Smart parser automatically creates cards, assigns clipart, and enables 1-click ZIP export.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mt-6 pt-4 border-t border-white/[0.06]">
            <span>Open Batch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate?.('video')}
          className="p-6 rounded-3xl glass-card border border-white/[0.08] hover:border-rose-500/40 cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
              Video Shorts Studio
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Turn your cards into animated YouTube Shorts and Instagram Reels with red dashed option highlights, split timer, and green reveal.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mt-6 pt-4 border-t border-white/[0.06]">
            <span>Open Video Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── Question Library Explorer ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Your Question Library</h2>
            <p className="text-xs text-slate-400">Click any card to open in editor or add to video</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => handleEdit(q)}
                className="p-5 rounded-2xl glass-card border border-white/[0.08] hover:border-emerald-500/40 cursor-pointer flex flex-col justify-between group transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-emerald-400 border border-white/[0.08]">
                      #{String(q.questionNumber || idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Answer: <strong className="text-emerald-400">{q.correctAnswer || 'A'}</strong>
                    </span>
                  </div>

                  <p className="font-semibold text-sm text-slate-200 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                    {q.question || 'Untitled Question'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[160px]">Opt A: {q.optionA || '—'}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl glass-panel border border-white/[0.08] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-slate-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No questions found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'No results matched your search term.' : 'Get started by creating your first card or generating a batch.'}
            </p>
            <button
              type="button"
              onClick={handleNewCard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Card</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
