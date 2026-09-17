import React, { useRef } from 'react';
import { CardDesignConfig } from '../types/design';
import { useToast } from './Toast';
import {
  Upload,
  RotateCcw,
  CheckCircle2,
  LayoutTemplate,
  Sparkles,
  Info,
  Trash2,
  Check,
} from 'lucide-react';

interface TemplateManagementViewProps {
  designConfig: CardDesignConfig;
  onUpdateDesign: (updated: Partial<CardDesignConfig>) => void;
}

export const TemplateManagementView: React.FC<TemplateManagementViewProps> = ({
  designConfig,
  onUpdateDesign,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isCustomActive = Boolean(designConfig.useTemplateImage && designConfig.templateImage);

  const handleUploadFile = (file: File) => {
    if (!file.type.includes('image')) {
      showToast('Please select a valid image file (PNG/JPG)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onUpdateDesign({
          templateImage: dataUrl,
          useTemplateImage: true,
          templatePreprintedLetters: false,
          showOptionLetters: true,
          templateWidth: img.naturalWidth,
          templateHeight: img.naturalHeight,
        });
        showToast('Custom template uploaded successfully!', 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectDefault = () => {
    onUpdateDesign({
      useTemplateImage: false,
      templatePreprintedLetters: false,
    });
    showToast('Dynamic standard frame activated', 'info');
  };

  const handleSelectCustom = () => {
    if (designConfig.templateImage) {
      onUpdateDesign({
        useTemplateImage: true,
      });
      showToast('Custom PNG template activated', 'success');
    }
  };

  const handleRemoveCustom = () => {
    onUpdateDesign({
      templateImage: '',
      useTemplateImage: false,
      templatePreprintedLetters: false,
    });
    showToast('Custom template removed', 'info');
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto py-1 sm:py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            Template Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose your background frame or upload your own 1920×1080 blank GK template.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Template</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Default Vector Frame */}
        <div
          className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between gap-4 shadow-xs ${
            !isCustomActive ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Template Visual Thumbnail */}
            <div className="w-full aspect-video rounded-2xl bg-white border-2 border-emerald-600 p-2.5 relative flex flex-col justify-between overflow-hidden shadow-inner">
              <div className="w-full h-7 rounded-lg bg-gradient-to-r from-lime-300 to-yellow-300 border border-slate-900/40 flex items-center px-2">
                <span className="text-[9px] font-bold text-slate-800">Q. Question Box</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 py-1">
                <div className="flex flex-col gap-1">
                  <div className="h-4 rounded bg-yellow-300 border border-red-500/50 flex items-center px-1.5">
                    <span className="text-[7px] font-bold">A.</span>
                  </div>
                  <div className="h-4 rounded bg-yellow-300 border border-red-500/50 flex items-center px-1.5">
                    <span className="text-[7px] font-bold">B.</span>
                  </div>
                  <div className="h-4 rounded bg-yellow-300 border border-red-500/50 flex items-center px-1.5">
                    <span className="text-[7px] font-bold">C.</span>
                  </div>
                  <div className="h-4 rounded bg-yellow-300 border border-red-500/50 flex items-center px-1.5">
                    <span className="text-[7px] font-bold">D.</span>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
                  Image Area
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Reference GK Vector Frame</h3>
                {!isCustomActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Authentic 16:9 vector frame with rounded outer green border and dynamic question & option boxes.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            {!isCustomActive ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Currently In Use
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSelectDefault}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Set as Active
              </button>
            )}
          </div>
        </div>

        {/* 2. Custom Uploaded Template (if exists) or Upload Card */}
        {designConfig.templateImage ? (
          <div
            className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between gap-4 shadow-xs ${
              isCustomActive ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
            }`}
          >
            <div className="flex flex-col gap-3">
              {/* Thumbnail */}
              <div className="w-full aspect-video rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                <img
                  src={designConfig.templateImage}
                  alt="Custom Template"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Custom Blank PNG Template</h3>
                  {isCustomActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Your custom uploaded PNG file is used as the base background for all generated cards.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRemoveCustom}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Replace
                </button>
                {!isCustomActive && (
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Set as Active
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Upload Card Empty State */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Upload Your Own Blank Template</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Drag & drop your 1920×1080 PNG or click to browse from device.
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold mt-1">
              Select PNG Image
            </span>
          </div>
        )}
      </div>

      {/* Helpful Template Tips */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <span className="font-bold text-blue-950">Template Specifications:</span>
          <span>
            • Best resolution is <strong className="font-semibold">1920 × 1080 (16:9)</strong> in PNG format for lossless crisp text.
          </span>
          <span>
            • The question and option positions can be fine-tuned anytime in the <strong className="font-semibold">Position & ABCD</strong> tab.
          </span>
        </div>
      </div>
    </div>
  );
};
