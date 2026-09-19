import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { getStoredQuestions, saveAllQuestionsToStorage } from '../services/storage';
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
  generateVoiceoverScript,
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
  Split,
  FolderOpen,
  Volume1,
  FileText,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

type SelectedTrackType = 'video' | 'voiceover' | 'timer' | 'sfx';

export const VideoStudio: React.FC = () => {
  // ─── Data State ───
  const [library, setLibrary] = useState<GKQuestion[]>([]);
  const [timeline, setTimeline] = useState<GKQuestion[]>([]);
  const [designConfig] = useState<CardDesignConfig>(REFERENCE_DESIGN);
  const [projectName, setProjectName] = useState('GK_Quiz_Episode_1');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // ─── Selection on the Timeline (CapCut Track Inspection) ───
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [selectedTrackType, setSelectedTrackType] = useState<SelectedTrackType>('video');

  // ─── Studio Config & Properties ───
  const [studioConfig, setStudioConfig] = useState<VideoStudioConfig>({ ...DEFAULT_STUDIO_CONFIG });
  const [leftNavTab, setLeftNavTab] = useState<'media' | 'voice' | 'audio' | 'overlay'>('media');

  // ─── Playback & Transport State ───
  const [playPhase, setPlayPhase] = useState<'normal' | 'optA' | 'optB' | 'optC' | 'optD' | 'timer' | 'timeout' | 'answer'>('normal');
  const [timerDigit, setTimerDigit] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playheadTimerRef = useRef<any>(null);

  // ─── Video Export State ───
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [renderPercent, setRenderPercent] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // ─── Voice Generation Feedback ───
  const [isGeneratingAllVoice, setIsGeneratingAllVoice] = useState<boolean>(false);
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState<boolean>(false);

  // ─── Canvas & File Input Refs ───
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Initial Load & Auto-populate Voiceover ───
  useEffect(() => {
    const saved = getStoredQuestions();
    setLibrary(saved);
    if (saved.length > 0 && timeline.length === 0) {
      // Initialize timeline cards with default voiceover scripts
      const prepared = saved.map((q) => ({
        ...q,
        voiceoverScript: q.voiceoverScript || generateVoiceoverScript(q),
        voiceoverSpeed: q.voiceoverSpeed || 1.0,
      }));
      setTimeline(prepared);
    }
  }, []);

  const currentClip = timeline[activeClipIndex] || timeline[0];

  // ─── High Performance Canvas Painting (0 Lag) ───
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

  // ─── Playback Engine (Timeline Playhead Simulation) ───
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

    const q = timeline[clipIdx];
    const cfg = studioConfig.defaultQuestionConfig;

    // Optional: Speak voiceover during playback if enabled
    if (studioConfig.enableVoiceover) {
      const script = q.voiceoverScript || generateVoiceoverScript(q);
      speakHindiText(script, q.voiceoverSpeed || 1.0);
    }

    // Phase 1: Card appears
    playheadTimerRef.current = setTimeout(() => {
      // Phase 2: Option A dashed
      setPlayPhase('optA');
      playheadTimerRef.current = setTimeout(() => {
        // Phase 3: Option B dashed
        setPlayPhase('optB');
        playheadTimerRef.current = setTimeout(() => {
          // Phase 4: Option C dashed
          setPlayPhase('optC');
          playheadTimerRef.current = setTimeout(() => {
            // Phase 5: Option D dashed
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

  // ─── Timeline Operations ───
  const selectClipAndTrack = (idx: number, track: SelectedTrackType) => {
    stopPlayback();
    setActiveClipIndex(idx);
    setSelectedTrackType(track);
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
      voiceoverScript: item.voiceoverScript || generateVoiceoverScript(item),
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
    const newNum = timeline.length + 1;
    const baseQ: GKQuestion = {
      id: `new_${Date.now()}`,
      questionNumber: newNum,
      question: 'नया प्रश्न यहाँ लिखें...',
      optionA: 'पहला विकल्प',
      optionB: 'दूसरा विकल्प',
      optionC: 'तीसरा विकल्प',
      optionD: 'चौथा विकल्प',
      correctAnswer: 'A',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    baseQ.voiceoverScript = generateVoiceoverScript(baseQ);
    baseQ.voiceoverSpeed = 1.0;

    setTimeline((prev) => [...prev, baseQ]);
    setActiveClipIndex(timeline.length);
    setSelectedTrackType('video');
  };

  const updateCurrentClipField = (field: keyof GKQuestion, value: any) => {
    if (!currentClip) return;
    setTimeline((prev) => {
      const copy = [...prev];
      copy[activeClipIndex] = { ...copy[activeClipIndex], [field]: value };
      return copy;
    });
  };

  // ─── Voiceover Tools ───
  const handleGenerateVoiceForCurrent = () => {
    if (!currentClip) return;
    const newScript = generateVoiceoverScript(currentClip);
    updateCurrentClipField('voiceoverScript', newScript);
  };

  const handleAutoGenerateAllVoiceovers = () => {
    setIsGeneratingAllVoice(true);
    setTimeline((prev) =>
      prev.map((q) => ({
        ...q,
        voiceoverScript: q.voiceoverScript || generateVoiceoverScript(q),
        voiceoverSpeed: q.voiceoverSpeed || 1.0,
      }))
    );
    setTimeout(() => {
      setIsGeneratingAllVoice(false);
      alert('Generated Hindi voiceover scripts for all timeline cards!');
    }, 400);
  };

  const handleTestListenVoice = async () => {
    if (!currentClip?.voiceoverScript) return;
    setIsPlayingVoicePreview(true);
    await speakHindiText(currentClip.voiceoverScript, currentClip.voiceoverSpeed || 1.0);
    setIsPlayingVoicePreview(false);
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
      alert('Video export failed. Please check browser capabilities.');
    } finally {
      setIsRendering(false);
    }
  };

  // Timing Calculation
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-[1750px] mx-auto bg-[#0e0e12] text-white select-none overflow-hidden">
      {/* ─── CapCut / VN Top Header Bar ─── */}
      <div className="h-12 bg-[#141419] border-b border-[#22222a] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#18181f] border border-[#262630] px-2.5 py-1 rounded-lg">
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-100 focus:outline-none w-36 sm:w-52"
            />
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-[#18181f] border border-[#262630] p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                aspectRatio === '16:9' ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
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
                aspectRatio === '9:16' ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
              title="9:16 Shorts / Reels Portrait"
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 hidden md:inline">
            Timeline: <strong className="text-blue-400">{formatTimecode(totalDurationSec)}</strong> ({timeline.length} Cards)
          </span>

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isRendering || timeline.length === 0}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ${
              isRendering
                ? 'bg-zinc-700 text-zinc-300 cursor-wait'
                : timeline.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
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

      {/* ─── Export Banner ─── */}
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
            <span>Video Render Complete! 🎉</span>
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

      {/* ─── Center Viewport: Left Asset Library | Monitor Player | Right CapCut Inspector ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ── Left CapCut Tool Shelf (Media, Voice, SFX, Overlays) ── */}
        <div className="w-64 bg-[#121216] border-r border-[#202028] flex flex-col min-h-0 shrink-0 hidden md:flex">
          {/* Tabs */}
          <div className="h-10 bg-[#16161c] border-b border-[#22222a] px-2 flex items-center justify-around text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setLeftNavTab('media')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                leftNavTab === 'media' ? 'bg-[#22222c] text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('voice')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                leftNavTab === 'voice' ? 'bg-[#22222c] text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voice
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('audio')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                leftNavTab === 'audio' ? 'bg-[#22222c] text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              SFX
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('overlay')}
              className={`flex-1 py-1.5 text-center rounded transition-colors ${
                leftNavTab === 'overlay' ? 'bg-[#22222c] text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Brand
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Tab: Media / Cards Library */}
            {leftNavTab === 'media' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Saved Cards ({library.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const prepared = library.map((q) => ({
                        ...q,
                        voiceoverScript: q.voiceoverScript || generateVoiceoverScript(q),
                      }));
                      setTimeline(prepared);
                    }}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    + Add All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {library.map((q) => (
                    <div
                      key={q.id}
                      className="p-2 rounded-lg bg-[#191920] border border-[#252530] hover:border-[#383846] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{q.question}</p>
                        <p className="text-[9px] text-slate-500">Ans: {q.correctAnswer || 'A'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newClip: GKQuestion = {
                            ...q,
                            voiceoverScript: q.voiceoverScript || generateVoiceoverScript(q),
                          };
                          setTimeline((prev) => [...prev, newClip]);
                        }}
                        className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-[10px] shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Voiceover Generator */}
            {leftNavTab === 'voice' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#191920] border border-[#262634] rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                    <Mic className="w-3.5 h-3.5" />
                    <span>AI Voiceover Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Auto-generates natural Hindi voice clips for every card directly onto your timeline.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoGenerateAllVoiceovers}
                    disabled={isGeneratingAllVoice || timeline.length === 0}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingAllVoice ? 'Generating...' : 'Auto-Generate All Voices'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Audio SFX */}
            {leftNavTab === 'audio' && (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#191920] border border-[#252530] rounded-lg space-y-2">
                  <span className="font-bold text-white text-xs block">Sound FX Library</span>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded bg-[#131318]">
                    <span className="text-[11px] text-slate-300">Clock Tick (Countdown)</span>
                    <input
                      type="checkbox"
                      checked={studioConfig.enableSoundEffects}
                      onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                      className="accent-cyan-400"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded bg-[#131318]">
                    <span className="text-[11px] text-slate-300">Success Chime (Answer)</span>
                    <input
                      type="checkbox"
                      checked={studioConfig.enableSoundEffects}
                      onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                      className="accent-cyan-400"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Brand & Watermark */}
            {leftNavTab === 'overlay' && (
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block text-[11px]">Channel Logo / Watermark</label>
                <input
                  type="text"
                  value={studioConfig.channelWatermarkText || ''}
                  onChange={(e) => setStudioConfig({ ...studioConfig, channelWatermarkText: e.target.value })}
                  placeholder="e.g. Daily Knowledge"
                  className="w-full p-2 bg-[#191920] border border-[#2b2b38] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Central Stage: Video Preview Monitor ── */}
        <div className="flex-1 flex flex-col bg-[#0b0b0e] min-h-0 border-r border-[#1e1e26]">
          {/* Stage Phase Quick Scrubbers */}
          <div className="h-9 px-3 bg-[#111116] border-b border-[#1e1e26] flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Player Monitor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e28] text-blue-400 font-bold">
                Clip {timeline.length > 0 ? `${activeClipIndex + 1}/${timeline.length}` : '0/0'}
              </span>
            </div>

            {/* Fast Stage Preview Buttons */}
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
                  <Film className="w-8 h-8 opacity-40 text-blue-400" />
                  <span>Timeline is empty. Click "+ Add Card" below to start.</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Bar */}
          <div className="h-11 bg-[#131318] border-t border-[#1e1e26] px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectClipAndTrack(0, 'video')}
                className="p-1 text-slate-400 hover:text-white"
                title="Go to Start"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-3 inline" />
              </button>

              <button
                type="button"
                onClick={() => selectClipAndTrack(Math.max(0, activeClipIndex - 1), 'video')}
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
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play Preview'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => selectClipAndTrack(Math.min(timeline.length - 1, activeClipIndex + 1), 'video')}
                disabled={activeClipIndex >= timeline.length - 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                title="Next Clip"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="font-mono text-xs font-bold text-slate-300">
              <span className="text-blue-400">
                {formatTimecode(Math.round(activeClipIndex * perClipSec))}
              </span>
              <span className="text-slate-600"> / </span>
              <span>{formatTimecode(totalDurationSec)}</span>
            </div>
          </div>
        </div>

        {/* ── Right: CapCut Property Inspector (Selected Track Elements) ── */}
        <div className="w-full lg:w-96 bg-[#131317] flex flex-col min-h-0 shrink-0 border-l border-[#202028]">
          <div className="h-10 bg-[#17171d] border-b border-[#23232e] px-4 flex items-center justify-between text-xs font-bold shrink-0">
            <span className="text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              {selectedTrackType === 'video' && 'Card Video Clip'}
              {selectedTrackType === 'voiceover' && 'Voiceover Audio Clip'}
              {selectedTrackType === 'timer' && 'Countdown Timer Clip'}
              {selectedTrackType === 'sfx' && 'Audio Effects Clip'}
            </span>
            <span className="text-[10px] text-slate-400">Q#{currentClip?.questionNumber || activeClipIndex + 1}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {currentClip ? (
              <>
                {/* ── Video Track Selected: Question & Options ── */}
                {selectedTrackType === 'video' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Question Text</label>
                      <textarea
                        rows={3}
                        value={currentClip.question}
                        onChange={(e) => updateCurrentClipField('question', e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-[#1a1a22] border border-[#2b2b38] text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-300 block">Options & Correct Answer</label>
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
                              title="Click to set as correct answer"
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={(currentClip[fieldName] as string) || ''}
                              onChange={(e) => updateCurrentClipField(fieldName, e.target.value)}
                              className={`flex-1 p-2 rounded-lg bg-[#1a1a22] border text-xs text-white focus:outline-none ${
                                isCorrect ? 'border-green-500/60' : 'border-[#2b2b38] focus:border-blue-500'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-[#22222d] space-y-2">
                      <label className="font-bold text-slate-300 block">Custom Subject PNG</label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 bg-[#1e1e28] hover:bg-[#252532] border border-[#2d2d3c] text-blue-400 font-bold rounded-lg text-center transition-colors"
                        >
                          Choose PNG File
                        </button>
                        {currentClip.image && (
                          <button
                            type="button"
                            onClick={() => updateCurrentClipField('image', undefined)}
                            className="px-2.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Voiceover Track Selected: Script Editor & Speed ── */}
                {selectedTrackType === 'voiceover' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">Spoken Voiceover Script (Hindi/English)</label>
                      <button
                        type="button"
                        onClick={handleGenerateVoiceForCurrent}
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        Reset to Default
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={currentClip.voiceoverScript || ''}
                      onChange={(e) => updateCurrentClipField('voiceoverScript', e.target.value)}
                      placeholder="Enter voice narration script..."
                      className="w-full p-2.5 rounded-lg bg-[#1a1a22] border border-[#2b2b38] text-white focus:border-blue-500 focus:outline-none leading-relaxed"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-300">Voice Speed</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {(currentClip.voiceoverSpeed || 1.0).toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.7"
                        max="1.4"
                        step="0.1"
                        value={currentClip.voiceoverSpeed || 1.0}
                        onChange={(e) => updateCurrentClipField('voiceoverSpeed', parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleTestListenVoice}
                      disabled={isPlayingVoicePreview}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingVoicePreview ? 'Speaking...' : 'Test / Listen Voice'}</span>
                    </button>
                  </div>
                )}

                {/* ── Timer Track Selected: Duration & Style ── */}
                {selectedTrackType === 'timer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Countdown Duration</label>
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
                            className={`py-2 rounded-lg font-bold border transition-colors ${
                              studioConfig.defaultQuestionConfig.timerTime === t
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-[#1a1a22] border-[#2b2b38] text-slate-400 hover:text-white'
                            }`}
                          >
                            {t}s Timer
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#181820] border border-[#252532] text-slate-400 text-[11px] space-y-1">
                      <p className="font-bold text-white">Split Ring Design (1:1 Reference):</p>
                      <p>• Left Blue Arc + Right Red Arc with bold brown digit.</p>
                      <p>• Automatically triggers "TIME OUT" badge at 0 seconds.</p>
                    </div>
                  </div>
                )}

                {/* ── SFX Track Selected: Sound Controls ── */}
                {selectedTrackType === 'sfx' && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#181820]">
                      <span className="font-bold text-slate-300">Clock Tick Audio</span>
                      <input
                        type="checkbox"
                        checked={studioConfig.enableSoundEffects}
                        onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                        className="accent-cyan-400 w-4 h-4 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-[#181820]">
                      <span className="font-bold text-slate-300">Answer Reveal Ding Chime</span>
                      <input
                        type="checkbox"
                        checked={studioConfig.enableSoundEffects}
                        onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                        className="accent-cyan-400 w-4 h-4 rounded"
                      />
                    </label>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-500">
                No element selected on timeline.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom: TRUE MULTI-TRACK TIMELINE (CapCut / VN Signature Layout) ─── */}
      <div className="h-52 bg-[#111115] border-t border-[#202028] flex flex-col shrink-0">
        {/* Timeline Tools Header */}
        <div className="h-9 px-4 bg-[#15151b] border-b border-[#202026] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Multi-Track Timeline
            </span>

            <button
              type="button"
              onClick={handleAddNewClip}
              className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Card</span>
            </button>

            {currentClip && (
              <>
                <button
                  type="button"
                  onClick={() => handleDuplicateClip(activeClipIndex)}
                  className="px-2 py-0.5 bg-[#1f1f28] hover:bg-[#282834] text-slate-300 rounded font-semibold text-[11px] flex items-center gap-1"
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
              onClick={handleAutoGenerateAllVoiceovers}
              className="text-[11px] text-purple-400 hover:underline font-bold flex items-center gap-1"
            >
              <Mic className="w-3 h-3" />
              <span>Auto-Voice All</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeline([])}
              className="text-[11px] text-red-400 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Multi-Track Canvas & Scroller */}
        <div className="flex-1 overflow-x-auto p-2.5 flex flex-col gap-1.5 no-scrollbar bg-[#0f0f13]">
          {/* TRACK 1: Overlays & Timer Track */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Timer className="w-3 h-3 text-amber-400" />
              <span>Timer</span>
            </div>

            {timeline.map((_, idx) => {
              const isClipActive = activeClipIndex === idx && selectedTrackType === 'timer';
              return (
                <div
                  key={idx}
                  onClick={() => selectClipAndTrack(idx, 'timer')}
                  className={`w-48 h-6 rounded px-2 flex items-center justify-between text-[10px] font-bold cursor-pointer transition-colors shrink-0 ${
                    isClipActive
                      ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                      : 'bg-[#1a1712] border border-[#2b2318] text-amber-400/80 hover:bg-[#241f17]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>5s Countdown & Out</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-60">5.0s</span>
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Video Track (Cards) */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-blue-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Film className="w-3 h-3 text-blue-400" />
              <span>Video</span>
            </div>

            {timeline.map((q, idx) => {
              const isClipActive = activeClipIndex === idx && selectedTrackType === 'video';
              return (
                <div
                  key={`${q.id}-${idx}`}
                  onClick={() => selectClipAndTrack(idx, 'video')}
                  className={`relative w-48 h-14 rounded-lg p-1.5 flex flex-col justify-between cursor-pointer transition-all shrink-0 ${
                    isClipActive
                      ? 'bg-[#1a2130] border-2 border-blue-500 shadow-sm'
                      : 'bg-[#181820] border border-[#262634] hover:bg-[#20202c]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-300 flex items-center gap-1">
                      <span>Q{idx + 1}</span>
                      <span className="text-slate-400 font-normal truncate max-w-[90px]">{q.question}</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[9px] bg-black/40 px-1 rounded">
                      {perClipSec.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Ans: <strong className="text-green-400">{q.correctAnswer || 'A'}</strong></span>
                    {isClipActive && <span className="text-blue-400 font-bold">● Active</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Voiceover Audio Track (TTS) */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-purple-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Mic className="w-3 h-3 text-purple-400" />
              <span>Voice</span>
            </div>

            {timeline.map((q, idx) => {
              const isClipActive = activeClipIndex === idx && selectedTrackType === 'voiceover';
              return (
                <div
                  key={idx}
                  onClick={() => selectClipAndTrack(idx, 'voiceover')}
                  className={`w-48 h-7 rounded px-2 flex items-center justify-between text-[10px] font-bold cursor-pointer transition-colors shrink-0 ${
                    isClipActive
                      ? 'bg-purple-600/30 border border-purple-400 text-purple-200'
                      : 'bg-[#191522] border border-[#2b223a] text-purple-400/90 hover:bg-[#221c30]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate max-w-[130px]">
                    <Mic className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{q.voiceoverScript ? 'Voiceover (Edit)' : '+ Add Script'}</span>
                  </span>
                  <span className="text-[9px] font-mono text-purple-400/60">
                    {(q.voiceoverSpeed || 1.0).toFixed(1)}x
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Audio Sound FX Track */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Music className="w-3 h-3 text-emerald-400" />
              <span>SFX</span>
            </div>

            {timeline.map((_, idx) => {
              const isClipActive = activeClipIndex === idx && selectedTrackType === 'sfx';
              return (
                <div
                  key={idx}
                  onClick={() => selectClipAndTrack(idx, 'sfx')}
                  className={`w-48 h-6 rounded px-2 flex items-center justify-between text-[9px] font-bold cursor-pointer transition-colors shrink-0 ${
                    isClipActive
                      ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
                      : 'bg-[#121c17] border border-[#1a2d24] text-emerald-400/80 hover:bg-[#182620]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Tick Tick + Ding</span>
                  </span>
                  <span className="text-[8px] opacity-60">Synced</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
