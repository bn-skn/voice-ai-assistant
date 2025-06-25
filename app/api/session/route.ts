import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_SYSTEM_PROMPT } from '../../config/system-prompt'
import { buildFinalSystemPrompt } from '../../config/protected-prompt'
import { 
  REALTIME_MODEL, 
  DEFAULT_VOICE, 
  REALTIME_API_URLs 
} from '../../config/realtime-config'

/**
 * API Route для создания ephemeral token для OpenAI Realtime API
 * Этот endpoint обменивает серверный API ключ на временный токен
 * для безопасного использования на клиенте
 */
export async function POST(_req: NextRequest) {
  try {
    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не найден в переменных окружения' },
        { status: 500 }
      )
    }

    // Создаем ephemeral token через OpenAI Realtime API
    const response = await fetch(REALTIME_API_URLs.session, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: DEFAULT_VOICE,
        instructions: buildFinalSystemPrompt(DEFAULT_SYSTEM_PROMPT),
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API ошибка:', response.status, errorText)
      return NextResponse.json(
        { 
          error: `OpenAI API ошибка: ${response.status}`,
          details: errorText,
          model: REALTIME_MODEL
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Ephemeral token создан успешно')
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('[POST /api/session] ошибка:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 