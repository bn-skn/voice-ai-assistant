# 🎤 **ИИ Голосовой Ассистент (Production Ready)**

Продвинутое, готовое к развертыванию веб-приложение голосового ИИ-ассистента на базе **OpenAI Realtime API** и **Next.js**.

## 🚀 **Ключевые возможности**

- **🎙️ Голосовое общение**: Мгновенная обработка голоса и ответов через WebRTC.
- **🌐 ChatGPT Web Search**: Поиск актуальной информации в реальном времени.
- **🎭 8 голосов ИИ**: Выбор из 8 экспрессивных голосов.
- **🎨 3D Voice Orb**: Интерактивный голосовой индикатор с анимацией.
- **🔧 Audio Recovery**: Система автовосстановления звука при сбоях.

### **Production-Ready Функции:**
- **🐳 Docker-инфраструктура**: Полная поддержка Docker с multi-stage сборкой, health-checks и скриптами управления (`npm run docker:start`).
- **🛡️ Комплексная безопасность**: Защита от Prompt Injection, HTTP-заголовки безопасности (CSP), лимиты сессий.
- **📈 Система логирования**: Продвинутое логирование с ротацией файлов и разделением по уровням (info, error, debug).
- **⚙️ Управление сессиями**: Ограничение на 1 пользователя и 5 минут на сессию для контроля расходов и нагрузки.
- **🤖 Автоматизация**: Более 20 NPM-скриптов и алиасов для удобного управления логами и Docker.

## 📋 **Требования**

- **Node.js 18+** и **npm**
- **Docker** и **Docker Compose**
- **API ключ OpenAI** с доступом к Realtime API
- Современный браузер (Chrome, Firefox)

## 🛠️ **Быстрый старт (локально)**

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/bn-skn/voice-ai-assistant.git
    cd voice-ai-assistant
    ```
2.  **Настройте окружение:**
    ```bash
    cp .env.example .env.local
    # Откройте .env.local и добавьте ваш OPENAI_API_KEY
    ```
3.  **Запустите через Docker (рекомендуется):**
    ```bash
    npm run docker:build
    npm run docker:start
    ```
4.  **Откройте приложение:** [http://localhost:3000](http://localhost:3000)

---

## 🔧 **Технические детали**

### **Архитектура**
- **Frontend**: Next.js 15 (React 19), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes с Middleware для логирования
- **AI**: OpenAI Realtime API (`gpt-4o-realtime`)
- **Безопасность**: CSP, X-Frame-Options, Двухуровневые промпты, Лимиты сессий
- **Инфраструктура**: Docker, Nginx (для production), Health Checks, Graceful Shutdown

### **Структура проекта**
```
voice-ai-assistant/
├── app/
│   ├── components/       # React-компоненты
│   ├── config/           # Конфигурация (промпты, лимиты, инструменты)
│   ├── api/              # API-эндпоинты (session, search)
│   └── lib/              # Библиотеки (логгер, менеджер сессий)
├── scripts/              # Скрипты автоматизации (logs, docker)
├── logs/                 # Логи приложения (в .gitignore)
├── docs/                 # История проекта
├── Dockerfile            # Оптимизированный multi-stage Dockerfile
├── docker-compose.yml    # Конфигурация для Docker
└── next.config.ts        # Конфигурация Next.js (CSP, Gzip)
```
- **[Полное руководство по Docker](./DOCKER_GUIDE.md)**
- **[Полное руководство по логам](./LOG_ACCESS_GUIDE.md)**

## 🛡️ **Система безопасности**

Проект включает многоуровневую систему защиты:
- **🔒 Защищенный промпт**: Неизменяемые базовые инструкции.
- **⚙️ Валидация ввода**: Проверка пользовательских промптов на опасные паттерны.
- **🔐 HTTP-заголовки**: Content Security Policy для защиты от XSS и Clickjacking.
- **⏱️ Ограничение сессий**: Защита от DDoS и контроля расходов.

**➡️ [Подробнее в Руководстве по безопасности](./SECURITY_GUIDE.md)**

## 🚀 **Деплой на сервер**

Проект полностью готов к развертыванию на сервере.
```bash
# На сервере, после установки Docker и Nginx:
git clone https://github.com/bn-skn/voice-ai-assistant.git
cd voice-ai-assistant
cp .env.example .env.local
# ... добавьте ваш API-ключ ...
npm run docker:build
npm run docker:start
# Далее настройте Nginx и SSL
```
**➡️ [Подробный пошаговый план деплоя](./DEPLOYMENT_FINAL_CHECKLIST.md)**

---

## 📚 **Документация проекта**

| Документ                                        | Описание                                           |
| ----------------------------------------------- | -------------------------------------------------- |
| **[DEPLOYMENT_FINAL_CHECKLIST.md](./DEPLOYMENT_FINAL_CHECKLIST.md)** | **Главный чек-лист по деплою на сервер.**      |
| **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)**                   | Полное руководство по Docker-командам и управлению. |
| **[REPLIT_GUIDE.md](./REPLIT_GUIDE.md)**                   | **Новое!** Пошаговый гайд по деплою на Replit.   |
| **[LOG_ACCESS_GUIDE.md](./LOG_ACCESS_GUIDE.md)**           | Как просматривать и анализировать логи.          |
| **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)**               | Обзор всех мер безопасности проекта.             |
| **[TOOLS_GUIDE.md](./TOOLS_GUIDE.md)**                     | Описание встроенных функций (Tools) ассистента.  |

---
## 🤝 **Вклад в проект**

Pull requests приветствуются! Для больших изменений сначала откройте issue для обсуждения.

## 📝 **Лицензия**
MIT License

## 🤝 Вклад в проект

Pull requests приветствуются! Для больших изменений сначала откройте issue для обсуждения.

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в этом репозитории.

## 🐳 Развертывание с Docker

Проект полностью готов к развертыванию с помощью Docker с автоматизированными скриптами.

### Быстрый старт
```bash
# 1. Клонирование и настройка
git clone https://github.com/bn-skn/voice-ai-assistant.git
cd voice-ai-assistant
cp .env.example .env.local
# Добавьте ваш OPENAI_API_KEY в .env.local

# 2. Сборка и запуск (рекомендуется)
npm run docker:build
npm run docker:start

# Или через скрипт
./scripts/docker-ops.sh build
./scripts/docker-ops.sh start
```

### Управление контейнером
```bash
# Статус и мониторинг
npm run docker:status          # Статус + health check
npm run docker:logs:follow     # Логи в реальном времени

# Управление
npm run docker:restart         # Перезапуск
npm run docker:stop            # Остановка
npm run docker:rebuild         # Полная пересборка

# Обслуживание
npm run docker:cleanup         # Очистка Docker ресурсов
```

### Традиционный способ
```bash
# Сборка и запуск
docker-compose up --build -d

# Логи и управление
docker-compose logs -f
docker-compose down
```

**📖 Подробное руководство**: [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)

Приложение будет доступно на порту `3000`. Рекомендуется использовать **Nginx** как обратный прокси для управления доменом и SSL.

## ⚙️ Настройка Nginx для продакшена

Для работы приложения на сервере с доменным именем и HTTPS (что обязательно для доступа к микрофону) рекомендуется использовать Nginx как обратный прокси.

1.  **Установите Nginx** на вашем VPS:
    ```bash
    sudo apt update
    sudo apt install nginx
    ```

2.  **Настройте ваш домен**, чтобы он указывал на IP-адрес вашего сервера (A-запись в настройках DNS).

3.  **Создайте конфигурационный файл** для вашего сайта в Nginx:
    ```bash
    sudo nano /etc/nginx/sites-available/your_domain.com
    ```
    Скопируйте в него содержимое из файла `nginx.example.conf`, заменив `your_domain.com` на ваше доменное имя.

4.  **Активируйте конфигурацию**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/your_domain.com /etc/nginx/sites-enabled/
    sudo nginx -t # Проверка на ошибки
    sudo systemctl restart nginx
    ```

5.  **Получите SSL-сертификат** от Let's Encrypt (бесплатно):
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com
    ```
    Certbot автоматически обновит вашу конфигурацию Nginx для работы с HTTPS.

После этих шагов ваше приложение, запущенное в Docker, будет доступно по адресу `https://your_domain.com`.

---

**🚀 Powered by OpenAI Realtime API & ChatGPT Search**
