import React, { useState } from 'react';
import { generateCustomAIImage } from '../services/imageGenerator';
import { Sparkles, X, Download, Check, Image as ImageIcon, Wand2, RefreshCw } from 'lucide-react';

interface AiImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (imageUrl: string, topicName: string) => void;
  initialPrompt?: string;
}

const POPULAR_TOPICS = [
  'Taj Mahal',
  'Bengal Tiger',
  'Chandrayaan Rocket',
  'Solar System',
  'Human Brain',
  'Red Fort',
  'Ashoka Chakra',
  'Peacock',
  'Statue of Unity',
  'Lotus Flower',
  'India Gate',
  'DNA Structure',
];

const STYLES = [
  { id: '3D Clipart', label: '🌟 3D Clipart (Best for GK Cards)' },
  { id: 'Vector Clipart', label: '🎨 Vector Clipart' },
  { id: 'Realistic', label: '📸 Realistic Cutout' },
  { id: 'Educational', label: '📚 Educational Clipart' },
  { id: 'Minimal', label: '🏷️ Minimal Icon' },
];

export const AiImageModal: React.FC<AiImageModalProps> = ({
  isOpen,
  onClose,
  onApplyImage,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState<string>(initialPrompt || 'Taj Mahal');
  const [style, setStyle] = useState<string>('3D Clipart');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationNote, setGenerationNote] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = (customPrompt || prompt).trim();
    if (!targetPrompt) return;

    setIsGenerating(true);
    setGenerationNote('');
    try {
      const res = await generateCustomAIImage(targetPrompt, style);
      setGeneratedImage(res.imageUrl);
      if (res.note) {
        setGenerationNote(res.note);
      }
    } catch (err) {
      console.error('AI image generation failed:', err);
      alert('Generation failed. Please try a different topic or prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `gk_ai_${prompt.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleApply = () => {
    if (!generatedImage) return;
    onApplyImage(generatedImage, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                AI Image Studio
              </h2>
              <p className="text-xs text-slate-500">
                Generate high-resolution transparent clipart with Gemini AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input prompt */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Subject Topic / Prompt:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Taj Mahal, Royal Bengal Tiger, Chandrayaan Rocket..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Creating...' : 'Generate'}</span>
            </button>
          </div>
        </div>

        {/* Style Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Visual Style:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border cursor-pointer truncate ${
                  style === s.id
                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Popular GK Topics:</span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {POPULAR_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPrompt(t);
                  handleGenerate(t);
                }}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-600 font-medium transition-colors cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-purple-700">
              <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin" />
              <p className="text-xs font-semibold animate-pulse">
                Gemini AI is crafting your transparent educational visual...
              </p>
            </div>
          ) : generatedImage ? (
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Transparency grid background */}
              <div className="w-40 h-40 rounded-xl border border-slate-300 p-2 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-white flex items-center justify-center shadow-inner">
                <img
                  src={generatedImage}
                  alt={prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              </div>
              {generationNote && (
                <p className="text-[11px] text-slate-500 text-center">{generationNote}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-400">
              <ImageIcon className="w-10 h-10 stroke-[1.5]" />
              <p className="text-xs font-medium">Select a topic or type a prompt and click Generate</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {generatedImage && (
            <>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply to Card</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
