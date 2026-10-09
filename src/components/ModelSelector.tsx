import React, { useState, useRef, useEffect } from 'react';
import { AIModel } from '../types';
import { AVAILABLE_MODELS, getModelById } from '../utils/models';
import { Zap, Cpu, ChevronDown, Check, Info, Sparkles, Volume2 } from 'lucide-react';

interface ModelSelectorProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModelId,
  onSelectModel,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentModel = getModelById(currentModelId);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelectModel(id);
    setIsOpen(false);
  };

  const getModelTheme = (model: AIModel) => {
    if (model.id.includes('voxtral')) {
      return {
        border: 'border-amber-500/40',
        bg: 'bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-600',
        hover: 'hover:bg-amber-500/20',
        checkColor: 'text-amber-500',
      };
    }
    if (model.id.includes('nano-omni')) {
      return {
        border: 'border-purple-500/40',
        bg: 'bg-purple-500/10',
        text: 'text-purple-700 dark:text-purple-300',
        iconBg: 'bg-purple-600',
        hover: 'hover:bg-purple-500/20',
        checkColor: 'text-purple-500',
      };
    }
    if (model.id.includes('nemotron')) {
      return {
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-600',
        hover: 'hover:bg-emerald-500/20',
        checkColor: 'text-emerald-500',
      };
    }
    return {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-700 dark:text-cyan-300',
      iconBg: 'bg-cyan-600',
      hover: 'hover:bg-cyan-500/20',
      checkColor: 'text-cyan-500',
    };
  };

  const activeTheme = getModelTheme(currentModel);

  const renderModelIcon = (model: AIModel) => {
    if (model.id.includes('voxtral')) return <Volume2 className="w-3.5 h-3.5" />;
    if (model.id.includes('nano-omni')) return <Sparkles className="w-3.5 h-3.5" />;
    if (model.id.includes('nemotron')) return <Cpu className="w-3.5 h-3.5" />;
    return <Zap className="w-3.5 h-3.5 fill-white" />;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-2xl border transition-all cursor-pointer select-none ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        } ${activeTheme.border} ${activeTheme.bg} ${activeTheme.text} ${activeTheme.hover}`}
        title="Switch AI Reasoning Model"
      >
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center text-white shrink-0 ${activeTheme.iconBg}`}
        >
          {renderModelIcon(currentModel)}
        </div>

        <div className="flex flex-col text-left">
          <span className="font-bold leading-tight truncate max-w-[130px] sm:max-w-[180px]">
            {currentModel.shortName}
          </span>
          {!compact && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Free Tier • {currentModel.provider.split('/')[0].trim()}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 ml-0.5 opacity-60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 sm:w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto scrollbar-thin">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select AI Model
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              {AVAILABLE_MODELS.length} Models Available
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === currentModelId;
              const theme = getModelTheme(model);

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? `${theme.border} ${theme.bg} text-slate-900 dark:text-white ring-1 ring-amber-500/30`
                      : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${theme.iconBg}`}
                  >
                    {renderModelIcon(model)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold truncate">
                          {model.shortName}
                        </h4>
                        {model.hasVoiceSupport && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            VOICE
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className={`w-4 h-4 shrink-0 ${theme.checkColor}`} />
                      )}
                    </div>

                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-75 mt-0.5">
                      {model.tag}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {model.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                      <span>Context: {model.contextWindow}</span>
                      <span>•</span>
                      <span>{model.activeParameters}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Includes text-to-speech audio synthesis and transparent step reasoning.</span>
          </div>
        </div>
      )}
    </div>
  );
};
