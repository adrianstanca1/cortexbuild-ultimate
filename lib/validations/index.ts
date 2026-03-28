import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
  location: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email('Invalid client email').optional().or(z.literal('')),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  managerId: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional(),
  creatorId: z.string().min(1, 'Creator ID is required'),
});

export const rfiSchema = z.object({
  number: z.string().min(1, 'RFI number is required'),
  title: z.string().min(1, 'RFI title is required'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().optional(),
  status: z.string().default('OPEN'),
  projectId: z.string().min(1, 'Project ID is required'),
  createdById: z.string().min(1, 'Creator ID is required'),
  assignedToId: z.string().optional(),
  answeredById: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const submittalSchema = z.object({
  number: z.string().min(1, 'Submittal number is required'),
  title: z.string().min(1, 'Submittal title is required'),
  description: z.string().optional(),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1, 'Project ID is required'),
  submittedById: z.string().min(1, 'Submitter ID is required'),
  reviewedById: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const changeOrderSchema = z.object({
  number: z.string().min(1, 'Change order number is required'),
  title: z.string().min(1, 'Change order title is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative').default(0),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1, 'Project ID is required'),
  requestedById: z.string().min(1, 'Requester ID is required'),
  approvedById: z.string().optional(),
});

export const safetyIncidentSchema = z.object({
  title: z.string().min(1, 'Incident title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  status: z.string().default('OPEN'),
  projectId: z.string().min(1, 'Project ID is required'),
  reportedById: z.string().min(1, 'Reporter ID is required'),
  assignedToId: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type RFIInput = z.infer<typeof rfiSchema>;
export type SubmittalInput = z.infer<typeof submittalSchema>;
export type ChangeOrderInput = z.infer<typeof changeOrderSchema>;
export type SafetyIncidentInput = z.infer<typeof safetyIncidentSchema>;
