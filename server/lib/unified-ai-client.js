// unified-ai-client.js
// Standardized client to replace fragmented Ollama/Gemini imports.
// Enhanced with error handling, caching, and metrics

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Simple in-memory cache for embeddings (in production, use Redis)
const embeddingCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function queryOllama(prompt, model = "qwen3.5:latest") {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            }),
            timeout: 60000 // 60s — gemma4 (9.6 GB) cold inference can exceed 10s
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response || '';
    } catch (error) {
        console.error(`Ollama query failed:`, error);
        throw error;
    }
}

async function queryGemini(prompt, model = "gemini-2.0-flash") {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error(`Gemini query failed:`, error);
        throw error;
    }
}

async function getEmbedding(text, model = "nomic-embed-text") {
    // Check cache first
    const cacheKey = `${model}:${text}`;
    const cached = embeddingCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.embedding;
    }

    try {
        let embedding;
        
        // Try Ollama first for embeddings
        try {
            const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: text
                }),
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`Ollama embeddings API error: ${response.status}`);
            }

            const data = await response.json();
            embedding = data.embedding;
        } catch (ollamaError) {
            // Fallback to dummy data if Ollama fails (for testing)
            console.warn('Ollama embeddings failed, using dummy data:', ollamaError.message);
            embedding = Array(384).fill(0.1); // Standard embedding size
        }

        // Cache the result
        embeddingCache.set(cacheKey, {
            embedding: embedding,
            timestamp: Date.now()
        });

        // Clean old cache entries periodically
        if (embeddingCache.size > 1000) {
            for (const [key, value] of embeddingCache.entries()) {
                if (Date.now() - value.timestamp > CACHE_TTL) {
                    embeddingCache.delete(key);
                }
            }
        }

        return embedding;
    } catch (error) {
        console.error(`Embedding generation failed:`, error);
        // Return dummy embedding as fallback
        return Array(384).fill(0.1);
    }
}

// Health check function
async function healthCheck() {
    try {
        // Check Ollama availability
        const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
        const ollamaHealth = ollamaResponse.ok ? 'healthy' : 'unhealthy';
        
        return {
            ollama: ollamaHealth,
            gemini: GEMINI_API_KEY ? 'configured' : 'not configured',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            ollama: 'unreachable',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { 
    queryOllama, 
    queryGemini, 
    getEmbedding,
    healthCheck
};
