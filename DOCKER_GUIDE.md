# 🐳 Docker Guide - Голосовой ИИ Ассистент

Краткое руководство по развертыванию голосового ИИ-ассистента с помощью Docker.

## 🚀 Быстрый старт

### 1. Подготовка
```bash
# Клонируйте проект
git clone https://github.com/yourusername/voice-ai-assistant.git
cd voice-ai-assistant

# Создайте .env.local файл
cp .env.example .env.local
# Добавьте ваш OPENAI_API_KEY в .env.local
```

### 2. Запуск через скрипт (рекомендуется)
```bash
# Сборка и запуск одной командой
./scripts/docker-ops.sh build
./scripts/docker-ops.sh start

# Или через npm
npm run docker:build
npm run docker:start
```

### 3. Запуск через docker-compose
```bash
# Сборка образа
docker-compose build

# Запуск контейнера
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

## 📋 Доступные команды

### Через скрипт `docker-ops.sh`:
```bash
./scripts/docker-ops.sh build      # Собрать образ
./scripts/docker-ops.sh start      # Запустить контейнер
./scripts/docker-ops.sh stop       # Остановить контейнер
./scripts/docker-ops.sh restart    # Перезапустить
./scripts/docker-ops.sh status     # Статус и health check
./scripts/docker-ops.sh logs       # Показать логи
./scripts/docker-ops.sh logs follow # Логи в реальном времени
./scripts/docker-ops.sh cleanup    # Очистить Docker ресурсы
./scripts/docker-ops.sh rebuild    # Полная пересборка
./scripts/docker-ops.sh export     # Экспорт всех логов
```

### Через npm скрипты:
```bash
npm run docker:build              # Сборка
npm run docker:start              # Запуск
npm run docker:stop               # Остановка
npm run docker:restart            # Перезапуск
npm run docker:status             # Статус
npm run docker:logs               # Логи
npm run docker:logs:follow        # Логи в реальном времени
npm run docker:cleanup            # Очистка
npm run docker:rebuild            # Пересборка
```

### Через алиасы (после `source aliases.sh`):
```bash
docker-build                      # Сборка
docker-start                      # Запуск
docker-stop                       # Остановка
docker-restart                    # Перезапуск
docker-status                     # Статус
docker-logs                       # Логи
docker-logs-live                  # Логи в реальном времени
docker-cleanup                    # Очистка
docker-rebuild                    # Пересборка
docker-export                     # Экспорт логов
```

## 🔧 Конфигурация

### Переменные окружения (.env.local):
```env
# Обязательные
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=production

# Опциональные
LOG_LEVEL=info
ADMIN_TOKEN=your-secret-admin-token-here
```

### Ресурсы контейнера:
- **Память**: 256MB-512MB
- **CPU**: 0.25-0.5 ядра
- **Порт**: 3000
- **Логи**: автоматическая ротация (10MB, 3 файла)

## 📊 Мониторинг

### Health Check:
```bash
# Автоматический health check каждые 30 секунд
curl http://localhost:3000/api/session?action=stats

# Или через скрипт
./scripts/docker-ops.sh status
```

### Логи:
```bash
# Логи контейнера
docker-compose logs -f

# Логи приложения (в папке logs/)
npm run logs:live

# Объединенные логи
./scripts/docker-ops.sh export
```

### Статистика ресурсов:
```bash
# Через docker stats
docker stats voice-ai-assistant-container

# Через скрипт (включает health check)
./scripts/docker-ops.sh status
```

## 🛠️ Troubleshooting

### Проблема: Контейнер не запускается
```bash
# Проверить логи
docker-compose logs

# Проверить .env.local
cat .env.local | grep OPENAI_API_KEY

# Пересобрать образ
./scripts/docker-ops.sh rebuild
```

### Проблема: Приложение недоступно
```bash
# Проверить статус
./scripts/docker-ops.sh status

# Проверить порты
netstat -tlnp | grep :3000

# Перезапустить
./scripts/docker-ops.sh restart
```

### Проблема: Ошибки OpenAI API
```bash
# Проверить логи ошибок
npm run logs:errors

# Проверить API ключ
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

### Проблема: Нехватка места
```bash
# Очистить Docker ресурсы
./scripts/docker-ops.sh cleanup

# Очистить логи приложения
npm run logs:clean

# Проверить размер
du -sh logs/ .next/ node_modules/
```

## 🚀 Production деплой

### На сервере:
1. **Установите Docker и Docker Compose**
2. **Настройте Nginx** (см. `nginx.example.conf`)
3. **Получите SSL сертификаты** (Let's Encrypt)
4. **Запустите контейнер**:
   ```bash
   ./scripts/docker-ops.sh build
   ./scripts/docker-ops.sh start
   ```

### Автозапуск:
```bash
# Контейнер автоматически перезапускается (restart: unless-stopped)
sudo systemctl enable docker
```

### Мониторинг в production:
```bash
# Настройте мониторинг логов
tail -f logs/error-$(date +%Y-%m-%d).log

# Health check через cron
echo "*/5 * * * * curl -f http://localhost:3000/api/session?action=stats || echo 'Health check failed'" | crontab -
```

---

## 📝 Полезные ссылки

- **Основное руководство**: [README.md](./README.md)
- **Деплой гайд**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Логирование**: [LOG_ACCESS_GUIDE.md](./LOG_ACCESS_GUIDE.md)
- **Безопасность**: [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)

---

**🐳 Powered by Docker + Next.js + OpenAI Realtime API** 