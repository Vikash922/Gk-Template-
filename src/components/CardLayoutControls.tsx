import React from 'react';
import { CardDesignConfig } from '../types/design';
import { GKQuestion } from '../types/question';
import { isLegacyGhostSvg } from '../utils/canvasRenderer';
import {
  Move,
  Type,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Copy,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Sparkles,
  Upload,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { readFileAsDataUrl } from '../utils/image';

export interface CardLayoutControlsProps {
  currentCard?: GKQuestion;
  designConfig: CardDesignConfig;
  applyMode: 'all' | 'single';
  onSetApplyMode: (mode: 'all' | 'single') => void;
  onUpdateDesign: (updated: Partial<CardDesignConfig>) => void;
  onApplyCurrentToAll?: () => void;
  onResetCardCustomDesign?: () => void;
  onUploadTemplate?: (file: File) => void;
  totalCardsCount?: number;
  currentCardNumber?: number;
}

export const CardLayoutControls: React.FC<CardLayoutControlsProps> = ({
  currentCard,
  designConfig,
  applyMode,
  onSetApplyMode,
  onUpdateDesign,
  onApplyCurrentToAll,
  onResetCardCustomDesign,
  onUploadTemplate,
  totalCardsCount = 1,
  currentCardNumber = 1,
}) => {
  const hasCustomOverride = Boolean(currentCard?.customDesign && Object.keys(currentCard.customDesign).length > 0);

  // Helper to nudge coordinates
  const nudge = (key: keyof CardDesignConfig, delta: number) => {
    const currentVal = (designConfig[key] as number) || 0;
    onUpdateDesign({ [key]: currentVal + delta });
  };

  const handleTemplateUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUploadTemplate) {
      onUploadTemplate(file);
    } else {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const img = new Image();
        img.onload = () => {
          onUpdateDesign({
            templateImage: dataUrl,
            useTemplateImage: true,
            templatePreprintedLetters: false, // User custom templates must not hide A B C D!
            showOptionLetters: true,
            templateWidth: img.naturalWidth,
            templateHeight: img.naturalHeight,
          });
        };
        img.src = dataUrl;
      } catch (err) {
        console.error('Template upload error:', err);
      }
    }
    e.target.value = '';
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onUpdateDesign({
        watermarkImage: dataUrl,
        showWatermark: true,
        watermarkWidth: 160,
        watermarkHeight: 90,
        watermarkX: 1720,
        watermarkY: 35,
        watermarkOpacity: 0.95,
      });
    } catch (err) {
      console.error('Logo upload error:', err);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6 text-sm">
      {/* 1. MASTER SCOPE SWITCH */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Edit Scope</span>
          {hasCustomOverride && applyMode === 'single' && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Custom Active
            </span>
          )}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onSetApplyMode('all')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              applyMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Cards
          </button>
          <button
            type="button"
            onClick={() => onSetApplyMode('single')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              applyMode === 'single'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Card #{currentCardNumber} Only
          </button>
        </div>

        {/* Action buttons for single card custom override */}
        <div className="flex flex-wrap gap-2">
          {onApplyCurrentToAll && (
            <button
              type="button"
              onClick={onApplyCurrentToAll}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Apply to all cards
            </button>
          )}

          {hasCustomOverride && onResetCardCustomDesign && (
            <button
              type="button"
              onClick={onResetCardCustomDesign}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. TEMPLATE & ABCD LETTERS CONTROLS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Template & Labels</span>
          <label className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Upload PNG
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleTemplateUploadChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Template Status */}
        {designConfig.useTemplateImage && designConfig.templateImage && !isLegacyGhostSvg(designConfig.templateImage) && (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-white border border-slate-200 rounded flex items-center justify-center p-0.5">
                <img
                  src={designConfig.templateImage}
                  alt="Template"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-medium text-slate-700">Custom PNG</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateDesign({ useTemplateImage: false, templateImage: '' })}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={designConfig.showOptionLetters !== false}
              onChange={(e) =>
                onUpdateDesign({
                  showOptionLetters: e.target.checked,
                  templatePreprintedLetters: !e.target.checked,
                })
              }
              className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
            />
            <span className="text-sm text-slate-700">Show A/B/C/D labels</span>
          </label>
        </div>

        {designConfig.showOptionLetters !== false && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateDesign({ optionLetterStyle: 'prefix' })}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                (designConfig.optionLetterStyle || 'prefix') === 'prefix'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              A. B. C.
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesign({ optionLetterStyle: 'badge_circle' })}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                designConfig.optionLetterStyle === 'badge_circle'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              (A) Circle
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesign({ optionLetterStyle: 'badge_pill' })}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                designConfig.optionLetterStyle === 'badge_pill'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              [ A ] Pill
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={designConfig.showOptionBoxes ?? true}
              onChange={(e) => onUpdateDesign({ showOptionBoxes: e.target.checked })}
              className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
            />
            <span className="text-sm text-slate-700">Draw option boxes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={designConfig.showQuestionBox ?? true}
              onChange={(e) => onUpdateDesign({ showQuestionBox: e.target.checked })}
              className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
            />
            <span className="text-sm text-slate-700">Draw question box</span>
          </label>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 3. OPTIONS PLACEMENT & SIZING */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Options Layout</span>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onUpdateDesign({ optionLayout: 'column' })}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                (designConfig.optionLayout || 'column') === 'column'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              1 Col
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesign({ optionLayout: 'grid2x2' })}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                designConfig.optionLayout === 'grid2x2'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              2x2 Grid
            </button>
          </div>
        </div>

        {/* Quick Position Nudge */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl shadow-xs">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">Nudge Block</span>
            <span className="text-[10px] text-slate-500">Fine-tune options position</span>
          </div>
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs gap-0.5">
            <button onClick={() => nudge('optionStartX', -10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer active:scale-95" title="Move Left"><ArrowLeft className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => nudge('optionStartY', -10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer active:scale-95" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => nudge('optionStartY', 10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer active:scale-95" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => nudge('optionStartX', 10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer active:scale-95" title="Move Right"><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2">
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Option Font Size</span>
              <span>{designConfig.optionBaseFontSize}px</span>
            </div>
            <input type="range" min="28" max="92" step="2" value={designConfig.optionBaseFontSize} onChange={(e) => onUpdateDesign({ optionBaseFontSize: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Start X</span>
              <span>{designConfig.optionStartX}px</span>
            </div>
            <input type="range" min="20" max="1100" step="5" value={designConfig.optionStartX} onChange={(e) => onUpdateDesign({ optionStartX: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Start Y</span>
              <span>{designConfig.optionStartY}px</span>
            </div>
            <input type="range" min="150" max="800" step="5" value={designConfig.optionStartY} onChange={(e) => onUpdateDesign({ optionStartY: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Box Width</span>
              <span>{designConfig.optionWidth}px</span>
            </div>
            <input type="range" min="300" max="1750" step="10" value={designConfig.optionWidth} onChange={(e) => onUpdateDesign({ optionWidth: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Box Height</span>
              <span>{designConfig.optionHeight}px</span>
            </div>
            <input type="range" min="60" max="240" step="4" value={designConfig.optionHeight} onChange={(e) => onUpdateDesign({ optionHeight: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Vertical Gap</span>
              <span>{designConfig.optionSpacing}px</span>
            </div>
            <input type="range" min="0" max="90" step="2" value={designConfig.optionSpacing} onChange={(e) => onUpdateDesign({ optionSpacing: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Text Margin Left</span>
              <span>{designConfig.optionTextPaddingLeft || 36}px</span>
            </div>
            <input type="range" min="10" max="150" step="4" value={designConfig.optionTextPaddingLeft || 36} onChange={(e) => onUpdateDesign({ optionTextPaddingLeft: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. QUESTION PLACEMENT */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl shadow-xs">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">Question Nudge</span>
            <span className="text-[10px] text-slate-500">Fine-tune vertical position</span>
          </div>
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs gap-0.5">
            <button onClick={() => nudge('questionBoxY', -10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer active:scale-95" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => nudge('questionBoxY', 10)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer active:scale-95" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2">
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Question Font Size</span>
              <span>{designConfig.questionBaseFontSize}px</span>
            </div>
            <input type="range" min="32" max="92" step="2" value={designConfig.questionBaseFontSize} onChange={(e) => onUpdateDesign({ questionBaseFontSize: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Y Position</span>
              <span>{designConfig.questionBoxY}px</span>
            </div>
            <input type="range" min="20" max="350" step="5" value={designConfig.questionBoxY} onChange={(e) => onUpdateDesign({ questionBoxY: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600">
              <span>Box Height</span>
              <span>{designConfig.questionBoxHeight}px</span>
            </div>
            <input type="range" min="120" max="400" step="5" value={designConfig.questionBoxHeight} onChange={(e) => onUpdateDesign({ questionBoxHeight: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 5. WATERMARK */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Channel Logo</span>
          <label className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleWatermarkUpload}
              className="hidden"
            />
          </label>
        </div>

        {designConfig.watermarkImage && (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-8 bg-white border border-slate-200 rounded flex items-center justify-center p-0.5">
                <img
                  src={designConfig.watermarkImage}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs text-slate-600">Logo active</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateDesign({ watermarkImage: undefined, showWatermark: false })}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
