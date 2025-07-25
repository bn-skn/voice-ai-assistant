#!/bin/bash

# 📦 СКРИПТ АВТОМАТИЧЕСКОГО БЭКАПА КОНФИГУРАЦИЙ
# Версия: Final (проверено в production)
# Описание: Создает архивы важных конфигурационных файлов

# ========================================
# КОНФИГУРАЦИЯ
# ========================================
BACKUP_DIR="/root/backups"
PROJECT_DIR="/home/deployer/voice-ai-assistant"
DATE=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS_TO_KEEP=30  # Количество бэкапов для хранения

# ========================================
# ИНИЦИАЛИЗАЦИЯ
# ========================================

# Проверяем и создаем директорию для бэкапов
mkdir -p "$BACKUP_DIR"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Cannot create backup directory: $BACKUP_DIR"
  exit 1
fi

echo "📦 Starting configuration backup: $(date)"
echo "📁 Backup directory: $BACKUP_DIR"

# ========================================
# СПИСОК ФАЙЛОВ ДЛЯ БЭКАПА
# ========================================

BACKUP_FILES=(
  "/etc/nginx/sites-available/myvoiceai.ru"              # Nginx конфигурация
  "$PROJECT_DIR/.env.local"                              # Environment переменные
  "$PROJECT_DIR/docker-compose.yml"                      # Docker настройки
  "/etc/fail2ban/jail.local"                            # Fail2ban конфигурация (если есть)
  "/etc/crontab"                                         # Cron задачи (если есть)
)

# Дополнительные файлы (опционально)
OPTIONAL_FILES=(
  "$PROJECT_DIR/next.config.ts"                         # Next.js конфигурация
  "$PROJECT_DIR/nginx.production.conf"                  # Шаблон Nginx
  "/root/monitor_logs.sh"                               # Скрипты мониторинга
  "/root/backup_config.sh"                              # Этот скрипт
)

# ========================================
# СОЗДАНИЕ БЭКАПА
# ========================================

BACKUP_FILE="$BACKUP_DIR/config_backup_$DATE.tar.gz"
TEMP_LIST="/tmp/backup_files_$DATE.list"

# Создаем список существующих файлов
> "$TEMP_LIST"

echo "🔍 Checking files for backup:"

# Проверяем основные файлы
for file in "${BACKUP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Found: $file"
    echo "$file" >> "$TEMP_LIST"
  else
    echo "⚠️  Missing: $file"
  fi
done

# Проверяем опциональные файлы
for file in "${OPTIONAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📎 Optional: $file"
    echo "$file" >> "$TEMP_LIST"
  fi
done

# Создаем архив
if [ -s "$TEMP_LIST" ]; then
  echo "📦 Creating backup archive..."
  
  tar -czf "$BACKUP_FILE" -T "$TEMP_LIST" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: config_backup_$DATE.tar.gz"
    
    # Показываем размер и содержимое
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "📊 Backup size: $BACKUP_SIZE"
    
    echo "📄 Backup contents:"
    tar -tzf "$BACKUP_FILE" | sed 's/^/   /'
    
  else
    echo "❌ Backup creation failed!"
    rm -f "$BACKUP_FILE" "$TEMP_LIST"
    exit 1
  fi
else
  echo "❌ No files found for backup!"
  rm -f "$TEMP_LIST"
  exit 1
fi

# Очищаем временный файл
rm -f "$TEMP_LIST"

# ========================================
# ОЧИСТКА СТАРЫХ БЭКАПОВ
# ========================================

echo "🧹 Cleaning old backups (keeping last $MAX_BACKUPS_TO_KEEP)..."

# Подсчитываем текущие бэкапы
CURRENT_BACKUPS=$(ls -1t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | wc -l)

if [ "$CURRENT_BACKUPS" -gt "$MAX_BACKUPS_TO_KEEP" ]; then
  # Удаляем старые бэкапы
  DELETED=$(ls -1t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS_TO_KEEP + 1)) | xargs rm -f)
  REMAINING=$(ls -1 "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | wc -l)
  echo "🗑️  Cleaned old backups. Remaining: $REMAINING"
else
  echo "✅ No cleanup needed. Current backups: $CURRENT_BACKUPS"
fi

# ========================================
# ФИНАЛЬНАЯ СТАТИСТИКА
# ========================================

echo "📊 Backup statistics:"
echo "   📁 Total backups: $(ls -1 "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | wc -l)"
echo "   💾 Total backup size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
echo "   📅 Latest backup: config_backup_$DATE.tar.gz"

echo "✅ Backup completed successfully: $(date)"

# ========================================
# УСТАНОВКА И ИСПОЛЬЗОВАНИЕ:
# ========================================
# 
# 1. Скопируйте скрипт на сервер: chmod +x backup_config.sh
# 2. Настройте автоматический запуск:
#    crontab -e
#    # Еженедельно по воскресеньям в 2:00
#    0 2 * * 0 /path/to/backup_config.sh >> ~/backup.log 2>&1
# 
# 3. Ручной запуск: ./backup_config.sh
# 4. Восстановление: tar -xzf config_backup_YYYYMMDD_HHMMSS.tar.gz -C /
# 5. Просмотр логов: tail -f ~/backup.log
# ======================================== 