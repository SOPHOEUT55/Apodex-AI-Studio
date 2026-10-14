import { GeneratedMediaItem } from '../types';

export interface GenerateImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  style?: string;
  enhancePrompt?: boolean;
}

export interface GenerateVideoParams {
  prompt: string;
  imageUrl?: string;
  model?: string;
  resolution?: '720p' | '1080p' | '4k';
  motion?: 'zoom-in' | 'zoom-out' | 'pan' | 'tilt';
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  audio?: boolean;
  voiceNarration?: string;
  onProgress?: (status: string) => void;
}

export interface MediaStylePreset {
  id: string;
  name: string;
  khmerName: string;
  category: 'image' | 'video' | 'both';
  promptSuffix: string;
  icon: string;
  description: string;
}

export const MEDIA_STYLE_PRESETS: MediaStylePreset[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic 8K',
    khmerName: 'រូបថតពិត 8K',
    category: 'both',
    promptSuffix: 'photorealistic, ultra realistic 8k, professional photography, natural lighting, sharp focus, 35mm lens, high detail',
    icon: '📸',
    description: 'Crisp camera photography with lifelike lighting, textures, and depth of field',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Movie',
    khmerName: 'ភាពយន្តហូលីវូដ',
    category: 'both',
    promptSuffix: 'cinematic still, blockbuster movie frame, anamorphic lens, volumetric lighting, color graded, dramatic atmosphere',
    icon: '🎬',
    description: 'Epic Hollywood composition with dramatic lighting and widescreen color grading',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    khmerName: 'ស៊ីបឺភុង ណេអុង',
    category: 'both',
    promptSuffix: 'cyberpunk aesthetic, neon glow, futuristic megacity, rain reflections, chrome accents, high tech, synthwave colors',
    icon: '🌆',
    description: 'Futuristic high-tech metropolis with neon reflections and holographic glow',
  },
  {
    id: 'khmer_heritage',
    name: 'Khmer Angkor Heritage',
    khmerName: 'បេតិកភណ្ឌអង្គរខ្មែរ',
    category: 'both',
    promptSuffix: 'ancient Khmer architecture, Angkor Wat stone carvings, golden hour tropical sunset, mystical atmosphere, majestic Cambodian heritage, intricate bas-relief details',
    icon: '🏛️',
    description: 'Majestic ancient Cambodian temples, stone apsaras, and golden sunset ambiance',
  },
  {
    id: 'anime',
    name: 'Anime & Manga Art',
    khmerName: 'អានីមេ & ម៉ង់ហ្គា',
    category: 'image',
    promptSuffix: 'anime aesthetic, makoto shinkai style, vibrant colors, detailed sky, painterly background, studio key visual',
    icon: '🌸',
    description: 'Expressive Japanese animation key visual with rich skies and vibrant palettes',
  },
  {
    id: 'unreal_3d',
    name: '3D Render / CGI',
    khmerName: 'រូបភាព 3D Unreal',
    category: 'both',
    promptSuffix: 'octane render, Unreal Engine 5, ray tracing, 3D digital art, hyper detailed, subsurface scattering, ambient occlusion',
    icon: '🧊',
    description: 'Polished CGI 3D graphics rendered with ray tracing and octane materials',
  },
  {
    id: 'fantasy',
    name: 'Mythic Fantasy',
    khmerName: 'ទេវកថា & វេទមន្ត',
    category: 'both',
    promptSuffix: 'fantasy realm, ethereal glow, magical particles, epic landscape, concept art, lord of the rings aesthetic, otherworldly',
    icon: '🏰',
    description: 'Enchanted castles, glowing runes, mythical creatures, and epic landscapes',
  },
  {
    id: 'nature',
    name: 'Pristine Nature',
    khmerName: 'ធម្មជាតិស្រស់បំព្រង',
    category: 'both',
    promptSuffix: 'national geographic style, pristine wilderness, sweeping landscape, dramatic natural sunlight, crystal waters, untouched flora',
    icon: '🌿',
    description: 'Breathtaking wilderness, alpine lakes, lush rainforests, and wildlife',
  },
];

export const IMAGE_MODELS = [
  { id: 'gemini-nano-banana-2.1', name: 'Google Imagen 3 (Nano Banana 2.1)', tag: 'Ultra-Real 4K', description: 'Google DeepMind premier photorealistic diffusion model with 1K-4K resolution and hyper-realistic human & lighting physics', isGoogleGemini: true },
  { id: 'gemini-3.1-flash-lite-image', name: 'Google Gemini Flash Image', tag: 'Fast & Vivid', description: 'Next-gen multimodal visual generation with high prompt alignment and sharp textures', isGoogleGemini: true },
  { id: 'flux-realism', name: 'Flux.1 Realism Engine', tag: 'Photoreal 8K', description: 'Specialized 8K checkpoint tuned for authentic skin pores, 85mm portrait depth of field, and natural optics' },
  { id: 'flux', name: 'Flux.1 High-Fidelity', tag: 'Recommended', description: 'Exceptional visual detail, ray-traced lighting, and cinematic composition' },
  { id: 'sdxl-realism', name: 'Stable Diffusion XL Photo', tag: 'Studio Quality', description: 'Uncompressed cinematic photography with natural exposure and film grain' },
  { id: 'flux-anime', name: 'Flux Studio Anime', tag: 'Artistic', description: 'Studio animation key visual with rich watercolor skies' },
  { id: 'flux-3d', name: 'Flux 3D Octane CGI', tag: 'CGI Render', description: 'Unreal Engine 5 ray tracing, octane materials, and 3D digital art' },
];

export const VIDEO_MODELS = [
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Google Veo 3.1 Fast Cinema (16:9 / 9:16)',
    tag: 'Veo 3 Fast (Recommended)',
    description: 'DeepMind high-speed generative video model producing realistic temporal motion, cinematic physics, and sharp composition in 16:9 landscape or 9:16 portrait',
    provider: 'Google DeepMind',
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Google Veo 3.1 Cinema (1080p/4K)',
    tag: 'Premier Veo',
    description: 'Google DeepMind flagship generative video model with cinematic physics, camera direction, and lifelike temporal coherence',
    provider: 'Google DeepMind',
  },
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Google Veo 3.1 Lite (720p)',
    tag: 'Fast Veo',
    description: 'Fast cinematic video generation from text or image keyframes powered by DeepMind Veo',
    provider: 'Google DeepMind',
  },
  {
    id: 'motion-synthesizer',
    name: 'Cinematic Motion Synthesizer (24fps H.264)',
    tag: 'Sub-Second',
    description: 'Instant 24fps motion vector synthesis with spatial camera push/pan and stereo ambient audio',
    provider: 'Realtime Engine',
  },
];

export const VIDEO_MOTIONS = [
  { id: 'zoom-in', name: 'Slow Zoom-In (Push)', khmerName: 'ពង្រីកចូល (Zoom In)', description: 'Smooth cinematic forward push toward subject' },
  { id: 'zoom-out', name: 'Slow Zoom-Out (Pull)', khmerName: 'ពង្រីកចេញ (Zoom Out)', description: 'Revealing landscape pull to showcase scene' },
  { id: 'pan', name: 'Cinematic Pan', khmerName: 'បង្វិលកាមេរ៉ា (Pan)', description: 'Horizontal camera sweep across the environment' },
  { id: 'tilt', name: 'Dynamic Ambient Drift', khmerName: 'ចលនាអណ្តែត (Drift)', description: 'Subtle vertical and rotational camera drift' },
];

const LOCAL_STORAGE_MEDIA_KEY = 'apodex_ai_generated_media_v1';

export function getStoredMediaItems(): GeneratedMediaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load media history from localStorage:', e);
  }
  return [];
}

export function saveStoredMediaItem(item: GeneratedMediaItem): void {
  try {
    const items = getStoredMediaItems();
    const updated = [item, ...items.filter((i) => i.id !== item.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save media item to localStorage:', e);
  }
}

export function removeStoredMediaItem(id: string): void {
  try {
    const items = getStoredMediaItems().filter((i) => i.id !== id);
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to remove media item:', e);
  }
}

/**
 * Enhances a simple user prompt using Google Gemini into a detailed visual prompt
 */
export async function enhancePromptWithAI(prompt: string): Promise<string> {
  if (!prompt.trim()) return prompt;
  try {
    const response = await fetch('/api/media/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.enhancedPrompt) return data.enhancedPrompt;
    }
  } catch (e) {
    console.warn('AI prompt enhance fallback:', e);
  }
  return prompt;
}

/**
 * Generates an image from a text prompt
 */
export async function generateImageFromText(params: GenerateImageParams): Promise<GeneratedMediaItem> {
  const response = await fetch('/api/media/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Image generation failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  const mediaItem: GeneratedMediaItem = {
    id: data.id || `img_${Date.now()}`,
    type: 'image',
    prompt: params.prompt,
    enhancedPrompt: data.enhancedPrompt,
    url: data.url || data.dataUrl,
    thumbnailUrl: data.url || data.dataUrl,
    model: params.model || 'flux',
    style: params.style,
    aspectRatio: `${params.width || 1024}:${params.height || 576}`,
    createdAt: Date.now(),
    seed: data.seed,
  };

  saveStoredMediaItem(mediaItem);
  return mediaItem;
}

/**
 * Generates an MP4 video from a text prompt or base image
 */
export async function generateVideoFromText(params: GenerateVideoParams): Promise<GeneratedMediaItem> {
  params.onProgress?.(
    params.model?.includes('veo')
      ? 'Connecting to Google DeepMind Veo 3.1 video cluster...'
      : 'Synthesizing 24fps motion vectors & audio...'
  );

  const response = await fetch('/api/media/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Video generation failed with HTTP ${response.status}`);
  }

  const data = await response.json();

  // Handle Veo Long-Running Operation Polling if returned
  if (data.isVeoOperation && data.operationName) {
    params.onProgress?.('Google Veo 3.1 is synthesizing video frames (this may take a few moments)...');
    let videoUrl = data.videoUrl;
    let thumbnailUrl = data.thumbnailUrl;

    // Poll status up to 30 times (90 seconds)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      params.onProgress?.(`Google Veo 3.1 rendering in progress (${(i + 1) * 3}s)...`);

      try {
        const statusRes = await fetch('/api/media/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: data.operationName }),
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.done) {
            params.onProgress?.('Veo render finished! Downloading final MP4 stream...');
            const dlRes = await fetch('/api/media/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: data.operationName }),
            });
            if (dlRes.ok) {
              const dlData = await dlRes.json();
              if (dlData.videoUrl) {
                videoUrl = dlData.videoUrl;
                thumbnailUrl = dlData.thumbnailUrl || thumbnailUrl;
                break;
              }
            }
          }
        }
      } catch (pollErr) {
        console.warn('Veo poll error, checking next attempt:', pollErr);
      }
    }

    const mediaItem: GeneratedMediaItem = {
      id: data.id || `vid_${Date.now()}`,
      type: 'video',
      prompt: params.prompt,
      url: videoUrl || data.fallbackVideoUrl,
      thumbnailUrl: thumbnailUrl,
      model: params.model || 'veo-3.1-fast-generate-preview',
      aspectRatio: params.aspectRatio || '16:9',
      duration: params.duration || 4,
      motion: params.motion || 'cinematic-veo',
      createdAt: Date.now(),
    };
    saveStoredMediaItem(mediaItem);
    return mediaItem;
  }

  const mediaItem: GeneratedMediaItem = {
    id: data.id || `vid_${Date.now()}`,
    type: 'video',
    prompt: params.prompt,
    url: data.videoUrl || data.dataUrl,
    thumbnailUrl: data.thumbnailUrl,
    model: params.model || 'ffmpeg-motion-synthesizer',
    aspectRatio: params.aspectRatio || '16:9',
    duration: params.duration || 4,
    motion: params.motion || 'zoom-in',
    createdAt: Date.now(),
  };

  saveStoredMediaItem(mediaItem);
  return mediaItem;
}
