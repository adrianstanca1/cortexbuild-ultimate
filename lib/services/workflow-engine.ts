import { prisma } from '../database/client'
import { redis } from '../database/redis'
import { aiService } from '../ai/unified-ai-service'
import { sendNotification } from './notifications'

export class WorkflowEngine {
  constructor() {}

  async executeWorkflow(workflowId: string, triggerType: string = 'manual', triggerData: any = {}) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status: 'pending',
      },
    })

    try {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'running' },
      })

      const nodes = workflow.nodes as any[] || []
      for (const node of nodes) {
        if (node.type === 'ai') {
          const result = await aiService.generateCompletion(
            [{ role: 'user', content: node.prompt || 'Process data' }],
            'default'
          )
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { result: { aiResult: result.content } },
          })
        }
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          result: { completed: true },
        },
      })

      await sendNotification({
        type: 'workflow_completed',
        workflowId,
        executionId: execution.id,
      })

      return execution
    } catch (error: any) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error.message,
        },
      })
      throw error
    }
  }

  async scheduleWorkflow(workflowId: string, cronExpression: string) {
    await redis.set(`workflow:${workflowId}:cron`, cronExpression)
  }
}

export const workflowEngine = new WorkflowEngine()
