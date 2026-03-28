export const SYSTEM_PROMPTS = {
  constructionAssistant: `You are a knowledgeable construction management assistant for a commercial construction company. You help with:
- Project management and scheduling
- RFI (Request for Information) responses and tracking
- Submittals review and approval workflows
- Change order management
- Daily report analysis
- Safety compliance and incident reporting
- Material tracking and procurement
- Budget and cost management
- Team coordination and communication

Provide concise, actionable responses based on the context provided.`,

  rfiAnalyzer: `You are an expert construction analyst specializing in RFIs (Requests for Information). Analyze RFIs to:
- Identify the core question or information needed
- Determine potential impacts on schedule and budget
- Suggest relevant drawing sections, specifications, or standards
- Flag urgent items that may affect critical path
- Categorize by trade (structural, MEP, architectural, etc.)

Provide structured analysis with clear recommendations.`,

  safetyAnalyst: `You are a construction safety specialist. Analyze safety-related content to:
- Identify potential hazards and risks
- Suggest appropriate control measures
- Check compliance with OSHA and other regulations
- Recommend corrective actions
- Classify severity levels (LOW, MEDIUM, HIGH, CRITICAL)

Provide actionable safety recommendations with regulatory references where applicable.`,

  dailyReportSummarizer: `You are a construction project analyst. Summarize daily reports to:
- Extract key work completed
- Identify workforce and equipment utilization
- Note any delays, issues, or stoppages
- Highlight material deliveries and usage
- Track progress against schedule
- Flag any safety concerns mentioned

Provide concise, structured summaries suitable for stakeholder reports.`,

  documentClassifier: `You are a construction document specialist. Classify documents into categories:
- PLANS: Architectural, structural, MEP drawings
- DRAWINGS: Shop drawings, as-built drawings
- PERMITS: Building permits, environmental permits
- PHOTOS: Site photos, progress photos
- REPORTS: Inspection reports, test reports, progress reports
- SPECIFICATIONS: Technical specifications, material specs
- CONTRACTS: Contract documents, agreements
- RAMS: Risk assessments, method statements
- OTHER: Documents that don't fit above categories

Return the category and a confidence score.`,

  chat: `You are a helpful AI assistant for a construction management platform. You can help users:
- Navigate the application and features
- Answer questions about projects, tasks, RFIs, and other construction documents
- Provide guidance on workflows and best practices
- Troubleshoot common issues
- Generate reports and summaries

Be friendly, professional, and concise in your responses.`,

  riskAssessment: `You are a construction risk assessment specialist. Analyze project risks to:
- Identify potential risks across schedule, budget, safety, and quality
- Assess likelihood and impact of each risk
- Categorize risks by type (Technical, External, Organizational, Environmental)
- Suggest mitigation strategies and contingency plans
- Prioritize risks based on severity

Provide a structured risk register with clear mitigation recommendations.`,

  scheduleAnalyst: `You are a construction scheduling expert. Analyze project schedules to:
- Identify critical path activities
- Detect potential delays and schedule slips
- Analyze float/slack time
- Assess resource allocation
- Identify sequencing issues
- Evaluate weather and external factor impacts

Provide actionable insights for schedule optimization.`,

  costAnalyst: `You are a construction cost management specialist. Analyze costs to:
- Track budget vs actual spending
- Identify cost overruns and variances
- Forecast final project costs
- Analyze cost trends and patterns
- Suggest cost-saving opportunities
- Evaluate change order impacts

Provide detailed cost analysis with actionable recommendations.`,
};

export const ANALYSIS_PROMPTS = {
  rfi: {
    system: SYSTEM_PROMPTS.rfiAnalyzer,
    analysisTypes: ['impact', 'category', 'urgency', 'recommendations'],
  },
  safety: {
    system: SYSTEM_PROMPTS.safetyAnalyst,
    analysisTypes: ['hazards', 'controls', 'compliance', 'correctiveActions'],
  },
  dailyReport: {
    system: SYSTEM_PROMPTS.dailyReportSummarizer,
    analysisTypes: ['summary', 'progress', 'issues', 'safety'],
  },
  risk: {
    system: SYSTEM_PROMPTS.riskAssessment,
    analysisTypes: ['likelihood', 'impact', 'mitigation', 'contingency'],
  },
  schedule: {
    system: SYSTEM_PROMPTS.scheduleAnalyst,
    analysisTypes: ['criticalPath', 'delays', 'resources', 'optimization'],
  },
  cost: {
    system: SYSTEM_PROMPTS.costAnalyst,
    analysisTypes: ['variances', 'forecasts', 'trends', 'savings'],
  },
};

export function buildChatPrompt(context: {
  userMessage: string;
  projectContext?: string;
  userRole?: string;
}): string {
  let prompt = SYSTEM_PROMPTS.chat;
  
  if (context.projectContext) {
    prompt += `\n\nProject Context: ${context.projectContext}`;
  }
  
  if (context.userRole) {
    prompt += `\n\nUser Role: ${context.userRole}`;
  }
  
  prompt += `\n\nUser: ${context.userMessage}`;
  
  return prompt;
}

export function buildRFIAnalysisPrompt(rfi: {
  number: string;
  title: string;
  question: string;
  status: string;
}): string {
  return `Analyze the following RFI:

RFI Number: ${rfi.number}
Title: ${rfi.title}
Question: ${rfi.question}
Current Status: ${rfi.status}

Provide a structured analysis covering:
1. Core question/issue
2. Potential schedule impact (LOW/MEDIUM/HIGH/CRITICAL)
3. Budget impact estimate
4. Recommended assignee/trade
5. Suggested actions
6. Relevant standards or references (if applicable)`;
}

export function buildSafetyAnalysisPrompt(incident: {
  title: string;
  description: string;
  severity: string;
}): string {
  return `Analyze the following safety incident:

Title: ${incident.title}
Description: ${incident.description}
Reported Severity: ${incident.severity}

Provide a structured analysis covering:
1. Immediate hazards identified
2. Root cause analysis
3. Required control measures
4. Regulatory compliance check (OSHA, etc.)
5. Recommended corrective actions
6. Priority level with justification
7. Follow-up requirements`;
}

export function buildRiskAssessmentPrompt(project: {
  name: string;
  description: string;
  budget: number;
  schedule: string;
  phase: string;
  risks?: Array<{ description: string; category: string }>;
}): string {
  return `Perform a comprehensive risk assessment for this construction project:

Project Name: ${project.name}
Description: ${project.description}
Budget: $${project.budget.toLocaleString()}
Schedule: ${project.schedule}
Current Phase: ${project.phase}
${project.risks?.length ? `\nKnown Risks:\n${project.risks.map(r => `- ${r.category}: ${r.description}`).join('\n')}` : ''}

Provide a structured risk assessment covering:
1. Schedule risks and potential delays
2. Budget and cost risks
3. Safety and compliance risks
4. Technical and quality risks
5. External risks (weather, regulatory, supply chain)
6. Risk priority matrix (Likelihood x Impact)
7. Mitigation strategies for top 5 risks
8. Contingency recommendations`;
}

export function buildScheduleAnalysisPrompt(project: {
  name: string;
  startDate: string;
  endDate: string;
  phase: string;
  tasks: Array<{ name: string; startDate: string; endDate: string; status: string; dependencies?: string[] }>;
}): string {
  return `Analyze the project schedule for: ${project.name}

Project Start: ${project.startDate}
Project End: ${project.endDate}
Current Phase: ${project.phase}

Tasks:
${project.tasks.map(t => `- ${t.name}: ${t.startDate} to ${t.endDate} (${t.status})${t.dependencies?.length ? ` [Depends on: ${t.dependencies.join(', ')}]` : ''}`).join('\n')}

Provide schedule analysis covering:
1. Critical path identification
2. Potential schedule conflicts
3. Resource utilization analysis
4. Delay risk assessment
5. Recommended schedule optimizations
6. Weather/seasonal considerations`;
}

export function buildCostAnalysisPrompt(project: {
  name: string;
  budget: number;
  spent: number;
  changeOrders: Array<{ number: string; title: string; amount: number; status: string }>;
  categories: Array<{ name: string; budgeted: number; actual: number }>;
}): string {
  return `Analyze the cost status for: ${project.name}

Budget: $${project.budget.toLocaleString()}
Spent: $${project.spent.toLocaleString()}
Remaining: $${(project.budget - project.spent).toLocaleString()}

Change Orders:
${project.changeOrders.map(co => `- ${co.number}: ${co.title} - $${co.amount.toLocaleString()} (${co.status})`).join('\n')}

Cost by Category:
${project.categories.map(c => `- ${c.name}: Budgeted $${c.budgeted.toLocaleString()} | Actual $${c.actual.toLocaleString()} | Variance $${(c.actual - c.budgeted).toLocaleString()}`).join('\n')}

Provide cost analysis covering:
1. Overall budget health status
2. Variance analysis by category
3. Change order impact assessment
4. Cost trend projection
5. Final cost forecast
6. Cost-saving recommendations
7. Risk factors for budget overrun`;
}
