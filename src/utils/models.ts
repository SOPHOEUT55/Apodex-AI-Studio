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
  },
];

export const DEFAULT_MODEL_ID = 'apodex/apodex-1.1-mini:free';

export function getModelById(id?: string): AIModel {
  return (
    AVAILABLE_MODELS.find((m) => m.id === id) ||
    AVAILABLE_MODELS[0]
  );
}
