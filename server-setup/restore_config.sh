#!/bin/bash

# 🔄 СКРИПТ ВОССТАНОВЛЕНИЯ КОНФИГУРАЦИЙ ИЗ БЭКАПА
# Версия: Final
# Описание: Восстанавливает конфигурационные файлы из архивов

# ========================================
# КОНФИГУРАЦИЯ
# ========================================
BACKUP_DIR="/root/backups"
PROJECT_DIR="/home/deployer/voice-ai-assistant"

# ========================================
# ФУНКЦИИ
# ========================================

# Функция для отображения доступных бэкапов
show_available_backups() {
  echo "📦 ДОСТУПНЫЕ БЭКАПЫ:"
  echo "==================="
  
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null)" ]; then
    echo "❌ Нет доступных бэкапов в $BACKUP_DIR"
    return 1
  fi
  
  ls -lht "$BACKUP_DIR"/config_backup_*.tar.gz | while read line; do
    filename=$(echo "$line" | awk '{print $9}')
    size=$(echo "$line" | awk '{print $5}')
    date=$(echo "$line" | awk '{print $6, $7, $8}')
    basename_file=$(basename "$filename")
    echo "📄 $basename_file ($size) - $date"
  done
  
  echo "==================="
  return 0
}

# Функция для выбора бэкапа
select_backup() {
  while true; do
    echo ""
    echo "🎯 Выберите бэкап для восстановления:"
    echo "   1) Введите полное имя файла (например: config_backup_20250725_155323.tar.gz)"
    echo "   2) Введите 'latest' для последнего бэкапа"
    echo "   3) Введите 'exit' для выхода"
    echo ""
    read -p "Ваш выбор: " BACKUP_CHOICE
    
    case "$BACKUP_CHOICE" in
      "exit"|"quit"|"q")
        echo "👋 Выход из программы"
        exit 0
        ;;
      "latest"|"last")
        BACKUP_FILE=$(ls -t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | head -1)
        ;;
      *.tar.gz)
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_CHOICE"
        ;;
      *)
        echo "❌ Неверный формат. Попробуйте еще раз."
        continue
        ;;
    esac
    
    if [ -f "$BACKUP_FILE" ]; then
      echo "✅ Выбран бэкап: $(basename "$BACKUP_FILE")"
      return 0
    else
      echo "❌ Файл не найден: $BACKUP_CHOICE"
      echo "🔍 Проверьте список доступных бэкапов выше"
    fi
  done
}

# Функция для предварительного просмотра
preview_backup() {
  echo ""
  echo "📋 СОДЕРЖИМОЕ ВЫБРАННОГО БЭКАПА:"
  echo "================================"
  tar -tzf "$BACKUP_FILE" | while read file; do
    if [ -f "/$file" ]; then
      echo "✅ /$file (существует, будет заменен)"
    else
      echo "➕ /$file (будет создан)"
    fi
  done
  echo "================================"
}

# Функция для подтверждения
confirm_restore() {
  echo ""
  echo "⚠️  ВНИМАНИЕ! Восстановление перезапишет существующие файлы!"
  echo ""
  read -p "Продолжить восстановление? (yes/no): " CONFIRM
  
  case "$CONFIRM" in
    yes|YES|y|Y|да|ДА)
      return 0
      ;;
    *)
      echo "❌ Восстановление отменено"
      exit 0
      ;;
  esac
}

# ========================================
# ОСНОВНАЯ ЛОГИКА
# ========================================

echo "🔄 СКРИПТ ВОССТАНОВЛЕНИЯ КОНФИГУРАЦИИ"
echo "====================================="

# Проверяем права доступа
if [ "$EUID" -ne 0 ]; then
  echo "❌ Запустите скрипт от имени root: sudo $0"
  exit 1
fi

# Показываем доступные бэкапы
if ! show_available_backups; then
  exit 1
fi

# Выбираем бэкап
select_backup

# Предварительный просмотр
preview_backup

# Подтверждение
confirm_restore

# ========================================
# ПРОЦЕСС ВОССТАНОВЛЕНИЯ
# ========================================

echo ""
echo "🔄 НАЧИНАЕМ ВОССТАНОВЛЕНИЕ..."
echo "=============================="

# Создаем временную директорию
TEMP_DIR=$(mktemp -d)
echo "📁 Временная директория: $TEMP_DIR"

# Извлекаем архив
echo "📦 Извлекаем архив..."
if tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"; then
  echo "✅ Архив успешно извлечен"
else
  echo "❌ Ошибка при извлечении архива"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Восстанавливаем файлы
echo ""
echo "🔄 ВОССТАНОВЛЕНИЕ ФАЙЛОВ:"
echo "========================"

RESTORED_COUNT=0
FAILED_COUNT=0

# Проходим по всем файлам в архиве
tar -tzf "$BACKUP_FILE" | while read archived_file; do
  SOURCE_FILE="$TEMP_DIR/$archived_file"
  TARGET_FILE="/$archived_file"
  TARGET_DIR=$(dirname "$TARGET_FILE")
  
  if [ -f "$SOURCE_FILE" ]; then
    # Создаем директорию если не существует
    mkdir -p "$TARGET_DIR"
    
    # Копируем файл
    if cp "$SOURCE_FILE" "$TARGET_FILE"; then
      echo "✅ Восстановлен: $TARGET_FILE"
      
      # Устанавливаем правильные права доступа
      case "$TARGET_FILE" in
        */voice-ai-assistant/*)
          chown deployer:deployer "$TARGET_FILE" 2>/dev/null
          ;;
        /etc/nginx/*)
          chown root:root "$TARGET_FILE"
          chmod 644 "$TARGET_FILE"
          ;;
        /etc/fail2ban/*)
          chown root:root "$TARGET_FILE"
          chmod 644 "$TARGET_FILE"
          ;;
      esac
      
      RESTORED_COUNT=$((RESTORED_COUNT + 1))
    else
      echo "❌ Ошибка при восстановлении: $TARGET_FILE"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  else
    echo "⚠️  Файл не найден в архиве: $archived_file"
  fi
done

# Очищаем временную директорию
rm -rf "$TEMP_DIR"

# ========================================
# ФИНАЛИЗАЦИЯ
# ========================================

echo ""
echo "📊 РЕЗУЛЬТАТЫ ВОССТАНОВЛЕНИЯ:"
echo "============================"
echo "✅ Восстановлено файлов: $RESTORED_COUNT"
echo "❌ Ошибок: $FAILED_COUNT"

# Рекомендации по перезапуску сервисов
echo ""
echo "🔄 РЕКОМЕНДУЕТСЯ ПЕРЕЗАПУСТИТЬ СЕРВИСЫ:"
echo "======================================"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "   cd $PROJECT_DIR && sudo -u deployer npm run docker:restart"
echo "   sudo systemctl restart fail2ban"

echo ""
echo "✅ Восстановление завершено: $(date)"

# ========================================
# ИСПОЛЬЗОВАНИЕ:
# ========================================
# 
# 1. Запуск: sudo ./restore_config.sh
# 2. Выберите нужный бэкап из списка
# 3. Подтвердите восстановление
# 4. Перезапустите сервисы согласно рекомендациям
# 
# Автоматическое восстановление последнего бэкапа:
# echo "yes" | sudo ./restore_config.sh
# ======================================== 