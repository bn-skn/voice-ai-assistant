/**
 * Конфигурация Tools (функций) для OpenAI Realtime API
 * Здесь определяются все доступные функции которые может вызывать ИИ
 */

// Типы для OpenAI Realtime API Tools
export interface RealtimeTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Базовые tools для демонстрации
export const AVAILABLE_TOOLS: RealtimeTool[] = [
  {
    name: "get_current_time",
    description: "Получить текущее время и дату. Используй когда пользователь спрашивает про время.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Часовой пояс (например: 'Europe/Moscow', 'UTC')",
          enum: ["UTC", "Europe/Moscow", "America/New_York", "Asia/Tokyo"]
        }
      },
      required: []
    }
  },

  // ВРЕМЕННО ОТКЛЮЧЕНО - требует API ключ
  // {
  //   name: "get_weather",
  //   description: "Получить информацию о погоде в указанном городе. Всегда спрашивай город у пользователя перед вызовом.",
  //   parameters: {
  //     type: "object",
  //     properties: {
  //       location: {
  //         type: "string",
  //         description: "Город или локация для получения погоды"
  //       },
  //       units: {
  //         type: "string",
  //         description: "Единицы измерения температуры",
  //         enum: ["celsius", "fahrenheit"],
  //         default: "celsius"
  //       }
  //     },
  //     required: ["location"]
  //   }
  // },

  {
    name: "calculate",
    description: "Выполнить математические вычисления. Поддерживает базовые операции и функции.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Математическое выражение для вычисления (например: '2 + 2 * 3', 'sqrt(16)', 'sin(30)')"
        }
      },
      required: ["expression"]
    }
  },

  {
    name: "search_web",
    description: "Поиск актуальной информации в интернете через ChatGPT web search. Используй когда нужны свежие данные, новости, текущие события или информация которой может не быть в обучающих данных.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Поисковый запрос на русском или английском языке"
        },
        location: {
          type: "string", 
          description: "Локация для более точных результатов (например: 'Moscow', 'Russia', 'Saint Petersburg')",
          default: "Russia"
        }
      },
      required: ["query"]
    }
  }
];

// Обработчики функций (будут вызываться когда ИИ запросит выполнение)
export const TOOL_HANDLERS = {
  get_current_time: async (args: { timezone?: string }) => {
    const timezone = args.timezone || 'Europe/Moscow';
    const now = new Date();
    
    return {
      success: true,
      data: {
        current_time: now.toLocaleString('ru-RU', { 
          timeZone: timezone,
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        timezone: timezone,
        iso_string: now.toISOString()
      }
    };
  },

  // ВРЕМЕННО ОТКЛЮЧЕНО
  // get_weather: async (args: { location: string; units?: string }) => {
  //   // В реальном приложении здесь был бы вызов API погоды
  //   return {
  //     success: false,
  //     error: "Weather API не настроен. Добавьте ключ OpenWeatherMap или другого сервиса.",
  //     data: {
  //       location: args.location,
  //       message: "Функция погоды требует настройки внешнего API"
  //     }
  //   };
  // },

  calculate: async (args: { expression: string }) => {
    try {
      // Простой безопасный калькулятор (в продакшене использовать math.js)
      const sanitized = args.expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      
      return {
        success: true,
        data: {
          expression: args.expression,
          result: result,
          formatted: `${args.expression} = ${result}`
        }
      };
    } catch {
      return {
        success: false,
        error: "Ошибка вычисления",
        data: {
          expression: args.expression,
          message: "Проверьте правильность математического выражения"
        }
      };
    }
  },

  search_web: async (args: { query: string; location?: string }) => {
    try {
      console.log('🔍 Starting web search:', args);
      
      // Используем наш API endpoint для веб-поиска
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: args.query,
          location: args.location
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Search API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Search completed successfully');

      return result;
    } catch (error) {
      console.error('🔍 Web search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error',
        data: {
          query: args.query,
          message: "Ошибка при выполнении веб-поиска. Попробуйте позже."
        }
      };
    }
  }
};

export type ToolHandler = typeof TOOL_HANDLERS[keyof typeof TOOL_HANDLERS];
export type ToolResult = Awaited<ReturnType<ToolHandler>>; 