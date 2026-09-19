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
  speakHindiText,
  generateVoiceoverScript,
} from '../utils/videoRenderer';
import { REFERENCE_DESIGN, BRIGHT_DESIGN, MINIMAL_DESIGN } from '../constants/referenceDesign';
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mic,
  Music,
  Smartphone,
  Monitor,
  MoveLeft,
  MoveRight,
  Copy,
  Volume2,
  SlidersHorizontal,
  CheckCircle2,
  Palette,
} from 'lucide-react';

type SelectedTrackType = 'video' | 'voiceover' | 'timer' | 'sfx';

interface VideoStudioProps {
  designConfig?: CardDesignConfig;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ designConfig: propDesignConfig }) => {
  // ─── Data State ───
  const [library, setLibrary] = useState<GKQuestion[]>([]);
  const [timeline, setTimeline] = useState<GKQuestion[]>([]);
  const [designConfig, setDesignConfig] = useState<CardDesignConfig>(propDesignConfig || REFERENCE_DESIGN);
  const [projectName, setProjectName] = useState('GK_Quiz_Episode_1');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Sync prop changes
  useEffect(() => {
    if (propDesignConfig) {
      setDesignConfig(propDesignConfig);
    }
  }, [propDesignConfig]);

  // ─── Selection on Timeline ───
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [selectedTrackType, setSelectedTrackType] = useState<SelectedTrackType>('video');

  // ─── Studio Config & Properties ───
  const [studioConfig, setStudioConfig] = useState<VideoStudioConfig>({ ...DEFAULT_STUDIO_CONFIG });
  const [leftNavTab, setLeftNavTab] = useState<'media' | 'theme' | 'voice' | 'audio' | 'overlay'>('media');

  // ─── Playback State ───
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
      const prepared = saved.map((q) => ({
        ...q,
        voiceoverScript: q.voiceoverScript || generateVoiceoverScript(q),
        voiceoverSpeed: q.voiceoverSpeed || 1.0,
      }));
      setTimeline(prepared);
    }
  }, []);

  const currentClip = timeline[activeClipIndex] || timeline[0];

  // ─── High Performance Canvas Painting ───
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

  // ─── Playback Simulation ───
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

    if (studioConfig.enableVoiceover) {
      const script = q.voiceoverScript || generateVoiceoverScript(q);
      speakHindiText(script, q.voiceoverSpeed || 1.0);
    }

    playheadTimerRef.current = setTimeout(() => {
      setPlayPhase('optA');
      playheadTimerRef.current = setTimeout(() => {
        setPlayPhase('optB');
        playheadTimerRef.current = setTimeout(() => {
          setPlayPhase('optC');
          playheadTimerRef.current = setTimeout(() => {
            setPlayPhase('optD');
            playheadTimerRef.current = setTimeout(() => {
              setPlayPhase('timer');
              setTimerDigit(cfg.timerTime);

              let sec = cfg.timerTime;
              const tickTimer = setInterval(() => {
                sec--;
                if (sec >= 1) {
                  setTimerDigit(sec);
                } else {
                  clearInterval(tickTimer);
                  setPlayPhase('timeout');
                  playheadTimerRef.current = setTimeout(() => {
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
      alert('Generated voiceover scripts for all timeline cards!');
    }, 300);
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
    1.0 +
    studioConfig.defaultQuestionConfig.revealTime;
  const totalDurationSec = Math.round(timeline.length * perClipSec);

  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-[1750px] mx-auto bg-slate-50 text-slate-900 select-none overflow-hidden border-x border-slate-200">
      {/* ─── Top Command Header (Clean & User-Friendly) ─── */}
      <div className="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <Film className="w-4 h-4 text-blue-600" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-36 sm:w-52"
            />
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                aspectRatio === '16:9' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="16:9 YouTube Landscape"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                aspectRatio === '9:16' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="9:16 Shorts / Reels Portrait"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-500 hidden md:inline">
            Total Length: <strong className="text-blue-600">{formatTimecode(totalDurationSec)}</strong> ({timeline.length} Cards)
          </span>

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isRendering || timeline.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ${
              isRendering
                ? 'bg-slate-300 text-slate-500 cursor-wait'
                : timeline.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isRendering ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting {renderPercent}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export Video (1080p)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Export Banner ─── */}
      {isRendering && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-xs font-semibold text-blue-800 shrink-0">
          <span>{renderProgress || 'Rendering video frames...'}</span>
          <span>{renderPercent}% Complete</span>
        </div>
      )}

      {exportedVideoUrl && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Video Rendered Successfully! 🎉</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={exportedVideoUrl}
              download={`${projectName}.webm`}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
            <button
              type="button"
              onClick={() => setExportedVideoUrl(null)}
              className="text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Center Viewport: Left Shelf | Monitor Player | Right Inspector ─── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ── Left Tool Shelf (Media, Voice, SFX, Brand) ── */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-0 shrink-0 hidden md:flex">
          {/* Tabs */}
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-1 flex items-center justify-around text-[11px] font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setLeftNavTab('media')}
              className={`flex-1 py-1.5 text-center rounded-md transition-colors cursor-pointer ${
                leftNavTab === 'media' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('theme')}
              className={`flex-1 py-1.5 text-center rounded-md transition-colors cursor-pointer ${
                leftNavTab === 'theme' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theme
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('voice')}
              className={`flex-1 py-1.5 text-center rounded-md transition-colors cursor-pointer ${
                leftNavTab === 'voice' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Voice
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('audio')}
              className={`flex-1 py-1.5 text-center rounded-md transition-colors cursor-pointer ${
                leftNavTab === 'audio' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audio
            </button>
            <button
              type="button"
              onClick={() => setLeftNavTab('overlay')}
              className={`flex-1 py-1.5 text-center rounded-md transition-colors cursor-pointer ${
                leftNavTab === 'overlay' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Logo
            </button>
          </div>

          {/* Shelf Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {leftNavTab === 'media' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
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
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {library.map((q) => (
                    <div
                      key={q.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{q.question}</p>
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
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftNavTab === 'theme' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Card Video Theme</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Choose a clean, normal, user-friendly theme for quiz cards in the video.
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDesignConfig({ ...REFERENCE_DESIGN })}
                      className={`w-full p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        designConfig.presetName === 'Reference GK'
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Reference GK</span>
                        {designConfig.presetName === 'Reference GK' && (
                          <span className="text-[10px] text-blue-600 font-bold">Active</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">Green Frame + Lime/Yellow Box</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDesignConfig({ ...MINIMAL_DESIGN })}
                      className={`w-full p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        designConfig.presetName === 'Minimal'
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Minimal Clean Light</span>
                        {designConfig.presetName === 'Minimal' && (
                          <span className="text-[10px] text-blue-600 font-bold">Active</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">Pure white, slim borders, soft light tone</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDesignConfig({ ...BRIGHT_DESIGN })}
                      className={`w-full p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        designConfig.presetName === 'Bright'
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Bright Sunshine</span>
                        {designConfig.presetName === 'Bright' && (
                          <span className="text-[10px] text-blue-600 font-bold">Active</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">Vibrant lime & sunny yellow</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {leftNavTab === 'voice' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Auto Voiceover Script</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Automatically generates natural Hindi voice narration for all questions and options.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoGenerateAllVoiceovers}
                    disabled={isGeneratingAllVoice || timeline.length === 0}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAllVoice ? 'Generating...' : 'Auto-Generate All Voices'}</span>
                  </button>
                </div>
              </div>
            )}

            {leftNavTab === 'audio' && (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 text-xs block">Sound Effects</span>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-700">Clock Tick (Countdown)</span>
                    <input
                      type="checkbox"
                      checked={studioConfig.enableSoundEffects}
                      onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-700">Answer Reveal Chime</span>
                    <input
                      type="checkbox"
                      checked={studioConfig.enableSoundEffects}
                      onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {leftNavTab === 'overlay' && (
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-[11px]">Channel Watermark / Title</label>
                <input
                  type="text"
                  value={studioConfig.channelWatermarkText || ''}
                  onChange={(e) => setStudioConfig({ ...studioConfig, channelWatermarkText: e.target.value })}
                  placeholder="e.g. Daily Knowledge"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Central Stage: Video Preview Monitor ── */}
        <div className="flex-1 flex flex-col bg-slate-100 min-h-0 border-r border-slate-200">
          {/* Stage Phase Quick Scrubbers */}
          <div className="h-10 px-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Preview Stage</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Card {timeline.length > 0 ? `${activeClipIndex + 1} of ${timeline.length}` : '0 of 0'}
              </span>
            </div>

            {/* Stage Phase Buttons */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPlayPhase('normal')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'normal' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optA')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'optA' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optB')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'optB' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optC')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'optC' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                C
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('optD')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'optD' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                D
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayPhase('timer');
                  setTimerDigit(5);
                }}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'timer' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('timeout')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'timeout' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Out
              </button>
              <button
                type="button"
                onClick={() => setPlayPhase('answer')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${playPhase === 'answer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Answer
              </button>
            </div>
          </div>

          {/* Canvas Viewport Screen */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
            <div
              className={`relative bg-white rounded-xl shadow-md overflow-hidden border border-slate-300 flex items-center justify-center ${
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 text-xs">
                  <Film className="w-8 h-8 opacity-40 text-blue-600" />
                  <span>Timeline is empty. Click "+ Add Card" below to start.</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Bar */}
          <div className="h-12 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectClipAndTrack(0, 'video')}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Go to Start"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-3 inline" />
              </button>

              <button
                type="button"
                onClick={() => selectClipAndTrack(Math.max(0, activeClipIndex - 1), 'video')}
                disabled={activeClipIndex === 0}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
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
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play Preview'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => selectClipAndTrack(Math.min(timeline.length - 1, activeClipIndex + 1), 'video')}
                disabled={activeClipIndex >= timeline.length - 1}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Next Clip"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="font-mono text-xs font-semibold text-slate-600">
              <span className="text-blue-600 font-bold">
                {formatTimecode(Math.round(activeClipIndex * perClipSec))}
              </span>
              <span className="text-slate-400"> / </span>
              <span>{formatTimecode(totalDurationSec)}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Property Inspector ── */}
        <div className="w-full lg:w-96 bg-white flex flex-col min-h-0 shrink-0 border-l border-slate-200">
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs font-bold shrink-0">
            <span className="text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              {selectedTrackType === 'video' && 'Card Question & Options'}
              {selectedTrackType === 'voiceover' && 'Voiceover Audio Script'}
              {selectedTrackType === 'timer' && 'Countdown Timer'}
              {selectedTrackType === 'sfx' && 'Audio Effects'}
            </span>
            <span className="text-[10px] text-slate-500">Card #{currentClip?.questionNumber || activeClipIndex + 1}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {currentClip ? (
              <>
                {/* ── Video Track Selected: Question & Options ── */}
                {selectedTrackType === 'video' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Question Text</label>
                      <textarea
                        rows={3}
                        value={currentClip.question}
                        onChange={(e) => updateCurrentClipField('question', e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 block">Options (Click letter to set correct answer)</label>
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const fieldName = `option${letter}` as keyof GKQuestion;
                        const isCorrect = (currentClip.correctAnswer || 'A') === letter;
                        return (
                          <div key={letter} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateCurrentClipField('correctAnswer', letter)}
                              className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title="Click to set as correct answer"
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={(currentClip[fieldName] as string) || ''}
                              onChange={(e) => updateCurrentClipField(fieldName, e.target.value)}
                              className={`flex-1 p-2 rounded-lg bg-white border text-xs text-slate-900 focus:outline-none ${
                                isCorrect ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 focus:border-blue-500'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <label className="font-bold text-slate-700 block">Card Image / PNG</label>
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
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-blue-600 font-bold rounded-lg text-center transition-colors cursor-pointer"
                        >
                          Choose PNG File
                        </button>
                        {currentClip.image && (
                          <button
                            type="button"
                            onClick={() => updateCurrentClipField('image', undefined)}
                            className="px-2.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
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
                      <label className="font-bold text-slate-700">Spoken Voiceover Script (Hindi/English)</label>
                      <button
                        type="button"
                        onClick={handleGenerateVoiceForCurrent}
                        className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={currentClip.voiceoverScript || ''}
                      onChange={(e) => updateCurrentClipField('voiceoverScript', e.target.value)}
                      placeholder="Enter voice narration script..."
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none leading-relaxed"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700">Voice Speed</span>
                        <span className="font-mono text-blue-600 font-bold">
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
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleTestListenVoice}
                      disabled={isPlayingVoicePreview}
                      className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isPlayingVoicePreview ? 'Speaking...' : 'Test / Listen Voice'}</span>
                    </button>
                  </div>
                )}

                {/* ── Timer Track Selected ── */}
                {selectedTrackType === 'timer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Countdown Duration</label>
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
                            className={`py-2 rounded-lg font-semibold border transition-colors cursor-pointer ${
                              studioConfig.defaultQuestionConfig.timerTime === t
                                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {t}s Timer
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                      <p className="font-bold text-slate-800">Split Ring Timer (1:1 Reference):</p>
                      <p>• Left Blue Arc + Right Red Arc with bold brown countdown number.</p>
                      <p>• Automatically flashes the "TIME OUT" badge at 0 seconds.</p>
                    </div>
                  </div>
                )}

                {/* ── SFX Track Selected ── */}
                {selectedTrackType === 'sfx' && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-800">Clock Tick Audio</span>
                      <input
                        type="checkbox"
                        checked={studioConfig.enableSoundEffects}
                        onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-800">Answer Reveal Ding Chime</span>
                      <input
                        type="checkbox"
                        checked={studioConfig.enableSoundEffects}
                        onChange={(e) => setStudioConfig({ ...studioConfig, enableSoundEffects: e.target.checked })}
                        className="accent-blue-600 w-4 h-4 rounded"
                      />
                    </label>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-400">
                No element selected on timeline.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom: TRUE MULTI-TRACK TIMELINE (Clean, Normal Light Theme) ─── */}
      <div className="h-52 bg-slate-100 border-t border-slate-200 flex flex-col shrink-0">
        {/* Timeline Tools Header */}
        <div className="h-10 px-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-blue-600" />
              Multi-Track Timeline
            </span>

            <button
              type="button"
              onClick={handleAddNewClip}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Card</span>
            </button>

            {currentClip && (
              <>
                <button
                  type="button"
                  onClick={() => handleDuplicateClip(activeClipIndex)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveClip(activeClipIndex, activeClipIndex - 1)}
                  disabled={activeClipIndex === 0}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Move Left"
                >
                  <MoveLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveClip(activeClipIndex, activeClipIndex + 1)}
                  disabled={activeClipIndex >= timeline.length - 1}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Move Right"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClip(activeClipIndex)}
                  className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
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
              className="text-[11px] text-purple-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Mic className="w-3 h-3" />
              <span>Auto-Voice All</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeline([])}
              className="text-[11px] text-red-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Multi-Track Scroller */}
        <div className="flex-1 overflow-x-auto p-2.5 flex flex-col gap-1.5 no-scrollbar bg-slate-100">
          {/* TRACK 1: Overlays & Timer Track */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-amber-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Timer className="w-3 h-3 text-amber-600" />
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
                      ? 'bg-amber-100 border-2 border-amber-500 text-amber-900'
                      : 'bg-amber-50/70 border border-amber-200 text-amber-800 hover:bg-amber-100/70'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>5s Countdown & Out</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-70">5.0s</span>
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Video Track (Cards) */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-blue-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Film className="w-3 h-3 text-blue-600" />
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
                      ? 'bg-blue-50 border-2 border-blue-600 shadow-sm'
                      : 'bg-white border border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="text-blue-600">Q{idx + 1}</span>
                      <span className="text-slate-600 font-normal truncate max-w-[90px]">{q.question}</span>
                    </span>
                    <span className="font-mono text-slate-500 text-[9px] bg-slate-100 px-1 rounded">
                      {perClipSec.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Ans: <strong className="text-emerald-600">{q.correctAnswer || 'A'}</strong></span>
                    {isClipActive && <span className="text-blue-600 font-bold">● Active</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Voiceover Audio Track (TTS) */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-purple-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Mic className="w-3 h-3 text-purple-600" />
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
                      ? 'bg-purple-100 border-2 border-purple-500 text-purple-900'
                      : 'bg-purple-50/70 border border-purple-200 text-purple-800 hover:bg-purple-100/70'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate max-w-[130px]">
                    <Mic className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{q.voiceoverScript ? 'Voiceover (Edit)' : '+ Add Script'}</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-70">
                    {(q.voiceoverSpeed || 1.0).toFixed(1)}x
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: Audio Sound FX Track */}
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-20 text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Music className="w-3 h-3 text-emerald-600" />
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
                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-900'
                      : 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Tick Tick + Ding</span>
                  </span>
                  <span className="text-[8px] opacity-70">Synced</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
