'use client'

import { useState, useRef, useEffect } from 'react'
import VoiceOrb from './VoiceOrb'
import { AVAILABLE_TOOLS, TOOL_HANDLERS } from '../config/tools'
import { buildFinalSystemPrompt } from '../config/protected-prompt'
import { 
  DEFAULT_VOICE,
  REALTIME_VOICES,
  WEBRTC_CONFIG,
  MICROPHONE_CONFIG,
  ANALYSER_CONFIG,
  OUTPUT_ANALYSER_CONFIG,
  REALTIME_API_URLs,
  type RealtimeVoiceId 
} from '../config/realtime-config'

interface VoiceControlsProps {
  systemPrompt: string
  onVoiceStateChange: (state: 'disconnected' | 'connecting' | 'talking') => void
  onVolumeChange: (volume: number, type: 'input' | 'output') => void
  voiceState: 'disconnected' | 'connecting' | 'talking'
  inputVolume: number
  outputVolume: number
}

export default function VoiceControls({ systemPrompt, onVoiceStateChange, onVolumeChange, voiceState, inputVolume, outputVolume }: VoiceControlsProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<RealtimeVoiceId>(DEFAULT_VOICE)
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const audioElementRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const inputAnalyserRef = useRef<AnalyserNode | null>(null)
  const outputAnalyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const volumeHistoryRef = useRef<{ input: number[], output: number[] }>({ input: [], output: [] })
  const lastVolumeUpdateRef = useRef<number>(0)

  // 🔧 НОВЫЕ REF'Ы ДЛЯ AUDIO RECOVERY SYSTEM
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastOutputDataRef = useRef<number>(0)
  const audioRecoveryAttemptsRef = useRef<number>(0)
  const maxRecoveryAttemptsRef = useRef<number>(3)

  // 🎙️ ДОСТУПНЫЕ ГОЛОСА OpenAI Realtime API (из конфига)
  const availableVoices = REALTIME_VOICES

  // 🎯 1. AUDIOCTX RESILIENCE - критическая функция для предотвращения suspending
  const ensureAudioContextActive = async (): Promise<boolean> => {
    if (!audioContextRef.current) {
      console.log('🔧 AudioContext не существует, пересоздаем...')
      return false
    }
    
    if (audioContextRef.current.state === 'suspended') {
      try {
        console.log('🔧 AudioContext suspended, возобновляем...')
        await audioContextRef.current.resume()
        console.log('✅ AudioContext успешно возобновлен')
        return true
      } catch (error) {
        console.error('❌ Ошибка возобновления AudioContext:', error)
        return false
      }
    }
    
    if (audioContextRef.current.state === 'closed') {
      console.log('🔧 AudioContext закрыт, требуется пересоздание')
      return false
    }
    
    return audioContextRef.current.state === 'running'
  }

  // 🎯 2. HTML AUDIO ELEMENT RECOVERY - обработка прерываний воспроизведения
  const setupAudioElementRecovery = (audioElement: HTMLAudioElement) => {
    console.log('🔧 Настраиваем audio element recovery')
    
    // События, требующие восстановления
    const recoveryEvents = ['waiting', 'stalled', 'suspend', 'error', 'emptied', 'pause']
    
    recoveryEvents.forEach(eventType => {
      audioElement.addEventListener(eventType, handleAudioElementRecovery)
    })

    // Позитивные события для сброса счетчика попыток
    const successEvents = ['playing', 'canplaythrough', 'loadeddata']
    successEvents.forEach(eventType => {
      audioElement.addEventListener(eventType, () => {
        audioRecoveryAttemptsRef.current = 0
      })
    })
  }

  const handleAudioElementRecovery = async (event: Event) => {
    const eventType = event.type
    console.log(`🔧 Audio element recovery triggered: ${eventType}`)
    
    if (audioRecoveryAttemptsRef.current >= maxRecoveryAttemptsRef.current) {
      console.log('⚠️ Максимальное количество попыток восстановления достигнуто')
      return
    }
    
    audioRecoveryAttemptsRef.current++
    
    if (!audioElementRef.current || !remoteStreamRef.current) {
      console.log('❌ Audio element или remote stream отсутствуют')
      return
    }

    try {
      // Пытаемся восстановить в зависимости от типа события
      switch (eventType) {
        case 'waiting':
        case 'stalled':
          console.log('🔧 Попытка reload audio element...')
          audioElementRef.current.load()
          break
          
        case 'error':
        case 'emptied':
          console.log('🔧 Переустанавливаем srcObject...')
          audioElementRef.current.srcObject = null
          await new Promise(resolve => setTimeout(resolve, 100))
          audioElementRef.current.srcObject = remoteStreamRef.current
          break
          
        case 'suspend':
          console.log('🔧 Попытка resume playback...')
          if (audioElementRef.current.paused) {
            await audioElementRef.current.play().catch(console.error)
          }
          break
          
        case 'pause':
          // Только если это не был намеренный pause
          if (isConnected && !isMuted) {
            console.log('🔧 Непредвиденная пауза, возобновляем...')
            await audioElementRef.current.play().catch(console.error)
          }
          break
      }
      
      // Проверяем AudioContext после восстановления
      await ensureAudioContextActive()
      
    } catch (error) {
      console.error(`❌ Ошибка восстановления audio element (${eventType}):`, error)
    }
  }

  // 🎯 3. MEDIASTREAM HEALTH CHECK - мониторинг качества потока
  const performStreamHealthCheck = (): boolean => {
    if (!remoteStreamRef.current) {
      console.log('⚠️ Health check: remote stream отсутствует')
      return false
    }
    
    const audioTracks = remoteStreamRef.current.getAudioTracks()
    if (audioTracks.length === 0) {
      console.log('⚠️ Health check: нет audio tracks')
      return false
    }
    
    const activeTrack = audioTracks[0]
    if (activeTrack.readyState !== 'live') {
      console.log(`⚠️ Health check: track не live (${activeTrack.readyState})`)
      return false
    }
    
    if (activeTrack.muted) {
      console.log('⚠️ Health check: track muted')
      return false
    }
    
    return true
  }

  // 🎯 4. ANALYSER DATA VALIDATION - проверка что данные поступают
  const validateAnalyserData = (): boolean => {
    if (!outputAnalyserRef.current) return false
    
    const bufferLength = outputAnalyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    outputAnalyserRef.current.getByteFrequencyData(dataArray)
    
    // Проверяем что данные не все нули (есть активность)
    const hasData = dataArray.some(value => value > 0)
    const currentTime = performance.now()
    
    if (hasData) {
      lastOutputDataRef.current = currentTime
      return true
    }
    
    // Если данных нет больше 5 секунд, это проблема
    const noDataDuration = currentTime - lastOutputDataRef.current
    if (noDataDuration > 5000) {
      console.log('⚠️ Analyser не получает данные уже 5+ секунд')
      return false
    }
    
    return true
  }

  // 🎯 5. COMPREHENSIVE HEALTH CHECK - общий мониторинг системы
  const performComprehensiveHealthCheck = async () => {
    if (!isConnected) return
    
    let needsRecovery = false
    
    // Проверяем AudioContext
    if (!(await ensureAudioContextActive())) {
      console.log('🔧 Health check: AudioContext needs recovery')
      needsRecovery = true
    }
    
    // Проверяем MediaStream
    if (!performStreamHealthCheck()) {
      console.log('🔧 Health check: MediaStream needs attention')
      needsRecovery = true
    }
    
    // Проверяем Analyser data flow
    if (!validateAnalyserData()) {
      console.log('🔧 Health check: Analyser data flow interrupted')
      needsRecovery = true
      
      // Пытаемся переподключить output analyser
      if (remoteStreamRef.current && audioContextRef.current) {
        try {
          const outputSource = audioContextRef.current.createMediaStreamSource(remoteStreamRef.current)
          outputAnalyserRef.current = audioContextRef.current.createAnalyser()
          outputAnalyserRef.current.fftSize = OUTPUT_ANALYSER_CONFIG.fftSize
          outputAnalyserRef.current.smoothingTimeConstant = OUTPUT_ANALYSER_CONFIG.smoothingTimeConstant
          outputAnalyserRef.current.minDecibels = OUTPUT_ANALYSER_CONFIG.minDecibels
          outputAnalyserRef.current.maxDecibels = OUTPUT_ANALYSER_CONFIG.maxDecibels
          outputSource.connect(outputAnalyserRef.current)
          console.log('✅ Output analyser переподключен')
        } catch (error) {
          console.error('❌ Ошибка переподключения output analyser:', error)
        }
      }
    }
    
    // Проверяем HTML Audio Element
    if (audioElementRef.current) {
      const audioElement = audioElementRef.current
      
      if (audioElement.error) {
        console.log('🔧 Health check: Audio element has error:', audioElement.error)
        needsRecovery = true
      }
      
      if (audioElement.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        console.log('🔧 Health check: Audio element no source')
        needsRecovery = true
      }
    }
    
    if (needsRecovery) {
      console.log('🔧 Health check обнаружил проблемы, но продолжаем мониторинг')
    }
  }

  // Создаем Audio элемент для воспроизведения ответов ассистента
  useEffect(() => {
    audioElementRef.current = new Audio()
    audioElementRef.current.autoplay = true
    
    // 🔧 НОВОЕ: настраиваем audio recovery system
    setupAudioElementRecovery(audioElementRef.current)
    
    // 🔧 НОВОЕ: запускаем health check каждые 3 секунды
    healthCheckIntervalRef.current = setInterval(performComprehensiveHealthCheck, 3000)
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
    }
  }, [])

  // Функция анализа громкости с шумоподавлением и audio recovery
  const analyzeAudio = async () => {
    // 🔧 НОВОЕ: проверяем AudioContext перед анализом
    if (!(await ensureAudioContextActive())) {
      console.log('⚠️ AudioContext не активен, пропускаем анализ')
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      return
    }
    
    if (!inputAnalyserRef.current && !outputAnalyserRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      return
    }

    const now = performance.now()
    
    // Throttling: обновляем не чаще 30 FPS для плавности
    if (now - lastVolumeUpdateRef.current < 33) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      return
    }
    lastVolumeUpdateRef.current = now

    // Константы для шумоподавления и сглаживания
    const NOISE_GATE = 0.15  // Порог шума (15%)
    const SMOOTHING_FACTOR = 0.5  // Умеренное сглаживание
    const HISTORY_SIZE = 5  // Размер окна усреднения

    // Анализ входящего звука (микрофон)
    if (inputAnalyserRef.current) {
      const bufferLength = inputAnalyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      inputAnalyserRef.current.getByteFrequencyData(dataArray)
      
      // Вычисляем RMS (Root Mean Square) для более точной громкости
      const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength)
      let volume = Math.min(rms / 128, 1)
      
      // Применяем noise gate - игнорируем тихие звуки
      if (volume < NOISE_GATE) {
        volume = 0
      } else {
        // Нормализуем относительно порога шума
        volume = (volume - NOISE_GATE) / (1 - NOISE_GATE)
      }
      
      // Добавляем в историю для сглаживания
      volumeHistoryRef.current.input.push(volume)
      if (volumeHistoryRef.current.input.length > HISTORY_SIZE) {
        volumeHistoryRef.current.input.shift()
      }
      
      // Вычисляем сглаженное значение
      const smoothedVolume = volumeHistoryRef.current.input.reduce((sum, v) => sum + v, 0) / volumeHistoryRef.current.input.length
      
      // Применяем экспоненциальное сглаживание
      const finalVolume = smoothedVolume * SMOOTHING_FACTOR + (volumeHistoryRef.current.input[volumeHistoryRef.current.input.length - 1] || 0) * (1 - SMOOTHING_FACTOR)
      
      // Дебаг информация (только при значительных изменениях)
      if (Math.abs(finalVolume - (volumeHistoryRef.current.input[volumeHistoryRef.current.input.length - 2] || 0)) > 0.1) {
        console.log(`🎤 Input volume: ${(finalVolume * 100).toFixed(1)}%`);
      }
      
      onVolumeChange(finalVolume, 'input')
    }

    // Анализ исходящего звука (ответ ассистента)  
    if (outputAnalyserRef.current) {
      const bufferLength = outputAnalyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      outputAnalyserRef.current.getByteFrequencyData(dataArray)
      
      // Аналогичная обработка для выходного звука
      const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength)
      let volume = Math.min(rms / 128, 1)
      
      // ОТЛАДКА: всегда показываем raw данные для output
      if (rms > 5) {
        // Тихий анализ громкости output
      }
      
      // Для речи ассистента используем более низкий порог
      const OUTPUT_NOISE_GATE = 0.08
      if (volume < OUTPUT_NOISE_GATE) {
        volume = 0
      } else {
        volume = (volume - OUTPUT_NOISE_GATE) / (1 - OUTPUT_NOISE_GATE)
      }
      
      volumeHistoryRef.current.output.push(volume)
      if (volumeHistoryRef.current.output.length > HISTORY_SIZE) {
        volumeHistoryRef.current.output.shift()
      }
      
      const smoothedVolume = volumeHistoryRef.current.output.reduce((sum, v) => sum + v, 0) / volumeHistoryRef.current.output.length
      const finalVolume = smoothedVolume * SMOOTHING_FACTOR + (volumeHistoryRef.current.output[volumeHistoryRef.current.output.length - 1] || 0) * (1 - SMOOTHING_FACTOR)
      
      // Дебаг информация для выходного сигнала - ВСЕГДА показываем
      if (finalVolume > 0.05) {
        // Тихий анализ - лог убран
      }
      
      // Убрали логику переключения состояний - остается только talking
      
      onVolumeChange(finalVolume, 'output')
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  const connectToRealtimeAPI = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    onVoiceStateChange('connecting');

    try {
      // Получаем ephemeral token
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemPrompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('Token response:', tokenData);
      
      const token = tokenData.client_secret?.value || tokenData.client_secret || tokenData.token || tokenData.access_token;
      
      if (!token) {
        console.error('Token structure:', tokenData);
        throw new Error('No token found in response');
      }

      // Создаем WebRTC соединение с конфигурацией из конфига
      const pc = new RTCPeerConnection(WEBRTC_CONFIG);
      
      // 🔧 НОВОЕ: мониторинг WebRTC соединения
      pc.addEventListener('connectionstatechange', () => {
        console.log(`🔗 WebRTC connection state: ${pc.connectionState}`)
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log('⚠️ WebRTC соединение потеряно, может потребоваться переподключение')
        }
      })
      
      pc.addEventListener('iceconnectionstatechange', () => {
        console.log(`🧊 ICE connection state: ${pc.iceConnectionState}`)
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.log('⚠️ ICE соединение потеряно')
        }
      })
      
      // Добавляем аудио трек с настройками из конфига
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: MICROPHONE_CONFIG
      });
      pc.addTrack(ms.getTracks()[0], ms);

      // Настраиваем анализ входящего аудио (микрофон)
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(ms);
      inputAnalyserRef.current = audioContextRef.current.createAnalyser();
      
      // Настройки анализа речи из конфига
      inputAnalyserRef.current.fftSize = ANALYSER_CONFIG.fftSize;
      inputAnalyserRef.current.smoothingTimeConstant = ANALYSER_CONFIG.smoothingTimeConstant;
      inputAnalyserRef.current.minDecibels = ANALYSER_CONFIG.minDecibels;
      inputAnalyserRef.current.maxDecibels = ANALYSER_CONFIG.maxDecibels;
      
      source.connect(inputAnalyserRef.current);

      // Обработка входящих аудио с улучшенным мониторингом
      pc.ontrack = e => {
        remoteStreamRef.current = e.streams[0];
        console.log('🔊 Получен remote stream для анализа:', e.streams[0]);
        
        // 🔧 НОВОЕ: мониторинг MediaStream
        const stream = e.streams[0];
        const audioTracks = stream.getAudioTracks();
        
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          console.log(`🔊 Audio track: ${track.label}, state: ${track.readyState}`);
          
          // Мониторим состояние track'а
          track.addEventListener('ended', () => {
            console.log('⚠️ Audio track ended unexpectedly');
          });
          
          track.addEventListener('mute', () => {
            console.log('⚠️ Audio track muted');
          });
          
          track.addEventListener('unmute', () => {
            console.log('✅ Audio track unmuted');
          });
        }
        
        // Мониторим состояние потока
        stream.addEventListener('removetrack', (event) => {
          console.log('⚠️ Track removed from stream:', event.track);
        });
        
        stream.addEventListener('addtrack', (event) => {
          console.log('✅ Track added to stream:', event.track);
        });
        
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = stream;
          
          // 🔧 УЛУЧШЕНО: настраиваем анализ исходящего аудио с error handling
          if (audioContextRef.current) {
            try {
              const outputSource = audioContextRef.current.createMediaStreamSource(stream);
              outputAnalyserRef.current = audioContextRef.current.createAnalyser();
              
              // Настройки для анализа речи ассистента из конфига
              outputAnalyserRef.current.fftSize = OUTPUT_ANALYSER_CONFIG.fftSize;
              outputAnalyserRef.current.smoothingTimeConstant = OUTPUT_ANALYSER_CONFIG.smoothingTimeConstant;
              outputAnalyserRef.current.minDecibels = OUTPUT_ANALYSER_CONFIG.minDecibels;
              outputAnalyserRef.current.maxDecibels = OUTPUT_ANALYSER_CONFIG.maxDecibels;
              
              outputSource.connect(outputAnalyserRef.current);
              
              // Инициализируем таймер для мониторинга данных
              lastOutputDataRef.current = performance.now();
              
              console.log('🔊 Output анализ настроен через MediaStream');
            } catch (error) {
              console.error('🔊 Ошибка настройки output анализа:', error);
            }
          }
        }
      };

      // Настраиваем DataChannel listeners ПЕРЕД offer/answer процессом
      console.log('🔄 Ожидаем DataChannel от OpenAI...');
      pc.addEventListener('datachannel', (event) => {
        const dataChannel = event.channel;
        dataChannelRef.current = dataChannel;
        console.log('📡 ✅ DataChannel получен от OpenAI:', dataChannel.label, dataChannel.readyState);

        dataChannel.addEventListener('message', (event) => {
          try {
            const realtimeEvent = JSON.parse(event.data);
            console.log('📡 🎯 VAD СОБЫТИЕ от OpenAI:', realtimeEvent.type, realtimeEvent);
            handleRealtimeEvent(realtimeEvent);
            // Тихая работа - отладочные логи убраны
          } catch (error) {
            console.error('❌ Error parsing realtime event:', error, event.data);
          }
        });

        dataChannel.addEventListener('open', () => {
          console.log('✅ DataChannel открыт - отправляем настройки VAD');
          
          // Отправляем начальные настройки сессии с VAD и Tools
          const finalPrompt = buildFinalSystemPrompt(systemPrompt);
          const sessionUpdate = {
            type: 'session.update',
            session: {
              instructions: finalPrompt,
              voice: selectedVoice, // 🎙️ Используем выбранный голос
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 200
              },
              tools: AVAILABLE_TOOLS
            }
          };
          
          console.log('📡 Отправляем настройки VAD:', sessionUpdate);
          
          try {
            dataChannel.send(JSON.stringify(sessionUpdate));
            console.log('✅ Настройки VAD отправлены успешно');
          } catch (error) {
            console.error('❌ Ошибка отправки настроек VAD:', error);
          }
        });

        dataChannel.addEventListener('error', (error) => {
          console.error('❌ DataChannel error:', error);
        });

        dataChannel.addEventListener('close', () => {
          console.log('📡 DataChannel закрыт');
        });
      });

      // Создаем offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Подключаемся к OpenAI Realtime API (URL из конфига)
      const sdpResponse = await fetch(REALTIME_API_URLs.websocket, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      peerConnectionRef.current = pc;
      localStreamRef.current = ms;
      setIsConnected(true);
      onVoiceStateChange('talking');

      // Запускаем анализ громкости
      analyzeAudio();

      // Проверяем статус DataChannel через 3 секунды
      setTimeout(() => {
        const channelStatus = dataChannelRef.current?.readyState || 'not_created';
        console.log('🔍 DataChannel статус через 3 сек:', channelStatus);
        if (channelStatus !== 'open') {
          console.log('⚠️ DataChannel не работает, используем FALLBACK на анализ громкости');
        }
      }, 3000);

      console.log('Successfully connected to OpenAI Realtime API');
    } catch (error) {
      console.error('Error connecting to Realtime API:', error);
      alert('Ошибка подключения к API. Проверьте консоль для деталей.');
      setIsConnecting(false);
      onVoiceStateChange('disconnected');
    }
  };

  // Обработка вызовов функций (tools)
  const handleToolCall = async (event: { name: string; call_id: string; arguments: string }) => {
    const { name, call_id, arguments: args } = event;
    console.log('🔧 Tool call:', name, 'with args:', args);
    
    try {
      // Находим обработчик функции
      const handler = TOOL_HANDLERS[name as keyof typeof TOOL_HANDLERS];
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      // Выполняем функцию
      const result = await handler(JSON.parse(args));
      console.log('🔧 Tool result:', result);
      
      // Отправляем результат обратно в OpenAI
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const toolResponse = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify(result)
          }
        };
        
        dataChannelRef.current.send(JSON.stringify(toolResponse));
        console.log('🔧 Tool response sent:', toolResponse);
        
        // Запрашиваем новый ответ от модели
        const createResponse = {
          type: 'response.create'
        };
        dataChannelRef.current.send(JSON.stringify(createResponse));
        console.log('🔧 Requested new response from model');
      }
    } catch (error) {
      console.error('🔧 Tool execution error:', error);
      
      // Отправляем ошибку обратно в OpenAI
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const errorResponse = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        };
        
        dataChannelRef.current.send(JSON.stringify(errorResponse));
        console.log('🔧 Tool error response sent:', errorResponse);
      }
    }
  };

  const handleRealtimeEvent = (event: { type: string; [key: string]: unknown }) => {
    console.log('🎪 handleRealtimeEvent ВЫЗВАН:', event.type);
    switch (event.type) {
      case 'session.created':
        console.log('🔄 Сессия создана:', event.session);
        break;
        
      case 'conversation.item.created':
        console.log('💬 Элемент беседы создан:', event.item);
        break;
        
      case 'response.created':
        console.log('🎯 Ответ создан:', event.response);
        break;
        
      case 'response.output_item.added':
        console.log('📤 Выходной элемент добавлен:', event.item);
        break;
        
      case 'response.audio.delta':
        console.log('🎵 VAD: ИИ начал говорить - аудио дельта');
        break;
        
      case 'response.audio.done':
        console.log('🎵 VAD: ИИ закончил говорить - аудио завершено');
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 VAD: Пользователь начал говорить');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 VAD: Пользователь закончил говорить');
        break;
        
      case 'response.done':
        console.log('🏁 VAD: Ответ завершен:', event.response);
        break;
        
      // === ОБРАБОТКА FUNCTION CALLS ===
      case 'response.function_call_arguments.delta':
        console.log('🔧 Tool call arguments delta:', event);
        break;
        
      case 'response.function_call_arguments.done':
        console.log('🔧 Tool call arguments ready:', event);
        handleToolCall(event as unknown as { name: string; call_id: string; arguments: string });
        break;
        
      default:
        console.log('📨 Необработанное событие:', event.type);
        break;
    }
  };

  const disconnect = () => {
    // Останавливаем анализ аудио
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      localStreamRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current = null;
    }
    
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    
    // Сбрасываем историю громкости
    volumeHistoryRef.current = { input: [], output: [] };
    lastVolumeUpdateRef.current = 0;
    
    // Сбрасываем ВСЕ состояния подключения
    setIsConnected(false);
    setIsConnecting(false);
    onVoiceStateChange('disconnected');
    onVolumeChange(0, 'input');
    onVolumeChange(0, 'output');
  };

  const toggleMute = () => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="space-y-10">
      {/* Welcome заголовок */}
      <div className="text-center max-w-md mx-auto animate-fade-in-up">
        <h2 className="heading-secondary mb-4">ИИ Голосовой Ассистент</h2>
        <p className="text-body mb-8">
          Нажмите кнопку&nbsp;&ldquo;Начать&nbsp;разговор&rdquo; и&nbsp;общайтесь<br />
          с&nbsp;ИИ-ассистентом голосом.
        </p>
      </div>

      {/* VoiceOrb - центральный элемент */}
      <div className="flex justify-center mb-12">
        <VoiceOrb 
          state={voiceState}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />
      </div>

      {/* Белая карточка с нижними элементами */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="card p-6 md:p-8 space-y-6 animate-fade-in-up inline-block w-full" style={{animationDelay: '0.2s'}}>
          {/* Статус подключения */}
          <div className="text-center">
            <div className={`status-indicator ${
              isConnected 
                ? 'status-connected' 
                : isConnecting 
                ? 'status-connecting animate-pulse-soft'
                : 'status-disconnected'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-3 ${
                isConnected 
                  ? 'bg-green-500' 
                  : isConnecting 
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`} />
              {isConnected ? 'Подключен' : isConnecting ? 'Подключается...' : 'Отключен'}
            </div>
          </div>

          {/* Голосовые элементы управления */}
      <div className="flex items-center justify-center space-x-6">
        {!isConnected ? (
          <button
            onClick={connectToRealtimeAPI}
            disabled={isConnecting}
            className={`btn-primary ${isConnecting ? 'animate-pulse-soft' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{isConnecting ? 'Подключение...' : 'Начать разговор'}</span>
            </div>
          </button>
        ) : (
          <>
            <button
              onClick={disconnect}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-2xl transform transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-300 btn-disconnect"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Отключиться</span>
              </div>
            </button>
            
            <button
              onClick={toggleMute}
              className={`glass p-4 rounded-2xl hover-lift transition-all duration-200 ${
                isMuted 
                  ? 'text-red-600 bg-red-50/50' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? (
                // Иконка "звук выключен" - динамик перечеркнутый
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 3L1 20" />
                </svg>
              ) : (
                // Иконка "звук включен" - динамик с волнами звука
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9.5c.5.5 1 1.5 1 2.5s-.5 2-1 2.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7.5c1 1 2 2.5 2 4.5s-1 3.5-2 4.5" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

          {/* Индикатор активности */}
          {isConnected && (
            <div className="text-center">
              <div className="glass p-4 rounded-2xl max-w-xs mx-auto">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-soft" />
                  <span className="text-sm font-medium text-green-800">
                    Разговариваем
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}