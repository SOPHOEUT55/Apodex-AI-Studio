import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
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

    const language = match[1] || 'plaintext';
    const codeContent = match[2].trimEnd();
    const codeId = `code-${blockCounter++}`;

    parts.push(
      <div key={codeId} className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/90 shadow-md">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase tracking-wider font-semibold text-[11px] text-cyan-300">{language}</span>
          </div>
          <button
            onClick={() => copyToClipboard(codeContent, codeId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
        <pre className="p-3.5 text-xs sm:text-sm font-mono overflow-x-auto text-slate-100 leading-relaxed scrollbar-thin">
          <code>{codeContent}</code>
        </pre>
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
  // Tokenize bold, inline code, italic
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
