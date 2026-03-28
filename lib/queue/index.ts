import { Queue, Worker, Job } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = { url: REDIS_URL };

export const queues = {
  notifications: new Queue('notifications', { connection }),
  emails: new Queue('emails', { connection }),
  ai: new Queue('ai', { connection }),
};

export async function addJob<T>(
  queueName: 'notifications' | 'emails' | 'ai',
  jobName: string,
  data: T,
  opts?: { attempts?: number; backoff?: { type: string; delay: number } }
) {
  const queue = queues[queueName];
  return queue.add(jobName, data, {
    attempts: opts?.attempts || 3,
    backoff: opts?.backoff || { type: 'exponential', delay: 1000 },
  });
}

export async function getJobCounts(queueName: 'notifications' | 'emails' | 'ai') {
  const queue = queues[queueName];
  return queue.getJobCounts();
}

export async function getQueueStatus(queueName: 'notifications' | 'emails' | 'ai') {
  const queue = queues[queueName];
  const [counts, isPaused] = await Promise.all([
    queue.getJobCounts(),
    queue.isPaused(),
  ]);
  return { counts, isPaused };
}

export async function pauseQueue(queueName: 'notifications' | 'emails' | 'ai') {
  return queues[queueName].pause();
}

export async function resumeQueue(queueName: 'notifications' | 'emails' | 'ai') {
  return queues[queueName].resume();
}

export async function closeQueues() {
  await Promise.all([
    queues.notifications.close(),
    queues.emails.close(),
    queues.ai.close(),
  ]);
}
