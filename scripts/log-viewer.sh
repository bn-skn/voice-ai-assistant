#!/bin/bash

# 📊 Log Viewer для голосового ИИ-ассистента
# Удобный просмотр логов в терминале

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Путь к логам
LOG_DIR="logs"
TODAY=$(date +%Y-%m-%d)

# Функция помощи
show_help() {
    echo -e "${CYAN}📊 Log Viewer для голосового ИИ-ассистента${NC}"
    echo ""
    echo "Использование: $0 [КОМАНДА] [ОПЦИИ]"
    echo ""
    echo -e "${YELLOW}Команды:${NC}"
    echo "  live          - Просмотр логов в реальном времени"
    echo "  errors        - Показать только ошибки"
    echo "  sessions      - Показать логи сессий"
    echo "  api           - Показать HTTP запросы"
    echo "  performance   - Показать медленные операции"
    echo "  search TEXT   - Поиск по тексту в логах"
    echo "  stats         - Статистика логов"
    echo "  tail [N]      - Последние N строк (по умолчанию 50)"
    echo "  clean         - Очистить старые логи"
    echo ""
    echo -e "${YELLOW}Опции:${NC}"
    echo "  -d DATE       - Дата в формате YYYY-MM-DD (по умолчанию сегодня)"
    echo "  -f            - Следить за файлом (как tail -f)"
    echo "  -h            - Показать эту справку"
    echo ""
    echo -e "${YELLOW}Примеры:${NC}"
    echo "  $0 live                    # Логи в реальном времени"
    echo "  $0 errors -d 2024-01-15   # Ошибки за конкретную дату"
    echo "  $0 search \"session\"       # Поиск по слову session"
    echo "  $0 api -f                 # HTTP запросы в реальном времени"
}

# Проверка существования директории логов
check_logs_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        echo -e "${RED}❌ Директория логов не найдена: $LOG_DIR${NC}"
        echo "Убедитесь, что приложение запущено и создает логи."
        exit 1
    fi
}

# Получение файла логов
get_log_file() {
    local log_type="$1"
    local date="${2:-$TODAY}"
    echo "$LOG_DIR/${log_type}-${date}.log"
}

# Проверка существования файла
check_log_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Файл логов не найден: $file${NC}"
        echo "Доступные файлы:"
        ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "Нет файлов логов"
        exit 1
    fi
}

# Красивый вывод JSON логов
pretty_json() {
    if command -v jq >/dev/null 2>&1; then
        jq -C '.'
    else
        # Если jq нет, простая раскраска
        sed -E "s/\"level\":\"error\"/$(printf "${RED}")&$(printf "${NC}")/g" | \
        sed -E "s/\"level\":\"warn\"/$(printf "${YELLOW}")&$(printf "${NC}")/g" | \
        sed -E "s/\"level\":\"info\"/$(printf "${GREEN}")&$(printf "${NC}")/g" | \
        sed -E "s/\"message\":\"([^\"]*)\"/$(printf "${CYAN}")&$(printf "${NC}")/g"
    fi
}

# Живые логи (все)
live_logs() {
    local date="${1:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${GREEN}📡 Просмотр логов в реальном времени...${NC}"
    echo -e "${YELLOW}Файл: $combined_log${NC}"
    echo -e "${BLUE}Нажмите Ctrl+C для выхода${NC}"
    echo ""
    
    if [ -f "$combined_log" ]; then
        tail -f "$combined_log" | while read line; do
            echo "$line" | pretty_json
        done
    else
        echo -e "${YELLOW}⏳ Ожидание создания файла логов...${NC}"
        touch "$combined_log"
        tail -f "$combined_log" | while read line; do
            echo "$line" | pretty_json
        done
    fi
}

# Только ошибки
show_errors() {
    local date="${1:-$TODAY}"
    local error_log=$(get_log_file "error" "$date")
    
    echo -e "${RED}🚨 Ошибки за $date${NC}"
    echo ""
    
    if [ -f "$error_log" ]; then
        cat "$error_log" | pretty_json
    else
        echo -e "${GREEN}✅ Ошибок не найдено!${NC}"
    fi
}

# Логи сессий
show_sessions() {
    local date="${1:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${PURPLE}👥 Логи сессий за $date${NC}"
    echo ""
    
    if [ -f "$combined_log" ]; then
        grep -E "(Session created|Session ended|User added to queue)" "$combined_log" | pretty_json
    else
        echo -e "${YELLOW}📝 Логов сессий не найдено${NC}"
    fi
}

# HTTP запросы
show_api() {
    local date="${1:-$TODAY}"
    local http_log=$(get_log_file "http" "$date")
    local follow="$2"
    
    echo -e "${BLUE}🌐 HTTP запросы за $date${NC}"
    echo ""
    
    if [ -f "$http_log" ]; then
        if [ "$follow" = "-f" ]; then
            tail -f "$http_log" | pretty_json
        else
            cat "$http_log" | pretty_json
        fi
    else
        echo -e "${YELLOW}📝 HTTP логов не найдено${NC}"
    fi
}

# Медленные операции
show_performance() {
    local date="${1:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${YELLOW}🐌 Медленные операции за $date${NC}"
    echo ""
    
    if [ -f "$combined_log" ]; then
        grep -E "(Performance:|\"slow\":true)" "$combined_log" | pretty_json
    else
        echo -e "${GREEN}⚡ Медленных операций не найдено${NC}"
    fi
}

# Поиск по тексту
search_logs() {
    local search_term="$1"
    local date="${2:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${CYAN}🔍 Поиск '$search_term' в логах за $date${NC}"
    echo ""
    
    if [ -f "$combined_log" ]; then
        grep -i "$search_term" "$combined_log" | pretty_json
    else
        echo -e "${YELLOW}📝 Логов не найдено${NC}"
    fi
}

# Статистика логов
show_stats() {
    local date="${1:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${CYAN}📊 Статистика логов за $date${NC}"
    echo ""
    
    if [ ! -f "$combined_log" ]; then
        echo -e "${YELLOW}📝 Логов не найдено${NC}"
        return
    fi
    
    echo -e "${YELLOW}Общая статистика:${NC}"
    echo "  Всего записей: $(wc -l < "$combined_log")"
    echo "  Размер файла: $(du -h "$combined_log" | cut -f1)"
    echo ""
    
    echo -e "${YELLOW}По уровням:${NC}"
    echo "  Ошибки:      $(grep -c '"level":"error"' "$combined_log" 2>/dev/null || echo 0)"
    echo "  Предупреждения: $(grep -c '"level":"warn"' "$combined_log" 2>/dev/null || echo 0)"
    echo "  Информация:  $(grep -c '"level":"info"' "$combined_log" 2>/dev/null || echo 0)"
    echo "  HTTP:        $(grep -c '"level":"http"' "$combined_log" 2>/dev/null || echo 0)"
    echo "  Отладка:     $(grep -c '"level":"debug"' "$combined_log" 2>/dev/null || echo 0)"
    echo ""
    
    echo -e "${YELLOW}Активность:${NC}"
    echo "  Сессий создано: $(grep -c "Session created" "$combined_log" 2>/dev/null || echo 0)"
    echo "  Сессий завершено: $(grep -c "Session ended" "$combined_log" 2>/dev/null || echo 0)"
    echo "  API запросов: $(grep -c "Request started" "$combined_log" 2>/dev/null || echo 0)"
    echo ""
    
    echo -e "${YELLOW}Топ ошибок:${NC}"
    if [ -f "$(get_log_file "error" "$date")" ]; then
        grep -o '"message":"[^"]*"' "$(get_log_file "error" "$date")" 2>/dev/null | \
        sort | uniq -c | sort -nr | head -5 | \
        while read count message; do
            echo "  $count × $message"
        done
    else
        echo "  Ошибок нет ✅"
    fi
}

# Последние N строк
show_tail() {
    local lines="${1:-50}"
    local date="${2:-$TODAY}"
    local combined_log=$(get_log_file "combined" "$date")
    
    echo -e "${GREEN}📄 Последние $lines записей за $date${NC}"
    echo ""
    
    if [ -f "$combined_log" ]; then
        tail -n "$lines" "$combined_log" | pretty_json
    else
        echo -e "${YELLOW}📝 Логов не найдено${NC}"
    fi
}

# Очистка старых логов
clean_logs() {
    echo -e "${YELLOW}🧹 Очистка старых логов...${NC}"
    
    # Удаляем логи старше 30 дней
    find "$LOG_DIR" -name "*.log" -mtime +30 -type f | while read file; do
        echo "Удаляю: $file"
        rm "$file"
    done
    
    # Удаляем сжатые логи старше 90 дней
    find "$LOG_DIR" -name "*.gz" -mtime +90 -type f | while read file; do
        echo "Удаляю: $file"
        rm "$file"
    done
    
    echo -e "${GREEN}✅ Очистка завершена${NC}"
    echo ""
    echo -e "${CYAN}Текущие файлы логов:${NC}"
    ls -lah "$LOG_DIR"/*.log 2>/dev/null || echo "Нет файлов логов"
}

# Основная логика
main() {
    check_logs_dir
    
    local command="$1"
    local date="$TODAY"
    local follow_flag=""
    
    # Парсинг аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--date)
                date="$2"
                shift 2
                ;;
            -f|--follow)
                follow_flag="-f"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "$command" in
        live)
            live_logs "$date"
            ;;
        errors)
            show_errors "$date"
            ;;
        sessions)
            show_sessions "$date"
            ;;
        api)
            show_api "$date" "$follow_flag"
            ;;
        performance)
            show_performance "$date"
            ;;
        search)
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Укажите текст для поиска${NC}"
                exit 1
            fi
            search_logs "$2" "$date"
            ;;
        stats)
            show_stats "$date"
            ;;
        tail)
            show_tail "$2" "$date"
            ;;
        clean)
            clean_logs
            ;;
        ""|help)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Неизвестная команда: $command${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Запуск
main "$@" 