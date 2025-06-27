/**
 * 📝 Система логирования для голосового ИИ-ассистента
 * Профессиональное логирование с ротацией файлов и структурированным выводом
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// ===== КОНФИГУРАЦИЯ ЛОГИРОВАНИЯ =====
const LOG_CONFIG = {
  // Уровни логирования
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  
  // Цвета для консольного вывода
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  },
  
  // Настройки файлов
  files: {
    maxSize: '20m',      // Максимальный размер файла
    maxFiles: '14d',     // Хранить логи 14 дней
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true  // Сжимать старые файлы
  }
} as const;

// Применяем цвета
winston.addColors(LOG_CONFIG.colors);

// ===== ФОРМАТЫ ЛОГИРОВАНИЯ =====

// Формат для консоли (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Формат для файлов (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ===== ТРАНСПОРТЫ =====

// Консольный транспорт для development
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: consoleFormat
});

// Файловые транспорты с ротацией
const errorFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
  datePattern: LOG_CONFIG.files.datePattern,
  level: 'error',
  format: fileFormat,
  maxSize: LOG_CONFIG.files.maxSize,
  maxFiles: LOG_CONFIG.files.maxFiles,
  zippedArchive: LOG_CONFIG.files.zippedArchive
});

const combinedFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'combined-%DATE%.log'),
  datePattern: LOG_CONFIG.files.datePattern,
  format: fileFormat,
  maxSize: LOG_CONFIG.files.maxSize,
  maxFiles: LOG_CONFIG.files.maxFiles,
  zippedArchive: LOG_CONFIG.files.zippedArchive
});

const httpFileTransport = new DailyRotateFile({
  filename: path.join('logs', 'http-%DATE%.log'),
  datePattern: LOG_CONFIG.files.datePattern,
  level: 'http',
  format: fileFormat,
  maxSize: LOG_CONFIG.files.maxSize,
  maxFiles: LOG_CONFIG.files.maxFiles,
  zippedArchive: LOG_CONFIG.files.zippedArchive
});

// ===== СОЗДАНИЕ LOGGER =====
const logger = winston.createLogger({
  levels: LOG_CONFIG.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: fileFormat,
  defaultMeta: {
    service: 'voice-ai-assistant',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    errorFileTransport,
    combinedFileTransport,
    httpFileTransport
  ],
  // Обработка неперехваченных исключений
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'exceptions-%DATE%.log'),
      datePattern: LOG_CONFIG.files.datePattern,
      format: fileFormat,
      maxSize: LOG_CONFIG.files.maxSize,
      maxFiles: LOG_CONFIG.files.maxFiles,
      zippedArchive: LOG_CONFIG.files.zippedArchive
    })
  ],
  // Обработка отклоненных промисов
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'rejections-%DATE%.log'),
      datePattern: LOG_CONFIG.files.datePattern,
      format: fileFormat,
      maxSize: LOG_CONFIG.files.maxSize,
      maxFiles: LOG_CONFIG.files.maxFiles,
      zippedArchive: LOG_CONFIG.files.zippedArchive
    })
  ]
});

// Добавляем консольный транспорт (всегда включен)
logger.add(consoleTransport);

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Создает контекстный логгер для сессии
 */
export const createSessionLogger = (sessionId: string, userId?: string) => {
  return {
    info: (message: string, meta?: any) => logger.info(message, { sessionId, userId, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { sessionId, userId, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { sessionId, userId, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { sessionId, userId, ...meta }),
    http: (message: string, meta?: any) => logger.http(message, { sessionId, userId, ...meta })
  };
};

/**
 * Создает контекстный логгер для API запросов
 */
export const createApiLogger = (method: string, url: string, requestId?: string) => {
  return {
    info: (message: string, meta?: any) => logger.info(message, { method, url, requestId, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { method, url, requestId, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { method, url, requestId, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { method, url, requestId, ...meta }),
    http: (message: string, meta?: any) => logger.http(message, { method, url, requestId, ...meta })
  };
};

/**
 * Логирование производительности
 */
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    slow: duration > 1000,
    ...meta
  });
};

/**
 * Логирование OpenAI API вызовов
 */
export const logOpenAICall = (
  endpoint: string, 
  status: number, 
  duration: number, 
  meta?: any
) => {
  const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
  logger[level](`OpenAI API: ${endpoint}`, {
    endpoint,
    status,
    duration: `${duration}ms`,
    success: status < 400,
    ...meta
  });
};

/**
 * Логирование WebRTC событий
 */
export const logWebRTC = (event: string, sessionId: string, meta?: any) => {
  logger.info(`WebRTC: ${event}`, {
    event,
    sessionId,
    component: 'webrtc',
    ...meta
  });
};

/**
 * Безопасное логирование ошибок (скрывает чувствительные данные)
 */
export const logSecureError = (error: Error, context?: string, meta?: any) => {
  // Удаляем потенциально чувствительные данные
  const sanitizedMeta = meta ? JSON.parse(JSON.stringify(meta, (key, value) => {
    if (typeof key === 'string' && 
        (key.toLowerCase().includes('token') || 
         key.toLowerCase().includes('key') || 
         key.toLowerCase().includes('secret') ||
         key.toLowerCase().includes('password'))) {
      return '[HIDDEN]';
    }
    return value;
  })) : {};

  logger.error(`Error${context ? ` in ${context}` : ''}`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    ...sanitizedMeta
  });
};

// ===== СОБЫТИЯ РОТАЦИИ ЛОГОВ =====
errorFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { 
    type: 'error',
    oldFile: oldFilename, 
    newFile: newFilename 
  });
});

combinedFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { 
    type: 'combined',
    oldFile: oldFilename, 
    newFile: newFilename 
  });
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
  logger.info('Application shutting down gracefully');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Application terminated gracefully');
  logger.end();
});

// ===== ЭКСПОРТ =====
export default logger;

// Экспортируем типы для TypeScript
export type LogLevel = keyof typeof LOG_CONFIG.levels;
export type LogMeta = Record<string, any>;

// Инициализационное сообщение
logger.info('Logger initialized', {
  nodeEnv: process.env.NODE_ENV,
  logLevel: logger.level,
  transports: logger.transports.length
});