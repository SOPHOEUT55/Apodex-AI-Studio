import { AIModel } from '../types';

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'apodex/apodex-1.1-mini:free',
    name: 'Apodex: Apodex 1.1 Mini (free)',
    shortName: 'Apodex 1.1 Mini',
    provider: 'Apodex / Novita',
    tag: 'Reasoning & Research',
    description: 'High-efficiency reasoning-first model engineered for long-horizon research and forecasting.',
    activeParameters: 'Reasoning Engine',
    contextWindow: '64K',
    brandColor: 'from-cyan-500 to-blue-600',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    iconType: 'apodex',
    hasVoiceSupport: true,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA: Nemotron 3 Ultra (free)',
    shortName: 'NVIDIA Nemotron 3 Ultra',
    provider: 'NVIDIA',
    tag: '550B MoE Frontier Reasoning',
    description: 'Frontier reasoning and orchestration model from NVIDIA with 55B active parameters out of 550B total (Hybrid Transformer-Mamba MoE).',
    activeParameters: '55B Active / 550B Total',
    contextWindow: '128K',
    brandColor: 'from-emerald-500 to-teal-700',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    iconType: 'nvidia',
    hasVoiceSupport: true,
  },
  {
    id: 'mistralai/voxtral-small-24b-2507',
    name: 'Mistral: Voxtral Small 24B (Voice & Speech)',
    shortName: 'Mistral Voxtral 24B',
    provider: 'Mistral AI',
    tag: 'Voice & Speech Processing',
    description: 'Voice-native frontier multimodal model specializing in natural spoken dialogues, speech synthesis, and audio transcriptions.',
    activeParameters: '24B Dense',
    contextWindow: '32K',
    brandColor: 'from-amber-500 to-orange-600',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    iconType: 'voxtral',
    hasVoiceSupport: true,
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA: Nemotron 3 Nano Omni (free)',
    shortName: 'Nemotron Nano Omni',
    provider: 'NVIDIA',
    tag: 'Voice & Multimodal Reasoning',
    description: 'Next-gen multimodal Omni reasoning engine with integrated text, audio, and visual comprehension capabilities.',
    activeParameters: '3B Active / 30B MoE',
    contextWindow: '128K',
    brandColor: 'from-purple-500 to-indigo-600',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    iconType: 'omni',
    hasVoiceSupport: true,
    isOmni: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA: Nemotron 3.5 Lightning (free)',
    shortName: 'Nemotron 3.5 Lightning',
    provider: 'NVIDIA',
    tag: 'Ultra-Fast Real-Time Inference',
    description: 'Sub-second latency frontier conversational model optimized for low-latency voice, TTS dialogue, and interactive streaming.',
    activeParameters: '8B Distilled',
    contextWindow: '64K',
    brandColor: 'from-yellow-400 to-amber-600',
    accentColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    iconType: 'nvidia',
    hasVoiceSupport: true,
  },
];

export const DEFAULT_MODEL_ID = 'apodex/apodex-1.1-mini:free';

export function getModelById(id?: string): AIModel {
  return (
    AVAILABLE_MODELS.find((m) => m.id === id) ||
    AVAILABLE_MODELS[0]
  );
}
