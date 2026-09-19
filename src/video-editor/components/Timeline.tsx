import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditor } from '../store/EditorContext';
import {
  Scissors,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Film,
  Type,
  Image as ImageIcon,
  Music,
  Smile,
  Mic,
  Maximize2,
} from 'lucide-react';
import { Track, Clip, TrackType } from '../types';

export const Timeline: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    timelineZoom,
    setTimelineZoom,
    selection,
    selectClip,
    selectedClip,
    splitClipAtPlayhead,
    duplicateClip,
    deleteClip,
    trimClip,
    moveClip,
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackHide,
  } = useEditor();

  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headersScrollRef = useRef<HTMLDivElement>(null);
  const isScrubbingRulerRef = useRef<boolean>(false);

  const handleTimelineScroll = () => {
    if (scrollContainerRef.current && headersScrollRef.current) {
      headersScrollRef.current.scrollTop = scrollContainerRef.current.scrollTop;
    }
  };

  // Clip drag/trim refs
  const clipDragRef = useRef<{
    mode: 'move' | 'trim-start' | 'trim-end';
    clipId: string;
    trackId: string;
    initialMouseX: number;
    initialStartTime: number;
    initialDuration: number;
  } | null>(null);

  const totalWidth = Math.max(1200, (project.duration + 5) * timelineZoom);

  // Ruler Scrubbing
  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRulerRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleRulerPointerMove(e);
  };

  const handleRulerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRulerRef.current || !scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const clientX = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, clientX / timelineZoom);
    setCurrentTime(time);
  };

  const handleRulerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRulerRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Clip Interaction
  const handleClipPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    clip: Clip,
    track: Track,
    mode: 'move' | 'trim-start' | 'trim-end'
  ) => {
    e.stopPropagation();
    if (track.locked) return;

    selectClip(clip.id);
    clipDragRef.current = {
      mode,
      clipId: clip.id,
      trackId: track.id,
      initialMouseX: e.clientX,
      initialStartTime: clip.startTime,
      initialDuration: clip.duration,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleClipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!clipDragRef.current) return;

    const drag = clipDragRef.current;
    const deltaPx = e.clientX - drag.initialMouseX;
    const deltaTime = deltaPx / timelineZoom;

    if (drag.mode === 'move') {
      let newStart = Math.max(0, drag.initialStartTime + deltaTime);
      // Snap to current playhead if close
      if (snapEnabled && Math.abs(newStart - currentTime) < 0.15) {
        newStart = currentTime;
      }
      moveClip(drag.clipId, drag.trackId, newStart);
    } else if (drag.mode === 'trim-start') {
      const deltaStart = Math.min(drag.initialDuration - 0.2, deltaTime);
      const newStart = Math.max(0, drag.initialStartTime + deltaStart);
      const newDur = Math.max(0.2, drag.initialDuration - deltaStart);
      trimClip(drag.clipId, newStart, newDur);
    } else if (drag.mode === 'trim-end') {
      const newDur = Math.max(0.2, drag.initialDuration + deltaTime);
      trimClip(drag.clipId, drag.initialStartTime, newDur);
    }
  };

  const handleClipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    clipDragRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Fit timeline zoom
  const handleFitTimeline = () => {
    if (!scrollContainerRef.current) return;
    const containerW = scrollContainerRef.current.clientWidth - 50;
    const dur = Math.max(2, project.duration);
    const newZoom = Math.max(30, Math.min(250, containerW / dur));
    setTimelineZoom(Math.round(newZoom));
  };

  const getTrackColor = (type: TrackType) => {
    switch (type) {
      case 'video':
        return 'bg-blue-900/40 border-blue-600/70 text-blue-200';
      case 'text':
        return 'bg-amber-900/40 border-amber-600/70 text-amber-200';
      case 'image':
      case 'sticker':
        return 'bg-emerald-900/40 border-emerald-600/70 text-emerald-200';
      case 'audio':
        return 'bg-purple-900/40 border-purple-600/70 text-purple-200';
      case 'voiceover':
        return 'bg-pink-900/40 border-pink-600/70 text-pink-200';
      default:
        return 'bg-slate-800 border-slate-600 text-slate-300';
    }
  };

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'sticker':
        return <Smile className="w-3.5 h-3.5 text-teal-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'voiceover':
        return <Mic className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Generate ruler ticks (every 1 second)
  const rulerTicks = [];
  const maxSec = Math.ceil(project.duration + 5);
  for (let s = 0; s <= maxSec; s++) {
    rulerTicks.push(s);
  }

  return (
    <div className="h-64 sm:h-72 bg-[#0c0e14] border-t border-[#222634] flex flex-col shrink-0 select-none overflow-hidden z-20">
      {/* ── Timeline Action Bar ── */}
      <div className="h-9 bg-[#11131a] border-b border-[#212637] px-3 flex items-center justify-between text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Split */}
          <button
            type="button"
            disabled={!selectedClip}
            onClick={() => selectedClip && splitClipAtPlayhead(selectedClip.id)}
            className="p-1.5 px-2 rounded-lg bg-[#181c28] hover:bg-[#23293a] border border-[#2b3346] disabled:opacity-30 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Split Clip at Playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Split</span>
          </button>

          {/* Duplicate */}
          <button
            type="button"
            disabled={!selectedClip}
            onClick={() => selectedClip && duplicateClip(selectedClip.id)}
            className="p-1.5 px-2 rounded-lg bg-[#181c28] hover:bg-[#23293a] border border-[#2b3346] disabled:opacity-30 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Duplicate Clip"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            disabled={!selectedClip}
            onClick={() => selectedClip && deleteClip(selectedClip.id)}
            className="p-1.5 px-2 rounded-lg bg-[#181c28] hover:bg-red-950/40 border border-[#2b3346] disabled:opacity-30 text-slate-300 hover:text-red-400 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Delete Clip"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          {/* Snap Magnet */}
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`p-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              snapEnabled
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                : 'bg-[#181c28] border-[#2b3346] text-slate-400'
            }`}
            title="Toggle Magnetic Snap"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Snap</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTimelineZoom(Math.max(30, timelineZoom - 20))}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="30"
            max="250"
            value={timelineZoom}
            onChange={(e) => setTimelineZoom(parseInt(e.target.value, 10))}
            className="w-20 sm:w-28 accent-blue-600 h-1"
          />

          <button
            type="button"
            onClick={() => setTimelineZoom(Math.min(250, timelineZoom + 20))}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitTimeline}
            className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Multi-Track Body ── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Track Headers Panel */}
        <div className="w-28 sm:w-44 bg-[#0e1017] border-r border-[#1f2433] flex flex-col shrink-0 z-10 select-none">
          {/* Header spacer (matches ruler height) */}
          <div className="h-6 border-b border-[#1f2433] bg-[#12151f] flex items-center px-2 text-[10px] font-bold text-slate-400">
            Tracks
          </div>

          {/* Track Labels & Controls */}
          <div ref={headersScrollRef} className="flex-1 overflow-y-hidden flex flex-col">
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className={`h-11 border-b border-[#1b1f2b] px-2 flex items-center justify-between transition-colors ${
                  track.locked ? 'bg-slate-900/50' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {getTrackIcon(track.type)}
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate">
                    {track.name}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 text-slate-500">
                  {/* Mute */}
                  <button
                    type="button"
                    onClick={() => toggleTrackMute(track.id)}
                    className="p-1 hover:text-slate-200 cursor-pointer"
                    title="Mute Track"
                  >
                    {track.muted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
                  </button>

                  {/* Hide */}
                  <button
                    type="button"
                    onClick={() => toggleTrackHide(track.id)}
                    className="p-1 hover:text-slate-200 cursor-pointer"
                    title="Hide Track"
                  >
                    {track.hidden ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                  </button>

                  {/* Lock */}
                  <button
                    type="button"
                    onClick={() => toggleTrackLock(track.id)}
                    className="p-1 hover:text-slate-200 cursor-pointer"
                    title="Lock Track"
                  >
                    {track.locked ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3 opacity-40" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Lanes */}
        <div
          ref={scrollContainerRef}
          onScroll={handleTimelineScroll}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#090b10] no-scrollbar"
        >
          <div style={{ width: totalWidth }} className="relative h-full flex flex-col">
            {/* 1. Time Ruler Bar */}
            <div
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
              onPointerUp={handleRulerPointerUp}
              className="h-6 bg-[#11141c] border-b border-[#1e2332] relative cursor-pointer select-none shrink-0"
            >
              {rulerTicks.map((sec) => (
                <div
                  key={sec}
                  style={{ left: sec * timelineZoom }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                >
                  <div className="w-px h-2.5 bg-slate-500" />
                  <span className="text-[9px] font-mono text-slate-400 pl-1 -mt-4">
                    {sec}s
                  </span>
                </div>
              ))}
            </div>

            {/* 2. Track Lanes */}
            <div className="flex-1 flex flex-col relative">
              {project.tracks.map((track) => (
                <div
                  key={track.id}
                  className="h-11 border-b border-[#181c28] relative flex items-center"
                >
                  {/* Clip Items on this Track */}
                  {track.clips.map((clip) => {
                    const isSelected = selection.clipId === clip.id;
                    const left = clip.startTime * timelineZoom;
                    const width = Math.max(18, clip.duration * timelineZoom);

                    return (
                      <div
                        key={clip.id}
                        style={{ left, width }}
                        onPointerDown={(e) => handleClipPointerDown(e, clip, track, 'move')}
                        onPointerMove={handleClipPointerMove}
                        onPointerUp={handleClipPointerUp}
                        className={`absolute h-9 rounded-lg border px-2 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all overflow-hidden ${getTrackColor(
                          clip.type
                        )} ${
                          isSelected
                            ? 'ring-2 ring-blue-400 border-blue-400 shadow-md z-10'
                            : 'hover:brightness-110 shadow-xs'
                        }`}
                      >
                        {/* Left Trim Handle */}
                        <div
                          onPointerDown={(e) =>
                            handleClipPointerDown(e, clip, track, 'trim-start')
                          }
                          className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/40 cursor-ew-resize rounded-l"
                        />

                        {/* Clip Content Tag */}
                        <div className="min-w-0 pl-1 pr-1 truncate text-[11px] font-bold select-none">
                          <span className="truncate block">
                            {clip.text?.content || clip.name}
                          </span>
                        </div>

                        {/* Duration Tag */}
                        <span className="text-[9px] font-mono opacity-60 shrink-0 ml-1">
                          {clip.duration.toFixed(1)}s
                        </span>

                        {/* Keyframe Markers along clip */}
                        {(clip.keyframes || []).map((kf) => (
                          <div
                            key={kf.id}
                            style={{ left: kf.time * timelineZoom }}
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rotate-45 pointer-events-none shadow-xs"
                            title={`Keyframe: ${kf.property}`}
                          />
                        ))}

                        {/* Right Trim Handle */}
                        <div
                          onPointerDown={(e) =>
                            handleClipPointerDown(e, clip, track, 'trim-end')
                          }
                          className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/40 cursor-ew-resize rounded-r"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* 3. Global Red Playhead Needle */}
              <div
                style={{ left: currentTime * timelineZoom }}
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
              >
                {/* Playhead Scrubber Top Crown */}
                <div className="w-3 h-3 bg-red-500 rounded-b -translate-x-[5px] shadow-md pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
