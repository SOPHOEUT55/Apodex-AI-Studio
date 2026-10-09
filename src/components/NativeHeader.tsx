import React, { useState, useRef, useEffect } from 'react';
import { User, ThemeMode } from '../types';
import { ModelSelector } from './ModelSelector';
import { Sun, Moon, Smartphone, Monitor, ShieldCheck, Zap, Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguage } from '../utils/i18n';

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
  language?: string;
  onSelectLanguage?: (lang: string) => void;
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
  language = 'en',
  onSelectLanguage,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const activeLang = getLanguage(language);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [langMenuOpen]);

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
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Multi-Language Quick Switcher */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Change Language & TTS Voice Dialect"
            >
              <span className="text-sm">{activeLang.flag}</span>
              <span className="hidden sm:inline font-medium">{activeLang.nativeName}</span>
              <span className="text-[10px] text-slate-400 font-mono sm:hidden">{activeLang.code.toUpperCase()}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                  Multi-Language Support
                </div>
                {SUPPORTED_LANGUAGES.map((l) => {
                  const isCurrent = language === l.code || language.startsWith(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        onSelectLanguage?.(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.flag}</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {l.nativeName}
                          </div>
                          <div className="text-[10px] text-slate-400">{l.name} • {l.ttsLang}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Mode Switcher (React Native Shell vs Web Dashboard) */}
          <button
            onClick={onToggleMobileView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isMobileView ? "Switch to Expanded Desktop Dashboard" : "Switch to React Native Mobile Frame"}
          >
            {isMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden md:inline">Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline">Mobile Frame</span>
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
