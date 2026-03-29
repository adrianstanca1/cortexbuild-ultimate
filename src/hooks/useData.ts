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
  prequalificationApi, lettingsApi, measuringApi,
} from '../services/api';
import { eventBus } from '../lib/eventBus';

type Row = Record<string, unknown>;


// ─── Generic hook factory ─────────────────────────────────────────────────────

function makeHooks<T>(key: string, tableName: string, api: {
  getAll: () => Promise<T[]>;
  create: (data: Row) => Promise<T | null>;
  update: (id: string, data: Row) => Promise<T | null>;
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
      queryFn: api.getAll,
      staleTime: 30_000,
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
export const useSpecifications  = makeHooks('specifications',   'specifications',  specificationsApi);
export const useTempWorks       = makeHooks('temp-works',       'temp_works',      tempWorksApi);
export const useSignage         = makeHooks('signage',          'signage',         signageApi);
export const useWasteManagement = makeHooks('waste-management', 'waste_management', wasteManagementApi);
export const useSustainability  = makeHooks('sustainability',   'sustainability',  sustainabilityApi);
export const useTraining        = makeHooks('training',         'training',        trainingApi);
export const useCertifications  = makeHooks('certifications',   'certifications',  certificationsApi);
export const usePrequalification = makeHooks('prequalification', 'prequalification', prequalificationApi);
export const useLettings        = makeHooks('lettings',         'lettings',        lettingsApi);
export const useMeasuring       = makeHooks('measuring',        'measuring',       measuringApi);
