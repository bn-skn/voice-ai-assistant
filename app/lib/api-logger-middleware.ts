/**
 * 🔍 Middleware для логирования API запросов
 * Автоматическое логирование всех HTTP запросов с метриками производительности
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger, logPerformance } from './logger';
import { randomUUID } from 'crypto';

// ===== ТИПЫ =====
interface RequestMetrics {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  contentLength?: number;
  error?: Error;
}

// ===== КОНФИГУРАЦИЯ =====
const LOGGING_CONFIG = {
  // Исключения из логирования (статические файлы)
  excludePaths: [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ],
  
  // Чувствительные заголовки (скрываем в логах)
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-admin-token'
  ],
  
  // Максимальный размер тела запроса для логирования
  maxBodySize: 1024 // 1KB
} as const;

/**
 * Проверяет, нужно ли логировать запрос
 */
const shouldLogRequest = (url: string): boolean => {
  return !LOGGING_CONFIG.excludePaths.some(path => url.includes(path));
};

/**
 * Безопасно извлекает заголовки (скрывает чувствительные)
 */
const sanitizeHeaders = (headers: Headers): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    if (LOGGING_CONFIG.sensitiveHeaders.includes(key.toLowerCase() as any)) {
      sanitized[key] = '[HIDDEN]';
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Безопасно извлекает тело запроса для логирования
 */
const sanitizeBody = async (request: NextRequest): Promise<string | null> => {
  try {
    // Клонируем запрос чтобы не нарушить оригинальный
    const clonedRequest = request.clone();
    const text = await clonedRequest.text();
    
    if (text.length > LOGGING_CONFIG.maxBodySize) {
      return `[TRUNCATED - ${text.length} bytes]`;
    }
    
    // Пытаемся парсить JSON и скрыть чувствительные данные
    try {
      const json = JSON.parse(text);
      const sanitized = JSON.stringify(json, (key, value) => {
        if (typeof key === 'string' && 
            (key.toLowerCase().includes('token') || 
             key.toLowerCase().includes('key') || 
             key.toLowerCase().includes('secret') ||
             key.toLowerCase().includes('password'))) {
          return '[HIDDEN]';
        }
        return value;
      });
      return sanitized;
    } catch {
      // Если не JSON, возвращаем как есть
      return text;
    }
  } catch {
    return null;
  }
};

/**
 * Извлекает IP адрес клиента
 */
const getClientIP = (request: NextRequest): string => {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
};

/**
 * Основной middleware для логирования API запросов
 */
export const apiLoggerMiddleware = async (
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const method = request.method;
  const url = request.url;
  
  // Проверяем, нужно ли логировать этот запрос
  if (!shouldLogRequest(url)) {
    return await handler();
  }
  
  // Создаем логгер для этого запроса
  const apiLogger = createApiLogger(method, url, requestId);
  
  // Собираем метрики запроса
  const metrics: RequestMetrics = {
    requestId,
    method,
    url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    startTime
  };
  
  // Логируем начало запроса
  apiLogger.http('Request started', {
    requestId,
    method,
    url: new URL(url).pathname,
    ip: metrics.ip,
    userAgent: metrics.userAgent,
    headers: sanitizeHeaders(request.headers)
  });
  
  // Логируем тело запроса (для POST/PUT/PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const body = await sanitizeBody(request);
    if (body) {
      apiLogger.debug('Request body', { requestId, body });
    }
  }
  
  let response: NextResponse;
  
  try {
    // Выполняем основной обработчик
    response = await handler();
    
    // Собираем метрики ответа
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = response.status;
    metrics.contentLength = parseInt(response.headers.get('content-length') || '0');
    
    // Логируем успешный ответ
    const logLevel = response.status >= 400 ? 'error' : 
                    response.status >= 300 ? 'warn' : 'info';
    
    apiLogger[logLevel]('Request completed', {
      requestId,
      status: response.status,
      duration: `${metrics.duration}ms`,
      contentLength: metrics.contentLength,
      success: response.status < 400
    });
    
    // Логируем производительность
    logPerformance(`${method} ${new URL(url).pathname}`, metrics.duration, {
      requestId,
      status: response.status
    });
    
    return response;
    
  } catch (error) {
    // Обрабатываем ошибки
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = error as Error;
    
    apiLogger.error('Request failed', {
      requestId,
      duration: `${metrics.duration}ms`,
      error: {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack
      }
    });
    
    // Перебрасываем ошибку дальше
    throw error;
  }
};

/**
 * Вспомогательная функция для создания обработчика с логированием
 */
export const withApiLogging = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    return apiLoggerMiddleware(req, () => handler(req));
  };
};

/**
 * Логирование специфичных событий API
 */
export const logApiEvent = (
  event: string,
  requestId: string,
  meta?: Record<string, any>
) => {
  const apiLogger = createApiLogger('EVENT', event, requestId);
  apiLogger.info(`API Event: ${event}`, meta);
};

/**
 * Логирование ошибок валидации
 */
export const logValidationError = (
  field: string,
  value: any,
  requestId: string,
  meta?: Record<string, any>
) => {
  const apiLogger = createApiLogger('VALIDATION', 'error', requestId);
  apiLogger.warn('Validation error', {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value,
    ...meta
  });
};

/**
 * Логирование rate limiting
 */
export const logRateLimit = (
  ip: string,
  endpoint: string,
  requestId: string,
  meta?: Record<string, any>
) => {
  const apiLogger = createApiLogger('RATE_LIMIT', endpoint, requestId);
  apiLogger.warn('Rate limit exceeded', {
    ip,
    endpoint,
    ...meta
  });
}; 