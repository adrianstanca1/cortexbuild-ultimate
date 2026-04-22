/**
 * Agent Orchestrator — Coordinates specialized construction AI agents
 * Integrates domain knowledge agents with the unified AI client
 */

const { SYSTEM_PROMPTS, ANALYSIS_PROMPTS } = require('../ai-prompts');

const AGENT_DEFINITIONS = {
  construction_domain: {
    name: 'Construction Domain Expert',
    description: 'Building standards, construction methods, materials, regulations',
    aliases: ['domain', 'construction', 'building'],
  },
  safety_compliance: {
    name: 'Safety & Compliance Officer',
    description: 'OSHA/OSHA/HSE standards, hazard analysis, incident investigation',
    aliases: ['safety', 'compliance', 'hse', 'hazard'],
  },
  cost_estimation: {
    name: 'Cost Estimation Specialist',
    description: 'Unit costs, labor rates, equipment rates, project budgeting',
    aliases: ['cost', 'estimate', 'budget', 'pricing', 'rates'],
  },
  project_coordinator: {
    name: 'Project Coordinator',
    description: 'Scheduling, resource allocation, progress tracking, coordination',
    aliases: ['project', 'schedule', 'resources', 'coordination', 'planning'],
  },
};

function detectAgentType(query) {
  const lowerQuery = query.toLowerCase();

  for (const [agentKey, agent] of Object.entries(AGENT_DEFINITIONS)) {
    for (const alias of agent.aliases) {
      if (lowerQuery.includes(alias)) {
        return agentKey;
      }
    }
  }

  return 'construction_domain';
}

function getAgentSystemPrompt(agentType) {
  const agentPrompts = {
    construction_domain: `You are a senior construction expert with deep knowledge of:
- Building codes, standards (BS, Eurocodes, ACI, etc.)
- Construction methods and best practices
- Material specifications and performance
- Structural systems and load calculations
- Building envelope and weatherproofing
- Fire safety and compartmentalization
- Accessibility requirements
- Sustainable construction practices

Provide detailed, technically accurate guidance. Reference relevant standards.`,
    safety_compliance: `You are a safety compliance expert specializing in:
- OSHA standards and regulations
- Hazard identification and risk assessment
- Personal protective equipment (PPE)
- Fall protection and working at height
- Electrical safety and lockout/tagout
- Chemical safety and HazCom
- Incident investigation and reporting
- Emergency response procedures

Provide actionable safety recommendations with regulatory references.`,
    cost_estimation: `You are a construction cost estimation specialist with expertise in:
- Unit costs for materials, labor, and equipment
- Labor productivity rates and crew composition
- Equipment ownership and operating costs
- Overhead and profit margins
- Cost indices and location factors
- Life cycle cost analysis
- Value engineering
- Risk allowances and contingencies

Provide detailed cost breakdowns with itemized estimates.`,
    project_coordinator: `You are a construction project coordinator with expertise in:
- Project scheduling and critical path method
- Resource allocation and leveling
- Progress monitoring and earned value
- Stakeholder communication
- Change management
- Risk management
- Quality control coordination
- Team leadership and coordination

Provide practical coordination advice with clear action items.`,
  };

  return agentPrompts[agentType] || agentPrompts.construction_domain;
}

function buildAgenticPrompt(userQuery, options = {}) {
  const {
    agentType = detectAgentType(userQuery),
    context = {},
    includeSystemPrompt = true,
  } = options;

  const parts = [];

  if (includeSystemPrompt) {
    parts.push(getAgentSystemPrompt(agentType));
  }

  if (context.project) {
    parts.push(`\nProject Context: ${context.project}`);
  }

  if (context.documents) {
    parts.push(`\nRelevant Documents:\n${context.documents.join('\n')}`);
  }

  parts.push(`\nUser Query: ${userQuery}`);

  return parts.join('\n\n');
}

module.exports = {
  AGENT_DEFINITIONS,
  detectAgentType,
  getAgentSystemPrompt,
  buildAgenticPrompt,
};