import React, { useState, useEffect, useRef } from 'react';
import { User, AIModel } from '../types';
import {
  cleanTextForSpeech,
  getAvailableVoices,
  speakText,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isSpeechActive,
  isSpeechPaused,
  downloadSpeechWav,
  downloadSpeechMp3,
  playSpeechAudio,
  startVoiceRecognition,
  isSpeechRecognitionSupported,
  VOICE_PRESETS,
  VoicePreset,
} from '../utils/tts';
import { AVAILABLE_MODELS } from '../utils/models';
import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  t,
  getPresetScripts,
  getTtsCode,
} from '../utils/i18n';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Download,
  Mic,
  MicOff,
  Sparkles,
  Sliders,
  AudioWaveform as WaveformIcon,
  Check,
  Copy,
  ChevronRight,
  Info,
  Radio,
  Send,
  Zap,
  Globe,
  Languages,
} from 'lucide-react';

interface VoiceStudioViewProps {
  currentUser: User;
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  onNavigateToChat: (initialPrompt?: string) => void;
  language?: string;
  onSelectLanguage?: (lang: string) => void;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({
  currentUser,
  currentModelId,
  onSelectModel,
  onNavigateToChat,
  language = 'en',
  onSelectLanguage,
}) => {
  const [activeLang, setActiveLang] = useState<string>(language || 'en');
  const presetScripts = getPresetScripts(activeLang);
  const [text, setText] = useState<string>(() => presetScripts[0]?.text || '');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('studio-clarity');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeCharIndex, setActiveCharIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dictation (STT) state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttTranscript, setSttTranscript] = useState<string>('');
  const recognitionStopperRef = useRef<(() => void) | null>(null);

  // Sync external language changes
  useEffect(() => {
    if (language && language !== activeLang) {
      setActiveLang(language);
      const scripts = getPresetScripts(language);
      if (scripts.length > 0) {
        setText(scripts[0].text);
      }
    }
  }, [language]);

  // Load voices on mount and prioritize active language
  useEffect(() => {
    getAvailableVoices().then((loaded) => {
      setVoices(loaded);
      if (loaded.length > 0) {
        const langPrefix = activeLang.split('-')[0].toLowerCase();
        const bestForLang = loaded.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        const generalBest = loaded.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('samantha'))
        ) || loaded[0];

        setSelectedVoiceName((bestForLang || generalBest).name);
      }
    });

    return () => {
      stopSpeech();
      if (recognitionStopperRef.current) {
        recognitionStopperRef.current();
      }
    };
  }, [activeLang]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLanguageChange = (newLang: string) => {
    setActiveLang(newLang);
    onSelectLanguage?.(newLang);
    const scripts = getPresetScripts(newLang);
    if (scripts.length > 0) {
      setText(scripts[0].text);
      showToast(`${t('language', newLang)}: ${getLanguage(newLang).nativeName} (${getLanguage(newLang).flag})`);
    }
  };

  const handleApplyPreset = (preset: VoicePreset) => {
    setSelectedPresetId(preset.id);
    setRate(preset.rate);
    setPitch(preset.pitch);
    showToast(`Applied preset: ${preset.name}`);
  };

  const handlePlay = async () => {
    if (!text.trim()) return;

    if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    try {
      setIsPlaying(true);
      setIsPaused(false);

      const targetVoice = voices.find((v) => v.name === selectedVoiceName) || null;
      const ttsLang = getTtsCode(activeLang);

      await speakText(text, {
        voice: targetVoice,
        rate,
        pitch,
        volume,
        lang: ttsLang,
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveCharIndex(0);
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
        onBoundary: (charIndex) => {
          setActiveCharIndex(charIndex);
        },
      });
    } catch (err: any) {
      setIsPlaying(false);
      setIsPaused(false);
      showToast(err.message || 'Error playing speech');
    }
  };

  const handlePause = () => {
    pauseSpeech();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveCharIndex(0);
  };

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp3'>('wav');
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleDownload = async (customFormat?: 'wav' | 'mp3', customText?: string) => {
    const fmt = customFormat || downloadFormat;
    const targetText = customText || text;
    if (!targetText.trim()) {
      showToast('Please enter text to synthesize.');
      return;
    }

    const ttsLang = getTtsCode(activeLang);

    try {
      setIsDownloading(true);
      showToast(`Synthesizing high-fidelity speech audio (.${fmt}) in ${getLanguage(activeLang).nativeName}...`);
      if (fmt === 'wav') {
        await downloadSpeechWav(targetText, 'speech-sample-audio', ttsLang);
      } else {
        await downloadSpeechMp3(targetText, 'speech-sample-audio', ttsLang);
      }
      showToast(`Downloaded authentic speech audio (.${fmt})!`);
    } catch (e: any) {
      console.error('Audio download error:', e);
      showToast('Audio download failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewRealAudio = async () => {
    if (!text.trim()) {
      showToast('Please enter text to preview.');
      return;
    }

    if (isPlayingAudioPreview && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
      setIsPlayingAudioPreview(false);
      return;
    }

    const ttsLang = getTtsCode(activeLang);

    try {
      showToast(`Loading speech audio stream in ${getLanguage(activeLang).nativeName}...`);
      setIsPlayingAudioPreview(true);
      const audio = await playSpeechAudio(text, ttsLang);
      audioPreviewRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudioPreview(false);
        audioPreviewRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingAudioPreview(false);
        audioPreviewRef.current = null;
        showToast('Audio preview failed');
      };
    } catch (err: any) {
      setIsPlayingAudioPreview(false);
      showToast('Failed to play speech audio: ' + (err.message || 'Network error'));
    }
  };

  const toggleDictation = () => {
    if (isListening) {
      if (recognitionStopperRef.current) {
        recognitionStopperRef.current();
        recognitionStopperRef.current = null;
      }
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        showToast('Microphone dictation is not supported in this browser.');
        return;
      }
      const ttsLang = getTtsCode(activeLang);
      try {
        const recognizer = startVoiceRecognition(
          {
            onStart: () => setIsListening(true),
            onResult: (transcript) => {
              setSttTranscript(transcript);
            },
            onEnd: () => setIsListening(false),
            onError: (e) => {
              setIsListening(false);
              showToast('Voice input error: ' + (e.error || 'Permission denied'));
            },
          },
          ttsLang
        );
        recognitionStopperRef.current = recognizer.stop;
      } catch (err: any) {
        showToast(err.message);
      }
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.ceil((wordCount / (150 * rate)) * 60);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 text-white text-xs font-semibold rounded-full shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5" />
              Voice & Text-to-Speech Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              High-Fidelity <span className="text-amber-400">Speech Synthesis</span> & Voice AI
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Powered by Mistral Voxtral 24B, NVIDIA Nemotron Nano Omni, and the client neural audio engine. Convert any prompt, explanation, or code breakdown into crystal-clear natural spoken voice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateToChat(text)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Send to Chat
            </button>

            <button
              onClick={handlePreviewRealAudio}
              disabled={!text.trim()}
              className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPlayingAudioPreview
                  ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-amber-300'
              }`}
              title="Preview real synthesized human speech audio before downloading"
            >
              <Volume2 className="w-4 h-4" />
              {isPlayingAudioPreview ? 'Playing Real Speech...' : 'Preview Speech Audio'}
            </button>

            <div className="inline-flex rounded-2xl bg-slate-800/90 border border-slate-700 p-1">
              <button
                onClick={() => handleDownload('wav')}
                disabled={isDownloading || !text.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Download genuine uncompressed 16-bit PCM WAV speech audio"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloading && downloadFormat === 'wav' ? 'Generating WAV...' : 'Download .WAV'}
              </button>
              <button
                onClick={() => handleDownload('mp3')}
                disabled={isDownloading || !text.trim()}
                className="px-3 py-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Download compressed MP3 speech audio"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                .MP3
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Language Voice & Content Selector Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {t('multiLanguageSupport', activeLang)} & {t('language', activeLang)}
            </h3>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {getLanguage(activeLang).flag} {getLanguage(activeLang).nativeName} ({getLanguage(activeLang).ttsLang})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t('multiLanguageDescription', activeLang)}
          </p>
        </div>

        {/* Scrollable language pill options */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {SUPPORTED_LANGUAGES.map((langItem) => {
            const isSelected = activeLang === langItem.code || activeLang.startsWith(langItem.code);
            return (
              <button
                key={langItem.code}
                onClick={() => handleLanguageChange(langItem.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <span>{langItem.flag}</span>
                <span>{langItem.nativeName}</span>
                <span className="text-[9px] opacity-75 font-mono">({langItem.code})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Models Selector Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Voice-Capable AI Models
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            OpenRouter API Key Configured • Ready for Voice & Omni Reasoning
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
          {AVAILABLE_MODELS.filter((m) => m.hasVoiceSupport || m.iconType === 'voxtral' || m.iconType === 'omni').map((m) => {
            const isSelected = m.id === currentModelId;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectModel(m.id);
                  showToast(`Switched active model to ${m.shortName}`);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/40 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {m.shortName}
                  </span>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                    {m.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor & Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Textarea Area */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                Script / Text to Synthesize
              </label>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>~{estimatedSeconds}s audio</span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste any text, article, explanation, or code to listen aloud..."
                rows={7}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none leading-relaxed"
              />

              {isPlaying && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/30 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Speaking Aloud
                </div>
              )}
            </div>

            {/* Quick Script Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Script Templates ({getLanguage(activeLang).nativeName})
                </span>
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <span>{getLanguage(activeLang).flag}</span>
                  <span>Native Content</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presetScripts.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setText(preset.text);
                      showToast(`Loaded "${preset.title}" (${getLanguage(activeLang).name})`);
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Waveform Player Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <button
                    onClick={handlePlay}
                    disabled={!text.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Play Speech
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    Pause
                  </button>
                )}

                {(isPlaying || isPaused) && (
                  <button
                    onClick={handleStop}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Stop playback"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    handleStop();
                    setTimeout(handlePlay, 100);
                  }}
                  disabled={!text.trim()}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDownload('wav')}
                  disabled={isDownloading || !text.trim()}
                  className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-600 dark:text-slate-300 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Download genuine uncompressed 16-bit PCM WAV speech audio"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>.WAV</span>
                </button>
              </div>

              {/* Animated Waveform Visualizer */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex-1 max-w-xs justify-center">
                {[4, 12, 8, 20, 16, 24, 10, 18, 14, 6, 22, 12, 16, 8, 14, 6].map((height, i) => (
                  <div
                    key={i}
                    style={{
                      height: isPlaying ? `${Math.max(4, (height * (i % 2 === 0 ? 1.2 : 0.8)))}px` : '4px',
                      animationDelay: `${i * 0.08}s`,
                    }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-amber-500 to-orange-400 animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Speech-to-Text Voice Dictation Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Voice Dictation (Speech-to-Text)
                </h3>
              </div>
              <button
                onClick={toggleDictation}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Start Dictation
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak into your microphone to dictate thoughts, queries, or code snippets in real time.
            </p>

            {sttTranscript && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2">
                <span className="italic">"{sttTranscript}"</span>
                <button
                  onClick={() => {
                    setText((prev) => (prev ? `${prev} ${sttTranscript}` : sttTranscript));
                    showToast('Appended to speech editor');
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Insert into Text
                </button>
              </div>
            )}
          </div>

          {/* Sample Speech Audio Verification Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-slate-900/5 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-slate-900/40 border border-amber-500/20 dark:border-amber-500/30 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <WaveformIcon className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Sample Speech Audio Verification
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <Check className="w-3 h-3" /> Uncompressed 16-Bit PCM WAV
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Download pre-verified sample audio to test on your local media player (VLC, Windows Media Player, QuickTime, Audacity) to confirm correct, authentic human speech reproduction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="truncate">{presetScripts[0]?.title || 'Sample A: AI Briefing'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold shrink-0">
                    {getLanguage(activeLang).code.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                  "{presetScripts[0]?.text}"
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDownload('wav', presetScripts[0]?.text)}
                    disabled={isDownloading}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                    Download Sample .WAV
                  </button>
                  <button
                    onClick={() => playSpeechAudio(presetScripts[0]?.text, getTtsCode(activeLang))}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    title="Preview speech aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="truncate">{presetScripts[1]?.title || 'Sample B: Technical Sandbox'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold shrink-0">
                    {getLanguage(activeLang).code.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                  "{presetScripts[1]?.text}"
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDownload('wav', presetScripts[1]?.text)}
                    disabled={isDownloading}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    Download Sample .WAV
                  </button>
                  <button
                    onClick={() => playSpeechAudio(presetScripts[1]?.text, getTtsCode(activeLang))}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    title="Preview speech aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Tuning & Voice Profiles */}
        <div className="space-y-4">
          {/* Voice Profiles Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Voice Tone Presets
              </h3>
            </div>

            <div className="space-y-2">
              {VOICE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-500/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/30 bg-slate-50/40 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {preset.rate}x
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* System Voice Selection Dropdown */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Installed Neural Voice ({voices.length} found)
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders: Rate, Pitch, Volume */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Speech Acoustic Parameters
              </h3>
            </div>

            {/* Speech Rate */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Speech Rate</span>
                <span className="font-mono font-bold text-amber-500">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Fast</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Voice Pitch</span>
                <span className="font-mono font-bold text-amber-500">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.5 Deep</span>
                <span>1.0 Natural</span>
                <span>1.5 High</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Output Volume</span>
                <span className="font-mono font-bold text-amber-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
