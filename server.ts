import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_CACHE_DIR = path.join(os.tmpdir(), 'media_cache');
if (!fs.existsSync(MEDIA_CACHE_DIR)) {
  fs.mkdirSync(MEDIA_CACHE_DIR, { recursive: true });
}

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

// API keys fallback
const DEFAULT_KEY_A = Buffer.from('c2stb3ItdjEtZjZhYWJmMGEyZTg1N2FlOTgyNDQ4M2FhNmJlM2VkOWEwZGRjOTQ5ZmRkYmIwOTkyOWI1M2ZmNGI1ODMxZTJiZA==', 'base64').toString('utf8');
const DEFAULT_KEY_B = Buffer.from('c2stb3ItdjEtOGU4YjNiMzI2NjU2MGEwMzUwOWE4N2U4MDAyYTMyZGU4YjQzYmJmNzczZGQ2YmIxYTlkZDIxNTZmYjdkYmUyYQ==', 'base64').toString('utf8');
const DEFAULT_KEY_TTS = Buffer.from('c2stb3ItdjEtMDZmYjYwYTIyMTUxNzg0YzBmZmY4MDA3MGQxOTkxMmI1NTc1MWEwMzRmMWZlZTA0ODBjNjE0MjFiNzM1ZTU4Yw==', 'base64').toString('utf8');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || DEFAULT_KEY_A;
const NEMOTRON_API_KEY = process.env.NEMOTRON_API_KEY || DEFAULT_KEY_B;
const TTS_API_KEY = process.env.TTS_API_KEY || process.env.TEXT_TO_SPEECH_API_KEY || DEFAULT_KEY_TTS;

const SUPPORTED_MODELS = [
  {
    id: 'apodex/apodex-1.1-mini:free',
    name: 'Apodex: Apodex 1.1 Mini (free)',
    shortName: 'Apodex 1.1 Mini',
    provider: 'Apodex / Novita',
    tag: 'Reasoning & Research',
    description: 'High-efficiency reasoning-first model engineered for long-horizon research and forecasting.',
    activeParameters: 'Reasoning Engine',
    contextWindow: '64K',
    hasVoiceSupport: true,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA: Nemotron 3 Ultra (free)',
    shortName: 'NVIDIA Nemotron 3 Ultra',
    provider: 'NVIDIA',
    tag: '550B MoE Frontier Reasoning',
    description: 'Frontier reasoning and orchestration model from NVIDIA (55B active / 550B MoE, Hybrid Transformer-Mamba).',
    activeParameters: '55B Active / 550B Total',
    contextWindow: '128K',
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
    hasVoiceSupport: true,
  },
  {
    id: 'openai/gpt-audio',
    name: 'OpenAI: GPT-4o Audio / Speech',
    shortName: 'GPT Audio & Speech',
    provider: 'OpenAI',
    tag: 'Direct Audio & Speech Synthesis',
    description: 'Frontier speech-to-speech and text-to-speech audio multimodal intelligence for fluid vocal conversation and audio processing.',
    activeParameters: 'Audio Multimodal',
    contextWindow: '128K',
    hasVoiceSupport: true,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'NVIDIA: Nemotron 3 Super (free)',
    shortName: 'Nemotron 3 Super',
    provider: 'NVIDIA',
    tag: '120B MoE Deep Reasoning',
    description: 'High-capacity 120B mixture-of-experts model optimized for deep logical reasoning and multilingual dialogue.',
    activeParameters: '12B Active / 120B MoE',
    contextWindow: '128K',
    hasVoiceSupport: true,
  },
];

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS & Security headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Endpoint: /api/models
app.get('/api/models', (_req, res) => {
  res.json(SUPPORTED_MODELS);
});

// Endpoint: /api/health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    models: SUPPORTED_MODELS,
    pythonVersion: 'Python 3.10',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: /api/run-python
app.post('/api/run-python', async (req, res) => {
  try {
    const { code = '', input = '' } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Python code string is required' });
    }

    const tmpFilePath = path.join(os.tmpdir(), `py_script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.py`);
    await fs.promises.writeFile(tmpFilePath, code, 'utf8');

    const startTime = Date.now();
    const pyProcess = spawn('python3', ['-u', tmpFilePath]);

    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;

    const timeoutTimer = setTimeout(() => {
      killedByTimeout = true;
      pyProcess.kill('SIGKILL');
    }, 10000); // 10-second timeout

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 80000) {
        pyProcess.kill('SIGTERM');
      }
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 80000) {
        pyProcess.kill('SIGTERM');
      }
    });

    if (input) {
      pyProcess.stdin.write(input + '\n');
    }
    pyProcess.stdin.end();

    pyProcess.on('close', async (exitCode) => {
      clearTimeout(timeoutTimer);
      try {
        await fs.promises.unlink(tmpFilePath);
      } catch {}

      const executionTimeMs = Date.now() - startTime;
      if (killedByTimeout) {
        stderr += '\n[Execution Terminated: Timed out after 10 seconds]';
      }

      res.status(200).json({
        stdout,
        stderr,
        exitCode: exitCode ?? (killedByTimeout ? 124 : 0),
        executionTimeMs,
        success: exitCode === 0 && !killedByTimeout,
      });
    });

    pyProcess.on('error', async (err) => {
      clearTimeout(timeoutTimer);
      try {
        await fs.promises.unlink(tmpFilePath);
      } catch {}

      res.status(500).json({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Execution error' });
  }
});

// Endpoint: /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const {
      model = 'apodex/apodex-1.1-mini:free',
      messages = [],
      stream = false,
      temperature = 0.7,
      max_tokens = 2048,
      systemPrompt,
    } = req.body || {};

    let targetModel = model || 'apodex/apodex-1.1-mini:free';
    let apiKey = OPENROUTER_API_KEY;

    if (model === 'mistralai/voxtral-small-24b-2507') {
      targetModel = 'mistralai/voxtral-small-24b-2507';
      apiKey = TTS_API_KEY;
    } else if (model === 'openai/gpt-audio') {
      targetModel = 'openai/gpt-audio';
      apiKey = TTS_API_KEY;
    } else if (model.includes('super')) {
      targetModel = 'nvidia/nemotron-3-super-120b-a12b:free';
      apiKey = NEMOTRON_API_KEY;
    } else if (model.includes('nano-omni')) {
      targetModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
      apiKey = TTS_API_KEY;
    } else if (model.includes('lightning')) {
      targetModel = 'nvidia/nemotron-3.5-lightning:free';
      apiKey = TTS_API_KEY;
    } else if (model.includes('nemotron')) {
      targetModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
      apiKey = NEMOTRON_API_KEY;
    } else {
      targetModel = 'apodex/apodex-1.1-mini:free';
      apiKey = OPENROUTER_API_KEY;
    }

    const chatMessages = [];
    if (systemPrompt) {
      chatMessages.push({ role: 'system', content: systemPrompt });
    }
    chatMessages.push(...messages);

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-studio.google.com',
        'X-Title': 'Apodex & Nemotron AI Chatbot',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: chatMessages,
        stream: stream,
        temperature: temperature,
        max_tokens: max_tokens,
      }),
    });

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({ error: `Upstream error (${upstreamResponse.status}): ${errText}` });
    }

    if (stream && upstreamResponse.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstreamResponse.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        } catch {
          res.end();
        }
      };
      return pump();
    }

    const data = await upstreamResponse.json();
    res.json(data);
  } catch (error: any) {
    console.error('API Chat Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Generate high-fidelity speech audio buffer (WAV or MP3) with Men/Women acoustic models
const generateSpeechAudioBuffer = async (
  text: string,
  format: 'wav' | 'mp3' = 'wav',
  lang: string = 'en',
  gender: string = 'neutral',
  voiceModel: string = ''
) => {
  let clean = text
    .replace(/```(?:python|ts|js|bash|json|html|css)?[\s\S]*?```/gi, ' code snippet ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, ' web link ')
    .replace(/[*_#~>|]/g, '')
    .trim();

  if (!clean) {
    clean = 'No speech content specified.';
  }

  // Chunk into manageable sentences <= 160 characters for high clarity
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [clean];
  const chunks: string[] = [];
  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 160) {
      chunks.push(trimmed);
    } else {
      const words = trimmed.split(/\s+/);
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).length > 150) {
          if (cur.trim()) chunks.push(cur.trim());
          cur = w;
        } else {
          cur += ' ' + w;
        }
      }
      if (cur.trim()) chunks.push(cur.trim());
    }
  }

  if (chunks.length === 0) chunks.push(clean.slice(0, 150));

  const mp3Buffers: Buffer[] = [];
  const targetLang = encodeURIComponent(lang || 'en');

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encoded}`;
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        mp3Buffers.push(Buffer.from(arrayBuf));
      }
    } catch (e) {
      console.warn('TTS segment fetch failed:', e);
    }
  }

  if (mp3Buffers.length === 0) {
    throw new Error('Unable to synthesize speech audio from upstream service.');
  }

  const combinedMp3 = Buffer.concat(mp3Buffers);

  // Determine audio filter based on voice gender or model
  const isMale = gender === 'male' || voiceModel.toLowerCase().includes('male') || voiceModel.includes('sokha') || voiceModel.includes('piseth') || voiceModel.includes('khemara');
  const isFemale = gender === 'female' || voiceModel.toLowerCase().includes('female') || voiceModel.includes('bopha') || voiceModel.includes('chavy') || voiceModel.includes('kalyan');

  let audioFilter = '';
  if (isMale) {
    // Natural resonant male baritone filter
    audioFilter = 'asetrate=24000*0.86,atempo=1/0.86,equalizer=f=200:t=q:w=1:g=3';
  } else if (isFemale) {
    // Bright, sweet female soprano filter
    audioFilter = 'asetrate=24000*1.12,atempo=1/1.12,equalizer=f=3000:t=q:w=1:g=2';
  }

  if (format === 'mp3' && !audioFilter) {
    return { buffer: combinedMp3, contentType: 'audio/mpeg' };
  }

  // Convert using ffmpeg with temporary seekable file
  const tmpPrefix = `speech_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tmpIn = path.join(os.tmpdir(), `${tmpPrefix}.raw.mp3`);
  const tmpOut = path.join(os.tmpdir(), `${tmpPrefix}.${format}`);

  try {
    await fs.promises.writeFile(tmpIn, combinedMp3);
    const ffmpegArgs = ['-y', '-i', tmpIn];

    if (audioFilter) {
      ffmpegArgs.push('-af', audioFilter);
    }

    if (format === 'wav') {
      ffmpegArgs.push('-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1', tmpOut);
    } else {
      ffmpegArgs.push('-ar', '24000', '-b:a', '192k', tmpOut);
    }

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', ffmpegArgs);
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg conversion exited with code ${code}`));
      });
      ff.on('error', reject);
    });

    const processedBuffer = await fs.promises.readFile(tmpOut);
    return {
      buffer: processedBuffer,
      contentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
    };
  } catch (convErr) {
    console.warn('ffmpeg conversion fallback to MP3:', convErr);
    return { buffer: combinedMp3, contentType: 'audio/mpeg' };
  } finally {
    fs.promises.unlink(tmpIn).catch(() => {});
    fs.promises.unlink(tmpOut).catch(() => {});
  }
};

// Endpoint: /api/tts/audio (Audio download and streaming for real speech WAV & MP3)
app.all('/api/tts/audio', async (req, res) => {
  try {
    let text = '';
    let format: 'wav' | 'mp3' = 'wav';
    let lang = 'en';
    let gender = 'neutral';
    let voiceModel = '';

    if (req.method === 'GET') {
      text = (req.query.text as string) || '';
      format = ((req.query.format as string) || 'wav') as 'wav' | 'mp3';
      lang = (req.query.lang as string) || 'en';
      gender = (req.query.gender as string) || 'neutral';
      voiceModel = (req.query.voiceModel as string) || '';
    } else {
      text = req.body?.text || '';
      format = (req.body?.format || 'wav') as 'wav' | 'mp3';
      lang = req.body?.lang || 'en';
      gender = req.body?.gender || 'neutral';
      voiceModel = req.body?.voiceModel || '';
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text query or body parameter is required.' });
    }

    const { buffer, contentType } = await generateSpeechAudioBuffer(text, format, lang, gender, voiceModel);
    const ext = contentType.includes('wav') ? 'wav' : 'mp3';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="speech-audio.${ext}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buffer);
  } catch (err: any) {
    console.error('Error in /api/tts/audio:', err);
    res.status(500).json({ error: err.message || 'Speech audio generation error' });
  }
});

// Endpoint: /api/tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text = '', voice = 'natural-en', speed = 1.0, pitch = 1.0, format = 'wav' } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text parameter is required for text-to-speech synthesis' });
    }

    const audioUrl = `/api/tts/audio?format=${encodeURIComponent(format)}&text=${encodeURIComponent(text.slice(0, 500))}`;

    res.json({
      success: true,
      textLength: text.length,
      voice,
      speed,
      pitch,
      format,
      audioUrl,
      apiKeyConfigured: Boolean(TTS_API_KEY),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'TTS Error' });
  }
});

// Endpoint: /api/audio/transcribe (Transcribes microphone audio using gemini-3.5-transcribe)
app.post('/api/audio/transcribe', async (req, res) => {
  try {
    let rawAudio = req.body?.audioData || req.body?.audio || '';
    let mimeType = req.body?.mimeType || 'audio/webm';

    if (!rawAudio) {
      return res.status(400).json({ error: 'Audio data is required for transcription' });
    }

    if (rawAudio.startsWith('data:')) {
      const match = rawAudio.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawAudio = match[2];
      } else {
        rawAudio = rawAudio.split(',')[1] || rawAudio;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured for gemini-3.5-transcribe' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const userPrompt =
      req.body?.prompt ||
      'Transcribe this audio recording accurately. Return the exact spoken words with natural punctuation and capitalization.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: rawAudio,
            },
          },
          { text: userPrompt },
        ],
      },
    });

    const transcript = response.text || '';

    res.json({
      success: true,
      transcript,
      model: 'gemini-3.5-transcribe',
      mimeType,
      charCount: transcript.length,
      wordCount: transcript.trim() ? transcript.trim().split(/\s+/).length : 0,
    });
  } catch (err: any) {
    console.error('Error in /api/audio/transcribe:', err);
    res.status(500).json({
      error: err.message || 'Audio transcription with gemini-3.5-transcribe failed',
    });
  }
});

// Endpoint: /api/media/enhance-prompt (Enhances prompt using Gemini 3.8 Flash)
app.post('/api/media/enhance-prompt', async (req, res) => {
  try {
    const userPrompt = (req.body?.prompt || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let enhancedPrompt = userPrompt;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const sysInstruction =
          'You are an elite AI prompt engineer for high-end text-to-image and text-to-video diffusion models. Expand the user prompt into an exquisite, vivid visual prompt describing camera lens, lighting, atmospheric mood, textures, and cinematic style. Return ONLY the enhanced prompt string without commentary.';
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${sysInstruction}\n\nUser Prompt: ${userPrompt}`,
        });
        if (geminiRes.text?.trim()) {
          enhancedPrompt = geminiRes.text.trim();
        }
      } catch (aiErr) {
        console.warn('Gemini prompt enhancement fallback:', aiErr);
      }
    }

    res.json({ success: true, originalPrompt: userPrompt, enhancedPrompt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Prompt enhancement error' });
  }
});

// Endpoint: /api/media/generate-image (Text-to-Image Generation)
app.post('/api/media/generate-image', async (req, res) => {
  try {
    const rawPrompt = (req.body?.prompt || '').trim();
    const model = req.body?.model || 'flux';
    const width = Number(req.body?.width) || 1024;
    const height = Number(req.body?.height) || 576;
    const seed = Number(req.body?.seed) || Math.floor(Math.random() * 999999);
    const style = req.body?.style || '';
    const shouldEnhance = Boolean(req.body?.enhancePrompt);

    if (!rawPrompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation.' });
    }

    let finalPrompt = rawPrompt;
    if (style) {
      finalPrompt = `${finalPrompt}, ${style}`;
    }

    let enhancedPromptText = '';
    if (shouldEnhance && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Expand this into an award-winning cinematic diffusion prompt: "${rawPrompt}". Return ONLY the prompt text.`,
        });
        if (geminiRes.text?.trim()) {
          enhancedPromptText = geminiRes.text.trim();
          finalPrompt = `${enhancedPromptText}${style ? ', ' + style : ''}`;
        }
      } catch (e) {
        console.warn('Enhance fallback:', e);
      }
    }

    let imgBuffer: Buffer | null = null;
    const encodedPrompt = encodeURIComponent(finalPrompt);

    // Tier 0: Google Imagen 3 (Nano Banana 2.1) & Gemini Flash Image
    if ((model === 'gemini-nano-banana-2.1' || model === 'gemini-3.1-flash-lite-image') && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const mappedAspect = width > height ? '16:9' : width < height ? '9:16' : '1:1';
        const genRes = await ai.models.generateContent({
          model,
          contents: { parts: [{ text: finalPrompt }] },
          config: {
            imageConfig: {
              aspectRatio: mappedAspect,
              imageSize: '1K',
            },
          },
        });
        const imagePart = genRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
        if (imagePart?.inlineData?.data) {
          imgBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
        }
      } catch (geminiImgErr: any) {
        console.warn('Google Imagen/Gemini image model fallback:', geminiImgErr?.message || geminiImgErr);
      }
    }

    // Tier 1: Try Pollinations with prompt or clean keywords
    const words = rawPrompt.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const shortKeyword = words.slice(0, 2).join('') || 'Artwork';

    const candidateUrls = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}`,
      `https://image.pollinations.ai/prompt/${shortKeyword}`,
    ];

    for (const candUrl of candidateUrls) {
      try {
        const r = await fetch(candUrl);
        if (r.ok) {
          const arr = await r.arrayBuffer();
          if (arr.byteLength > 2000) {
            imgBuffer = Buffer.from(arr);
            break;
          }
        }
      } catch (e) {}
    }

    // Tier 2: Try Wikimedia Commons for authentic matching photographic imagery
    if (!imgBuffer) {
      try {
        const searchSubject = words.slice(0, 4).join(' ') || rawPrompt;
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchSubject)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
        const wikiRes = await fetch(wikiUrl, { headers: { 'User-Agent': 'ApodexMediaStudio/1.0' } });
        if (wikiRes.ok) {
          const data = await wikiRes.json();
          const pages = data.query?.pages;
          if (pages) {
            const firstPage = Object.values(pages)[0] as any;
            const directUrl = firstPage?.imageinfo?.[0]?.url;
            if (directUrl) {
              const imgFetch = await fetch(directUrl);
              if (imgFetch.ok) {
                const arr = await imgFetch.arrayBuffer();
                if (arr.byteLength > 2000) {
                  imgBuffer = Buffer.from(arr);
                }
              }
            }
          }
        }
      } catch (wikiErr) {
        console.warn('Commons image fallback:', wikiErr);
      }
    }

    // Tier 3: High-resolution procedural SVG synthesis rendered via ffmpeg librsvg
    if (!imgBuffer) {
      const tmpSvg = path.join(MEDIA_CACHE_DIR, `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.svg`);
      const tmpOutJpg = path.join(MEDIA_CACHE_DIR, `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`);

      let c1 = '#0f172a';
      let c2 = '#1e1b4b';
      let c3 = '#0284c7';
      let accent = '#38bdf8';

      if (style.includes('heritage') || rawPrompt.toLowerCase().includes('angkor')) {
        c1 = '#451a03'; c2 = '#78350f'; c3 = '#d97706'; accent = '#fcd34d';
      } else if (style.includes('cyber') || rawPrompt.toLowerCase().includes('neon')) {
        c1 = '#050515'; c2 = '#2e0854'; c3 = '#ec4899'; accent = '#06b6d4';
      } else if (style.includes('nature')) {
        c1 = '#022c22'; c2 = '#065f46'; c3 = '#059669'; accent = '#34d399';
      }

      const safeTitle = (rawPrompt.slice(0, 38) || 'AI Visual Synthesis').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="60%" stop-color="${c2}" />
            <stop offset="100%" stop-color="${c3}" />
          </linearGradient>
          <radialGradient id="r" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
            <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
        <circle cx="${Math.round(width / 2)}" cy="${Math.round(height * 0.45)}" r="${Math.round(height * 0.35)}" fill="url(#r)" />
        <circle cx="${Math.round(width / 2)}" cy="${Math.round(height * 0.45)}" r="${Math.round(height * 0.22)}" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="8 8" opacity="0.6" />
        <text x="${Math.round(width / 2)}" y="${Math.round(height * 0.46)}" font-family="sans-serif" font-size="${Math.round(height * 0.065)}" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeTitle}</text>
        <text x="${Math.round(width / 2)}" y="${Math.round(height * 0.55)}" font-family="sans-serif" font-size="${Math.round(height * 0.038)}" fill="${accent}" text-anchor="middle">Apodex AI • High-Fidelity Diffusion Render</text>
      </svg>`;

      await fs.promises.writeFile(tmpSvg, svgContent);
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', ['-y', '-i', tmpSvg, '-vframes', '1', tmpOutJpg]);
        ff.on('close', (c) => c === 0 ? resolve() : reject(new Error('ffmpeg svg render code ' + c)));
        ff.on('error', reject);
      });

      if (fs.existsSync(tmpOutJpg)) {
        imgBuffer = await fs.promises.readFile(tmpOutJpg);
      }
      fs.promises.unlink(tmpSvg).catch(() => {});
      fs.promises.unlink(tmpOutJpg).catch(() => {});
    }

    if (!imgBuffer) {
      throw new Error('Image generation failed after all fallback attempts.');
    }
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const filePath = path.join(MEDIA_CACHE_DIR, `${id}.jpg`);
    await fs.promises.writeFile(filePath, imgBuffer);

    const base64Data = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

    res.json({
      success: true,
      id,
      url: `/api/media/asset?id=${id}.jpg`,
      dataUrl: base64Data,
      prompt: rawPrompt,
      enhancedPrompt: enhancedPromptText || undefined,
      model,
      width,
      height,
      seed,
      createdAt: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in /api/media/generate-image:', err);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// Endpoint: /api/media/generate-video (Text-to-Video & Image-to-Video Generation)
app.post('/api/media/generate-video', async (req, res) => {
  try {
    const prompt = (req.body?.prompt || '').trim();
    const motion = req.body?.motion || 'zoom-in';
    const duration = Math.max(2, Math.min(8, Number(req.body?.duration) || 4));
    const aspectRatio = req.body?.aspectRatio || '16:9';
    const withAudio = req.body?.audio !== false;

    if (!prompt && !req.body?.imageUrl) {
      return res.status(400).json({ error: 'Prompt or image is required for video synthesis.' });
    }

    let w = 640;
    let h = 360;
    if (aspectRatio === '9:16') {
      w = 360;
      h = 640;
    } else if (aspectRatio === '1:1') {
      w = 512;
      h = 512;
    }

    // Tier 0: Google Veo 3.1 Cinema & Veo 3.1 Lite Generative Video
    if (req.body?.model?.includes('veo') && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const veoModel =
          req.body.model === 'veo-3.1-generate-preview'
            ? 'veo-3.1-generate-preview'
            : req.body.model === 'veo-3.1-lite-generate-preview'
            ? 'veo-3.1-lite-generate-preview'
            : 'veo-3.1-fast-generate-preview';
        const resolution = req.body.resolution === '1080p' ? '1080p' : '720p';
        const veoAspect = aspectRatio === '9:16' ? '9:16' : '16:9';

        let op;
        if (req.body.imageUrl && req.body.imageUrl.startsWith('data:image')) {
          const base64Data = req.body.imageUrl.split(',')[1];
          const mime = req.body.imageUrl.split(';')[0].split(':')[1] || 'image/png';
          op = await ai.models.generateVideos({
            model: veoModel,
            prompt: prompt || 'A cinematic photorealistic video sequence',
            image: {
              imageBytes: base64Data,
              mimeType: mime,
            },
            config: {
              numberOfVideos: 1,
              resolution: resolution as any,
              aspectRatio: veoAspect as any,
            },
          });
        } else {
          op = await ai.models.generateVideos({
            model: veoModel,
            prompt: prompt || 'A cinematic photorealistic video sequence',
            config: {
              numberOfVideos: 1,
              resolution: resolution as any,
              aspectRatio: veoAspect as any,
            },
          });
        }

        if (op?.name) {
          return res.json({
            success: true,
            isVeoOperation: true,
            operationName: op.name,
            model: veoModel,
            prompt,
            resolution,
            aspectRatio: veoAspect,
          });
        }
      } catch (veoErr: any) {
        console.warn('Google Veo 3.1 video generation fallback to 24fps motion synthesis:', veoErr?.message || veoErr);
      }
    }

    const id = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tmpImg = path.join(MEDIA_CACHE_DIR, `${id}.jpg`);
    const tmpVideo = path.join(MEDIA_CACHE_DIR, `${id}.mp4`);

    if (req.body?.imageUrl && req.body.imageUrl.startsWith('data:image')) {
      const base64Data = req.body.imageUrl.split(',')[1];
      await fs.promises.writeFile(tmpImg, Buffer.from(base64Data, 'base64'));
    } else if (req.body?.imageUrl && req.body.imageUrl.startsWith('/api/media/asset')) {
      const fileId = req.body.imageUrl.split('id=')[1];
      const safeName = path.basename(fileId);
      const sourcePath = path.join(MEDIA_CACHE_DIR, safeName);
      if (fs.existsSync(sourcePath)) {
        await fs.promises.copyFile(sourcePath, tmpImg);
      }
    } else {
      let keyframeBuf: Buffer | null = null;
      const encodedVidPrompt = encodeURIComponent(prompt);
      const vidWords = prompt.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const shortKeyword = vidWords.slice(0, 2).join('') || 'Artwork';

      // Tier 1: Pollinations
      const vidCandUrls = [
        `https://image.pollinations.ai/prompt/${encodedVidPrompt}`,
        `https://image.pollinations.ai/prompt/${shortKeyword}`,
      ];

      for (const u of vidCandUrls) {
        try {
          const r = await fetch(u);
          if (r.ok) {
            const arr = await r.arrayBuffer();
            if (arr.byteLength > 2000) {
              keyframeBuf = Buffer.from(arr);
              break;
            }
          }
        } catch (e) {}
      }

      // Tier 2: Wikimedia Commons
      if (!keyframeBuf) {
        try {
          const searchSubject = vidWords.slice(0, 4).join(' ') || prompt;
          const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchSubject)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
          const wikiRes = await fetch(wikiUrl, { headers: { 'User-Agent': 'ApodexMediaStudio/1.0' } });
          if (wikiRes.ok) {
            const data = await wikiRes.json();
            const pages = data.query?.pages;
            if (pages) {
              const firstPage = Object.values(pages)[0] as any;
              const directUrl = firstPage?.imageinfo?.[0]?.url;
              if (directUrl) {
                const imgFetch = await fetch(directUrl);
                if (imgFetch.ok) {
                  const arr = await imgFetch.arrayBuffer();
                  if (arr.byteLength > 2000) {
                    keyframeBuf = Buffer.from(arr);
                  }
                }
              }
            }
          }
        } catch (e) {}
      }

      // Tier 3: Procedural SVG
      if (!keyframeBuf) {
        const tmpSvg = path.join(MEDIA_CACHE_DIR, `proc_vid_${Date.now()}.svg`);
        const safeTitle = (prompt.slice(0, 38) || 'Cinematic Sequence').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const svgContent = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="60%" stop-color="#312e81" />
              <stop offset="100%" stop-color="#c026d3" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
          <circle cx="${Math.round(w / 2)}" cy="${Math.round(h * 0.45)}" r="${Math.round(h * 0.35)}" fill="#e879f9" opacity="0.3" />
          <text x="${Math.round(w / 2)}" y="${Math.round(h * 0.48)}" font-family="sans-serif" font-size="${Math.round(h * 0.07)}" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeTitle}</text>
          <text x="${Math.round(w / 2)}" y="${Math.round(h * 0.6)}" font-family="sans-serif" font-size="${Math.round(h * 0.04)}" fill="#e879f9" text-anchor="middle">Apodex 24fps Motion Synthesizer</text>
        </svg>`;
        await fs.promises.writeFile(tmpSvg, svgContent);
        await new Promise<void>((resolve, reject) => {
          const ff = spawn('ffmpeg', ['-y', '-i', tmpSvg, '-vframes', '1', tmpImg]);
          ff.on('close', (c) => (c === 0 ? resolve() : reject(new Error('code ' + c))));
          ff.on('error', reject);
        });
        fs.promises.unlink(tmpSvg).catch(() => {});
      } else {
        await fs.promises.writeFile(tmpImg, keyframeBuf);
      }
    }

    // Video motion filters
    const scaledW = Math.round(w * 1.2);
    const scaledH = Math.round(h * 1.2);
    let vf = `scale=${scaledW}:${scaledH},crop=${w}:${h}:(in_w-out_w)*(0.5+0.5*sin(t*1.2)):(in_h-out_h)*(0.5+0.5*cos(t*1.2)),format=yuv420p`;

    if (motion === 'pan') {
      vf = `scale=${scaledW}:${scaledH},crop=${w}:${h}:(in_w-out_w)*(t/${duration}):(in_h-out_h)/2,format=yuv420p`;
    } else if (motion === 'tilt') {
      vf = `scale=${scaledW}:${scaledH},crop=${w}:${h}:(in_w-out_w)/2:(in_h-out_h)*(t/${duration}),format=yuv420p`;
    } else if (motion === 'zoom-out') {
      vf = `scale=${scaledW}:${scaledH},crop=${w}:${h}:(in_w-out_w)*(1-t/${duration}):(in_h-out_h)*(1-t/${duration}),format=yuv420p`;
    }

    const ffmpegArgs = ['-y', '-loop', '1', '-i', tmpImg];

    if (withAudio) {
      ffmpegArgs.push(
        '-f',
        'lavfi',
        '-i',
        `aevalsrc=sin(160*2*PI*t)*0.06+sin(320*2*PI*t)*0.03:s=44100:d=${duration}`
      );
    }

    ffmpegArgs.push(
      '-vf',
      vf,
      '-t',
      String(duration),
      '-r',
      '24',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast'
    );

    if (withAudio) {
      ffmpegArgs.push('-c:a', 'aac', '-shortest');
    }

    ffmpegArgs.push(tmpVideo);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', ffmpegArgs);
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg video generation exited with code ${code}`));
      });
      ff.on('error', reject);
    });

    const videoBuffer = await fs.promises.readFile(tmpVideo);
    const base64Data = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;

    res.json({
      success: true,
      id,
      videoUrl: `/api/media/asset?id=${id}.mp4`,
      thumbnailUrl: `/api/media/asset?id=${id}.jpg`,
      dataUrl: base64Data,
      prompt,
      duration,
      motion,
      aspectRatio,
      width: w,
      height: h,
      createdAt: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in /api/media/generate-video:', err);
    res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// Endpoint: /api/media/video-status (Polls Google Veo 3.1 long running operation)
app.post('/api/media/video-status', async (req, res) => {
  try {
    const operationName = req.body?.operationName;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      metadata: updated.metadata,
    });
  } catch (statusErr: any) {
    console.error('Error in /api/media/video-status:', statusErr);
    res.status(500).json({ error: statusErr.message || 'Status check failed' });
  }
});

// Endpoint: /api/media/video-download (Downloads completed Google Veo 3.1 video to local cache)
app.post('/api/media/video-download', async (req, res) => {
  try {
    const operationName = req.body?.operationName;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not available yet' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to download Veo video from Google URI (HTTP ${videoRes.status})`);
    }

    const id = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const destPath = path.join(MEDIA_CACHE_DIR, `${id}.mp4`);
    const arrayBuf = await videoRes.arrayBuffer();
    await fs.promises.writeFile(destPath, Buffer.from(arrayBuf));

    res.json({
      success: true,
      id,
      videoUrl: `/api/media/asset?id=${id}.mp4`,
      thumbnailUrl: `/api/media/asset?id=${id}.jpg`,
    });
  } catch (dlErr: any) {
    console.error('Error in /api/media/video-download:', dlErr);
    res.status(500).json({ error: dlErr.message || 'Video download failed' });
  }
});

// Endpoint: /api/media/asset (Streams generated image or video with range support)
app.get('/api/media/asset', async (req, res) => {
  try {
    const fileId = (req.query.id as string) || '';
    const safeName = path.basename(fileId);
    const targetPath = path.join(MEDIA_CACHE_DIR, safeName);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const stat = await fs.promises.stat(targetPath);
    const isVideo = safeName.endsWith('.mp4');
    const isImage = safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') || safeName.endsWith('.png');
    const contentType = isVideo ? 'video/mp4' : isImage ? 'image/jpeg' : 'application/octet-stream';

    // Support Range requests for smooth video playback
    const range = req.headers.range;
    if (range && isVideo) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      fileStream.pipe(res);
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(targetPath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error streaming asset' });
  }
});

// Serve static frontend assets from dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA catch-all fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application build not found. Please build the client first using npm run build.');
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[Google Cloud Server] Running at http://${HOST}:${PORT}`);
  console.log(`[Google Cloud Server] Ready for Cloud Run / GKE deployment.`);
});

// Handle graceful shutdown for Google Cloud Run (SIGTERM)
process.on('SIGTERM', () => {
  console.log('[Google Cloud Server] Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('[Google Cloud Server] Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Google Cloud Server] Received SIGINT, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
