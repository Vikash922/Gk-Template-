import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from './Toast';
import { INITIAL_QUESTIONS } from '../constants/sampleQuestions';
import { importQuestionsFromJson } from '../services/storage';

interface SettingsViewProps {
  stats?: any;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ stats, onRefreshData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [hasSavedKey, setHasSavedKey] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('gk_card_maker_gemini_key') || '';
    if (saved) {
      setHasSavedKey(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      showToast('Please enter a valid API key', 'error');
      return;
    }
    // Security Division: Store client-side only
    localStorage.setItem('gk_card_maker_gemini_key', apiKey.trim());
    setHasSavedKey(true);
    setApiKey('');
    showToast('Gemini API Key securely saved in your browser!', 'success');
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('gk_card_maker_gemini_key');
    setHasSavedKey(false);
    showToast('Gemini API Key removed from browser storage', 'info');
  };

  const handleExportJson = () => {
    const raw = localStorage.getItem('gk_card_maker_questions_v2');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gk_cards_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported successfully', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Division: Check file size prior to reading
    if (file.size > 25 * 1024 * 1024) {
      showToast('File is too large (max 25MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      // Security Division: Use hardened sanitization & validation
      const result = importQuestionsFromJson(content);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        onRefreshData();
        showToast(`Successfully imported ${result.count} questions!`, 'success');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset local storage to initial sample questions? This will overwrite your current list!')) {
      localStorage.setItem('gk_card_maker_questions_v2', JSON.stringify(INITIAL_QUESTIONS));
      onRefreshData();
      showToast('Reset to sample questions', 'info');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you absolutely sure? This will delete all your saved questions!')) {
      localStorage.setItem('gk_card_maker_questions_v2', JSON.stringify([]));
      onRefreshData();
      showToast('All saved cards cleared successfully', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 sm:px-4 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          Settings & Security Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage AI credentials, browser persistence, and encrypted offline backups.
        </p>
      </div>

      {/* ─── AI Configuration Card (Security + Design) ─── */}
      <div className="glass-panel rounded-3xl border border-white/[0.1] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Gemini AI Configuration
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local Vault Only</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Your Google Gemini API key is stored <strong>exclusively in your browser's localStorage</strong>. It is never logged or sent to any intermediary server.
          </p>

          {hasSavedKey ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Gemini API Key Active</p>
                  <p className="text-[11px] text-slate-400">AI image generation and smart question parsing are enabled.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveApiKey}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
              >
                Remove Key
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste Gemini API Key (starts with AIzaSy...)"
                  className="w-full pl-4 pr-24 py-3 rounded-xl bg-slate-900/80 border border-white/[0.12] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Don't have a key? Get one for free from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 underline hover:text-purple-300"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Storage & Backups Card (Security + Design) ─── */}
      <div className="glass-panel rounded-3xl border border-white/[0.1] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Offline Storage & Backups
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            All your cards, templates, and layouts are stored offline on this device. Back up your library to JSON to sync across devices or prevent data loss.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/[0.1] shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Questions Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs border border-white/[0.1] shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import Safe Backup (JSON)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Sample Questions</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Saved Cards</span>
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
