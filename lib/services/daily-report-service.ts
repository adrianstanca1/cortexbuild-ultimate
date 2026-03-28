import { prisma } from '@/lib/db';

export interface DailyReportFilters {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  createdById?: string;
}

export interface CreateDailyReportInput {
  date: Date;
  weather?: string;
  temperature?: string;
  workforceCount?: number;
  workPerformed: string;
  notes?: string;
  projectId: string;
  createdById: string;
}

export interface UpdateDailyReportInput extends Partial<Omit<CreateDailyReportInput, 'projectId' | 'createdById'>> {
  id: string;
}

export async function createDailyReport(data: CreateDailyReportInput) {
  return prisma.dailyReport.create({
    data,
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getDailyReportById(id: string) {
  return prisma.dailyReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listDailyReports(filters: DailyReportFilters = {}, page = 1, limit = 50) {
  const where: Record<string, unknown> = {};

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.createdById) where.createdById = filters.createdById;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
  }

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.dailyReport.count({ where }),
  ]);

  return { reports, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateDailyReport({ id, ...data }: UpdateDailyReportInput) {
  return prisma.dailyReport.update({
    where: { id },
    data,
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteDailyReport(id: string) {
  return prisma.dailyReport.delete({ where: { id } });
}

export async function getDailyReportsByProject(projectId: string, startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = { projectId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = startDate;
    if (endDate) (where.date as Record<string, unknown>).lte = endDate;
  }

  return prisma.dailyReport.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getDailyReportSummary(projectId: string, startDate: Date, endDate: Date) {
  const reports = await prisma.dailyReport.findMany({
    where: {
      projectId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      workforceCount: true,
      weather: true,
      temperature: true,
    },
    orderBy: { date: 'asc' },
  });

  let totalWorkforce = 0;
  for (const r of reports) totalWorkforce += r.workforceCount;
  const avgWorkforce = reports.length > 0 ? totalWorkforce / reports.length : 0;

  const weatherBreakdown: Record<string, number> = {};
  for (const r of reports) {
    if (r.weather) weatherBreakdown[r.weather] = (weatherBreakdown[r.weather] || 0) + 1;
  }

  return {
    totalReports: reports.length,
    totalWorkforce,
    averageWorkforce: Math.round(avgWorkforce),
    weatherBreakdown,
    reports,
  };
}
