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
  ChevronLeft,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Layers,
  Copy,
  Maximize2,
  Mic,
  Music,
  Check,
  Smartphone,
  Monitor,
  MoveLeft,
  MoveRight,
} from 'lucide-react';

export const VideoStudio: React.FC = () => {
  // ─── Project Data ───
  const [library, setLibrary] = useState<GKQuestion[]>([]);
  const [timeline, setTimeline] = useState<GKQuestion[]>([]);
  const [designConfig] = useState<CardDesignConfig>(REFERENCE_DESIGN);
  const [projectName, setProjectName] = useState('GK_Quiz_Episode_1');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // ─── Studio Configuration (CapCut / VN Options) ───
  const [studioConfig, setStudioConfig] = useState<VideoStudioConfig>({ ...DEFAULT_STUDIO_CONFIG });
  const [activeInspectorTab, setActiveInspectorTab] = useState<'content' | 'media' | 'audio' | 'settings'>('content');

  // ─── Playhead & Active Clip State ───
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [playPhase, setPlayPhase] = useState<'normal' | 'optA' | 'optB' | 'optC' | 'optD' | 'timer' | 'timeout' | 'answer'>('normal');
  const [timerDigit, setTimerDigit] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playheadTimerRef = useRef<any>(null);

  // ─── Render Export Progress ───
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [renderPercent, setRenderPercent] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // ─── Canvas Refs ───
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Initial Load ───
  useEffect(() => {
    const saved = getStoredQuestions();
    setLibrary(saved);
    if (saved.length > 0 && timeline.length === 0) {
      setTimeline(saved);
    }
  }, []);

  const currentClip = timeline[activeClipIndex] || timeline[0];

  // ─── High-Performance Canvas Render (No Lag) ───
  const renderCurrentFrame = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentClip) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let activeDashed: string | null = null;
    let isAnswer = false;

    if (playPhase === 'optA') activeDashed = 'A';
    if (playPhase === 'optB') activeDashed = 'B';
    if (playPhase === 'optC') activeDashed = 'C';
    if (playPhase === 'optD') activeDashed = 'D';
    if (playPhase === 'answer') isAnswer = true;

    await renderCardToCanvas(canvas, currentClip, designConfig, 1920, 1080, isAnswer, activeDashed);

    // Channel Watermark
    if (studioConfig.channelWatermarkText) {
      drawCenterWatermark(ctx, studioConfig.channelWatermarkText);
    }

    // Split Blue/Red Timer & Stamp
    if (playPhase === 'timer') {
      drawReferenceTimer(ctx, timerDigit);
    } else if (playPhase === 'timeout') {
      drawReferenceTimeOutStamp(ctx);
    }
  }, [currentClip, playPhase, timerDigit, designConfig, studioConfig.channelWatermarkText]);

  useEffect(() => {
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  // ─── Playback Engine (CapCut Simulation) ───
  const stopPlayback = () => {
    if (playheadTimerRef.current) {
      clearTimeout(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  const playSequenceFrom = (clipIdx: number = activeClipIndex) => {
    stopPlayback();
    if (!timeline[clipIdx]) return;

    setIsPlaying(true);
    setActiveClipIndex(clipIdx);
    setPlayPhase('normal');

    const cfg = studioConfig.defaultQuestionConfig;

    // Phase 1: Card appears & read question
    playheadTimerRef.current = setTimeout(() => {
      // Phase 2: Option A
      setPlayPhase('optA');
      playheadTimerRef.current = setTimeout(() => {
        // Phase 3: Option B
        setPlayPhase('optB');
        playheadTimerRef.current = setTimeout(() => {
          // Phase 4: Option C
          setPlayPhase('optC');
          playheadTimerRef.current = setTimeout(() => {
            // Phase 5: Option D
            setPlayPhase('optD');
            playheadTimerRef.current = setTimeout(() => {
              // Phase 6: Timer countdown
              setPlayPhase('timer');
              setTimerDigit(cfg.timerTime);

              let sec = cfg.timerTime;
              const tickTimer = setInterval(() => {
                sec--;
                if (sec >= 1) {
                  setTimerDigit(sec);
                } else {
                  clearInterval(tickTimer);
                  // Phase 7: TIME OUT
                  setPlayPhase('timeout');
                  playheadTimerRef.current = setTimeout(() => {
                    // Phase 8: Green Answer Reveal
                    setPlayPhase('answer');
                    playheadTimerRef.current = setTimeout(() => {
                      if (clipIdx + 1 < timeline.length) {
                        playSequenceFrom(clipIdx + 1);
                      } else {
                        stopPlayback();
                        setPlayPhase('normal');
                      }
                    }, cfg.revealTime * 1000);
                  }, 1000);
                }
              }, 1000);
            }, cfg.optionTime * 1000);
          }, cfg.optionTime * 1000);
        }, cfg.optionTime * 1000);
      }, cfg.optionTime * 1000);
    }, cfg.readTime * 1000);
  };

  // ─── Timeline Manipulation ───
  const handleSelectClip = (idx: number) => {
    stopPlayback();
    setActiveClipIndex(idx);
    setPlayPhase('normal');
  };

  const handleMoveClip = (from: number, to: number) => {
    if (to < 0 || to >= timeline.length) return;
    setTimeline((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
    setActiveClipIndex(to);
  };

  const handleDuplicateClip = (idx: number) => {
    const item = timeline[idx];
    if (!item) return;
    const duplicated: GKQuestion = {
      ...item,
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: (typeof item.questionNumber === 'number' ? item.questionNumber : parseInt(String(item.questionNumber), 10) || 1) + 1,
    };
    setTimeline((prev) => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
    setActiveClipIndex(idx + 1);
  };

  const handleDeleteClip = (idx: number) => {
    setTimeline((prev) => prev.filter((_, i) => i !== idx));
    if (activeClipIndex >= timeline.length - 1) {
      setActiveClipIndex(Math.max(0, timeline.length - 2));
    }
  };

  const handleAddNewClip = () => {
    const newQ: GKQuestion = {
      id: `new_${Date.now()}`,
      questionNumber: timeline.length + 1,
      question: 'नया प्रश्न यहाँ लिखें...',
      optionA: 'पहला विकल्प',
      optionB: 'दूसरा विकल्प',
      optionC: 'तीसरा विकल्प',
      optionD: 'चौथा विकल्प',
      correctAnswer: 'A',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTimeline((prev) => [...prev, newQ]);
    setActiveClipIndex(timeline.length);
  };

  const updateCurrentClipField = (field: keyof GKQuestion, value: any) => {
    if (!currentClip) return;
    setTimeline((prev) => {
      const copy = [...prev];
      copy[activeClipIndex] = { ...copy[activeClipIndex], [field]: value };
      return copy;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClip) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateCurrentClipField('image', dataUrl);
      updateCurrentClipField('imageMode', 'upload');
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Video Export ───
  const handleExportVideo = async () => {
    if (timeline.length === 0) {
      alert('Timeline is empty. Please add questions first.');
      return;
    }

    stopPlayback();
    setIsRendering(true);
    setExportedVideoUrl(null);
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
      setExportedVideoUrl(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Video export failed. Check browser capabilities.');
    } finally {
      setIsRendering(false);
    }
  };

  // Duration calculations
  const perClipSec =
    studioConfig.defaultQuestionConfig.readTime +
    studioConfig.defaultQuestionConfig.optionTime * 4 +
    studioConfig.defaultQuestionConfig.timerTime +
    1.0 + // Timeout stamp
    studioConfig.defaultQuestionConfig.revealTime;
  const totalDurationSec = Math.round(timeline.length * perClipSec);
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1700px] mx-auto bg-[#0d0d11] text-white select-none overflow-hidden">
      {/* ─── CapCut / VN Top Command Header ─── */}
      <div className="h-12 bg-[#141418] border-b border-[#23232b] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a22] border border-[#2b2b38] px-2.5 py-1 rounded-lg">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none w-36 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1a1a22] border border-[#2b2b38] p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                aspectRatio === '16:9' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="16:9 YouTube Landscape"
            >
              <Monitor className="w-3 h-3" />
              <span>16:9</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                aspectRatio === '9:16' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="9:16 Shorts / Reels Portrait"
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline">
            Total Duration: <strong className="text-cyan-400">{formatTimecode(totalDurationSec)}</strong> ({timeline.length} Clips)
          </span>

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isRendering || timeline.length === 0}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-black text-xs transition-all shadow-md active:scale-95 ${
              isRendering
                ? 'bg-slate-700 text-slate-300 cursor-wait'
                : timeline.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-500/20'
            }`}
          >
            {isRendering ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting {renderPercent}%</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[3]" />
                <span>Export Video (1080p)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Export Progress / Ready Banner ─── */}
      {isRendering && (
        <div className="bg-cyan-500/20 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between text-xs font-bold text-cyan-300 shrink-0">
          <span>{renderProgress || 'Rendering video frames...'}</span>
          <span>{renderPercent}% Complete</span>
        </div>
      )}

      {exportedVideoUrl && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Video Render Complete!</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={exportedVideoUrl}
              download={`${projectName}.webm`}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" />
              <span>Download File</span>
            </a>
            <button
              type="button"
              onClick={() => setExportedVideoUrl(null)}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Middle Section: Player Monitor & CapCut Property Inspector ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ── Left / Center: Video Monitor Player (CapCut Stage) ── */}
        <div className="flex-1 flex flex-col bg-[#0b0b0e] min-h-0 border-r border-[#1e1e26]">
          {/* Stage Header / Phase Indicators */}
          <div className="h-9 px-3 bg-[#111116] border-b border-[#1e1e26] flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Monitor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e28] text-cyan-400 font-bold">
                Clip {timeline.length > 0 ? `${activeClipIndex + 1}/${timeline.length}` : '0/0'}
              </span>
            </div>

            {/* Quick Preview Step Scrubbers */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPlayPhase('normal')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'normal' ? 'bg-white text-black' : 'hover:bg-[#202028]'}`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optA')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'optA' ? 'bg-red-500 text-white' : 'hover:bg-[#202028]'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optB')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'optB' ? 'bg-red-500 text-white' : 'hover:bg-[#202028]'}`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optC')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'optC' ? 'bg-red-500 text-white' : 'hover:bg-[#202028]'}`}
              >
                C
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optD')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'optD' ? 'bg-red-500 text-white' : 'hover:bg-[#202028]'}`}
              >
                D
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayPhase('timer');
                  setTimerDigit(5);
                }}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'timer' ? 'bg-amber-500 text-black' : 'hover:bg-[#202028]'}`}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('timeout')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'timeout' ? 'bg-red-600 text-white' : 'hover:bg-[#202028]'}`}
              >
                Out
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('answer')}
                className={`px-1.5 py-0.5 rounded transition-colors ${playPhase === 'answer' ? 'bg-green-500 text-black' : 'hover:bg-[#202028]'}`}
              >
                Answer
              </button>
            </div>
          </div>

          {/* Canvas Viewport Screen */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
            <div
              className={`relative bg-black rounded-lg shadow-2xl overflow-hidden border border-[#262633] flex items-center justify-center ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-full' : 'aspect-video w-full max-h-full max-w-4xl'
              }`}
            >
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
              />

              {timeline.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0d12] text-slate-500 text-xs">
                  <Film className="w-8 h-8 opacity-40 text-cyan-400" />
                  <span>Timeline is empty. Click "+ Add Card" below to start.</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Bar (Play/Pause, Step, Timecode) */}
          <div className="h-11 bg-[#131318] border-t border-[#1e1e26] px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectClip(0)}
                className="p-1 text-slate-400 hover:text-white"
                title="Go to Start"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-3 inline" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectClip(Math.max(0, activeClipIndex - 1))}
                disabled={activeClipIndex === 0}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                title="Previous Clip"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                type="button"
                onClick={() => {
                  if (isPlaying) stopPlayback();
                  else playSequenceFrom(activeClipIndex);
                }}
                className="w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-md active:scale-90 transition-transform"
                title={isPlaying ? 'Pause' : 'Play Preview'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectClip(Math.min(timeline.length - 1, activeClipIndex + 1))}
                disabled={activeClipIndex >= timeline.length - 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                title="Next Clip"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="font-mono text-xs font-bold text-slate-300">
              <span className="text-cyan-400">
                {formatTimecode(Math.round(activeClipIndex * perClipSec))}
              </span>
              <span className="text-slate-600"> / </span>
              <span>{formatTimecode(totalDurationSec)}</span>
            </div>
          </div>
        </div>

        {/* ── Right: CapCut Property Inspector (Edit Anything!) ── */}
        <div className="w-full lg:w-96 bg-[#131317] flex flex-col min-h-0 shrink-0 border-l border-[#202028]">
          {/* Inspector Tabs */}
          <div className="h-10 bg-[#17171d] border-b border-[#23232e] px-2 flex items-center justify-between text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveInspectorTab('content')}
              className={`flex-1 py-2 text-center rounded transition-colors ${
                activeInspectorTab === 'content' ? 'bg-[#252530] text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Text & Q
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab('media')}
              className={`flex-1 py-2 text-center rounded transition-colors ${
                activeInspectorTab === 'media' ? 'bg-[#252530] text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab('audio')}
              className={`flex-1 py-2 text-center rounded transition-colors ${
                activeInspectorTab === 'audio' ? 'bg-[#252530] text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Timing & FX
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab('settings')}
              className={`flex-1 py-2 text-center rounded transition-colors ${
                activeInspectorTab === 'settings' ? 'bg-[#252530] text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Brand
            </button>
          </div>

          {/* Inspector Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {currentClip ? (
              <>
                {/* ── TAB 1: Content (Question & Options) ── */}
                {activeInspectorTab === 'content' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-300">Question Text</label>
                        <span className="text-[10px] text-slate-500">#{currentClip.questionNumber || activeClipIndex + 1}</span>
                      </div>
                      <textarea
                        rows={3}
                        value={currentClip.question}
                        onChange={(e) => updateCurrentClipField('question', e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-[#1a1a22] border border-[#2b2b38] text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-300 block">Options A, B, C, D</label>
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const fieldName = `option${letter}` as keyof GKQuestion;
                        const isCorrect = (currentClip.correctAnswer || 'A') === letter;
                        return (
                          <div key={letter} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateCurrentClipField('correctAnswer', letter)}
                              className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                isCorrect
                                  ? 'bg-green-500 text-black shadow-sm'
                                  : 'bg-[#22222d] text-slate-400 hover:text-white border border-[#333342]'
                              }`}
                              title={isCorrect ? 'Correct Answer' : 'Click to set as correct answer'}
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={(currentClip[fieldName] as string) || ''}
                              onChange={(e) => updateCurrentClipField(fieldName, e.target.value)}
                              className={`flex-1 p-2 rounded-lg bg-[#1a1a22] border text-xs text-white focus:outline-none ${
                                isCorrect ? 'border-green-500/60' : 'border-[#2b2b38] focus:border-cyan-500'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TAB 2: Media & Image ── */}
                {activeInspectorTab === 'media' && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-2">Subject Image / PNG Clipart</label>
                      <div className="p-3 bg-[#181820] border border-[#282836] rounded-xl flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-black/40 border border-[#333344] overflow-hidden flex items-center justify-center shrink-0">
                          {currentClip.image ? (
                            <img src={currentClip.image} alt="card" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg font-bold text-xs transition-colors"
                          >
                            Upload Custom PNG
                          </button>
                          {currentClip.image && (
                            <button
                              type="button"
                              onClick={() => updateCurrentClipField('image', undefined)}
                              className="w-full py-1 px-3 text-slate-400 hover:text-red-400 text-[11px]"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* ── TAB 3: Timing & Audio (CapCut Presets) ── */}
                {activeInspectorTab === 'audio' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-300">Question Reading Time</span>
                        <span className="font-mono text-cyan-400 font-bold">{studioConfig.defaultQuestionConfig.readTime}s</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="0.5"
                        value={studioConfig.defaultQuestionConfig.readTime}
                        onChange={(e) =>
                          setStudioConfig({
                            ...studioConfig,
                            defaultQuestionConfig: {
                              ...studioConfig.defaultQuestionConfig,
                              readTime: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-300">Option Highlight Time</span>
                        <span className="font-mono text-cyan-400 font-bold">{studioConfig.defaultQuestionConfig.optionTime}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="3"
                        step="0.2"
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
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-300">Countdown Timer Seconds</span>
                        <span className="font-mono text-cyan-400 font-bold">{studioConfig.defaultQuestionConfig.timerTime}s</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 10].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setStudioConfig({
                                ...studioConfig,
                                defaultQuestionConfig: {
                                  ...studioConfig.defaultQuestionConfig,
                                  timerTime: t,
                                },
                              })
                            }
                            className={`py-1.5 rounded-lg font-bold border transition-colors ${
                              studioConfig.defaultQuestionConfig.timerTime === t
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-[#1a1a22] border-[#2b2b38] text-slate-400 hover:text-white'
                            }`}
                          >
                            {t} Seconds
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#23232f] space-y-2">
                      <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#191922]">
                        <span className="font-bold text-slate-300">Clock Tick & Ding SFX</span>
                        <input
                          type="checkbox"
                          checked={studioConfig.enableSoundEffects}
                          onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                          className="accent-cyan-400 w-4 h-4 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#191922]">
                        <span className="font-bold text-slate-300">Hindi Voiceover (TTS)</span>
                        <input
                          type="checkbox"
                          checked={studioConfig.enableVoiceover}
                          onChange={(e) => setStudioConfig({ ...studioConfig, enableVoiceover: e.target.checked })}
                          className="accent-cyan-400 w-4 h-4 rounded"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: Branding & Watermark ── */}
                {activeInspectorTab === 'settings' && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Center Channel Watermark</label>
                      <input
                        type="text"
                        value={studioConfig.channelWatermarkText || ''}
                        onChange={(e) => setStudioConfig({ ...studioConfig, channelWatermarkText: e.target.value })}
                        placeholder="e.g. Daily Knowledge"
                        className="w-full p-2.5 rounded-lg bg-[#1a1a22] border border-[#2b2b38] text-white focus:outline-none focus:border-cyan-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Displays in the center of the video between options and character.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-500">
                No clip selected. Select a clip from the timeline below.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom: Multi-Track Timeline (CapCut / VN Signature Layout) ─── */}
      <div className="h-44 bg-[#111115] border-t border-[#202028] flex flex-col shrink-0">
        {/* Timeline Header Bar / Tools */}
        <div className="h-9 px-4 bg-[#16161c] border-b border-[#22222a] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Timeline
            </span>

            <button
              type="button"
              onClick={handleAddNewClip}
              className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Card</span>
            </button>

            {currentClip && (
              <>
                <button
                  type="button"
                  onClick={() => handleDuplicateClip(activeClipIndex)}
                  className="px-2 py-0.5 bg-[#20202a] hover:bg-[#2a2a38] text-slate-300 rounded font-semibold text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveClip(activeClipIndex, activeClipIndex - 1)}
                  disabled={activeClipIndex === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                  title="Move Left"
                >
                  <MoveLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveClip(activeClipIndex, activeClipIndex + 1)}
                  disabled={activeClipIndex >= timeline.length - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                  title="Move Right"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClip(activeClipIndex)}
                  className="p-1 text-slate-400 hover:text-red-400"
                  title="Delete Clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const saved = getStoredQuestions();
                setTimeline(saved);
              }}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Sync Saved Cards
            </button>

            <button
              type="button"
              onClick={() => setTimeline([])}
              className="text-[11px] text-red-400 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Multi-Track Scroll Area */}
        <div className="flex-1 overflow-x-auto p-3 flex flex-col gap-2 no-scrollbar">
          {/* Track 1: Video Question Cards */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-16 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Film className="w-3 h-3 text-cyan-400" />
              <span>Video</span>
            </div>

            {timeline.map((q, idx) => {
              const isActive = activeClipIndex === idx;
              return (
                <div
                  key={`${q.id}-${idx}`}
                  onClick={() => handleSelectClip(idx)}
                  className={`relative w-44 h-16 rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-[#1a1a22] border border-[#2b2b38] hover:bg-[#22222d]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-cyan-300">
                      Q{idx + 1}
                    </span>
                    <span className="font-mono text-slate-400 text-[9px] bg-black/40 px-1 rounded">
                      {perClipSec.toFixed(1)}s
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-white line-clamp-1">
                    {q.question || 'Untitled'}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Ans: <strong className="text-green-400">{q.correctAnswer || 'A'}</strong></span>
                    {isActive && <span className="text-cyan-400 font-bold">● Active</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 2: Audio & SFX Track */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-16 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Music className="w-3 h-3 text-purple-400" />
              <span>Audio</span>
            </div>

            {timeline.map((_, idx) => (
              <div
                key={idx}
                className="w-44 h-6 rounded bg-[#161622] border border-[#262638] px-2 flex items-center justify-between text-[9px] text-purple-300 shrink-0"
              >
                <span className="flex items-center gap-1">
                  <Volume2 className="w-2.5 h-2.5" />
                  <span>Voiceover + Timer SFX</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
