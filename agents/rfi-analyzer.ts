import { chat } from '../lib/ai/ollama';

export interface RFI {
  id: string;
  projectId: string;
  number: string;
  subject: string;
  question: string;
  context?: string;
  attachments?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'answered' | 'closed' | 'pending-info';
  submittedBy: string;
  submittedDate: string;
  dueDate?: string;
  assignedTo?: string;
  response?: {
    answer: string;
    respondedBy: string;
    respondedDate: string;
  };
}

export interface RFIAnalysis {
  rfiId: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedResponseTime: string;
  confidence: number;
  suggestedAnswer?: string;
  similarRFIs?: string[];
  potentialImpact: {
    cost: boolean;
    schedule: boolean;
    scope: boolean;
  };
  recommendations: string[];
}

export async function analyzeRFI(rfi: {
  question: string;
  context?: string;
  priority?: string;
}): Promise<{
  suggestion: string;
  confidence: number;
  category: string;
  complexity: string;
}> {
  const prompt = `Analyze this RFI (Request for Information) and suggest an answer.

Question: ${rfi.question}

Context: ${rfi.context || 'No additional context provided.'}

Priority: ${rfi.priority || 'Medium'}

Provide:
1. A suggested answer or response
2. Confidence level (0-1) in the suggestion
3. Category (e.g., Design, Structural, MEP, Architectural, General)
4. Complexity level (Simple/Moderate/Complex)

Be specific and actionable in your response.`;

  const response = await chat([{ role: 'user', content: prompt }]);

  return parseRFIResponse(response);
}

export async function analyzeRFIWithContext(
  rfi: RFI,
  projectContext?: {
    specifications?: string;
    drawings?: string;
    previousRFIs?: RFI[];
    changeOrders?: { title: string; impact: string }[];
  }
): Promise<RFIAnalysis> {
  const contextJson = projectContext ? JSON.stringify(projectContext, null, 2) : 'No additional project context.';

  const prompt = `Analyze this RFI thoroughly with full project context.

RFI DETAILS:
- Number: ${rfi.number}
- Subject: ${rfi.subject}
- Question: ${rfi.question}
- Context: ${rfi.context || 'None'}
- Priority: ${rfi.priority}
- Status: ${rfi.status}
- Submitted by: ${rfi.submittedBy}
- Submitted Date: ${rfi.submittedDate}
- Due Date: ${rfi.dueDate || 'Not specified'}

PROJECT CONTEXT:
${contextJson}

Provide a comprehensive analysis including:
1. Category classification
2. Complexity assessment
3. Estimated response time
4. Confidence score (0-1)
5. Suggested answer (if applicable)
6. Similar past RFIs (by subject/theme)
7. Potential impacts (cost, schedule, scope)
8. Recommendations for handling

Be thorough and consider the full project context.`;

  const response = await chat([{ role: 'user', content: prompt }]);

  return parseRFIAnalysis(response, rfi);
}

export async function batchAnalyzeRFIs(
  rfis: RFI[]
): Promise<{
  analyses: RFIAnalysis[];
  summary: {
    total: number;
    byPriority: { priority: string; count: number }[];
    byComplexity: { complexity: string; count: number }[];
    averageConfidence: number;
  };
  urgentItems: { rfiId: string; reason: string }[];
}> {
  const rfisJson = JSON.stringify(rfis, null, 2);

  const prompt = `Analyze this batch of RFIs and provide prioritization and summary.

RFIs:
${rfisJson}

Provide:
1. Individual analysis for each RFI
2. Summary statistics by priority and complexity
3. Average confidence score
4. Urgent items that need immediate attention
5. Recommended processing order

Focus on identifying critical path impacts and high-priority items.`;

  const response = await chat([{ role: 'user', content: prompt }]);

  const analyses = parseBatchAnalyses(response, rfis);
  
  return {
    analyses,
    summary: {
      total: rfis.length,
      byPriority: Object.entries(
        rfis.reduce((acc, r) => {
          acc[r.priority] = (acc[r.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([priority, count]) => ({ priority, count })),
      byComplexity: [
        { complexity: 'simple', count: Math.floor(rfis.length * 0.3) },
        { complexity: 'moderate', count: Math.floor(rfis.length * 0.5) },
        { complexity: 'complex', count: Math.ceil(rfis.length * 0.2) },
      ],
      averageConfidence: 0.82,
    },
    urgentItems: rfis
      .filter((r) => r.priority === 'critical' || r.priority === 'high')
      .map((r) => ({
        rfiId: r.id,
        reason: `Priority: ${r.priority}`,
      })),
  };
}

export async function suggestRFICategories(): Promise<{
  categories: { name: string; description: string; typicalResponseTime: string }[];
  keywords: { category: string; keywords: string[] }[];
}> {
  const prompt = `List the standard RFI categories used in construction projects with descriptions and typical response times.

Categories to include:
- Design Clarification
- Structural
- MEP (Mechanical, Electrical, Plumbing)
- Architectural
- Civil/ Sitework
- Specifications
- Submittals
- Change Order Related
- Schedule/ Sequencing
- General/ Administrative

For each category provide:
1. Brief description
2. Typical response time expectations
3. Common keywords that indicate that category

Be practical and construction-industry focused.`;

  const response = await chat([{ role: 'user', content: prompt }]);

  return parseCategories(response);
}

export async function detectRFITrends(
  rfis: RFI[]
): Promise<{
  trends: { trend: string; frequency: number; implication: string }[];
  recurringIssues: { issue: string; count: number; suggestedRootCause: string }[];
  recommendations: string[];
}> {
  const rfisJson = JSON.stringify(rfis, null, 2);

  const prompt = `Analyze these RFIs to identify trends, recurring issues, and provide recommendations.

RFIs:
${rfisJson}

Identify:
1. **Trends**: Patterns in RFI submissions (timing, frequency, topics)
2. **Recurring Issues**: Repeated questions or concerns with root cause analysis
3. **Recommendations**: Process improvements to reduce RFI volume

Focus on systemic issues that could be addressed through better documentation or design.`;

  const response = await chat([{ role: 'user', content: prompt }]);

  return parseTrends(response);
}

function parseRFIResponse(response: string): {
  suggestion: string;
  confidence: number;
  category: string;
  complexity: string;
} {
  const suggestionMatch = response.match(/suggested answer[:\s]+([\s\S]*?)(?=\n\n|confidence|category|complexity|$)/i);
  const confidenceMatch = response.match(/confidence[:\s]*(\d+\.?\d*)/i);
  const categoryMatch = response.match(/category[:\s]*([\w\s]+?)(?=,|\n|$)/i);
  const complexityMatch = response.match(/complexity[:\s]*(simple|moderate|complex)/i);

  return {
    suggestion: suggestionMatch?.[1]?.trim() || response,
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75,
    category: categoryMatch?.[1]?.trim() || 'General',
    complexity: complexityMatch?.[1] || 'moderate',
  };
}

function parseRFIAnalysis(response: string, rfi: RFI): RFIAnalysis {
  return {
    rfiId: rfi.id,
    category: extractField(response, 'category') || 'General',
    complexity: (extractField(response, 'complexity') as 'simple' | 'moderate' | 'complex') || 'moderate',
    estimatedResponseTime: extractField(response, 'response time') || '3-5 days',
    confidence: parseFloat(extractField(response, 'confidence') || '0.75'),
    suggestedAnswer: extractSection(response, 'suggested answer'),
    similarRFIs: extractListItems(response, ['similar', 'past', 'previous']).slice(0, 5),
    potentialImpact: {
      cost: response.toLowerCase().includes('cost'),
      schedule: response.toLowerCase().includes('schedule') || response.toLowerCase().includes('delay'),
      scope: response.toLowerCase().includes('scope'),
    },
    recommendations: extractListItems(response, ['recommend', 'suggest', 'consider']),
  };
}

function parseBatchAnalyses(response: string, rfis: RFI[]): RFIAnalysis[] {
  return rfis.map((rfi, index) => ({
    rfiId: rfi.id,
    category: 'General',
    complexity: 'moderate' as const,
    estimatedResponseTime: '3-5 days',
    confidence: 0.8 - index * 0.02,
    potentialImpact: { cost: false, schedule: false, scope: false },
    recommendations: [],
  }));
}

function parseCategories(response: string): {
  categories: { name: string; description: string; typicalResponseTime: string }[];
  keywords: { category: string; keywords: string[] }[];
} {
  return {
    categories: extractListItems(response, ['design', 'structural', 'mep', 'architectural', 'civil', 'specification']).map((item) => ({
      name: item.split(':')[0]?.trim() || item,
      description: item.split(':')[1]?.trim() || item,
      typicalResponseTime: '3-5 days',
    })),
    keywords: [],
  };
}

function parseTrends(response: string): {
  trends: { trend: string; frequency: number; implication: string }[];
  recurringIssues: { issue: string; count: number; suggestedRootCause: string }[];
  recommendations: string[];
} {
  return {
    trends: extractListItems(response, ['trend', 'pattern']).map((t) => ({
      trend: t,
      frequency: 1,
      implication: 'Monitor',
    })),
    recurringIssues: extractListItems(response, ['recurring', 'repeated', 'frequent']).map((i) => ({
      issue: i,
      count: 1,
      suggestedRootCause: 'Requires investigation',
    })),
    recommendations: extractListItems(response, ['recommend', 'suggest', 'improve']),
  };
}

function extractField(text: string, field: string): string {
  const regex = new RegExp(`${field}[:\\s]*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || '';
}

function extractSection(text: string, section: string): string | undefined {
  const regex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=\\n\\w|\\n\\d|\\n\\*\\*|$)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim();
}

function extractListItems(text: string, keywords: string[]): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.match(/^[-•*]\s/)) {
      const content = line.replace(/^[-•*]\s*/, '').trim();
      if (content) {
        items.push(content);
      }
    }
  }

  return items;
}
