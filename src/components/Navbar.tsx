import React from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  Settings as SettingsIcon,
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
    { id: 'video' as AppTab, label: 'Video Studio', icon: Video, badge: 'Shorts' },
    { id: 'home' as AppTab, label: 'Dashboard', icon: Home },
    { id: 'editor' as AppTab, label: 'Single Card', icon: Sparkles },
    { id: 'batch' as AppTab, label: 'Batch Cards', icon: Layers },
    { id: 'templates' as AppTab, label: 'Templates', icon: LayoutTemplate },
    { id: 'settings' as AppTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* ─── Minimalist Premium Studio Topbar (Linear / Vercel Aesthetic) ─── */}
      <header className="sticky top-0 z-40 bg-[#0e0e11] border-b border-[#222226]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white group-hover:border-zinc-500 transition-colors">
              <Video className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <span className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              GK Studio
              <span className="text-[10px] font-semibold text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded">
                Pro
              </span>
            </span>
          </div>

          {/* Minimal Segmented Tabs */}
          <nav className="hidden md:flex items-center gap-0.5 p-1 rounded-xl bg-[#141418] border border-[#222228]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2">
            {onOpenAiQuestions && (
              <button
                type="button"
                onClick={onOpenAiQuestions}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Prompt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation Dock (Minimalist & Clean) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e11] border-t border-[#222226] px-1 py-1 flex items-center justify-around select-none"
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
                isActive ? 'text-blue-400 font-semibold bg-zinc-800/60' : 'text-zinc-400'
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
