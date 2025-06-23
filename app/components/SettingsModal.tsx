'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_SYSTEM_PROMPT } from '../config/system-prompt'
import { validateUserPrompt } from '../config/protected-prompt'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  systemPrompt: string
  onSystemPromptChange: (prompt: string) => void
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  systemPrompt, 
  onSystemPromptChange 
}: SettingsModalProps) {
  const [tempPrompt, setTempPrompt] = useState(systemPrompt)
  const [isClosing, setIsClosing] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)

  // Синхронизируем tempPrompt с systemPrompt при открытии
  useEffect(() => {
    if (isOpen) {
      setTempPrompt(systemPrompt)
      setIsClosing(false)
    }
  }, [isOpen, systemPrompt])

  const handleSave = () => {
    const validation = validateUserPrompt(tempPrompt);
    if (!validation.isValid) {
      setValidationWarning(validation.warning || 'Обнаружены потенциально опасные инструкции');
      return;
    }
    onSystemPromptChange(tempPrompt)
    handleClose()
  }

  const handlePromptChange = (newPrompt: string) => {
    setTempPrompt(newPrompt);
    // Сбрасываем предупреждение при изменении
    if (validationWarning) {
      setValidationWarning(null);
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    // Даем время для анимации закрытия
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleReset = () => {
    setTempPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  // Обработка нажатия Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Блокируем скролл
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={(e) => {
        // Закрываем при клике на фон
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className={`card w-full max-w-2xl max-h-[90vh] overflow-hidden ${
        isClosing ? 'animate-modal-out' : 'animate-modal-in'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="heading-secondary !mb-0">Настройки</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 glass rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Системный промпт
                </h3>
                <p className="text-sm text-gray-600">
                  Настройте поведение и стиль общения ИИ-ассистента
                </p>
              </div>
              <button
                onClick={handleReset}
                className="glass px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Сбросить
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={tempPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                className={`w-full h-40 p-4 glass rounded-2xl resize-none focus:outline-none focus:ring-4 transition-all duration-200 text-gray-800 placeholder-gray-500 ${
                  validationWarning ? 'focus:ring-red-300/50 border-red-300' : 'focus:ring-purple-300/50'
                }`}
                placeholder="Введите системный промпт..."
                rows={6}
              />
              
              {/* Предупреждение о валидации */}
              {validationWarning && (
                <div className="glass p-4 rounded-2xl border border-red-200/50 bg-red-50/50">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-1">Предупреждение безопасности</p>
                      <p className="text-red-700">{validationWarning}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-800 mb-1">Информация о системном промпте:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Защищенная часть:</strong> Базовые инструкции безопасности (скрыты)</li>
                      <li>• <strong>Ваша часть:</strong> Настройка роли, стиля и специализации</li>
                      <li>• Укажите тон общения (формальный/дружелюбный)</li>
                      <li>• Добавьте конкретные инструкции по поведению</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
          <button
            onClick={handleClose}
            className="px-6 py-3 glass rounded-xl font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            <span>Сохранить</span>
          </button>
        </div>
      </div>
    </div>
  )
} 