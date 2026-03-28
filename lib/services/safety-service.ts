import { prisma } from '@/lib/db';

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CLOSED';
type CheckStatus = 'PASSED' | 'FAILED' | 'PENDING';

export interface SafetyIncidentFilters {
  projectId?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  reportedById?: string;
}

export interface CreateSafetyIncidentInput {
  title: string;
  description: string;
  severity?: IncidentSeverity;
  projectId: string;
  reportedById: string;
  assignedToId?: string;
}

export interface UpdateSafetyIncidentInput extends Partial<CreateSafetyIncidentInput> {
  id: string;
}

export async function createSafetyIncident(data: CreateSafetyIncidentInput) {
  return prisma.safetyIncident.create({
    data,
    include: {
      project: { select: { id: true, name: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getSafetyIncidentById(id: string) {
  return prisma.safetyIncident.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listSafetyIncidents(filters: SafetyIncidentFilters = {}, page = 1, limit = 50) {
  const where: Record<string, unknown> = {};

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.severity) where.severity = filters.severity;
  if (filters.status) where.status = filters.status;
  if (filters.reportedById) where.reportedById = filters.reportedById;

  const [incidents, total] = await Promise.all([
    prisma.safetyIncident.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.safetyIncident.count({ where }),
  ]);

  return { incidents, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateSafetyIncident({ id, ...data }: UpdateSafetyIncidentInput) {
  return prisma.safetyIncident.update({
    where: { id },
    data,
    include: {
      project: { select: { id: true, name: true } },
      reportedBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function deleteSafetyIncident(id: string) {
  return prisma.safetyIncident.delete({ where: { id } });
}

export interface CreateToolboxTalkInput {
  title: string;
  date: Date;
  presenterId: string;
  projectId: string;
  attendees?: string[];
  notes?: string;
}

export async function createToolboxTalk(data: CreateToolboxTalkInput) {
  return prisma.toolboxTalk.create({
    data,
    include: {
      presenter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function listToolboxTalks(projectId: string, page = 1, limit = 50) {
  const where: Record<string, unknown> = { projectId };

  const [talks, total] = await Promise.all([
    prisma.toolboxTalk.findMany({
      where,
      include: {
        presenter: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.toolboxTalk.count({ where }),
  ]);

  return { talks, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getToolboxTalkById(id: string) {
  return prisma.toolboxTalk.findUnique({
    where: { id },
    include: {
      presenter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export interface CreateMEWPCheckInput {
  equipmentId: string;
  operatorId: string;
  projectId: string;
  supervisorId?: string;
  status?: CheckStatus;
  notes?: string;
}

export async function createMEWPCheck(data: CreateMEWPCheckInput) {
  return prisma.mEWPCheck.create({
    data,
    include: {
      operator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function listMEWPChecks(projectId: string, page = 1, limit = 50) {
  const where: Record<string, unknown> = { projectId };

  const [checks, total] = await Promise.all([
    prisma.mEWPCheck.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.mEWPCheck.count({ where }),
  ]);

  return { checks, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getMEWPCheckById(id: string) {
  return prisma.mEWPCheck.findUnique({
    where: { id },
    include: {
      operator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getTodayMEWPChecks(projectId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.mEWPCheck.findMany({
    where: {
      projectId,
      date: { gte: today, lt: tomorrow },
    },
    include: {
      operator: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });
}
