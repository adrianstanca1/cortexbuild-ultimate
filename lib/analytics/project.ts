import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export interface ProjectStats {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalRFIs: number;
  openRFIs: number;
  resolvedRFIs: number;
  totalDailyReports: number;
  totalSafetyIncidents: number;
  budgetTotal: number;
  startDate: Date;
  endDate: Date;
  progress: number;
}

export interface ProjectAnalytics {
  projectId: string;
  period: { start: Date; end: Date };
  tasksCompleted: number;
  rfisResolved: number;
  dailyReportsSubmitted: number;
  safetyIncidents: number;
  budgetUsed: number;
  laborHours: number;
  changeOrdersCount: number;
  changeOrdersValue: number;
}

export async function getProjectStats(projectId: string): Promise<ProjectStats | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      rfis: true,
      dailyReports: true,
      safetyIncidents: true,
      costItems: true,
    },
  });

  if (!project) return null;

  const now = new Date();
  const completedTasks = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const inProgressTasks = project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const overdueTasks = project.tasks.filter(
    (t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
  ).length;

  const openRFIs = project.rfis.filter((r: any) => r.status !== 'CLOSED').length;
  const resolvedRFIs = project.rfis.filter((r: any) => r.status === 'CLOSED').length;

  const budgetTotal = project.costItems.reduce((sum: number, b: any) => sum + b.amount, 0);

  const startDate = project.startDate ? new Date(project.startDate) : now;
  const endDate = project.endDate ? new Date(project.endDate) : now;
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0;

  return {
    projectId: project.id,
    projectName: project.name,
    totalTasks: project.tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    totalRFIs: project.rfis.length,
    openRFIs,
    resolvedRFIs,
    totalDailyReports: project.dailyReports.length,
    totalSafetyIncidents: project.safetyIncidents.length,
    budgetTotal,
    startDate,
    endDate,
    progress,
  };
}

export async function getProjectAnalytics(
  projectId: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<ProjectAnalytics[]> {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;
  let periodsCount: number;

  switch (period) {
    case 'week':
      periodStart = startOfWeek(subDays(now, 7 * 4));
      periodEnd = endOfWeek(now);
      periodsCount = 4;
      break;
    case 'month':
      periodStart = startOfMonth(subDays(now, 30 * 6));
      periodEnd = endOfMonth(now);
      periodsCount = 6;
      break;
    case 'quarter':
      periodStart = startOfMonth(subDays(now, 30 * 12));
      periodEnd = endOfMonth(now);
      periodsCount = 4;
      break;
    case 'year':
      periodStart = startOfMonth(subDays(now, 365 * 2));
      periodEnd = endOfMonth(now);
      periodsCount = 24;
      break;
  }

  const analytics: ProjectAnalytics[] = [];

  for (let i = 0; i < periodsCount; i++) {
    const currentStart = subDays(periodStart, -i * (period === 'week' ? 7 : 30));
    const currentEnd = period === 'week'
      ? endOfWeek(currentStart)
      : endOfMonth(currentStart);

    const [tasksCompleted, rfisResolved, dailyReportsSubmitted, safetyIncidents, laborHours, budgetUsed] = await Promise.all([
      prisma.task.count({
        where: {
          projectId,
          status: 'COMPLETE',
          completedAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.rFI.count({
        where: {
          projectId,
          status: 'CLOSED',
        },
      }),
      prisma.dailyReport.count({
        where: {
          projectId,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.safetyIncident.count({
        where: {
          projectId,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.dailyReport.aggregate({
        where: {
          projectId,
          date: { gte: currentStart, lte: currentEnd },
        },
        _sum: { workforceCount: true },
      }),
      prisma.costItem.aggregate({
        where: {
          projectId,
        },
        _sum: { amount: true },
      }),
    ]);

    const changeOrders = await prisma.changeOrder.aggregate({
      where: {
        projectId,
        createdAt: { gte: currentStart, lte: currentEnd },
        status: 'APPROVED',
      },
      _sum: { amount: true },
      _count: true,
    });

    analytics.push({
      projectId,
      period: { start: currentStart, end: currentEnd },
      tasksCompleted,
      rfisResolved,
      dailyReportsSubmitted,
      safetyIncidents,
      budgetUsed: budgetUsed._sum.amount || 0,
      laborHours: laborHours._sum.workforceCount || 0,
      changeOrdersCount: changeOrders._count,
      changeOrdersValue: changeOrders._sum.amount || 0,
    });
  }

  return analytics;
}

export async function getAllProjectsSummary(): Promise<ProjectStats[]> {
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      rfis: true,
      dailyReports: true,
      safetyIncidents: true,
      costItems: true,
    },
  });

  return Promise.all(projects.map((p: any) => getProjectStats(p.id) as Promise<ProjectStats>));
}

export async function getProductivityTrends(
  projectId: string,
  days: number = 30
): Promise<{ date: string; completed: number; added: number }[]> {
  const startDate = subDays(new Date(), days);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      OR: [
        { completedAt: { gte: startDate } },
        { createdAt: { gte: startDate } },
      ],
    },
    select: { createdAt: true, completedAt: true },
  });

  const dailyStats: Record<string, { completed: number; added: number }> = {};

  for (let i = 0; i <= days; i++) {
    const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
    dailyStats[date] = { completed: 0, added: 0 };
  }

  tasks.forEach((task: any) => {
    const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
    if (dailyStats[createdDate]) {
      dailyStats[createdDate].added++;
    }

    if (task.completedAt) {
      const completedDate = format(new Date(task.completedAt), 'yyyy-MM-dd');
      if (dailyStats[completedDate]) {
        dailyStats[completedDate].completed++;
      }
    }
  });

  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    completed: stats.completed,
    added: stats.added,
  }));
}
