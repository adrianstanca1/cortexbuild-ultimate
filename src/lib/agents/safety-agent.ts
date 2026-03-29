export interface SafetyReport {
  id: string;
  projectId: string;
  date: string;
  type: 'incident' | 'near-miss' | 'inspection' | 'audit' | 'toolbox-talk' | 'hazard-id';
  title: string;
  description: string;
  location?: string;
  reportedBy: string;
  severity?: 'minor' | 'moderate' | 'serious' | 'fatal' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  attachments?: string[];
  witnesses?: string[];
  rootCause?: string;
  correctiveAction?: string[];
  preventiveAction?: string[];
  estimatedCost?: number;
  scheduleImpact?: number;
}

export interface SafetySummary {
  reportId: string;
  executiveSummary: string;
  keyFindings: string[];
  rootCauses: string[];
  immediateActions: string[];
  longTermRecommendations: string[];
  complianceItems: string[];
  trainingNeeds: string[];
  estimatedCost: number;
  scheduleImpact: number;
}

export interface SafetyTrend {
  period: string;
  totalIncidents: number;
  nearMisses: number;
  lostTimeIncidents: number;
  firstAidCases: number;
  recordableIncidents: number;
  averageSeverity: number;
  mostCommonType: string;
  mostCommonLocation: string;
  trendDirection: 'improving' | 'stable' | 'worsening';
}

export interface SafetyPrediction {
  riskScore: number;
  predictedIncidents: number;
  highRiskAreas: { area: string; riskLevel: string; factors: string[] }[];
  recommendedActions: { action: string; priority: 'high' | 'medium' | 'low'; reason: string }[];
  seasonalFactors: string[];
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

export async function analyzeSafetyIncident(
  report: SafetyReport
): Promise<SafetySummary> {
  const reportJson = JSON.stringify(report, null, 2);

  const prompt = `Analyze this safety incident/report in detail.

SAFETY REPORT:
${reportJson}

Provide:

1. **Executive Summary**: Brief overview of the incident
2. **Key Findings**: Main observations from investigation
3. **Root Causes**: Underlying causes (use 5-Why or fishbone if appropriate)
4. **Immediate Actions**: Steps to address current situation
5. **Long-Term Recommendations**: Systemic improvements needed
6. **Compliance Items**: OSHA or other regulatory considerations
7. **Training Needs**: What training could have prevented this
8. **Cost/Schedule Impact**: Estimated impacts

Be thorough - safety incidents require careful analysis.`;

  const response = await callChatAPI(prompt);
  return parseSafetySummary(response, report);
}

export async function generateSafetyReportSummary(
  reports: SafetyReport[]
): Promise<{
  period: string;
  totalReports: number;
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  openItems: { item: string; severity: string; age: string }[];
  resolvedItems: number;
  complianceStatus: string;
  keyTrends: string[];
  recommendations: string[];
}> {
  const reportsJson = JSON.stringify(reports, null, 2);

  const prompt = `Generate a comprehensive safety summary from these reports.

SAFETY REPORTS:
${reportsJson}

Provide:

1. **Period**: Time frame covered
2. **Total Reports**: Overall count
3. **By Type**: Breakdown of incident types
4. **By Severity**: Severity distribution
5. **Open Items**: Unresolved issues with age
6. **Resolved Items**: Closed cases count
7. **Compliance Status**: OSHA compliance status
8. **Key Trends**: Patterns observed
9. **Recommendations**: Actions for improvement

Focus on actionable insights for safety managers.`;

  const response = await callChatAPI(prompt);
  return parseComprehensiveSummary(response, reports);
}

export async function identifySafetyPatterns(
  reports: SafetyReport[]
): Promise<{
  patterns: {
    pattern: string;
    frequency: number;
    severity: string;
    locations: string[];
    trades: string[];
    timeOfDay: string[];
    recommendations: string[];
  }[];
  highRiskActivities: { activity: string; riskScore: number; incidentCount: number }[];
  highRiskLocations: { location: string; incidentCount: number; commonTypes: string[] }[];
  trendingUp: string[];
  trendingDown: string[];
}> {
  const reportsJson = JSON.stringify(reports, null, 2);

  const prompt = `Analyze these safety reports to identify patterns and trends.

SAFETY REPORTS:
${reportsJson}

Identify:

1. **Patterns**:
   - Recurring incident types
   - Common locations
   - Affected trades/crafts
   - Time of day patterns
   - Seasonal factors

2. **High Risk Activities**: Activities with most incidents

3. **High Risk Locations**: Areas needing attention

4. **Trending Up**: Issues increasing

5. **Trending Down**: Issues decreasing

Provide specific data-backed observations.`;

  const response = await callChatAPI(prompt);
  return parsePatterns(response, reports);
}

export async function predictSafetyRisks(
  historicalReports: SafetyReport[],
  currentConditions?: {
    weather?: string;
    temperature?: string;
    workforceSize?: number;
    projectPhase?: string;
  }
): Promise<SafetyPrediction> {
  const reportsJson = JSON.stringify(historicalReports, null, 2);
  const conditions = currentConditions ? JSON.stringify(currentConditions, null, 2) : 'No current conditions provided';

  const prompt = `Predict future safety risks based on historical data and current conditions.

HISTORICAL SAFETY REPORTS:
${reportsJson}

CURRENT CONDITIONS:
${conditions}

Predict:

1. **Risk Score**: Overall risk level (0-100)
2. **Predicted Incidents**: Expected incidents in coming period
3. **High Risk Areas**: Specific areas of concern
4. **Recommended Actions**: Preemptive measures
5. **Seasonal Factors**: Weather/season considerations

Base predictions on historical patterns and current project conditions.`;

  const response = await callChatAPI(prompt);
  return parsePrediction(response, historicalReports);
}

export async function generateCorrectiveActionPlan(
  report: SafetyReport
): Promise<{
  immediateActions: { action: string; assignee: string; dueDate: string; priority: 'high' | 'medium' | 'low' }[];
  rootCause: string;
  systemicIssues: string[];
  longTermActions: { action: string; targetDate: string; successMetric: string }[];
  resourceRequirements: { type: string; quantity: string; estimatedCost: string }[];
  trainingRequirements: { training: string; audience: string; frequency: string }[];
  followUpSchedule: { inspection: string; date: string; assignee: string }[];
}> {
  const reportJson = JSON.stringify(report, null, 2);

  const prompt = `Generate a comprehensive corrective and preventive action plan for this safety incident.

SAFETY REPORT:
${reportJson}

Develop:

1. **Immediate Actions**: Concrete steps with assignees and due dates
2. **Root Cause Analysis**: 5-Why or similar methodology
3. **Systemic Issues**: Broader problems revealed
4. **Long-Term Actions**: Systemic improvements
5. **Resource Requirements**: People, equipment, budget
6. **Training Requirements**: What training is needed and for whom
7. **Follow-Up Schedule**: Inspections and reviews

Make this actionable and trackable.`;

  const response = await callChatAPI(prompt);
  return parseActionPlan(response);
}

function parseSafetySummary(response: string, report: SafetyReport): SafetySummary {
  return {
    reportId: report.id,
    executiveSummary: extractSection(response, 'executive', '1.') || 'Incident analyzed.',
    keyFindings: extractListItems(response, ['finding', 'observation']),
    rootCauses: extractListItems(response, ['root cause', 'why']),
    immediateActions: extractListItems(response, ['immediate', 'now']),
    longTermRecommendations: extractListItems(response, ['long.term', 'systemic']),
    complianceItems: extractListItems(response, ['osha', 'compliance', 'regulatory']),
    trainingNeeds: extractListItems(response, ['training', 'learn']),
    estimatedCost: report.estimatedCost || 0,
    scheduleImpact: report.scheduleImpact || 0,
  };
}

function parseComprehensiveSummary(
  response: string,
  reports: SafetyReport[]
): {
  period: string;
  totalReports: number;
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  openItems: { item: string; severity: string; age: string }[];
  resolvedItems: number;
  complianceStatus: string;
  keyTrends: string[];
  recommendations: string[];
} {
  const byType = Object.entries(
    reports.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const bySeverity = Object.entries(
    reports.reduce((acc, r) => {
      const sev = r.severity || 'unknown';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([severity, count]) => ({ severity, count }));

  return {
    period: 'Current period',
    totalReports: reports.length,
    byType,
    bySeverity,
    openItems: reports.filter((r) => r.status === 'open').map((r) => ({
      item: r.title,
      severity: r.severity || 'unknown',
      age: 'TBD',
    })),
    resolvedItems: reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
    complianceStatus: extractSection(response, 'compliance', '7.') || 'Compliant',
    keyTrends: extractListItems(response, ['trend', 'pattern']),
    recommendations: extractListItems(response, ['recommend', 'suggest']),
  };
}

function parsePatterns(
  response: string,
  _reports: SafetyReport[]
): {
  patterns: {
    pattern: string;
    frequency: number;
    severity: string;
    locations: string[];
    trades: string[];
    timeOfDay: string[];
    recommendations: string[];
  }[];
  highRiskActivities: { activity: string; riskScore: number; incidentCount: number }[];
  highRiskLocations: { location: string; incidentCount: number; commonTypes: string[] }[];
  trendingUp: string[];
  trendingDown: string[];
} {
  return {
    patterns: extractListItems(response, ['pattern', 'recurring']).map((p) => ({
      pattern: p,
      frequency: 1,
      severity: 'moderate',
      locations: [],
      trades: [],
      timeOfDay: [],
      recommendations: [],
    })),
    highRiskActivities: extractListItems(response, ['activity', 'work']).map((a) => ({
      activity: a,
      riskScore: 5,
      incidentCount: 1,
    })),
    highRiskLocations: extractListItems(response, ['location', 'area']).map((l) => ({
      location: l,
      incidentCount: 1,
      commonTypes: [],
    })),
    trendingUp: extractListItems(response, ['increasing', 'up']),
    trendingDown: extractListItems(response, ['decreasing', 'down']),
  };
}

function parsePrediction(
  response: string,
  historicalReports: SafetyReport[]
): SafetyPrediction {
  const totalIncidents = historicalReports.length;

  return {
    riskScore: Math.min(100, totalIncidents * 10),
    predictedIncidents: Math.max(0, totalIncidents - 1),
    highRiskAreas: extractListItems(response, ['area', 'location', 'high risk']).map((a) => ({
      area: a,
      riskLevel: 'elevated',
      factors: [],
    })),
    recommendedActions: extractListItems(response, ['action', 'recommend']).map((a) => ({
      action: a,
      priority: 'medium' as const,
      reason: 'Based on pattern analysis',
    })),
    seasonalFactors: extractListItems(response, ['season', 'weather']),
  };
}

function parseActionPlan(response: string): {
  immediateActions: { action: string; assignee: string; dueDate: string; priority: 'high' | 'medium' | 'low' }[];
  rootCause: string;
  systemicIssues: string[];
  longTermActions: { action: string; targetDate: string; successMetric: string }[];
  resourceRequirements: { type: string; quantity: string; estimatedCost: string }[];
  trainingRequirements: { training: string; audience: string; frequency: string }[];
  followUpSchedule: { inspection: string; date: string; assignee: string }[];
} {
  return {
    immediateActions: extractListItems(response, ['immediate', 'action']).map((a) => ({
      action: a,
      assignee: 'TBD',
      dueDate: 'Within 48 hours',
      priority: 'high' as const,
    })),
    rootCause: extractSection(response, 'root cause', '2.') || 'Under investigation',
    systemicIssues: extractListItems(response, ['systemic', 'root cause']),
    longTermActions: extractListItems(response, ['long.term', 'systemic']).map((a) => ({
      action: a,
      targetDate: 'TBD',
      successMetric: 'TBD',
    })),
    resourceRequirements: extractListItems(response, ['resource', 'budget']).map((r) => ({
      type: r.split(':')[0] || r,
      quantity: 'TBD',
      estimatedCost: 'TBD',
    })),
    trainingRequirements: extractListItems(response, ['training', 'learn']).map((t) => ({
      training: t,
      audience: 'All personnel',
      frequency: 'Annual',
    })),
    followUpSchedule: extractListItems(response, ['follow.up', 'inspection']).map((f) => ({
      inspection: f,
      date: 'TBD',
      assignee: 'TBD',
    })),
  };
}

function extractSection(text: string, key: string, marker: string): string {
  const regex = new RegExp(`${marker}[^.\\n]*(?:${key})[^.\\n]*\\n([\\s\\S]*?)(?=\\n\\d\\.|\\n\\*\\*|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractListItems(text: string, _keywords: string[]): string[] {
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
