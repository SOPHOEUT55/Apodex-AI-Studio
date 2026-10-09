// Text-to-Speech (TTS) and Speech-to-Text (STT) Engine

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null;
  voiceName?: string;
  lang?: string;
  rate?: number; // 0.5 to 2.0, default 1.0
  pitch?: number; // 0.5 to 1.5, default 1.0
  volume?: number; // 0.0 to 1.0, default 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: any) => void;
  onBoundary?: (charIndex: number, charLength: number) => void;
}

export interface VoicePreset {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  rate: number;
  pitch: number;
  description: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'studio-clarity',
    name: 'Studio Clarity',
    lang: 'en-US',
    gender: 'female',
    tone: 'Crystal clear, professional briefing voice',
    rate: 1.0,
    pitch: 1.05,
    description: 'Optimized for technical explanations and research summaries',
  },
  {
    id: 'natural-conversational',
    name: 'Natural Conversational',
    lang: 'en-US',
    gender: 'neutral',
    tone: 'Warm, dynamic and expressive tone',
    rate: 1.05,
    pitch: 0.95,
    description: 'Perfect for casual discussion and everyday inquiries',
  },
  {
    id: 'deep-narrator',
    name: 'Deep Narrator',
    lang: 'en-US',
    gender: 'male',
    tone: 'Authoritative, calm cinematic delivery',
    rate: 0.92,
    pitch: 0.85,
    description: 'Ideal for long-form reasoning, history, and deep-dive lectures',
  },
  {
    id: 'rapid-podcast',
    name: 'Speed Briefing',
    lang: 'en-US',
    gender: 'neutral',
    tone: 'Energetic, fast-paced tech podcast style',
    rate: 1.25,
    pitch: 1.0,
    description: 'High throughput delivery for quick catch-ups and code summaries',
  },
];

/**
 * Strips raw markdown syntax, code fences, and links to make speech sound natural
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Replace code blocks with spoken summary note
  cleaned = cleaned.replace(/```(?:python|ts|js|bash|json|html|css)?[\s\S]*?```/gi, (match) => {
    const lines = match.split('\n').filter((l) => l.trim().length > 0);
    return ` (Code snippet with ${Math.max(1, lines.length - 2)} lines of code) `;
  });

  // Remove inline code ticks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Replace markdown links [label](url) with just label
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove bold / italics
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Clean bullet list markers
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

  // Clean blockquotes
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Clean URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, 'web link');

  // Clean table pipes
  cleaned = cleaned.replace(/\|/g, ', ');

  // Collapse multiple line breaks and spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Loads available browser SpeechSynthesis voices
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Fallback timeout in case voiceschanged never fires
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

/**
 * Finds the most natural voice available in the client system for the requested language
 */
export function findBestVoice(voices: SpeechSynthesisVoice[], preferredName?: string, lang = 'en'): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (preferredName) {
    const exact = voices.find((v) => v.name.toLowerCase().includes(preferredName.toLowerCase()));
    if (exact) return exact;
  }

  const langPrefix = lang.split('-')[0].toLowerCase();

  // Search within requested language first
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (langVoices.length > 0) {
    const natural = langVoices.find((v) =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('premium') ||
      v.name.toLowerCase().includes('samantha')
    );
    return natural || langVoices[0];
  }

  // Priority search: Google / Natural / Samantha
  const priorityTerms = ['natural', 'google', 'premium', 'samantha', 'jenny', 'guy'];
  for (const term of priorityTerms) {
    const found = voices.find((v) => v.name.toLowerCase().includes(term));
    if (found) return found;
  }

  return voices[0] || null;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks text using the browser SpeechSynthesis engine
 */
export async function speakText(text: string, options: TTSOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Speech synthesis is not supported in this browser.');
  }

  // Stop any ongoing speech
  stopSpeech();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  const voices = await getAvailableVoices();
  const selectedVoice = options.voice || findBestVoice(voices, options.voiceName, options.lang || 'en');

  const utterance = new SpeechSynthesisUtterance(cleaned);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || options.lang || 'en-US';
  } else if (options.lang) {
    utterance.lang = options.lang;
  }

  utterance.rate = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0));
  utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch ?? 1.0));
  utterance.volume = Math.max(0.0, Math.min(1.0, options.volume ?? 1.0));

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    options.onError?.(e);
  };

  utterance.onpause = () => {
    options.onPause?.();
  };

  utterance.onresume = () => {
    options.onResume?.();
  };

  if (options.onBoundary) {
    utterance.onboundary = (e) => {
      options.onBoundary?.(e.charIndex, (e as any).charLength || 1);
    };
  }

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Pauses current speech playback
 */
export function pauseSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resumes speech playback
 */
export function resumeSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

/**
 * Stops any speech playback immediately
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeechActive(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

export function isSpeechPaused(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.paused;
}

/**
 * Checks if Speech Recognition (Voice Input / Mic) is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Creates and starts speech-to-text recognition
 */
export function startVoiceRecognition(
  callbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
    onStart?: () => void;
  },
  lang = 'en-US'
): { stop: () => void } {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('Speech recognition is not supported in this browser.');
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang || 'en-US';

  recognition.onstart = () => {
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalTranscript += item[0].transcript;
      } else {
        interimTranscript += item[0].transcript;
      }
    }

    const full = (finalTranscript || interimTranscript).trim();
    if (full) {
      callbacks.onResult(full, Boolean(finalTranscript));
    }
  };

  recognition.onerror = (e: any) => {
    callbacks.onError?.(e);
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  try {
    recognition.start();
  } catch (e) {
    callbacks.onError?.(e);
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}

/**
 * Fetches real speech audio from backend /api/tts/audio endpoint as a Blob.
 * If server returns MP3, it can decode to uncompressed PCM WAV via Web Audio API.
 */
export async function fetchSpeechAudioBlob(
  text: string,
  format: 'wav' | 'mp3' = 'wav',
  lang: string = 'en'
): Promise<Blob> {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    throw new Error('No text provided for speech generation.');
  }

  const response = await fetch('/api/tts/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned, format, lang }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Speech audio generation failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const arrayBuffer = await response.arrayBuffer();

  // If WAV was requested and server responded with audio/wav
  if (format === 'wav') {
    if ((contentType.includes('audio/wav') || contentType.includes('audio/x-wav')) && isWavHeader(arrayBuffer)) {
      return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // Server returned audio/mpeg (MP3) or unseekable header.
    // Decode in browser using AudioContext to produce authentic uncompressed PCM WAV
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return audioBufferToWavBlob(decodedBuffer);
      }
    } catch (decodeErr) {
      console.warn('Browser AudioContext decode fallback to raw blob:', decodeErr);
    }
  }

  // Otherwise return MP3 or audio blob
  return new Blob([arrayBuffer], { type: contentType || 'audio/mpeg' });
}

function isWavHeader(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 44) return false;
  const view = new DataView(buffer);
  // RIFF header
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  const riffSize = view.getUint32(4, true);
  // Check that size is valid and not 0xFFFFFFFF pipe artifact
  const isValidSize = riffSize > 0 && riffSize !== 0xffffffff;
  return riff === 'RIFF' && wave === 'WAVE' && isValidSize;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Downloads authentic high-quality speech audio file (.wav) of the given text
 */
export async function downloadSpeechWav(text: string, title = 'ai-speech-audio', lang = 'en'): Promise<void> {
  const blob = await fetchSpeechAudioBlob(text, 'wav', lang);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'ai-speech';
  triggerBlobDownload(blob, `${safeTitle}.wav`);
}

/**
 * Downloads authentic high-quality speech audio file (.mp3) of the given text
 */
export async function downloadSpeechMp3(text: string, title = 'ai-speech-audio', lang = 'en'): Promise<void> {
  const blob = await fetchSpeechAudioBlob(text, 'mp3', lang);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'ai-speech';
  triggerBlobDownload(blob, `${safeTitle}.mp3`);
}

/**
 * Plays the real high-fidelity speech audio directly using HTML5 Audio
 */
export async function playSpeechAudio(text: string, lang = 'en'): Promise<HTMLAudioElement> {
  const blob = await fetchSpeechAudioBlob(text, 'mp3', lang);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  await audio.play();
  return audio;
}

/**
 * Converts an AudioBuffer into standard, clean 16-bit uncompressed PCM WAV format
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1; // Downmix cleanly to mono for speech clarity
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const numSamples = buffer.length;

  const blockAlign = (numChannels * bitDepth) / 8; // 2 bytes per sample
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferLength = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Downmix all channels to mono for clean, distortion-free speech
  const inputChannels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    inputChannels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let mixed = 0;
    for (let c = 0; c < inputChannels.length; c++) {
      mixed += inputChannels[c][i];
    }
    mixed = mixed / inputChannels.length;
    // Clamp to valid -1.0 .. 1.0 range
    const sample = Math.max(-1, Math.min(1, mixed));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}
