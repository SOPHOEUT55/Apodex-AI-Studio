// Text-to-Speech (TTS) and Speech-to-Text (STT) Engine

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null;
  voiceName?: string;
  lang?: string;
  gender?: 'male' | 'female' | 'neutral';
  voiceModelId?: string;
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

export interface KhmerVoiceModel {
  id: string;
  name: string;
  khmerName: string;
  gender: 'male' | 'female';
  role: string;
  khmerRole: string;
  tone: string;
  pitch: number;
  rate: number;
  description: string;
  khmerDescription: string;
  sampleText: string;
  avatar: string;
  badge: string;
}

export const KHMER_VOICE_MODELS: KhmerVoiceModel[] = [
  // MEN VOICES (សំឡេងបុរសខ្មែរ)
  {
    id: 'km-male-sokha',
    name: 'Sokha (សុខា)',
    khmerName: 'សុខា',
    gender: 'male',
    role: 'Natural Conversational & Assistant',
    khmerRole: 'សំឡេងសន្ទនាធម្មជាតិ & ជំនួយការ AI',
    tone: 'Warm, deep baritone, authentic Cambodian pronunciation',
    pitch: 0.84,
    rate: 0.98,
    description: 'Natural Cambodian male voice with warm resonance and smooth conversational pacing.',
    khmerDescription: 'សំឡេងបុរសខ្មែរធម្មជាតិ រលូន ធ្ងន់ និងច្បាស់ល្អ សមរម្យសម្រាប់ការសន្ទនាទូទៅ និងជំនួយការ។',
    sampleText: 'សួស្តីបងប្អូនទាំងអស់គ្នា! ខ្ញុំបាទឈ្មោះសុខា ជាម៉ូដែលសំឡេងបុរសខ្មែរ រីករាយណាស់ដែលបានបម្រើការជូនលោកអ្នក។',
    avatar: '👨‍💼',
    badge: 'បុរសធម្មជាតិ',
  },
  {
    id: 'km-male-piseth',
    name: 'Piseth (ពិសិដ្ឋ)',
    khmerName: 'ពិសិដ្ឋ',
    gender: 'male',
    role: 'News Anchor & Technical Briefing',
    khmerRole: 'អ្នកអានព័ត៌មាន & បទបង្ហាញបច្ចេកទេស',
    tone: 'Crisp, articulate, authoritative broadcast delivery',
    pitch: 0.88,
    rate: 1.05,
    description: 'Authoritative male broadcast anchor, perfect for technical briefings and formal reports.',
    khmerDescription: 'សំឡេងបុរសអ្នកអានព័ត៌មាន ស្វាហាប់ ម៉ឺងម៉ាត់ និងច្បាស់លាស់ សម្រាប់របាយការណ៍បច្ចេកវិទ្យា។',
    sampleText: 'សូមស្វាគមន៍មកកាន់របាយការណ៍សង្ខេបបច្ចេកវិទ្យាប្រចាំថ្ងៃ និងការវិភាគលើប្រព័ន្ធបញ្ញាសិប្បនិម្មិតកម្រិតខ្ពស់។',
    avatar: '🎙️',
    badge: 'អ្នកអានព័ត៌មាន',
  },
  {
    id: 'km-male-khemara',
    name: 'Khemara (ខេមរា)',
    khmerName: 'ខេមរា',
    gender: 'male',
    role: 'Deep Resonance & Long-Form Narration',
    khmerRole: 'សំឡេងធំទូលាយ & ការនិទានរឿងស៊ីជម្រៅ',
    tone: 'Deep bass-baritone, calm philosophical resonance',
    pitch: 0.78,
    rate: 0.92,
    description: 'Deep cinematic bass-baritone designed for philosophical reasoning, deep audiobooks, and history.',
    khmerDescription: 'សំឡេងបុរសធ្ងន់ជ្រៅ អន្លង់អន្លោច សមរម្យសម្រាប់ការនិទានរឿង និងហេតុផលស៊ីជម្រៅ។',
    sampleText: 'តាមរយៈការវិភាគទិន្នន័យយ៉ាងល្អិតល្អន់ យើងមើលឃើញពីចក្ខុវិស័យវែងឆ្ងាយនៃការអភិវឌ្ឍន៍សង្គមឌីជីថល។',
    avatar: '📚',
    badge: 'សំឡេងធំនិទាន',
  },
  // WOMEN VOICES (សំឡេងស្ត្រីខ្មែរ)
  {
    id: 'km-female-bopha',
    name: 'Bopha (បុប្ផា)',
    khmerName: 'បុប្ផា',
    gender: 'female',
    role: 'Natural Daily Assistant & Friendly Host',
    khmerRole: 'ជំនួយការប្រចាំថ្ងៃ & រួសរាយរាក់ទាក់',
    tone: 'Sweet, gentle, expressive soprano with authentic accent',
    pitch: 1.14,
    rate: 1.02,
    description: 'Sweet, friendly Cambodian female voice with crystal clarity, perfect for personal assistance.',
    khmerDescription: 'សំឡេងស្ត្រីខ្មែរស្រទន់ ពិរោះ រស់រវើក និងស្តង់ដារ សម្រាប់ការឆ្លើយសំណួរ និងជំនួយការ។',
    sampleText: 'ជម្រាបសួរចាស! នាងខ្ញុំឈ្មោះបុប្ផា រីករាយណាស់ដែលបានជួយឆ្លើយសំណួរ និងបកស្រាយជូនលោកអ្នកនៅថ្ងៃនេះ។',
    avatar: '👩‍💼',
    badge: 'ស្ត្រីធម្មជាតិ',
  },
  {
    id: 'km-female-chavy',
    name: 'Chavy (ចរិយា)',
    khmerName: 'ចរិយា',
    gender: 'female',
    role: 'Broadcast Anchor & Executive Host',
    khmerRole: 'អ្នកអានព័ត៌មាន & បទបង្ហាញផ្លូវការ',
    tone: 'Bright, polished, confident professional cadence',
    pitch: 1.10,
    rate: 1.08,
    description: 'Polished female broadcast host for executive overviews, educational modules, and dynamic updates.',
    khmerDescription: 'សំឡេងស្ត្រីអ្នកអានព័ត៌មាន ច្បាស់លាស់ ស្វាហាប់ និងប្រកបដោយវិជ្ជាជីវៈកម្រិតខ្ពស់។',
    sampleText: 'សូមស្វាគមន៍មកកាន់ការផ្សាយផ្ទាល់ព័ត៌មានវិទ្យាសាស្ត្រ និងការច្នៃប្រឌិតថ្មីៗនៃពិភពបច្ចេកវិទ្យាសកល។',
    avatar: '📻',
    badge: 'អ្នកអានព័ត៌មាន',
  },
  {
    id: 'km-female-kalyan',
    name: 'Kalyan (កល្យាណ)',
    khmerName: 'កល្យាណ',
    gender: 'female',
    role: 'Warm Poetic Narrator & Storyteller',
    khmerRole: 'អ្នកនិទានរឿង & អក្សរសិល្ប៍វប្បធម៌',
    tone: 'Soothing, lyrical, emotionally expressive delivery',
    pitch: 1.06,
    rate: 0.94,
    description: 'Warm storytelling female voice with soothing lyrical cadence for cultural tales and literature.',
    khmerDescription: 'សំឡេងស្ត្រីស្រទន់ ពិរោះរណ្តំ សមរម្យសម្រាប់សៀវភៅជាសំឡេង កំណាព្យ និងរឿងនិទាន។',
    sampleText: 'រាត្រីសមោសរដ៏ស្ងប់ស្ងាត់ នាំមកនូវគំនិតច្នៃប្រឌិត និងការស្រមើស្រមៃដ៏ស្រស់បំព្រងគ្មានដែនកំណត់។',
    avatar: '🌸',
    badge: 'អ្នកនិទានរឿង',
  },
];

export function getKhmerVoiceModels(gender?: 'all' | 'male' | 'female'): KhmerVoiceModel[] {
  if (!gender || gender === 'all') return KHMER_VOICE_MODELS;
  return KHMER_VOICE_MODELS.filter((m) => m.gender === gender);
}

export function getKhmerVoiceModelById(id: string): KhmerVoiceModel | undefined {
  return KHMER_VOICE_MODELS.find((m) => m.id === id);
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'km-sokha-male',
    name: 'Khmer Male (សុខា - Sokha)',
    lang: 'km',
    gender: 'male',
    tone: 'Natural resonant male baritone',
    rate: 0.98,
    pitch: 0.84,
    description: 'Authentic Cambodian male voice with warm, deep natural pronunciation',
  },
  {
    id: 'km-bopha-female',
    name: 'Khmer Female (បុប្ផា - Bopha)',
    lang: 'km',
    gender: 'female',
    tone: 'Clear, gentle, melodic female soprano',
    rate: 1.02,
    pitch: 1.14,
    description: 'Authentic Cambodian female voice with sweet, crystal-clear delivery',
  },
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

  const kmModel = options.voiceModelId ? getKhmerVoiceModelById(options.voiceModelId) : undefined;
  const defaultPitch = kmModel?.pitch ?? (options.gender === 'male' ? 0.84 : options.gender === 'female' ? 1.14 : 1.0);
  const defaultRate = kmModel?.rate ?? 1.0;

  utterance.rate = Math.max(0.5, Math.min(2.0, options.rate ?? defaultRate));
  utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch ?? defaultPitch));
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
  lang: string = 'en',
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  voiceModel = ''
): Promise<Blob> {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    throw new Error('No text provided for speech generation.');
  }

  const response = await fetch('/api/tts/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned, format, lang, gender, voiceModel }),
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
export async function downloadSpeechWav(
  text: string,
  title = 'ai-speech-audio',
  lang = 'en',
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  voiceModel = ''
): Promise<void> {
  const blob = await fetchSpeechAudioBlob(text, 'wav', lang, gender, voiceModel);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'ai-speech';
  triggerBlobDownload(blob, `${safeTitle}.wav`);
}

/**
 * Downloads authentic high-quality speech audio file (.mp3) of the given text
 */
export async function downloadSpeechMp3(
  text: string,
  title = 'ai-speech-audio',
  lang = 'en',
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  voiceModel = ''
): Promise<void> {
  const blob = await fetchSpeechAudioBlob(text, 'mp3', lang, gender, voiceModel);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'ai-speech';
  triggerBlobDownload(blob, `${safeTitle}.mp3`);
}

/**
 * Plays the real high-fidelity speech audio directly using HTML5 Audio
 */
export async function playSpeechAudio(
  text: string,
  lang = 'en',
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  voiceModel = ''
): Promise<HTMLAudioElement> {
  const blob = await fetchSpeechAudioBlob(text, 'mp3', lang, gender, voiceModel);
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
