import React, { useState } from 'react';
import { EditorProvider, useEditor } from '../store/EditorContext';
import { TopBar } from './TopBar';
import { LeftToolbar } from './LeftToolbar';
import { CenterPreview } from './CenterPreview';
import { Inspector } from './Inspector';
import { Timeline } from './Timeline';
import { ExportModal } from './ExportModal';
import { ProjectManagerModal } from './ProjectManagerModal';
import { GKVideoPanel } from './GKVideoPanel';
import { VideoProject } from '../types';
import {
  SlidersHorizontal,
  Layers,
  Sparkles,
  Download,
  X,
} from 'lucide-react';

interface VideoEditorProps {
  initialProject?: VideoProject;
  onBack?: () => void;
}

const EditorInner: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { selectedClip } = useEditor();
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);
  const [isGkGeneratorOpen, setIsGkGeneratorOpen] = useState<boolean>(false);

  // Mobile navigation bottom sheet drawer
  const [mobileActiveSheet, setMobileActiveSheet] = useState<'none' | 'tools' | 'inspector'>('none');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-slate-100 overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <TopBar
        onBack={onBack}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenGkGenerator={() => setIsGkGeneratorOpen(true)}
      />

      {/* 2. MIDDLE WORKSPACE (Left Tools + Center Preview + Right Inspector on desktop) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Toolbar (Desktop) */}
        <div className="hidden md:flex h-full">
          <LeftToolbar />
        </div>

        {/* Center Canvas Preview */}
        <CenterPreview />

        {/* Right Property Inspector (Desktop) */}
        <div className="hidden lg:flex h-full">
          <Inspector />
        </div>
      </div>

      {/* 3. MULTI-TRACK TIMELINE (Always accessible) */}
      <div className="block shrink-0">
        <Timeline />
      </div>

      {/* 4. MOBILE BOTTOM DOCK NAV */}
      <div className="h-12 bg-[#10121a] border-t border-[#1e2332] px-3 flex lg:hidden items-center justify-around text-[10px] font-bold text-slate-400 shrink-0 select-none">
        <button
          type="button"
          onClick={() => setMobileActiveSheet('tools')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg cursor-pointer transition-colors ${
            mobileActiveSheet === 'tools' ? 'text-blue-400 bg-blue-600/20' : 'hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tools</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveSheet('inspector')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg cursor-pointer relative transition-colors ${
            mobileActiveSheet === 'inspector' ? 'text-blue-400 bg-blue-600/20' : 'hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Inspector</span>
          {selectedClip && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsGkGeneratorOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>GK Auto</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* 5. MOBILE BOTTOM SHEET (Smooth slide-up for full Tools and Inspector without squashing) */}
      {mobileActiveSheet !== 'none' && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div
            className="flex-1"
            onClick={() => setMobileActiveSheet('none')}
          />
          <div className="h-[74vh] max-h-[85vh] bg-[#121520] border-t border-[#262d40] rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="px-4 py-2.5 bg-[#161a28] border-b border-[#22293c] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  {mobileActiveSheet === 'tools' ? 'Studio Tools & Elements' : 'Clip Inspector'}
                </span>
                {mobileActiveSheet === 'inspector' && selectedClip && (
                  <span className="text-[10px] bg-blue-950/60 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                    {selectedClip.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileActiveSheet('none')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>

            {/* Sheet Content with full scrolling */}
            <div className="flex-1 overflow-hidden min-h-0 relative">
              {mobileActiveSheet === 'tools' ? <LeftToolbar /> : <Inspector />}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODALS */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
      />
      <GKVideoPanel
        isOpen={isGkGeneratorOpen}
        onClose={() => setIsGkGeneratorOpen(false)}
      />
    </div>
  );
};

export const VideoEditor: React.FC<VideoEditorProps> = ({ initialProject, onBack }) => {
  return (
    <EditorProvider initialProject={initialProject}>
      <EditorInner onBack={onBack} />
    </EditorProvider>
  );
};

export default VideoEditor;
