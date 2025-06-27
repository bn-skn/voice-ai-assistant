# 🚀 Руководство по деплою ИИ Голосового Ассистента

## 📋 Новые возможности (версия 2.0)

### 🔒 Система ограничений сессий
- **Ограничение пользователей**: Только 1 пользователь одновременно
- **Ограничение времени**: 5 минут на сессию
- **Система очереди**: Автоматическая очередь при занятости
- **Предупреждения**: Уведомления за 3, 2 и 1 минуту до окончания

### 🐳 Управление через Docker
- **Автоматизированные скрипты**: `docker-ops.sh` для полного контроля
- **NPM-команды**: `npm run docker:start`, `npm run docker:status` и др.
- **Health Checks**: Автоматический мониторинг состояния приложения
- **Оптимизация**: Production-ready образ с Gzip и CSP

## 🐳 Деплой с Docker

### 1. Быстрый запуск (рекомендуемый способ)

```bash
# 1. Клонирование репозитория
git clone https://github.com/your-username/voice-ai-assistant.git
cd voice-ai-assistant

# 2. Создание .env.local
cp .env.example .env.local
# Откройте .env.local и добавьте ваш OPENAI_API_KEY

# 3. Сборка и запуск
npm run docker:build
npm run docker:start
```

### 2. Управление контейнером

Используйте удобные `npm`-команды:

```bash
# Просмотр логов в реальном времени
npm run docker:logs:follow

# Проверка статуса и health-check
npm run docker:status

# Перезапуск контейнера
npm run docker:restart

# Остановка контейнера
npm run docker:stop
```
**📖 За полным списком команд обратитесь к [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)**

### 3. Настройка Nginx для продакшена

1. **Установите Nginx**:
   ```bash
   sudo apt update && sudo apt install nginx
   ```

2. **Скопируйте конфигурацию**:
   ```bash
   sudo cp nginx.example.conf /etc/nginx/sites-available/your-domain.com
   sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
   ```

3. **Замените домен** в конфигурации:
   ```bash
   sudo nano /etc/nginx/sites-available/your-domain.com
   # Замените 'your_domain.com' на ваш домен
   ```

4. **Получите SSL сертификат**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

5. **Перезапустите Nginx**:
   ```bash
   sudo nginx -t && sudo systemctl restart nginx
   ```

## 📊 Административные функции

### Мониторинг сессий

```bash
# Статистика сессий
curl "https://your-domain.com/api/session?action=stats"

# Принудительное завершение всех сессий (требует ADMIN_TOKEN)
curl -X GET "https://your-domain.com/api/session?action=forceEndAll" \
     -H "x-admin-token: your-secret-admin-token"
```

### Логи Docker

```bash
# Просмотр логов
docker-compose logs -f

# Перезапуск при изменении конфигурации
docker-compose down && docker-compose up --build -d
```

## 🔧 Настройка ограничений

### Изменение времени сессии

Откройте `app/config/session-limits.ts` и измените:

```typescript
export const SESSION_LIMITS = {
  MAX_SESSION_DURATION_MINUTES: 30, // Увеличить до 30 минут
  // ...
}
```

### Разрешение нескольких пользователей

```typescript
export const USER_LIMITS = {
  MAX_CONCURRENT_USERS: 3, // До 3 пользователей одновременно
  // ...
}
```

**⚠️ ВНИМАНИЕ**: Увеличение количества пользователей может привести к конфликтам WebRTC и высокому расходу токенов OpenAI (~$0.06/минута на пользователя).

## 🛡️ Безопасность

### Рекомендуемые настройки firewall

```bash
# Разрешить только HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Мониторинг расходов

- **OpenAI Realtime API**: ~$0.06/минута на пользователя
- **При 5 минутах на сессию**: ~$0.30 за сессию
- **100 сессий в день**: ~$30/день

**Рекомендация**: Установите лимиты расходов в панели OpenAI.

## 🐛 Решение проблем

### "Сессия занята" 

Если сервер завис с активной сессией:

```bash
# Принудительное очищение всех сессий
curl -X GET "https://your-domain.com/api/session?action=forceEndAll" \
     -H "x-admin-token: your-admin-token"

# Или перезапуск Docker
docker-compose restart
```

### Высокий расход токенов

1. Уменьшите `MAX_SESSION_DURATION_MINUTES`
2. Проверьте логи на зависшие сессии
3. Установите `MAX_CONCURRENT_USERS: 1`

### WebRTC не работает

1. Проверьте HTTPS (обязательно для микрофона)
2. Убедитесь что Nginx правильно проксирует WebSocket
3. Проверьте firewall (порты 80, 443)

## 📈 Масштабирование

Для большего количества пользователей рассмотрите:

1. **Несколько инстансов** с балансировщиком нагрузки
2. **Redis** для синхронизации сессий между серверами  
3. **WebSocket кластер** для уведомлений очереди

---

**🔗 Полезные ссылки:**
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

**💬 Поддержка:** Создайте issue в GitHub репозитории для помощи. 