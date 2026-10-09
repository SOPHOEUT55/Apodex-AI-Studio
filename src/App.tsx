/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveTab,
  AppSettings,
  Conversation,
  Message,
  User,
} from './types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_USER,
  exportAllDataAsJSON,
  getStorageStats,
  importDataFromJSON,
  loadActiveConversationId,
  loadConversations,
  loadCurrentUser,
  loadSettings,
  saveActiveConversationId,
  saveConversations,
  saveCurrentUser,
  saveSettings,
} from './utils/storage';
import { sendChatMessageStream, sendChatMessageDirect } from './services/api';
import { NativeHeader } from './components/NativeHeader';
import { NativeTabBar } from './components/NativeTabBar';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { PythonLabView } from './components/PythonLabView';
import { VoiceStudioView } from './components/VoiceStudioView';
import { AuthModal } from './components/AuthModal';
import { SystemPromptModal } from './components/SystemPromptModal';
import { speakText } from './utils/tts';
import {
  Wifi,
  Battery,
  Signal,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => loadCurrentUser());
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations(currentUser?.id)
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const saved = loadActiveConversationId();
    const list = loadConversations();
    if (saved && list.some((c) => c.id === saved)) return saved;
    return list[0]?.id || null;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentModelId, setCurrentModelId] = useState<string>(
    () => loadSettings().defaultModelId || 'apodex/apodex-1.1-mini:free'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pythonLabInitialCode, setPythonLabInitialCode] = useState<string>('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [systemPromptModalOpen, setSystemPromptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply Dark/Light theme class to html/body
  useEffect(() => {
    const root = document.documentElement;
    if (
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Persist conversations
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Persist active conv ID
  useEffect(() => {
    saveActiveConversationId(activeConversationId);
  }, [activeConversationId]);

  // Switch user handler
  const handleUserChange = (newUser: User) => {
    setCurrentUser(newUser);
    saveCurrentUser(newUser);
    const userConvs = loadConversations(newUser.id);
    setConversations(userConvs);
    if (userConvs.length > 0) {
      setActiveConversationId(userConvs[0].id);
      setCurrentModelId(userConvs[0].modelId || settings.defaultModelId);
    } else {
      createNewConversation('New Chat');
    }
    showToast(`Signed in as ${newUser.name}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSwitchModel = (modelId: string) => {
    setCurrentModelId(modelId);
    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, modelId } : c))
      );
    }
    const isNem = modelId.includes('nemotron');
    showToast(`Switched to ${isNem ? 'NVIDIA: Nemotron 3 Ultra (free)' : 'Apodex 1.1 Mini (free)'}`);
  };

  // Find active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    createNewConversation('First Chat');

  function createNewConversation(
    title = 'New Reasoning Chat',
    initialPrompt?: string,
    modelIdToUse?: string
  ): Conversation {
    const targetModel = modelIdToUse || currentModelId || settings.defaultModelId || 'apodex/apodex-1.1-mini:free';
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: currentUser.id,
      pinned: false,
      tags: [],
      messages: [],
      temperature: settings.temperature,
      systemPrompt: settings.systemPromptPreset,
      modelId: targetModel,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentModelId(targetModel);
    setActiveTab('chat');

    if (initialPrompt) {
      setTimeout(() => {
        handleSendMessage(initialPrompt, newConv.id, targetModel);
      }, 100);
    }

    return newConv;
  }

  // Send message with streaming
  const handleSendMessage = async (text: string, convIdToUse?: string, modelOverride?: string) => {
    const targetConvId = convIdToUse || activeConversationId || activeConversation.id;
    if (!text.trim() || isGenerating) return;

    const currentConv = conversations.find((c) => c.id === targetConvId);
    const targetModel = modelOverride || currentConv?.modelId || currentModelId || 'apodex/apodex-1.1-mini:free';

    const userMessage: Message = {
      id: `user_msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      tokens: Math.round(text.length / 4),
    };

    const assistantMessageId = `assist_msg_${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      reasoning: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: targetModel,
    };

    // Update state with user message and empty streaming assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          const newTitle =
            c.messages.length === 0
              ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
              : c.title;

          return {
            ...c,
            title: newTitle,
            updatedAt: Date.now(),
            modelId: targetModel,
            messages: [...c.messages, userMessage, initialAssistantMessage],
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    // Prepare payload
    const existingMessages = currentConv?.messages || [];
    const formattedMessages = [
      ...existingMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    let fullReasoning = '';
    let fullContent = '';

    try {
      if (settings.streamEnabled) {
        await sendChatMessageStream(
          {
            model: targetModel,
            messages: formattedMessages,
            systemPrompt: currentConv?.systemPrompt || settings.systemPromptPreset,
            temperature: currentConv?.temperature || settings.temperature,
            stream: true,
          },
          {
            onReasoningChunk: (chunk) => {
              fullReasoning += chunk;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, reasoning: fullReasoning, isStreaming: true }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            },
            onContentChunk: (chunk) => {
              fullContent += chunk;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: fullContent, isStreaming: true }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            },
            onDone: (content, reasoning) => {
              const finalContent = content || fullContent;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      updatedAt: Date.now(),
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: finalContent,
                              reasoning: reasoning || fullReasoning,
                              isStreaming: false,
                              tokens: Math.round(finalContent.length / 4) + 120,
                              modelUsed: targetModel,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
              setIsGenerating(false);

              if (settings.autoReadAloud && finalContent) {
                speakText(finalContent).catch(() => {});
              }
            },
            onError: (err) => {
              console.error('Stream error:', err);
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content:
                                (fullContent || '') +
                                `\n\n*(Error: ${err.message || 'Service temporarily overloaded. You can switch to another free model or retry.'})*`,
                              reasoning: fullReasoning,
                              isStreaming: false,
                              error: true,
                              modelUsed: targetModel,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
              setIsGenerating(false);
            },
          }
        );
      } else {
        // Direct non-streamed
        const res = await sendChatMessageDirect({
          model: targetModel,
          messages: formattedMessages,
          systemPrompt: currentConv?.systemPrompt || settings.systemPromptPreset,
          temperature: currentConv?.temperature || settings.temperature,
        });

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: res.content,
                        reasoning: res.reasoning,
                        isStreaming: false,
                        tokens: res.usage?.completion_tokens || Math.round(res.content.length / 4),
                        modelUsed: targetModel,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        setIsGenerating(false);
      }
    } catch (e: any) {
      console.error('Send message exception:', e);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `AI model encountered an issue: ${e.message}. You can switch to another free model.`,
                      isStreaming: false,
                      error: true,
                      modelUsed: targetModel,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m
            ),
          };
        }
        return c;
      })
    );
    showToast('Generation halted');
  };

  const handleRegenerateLast = () => {
    if (!activeConversation || isGenerating) return;
    const msgs = activeConversation.messages;
    if (msgs.length < 2) return;

    // Find last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;
    const lastUserText = msgs[lastUserIndex].content;

    // Trim messages to before last assistant message
    const trimmed = msgs.slice(0, lastUserIndex);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: trimmed } : c))
    );

    // Resend
    handleSendMessage(lastUserText);
  };

  const handleUpdateTitle = (newTitle: string) => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, title: newTitle } : c))
    );
    showToast('Thread renamed');
  };

  const handleTogglePin = (id?: string) => {
    const targetId = id || activeConversation?.id;
    if (!targetId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleClearMessages = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: [] } : c))
    );
    showToast('Messages cleared in thread');
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConversationId === id) {
      setActiveConversationId(remaining[0]?.id || null);
    }
    showToast('Conversation deleted');
  };

  const handleClearAllConversations = () => {
    setConversations([]);
    setActiveConversationId(null);
    showToast('All conversations cleared');
  };

  const handleExportAll = () => {
    const jsonStr = exportAllDataAsJSON(currentUser.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apodex_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  };

  const handleExportConversation = (format: 'markdown' | 'json') => {
    if (!activeConversation) return;
    let content = '';
    let ext = '';
    let type = '';

    if (format === 'markdown') {
      content = `# ${activeConversation.title}\n*Exported from Apodex 1.1 Mini on ${new Date().toLocaleString()}*\n\n---\n\n`;
      activeConversation.messages.forEach((m) => {
        const sender = m.role === 'user' ? currentUser.name : 'Apodex 1.1 Mini';
        content += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()}):\n\n`;
        if (m.reasoning) {
          content += `> **Thinking Process:**\n> ${m.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        }
        content += `${m.content}\n\n---\n\n`;
      });
      ext = 'md';
      type = 'text/markdown';
    } else {
      content = JSON.stringify(activeConversation, null, 2);
      ext = 'json';
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${ext}`);
  };

  const handleImportBackup = (jsonStr: string): boolean => {
    const ok = importDataFromJSON(jsonStr);
    if (ok) {
      const refreshed = loadConversations(currentUser.id);
      setConversations(refreshed);
      if (refreshed.length > 0) setActiveConversationId(refreshed[0].id);
      showToast('Backup restored successfully!');
      return true;
    }
    return false;
  };

  const storageStats = getStorageStats(currentUser.id);

  // Main content renderer based on tab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            currentUser={currentUser}
            conversations={conversations}
            stats={storageStats}
            currentModelId={currentModelId}
            onSelectModel={handleSwitchModel}
            onStartNewChat={(prompt, modelId) => {
              createNewConversation(
                prompt ? prompt.slice(0, 24) + '...' : 'New Chat',
                prompt,
                modelId || currentModelId
              );
            }}
            onOpenConversation={(id) => {
              setActiveConversationId(id);
              const conv = conversations.find((c) => c.id === id);
              if (conv?.modelId) setCurrentModelId(conv.modelId);
              setActiveTab('chat');
            }}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToPythonLab={(code) => {
              if (code) setPythonLabInitialCode(code);
              setActiveTab('python');
            }}
            onNavigateToTTS={() => setActiveTab('tts')}
          />
        );
      case 'chat':
        return (
          <ChatView
            currentUser={currentUser}
            conversation={activeConversation}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            onRegenerateLast={handleRegenerateLast}
            onUpdateTitle={handleUpdateTitle}
            onTogglePin={() => handleTogglePin()}
            onClearMessages={handleClearMessages}
            onOpenSystemPrompt={() => setSystemPromptModalOpen(true)}
            onExportConversation={handleExportConversation}
            onSwitchModel={handleSwitchModel}
            onOpenInPythonLab={(code) => {
              setPythonLabInitialCode(code);
              setActiveTab('python');
            }}
            language={settings.language || 'en'}
          />
        );
      case 'python':
        return (
          <PythonLabView
            currentModelId={currentModelId}
            initialCode={pythonLabInitialCode}
            onAskAIAboutCode={(prompt, code) => {
              const fullPrompt = `${prompt}\n\n\`\`\`python\n${code}\n\`\`\``;
              createNewConversation('Python Code Assistant', fullPrompt, currentModelId);
              setActiveTab('chat');
            }}
          />
        );
      case 'tts':
        return (
          <VoiceStudioView
            currentUser={currentUser}
            currentModelId={currentModelId}
            onSelectModel={handleSwitchModel}
            onNavigateToChat={(initialPrompt) => {
              if (initialPrompt) {
                createNewConversation('Voice AI Chat', initialPrompt, currentModelId);
              }
              setActiveTab('chat');
            }}
            language={settings.language || 'en'}
            onSelectLanguage={(lang) => {
              setSettings((prev) => ({ ...prev, language: lang }));
            }}
          />
        );
      case 'history':
        return (
          <HistoryView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              const conv = conversations.find((c) => c.id === id);
              if (conv?.modelId) setCurrentModelId(conv.modelId);
              setActiveTab('chat');
            }}
            onTogglePin={handleTogglePin}
            onDeleteConversation={handleDeleteConversation}
            onClearAllConversations={handleClearAllConversations}
            onExportAll={handleExportAll}
            onImportBackup={handleImportBackup}
          />
        );
      case 'settings':
      case 'profile':
        return (
          <SettingsView
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
            onOpenAuth={() => setAuthModalOpen(true)}
            storageStats={storageStats}
            onExportAll={handleExportAll}
            onClearAllData={handleClearAllConversations}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-slate-700 dark:border-slate-300 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Conditional: React Native Mobile Frame vs Wide Web Dashboard */}
      {settings.mobileViewMode ? (
        // Simulated React Native Mobile Shell
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* Outer Phone Shell */}
          <div className="w-full max-w-[420px] h-[92vh] max-h-[880px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col relative ring-1 ring-white/10">
            {/* Phone Notch / Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-28 h-5 bg-black rounded-full flex items-center justify-center border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60 mr-4" />
              <div className="w-2 h-2 rounded-full bg-cyan-500/80 animate-pulse" />
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[38px] overflow-hidden flex flex-col relative">
              {/* Native Mobile Status Bar */}
              <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Header inside phone */}
              <NativeHeader
                currentUser={currentUser}
                onOpenAuth={() => setAuthModalOpen(true)}
                theme={settings.theme}
                onToggleTheme={() =>
                  setSettings((prev) => ({
                    ...prev,
                    theme: prev.theme === 'dark' ? 'light' : 'dark',
                  }))
                }
                isMobileView={settings.mobileViewMode}
                onToggleMobileView={() =>
                  setSettings((prev) => ({ ...prev, mobileViewMode: !prev.mobileViewMode }))
                }
                onOpenSystemPrompt={() => setSystemPromptModalOpen(true)}
                currentModelId={currentModelId}
                onSelectModel={handleSwitchModel}
                language={settings.language || 'en'}
                onSelectLanguage={(lang) => {
                  setSettings((prev) => ({ ...prev, language: lang }));
                }}
              />

              {/* Scrollable View inside phone */}
              <main className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                {renderCurrentView()}
              </main>

              {/* Native Bottom Tab Bar */}
              <NativeTabBar
                activeTab={activeTab}
                onTabChange={(t) => setActiveTab(t)}
                language={settings.language || 'en'}
              />

              {/* Home Indicator Bar */}
              <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-1 select-none" />
            </div>
          </div>
        </div>
      ) : (
        // Expanded Web Dashboard Layout
        <div className="flex-1 flex flex-col">
          <NativeHeader
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            theme={settings.theme}
            onToggleTheme={() =>
              setSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark',
              }))
            }
            isMobileView={settings.mobileViewMode}
            onToggleMobileView={() =>
              setSettings((prev) => ({ ...prev, mobileViewMode: !prev.mobileViewMode }))
            }
            onOpenSystemPrompt={() => setSystemPromptModalOpen(true)}
            currentModelId={currentModelId}
            onSelectModel={handleSwitchModel}
            language={settings.language || 'en'}
            onSelectLanguage={(lang) => {
              setSettings((prev) => ({ ...prev, language: lang }));
            }}
          />

          <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
            {renderCurrentView()}
          </div>

          {/* Bottom Native Tab Bar on mobile screens or fixed bar */}
          <div className="sticky bottom-0 z-30">
            <NativeTabBar
              activeTab={activeTab}
              onTabChange={(t) => setActiveTab(t)}
              language={settings.language || 'en'}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />

      {/* System Prompt Tuning Modal */}
      <SystemPromptModal
        isOpen={systemPromptModalOpen}
        onClose={() => setSystemPromptModalOpen(false)}
        systemPrompt={activeConversation?.systemPrompt || settings.systemPromptPreset}
        temperature={activeConversation?.temperature || settings.temperature}
        onSave={(prompt, temp) => {
          setSettings((prev) => ({ ...prev, systemPromptPreset: prompt, temperature: temp }));
          if (activeConversation) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversation.id
                  ? { ...c, systemPrompt: prompt, temperature: temp }
                  : c
              )
            );
          }
          showToast('Model configurations saved');
        }}
      />
    </div>
  );
}
