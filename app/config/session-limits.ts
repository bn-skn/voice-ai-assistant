/**
 * 🔒 Конфигурация ограничений сессии
 * Система защиты от многопользовательского доступа и контроль времени
 */

// ===== НАСТРОЙКИ ВРЕМЕНИ СЕССИИ =====
export const SESSION_LIMITS = {
  // Максимальное время сессии в минутах (по умолчанию 5 минут)
  MAX_SESSION_DURATION_MINUTES: 5,
  
  // Предупреждения о времени (в минутах до окончания)
  WARNING_TIMES: [3, 2, 1], // Предупредим за 3, 2 и 1 минуту
  
  // Интервал проверки времени в секундах
  TIME_CHECK_INTERVAL_SECONDS: 30,
  
  // Мягкое завершение (время на завершение текущего ответа в секундах)
  GRACEFUL_SHUTDOWN_SECONDS: 30
} as const;

// ===== НАСТРОЙКИ БЛОКИРОВКИ ПОЛЬЗОВАТЕЛЕЙ =====
export const USER_LIMITS = {
  // Максимальное количество одновременных пользователей
  MAX_CONCURRENT_USERS: 1,
  
  // Время ожидания освобождения сессии (минуты)
  QUEUE_TIMEOUT_MINUTES: 10,
  
  // Интервал проверки очереди (секунды)
  QUEUE_CHECK_INTERVAL_SECONDS: 5,
  
  // Время блокировки после дисконнекта (секунды, защита от быстрых переподключений)
  COOLDOWN_SECONDS: 3
} as const;

// ===== СООБЩЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====
export const SESSION_MESSAGES = {
  // Когда пользователь пытается подключиться, но место занято
  QUEUE_MESSAGE: `🔒 Ассистент сейчас занят другим пользователем.\n⏰ Место в очереди: {position}\n⏳ Ожидайте освобождения или попробуйте позже.`,
  
  // Предупреждения о времени
  TIME_WARNING: `⏰ У вас осталось {minutes} минут до автоматического завершения сессии.`,
  TIME_WARNING_FINAL: `⚠️ Сессия завершится через {seconds} секунд. Завершайте свой вопрос.`,
  
  // Завершение сессии
  SESSION_EXPIRED: `⏰ Время сессии истекло (${SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES} минут). Сессия завершена.\n🔄 Можете начать новую сессию.`,
  SESSION_INTERRUPTED: `🔒 Ваша сессия была прервана администратором или техническими причинами.`,
  
  // Успешное подключение
  SESSION_STARTED: `✅ Подключение установлено. У вас есть ${SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES} минут.`,
  
  // Очередь
  QUEUE_POSITION_UPDATE: `📍 Ваша позиция в очереди: {position}`,
  QUEUE_YOUR_TURN: `🎉 Ваша очередь! Подключаемся...`,
  QUEUE_TIMEOUT: `⏰ Время ожидания в очереди истекло (${USER_LIMITS.QUEUE_TIMEOUT_MINUTES} минут). Попробуйте позже.`
} as const;

// ===== ТИПЫ =====
export interface SessionInfo {
  sessionId: string;
  userId: string;
  startTime: number;
  isActive: boolean;
  timeRemaining: number;
}

export interface QueuePosition {
  userId: string;
  position: number;
  joinTime: number;
  estimatedWaitTime: number; // в минутах
}

export interface SessionStats {
  activeSessions: number;
  queueLength: number;
  cooldownUsers: number;
  timeSinceLastSessionEnd: number;
}

// ===== УТИЛИТЫ =====
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  }
  return `${minutes}м`;
};

export const formatMessage = (template: string, params: Record<string, any>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
}; 