import { AppSettings, Conversation, ExecutionHistoryItem, SavedScript, User } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'apodex_current_user_v1',
  USERS_LIST: 'apodex_users_list_v1',
  CONVERSATIONS: 'apodex_conversations_v1',
  SETTINGS: 'apodex_settings_v1',
  ACTIVE_CONVERSATION: 'apodex_active_conv_v1',
  SAVED_SCRIPTS: 'apodex_saved_python_scripts_v1',
  EXECUTION_HISTORY: 'apodex_python_history_v1',
};

export const DEFAULT_USER: User = {
  id: 'user_alex',
  name: 'Alex Rivera',
  email: 'alex.rivera@apodex.ai',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'AI Researcher',
  isGuest: false,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
};

export const GUEST_USER: User = {
  id: 'guest_user',
  name: 'Guest Explorer',
  email: 'guest@apodex.local',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  role: 'Guest User',
  isGuest: true,
  createdAt: Date.now(),
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  mobileViewMode: false,
  streamEnabled: true,
  showReasoning: true,
  fontSize: 'md',
  highContrast: false,
  systemPromptPreset: 'You are an advanced reasoning and research AI. Always provide rigorous, structured, and insightful answers with deep analytical clarity.',
  temperature: 0.7,
  defaultModelId: 'apodex/apodex-1.1-mini:free',
  language: 'en',
};

// Storage Helpers
export function loadCurrentUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading current user:', e);
  }
  return DEFAULT_USER;
}

export function saveCurrentUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

export function loadUsersList(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading users list:', e);
  }
  const defaultList = [
    DEFAULT_USER,
    {
      id: 'user_sarah',
      name: 'Sarah Chen',
      email: 'sarah.chen@techlab.io',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Staff ML Engineer',
      isGuest: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    },
    GUEST_USER,
  ];
  saveUsersList(defaultList);
  return defaultList;
}

export function saveUsersList(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users list:', e);
  }
}

export function loadConversations(userId?: string): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (raw) {
      const all: Conversation[] = JSON.parse(raw);
      // Ensure all conversations have modelId
      const normalized = all.map((c) => ({
        ...c,
        modelId: c.modelId || 'apodex/apodex-1.1-mini:free',
      }));
      if (userId) {
        return normalized.filter((c) => c.userId === userId);
      }
      return normalized;
    }
  } catch (e) {
    console.error('Error loading conversations:', e);
  }

  // Initial starter conversations if empty
  const starterApodexId = 'conv_welcome_' + Date.now();
  const starterNemotronId = 'conv_nemotron_' + (Date.now() + 1);

  const starterApodex: Conversation = {
    id: starterApodexId,
    title: 'Apodex 1.1 Mini Overview',
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60,
    userId: userId || DEFAULT_USER.id,
    modelId: 'apodex/apodex-1.1-mini:free',
    pinned: true,
    tags: ['Apodex', 'Reasoning'],
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Hi! What makes Apodex 1.1 Mini special?',
        timestamp: Date.now() - 1000 * 60 * 60,
        tokens: 12,
      },
      {
        id: 'msg_2',
        role: 'assistant',
        modelUsed: 'apodex/apodex-1.1-mini:free',
        content: `### Welcome to Apodex 1.1 Mini! 🚀\n\n**Apodex 1.1 Mini** is a reasoning-first model engineered for:\n- 🧠 **Complex Multi-Step Logic**: Deep reasoning with transparent chain-of-thought visible in the thinking inspector.\n- 📊 **Forecasting & Quantitative Analysis**: Formulating probabilistic predictions and structured scenarios.\n- 💻 **Code & Systems Architecture**: Inspecting edge cases, debugging tricky concurrency, and refactoring cleanly.\n- ⚡ **High Efficiency**: Lightning response times with zero compromise on analytical depth.`,
        reasoning: `Thinking Process:\n1. Acknowledge user's inquiry regarding Apodex 1.1 Mini's key capabilities.\n2. Highlight core differentiators: reasoning-first architecture, forecasting, code generation, and high speed.\n3. Format with clean typography and bullet points for maximum legibility.`,
        timestamp: Date.now() - 1000 * 60 * 59,
        tokens: 185,
      },
    ],
  };

  const starterNemotron: Conversation = {
    id: starterNemotronId,
    title: 'NVIDIA Nemotron 3 Ultra Frontier',
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 30,
    userId: userId || DEFAULT_USER.id,
    modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    pinned: false,
    tags: ['NVIDIA', '550B MoE'],
    messages: [
      {
        id: 'msg_n1',
        role: 'user',
        content: 'Tell me about NVIDIA: Nemotron 3 Ultra (free)',
        timestamp: Date.now() - 1000 * 60 * 30,
        tokens: 14,
      },
      {
        id: 'msg_n2',
        role: 'assistant',
        modelUsed: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        content: `### NVIDIA: Nemotron 3 Ultra (free) ⚡\n\n**Nemotron 3 Ultra** is an open frontier reasoning and orchestration model from NVIDIA:\n- 🏢 **550B MoE Architecture**: Features 55B active parameters out of 550B total parameters.\n- 🧬 **Hybrid Transformer-Mamba**: Combines state-space models with attention mechanisms for state-of-the-art throughput and long context processing (up to 128K context window).\n- 🎯 **Frontier Agentic Orchestration**: Built for complex multi-agent workflows, code synthesis, and enterprise-grade reasoning.\n\nYou can switch between **Apodex 1.1 Mini** and **NVIDIA Nemotron 3 Ultra** anytime using the model selector pill!`,
        reasoning: `Thinking Process:\n1. Identify NVIDIA Nemotron 3 Ultra key specifications: 550B total / 55B active MoE, hybrid Transformer-Mamba architecture, 128K context.\n2. Emphasize multi-model versatility and user controls.`,
        timestamp: Date.now() - 1000 * 60 * 29,
        tokens: 210,
      },
    ],
  };

  const initialList = [starterApodex, starterNemotron];
  saveConversations(initialList);
  return initialList;
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving conversations:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function loadActiveConversationId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
}

export function saveActiveConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  }
}

// Storage Stats & Export
export function getStorageStats(userId?: string) {
  const conversations = loadConversations(userId);
  let totalMessages = 0;
  let totalEstimatedTokens = 0;
  let reasoningCount = 0;

  conversations.forEach((conv) => {
    totalMessages += conv.messages.length;
    conv.messages.forEach((msg) => {
      totalEstimatedTokens += msg.tokens || Math.round(msg.content.length / 4);
      if (msg.reasoning) reasoningCount++;
    });
  });

  const rawStorage = JSON.stringify(localStorage);
  const sizeBytes = new Blob([rawStorage]).size;
  const sizeKB = (sizeBytes / 1024).toFixed(1);

  return {
    totalConversations: conversations.length,
    totalMessages,
    totalEstimatedTokens,
    reasoningCount,
    storageUsedKB: sizeKB,
  };
}

export function exportAllDataAsJSON(userId?: string): string {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    user: loadCurrentUser(),
    settings: loadSettings(),
    conversations: loadConversations(userId),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.conversations && Array.isArray(data.conversations)) {
      const existing = loadConversations();
      // Merge by ID
      const map = new Map<string, Conversation>();
      existing.forEach((c) => map.set(c.id, c));
      data.conversations.forEach((c: Conversation) => map.set(c.id, c));
      saveConversations(Array.from(map.values()));
    }
    if (data.settings) {
      saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }
    return true;
  } catch (e) {
    console.error('Failed to import JSON data:', e);
    return false;
  }
}

export function loadSavedScripts(): SavedScript[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SCRIPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading saved scripts:', e);
  }
  return [];
}

export function saveSavedScripts(scripts: SavedScript[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_SCRIPTS, JSON.stringify(scripts));
  } catch (e) {
    console.error('Error saving scripts:', e);
  }
}

export function loadExecutionHistory(): ExecutionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXECUTION_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading python execution history:', e);
  }
  return [];
}

export function saveExecutionHistory(history: ExecutionHistoryItem[]): void {
  try {
    // Keep max 30 items
    localStorage.setItem(STORAGE_KEYS.EXECUTION_HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error('Error saving execution history:', e);
  }
}

