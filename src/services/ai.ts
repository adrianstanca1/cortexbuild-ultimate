import { API_BASE } from '../lib/auth-storage';

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatRequest {
  message: string
  context?: Record<string, unknown>
}

export interface AIChatResponse {
  reply: string
  data: unknown
  suggestions: string[]
  source?: 'ollama' | 'rule-based'
}

export async function sendChatMessage(
  message: string,
  context?: Record<string, unknown>,
  sessionId?: string
): Promise<AIChatResponse> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, sessionId }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * @deprecated This function is broken — the backend POST /ai/chat does not
 * support SSE streaming. The backend returns a single JSON body with no
 * Transfer-Encoding: chunked or SSE format. This function will never emit
 * a chunk; it buffers the full response and calls onComplete immediately.
 * If streaming is needed, implement SSE properly in server/routes/ai.js
 * using Ollama's stream: true option.
 */
export async function streamChatMessage(
  message: string,
  context: Record<string, unknown>,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

     
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onComplete()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    }

    onComplete()
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}
