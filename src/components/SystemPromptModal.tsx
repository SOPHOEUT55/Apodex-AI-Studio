import React, { useState } from 'react';
import { X, Sparkles, Sliders, Check, RotateCcw } from 'lucide-react';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  temperature: number;
  onSave: (prompt: string, temp: number) => void;
}

const PRESETS = [
  {
    name: 'Apodex Default Reasoning',
    desc: 'Structured, high-clarity reasoning for research and analysis.',
    prompt: 'You are Apodex 1.1 Mini, an advanced reasoning and research AI. Always provide rigorous, structured, and insightful answers with deep analytical clarity.',
    temp: 0.7,
  },
  {
    name: 'Long-Horizon Forecasting',
    desc: 'Probabilistic modeling, multi-scenario projections, risk metrics.',
    prompt: 'You are an expert predictive analyst and strategist powered by Apodex 1.1 Mini. For every question, evaluate base rates, identify underlying variables, generate optimistic/conservative scenarios, and formulate calibrated probabilistic forecasts.',
    temp: 0.5,
  },
  {
    name: 'Senior Systems Engineer',
    desc: 'Full-stack software architecture, bug analysis, clean code.',
    prompt: 'You are a Principal Software Engineer. Write clean, production-ready TypeScript/Python code, highlight trade-offs, explain performance and concurrency implications, and format code with clear comments.',
    temp: 0.3,
  },
  {
    name: 'Academic Researcher',
    desc: 'Rigorous literature synthesis, formal proofs, methodology.',
    prompt: 'You are a post-doctoral research fellow. Break down complex theories into first principles, cite relevant methodologies, scrutinize empirical validity, and provide balanced academic assessments.',
    temp: 0.6,
  },
];

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  temperature,
  onSave,
}) => {
  const [prompt, setPrompt] = useState(systemPrompt);
  const [temp, setTemp] = useState(temperature);

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setPrompt(p.prompt);
    setTemp(p.temp);
  };

  const handleSave = () => {
    onSave(prompt, temp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Model Tuning & Persona</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apodex 1.1 Mini System Instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Persona Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 bg-white dark:bg-slate-800/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 transition-all cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* System Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                System Prompt Instructions
              </label>
              <button
                type="button"
                onClick={() => setPrompt(PRESETS[0].prompt)}
                className="text-[11px] text-cyan-500 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Default
              </button>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Define instructions for Apodex 1.1 Mini..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
            />
          </div>

          {/* Temperature */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Temperature (Creativity vs Determinism)
              </label>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                {temp.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.0 (Precise / Code)</span>
              <span>0.7 (Balanced Reasoning)</span>
              <span>1.5 (Creative)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
