import React from 'react';
import { Conversation, User } from '../types';
import {
  Sparkles,
  MessageSquarePlus,
  Cpu,
  History,
  TrendingUp,
  Code2,
  BrainCircuit,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Clock,
  Pin,
  Terminal,
  Play,
  Zap,
  Volume2,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  conversations: Conversation[];
  stats: {
    totalConversations: number;
    totalMessages: number;
    totalEstimatedTokens: number;
    reasoningCount: number;
    storageUsedKB: string;
  };
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  onStartNewChat: (initialPrompt?: string, modelId?: string) => void;
  onOpenConversation: (id: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToPythonLab?: (initialCode?: string) => void;
  onNavigateToTTS?: () => void;
}

const FEATURED_PROMPTS = [
  {
    id: 'p1',
    category: 'Forecasting & Risk',
    title: '5-Year Autonomous Robotics Prediction',
    prompt: 'Conduct a long-horizon forecast on autonomous robotics adoption in logistics over the next 5 years. Evaluate base rate adoption, critical hardware bottlenecks, and potential regulatory speed bumps.',
    icon: TrendingUp,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-500',
    modelId: 'apodex/apodex-1.1-mini:free',
    modelName: 'Apodex 1.1 Mini',
  },
  {
    id: 'p2',
    category: 'Frontier Architecture',
    title: 'Enterprise Agent Orchestration (550B MoE)',
    prompt: 'Architect a multi-agent system combining specialized sub-agents with hierarchical memory and verification loops. Discuss how hybrid Transformer-Mamba attention enhances long-context state maintenance.',
    icon: BrainCircuit,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-500',
    modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    modelName: 'NVIDIA Nemotron 3 Ultra',
  },
  {
    id: 'p3',
    category: 'Systems & Code',
    title: 'Distributed Lock with Redis & Raft',
    prompt: 'Compare the guarantees of a Redis Redlock algorithm versus a Raft consensus distributed lock. Detail how clock drift, GC pauses, and network partitions affect mutual exclusion.',
    icon: Code2,
    color: 'from-cyan-500/20 to-blue-500/10 text-cyan-500',
    modelId: 'apodex/apodex-1.1-mini:free',
    modelName: 'Apodex 1.1 Mini',
  },
  {
    id: 'p4',
    category: 'Research Synthesis',
    title: 'Quantum Error Correction Thresholds',
    prompt: 'Synthesize the theoretical error correction threshold for surface codes versus LDPC codes. Outline the physical qubit overhead necessary to achieve fault-tolerant logical qubits.',
    icon: Layers,
    color: 'from-purple-500/20 to-indigo-500/10 text-purple-500',
    modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    modelName: 'NVIDIA Nemotron 3 Ultra',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  conversations,
  stats,
  currentModelId,
  onSelectModel,
  onStartNewChat,
  onOpenConversation,
  onNavigateToHistory,
  onNavigateToPythonLab,
  onNavigateToTTS,
}) => {
  const recentConversations = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  const isNemotronActive = currentModelId.includes('nemotron-3-ultra');
  const isVoxtralActive = currentModelId.includes('voxtral');
  const isOmniActive = currentModelId.includes('nano-omni');

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Multimodal Reasoning & Voice AI Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-cyan-400">{currentUser.name}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Experience frontier AI with <strong>Mistral Voxtral 24B</strong> for voice & speech, <strong>NVIDIA Nemotron Nano Omni</strong> for multimodal audio-reasoning, <strong>Nemotron 3 Ultra</strong> (550B MoE), and <strong>Apodex 1.1 Mini</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartNewChat(undefined, currentModelId)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-600 hover:opacity-90 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New Chat
            </button>
            {onNavigateToTTS && (
              <button
                onClick={onNavigateToTTS}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                Voice Studio
              </button>
            )}
            <button
              onClick={onNavigateToHistory}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4 text-cyan-400" />
              All Chats ({stats.totalConversations})
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection Hub Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Active AI Models (Free Tier & Voice)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click to switch active model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Mistral Voxtral Card */}
          <div
            onClick={() => onSelectModel('mistralai/voxtral-small-24b-2507')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
              isVoxtralActive
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Mistral Voxtral 24B
                  </h3>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Voice & Speech
                  </span>
                </div>
              </div>
              {isVoxtralActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
              Voice-native frontier model specialized in spoken dialogues, text-to-speech analysis, and audio generation.
            </p>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
              32K Context • 24B Dense
            </div>
          </div>

          {/* NVIDIA Nano Omni Card */}
          <div
            onClick={() => onSelectModel('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
              isOmniActive
                ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/40'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Nemotron Nano Omni
                  </h3>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    Multimodal & Voice
                  </span>
                </div>
              </div>
              {isOmniActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
              Multimodal Omni model combining text, audio, and visual reasoning with step-by-step chain of thought.
            </p>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
              128K Context • 30B MoE (Free)
            </div>
          </div>

          {/* Apodex Model Card */}
          <div
            onClick={() => onSelectModel('apodex/apodex-1.1-mini:free')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
              !isNemotronActive && !isVoxtralActive && !isOmniActive
                ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-md ring-2 ring-cyan-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Apodex 1.1 Mini
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    Forecasting & Logic
                  </span>
                </div>
              </div>
              {!isNemotronActive && !isVoxtralActive && !isOmniActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
              Reasoning-first architecture for forecasting scenarios and quantitative analysis with transparent thinking.
            </p>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
              64K Context • Reasoning Engine
            </div>
          </div>

          {/* NVIDIA Nemotron 3 Ultra Model Card */}
          <div
            onClick={() => onSelectModel('nvidia/nemotron-3-ultra-550b-a55b:free')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
              isNemotronActive
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Nemotron 3 Ultra
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    550B MoE Frontier
                  </span>
                </div>
              </div>
              {isNemotronActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 line-clamp-2">
              55B active / 550B MoE hybrid architecture with code synthesis and verified thinking loop.
            </p>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
              128K Context • 550B MoE
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Model Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Engine</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isNemotronActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {isNemotronActive ? 'NVIDIA Nemotron 3' : 'Apodex 1.1 Mini'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Free Tier • {isNemotronActive ? '128K' : '64K'} ctx
          </p>
        </div>

        {/* Card 2: Total Conversations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saved Chats</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalConversations}
            </span>
            <span className="text-xs text-slate-400">threads</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Persisted in LocalStorage
          </p>
        </div>

        {/* Card 3: Messages */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Messages</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalMessages}
            </span>
            <span className="text-xs text-slate-400">messages</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.reasoningCount} with reasoning chain
          </p>
        </div>

        {/* Card 4: Tokens & Storage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Est. Tokens</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalEstimatedTokens.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">tokens</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.storageUsedKB} KB local cache
          </p>
        </div>
      </div>

      {/* Curated Prompt Starters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Curated Reasoning Starters
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click to launch instantly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURED_PROMPTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onStartNewChat(item.prompt)}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {item.category}
                    </span>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>Start Reasoning</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Python 3.10 Interactive Workbench Highlight */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950 border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Python 3.10 Interactive Workbench</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  SANDBOX READY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Execute algorithms, simulations, OLS regression, and SQLite queries natively with AI co-pilot.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPythonLab?.()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Launch Python Workbench</span>
          </button>
        </div>

        {/* Quick Launch Snippet Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 relative z-10">
          <button
            onClick={() => onNavigateToPythonLab?.()}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] text-amber-400 font-bold block mb-0.5">SIMULATION</span>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white block truncate">Monte Carlo Pi</span>
          </button>
          <button
            onClick={() => onNavigateToPythonLab?.()}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">DATA SCIENCE</span>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white block truncate">OLS Regression</span>
          </button>
          <button
            onClick={() => onNavigateToPythonLab?.()}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">ALGORITHMS</span>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white block truncate">Dijkstra Routing</span>
          </button>
          <button
            onClick={() => onNavigateToPythonLab?.()}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] text-purple-400 font-bold block mb-0.5">DATABASE</span>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white block truncate">SQLite In-Memory</span>
          </button>
        </div>
      </div>

      {/* Recent Chats Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Recent Conversations
            </h2>
          </div>
          {conversations.length > 0 && (
            <button
              onClick={onNavigateToHistory}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              View all ({conversations.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentConversations.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No conversations yet. Start one above or pick a starter!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentConversations.map((c) => {
              const lastMsg = c.messages[c.messages.length - 1];
              return (
                <div
                  key={c.id}
                  onClick={() => onOpenConversation(c.id)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {c.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {c.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {lastMsg ? lastMsg.content.slice(0, 70) : 'No messages'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{c.messages.length} messages</span>
                      <span>•</span>
                      <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Model Spec & Privacy Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-cyan-500/5 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              Local Storage Privacy Guaranteed
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              All chat threads, custom personas, and configurations remain safely stored inside your browser's local memory.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 shrink-0">
          <span>Model: apodex/apodex-1.1-mini:free</span>
        </div>
      </div>
    </div>
  );
};
