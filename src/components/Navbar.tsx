import React from 'react';
import {
  Sparkles,
  Plus,
  Bookmark,
  Layers,
  Settings as SettingsIcon,
  Home,
  LayoutTemplate,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react';

export type AppTab = 'home' | 'editor' | 'batch' | 'templates' | 'settings';
interface NavbarProps {
  currentTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onNewQuestion: () => void;
  onOpenAiQuestions?: () => void;
  onOpenAiImageStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  onNewQuestion,
  onOpenAiQuestions,
  onOpenAiImageStudio,
}) => {
  return (
    <>
      {/* Top Header - Ultra Minimal, Clean, Professional */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Studio
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => onChangeTab('home')}
              className={`text-sm font-medium transition-colors ${
                currentTab === 'home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('editor')}
              className={`text-sm font-medium transition-colors ${
                currentTab === 'editor' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Editor
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('batch')}
              className={`text-sm font-medium transition-colors ${
                currentTab === 'batch' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Batch
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('templates')}
              className={`text-sm font-medium transition-colors ${
                currentTab === 'templates' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Templates
            </button>

          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            {onOpenAiQuestions && (
              <button
                type="button"
                onClick={onOpenAiQuestions}
                className="hidden lg:inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                title="Generate with AI"
              >
                <Wand2 className="w-4 h-4" />
                <span>AI</span>
              </button>
            )}
            
            {onOpenAiImageStudio && (
              <button
                type="button"
                onClick={onOpenAiImageStudio}
                className="hidden lg:inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                title="AI Image Studio"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Images</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onChangeTab('settings')}
              className={`text-slate-500 hover:text-slate-900 transition-colors ${
                currentTab === 'settings' ? 'text-slate-900' : ''
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNewQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Android First, 44px min touch target */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1 py-1 flex items-center justify-around shadow-lg select-none"
        aria-label="Mobile Navigation"
      >
        <button
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            currentTab === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('editor')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            currentTab === 'editor' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Create</span>
        </button>


        <button
          type="button"
          onClick={() => onChangeTab('templates')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            currentTab === 'templates' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="text-[10px]">Templates</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('settings')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            currentTab === 'settings' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </>
  );
};
