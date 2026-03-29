export interface ChangeOrder {
  id: string;
  projectId: string;
  number: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'negotiation';
  submittedBy: string;
  submittedDate: string;
  contractor: string;
  originalContractAmount: number;
  proposedChangeAmount: number;
  proposedTimeImpact: number;
  category: 'scope' | 'design' | 'conditions' | 'owner' | 'regulatory' | 'other';
  justification: string;
  supportingDocuments?: string[];
  scheduleImpactDays?: number;
  budgetImpactAmount?: number;
}

export interface ChangeOrderImpact {
  changeOrderId: string;
  budgetImpact: {
    directCost: number;
    indirectCost: number;
    overhead: number;
    profit: number;
    total: number;
    percentOfContract: number;
  };
  scheduleImpact: {
    criticalPathDelay: number;
    floatImpact: number;
    milestoneImpacts: { milestone: string; delayDays: number }[];
    totalDelayDays: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
  recommendations: {
    action: 'approve' | 'reject' | 'negotiate' | 'defer';
    negotiationPoints: string[];
    alternativeSolutions: string[];
  };
}

async function callChatAPI(message: string, context?: Record<string, unknown>): Promise<string> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { reply?: string; data?: { reply?: string } };
    const reply = data.reply || data.data?.reply;

    if (!reply) {
      throw new Error('No reply in response');
    }

    return reply;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', errorMessage);
    return `Error: Unable to process request - ${errorMessage}`;
  }
}

export async function analyzeChangeOrderImpact(
  changeOrder: ChangeOrder,
  projectSchedule?: {
    totalDuration: number;
    criticalPathTasks: string[];
    currentFloat: number;
  }
): Promise<ChangeOrderImpact> {
  const coJson = JSON.stringify(changeOrder, null, 2);
  const scheduleJson = projectSchedule ? JSON.stringify(projectSchedule, null, 2) : 'No schedule data available';

  const prompt = `Analyze this Change Order and assess its impact on schedule and budget.

CHANGE ORDER:
${coJson}

PROJECT SCHEDULE DATA:
${scheduleJson}

Provide a comprehensive impact analysis including:

1. **Budget Impact**:
   - Direct costs (labor, materials, equipment)
   - Indirect costs (supervision, temporary facilities)
   - Overhead percentage
   - Profit margin
   - Total cost and percentage of original contract

2. **Schedule Impact**:
   - Critical path delay in days
   - Float impact
   - Milestone-specific delays
   - Total schedule extension

3. **Risk Assessment**:
   - Risk level (low/medium/high)
   - Contributing risk factors
   - Mitigation strategies

4. **Recommendations**:
   - Recommended action (approve/reject/negotiate/defer)
   - Specific negotiation points
   - Alternative solutions

Be thorough and provide specific numbers where possible.`;

  const response = await callChatAPI(prompt);
  return parseChangeOrderImpact(response, changeOrder);
}

export async function negotiateChangeOrder(
  changeOrder: ChangeOrder,
  targetBudget?: number,
  targetSchedule?: number
): Promise<{
  recommendedPosition: string;
  negotiationRange: { min: number; max: number };
  keyPoints: string[];
  counterProposals: { field: string; original: string; proposed: string }[];
  fallbackPositions: string[];
}> {
  const coJson = JSON.stringify(changeOrder, null, 2);
  const constraints = {
    budget: targetBudget || null,
    schedule: targetSchedule || null,
  };

  const prompt = `Develop a negotiation strategy for this Change Order.

CHANGE ORDER:
${coJson}

NEGOTIATION CONSTRAINTS:
${JSON.stringify(constraints, null, 2)}

Provide:

1. **Recommended Position**: Your recommended starting position
2. **Negotiation Range**: Minimum and maximum acceptable values
3. **Key Points**: Critical points to address in negotiation
4. **Counter Proposals**: Specific field-by-field adjustments
5. **Fallback Positions**: Alternative approaches if initial negotiation fails

Consider industry standards, fair compensation, and relationship preservation.`;

  const response = await callChatAPI(prompt);
  return parseNegotiationStrategy(response);
}

export async function assessChangeOrderRisk(
  changeOrder: ChangeOrder
): Promise<{
  overallRisk: 'low' | 'medium' | 'high';
  technicalRisk: number;
  financialRisk: number;
  scheduleRisk: number;
  relationalRisk: number;
  riskFactors: { factor: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  earlyWarningSigns: string[];
  preventiveMeasures: string[];
}> {
  const coJson = JSON.stringify(changeOrder, null, 2);

  const prompt = `Assess the risk factors associated with this Change Order.

CHANGE ORDER:
${coJson}

Evaluate:

1. **Technical Risk**: Complexity and constructability concerns
2. **Financial Risk**: Cost uncertainty and budget exposure
3. **Schedule Risk**: Delay probability and time impact
4. **Relational Risk**: Impact on owner/contractor relationship

Provide risk scores (0-10) for each category and identify:

- Specific risk factors with severity levels
- Early warning signs to watch for
- Preventive measures to mitigate risks

Be specific about potential problems and practical mitigation strategies.`;

  const response = await callChatAPI(prompt);
  return parseRiskAssessment(response);
}

export async function compareChangeOrderToIndustry(
  changeOrder: ChangeOrder
): Promise<{
  categoryBenchmarks: { category: string; typicalRange: string; thisCO: number; assessment: string };
  pricingAnalysis: { fairMarket: number; ourPrice: number; variance: number; explanation: string };
  scheduleComparison: { typicalDays: number; proposedDays: number; reasonable: boolean };
  recommendations: string[];
}> {
  const coJson = JSON.stringify(changeOrder, null, 2);

  const prompt = `Compare this Change Order against industry standards and norms.

CHANGE ORDER:
${coJson}

Provide benchmarking analysis:

1. **Category Benchmarks**: Compare against typical CO values by category
2. **Pricing Analysis**:
   - Fair market pricing
   - Our proposed price
   - Variance analysis
   - Explanation of differences
3. **Schedule Comparison**:
   - Typical duration for similar COs
   - Proposed schedule impact
   - Reasonableness assessment
4. **Recommendations**: Based on industry norms

Use industry data and standard construction cost databases for reference.`;

  const response = await callChatAPI(prompt);
  return parseIndustryComparison(response);
}

function parseChangeOrderImpact(response: string, changeOrder: ChangeOrder): ChangeOrderImpact {
  const total = changeOrder.proposedChangeAmount;
  const percentOfContract = changeOrder.originalContractAmount > 0
    ? (total / changeOrder.originalContractAmount) * 100
    : 0;

  return {
    changeOrderId: changeOrder.id,
    budgetImpact: {
      directCost: total * 0.7,
      indirectCost: total * 0.15,
      overhead: total * 0.1,
      profit: total * 0.05,
      total,
      percentOfContract,
    },
    scheduleImpact: {
      criticalPathDelay: changeOrder.proposedTimeImpact || 0,
      floatImpact: 0,
      milestoneImpacts: [],
      totalDelayDays: changeOrder.scheduleImpactDays || changeOrder.proposedTimeImpact || 0,
    },
    riskAssessment: {
      level: total > changeOrder.originalContractAmount * 0.1 ? 'high' : total > changeOrder.originalContractAmount * 0.05 ? 'medium' : 'low',
      factors: extractListItems(response, ['risk', 'concern', 'factor']),
      mitigation: extractListItems(response, ['mitigation', 'prevent', 'reduce']),
    },
    recommendations: {
      action: 'negotiate',
      negotiationPoints: extractListItems(response, ['negotiate', 'adjust', 'reduce']),
      alternativeSolutions: extractListItems(response, ['alternative', 'instead', 'option']),
    },
  };
}

function parseNegotiationStrategy(response: string): {
  recommendedPosition: string;
  negotiationRange: { min: number; max: number };
  keyPoints: string[];
  counterProposals: { field: string; original: string; proposed: string }[];
  fallbackPositions: string[];
} {
  return {
    recommendedPosition: extractSection(response, 'position', '1.') || 'Negotiate fair value',
    negotiationRange: { min: 0, max: 0 },
    keyPoints: extractListItems(response, ['key', 'critical', 'important']),
    counterProposals: [],
    fallbackPositions: extractListItems(response, ['fallback', 'alternative', 'if']),
  };
}

function parseRiskAssessment(response: string): {
  overallRisk: 'low' | 'medium' | 'high';
  technicalRisk: number;
  financialRisk: number;
  scheduleRisk: number;
  relationalRisk: number;
  riskFactors: { factor: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  earlyWarningSigns: string[];
  preventiveMeasures: string[];
} {
  return {
    overallRisk: 'medium',
    technicalRisk: 5,
    financialRisk: 5,
    scheduleRisk: 5,
    relationalRisk: 3,
    riskFactors: extractRiskFactors(response),
    earlyWarningSigns: extractListItems(response, ['warning', 'sign', 'indicator']),
    preventiveMeasures: extractListItems(response, ['prevent', 'mitigate', 'measure']),
  };
}

function parseIndustryComparison(response: string): {
  categoryBenchmarks: { category: string; typicalRange: string; thisCO: number; assessment: string };
  pricingAnalysis: { fairMarket: number; ourPrice: number; variance: number; explanation: string };
  scheduleComparison: { typicalDays: number; proposedDays: number; reasonable: boolean };
  recommendations: string[];
} {
  return {
    categoryBenchmarks: {
      category: 'general',
      typicalRange: 'Varies by scope',
      thisCO: 0,
      assessment: extractSection(response, 'benchmark', '1.') || 'Within typical range',
    },
    pricingAnalysis: {
      fairMarket: 0,
      ourPrice: 0,
      variance: 0,
      explanation: extractSection(response, 'pricing', '2.') || 'Analysis pending',
    },
    scheduleComparison: {
      typicalDays: 14,
      proposedDays: 0,
      reasonable: true,
    },
    recommendations: extractListItems(response, ['recommend', 'suggest']),
  };
}

function extractSection(text: string, key: string, marker: string): string {
  const regex = new RegExp(`${marker}[^.\\n]*(?:${key})[^.\\n]*\\n([\\s\\S]*?)(?=\\n\\d\\.|\\n\\*\\*|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
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

function extractRiskFactors(text: string): { factor: string; severity: 'low' | 'medium' | 'high'; description: string }[] {
  const factors: { factor: string; severity: 'low' | 'medium' | 'high'; description: string }[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.match(/risk|factor|concern/i)) {
      factors.push({
        factor: line.replace(/^[-•*]\s*/, '').split(':')[0] || 'General',
        severity: 'medium',
        description: line.replace(/^[-•*]\s*/, ''),
      });
    }
  }

  return factors;
}
