#!/bin/bash

# 🐳 Docker Operations Script for Voice AI Assistant
# Удобные команды для управления Docker контейнером

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "\n${BLUE}🐳 $1${NC}\n"
}

# Функция для вывода успеха
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждения
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для вывода ошибки
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка наличия Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker не запущен. Запустите Docker и попробуйте снова."
        exit 1
    fi
}

# Проверка .env.local
check_env() {
    if [[ ! -f .env.local ]]; then
        print_error "Файл .env.local не найден!"
        echo "Создайте .env.local на основе .env.example:"
        echo "cp .env.example .env.local"
        echo "Затем добавьте ваш OPENAI_API_KEY"
        exit 1
    fi
    
    if ! grep -q "OPENAI_API_KEY=sk-" .env.local; then
        print_warning "Возможно, OPENAI_API_KEY не настроен в .env.local"
    fi
}

# Сборка образа
build() {
    print_header "Сборка Docker образа"
    check_docker
    check_env
    
    echo "Сборка может занять несколько минут..."
    if docker-compose build --no-cache; then
        print_success "Образ успешно собран"
    else
        print_error "Ошибка при сборке образа"
        exit 1
    fi
}

# Запуск контейнера
start() {
    print_header "Запуск контейнера"
    check_docker
    check_env
    
    if docker-compose up -d; then
        print_success "Контейнер запущен"
        echo "Приложение доступно по адресу: http://localhost:3000"
        echo "Для просмотра логов: $0 logs"
    else
        print_error "Ошибка при запуске контейнера"
        exit 1
    fi
}

# Остановка контейнера
stop() {
    print_header "Остановка контейнера"
    check_docker
    
    if docker-compose down; then
        print_success "Контейнер остановлен"
    else
        print_error "Ошибка при остановке контейнера"
        exit 1
    fi
}

# Перезапуск контейнера
restart() {
    print_header "Перезапуск контейнера"
    stop
    start
}

# Просмотр логов
logs() {
    print_header "Логи контейнера"
    check_docker
    
    if [[ "$2" == "follow" ]] || [[ "$2" == "-f" ]]; then
        docker-compose logs -f
    else
        docker-compose logs --tail=50
    fi
}

# Статус контейнера
status() {
    print_header "Статус контейнера"
    check_docker
    
    echo "=== Docker Compose Services ==="
    docker-compose ps
    
    echo -e "\n=== Container Stats ==="
    if docker-compose ps | grep -q "Up"; then
        CONTAINER_ID=$(docker-compose ps -q voice-assistant)
        if [[ -n "$CONTAINER_ID" ]]; then
            docker stats "$CONTAINER_ID" --no-stream
        fi
    else
        echo "Контейнер не запущен"
    fi
    
    echo -e "\n=== Health Check ==="
    if curl -f http://localhost:3000/api/session?action=stats 2>/dev/null; then
        print_success "Приложение отвечает на запросы"
    else
        print_warning "Приложение недоступно"
    fi
}

# Очистка Docker ресурсов
cleanup() {
    print_header "Очистка Docker ресурсов"
    check_docker
    
    echo "Остановка и удаление контейнеров..."
    docker-compose down --remove-orphans
    
    echo "Удаление образов..."
    docker image prune -f
    
    echo "Удаление неиспользуемых volume..."
    docker volume prune -f
    
    print_success "Очистка завершена"
}

# Полная пересборка
rebuild() {
    print_header "Полная пересборка"
    check_docker
    check_env
    
    echo "Остановка текущих контейнеров..."
    docker-compose down
    
    echo "Удаление старых образов..."
    docker-compose build --no-cache
    
    echo "Запуск обновленного контейнера..."
    docker-compose up -d
    
    print_success "Пересборка завершена"
    echo "Приложение доступно по адресу: http://localhost:3000"
}

# Экспорт логов приложения
export_logs() {
    print_header "Экспорт логов приложения"
    
    if [[ ! -d ./logs ]]; then
        print_warning "Папка логов не найдена. Запустите контейнер сначала."
        exit 1
    fi
    
    EXPORT_DIR="./logs_export_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXPORT_DIR"
    
    # Копируем логи приложения
    cp -r ./logs/* "$EXPORT_DIR/" 2>/dev/null || true
    
    # Экспортируем логи Docker контейнера
    if docker-compose ps | grep -q "Up"; then
        docker-compose logs > "$EXPORT_DIR/docker_container.log" 2>&1
    fi
    
    print_success "Логи экспортированы в: $EXPORT_DIR"
}

# Помощь
help() {
    echo -e "${BLUE}🐳 Docker Operations Script for Voice AI Assistant${NC}\n"
    echo "Использование: $0 <команда>"
    echo ""
    echo "Команды:"
    echo "  build     - Собрать Docker образ"
    echo "  start     - Запустить контейнер"
    echo "  stop      - Остановить контейнер"
    echo "  restart   - Перезапустить контейнер"
    echo "  status    - Показать статус контейнера"
    echo "  logs      - Показать логи (добавьте 'follow' для real-time)"
    echo "  cleanup   - Очистить Docker ресурсы"
    echo "  rebuild   - Полная пересборка и запуск"
    echo "  export    - Экспортировать все логи"
    echo "  help      - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs follow"
    echo "  $0 status"
}

# Основная логика
case "${1:-help}" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    cleanup)
        cleanup
        ;;
    rebuild)
        rebuild
        ;;
    export)
        export_logs
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Неизвестная команда: $1"
        help
        exit 1
        ;;
esac 