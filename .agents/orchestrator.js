#!/usr/bin/env node

/**
 * ============================================
 * CORTEXBUILD ULTIMATE - Agent Orchestrator
 * ============================================
 * 
 * This script manages the lifecycle of all AI agents:
 * - Discovery: Find all agent configurations
 * - Loading: Load agent configurations and system prompts
 * - Execution: Run agents based on triggers
 * - Monitoring: Track agent performance
 * - Coordination: Handle inter-agent communication
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../lib/database/client.js';
import { aiService } from '../lib/ai/unified-ai-service.js';
import { workflowEngine } from '../lib/services/workflow-engine.js';

const AGENTS_DIR = './.agents/agents';
const SUBAGENTS_DIR = './.agents/subagents';

// ============================================
// AGENT REGISTRY
// ============================================

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.subagents = new Map();
    this.activeAgents = new Set();
  }

  async discoverAgents() {
    console.log('🔍 Discovering agents...');
    
    try {
      const agentDirs = await readdir(AGENTS_DIR);
      
      for (const dir of agentDirs) {
        const agentPath = join(AGENTS_DIR, dir, 'agent.json');
        const systemPath = join(AGENTS_DIR, dir, 'system.md');
        
        try {
          const config = JSON.parse(await readFile(agentPath, 'utf-8'));
          const systemPrompt = await readFile(systemPath, 'utf-8');
          
          this.agents.set(config.name, {
            config,
            systemPrompt,
            path: dir,
            loaded: true,
          });
          
          console.log(`  ✅ Loaded: ${config.name}`);
        } catch (e) {
          console.log(`  ⚠️  Failed to load: ${dir} - ${e.message}`);
        }
      }
      
      console.log(`📊 Total agents discovered: ${this.agents.size}`);
    } catch (e) {
      console.error('❌ Error discovering agents:', e.message);
    }
  }

  async discoverSubagents() {
    console.log('🔍 Discovering subagents...');
    
    try {
      const subagentDirs = await readdir(SUBAGENTS_DIR);
      
      for (const dir of subagentDirs) {
        const configPath = join(SUBAGENTS_DIR, dir, 'agent.json');
        
        try {
          const config = JSON.parse(await readFile(configPath, 'utf-8'));
          
          this.subagents.set(config.name, {
            config,
            path: dir,
            loaded: true,
          });
          
          console.log(`  ✅ Loaded: ${config.name}`);
        } catch (e) {
          console.log(`  ⚠️  Failed to load: ${dir} - ${e.message}`);
        }
      }
      
      console.log(`📊 Total subagents discovered: ${this.subagents.size}`);
    } catch (e) {
      console.log(`  ℹ️  No subagents directory found`);
    }
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  getSubagent(name) {
    return this.subagents.get(name);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  getEnabledAgents() {
    return Array.from(this.agents.values()).filter(a => a.config.enabled);
  }
}

// ============================================
// AGENT EXECUTOR
// ============================================

class AgentExecutor {
  constructor(registry) {
    this.registry = registry;
    this.executionLog = [];
  }

  async executeAgent(agentName, triggerData = {}) {
    const agent = this.registry.getAgent(agentName);
    
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    if (!agent.config.enabled) {
      console.log(`⏭️  Skipping disabled agent: ${agentName}`);
      return;
    }

    console.log(`🚀 Executing agent: ${agentName}`);
    console.log(`   Trigger: ${triggerData.type || 'manual'}`);
    
    const execution = {
      agent: agentName,
      startedAt: new Date(),
      trigger: triggerData,
      status: 'running',
    };

    try {
      // Build AI prompt with system prompt
      const messages = [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: this.buildTaskPrompt(agent, triggerData) },
      ];

      // Execute AI analysis
      const result = await aiService.generateCompletion({
        provider: agent.config.model.provider,
        model: agent.config.model.name,
        messages,
        temperature: agent.config.model.temperature,
        maxTokens: agent.config.model.maxTokens,
      });

      // Process result
      const processedResult = await this.processResult(agent, result, triggerData);

      execution.completedAt = new Date();
      execution.status = 'completed';
      execution.result = processedResult;

      // Log execution
      await this.logExecution(execution);

      console.log(`✅ Agent ${agentName} completed successfully`);
      
      return processedResult;

    } catch (error) {
      execution.completedAt = new Date();
      execution.status = 'failed';
      execution.error = error.message;

      await this.logExecution(execution);

      console.error(`❌ Agent ${agentName} failed: ${error.message}`);
      
      throw error;
    }
  }

  buildTaskPrompt(agent, triggerData) {
    const prompts = {
      'Project Analysis Agent': this.buildProjectAnalysisPrompt(triggerData),
      'Safety Compliance Agent': this.buildSafetyPrompt(triggerData),
      'Financial Agent': this.buildFinancialPrompt(triggerData),
      'Document Processing Agent': this.buildDocumentPrompt(triggerData),
      'Schedule Agent': this.buildSchedulePrompt(triggerData),
      'Quality Control Agent': this.buildQualityPrompt(triggerData),
    };

    return prompts[agent.name] || this.buildGenericPrompt(triggerData);
  }

  buildProjectAnalysisPrompt(triggerData) {
    return `Analyze the construction project health based on the following trigger:
    
Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive project health analysis including:
1. Overall project status (Green/Yellow/Red)
2. Progress vs planned
3. Budget performance
4. Schedule performance
5. Key risks identified
6. Recommendations for improvement`;
  }

  buildSafetyPrompt(triggerData) {
    return `Analyze construction safety compliance based on the following trigger:

Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive safety analysis including:
1. Overall safety score (0-100)
2. Active incidents and trends
3. Compliance gaps
4. High-risk activities identified
5. Immediate actions required
6. Recommendations for improvement`;
  }

  buildFinancialPrompt(triggerData) {
    return `Analyze construction project financial health based on the following trigger:

Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive financial analysis including:
1. Budget status (On Track/At Risk/Over Budget)
2. Cost performance by category
3. Forecast final cost
4. Cash flow projection
5. Change order impact
6. Recommendations for cost control`;
  }

  buildDocumentPrompt(triggerData) {
    return `Analyze construction documents based on the following trigger:

Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive document analysis including:
1. Document completeness check
2. Compliance verification
3. Missing items identified
4. Revision status
5. Action items required`;
  }

  buildSchedulePrompt(triggerData) {
    return `Analyze construction schedule based on the following trigger:

Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive schedule analysis including:
1. Schedule status (On Track/At Risk/Delayed)
2. Critical path analysis
3. Delay impacts
4. Recovery recommendations
5. What-if scenarios`;
  }

  buildQualityPrompt(triggerData) {
    return `Analyze construction quality status based on the following trigger:

Trigger Type: ${triggerData.type || 'scheduled'}
Trigger Data: ${JSON.stringify(triggerData.data || {})}

Provide a comprehensive quality analysis including:
1. Overall quality score (0-100)
2. Defect trends
3. Inspection status
4. Punch list progress
5. Recommendations for improvement`;
  }

  buildGenericPrompt(triggerData) {
    return `Process the following trigger and provide analysis:

Trigger Type: ${triggerData.type || 'manual'}
Trigger Data: ${JSON.stringify(triggerData)}`;
  }

  async processResult(agent, result, triggerData) {
    // Parse AI response
    const content = result.content;
    
    // Extract structured data if possible
    let structuredData = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Keep as text
    }

    // Create notifications if configured
    if (agent.config.outputChannels && agent.config.outputChannels.length > 0) {
      await this.sendNotifications(agent, content, triggerData);
    }

    // Execute workflows if triggered
    if (triggerData.workflowId) {
      await workflowEngine.executeWorkflow(triggerData.workflowId, 'agent', {
        agentName: agent.config.name,
        analysisResult: content,
      });
    }

    return {
      content,
      structuredData,
      agent: agent.config.name,
      timestamp: new Date(),
      trigger: triggerData,
    };
  }

  async sendNotifications(agent, content, triggerData) {
    // In production, integrate with notification service
    console.log(`  📧 Sending notifications via: ${agent.config.outputChannels.join(', ')}`);
  }

  async logExecution(execution) {
    this.executionLog.push(execution);
    
    // In production, persist to database
    console.log(`  📝 Execution logged: ${execution.agent} - ${execution.status}`);
  }

  getExecutionHistory() {
    return this.executionLog;
  }
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

async function main() {
  console.log('🏗️  CortexBuild Ultimate - Agent Orchestrator');
  console.log('=' .repeat(50));
  
  const registry = new AgentRegistry();
  const executor = new AgentExecutor(registry);
  
  // Discover all agents
  await registry.discoverAgents();
  await registry.discoverSubagents();
  
  console.log('\n📋 Available Agents:');
  registry.getAllAgents().forEach(agent => {
    console.log(`  - ${agent.config.name} (${agent.config.enabled ? '✅' : '⏸️'})`);
  });
  
  console.log('\n📋 Available Subagents:');
  registry.subagents.forEach((subagent, name) => {
    console.log(`  - ${name}`);
  });
  
  // Execute enabled agents based on triggers
  console.log('\n🚀 Executing enabled agents...');
  
  const enabledAgents = registry.getEnabledAgents();
  
  for (const agent of enabledAgents) {
    try {
      await executor.executeAgent(agent.config.name, {
        type: 'startup',
        timestamp: new Date(),
      });
    } catch (e) {
      console.error(`  ❌ ${agent.config.name} failed: ${e.message}`);
    }
  }
  
  console.log('\n✅ Agent orchestration complete');
  console.log('=' .repeat(50));
}

// Run if called directly
if (process.argv[1].endsWith('orchestrator.js')) {
  main().catch(console.error);
}

export { AgentRegistry, AgentExecutor, main };
