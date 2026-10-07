import React from 'react';
import { AppSettings, User } from '../types';
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Cpu,
  Eye,
  Sliders,
  Database,
  Download,
  Trash2,
  Sparkles,
  Shield,
  User as UserIcon,
  LogOut,
  Zap,
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenAuth: () => void;
  storageStats: {
    totalConversations: number;
    totalMessages: number;
    totalEstimatedTokens: number;
    reasoningCount: number;
    storageUsedKB: string;
  };
  onExportAll: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onOpenAuth,
  storageStats,
  onExportAll,
  onClearAllData,
}) => {
  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Account Profile Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h2>
              {currentUser.isGuest ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  Guest
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  {currentUser.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Member since {new Date(currentUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <UserIcon className="w-3.5 h-3.5" />
          Switch Profile / Login
        </button>
      </div>

      {/* Appearance & Accessibility */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Eye className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Appearance & Accessibility
          </h3>
        </div>

        {/* Theme mode selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id as any })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              Simulated React Native Mobile Shell
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Render the app inside a phone-sized smartphone frame with native tabs
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.mobileViewMode}
            onChange={(e) => onUpdateSettings({ mobileViewMode: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              High Contrast Borders & Text
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Enhanced contrast ratio for high readability in low-light environments
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Reasoning & Model Settings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Free Model Hub (Apodex & NVIDIA Nemotron)
          </h3>
        </div>

        {/* Default Model Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Default AI Model for New Chats
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ defaultModelId: 'apodex/apodex-1.1-mini:free' })}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.defaultModelId === 'apodex/apodex-1.1-mini:free'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm">Apodex 1.1 Mini</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                64K Ctx • Reasoning & Research
              </p>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ defaultModelId: 'nvidia/nemotron-3-ultra-550b-a55b:free' })}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.defaultModelId === 'nvidia/nemotron-3-ultra-550b-a55b:free'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm">NVIDIA Nemotron 3 Ultra</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                128K Ctx • 550B MoE Frontier
              </p>
            </button>
          </div>
        </div>

        {/* Model Status Pills */}
        <div className="space-y-2">
          {/* Apodex Pill */}
          <div className="p-3 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Apodex 1.1 Mini (free)
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  apodex/apodex-1.1-mini:free • Novita
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              OPERATIONAL
            </span>
          </div>

          {/* NVIDIA Pill */}
          <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  NVIDIA Nemotron 3 Ultra (free)
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  nvidia/nemotron-3-ultra-550b-a55b:free • NVIDIA
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              OPERATIONAL
            </span>
          </div>
        </div>

        {/* Streaming toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Real-Time Streaming Responses
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Stream token-by-token with Server-Sent Events
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.streamEnabled}
            onChange={(e) => onUpdateSettings({ streamEnabled: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Reasoning Display */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Expand Thinking Process by Default
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Show the chain-of-thought accordion open automatically
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.showReasoning}
            onChange={(e) => onUpdateSettings({ showReasoning: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Local Storage & Data Privacy */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Local Storage Memory
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {storageStats.totalConversations}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Threads</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {storageStats.totalMessages}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Messages</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {storageStats.totalEstimatedTokens.toLocaleString()}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Est. Tokens</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {storageStats.storageUsedKB} KB
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Storage Used</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={onExportAll}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            Download Full JSON Backup
          </button>
          <button
            onClick={onClearAllData}
            className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
