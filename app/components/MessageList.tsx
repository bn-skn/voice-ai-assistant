/**
 * MessageList.tsx
 * 
 * КОМПОНЕНТ ДЛЯ БУДУЩЕГО ФУНКЦИОНАЛА
 * Готовый компонент для отображения истории сообщений чата.
 * В текущей версии приложения НЕ используется, так как чат работает только голосом.
 * 
 * Возможности:
 * - Отображение истории переписки пользователя и ассистента
 * - Автопрокрутка к новым сообщениям
 * - Интеграция с VoiceOrb для пустого состояния
 * - Адаптивный дизайн с анимациями
 * 
 * Можно активировать при добавлении функции сохранения истории разговоров.
 */

'use client'

import { useEffect, useRef } from 'react'
import VoiceOrb from './VoiceOrb'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

interface MessageListProps {
  messages: Message[]
  voiceState?: 'disconnected' | 'connecting' | 'talking'
  inputVolume?: number
  outputVolume?: number
}

export default function MessageList({ messages, voiceState = 'disconnected', inputVolume = 0, outputVolume = 0 }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in-up">
          {/* ЭПИЧНЫЙ 3D ШАР ВМЕСТО ИКОНКИ */}
          <div className="mb-12 flex justify-center">
            <VoiceOrb 
              state={voiceState} 
              className="mx-auto"
              inputVolume={inputVolume}
              outputVolume={outputVolume}
            />
          </div>
          
          {/* Заголовок */}
          <h2 className="heading-secondary">Начните разговор</h2>
          
          {/* Описание */}
          <p className="text-body">
            Нажмите кнопку "Начать разговор" и общайтесь <br />
            с ИИ-ассистентом голосом.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-6 pb-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
              message.sender === 'user' ? 'order-2' : 'order-1'
            }`}>
              {/* Avatar */}
              <div className={`flex items-start space-x-3 ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                }`}>
                  {message.sender === 'user' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </div>
                
                {/* Message bubble */}
                <div className={`card p-4 ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                    : 'bg-white/90'
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    message.sender === 'user' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {message.text}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 