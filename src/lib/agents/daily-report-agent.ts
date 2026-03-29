export interface DailyReport {
  id: string;
  date: string;
  projectId: string;
  weather?: string;
  temperature?: string;
  humidity?: string;
  workforce: {
    trade: string;
    count: number;
    hours: number;
  }[];
  equipment: {
    name: string;
    hours: number;
    status: 'operational' | 'maintenance' | 'down';
  }[];
  materials: {
    name: string;
    quantity: string;
    unit: string;
    delivered: boolean;
  }[];
  progress: {
    description: string;
    percentComplete?: number;
  }[];
  issues: {
    type: 'delay' | 'safety' | 'quality' | 'design' | 'supply' | 'other';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  visitors?: string[];
  notes?: string;
}

export interface DailySummary {
  executiveSummary: string;
  keyAccomplishments: string[];
  workforceSummary: {
    totalWorkers: number;
    totalHours: number;
    byTrade: { trade: string; count: number; hours: number }[];
  };
  equipmentStatus: {
    operational: number;
    maintenance: number;
    down: number;
  };
  materialsReceived: string[];
  pendingIssues: { issue: string; impact: string; priority: string }[];
  tomorrowLookahead: string;
  safetyNotes: string[];
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

export async function summarizeDailyReport(report: DailyReport): Promise<DailySummary> {
  const reportJson = JSON.stringify(report, null, 2);

  const prompt = `Summarize this daily construction report into key points for project stakeholders.

DAILY REPORT:
${reportJson}

Provide a structured summary including:

1. **Executive Summary** (2-3 sentences): High-level overview of the day
2. **Key Accomplishments**: Major work completed
3. **Workforce Summary**: Total workers, hours, breakdown by trade
4. **Equipment Status**: Operational vs downtime
5. **Materials Received**: Deliveries that arrived
6. **Pending Issues**: Problems needing attention, with impact level
7. **Tomorrow Lookahead**: Planned work for next day
8. **Safety Notes**: Any safety-related observations

Be concise and actionable. This will be read by project managers and executives.`;

  const response = await callChatAPI(prompt);
  return parseDailySummary(response, report);
}

export async function compareDailyReports(
  reports: DailyReport[]
): Promise<{
  productivityTrend: string;
  workforceChanges: { trade: string; change: number }[];
  issueSummary: { type: string; count: number }[];
  recommendations: string[];
}> {
  const reportsJson = JSON.stringify(reports, null, 2);

  const prompt = `Compare these daily construction reports to identify trends and patterns.

DAILY REPORTS:
${reportsJson}

Analyze and provide:

1. **Productivity Trend**: How output compares day-over-day
2. **Workforce Changes**: Which trades increased/decreased
3. **Issue Summary**: Count by issue type (delay, safety, quality, etc.)
4. **Recommendations**: Suggestions based on trends

Focus on actionable insights.`;

  const response = await callChatAPI(prompt);
  return parseComparison(response);
}

export async function generateWeeklySummary(
  dailyReports: DailyReport[]
): Promise<{
  weekOverview: string;
  totalWorkforceHours: number;
  majorAccomplishments: string[];
  recurringIssues: string[];
  nextWeekPriorities: string;
  budgetStatus?: string;
  scheduleStatus?: string;
}> {
  const reportsJson = JSON.stringify(dailyReports, null, 2);

  const prompt = `Generate a comprehensive weekly summary from these daily construction reports.

DAILY REPORTS:
${reportsJson}

Provide:

1. **Week Overview**: Summary of the week's activities
2. **Total Workforce Hours**: Aggregate hours worked
3. **Major Accomplishments**: Key milestones achieved
4. **Recurring Issues**: Problems that appeared multiple days
5. **Next Week Priorities**: Main focus areas
6. **Budget Status**: Budget impact if data available
7. **Schedule Status**: Schedule impact if data available

Be comprehensive but concise.`;

  const response = await callChatAPI(prompt);
  return parseWeeklySummary(response);
}

export async function extractKeyMetrics(
  reports: DailyReport[]
): Promise<{
  totalWorkforceHours: number;
  averageDailyWorkforce: number;
  equipmentUtilization: number;
  issueRate: number;
  safetyIncidents: number;
  materialsDeliveries: number;
}> {
  const totalWorkforceHours = reports.reduce(
    (sum, r) => sum + r.workforce.reduce((s, w) => s + w.hours, 0),
    0
  );

  const totalWorkers = reports.reduce(
    (sum, r) => sum + r.workforce.reduce((s, w) => s + w.count, 0),
    0
  );

  const avgDailyWorkforce = totalWorkers / reports.length;

  const equipmentHours = reports.reduce(
    (sum, r) => sum + r.equipment.filter((e) => e.status === 'operational').reduce((s, e) => s + e.hours, 0),
    0
  );
  const totalEquipmentCapacity = reports.reduce(
    (sum, r) => sum + r.equipment.reduce((s, e) => s + e.hours, 0),
    0
  );
  const equipmentUtilization = totalEquipmentCapacity > 0 ? equipmentHours / totalEquipmentCapacity : 0;

  const issueCount = reports.reduce((sum, r) => sum + r.issues.length, 0);
  const issueRate = reports.length > 0 ? issueCount / reports.length : 0;

  const safetyIncidents = reports.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === 'safety').length,
    0
  );

  const materialsDeliveries = reports.reduce(
    (sum, r) => sum + r.materials.filter((m) => m.delivered).length,
    0
  );

  return {
    totalWorkforceHours,
    averageDailyWorkforce: avgDailyWorkforce,
    equipmentUtilization,
    issueRate,
    safetyIncidents,
    materialsDeliveries,
  };
}

function parseDailySummary(response: string, report: DailyReport): DailySummary {
  const totalWorkers = report.workforce.reduce((s, w) => s + w.count, 0);
  const totalHours = report.workforce.reduce((s, w) => s + w.hours, 0);

  const equipmentStatus = {
    operational: report.equipment.filter((e) => e.status === 'operational').length,
    maintenance: report.equipment.filter((e) => e.status === 'maintenance').length,
    down: report.equipment.filter((e) => e.status === 'down').length,
  };

  return {
    executiveSummary: extractSection(response, 'executive', '1.') || 'Daily progress recorded.',
    keyAccomplishments: extractListItems(response, ['accomplishment', 'completed', 'progress']),
    workforceSummary: {
      totalWorkers,
      totalHours,
      byTrade: report.workforce,
    },
    equipmentStatus,
    materialsReceived: report.materials.filter((m) => m.delivered).map((m) => `${m.quantity} ${m.unit} ${m.name}`),
    pendingIssues: report.issues.map((i) => ({
      issue: i.description,
      impact: i.impact,
      priority: i.type,
    })),
    tomorrowLookahead: extractSection(response, 'tomorrow', '7.') || 'Continue current schedule.',
    safetyNotes: extractListItems(response, ['safety']),
  };
}

function parseComparison(response: string): {
  productivityTrend: string;
  workforceChanges: { trade: string; change: number }[];
  issueSummary: { type: string; count: number }[];
  recommendations: string[];
} {
  return {
    productivityTrend: extractSection(response, 'productivity', '1.') || 'Stable',
    workforceChanges: extractChanges(response, 'workforce'),
    issueSummary: extractIssueCounts(response),
    recommendations: extractListItems(response, ['recommend', 'suggestion']),
  };
}

function parseWeeklySummary(response: string): {
  weekOverview: string;
  totalWorkforceHours: number;
  majorAccomplishments: string[];
  recurringIssues: string[];
  nextWeekPriorities: string;
  budgetStatus?: string;
  scheduleStatus?: string;
} {
  return {
    weekOverview: extractSection(response, 'week overview', '1.') || '',
    totalWorkforceHours: 0,
    majorAccomplishments: extractListItems(response, ['accomplishment', 'milestone']),
    recurringIssues: extractListItems(response, ['recurring', 'repeated']),
    nextWeekPriorities: extractSection(response, 'next week', '5.') || '',
    budgetStatus: extractSection(response, 'budget', '6.'),
    scheduleStatus: extractSection(response, 'schedule', '7.'),
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
      if (content && (keywords.some((k) => content.toLowerCase().includes(k)) || keywords.length === 0)) {
        items.push(content);
      }
    }
  }

  return items;
}

function extractChanges(text: string, _context: string): { trade: string; change: number }[] {
  const changes: { trade: string; change: number }[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.match(/trade|workforce|crew/i)) {
      changes.push({
        trade: line.replace(/^[-•*]\s*/, '').split(':')[0] || 'general',
        change: 0,
      });
    }
  }

  return changes;
}

function extractIssueCounts(text: string): { type: string; count: number }[] {
  const types = ['delay', 'safety', 'quality', 'design', 'supply'];
  const counts: { type: string; count: number }[] = [];

  for (const type of types) {
    const regex = new RegExp(`${type}[^\\n]*(\\d+)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      counts.push({ type, count: matches.length });
    }
  }

  return counts;
}
