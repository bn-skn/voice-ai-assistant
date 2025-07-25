# 📋 **Полный План Деплоя Голосового ИИ-Ассистента**
### Версия 2.0 (Production-Ready)

---

### **🎯 Цель:**
Развернуть приложение "Голосовой ИИ-Ассистент" на чистом сервере Ubuntu 22.04 LTS, настроить домен, SSL-сертификат и запустить приложение в Docker-контейнере с использованием Nginx в качестве обратного прокси.

### **🧰 Требования:**
- Сервер с Ubuntu 22.04 LTS (минимум: 1 vCPU, 2GB RAM, 20GB SSD).
- Доменное имя, направленное на IP-адрес вашего сервера (A-запись в DNS).
- SSH-доступ к серверу с root-правами.
- API-ключ OpenAI с доступом к Realtime API.

---

## **ЭТАП 0: Предварительные проверки** 🔍

*Цель: Убедиться что все готово для деплоя.*

- [ ] **0.1 Проверить ресурсы сервера:**
  ```bash
  # Проверить RAM (минимум 2GB)
  free -h
  
  # Проверить место на диске (минимум 20GB)
  df -h
  
  # Проверить CPU
  lscpu
  ```

- [ ] **0.2 Проверить доступность портов:**
  ```bash
  # Проверить что порты свободны
  sudo netstat -tlnp | grep -E ':80|:443|:3000'
  # Результат должен быть пустым
  ```

- [ ] **0.3 Проверить DNS настройки:**
  ```bash
  # Замените your_domain.com на ваш домен
  nslookup your_domain.com
  # IP должен совпадать с IP вашего сервера
  ```

- [ ] **0.4 Проверить OpenAI API ключ локально:**
  ```bash
  # Тестовый запрос (замените YOUR_API_KEY)
  curl -H "Authorization: Bearer YOUR_API_KEY" \
       -H "Content-Type: application/json" \
       https://api.openai.com/v1/models | jq '.data[] | select(.id=="gpt-4o-realtime-preview-2024-12-17")'
  # Должен вернуть информацию о модели
  ```

---

## **ЭТАП 1: Подготовка Сервера** 🛡️

*Цель: Настроить безопасную и готовую среду для развертывания.*

- [ ] **1.1 Подключиться к серверу по SSH:**
  ```bash
  ssh root@YOUR_SERVER_IP
  ```

- [ ] **1.2 Обновить систему:**
  ```bash
  apt update && apt upgrade -y
  ```

- [ ] **1.3 Создать нового пользователя (для безопасности):**
  *Замените `deployer` на имя вашего пользователя.*
  ```bash
  adduser deployer
  usermod -aG sudo deployer
  
  # Настроить SSH для нового пользователя
  mkdir -p /home/deployer/.ssh
  cp ~/.ssh/authorized_keys /home/deployer/.ssh/
  chown -R deployer:deployer /home/deployer/.ssh
  chmod 700 /home/deployer/.ssh
  chmod 600 /home/deployer/.ssh/authorized_keys
  ```

- [ ] **1.4 Настроить базовый Firewall:**
  ```bash
  ufw allow OpenSSH
  ufw allow 80/tcp   # HTTP
  ufw allow 443/tcp  # HTTPS
  ufw enable         # Включить firewall (подтвердите 'y')
  ufw status         # Проверить статус
  ```

- [ ] **1.5 Установить необходимые зависимости:**
  ```bash
  apt install -y git curl nginx htop unzip
  ```

- [ ] **1.6 Установить Docker и Docker Compose:**
  ```bash
  # Установить Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  
  # Добавить пользователя в группу docker
  usermod -aG docker deployer
  
  # Установить Docker Compose
  apt install -y docker-compose-plugin
  
  # Включить автозапуск Docker
  systemctl enable docker
  systemctl start docker
  ```

- [ ] **1.7 ВАЖНО: Перелогиниться под новым пользователем:**
  ```bash
  exit  # Выйти из root
  ssh deployer@YOUR_SERVER_IP  # Зайти под новым пользователем
  
  # Проверить что Docker работает
  docker --version
  docker compose version
  ```

---

## **ЭТАП 2: Получение и настройка проекта** ⚙️

*Цель: Загрузить код проекта на сервер и настроить его для production-среды.*

- [ ] **2.1 Клонировать репозиторий проекта:**
  ```bash
  # ВНИМАНИЕ: Замените URL на актуальный репозиторий
  git clone https://github.com/YOUR_USERNAME/voice-ai-assistant.git
  cd voice-ai-assistant
  ```

- [ ] **2.2 Создать и настроить файл переменных окружения:**
  ```bash
  cp .env.example .env.local
  nano .env.local
  ```
  
  **В открывшемся редакторе настройте:**
  - `OPENAI_API_KEY=sk-your-actual-key-here`
  - `ADMIN_TOKEN=your-strong-random-token-123`
  - `NODE_ENV=production`
  - `LOG_LEVEL=info`
  
  *Сохраните файл: `Ctrl+X`, затем `Y`, затем `Enter`*

- [ ] **2.3 Проверить конфигурацию:**
  ```bash
  # Проверить что .env.local создан корректно
  grep -E "OPENAI_API_KEY|ADMIN_TOKEN" .env.local
  
  # Убедиться что API ключ не пустой
  source .env.local && echo "API Key length: ${#OPENAI_API_KEY}"
  ```

---

## **ЭТАП 3: Сборка и запуск приложения** 🐳

*Цель: Собрать production-ready Docker-образ и запустить приложение.*

- [ ] **3.1 Создать директорию для логов:**
  ```bash
  mkdir -p ./logs
  chmod 755 ./logs
  ```

- [ ] **3.2 Собрать Docker-образ:**
  ```bash
  # Эта команда может занять 5-10 минут
  npm run docker:build
  
  # Проверить что образ создан
  docker images | grep voice-ai-assistant
  ```

- [ ] **3.3 Запустить контейнер:**
  ```bash
  npm run docker:start
  
  # Подождать 30 секунд для полной инициализации
  sleep 30
  ```

- [ ] **3.4 Проверить статус и здоровье контейнера:**
  ```bash
  npm run docker:status
  
  # Дополнительная проверка
  curl -f http://localhost:3000/api/session?action=stats
  # Должен вернуть JSON со статистикой
  ```

- [ ] **3.5 Проверить логи на ошибки:**
  ```bash
  npm run logs:errors
  # Не должно быть критических ошибок
  ```

---

## **ЭТАП 4: Настройка Nginx и SSL** 🌐

*Цель: Настроить обратный прокси и безопасное HTTPS-соединение.*

- [ ] **4.1 Остановить стандартный Nginx (если запущен):**
  ```bash
  sudo systemctl stop nginx
  sudo rm -f /etc/nginx/sites-enabled/default
  ```

- [ ] **4.2 Создать конфигурацию Nginx:**
  ```bash
  # Замените your_domain.com на ваш реальный домен
  sudo cp nginx.example.conf /etc/nginx/sites-available/your_domain.com
  
  # Отредактировать конфигурацию
  sudo nano /etc/nginx/sites-available/your_domain.com
  ```
  
  **В редакторе найдите и замените ВСЕ вхождения `your_domain.com` на ваш домен**

- [ ] **4.3 Активировать конфигурацию и проверить:**
  ```bash
  sudo ln -s /etc/nginx/sites-available/your_domain.com /etc/nginx/sites-enabled/
  
  # Проверить конфигурацию на ошибки
  sudo nginx -t
  # Должно показать "syntax is ok" и "test is successful"
  
  # Запустить Nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
  ```

- [ ] **4.4 Проверить доступность через HTTP:**
  ```bash
  # Проверить что сайт отвечает (замените домен)
  curl -I http://your_domain.com
  # Должен вернуть статус 301 (редирект на HTTPS)
  ```

- [ ] **4.5 Получить SSL-сертификат:**
  ```bash
  # Установить Certbot
  sudo apt install -y certbot python3-certbot-nginx
  
  # Получить сертификат (замените домен)
  sudo certbot --nginx -d your_domain.com
  ```
  
  **При запросе Certbot:**
  - Введите ваш email
  - Согласитесь с условиями (Y)
  - Выберите опцию `2` (Redirect) для автоматического HTTPS

- [ ] **4.6 Проверить SSL и перезапустить Nginx:**
  ```bash
  sudo nginx -t
  sudo systemctl restart nginx
  
  # Проверить SSL сертификат
  curl -I https://your_domain.com
  # Должен вернуть статус 200
  ```

---

## **ЭТАП 5: Финальные проверки и настройка мониторинга** 📈

*Цель: Убедиться что всё работает и настроить мониторинг.*

- [ ] **5.1 Полная проверка функциональности:**
  ```bash
  # Проверить основную страницу
  curl -s https://your_domain.com | grep -q "Voice AI Assistant"
  echo "Основная страница: $?"  # Должно быть 0
  
  # Проверить API
  curl -s https://your_domain.com/api/session?action=stats | jq .
  # Должен вернуть JSON со статистикой
  ```

- [ ] **5.2 Проверить в браузере:**
  - Откройте `https://your_domain.com`
  - Нажмите "Начать разговор"
  - Браузер должен запросить доступ к микрофону
  - Попробуйте сказать что-то ассистенту

- [ ] **5.3 Настроить алиасы для удобного управления:**
  ```bash
  echo "source ~/voice-ai-assistant/aliases.sh" >> ~/.bashrc
  source ~/.bashrc
  
  # Теперь доступны короткие команды:
  docker-status    # Статус контейнера
  logs-live        # Логи в реальном времени
  logs-errors      # Только ошибки
  ```

- [ ] **5.4 Настроить автоматическое обновление SSL:**
  ```bash
  # Проверить автообновление certbot
  sudo systemctl status certbot.timer
  
  # Тестовый запуск обновления
  sudo certbot renew --dry-run
  ```

- [ ] **5.5 Настроить мониторинг дискового пространства:**
  ```bash
  # Создать скрипт мониторинга логов
  cat > ~/monitor_logs.sh << 'EOF'
  #!/bin/bash
  LOG_SIZE=$(du -sh ~/voice-ai-assistant/logs | cut -f1)
  DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  
  echo "$(date): Logs size: $LOG_SIZE, Disk usage: $DISK_USAGE%"
  
  if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage above 80%!"
  fi
  EOF
  
  chmod +x ~/monitor_logs.sh
  
  # Добавить в crontab для ежедневной проверки
  (crontab -l 2>/dev/null; echo "0 9 * * * ~/monitor_logs.sh >> ~/monitor.log") | crontab -
  ```

---

## **ЭТАП 6: Backup и безопасность** 🔒

*Цель: Настроить резервное копирование и дополнительную безопасность.*

- [ ] **6.1 Создать скрипт backup:**
  ```bash
  cat > ~/backup.sh << 'EOF'
  #!/bin/bash
  BACKUP_DIR="~/backups/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  
  # Backup конфигурации
  cp ~/voice-ai-assistant/.env.local "$BACKUP_DIR/"
  cp /etc/nginx/sites-available/your_domain.com "$BACKUP_DIR/"
  
  # Backup логов (последние 7 дней)
  find ~/voice-ai-assistant/logs -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/" \;
  
  echo "Backup created: $BACKUP_DIR"
  EOF
  
  chmod +x ~/backup.sh
  ```

- [ ] **6.2 Настроить базовую защиту от брутфорса:**
  ```bash
  # Установить fail2ban
  sudo apt install -y fail2ban
  
  # Создать конфигурацию для Nginx
  sudo tee /etc/fail2ban/jail.local << EOF
  [nginx-http-auth]
  enabled = true
  port = http,https
  logpath = /var/log/nginx/error.log
  
  [nginx-limit-req]
  enabled = true
  port = http,https
  logpath = /var/log/nginx/error.log
  maxretry = 10
  EOF
  
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

---

## **🎉 Поздравляем! Деплой завершен успешно!**

### **📊 Команды для мониторинга:**

```bash
# Статус всех сервисов
docker-status && sudo systemctl status nginx

# Просмотр логов
logs-live          # Логи приложения в реальном времени
logs-errors        # Только ошибки
sudo tail -f /var/log/nginx/access.log  # Логи Nginx

# Мониторинг ресурсов
htop               # Мониторинг CPU/RAM
df -h              # Использование диска
docker stats       # Статистика контейнера
```

### **🔧 Команды для управления:**

```bash
# Перезапуск приложения
npm run docker:restart

# Обновление приложения
cd ~/voice-ai-assistant
git pull
npm run docker:rebuild

# Просмотр статистики сессий
curl -s https://your_domain.com/api/session?action=stats | jq .
```

### **🚨 Troubleshooting:**

- **Сайт не открывается:**
  - Проверьте DNS: `nslookup your_domain.com`
  - Проверьте Nginx: `sudo nginx -t && sudo systemctl status nginx`
  - Проверьте firewall: `sudo ufw status`

- **Микрофон не работает:**
  - Убедитесь что используете `https://` (не `http://`)
  - Проверьте WebSocket соединения в логах Nginx

- **Ошибки приложения:**
  - Проверьте логи: `logs-errors`
  - Проверьте API ключ: `grep OPENAI_API_KEY .env.local`
  - Проверьте статус контейнера: `docker-status`

- **Проблемы с SSL:**
  - Обновите сертификат: `sudo certbot renew`
  - Проверьте конфигурацию: `sudo nginx -t`

---

### **📞 Поддержка:**

Если возникли проблемы:
1. Проверьте логи: `logs-errors`
2. Проверьте статус: `docker-status`
3. Создайте issue с подробным описанием ошибки

**Ваш голосовой ИИ-ассистент готов к работе! 🎤✨** 