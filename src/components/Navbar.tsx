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
  Video,
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
    { id: 'video' as AppTab, label: 'Video Studio', icon: Video, highlight: true },
    { id: 'home' as AppTab, label: 'Dashboard', icon: Home },
    { id: 'editor' as AppTab, label: 'Single Card', icon: Sparkles },
    { id: 'batch' as AppTab, label: 'Batch Cards', icon: Layers },
    { id: 'templates' as AppTab, label: 'Templates', icon: LayoutTemplate },
    { id: 'settings' as AppTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* ─── CapCut / VN Style Top Navigation Bar (High Performance, 0 Lag) ─── */}
      <header className="sticky top-0 z-40 bg-[#121216] border-b border-[#22222a]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Video className="w-4 h-4 text-white" />
            </div>

            <span className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              GK Studio
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </span>
          </div>

          {/* Center Tabs (CapCut / VN Segmented Bar) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#181820] border border-[#262632]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? tab.highlight
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                        : 'bg-[#2a2a38] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#20202a]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
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
                className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#242432] border border-[#2d2d3e] text-purple-400 text-xs font-bold transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Prompt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation Dock ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121216] border-t border-[#22222a] px-1 py-1 flex items-center justify-around select-none"
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
                isActive ? 'text-cyan-400 font-bold bg-[#1e1e28]' : 'text-slate-400'
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
