import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route для веб-поиска через ChatGPT Search
 */
export async function POST(req: NextRequest) {
  try {
    const { query, location } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не найден в переменных окружения' },
        { status: 500 }
      );
    }

    console.log('🔍 Web search request:', { query, location });

    // Используем ChatGPT Search через Chat Completions API
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Search API error:', response.status, errorText);
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
      return NextResponse.json(
        { error: 'No search results received' },
        { status: 500 }
      );
    }

    console.log('🔍 Search completed successfully');

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
    console.error('[POST /api/search] ошибка:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown search error',
        success: false
      },
      { status: 500 }
    );
  }
} 