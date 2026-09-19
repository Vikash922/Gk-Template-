import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  Play,
  Filter,
  FolderOpen,
  Video as VideoIcon,
  CheckCircle,
} from 'lucide-react';
import { Clip, TrackType, EffectType, TransitionType, MediaAsset, SfxType } from '../types';
import { BUILTIN_TEMPLATES, applyTemplateToProject } from '../engine/TemplateEngine';
import { readFileAsDataUrl } from '../../utils/image';
import { findCuratedAssetByQuery } from '../../constants/curatedImages';
import { projectStore } from '../store/ProjectStore';
import { playSfx } from '../engine/SoundFX';

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

  const [activeTab, setActiveTab] = useState<LeftTab>('gk');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    projectStore.getAllMediaAssets().then((assets) => {
      if (assets && assets.length > 0) {
        setMediaAssets(assets);
      }
    });
  }, []);

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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    for (const file of fileList) {
      try {
        // Prevent duplicates by checking if file with same name and size is already present
        const alreadyExists = mediaAssets.some(
          (a) => a.name === file.name && a.fileSize === file.size
        );
        if (alreadyExists) continue;

        const dataUrl = await readFileAsDataUrl(file);
        let type: 'image' | 'video' | 'audio' = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        const newAsset: MediaAsset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type,
          dataUrl,
          fileSize: file.size,
          createdAt: Date.now(),
        };

        await projectStore.saveMediaAsset(newAsset);
        setMediaAssets((prev) => {
          if (prev.some((a) => a.name === file.name && a.fileSize === file.size)) return prev;
          return [newAsset, ...prev];
        });
      } catch (err) {
        console.error('Failed to import file:', err);
      }
    }
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleDeleteMediaAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await projectStore.deleteMediaAsset(id);
    setMediaAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAllMedia = async () => {
    if (window.confirm('Delete all imported media files from bin?')) {
      await projectStore.clearAllMediaAssets();
      setMediaAssets([]);
    }
  };

  const addAssetToTimeline = (asset: MediaAsset) => {
    if (asset.type === 'image') {
      createAndAddClip('image', 'track_image', asset.name, 4, {
        height: Math.round(project.height * 0.35),
        image: {
          src: asset.dataUrl,
          mask: 'rounded',
          borderRadius: 16,
        },
      });
    } else if (asset.type === 'video') {
      createAndAddClip('video', 'track_video', asset.name, 6, {
        video: {
          src: asset.dataUrl,
          volume: 1.0,
          speed: 1.0,
        },
      });
    } else if (asset.type === 'audio') {
      createAndAddClip('audio', 'track_sfx', asset.name, 5, {
        audio: {
          src: asset.dataUrl,
          volume: 1.0,
        },
      });
    }
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
    { id: 'media' as LeftTab, label: 'Media Bin', icon: Film },
    { id: 'text' as LeftTab, label: 'Text', icon: Type },
    { id: 'image' as LeftTab, label: 'Images', icon: ImageIcon },
    { id: 'audio' as LeftTab, label: 'Audio & SFX', icon: Music },
    { id: 'stickers' as LeftTab, label: 'Stickers', icon: Smile },
    { id: 'effects' as LeftTab, label: 'Effects', icon: Wand2 },
    { id: 'transitions' as LeftTab, label: 'Transitions', icon: Layers },
    { id: 'templates' as LeftTab, label: 'Templates', icon: Sparkles },
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
        <div className="flex-1 md:w-64 lg:w-72 bg-[#12151f] flex flex-col h-full border-r border-[#222634] overflow-y-auto p-3 text-xs select-none">
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
                  createAndAddClip('text', 'track_opt_a', 'Option A Box', 5, {
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

          {/* ── TAB: MEDIA BIN (Device Gallery Import & Library) ── */}
          {activeTab === 'media' && (
            <div className="space-y-3">
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleGalleryUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-98"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Import from Gallery / Device</span>
              </button>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161925] border border-[#23293c]">
                {(['all', 'image', 'video', 'audio'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMediaFilter(filter)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize transition-colors cursor-pointer ${
                      mediaFilter === filter
                        ? 'bg-[#242b3e] text-blue-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Assets list */}
              {mediaAssets.filter((a) => mediaFilter === 'all' || a.type === mediaFilter).length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#283146] text-center space-y-2 bg-[#141723]/50">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-300">Your Media Bin is empty</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Click above to import photos, videos, or music from your device storage or photo gallery to use anywhere in your video.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pb-1">
                    <span>Imported Media ({mediaAssets.length})</span>
                    <button
                      type="button"
                      onClick={handleClearAllMedia}
                      className="text-red-400 hover:text-red-300 hover:underline font-bold cursor-pointer transition-colors"
                      title="Delete all media from storage"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {mediaAssets
                      .filter((a) => mediaFilter === 'all' || a.type === mediaFilter)
                      .map((asset) => (
                        <div
                          key={asset.id}
                          className="p-2 rounded-xl bg-[#181c28] hover:bg-[#202636] border border-[#283044] flex items-center gap-2.5 transition-all group"
                        >
                          {/* Thumbnail / Icon */}
                          <div className="w-12 h-12 rounded-lg bg-black/40 border border-[#2b3348] shrink-0 overflow-hidden flex items-center justify-center relative">
                            {asset.type === 'image' && (
                              <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
                            )}
                            {asset.type === 'video' && (
                              <video src={asset.dataUrl} className="w-full h-full object-cover" />
                            )}
                            {asset.type === 'audio' && (
                              <Music className="w-5 h-5 text-purple-400" />
                            )}
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[7px] font-bold uppercase bg-black/70 text-slate-200">
                              {asset.type.substring(0, 3)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate text-[11px]" title={asset.name}>
                              {asset.name}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Local Media'}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => addAssetToTimeline(asset)}
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                              title="Add to Timeline at playhead"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteMediaAsset(asset.id, e)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-600/30 bg-red-500/10 sm:bg-transparent border border-red-500/20 sm:border-transparent sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-all cursor-pointer"
                              title="Delete from bin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
            <div className="space-y-3">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await readFileAsDataUrl(file);
                    createAndAddClip('audio', 'track_sfx', file.name, 6, {
                      audio: { src: dataUrl, volume: 1.0 },
                    });
                  } catch (err) {
                    console.error(err);
                  }
                  if (audioInputRef.current) audioInputRef.current.value = '';
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
              >
                <Music className="w-4 h-4" />
                <span>Upload Custom Audio / Music</span>
              </button>

              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Interactive Sound FX Board:
                </span>

                <div className="space-y-2">
                  {[
                    { type: 'clockTick' as SfxType, label: 'Clock Tick (5s)', desc: 'Mechanical ticking loop', dur: 5 },
                    { type: 'correctDing' as SfxType, label: 'Correct Bell Chime', desc: 'Double celebratory chime', dur: 1.5 },
                    { type: 'timeoutBuzzer' as SfxType, label: 'Timeout Buzzer', desc: 'Game show buzzer sound', dur: 0.8 },
                    { type: 'pop' as SfxType, label: 'Snappy Pop', desc: 'Snappy scale-up pop', dur: 0.2 },
                    { type: 'whoosh' as SfxType, label: 'Whoosh Sweep', desc: 'Noise wind sweep transition', dur: 0.35 },
                    { type: 'tadaFanfare' as SfxType, label: 'Tada Fanfare', desc: '4-note victory fanfare', dur: 1.2 },
                    { type: 'drumroll' as SfxType, label: 'Drumroll Sweep', desc: '12-strike drumroll crescendo', dur: 1.0 },
                    { type: 'laser' as SfxType, label: 'Laser Zap', desc: 'Futuristic laser zap', dur: 0.3 },
                  ].map((sfx) => (
                    <div
                      key={sfx.type}
                      className="p-2.5 rounded-xl bg-[#181c28] hover:bg-[#202636] border border-[#283044] flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block text-[11px] truncate">{sfx.label}</span>
                        <span className="text-[9px] text-slate-400">{sfx.desc}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => playSfx(sfx.type)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                          title="Preview sound"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            createAndAddClip('audio', 'track_sfx', sfx.label, sfx.dur, {
                              audio: { volume: 0.9, isSfx: true, sfxType: sfx.type },
                            })
                          }
                          className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          title="Add to Track"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: STICKERS & BADGES ── */}
          {activeTab === 'stickers' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  createAndAddClip('sticker', 'track_timer', '5s Circular Timer', 5, {
                    width: 140,
                    height: 140,
                    x: project.width * 0.82,
                    y: project.height * 0.46,
                    gkRole: 'timer',
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-r-red-500 flex items-center justify-center font-bold text-amber-300 text-xs">
                    5
                  </div>
                  <div>
                    <span className="font-bold text-white block">5s Circular Split Timer</span>
                    <span className="text-[10px] text-slate-400">Blue/red split ring countdown</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_text_q', 'TIME OUT Stamp', 2, {
                    text: {
                      content: 'TIME OUT ⏰',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 52,
                      fontWeight: '900',
                      color: '#ffffff',
                      backgroundColor: 'rgba(220, 38, 38, 0.95)',
                      backgroundPadding: 16,
                      backgroundRadius: 18,
                      alignment: 'center',
                      inAnimation: 'pop',
                    },
                    y: project.height * 0.48,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-red-600 text-white font-black text-[10px]">
                    TIME OUT
                  </div>
                  <div>
                    <span className="font-bold text-white block">TIME OUT Stamp</span>
                    <span className="text-[10px] text-slate-400">Bold red timeout badge</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-red-400" />
              </button>

              <button
                type="button"
                onClick={() =>
                  createAndAddClip('text', 'track_timer', 'Correct Checkmark', 2.5, {
                    text: {
                      content: '✓ CORRECT ANSWER',
                      fontFamily: 'Noto Sans Devanagari',
                      fontSize: 40,
                      fontWeight: '900',
                      color: '#ffffff',
                      backgroundColor: 'rgba(16, 185, 129, 0.95)',
                      backgroundPadding: 16,
                      backgroundRadius: 16,
                      alignment: 'center',
                      inAnimation: 'zoom',
                    },
                    y: project.height * 0.48,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-white block">Correct Answer Badge</span>
                    <span className="text-[10px] text-slate-400">Green victory banner</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-emerald-400" />
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
                  { type: 'sepia', name: 'Vintage Sepia', desc: 'Warm classic tone' },
                  { type: 'invert', name: 'Color Invert', desc: 'Negative high-contrast' },
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
                  { type: 'flip3d', label: '3D Flip Card' },
                  { type: 'flashWhite', label: 'Flash White' },
                  { type: 'glitchCut', label: 'Glitch Cut' },
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
