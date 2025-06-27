'use client';

import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '../components/NotificationSystem';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Удаление уведомления
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Базовая функция добавления уведомления
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { ...notification, id };
    
    setNotifications(prev => {
      const now = Date.now();
      
      // Проверяем дублирование только для недавних уведомлений (последние 2 секунды)
      const recentDuplicate = prev.some(existing => {
        const existingTime = parseInt(existing.id.split('_')[1]) || 0;
        const timeDiff = now - existingTime;
        
        return timeDiff < 2000 && // только недавние (2 секунды)
               existing.title === notification.title && 
               existing.message === notification.message &&
               existing.type === notification.type;
      });
      
      if (recentDuplicate) {
        return prev;
      }
      
      // Ограничиваем количество уведомлений (максимум 5)
      const updated = [...prev, newNotification];
      if (updated.length > 5) {
        updated.shift(); // удаляем самое старое
      }
      
      return updated;
    });
    return id;
  }, []);

  // ===== СПЕЦИАЛИЗИРОВАННЫЕ ФУНКЦИИ ДЛЯ РАЗНЫХ ТИПОВ =====

  // Информационное уведомление (автоматически исчезает)
  const showInfo = useCallback((title: string, message: string, duration = 5000) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }, [addNotification]);

  // Успешное уведомление (автоматически исчезает)
  const showSuccess = useCallback((title: string, message: string, duration = 4000) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }, [addNotification]);

  // Предупреждение (автоисчезает через 8 секунд)
  const showWarning = useCallback((
    title: string, 
    message: string, 
    onConfirm?: () => void,
    confirmText = 'Понятно',
    duration = 8000
  ) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      onConfirm,
      confirmText,
      duration
    });
  }, [addNotification]);

  // Ошибка (автоисчезает через 10 секунд)
  const showError = useCallback((
    title: string, 
    message: string, 
    onConfirm?: () => void,
    confirmText = 'Понятно',
    duration = 10000
  ) => {
    return addNotification({
      type: 'error',
      title,
      message,
      onConfirm,
      confirmText,
      duration
    });
  }, [addNotification]);

  // Сессионное уведомление (автоисчезает через 12 секунд)
  const showSession = useCallback((
    title: string, 
    message: string, 
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'Понятно',
    cancelText = 'Отмена',
    duration = 12000
  ) => {
    return addNotification({
      type: 'session',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      duration
    });
  }, [addNotification]);

  // ===== СПЕЦИАЛЬНЫЕ ФУНКЦИИ ДЛЯ ГОЛОСОВОГО АССИСТЕНТА =====

  // Уведомление об очереди
  const showQueue = useCallback((position: number, stats?: { activeSessions: number; queueLength: number }) => {
    const message = `Ваша позиция в очереди: ${position}\nОжидайте освобождения или попробуйте позже.${
      stats ? `\n\nСтатистика:\n• Активных сессий: ${stats.activeSessions}\n• В очереди: ${stats.queueLength}` : ''
    }`;

    return showSession(
      'Ассистент занят',
      message
    );
  }, [showSession]);

  // Предупреждение о времени сессии
  const showTimeWarning = useCallback((minutes: number) => {
    const message = `У вас осталось ${minutes} минут до автоматического завершения сессии.`;
    
    return showWarning(
      'Предупреждение о времени',
      message
    );
  }, [showWarning]);

  // Финальное предупреждение о времени
  const showFinalTimeWarning = useCallback((seconds: number) => {
    const message = `Сессия завершится через ${seconds} секунд. Завершайте свой вопрос.`;
    
    return showError(
      'Последнее предупреждение',
      message
    );
  }, [showError]);

  // Уведомление об истечении времени
  const showTimeExpired = useCallback(() => {
    const message = 'Время вашей сессии истекло (5 минут). Сессия завершена.\nМожете начать новую сессию.';
    
    return showError(
      'Время сессии истекло',
      message
    );
  }, [showError]);

  // Уведомление о начале сессии
  const showSessionStarted = useCallback((timeLimit: number) => {
    const message = `Подключение установлено. У вас есть ${timeLimit} минут.`;
    
    return showSuccess(
      'Сессия началась',
      message,
      3000
    );
  }, [showSuccess]);

  // Подтверждение с выбором (например, для критических действий)
  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Да',
    cancelText = 'Отмена'
  ) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      cancelText
    });
  }, [addNotification]);

  // Очистка всех уведомлений
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Удаление уведомлений определенного типа
  const clearByType = useCallback((type: NotificationType) => {
    setNotifications(prev => prev.filter(n => n.type !== type));
  }, []);

  return {
    // Состояние
    notifications,
    
    // Базовые функции
    addNotification,
    removeNotification,
    clearAll,
    clearByType,
    
    // Общие типы уведомлений
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showSession,
    showConfirm,
    
    // Специфичные для голосового ассистента
    showQueue,
    showTimeWarning,
    showFinalTimeWarning,
    showTimeExpired,
    showSessionStarted
  };
}; 