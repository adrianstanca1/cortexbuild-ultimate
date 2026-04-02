export type UserRole = 'super_admin' | 'company_owner' | 'admin' | 'project_manager' | 'field_worker' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company: string;
  phone?: string;
}

export type Module =
  | 'dashboard'
  | 'projects'
  | 'invoicing'
  | 'accounting'
  | 'financial-reports'
  | 'procurement'
  | 'rams'
  | 'cis'
  | 'site-ops'
  | 'teams'
  | 'tenders'
  | 'analytics'
  | 'safety'
  | 'field-view'
  | 'crm'
  | 'documents'
  | 'timesheets'
  | 'plant'
  | 'subcontractors'
  | 'ai-assistant'
  | 'rfis'
  | 'change-orders'
  | 'punch-list'
  | 'inspections'
  | 'risk-register'
  | 'drawings'
  | 'meetings'
  | 'materials'
  | 'daily-reports'
  | 'marketplace'
  | 'settings'
  | 'insights'
  | 'notifications'
  | 'executive-reports'
  | 'predictive-analytics'
  | 'calendar'
  | 'search'
  | 'audit-log'
  | 'variations'
  | 'defects'
  | 'valuations'
  | 'specifications'
  | 'temp-works'
  | 'signage'
  | 'waste-management'
  | 'sustainability'
  | 'training'
  | 'certifications'
  | 'prequalification'
  | 'lettings'
  | 'measuring'
  | 'email-history'
  | 'permissions'
  | 'report-templates'
  | 'bim-viewer'
  | 'bim'
  | 'cost-management'
  | 'submittal-management'
  | 'dev-sandbox'
  | 'ai-vision'
  | 'my-desktop'
  | 'advanced-analytics'
  | 'project-calendar'
  | 'admin-dashboard';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  location: string;
  type: string;
  phase: string;
  workers: number;
  contractValue: number;
}

export interface Invoice {
  id: string;
  number: string;
  client: string;
  project: string;
  amount: number;
  vat: number;
  cisDeduction: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed';
  issueDate: string;
  dueDate: string;
  description: string;
}

export interface SafetyIncident {
  id: string;
  type: 'incident' | 'near-miss' | 'hazard' | 'inspection' | 'toolbox-talk' | 'mewp-check';
  title: string;
  severity: 'minor' | 'moderate' | 'serious' | 'fatal';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  project: string;
  reportedBy: string;
  date: string;
  description: string;
  rootCause?: string;
  correctiveActions?: string[];
}

export interface RFI {
  id: string;
  number: string;
  project: string;
  subject: string;
  question: string;
  priority: Priority;
  status: 'open' | 'answered' | 'closed' | 'pending';
  submittedBy: string;
  submittedDate: string;
  dueDate: string;
  assignedTo?: string;
  response?: string;
  aiSuggestion?: string;
}

export interface ChangeOrder {
  id: string;
  number: string;
  project: string;
  title: string;
  description: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  approvedDate?: string;
  reason: string;
  scheduleImpact: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  trade: string;
  email: string;
  phone: string;
  status: 'active' | 'on_site' | 'off_site' | 'leave' | 'inactive';
  cisStatus: 'gross' | 'net' | 'unverified';
  utrNumber?: string;
  niNumber?: string;
  projects: string[];
  hoursThisWeek: number;
  ramsCompleted: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  registration?: string;
  status: 'available' | 'on_site' | 'maintenance' | 'hired_out';
  location: string;
  nextService: string;
  dailyRate: number;
  hirePeriod?: string;
}

export interface Subcontractor {
  id: string;
  company: string;
  trade: string;
  contact: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  cisVerified: boolean;
  insuranceExpiry: string;
  ramsApproved: boolean;
  currentProject?: string;
  contractValue: number;
  rating: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  project: string;
  uploadedBy: string;
  uploadedDate: string;
  version: string;
  size: string;
  status: 'current' | 'superseded' | 'draft';
  category: 'PLANS' | 'DRAWINGS' | 'PERMITS' | 'RAMS' | 'CONTRACTS' | 'REPORTS' | 'SPECS' | 'PHOTOS';
}

export interface Timesheet {
  id: string;
  worker: string;
  project: string;
  week: string;
  regularHours: number;
  overtimeHours: number;
  dayworkHours: number;
  totalPay: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  cisDeduction: number;
}

export interface Meeting {
  id: string;
  title: string;
  project: string;
  date: string;
  time: string;
  location: string;
  attendees: string[];
  agenda: string[];
  minutes?: string;
  actionItems: { task: string; owner: string; due: string; status: string }[];
}

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier: string;
  project: string;
  status: 'ordered' | 'delivered' | 'on_site' | 'used';
  deliveryDate: string;
  poNumber: string;
}

export interface PunchListItem {
  id: string;
  project: string;
  location: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  status: 'open' | 'in_progress' | 'completed' | 'rejected';
  dueDate: string;
  photos: number;
  trade: string;
}

export interface Inspection {
  id: string;
  type: string;
  project: string;
  inspector: string;
  date: string;
  status: 'scheduled' | 'passed' | 'failed' | 'conditional';
  score?: number;
  items: { check: string; result: 'pass' | 'fail' | 'na'; notes?: string }[];
  nextInspection?: string;
}

export interface RAMSDocument {
  id: string;
  title: string;
  project: string;
  activity: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'expired';
  createdBy: string;
  approvedBy?: string;
  reviewDate: string;
  hazards: { hazard: string; risk: string; control: string; residualRisk: string }[];
  methodStatement: string[];
  ppe: string[];
  signatures: number;
  required: number;
}

export interface CISReturn {
  id: string;
  contractor: string;
  utr: string;
  period: string;
  grossPayment: number;
  materialsCost: number;
  labourNet: number;
  cisDeduction: number;
  status: 'pending' | 'submitted' | 'verified';
  verificationStatus: 'gross' | 'net' | 'unverified';
}

export interface TenderRequest {
  id: string;
  title: string;
  client: string;
  value: number;
  deadline: string;
  status: 'drafting' | 'submitted' | 'shortlisted' | 'won' | 'lost';
  probability: number;
  type: string;
  location: string;
  aiScore?: number;
  notes: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  type: 'client' | 'prospect' | 'supplier' | 'subcontractor' | 'consultant';
  value: number;
  lastContact: string;
  status: 'active' | 'dormant' | 'lost';
  projects: number;
}

export interface DailyReport {
  id: string;
  project: string;
  date: string;
  preparedBy: string;
  weather: string;
  temperature: string;
  workersOnSite: number;
  activities: string[];
  materials: string[];
  equipment: string[];
  issues: string[];
  photos: number;
  progress: number;
  aiSummary?: string;
}
