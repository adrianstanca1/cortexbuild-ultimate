import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { sendNotification, sendEmail, processAI, handleFailedJob, NotificationJobData, EmailJobData, AIProcessingJobData } from '@/lib/queue/jobs';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    console.log(`[Worker] Processing notification job ${job.id}`);
    return sendNotification(job.data);
  },
  { connection, concurrency: 5 }
);

const emailWorker = new Worker<EmailJobData>(
  'emails',
  async (job: Job<EmailJobData>) => {
    console.log(`[Worker] Processing email job ${job.id}`);
    return sendEmail(job.data);
  },
  { connection, concurrency: 3 }
);

const aiWorker = new Worker<AIProcessingJobData>(
  'ai',
  async (job: Job<AIProcessingJobData>) => {
    console.log(`[Worker] Processing AI job ${job.id}`);
    return processAI(job.data);
  },
  { connection, concurrency: 2 }
);

notificationWorker.on('completed', (job: Job) => {
  console.log(`[Worker] Notification job ${job.id} completed`);
});

notificationWorker.on('failed', async (job: Job | undefined) => {
  if (job) await handleFailedJob(job);
});

emailWorker.on('completed', (job: Job) => {
  console.log(`[Worker] Email job ${job.id} completed`);
});

emailWorker.on('failed', async (job: Job | undefined) => {
  if (job) await handleFailedJob(job);
});

aiWorker.on('completed', (job: Job) => {
  console.log(`[Worker] AI job ${job.id} completed`);
});

aiWorker.on('failed', async (job: Job | undefined) => {
  if (job) await handleFailedJob(job);
});

async function startWorker() {
  console.log('[Worker] Starting background workers...');
  
  await Promise.all([
    notificationWorker.waitUntilReady(),
    emailWorker.waitUntilReady(),
    aiWorker.waitUntilReady(),
  ]);
  
  console.log('[Worker] All workers ready');
}

async function gracefulShutdown() {
  console.log('[Worker] Shutting down...');
  
  await Promise.all([
    notificationWorker.close(),
    emailWorker.close(),
    aiWorker.close(),
  ]);
  
  await prisma.$disconnect();
  
  console.log('[Worker] All workers stopped');
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startWorker().catch((error) => {
  console.error('[Worker] Failed to start:', error);
  process.exit(1);
});
