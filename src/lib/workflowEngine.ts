import { toast } from 'sonner';
import { eventBus } from './eventBus';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'action' | 'condition';
  config: Record<string, unknown>;
  nextStepId?: string;
}

interface Workflow {
  id: string;
  name: string;
  trigger: {
    type: 'manual' | 'automatic' | 'scheduled';
    conditions: Record<string, unknown>;
  };
  steps: WorkflowStep[];
  active: boolean;
}

interface ApprovalState {
  [workflowId: string]: {
    [stepId: string]: 'pending' | 'approved' | 'rejected';
  };
}

const approvalStates: ApprovalState = {};

export class WorkflowEngine {
  private workflows: Workflow[] = [];

  constructor() {
    this.loadWorkflows();
  }

  private loadWorkflows() {
    // Load workflows from storage/API
    this.workflows = [
      {
        id: '1',
        name: 'Invoice Approval',
        trigger: { type: 'automatic', conditions: { type: 'invoice', amount: '>1000' } },
        steps: [
          { id: '1', name: 'Notify Manager', type: 'notification', config: { role: 'manager' } },
          { id: '2', name: 'Manager Approval', type: 'approval', config: { role: 'manager' } },
          { id: '3', name: 'Process Payment', type: 'action', config: { action: 'pay' } },
        ],
        active: true,
      },
      {
        id: '2',
        name: 'Safety Incident Response',
        trigger: { type: 'automatic', conditions: { type: 'safety_incident', severity: 'high' } },
        steps: [
          { id: '1', name: 'Alert Safety Officer', type: 'notification', config: { role: 'safety_officer' } },
          { id: '2', name: 'Create Incident Report', type: 'action', config: { action: 'create_report' } },
          { id: '3', name: 'Schedule Investigation', type: 'action', config: { action: 'schedule' } },
        ],
        active: true,
      },
    ];
  }

  async executeWorkflow(workflowId: string, context: Record<string, unknown>) {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow || !workflow.active) return false;

    let currentStepId: string | undefined = workflow.steps[0]?.id;

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) break;

      const result = await this.executeStep(step, context);
      if (result === 'blocked') break;
      currentStepId = step.nextStepId;
    }

    return true;
  }

  private async executeStep(
    step: WorkflowStep,
    context: Record<string, unknown>,
  ): Promise<'continue' | 'blocked'> {
    switch (step.type) {
      case 'notification':
        await this.sendNotification(step.config, context);
        break;
      case 'approval': {
        const approvalResult = await this.requestApproval(step.config, context);
        if (approvalResult === 'rejected') return 'blocked';
        break;
      }
      case 'action':
        await this.performAction(step.config, context);
        break;
      case 'condition': {
        const conditionMet = this.evaluateCondition(step.config, context);
        step.nextStepId = conditionMet
          ? String(step.config.nextStepIfTrue ?? '')
          : String(step.config.nextStepIfFalse ?? '');
        break;
      }
    }
    return 'continue';
  }

  private async sendNotification(config: Record<string, unknown>, context: Record<string, unknown>) {
    const role = String(config.role ?? 'all');
    const title = String(config.title ?? context.title ?? `Workflow notification for ${role}`);
    const message = String(config.message ?? context.message ?? `Action required: ${title}`);
    const severity = String(config.severity ?? 'info');

    // Show toast notification
    if (severity === 'error' || severity === 'critical') {
      toast.error(title, { description: message });
    } else if (severity === 'warning') {
      toast.warning(title, { description: message });
    } else if (severity === 'success') {
      toast.success(title, { description: message });
    } else {
      toast.info(title, { description: message });
    }

    // Emit event for NotificationCenter to pick up
    eventBus.emit('workflow:notification', {
      id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: severity === 'warning' ? 'warning' : severity === 'error' ? 'alert' : 'info',
      title,
      message,
      role,
      timestamp: new Date().toISOString(),
    });
  }

  private async requestApproval(
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<'approved' | 'rejected' | 'pending'> {
    const requiredRole = String(config.role ?? 'admin');
    const workflowId = String(context.workflowId ?? '');
    const stepId = String(context.stepId ?? '');
    const userRole = String(context.userRole ?? 'field_worker');

    // Check if user has the required role for approval
    const roleHierarchy = ['field_worker', 'project_manager', 'admin', 'company_owner', 'super_admin'];
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    const userLevel = roleHierarchy.indexOf(userRole);

    if (userLevel < requiredLevel) {
      toast.warning('Approval Denied', {
        description: `You need ${requiredRole} or higher role to approve this step.`,
      });
      return 'rejected';
    }

    // Check cached approval state
    if (workflowId && stepId && approvalStates[workflowId]?.[stepId]) {
      return approvalStates[workflowId][stepId];
    }

    // Auto-approve for valid users (in production this would require explicit UI confirmation)
    const approvalKey = `${workflowId}:${stepId}`;
    toast.success('Step Approved', {
      description: `Approved by ${userRole} — ${approvalKey}`,
    });

    if (workflowId && stepId) {
      if (!approvalStates[workflowId]) approvalStates[workflowId] = {};
      approvalStates[workflowId][stepId] = 'approved';
    }

    return 'approved';
  }

  private async performAction(config: Record<string, unknown>, context: Record<string, unknown>) {
    const actionType = String(config.action ?? '');

    switch (actionType) {
      case 'pay':
        toast.success('Payment Processed', {
          description: `Payment initiated for invoice ${String(context.invoiceId ?? 'N/A')}`,
        });
        eventBus.emit('workflow:action', { action: 'pay', context, timestamp: new Date().toISOString() });
        break;
      case 'create_report':
        toast.info('Report Created', {
          description: `New report created: ${String(context.reportType ?? 'incident')}`,
        });
        eventBus.emit('workflow:action', { action: 'create_report', context, timestamp: new Date().toISOString() });
        break;
      case 'schedule':
        toast.info('Task Scheduled', {
          description: `Scheduled: ${String(context.taskName ?? 'investigation')}`,
        });
        eventBus.emit('workflow:action', { action: 'schedule', context, timestamp: new Date().toISOString() });
        break;
      case 'notify_team':
        toast.info('Team Notified', {
          description: `Notification sent to team about ${String(context.topic ?? 'update')}`,
        });
        break;
      default:
        toast.info(`Action executed: ${actionType}`, {
          description: `Workflow action completed with context keys: ${Object.keys(context).join(', ')}`,
        });
        eventBus.emit('workflow:action', { action: actionType, context, timestamp: new Date().toISOString() });
        break;
    }
  }

  private evaluateCondition(config: Record<string, unknown>, context: Record<string, unknown>): boolean {
    const field = String(config.field ?? '');
    const operator = String(config.operator ?? 'eq');
    const value = config.value;

    const contextValue = context[field];
    if (contextValue === undefined) return false;

    switch (operator) {
      case 'eq': return contextValue === value;
      case 'neq': return contextValue !== value;
      case 'gt': return Number(contextValue) > Number(value);
      case 'gte': return Number(contextValue) >= Number(value);
      case 'lt': return Number(contextValue) < Number(value);
      case 'lte': return Number(contextValue) <= Number(value);
      case 'includes': return String(contextValue).includes(String(value));
      default: return false;
    }
  }

  getWorkflows() {
    return this.workflows;
  }

  addWorkflow(workflow: Workflow) {
    this.workflows.push(workflow);
  }

  deactivateWorkflow(workflowId: string) {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.active = false;
    }
  }

  /** Set the approval state for a given step (called from UI when user approves/rejects) */
  setApprovalState(workflowId: string, stepId: string, state: 'approved' | 'rejected') {
    if (!approvalStates[workflowId]) approvalStates[workflowId] = {};
    approvalStates[workflowId][stepId] = state;
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
