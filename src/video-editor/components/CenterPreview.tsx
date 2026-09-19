import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor } from '../store/EditorContext';
import { PreviewEngine } from '../engine/PreviewEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Shield,
  Eye,
  SkipBack,
  SkipForward,
  Scissors,
  Copy,
  Trash2,
} from 'lucide-react';

export const CenterPreview: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayPause,
    selection,
    selectClip,
    selectedClip,
    updateClip,
    splitClipAtPlayhead,
    duplicateClip,
    deleteClip,
  } = useEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PreviewEngine | null>(null);

  const [zoomLevel, setZoomLevel] = useState<'fit' | 0.5 | 0.75 | 1.0>('fit');
  const [showSafeGuides, setShowSafeGuides] = useState<boolean>(true);

  // Dragging & Transforming state
  const isDraggingRef = useRef<boolean>(false);
  const dragTypeRef = useRef<'move' | 'resize' | 'rotate' | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemScale: number; elemRot: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemScale: 1,
    elemRot: 0,
  });

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PreviewEngine(canvasRef.current);
    }
  }, []);

  // Continuous render loop
  const renderFrame = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;
    engineRef.current.render(project, currentTime, selection, {
      showSafeGuides,
      showSelectionHandles: true,
    });
  }, [project, currentTime, selection, showSafeGuides]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Convert client mouse/touch to canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Pointer Down: Hit test clips or drag handles
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // If currently selected clip has handles, check handle hits
    if (selectedClip) {
      const dx = coords.x - selectedClip.x;
      const dy = coords.y - selectedClip.y;
      const halfW = (selectedClip.width * selectedClip.scale) / 2;
      const halfH = (selectedClip.height * selectedClip.scale) / 2;

      // Rotation handle hit test (at top center)
      if (Math.hypot(dx, dy + halfH + 24) < 20) {
        isDraggingRef.current = true;
        dragTypeRef.current = 'rotate';
        dragStartPosRef.current = {
          mouseX: coords.x,
          mouseY: coords.y,
          elemX: selectedClip.x,
          elemY: selectedClip.y,
          elemScale: selectedClip.scale,
          elemRot: selectedClip.rotation,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // Corner resize handles hit test
      const distToCorners = [
        Math.hypot(coords.x - (selectedClip.x - halfW), coords.y - (selectedClip.y - halfH)),
        Math.hypot(coords.x - (selectedClip.x + halfW), coords.y - (selectedClip.y - halfH)),
        Math.hypot(coords.x - (selectedClip.x - halfW), coords.y - (selectedClip.y + halfH)),
        Math.hypot(coords.x - (selectedClip.x + halfW), coords.y - (selectedClip.y + halfH)),
      ];

      if (Math.min(...distToCorners) < 24) {
        isDraggingRef.current = true;
        dragTypeRef.current = 'resize';
        dragStartPosRef.current = {
          mouseX: coords.x,
          mouseY: coords.y,
          elemX: selectedClip.x,
          elemY: selectedClip.y,
          elemScale: selectedClip.scale,
          elemRot: selectedClip.rotation,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // Inside selection box
      if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
        isDraggingRef.current = true;
        dragTypeRef.current = 'move';
        dragStartPosRef.current = {
          mouseX: coords.x,
          mouseY: coords.y,
          elemX: selectedClip.x,
          elemY: selectedClip.y,
          elemScale: selectedClip.scale,
          elemRot: selectedClip.rotation,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Hit test any active visible clip on canvas (top to bottom)
    let foundClipId: string | null = null;
    const sortedTracks = [...project.tracks].reverse();

    for (const track of sortedTracks) {
      if (track.hidden) continue;
      for (let i = track.clips.length - 1; i >= 0; i--) {
        const clip = track.clips[i];
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          const halfW = (clip.width * clip.scale) / 2;
          const halfH = (clip.height * clip.scale) / 2;
          if (
            coords.x >= clip.x - halfW &&
            coords.x <= clip.x + halfW &&
            coords.y >= clip.y - halfH &&
            coords.y <= clip.y + halfH
          ) {
            foundClipId = clip.id;
            break;
          }
        }
      }
      if (foundClipId) break;
    }

    selectClip(foundClipId);

    if (foundClipId) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === foundClipId);
      if (clip) {
        isDraggingRef.current = true;
        dragTypeRef.current = 'move';
        dragStartPosRef.current = {
          mouseX: coords.x,
          mouseY: coords.y,
          elemX: clip.x,
          elemY: clip.y,
          elemScale: clip.scale,
          elemRot: clip.rotation,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !selectedClip) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const start = dragStartPosRef.current;

    if (dragTypeRef.current === 'move') {
      let newX = start.elemX + (coords.x - start.mouseX);
      let newY = start.elemY + (coords.y - start.mouseY);

      // Snap alignment to center line within 14px
      const centerX = project.width / 2;
      if (Math.abs(newX - centerX) < 14) {
        newX = centerX;
      }

      updateClip(selectedClip.id, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    } else if (dragTypeRef.current === 'resize') {
      const initialDist = Math.hypot(start.mouseX - selectedClip.x, start.mouseY - selectedClip.y);
      const currentDist = Math.hypot(coords.x - selectedClip.x, coords.y - selectedClip.y);
      if (initialDist > 0) {
        const factor = currentDist / initialDist;
        const newScale = Math.max(0.2, Math.min(3.5, start.elemScale * factor));
        updateClip(selectedClip.id, {
          scale: Math.round(newScale * 100) / 100,
        });
      }
    } else if (dragTypeRef.current === 'rotate') {
      const angle = Math.atan2(coords.y - selectedClip.y, coords.x - selectedClip.x);
      const deg = (angle * 180) / Math.PI + 90;
      updateClip(selectedClip.id, {
        rotation: Math.round(deg),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0c12] min-h-0 relative select-none overflow-hidden">
      {/* ── Top Monitor Sub-Bar ── */}
      <div className="h-8 sm:h-9 bg-[#11131a] border-b border-[#1f2433] px-2 sm:px-4 flex items-center justify-between text-xs text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 text-[11px] sm:text-xs">Preview</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {project.width}x{project.height}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Safe Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer text-[10px] sm:text-[11px] ${
              showSafeGuides ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-white'
            }`}
            title="Toggle Safe Area Guides"
          >
            <Shield className="w-3 h-3" />
            <span>Safe Area</span>
          </button>

          {/* Zoom Toggle (Desktop) */}
          <div className="hidden sm:flex items-center gap-1 bg-[#181c28] rounded-md p-0.5 text-[10px]">
            {(['fit', 0.5, 0.75, 1.0] as const).map((z) => (
              <button
                key={String(z)}
                type="button"
                onClick={() => setZoomLevel(z)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  zoomLevel === z ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {z === 'fit' ? 'Fit' : `${z * 100}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Central Canvas Stage ── */}
      <div className="flex-1 flex items-center justify-center p-1 sm:p-4 overflow-hidden relative">
        {/* Floating CapCut/VN Style Quick Action Toolbar when Clip is Selected */}
        {selectedClip && (
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#121522]/95 backdrop-blur-md border border-[#2b334a] px-2 py-1.5 rounded-2xl shadow-2xl text-xs font-semibold select-none animate-in fade-in duration-150 max-w-[95vw] overflow-x-auto">
            <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-blue-300 text-[10px] font-bold truncate max-w-[100px] sm:max-w-[140px]">
              {selectedClip.name}
            </span>

            <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => splitClipAtPlayhead(selectedClip.id)}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors text-[10px] sm:text-[11px] shrink-0"
              title="Split clip at playhead"
            >
              <Scissors className="w-3 h-3 text-blue-400" />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => duplicateClip(selectedClip.id)}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors text-[10px] sm:text-[11px] shrink-0"
              title="Duplicate clip"
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={() => deleteClip(selectedClip.id)}
              className="px-2 py-1 rounded-lg hover:bg-red-950/50 text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors text-[10px] sm:text-[11px] shrink-0"
              title="Delete clip"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Delete</span>
            </button>
          </div>
        )}

        <div
          className={`relative rounded-xl shadow-2xl overflow-hidden border border-[#2d3448] flex items-center justify-center bg-black ${
            project.aspectRatio === '9:16'
              ? 'aspect-[9/16] max-h-full h-auto w-auto'
              : project.aspectRatio === '16:9'
              ? 'aspect-video w-full max-w-4xl max-h-full'
              : 'aspect-square max-h-full'
          }`}
          style={{
            transform: zoomLevel === 'fit' ? 'none' : `scale(${zoomLevel})`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <canvas
            ref={canvasRef}
            width={project.width}
            height={project.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full object-contain cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* ── Bottom Floating Transport Bar (VN/CapCut Style) ── */}
      <div className="h-11 sm:h-12 bg-[#11131a] border-t border-[#1e2230] px-2 sm:px-4 flex items-center justify-between shrink-0 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Rewind to Start */}
          <button
            type="button"
            onClick={() => setCurrentTime(0)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Jump to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step Back 1 Frame (-1f) */}
          <button
            type="button"
            onClick={() => setCurrentTime(Math.max(0, currentTime - 1 / (project.fps || 30)))}
            className="px-1.5 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-[10px] font-mono"
            title="Step back 1 frame (1/30s)"
          >
            -1f
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Step Forward 1 Frame (+1f) */}
          <button
            type="button"
            onClick={() => setCurrentTime(Math.min(project.duration, currentTime + 1 / (project.fps || 30)))}
            className="px-1.5 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-[10px] font-mono"
            title="Step forward 1 frame (1/30s)"
          >
            +1f
          </button>

          {/* Step Forward 1s */}
          <button
            type="button"
            onClick={() => setCurrentTime(Math.min(project.duration, currentTime + 1))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Step forward 1s"
          >
            <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Timecode */}
        <div className="font-mono text-[11px] sm:text-xs font-semibold">
          <span className="text-blue-400 font-bold">{formatTime(currentTime)}</span>
          <span className="text-slate-500 mx-1">/</span>
          <span className="text-slate-400">{formatTime(project.duration)}</span>
        </div>
      </div>
    </div>
  );
};
