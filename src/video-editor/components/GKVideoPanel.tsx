import React, { useState, useEffect } from 'react';
import { useEditor } from '../store/EditorContext';
import { GKQuestion } from '../../types/question';
import { getStoredQuestions } from '../../services/storage';
import {
  generateTimelineFromQuestions,
  GKGeneratorSettings,
  DEFAULT_GK_SETTINGS,
} from '../engine/GKVideoGenerator';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Mic,
  Music,
  Plus,
  Layers,
  X,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface GKVideoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GKVideoPanel: React.FC<GKVideoPanelProps> = ({ isOpen, onClose }) => {
  const { setProject, project } = useEditor();

  const [mode, setMode] = useState<'saved' | 'custom'>('saved');
  const [savedLibrary, setSavedLibrary] = useState<GKQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Settings
  const [settings, setSettings] = useState<GKGeneratorSettings>({
    ...DEFAULT_GK_SETTINGS,
    aspectRatio: project.aspectRatio === '16:9' ? '16:9' : '9:16',
  });

  // Custom question form
  const [customQuestion, setCustomQuestion] = useState<GKQuestion>({
    id: `custom_${Date.now()}`,
    questionNumber: 1,
    question: 'भारत का राष्ट्रीय पशु कौन सा है?',
    optionA: 'बाघ (Tiger)',
    optionB: 'शेर (Lion)',
    optionC: 'हाथी (Elephant)',
    optionD: 'चीता (Cheetah)',
    correctAnswer: 'A',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredQuestions();
      setSavedLibrary(stored);
      // Select all by default if questions exist
      setSelectedQuestionIds(stored.map((q) => q.id));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === savedLibrary.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(savedLibrary.map((q) => q.id));
    }
  };

  const handleGenerate = () => {
    let questionsToBuild: GKQuestion[] = [];

    if (mode === 'saved') {
      questionsToBuild = savedLibrary.filter((q) => selectedQuestionIds.includes(q.id));
      if (questionsToBuild.length === 0) {
        alert('Please select at least one question.');
        return;
      }
    } else {
      if (!customQuestion.question.trim()) {
        alert('Please enter question text.');
        return;
      }
      questionsToBuild = [customQuestion];
    }

    const generatedProject = generateTimelineFromQuestions(questionsToBuild, settings);
    setProject(generatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#121520] border border-[#272e42] rounded-2xl shadow-2xl flex flex-col text-xs text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#161a28] border-b border-[#242b3e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">GK Quiz Auto Video Generator</h2>
              <p className="text-[10px] text-slate-400">
                Automatically builds fully editable multi-track timeline sequences
              </p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#181c28] border border-[#283044] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('saved')}
              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                mode === 'saved' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Select from Saved Cards ({savedLibrary.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                mode === 'custom' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quick Add Single Question
            </button>
          </div>

          {/* MODE: SELECT FROM SAVED QUESTIONS */}
          {mode === 'saved' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Select questions to add to timeline:</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  {selectedQuestionIds.length === savedLibrary.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {savedLibrary.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#181c28] border border-[#252c3e] text-center text-slate-400">
                  No saved questions found in database. Switch to "Quick Add Single Question" tab above.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {savedLibrary.map((q, idx) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleSelectQuestion(q.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-600/15 border-blue-500/40 text-white'
                            : 'bg-[#181c28] border-[#252c3e] text-slate-300 hover:bg-[#202536]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-blue-400 font-bold">
                            #{q.questionNumber || idx + 1}
                          </span>
                          <span className="truncate font-semibold text-xs">{q.question}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-emerald-400 font-bold">
                            Ans: {q.correctAnswer || 'A'}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-blue-600 w-4 h-4 rounded pointer-events-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE: QUICK CUSTOM QUESTION */}
          {mode === 'custom' && (
            <div className="space-y-3 p-3 rounded-xl bg-[#181c28] border border-[#252c3e]">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Hindi Question</label>
                <input
                  type="text"
                  value={customQuestion.question}
                  onChange={(e) => setCustomQuestion({ ...customQuestion, question: e.target.value })}
                  placeholder="Enter GK question..."
                  className="w-full p-2.5 rounded-xl bg-[#121520] border border-[#283146] text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const field = `option${letter}` as keyof GKQuestion;
                  const isCorrect = customQuestion.correctAnswer === letter;
                  return (
                    <div key={letter} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCustomQuestion({ ...customQuestion, correctAnswer: letter })}
                        className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1e2332] text-slate-400 hover:text-white'
                        }`}
                        title="Set correct answer"
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={(customQuestion[field] as string) || ''}
                        onChange={(e) =>
                          setCustomQuestion({ ...customQuestion, [field]: e.target.value })
                        }
                        placeholder={`Option ${letter}`}
                        className="flex-1 p-2 rounded-lg bg-[#121520] border border-[#283146] text-white text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Generator Timing & Audio Settings ── */}
          <div className="p-3.5 rounded-xl bg-[#181c28] border border-[#252c3e] space-y-3">
            <span className="font-bold text-slate-200 text-xs block">Timing & Audio Configuration</span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Read Time</label>
                <select
                  value={settings.readTime}
                  onChange={(e) =>
                    setSettings({ ...settings, readTime: parseFloat(e.target.value) })
                  }
                  className="w-full p-2 rounded-lg bg-[#121520] border border-[#283146] text-white text-xs"
                >
                  <option value="1.5">1.5s (Fast)</option>
                  <option value="2.5">2.5s (Normal)</option>
                  <option value="3.5">3.5s (Relaxed)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Options Pace</label>
                <select
                  value={settings.optionIntervalTime}
                  onChange={(e) =>
                    setSettings({ ...settings, optionIntervalTime: parseFloat(e.target.value) })
                  }
                  className="w-full p-2 rounded-lg bg-[#121520] border border-[#283146] text-white text-xs"
                >
                  <option value="0.5">0.5s (Snappy)</option>
                  <option value="0.75">0.75s (Default)</option>
                  <option value="1.0">1.0s (Slow)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Timer Duration</label>
                <select
                  value={settings.timerTime}
                  onChange={(e) =>
                    setSettings({ ...settings, timerTime: parseFloat(e.target.value) })
                  }
                  className="w-full p-2 rounded-lg bg-[#121520] border border-[#283146] text-white text-xs"
                >
                  <option value="3">3s</option>
                  <option value="5">5s (Reference)</option>
                  <option value="10">10s</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Reveal Hold</label>
                <select
                  value={settings.revealTime}
                  onChange={(e) =>
                    setSettings({ ...settings, revealTime: parseFloat(e.target.value) })
                  }
                  className="w-full p-2 rounded-lg bg-[#121520] border border-[#283146] text-white text-xs"
                >
                  <option value="1.5">1.5s</option>
                  <option value="2.5">2.5s</option>
                  <option value="4.0">4.0s</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableVoiceover}
                  onChange={(e) => setSettings({ ...settings, enableVoiceover: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
                <span className="text-[11px] text-slate-300">Generate Hindi Voiceover (TTS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSfx}
                  onChange={(e) => setSettings({ ...settings, enableSfx: e.target.checked })}
                  className="accent-blue-600 rounded"
                />
                <span className="text-[11px] text-slate-300">Clock Tick & Answer Chimes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#161a28] border-t border-[#242b3e] flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">
            Ready to generate {mode === 'saved' ? selectedQuestionIds.length : 1} question cards
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-[#2b3346] text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Video Timeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
