import React, { useState, useRef, useEffect } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { CardCanvas } from './CardCanvas';
import { CardLayoutControls } from './CardLayoutControls';
import { generateCardsZip } from '../services/exportService';
import { saveQuestionToStorage } from '../services/storage';
import { extractTopicFromQuestion, generateRelatedImage } from '../services/imageGenerator';
import { findCuratedAssetByQuery, CURATED_ASSETS } from '../constants/curatedImages';
import { DEFAULT_TEMPLATE_DATA_URI } from '../constants/defaultTemplate';
import { readFileAsDataUrl } from '../utils/image';
import {
  Layers,
  FileArchive,
  CheckCircle,
  Play,
  Sparkles,
  Upload,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  Type,
  Trash2,
  Plus,
  RefreshCw,
  FolderUp,
  AlertCircle,
  Check,
  Wand2,
  Move,
  Copy,
} from 'lucide-react';

interface BatchGeneratorProps {
  designConfig: CardDesignConfig;
  onUpdateDesignConfig?: (updated: CardDesignConfig) => void;
  onQuestionsAdded?: () => void;
  onEditInSingleEditor?: (question: GKQuestion) => void;
}

const DEFAULT_BATCH_TEXT = `1. Which country is known as the Land of the Rising Sun?
A. Japan
B. Norway
C. New Zealand
D. Australia
Ans: A

2. How many bones are in the adult human body?
A. 206
B. 208
C. 300
D. 210
Ans: A

3. Which planet is known as the Red Planet?
A. Mars
B. Venus
C. Jupiter
D. Saturn
Ans: A`;

export function parseQuestionsText(text: string): GKQuestion[] {
  if (!text || !text.trim()) return [];

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const questionMatches = [...cleanText.matchAll(/(?:^|\n)\s*(?:(?:प्रश्न|Q|Question)\s*[:.-]?\s*)?(\d+)[\.\):\s-]/gi)];

  let blocks: string[] = [];
  if (questionMatches.length > 1) {
    for (let i = 0; i < questionMatches.length; i++) {
      const start = questionMatches[i].index!;
      const end = i < questionMatches.length - 1 ? questionMatches[i + 1].index! : cleanText.length;
      blocks.push(cleanText.slice(start, end).trim());
    }
  } else {
    blocks = cleanText.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  }

  const results: GKQuestion[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let qLine = lines[0];
    let qNumber = idx + 1;

    const numMatch = qLine.match(/^(?:(?:प्रश्न|Q|Question)\s*[:.-]?\s*)?(\d+)[\.\):\s-]\s*(.*)/i);
    if (numMatch) {
      qNumber = parseInt(numMatch[1], 10) || idx + 1;
      qLine = numMatch[2] || qLine;
    } else {
      qLine = qLine.replace(/^(?:प्रश्न|Q|Question)\s*[:.-]?\s*/i, '');
    }

    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let ans = 'A';

    const optAPattern = /^(?:[Aa]|[1]|[क]|\([Aa]\)|\([1]\)|\([क]\))[\.\):\-\s]\s*(.*)/i;
    const optBPattern = /^(?:[Bb]|[2]|[ख]|\([Bb]\)|\([2]\)|\([ख]\))[\.\):\-\s]\s*(.*)/i;
    const optCPattern = /^(?:[Cc]|[3]|[ग]|\([Cc]\)|\([3]\)|\([ग]\))[\.\):\-\s]\s*(.*)/i;
    const optDPattern = /^(?:[Dd]|[4]|[घ]|\([Dd]\)|\([4]\)|\([घ]\))[\.\):\-\s]\s*(.*)/i;
    const ansPattern = /^(?:Ans|Answer|उत्तर|सही उत्तर)\s*[:.-]?\s*([A-Da-d1-4])/i;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      const ansMatch = line.match(ansPattern);
      if (ansMatch) {
        const val = ansMatch[1].toUpperCase();
        if (val === '1' || val === 'A') ans = 'A';
        else if (val === '2' || val === 'B') ans = 'B';
        else if (val === '3' || val === 'C') ans = 'C';
        else if (val === '4' || val === 'D') ans = 'D';
        continue;
      }

      const matchA = line.match(optAPattern);
      if (matchA) {
        optA = matchA[1];
        continue;
      }

      const matchB = line.match(optBPattern);
      if (matchB) {
        optB = matchB[1];
        continue;
      }

      const matchC = line.match(optCPattern);
      if (matchC) {
        optC = matchC[1];
        continue;
      }

      const matchD = line.match(optDPattern);
      if (matchD) {
        optD = matchD[1];
        continue;
      }
    }

    // Fallback: If 4 option lines follow without markers
    if ((!optA || !optB) && lines.length >= 5) {
      optA = optA || lines[1];
      optB = optB || lines[2];
      optC = optC || lines[3];
      optD = optD || lines[4];
    }

    // Auto extract smart image topic & transparent clipart
    const topic = extractTopicFromQuestion(qLine);
    const asset = findCuratedAssetByQuery(`${topic} ${qLine}`);

    if (qLine) {
      results.push({
        id: `batch_${Date.now()}_${idx}`,
        questionNumber: qNumber,
        question: qLine,
        optionA: optA || 'Option A',
        optionB: optB || 'Option B',
        optionC: optC || 'Option C',
        optionD: optD || 'Option D',
        correctAnswer: ans as 'A' | 'B' | 'C' | 'D',
        imageTopic: topic,
        image: asset.svgDataUri,
        imageMode: 'library',
        createdAt: Date.now() + idx,
        updatedAt: Date.now() + idx,
      });
    }
  });

  return results;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  designConfig,
  onUpdateDesignConfig,
  onQuestionsAdded,
  onEditInSingleEditor,
}) => {
  const [batchText, setBatchText] = useState<string>(DEFAULT_BATCH_TEXT);
  const [questions, setQuestions] = useState<GKQuestion[]>(() => parseQuestionsText(DEFAULT_BATCH_TEXT));
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleCardInputRef = useRef<HTMLInputElement>(null);
  const activeUploadCardIdx = useRef<number>(0);

  const [bulkUploadNote, setBulkUploadNote] = useState<string>('');
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState<boolean>(false);
  const [generatingCardIdx, setGeneratingCardIdx] = useState<number | null>(null);

  // Layout & Scope controls
  const [applyScope, setApplyScope] = useState<'all' | 'single'>('all');
  const [batchTab, setBatchTab] = useState<'text' | 'layout' | 'images'>('text');
  const singlePngForAllInputRef = useRef<HTMLInputElement>(null);

  const currentCard = questions[selectedIndex] || questions[0];

  // Auto-parse initial text on mount if empty
  useEffect(() => {
    if (questions.length === 0 && batchText.trim()) {
      setQuestions(parseQuestionsText(batchText));
    }
  }, []);

  const handleLocalParse = () => {
    const parsed = parseQuestionsText(batchText);
    if (parsed.length === 0) {
      alert('Please enter valid questions and 4 options (A, B, C, D).');
      return;
    }
    setQuestions(parsed);
    setSelectedIndex(0);
    setCompleted(false);
  };

  const handleGeminiSmartParse = async () => {
    if (!batchText.trim()) return;
    setIsAiParsing(true);
    try {
      const { parseQuestionsBrowser } = await import('../services/aiService');
      const data = await parseQuestionsBrowser(batchText);

      if (Array.isArray(data.questions) && data.questions.length > 0) {
          const parsed: GKQuestion[] = data.questions.map((q: any, i: number) => {
            const topic = q.imageTopic || extractTopicFromQuestion(q.question);
            const asset = findCuratedAssetByQuery(`${topic} ${q.question}`);
            return {
              id: `gemini_batch_${Date.now()}_${i}`,
              questionNumber: q.questionNumber || i + 1,
              question: q.question || '',
              optionA: q.optionA || '',
              optionB: q.optionB || '',
              optionC: q.optionC || '',
              optionD: q.optionD || '',
              correctAnswer: q.correctAnswer || 'A',
              imageTopic: topic,
              image: asset.svgDataUri,
              imageMode: 'library',
              createdAt: Date.now() + i,
              updatedAt: Date.now() + i,
            };
          });

          setQuestions(parsed);
          setSelectedIndex(0);
          setCompleted(false);
          return;
        }
      // Fallback if endpoint not configured or offline
      handleLocalParse();
    } catch (err) {
      console.warn('Gemini batch parse fallback:', err);
      handleLocalParse();
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateDesignConfig) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onUpdateDesignConfig({
          ...designConfig,
          templateImage: dataUrl,
          useTemplateImage: true,
          templatePreprintedLetters: false, // User custom template: preserve A, B, C, D labels!
          showOptionLetters: true,
          templateWidth: img.naturalWidth,
          templateHeight: img.naturalHeight,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleResetTemplate = () => {
    if (!onUpdateDesignConfig) return;
    onUpdateDesignConfig({
      ...designConfig,
      templateImage: '',
      useTemplateImage: false,
      templatePreprintedLetters: false,
    });
  };

  // Layout update handler respecting scope (All vs Single)
  const handleBatchDesignUpdate = (updated: Partial<CardDesignConfig>) => {
    if (applyScope === 'all') {
      if (onUpdateDesignConfig) {
        onUpdateDesignConfig({ ...designConfig, ...updated });
      }
    } else {
      setQuestions((prev) => {
        const copy = [...prev];
        if (copy[selectedIndex]) {
          copy[selectedIndex] = {
            ...copy[selectedIndex],
            customDesign: {
              ...(copy[selectedIndex].customDesign || {}),
              ...updated,
            },
            updatedAt: Date.now(),
          };
        }
        return copy;
      });
    }
  };

  const handleApplyCurrentLayoutToAll = () => {
    const currentCustom = currentCard?.customDesign
      ? { ...designConfig, ...currentCard.customDesign }
      : designConfig;
    if (onUpdateDesignConfig) {
      onUpdateDesignConfig(currentCustom);
    }
    // Remove individual overrides so all cards have this unified design
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        customDesign: undefined,
        updatedAt: Date.now(),
      }))
    );
    setBulkUploadNote(`Layout of Card #${selectedIndex + 1} applied to all ${questions.length} cards successfully!`);
  };

  const handleResetCardCustomLayout = () => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[selectedIndex]) {
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          customDesign: undefined,
          updatedAt: Date.now(),
        };
      }
      return copy;
    });
    setBulkUploadNote(`Layout of Card #${selectedIndex + 1} reset to default.`);
  };

  const handleApplyCurrentPngToAll = () => {
    if (!currentCard?.image) {
      alert('Please upload or select an image first.');
      return;
    }
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        image: currentCard.image,
        imageTopic: currentCard.imageTopic,
        imageMode: currentCard.imageMode || 'upload',
        updatedAt: Date.now(),
      }))
    );
    setBulkUploadNote(`Image of current card applied to all ${questions.length} cards!`);
  };

  const handleUploadOnePngForAllCards = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const topic = file.name.replace(/\.[^/.]+$/, '');
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          image: dataUrl,
          imageTopic: topic,
          imageMode: 'upload',
          updatedAt: Date.now(),
        }))
      );
      setBulkUploadNote(`Uploaded image "${file.name}" applied to all ${questions.length} cards!`);
    } catch (err) {
      console.error('Error uploading PNG for all cards:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleUpdateCurrentCard = (field: keyof GKQuestion, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[selectedIndex]) {
        updated[selectedIndex] = {
          ...updated[selectedIndex],
          [field]: value,
          updatedAt: Date.now(),
        };
      }
      return updated;
    });
  };

  const handleAutoAssignImage = async (idx: number) => {
    const targetQ = questions[idx];
    if (!targetQ) return;

    setGeneratingCardIdx(idx);
    const topic = targetQ.imageTopic || extractTopicFromQuestion(targetQ.question);
    try {
      const result = await generateRelatedImage({ questionText: targetQ.question, topic });
      setQuestions((prev) => {
        const updated = [...prev];
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            image: result.imageUrl,
            imageTopic: topic,
            imageMode: 'ai',
            updatedAt: Date.now(),
          };
        }
        return updated;
      });
    } finally {
      setGeneratingCardIdx(null);
    }
  };

  // 1. Bulk PNG Upload for all questions at once
  const handleBulkPngUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    if (questions.length === 0) {
      alert('Please parse questions first so the images can be assigned to the questions.');
      return;
    }

    const readPromises = files.map(async (file) => {
      const dataUrl = await readFileAsDataUrl(file);
      // Extract numbers from filename (e.g., '1.png', 'q2.png', 'card_3.png')
      const match = file.name.match(/(?:q|question|_|-|\s|^)(\d+)/i);
      const extractedNum = match ? parseInt(match[1], 10) : null;
      return {
        filename: file.name,
        extractedNum,
        dataUrl,
      };
    });

    const loadedFiles = await Promise.all(readPromises);

    setQuestions((prev) => {
      const updated = [...prev];
      let assignedCount = 0;
      const unmatchedFiles: typeof loadedFiles = [];
      const assignedIndices = new Set<number>();

      // Match by extracted number
      loadedFiles.forEach((f) => {
        if (f.extractedNum !== null) {
          const targetIndex = updated.findIndex(
            (q, idx) => q.questionNumber === f.extractedNum || idx + 1 === f.extractedNum
          );
          if (targetIndex !== -1 && !assignedIndices.has(targetIndex)) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              image: f.dataUrl,
              imageTopic: f.filename.replace(/\.[^/.]+$/, ''),
              imageMode: 'upload',
              updatedAt: Date.now(),
            };
            assignedIndices.add(targetIndex);
            assignedCount++;
          } else {
            unmatchedFiles.push(f);
          }
        } else {
          unmatchedFiles.push(f);
        }
      });

      // Match remaining files sequentially
      let currQIdx = 0;
      unmatchedFiles.forEach((f) => {
        while (currQIdx < updated.length && assignedIndices.has(currQIdx)) {
          currQIdx++;
        }
        if (currQIdx < updated.length) {
          updated[currQIdx] = {
            ...updated[currQIdx],
            image: f.dataUrl,
            imageTopic: f.filename.replace(/\.[^/.]+$/, ''),
            imageMode: 'upload',
            updatedAt: Date.now(),
          };
          assignedIndices.add(currQIdx);
          assignedCount++;
          currQIdx++;
        }
      });

      setBulkUploadNote(`Done! Assigned ${assignedCount} PNG images to your batch questions.`);
      return updated;
    });

    if (e.target) e.target.value = '';
  };

  // 2. Single card PNG upload
  const handleSingleCardUploadClick = (idx: number) => {
    activeUploadCardIdx.current = idx;
    singleCardInputRef.current?.click();
  };

  const handleSingleCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetIdx = activeUploadCardIdx.current;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setQuestions((prev) => {
        const updated = [...prev];
        if (updated[targetIdx]) {
          updated[targetIdx] = {
            ...updated[targetIdx],
            image: dataUrl,
            imageTopic: file.name.replace(/\.[^/.]+$/, ''),
            imageMode: 'upload',
            updatedAt: Date.now(),
          };
        }
        return updated;
      });
      setBulkUploadNote(`Image updated for Question #${questions[targetIdx]?.questionNumber || targetIdx + 1}`);
    } catch (err) {
      console.error(err);
    }
    if (e.target) e.target.value = '';
  };

  // 3. Auto-generate AI images for all cards in the batch
  const handleAutoGenerateAllAiImages = async () => {
    if (questions.length === 0) return;
    setIsGeneratingAllImages(true);
    setBulkUploadNote('Generating AI clipart for all questions sequentially...');

    try {
      const updated = [...questions];
      for (let i = 0; i < updated.length; i++) {
        setGeneratingCardIdx(i);
        const q = updated[i];
        const topic = q.imageTopic || extractTopicFromQuestion(q.question);
        try {
          const result = await generateRelatedImage({ questionText: q.question, topic });
          updated[i] = {
            ...updated[i],
            image: result.imageUrl,
            imageTopic: topic,
            imageMode: 'ai',
            updatedAt: Date.now(),
          };
          setQuestions([...updated]);
        } catch (e) {
          console.warn(`Failed image for card ${i + 1}`, e);
        }
      }
      setBulkUploadNote('All batch card images generated successfully with Gemini AI!');
    } finally {
      setIsGeneratingAllImages(false);
      setGeneratingCardIdx(null);
    }
  };

  // 4. Clear all images
  const handleClearAllImages = () => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        image: undefined,
        imageMode: 'none',
        updatedAt: Date.now(),
      }))
    );
    setBulkUploadNote('All images removed from cards.');
  };

  const handleGenerateAndExportZip = async () => {
    let listToExport = questions;
    if (listToExport.length === 0) {
      listToExport = parseQuestionsText(batchText);
      setQuestions(listToExport);
    }

    if (listToExport.length === 0) {
      alert('Please parse at least one question before exporting.');
      return;
    }

    setIsGenerating(true);
    setCompleted(false);
    setProgress({ current: 0, total: listToExport.length });

    try {
      // Save all parsed questions into storage
      listToExport.forEach((q) => saveQuestionToStorage(q));
      if (onQuestionsAdded) onQuestionsAdded();

      // Export all to ZIP
      await generateCardsZip(listToExport, designConfig, (current, total) => {
        setProgress({ current, total });
      });

      setCompleted(true);
    } catch (err) {
      alert('Batch card generation failed. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Batch Question Card Studio
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Paste multiple questions, upload your blank PNG template, live preview every card, and download all as high-resolution PNGs in one click.
            </p>
          </div>

          {/* Template Controls in Batch Bar */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs">
            <span className="font-semibold text-slate-700 pl-1">Template:</span>
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PNG Template</span>
            </button>
            <button
              type="button"
              onClick={handleResetTemplate}
              className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Reset to default template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Area for Pasting Questions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Paste Raw Questions (Format: Number, Question, A, B, C, D options):
            </span>
            <span className="text-slate-400">Supports Hindi Devanagari & English</span>
          </div>

          <textarea
            rows={7}
            value={batchText}
            onChange={(e) => {
              setBatchText(e.target.value);
              setCompleted(false);
            }}
            placeholder="1. Which country is known as the Land of the Rising Sun?&#10;A. Japan&#10;B. Norway&#10;C. New Zealand&#10;D. Australia&#10;&#10;2. Next question..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-xs"
          />

          {/* Action Bar for Parsing */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLocalParse}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Parse Questions & Auto-Add Images</span>
              </button>

              <button
                type="button"
                onClick={handleGeminiSmartParse}
                disabled={isAiParsing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiParsing ? 'Gemini Parsing...' : 'Gemini AI Smart Parse & Auto-Add'}</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              {questions.length} Cards in Batch
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs for batch and single card image uploading */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/*"
        className="hidden"
        onChange={handleBulkPngUpload}
      />
      <input
        ref={singleCardInputRef}
        type="file"
        accept="image/png,image/*"
        className="hidden"
        onChange={handleSingleCardFileChange}
      />

      {/* Batch PNG Bulk Upload & Individual Image Assignment Hub */}
      {questions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <ImageIcon className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Batch Images (All Cards PNG Clipart)</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                    {questions.filter((q) => !!q.image).length}/{questions.length} Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select multiple PNG files from your device to assign at once, or use Gemini AI to generate transparent clipart.
                </p>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Select multiple PNG files from your computer (e.g. 1.png, 2.png, or any order)"
              >
                <FolderUp className="w-4 h-4" />
                <span>Bulk Upload All PNGs</span>
              </button>

              <button
                type="button"
                onClick={handleAutoGenerateAllAiImages}
                disabled={isGeneratingAllImages}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAllImages ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isGeneratingAllImages
                    ? `Generating ${generatingCardIdx !== null ? `Card #${generatingCardIdx + 1}` : ''}...`
                    : 'AI Clipart for All Cards'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleClearAllImages}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Clear all assigned images"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Feedback note banner if any */}
          {bulkUploadNote && (
            <div className="flex items-center justify-between p-2.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                {bulkUploadNote}
              </span>
              <button
                type="button"
                onClick={() => setBulkUploadNote('')}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid of Batch Cards with individual image upload & preview slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const isSelected = selectedIndex === idx;
              const isThisGenerating = generatingCardIdx === idx;
              return (
                <div
                  key={q.id || idx}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-200 font-mono text-[11px] font-bold text-slate-800 shrink-0">
                        Q.{q.questionNumber || idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 truncate" title={q.question}>
                        {q.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`text-[11px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                        }`}
                      >
                        {isSelected ? 'Previewing' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestions((prev) => prev.filter((_, i) => i !== idx));
                          if (selectedIndex === idx) setSelectedIndex(0);
                        }}
                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail and controls */}
                  <div className="flex items-center gap-2.5">
                    {/* Image Preview Box with transparency pattern */}
                    <div
                      onClick={() => handleSingleCardUploadClick(idx)}
                      className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center relative group cursor-pointer overflow-hidden shrink-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]"
                      title="Click to select custom PNG for this card"
                    >
                      {isThisGenerating ? (
                        <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                      ) : q.image ? (
                        <img
                          src={q.image}
                          alt={`Q${idx + 1}`}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center font-medium">
                          No PNG
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Card Clipart Controls */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSingleCardUploadClick(idx)}
                          className="text-[11px] px-2 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center gap-1 cursor-pointer truncate"
                          title="Upload PNG for this card"
                        >
                          <Upload className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Upload</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAutoAssignImage(idx)}
                          disabled={isThisGenerating}
                          className="text-[11px] px-2 py-1 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-semibold flex items-center gap-1 cursor-pointer truncate"
                          title="Generate AI Clipart for this question"
                        >
                          {isThisGenerating ? (
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                          ) : (
                            <Wand2 className="w-3 h-3 shrink-0" />
                          )}
                          <span>AI</span>
                        </button>
                      </div>

                      {q.image && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) => {
                              const updated = [...prev];
                              if (updated[idx]) {
                                updated[idx] = { ...updated[idx], image: undefined, imageMode: 'none' };
                              }
                              return updated;
                            });
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 text-left font-medium cursor-pointer"
                        >
                          Remove PNG
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Batch Cards Preview & Visual Editor */}
      {questions.length > 0 && currentCard && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
          {/* Left Column: Live Card Canvas Preview (7 cols) */}
          <div className="order-1 lg:order-1 lg:col-span-7 flex flex-col gap-4 sticky top-16 lg:top-24 z-30">
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4">
              {/* Card Navigation Switcher */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Card Preview ({selectedIndex + 1} of {questions.length})
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                    Q.{currentCard.questionNumber}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedIndex === 0}
                    onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 px-1">
                    {selectedIndex + 1} / {questions.length}
                  </span>
                  <button
                    type="button"
                    disabled={selectedIndex === questions.length - 1}
                    onClick={() => setSelectedIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rendered Live Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900">
                <CardCanvas
                  question={currentCard}
                  designConfig={
                    currentCard.customDesign
                      ? { ...designConfig, ...currentCard.customDesign }
                      : designConfig
                  }
                />
              </div>

              {/* Quick Font & Size Bar */}
              {onUpdateDesignConfig && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Type className="w-3.5 h-3.5 text-emerald-600" />
                      Global Font Size Quick Tweak
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      (Scope: {applyScope === 'all' ? 'All Cards' : `Card #${selectedIndex + 1}`})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Question Font Size</span>
                        <span className="font-mono text-emerald-700 font-bold">{designConfig.questionBaseFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="32"
                        max="84"
                        step="2"
                        value={
                          (currentCard.customDesign?.questionBaseFontSize ?? designConfig.questionBaseFontSize)
                        }
                        onChange={(e) =>
                          handleBatchDesignUpdate({
                            questionBaseFontSize: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Option Font Size</span>
                        <span className="font-mono text-amber-700 font-bold">
                          {currentCard.customDesign?.optionBaseFontSize ?? designConfig.optionBaseFontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="28"
                        max="88"
                        step="2"
                        value={
                          currentCard.customDesign?.optionBaseFontSize ?? designConfig.optionBaseFontSize
                        }
                        onChange={(e) =>
                          handleBatchDesignUpdate({
                            optionBaseFontSize: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Master Download All ZIP Button */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateAndExportZip}
                  disabled={isGenerating}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>
                        Generating PNG Cards ({progress?.current || 0}/{progress?.total || 0})...
                      </span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-5 h-5" />
                      <span>Download All ({questions.length}) Cards as ZIP</span>
                    </>
                  )}
                </button>

                {/* Progress bar */}
                {isGenerating && progress && (
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}

                {/* Success alert */}
                {completed && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Done! All {questions.length} PNG cards have been created with your uploaded template and downloaded as GK-Cards.zip!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Multi-tab Card & Layout Customizer (5 cols) */}
          <div className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
              {/* Header with Card Switcher & Full Editor link */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Editing Card #{selectedIndex + 1}
                  </span>
                  {currentCard.customDesign && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                      Custom Layout Active
                    </span>
                  )}
                </div>

                {onEditInSingleEditor && (
                  <button
                    type="button"
                    onClick={() => onEditInSingleEditor(currentCard)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    Open in Full Editor →
                  </button>
                )}
              </div>

              {/* Editor Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBatchTab('text')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    batchTab === 'text'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>1. Text & Options</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchTab('layout')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    batchTab === 'layout'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>2. Position & ABCD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchTab('images')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    batchTab === 'images'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>3. PNG & Clipart</span>
                </button>
              </div>

              {/* TAB 1: QUESTION & OPTIONS TEXT */}
              {batchTab === 'text' && (
                <div className="flex flex-col gap-3">
                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Question #{currentCard.questionNumber} Text:
                    </label>
                    <textarea
                      rows={3}
                      value={currentCard.question}
                      onChange={(e) => handleUpdateCurrentCard('question', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Option A:</label>
                      <input
                        type="text"
                        value={currentCard.optionA}
                        onChange={(e) => handleUpdateCurrentCard('optionA', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Option B:</label>
                      <input
                        type="text"
                        value={currentCard.optionB}
                        onChange={(e) => handleUpdateCurrentCard('optionB', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Option C:</label>
                      <input
                        type="text"
                        value={currentCard.optionC}
                        onChange={(e) => handleUpdateCurrentCard('optionC', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Option D:</label>
                      <input
                        type="text"
                        value={currentCard.optionD}
                        onChange={(e) => handleUpdateCurrentCard('optionD', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Correct Answer Selector */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-semibold text-slate-700">Correct Answer:</span>
                    <div className="flex gap-1.5">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleUpdateCurrentCard('correctAnswer', opt)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentCard.correctAnswer === opt
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: POSITION, SIZING, AND ABCD LABELS */}
              {batchTab === 'layout' && (
                <div className="flex flex-col gap-3">
                  <CardLayoutControls
                    designConfig={
                      currentCard.customDesign
                        ? { ...designConfig, ...currentCard.customDesign }
                        : designConfig
                    }
                    applyMode={applyScope}
                    onSetApplyMode={setApplyScope}
                    onUpdateDesign={handleBatchDesignUpdate}
                    onApplyCurrentToAll={handleApplyCurrentLayoutToAll}
                    onResetCardCustomDesign={handleResetCardCustomLayout}
                    currentCard={currentCard}
                    totalCardsCount={questions.length}
                    currentCardNumber={currentCard.questionNumber || selectedIndex + 1}
                  />
                </div>
              )}

              {/* TAB 3: PNG CLIPART & LOGO ASSIGNMENT */}
              {batchTab === 'images' && (
                <div className="flex flex-col gap-3">
                  {/* Global One-Click Apply to All Controls */}
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderUp className="w-3.5 h-3.5 text-purple-700" />
                      Bulk PNG Actions (Apply Across All Cards)
                    </span>

                    <input
                      ref={singlePngForAllInputRef}
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={handleUploadOnePngForAllCards}
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => singlePngForAllInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload 1 PNG for ALL Cards</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyCurrentPngToAll}
                        disabled={!currentCard.image}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-300 text-purple-900 text-xs font-semibold hover:bg-purple-100 disabled:opacity-40 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Apply Current PNG to All Cards</span>
                      </button>
                    </div>
                  </div>

                  {/* Current Card Clipart */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        Card #{selectedIndex + 1} Clipart Image
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAutoAssignImage(selectedIndex)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-emerald-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Auto-Match AI PNG
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-200/80 border border-slate-300 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {currentCard.image ? (
                          <img
                            src={currentCard.image}
                            alt="Subject clipart"
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-slate-700 truncate">
                          Topic: {currentCard.imageTopic || 'Auto Subject'}
                        </span>
                        <input
                          type="text"
                          value={currentCard.imageTopic || ''}
                          onChange={(e) => handleUpdateCurrentCard('imageTopic', e.target.value)}
                          placeholder="e.g. tiger, india gate, brain..."
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* Quick Asset Picker */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {CURATED_ASSETS.slice(0, 8).map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            handleUpdateCurrentCard('image', asset.svgDataUri);
                            handleUpdateCurrentCard('imageTopic', asset.name);
                          }}
                          className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 p-1 shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                          title={asset.name}
                        >
                          <img
                            src={asset.svgDataUri}
                            alt={asset.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Question Cards Carousel / List */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  Select Question Card ({questions.length} total):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        selectedIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>#{q.questionNumber || idx + 1}</span>
                      {q.customDesign && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Custom layout override" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
