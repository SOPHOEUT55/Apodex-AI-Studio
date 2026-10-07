import React, { useState } from 'react';
import { Check, Copy, Terminal, Play, Loader2, X, ArrowUpRight } from 'lucide-react';
import { executePythonCode } from '../services/api';
import { PythonExecutionResult } from '../types';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onOpenInPythonLab?: (code: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onOpenInPythonLab,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, PythonExecutionResult>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleRunPython = async (code: string, id: string) => {
    setExecutingId(id);
    try {
      const result = await executePythonCode(code);
      setExecutionResults((prev) => ({ ...prev, [id]: result }));
    } catch (e: any) {
      setExecutionResults((prev) => ({
        ...prev,
        [id]: {
          stdout: '',
          stderr: e.message || 'Execution failed',
          exitCode: 1,
          executionTimeMs: 0,
          success: false,
        },
      }));
    } finally {
      setExecutingId(null);
    }
  };

  const handleCloseOutput = (id: string) => {
    setExecutionResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Parse code blocks vs regular text
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockCounter = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderFormattedText(textBefore, `text-${lastIndex}`));
    }

    const language = (match[1] || 'plaintext').toLowerCase();
    const isPython = language === 'python' || language === 'py';
    const codeContent = match[2].trimEnd();
    const codeId = `code-${blockCounter++}`;
    const runResult = executionResults[codeId];
    const isRunning = executingId === codeId;

    parts.push(
      <div key={codeId} className="my-3 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase tracking-wider font-semibold text-[11px] text-cyan-300">
              {language}
            </span>
            {isPython && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-medium">
                Executable
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isPython && (
              <>
                <button
                  type="button"
                  onClick={() => handleRunPython(codeContent, codeId)}
                  disabled={isRunning}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer font-sans disabled:opacity-50"
                  title="Execute Python Code"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      <span className="font-semibold">Run</span>
                    </>
                  )}
                </button>

                {onOpenInPythonLab && (
                  <button
                    type="button"
                    onClick={() => onOpenInPythonLab(codeContent)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-sans cursor-pointer"
                    title="Open in Python Lab Editor"
                  >
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    <span className="hidden sm:inline">Lab</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => copyToClipboard(codeContent, codeId)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy code"
            >
              {copiedCodeId === codeId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="p-3.5 text-xs sm:text-sm font-mono overflow-x-auto text-slate-100 leading-relaxed scrollbar-thin">
          <code>{codeContent}</code>
        </pre>

        {/* Python Execution Terminal Output Drawer */}
        {runResult && (
          <div className="border-t border-slate-700/80 bg-slate-950 p-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold px-1.5 py-0.2 rounded ${
                    runResult.success
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {runResult.success ? 'Success (Exit 0)' : `Failed (Exit ${runResult.exitCode})`}
                </span>
                <span className="text-slate-500">
                  Time: {runResult.executionTimeMs}ms
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCloseOutput(codeId)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                title="Close terminal output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {runResult.stdout && (
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                {runResult.stdout}
              </pre>
            )}

            {runResult.stderr && (
              <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-thin mt-1">
                {runResult.stderr}
              </pre>
            )}

            {!runResult.stdout && !runResult.stderr && (
              <span className="text-slate-500 italic">Code finished with no output.</span>
            )}
          </div>
        )}
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(renderFormattedText(remainingText, `text-end-${lastIndex}`));
  }

  return <div className={`prose-sm max-w-none space-y-2 leading-relaxed ${className}`}>{parts}</div>;
};

// Render bold, lists, headers, inline code, and paragraphs
function renderFormattedText(rawText: string, keyPrefix: string): React.ReactNode {
  const lines = rawText.split('\n');

  return (
    <div key={keyPrefix} className="space-y-1.5">
      {lines.map((line, idx) => {
        const lineKey = `${keyPrefix}-l-${idx}`;

        // Blank lines
        if (!line.trim()) {
          return <div key={lineKey} className="h-1.5" />;
        }

        // Headers
        if (line.startsWith('### ')) {
          return (
            <h3 key={lineKey} className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-2 mb-1">
              {formatInlineStyles(line.replace('### ', ''))}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={lineKey} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
              {formatInlineStyles(line.replace('## ', ''))}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={lineKey} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
              {formatInlineStyles(line.replace('# ', ''))}
            </h1>
          );
        }

        // Bullet lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().replace(/^[-*]\s+/, '');
          return (
            <div key={lineKey} className="flex items-start gap-2 pl-2 text-slate-800 dark:text-slate-200">
              <span className="text-cyan-500 font-bold leading-5 select-none">•</span>
              <span className="flex-1">{formatInlineStyles(content)}</span>
            </div>
          );
        }

        // Numbered lists (e.g. "1. ")
        const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={lineKey} className="flex items-start gap-2 pl-2 text-slate-800 dark:text-slate-200">
              <span className="text-cyan-500 font-semibold select-none min-w-[1.2rem]">{numMatch[1]}.</span>
              <span className="flex-1">{formatInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <blockquote
              key={lineKey}
              className="border-l-3 border-cyan-500 pl-3 py-0.5 text-slate-600 dark:text-slate-300 italic bg-cyan-500/5 rounded-r my-1"
            >
              {formatInlineStyles(line.replace('> ', ''))}
            </blockquote>
          );
        }

        // Standard paragraph line
        return (
          <p key={lineKey} className="text-slate-800 dark:text-slate-200">
            {formatInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

// Inline formatting: **bold**, *italic*, `code`
function formatInlineStyles(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${i++}`} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${i++}`}
          className="px-1.5 py-0.5 rounded text-[0.85em] font-mono bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-300/60 dark:border-slate-700/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${i++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
