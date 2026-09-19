import React from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  Settings as SettingsIcon,
  Home,
  LayoutTemplate,
  Wand2,
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
}) => {
  const tabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'editor', label: 'Single Card', icon: Sparkles },
    { id: 'batch', label: 'Batch Cards', icon: Layers },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* ─── Clean, Normal, User-Friendly Topbar ─── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>

            <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              GK Studio
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                Pro
              </span>
            </span>
          </div>

          {/* Clean Segmented Navigation */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenAiQuestions && (
              <button
                type="button"
                onClick={onOpenAiQuestions}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Prompt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation Dock ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1 flex items-center justify-around select-none shadow-md"
        aria-label="Mobile Navigation"
      >
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 min-h-[46px] flex flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                isActive ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
