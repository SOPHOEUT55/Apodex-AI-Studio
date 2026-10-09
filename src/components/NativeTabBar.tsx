import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, MessageSquare, Terminal, Volume2, Clock, Sliders, User as UserIcon } from 'lucide-react';

interface NativeTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount?: number;
}

export const NativeTabBar: React.FC<NativeTabBarProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat' as ActiveTab, label: 'Chat', icon: MessageSquare, badge: unreadCount },
    { id: 'python' as ActiveTab, label: 'Python Lab', icon: Terminal },
    { id: 'tts' as ActiveTab, label: 'Voice Studio', icon: Volume2 },
    { id: 'history' as ActiveTab, label: 'History', icon: Clock },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 transition-colors select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.3px] text-cyan-600 dark:text-cyan-400' : 'stroke-[1.8px]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-cyan-500 text-white rounded-full min-w-[14px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
