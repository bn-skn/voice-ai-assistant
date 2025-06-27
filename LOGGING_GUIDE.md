# 📝 Руководство по системе логирования

Профессиональная система логирования для голосового ИИ-ассистента с ротацией файлов, структурированным выводом и контекстной информацией.

## 🎯 Обзор системы

### Основные возможности
- **Структурированное логирование** в JSON формате для production
- **Ротация логов** по времени и размеру (20MB, 14 дней)
- **Разные уровни логирования**: error, warn, info, http, debug
- **Контекстные логгеры** для сессий и API запросов
- **Безопасное логирование** с автоматическим сокрытием чувствительных данных
- **Автоматическое логирование API** через middleware

### Архитектура
```
app/lib/
├── logger.ts                  # Основной модуль логирования
└── api-logger-middleware.ts   # Middleware для API запросов

logs/                          # Папка с файлами логов
├── combined-YYYY-MM-DD.log    # Все логи
├── error-YYYY-MM-DD.log       # Только ошибки
├── http-YYYY-MM-DD.log        # HTTP запросы
├── exceptions-YYYY-MM-DD.log  # Неперехваченные исключения
└── rejections-YYYY-MM-DD.log  # Отклоненные промисы
```

## 🛠️ Использование

### Базовое логирование

```typescript
import logger from '../lib/logger';

// Разные уровни логирования
logger.info('Информационное сообщение');
logger.warn('Предупреждение');
logger.error('Ошибка');
logger.debug('Отладочная информация');
logger.http('HTTP запрос');

// С дополнительными метаданными
logger.info('Пользователь подключился', {
  userId: 'user123',
  ip: '192.168.1.1',
  timestamp: Date.now()
});
```

### Контекстные логгеры

#### Логгер для сессий
```typescript
import { createSessionLogger } from '../lib/logger';

const sessionLogger = createSessionLogger('session_123', 'user_456');

sessionLogger.info('Сессия создана');
sessionLogger.warn('Предупреждение о времени');
sessionLogger.error('Ошибка в сессии');
```

#### Логгер для API запросов
```typescript
import { createApiLogger } from '../lib/logger';

const apiLogger = createApiLogger('POST', '/api/session', 'req_789');

apiLogger.info('Запрос обработан');
apiLogger.error('Ошибка валидации');
```

### Специализированные функции

#### Логирование производительности
```typescript
import { logPerformance } from '../lib/logger';

const startTime = Date.now();
// ... выполнение операции
const duration = Date.now() - startTime;

logPerformance('database_query', duration, { 
  query: 'SELECT * FROM users',
  rows: 150 
});
```

#### Логирование OpenAI API
```typescript
import { logOpenAICall } from '../lib/logger';

const startTime = Date.now();
const response = await fetch('https://api.openai.com/v1/...');
const duration = Date.now() - startTime;

logOpenAICall('chat/completions', response.status, duration, {
  model: 'gpt-4o',
  tokens: 1500
});
```

#### Безопасное логирование ошибок
```typescript
import { logSecureError } from '../lib/logger';

try {
  // ... код который может упасть
} catch (error) {
  logSecureError(error as Error, 'user_authentication', {
    userId: 'user123',
    apiKey: 'sk-secret...' // автоматически скроется
  });
}
```

#### Логирование WebRTC событий
```typescript
import { logWebRTC } from '../lib/logger';

logWebRTC('connection_established', 'session_123', {
  peerConnectionState: 'connected',
  iceConnectionState: 'connected'
});
```

## 🔧 API Middleware

### Автоматическое логирование

Все API routes автоматически логируются через middleware:

```typescript
// app/api/example/route.ts
import { withApiLogging } from '../../lib/api-logger-middleware';

async function handlePOST(req: NextRequest) {
  // Ваш код API
  return NextResponse.json({ success: true });
}

export const POST = withApiLogging(handlePOST);
```

### Специальные события API

```typescript
import { 
  logApiEvent, 
  logValidationError, 
  logRateLimit 
} from '../../lib/api-logger-middleware';

// Событие API
logApiEvent('user_login', requestId, { userId: 'user123' });

// Ошибка валидации
logValidationError('email', 'invalid-email', requestId);

// Rate limiting
logRateLimit('192.168.1.1', '/api/session', requestId);
```

## 📊 Структура логов

### Формат JSON (production)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Session created",
  "service": "voice-ai-assistant",
  "environment": "production",
  "sessionId": "session_1642248645123_user456",
  "userId": "user456",
  "timeLimit": 5,
  "warningTimes": [3, 2, 1],
  "activeSessions": 1
}
```

### Формат консоли (development)
```
[10:30:45] info: Session created
{
  "sessionId": "session_1642248645123_user456",
  "userId": "user456",
  "timeLimit": 5,
  "activeSessions": 1
}
```

## 🔒 Безопасность

### Автоматическое сокрытие чувствительных данных

Следующие поля автоматически скрываются в логах:
- `token`, `apiToken`, `accessToken`
- `key`, `apiKey`, `secretKey`
- `secret`, `clientSecret`
- `password`, `pwd`
- Authorization headers
- Cookie headers

### Пример
```typescript
logger.info('API запрос', {
  apiKey: 'sk-secret123',        // → '[HIDDEN]'
  token: 'bearer-token',         // → '[HIDDEN]'
  userId: 'user123',             // → 'user123'
  data: { password: 'secret' }   // → { password: '[HIDDEN]' }
});
```

## ⚙️ Конфигурация

### Переменные окружения

```env
# Уровень логирования
LOG_LEVEL=info  # debug, info, warn, error

# Окружение
NODE_ENV=production  # development, production
```

### Настройки ротации

```typescript
// app/lib/logger.ts
const LOG_CONFIG = {
  files: {
    maxSize: '20m',      // Максимальный размер файла
    maxFiles: '14d',     // Хранить логи 14 дней
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true  // Сжимать старые файлы
  }
}
```

## 📈 Мониторинг

### Типы файлов логов

1. **combined-YYYY-MM-DD.log** - Все логи
2. **error-YYYY-MM-DD.log** - Только ошибки (level: error)
3. **http-YYYY-MM-DD.log** - HTTP запросы (level: http)
4. **exceptions-YYYY-MM-DD.log** - Неперехваченные исключения
5. **rejections-YYYY-MM-DD.log** - Отклоненные промисы

### Команды для мониторинга

```bash
# Просмотр логов в реальном времени
tail -f logs/combined-$(date +%Y-%m-%d).log

# Поиск ошибок
grep "level\":\"error" logs/combined-$(date +%Y-%m-%d).log

# Анализ производительности
grep "Performance:" logs/combined-$(date +%Y-%m-%d).log

# Статистика по сессиям
grep "Session created\|Session ended" logs/combined-$(date +%Y-%m-%d).log
```

### Анализ с jq

```bash
# Топ ошибок
cat logs/error-$(date +%Y-%m-%d).log | jq -r '.message' | sort | uniq -c | sort -nr

# Средняя длительность API запросов
cat logs/http-$(date +%Y-%m-%d).log | jq -r '.duration' | sed 's/ms//' | awk '{sum+=$1; count++} END {print sum/count "ms"}'

# Активность по часам
cat logs/combined-$(date +%Y-%m-%d).log | jq -r '.timestamp' | cut -c12-13 | sort | uniq -c
```

## 🚀 Production рекомендации

### Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - ./logs:/app/logs  # Монтируем папку логов
    environment:
      - LOG_LEVEL=info
      - NODE_ENV=production
```

### Nginx логирование

```nginx
# nginx.conf
access_log /var/log/nginx/voice-assistant-access.log;
error_log /var/log/nginx/voice-assistant-error.log;
```

### Ротация системных логов

```bash
# /etc/logrotate.d/voice-assistant
/path/to/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 app app
}
```

### Мониторинг дискового пространства

```bash
# Проверка размера логов
du -sh logs/

# Очистка старых логов (старше 30 дней)
find logs/ -name "*.log" -mtime +30 -delete
```

## 🔧 Troubleshooting

### Частые проблемы

#### Логи не создаются
```bash
# Проверить права доступа
ls -la logs/

# Создать папку если не существует
mkdir -p logs && chmod 755 logs
```

#### Большой размер логов
```bash
# Проверить настройки ротации
grep -r "maxSize\|maxFiles" app/lib/logger.ts

# Принудительная ротация
npm run rotate-logs  # если настроен скрипт
```

#### Производительность
```typescript
// Уменьшить уровень логирования в production
process.env.LOG_LEVEL = 'warn'; // вместо 'debug'

// Отключить консольный вывод в production
if (process.env.NODE_ENV === 'production') {
  logger.remove(consoleTransport);
}
```

## 📚 Примеры интеграции

### Session Manager
```typescript
// app/lib/session-manager.ts
import { createSessionLogger } from './logger';

class SessionManager {
  private createSession(userId: string) {
    const logger = createSessionLogger(sessionId, userId);
    logger.info('Session created', { timeLimit, activeSessions });
  }
}
```

### API Routes
```typescript
// app/api/example/route.ts
import { withApiLogging, logApiEvent } from '../../lib/api-logger-middleware';

async function handlePOST(req: NextRequest) {
  const requestId = randomUUID();
  
  logApiEvent('operation_started', requestId, { operation: 'example' });
  
  // ... логика API
  
  return NextResponse.json({ success: true });
}

export const POST = withApiLogging(handlePOST);
```

---

**💡 Совет**: Используйте структурированное логирование с контекстом для лучшего анализа и мониторинга в production. 