# 📝 Полное руководство по системе логирования

Профессиональная система логирования для Voice AI Assistant с автоматической ротацией, структурированным выводом и удобными инструментами для мониторинга.

## 🎯 Обзор системы

### ✨ Ключевые возможности
- **📊 Структурированное логирование** в JSON формате для production
- **🔄 Автоматическая ротация** по времени и размеру (20MB, 14 дней)
- **📈 5 уровней логирования**: error, warn, info, http, debug
- **🎯 Контекстные логгеры** для сессий и API запросов
- **🔐 Безопасное логирование** с автоматическим сокрытием чувствительных данных
- **⚡ Автоматическое логирование API** через middleware
- **🛠️ Удобные инструменты** для просмотра и анализа логов

### 🏗️ Архитектура
```
📁 app/lib/
├── 📄 logger.ts                  # Основной модуль логирования (Winston)
└── 📄 api-logger-middleware.ts   # Middleware для автоматического логирования API

📁 logs/                          # Папка с файлами логов
├── 📋 combined-YYYY-MM-DD.log    # Все логи объединенные
├── ❌ error-YYYY-MM-DD.log       # Только ошибки (error + warn)
├── 🌐 http-YYYY-MM-DD.log        # HTTP запросы и API
├── 🎯 session-YYYY-MM-DD.log     # Логи сессий и пользователей
├── 💥 exceptions-YYYY-MM-DD.log  # Неперехваченные исключения
└── 🚫 rejections-YYYY-MM-DD.log  # Отклоненные промисы

📁 scripts/
└── 📄 log-viewer.sh              # Инструмент для просмотра логов
```

## 🚀 Быстрый доступ к логам (для администраторов)

### 1️⃣ Через npm команды (рекомендуется)
```bash
# === ПРОСМОТР ЛОГОВ ===
npm run logs:live      # 📡 Логи в реальном времени
npm run logs:errors    # ❌ Только ошибки и предупреждения
npm run logs:sessions  # 🎯 Логи сессий пользователей
npm run logs:api       # 🌐 HTTP запросы и API вызовы
npm run logs:stats     # 📊 Статистика логов за сегодня

# === УПРАВЛЕНИЕ ===
npm run logs:clean     # 🧹 Очистка старых логов
npm run logs           # 📖 Справка по всем командам
```

### 2️⃣ Через скрипт напрямую
```bash
# Универсальный скрипт
./scripts/log-viewer.sh live     # Логи в реальном времени
./scripts/log-viewer.sh errors   # Только ошибки
./scripts/log-viewer.sh stats    # Статистика
./scripts/log-viewer.sh help     # Справка

# Поиск по содержимому
./scripts/log-viewer.sh search "OpenAI"
./scripts/log-viewer.sh search "session" --lines 50
```

### 3️⃣ Через алиасы (после `source aliases.sh`)
```bash
# Короткие команды
logs-live              # Логи в реальном времени
logs-errors            # Только ошибки
logs-sessions          # Логи сессий
logs-api               # HTTP запросы
logs-stats             # Статистика
logs-clean             # Очистка
```

## 🛠️ Использование в коде

### Базовое логирование
```typescript
import logger from '../lib/logger';

// === БАЗОВЫЕ УРОВНИ ===
logger.info('Пользователь подключился к системе');
logger.warn('Превышен лимит запросов');
logger.error('Ошибка подключения к OpenAI API');
logger.debug('Отладочная информация для разработки');
logger.http('HTTP запрос обработан');

// === С ДОПОЛНИТЕЛЬНЫМИ МЕТАДАННЫМИ ===
logger.info('Сессия создана', {
  sessionId: 'sess-123',
  userId: 'user-456',
  ip: '192.168.1.100',
  userAgent: 'Chrome/91.0',
  timestamp: Date.now()
});

logger.error('API ошибка', {
  error: error.message,
  stack: error.stack,
  endpoint: '/api/session',
  statusCode: 500,
  duration: 1500
});
```

### Контекстное логирование для API
```typescript
// В API роутах автоматически добавляется контекст
export async function POST(request: Request) {
  // API логирование происходит автоматически через middleware
  
  // Дополнительные логи с контекстом
  logger.info('Создание новой сессии', {
    method: 'POST',
    endpoint: '/api/session',
    requestId: 'req-123',  // Автоматически генерируется
  });
}
```

### Логирование сессий
```typescript
// Специальный логгер для пользовательских сессий
logger.info('Session Event', {
  event: 'session_start',
  sessionId: sessionId,
  userCount: activeUsers,
  queueLength: waitingQueue.length,
  memoryUsage: process.memoryUsage().heapUsed
});
```

## 📊 Мониторинг и анализ

### Просмотр логов в реальном времени
```bash
# Все логи
npm run logs:live

# Только ошибки (фильтрация)
npm run logs:errors

# Логи с фильтрацией по тексту
tail -f logs/combined-$(date +%Y-%m-%d).log | grep "OpenAI"

# Логи сессий в реальном времени
npm run logs:sessions
```

### Анализ ошибок
```bash
# Количество ошибок за сегодня
npm run logs:stats

# Поиск конкретной ошибки
grep -n "500" logs/error-$(date +%Y-%m-%d).log

# Последние 50 ошибок
tail -50 logs/error-$(date +%Y-%m-%d).log
```

### Статистика производительности
```bash
# Статистика API запросов
grep "Request completed" logs/http-$(date +%Y-%m-%d).log | \
  jq -r '.duration' | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count "ms, Total:", count}'

# Медленные запросы (>1000ms)
grep "Request completed" logs/http-$(date +%Y-%m-%d).log | \
  jq 'select(.duration | tonumber > 1000)'
```

### Анализ использования
```bash
# Количество активных сессий за день
grep "session_start" logs/session-$(date +%Y-%m-%d).log | wc -l

# Самые популярные API эндпоинты
grep "Request completed" logs/http-$(date +%Y-%m-%d).log | \
  jq -r '.url' | sort | uniq -c | sort -nr
```

## 🔧 Конфигурация логгера

### Настройки уровней (app/lib/logger.ts)
```typescript
const config = {
  level: process.env.LOG_LEVEL || 'info',  // debug, info, warn, error
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Консоль (только в development)
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    
    // Файлы с ротацией
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
};
```

### Переменные окружения
```env
# В .env.local
LOG_LEVEL=info          # debug, info, warn, error
NODE_ENV=production     # Влияет на формат логов
```

## 🚨 Troubleshooting и отладка

### Частые проблемы

#### ❌ Логи не создаются
```bash
# Проверить права доступа
ls -la logs/
chmod 755 logs/

# Проверить место на диске
df -h /

# Перезапустить приложение
npm run docker:restart
```

#### ❌ Логи слишком большие
```bash
# Очистить старые логи
npm run logs:clean

# Проверить размер
du -sh logs/

# Настроить автоматическую ротацию (server-setup/monitor_logs.sh)
sudo /root/monitor_logs.sh
```

#### ❌ Отсутствуют логи ошибок
```bash
# Проверить уровень логирования
grep LOG_LEVEL .env.local

# Установить правильный уровень
echo "LOG_LEVEL=error" >> .env.local
npm run docker:restart
```

### Диагностические команды
```bash
# Проверка работы логгера
curl http://localhost:3000/api/session?action=stats
tail -1 logs/http-$(date +%Y-%m-%d).log

# Проверка структуры логов
head -5 logs/combined-$(date +%Y-%m-%d).log | jq '.'

# Проверка ротации
ls -la logs/ | head -10
```

## 📈 Мониторинг в production

### Автоматические проверки
```bash
# Добавить в cron для мониторинга критических ошибок
echo "*/10 * * * * tail -100 ~/voice-ai-assistant/logs/error-\$(date +\%Y-\%m-\%d).log | grep -q 'CRITICAL' && echo 'Critical error detected' | mail admin@domain.com" | crontab -

# Мониторинг размера логов (уже есть в server-setup/monitor_logs.sh)
echo "0 9 * * * /root/monitor_logs.sh >> /root/monitor.log 2>&1" | crontab -
```

### Интеграция с внешними системами
```bash
# Отправка логов в внешний сервис (например, Elasticsearch)
tail -f logs/combined-$(date +%Y-%m-%d).log | \
  while read line; do
    curl -X POST "http://elasticsearch:9200/voice-assistant-logs/_doc" \
         -H "Content-Type: application/json" \
         -d "$line"
  done
```

### Алерты и уведомления
```bash
# Скрипт для отправки уведомлений о критических ошибках
#!/bin/bash
ERROR_COUNT=$(grep -c "CRITICAL\|FATAL" logs/error-$(date +%Y-%m-%d).log)
if [ "$ERROR_COUNT" -gt 5 ]; then
  echo "High error rate detected: $ERROR_COUNT critical errors today" | \
    mail -s "Voice AI Assistant Alert" admin@domain.com
fi
```

## 🧹 Управление местом на диске

### Автоматическая очистка
```bash
# Встроенная ротация (14 дней, 20MB файлы)
# Настроена в logger.ts

# Ручная очистка старых файлов
find logs/ -name "*.log" -mtime +30 -delete

# Очистка больших файлов (сохраняя последние 1000 строк)
find logs/ -name "*.log" -size +50M -exec sh -c 'tail -1000 "$1" > "$1.tmp" && mv "$1.tmp" "$1"' _ {} \;
```

### Мониторинг размера
```bash
# Размер всех логов
du -sh logs/

# Топ-5 самых больших файлов
du -h logs/*.log | sort -hr | head -5

# Мониторинг в реальном времени
watch -n 5 'du -sh logs/ && df -h /'
```

## 📚 Дополнительные инструменты

### jq для анализа JSON логов
```bash
# Установка jq (если нет)
sudo apt install jq

# Красивый вывод логов
cat logs/combined-$(date +%Y-%m-%d).log | jq '.'

# Фильтрация по уровню
cat logs/combined-$(date +%Y-%m-%d).log | jq 'select(.level == "error")'

# Статистика по уровням
cat logs/combined-$(date +%Y-%m-%d).log | jq -r '.level' | sort | uniq -c
```

### Создание custom алиасов
```bash
# Добавить в ~/.bashrc или ~/.zshrc
alias logs-today='tail -100 ~/voice-ai-assistant/logs/combined-$(date +%Y-%m-%d).log'
alias logs-errors-count='grep -c "error\|warn" ~/voice-ai-assistant/logs/error-$(date +%Y-%m-%d).log'
alias logs-api-stats='grep "Request completed" ~/voice-ai-assistant/logs/http-$(date +%Y-%m-%d).log | jq -r ".status" | sort | uniq -c'
```

## 🔗 Связанные документы

- **[server-setup/monitor_logs.sh](./server-setup/monitor_logs.sh)** - Автоматический мониторинг и ротация
- **[scripts/log-viewer.sh](./scripts/log-viewer.sh)** - Инструмент просмотра логов
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Логи Docker контейнера
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Безопасность и аудит логов

---

**🎯 Система логирования полностью настроена и готова для production использования!** 