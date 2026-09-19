import React, { useState, useRef } from 'react';
import { useEditor } from '../store/EditorContext';
import { ExportEngine, ExportOptions } from '../engine/ExportEngine';
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Video,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { project } = useEditor();

  const [resolution, setResolution] = useState<'4k' | '1080p' | '720p'>('1080p');
  const [fps, setFps] = useState<30 | 60>(30);
  const [format, setFormat] = useState<'webm' | 'mp4'>('webm');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [estimatedSec, setEstimatedSec] = useState<number | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const engineRef = useRef<ExportEngine | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setDownloadUrl(null);
    setErrorMsg(null);
    setProgressPercent(0);
    setStatusText('Preparing canvas renderer...');

    const engine = new ExportEngine();
    engineRef.current = engine;

    const options: ExportOptions = {
      resolution,
      fps,
      format,
    };

    try {
      const url = await engine.exportVideo(
        project,
        options,
        (pct, status, secLeft) => {
          setProgressPercent(pct);
          setStatusText(status);
          setEstimatedSec(secLeft);
        }
      );
      setDownloadUrl(url);
    } catch (err: any) {
      if (err.message !== 'Export was cancelled by user') {
        console.error('Export failed:', err);
        setErrorMsg(err.message || 'Video export encountered an error.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setIsExporting(false);
    setStatusText('Cancelled');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#121520] border border-[#272e42] rounded-2xl shadow-2xl flex flex-col text-xs text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#161a28] border-b border-[#242b3e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Export Video</h2>
              <p className="text-[10px] text-slate-400">
                High-definition WebM/MP4 render with synchronized audio
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Ongoing Export Progress */}
          {isExporting ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>{statusText || 'Rendering video frames...'}</span>
                </span>
                <span className="font-mono text-blue-400 font-bold">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#181c28] rounded-full overflow-hidden border border-[#262c3e] p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Duration: {project.duration.toFixed(1)}s</span>
                {estimatedSec !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Est. {estimatedSec}s remaining</span>
                  </span>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleCancelExport}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold cursor-pointer"
                >
                  Cancel Export
                </button>
              </div>
            </div>
          ) : downloadUrl ? (
            /* Render Success */
            <div className="space-y-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-white text-base">Video Exported Successfully! 🎉</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your GK video is rendered and ready for YouTube Shorts & Reels.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={downloadUrl}
                  download={`${project.name || 'gk_quiz_video'}.${format}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video File</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDownloadUrl(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Export Again
                </button>
              </div>
            </div>
          ) : (
            /* Export Configuration Options */
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center gap-2 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Resolution */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Output Resolution</span>
                  <span className="text-[10px] text-blue-400 font-normal">Canvas: {project.width}x{project.height} ({project.aspectRatio})</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolution('4k')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      resolution === '4k'
                        ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-[#181c28] border-[#293044] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-xs text-white">4K UHD</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">PRO</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {project.aspectRatio === '9:16' ? '2160x3840' : '3840x2160'}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Studio Master</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      resolution === '1080p'
                        ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-[#181c28] border-[#293044] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-xs text-white">1080p</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">REC</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {project.aspectRatio === '9:16' ? '1080x1920' : '1920x1080'}
                    </span>
                    <span className="text-[9px] text-slate-500 block">YouTube / Reels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      resolution === '720p'
                        ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-[#181c28] border-[#293044] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-xs text-white">720p</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-700 text-slate-300 font-semibold">FAST</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {project.aspectRatio === '9:16' ? '720x1280' : '1280x720'}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Quick Share</span>
                  </button>
                </div>
              </div>

              {/* Frame Rate & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Frame Rate</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[30, 60].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFps(f as any)}
                        className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                          fps === f
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-[#181c28] border-[#293044] text-slate-400'
                        }`}
                      >
                        {f} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Container Format</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['webm', 'mp4'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormat(fmt)}
                        className={`p-2 rounded-xl border text-center font-bold text-xs uppercase cursor-pointer ${
                          format === fmt
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-[#181c28] border-[#293044] text-slate-400'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl bg-[#181c28] border border-[#272e42] text-[11px] text-slate-400 flex items-center justify-between">
                <span>Estimated duration:</span>
                <span className="font-bold text-white font-mono">{project.duration.toFixed(1)} seconds</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && !downloadUrl && (
          <div className="p-4 bg-[#161a28] border-t border-[#242b3e] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#2b3346] text-slate-400 hover:text-white cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Start Export</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
