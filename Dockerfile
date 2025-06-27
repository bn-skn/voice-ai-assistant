# ===== ЭТАП 1: Сборка зависимостей =====
FROM node:20-alpine AS deps

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (только production для финального образа)
RUN npm ci --only=production --frozen-lockfile

# ===== ЭТАП 2: Сборка приложения =====
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci --frozen-lockfile

# Копируем остальной код проекта
COPY . .

# Сборка Next.js приложения
RUN npm run build

# ===== ЭТАП 3: Финальный образ для продакшена =====
FROM node:20-alpine AS runner

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные утилиты для логирования и мониторинга
RUN apk add --no-cache \
    curl \
    bash \
    jq \
    && rm -rf /var/cache/apk/*

# Устанавливаем переменные окружения для продакшена
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя с ограниченными правами для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Создаем директории для логов и скриптов
RUN mkdir -p /app/logs /app/scripts && \
    chown -R nextjs:nodejs /app

# Копируем production зависимости
COPY --from=deps /app/node_modules ./node_modules

# Копируем собранное приложение из этапа "builder"
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем скрипты для логирования
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/aliases.sh ./

# Делаем скрипты исполняемыми
RUN chmod +x ./scripts/*.sh ./aliases.sh

# Устанавливаем владельца файлов
RUN chown -R nextjs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт 3000
EXPOSE 3000

# Health check для Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/session?action=stats || exit 1

# Команда для запуска приложения
CMD ["node", "server.js"] 