import { chat as ollamaChat, stream as ollamaStream, checkConnection as ollamaCheckConnection } from './ollama';

export type Provider = 'ollama' | 'openai' | 'gemini' | 'anthropic';

export interface AIConfig {
  provider: Provider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  content: string;
  provider: Provider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

const config: AIConfig = {
  provider: (process.env.AI_PROVIDER as Provider) || 'ollama',
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY,
  model: process.env.OLLAMA_MODEL || process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || process.env.ANTHROPIC_MODEL,
  baseUrl: process.env.OPENAI_BASE_URL || process.env.GEMINI_BASE_URL || process.env.ANTHROPIC_BASE_URL,
};

export function getConfig(): AIConfig {
  return { ...config };
}

export function setConfig(newConfig: Partial<AIConfig>): void {
  Object.assign(config, newConfig);
}

export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
  }
): Promise<ChatResult> {
  const { provider, model: configModel } = config;
  const model = options?.model || configModel;

  switch (provider) {
    case 'ollama':
      return chatWithOllama(messages, model);

    case 'openai':
      return chatWithOpenAI(messages, model, options);

    case 'gemini':
      return chatWithGemini(messages, model, options);

    case 'anthropic':
      return chatWithAnthropic(messages, model, options);

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function chatWithOllama(
  messages: ChatMessage[],
  model?: string
): Promise<ChatResult> {
  const connected = await ollamaCheckConnection();
  
  if (!connected.connected) {
    throw new Error('Ollama is not connected. Please ensure Ollama is running at http://localhost:11434');
  }

  const content = await ollamaChat(
    messages.map((m) => ({ role: m.role, content: m.content })),
    { model }
  );

  return {
    content,
    provider: 'ollama',
    model: model || config.model || 'llama3.2',
  };
}

async function chatWithOpenAI(
  messages: ChatMessage[],
  model?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<ChatResult> {
  const apiKey = config.apiKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
  }

  const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4',
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'openai',
    model: data.model || model || 'gpt-4',
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
    finishReason: data.choices[0]?.finish_reason,
  };
}

async function chatWithGemini(
  messages: ChatMessage[],
  model?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<ChatResult> {
  const apiKey = config.apiKey;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
  }

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;

  const response = await fetch(
    `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    provider: 'gemini',
    model: model || 'gemini-pro',
  };
}

async function chatWithAnthropic(
  messages: ChatMessage[],
  model?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<ChatResult> {
  const apiKey = config.apiKey;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.');
  }

  const systemMessage = messages.find((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch(
    `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        system: systemMessage?.content,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 1024,
        top_p: options?.topP,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content?.[0]?.text || '',
    provider: 'anthropic',
    model: data.model || model || 'claude-3-5-sonnet-20241022',
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
    finishReason: data.stop_reason,
  };
}

export async function* stream(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): AsyncGenerator<StreamChunk> {
  const { provider, model: configModel } = config;
  const model = options?.model || configModel;

  switch (provider) {
    case 'ollama':
      yield* streamWithOllama(messages, model);
      break;

    case 'openai':
      yield* streamWithOpenAI(messages, model, options);
      break;

    default:
      const result = await chat(messages, { ...options, stream: false });
      yield { content: result.content, done: true };
  }
}

async function* streamWithOllama(
  messages: ChatMessage[],
  model?: string
): AsyncGenerator<StreamChunk> {
  let fullContent = '';

  await ollamaStream(
    messages.map((m) => ({ role: m.role, content: m.content })),
    { model },
    (chunk) => {
      fullContent += chunk;
      process.stdout.write(chunk);
    }
  );

  yield { content: fullContent, done: true };
}

async function* streamWithOpenAI(
  messages: ChatMessage[],
  model?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): AsyncGenerator<StreamChunk> {
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
  }

  const response = await fetch(
    `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          yield { content: '', done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield { content, done: false };
          }
        } catch {
        }
      }
    }
  }

  yield { content: '', done: true };
}

export async function generate(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatResult> {
  return chat([{ role: 'user', content: prompt }], options);
}

export async function* streamGenerate(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<StreamChunk> {
  yield* stream([{ role: 'user', content: prompt }], options);
}

export async function checkProviderConnection(): Promise<{
  provider: Provider;
  connected: boolean;
  message: string;
  models?: string[];
}> {
  const provider = config.provider;

  switch (provider) {
    case 'ollama': {
      const result = await ollamaCheckConnection();
      return {
        provider,
        connected: result.connected,
        message: result.connected
          ? `Connected to Ollama. Available models: ${result.models?.join(', ') || 'none'}`
          : 'Cannot connect to Ollama. Ensure it is running at http://localhost:11434',
        models: result.models,
      };
    }

    case 'openai': {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        const connected = response.ok;
        return {
          provider,
          connected,
          message: connected ? 'Connected to OpenAI' : 'Cannot connect to OpenAI',
        };
      } catch (error) {
        return {
          provider,
          connected: false,
          message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    case 'gemini': {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`
        );
        const connected = response.ok;
        return {
          provider,
          connected,
          message: connected ? 'Connected to Gemini' : 'Cannot connect to Gemini',
        };
      } catch (error) {
        return {
          provider,
          connected: false,
          message: `Gemini connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    case 'anthropic': {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
          }),
        });
        const connected = !response.ok;
        return {
          provider,
          connected: response.ok,
          message: connected ? 'Connected to Anthropic' : 'Cannot connect to Anthropic',
        };
      } catch (error) {
        return {
          provider,
          connected: false,
          message: `Anthropic connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    default:
      return {
        provider,
        connected: false,
        message: `Unknown provider: ${provider}`,
      };
  }
}

export { ollamaChat, ollamaStream, ollamaCheckConnection as checkConnection };
