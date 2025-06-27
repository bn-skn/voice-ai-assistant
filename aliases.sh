#!/bin/bash

# 🚀 Алиасы для быстрого доступа к логам голосового ИИ-ассистента
# Добавьте эти алиасы в ваш ~/.bashrc или ~/.zshrc

# Основные команды просмотра логов
alias logs='./scripts/log-viewer.sh'
alias logs-help='./scripts/log-viewer.sh help'

# Быстрый доступ к разным типам логов
alias logs-live='./scripts/log-viewer.sh live'
alias logs-errors='./scripts/log-viewer.sh errors'
alias logs-sessions='./scripts/log-viewer.sh sessions'
alias logs-api='./scripts/log-viewer.sh api'
alias logs-perf='./scripts/log-viewer.sh performance'
alias logs-stats='./scripts/log-viewer.sh stats'

# Хвост логов (последние записи)
alias logs-tail='./scripts/log-viewer.sh tail'
alias logs-tail-10='./scripts/log-viewer.sh tail 10'
alias logs-tail-100='./scripts/log-viewer.sh tail 100'

# Поиск в логах
logs-search() {
    if [ -z "$1" ]; then
        echo "Использование: logs-search 'текст для поиска'"
        return 1
    fi
    ./scripts/log-viewer.sh search "$1"
}

# Логи за конкретную дату
logs-date() {
    if [ -z "$1" ]; then
        echo "Использование: logs-date YYYY-MM-DD [команда]"
        echo "Пример: logs-date 2024-01-15 errors"
        return 1
    fi
    local date="$1"
    local command="${2:-tail}"
    ./scripts/log-viewer.sh "$command" -d "$date"
}

# Быстрые команды для мониторинга
alias monitor-errors='./scripts/log-viewer.sh errors -f'
alias monitor-api='./scripts/log-viewer.sh api -f'
alias monitor-all='./scripts/log-viewer.sh live'

# Управление логами
alias logs-clean='./scripts/log-viewer.sh clean'
alias logs-size='du -sh logs/'

# Полезные комбинации
alias logs-today='./scripts/log-viewer.sh stats && echo && ./scripts/log-viewer.sh tail 20'
alias logs-check='./scripts/log-viewer.sh stats && ./scripts/log-viewer.sh errors'

# =============================================================================
# 🐳 DOCKER ALIASES
# =============================================================================

# Основные Docker команды
alias docker-build='./scripts/docker-ops.sh build'
alias docker-start='./scripts/docker-ops.sh start'
alias docker-stop='./scripts/docker-ops.sh stop'
alias docker-restart='./scripts/docker-ops.sh restart'
alias docker-status='./scripts/docker-ops.sh status'

# Docker логи
alias docker-logs='./scripts/docker-ops.sh logs'
alias docker-logs-live='./scripts/docker-ops.sh logs follow'

# Docker утилиты
alias docker-cleanup='./scripts/docker-ops.sh cleanup'
alias docker-rebuild='./scripts/docker-ops.sh rebuild'
alias docker-export='./scripts/docker-ops.sh export'

# Экспорт для использования в подскриптах
export -f logs-search logs-date

echo "🚀 Алиасы для логов и Docker загружены!"
echo "📝 Логи: logs-help, logs-live, logs-errors, logs-stats"
echo "🐳 Docker: docker-build, docker-start, docker-status, docker-logs"