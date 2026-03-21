/**
 * CortexBuild Ultimate — Universal Data Hooks
 * Uses React Query for caching, background refresh, and optimistic updates.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  projectsApi, invoicesApi, teamApi, safetyApi, rfisApi, changeOrdersApi,
  ramsApi, cisApi, equipmentApi, subcontractorsApi, timesheetsApi,
  documentsApi, tendersApi, dailyReportsApi, meetingsApi, materialsApi,
  punchListApi, inspectionsApi, contactsApi, riskRegisterApi, purchaseOrdersApi,
} from '../services/api';

type Row = Record<string, unknown>;

// ─── Generic hook factory ─────────────────────────────────────────────────────

function makeHooks<T>(key: string, api: {
  getAll: () => Promise<T[]>;
  create: (data: Row) => Promise<T | null>;
  update: (id: string, data: Row) => Promise<T | null>;
  delete: (id: string) => Promise<void>;
}) {
  function useList() {
    return useQuery<T[]>({
      queryKey: [key],
      queryFn: api.getAll,
      staleTime: 30_000, // 30 s
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

export const useProjects       = makeHooks('projects',       projectsApi);
export const useInvoices       = makeHooks('invoices',       invoicesApi);
export const useTeam           = makeHooks('team',           teamApi);
export const useSafety         = makeHooks('safety',         safetyApi);
export const useRFIs           = makeHooks('rfis',           rfisApi);
export const useChangeOrders   = makeHooks('change-orders',  changeOrdersApi);
export const useRAMS           = makeHooks('rams',           ramsApi);
export const useCIS            = makeHooks('cis',            cisApi);
export const useEquipment      = makeHooks('equipment',      equipmentApi);
export const useSubcontractors = makeHooks('subcontractors', subcontractorsApi);
export const useTimesheets     = makeHooks('timesheets',     timesheetsApi);
export const useDocuments      = makeHooks('documents',      documentsApi);
export const useTenders        = makeHooks('tenders',        tendersApi);
export const useDailyReports   = makeHooks('daily-reports',  dailyReportsApi);
export const useMeetings       = makeHooks('meetings',       meetingsApi);
export const useMaterials      = makeHooks('materials',      materialsApi);
export const usePunchList      = makeHooks('punch-list',     punchListApi);
export const useInspections    = makeHooks('inspections',    inspectionsApi);
export const useContacts       = makeHooks('contacts',       contactsApi);
export const useRiskRegister   = makeHooks('risk-register',  riskRegisterApi);
export const useProcurement    = makeHooks('purchase-orders', purchaseOrdersApi);
