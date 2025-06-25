/**
 * Конфигурация OpenAI Realtime API
 * Централизованное управление настройками модели, голосов и параметров
 */

// ===== МОДЕЛЬ REALTIME API =====
export const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

// ===== ГОЛОСА REALTIME API =====
export const REALTIME_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Нейтральный, универсальный' },
  { id: 'echo', name: 'Echo', description: 'Мужской голос, четкий' },
  { id: 'shimmer', name: 'Shimmer', description: 'Женский голос, мягкий' },
  { id: 'ash', name: 'Ash', description: 'Выразительный, динамичный' },
  { id: 'ballad', name: 'Ballad', description: 'Мелодичный, эмоциональный' },
  { id: 'coral', name: 'Coral', description: 'Живой, энергичный' },
  { id: 'sage', name: 'Sage', description: 'Мудрый, спокойный' },
  { id: 'verse', name: 'Verse', description: 'Ритмичный, поэтичный' }
] as const;

// ===== ГОЛОС ПО УМОЛЧАНИЮ =====
export const DEFAULT_VOICE = 'alloy'; // 🎙️ Установлен мужской голос Echo

// ===== НАСТРОЙКИ СЕССИИ =====
export const REALTIME_SESSION_CONFIG = {
  // Основные параметры
  model: REALTIME_MODEL,
  voice: DEFAULT_VOICE,
  modalities: ['text', 'audio'] as const,
  
  // Аудио форматы
  input_audio_format: 'pcm16' as const,
  output_audio_format: 'pcm16' as const,
  
  // Транскрипция (опционально)
  input_audio_transcription: {
    model: 'whisper-1'
  },
  
  // Voice Activity Detection (VAD)
  turn_detection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 200
  },
  
  // Температура для креативности ответов
  temperature: 0.8
} as const;

// ===== WEBRTC НАСТРОЙКИ =====
export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// ===== МИКРОФОН НАСТРОЙКИ =====
export const MICROPHONE_CONFIG = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 24000,
  channelCount: 1,
  latency: 0.01 // Минимальная задержка
} as const;

// ===== ANALYSER НАСТРОЙКИ =====
export const ANALYSER_CONFIG = {
  fftSize: 512,
  smoothingTimeConstant: 0.3,
  minDecibels: -90,
  maxDecibels: -10
} as const;

// ===== OUTPUT ANALYSER НАСТРОЙКИ =====
export const OUTPUT_ANALYSER_CONFIG = {
  fftSize: 512,
  smoothingTimeConstant: 0.4,
  minDecibels: -90,
  maxDecibels: -10
} as const;

// ===== ТИПЫ =====
export type RealtimeVoiceId = typeof REALTIME_VOICES[number]['id'];
export type RealtimeVoice = typeof REALTIME_VOICES[number];

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====
export const getVoiceById = (id: RealtimeVoiceId): RealtimeVoice | undefined => {
  return REALTIME_VOICES.find(voice => voice.id === id);
};

export const isValidVoice = (id: string): id is RealtimeVoiceId => {
  return REALTIME_VOICES.some(voice => voice.id === id);
};

// ===== API URLs =====
export const REALTIME_API_URLs = {
  session: 'https://api.openai.com/v1/realtime/sessions',
  websocket: `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`
} as const; 