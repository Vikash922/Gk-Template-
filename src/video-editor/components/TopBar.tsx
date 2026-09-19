import React, { useState } from 'react';
import { useEditor } from '../store/EditorContext';
import {
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  FolderOpen,
  Smartphone,
  Monitor,
  Square,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TopBarProps {
  onBack?: () => void;
  onOpenExportModal: () => void;
  onOpenProjectManager: () => void;
  onOpenGkGenerator: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onBack,
  onOpenExportModal,
  onOpenProjectManager,
  onOpenGkGenerator,
}) => {
  const {
    project,
    updateProject,
    canUndo,
    canRedo,
    undo,
    redo,
    autosaveState,
    saveProjectNow,
  } = useEditor();

  const [projectName, setProjectName] = useState(project.name);

  const handleNameBlur = () => {
    if (projectName.trim() && projectName !== project.name) {
      updateProject((prev) => ({ ...prev, name: projectName.trim() }));
    }
  };

  const handleAspectRatioChange = (aspect: '9:16' | '16:9' | '1:1') => {
    let w = 1080;
    let h = 1920;
    if (aspect === '16:9') {
      w = 1920;
      h = 1080;
    } else if (aspect === '1:1') {
      w = 1080;
      h = 1080;
    }

    updateProject((prev) => ({
      ...prev,
      aspectRatio: aspect,
      width: w,
      height: h,
    }));
  };

  return (
    <header className="h-14 bg-[#11131a] border-b border-[#222634] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 select-none text-slate-200 z-30">
      {/* Left: Back & Project Details */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Exit Video Studio"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        )}

        {/* Project Name */}
        <div className="flex items-center gap-1.5 bg-[#181c28] border border-[#2c3246] px-2.5 py-1 rounded-lg">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Project Name..."
            className="bg-transparent text-xs font-bold text-white focus:outline-none w-28 sm:w-44 truncate"
          />
        </div>

        {/* Project Switcher */}
        <button
          type="button"
          onClick={onOpenProjectManager}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Projects / File Menu"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-[#262c3e] pl-2 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Autosave Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          {autosaveState === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
          {autosaveState === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {autosaveState === 'unsaved' && (
            <button
              type="button"
              onClick={saveProjectNow}
              className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save now</span>
            </button>
          )}
        </div>
      </div>

      {/* Center: Aspect Ratio Switcher */}
      <div className="hidden md:flex items-center gap-1 bg-[#181c28] border border-[#2c3246] p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => handleAspectRatioChange('9:16')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            project.aspectRatio === '9:16'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="9:16 Shorts / Reels Portrait"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16</span>
        </button>

        <button
          type="button"
          onClick={() => handleAspectRatioChange('16:9')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            project.aspectRatio === '16:9'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="16:9 YouTube Landscape"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9</span>
        </button>

        <button
          type="button"
          onClick={() => handleAspectRatioChange('1:1')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            project.aspectRatio === '1:1'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="1:1 Square"
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1</span>
        </button>
      </div>

      {/* Right: GK Video Wizard + Export */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenGkGenerator}
          className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Auto Generate GK Video sequence from questions"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">GK Generator</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
