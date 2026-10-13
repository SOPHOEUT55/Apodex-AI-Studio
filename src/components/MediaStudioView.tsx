import React, { useState, useEffect, useRef } from 'react';
import { GeneratedMediaItem, User } from '../types';
import {
  MEDIA_STYLE_PRESETS,
  IMAGE_MODELS,
  VIDEO_MOTIONS,
  getStoredMediaItems,
  removeStoredMediaItem,
  enhancePromptWithAI,
  generateImageFromText,
  generateVideoFromText,
  MediaStylePreset,
} from '../services/mediaApi';
import { t } from '../utils/i18n';
import {
  Sparkles,
  Image as ImageIcon,
  Film,
  Wand2,
  Download,
  Trash2,
  Play,
  Pause,
  Maximize2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
  Compass,
  Clock,
  Sparkle,
} from 'lucide-react';

interface MediaStudioViewProps {
  currentUser?: User;
  language?: string;
  onNavigateToChat?: (initialPrompt?: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    id: 'angkor',
    labelEn: 'Angkor Wat Sunrise',
    labelKm: 'ថ្ងៃរះនៅប្រាសាទអង្គរវត្ត',
    prompt: 'Ancient Angkor Wat temple complex at golden hour sunrise with pink and amber sky reflections in the lotus moat, photorealistic 8k, majestic architecture, detailed stone carvings',
    style: 'khmer_heritage',
  },
  {
    id: 'phnompenh2050',
    labelEn: 'Phnom Penh 2050',
    labelKm: 'ភ្នំពេញឆ្នាំ 2050 (Sci-Fi)',
    prompt: 'Futuristic Phnom Penh smart metropolis in year 2050 with sleek illuminated glass skyscrapers, elevated maglev transit, neon sky gardens, Tonle Sap river reflections, cyberpunk aesthetic',
    style: 'cyberpunk',
  },
  {
    id: 'naga',
    labelEn: 'Mythic Golden Naga',
    labelKm: 'នាគរាជមាសទេវកថា',
    prompt: 'Majestic nine-headed golden Cambodian Naga dragon rising gracefully over misty emerald waters, glowing celestial scales, cinematic fantasy lighting, epic masterpiece',
    style: 'fantasy',
  },
  {
    id: 'apsara',
    labelEn: 'Celestial Apsara Dancer',
    labelKm: 'របាំអប្សរាទេវី',
    prompt: 'Graceful Khmer royal celestial Apsara dancer in authentic golden crown and traditional silk sampot, soft studio lighting, ultra sharp focus, cinematic portrait',
    style: 'photorealistic',
  },
  {
    id: 'nature_mekong',
    labelEn: 'Mekong River Sunset',
    labelKm: 'ថ្ងៃលិចទន្លេមេគង្គ',
    prompt: 'Tranquil sunset over the vast Mekong river, wooden traditional longtail boats gently swaying, warm tropical colors, dramatic clouds, national geographic quality',
    style: 'nature',
  },
  {
    id: 'cyber_lotus',
    labelEn: 'Bioluminescent Lotus 3D',
    labelKm: 'ផ្កាឈូកបំភ្លឺ 3D',
    prompt: 'Intricate crystal lotus blossom glowing with blue and violet bioluminescence, macro depth of field, octane 3D render, ambient occlusion, ray tracing',
    style: 'unreal_3d',
  },
];

export const MediaStudioView: React.FC<MediaStudioViewProps> = ({
  currentUser,
  language = 'en',
  onNavigateToChat,
}) => {
  const isKhmer = language === 'km' || language.startsWith('km');

  // Studio Mode: 'image' | 'video' | 'gallery'
  const [studioMode, setStudioMode] = useState<'image' | 'video' | 'gallery'>('image');

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageModel, setImageModel] = useState<string>('flux');
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16' | '4:3'>('16:9');
  const [isEnhancingImagePrompt, setIsEnhancingImagePrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [latestImage, setLatestImage] = useState<GeneratedMediaItem | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [videoMotion, setVideoMotion] = useState<'zoom-in' | 'zoom-out' | 'pan' | 'tilt'>('zoom-in');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoDuration, setVideoDuration] = useState<number>(4);
  const [videoAudio, setVideoAudio] = useState<boolean>(true);
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [latestVideo, setLatestVideo] = useState<GeneratedMediaItem | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Gallery State
  const [galleryItems, setGalleryItems] = useState<GeneratedMediaItem[]>(() => getStoredMediaItems());
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video'>('all');
  const [fullscreenMedia, setFullscreenMedia] = useState<GeneratedMediaItem | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Load latest stored items into gallery on mount
  useEffect(() => {
    setGalleryItems(getStoredMediaItems());
  }, []);

  // Handle AI Prompt Enhancement for Image
  const handleEnhancePrompt = async () => {
    const currentPrompt = studioMode === 'video' ? videoPrompt : imagePrompt;
    if (!currentPrompt.trim()) return;

    setIsEnhancingImagePrompt(true);
    try {
      const enhanced = await enhancePromptWithAI(currentPrompt);
      if (studioMode === 'video') {
        setVideoPrompt(enhanced);
      } else {
        setImagePrompt(enhanced);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancingImagePrompt(false);
    }
  };

  // Generate Image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setImageError(null);

    // Calculate dimensions
    let width = 1024;
    let height = 576;
    if (aspectRatio === '1:1') {
      width = 768;
      height = 768;
    } else if (aspectRatio === '9:16') {
      width = 576;
      height = 1024;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    }

    const stylePreset = MEDIA_STYLE_PRESETS.find((s) => s.id === selectedStyle);
    const styleText = stylePreset ? stylePreset.promptSuffix : '';

    try {
      const result = await generateImageFromText({
        prompt: imagePrompt.trim(),
        model: imageModel,
        width,
        height,
        style: styleText,
      });
      setLatestImage(result);
      setGalleryItems(getStoredMediaItems());
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate Video
  const handleGenerateVideo = async () => {
    const promptToUse = videoPrompt.trim() || imagePrompt.trim();
    if (!promptToUse && !videoSourceImage) {
      setVideoError('Please enter a prompt or select a base image.');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const result = await generateVideoFromText({
        prompt: promptToUse || 'cinematic motion atmospheric visual sequence',
        imageUrl: videoSourceImage || undefined,
        motion: videoMotion,
        duration: videoDuration,
        aspectRatio: videoAspectRatio,
        audio: videoAudio,
      });
      setLatestVideo(result);
      setGalleryItems(getStoredMediaItems());
    } catch (err: any) {
      setVideoError(err.message || 'Video generation failed');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Delete media item
  const handleDeleteMedia = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    removeStoredMediaItem(id);
    setGalleryItems(getStoredMediaItems());
    if (latestImage?.id === id) setLatestImage(null);
    if (latestVideo?.id === id) setLatestVideo(null);
    if (fullscreenMedia?.id === id) setFullscreenMedia(null);
  };

  // Animate Image into Video
  const handleAnimateImageIntoVideo = (item: GeneratedMediaItem) => {
    setVideoSourceImage(item.url);
    setVideoPrompt(item.prompt);
    setStudioMode('video');
  };

  // Copy prompt text
  const handleCopyPrompt = (id: string, promptText: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Filtered gallery items
  const filteredGallery = galleryItems.filter((item) => {
    if (galleryFilter === 'all') return true;
    return item.type === galleryFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {isKhmer ? 'ម៉ូដែលជំនាន់ថ្មី Flux & Motion Synthesizer' : 'Flux.1 Diffusion & Motion Synthesizer'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('mediaStudio', language)}{' '}
              <span className="text-cyan-400">
                {isKhmer ? 'រូបភាព & វីដេអូ' : 'Image & Video'}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t('mediaStudioDesc', language)}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/80 self-start md:self-auto">
            <button
              onClick={() => setStudioMode('image')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                studioMode === 'image'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {t('imageGenerator', language)}
            </button>
            <button
              onClick={() => setStudioMode('video')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                studioMode === 'video'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white shadow-md shadow-fuchsia-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Film className="w-4 h-4" />
              {t('videoGenerator', language)}
            </button>
            <button
              onClick={() => setStudioMode('gallery')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                studioMode === 'gallery'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              {isKhmer ? 'វិចិត្រសាល' : 'Gallery'}
              {galleryItems.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full font-bold">
                  {galleryItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SAMPLE PROMPT QUICK CHIPS (Visible in Image and Video modes) */}
      {studioMode !== 'gallery' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Compass className="w-3.5 h-3.5 text-cyan-500" />
            <span>
              {isKhmer ? 'គំរូអត្ថបទពេញនិយម (ចុចដើម្បីសាកល្បង):' : 'Featured Visual Prompts (Click to load):'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  if (studioMode === 'video') {
                    setVideoPrompt(sample.prompt);
                  } else {
                    setImagePrompt(sample.prompt);
                    setSelectedStyle(sample.style);
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500 dark:hover:border-cyan-400 text-slate-800 dark:text-slate-200 transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle className="w-3 h-3 text-cyan-500" />
                <span>{isKhmer ? sample.labelKm : sample.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: IMAGE GENERATION                                                 */}
      {/* ========================================================================= */}
      {studioMode === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Prompt Input Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-500" />
                  {t('promptLabel', language)}
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingImagePrompt || !imagePrompt.trim()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Enhance prompt details with Gemini AI"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEnhancingImagePrompt ? 'animate-spin' : ''}`} />
                  <span>
                    {isEnhancingImagePrompt
                      ? isKhmer ? 'កំពុងពង្រីក...' : 'Magic Enhancing...'
                      : t('enhanceWithAI', language)}
                  </span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={
                    isKhmer
                      ? 'ពិពណ៌នាអំពីទិដ្ឋភាព ប្រធានបទ ពន្លឺ កែវថតកាមេរ៉ា (ឧ. ប្រាសាទអង្គរវត្តពេលថ្ងៃរះ មានពន្លឺមាសឆ្លុះលើទឹកបឹង...)'
                      : 'Describe your scene, subject, lighting, mood, camera lens (e.g. Ancient temple in tropical golden hour sunlight with lotus pond reflections, photorealistic 8k...)'
                  }
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
                />
                <div className="text-[11px] text-slate-400 dark:text-slate-500 text-right mt-1">
                  {imagePrompt.length} {t('charCount', language)}
                </div>
              </div>

              {/* Style Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                  {t('artStyle', language)}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MEDIA_STYLE_PRESETS.map((preset) => {
                    const isSelected = selectedStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedStyle(preset.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20'
                            : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{preset.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {isKhmer ? preset.khmerName : preset.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model & Aspect Ratio Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Diffusion Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('modelEngine', language)}
                  </label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    {IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tag})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('aspectRatio', language)}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: '16:9', label: '16:9', sub: 'Landscape' },
                      { id: '1:1', label: '1:1', sub: 'Square' },
                      { id: '9:16', label: '9:16', sub: 'Story' },
                      { id: '4:3', label: '4:3', sub: 'Photo' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setAspectRatio(ratio.id as any)}
                        className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                          aspectRatio === ratio.id
                            ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div>{ratio.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {imageError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
                  {imageError}
                </div>
              )}

              {/* Generate Action Button */}
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {isKhmer ? 'កំពុងបង្កើតរូបភាព AI គុណភាពខ្ពស់...' : 'Synthesizing High-Detail Image...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('generateImageBtn', language)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result / Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-500" />
                  {isKhmer ? 'លទ្ធផលរូបភាពដែលបានបង្កើត' : 'Visual Preview Canvas'}
                </h3>
                {latestImage && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    High Resolution
                  </span>
                )}
              </div>

              {isGeneratingImage ? (
                <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isKhmer ? 'កំពុងគណនាដំណើរការ Diffusion...' : 'Diffusion Latent Denoising in progress...'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isKhmer ? 'កំពុងបង្កើតរូបភាពកម្រិតច្បាស់' : 'Rendering photorealistic lighting & textures'}
                    </p>
                  </div>
                </div>
              ) : latestImage ? (
                <div className="space-y-4">
                  <div className="relative group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                    <img
                      src={latestImage.url}
                      alt={latestImage.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full object-cover max-h-[380px] rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setFullscreenMedia(latestImage)}
                        className="p-2 rounded-xl bg-black/70 backdrop-blur text-white hover:bg-black transition-all cursor-pointer"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions for Latest Image */}
                  <div className="space-y-2.5">
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 line-clamp-2">
                      <span className="font-semibold text-slate-900 dark:text-white">Prompt: </span>
                      {latestImage.prompt}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={latestImage.url}
                        download={`apodex-image-${latestImage.id}.jpg`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('downloadMedia', language)} (JPG)</span>
                      </a>

                      <button
                        onClick={() => handleAnimateImageIntoVideo(latestImage)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-fuchsia-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>{t('turnIntoVideo', language)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {isKhmer ? 'មិនទាន់មានរូបភាព' : 'Canvas is empty'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                    {isKhmer
                      ? 'បញ្ចូលអត្ថបទពិពណ៌នាខាងឆ្វេង ឬចុចលើគំរូអត្ថបទខាងលើដើម្បីចាប់ផ្តើម'
                      : 'Type a prompt on the left or select a featured sample above to generate your visual.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: VIDEO GENERATION                                                 */}
      {/* ========================================================================= */}
      {studioMode === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Optional Keyframe Image Banner */}
              {videoSourceImage && (
                <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={videoSourceImage}
                      alt="Source Keyframe"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-xl border border-fuchsia-400/50"
                    />
                    <div>
                      <div className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        {isKhmer ? 'ប្រើរូបភាពគន្លឹះ (Image-to-Video)' : 'Image-to-Video Keyframe Active'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isKhmer ? 'វីដេអូនឹងធ្វើចលនាអំពីរូបភាពនេះ' : 'Video motion will synthesize from this frame'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setVideoSourceImage(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove base image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-fuchsia-500" />
                    {isKhmer ? 'ការពិពណ៌នាអំពីចលនាវីដេអូ / Prompt' : 'Motion Description / Video Prompt'}
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingImagePrompt || !videoPrompt.trim()}
                    className="px-3 py-1.5 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isEnhancingImagePrompt ? 'animate-spin' : ''}`} />
                    <span>{isKhmer ? 'ពង្រីក AI' : 'Enhance Prompt'}</span>
                  </button>
                </div>

                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder={
                    isKhmer
                      ? 'ពិពណ៌នាអំពីទិដ្ឋភាពវីដេអូ ចលនាកាមេរ៉ា បរិយាកាស (ឧ. ទេសភាពភ្នំពេញឆ្នាំ 2050 ពេលយប់ មានចលនាកាមេរ៉ារុញចូលយឺតៗ...)'
                      : 'Describe the motion, camera movement, and atmosphere (e.g. Cinematic slow push-in drone shot through ancient Cambodian temple gates at sunrise...)'
                  }
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 resize-y"
                />
              </div>

              {/* Camera Motion Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-fuchsia-500" />
                  {t('cameraMotion', language)}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VIDEO_MOTIONS.map((m) => {
                    const isSelected = videoMotion === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setVideoMotion(m.id as any)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-500 dark:border-fuchsia-400 ring-2 ring-fuchsia-500/20'
                            : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isKhmer ? m.khmerName : m.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {m.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration & Aspect Ratio & Sound */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('durationSec', language)}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[2, 4, 6].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setVideoDuration(sec)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          videoDuration === sec
                            ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('aspectRatio', language)}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {['16:9', '9:16', '1:1'].map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setVideoAspectRatio(ratio as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          videoAspectRatio === ratio
                            ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soundtrack */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('audioSoundtrack', language)}
                  </label>
                  <button
                    type="button"
                    onClick={() => setVideoAudio(!videoAudio)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      videoAudio
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {videoAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{videoAudio ? (isKhmer ? 'បើកសំឡេង' : 'Audio On') : (isKhmer ? 'បិទសំឡេង' : 'Muted')}</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {videoError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
                  {videoError}
                </div>
              )}

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || (!videoPrompt.trim() && !videoSourceImage)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-fuchsia-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {isKhmer ? 'កំពុងផលិតវីដេអូ MP4 តាមលំដាប់...' : 'Synthesizing MP4 Video Frames...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>{t('generateVideoBtn', language)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Video Player / Canvas */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-fuchsia-500" />
                  {isKhmer ? 'កន្លែងចាក់វីដេអូ MP4' : 'Video Player Canvas'}
                </h3>
                {latestVideo && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30">
                    {latestVideo.duration}s MP4
                  </span>
                )}
              </div>

              {isGeneratingVideo ? (
                <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-600/30">
                    <Film className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isKhmer ? 'កំពុងផលិតចលនាកាមេរ៉ា និងសំឡេង...' : 'Rendering 24fps motion vectors & audio...'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isKhmer ? 'សូមរង់ចាំពីរបីវិនាទី' : 'Synthesizing camera movement & encoding H.264'}
                    </p>
                  </div>
                </div>
              ) : latestVideo ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-lg relative">
                    <video
                      src={latestVideo.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full max-h-[380px] rounded-2xl object-contain bg-black"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-semibold text-slate-900 dark:text-white">Motion: </span>
                      <span className="capitalize">{latestVideo.motion}</span> • {latestVideo.duration}s duration
                    </div>

                    <a
                      href={latestVideo.url}
                      download={`apodex-video-${latestVideo.id}.mp4`}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-fuchsia-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('downloadMedia', language)} (MP4 Video)</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {isKhmer ? 'មិនទាន់មានវីដេអូ' : 'No video generated yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                    {isKhmer
                      ? 'បញ្ចូលអត្ថបទ ឬជ្រើសរើសរូបភាពដើម្បីបង្កើតវីដេអូមានចលនា'
                      : 'Provide a motion prompt or select an image to generate an animated MP4 video.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: MEDIA GALLERY                                                    */}
      {/* ========================================================================= */}
      {studioMode === 'gallery' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  galleryFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isKhmer ? 'ទាំងអស់' : 'All Media'} ({galleryItems.length})
              </button>
              <button
                onClick={() => setGalleryFilter('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  galleryFilter === 'image'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isKhmer ? 'រូបភាព' : 'Images'} ({galleryItems.filter((i) => i.type === 'image').length})
              </button>
              <button
                onClick={() => setGalleryFilter('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  galleryFilter === 'video'
                    ? 'bg-fuchsia-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isKhmer ? 'វីដេអូ' : 'Videos'} ({galleryItems.filter((i) => i.type === 'video').length})
              </button>
            </div>

            {galleryItems.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(isKhmer ? 'តើអ្នកពិតជាចង់សម្អាតវិចិត្រសាលទាំងអស់មែនទេ?' : 'Clear all media history?')) {
                    localStorage.removeItem('apodex_ai_generated_media_v1');
                    setGalleryItems([]);
                    setLatestImage(null);
                    setLatestVideo(null);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'សម្អាតទាំងអស់' : 'Clear History'}</span>
              </button>
            )}
          </div>

          {/* Gallery Grid */}
          {filteredGallery.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t('noMediaYet', language)}
              </h3>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setStudioMode('image')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {t('generateImageBtn', language)}
                </button>
                <button
                  onClick={() => setStudioMode('video')}
                  className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {t('generateVideoBtn', language)}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGallery.map((item) => {
                const isVideo = item.type === 'video';
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Media Preview Container */}
                    <div
                      className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                      onClick={() => setFullscreenMedia(item)}
                    >
                      {isVideo ? (
                        <video
                          src={item.url}
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.prompt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Top Type Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-md flex items-center gap-1 text-white ${
                            isVideo
                              ? 'bg-fuchsia-600/90'
                              : 'bg-cyan-600/90'
                          }`}
                        >
                          {isVideo ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          <span className="uppercase">{item.type}</span>
                        </span>
                      </div>

                      {/* Delete Button on Hover */}
                      <button
                        onClick={(e) => handleDeleteMedia(item.id, e)}
                        className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Center Play Icon for Video */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center">
                            <Play className="w-4 h-4 ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleCopyPrompt(item.id, item.prompt, e)}
                            className="p-1 rounded-lg hover:text-cyan-500 transition-colors cursor-pointer"
                            title="Copy prompt"
                          >
                            {copiedPromptId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={item.url}
                            download={`apodex-${item.type}-${item.id}.${isVideo ? 'mp4' : 'jpg'}`}
                            className="p-1 rounded-lg hover:text-cyan-500 transition-colors"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {!isVideo && (
                            <button
                              onClick={() => handleAnimateImageIntoVideo(item)}
                              className="p-1 rounded-lg hover:text-fuchsia-500 transition-colors cursor-pointer"
                              title="Turn into video"
                            >
                              <Film className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {fullscreenMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setFullscreenMedia(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-xs font-semibold">
                <span className="uppercase text-cyan-400 font-bold">{fullscreenMedia.type}</span>
                <span>•</span>
                <span className="text-slate-400 truncate max-w-md">{fullscreenMedia.prompt}</span>
              </div>
              <button
                onClick={() => setFullscreenMedia(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Media Body */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              {fullscreenMedia.type === 'video' ? (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  loop
                  className="max-h-[70vh] w-auto max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={fullscreenMedia.url}
                  alt={fullscreenMedia.prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 text-[11px] max-w-xl truncate">
                {fullscreenMedia.prompt}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fullscreenMedia.url}
                  download={`apodex-${fullscreenMedia.type}-${fullscreenMedia.id}.${fullscreenMedia.type === 'video' ? 'mp4' : 'jpg'}`}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadMedia', language)}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
