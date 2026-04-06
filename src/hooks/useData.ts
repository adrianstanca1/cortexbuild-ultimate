/**
 * CortexBuild Ultimate — Universal Data Hooks
 * Uses React Query for caching, background refresh, and optimistic updates.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  projectsApi, invoicesApi, teamApi, safetyApi, rfisApi, changeOrdersApi,
  ramsApi, cisApi, equipmentApi, subcontractorsApi, timesheetsApi,
  documentsApi, tendersApi, dailyReportsApi, meetingsApi, materialsApi,
  punchListApi, inspectionsApi, contactsApi, riskRegisterApi, purchaseOrdersApi,
  projectImagesApi, projectTasksApi,
  variationsApi, defectsApi, specificationsApi, tempWorksApi, signageApi,
  wasteManagementApi, sustainabilityApi, trainingApi, certificationsApi,
  prequalificationApi, lettingsApi, measuringApi, valuationsApi,
  sitePermitsApi,
  reportTemplatesApi, auditApi, ReportTemplate,
  type Row,
} from '../services/api';
import type {
  SignRow, MeasurementRow, ValuationRow, LettingPackageRow, TenderRow,
  CertificationRow, PrequalificationRow, SustainabilityRow, WasteManagementRow,
  TrainingRow, SpecificationRow, InsightRow, AnalyticsDataRow, ActivityFeedRow,
} from '../types/domain';
import { eventBus } from '../lib/eventBus';


// ─── Generic hook factory ─────────────────────────────────────────────────────

function makeHooks<T extends Row = Row>(key: string, tableName: string, api: {
  getAll: () => Promise<Row[]>;
  create: (data: Row) => Promise<Row | null>;
  update: (id: string, data: Row) => Promise<Row | null>;
  delete: (id: string) => Promise<void>;
}) {
  function useList() {
    const qc = useQueryClient();
    useEffect(() => {
      const unsub = eventBus.on('ws:message', ({ type }) => {
        if (type === 'notification' || type === 'dashboard_update' || type === 'alert') {
          qc.invalidateQueries({ queryKey: [key] });
        }
      });
      return unsub;
    }, [qc]);
    return useQuery<T[]>({
      queryKey: [key],
      queryFn: () => api.getAll() as Promise<T[]>,
      staleTime: 60_000, // Increased from 30s to 60s for better caching
      gcTime: 5 * 60_000, // Keep unused data in cache for 5 minutes
      retry: 2, // Retry failed requests up to 2 times
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (data: Row) => api.create(data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success('Record created successfully');
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Row }) => api.update(id, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success('Record updated');
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success('Record deleted');
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}

// ─── Exported hooks ───────────────────────────────────────────────────────────

export const useProjects       = makeHooks('projects',        'projects',        projectsApi);
export const useInvoices       = makeHooks('invoices',        'invoices',        invoicesApi);
export const useTeam           = makeHooks('team',            'team_members',    teamApi);
export const useSafety         = makeHooks('safety',          'safety_incidents', safetyApi);
export const useRFIs           = makeHooks('rfis',            'rfis',            rfisApi);
export const useChangeOrders   = makeHooks('change-orders',   'change_orders',   changeOrdersApi);
export const useRAMS           = makeHooks('rams',            'rams',            ramsApi);
export const useCIS            = makeHooks('cis',             'cis_returns',     cisApi);
export const useEquipment      = makeHooks('equipment',       'equipment',       equipmentApi);
export const useSubcontractors = makeHooks('subcontractors',  'subcontractors',  subcontractorsApi);
export const useTimesheets     = makeHooks('timesheets',       'timesheets',      timesheetsApi);
export const useDocuments      = makeHooks('documents',       'documents',       documentsApi);
export const useTenders        = makeHooks('tenders',          'tenders',         tendersApi);
export const useDailyReports   = makeHooks('daily-reports',   'daily_reports',   dailyReportsApi);
export const useMeetings       = makeHooks('meetings',         'meetings',        meetingsApi);
export const useMaterials      = makeHooks('materials',        'materials',       materialsApi);
export const usePunchList      = makeHooks('punch-list',       'punch_list',      punchListApi);
export const useInspections    = makeHooks('inspections',      'inspections',     inspectionsApi);
export const useContacts       = makeHooks('contacts',          'contacts',        contactsApi);
export const useRiskRegister   = makeHooks('risk-register',    'risk_register',   riskRegisterApi);
export const useProcurement    = makeHooks('purchase-orders',  'purchase_orders', purchaseOrdersApi);
export const useProjectImages  = makeHooks('project-images',   'project_images',  projectImagesApi);
export const useProjectTasks    = makeHooks('project-tasks',    'project_tasks',   projectTasksApi);
export const useVariations      = makeHooks('variations',       'variations',      variationsApi);
export const useDefects         = makeHooks('defects',          'defects',         defectsApi);
export const useSpecifications  = makeHooks<SpecificationRow>('specifications',   'specifications',  specificationsApi);
export const useTempWorks       = makeHooks('temp-works',       'temp_works',      tempWorksApi);
export const useSignage         = makeHooks<SignRow>('signage',          'signage',         signageApi);
export const useWasteManagement = makeHooks<WasteManagementRow>('waste-management', 'waste_management', wasteManagementApi);
export const useSustainability  = makeHooks<SustainabilityRow>('sustainability',   'sustainability',  sustainabilityApi);
export const useTraining        = makeHooks<TrainingRow>('training',         'training',        trainingApi);
export const useCertifications  = makeHooks<CertificationRow>('certifications',   'certifications',  certificationsApi);
export const usePrequalification = makeHooks<PrequalificationRow>('prequalification', 'prequalification', prequalificationApi);
export const useLettings        = makeHooks<LettingPackageRow>('lettings',         'lettings',        lettingsApi);
export const useMeasuring       = makeHooks<MeasurementRow>('measuring',        'measuring',       measuringApi);
export const useValuations      = makeHooks<ValuationRow>('valuations',        'valuations',       valuationsApi);
export const useSitePermits     = makeHooks('site-permits',     'site-permits',    sitePermitsApi);
export const useReportTemplates  = makeHooks<ReportTemplate>('report-templates', 'report_templates', {
  getAll: () => reportTemplatesApi.getAll(),
  create: (data: Row) => reportTemplatesApi.create(data as Parameters<typeof reportTemplatesApi.create>[0]) as Promise<ReportTemplate | null>,
  update: (id, data) => reportTemplatesApi.update(id, data as Parameters<typeof reportTemplatesApi.update>[1]) as Promise<ReportTemplate | null>,
  delete: (id) => reportTemplatesApi.delete(id),
});

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportTemplatesApi.duplicate(id) as Promise<unknown>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Record duplicated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Custom hooks for non-standard APIs ──────────────────────────────────────

/**
 * Returns audit log hooks. Must be called inside a component.
 * @example const { useList, useStats, useInvalidate } = useAuditLog();
 */
export function useAuditLog() {
  const qc = useQueryClient();
  function useList() {
    return useQuery<AuditEntry[]>({
      queryKey: ['audit'],
      queryFn: () => auditApi.getAll({ limit: 500 }) as Promise<AuditEntry[]>,
      staleTime: 30_000,
    });
  }
  function useStats() {
    return useQuery<AuditStats>({
      queryKey: ['audit-stats'],
      queryFn: () => auditApi.getStats() as unknown as Promise<AuditStats>,
      staleTime: 60_000,
    });
  }
  function useInvalidate() {
    return () => {
      qc.invalidateQueries({ queryKey: ['audit'] });
      qc.invalidateQueries({ queryKey: ['audit-stats'] });
    };
  }
  return { useList, useStats, useInvalidate };
}

interface AuditEntry extends Row {
  id: number;
  user_id: string;
  action: string;
  table_name: string;
  record_id: number;
  changes: string;
  created_at: string;
  user?: { name: string; avatar?: string };
  ip_address?: string;
}

interface AuditStats extends Row {
  total_entries: number;
  today_entries: number;
  week_entries: number;
  month_entries: number;
  active_users: number;
  security_alerts: number;
}
