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

export async function streamChatMessage(
  message: string,
  context: Record<string, unknown>,
  onChunk: (text: string) => void,
  onComplete: (intent?: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.token) onChunk(data.token)
          if (data.done) { onComplete(data.intent); return }
          if (data.error) { onError(new Error(data.error)); return }
        } catch { /* skip */ }
      }
    }

    onComplete()
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export interface AgentStatus {
  key: string
  name: string
  description: string
  aliases: string[]
}

export async function fetchAgentStatus(): Promise<{ agents: AgentStatus[] }> {
  const res = await fetch(`${API_BASE}/ai/agent-status`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
