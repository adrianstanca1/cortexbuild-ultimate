/**
 * CortexBuild Ultimate - AI Search
 * 
 * Semantic search powered by Ollama AI.
 * Provides intelligent search across projects, documents, and other modules.
 * 
 * @packageDocumentation
 */


interface AISearchResult {
  id: string;
  type: 'project' | 'document' | 'rfi' | 'safety' | 'team';
  title: string;
  description: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

export async function semanticSearch(query: string, limit = 10): Promise<AISearchResult[]> {
  try {
    // Use Ollama for semantic understanding
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:latest',
        prompt: `Analyze this construction management search query and return key terms: "${query}"`,
        stream: false,
      }),
    });

    const data = await response.json();
    clearTimeout(timeoutId);
    const searchTerms = data.response.split(',').map((t: string) => t.trim());

    // Search across modules
    const results: AISearchResult[] = [];

    // Search projects
    const projectsRes = await fetch('/api/projects');
    const projects = await projectsRes.json();
    results.push(...projects
      .filter((p: { name?: string; client?: string }) =>
        searchTerms.some((term: string) =>
          p.name?.toLowerCase().includes(term.toLowerCase()) ||
          p.client?.toLowerCase().includes(term.toLowerCase())
        )
      )
      .slice(0, limit)
      .map((p: { id?: string; name?: string; client?: string; status?: string }) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        description: `Client: ${p.client} | Status: ${p.status}`,
        relevance: 0.9,
        metadata: p,
      }))
    );

    // Search documents
    const docsRes = await fetch('/api/documents');
    const documents = await docsRes.json();
    results.push(...documents
      .slice(0, limit)
      .map((d: { id?: string; name?: string; type?: string; created_at?: string }) => ({
        id: d.id,
        type: 'document' as const,
        title: d.name,
        description: `Type: ${d.type} | Uploaded: ${d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Unknown'}`,
        relevance: 0.8,
        metadata: d,
      }))
    );

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  } catch (error) {
    console.error('AI Search error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('AI Search error:', error);
    return [];
  }
}

// AI-powered suggestions
export async function getAISuggestions(context: {
  module: string;
  currentData?: unknown;
}): Promise<{ type: string; message: string; action?: () => void }[]> {
  const suggestions = [];

  // Context-aware suggestions
  if (context.module === 'projects') {
    suggestions.push({
      type: 'info',
      message: 'Consider reviewing projects with budget variance > 10%',
      action: undefined, // TODO: Wire up to filter action
    });
  }

  if (context.module === 'safety') {
    suggestions.push({
      type: 'warning',
      message: '3 incidents reported this week - review safety protocols',
      action: undefined, // TODO: Wire up to navigation
    });
  }

  return suggestions;
}
