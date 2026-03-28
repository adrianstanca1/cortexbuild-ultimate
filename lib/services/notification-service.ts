import { prisma } from '@/lib/db';

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  projectId?: string;
}

export async function sendNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      projectId: input.projectId,
    },
  });
}

export async function sendEmailNotification(input: NotificationInput & { email: string }) {
  console.log(`[EMAIL] To: ${input.email}`);
  console.log(`[EMAIL] Subject: ${input.title}`);
  console.log(`[EMAIL] Body: ${input.message}`);

  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: `Email: ${input.title}`,
      message: input.message,
      projectId: input.projectId,
    },
  });
}

export async function createInAppNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      projectId: input.projectId,
    },
  });
}

export async function notifyProjectUpdate(projectId: string, updateType: string, message: string) {
  const projectUsers = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      teamMembers: {
        select: { userId: true },
      },
      manager: {
        select: { id: true },
      },
    },
  });

  if (!projectUsers) return;

  const userIds = [
    ...projectUsers.teamMembers.map((m: { userId: string }) => m.userId),
    projectUsers.manager?.id,
  ].filter(Boolean) as string[];

  return Promise.all(
    userIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: `Project Update: ${updateType}`,
          message,
          projectId,
        },
      })
    )
  );
}

export async function notifyTaskAssigned(taskId: string, assigneeId: string, taskTitle: string) {
  return prisma.notification.create({
    data: {
      userId: assigneeId,
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${taskTitle}`,
    },
  });
}

export async function notifyRFICreated(rfiId: string, assignedToId: string | null, rfiTitle: string) {
  if (!assignedToId) return [];
  
  const notification = await prisma.notification.create({
    data: {
      userId: assignedToId,
      title: 'New RFI Assigned',
      message: `You have been assigned to RFI: ${rfiTitle}`,
    },
  });

  return [notification];
}

export async function notifySafetyIncident(incidentId: string, severity: string) {
  const safetyManagers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  return Promise.all(
    safetyManagers.map((manager: { id: string }) =>
      prisma.notification.create({
        data: {
          userId: manager.id,
          title: `Safety Incident Reported: ${severity}`,
          message: `A ${severity} severity safety incident has been reported.`,
        },
      })
    )
  );
}
