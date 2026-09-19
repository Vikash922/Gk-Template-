import React, { useState, useRef } from 'react';
import { useEditor } from '../store/EditorContext';
import {
  Film,
  Type,
  Image as ImageIcon,
  Music,
  Smile,
  Wand2,
  Sparkles,
  Layers,
  HelpCircle,
  Plus,
  Upload,
  Clock,
  Volume2,
} from 'lucide-react';
import { Clip, TrackType, EffectType, TransitionType } from '../types';
import { BUILTIN_TEMPLATES, applyTemplateToProject } from '../engine/TemplateEngine';
import { readFileAsDataUrl } from '../../utils/image';
import { findCuratedAssetByQuery } from '../../constants/curatedImages';

export type LeftTab =
  | 'media'
  | 'text'
  | 'image'
  | 'audio'
  | 'stickers'
  | 'effects'
  | 'transitions'
  | 'templates'
  | 'gk';

export const LeftToolbar: React.FC = () => {
  const {
    project,
    currentTime,
    addClipToTrack,
    selectedClip,
    updateClip,
    updateProject,
  } = useEditor();

  const [activeTab, setActiveTab] = useState<LeftTab>('text');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to add a clip at current playhead
  const createAndAddClip = (
    type: TrackType,
    trackId: string,
    name: string,
    duration: number,
    clipData: Partial<Clip>
  ) => {
    const W = project.width;
    const H = project.height;

    const newClip: Clip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      trackId,
      type,
      name,
      startTime: currentTime,
      duration,
      x: W / 2,
      y: H / 2,
      width: Math.round(W * 0.75),
      height: 120,
      scale: 1,
      rotation: 0,
      opacity: 1,
      keyframes: [],
      effects: [],
      ...clipData,
    };

    addClipToTrack(trackId, newClip);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');

      if (isImage) {
        createAndAddClip('image', 'track_image', file.name, 4, {
          height: Math.round(project.height * 0.3),
          image: {
            src: dataUrl,
            mask: 'rounded',
            borderRadius: 16,
          },
        });
      } else if (isAudio) {
        createAndAddClip('audio', 'track_sfx', file.name, 5, {
          audio: {
            src: dataUrl,
            volume: 1.0,
          },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'gk' as LeftTab, label: 'GK Tools', icon: HelpCircle },
    { id: 'text' as LeftTab, label: 'Text', icon: Type },
    { id: 'image' as LeftTab, label: 'Images', icon: ImageIcon },
    { id: 'audio' as LeftTab, label: 'Audio', icon: Music },
    { id: 'stickers' as LeftTab, label: 'Stickers', icon: Smile },
    { id: 'effects' as LeftTab, label: 'Effects', icon: Wand2 },
    { id: 'transitions' as LeftTab, label: 'Transitions', icon: Layers },
    { id: 'templates' as LeftTab, label: 'Templates', icon: Sparkles },
    { id: 'media' as LeftTab, label: 'Media', icon: Film },
  ];

  return (
    <div className="flex h-full bg-[#11131a] border-r border-[#222634] shrink-0 z-20">
      {/* ── Icons Bar (Vertical Strip) ── */}
      <div className="w-16 bg-[#0e1017] border-r border-[#1e2230] flex flex-col items-center py-2 space-y-1 select-none shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (activeTab === item.id) setIsExpanded(!isExpanded);
                else {
                  setActiveTab(item.id);
                  setIsExpanded(true);
                }
              }}
              className={`w-13 py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-Drawer Panels ── */}
      {isExpanded && (
        <div className="w-64 sm:w-72 bg-[#12151f] flex flex-col h-full border-r border-[#222634] overflow-y-auto p-3 text-xs select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#23283a]">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-slate-500 hover:text-white cursor-pointer px-1 text-sm"
            >
              ◀
            </button>
          </div>

          {/* ── TAB: GK TOOLS ── */}
          {activeTab === 'gk' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400">
                Click any GK quiz block below to drop it onto your timeline at playhead ({currentTime.toFixed(1)}s):
              </p>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_q', 'Hindi Question Box', 6, {
                    text: {
                      content: 'सवाल: भारत की राजधानी क्या है?',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 48,
                      fontWeight: '800',
                      color: '#ffffff',
                      gradient: ['#fbbf24', '#f59e0b', '#ef4444'],
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      backgroundPadding: 24,
                      backgroundRadius: 20,
                      strokeColor: '#000000',
                      strokeWidth: 3,
                      alignment: 'center',
                      inAnimation: 'slide',
                    },
                    y: project.height * 0.16,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#1a1f2e] hover:bg-[#232a3d] border border-[#2e374f] text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-amber-400 block">+ Question Banner Box</span>
                <span className="text-[10px] text-slate-400">Centered Devanagari question card</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_opts', 'Option A Box', 5, {
                    text: {
                      content: '(A) नई दिल्ली',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 38,
                      fontWeight: '700',
                      color: '#ffffff',
                      backgroundColor: 'rgba(30, 41, 59, 0.92)',
                      backgroundPadding: 16,
                      backgroundRadius: 16,
                      alignment: 'left',
                      inAnimation: 'pop',
                    },
                    y: project.height * 0.54,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#1a1f2e] hover:bg-[#232a3d] border border-[#2e374f] text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-blue-400 block">+ Option (A-D) Card</span>
                <span className="text-[10px] text-slate-400">Pill box option answer</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('sticker', 'track_timer', '5s Countdown Timer', 5, {
                    width: 140,
                    height: 140,
                    x: project.width * 0.82,
                    y: project.height * 0.46,
                    gkRole: 'timer',
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#1a1f2e] hover:bg-[#232a3d] border border-[#2e374f] text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-emerald-400 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ 5s Circular Timer</span>
                </span>
                <span className="text-[10px] text-slate-400">Split blue/red ring countdown</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('audio', 'track_sfx', 'Answer Chime', 1.5, {
                    audio: {
                      volume: 0.9,
                      isSfx: true,
                      sfxType: 'correctDing',
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#1a1f2e] hover:bg-[#232a3d] border border-[#2e374f] text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-purple-400 block flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>+ Answer Reveal Ding</span>
                </span>
                <span className="text-[10px] text-slate-400">High pitch chime audio indicator</span>
              </button>
            </div>
          )}

          {/* ── TAB: TEXT ── */}
          {activeTab === 'text' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_q', 'Default Title', 4, {
                    text: {
                      content: 'Add Title Here',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 54,
                      fontWeight: '800',
                      color: '#ffffff',
                      alignment: 'center',
                      inAnimation: 'fade',
                    },
                  })
                }
                className="w-full p-3 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] text-center font-extrabold text-white text-base transition-colors cursor-pointer"
              >
                Add Heading
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_q', 'Gradient Subtitle', 4, {
                    text: {
                      content: 'Gradient Subtitle',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 42,
                      fontWeight: '700',
                      color: '#38bdf8',
                      gradient: ['#38bdf8', '#818cf8', '#c084fc'],
                      alignment: 'center',
                      inAnimation: 'zoom',
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] text-center font-bold text-indigo-400 text-sm transition-colors cursor-pointer"
              >
                Gradient Subtitle
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_q', 'Typewriter Text', 4, {
                    text: {
                      content: 'क्या आप जानते हैं?',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 44,
                      fontWeight: '800',
                      color: '#facc15',
                      alignment: 'center',
                      inAnimation: 'typewriter',
                      animationDuration: 1.5,
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] text-center font-mono text-amber-300 text-xs transition-colors cursor-pointer"
              >
                Typewriter Hindi
              </button>
            </div>
          )}

          {/* ── TAB: IMAGES & PNG ── */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Custom PNG</span>
              </button>

              <div className="text-[11px] font-bold text-slate-400 pt-1">Curated GK Clipart:</div>
              <div className="grid grid-cols-2 gap-2">
                {['history', 'science', 'geography', 'india', 'sports', 'space'].map((topic) => {
                  const asset = findCuratedAssetByQuery(topic);
                  return (
                    <div
                      key={topic}
                      onClick={() =>
                        createAndAddClip('image', 'track_image', `${topic} illustration`, 4, {
                          image: {
                            src: asset.svgDataUri,
                            mask: 'rounded',
                            borderRadius: 16,
                          },
                        })
                      }
                      className="p-2 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] flex flex-col items-center gap-1 cursor-pointer transition-colors"
                    >
                      <img src={asset.svgDataUri} alt={topic} className="w-12 h-12 object-contain" />
                      <span className="text-[10px] font-semibold text-slate-300 capitalize">{topic}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: AUDIO & SFX ── */}
          {activeTab === 'audio' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  createAndAddClip('audio', 'track_sfx', 'Clock Tick Loop', 5, {
                    audio: {
                      volume: 0.85,
                      isSfx: true,
                      sfxType: 'clockTick',
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] text-left flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-white block">Clock Tick (5s)</span>
                  <span className="text-[10px] text-slate-400">Authentic 1s periodic tick sound</span>
                </div>
                <Plus className="w-4 h-4 text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('audio', 'track_sfx', 'Correct Answer Ding', 1.5, {
                    audio: {
                      volume: 0.9,
                      isSfx: true,
                      sfxType: 'correctDing',
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] text-left flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-white block">Answer Chime</span>
                  <span className="text-[10px] text-slate-400">Celebration ding tone</span>
                </div>
                <Plus className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          )}

          {/* ── TAB: EFFECTS ── */}
          {activeTab === 'effects' && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 mb-1">
                {selectedClip
                  ? `Click to add effect to "${selectedClip.name}":`
                  : 'Select a clip on the timeline first to apply effects:'}
              </p>

              {(
                [
                  { type: 'shake', name: 'Camera Shake', desc: 'Dynamic impact shake' },
                  { type: 'glitch', name: 'Cyber Glitch', desc: 'Sci-fi horizontal slices' },
                  { type: 'flash', name: 'White Flash', desc: 'Rhythmic flash burst' },
                  { type: 'vignette', name: 'Dark Vignette', desc: 'Cinematic edge shadow' },
                  { type: 'blur', name: 'Gaussian Blur', desc: 'Soft focus blur' },
                ] as Array<{ type: EffectType; name: string; desc: string }>
              ).map((eff) => (
                <button
                  key={eff.type}
                  type="button"
                  disabled={!selectedClip}
                  onClick={() => {
                    if (!selectedClip) return;
                    const existing = selectedClip.effects || [];
                    updateClip(selectedClip.id, {
                      effects: [...existing, { type: eff.type, intensity: 0.7 }],
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] disabled:opacity-40 text-left flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">{eff.name}</span>
                    <span className="text-[10px] text-slate-400">{eff.desc}</span>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>
          )}

          {/* ── TAB: TRANSITIONS ── */}
          {activeTab === 'transitions' && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 mb-1">
                {selectedClip
                  ? `Assign In-Transition to "${selectedClip.name}":`
                  : 'Select a clip to add transition:'}
              </p>

              {(
                [
                  { type: 'fade', label: 'Cross Fade' },
                  { type: 'slideLeft', label: 'Slide from Left' },
                  { type: 'slideRight', label: 'Slide from Right' },
                  { type: 'slideUp', label: 'Slide from Bottom' },
                  { type: 'zoom', label: 'Zoom Pop' },
                  { type: 'wipe', label: 'Horizontal Wipe' },
                  { type: 'blur', label: 'Blur Dissolve' },
                ] as Array<{ type: TransitionType; label: string }>
              ).map((t) => (
                <button
                  key={t.type}
                  type="button"
                  disabled={!selectedClip}
                  onClick={() => {
                    if (!selectedClip) return;
                    updateClip(selectedClip.id, {
                      inTransition: { type: t.type, duration: 0.5 },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#23293a] border border-[#293044] disabled:opacity-40 text-left flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-white">{t.label}</span>
                  <Plus className="w-4 h-4 text-blue-400" />
                </button>
              ))}
            </div>
          )}

          {/* ── TAB: TEMPLATES ── */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400">
                1-Click Apply GK Video Template to all questions:
              </p>

              {BUILTIN_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-3 rounded-xl bg-[#181c28] border border-[#293044] space-y-2"
                >
                  <span className="font-bold text-white text-xs block">{tmpl.name}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{tmpl.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      updateProject((prev) => applyTemplateToProject(prev, tmpl));
                      alert(`Applied "${tmpl.name}" to all timeline clips!`);
                    }}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Apply to Timeline
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
