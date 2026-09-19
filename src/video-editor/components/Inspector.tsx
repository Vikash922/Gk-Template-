import React, { useState } from 'react';
import { useEditor } from '../store/EditorContext';
import {
  Sliders,
  Type,
  Image as ImageIcon,
  Music,
  Move,
  Key,
  Layers,
  Trash2,
  Copy,
  Split,
  Plus,
  Palette,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { KeyframeProperty, TextAnimationType, TransitionType } from '../types';
import { addOrUpdateKeyframe, removeKeyframe } from '../engine/KeyframeEngine';

export const Inspector: React.FC = () => {
  const {
    project,
    currentTime,
    selectedClip,
    selectedTrack,
    updateClip,
    deleteClip,
    duplicateClip,
    splitClipAtPlayhead,
    updateProject,
  } = useEditor();

  const [activeTab, setActiveTab] = useState<'content' | 'transform' | 'keyframes' | 'fx'>('content');

  if (!selectedClip) {
    return (
      <div className="w-full lg:w-80 bg-[#12151f] border-l border-[#222634] p-4 flex flex-col justify-between text-xs text-slate-300 select-none overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#242a3d]">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">Project Properties</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Canvas Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={project.backgroundColor || '#090d16'}
                onChange={(e) => updateProject((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-8 h-8 rounded border border-[#2d354b] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={project.backgroundColor || '#090d16'}
                onChange={(e) => updateProject((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                className="flex-1 p-2 rounded-lg bg-[#181c28] border border-[#2a3144] font-mono text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#283044]">
              <span className="text-[10px] text-slate-400 block">Resolution</span>
              <span className="font-bold text-white">{project.width}x{project.height}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#283044]">
              <span className="text-[10px] text-slate-400 block">Aspect Ratio</span>
              <span className="font-bold text-blue-400">{project.aspectRatio}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#283044]">
              <span className="text-[10px] text-slate-400 block">Duration</span>
              <span className="font-bold text-emerald-400">{project.duration.toFixed(1)}s</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#283044]">
              <span className="text-[10px] text-slate-400 block">Frame Rate</span>
              <span className="font-bold text-amber-400">{project.fps} FPS</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181c28] border border-[#283044] text-slate-400 text-[11px] leading-relaxed">
          <p className="font-bold text-slate-300 mb-1">Tip:</p>
          Select any element on the canvas or timeline clip below to edit text, fonts, colors, animations, and keyframes.
        </div>
      </div>
    );
  }

  const clipRelativeTime = Math.max(0, currentTime - selectedClip.startTime);

  const handleAddKeyframe = (property: KeyframeProperty, val: number) => {
    const updated = addOrUpdateKeyframe(selectedClip, property, clipRelativeTime, val, 'easeInOut');
    updateClip(selectedClip.id, { keyframes: updated.keyframes });
  };

  const handleRemoveKeyframe = (kfId: string) => {
    const updated = removeKeyframe(selectedClip, kfId);
    updateClip(selectedClip.id, { keyframes: updated.keyframes });
  };

  return (
    <div className="w-full lg:w-80 bg-[#12151f] border-l border-[#222634] flex flex-col h-full text-xs text-slate-300 select-none overflow-hidden z-20">
      {/* ── Top Bar with Name & Quick Actions ── */}
      <div className="p-3 border-b border-[#23293c] flex items-center justify-between gap-2 shrink-0 bg-[#0f1118]">
        <div className="min-w-0">
          <p className="font-bold text-white truncate text-xs">{selectedClip.name}</p>
          <p className="text-[10px] text-slate-400 capitalize">{selectedClip.type} Element</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => splitClipAtPlayhead(selectedClip.id)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer"
            title="Split at Playhead"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => duplicateClip(selectedClip.id)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer"
            title="Duplicate Clip"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteClip(selectedClip.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-md cursor-pointer"
            title="Delete Clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Sub Tabs ── */}
      <div className="h-9 bg-[#161a26] border-b border-[#242b3e] px-2 flex items-center justify-around text-[11px] font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
            activeTab === 'content' ? 'bg-[#212739] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transform')}
          className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
            activeTab === 'transform' ? 'bg-[#212739] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Transform
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keyframes')}
          className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
            activeTab === 'keyframes' ? 'bg-[#212739] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Keyframes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fx')}
          className={`flex-1 py-1 text-center rounded-md transition-colors cursor-pointer ${
            activeTab === 'fx' ? 'bg-[#212739] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          FX
        </button>
      </div>

      {/* ── Inspector Scroll Body ── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* TAB 1: CONTENT (TEXT / IMAGE / AUDIO) */}
        {activeTab === 'content' && (
          <div className="space-y-3.5">
            {/* TEXT ELEMENT */}
            {selectedClip.text && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Text Content</label>
                  <textarea
                    rows={3}
                    value={selectedClip.text.content}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        text: { ...selectedClip.text!, content: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#181c28] border border-[#2a3246] text-white focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Font Size</label>
                    <input
                      type="number"
                      value={selectedClip.text.fontSize}
                      onChange={(e) =>
                        updateClip(selectedClip.id, {
                          text: { ...selectedClip.text!, fontSize: parseInt(e.target.value, 10) || 30 },
                        })
                      }
                      className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Font Weight</label>
                    <select
                      value={selectedClip.text.fontWeight || '700'}
                      onChange={(e) =>
                        updateClip(selectedClip.id, {
                          text: { ...selectedClip.text!, fontWeight: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white text-xs"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>

                {/* Color & Background Box */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedClip.text.color || '#ffffff'}
                        onChange={(e) =>
                          updateClip(selectedClip.id, {
                            text: { ...selectedClip.text!, color: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border border-[#2a3246] bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-[10px] text-slate-300">{selectedClip.text.color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Box Fill</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedClip.text.backgroundColor || '#0f172a'}
                        onChange={(e) =>
                          updateClip(selectedClip.id, {
                            text: { ...selectedClip.text!, backgroundColor: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border border-[#2a3246] bg-transparent cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateClip(selectedClip.id, {
                            text: { ...selectedClip.text!, backgroundColor: undefined },
                          })
                        }
                        className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Animation */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Entrance Animation</label>
                  <select
                    value={selectedClip.text.inAnimation || 'none'}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        text: { ...selectedClip.text!, inAnimation: e.target.value as TextAnimationType },
                      })
                    }
                    className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white text-xs"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade In</option>
                    <option value="slide">Slide Up</option>
                    <option value="pop">Pop Scale</option>
                    <option value="bounce">Bounce</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="zoom">Zoom In</option>
                  </select>
                </div>
              </>
            )}

            {/* IMAGE ELEMENT */}
            {selectedClip.image && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Shape Mask</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['none', 'rounded', 'circle'] as const).map((mask) => (
                      <button
                        key={mask}
                        type="button"
                        onClick={() =>
                          updateClip(selectedClip.id, {
                            image: { ...selectedClip.image!, mask },
                          })
                        }
                        className={`p-1.5 rounded-lg border text-center font-semibold capitalize cursor-pointer ${
                          selectedClip.image!.mask === mask
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-[#181c28] border-[#293246] text-slate-400'
                        }`}
                      >
                        {mask}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Border Width</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={selectedClip.image.borderWidth || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        image: { ...selectedClip.image!, borderWidth: parseInt(e.target.value, 10) },
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </>
            )}

            {/* AUDIO / VOICEOVER ELEMENT */}
            {selectedClip.audio && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400">Volume</label>
                    <span className="font-mono text-blue-400 font-bold">
                      {Math.round((selectedClip.audio.volume ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedClip.audio.volume ?? 1}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        audio: { ...selectedClip.audio!, volume: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                {selectedClip.audio.synthText && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">TTS Voiceover Narration</label>
                    <textarea
                      rows={4}
                      value={selectedClip.audio.synthText}
                      onChange={(e) =>
                        updateClip(selectedClip.id, {
                          audio: { ...selectedClip.audio!, synthText: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white text-xs leading-relaxed"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: TRANSFORM (Position, Scale, Rotation, Opacity) */}
        {activeTab === 'transform' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pos X (px)</label>
                <input
                  type="number"
                  value={Math.round(selectedClip.x)}
                  onChange={(e) =>
                    updateClip(selectedClip.id, { x: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pos Y (px)</label>
                <input
                  type="number"
                  value={Math.round(selectedClip.y)}
                  onChange={(e) =>
                    updateClip(selectedClip.id, { y: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Scale</span>
                <span className="font-mono text-blue-400 font-bold">{selectedClip.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.05"
                value={selectedClip.scale}
                onChange={(e) =>
                  updateClip(selectedClip.id, { scale: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-amber-400 font-bold">{selectedClip.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedClip.rotation}
                onChange={(e) =>
                  updateClip(selectedClip.id, { rotation: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.round(selectedClip.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.opacity}
                onChange={(e) =>
                  updateClip(selectedClip.id, { opacity: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: KEYFRAMES */}
        {activeTab === 'keyframes' && (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400">
              Add animation keyframe at current clip time (<strong>{clipRelativeTime.toFixed(2)}s</strong>):
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleAddKeyframe('scale', selectedClip.scale)}
                className="p-2 rounded-lg bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] font-semibold text-blue-400 text-center cursor-pointer"
              >
                + Scale Keyframe
              </button>
              <button
                type="button"
                onClick={() => handleAddKeyframe('opacity', selectedClip.opacity)}
                className="p-2 rounded-lg bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] font-semibold text-emerald-400 text-center cursor-pointer"
              >
                + Opacity Keyframe
              </button>
              <button
                type="button"
                onClick={() => handleAddKeyframe('x', selectedClip.x)}
                className="p-2 rounded-lg bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] font-semibold text-purple-400 text-center cursor-pointer"
              >
                + X Pos Keyframe
              </button>
              <button
                type="button"
                onClick={() => handleAddKeyframe('rotation', selectedClip.rotation)}
                className="p-2 rounded-lg bg-[#181c28] hover:bg-[#222839] border border-[#2a3246] font-semibold text-amber-400 text-center cursor-pointer"
              >
                + Rotation Keyframe
              </button>
            </div>

            <div className="pt-2 border-t border-[#23293c]">
              <span className="text-[10px] font-bold text-slate-400 block mb-2">
                Active Keyframes ({selectedClip.keyframes.length}):
              </span>

              {selectedClip.keyframes.length === 0 ? (
                <span className="text-[10px] text-slate-500 italic">No keyframes added yet.</span>
              ) : (
                <div className="space-y-1.5">
                  {selectedClip.keyframes.map((kf) => (
                    <div
                      key={kf.id}
                      className="p-2 rounded-lg bg-[#181c28] border border-[#273044] flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-white capitalize">{kf.property}: </span>
                        <span className="font-mono text-blue-400">{kf.value} </span>
                        <span className="text-slate-500 font-mono text-[10px]">({kf.time.toFixed(1)}s)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyframe(kf.id)}
                        className="text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FX & TRANSITIONS */}
        {activeTab === 'fx' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">In-Transition</label>
              <select
                value={selectedClip.inTransition?.type || 'none'}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    inTransition: { type: e.target.value as TransitionType, duration: 0.5 },
                  })
                }
                className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white text-xs"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="slideUp">Slide Up</option>
                <option value="zoom">Zoom</option>
                <option value="wipe">Wipe</option>
                <option value="blur">Blur</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Out-Transition</label>
              <select
                value={selectedClip.outTransition?.type || 'none'}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    outTransition: { type: e.target.value as TransitionType, duration: 0.5 },
                  })
                }
                className="w-full p-2 rounded-lg bg-[#181c28] border border-[#2a3246] text-white text-xs"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="slideDown">Slide Down</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#23293c]">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                Applied Effects ({selectedClip.effects?.length || 0}):
              </span>
              {(selectedClip.effects || []).map((eff, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-[#181c28] border border-[#273044] flex items-center justify-between mb-1.5 text-[11px]"
                >
                  <span className="font-semibold text-white capitalize">{eff.type}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={eff.intensity}
                      onChange={(e) => {
                        const copy = [...selectedClip.effects];
                        copy[i] = { ...copy[i], intensity: parseFloat(e.target.value) };
                        updateClip(selectedClip.id, { effects: copy });
                      }}
                      className="w-20 accent-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = selectedClip.effects.filter((_, idx) => idx !== i);
                        updateClip(selectedClip.id, { effects: copy });
                      }}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
