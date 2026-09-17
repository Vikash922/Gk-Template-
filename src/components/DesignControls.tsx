import React, { useRef } from 'react';
import { CardDesignConfig } from '../types/design';
import { REFERENCE_DESIGN, BRIGHT_DESIGN, MINIMAL_DESIGN } from '../constants/referenceDesign';
import { DEFAULT_TEMPLATE_DATA_URI } from '../constants/defaultTemplate';
import { RotateCcw, Palette, SlidersHorizontal, Sparkles, Upload, Image as ImageIcon, Check } from 'lucide-react';

interface DesignControlsProps {
  config: CardDesignConfig;
  onChange: (updated: CardDesignConfig) => void;
}

export const DesignControls: React.FC<DesignControlsProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyPreset = (preset: 'Reference GK' | 'Bright' | 'Minimal') => {
    if (preset === 'Reference GK') {
      onChange({ ...REFERENCE_DESIGN });
    } else if (preset === 'Bright') {
      onChange({ ...BRIGHT_DESIGN });
    } else {
      onChange({ ...MINIMAL_DESIGN });
    }
  };

  const handleReset = () => {
    onChange({ ...REFERENCE_DESIGN });
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onChange({
          ...config,
          templateImage: dataUrl,
          useTemplateImage: true,
          templateWidth: img.naturalWidth,
          templateHeight: img.naturalHeight,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleResetTemplate = () => {
    onChange({
      ...config,
      templateImage: DEFAULT_TEMPLATE_DATA_URI,
      useTemplateImage: true,
      templatePreprintedLetters: true,
    });
  };

  return (
    <div className="flex flex-col gap-6 text-sm">
      {/* Top Header & Presets */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Card Theme
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium"
          >
            Reset to Reference
          </button>
        </div>

        {/* Presets Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['Reference GK', 'Bright', 'Minimal'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                config.presetName === p
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* PNG Template Background Control */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Background Image</span>
          <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {config.templateImage ? 'Active' : 'Fallback'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/*"
            className="hidden"
            onChange={handleTemplateUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 text-xs border border-slate-200 rounded-lg hover:border-slate-300 font-medium transition-colors"
          >
            Upload PNG
          </button>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="flex-1 py-2 text-xs border border-slate-200 rounded-lg hover:border-slate-300 font-medium transition-colors"
          >
            Restore Default
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={config.templatePreprintedLetters ?? true}
            onChange={(e) => onChange({ ...config, templatePreprintedLetters: e.target.checked })}
            className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
          />
          <span className="text-xs text-slate-700">Contains pre-printed A/B/C/D</span>
        </label>
      </div>

      <hr className="border-slate-100" />

      {/* Typography & Dimensions Sliders */}
      <div className="flex flex-col gap-4">
        <span className="font-semibold text-slate-900">Typography & Style</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Question Font Family */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Question Font</label>
            <select
              value={config.questionFontFamily || 'Noto Sans Devanagari'}
              onChange={(e) => onChange({ ...config, questionFontFamily: e.target.value })}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-slate-400"
            >
              <option value="Noto Sans Devanagari">Noto Sans (Clean)</option>
              <option value="Poppins">Poppins (Modern Bold)</option>
              <option value="Mukta">Mukta (Balanced)</option>
              <option value="Rozha One">Rozha One (Traditional)</option>
              <option value="Yatra One">Yatra One (Display)</option>
            </select>
          </div>

          {/* Option Font Family */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Option Font</label>
            <select
              value={config.optionFontFamily || 'Noto Sans Devanagari'}
              onChange={(e) => onChange({ ...config, optionFontFamily: e.target.value })}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-slate-400"
            >
              <option value="Noto Sans Devanagari">Noto Sans (Clean)</option>
              <option value="Poppins">Poppins (Modern Bold)</option>
              <option value="Mukta">Mukta (Balanced)</option>
              <option value="Rozha One">Rozha One (Traditional)</option>
              <option value="Yatra One">Yatra One (Display)</option>
            </select>
          </div>

          {/* Question Base Font Size */}
          <div className="sm:col-span-2">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Question Size</span>
              <span>{config.questionBaseFontSize}px</span>
            </div>
            <input type="range" min="32" max="84" step="2" value={config.questionBaseFontSize} onChange={(e) => onChange({ ...config, questionBaseFontSize: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          {/* Option Base Font Size */}
          <div className="sm:col-span-2">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Option Size</span>
              <span>{config.optionBaseFontSize}px</span>
            </div>
            <input type="range" min="28" max="88" step="2" value={config.optionBaseFontSize} onChange={(e) => onChange({ ...config, optionBaseFontSize: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          {/* Outer Border Width */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Border Width</span>
              <span>{config.outerBorderWidth}px</span>
            </div>
            <input type="range" min="6" max="24" step="1" value={config.outerBorderWidth} onChange={(e) => onChange({ ...config, outerBorderWidth: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          {/* Outer Border Corner Radius */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Corner Radius</span>
              <span>{config.outerBorderRadius}px</span>
            </div>
            <input type="range" min="16" max="64" step="2" value={config.outerBorderRadius} onChange={(e) => onChange({ ...config, outerBorderRadius: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          {/* Question Box Height */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Question Box Height</span>
              <span>{config.questionBoxHeight}px</span>
            </div>
            <input type="range" min="180" max="300" step="5" value={config.questionBoxHeight} onChange={(e) => onChange({ ...config, questionBoxHeight: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>

          {/* Option Spacing */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Option Spacing</span>
              <span>{config.optionSpacing}px</span>
            </div>
            <input type="range" min="12" max="36" step="2" value={config.optionSpacing} onChange={(e) => onChange({ ...config, optionSpacing: parseInt(e.target.value, 10) })} className="w-full accent-slate-900" />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Colors Controls */}
      <div className="flex flex-col gap-4">
        <span className="font-semibold text-slate-900">Colors</span>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Border</span>
            <div className="flex items-center gap-2">
              <input type="color" value={config.outerBorderColor} onChange={(e) => onChange({ ...config, outerBorderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Q. Start</span>
            <div className="flex items-center gap-2">
              <input type="color" value={config.questionBoxBgGradientStart} onChange={(e) => onChange({ ...config, questionBoxBgGradientStart: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Q. End</span>
            <div className="flex items-center gap-2">
              <input type="color" value={config.questionBoxBgGradientEnd} onChange={(e) => onChange({ ...config, questionBoxBgGradientEnd: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Opt Fill</span>
            <div className="flex items-center gap-2">
              <input type="color" value={config.optionBgColor} onChange={(e) => onChange({ ...config, optionBgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Opt Border</span>
            <div className="flex items-center gap-2">
              <input type="color" value={config.optionBorderColor} onChange={(e) => onChange({ ...config, optionBorderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
