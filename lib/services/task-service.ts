import { prisma } from '@/lib/db';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE' | 'BLOCKED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
}

export interface UpdateTaskInput extends Partial<Omit<CreateTaskInput, 'creatorId'>> {
  id: string;
}

export async function createTask(data: CreateTaskInput) {
  return prisma.task.create({
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, organizationId: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function listTasks(filters: TaskFilters = {}, page = 1, limit = 50) {
  const where: Record<string, unknown> = {};

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateTask({ id, ...data }: UpdateTaskInput) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.status === 'COMPLETE') {
    updateData.completedAt = new Date();
  }
  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

export async function assignTask(taskId: string, assigneeId: string | null) {
  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export async function addTaskComment(taskId: string, authorId: string, content: string) {
  return prisma.taskComment.create({
    data: { taskId, authorId, content },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

export async function getTasksByAssignee(userId: string, projectId?: string) {
  const where: Record<string, unknown> = { assigneeId: userId };
  if (projectId) where.projectId = projectId;

  return prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function getOverdueTasks(projectId?: string) {
  const where: Record<string, unknown> = {
    dueDate: { lt: new Date() },
    status: { not: 'COMPLETE' },
  };
  if (projectId) where.projectId = projectId;

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}
