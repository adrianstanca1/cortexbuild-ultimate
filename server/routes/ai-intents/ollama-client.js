const https = require('https');
const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'qwen3.5:latest';

/**
 * Lightweight summarization via Ollama (uses same model, short completion).
 */
async function summarizeText(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: `Summarize this conversation concisely in 2-3 sentences:\n\n${text.substring(0, 4000)}` }],
      stream: false,
      options: { temperature: 0.3, num_predict: 150 },
    });

    const url = new URL(OLLAMA_HOST + '/api/chat');
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 11434),
      path:     '/api/chat',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout:  20000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          resolve(p.message?.content || text.substring(0, 200));
        } catch { resolve(text.substring(0, 200)); }
      });
    });
    req.on('error', e => { console.warn('[AI] summarizeText error:', e.message); resolve(text.substring(0, 200)); });
    req.on('timeout', () => { req.destroy(); resolve(text.substring(0, 200)); });
    req.write(body);
    req.end();
  });
}

/**
 * Get response from Ollama for user query.
 */
async function getOllamaResponse(userMessage, context = '', conversationHistory = [], summary = null) {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are a helpful AI assistant for CortexBuild, a UK construction management platform. You help users manage projects, contracts, safety, and team operations.

Provide a helpful, concise response. Prefer direct answers over repeating menu-like capability lists. When relevant, use the supplied database context. If the user asks a general question, answer it naturally.`;

    const promptParts = [systemPrompt];

    if (context) {
      promptParts.push(`Database context:\n${context}`);
    }

    if (summary) {
      promptParts.push(`Previous conversation summary:\n${summary}`);
    }

    const truncatedHistory = truncateToTokenBudget(
      conversationHistory,
      userMessage,
      `${systemPrompt}\n\n${context || ''}`,
    );

    if (truncatedHistory.length) {
      promptParts.push(
        'Recent conversation:',
        truncatedHistory
          .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
          .join('\n'),
      );
    }

    // Build messages array with explicit roles — no index-based guessing
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add context as a user message (provides DB data for the LLM to reason about)
    if (context) {
      messages.push({ role: 'user', content: `Database context:\n${context}` });
    }

    // Add summary as a user message (prior conversation context)
    if (summary) {
      messages.push({ role: 'user', content: `Previous conversation summary:\n${summary}` });
    }

    // Add conversation history with correct roles
    if (truncatedHistory.length) {
      const historyText = truncatedHistory
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      messages.push({ role: 'user', content: `Recent conversation:\n${historyText}` });
    }

    // Add the actual user message
    messages.push({ role: 'user', content: userMessage });

    const body = JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9,
        num_predict: 512,
      },
    });

    const url = new URL(OLLAMA_HOST + '/api/chat');
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 11434),
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 45000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const trimmed = data.trim();
          if (!trimmed) {
            reject(new Error('Ollama returned empty response'));
            return;
          }
          const parsed = JSON.parse(trimmed);
          // /api/chat returns { message: { content: '...' } }
          if (parsed.message?.content) {
            resolve(parsed.message.content.trim());
          } else if (parsed.response) {
            // Fallback for /api/generate format
            resolve(parsed.response.trim());
          } else if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            reject(new Error('Ollama returned no response content'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out'));
    });

    req.write(body);
    req.end();
  });
}

// Need to import truncateToTokenBudget - circular dependency fix
function truncateToTokenBudget(messages, userMsgContent, systemContext, maxTokens = 28000) {
  const systemTokens = Math.ceil((systemContext.length + 200) / 4);
  const userTokens   = Math.ceil(userMsgContent.length / 4);
  const budget       = maxTokens - systemTokens - userTokens - 500;

  const result = [];
  let usedTokens = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m    = messages[i];
    const cost = Math.ceil(m.content.length / 4);
    if (usedTokens + cost > budget) break;
    result.unshift(m);
    usedTokens += cost;
  }

  return result;
}

module.exports = {
  getOllamaResponse,
  summarizeText,
  OLLAMA_HOST,
  LLM_MODEL,
};
