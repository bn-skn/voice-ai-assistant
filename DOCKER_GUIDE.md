# 🐳 Docker Guide - Voice AI Assistant (Production Ready)

Полное руководство по развертыванию Voice AI Assistant с помощью Docker, основанное на реальном опыте production деплоя.

## 🎯 Обзор

Проект использует **multi-stage Docker** сборку с оптимизацией для production:
- **Alpine Linux** базовый образ для минимального размера
- **Health checks** для мониторинга состояния
- **Resource limits** для контроля потребления ресурсов
- **Graceful shutdown** для корректного завершения
- **Централизованное логирование** с ротацией

## 🚀 Быстрый старт

### 1. Подготовка окружения
```bash
# Клонируйте проект
git clone https://github.com/bn-skn/voice-ai-assistant.git
cd voice-ai-assistant

# Создайте .env.local файл с API ключом
cp .env.example .env.local

# Отредактируйте .env.local и добавьте ваш OpenAI API ключ
nano .env.local
# OPENAI_API_KEY=sk-proj-your-key-here
# NODE_ENV=production
# LOG_LEVEL=info
# ADMIN_TOKEN=your-secret-admin-token
```

### 2. Сборка и запуск (Рекомендуемый способ)
```bash
# Полный цикл сборки и запуска
npm run docker:build    # Собираем Docker образ
npm run docker:start    # Запускаем контейнер

# Проверяем статус
npm run docker:status   # Показывает статус, health check и статистику
```

### 3. Альтернативный способ через скрипты
```bash
# Используем прямые скрипты
./scripts/docker-ops.sh build
./scripts/docker-ops.sh start
./scripts/docker-ops.sh status
```

## 📋 Все доступные команды

### 🔧 Управление контейнером
```bash
# === СБОРКА И ЗАПУСК ===
npm run docker:build     # Сборка Docker образа (с кешированием)
npm run docker:start     # Запуск контейнера в фоне
npm run docker:restart   # Перезапуск контейнера
npm run docker:stop      # Остановка контейнера

# === МОНИТОРИНГ ===
npm run docker:status    # Полный статус + health check + статистика
npm run docker:logs      # Показать логи контейнера
npm run docker:logs:follow  # Следить за логами в реальном времени

# === ОБСЛУЖИВАНИЕ ===
npm run docker:cleanup   # Очистка неиспользуемых Docker ресурсов
npm run docker:rebuild   # Полная пересборка (очистка кеша + сборка)
```

### 🎛️ Прямые Docker Compose команды
```bash
# Для продвинутых пользователей
docker-compose build --no-cache    # Сборка без кеша
docker-compose up -d               # Запуск в фоне
docker-compose down                # Остановка и удаление
docker-compose ps                  # Список контейнеров
docker-compose exec voice-assistant bash  # Подключение к контейнеру
```

## 🏗️ Архитектура Docker

### Dockerfile (Multi-stage сборка)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DEPS STAGE    │    │  BUILDER STAGE  │    │  RUNTIME STAGE  │
│                 │    │                 │    │                 │
│ • node:20-alpine│    │ • node:20-alpine│    │ • node:20-alpine│
│ • Production    │────▶│ • Build Next.js │────▶│ • Runtime only │
│   dependencies │    │ • TypeScript    │    │ • Health checks │
│                 │    │ • Static files  │    │ • Non-root user │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ↓                        ↓                        ↓
    ~50MB deps            Build artifacts            Final: ~100MB
```

### Docker Compose конфигурация
- **Контейнер**: `voice-ai-assistant-container`
- **Порт**: 3000 (HTTP)
- **Сеть**: `voice-assistant-network`
- **Лимиты**: 512MB RAM, 0.5 CPU
- **Health check**: каждые 30 секунд
- **Автоперезапуск**: unless-stopped

## 📊 Мониторинг и отладка

### Проверка состояния
```bash
# Быстрая проверка
npm run docker:status

# Детальная информация
docker stats voice-ai-assistant-container
docker inspect voice-ai-assistant-container
```

### Анализ логов
```bash
# Логи приложения (через Next.js)
npm run logs:live         # Логи в реальном времени
npm run logs:errors       # Только ошибки
npm run logs:sessions     # Логи сессий

# Логи Docker контейнера
npm run docker:logs       # Все логи контейнера
docker-compose logs -f    # Docker Compose логи
```

### Health Check
Встроенная проверка здоровья:
- **URL**: `http://localhost:3000/api/session?action=stats`
- **Интервал**: 30 секунд
- **Таймаут**: 10 секунд
- **Попытки**: 3 перед failure

```bash
# Ручная проверка health check
curl -f http://localhost:3000/api/session?action=stats
```

## 🛠️ Разработка и отладка

### Подключение к контейнеру
```bash
# Bash сессия внутри контейнера
docker-compose exec voice-assistant bash

# Выполнение команд
docker-compose exec voice-assistant npm run logs:stats
docker-compose exec voice-assistant curl http://localhost:3000/api/session?action=stats
```

### Отладка проблем сборки
```bash
# Пересборка без кеша
npm run docker:rebuild

# Проверка образов
docker images | grep voice-ai-assistant

# Очистка Docker системы
npm run docker:cleanup
docker system prune -a -f
```

### Изменение конфигурации
```bash
# После изменения .env.local
npm run docker:restart

# После изменения кода
npm run docker:rebuild
npm run docker:start
```

## 🚨 Решение типичных проблем

### ❌ "Cannot connect to Docker daemon"
```bash
# Проверка Docker
sudo systemctl status docker
sudo systemctl start docker
sudo usermod -aG docker $USER  # Добавить пользователя в группу docker
# Перелогиниться после добавления в группу
```

### ❌ "Port 3000 already in use"
```bash
# Найти процесс использующий порт
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Остановить конфликтующий сервис
npm run docker:stop
sudo systemctl stop nginx  # Если nginx использует порт
```

### ❌ "Build errors" (TypeScript/ESLint)
В production режиме ошибки линтера игнорируются (`next.config.ts`):
```typescript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true }
```

### ❌ "Health check failing"
```bash
# Проверка API вручную
curl -v http://localhost:3000/api/session?action=stats

# Логи контейнера
npm run docker:logs

# Перезапуск
npm run docker:restart
```

### ❌ "Out of memory"
```bash
# Увеличить лимиты в docker-compose.yml
memory: 1024M  # Вместо 512M

# Проверить использование ресурсов
docker stats voice-ai-assistant-container
```

## 📈 Оптимизация и production

### Размер образа
- **Базовый образ**: Alpine Linux (~5MB)
- **Dependencies**: ~50MB
- **Application**: ~45MB
- **Итого**: ~100MB (оптимизировано)

### Рекомендации для production
```bash
# 1. Используйте конкретные версии образов
FROM node:20.11-alpine

# 2. Очищайте кеш пакетных менеджеров
RUN npm ci --frozen-lockfile && npm cache clean --force

# 3. Используйте .dockerignore
logs/
node_modules/
.git/

# 4. Настройте лимиты ресурсов
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Мониторинг в production
```bash
# Автоматические проверки
*/5 * * * * curl -f http://localhost:3000/api/session?action=stats

# Мониторинг ресурсов
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Ротация логов (встроена в Docker)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔗 Интеграция с Nginx

Для production развертывания с доменом:

```bash
# 1. Убедитесь что Docker контейнер работает на порту 3000
npm run docker:status

# 2. Настройте Nginx как reverse proxy
sudo cp nginx.production.conf /etc/nginx/sites-available/your-domain.com

# 3. Замените YOUR_DOMAIN.COM на ваш домен
sudo sed -i 's/YOUR_DOMAIN.COM/your-domain.com/g' /etc/nginx/sites-available/your-domain.com

# 4. Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 📚 Дополнительные ресурсы

- **[nginx.production.conf](./nginx.production.conf)** - Production Nginx конфигурация
- **[server-setup/](./server-setup/)** - Серверные скрипты для мониторинга и бэкапов
- **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)** - Руководство по логированию
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Безопасность и best practices

---

**🎯 Docker конфигурация протестирована в production и готова к использованию!** 