import { Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { addJob } from './index';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  projectId?: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: Record<string, unknown>;
}

export interface AIProcessingJobData {
  type: 'summarize' | 'classify' | 'extract' | 'chat';
  input: string;
  projectId?: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export async function sendNotification(data: NotificationJobData) {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      projectId: data.projectId,
    },
  });

  return { success: true, userId: data.userId };
}

export async function sendEmail(data: EmailJobData) {
  console.log(`[Email] Sending to ${data.to}: ${data.subject}`);
  
  if (process.env.NODE_ENV === 'production') {
    // In production, integrate with actual email service (SendGrid, AWS SES, etc.)
    // await sendViaProvider(data);
  }

  return { success: true, to: data.to };
}

export async function processAI(data: AIProcessingJobData) {
  console.log(`[AI] Processing ${data.type} request for user ${data.userId}`);

  switch (data.type) {
    case 'summarize':
      return { success: true, summary: 'AI summary placeholder', originalLength: data.input.length };
    
    case 'classify':
      return { success: true, classification: 'classified', confidence: 0.95 };
    
    case 'extract':
      return { success: true, extracted: { entities: [] }, inputLength: data.input.length };
    
    case 'chat':
      return { success: true, response: 'AI response placeholder', model: 'gpt-4' };
    
    default:
      throw new Error(`Unknown AI processing type: ${data.type}`);
  }
}

export function queueNotification(data: NotificationJobData) {
  return addJob('notifications', 'send-notification', data);
}

export function queueEmail(data: EmailJobData) {
  return addJob('emails', 'send-email', data, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
}

export function queueAIProcessing(data: AIProcessingJobData) {
  return addJob('ai', 'process-ai', data, { attempts: 2, backoff: { type: 'exponential', delay: 5000 } });
}

export async function handleFailedJob(job: Job) {
  console.error(`[Queue] Job ${job.id} failed:`, job.failedReason);
  
  await job.updateProgress(100);
  
  if (job.data && typeof job.data === 'object' && 'userId' in job.data) {
    const notificationData = job.data as NotificationJobData;
    await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        title: 'Job Failed',
        message: `A background task failed to complete: ${job.name}`,
      },
    });
  }
}
