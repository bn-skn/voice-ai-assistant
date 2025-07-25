# 🛠️ Серверные скрипты для Voice AI Assistant

Эта папка содержит production-ready скрипты для управления сервером, созданные на основе реального опыта деплоя.

## 📋 Список скриптов

### 🔧 `monitor_logs.sh`
**Автоматический мониторинг и ротация логов**

- 📊 Мониторит размер директории логов
- 🧹 Автоматически очищает логи при превышении лимитов (100MB)
- 🗑️ Удаляет логи старше 7 дней
- ✂️ Обрезает большие файлы до последних 1000 строк
- 💾 Контролирует использование дискового пространства

**Установка:**
```bash
# Копируем скрипт на сервер
sudo cp monitor_logs.sh /root/monitor_logs.sh
sudo chmod +x /root/monitor_logs.sh

# Добавляем в cron (каждый день в 9:00)
sudo crontab -e
# Добавить строку:
0 9 * * * /root/monitor_logs.sh >> /root/monitor.log 2>&1

# Ручной запуск
sudo /root/monitor_logs.sh
```

### 📦 `backup_config.sh`
**Автоматическое резервное копирование конфигураций**

- 🔐 Сохраняет Nginx конфигурации, .env файлы, Docker настройки
- 📅 Автоматическая очистка старых бэкапов (хранит последние 30)
- 📊 Детальная статистика и логирование
- 🔍 Проверка существования файлов перед архивированием

**Установка:**
```bash
# Копируем скрипт на сервер
sudo cp backup_config.sh /root/backup_config.sh
sudo chmod +x /root/backup_config.sh

# Добавляем в cron (еженедельно по воскресеньям в 2:00)
sudo crontab -e
# Добавить строку:
0 2 * * 0 /root/backup_config.sh >> /root/backup.log 2>&1

# Ручной запуск
sudo /root/backup_config.sh
```

### 🔄 `restore_config.sh`
**Восстановление конфигураций из бэкапа**

- 📋 Интерактивный выбор бэкапа для восстановления
- 👀 Предварительный просмотр содержимого архива
- ⚠️ Безопасное восстановление с подтверждением
- 🔧 Автоматическая установка прав доступа

**Использование:**
```bash
# Копируем скрипт на сервер
sudo cp restore_config.sh /root/restore_config.sh
sudo chmod +x /root/restore_config.sh

# Запуск
sudo /root/restore_config.sh

# Автоматическое восстановление последнего бэкапа
echo "yes" | sudo /root/restore_config.sh
```

## 🚀 Быстрая установка всех скриптов

```bash
# 1. Переходим в папку с проектом
cd ~/voice-ai-assistant/server-setup/

# 2. Копируем все скрипты на сервер
sudo cp *.sh /root/
sudo chmod +x /root/*.sh

# 3. Настраиваем автоматический запуск
sudo crontab -e
# Добавить строки:
# 0 9 * * * /root/monitor_logs.sh >> /root/monitor.log 2>&1
# 0 2 * * 0 /root/backup_config.sh >> /root/backup.log 2>&1

# 4. Создаем директории
sudo mkdir -p /root/backups

# 5. Первый запуск для проверки
sudo /root/monitor_logs.sh
sudo /root/backup_config.sh
```

## 📊 Мониторинг и логи

### Просмотр логов мониторинга
```bash
# Последние записи мониторинга
sudo tail -f /root/monitor.log

# Последние записи бэкапов
sudo tail -f /root/backup.log

# Размер директории бэкапов
sudo du -sh /root/backups/

# Список всех бэкапов
sudo ls -lht /root/backups/
```

### Проверка работы cron
```bash
# Просмотр cron задач
sudo crontab -l

# Логи cron
sudo tail -f /var/log/cron

# Проверка статуса cron
sudo systemctl status cron
```

## 🛡️ Безопасность

### Права доступа
- Все скрипты должны принадлежать `root:root`
- Права доступа: `700` (только root может читать/выполнять)
- Бэкапы содержат чувствительные данные (.env файлы)

### Защита бэкапов
```bash
# Установка правильных прав
sudo chmod 700 /root/backups/
sudo chmod 600 /root/backups/*.tar.gz

# Копирование на удаленный сервер (опционально)
# rsync -avz /root/backups/ user@backup-server:/backups/voice-ai/
```

## 🔧 Настройка и кастомизация

### Изменение параметров мониторинга
Отредактируйте `/root/monitor_logs.sh`:
```bash
MAX_LOG_SIZE_MB=200      # Увеличить лимит до 200MB
DAYS_TO_KEEP=14          # Хранить логи 14 дней
CRITICAL_DISK_LEVEL=90   # Предупреждать при 90% диска
```

### Изменение параметров бэкапов
Отредактируйте `/root/backup_config.sh`:
```bash
MAX_BACKUPS_TO_KEEP=50   # Хранить больше бэкапов
```

### Добавление дополнительных файлов в бэкап
```bash
# В backup_config.sh добавьте в массив BACKUP_FILES:
"/etc/ssh/sshd_config"   # SSH конфигурация
"/etc/hosts"             # Файл hosts
```

## ❓ Часто задаваемые вопросы

### Q: Скрипт мониторинга не запускается
**A:** Проверьте права доступа и существование директории логов:
```bash
sudo chmod +x /root/monitor_logs.sh
ls -la /home/deployer/voice-ai-assistant/logs/
```

### Q: Бэкапы не создаются автоматически
**A:** Проверьте cron и логи:
```bash
sudo crontab -l
sudo tail -f /var/log/cron
sudo /root/backup_config.sh  # Ручной запуск для диагностики
```

### Q: Как восстановить только определенный файл?
**A:** Используйте tar напрямую:
```bash
sudo tar -xzf /root/backups/config_backup_YYYYMMDD_HHMMSS.tar.gz -C / home/deployer/voice-ai-assistant/.env.local
```

## 📞 Поддержка

Если возникают проблемы со скриптами:
1. Проверьте логи: `sudo tail -f /root/*.log`
2. Запустите скрипт вручную для диагностики
3. Проверьте права доступа: `ls -la /root/*.sh`
4. Убедитесь, что все пути существуют

---

**🎯 Все скрипты протестированы в production среде и готовы к использованию!** 