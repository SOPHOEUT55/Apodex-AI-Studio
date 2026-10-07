import React from 'react';
import { User, ThemeMode } from '../types';
import { ModelSelector } from './ModelSelector';
import { Sun, Moon, Smartphone, Monitor, ShieldCheck, Zap } from 'lucide-react';

interface NativeHeaderProps {
  currentUser: User;
  onOpenAuth: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  onOpenSystemPrompt: () => void;
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const NativeHeader: React.FC<NativeHeaderProps> = ({
  currentUser,
  onOpenAuth,
  theme,
  onToggleTheme,
  isMobileView,
  onToggleMobileView,
  onOpenSystemPrompt,
  currentModelId,
  onSelectModel,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Model Selector Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ModelSelector
            currentModelId={currentModelId}
            onSelectModel={onSelectModel}
            compact={isMobileView}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* View Mode Switcher (React Native Shell vs Web Dashboard) */}
          <button
            onClick={onToggleMobileView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isMobileView ? "Switch to Expanded Desktop Dashboard" : "Switch to React Native Mobile Frame"}
          >
            {isMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden sm:inline">Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Mobile Frame</span>
              </>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Auth Avatar / Status */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="User Account & Switch Profile"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600"
            />
            <span className="font-medium max-w-[85px] sm:max-w-[120px] truncate text-slate-900 dark:text-white">
              {currentUser.name}
            </span>
            {currentUser.isGuest ? (
              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                Guest
              </span>
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
