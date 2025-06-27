# 🖥️ Быстрый доступ к логам в консоли

Удобные способы просмотра логов прямо в терминале сервера без программирования.

## 🚀 Быстрый старт

### 1. Через скрипт (рекомендуется)
```bash
# Справка по всем командам
./scripts/log-viewer.sh help

# Логи в реальном времени (как tail -f)
./scripts/log-viewer.sh live

# Только ошибки
./scripts/log-viewer.sh errors

# Статистика за сегодня
./scripts/log-viewer.sh stats
```

### 2. Через npm команды
```bash
# Все доступные команды
npm run logs help

# Быстрые команды
npm run logs:live      # Логи в реальном времени
npm run logs:errors    # Только ошибки
npm run logs:sessions  # Логи сессий
npm run logs:api       # HTTP запросы
npm run logs:stats     # Статистика
```

### 3. Через алиасы (после загрузки)
```bash
# Загрузить алиасы
source aliases.sh

# Использовать короткие команды
logs-live              # Логи в реальном времени
logs-errors            # Только ошибки
logs-stats             # Статистика
logs-search "session"  # Поиск по тексту
```

## 📊 Основные команды

### Просмотр в реальном времени
```bash
# Все логи
./scripts/log-viewer.sh live

# Только HTTP запросы
./scripts/log-viewer.sh api -f

# Только ошибки (если появятся)
./scripts/log-viewer.sh errors -f
```

### Анализ логов
```bash
# Статистика за сегодня
./scripts/log-viewer.sh stats

# Последние 20 записей
./scripts/log-viewer.sh tail 20

# Поиск по тексту
./scripts/log-viewer.sh search "OpenAI"
./scripts/log-viewer.sh search "Session created"
./scripts/log-viewer.sh search "error"
```

### Логи за конкретную дату
```bash
# Ошибки за вчера
./scripts/log-viewer.sh errors -d 2025-06-27

# Статистика за прошлую неделю
./scripts/log-viewer.sh stats -d 2025-06-20
```

### Специализированные команды
```bash
# Только логи сессий
./scripts/log-viewer.sh sessions

# Медленные операции (>1 секунды)
./scripts/log-viewer.sh performance

# HTTP запросы
./scripts/log-viewer.sh api
```

## 🎨 Цветной вывод

Скрипт автоматически раскрашивает логи:
- 🔴 **Красный** - ошибки (level: error)
- 🟡 **Желтый** - предупреждения (level: warn)  
- 🟢 **Зеленый** - информация (level: info)
- 🔵 **Синий** - HTTP запросы (level: http)
- 🟣 **Фиолетовый** - отладка (level: debug)

## 📁 Прямой доступ к файлам

Если нужен прямой доступ к файлам логов:

```bash
# Структура файлов
ls -la logs/

# Все логи за сегодня
tail -f logs/combined-$(date +%Y-%m-%d).log

# Только ошибки
tail -f logs/error-$(date +%Y-%m-%d).log

# HTTP запросы
tail -f logs/http-$(date +%Y-%m-%d).log
```

## 🔍 Полезные команды grep

```bash
# Поиск ошибок
grep "level\":\"error" logs/combined-$(date +%Y-%m-%d).log

# Сессии пользователей
grep "Session created\|Session ended" logs/combined-$(date +%Y-%m-%d).log

# OpenAI API вызовы
grep "OpenAI API" logs/combined-$(date +%Y-%m-%d).log

# Медленные операции
grep "slow\":true" logs/combined-$(date +%Y-%m-%d).log
```

## 📈 Мониторинг в production

### Постоянный мониторинг
```bash
# В отдельном терминале - следить за ошибками
./scripts/log-viewer.sh errors -f

# В другом терминале - общий мониторинг
./scripts/log-viewer.sh live
```

### Проверка здоровья системы
```bash
# Быстрая проверка
./scripts/log-viewer.sh stats && ./scripts/log-viewer.sh errors

# Или через алиас
logs-check
```

### Анализ производительности
```bash
# Медленные операции
./scripts/log-viewer.sh performance

# Статистика API
./scripts/log-viewer.sh api | grep "duration"
```

## 🧹 Управление логами

```bash
# Размер логов
du -sh logs/

# Очистка старых логов (>30 дней)
./scripts/log-viewer.sh clean

# Ручная очистка
find logs/ -name "*.log" -mtime +7 -delete
```

## ⚡ Быстрые алиасы

После загрузки алиасов (`source aliases.sh`):

```bash
logs-live          # Логи в реальном времени
logs-errors        # Только ошибки  
logs-sessions      # Логи сессий
logs-api           # HTTP запросы
logs-stats         # Статистика
logs-tail-10       # Последние 10 записей
logs-search "text" # Поиск по тексту
logs-clean         # Очистка старых логов
monitor-all        # Мониторинг всех логов
logs-today         # Статистика + последние записи
```

## 🚨 Troubleshooting

### Логи не отображаются
```bash
# Проверить существование файлов
ls -la logs/

# Проверить права доступа
ls -la logs/*.log

# Создать папку если нужно
mkdir -p logs
```

### Нет цветного вывода
```bash
# Установить jq для лучшего форматирования
# Ubuntu/Debian:
sudo apt install jq

# macOS:
brew install jq
```

### Большие файлы логов
```bash
# Проверить размер
du -sh logs/*.log

# Очистить если нужно
./scripts/log-viewer.sh clean
```

---

**💡 Совет**: Добавьте `source /path/to/aliases.sh` в ваш `~/.bashrc` или `~/.zshrc` для постоянного доступа к коротким командам! 