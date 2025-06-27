'use client'

import { useState } from 'react'
import VoiceControls from './VoiceControls'
import SettingsModal from './SettingsModal'
import NotificationSystem from './NotificationSystem'
import { useNotifications } from '../hooks/useNotifications'
import { DEFAULT_SYSTEM_PROMPT } from '../config/system-prompt'

interface ChatContainerProps {
  className?: string
}

export default function ChatContainer({ className = '' }: ChatContainerProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [voiceState, setVoiceState] = useState<'disconnected' | 'connecting' | 'talking'>('disconnected')
  
  // === СИСТЕМА УВЕДОМЛЕНИЙ ===
  const notifications = useNotifications()
  
  // Wrapper для изменений состояния (тихая работа)
  const handleVoiceStateChange = (newState: 'disconnected' | 'connecting' | 'talking') => {
    setVoiceState(newState);
  }
  const [inputVolume, setInputVolume] = useState(0)
  const [outputVolume, setOutputVolume] = useState(0)

  const handleVolumeChange = (volume: number, type: 'input' | 'output') => {
    if (type === 'input') {
      setInputVolume(volume)
    } else {
      setOutputVolume(volume)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header с glassmorphism эффектом */}
      <header className="flex-shrink-0 glass border-b border-white/10 p-6 animate-fade-in-up">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              ИИ Голосовой Ассистент
            </h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 glass rounded-xl text-gray-600 hover:text-gray-800 transition-colors"
            title="Настройки"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col justify-center">
        {/* Voice Controls - теперь в центре */}
        <div className="flex-shrink-0 p-6">
          <VoiceControls
            systemPrompt={systemPrompt}
            onVoiceStateChange={handleVoiceStateChange}
            onVolumeChange={handleVolumeChange}
              voiceState={voiceState} 
              inputVolume={inputVolume}
              outputVolume={outputVolume}
            notifications={notifications}
            />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
      />

      {/* Система уведомлений */}
      <NotificationSystem
        notifications={notifications.notifications}
        onRemove={notifications.removeNotification}
      />
    </div>
  )
} 