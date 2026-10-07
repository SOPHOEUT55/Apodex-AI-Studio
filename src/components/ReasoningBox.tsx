import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Copy, Check, Sparkles } from 'lucide-react';

interface ReasoningBoxProps {
  reasoning: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

export const ReasoningBox: React.FC<ReasoningBoxProps> = ({
  reasoning,
  isStreaming = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isStreaming);
  const [copied, setCopied] = useState(false);

  if (!reasoning && !isStreaming) return null;

  const copyReasoning = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reasoning);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = reasoning ? reasoning.trim().split(/\s+/).length : 0;

  return (
    <div className="mb-3 rounded-xl border border-indigo-500/25 dark:border-cyan-500/30 bg-indigo-50/50 dark:bg-slate-900/70 overflow-hidden shadow-sm transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs bg-indigo-100/40 dark:bg-slate-800/60 hover:bg-indigo-100/70 dark:hover:bg-slate-800/90 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-600/10 dark:bg-cyan-500/20 text-indigo-600 dark:text-cyan-400">
            {isStreaming ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="font-semibold text-indigo-900 dark:text-cyan-300 tracking-wide flex items-center gap-1.5">
            Thinking Process
            {isStreaming && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 animate-pulse font-normal">
                Thinking...
              </span>
            )}
          </span>
          {wordCount > 0 && !isStreaming && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              ({wordCount} words analyzed)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {reasoning && (
            <span
              onClick={copyReasoning}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Copy thinking steps"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 border-t border-indigo-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto scrollbar-thin">
          {reasoning || <span className="text-slate-400 italic">Synthesizing multi-variable steps...</span>}
        </div>
      )}
    </div>
  );
};
