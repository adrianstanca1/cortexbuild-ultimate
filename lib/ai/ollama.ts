import ollama from 'ollama';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  numCtx?: number;
  repeatPenalty?: number;
  seed?: number;
  stop?: string[];
}

export interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

export interface StreamOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  numCtx?: number;
  repeatPenalty?: number;
  seed?: number;
  stop?: string[];
}

export async function chat(
  messages: Message[],
  options?: ChatOptions
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL;

  try {
    const response = await ollama.chat({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature: options?.temperature,
        top_p: options?.topP,
        top_k: options?.topK,
        num_ctx: options?.numCtx,
        repeat_penalty: options?.repeatPenalty,
        seed: options?.seed,
        stop: options?.stop,
      },
      stream: false,
    });

    return response.message.content;
  } catch (error) {
    throw new OllamaError(
      `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function stream(
  messages: Message[],
  options?: StreamOptions,
  onChunk?: (content: string) => void
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL;
  let fullContent = '';

  try {
    const response = await ollama.chat({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature: options?.temperature,
        top_p: options?.topP,
        top_k: options?.topK,
        num_ctx: options?.numCtx,
        repeat_penalty: options?.repeatPenalty,
        seed: options?.seed,
        stop: options?.stop,
      },
      stream: true,
    });

    for await (const chunk of response) {
      const content = chunk.message?.content || '';
      fullContent += content;
      onChunk?.(content);
    }

    return fullContent;
  } catch (error) {
    throw new OllamaError(
      `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function loadModel(model?: string): Promise<boolean> {
  const targetModel = model || DEFAULT_MODEL;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: targetModel }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new OllamaError(
        `Failed to load model: ${response.statusText}`,
        response.statusText
      );
    }

    return true;
  } catch (error) {
    if (error instanceof OllamaError) throw error;
    throw new OllamaError(
      `Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function checkConnection(): Promise<{
  connected: boolean;
  version?: string;
  models?: string[];
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      return { connected: false };
    }

    const data = await response.json();
    return {
      connected: true,
      models: data.models?.map((m: { name: string }) => m.name) || [],
    };
  } catch {
    return { connected: false };
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      throw new OllamaError('Failed to list models', response.statusText);
    }

    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch (error) {
    throw new OllamaError(
      `Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function generate(
  prompt: string,
  options?: ChatOptions
): Promise<string> {
  return chat([{ role: 'user', content: prompt }], options);
}

export async function streamGenerate(
  prompt: string,
  options?: StreamOptions
): Promise<AsyncGenerator<string>> {
  async function* generator(): AsyncGenerator<string> {
    let fullContent = '';
    let lastChunk = '';

    await stream(
      [{ role: 'user', content: prompt }],
      options,
      (chunk) => {
        const newContent = chunk.substring(lastChunk.length);
        if (newContent) {
          fullContent += newContent;
          lastChunk = chunk;
        }
      }
    );

    yield fullContent;
  }

  return generator();
}

export class OllamaError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
  }
}

export { OLLAMA_BASE_URL, DEFAULT_MODEL };
