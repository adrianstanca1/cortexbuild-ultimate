import { prisma } from '@/lib/db';

type RFIStatus = 'OPEN' | 'ANSWERED' | 'CLOSED' | 'OVERDUE';

export interface RFIFilters {
  projectId?: string;
  status?: RFIStatus;
  assignedToId?: string;
  createdById?: string;
  search?: string;
}

export interface CreateRFIInput {
  number: string;
  title: string;
  question: string;
  projectId: string;
  createdById: string;
  assignedToId?: string;
  dueDate?: Date;
}

export interface UpdateRFIInput extends Partial<Omit<CreateRFIInput, 'number' | 'createdById'>> {
  id: string;
  answer?: string;
  answeredById?: string;
}

export async function createRFI(data: CreateRFIInput) {
  return prisma.rFI.create({
    data,
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getRFIById(id: string) {
  return prisma.rFI.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      answeredBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listRFIs(filters: RFIFilters = {}, page = 1, limit = 50) {
  const where: Record<string, unknown> = {};

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.status) where.status = filters.status;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.createdById) where.createdById = filters.createdById;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { number: { contains: filters.search, mode: 'insensitive' } },
      { question: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [rfis, total] = await Promise.all([
    prisma.rFI.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rFI.count({ where }),
  ]);

  return { rfis, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateRFI({ id, ...data }: UpdateRFIInput) {
  return prisma.rFI.update({
    where: { id },
    data,
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      answeredBy: { select: { id: true, name: true } },
    },
  });
}

export async function answerRFI(id: string, answer: string, answeredById: string) {
  return prisma.rFI.update({
    where: { id },
    data: {
      answer,
      answeredById,
      status: 'ANSWERED',
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      answeredBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteRFI(id: string) {
  return prisma.rFI.delete({ where: { id } });
}

export async function getOpenRFIsByProject(projectId: string) {
  return prisma.rFI.findMany({
    where: { projectId, status: 'OPEN' },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function getOverdueRFIs(projectId?: string) {
  const where: Record<string, unknown> = {
    dueDate: { lt: new Date() },
    status: { in: ['OPEN', 'OVERDUE'] },
  };
  if (projectId) where.projectId = projectId;

  return prisma.rFI.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}
