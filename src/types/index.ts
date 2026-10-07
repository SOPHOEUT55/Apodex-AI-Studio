export type Role = 'user' | 'assistant' | 'system';

export interface AIModel {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  tag: string;
  description: string;
  activeParameters: string;
  contextWindow: string;
  brandColor: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  iconType: 'apodex' | 'nvidia';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  timestamp: number;
  tokens?: number;
  isStreaming?: boolean;
  error?: boolean;
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  pinned?: boolean;
  tags?: string[];
  userId: string;
  modelId: string; // e.g. 'apodex/apodex-1.1-mini:free' or 'nvidia/nemotron-3-ultra-550b-a55b:free'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isGuest?: boolean;
  createdAt: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  mobileViewMode: boolean; // true = simulated native mobile frame, false = wide responsive web dashboard
  streamEnabled: boolean;
  showReasoning: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  highContrast: boolean;
  systemPromptPreset: string;
  temperature: number;
  defaultModelId: string;
}

export type ActiveTab = 'dashboard' | 'chat' | 'history' | 'settings' | 'profile';

export interface PromptTemplate {
  id: string;
  category: 'reasoning' | 'code' | 'forecast' | 'research' | 'writing';
  title: string;
  description: string;
  prompt: string;
  iconName: string;
  recommendedModelId?: string;
}
