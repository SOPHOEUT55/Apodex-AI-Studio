import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA: Nemotron 3.5 Lightning (free)',
    shortName: 'Nemotron 3.5 Lightning',
    provider: 'NVIDIA',
    tag: 'Ultra-Fast Real-Time Inference',
    description: 'Sub-second latency frontier conversational model optimized for low-latency voice, TTS dialogue, and interactive streaming.',
    activeParameters: '8B Distilled',
    contextWindow: '64K',
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

// Helper: Generate real speech audio buffer (WAV or MP3)
const generateSpeechAudioBuffer = async (text: string, format: 'wav' | 'mp3' = 'wav', lang: string = 'en') => {
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

  // Chunk text into sentences / segments <= 160 characters
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

  if (format === 'mp3') {
    return { buffer: combinedMp3, contentType: 'audio/mpeg' };
  }

  // Convert to WAV format using ffmpeg if available
  return new Promise<{ buffer: Buffer; contentType: string }>((resolve) => {
    try {
      const ff = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-f', 'wav',
        '-ar', '24000',
        '-ac', '1',
        'pipe:1',
      ]);
      const chunksOut: Buffer[] = [];
      ff.stdout.on('data', (c) => chunksOut.push(c));
      ff.stderr.on('data', () => {});
      ff.on('close', (code) => {
        if (code === 0 && chunksOut.length > 0) {
          resolve({ buffer: Buffer.concat(chunksOut), contentType: 'audio/wav' });
        } else {
          resolve({ buffer: combinedMp3, contentType: 'audio/mpeg' });
        }
      });
      ff.on('error', () => {
        resolve({ buffer: combinedMp3, contentType: 'audio/mpeg' });
      });
      ff.stdin.write(combinedMp3);
      ff.stdin.end();
    } catch {
      resolve({ buffer: combinedMp3, contentType: 'audio/mpeg' });
    }
  });
};

// Endpoint: /api/tts/audio (Audio download and streaming for real speech WAV & MP3)
app.all('/api/tts/audio', async (req, res) => {
  try {
    let text = '';
    let format: 'wav' | 'mp3' = 'wav';
    let lang = 'en';

    if (req.method === 'GET') {
      text = (req.query.text as string) || '';
      format = ((req.query.format as string) || 'wav') as 'wav' | 'mp3';
      lang = (req.query.lang as string) || 'en';
    } else {
      text = req.body?.text || '';
      format = (req.body?.format || 'wav') as 'wav' | 'mp3';
      lang = req.body?.lang || 'en';
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text query or body parameter is required.' });
    }

    const { buffer, contentType } = await generateSpeechAudioBuffer(text, format, lang);
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
