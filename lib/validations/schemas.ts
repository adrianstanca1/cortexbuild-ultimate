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

export const taskCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  taskId: z.string().min(1, 'Task ID is required'),
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

export const dailyReportSchema = z.object({
  date: z.string().datetime(),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  workforceCount: z.number().int().min(0).default(0),
  workPerformed: z.string().min(1, 'Work performed description is required'),
  notes: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  createdById: z.string().min(1, 'Creator ID is required'),
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

export const punchListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.string().default('OPEN'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional(),
});

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  type: z.string().optional(),
  status: z.string().default('AVAILABLE'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  projectId: z.string().optional(),
});

export const inspectionSchema = z.object({
  title: z.string().min(1, 'Inspection title is required'),
  description: z.string().optional(),
  status: z.string().default('SCHEDULED'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const meetingMinutesSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  date: z.string().datetime(),
  attendees: z.array(z.string()).default([]),
  notes: z.string().optional(),
  actionItems: z.array(z.string()).default([]),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const costItemSchema = z.object({
  code: z.string().min(1, 'Cost code is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0).default(0),
  category: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const budgetSchema = z.object({
  code: z.string().min(1, 'Cost code is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0).default(0),
  category: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  quantity: z.number().min(0).default(0),
  unit: z.string().optional(),
  status: z.string().default('ORDERED'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const milestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().default(false),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const timeEntrySchema = z.object({
  hours: z.number().min(0, 'Hours must be non-negative'),
  description: z.string().optional(),
  date: z.string().datetime(),
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const subcontractorSchema = z.object({
  name: z.string().min(1, 'Subcontractor name is required'),
  trade: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

export const teamMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  role: z.string().default('MEMBER'),
});

export const userSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER', 'VIEWER']).default('FIELD_WORKER'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
});

export const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['PLANS', 'DRAWINGS', 'PERMITS', 'PHOTOS', 'REPORTS', 'SPECIFICATIONS', 'CONTRACTS', 'RAMS', 'OTHER']).default('OTHER'),
  url: z.string().url('Invalid URL').min(1, 'URL is required'),
  size: z.number().int().positive().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  uploadedById: z.string().min(1, 'Uploader ID is required'),
});

export const toolboxTalkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().datetime(),
  presenterId: z.string().min(1, 'Presenter ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  attendees: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const toolCheckSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  status: z.string().default('PASSED'),
  inspectorId: z.string().min(1, 'Inspector ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const mewpCheckSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  operatorId: z.string().min(1, 'Operator ID is required'),
  supervisorId: z.string().optional(),
  status: z.string().default('PASSED'),
  projectId: z.string().min(1, 'Project ID is required'),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const riskAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  hazards: z.array(z.object({
    description: z.string(),
    likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })).default([]),
  controls: z.array(z.object({
    description: z.string(),
    type: z.string(),
    responsible: z.string().optional(),
  })).default([]),
  status: z.string().default('DRAFT'),
  projectId: z.string().min(1, 'Project ID is required'),
  createdById: z.string().min(1, 'Creator ID is required'),
  approvedById: z.string().optional(),
});

export const hotWorkPermitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().optional(),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1, 'Project ID is required'),
  requestedById: z.string().min(1, 'Requester ID is required'),
  approvedById: z.string().optional(),
});

export const liftingOperationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  liftType: z.string().optional(),
  weight: z.number().positive().optional(),
  status: z.string().default('PLANNED'),
  projectId: z.string().min(1, 'Project ID is required'),
  operatorId: z.string().min(1, 'Operator ID is required'),
  supervisorId: z.string().optional(),
  appointedPersonId: z.string().optional(),
});

export const confinedSpacePermitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().optional(),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1, 'Project ID is required'),
  requestedById: z.string().min(1, 'Requester ID is required'),
  approvedById: z.string().optional(),
});

export const permitSchema = z.object({
  type: z.string().min(1, 'Permit type is required'),
  number: z.string().min(1, 'Permit number is required'),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1, 'Project ID is required'),
  issuedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const drawingSchema = z.object({
  number: z.string().min(1, 'Drawing number is required'),
  title: z.string().min(1, 'Title is required'),
  revision: z.string().default('A'),
  status: z.string().default('CURRENT'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const defectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.string().default('OPEN'),
  location: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const progressClaimSchema = z.object({
  number: z.string().min(1, 'Claim number is required'),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().min(0),
  status: z.string().default('DRAFT'),
  projectId: z.string().min(1, 'Project ID is required'),
  claimedDate: z.string().datetime().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
export type RFIInput = z.infer<typeof rfiSchema>;
export type SubmittalInput = z.infer<typeof submittalSchema>;
export type ChangeOrderInput = z.infer<typeof changeOrderSchema>;
export type DailyReportInput = z.infer<typeof dailyReportSchema>;
export type SafetyIncidentInput = z.infer<typeof safetyIncidentSchema>;
export type PunchListInput = z.infer<typeof punchListSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type MeetingMinutesInput = z.infer<typeof meetingMinutesSchema>;
export type CostItemInput = z.infer<typeof costItemSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type SubcontractorInput = z.infer<typeof subcontractorSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ToolboxTalkInput = z.infer<typeof toolboxTalkSchema>;
export type ToolCheckInput = z.infer<typeof toolCheckSchema>;
export type MEWPCheckInput = z.infer<typeof mewpCheckSchema>;
export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;
export type HotWorkPermitInput = z.infer<typeof hotWorkPermitSchema>;
export type LiftingOperationInput = z.infer<typeof liftingOperationSchema>;
export type ConfinedSpacePermitInput = z.infer<typeof confinedSpacePermitSchema>;
export type PermitInput = z.infer<typeof permitSchema>;
export type DrawingInput = z.infer<typeof drawingSchema>;
export type DefectInput = z.infer<typeof defectSchema>;
export type ProgressClaimInput = z.infer<typeof progressClaimSchema>;
