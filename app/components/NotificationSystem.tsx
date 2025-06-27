'use client';

import { useState, useEffect } from 'react';

// ===== ТИПЫ УВЕДОМЛЕНИЙ =====
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'session';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // в миллисекундах, undefined = требует закрытия вручную
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

// ===== ИКОНКИ ДЛЯ РАЗНЫХ ТИПОВ =====
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconClass = "w-6 h-6";
  
  switch (type) {
    case 'success':
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
      
    case 'warning':
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      );
      
    case 'error':
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
      
    case 'session':
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
      
    default: // 'info'
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
};

// ===== ИНДИВИДУАЛЬНОЕ УВЕДОМЛЕНИЕ =====
const NotificationItem = ({ 
  notification, 
  onRemove, 
  isExiting 
}: { 
  notification: Notification; 
  onRemove: (id: string) => void;
  isExiting: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Плавное появление
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Автоматическое скрытие если есть duration
    if (notification.duration) {
      // Основной таймер как fallback
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration + 100); // +100ms запас для завершения анимации
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onRemove]);

  // Слушаем завершение анимации прогресс-бара для точного удаления
  useEffect(() => {
    if (!notification.duration) return;

    // Используем ref для надежного доступа к элементу
    const findProgressBar = () => document.querySelector(`[data-notification-id="${notification.id}"] .progress-bar`);
    
    const handleAnimationEnd = (event: Event) => {
      const animEvent = event as AnimationEvent;
      if (animEvent.animationName === 'progress-countdown') {
        onRemove(notification.id);
      }
    };

    // Ищем элемент с небольшой задержкой если сразу не найден
    const progressBar = findProgressBar();
    if (progressBar) {
      progressBar.addEventListener('animationend', handleAnimationEnd);
      return () => {
        // Безопасное удаление listener
        try {
          progressBar.removeEventListener('animationend', handleAnimationEnd);
        } catch (error) {
          // Игнорируем ошибку удаления слушателя
        }
      };
    } else {
      // Fallback: если элемент не найден, ищем через небольшую задержку
      const timeout = setTimeout(() => {
        const delayedProgressBar = findProgressBar();
        if (delayedProgressBar) {
          delayedProgressBar.addEventListener('animationend', handleAnimationEnd);
        }
      }, 50);
      
      return () => clearTimeout(timeout);
    }
  }, [notification.duration, notification.id, onRemove]);

  const handleClose = () => {
    onRemove(notification.id);
  };

  const handleConfirm = () => {
    if (notification.onConfirm) {
      notification.onConfirm();
    }
    onRemove(notification.id);
  };

  const handleCancel = () => {
    if (notification.onCancel) {
      notification.onCancel();
    }
    onRemove(notification.id);
  };

  // Определяем цветовую схему по типу
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200/40 bg-green-50/30 backdrop-blur-lg';
      case 'warning':
        return 'border-amber-200/40 bg-amber-50/30 backdrop-blur-lg';
      case 'error':
        return 'border-red-200/40 bg-red-50/30 backdrop-blur-lg';
      case 'session':
        return 'border-blue-200/40 bg-blue-50/30 backdrop-blur-lg';
      default:
        return 'border-gray-200/40 bg-white/90 backdrop-blur-lg';
    }
  };

  const getTitleColor = () => {
    switch (notification.type) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-amber-800'; 
      case 'error': return 'text-red-800';
      case 'session': return 'text-blue-800';
      default: return 'text-blue-800';
    }
  };

  const getMessageColor = () => {
    switch (notification.type) {
      case 'success': return 'text-green-700';
      case 'warning': return 'text-amber-700';
      case 'error': return 'text-red-700';
      case 'session': return 'text-blue-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <div
      data-notification-id={notification.id}
      className={`
        relative w-full transform transition-all duration-300 ease-out pointer-events-auto
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        ${isExiting ? 'translate-y-2 opacity-0 scale-95' : ''}
      `}
    >
      {/* Основная карточка уведомления */}
      <div className={`
        relative rounded-xl border shadow-md p-4
        ${getTypeStyles()}
        hover:shadow-lg transition-all duration-200
      `}>


        <div className="flex items-start space-x-3">
          <NotificationIcon type={notification.type} />
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${getTitleColor()}`}>
              {notification.title}
            </h3>
            <div className={`mt-1 text-xs ${getMessageColor()} whitespace-pre-line leading-relaxed`}>
              {notification.message}
            </div>
            
            {/* Кнопки действий */}
            {(notification.onConfirm || notification.onCancel) && (
              <div className="mt-3 flex space-x-2">
                {notification.onConfirm && (
                  <button
                    onClick={handleConfirm}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                      ${notification.type === 'error' 
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                      focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-400
                    `}
                  >
                    {notification.confirmText || 'Понятно'}
                  </button>
                )}
                
                {notification.onCancel && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-400"
                  >
                    {notification.cancelText || 'Отмена'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Кнопка закрытия (только если нет обязательных действий) */}
          {!notification.onConfirm && !notification.onCancel && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Прогресс-бар для автоматических уведомлений */}
        {notification.duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
            <div 
              className={`progress-bar h-full ${
                notification.type === 'success' ? 'bg-green-400' :
                notification.type === 'warning' ? 'bg-amber-400' :
                notification.type === 'error' ? 'bg-red-400' :
                'bg-blue-400'
              }`}
              style={{
                animation: `progress-countdown ${notification.duration}ms linear`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ===== ОСНОВНОЙ КОМПОНЕНТ СИСТЕМЫ УВЕДОМЛЕНИЙ =====
const NotificationSystem = ({ notifications, onRemove }: NotificationSystemProps) => {
  const [exitingNotifications, setExitingNotifications] = useState<Set<string>>(new Set());

  const handleRemove = (id: string) => {
    // Начинаем анимацию выхода
    setExitingNotifications(prev => new Set(prev).add(id));
    
    // Удаляем через время анимации
    setTimeout(() => {
      onRemove(id);
      setExitingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  if (notifications.length === 0) return null;

  return (
    <>
      {/* Контейнер уведомлений в правом нижнем углу */}
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={handleRemove}
            isExiting={exitingNotifications.has(notification.id)}
          />
        ))}
      </div>
    </>
  );
};

export default NotificationSystem;

// ===== CSS АНИМАЦИИ (добавить в globals.css) =====
const styles = `
@keyframes progress-countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`; 