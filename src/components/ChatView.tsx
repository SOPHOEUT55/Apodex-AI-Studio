import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, User } from '../types';
import { ReasoningBox } from './ReasoningBox';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  speakText,
  stopSpeech,
  startVoiceRecognition,
  isSpeechRecognitionSupported,
  isSpeechActive,
  downloadSpeechWav,
} from '../utils/tts';
import {
  Send,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Pin,
  Trash2,
  Download,
  Edit2,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  Zap,
  Terminal,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  conversation: Conversation;
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onRegenerateLast: () => void;
  onUpdateTitle: (title: string) => void;
  onTogglePin: () => void;
  onClearMessages: () => void;
  onOpenSystemPrompt: () => void;
  onExportConversation: (format: 'markdown' | 'json') => void;
  onSwitchModel?: (modelId: string) => void;
  onOpenInPythonLab?: (code: string) => void;
}

const QUICK_SUGGESTIONS = [
  'Deep analyze this from first principles',
  'Write a Python program with error handling & unit tests',
  'Provide a calibrated probabilistic forecast',
  'Show full Python implementation with benchmarks',
  'Break down edge cases and failure modes',
];

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  conversation,
  isGenerating,
  onSendMessage,
  onStopGeneration,
  onRegenerateLast,
  onUpdateTitle,
  onTogglePin,
  onClearMessages,
  onOpenSystemPrompt,
  onExportConversation,
  onSwitchModel,
  onOpenInPythonLab,
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(conversation.title);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Text-to-Speech & Voice Input state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [downloadingMsgId, setDownloadingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionStopperRef = useRef<(() => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isVoxtral = (conversation.modelId || '').includes('voxtral');
  const isOmni = (conversation.modelId || '').includes('nano-omni');
  const isNemotron = (conversation.modelId || '').includes('nemotron');

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isGenerating]);

  // Clean up ongoing speech and voice recognition on unmount or conversation change
  useEffect(() => {
    return () => {
      stopSpeech();
      if (recognitionStopperRef.current) {
        recognitionStopperRef.current();
        recognitionStopperRef.current = null;
      }
    };
  }, [conversation.id]);

  const toggleSpeakMessage = async (msgId: string, content: string) => {
    if (speakingMsgId === msgId) {
      stopSpeech();
      setSpeakingMsgId(null);
      return;
    }

    try {
      setSpeakingMsgId(msgId);
      await speakText(content, {
        onStart: () => setSpeakingMsgId(msgId),
        onEnd: () => setSpeakingMsgId(null),
        onError: () => setSpeakingMsgId(null),
      });
    } catch {
      setSpeakingMsgId(null);
    }
  };

  const handleDownloadSpeech = async (msgId: string, content: string) => {
    try {
      setDownloadingMsgId(msgId);
      await downloadSpeechWav(content, 'ai-speech-response');
    } catch (err: any) {
      console.error('Download speech audio error:', err);
    } finally {
      setDownloadingMsgId(null);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionStopperRef.current) {
        recognitionStopperRef.current();
        recognitionStopperRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      try {
        const recognizer = startVoiceRecognition({
          onStart: () => setIsListening(true),
          onResult: (transcript, isFinal) => {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
            if (isFinal) {
              setIsListening(false);
            }
          },
          onEnd: () => setIsListening(false),
          onError: () => setIsListening(false),
        });
        recognitionStopperRef.current = recognizer.stop;
      } catch {
        setIsListening(false);
      }
    }
  };

  // Sync temp title when conversation changes
  useEffect(() => {
    setTempTitle(conversation.title);
  }, [conversation.title]);

  // Check scroll position to show "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const giveFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({ ...prev, [msgId]: type }));
  };

  const toggleModelForThisChat = () => {
    if (!onSwitchModel) return;
    const nextModel = isNemotron
      ? 'apodex/apodex-1.1-mini:free'
      : 'nvidia/nemotron-3-ultra-550b-a55b:free';
    onSwitchModel(nextModel);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-7.5rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 backdrop-blur-md select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="text-xs sm:text-sm font-semibold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-cyan-500 text-slate-900 dark:text-white w-full max-w-sm focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {conversation.title}
              </h2>
              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-cyan-500 shrink-0" />
            </div>
          )}
        </div>

        {/* Action icons & Model Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Model Badge / Switcher */}
          <button
            onClick={toggleModelForThisChat}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              isNemotron
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20'
            }`}
            title="Click to toggle between Apodex 1.1 Mini and NVIDIA Nemotron 3 Ultra"
          >
            {isNemotron ? (
              <>
                <Cpu className="w-3 h-3 text-emerald-500" />
                <span>NVIDIA Nemotron</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                <span>Apodex 1.1 Mini</span>
              </>
            )}
          </button>

          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              conversation.pinned
                ? 'bg-amber-500/15 text-amber-500'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
            title={conversation.pinned ? 'Unpin chat' : 'Pin chat to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${conversation.pinned ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            onClick={onOpenSystemPrompt}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Configure System Prompt & Temperature"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onExportConversation('markdown')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {conversation.messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear all messages in this thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border ${
                isNemotron
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {isNemotron ? (
                <Cpu className="w-7 h-7 animate-pulse" />
              ) : (
                <Sparkles className="w-7 h-7 animate-pulse" />
              )}
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Start Reasoning with {isNemotron ? 'NVIDIA: Nemotron 3 Ultra' : 'Apodex 1.1 Mini'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isNemotron
                  ? 'Frontier 550B MoE model from NVIDIA. Ask multi-step coding, architecture, and reasoning questions with verified chain of thought.'
                  : 'Engineered for long-horizon research, forecasting scenarios, and quantitative analysis with transparent step-by-step thinking.'}
              </p>
            </div>

            <div className="w-full max-w-md grid grid-cols-1 gap-2 pt-2">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 bg-slate-50 dark:bg-slate-800/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 text-left text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span>{suggestion}</span>
                  <Sparkles className="w-3 h-3 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastAssistant =
              !isUser && index === conversation.messages.length - 1;
            const msgIsNemotron = (msg.modelUsed || conversation.modelId || '').includes('nemotron');

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 mt-1 shadow-sm ${
                      msgIsNemotron
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-tr from-cyan-600 to-indigo-600'
                    }`}
                  >
                    {msgIsNemotron ? <Cpu className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  {/* Reasoning accordion for assistant */}
                  {!isUser && (msg.reasoning || (msg.isStreaming && !msg.content)) && (
                    <ReasoningBox
                      reasoning={msg.reasoning || ''}
                      isStreaming={msg.isStreaming && !msg.content}
                      defaultExpanded={false}
                    />
                  )}

                  {/* Message body */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text">
                      {msg.content}
                    </p>
                  ) : (
                    <div>
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} onOpenInPythonLab={onOpenInPythonLab} />
                      ) : msg.isStreaming ? (
                        <div className={`flex items-center gap-1.5 py-1 text-xs ${msgIsNemotron ? 'text-emerald-500 dark:text-emerald-400' : 'text-cyan-500 dark:text-cyan-400'}`}>
                          <span className={`w-2 h-2 rounded-full animate-ping ${msgIsNemotron ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span>
                          <span>{msgIsNemotron ? 'NVIDIA Nemotron 3 Ultra' : 'Apodex 1.1 Mini'} is synthesizing thoughts...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No output</span>
                      )}
                    </div>
                  )}

                  {/* Message footer actions */}
                  <div
                    className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[10px] ${
                      isUser
                        ? 'border-white/15 text-white/70'
                        : 'border-slate-200 dark:border-slate-700/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {!isUser && (
                        <span className={`font-semibold ${msgIsNemotron ? 'text-emerald-500 dark:text-emerald-400' : 'text-cyan-500 dark:text-cyan-400'}`}>
                          {msgIsNemotron ? 'Nemotron 3 Ultra' : 'Apodex 1.1 Mini'}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.tokens ? <span>• {msg.tokens} tokens</span> : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                          copiedMsgId === msg.id ? 'text-emerald-400' : ''
                        }`}
                        title="Copy message"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {!isUser && (
                        <>
                          <button
                            onClick={() => toggleSpeakMessage(msg.id, msg.content)}
                            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 ${
                              speakingMsgId === msg.id ? 'text-amber-500 font-bold' : ''
                            }`}
                            title={speakingMsgId === msg.id ? 'Stop listening' : 'Read aloud with Text-to-Speech'}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-amber-500" />
                                <span className="text-[9px] text-amber-500 animate-pulse font-medium">Speaking...</span>
                              </>
                            ) : (
                              <Volume2 className="w-3 h-3 text-slate-400 hover:text-amber-500" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDownloadSpeech(msg.id, msg.content)}
                            disabled={downloadingMsgId === msg.id}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-slate-400 hover:text-amber-500 disabled:opacity-40"
                            title="Download audio recording of speech (.wav)"
                          >
                            <Download className={`w-3 h-3 ${downloadingMsgId === msg.id ? 'animate-bounce text-amber-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => giveFeedback(msg.id, 'up')}
                            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                              feedbackMap[msg.id] === 'up' ? 'text-cyan-400 font-bold' : ''
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => giveFeedback(msg.id, 'down')}
                            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                              feedbackMap[msg.id] === 'down' ? 'text-rose-400 font-bold' : ''
                            }`}
                            title="Unhelpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>

                          {isLastAssistant && !isGenerating && (
                            <button
                              onClick={onRegenerateLast}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px]"
                              title="Regenerate this response"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isUser && (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-xl object-cover shrink-0 mt-1 border border-slate-300 dark:border-slate-700 shadow-sm"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-500 transition-all z-20 cursor-pointer animate-bounce"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Quick Follow-up Pills (when chat is active) */}
      {conversation.messages.length > 0 && !isGenerating && (
        <div className="px-4 py-1.5 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK_SUGGESTIONS.slice(0, 3).map((pill, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(pill)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-cyan-500/15 hover:text-cyan-600 dark:hover:text-cyan-400 text-slate-600 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40 transition-colors cursor-pointer shrink-0"
            >
              + {pill}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 bg-white dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500 transition-all">
          {onOpenInPythonLab && (
            <button
              type="button"
              onClick={() => onOpenInPythonLab('')}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
              title="Open Python 3.10 Lab"
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse'
                : 'text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
            title={isListening ? 'Stop listening (Recording Voice)' : 'Voice Dictation (Microphone)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your voice... Speak now'
                : isGenerating
                ? `${isVoxtral ? 'Mistral Voxtral 24B' : isOmni ? 'Nemotron Nano Omni' : isNemotron ? 'NVIDIA Nemotron 3' : 'Apodex 1.1 Mini'} is generating reasoned response...`
                : `Ask ${isVoxtral ? 'Mistral Voxtral' : isOmni ? 'Nemotron Nano Omni' : isNemotron ? 'NVIDIA Nemotron' : 'Apodex'} anything (Shift+Enter for newline)...`
            }
            disabled={isGenerating}
            className="flex-1 max-h-36 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none px-2.5 py-1.5 focus:outline-none leading-relaxed"
          />

          {isGenerating ? (
            <button
              onClick={onStopGeneration}
              className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-colors cursor-pointer shrink-0"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                inputText.trim()
                  ? isNemotron
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

