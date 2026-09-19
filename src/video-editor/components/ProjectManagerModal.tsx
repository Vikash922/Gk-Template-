import React, { useState, useEffect } from 'react';
import { useEditor } from '../store/EditorContext';
import { projectStore } from '../store/ProjectStore';
import { VideoProject } from '../types';
import { createEmptyProject } from '../engine/GKVideoGenerator';
import {
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  Smartphone,
  Monitor,
  Clock,
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { project, setProject, saveProjectNow } = useEditor();
  const [projectsList, setProjectsList] = useState<VideoProject[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');

  const loadProjects = async () => {
    const list = await projectStore.getAllProjects();
    setProjectsList(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNew = async (aspectRatio: '9:16' | '16:9') => {
    await saveProjectNow();
    const newProj = createEmptyProject(`GK_Project_${Date.now().toString().slice(-4)}`, aspectRatio);
    await projectStore.saveProject(newProj);
    setProject(newProj);
    onClose();
  };

  const handleSwitchProject = async (p: VideoProject) => {
    await saveProjectNow();
    setProject(p);
    onClose();
  };

  const handleDuplicate = async (p: VideoProject) => {
    const cloned: VideoProject = {
      ...JSON.parse(JSON.stringify(p)),
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${p.name} (Copy)`,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    await projectStore.saveProject(cloned);
    await loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await projectStore.deleteProject(id);
      await loadProjects();
      if (project.id === id) {
        const fallback = createEmptyProject();
        setProject(fallback);
      }
    }
  };

  const handleStartRename = (p: VideoProject) => {
    setRenamingId(p.id);
    setRenameText(p.name);
  };

  const handleConfirmRename = async (p: VideoProject) => {
    if (renameText.trim()) {
      const updated = { ...p, name: renameText.trim() };
      await projectStore.saveProject(updated);
      if (project.id === p.id) {
        setProject(updated);
      }
      setRenamingId(null);
      await loadProjects();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-[#121520] border border-[#272e42] rounded-2xl shadow-2xl flex flex-col text-xs text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#161a28] border-b border-[#242b3e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Project Manager</h2>
              <p className="text-[10px] text-slate-400">IndexedDB Local Project Storage</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Header: Create New */}
        <div className="p-3 bg-[#181c28] border-b border-[#252c3e] flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-300 text-xs">Create New Project:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCreateNew('9:16')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Portrait</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateNew('16:9')}
              className="px-3 py-1.5 rounded-lg bg-[#252b3e] hover:bg-[#30374f] text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9 Landscape</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-80">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            Recent Projects ({projectsList.length}):
          </span>

          {projectsList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No saved projects yet. Click "+ 9:16 Portrait" above to create one.
            </div>
          ) : (
            projectsList.map((p) => {
              const isCurrent = project.id === p.id;
              const isRenaming = renamingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-xs'
                      : 'bg-[#181c28] border-[#252c3e] hover:bg-[#202636]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="flex-1 p-1 bg-[#121520] border border-blue-500 rounded text-xs text-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmRename(p)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-400 border border-blue-400/30">
                            Active
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span>{p.aspectRatio}</span>
                      <span>•</span>
                      <span>{p.duration.toFixed(1)}s</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleSwitchProject(p)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Open
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartRename(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/20 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#161a28] border-t border-[#242b3e] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#2b3346] text-slate-400 hover:text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
