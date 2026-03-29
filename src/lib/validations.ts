import { z } from 'zod';

// Core construction entity schemas for frontend validation
export const rfiSchema = z.object({
  number: z.string().min(1, 'RFI number is required'),
  subject: z.string().min(1, 'Subject is required'),
  question: z.string().min(1, 'Question is required'),
  context: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'answered', 'closed', 'pending-info']).default('open'),
  dueDate: z.string().datetime().optional(),
});

export const changeOrderSchema = z.object({
  number: z.string().min(1, 'Change order number is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  proposedChangeAmount: z.number().min(0, 'Amount must be non-negative'),
  status: z.enum(['pending', 'approved', 'rejected', 'negotiation']).default('pending'),
  category: z.enum(['scope', 'design', 'conditions', 'owner', 'regulatory', 'other']).default('scope'),
  justification: z.string().min(1, 'Justification is required'),
  scheduleImpactDays: z.number().int().optional(),
  budgetImpactAmount: z.number().optional(),
});

export const dailyReportSchema = z.object({
  date: z.string().datetime(),
  projectId: z.string().min(1, 'Project ID is required'),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  humidity: z.string().optional(),
  workforce: z.array(z.object({
    trade: z.string().min(1, 'Trade is required'),
    count: z.number().int().min(0, 'Count must be non-negative'),
    hours: z.number().min(0, 'Hours must be non-negative'),
  })).default([]),
  equipment: z.array(z.object({
    name: z.string().min(1, 'Equipment name is required'),
    hours: z.number().min(0, 'Hours must be non-negative'),
    status: z.enum(['operational', 'maintenance', 'down']).default('operational'),
  })).default([]),
  materials: z.array(z.object({
    name: z.string().min(1, 'Material name is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    unit: z.string().min(1, 'Unit is required'),
    delivered: z.boolean().default(false),
  })).default([]),
  progress: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    percentComplete: z.number().min(0).max(100).optional(),
  })).default([]),
  issues: z.array(z.object({
    type: z.enum(['delay', 'safety', 'quality', 'design', 'supply', 'other']),
    description: z.string().min(1, 'Description is required'),
    impact: z.enum(['low', 'medium', 'high']),
  })).default([]),
  notes: z.string().optional(),
});

export const safetyReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['incident', 'near-miss', 'inspection', 'audit', 'toolbox-talk', 'hazard-id']),
  date: z.string().datetime(),
  projectId: z.string().min(1, 'Project ID is required'),
  location: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'serious', 'fatal', 'critical']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open'),
  witnesses: z.array(z.string()).optional(),
  estimatedCost: z.number().min(0).optional(),
  scheduleImpact: z.number().min(0).optional(),
});

// Type exports for frontend use
export type RFIInput = z.infer<typeof rfiSchema>;
export type ChangeOrderInput = z.infer<typeof changeOrderSchema>;
export type DailyReportInput = z.infer<typeof dailyReportSchema>;
export type SafetyReportInput = z.infer<typeof safetyReportSchema>;
