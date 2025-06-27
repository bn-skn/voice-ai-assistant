/**
 * 🔒 Менеджер сессий
 * Система контроля одновременных пользователей и ограничений времени
 */

import { 
  SESSION_LIMITS, 
  USER_LIMITS, 
  SESSION_MESSAGES,
  formatMessage,
  type SessionInfo,
  type QueuePosition,
  type SessionStats
} from '../config/session-limits';
import { createSessionLogger } from './logger';

// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ СЕРВЕРА =====
class SessionManager {
  private activeSessions: Map<string, SessionInfo> = new Map();
  private userQueue: QueuePosition[] = [];
  private cooldownUsers: Set<string> = new Set();
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private warningTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private lastSessionEndTime: number = 0; // Время последнего завершения сессии
  private processQueueTimeout: NodeJS.Timeout | null = null; // Для предотвращения накопления

  /**
   * Попытка подключения пользователя
   */
  async requestConnection(userId: string): Promise<{
    success: boolean;
    message: string;
    sessionId?: string;
    queuePosition?: number;
    timeLimit?: number;
  }> {
    // 1. Проверка cooldown
    if (this.cooldownUsers.has(userId)) {
      return {
        success: false,
        message: `⏳ Подождите ${USER_LIMITS.COOLDOWN_SECONDS} секунд перед повторным подключением.`
      };
    }

    // 2. Проверка активных сессий
    const activeSessionCount = this.activeSessions.size;
    
    if (activeSessionCount < USER_LIMITS.MAX_CONCURRENT_USERS) {
      // Место свободно - создаем сессию
      return this.createSession(userId);
    } else {
      // Место занято - добавляем в очередь
      return this.addToQueue(userId);
    }
  }

  /**
   * Создание новой сессии
   */
  private createSession(userId: string): {
    success: boolean;
    message: string;
    sessionId: string;
    timeLimit: number;
  } {
    const sessionId = `session_${Date.now()}_${userId}`;
    const startTime = Date.now();
    
    const sessionInfo: SessionInfo = {
      sessionId,
      userId,
      startTime,
      isActive: true,
      timeRemaining: SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES
    };

    this.activeSessions.set(sessionId, sessionInfo);
    
    // Создаем логгер для сессии
    const logger = createSessionLogger(sessionId, userId);
    logger.info('Session created', {
      timeLimit: SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES,
      warningTimes: SESSION_LIMITS.WARNING_TIMES,
      activeSessions: this.activeSessions.size
    });
    
    // Запускаем таймеры для этой сессии
    this.setupSessionTimers(sessionId);
    
    return {
      success: true,
      message: formatMessage(SESSION_MESSAGES.SESSION_STARTED, {
        minutes: SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES
      }),
      sessionId,
      timeLimit: SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES
    };
  }

  /**
   * Добавление в очередь
   */
  private addToQueue(userId: string): {
    success: boolean;
    message: string;
    queuePosition: number;
  } {
    const logger = createSessionLogger('queue', userId);
    
    // Проверяем, не в очереди ли уже пользователь
    const existingPosition = this.userQueue.findIndex(q => q.userId === userId);
    
    if (existingPosition !== -1) {
      // Уже в очереди, возвращаем текущую позицию
      logger.info('User already in queue', { position: existingPosition + 1 });
      return {
        success: false,
        message: formatMessage(SESSION_MESSAGES.QUEUE_POSITION_UPDATE, {
          position: existingPosition + 1
        }),
        queuePosition: existingPosition + 1
      };
    }

    // Добавляем в очередь
    const queuePosition: QueuePosition = {
      userId,
      position: this.userQueue.length + 1,
      joinTime: Date.now(),
      estimatedWaitTime: this.calculateEstimatedWaitTime()
    };

    this.userQueue.push(queuePosition);
    
    logger.info('User added to queue', {
      position: queuePosition.position,
      estimatedWaitTime: queuePosition.estimatedWaitTime,
      queueLength: this.userQueue.length
    });
    
    // Запускаем таймер очереди
    this.setupQueueTimer(userId);
    
    return {
      success: false,
      message: formatMessage(SESSION_MESSAGES.QUEUE_MESSAGE, {
        position: queuePosition.position
      }),
      queuePosition: queuePosition.position
    };
  }

  /**
   * Завершение сессии
   */
  async endSession(sessionId: string, reason: 'user_disconnect' | 'time_expired' | 'admin_stop' = 'user_disconnect'): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const logger = createSessionLogger(sessionId, session.userId);
    const sessionDuration = Date.now() - session.startTime;
    
    logger.info('Session ended', {
      reason,
      duration: `${Math.round(sessionDuration / 1000)}s`,
      activeSessions: this.activeSessions.size - 1
    });

    // Очищаем таймеры
    this.clearSessionTimers(sessionId);
    
    // Удаляем сессию
    this.activeSessions.delete(sessionId);
    
    // Обновляем время последнего завершения сессии
    this.lastSessionEndTime = Date.now();
    
    // Добавляем пользователя в cooldown
    this.cooldownUsers.add(session.userId);
    setTimeout(() => {
      this.cooldownUsers.delete(session.userId);
    }, USER_LIMITS.COOLDOWN_SECONDS * 1000);

    // Обрабатываем очередь с debounce для предотвращения накопления
    if (this.processQueueTimeout) {
      clearTimeout(this.processQueueTimeout);
    }
    
    this.processQueueTimeout = setTimeout(async () => {
      await this.processQueue();
      this.processQueueTimeout = null; // Сбрасываем после выполнения
    }, 500); // 500ms задержка для полной синхронизации
  }

  /**
   * Обработка очереди - подключение следующего пользователя
   */
  private async processQueue(): Promise<void> {
    if (this.userQueue.length === 0) return;
    if (this.activeSessions.size >= USER_LIMITS.MAX_CONCURRENT_USERS) return;

    // Увеличенная задержка для предотвращения race condition  
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Повторная проверка после задержки
    if (this.activeSessions.size >= USER_LIMITS.MAX_CONCURRENT_USERS) return;

    const nextUser = this.userQueue.shift();
    if (!nextUser) return;

    

    // Уведомляем пользователя что его очередь подошла
    // (В реальном приложении здесь был бы WebSocket push)
    
    // Обновляем позиции в очереди
    this.userQueue.forEach((user, index) => {
      user.position = index + 1;
    });
  }

  /**
   * Настройка таймеров для сессии
   */
  private setupSessionTimers(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const timers: NodeJS.Timeout[] = [];

    // Таймеры предупреждений
    SESSION_LIMITS.WARNING_TIMES.forEach(warningMinutes => {
      const warningTime = (SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES - warningMinutes) * 60 * 1000;
      
      const timer = setTimeout(() => {
        
        // В реальном приложении отправляем уведомление пользователю
      }, warningTime);
      
      timers.push(timer);
    });

    // Финальное предупреждение за 30 секунд
    const finalWarningTime = (SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES * 60 - SESSION_LIMITS.GRACEFUL_SHUTDOWN_SECONDS) * 1000;
    const finalTimer = setTimeout(() => {
      
    }, finalWarningTime);
    timers.push(finalTimer);

    // Основной таймер завершения
    const mainTimer = setTimeout(() => {
      
      this.endSession(sessionId, 'time_expired');
    }, SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES * 60 * 1000);

    this.sessionTimers.set(sessionId, mainTimer);
    this.warningTimers.set(sessionId, timers);
  }

  /**
   * Очистка всех таймеров сессии
   */
  private clearSessionTimers(sessionId: string): void {
    // Основной таймер
    const mainTimer = this.sessionTimers.get(sessionId);
    if (mainTimer) {
      clearTimeout(mainTimer);
      this.sessionTimers.delete(sessionId);
    }

    // Таймеры предупреждений
    const warningTimers = this.warningTimers.get(sessionId);
    if (warningTimers) {
      warningTimers.forEach(timer => clearTimeout(timer));
      this.warningTimers.delete(sessionId);
    }
  }

  /**
   * Настройка таймера очереди
   */
  private setupQueueTimer(userId: string): void {
    setTimeout(() => {
      const queueIndex = this.userQueue.findIndex(q => q.userId === userId);
      if (queueIndex !== -1) {
        this.userQueue.splice(queueIndex, 1);
        
        
        // Обновляем позиции
        this.userQueue.forEach((user, index) => {
          user.position = index + 1;
        });
      }
    }, USER_LIMITS.QUEUE_TIMEOUT_MINUTES * 60 * 1000);
  }

  /**
   * Расчет ожидаемого времени ожидания
   */
  private calculateEstimatedWaitTime(): number {
    if (this.activeSessions.size === 0) return 0;
    
    // Простая оценка: среднее оставшееся время активных сессий
    let totalRemainingTime = 0;
    for (const session of this.activeSessions.values()) {
      const elapsed = (Date.now() - session.startTime) / (1000 * 60); // в минутах
      const remaining = Math.max(0, SESSION_LIMITS.MAX_SESSION_DURATION_MINUTES - elapsed);
      totalRemainingTime += remaining;
    }
    
    return Math.ceil(totalRemainingTime / this.activeSessions.size);
  }

  /**
   * Получение статистики
   */
  getStats(): SessionStats {
    return {
      activeSessions: this.activeSessions.size,
      queueLength: this.userQueue.length,
      cooldownUsers: this.cooldownUsers.size,
      timeSinceLastSessionEnd: Date.now() - this.lastSessionEndTime // Время с последнего завершения
    };
  }

  /**
   * Проверка существования сессии
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Получение информации о сессии
   */
  getSessionInfo(sessionId: string): SessionInfo | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Принудительное завершение всех сессий (для админа)
   */
  async forceEndAllSessions(): Promise<void> {
    const logger = createSessionLogger('admin', 'system');
    
    logger.warn('Force ending all sessions', {
      activeSessions: this.activeSessions.size,
      queueLength: this.userQueue.length
    });
    
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      await this.endSession(sessionId, 'admin_stop');
    }
    
    // Очищаем очередь
    this.userQueue.length = 0;
    
    // Очищаем pending timeout
    if (this.processQueueTimeout) {
      clearTimeout(this.processQueueTimeout);
      this.processQueueTimeout = null;
    }
    
    logger.info('All sessions force ended', {
      sessionsEnded: sessionIds.length
    });
  }
}

// Синглтон менеджер сессий для всего сервера
export const sessionManager = new SessionManager();

// Экспорт для использования в API routes
export default sessionManager; 