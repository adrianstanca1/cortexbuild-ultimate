import { prisma } from '../database/client'

export type AIProvider = 'OLLAMA' | 'OPENAI' | 'GEMINI' | 'CLAUDE'

export interface AICompletionResponse {
  content: string
  provider: AIProvider
  model: string
  latency: number
}

export class UnifiedAIService {
  private defaultProvider: AIProvider = 'OLLAMA'
  private ollamaBaseUrl: string = 'http://localhost:11434'

  constructor() {}

  async getModelConfig(organizationId: string): Promise<any> {
    const config = await prisma.aiModelConfig.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!config) {
      return {
        provider: 'OLLAMA',
        model: 'llama3.1:8b',
        apiEndpoint: 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 4096,
        isActive: true,
        isDefault: true,
      }
    }

    return config
  }

  async generateCompletion(messages: Array<{ role: string; content: string }>, organizationId: string): Promise<AICompletionResponse> {
    const config = await this.getModelConfig(organizationId)
    
    const start = Date.now()
    
    // Use Ollama for local inference
    const response = await fetch(`${config.apiEndpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3.1:8b',
        messages,
        stream: false,
      }),
    })

    const data = await response.json()
    
    return {
      content: data.message?.content || '',
      provider: config.provider as AIProvider,
      model: config.model || 'llama3.1:8b',
      latency: Date.now() - start,
    }
  }
}

export const aiService = new UnifiedAIService()
