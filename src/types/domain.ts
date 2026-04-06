/**
 * Domain-level type definitions for construction modules.
 * These types provide type safety for CRUD operations, replacing `as any` casts.
 */

import type { Row } from '../services/api';

// ─── Signage ─────────────────────────────────────────────────────────────────

export interface SignRow extends Row {
  id: string;
  type: string;
  location: string;
  status: string;
  description?: string;
  install_date?: string;
  inspection_date?: string;
  next_inspection?: string;
  condition?: string;
  notes?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Measuring ───────────────────────────────────────────────────────────────

export interface MeasurementRow extends Row {
  id: string;
  description?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  status?: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValuationRow extends Row {
  id: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  value?: number;
  status?: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Lettings ────────────────────────────────────────────────────────────────

export interface LettingPackageRow extends Row {
  id: string;
  name: string;
  description?: string;
  status?: string;
  budget?: number;
  tender_deadline?: string;
  award_date?: string;
  contractor?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenderRow extends Row {
  id: string;
  package_id?: string;
  contractor?: string;
  amount?: number;
  submitted_date?: string;
  status?: string;
  created_at?: string;
}

// ─── Certifications ──────────────────────────────────────────────────────────

export interface CertificationRow extends Row {
  id: string;
  name: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
  status?: string;
  description?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Prequalification ────────────────────────────────────────────────────────

export interface PrequalificationRow extends Row {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: string;
  score?: number;
  trade?: string;
  expiry_date?: string;
  documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Sustainability ──────────────────────────────────────────────────────────

export interface SustainabilityRow extends Row {
  id: string;
  category?: string;
  metric?: string;
  value?: number;
  target?: number;
  unit?: string;
  status?: string;
  report_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Waste Management ────────────────────────────────────────────────────────

export interface WasteManagementRow extends Row {
  id: string;
  waste_type?: string;
  quantity?: number;
  unit?: string;
  disposal_method?: string;
  disposal_site?: string;
  date?: string;
  cost?: number;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Training ────────────────────────────────────────────────────────────────

export interface TrainingRow extends Row {
  id: string;
  title: string;
  description?: string;
  trainer?: string;
  date?: string;
  scheduled_date?: string;
  completed_date?: string;
  duration_hours?: number;
  attendees?: number;
  status?: string;
  type?: string;
  location?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Specifications ──────────────────────────────────────────────────────────

export interface SpecificationRow extends Row {
  id: string;
  title: string;
  description?: string;
  section?: string;
  status?: string;
  version?: string;
  approved_by?: string;
  approved_date?: string;
  document_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface InsightRow extends Row {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  project_id?: string;
  assigned_to?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Advanced Analytics ──────────────────────────────────────────────────────

export interface AnalyticsDataRow extends Row {
  id: string;
  metric: string;
  value: number;
  target?: number;
  period?: string;
  category?: string;
  trend?: string;
  created_at?: string;
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

export interface ActivityFeedRow extends Row {
  id: string;
  action: string;
  user_name?: string;
  user_role?: string;
  entity?: string;
  entity_id?: string;
  category?: string;
  timestamp?: string;
  details?: string;
  created_at?: string;
}
