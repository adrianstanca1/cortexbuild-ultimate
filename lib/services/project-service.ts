import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectFilters {
  status?: ProjectStatus;
  organizationId?: string;
  managerId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  organizationId: string;
  managerId?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

interface TaskStatusCount { status: string; _count: number }
interface SeverityCount { severity: string; _count: number }

export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({
    data,
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { tasks: true, rfis: true, dailyReports: true, safetyIncidents: true } },
    },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      organization: { select: { id: true, name: true, slug: true } },
      teamMembers: true,
      _count: { select: { tasks: true, rfis: true, dailyReports: true, safetyIncidents: true } },
    },
  });
}

export async function listProjects(filters: ProjectFilters = {}, page = 1, limit = 20) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.organizationId) where.organizationId = filters.organizationId;
  if (filters.managerId) where.managerId = filters.managerId;
  if (filters.startDate || filters.endDate) {
    where.startDate = {} as Record<string, unknown>;
    if (filters.startDate) (where.startDate as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.startDate as Record<string, unknown>).lte = filters.endDate;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { tasks: true, rfis: true, dailyReports: true, safetyIncidents: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateProject({ id, ...data }: UpdateProjectInput) {
  return prisma.project.update({
    where: { id },
    data,
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function getProjectStats(projectId: string) {
  const [taskStats, rfiStats, dailyReportCount, safetyStats] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
    prisma.rFI.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
    prisma.dailyReport.count({ where: { projectId } }),
    prisma.safetyIncident.groupBy({
      by: ['severity'],
      where: { projectId },
      _count: true,
    }),
  ]);

  const tasksResult: Record<string, number> = {};
  for (const item of taskStats) tasksResult[item.status] = item._count;
  const rfisResult: Record<string, number> = {};
  for (const item of rfiStats) rfisResult[item.status] = item._count;
  const safetyResult: Record<string, number> = {};
  for (const item of safetyStats) safetyResult[item.severity] = item._count;

  return {
    tasks: tasksResult,
    rfis: rfisResult,
    dailyReports: dailyReportCount,
    safetyIncidents: safetyResult,
  };
}
