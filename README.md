# 🎤 **Voice AI Assistant (Production Tested)**

Продвинутое, готовое к развертыванию веб-приложение голосового ИИ-ассистента на базе **OpenAI Realtime API** и **Next.js**.  
**✅ Протестировано в production** на реальном сервере с доменом и SSL.

## 🚀 **Ключевые возможности**

### 🎯 **Основной функционал**
- **🎙️ Голосовое общение**: Мгновенная обработка голоса через WebRTC и OpenAI Realtime API
- **🌐 ChatGPT Web Search**: Актуальная информация из интернета в реальном времени
- **🎭 8 голосов ИИ**: Выбор из экспрессивных голосов (alloy, echo, fable, onyx, nova, shimmer)
- **🎨 3D Voice Orb**: Интерактивный голосовой индикатор с динамической анимацией
- **🔧 Audio Recovery**: Автоматическое восстановление звука при сбоях соединения

### 🏗️ **Production-Ready инфраструктура**
- **🐳 Docker ecosystem**: Multi-stage сборка, health-checks, resource limits, graceful shutdown
- **🔒 Enterprise безопасность**: Anti-prompt injection, CSP headers, Fail2ban, SSL/TLS
- **📊 Профессиональное логирование**: Winston с ротацией, 5 уровней, JSON структура, 14 дней хранения
- **⚙️ Умное управление сессиями**: 1 пользователь, 5 минут, автоматическая очистка очереди
- **🛠️ Богатая автоматизация**: 20+ NPM скриптов, алиасы, серверные утилиты мониторинга

### 🌐 **Production deployment features**
- **🎯 Real domain deployment**: Полная поддержка доменов с Let's Encrypt SSL
- **⚡ Nginx optimization**: WebSocket proxy, static caching, security headers
- **📈 Monitoring & backup**: Автоматическая ротация логов, backup конфигураций, health checks
- **🛡️ Server hardening**: UFW firewall, Fail2ban, non-root deployment user
- **📋 Complete documentation**: Детальные гайды для каждого аспекта деплоя

## 📋 **Требования**

### Локальная разработка
- **Node.js 18+** и **npm**
- **Docker** и **Docker Compose**
- **OpenAI API ключ** с доступом к Realtime API
- Современный браузер с поддержкой WebRTC

### Production сервер
- **Ubuntu 22.04 LTS** (протестировано) или аналогичная ОС
- **Минимум 1GB RAM** (рекомендуется 2GB+)
- **Docker** и **Docker Compose**
- **Nginx** для reverse proxy
- **Домен** с A-записью на сервер
- **Let's Encrypt** для SSL сертификатов

## 🛠️ **Быстрый старт**

### 💻 Локальная разработка
1.  **Клонируйте репозиторий:**
   ```bash
    git clone https://github.com/bn-skn/voice-ai-assistant.git
    cd voice-ai-assistant
   ```

2.  **Настройте окружение:**
   ```bash
    cp .env.example .env.local
    nano .env.local  # Добавьте ваш OPENAI_API_KEY
   ```

3.  **Запустите через Docker (рекомендуется):**
   ```bash
    npm run docker:build    # Сборка оптимизированного образа
    npm run docker:start    # Запуск с health checks
    npm run docker:status   # Проверка состояния
   ```

4.  **Откройте приложение:** [http://localhost:3000](http://localhost:3000)

### 🌐 Production развертывание
```bash
# Быстрый деплой на Ubuntu сервер
curl -fsSL https://raw.githubusercontent.com/bn-skn/voice-ai-assistant/main/scripts/quick-deploy.sh | bash
```

**Или следуйте пошаговому гайду:** [DEPLOYMENT_FINAL_CHECKLIST.md](./DEPLOYMENT_FINAL_CHECKLIST.md)

---

## 🏗️ **Архитектура и технические детали**

### **Technology Stack**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    FRONTEND     │    │     BACKEND     │    │   EXTERNAL      │
│                 │    │                 │    │                 │
│ • Next.js 15    │◄──►│ • Next.js API   │◄──►│ • OpenAI        │
│ • React 19      │    │ • WebSocket     │    │   Realtime API  │
│ • TypeScript    │    │ • Winston       │    │ • ChatGPT       │
│ • Tailwind CSS  │    │ • Docker        │    │   Web Search    │
│ • 3D Voice Orb  │    │ • Health Checks │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ↕                        ↕                        ↕
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ INFRASTRUCTURE  │    │   SECURITY      │    │   MONITORING    │
│                 │    │                 │    │                 │
│ • Docker Compose│    │ • Anti-injection│    │ • Structured    │
│ • Nginx Proxy   │    │ • CSP Headers   │    │   Logging       │
│ • Let's Encrypt │    │ • Session Limits│    │ • Log Rotation  │
│ • UFW Firewall  │    │ • Fail2ban      │    │ • Health Checks │
│ • Ubuntu 22.04  │    │ • SSL/TLS       │    │ • Backup System │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Структура проекта**
```
voice-ai-assistant/
├── 📁 app/                          # Next.js приложение
│   ├── 📁 components/               # React компоненты
│   │   ├── 🎤 VoiceControls.tsx     # Основной голосовой интерфейс
│   │   ├── 🎨 VoiceOrb.tsx          # 3D анимированный индикатор
│   │   ├── 💬 ChatContainer.tsx     # Контейнер для сообщений
│   │   ├── ⚙️ SettingsModal.tsx     # Настройки голосов и параметров
│   │   └── 🔔 NotificationSystem.tsx # Система уведомлений
│   ├── 📁 config/                   # Конфигурация
│   │   ├── 🛡️ protected-prompt.ts   # Защищенные промпты от injection
│   │   ├── ⚡ realtime-config.ts    # Настройки OpenAI Realtime API
│   │   ├── 🎯 session-limits.ts     # Лимиты сессий и очередей
│   │   ├── 📝 system-prompt.ts      # Системные промпты для ИИ
│   │   └── 🔧 tools.ts              # Инструменты (поиск, время, калькулятор)
│   ├── 📁 api/                      # API endpoints
│   │   ├── 🎯 session/route.ts      # Управление сессиями
│   │   └── 🔍 search/route.ts       # ChatGPT Web Search
│   ├── 📁 lib/                      # Утилиты и библиотеки
│   │   ├── 📊 logger.ts             # Winston логирование
│   │   ├── 📡 api-logger-middleware.ts # API middleware
│   │   └── 🎮 session-manager.ts    # Менеджер сессий
│   └── 📄 layout.tsx, page.tsx      # Основные страницы
├── 📁 server-setup/                 # 🆕 Серверные скрипты (production)
│   ├── 📋 monitor_logs.sh           # Автомониторинг и ротация логов
│   ├── 💾 backup_config.sh          # Автобэкап конфигураций
│   ├── 🔄 restore_config.sh         # Восстановление из бэкапов
│   └── 📖 README.md                 # Инструкции по скриптам
├── 📁 scripts/                      # Локальные скрипты
│   ├── 🐳 docker-ops.sh             # Docker операции
│   └── 📊 log-viewer.sh             # Просмотр логов
├── 📁 logs/                         # Логи приложения (создается автоматически)
├── 📁 docs/                         # Документация
│   └── 📚 DEPLOYMENT_LOG_2025-07-25.md # 🆕 Реальный лог деплоя
├── 🔧 nginx.production.conf         # 🆕 Production Nginx конфигурация
├── 🐳 Dockerfile                    # Multi-stage Docker сборка
├── 🎛️ docker-compose.yml           # Сервисы и ресурсы
├── ⚙️ next.config.ts                # Next.js + security headers
├── 📋 .env.example                  # Шаблон переменных окружения
└── 📄 aliases.sh                    # Удобные алиасы команд
```

### **Безопасность (Security)**
- **🛡️ Multi-layer prompt protection**: Защищенные промпты + валидация ввода
- **🔐 HTTP Security headers**: CSP, X-Frame-Options, HSTS, и другие
- **⚡ Session management**: Лимиты на пользователей и время сессий
- **🚫 Fail2ban protection**: Автоматическая блокировка brute-force атак
- **🔒 SSL/TLS encryption**: Let's Encrypt с автообновлением
- **👤 Non-root deployment**: Dedicated deployer user с минимальными правами

### **Мониторинг и логирование**
- **📊 Structured JSON logging**: Winston с timestamp, levels, context
- **🔄 Automatic log rotation**: 20MB files, 14 дней хранения
- **📈 Performance monitoring**: API response times, memory usage, sessions
- **🚨 Error tracking**: Отдельные файлы для errors, exceptions, rejections
- **💾 Automated backups**: Конфигурации, логи, состояние системы

---

## 🚀 **Production развертывание**

### 🎯 **Успешно протестировано на:**
- **Сервер**: DigitalOcean Droplet (1GB RAM, 1 CPU, 24GB SSD)
- **ОС**: Ubuntu 22.04 LTS
- **Домен**: Real domain с Let's Encrypt SSL
- **Нагрузка**: Concurrent WebSocket connections, real-time audio processing

### 📋 **Полный процесс деплоя**
1. **[DEPLOYMENT_FINAL_CHECKLIST.md](./DEPLOYMENT_FINAL_CHECKLIST.md)** - Пошаговый гайд (основной)
2. **[nginx.production.conf](./nginx.production.conf)** - Готовая Nginx конфигурация
3. **[server-setup/](./server-setup/)** - Серверные скрипты для автоматизации
4. **[docs/DEPLOYMENT_LOG_2025-07-25.md](./docs/DEPLOYMENT_LOG_2025-07-25.md)** - Реальный лог деплоя

### ⚡ **Быстрая установка**
```bash
# 1. Подготовка сервера (Ubuntu 22.04)
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx ufw fail2ban

# 2. Клонирование проекта
git clone https://github.com/bn-skn/voice-ai-assistant.git
cd voice-ai-assistant

# 3. Настройка окружения
cp .env.example .env.local
nano .env.local  # Добавить OPENAI_API_KEY

# 4. Установка серверных скриптов
sudo cp server-setup/*.sh /root/
sudo chmod +x /root/*.sh

# 5. Запуск приложения
npm run docker:build
npm run docker:start

# 6. Настройка Nginx + SSL
sudo cp nginx.production.conf /etc/nginx/sites-available/yourdomain.com
# Далее следуйте DEPLOYMENT_FINAL_CHECKLIST.md
```

---

## 🛠️ **Управление и мониторинг**

### 🐳 **Docker команды**
```bash
# === ОСНОВНЫЕ ОПЕРАЦИИ ===
npm run docker:build      # Сборка оптимизированного образа
npm run docker:start      # Запуск с health checks
npm run docker:restart    # Быстрый перезапуск
npm run docker:stop       # Остановка контейнера

# === МОНИТОРИНГ ===
npm run docker:status     # Статус + health check + ресурсы
npm run docker:logs       # Просмотр логов контейнера
npm run docker:logs:follow # Логи в реальном времени

# === ОБСЛУЖИВАНИЕ ===
npm run docker:cleanup    # Очистка неиспользуемых ресурсов
npm run docker:rebuild    # Полная пересборка без кеша
```

### 📊 **Логирование и анализ**
```bash
# === ПРОСМОТР ЛОГОВ ===
npm run logs:live          # Все логи в реальном времени
npm run logs:errors        # Только ошибки и предупреждения
npm run logs:sessions      # Логи пользовательских сессий
npm run logs:api           # HTTP запросы и API вызовы
npm run logs:stats         # Статистика за сегодня

# === АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ ===
# Средняя скорость API
grep "Request completed" logs/http-$(date +%Y-%m-%d).log | jq -r '.duration' | awk '{sum+=$1; count++} END {print "Avg: " sum/count "ms"}'

# Топ медленных запросов
grep "Request completed" logs/http-$(date +%Y-%m-%d).log | jq 'select(.duration | tonumber > 1000)'

# Количество активных сессий за день
grep "session_start" logs/session-$(date +%Y-%m-%d).log | wc -l
```

### 🔧 **Алиасы для удобства**
```bash
# Загрузка алиасов
source aliases.sh

# Быстрые команды
docker-start               # npm run docker:start
docker-status              # npm run docker:status
logs-live                  # npm run logs:live
logs-errors                # npm run logs:errors
```

---

## 🚨 **Troubleshooting**

### ❌ **Частые проблемы**

#### **Docker контейнер не запускается**
```bash
# Диагностика
npm run docker:status
docker-compose logs

# Решение
npm run docker:cleanup
npm run docker:rebuild
```

#### **API ошибки 500/429**
```bash
# Проверка логов
npm run logs:errors

# Проверка API ключа
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Перезапуск при session limits
npm run docker:restart
```

#### **Nginx/SSL проблемы**
```bash
# Проверка конфигурации
sudo nginx -t

# Обновление SSL
sudo certbot renew

# Перезагрузка Nginx
sudo systemctl reload nginx
```

#### **Большие логи**
```bash
# Автоматическая очистка (на сервере)
sudo /root/monitor_logs.sh

# Ручная очистка
npm run logs:clean
```

### 📞 **Поддержка**
- **📚 Документация**: Проверьте соответствующие .md файлы
- **📋 Реальный опыт**: [docs/DEPLOYMENT_LOG_2025-07-25.md](./docs/DEPLOYMENT_LOG_2025-07-25.md)
- **🔧 Серверные скрипты**: [server-setup/README.md](./server-setup/README.md)
- **🐛 Issues**: GitHub Issues для багов и предложений

---

## 📚 **Полная документация**

| Документ                                                     | Описание                                           |
| ------------------------------------------------------------ | -------------------------------------------------- |
| **[DEPLOYMENT_FINAL_CHECKLIST.md](./DEPLOYMENT_FINAL_CHECKLIST.md)** | 🎯 **Главный гайд по production деплою**          |
| **[nginx.production.conf](./nginx.production.conf)**        | ⚡ Готовая Nginx конфигурация с WebSocket          |
| **[server-setup/](./server-setup/)**                        | 🛠️ Серверные скрипты (мониторинг, бэкапы)        |
| **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)**                    | 🐳 Полное руководство по Docker                   |
| **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)**                  | 📊 Система логирования и мониторинга              |
| **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)**                | 🛡️ Безопасность и защита от атак                 |
| **[TOOLS_GUIDE.md](./TOOLS_GUIDE.md)**                      | 🔧 Встроенные функции ИИ (поиск, время, калькулятор) |
| **[docs/DEPLOYMENT_LOG_2025-07-25.md](./docs/DEPLOYMENT_LOG_2025-07-25.md)** | 📚 Реальный журнал production деплоя             |

---

## 🎯 **Ключевые особенности**

### ✨ **Что делает этот проект особенным**
- **🚀 Готов к production**: Реально протестирован на живом сервере с доменом
- **📖 Исчерпывающая документация**: 8+ детальных гайдов для каждого аспекта
- **🛠️ Богатая автоматизация**: 20+ NPM скриптов + серверные утилиты
- **🔒 Enterprise-level безопасность**: Multi-layer защита + автоматический мониторинг
- **📊 Профессиональное логирование**: Structured JSON + автоматическая ротация
- **⚡ Оптимизированная производительность**: Docker multi-stage + WebSocket optimization

### 🏆 **Production-Tested Features**
- ✅ **Real domain with SSL**: Полная настройка с Let's Encrypt
- ✅ **Concurrent WebSocket**: Множественные пользователи с session management
- ✅ **Audio processing**: Real-time голосовая обработка через OpenAI
- ✅ **Error recovery**: Автоматическое восстановление при сбоях
- ✅ **Security hardening**: Fail2ban + firewall + CSP headers
- ✅ **Monitoring & alerting**: Health checks + log rotation + backups

---

## 🤝 **Вклад в проект**

Pull requests приветствуются! Для больших изменений сначала откройте issue для обсуждения.

### 🎯 **Приоритетные области для улучшений**
- 📱 Mobile-first responsive design
- 🌍 Internationalization (i18n)
- 📈 Advanced analytics и metrics
- 🔄 Redis для session storage
- 🎪 Load balancing для multiple instances

## 📝 **Лицензия**
MIT License

---

**🚀 Powered by OpenAI Realtime API, Next.js 15, Docker & Production Experience**

**⭐ Если проект был полезен, поставьте звездочку на GitHub!**
