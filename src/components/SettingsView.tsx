import React, { useRef } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useToast } from './Toast';
import { INITIAL_QUESTIONS } from '../constants/sampleQuestions';

interface SettingsViewProps {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          localStorage.setItem('gk_card_maker_questions_v2', JSON.stringify(parsed));
          onRefreshData();
          showToast('Backup restored successfully!', 'success');
        }
      } catch (err) {
        showToast('Invalid JSON file', 'error');
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
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-emerald-600" />
          Settings
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Configure your Gemini API Key and manage your local storage backups.
        </p>
      </div>

      {/* AI Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-purple-50/50 to-transparent">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            AI Configuration
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div>
            <span className="font-semibold text-slate-800 text-sm">Gemini API Key:</span>
            <p className="text-xs text-slate-500 mt-1">Required for AI Image generation and editing.</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="password" 
              id="gemini_api_key_input"
              placeholder="AIzaSy..." 
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-inner"
            />
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById('gemini_api_key_input') as HTMLInputElement;
                  if (!el.value) return;
                  localStorage.setItem('gk_card_maker_gemini_key', el.value);
                  showToast('Gemini API Key saved locally!', 'success');
                  el.value = '';
                }}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-md active:scale-95 cursor-pointer"
              >
              Save Key
            </button>
          </div>
        </div>
      </div>

      {/* Storage & Backup */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-blue-50/50 to-transparent">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Storage & Backup
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Your cards are saved securely in your browser's local storage. Export a JSON backup to keep your questions safe or transfer them to another device.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Questions (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Import Backup (JSON)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset to Sample Questions</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
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
