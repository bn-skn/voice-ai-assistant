'use client';

import { useEffect, useState } from 'react';

interface VoiceOrbProps {
  state: 'disconnected' | 'connecting' | 'talking';
  className?: string;
  inputVolume?: number;
  outputVolume?: number;
}

export default function VoiceOrb({ state, className = '', inputVolume = 0, outputVolume = 0 }: VoiceOrbProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [smoothedInputVolume, setSmoothedInputVolume] = useState(0);
  const [smoothedOutputVolume, setSmoothedOutputVolume] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Отслеживаем изменения состояния (тихая работа)

  // Минимальное сглаживание в UI компоненте
  useEffect(() => {
    const smoothingFactor = 1.0; // Максимально быстрое реагирование
    setSmoothedInputVolume(prev => prev + (inputVolume - prev) * smoothingFactor);
  }, [inputVolume]);

  useEffect(() => {
    const smoothingFactor = 1.0;
    setSmoothedOutputVolume(prev => prev + (outputVolume - prev) * smoothingFactor);
  }, [outputVolume]);

  if (!isMounted) {
    return <div className={`w-32 h-32 ${className}`} />; // Placeholder для предотвращения layout shift
  }

  // Вычисляем скейл на основе сглаженной громкости
  const getVolumeScale = () => {
    let volume = 0;
    
    if (state === 'talking') {
      // Используем максимальную громкость из input и output
      volume = Math.max(smoothedInputVolume, smoothedOutputVolume);
      // Тихая работа - отладка отключена
    }
    
    // Применяем ease-out кривую для более естественной реакции
    const easedVolume = 1 - Math.pow(1 - volume, 2);
    
    // Базовые значения + дополнительный скейл от громкости
    const baseScale = 1;
    const volumeMultiplier = easedVolume * 0.5; // Амплитуда ±50%
    const finalScale = Math.max(0.8, baseScale + volumeMultiplier);
    
    // Тихая работа - отладка отключена
    
    return finalScale;
  };

  return (
    <div 
      className={`relative w-32 h-32 ${className}`}
      style={{
        '--volume-scale': getVolumeScale(),
        '--input-volume': smoothedInputVolume,
        '--output-volume': smoothedOutputVolume,
      } as React.CSSProperties}
    >
      {/* Главный 3D шар */}
      <div className={`voice-orb voice-orb--${state}`}>
        {/* Внутренний core */}
        <div className="voice-orb__core" />
        
        {/* Внешние кольца для эффектов */}
        <div className="voice-orb__ring voice-orb__ring--outer" />
        <div className="voice-orb__ring voice-orb__ring--middle" />
        <div className="voice-orb__ring voice-orb__ring--inner" />
        
        {/* Эквалайзер убран - остается только базовая анимация */}
        
        {/* Частицы для connecting состояния */}
        {state === 'connecting' && (
          <div className="voice-orb__particles">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="voice-orb__particle"
                style={{
                  '--delay': `${i * 0.2}s`,
                  '--angle': `${i * 45}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
        
        {/* Анимационные элементы упрощены */}
        
        {/* Блики и отражения */}
        <div className="voice-orb__highlight" />
        <div className="voice-orb__reflection" />
      </div>
      
      {/* Тень под шаром */}
      <div className={`voice-orb__shadow voice-orb__shadow--${state}`} />
    </div>
  );
}