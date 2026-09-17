import React, { useState, useRef } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { CardCanvas } from './CardCanvas';
import { downloadCardAsPNG, copyCardToClipboard } from '../services/exportService';
import { useToast } from './Toast';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  Bookmark,
  Eye,
  Upload,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface CardPreviewProps {
  question: GKQuestion;
  designConfig: CardDesignConfig;
  onSave?: () => void;
  onDuplicate?: () => void;
  onUpdateDesign?: (updated: CardDesignConfig) => void;
  onOpenPositionControls?: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  question,
  designConfig,
  onSave,
  onDuplicate,
  onUpdateDesign,
  onOpenPositionControls,
}) => {
  const { showToast } = useToast();
  const [resolution, setResolution] = useState<'1920x1080' | '1280x720'>('1920x1080');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const qNum = parseInt(String(question.questionNumber), 10);
  const fileName = `GK-Question-${isNaN(qNum) ? '01' : qNum.toString().padStart(2, '0')}.png`;

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateDesign) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onUpdateDesign({
          ...designConfig,
          templateImage: dataUrl,
          useTemplateImage: true,
          templatePreprintedLetters: false,
          showOptionLetters: true,
          templateWidth: img.naturalWidth,
          templateHeight: img.naturalHeight,
        });
        showToast('Custom PNG template uploaded!', 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      showToast('Downloading PNG...', 'info', 1500);
      await downloadCardAsPNG(question, designConfig, resolution);
      showToast('✓ PNG downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download card image.', 'error');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyCardToClipboard(question, designConfig);
    if (ok) {
      setCopied(true);
      showToast('Image copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('Clipboard copy not supported by browser. Please use Download PNG.', 'warning');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      showToast('✓ Card saved', 'success');
    }
  };

  return (
    <div className="bg-transparent flex flex-col gap-4">
      {/* Hidden File Input for Template */}
      <input
        ref={templateInputRef}
        type="file"
        accept="image/png,image/*"
        className="hidden"
        onChange={handleTemplateFileChange}
      />

      {/* Header with Title & Resolution Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Preview
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            16:9 HD
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setResolution('1920x1080')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              resolution === '1920x1080'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            1080p
          </button>
          <button
            type="button"
            onClick={() => setResolution('1280x720')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              resolution === '1280x720'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            720p
          </button>
        </div>
      </div>

      {/* Card Canvas Stage */}
      <div className="relative group rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 bg-slate-50">
        <CardCanvas question={question} designConfig={designConfig} />

        {/* Hover / Quick Zoom Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
          title="Zoom Full Screen"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Template Background Info Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs">
        <span className="text-slate-600 truncate">
          Theme: <strong className="font-semibold text-slate-800">{designConfig.templateImage ? 'Custom PNG' : 'Vector GK Frame'}</strong>
        </span>

        <div className="flex items-center gap-2">
          {onOpenPositionControls && (
            <button
              type="button"
              onClick={onOpenPositionControls}
              className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>ABCD Position</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => templateInputRef.current?.click()}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            <span>Upload PNG</span>
          </button>
        </div>
      </div>

      {/* Primary Actions: Prominent Download PNG */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isExporting ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Exporting PNG...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PNG ({resolution})</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <Copy className="w-4 h-4 text-blue-600" />
              <span>Duplicate</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
            title="Copy image to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex flex-col gap-3 cursor-default"
          >
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-semibold font-mono">{fileName}</span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-medium cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <CardCanvas question={question} designConfig={designConfig} />
          </div>
        </div>
      )}
    </div>
  );
};
