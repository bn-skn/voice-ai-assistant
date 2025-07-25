import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_SYSTEM_PROMPT } from '../../config/system-prompt'
import { buildFinalSystemPrompt } from '../../config/protected-prompt'
import { 
  REALTIME_MODEL, 
  DEFAULT_VOICE, 
  REALTIME_API_URLs 
} from '../../config/realtime-config'
import sessionManager from '../../lib/session-manager'
import { withApiLogging, logApiEvent, logValidationError } from '../../lib/api-logger-middleware'
import { logOpenAICall, logSecureError } from '../../lib/logger'
import { randomUUID } from 'crypto'

/**
 * 🔒 API Route для создания ephemeral token с контролем сессий
 * Проверяет ограничения пользователей и создает управляемые сессии
 */
async function handlePOST(req: NextRequest) {
  const requestId = randomUUID();
  
  try {
    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      logValidationError('OPENAI_API_KEY', 'missing', requestId);
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не найден в переменных окружения' },
        { status: 500 }
      )
    }

    // Проверяем параметры URL сначала (для sendBeacon)
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const sessionIdFromUrl = searchParams.get('sessionId')

    // Если это запрос на завершение сессии через URL параметры
    if (action === 'end' && sessionIdFromUrl) {
      logApiEvent('session_end_request', requestId, { sessionId: sessionIdFromUrl });
      await sessionManager.endSession(sessionIdFromUrl, 'user_disconnect')
      
      return NextResponse.json({ 
        success: true,
        message: 'Сессия завершена',
        stats: sessionManager.getStats()
      })
    }

    // Получаем данные из тела запроса (только для создания сессии)
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Если тело пустое, используем значения по умолчанию
      body = {}
    }
    const { systemPrompt } = body

    // Генерируем уникальный ID пользователя из IP и User-Agent
    const userIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const userId = `${userIP}_${Buffer.from(userAgent).toString('base64').slice(0, 8)}`

    logApiEvent('session_create_request', requestId, { 
      userId, 
      userIP, 
      hasSystemPrompt: !!systemPrompt 
    });

    // ===== ПРОВЕРКА ОГРАНИЧЕНИЙ ЧЕРЕЗ МЕНЕДЖЕР СЕССИЙ =====
    const connectionResult = await sessionManager.requestConnection(userId)
    
    if (!connectionResult.success) {
      // Пользователь должен ждать в очереди
      logApiEvent('session_queue_added', requestId, { 
        userId, 
        queuePosition: connectionResult.queuePosition 
      });
      return NextResponse.json({ 
        error: 'session_limit_reached',
        message: connectionResult.message,
        queuePosition: connectionResult.queuePosition,
        stats: sessionManager.getStats()
      }, { status: 429 }) // Too Many Requests
    }

    // ===== СОЗДАЕМ OPENAI REALTIME TOKEN =====
    logApiEvent('openai_token_request', requestId, { sessionId: connectionResult.sessionId });

    const startTime = Date.now();
    const response = await fetch(REALTIME_API_URLs.session, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: DEFAULT_VOICE,
        instructions: buildFinalSystemPrompt(systemPrompt || DEFAULT_SYSTEM_PROMPT),
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        }
      })
    })

    const duration = Date.now() - startTime;
    logOpenAICall('session', response.status, duration, { 
      requestId, 
      sessionId: connectionResult.sessionId 
    });

    if (!response.ok) {
      const errorText = await response.text()
      logSecureError(new Error(`OpenAI API error: ${response.status}`), 'session_creation', {
        requestId,
        status: response.status,
        details: errorText.substring(0, 200)
      });
      
      // Если OpenAI API не доступен, освобождаем сессию
      await sessionManager.endSession(connectionResult.sessionId!, 'admin_stop')
      
      return NextResponse.json(
        { 
          error: 'Failed to create session',
          details: errorText,
          model: REALTIME_MODEL
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Добавляем информацию о сессии к ответу
    const responseData = {
      ...data,
      sessionInfo: {
        sessionId: connectionResult.sessionId,
        timeLimit: connectionResult.timeLimit,
        message: connectionResult.message
      }
    }

    logApiEvent('session_created_successfully', requestId, { 
      sessionId: connectionResult.sessionId,
      timeLimit: connectionResult.timeLimit
    });
    
    return NextResponse.json(responseData)
  } catch (error: unknown) {
    logSecureError(error as Error, 'POST /api/session', { requestId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const POST = withApiLogging(handlePOST);

/**
 * 🔚 API для завершения сессии
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const reasonParam = searchParams.get('reason') || 'user_disconnect'
    const reason = ['user_disconnect', 'time_expired', 'admin_stop'].includes(reasonParam) 
      ? reasonParam as 'user_disconnect' | 'time_expired' | 'admin_stop'
      : 'user_disconnect'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId обязателен' },
        { status: 400 }
      )
    }

    await sessionManager.endSession(sessionId, reason)
    
    return NextResponse.json({ 
      success: true,
      message: 'Сессия завершена',
      stats: sessionManager.getStats()
    })
  } catch (error: unknown) {
    console.error('[DELETE /api/session] ошибка:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 📊 API для получения статистики сессий (для админа)
 */
async function handleGET(req: NextRequest) {
  const requestId = randomUUID();
  
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const sessionId = searchParams.get('sessionId')

    if (action === 'stats') {
      logApiEvent('stats_request', requestId);
      return NextResponse.json(sessionManager.getStats())
    }

    if (action === 'end' && sessionId) {
      // Завершение сессии через GET (для sendBeacon)
      logApiEvent('session_end_beacon', requestId, { sessionId });
      await sessionManager.endSession(sessionId, 'user_disconnect')
      
      return NextResponse.json({ 
        success: true,
        message: 'Сессия завершена',
        stats: sessionManager.getStats()
      })
    }

    if (action === 'forceEndAll') {
      // Простая защита - проверяем наличие admin токена
      const adminToken = req.headers.get('x-admin-token')
      if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
        logApiEvent('admin_access_denied', requestId, { hasToken: !!adminToken });
        return NextResponse.json(
          { error: 'Недостаточно прав' },
          { status: 403 }
        )
      }

      logApiEvent('force_end_all_sessions', requestId, { adminToken: '[HIDDEN]' });
      await sessionManager.forceEndAllSessions()
      return NextResponse.json({ 
        success: true,
        message: 'Все сессии завершены'
      })
    }

    logApiEvent('unknown_action', requestId, { action });
    return NextResponse.json(
      { error: 'Неизвестное действие' },
      { status: 400 }
    )
  } catch (error: unknown) {
    logSecureError(error as Error, 'GET /api/session', { requestId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 

export const GET = withApiLogging(handleGET); 