import { NextRequest, NextResponse } from 'next/server'
import { withApiLogging, logApiEvent, logValidationError } from '../../lib/api-logger-middleware'
import { logOpenAICall, logSecureError } from '../../lib/logger'
import { randomUUID } from 'crypto'

/**
 * API Route для веб-поиска через ChatGPT Search
 */
async function handlePOST(req: NextRequest) {
  const requestId = randomUUID();
  
  try {
    const { query, location } = await req.json();

    if (!query || typeof query !== 'string') {
      logValidationError('query', query, requestId);
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      logValidationError('OPENAI_API_KEY', 'missing', requestId);
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не найден в переменных окружения' },
        { status: 500 }
      );
    }

    logApiEvent('search_request', requestId, { 
      query: query.substring(0, 100), 
      location: location || 'Russia' 
    });

    // Используем ChatGPT Search через Chat Completions API
    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        messages: [{
          role: 'user',
          content: query
        }],
        web_search_options: location ? {
          user_location: {
            type: "approximate",
            approximate: {
              country: "RU",
              city: location,
              region: location
            }
          }
        } : {},
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const duration = Date.now() - startTime;
    logOpenAICall('chat/completions', response.status, duration, { 
      requestId, 
      model: 'gpt-4o-search-preview',
      queryLength: query.length
    });

    if (!response.ok) {
      const errorText = await response.text();
      logSecureError(new Error(`Search API error: ${response.status}`), 'search_request', {
        requestId,
        status: response.status,
        details: errorText.substring(0, 200)
      });
      return NextResponse.json(
        { 
          error: `Search API error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const searchResult = data.choices[0]?.message?.content;

    if (!searchResult) {
      logApiEvent('search_no_results', requestId, { query: query.substring(0, 100) });
      return NextResponse.json(
        { error: 'No search results received' },
        { status: 500 }
      );
    }

    logApiEvent('search_completed', requestId, { 
      query: query.substring(0, 100),
      resultLength: searchResult.length,
      location: location || 'Russia'
    });

    return NextResponse.json({
      success: true,
      data: {
        query,
        location: location || 'Russia',
        result: searchResult,
        timestamp: new Date().toISOString(),
        source: 'ChatGPT Web Search',
        model: 'gpt-4o-search-preview'
      }
    });

  } catch (error: unknown) {
    logSecureError(error as Error, 'POST /api/search', { requestId });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown search error',
        success: false
      },
      { status: 500 }
    );
  }
} 

export const POST = withApiLogging(handlePOST); 