import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { getStoredQuestions } from '../services/storage';
import { generateQuizVideo, VideoConfig, DEFAULT_VIDEO_CONFIG } from '../utils/videoRenderer';
import { REFERENCE_DESIGN } from '../constants/referenceDesign';
import { renderCardToCanvas } from '../utils/canvasRenderer';
import {
  Film, Play, Trash2, Download, Plus, GripVertical,
  Clock, Timer, Eye, Zap, ChevronDown, ChevronUp,
  Pause, RotateCcw, Settings2, Sparkles
} from 'lucide-react';

/* ───────── Video Timeline Item ───────── */
interface TimelineItem {
  question: GKQuestion;
  readTime: number;
  timerTime: number;
  revealTime: number;
}

/* ───────── Component ───────── */
export const VideoStudio: React.FC = () => {
  // ─── Data ───
  const [library, setLibrary] = useState<GKQuestion[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [designConfig] = useState<CardDesignConfig>(REFERENCE_DESIGN);

  // ─── Settings ───
  const [globalConfig, setGlobalConfig] = useState<VideoConfig>({ ...DEFAULT_VIDEO_CONFIG });
  const [showSettings, setShowSettings] = useState(false);

  // ─── Render State ───
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState('');
  const [renderPercent, setRenderPercent] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ─── Preview ───
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewPhase, setPreviewPhase] = useState<'question' | 'answer'>('question');

  // ─── Load library ───
  useEffect(() => {
    setLibrary(getStoredQuestions());
  }, []);

  // ─── Preview rendering ───
  const renderPreview = useCallback(async (idx: number, showAnswer: boolean) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !timeline[idx]) return;
    await renderCardToCanvas(canvas, timeline[idx].question, designConfig, 1920, 1080, showAnswer);
  }, [timeline, designConfig]);

  useEffect(() => {
    if (previewIdx !== null && previewIdx < timeline.length) {
      renderPreview(previewIdx, previewPhase === 'answer');
    }
  }, [previewIdx, previewPhase, timeline, renderPreview]);

  // Auto-select first when timeline changes
  useEffect(() => {
    if (timeline.length > 0 && previewIdx === null) {
      setPreviewIdx(0);
    }
  }, [timeline, previewIdx]);

  // ─── Actions ───
  const addToTimeline = (q: GKQuestion) => {
    if (timeline.find(t => t.question.id === q.id)) return;
    setTimeline(prev => [...prev, {
      question: q,
      readTime: globalConfig.readTime,
      timerTime: globalConfig.timerTime,
      revealTime: globalConfig.revealTime,
    }]);
  };

  const addAllToTimeline = () => {
    const existing = new Set(timeline.map(t => t.question.id));
    const newItems: TimelineItem[] = library
      .filter(q => !existing.has(q.id))
      .map(q => ({
        question: q,
        readTime: globalConfig.readTime,
        timerTime: globalConfig.timerTime,
        revealTime: globalConfig.revealTime,
      }));
    setTimeline(prev => [...prev, ...newItems]);
  };

  const removeFromTimeline = (idx: number) => {
    setTimeline(prev => prev.filter((_, i) => i !== idx));
    if (previewIdx !== null) {
      if (previewIdx >= timeline.length - 1) setPreviewIdx(Math.max(0, timeline.length - 2));
    }
  };

  const moveItem = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= timeline.length) return;
    setTimeline(prev => {
      const copy = [...prev];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
    setPreviewIdx(to);
  };

  const updateItemTiming = (idx: number, field: 'readTime' | 'timerTime' | 'revealTime', value: number) => {
    setTimeline(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // ─── Generate Video ───
  const handleGenerate = async () => {
    if (timeline.length === 0) return;
    setIsRendering(true);
    setVideoUrl(null);
    setRenderPercent(0);

    try {
      // Build per-question config overrides
      const questions = timeline.map(t => t.question);
      // Use global config but override per-question timings via a custom approach
      const config: VideoConfig = { ...globalConfig };
      const url = await generateQuizVideo(questions, designConfig, config, (msg, pct) => {
        setRenderProgress(msg);
        setRenderPercent(pct);
      });
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  // ─── Computed ───
  const totalDuration = timeline.reduce((sum, t) =>
    sum + t.readTime + t.timerTime + globalConfig.timeoutFlashTime + t.revealTime + globalConfig.transitionTime, 0
  );
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ═══════ Header ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <Film className="w-5 h-5 text-white" />
          </div>
          Video Studio
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-600">
            {timeline.length} Questions
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-indigo-50 font-semibold text-indigo-600">
            ≈ {formatTime(totalDuration)}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════ Settings Panel ═══════ */}
      {showSettings && (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-sm animate-fade-in">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Global Timing (seconds)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { label: 'Read Time', key: 'readTime' as const, icon: Eye, color: 'text-blue-500' },
              { label: 'Timer', key: 'timerTime' as const, icon: Timer, color: 'text-amber-500' },
              { label: 'Answer', key: 'revealTime' as const, icon: Sparkles, color: 'text-emerald-500' },
              { label: 'Transition', key: 'transitionTime' as const, icon: Zap, color: 'text-purple-500' },
            ]).map(({ label, key, icon: Icon, color }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={globalConfig[key]}
                  onChange={(e) => setGlobalConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ Main Layout ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ─── Left: Card Library ─── */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm flex flex-col max-h-[75vh]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">Saved Cards</h2>
            {library.length > 0 && (
              <button
                onClick={addAllToTimeline}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Add All
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {library.map((q) => {
              const inTimeline = timeline.some(t => t.question.id === q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => addToTimeline(q)}
                  disabled={inTimeline}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    inTimeline
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-400 cursor-default'
                      : 'bg-slate-50 border border-transparent hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="font-semibold line-clamp-2 text-slate-700">
                    {inTimeline && <span className="text-indigo-400 mr-1">✓</span>}
                    {q.question}
                  </div>
                </button>
              );
            })}
            {library.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-10">
                No saved cards yet.<br />Create cards first!
              </div>
            )}
          </div>
        </div>

        {/* ─── Center: Timeline ─── */}
        <div className="lg:col-span-5 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm flex flex-col max-h-[75vh]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">Video Timeline</h2>
            {timeline.length > 0 && (
              <button
                onClick={() => { setTimeline([]); setPreviewIdx(null); setVideoUrl(null); }}
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {timeline.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-16 flex flex-col items-center gap-3">
                <Play className="w-10 h-10 opacity-30" />
                <span>Select cards from the library<br />to build your video timeline</span>
              </div>
            ) : (
              timeline.map((item, idx) => (
                <div
                  key={`${item.question.id}-${idx}`}
                  onClick={() => { setPreviewIdx(idx); setPreviewPhase('question'); }}
                  className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    previewIdx === idx
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {/* Top row: number + question + controls */}
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center gap-0.5 pt-0.5">
                      <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 'up'); }} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20" disabled={idx === 0}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 'down'); }} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20" disabled={idx === timeline.length - 1}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.question.question}</p>

                      {/* Per-question timing controls */}
                      <div className="flex items-center gap-3 mt-2 text-[11px]">
                        <label className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3 h-3 text-blue-400" />
                          <input
                            type="number" min={1} max={20} step={0.5}
                            value={item.readTime}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItemTiming(idx, 'readTime', parseFloat(e.target.value) || 1)}
                            className="w-10 px-1 py-0.5 rounded border border-slate-200 text-center font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />s
                        </label>
                        <label className="flex items-center gap-1 text-slate-500">
                          <Timer className="w-3 h-3 text-amber-400" />
                          <input
                            type="number" min={1} max={30} step={0.5}
                            value={item.timerTime}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItemTiming(idx, 'timerTime', parseFloat(e.target.value) || 1)}
                            className="w-10 px-1 py-0.5 rounded border border-slate-200 text-center font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />s
                        </label>
                        <label className="flex items-center gap-1 text-slate-500">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <input
                            type="number" min={1} max={20} step={0.5}
                            value={item.revealTime}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateItemTiming(idx, 'revealTime', parseFloat(e.target.value) || 1)}
                            className="w-10 px-1 py-0.5 rounded border border-slate-200 text-center font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />s
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromTimeline(idx); }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleGenerate}
              disabled={isRendering || timeline.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all text-sm ${
                isRendering
                  ? 'bg-indigo-400 cursor-wait'
                  : timeline.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-indigo-600 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isRendering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {renderProgress}
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Generate Quiz Video
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isRendering && (
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${renderPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Preview + Download ─── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Preview */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-slate-800">Live Preview</h2>
              {previewIdx !== null && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewPhase('question')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${previewPhase === 'question' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                  >
                    Question
                  </button>
                  <button
                    onClick={() => setPreviewPhase('answer')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${previewPhase === 'answer' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Answer
                  </button>
                </div>
              )}
            </div>

            <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
                width={1920}
                height={1080}
              />
              {previewIdx === null && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  Select a question to preview
                </div>
              )}
            </div>

            {/* Quick navigate */}
            {timeline.length > 1 && previewIdx !== null && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setPreviewIdx(Math.max(0, previewIdx - 1))}
                  disabled={previewIdx === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold disabled:opacity-30 hover:bg-slate-200 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs font-mono text-slate-500">{previewIdx + 1} / {timeline.length}</span>
                <button
                  onClick={() => setPreviewIdx(Math.min(timeline.length - 1, previewIdx + 1))}
                  disabled={previewIdx === timeline.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold disabled:opacity-30 hover:bg-slate-200 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Video Output */}
          {videoUrl && (
            <div className="bg-white/70 backdrop-blur-xl border border-emerald-200/60 rounded-2xl shadow-sm p-4 animate-fade-in">
              <h2 className="font-bold text-sm text-emerald-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Video Ready!
              </h2>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl shadow-md border border-slate-200 mb-4"
              />
              <a
                href={videoUrl}
                download={`GK_Quiz_${Date.now()}.webm`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                Download Video (.webm)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
