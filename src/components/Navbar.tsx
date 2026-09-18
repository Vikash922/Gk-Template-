import React from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  Settings as SettingsIcon,
  Film,
  Home,
  LayoutTemplate,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react';

export type AppTab = 'home' | 'editor' | 'batch' | 'templates' | 'settings' | 'video';

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
  const tabs = [
    { id: 'home' as AppTab, label: 'Dashboard', icon: Home },
    { id: 'editor' as AppTab, label: 'Single Studio', icon: Sparkles },
    { id: 'batch' as AppTab, label: 'Batch Studio', icon: Layers },
    { id: 'video' as AppTab, label: 'Video Studio', icon: Film, badge: 'Shorts' },
    { id: 'templates' as AppTab, label: 'Templates', icon: LayoutTemplate },
    { id: 'settings' as AppTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* ─── Top Luxury Floating Header ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/[0.08] shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <span className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                GK Card Studio
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Segmented Pill Bar */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Quick AI Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenAiQuestions && (
              <button
                type="button"
                onClick={onOpenAiQuestions}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="AI Questions Generator"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Generator</span>
              </button>
            )}

            {onOpenAiImageStudio && (
              <button
                type="button"
                onClick={onOpenAiImageStudio}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="AI Image Studio"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Images</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Floating Glass Dock ─── */}
      <nav
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/85 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-1.5 flex items-center justify-around shadow-2xl shadow-black/80 select-none"
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
              className={`relative flex-1 min-h-[46px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/[0.12] text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium leading-none">{tab.label.split(' ')[0]}</span>
              {tab.badge && !isActive && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
