import React, { useState, useRef } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import {
  autoGenerateImageForQuestion,
  generateImageWithPrompt,
  editImageWithAI,
  cleanImageBackground,
  extractTopicFromQuestion,
} from '../services/imageGenerator';
import { readFileAsDataUrl } from '../utils/image';
import { CURATED_ASSETS, CuratedAsset } from '../constants/curatedImages';
import { useToast } from './Toast';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Sliders,
  Scissors,
  Wand2,
  Loader2,
  Paintbrush,
  Check,
} from 'lucide-react';

interface ImageControlsProps {
  question: GKQuestion;
  designConfig: CardDesignConfig;
  onUpdateQuestion: (updated: GKQuestion) => void;
  onUpdateDesign: (updated: Partial<CardDesignConfig>) => void;
  onApplyImageToAllQuestions?: (imageDataUri: string, topic?: string) => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  question,
  designConfig,
  onUpdateQuestion,
  onUpdateDesign,
  onApplyImageToAllQuestions,
}) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [promptTab, setPromptTab] = useState<'create' | 'edit'>('create');
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [imageStyle, setImageStyle] = useState<string>('3D Cutout');
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [showCuratedGallery, setShowCuratedGallery] = useState<boolean>(false);
  const [lastConceptNote, setLastConceptNote] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTopic = question.imageTopic || extractTopicFromQuestion(question.question);
  const hasImage = Boolean(question.image && question.imageMode !== 'none');

  // 1. Auto-Generate tailored to question ("thoda different jisse pata na lage with background removed")
  const handleAutoGenerateForQuestion = async () => {
    if (!question.question || question.question.trim().length === 0) {
      showToast('Please type a question statement first', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      showToast('✨ Analyzing question and generating unique cutout...', 'info', 4500);

      const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);
      const result = await autoGenerateImageForQuestion({
        question: question.question,
        options,
        correctAnswer: question.correctAnswer,
        style: imageStyle,
        autoRemoveBg,
      });

      onUpdateQuestion({
        ...question,
        image: result.imageUrl,
        imageTopic: result.subjectTitle,
        imageMode: 'ai',
      });

      setLastConceptNote(`${result.subjectTitle}: ${result.conceptReason}`);
      showToast('✨ Unique image generated with background removed!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Could not generate image. Please try again or upload a photo.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Create Image from custom user text prompt
  const handleCreateWithPrompt = async () => {
    if (!textPrompt.trim()) {
      showToast('Please enter a description for the image', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      showToast('🎨 Creating image from your prompt...', 'info', 4500);
      const result = await generateImageWithPrompt(textPrompt, imageStyle, autoRemoveBg);

      onUpdateQuestion({
        ...question,
        image: result.imageUrl,
        imageTopic: textPrompt.slice(0, 30),
        imageMode: 'ai',
      });
      showToast('Image created successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Image creation failed. Please try a different prompt.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Edit Current Image with prompt
  const handleEditWithPrompt = async () => {
    if (!question.image) {
      showToast('No active image to edit', 'error');
      return;
    }
    if (!editPrompt.trim()) {
      showToast('Please specify what changes to make', 'error');
      return;
    }

    setIsEditing(true);
    try {
      showToast('🪄 Applying AI edits to image...', 'info', 5000);
      const result = await editImageWithAI(question.image, editPrompt, autoRemoveBg);

      onUpdateQuestion({
        ...question,
        image: result.imageUrl,
        imageTopic: `${question.imageTopic || 'Edited'} (${editPrompt.slice(0, 15)})`,
        imageMode: 'ai',
      });
      showToast('Image edited successfully!', 'success');
      setEditPrompt('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Image editing failed', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  // 4. One-Click Background Removal on active image
  const handleRemoveBackground = async () => {
    if (!question.image) return;

    setIsRemovingBg(true);
    try {
      const transparentUrl = await cleanImageBackground(question.image, 32);
      onUpdateQuestion({
        ...question,
        image: transparentUrl,
      });
      showToast('✂️ Background removed successfully!', 'success');
    } catch (err) {
      showToast('Could not remove background.', 'error');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      let dataUrl = await readFileAsDataUrl(file);
      if (autoRemoveBg && !file.type.includes('svg')) {
        dataUrl = await cleanImageBackground(dataUrl, 30);
      }
      onUpdateQuestion({
        ...question,
        image: dataUrl,
        imageMode: 'upload',
      });
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast('Error loading image.', 'error');
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    onUpdateQuestion({
      ...question,
      image: undefined,
      imageMode: 'none',
    });
    setLastConceptNote('');
    showToast('Image removed', 'info');
  };

  const handleSelectCurated = (asset: CuratedAsset) => {
    onUpdateQuestion({
      ...question,
      image: asset.svgDataUri,
      imageTopic: asset.name,
      imageMode: 'library',
    });
    showToast(`Selected "${asset.name}"`, 'success');
  };

  const quickCreateSuggestions = [
    '3D Cutout',
    'Subtle Symbol',
    'Scientific Model',
    'Historical Monument',
    'Nature & Wildlife',
  ];

  const quickEditSuggestions = [
    'Add a glowing blue aura',
    'Make it 3D clay style',
    'Vintage artistic sketch',
    'Sharpen edges and brighten',
  ];

  return (
    <div className="bg-transparent flex flex-col gap-3.5">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 rounded-full bg-blue-500" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Card Image & Clipart
          </h2>
        </div>

        {hasImage && onApplyImageToAllQuestions && (
          <button
            type="button"
            onClick={() => {
              onApplyImageToAllQuestions(question.image!, question.imageTopic);
              showToast('Image applied to all cards!', 'success');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Apply this PNG to all saved question cards"
          >
            <Copy className="w-3.5 h-3.5 text-purple-600" />
            <span>Apply to All Cards</span>
          </button>
        )}
      </div>

      {/* 1. HERO FEATURE: Auto-Generate Image Related to Question */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 border border-purple-200/70 shadow-2xs flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Auto-Generate from Question</span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-200/70 text-purple-800 text-[10px] font-semibold">
                  Unique & Subtle
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Automatically creates a distinctive 3D cutout related to the question with background removed.
              </p>
            </div>
          </div>
        </div>

        {lastConceptNote && (
          <div className="p-2 rounded-xl bg-white/80 border border-purple-100 text-[11px] text-purple-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">{lastConceptNote}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAutoGenerateForQuestion}
            disabled={isGenerating}
            className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Unique Cutout...' : '✨ Auto-Generate for Question'}</span>
          </button>

          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 px-2.5 py-2 bg-white/90 rounded-xl border border-purple-100 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemoveBg}
              onChange={(e) => setAutoRemoveBg(e.target.checked)}
              className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
            />
            <span>Transparent BG</span>
          </label>
        </div>
      </div>

      {/* 2. PROMPT STUDIO: Create or Edit with Text Prompt */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPromptTab('create')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer text-[11px] ${
                promptTab === 'create' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1">
                <Paintbrush className="w-3 h-3" />
                Prompt to Create
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPromptTab('edit')}
              disabled={!hasImage}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer text-[11px] ${
                promptTab === 'edit'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : hasImage
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
              title={hasImage ? 'Edit active image with AI' : 'Upload or generate an image first'}
            >
              <span className="flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Edit Active Image
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
        </div>

        {promptTab === 'create' ? (
          /* Create Mode */
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWithPrompt()}
                placeholder="e.g. 3D golden trophy with laurel wreath, clean isolated cutout"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleCreateWithPrompt}
                disabled={isGenerating || !textPrompt.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-medium">Try:</span>
              {quickCreateSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTextPrompt(`${item} of ${currentTopic}`)}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditWithPrompt()}
                placeholder="e.g. Add a soft golden glow, make it 3D clay, sharpen edges"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleEditWithPrompt}
                disabled={isEditing || !editPrompt.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Editing...</span>
                  </>
                ) : (
                  'Apply Edit'
                )}
              </button>
            </div>

            {/* Quick Edit Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-medium">Quick edit:</span>
              {quickEditSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEditPrompt(item)}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Image Preview Box (When image exists) */}
      {hasImage && question.image ? (
        <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            {/* Checkerboard preview container */}
            <div
              className="w-18 h-18 rounded-xl border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs shrink-0"
              style={{
                backgroundImage: `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`,
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                backgroundColor: '#ffffff',
              }}
            >
              <img
                src={question.image}
                alt="Card Subject"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-800 truncate">
                {question.imageTopic || 'Card Cutout'}
              </span>
              <span className="text-[11px] text-slate-500">
                Format: {question.imageMode === 'ai' ? 'AI Cutout' : question.imageMode === 'library' ? 'Vector Preset' : 'Custom Image'}
              </span>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                  title="Make white or light background transparent"
                >
                  <Scissors className={`w-3 h-3 ${isRemovingBg ? 'animate-spin' : ''}`} />
                  <span>{isRemovingBg ? 'Removing...' : 'Remove BG'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Friendly Dropzone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-purple-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            No image added yet
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Click "Auto-Generate for Question" above or drag & drop a transparent PNG.
          </p>
        </div>
      )}

      {/* 4. Advanced Settings: Fine-tuning & Presets (Collapsible) */}
      <div className="pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Image Position & Library Presets
          </span>
          {showAdvancedSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvancedSettings && (
          <div className="flex flex-col gap-3.5 mt-2.5 pt-2.5 border-t border-slate-100 text-xs">
            {/* Quick Curated Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Educational Presets:</span>
                <button
                  type="button"
                  onClick={() => setShowCuratedGallery(!showCuratedGallery)}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  {showCuratedGallery ? 'Show Less' : 'Browse All'}
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {(showCuratedGallery ? CURATED_ASSETS : CURATED_ASSETS.slice(0, 5)).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectCurated(asset)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/40 flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 flex items-center justify-center">
                      <img src={asset.svgDataUri} alt={asset.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">
                      {asset.name.split('(')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale, Offsets & Opacity */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Scale & Offsets</span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDesign({
                      imageScale: 1,
                      imageOffsetX: 0,
                      imageOffsetY: 0,
                      imageRotation: 0,
                      imageOpacity: 1,
                    });
                    showToast('Position reset', 'info');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                    <span>Scale</span>
                    <span className="font-mono">{Math.round(designConfig.imageScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.6"
                    step="0.05"
                    value={designConfig.imageScale}
                    onChange={(e) => onUpdateDesign({ imageScale: parseFloat(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                    <span>Opacity</span>
                    <span className="font-mono">{Math.round(designConfig.imageOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={designConfig.imageOpacity}
                    onChange={(e) => onUpdateDesign({ imageOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                    <span>X Offset</span>
                    <span className="font-mono">{designConfig.imageOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="5"
                    value={designConfig.imageOffsetX}
                    onChange={(e) => onUpdateDesign({ imageOffsetX: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                    <span>Y Offset</span>
                    <span className="font-mono">{designConfig.imageOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="5"
                    value={designConfig.imageOffsetY}
                    onChange={(e) => onUpdateDesign({ imageOffsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
