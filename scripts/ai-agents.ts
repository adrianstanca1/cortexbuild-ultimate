import { analyzeRFI, type RFI } from '../agents/rfi-analyzer';
import { analyzeSafetyIncident, generateSafetySummary, type SafetyReport } from '../agents/safety-agent';
import { summarizeDailyReport, type DailyReport } from '../agents/daily-report-agent';
import { analyzeChangeOrderImpact, type ChangeOrder } from '../agents/change-order-agent';
import { checkProviderConnection } from '../lib/ai';
import { loadModel } from '../lib/ai/ollama';

export type TaskType = 'rfi' | 'safety' | 'daily-report' | 'change-order';

export interface Task {
  id: string;
  type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: RFI | SafetyReport | DailyReport | ChangeOrder;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentRunnerConfig {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: Required<AgentRunnerConfig> = {
  maxConcurrent: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  logLevel: 'info',
};

export class AIAgentRunner {
  private queue: Task[] = [];
  private running: Set<string> = new Set();
  private config: Required<AgentRunnerConfig>;
  private isProcessing = false;

  constructor(config: AgentRunnerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing AI Agent Runner...');

    const connection = await checkProviderConnection();
    this.log('info', `Provider connection: ${connection.message}`);

    if (!connection.connected) {
      this.log('warn', 'AI provider not connected. Tasks will fail until connection is established.');
    }
  }

  async loadModel(model?: string): Promise<void> {
    this.log('info', `Loading model: ${model || 'llama3.2'}...`);
    await loadModel(model);
    this.log('info', 'Model loaded successfully.');
  }

  enqueue(task: Omit<Task, 'id' | 'status' | 'createdAt'>): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fullTask: Task = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date(),
    };

    this.queue.push(fullTask);
    this.log('info', `Task enqueued: ${id} (${task.type}, ${task.priority})`);

    return id;
  }

  enqueueBatch(tasks: Omit<Task, 'id' | 'status' | 'createdAt'>[]): string[] {
    return tasks.map((task) => this.enqueue(task));
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      this.log('warn', 'Queue processing already in progress.');
      return;
    }

    this.isProcessing = true;
    this.log('info', 'Starting queue processing...');

    while (this.queue.length > 0 || this.running.size > 0) {
      while (this.running.size < this.config.maxConcurrent && this.queue.length > 0) {
        const sortedQueue = this.sortQueue();
        const task = sortedQueue.shift();
        if (task) {
          this.processTask(task);
        }
      }

      await this.sleep(100);
    }

    this.isProcessing = false;
    this.log('info', 'Queue processing complete.');
  }

  private sortQueue(): Task[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return this.queue
      .filter((t) => t.status === 'pending')
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  private async processTask(task: Task): Promise<void> {
    this.running.add(task.id);
    task.status = 'processing';
    this.log('info', `Processing task: ${task.id}`);

    let attempts = 0;

    while (attempts < this.config.retryAttempts) {
      try {
        const result = await this.executeTask(task);
        task.result = result;
        task.status = 'completed';
        task.completedAt = new Date();
        this.log('info', `Task completed: ${task.id}`);
        return;
      } catch (error) {
        attempts++;
        this.log('error', `Task failed (attempt ${attempts}/${this.config.retryAttempts}): ${task.id} - ${error instanceof Error ? error.message : 'Unknown error'}`);

        if (attempts < this.config.retryAttempts) {
          await this.sleep(this.config.retryDelay * attempts);
        }
      }
    }

    task.status = 'failed';
    task.error = `Failed after ${this.config.retryAttempts} attempts`;
  }

  private async executeTask(task: Task): Promise<unknown> {
    switch (task.type) {
      case 'rfi':
        return this.processRFI(task as Task & { data: RFI });
      case 'safety':
        return this.processSafety(task as Task & { data: SafetyReport });
      case 'daily-report':
        return this.processDailyReport(task as Task & { data: DailyReport });
      case 'change-order':
        return this.processChangeOrder(task as Task & { data: ChangeOrder });
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processRFI(task: Task & { data: RFI }): Promise<unknown> {
    const { data } = task;
    const result = await analyzeRFI({
      question: data.question,
      context: data.context,
      priority: data.priority,
    });
    return result;
  }

  private async processSafety(task: Task & { data: SafetyReport }): Promise<unknown> {
    const { data } = task;
    return analyzeSafetyIncident(data);
  }

  private async processDailyReport(task: Task & { data: DailyReport }): Promise<unknown> {
    const { data } = task;
    return summarizeDailyReport(data);
  }

  private async processChangeOrder(task: Task & { data: ChangeOrder }): Promise<unknown> {
    const { data } = task;
    return analyzeChangeOrderImpact(data);
  }

  getQueueStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.queue.filter((t) => t.status === 'pending').length,
      running: this.running.size,
      completed: this.queue.filter((t) => t.status === 'completed').length,
      failed: this.queue.filter((t) => t.status === 'failed').length,
      total: this.queue.length,
    };
  }

  getTask(id: string): Task | undefined {
    return this.queue.find((t) => t.id === id);
  }

  getResults(): unknown[] {
    return this.queue
      .filter((t) => t.status === 'completed' && t.result)
      .map((t) => t.result);
  }

  getFailures(): { id: string; error: string }[] {
    return this.queue
      .filter((t) => t.status === 'failed')
      .map((t) => ({ id: t.id, error: t.error || 'Unknown error' }));
  }

  clearCompleted(): void {
    this.queue = this.queue.filter((t) => t.status !== 'completed');
  }

  clearFailed(): void {
    this.queue = this.queue.filter((t) => t.status !== 'failed');
  }

  clearAll(): void {
    this.queue = [];
    this.running.clear();
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.config.logLevel]) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main(): Promise<void> {
  const runner = new AIAgentRunner({
    logLevel: 'info',
    maxConcurrent: 3,
    retryAttempts: 3,
  });

  await runner.initialize();

  const shouldLoadModel = process.env.LOAD_MODEL === 'true';
  if (shouldLoadModel) {
    await runner.loadModel();
  }

  const tasks = parseTasksFromArgs();
  
  if (tasks.length === 0) {
    console.log('No tasks to process. Use --task flag to add tasks.');
    console.log('Example: npm run ai-agents -- --task rfi --task safety');
    return;
  }

  for (const task of tasks) {
    runner.enqueue(task);
  }

  console.log(`\nProcessing ${tasks.length} tasks...\n`);
  
  await runner.processQueue();

  const status = runner.getQueueStatus();
  console.log('\n=== Final Status ===');
  console.log(`Pending: ${status.pending}`);
  console.log(`Running: ${status.running}`);
  console.log(`Completed: ${status.completed}`);
  console.log(`Failed: ${status.failed}`);

  const failures = runner.getFailures();
  if (failures.length > 0) {
    console.log('\n=== Failures ===');
    for (const failure of failures) {
      console.log(`  ${failure.id}: ${failure.error}`);
    }
  }
}

function parseTasksFromArgs(): Omit<Task, 'id' | 'status' | 'createdAt'>[] {
  const tasks: Omit<Task, 'id' | 'status' | 'createdAt'>[] = [];
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' && args[i + 1]) {
      const type = args[i + 1] as TaskType;
      const priority = (args[i + 2] as 'low' | 'medium' | 'high' | 'critical') || 'medium';
      
      tasks.push({
        type,
        priority,
        data: getSampleData(type),
      });
      
      i += 2;
    }
  }

  return tasks;
}

function getSampleData(type: TaskType): RFI | SafetyReport | DailyReport | ChangeOrder {
  switch (type) {
    case 'rfi':
      return {
        id: 'sample-rfi-1',
        projectId: 'sample-project',
        number: 'RFI-001',
        subject: 'Sample RFI',
        question: 'What is the specified concrete strength for the foundation?',
        context: 'Structural drawings show 4000 PSI but specification section 03 30 00 says 3000 PSI.',
        priority: 'high',
        status: 'open',
        submittedBy: 'Contractor A',
        submittedDate: new Date().toISOString(),
      };

    case 'safety':
      return {
        id: 'sample-safety-1',
        projectId: 'sample-project',
        date: new Date().toISOString(),
        type: 'incident',
        title: 'Minor Fall Incident',
        description: 'Worker slipped on wet surface from recent concrete pour.',
        location: 'Level 3, Grid A-4',
        reportedBy: 'Site Supervisor',
        severity: 'minor',
        status: 'open',
      };

    case 'daily-report':
      return {
        id: 'sample-daily-1',
        date: new Date().toISOString().split('T')[0],
        projectId: 'sample-project',
        weather: 'Clear',
        temperature: '72°F',
        humidity: '45%',
        workforce: [
          { trade: 'Carpenters', count: 8, hours: 8 },
          { trade: 'Laborers', count: 6, hours: 8 },
          { trade: 'Iron Workers', count: 4, hours: 8 },
        ],
        equipment: [
          { name: 'Crane', hours: 6, status: 'operational' },
          { name: 'Concrete Mixer', hours: 4, status: 'operational' },
        ],
        materials: [
          { name: 'Concrete', quantity: '200', unit: 'CY', delivered: true },
          { name: 'Rebar', quantity: '5000', unit: 'LF', delivered: false },
        ],
        progress: [
          { description: 'Completed foundation pour', percentComplete: 100 },
          { description: 'Started rebar installation', percentComplete: 40 },
        ],
        issues: [
          { type: 'supply', description: 'Rebar delivery delayed 2 days', impact: 'medium' },
        ],
      };

    case 'change-order':
      return {
        id: 'sample-co-1',
        projectId: 'sample-project',
        number: 'CO-001',
        title: 'Additional Foundation Work',
        description: 'Unforeseen soil conditions require additional foundation reinforcement.',
        status: 'pending',
        submittedBy: 'Contractor A',
        submittedDate: new Date().toISOString(),
        contractor: 'ABC Construction',
        originalContractAmount: 5000000,
        proposedChangeAmount: 150000,
        proposedTimeImpact: 5,
        category: 'conditions',
        justification: 'Geotechnical report did not accurately reflect actual soil conditions.',
      };
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
