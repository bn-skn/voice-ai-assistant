#!/bin/bash

# 🔧 СКРИПТ МОНИТОРИНГА И АВТОМАТИЧЕСКОЙ РОТАЦИИ ЛОГОВ
# Версия: Final (проверено в production)
# Описание: Мониторит размер логов и автоматически очищает при превышении лимитов

# ========================================
# КОНФИГУРАЦИЯ
# ========================================
PROJECT_DIR="/home/deployer/voice-ai-assistant"
LOGS_DIR="$PROJECT_DIR/logs"
MAX_LOG_SIZE_MB=100      # Максимальный размер всех логов в MB
DAYS_TO_KEEP=7           # Сколько дней хранить старые логи
CRITICAL_DISK_LEVEL=85   # Критический уровень использования диска (%)

# ========================================
# ПРОВЕРКИ И ИНИЦИАЛИЗАЦИЯ
# ========================================

# Проверяем существование директории логов
if [ ! -d "$LOGS_DIR" ]; then
  echo "$(date): ❌ Logs directory not found: $LOGS_DIR"
  exit 1
fi

# Получаем размеры
LOG_SIZE=$(du -sm "$LOGS_DIR" 2>/dev/null | cut -f1)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Проверяем, что LOG_SIZE не пустой
if [ -z "$LOG_SIZE" ]; then
  LOG_SIZE=0
fi

echo "$(date): 📊 Logs size: ${LOG_SIZE}MB, Disk usage: $DISK_USAGE%"

# ========================================
# АВТОМАТИЧЕСКАЯ ОЧИСТКА ЛОГОВ
# ========================================

if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE_MB" ]; then
  echo "🧹 Logs exceed ${MAX_LOG_SIZE_MB}MB, starting cleanup..."
  
  # Удаляем логи старше указанного количества дней
  DELETED_OLD=$(find "$LOGS_DIR" -name "*.log" -mtime +$DAYS_TO_KEEP -delete -print | wc -l)
  if [ "$DELETED_OLD" -gt 0 ]; then
    echo "🗑️  Deleted $DELETED_OLD old log files (older than $DAYS_TO_KEEP days)"
  fi
  
  # Обрезаем большие файлы, оставляя последние 1000 строк
  BIG_FILES=$(find "$LOGS_DIR" -name "*.log" -size +10M)
  if [ -n "$BIG_FILES" ]; then
    echo "✂️  Truncating large log files..."
    find "$LOGS_DIR" -name "*.log" -size +10M -exec sh -c 'echo "Truncating: $1"; tail -1000 "$1" > "$1.tmp" && mv "$1.tmp" "$1"' _ {} \; 2>/dev/null
  fi
  
  # Получаем новый размер
  NEW_SIZE=$(du -sm "$LOGS_DIR" 2>/dev/null | cut -f1)
  echo "✅ Cleanup completed: ${LOG_SIZE}MB → ${NEW_SIZE}MB"
else
  echo "✅ Log size is within limits (${LOG_SIZE}MB < ${MAX_LOG_SIZE_MB}MB)"
fi

# ========================================
# ПРОВЕРКА ИСПОЛЬЗОВАНИЯ ДИСКА
# ========================================

if [ "$DISK_USAGE" -gt "$CRITICAL_DISK_LEVEL" ]; then
  echo "🚨 CRITICAL: Disk usage above ${CRITICAL_DISK_LEVEL}%! Consider immediate cleanup."
  
  # Показываем топ-5 самых больших директорий
  echo "📊 Top 5 largest directories:"
  du -h /home/deployer/voice-ai-assistant/ | sort -hr | head -5
else
  echo "✅ Disk usage is normal (${DISK_USAGE}% < ${CRITICAL_DISK_LEVEL}%)"
fi

# ========================================
# ДОПОЛНИТЕЛЬНАЯ СТАТИСТИКА
# ========================================

# Количество файлов логов
LOG_COUNT=$(find "$LOGS_DIR" -name "*.log" | wc -l)
echo "📁 Total log files: $LOG_COUNT"

# Самый большой лог файл
if [ "$LOG_COUNT" -gt 0 ]; then
  LARGEST_LOG=$(find "$LOGS_DIR" -name "*.log" -exec ls -lh {} \; | sort -k5 -hr | head -1 | awk '{print $9 " (" $5 ")"}')
  echo "📄 Largest log file: $(basename "$LARGEST_LOG")"
fi

echo "📊 Monitoring completed successfully"

# ========================================
# УСТАНОВКА И ИСПОЛЬЗОВАНИЕ:
# ========================================
# 
# 1. Скопируйте скрипт на сервер: chmod +x monitor_logs.sh
# 2. Добавьте в cron для автоматического запуска:
#    crontab -e
#    # Каждый день в 9:00
#    0 9 * * * /path/to/monitor_logs.sh >> ~/monitor.log 2>&1
# 
# 3. Ручной запуск: ./monitor_logs.sh
# 4. Просмотр истории: tail -f ~/monitor.log
# ======================================== 