import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { getStoredQuestions } from '../services/storage';
import {
  generateExactQuizVideo,
  DEFAULT_STUDIO_CONFIG,
  VideoStudioConfig,
  drawReferenceTimer,
  drawReferenceTimeOutStamp,
  drawCenterWatermark,
  playClockTickSound,
  playAnswerDingSound,
  speakHindiText,
} from '../utils/videoRenderer';
import { REFERENCE_DESIGN } from '../constants/referenceDesign';
import { renderCardToCanvas } from '../utils/canvasRenderer';
import { readFileAsDataUrl } from '../utils/image';
import {
  Film,
  Play,
  Pause,
  Trash2,
  Download,
  Plus,
  Clock,
  Timer,
  Eye,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const VideoStudio: React.FC = () => {
  // ─── Data & Timeline ───
  const [library, setLibrary] = useState<GKQuestion[]>([]);
  const [timeline, setTimeline] = useState<GKQuestion[]>([]);
  const [designConfig] = useState<CardDesignConfig>(REFERENCE_DESIGN);

  // ─── Video Studio Settings ───
  const [studioConfig, setStudioConfig] = useState<VideoStudioConfig>({ ...DEFAULT_STUDIO_CONFIG });
  const [showSettings, setShowSettings] = useState(false);

  // ─── Render Progress ───
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState('');
  const [renderPercent, setRenderPercent] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ─── Manual Card Editor Modal ───
  const [editingCardIdx, setEditingCardIdx] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<GKQuestion | null>(null);
  const singleCardFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Live Interactive Preview Player ───
  const [previewIdx, setPreviewIdx] = useState<number>(0);
  const [previewPhase, setPreviewPhase] = useState<'normal' | 'optA' | 'optB' | 'optC' | 'optD' | 'timer' | 'timeout' | 'answer'>('normal');
  const [timerDigit, setTimerDigit] = useState<number>(5);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewTimerRef = useRef<any>(null);

  // ─── Load Stored Questions ───
  useEffect(() => {
    const saved = getStoredQuestions();
    setLibrary(saved);
    if (saved.length > 0 && timeline.length === 0) {
      setTimeline(saved); // Auto-load all saved cards for immediate 1-click video creation!
    }
  }, []);

  // ─── Canvas Preview Painter ───
  const updatePreviewCanvas = useCallback(async () => {
    const canvas = previewCanvasRef.current;
    const currentQ = timeline[previewIdx];
    if (!canvas || !currentQ) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let activeDashed: string | null = null;
    let isAnswer = false;

    if (previewPhase === 'optA') activeDashed = 'A';
    if (previewPhase === 'optB') activeDashed = 'B';
    if (previewPhase === 'optC') activeDashed = 'C';
    if (previewPhase === 'optD') activeDashed = 'D';
    if (previewPhase === 'answer') isAnswer = true;

    await renderCardToCanvas(canvas, currentQ, designConfig, 1920, 1080, isAnswer, activeDashed);

    // Overlay Watermark
    if (studioConfig.channelWatermarkText) {
      drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
    }

    // Overlay Timer or Timeout
    if (previewPhase === 'timer') {
      drawReferenceTimer(ctx, timerDigit);
    } else if (previewPhase === 'timeout') {
      drawReferenceTimeOutStamp(ctx);
    }
  }, [timeline, previewIdx, previewPhase, timerDigit, designConfig, studioConfig.channelWatermarkText]);

  useEffect(() => {
    updatePreviewCanvas();
  }, [updatePreviewCanvas]);

  // ─── Interactive Live Preview Simulation ───
  const stopPreviewPlayback = () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const playPreviewSequence = (qIdx: number = previewIdx) => {
    stopPreviewPlayback();
    if (!timeline[qIdx]) return;

    setIsPlayingPreview(true);
    setPreviewIdx(qIdx);

    // Step 1: Normal card
    setPreviewPhase('normal');

    previewTimerRef.current = setTimeout(() => {
      // Step 2: Option A dashed
      setPreviewPhase('optA');
      previewTimerRef.current = setTimeout(() => {
        // Step 3: Option B dashed
        setPreviewPhase('optB');
        previewTimerRef.current = setTimeout(() => {
          // Step 4: Option C dashed
          setPreviewPhase('optC');
          previewTimerRef.current = setTimeout(() => {
            // Step 5: Option D dashed
            setPreviewPhase('optD');
            previewTimerRef.current = setTimeout(() => {
              // Step 6: Timer countdown (5s)
              setPreviewPhase('timer');
              setTimerDigit(5);

              let sec = 5;
              const tickInterval = setInterval(() => {
                sec--;
                if (sec >= 1) {
                  setTimerDigit(sec);
                } else {
                  clearInterval(tickInterval);
                  // Step 7: TIME OUT
                  setPreviewPhase('timeout');
                  previewTimerRef.current = setTimeout(() => {
                    // Step 8: Correct Answer green highlight
                    setPreviewPhase('answer');
                    previewTimerRef.current = setTimeout(() => {
                      // Next question or loop
                      if (qIdx + 1 < timeline.length) {
                        playPreviewSequence(qIdx + 1);
                      } else {
                        stopPreviewPlayback();
                        setPreviewPhase('normal');
                      }
                    }, 2500);
                  }, 1000);
                }
              }, 1000);
            }, 1200);
          }, 1200);
        }, 1200);
      }, 1200);
    }, 2000);
  };

  // ─── Timeline Management ───
  const addToTimeline = (q: GKQuestion) => {
    setTimeline((prev) => [...prev, { ...q, id: `vid_${Date.now()}_${Math.random()}` }]);
  };

  const removeFromTimeline = (idx: number) => {
    setTimeline((prev) => prev.filter((_, i) => i !== idx));
    if (previewIdx >= timeline.length - 1) {
      setPreviewIdx(Math.max(0, timeline.length - 2));
    }
  };

  const moveItem = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= timeline.length) return;
    setTimeline((prev) => {
      const copy = [...prev];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
    setPreviewIdx(to);
  };

  // ─── Manual Card Edit ───
  const openCardEditor = (idx: number) => {
    setEditingCardIdx(idx);
    setEditingCard({ ...timeline[idx] });
  };

  const saveEditedCard = () => {
    if (editingCardIdx === null || !editingCard) return;
    setTimeline((prev) => {
      const updated = [...prev];
      updated[editingCardIdx] = editingCard;
      return updated;
    });
    setEditingCardIdx(null);
    setEditingCard(null);
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditingCard({
        ...editingCard,
        image: dataUrl,
        imageMode: 'upload',
      });
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  // ─── Generate Video (Exact Reference Output) ───
  const handleGenerateVideo = async () => {
    if (timeline.length === 0) {
      alert('Please add at least 1 question to the video timeline.');
      return;
    }

    stopPreviewPlayback();
    setIsRendering(true);
    setVideoUrl(null);
    setRenderPercent(0);

    try {
      const url = await generateExactQuizVideo(
        timeline,
        designConfig,
        studioConfig,
        (msg, pct) => {
          setRenderProgress(msg);
          setRenderPercent(pct);
        }
      );
      setVideoUrl(url);
    } catch (err) {
      console.error('Video Generation Error:', err);
      alert('Video generation failed. Please try with fewer cards or check console.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-2 pb-16">
      {/* ─── Top Control Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Quiz Video Studio
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                1:1 Reference Match
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Automatic animation with red dashed option borders, split timer, TIME OUT stamp & green reveal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              showSettings
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={isRendering || timeline.length === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
              isRendering
                ? 'bg-indigo-400 cursor-wait'
                : timeline.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isRendering ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Rendering... {renderPercent}%</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ Export Full Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Settings Drawer ─── */}
      {showSettings && (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Video Customization & Audio Settings
            </h3>
            <button
              type="button"
              onClick={() => setStudioConfig({ ...DEFAULT_STUDIO_CONFIG })}
              className="text-xs text-slate-400 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Channel Logo / Watermark Text</label>
              <input
                type="text"
                value={studioConfig.channelWatermarkText || ''}
                onChange={(e) => setStudioConfig({ ...studioConfig, channelWatermarkText: e.target.value })}
                placeholder="e.g. Daily Knowledge"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-400/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Option Read Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.6"
                  max="2.5"
                  step="0.1"
                  value={studioConfig.defaultQuestionConfig.optionTime}
                  onChange={(e) =>
                    setStudioConfig({
                      ...studioConfig,
                      defaultQuestionConfig: {
                        ...studioConfig.defaultQuestionConfig,
                        optionTime: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-xs font-bold text-slate-700 w-10">
                  {studioConfig.defaultQuestionConfig.optionTime}s
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Countdown Timer Seconds</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={studioConfig.defaultQuestionConfig.timerTime}
                  onChange={(e) =>
                    setStudioConfig({
                      ...studioConfig,
                      defaultQuestionConfig: {
                        ...studioConfig.defaultQuestionConfig,
                        timerTime: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-xs font-bold text-slate-700 w-10">
                  {studioConfig.defaultQuestionConfig.timerTime}s
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Audio & Sound FX</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studioConfig.enableSoundEffects}
                    onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Clock & Chime FX</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studioConfig.enableVoiceover}
                    onChange={(e) => setStudioConfig({ ...studioConfig, enableVoiceover: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Hindi Voiceover</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Render Progress Modal/Bar ─── */}
      {isRendering && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{renderProgress || 'Generating Video Frames...'}</span>
            <span>{renderPercent}% Complete</span>
          </div>
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300 rounded-full"
              style={{ width: `${renderPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Video Download Card ─── */}
      {videoUrl && (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Your Full Video is Ready! 🎉</h3>
              <p className="text-xs text-slate-600">
                Created with exact reference animations, timer, and answer highlight.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <a
              href={videoUrl}
              download={`GK_Quiz_Video_${Date.now()}.webm`}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4 / Video</span>
            </a>
          </div>
        </div>
      )}

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Interactive Preview Player & Timeline Track (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Player Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Live Stage Preview</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                  Question #{timeline[previewIdx]?.questionNumber || previewIdx + 1}
                </span>
              </div>

              {/* Phase Switcher Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setPreviewPhase('normal')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'normal' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('optA')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'optA' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Opt A
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('optB')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'optB' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Opt B
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('optC')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'optC' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Opt C
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('optD')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'optD' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Opt D
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPhase('timer');
                    setTimerDigit(5);
                  }}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'timer' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('timeout')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'timeout' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhase('answer')}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    previewPhase === 'answer' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Answer
                </button>
              </div>
            </div>

            {/* Canvas Screen */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-inner flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Player Controls Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlayingPreview) stopPreviewPlayback();
                    else playPreviewSequence(previewIdx);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingPreview ? 'Pause' : 'Play Simulation'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopPreviewPlayback();
                    setPreviewPhase('normal');
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Reset Stage"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Card Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopPreviewPlayback();
                    setPreviewIdx(Math.max(0, previewIdx - 1));
                  }}
                  disabled={previewIdx === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-xs font-bold text-slate-600">
                  {timeline.length > 0 ? `${previewIdx + 1} / ${timeline.length}` : '0 / 0'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    stopPreviewPlayback();
                    setPreviewIdx(Math.min(timeline.length - 1, previewIdx + 1));
                  }}
                  disabled={previewIdx >= timeline.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Sequence Track */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Timeline Sequence ({timeline.length} Cards)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimeline([])}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                  <p>Timeline is empty.</p>
                  <p>Click "Add" on any card from the right library to start your video!</p>
                </div>
              ) : (
                timeline.map((q, idx) => (
                  <div
                    key={`${q.id}-${idx}`}
                    onClick={() => {
                      stopPreviewPlayback();
                      setPreviewIdx(idx);
                      setPreviewPhase('normal');
                    }}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      previewIdx === idx
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="text-slate-300 hover:text-slate-700 disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-slate-400">{idx + 1}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(idx, 'down');
                          }}
                          disabled={idx === timeline.length - 1}
                          className="text-slate-300 hover:text-slate-700 disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Small Card Thumbnail / Clipart */}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {q.image ? (
                          <img src={q.image} alt="card" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{q.question}</p>
                        <p className="text-[10px] text-slate-500">
                          Answer: <span className="font-bold text-emerald-600">{q.correctAnswer || 'A'}</span> • Opt A: {q.optionA || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCardEditor(idx);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit question text, options & image"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromTimeline(idx);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove from video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Saved Cards Library & Manual Card Editor (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Editor (when a card is clicked for edit) */}
          {editingCard && (
            <div className="bg-white/95 backdrop-blur-xl border-2 border-indigo-500/80 rounded-2xl p-4 shadow-lg space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  Edit Card #{editingCardIdx !== null ? editingCardIdx + 1 : ''}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">Question Text</label>
                  <input
                    type="text"
                    value={editingCard.question}
                    onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Option A</label>
                    <input
                      type="text"
                      value={editingCard.optionA}
                      onChange={(e) => setEditingCard({ ...editingCard, optionA: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Option B</label>
                    <input
                      type="text"
                      value={editingCard.optionB}
                      onChange={(e) => setEditingCard({ ...editingCard, optionB: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Option C</label>
                    <input
                      type="text"
                      value={editingCard.optionC}
                      onChange={(e) => setEditingCard({ ...editingCard, optionC: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Option D</label>
                    <input
                      type="text"
                      value={editingCard.optionD}
                      onChange={(e) => setEditingCard({ ...editingCard, optionD: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Correct Answer</label>
                    <select
                      value={editingCard.correctAnswer || 'A'}
                      onChange={(e) => setEditingCard({ ...editingCard, correctAnswer: e.target.value as any })}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-emerald-700 bg-emerald-50"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Upload Custom PNG</label>
                    <input
                      ref={singleCardFileInputRef}
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={handleCustomImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => singleCardFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Choose PNG</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEditedCard}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cards Library Panel */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Saved Cards Library</h3>
                <p className="text-[11px] text-slate-500">Pick any card to add to the video</p>
              </div>
              {library.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTimeline([...library])}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Add All
                </button>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {library.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No cards saved yet. Go to Home or Batch to create cards!
                </div>
              ) : (
                library.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2">{q.question}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Answer: <span className="font-bold text-emerald-600">{q.correctAnswer || 'A'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToTimeline(q)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
