import React, { useState, useRef, useEffect } from 'react';
import { GKQuestion } from '../types/question';
import { CardDesignConfig } from '../types/design';
import { downloadCardAsPNG } from '../services/exportService';
import { findCuratedAssetByQuery } from '../constants/curatedImages';
import { useToast } from './Toast';
import {
  Pencil,
  Copy,
  Trash2,
  Download,
  MoreVertical,
  Sparkles,
  Check,
} from 'lucide-react';

interface SavedQuestionCardProps {
  question: GKQuestion;
  designConfig: CardDesignConfig;
  onEdit: (q: GKQuestion) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SavedQuestionCard: React.FC<SavedQuestionCardProps> = ({
  question,
  designConfig,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      showToast('Downloading PNG...', 'info', 1500);
      await downloadCardAsPNG(question, designConfig, '1920x1080');
      showToast('✓ PNG downloaded', 'success');
    } catch (err) {
      showToast('Failed to download card PNG.', 'error');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Thumbnail fallback
  let thumbSrc = question.image;
  if (!thumbSrc && question.imageMode !== 'none') {
    thumbSrc = findCuratedAssetByQuery(`${question.imageTopic || ''} ${question.question}`).svgDataUri;
  }

  return (
    <div
      onClick={() => onEdit(question)}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Number Badge */}
        <span className="w-8 h-8 shrink-0 rounded-lg bg-red-50 text-red-600 font-extrabold flex items-center justify-center text-xs border border-red-100 shadow-2xs">
          #{question.questionNumber}
        </span>

        {/* Question Title & Options */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-950">
            {question.question}
          </h3>

          <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[11px] text-slate-600">
            <div className="truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <span className="font-bold text-amber-700">A.</span> {question.optionA}
            </div>
            <div className="truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <span className="font-bold text-amber-700">B.</span> {question.optionB}
            </div>
            <div className="truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <span className="font-bold text-amber-700">C.</span> {question.optionC}
            </div>
            <div className="truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <span className="font-bold text-amber-700">D.</span> {question.optionD}
            </div>
          </div>
        </div>

        {/* Thumbnail Preview */}
        {thumbSrc && (
          <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-50 border border-slate-200/70 p-0.5 flex items-center justify-center overflow-hidden hidden sm:flex">
            <img src={thumbSrc} alt="Thumbnail" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs"
      >
        <span className="text-[10px] text-slate-400 font-mono">
          {new Date(question.updatedAt || question.createdAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Download PNG (1920x1080)"
          >
            {isExporting ? <Sparkles className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(question)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Edit Question"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(question.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Duplicate Question"
            aria-label="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Three-Dot Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="More Actions"
              aria-label="More actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-7 z-30 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 flex flex-col text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(question.id);
                  }}
                  className="px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(question.id);
                  }}
                  className="px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                  <span>Delete Card</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
