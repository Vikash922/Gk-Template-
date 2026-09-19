import React, { useState } from 'react';
import { EditorProvider } from '../store/EditorContext';
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
  Film,
  Layers,
  Sparkles,
} from 'lucide-react';

interface VideoEditorProps {
  initialProject?: VideoProject;
  onBack?: () => void;
}

const EditorInner: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);
  const [isGkGeneratorOpen, setIsGkGeneratorOpen] = useState<boolean>(false);

  // Mobile navigation tab switcher
  const [mobileBottomTab, setMobileBottomTab] = useState<'timeline' | 'inspector' | 'tools'>('timeline');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-slate-100 overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <TopBar
        onBack={onBack}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenGkGenerator={() => setIsGkGeneratorOpen(true)}
      />

      {/* 2. MIDDLE WORKSPACE (Left Tools + Center Preview + Right Inspector) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Toolbar (Hidden on small mobile screens unless active) */}
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

      {/* 3. MOBILE TAB CONTENT (Shown on Mobile if Inspector or Tools selected) */}
      <div className="block lg:hidden">
        {mobileBottomTab === 'inspector' && (
          <div className="h-64 border-t border-[#222634] bg-[#12151f]">
            <Inspector />
          </div>
        )}
        {mobileBottomTab === 'tools' && (
          <div className="h-64 border-t border-[#222634] bg-[#12151f] overflow-x-auto">
            <LeftToolbar />
          </div>
        )}
      </div>

      {/* 4. BOTTOM MULTI-TRACK TIMELINE */}
      <div className={mobileBottomTab === 'timeline' ? 'block' : 'hidden lg:block'}>
        <Timeline />
      </div>

      {/* 5. MOBILE BOTTOM DOCK NAV */}
      <div className="h-11 bg-[#10121a] border-t border-[#1e2332] px-3 flex md:hidden items-center justify-around text-[10px] font-bold text-slate-400 shrink-0">
        <button
          type="button"
          onClick={() => setMobileBottomTab('timeline')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg cursor-pointer ${
            mobileBottomTab === 'timeline' ? 'bg-blue-600/20 text-blue-400' : 'hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileBottomTab('tools')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg cursor-pointer ${
            mobileBottomTab === 'tools' ? 'bg-blue-600/20 text-blue-400' : 'hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileBottomTab('inspector')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg cursor-pointer ${
            mobileBottomTab === 'inspector' ? 'bg-blue-600/20 text-blue-400' : 'hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>

        <button
          type="button"
          onClick={() => setIsGkGeneratorOpen(true)}
          className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-purple-400 hover:text-purple-300 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>GK Auto</span>
        </button>
      </div>

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
